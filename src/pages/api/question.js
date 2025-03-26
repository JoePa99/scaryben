import { FRANKLIN_PERSONA } from '../../utils/prompts';
import axios from 'axios';
import { emitProcessUpdate } from './socketio';
import { setRequest, updateRequest, deleteRequest, fakeDemoMode, simulateProcessing } from '../../utils/server-state';
import { v2 as cloudinary } from 'cloudinary';
import FormData from 'form-data';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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
    const errorDetail = {
      message: error.message,
      stack: error.stack,
      responseData: error.response?.data,
      responseStatus: error.response?.status
    };
    
    console.error('API Error:', JSON.stringify(errorDetail, null, 2));
    
    return res.status(500).json({ 
      error: 'An error occurred while processing your request',
      details: error.message,
      errorData: errorDetail
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
    updateRequestStatus(requestId, 'speaking', 'Converting text to speech with ElevenLabs', 30);
    
    // Step 2: Generate speech with ElevenLabs and upload to Cloudinary
    const audioUrl = await generateAndUploadSpeech(gptResponse);
    updateRequestStatus(requestId, 'animating', 'Animating Benjamin Franklin', 60);
    
    // Step 3: Generate talking head video with D-ID using the audio URL
    const videoUrl = await generateVideo(audioUrl);
    
    // Store the completed result
    updateRequest(requestId, {
      status: 'completed',
      stage: 'completed',
      progress: 100,
      endTime: Date.now(),
      result: {
        answer: gptResponse,
        audioUrl,
        videoUrl
      }
    });

    // Clean up after 1 hour (in a real app, this would be stored in a database)
    setTimeout(() => {
      deleteRequest(requestId);
    }, 60 * 60 * 1000);
  } catch (error) {
    const errorDetail = {
      message: error.message,
      stack: error.stack,
      responseData: error.response?.data,
      responseStatus: error.response?.status,
      code: error.code
    };
    
    console.error('Processing Error:', JSON.stringify(errorDetail, null, 2));
    
    // Store the error
    updateRequest(requestId, {
      status: 'failed',
      error: errorDetail,
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
    console.log('Getting GPT-4 response...');
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
    const errorDetail = {
      message: error.message,
      code: error.code,
      responseData: error.response?.data,
      responseStatus: error.response?.status
    };
    
    console.error('GPT API Error:', JSON.stringify(errorDetail, null, 2));
    
    throw new Error(`Failed to generate AI response: ${error.message}`);
  }
}

async function generateAndUploadSpeech(text) {
  try {
    console.log('Generating ElevenLabs speech...');
    
    // Step 1: Generate speech with ElevenLabs
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
      {
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
        },
        responseType: 'arraybuffer'
      }
    );
    
    // Step 2: Upload the audio file to Cloudinary
    console.log('Uploading audio to Cloudinary...');
    
    const audioBuffer = Buffer.from(response.data);
    const audioUrl = await uploadToCloudinary(audioBuffer);
    
    console.log('Audio uploaded:', audioUrl);
    return audioUrl;
  } catch (error) {
    const errorDetail = {
      message: error.message,
      code: error.code,
      responseData: error.response?.data,
      responseStatus: error.response?.status
    };
    
    console.error('ElevenLabs or Cloudinary Error:', JSON.stringify(errorDetail, null, 2));
    
    throw new Error(`Failed to generate or upload speech: ${error.message}`);
  }
}

// Function to upload buffer to Cloudinary
function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const timestamp = new Date().getTime();
    const filename = `franklin-audio-${timestamp}.mp3`;
    
    // Create upload stream
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        public_id: `franklin-audio/${filename}`,
        format: 'mp3'
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );
    
    // Write buffer to stream
    uploadStream.write(buffer);
    uploadStream.end();
  });
}

async function generateVideo(audioUrl) {
  try {
    console.log('Generating D-ID video with audio URL:', audioUrl);
    // Send the audio URL to D-ID
    const response = await axios.post(
      'https://api.d-id.com/talks',
      {
        script: {
          type: 'audio',
          audio_url: audioUrl,
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
    const errorDetail = {
      message: error.message,
      code: error.code,
      responseData: error.response?.data,
      responseStatus: error.response?.status
    };
    
    console.error('D-ID API Error:', JSON.stringify(errorDetail, null, 2));
    
    throw new Error(`Failed to generate video: ${error.message}`);
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
      const errorDetail = {
        message: error.message,
        code: error.code,
        responseData: error.response?.data,
        responseStatus: error.response?.status
      };
      
      console.error('Error polling D-ID API:', JSON.stringify(errorDetail, null, 2));
      
      throw new Error(`D-ID polling error: ${error.message}`);
    }
  }

  throw new Error('Video generation timed out');
}