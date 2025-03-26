import { FRANKLIN_PERSONA } from '../../utils/prompts';
import axios from 'axios';
import { emitProcessUpdate } from './socketio';
import { setRequest, updateRequest, deleteRequest, fakeDemoMode, simulateProcessing } from '../../utils/server-state';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Create a unique ID for this request
    const requestId = Date.now().toString();
    
    // Process the request in the background
    if (fakeDemoMode) {
      // Use fake demo mode for development/testing
      simulateProcessing(requestId, question);
    } else {
      // Use real APIs in production
      processQuestionAsync(requestId, question);
    }
    
    // Immediately return a response with the request ID
    return res.status(202).json({ 
      requestId,
      status: 'processing',
      message: 'Your question is being processed',
      statusUrl: `/api/question/${requestId}/status`,
      resultUrl: `/api/question/${requestId}/result`
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'An error occurred while processing your request',
      details: error.message 
    });
  }
}

// Since Next.js API routes are serverless, in a real app you would:
// 1. Use a queue system (like AWS SQS, RabbitMQ, etc.)
// 2. Store request state in a database (MongoDB, PostgreSQL, etc.)
// 3. Use WebSockets or Server-Sent Events for real-time updates
async function processQuestionAsync(requestId, question) {
  try {
    // Initialize request state
    setRequest(requestId, {
      status: 'processing',
      stage: 'thinking',
      progress: 0,
      startTime: Date.now(),
      question,
      result: null,
      error: null
    });

    // Step 1: Get response from GPT-4
    updateRequestStatus(requestId, 'thinking', 'Generating Franklin\'s response', 10);
    const gptResponse = await getGptResponse(question);
    updateRequestStatus(requestId, 'animating', 'Animating Benjamin Franklin', 50);
    
    // Step 2: Generate talking head video with D-ID directly using the text
    // This skips the ElevenLabs step and storage requirement
    const videoUrl = await generateVideoFromText(gptResponse);
    
    // Store the completed result
    updateRequest(requestId, {
      status: 'completed',
      stage: 'completed',
      progress: 100,
      endTime: Date.now(),
      result: {
        answer: gptResponse,
        videoUrl
      }
    });

    // Clean up after 1 hour (in a real app, this would be stored in a database)
    setTimeout(() => {
      deleteRequest(requestId);
    }, 60 * 60 * 1000);
  } catch (error) {
    console.error('Processing Error:', error);
    
    // Store the error
    updateRequest(requestId, {
      status: 'failed',
      error: {
        message: error.message,
        details: error.stack
      },
      endTime: Date.now()
    });
  }
}

function updateRequestStatus(requestId, stage, message, progress) {
  const updatedRequest = updateRequest(requestId, {
    stage,
    message,
    progress
  });
  
  if (updatedRequest) {
    // Emit WebSocket event for real-time updates
    emitProcessUpdate(requestId, {
      requestId,
      stage,
      message,
      progress,
      status: updatedRequest.status
    });
    
    console.log(`Request ${requestId}: ${stage} - ${message} (${progress}%)`);
  }
}

async function getGptResponse(question) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: FRANKLIN_PERSONA },
          { role: 'user', content: question }
        ],
        max_tokens: 300,
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('GPT API Error:', error.response?.data || error.message);
    throw new Error('Failed to generate AI response');
  }
}

async function generateVideoFromText(text) {
  try {
    // Send the text directly to D-ID
    const response = await axios.post(
      'https://api.d-id.com/talks',
      {
        script: {
          type: 'text',
          input: text,
          provider: {
            type: 'microsoft',
            voice_id: 'en-US-GuyNeural', // You can replace with another voice if preferred
            voice_config: {
              style: 'serious'
            }
          }
        },
        source_url: process.env.BEN_FRANKLIN_IMAGE_URL,
        // Optionally customize the appearance
        config: {
          stitch: true
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${process.env.DID_API_KEY}`,
        },
      }
    );

    // D-ID creates the video asynchronously, so we need to poll for completion
    const talkId = response.data.id;
    return await waitForVideoCompletion(talkId);
  } catch (error) {
    console.error('D-ID API Error:', error.response?.data || error.message);
    throw new Error('Failed to generate video');
  }
}

async function waitForVideoCompletion(talkId) {
  // Poll the D-ID API until the video is ready
  let attempts = 0;
  const maxAttempts = 30; // 30 attempts * 2 second delay = max 1 minute wait

  while (attempts < maxAttempts) {
    try {
      const response = await axios.get(
        `https://api.d-id.com/talks/${talkId}`,
        {
          headers: {
            'Authorization': `Basic ${process.env.DID_API_KEY}`,
          },
        }
      );

      const status = response.data.status;

      if (status === 'done') {
        return response.data.result_url;
      } else if (status === 'failed') {
        throw new Error('D-ID video generation failed');
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    } catch (error) {
      console.error('Error polling D-ID API:', error);
      throw error;
    }
  }

  throw new Error('Video generation timed out');
}