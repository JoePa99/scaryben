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
    
    console.log(`[SERVER] New question received. Creating request ${requestId}`);
    
    // Check for required environment variables before proceeding
    const requiredEnvVars = [
      'OPENAI_API_KEY',
      'ELEVENLABS_API_KEY',
      'ELEVENLABS_VOICE_ID',
      'DID_API_KEY',
      'BEN_FRANKLIN_IMAGE_URL',
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET'
    ];
    
    // If we're not in demo mode, verify all required env vars are set
    if (!fakeDemoMode) {
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
        
        // Initialize request with error status
        setRequest(requestId, {
          status: 'failed',
          stage: 'setup',
          progress: 0,
          startTime: Date.now(),
          endTime: Date.now(),
          question,
          result: null,
          error: {
            message: `Missing environment variables: ${missingVars.join(', ')}`,
            details: 'Configuration error'
          }
        });
        
        return res.status(202).json({ 
          requestId,
          status: 'processing',
          message: 'Your question is being processed',
          statusUrl: `/api/question/${requestId}/status`,
          resultUrl: `/api/question/${requestId}/result`
        });
      }
    }
    
    // Log demo mode status
    console.log(`Processing question with fakeDemoMode: ${fakeDemoMode ? 'enabled' : 'disabled'}`);
    
    // Process the request in the background
    if (fakeDemoMode) {
      // Use fake demo mode with reliable sample videos
      console.log('Using demo mode with sample videos');
      simulateProcessing(requestId, question);
    } else {
      // Use real APIs in production
      console.log('Using real APIs (OpenAI, ElevenLabs, D-ID)');
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
      message: error.message || 'Unknown error',
      stack: error.stack,
      responseData: error.response?.data,
      responseStatus: error.response?.status
    };
    
    console.error('API Error:', JSON.stringify(errorDetail, null, 2));
    
    // Return a more descriptive error
    return res.status(500).json({ 
      error: 'An error occurred while processing your request',
      details: error.message || 'Unknown error',
      errorData: errorDetail
    });
  }
}

// Since Next.js API routes are serverless, in a real app you would:
// 1. Use a queue system (like AWS SQS, RabbitMQ, etc.)
// 2. Store request state in a database (MongoDB, PostgreSQL, etc.)
// 3. Use WebSockets or Server-Sent Events for real-time updates
async function processQuestionAsync(requestId, question) {
  console.log(`[SERVER] Starting processing for request ${requestId}`);
  
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

  try {
    console.log(`[SERVER] Request ${requestId} initialized in state`);
    
    // Verify the request was stored properly
    const storedRequest = getRequest(requestId);
    if (!storedRequest) {
      console.error(`[SERVER] CRITICAL ERROR: Request ${requestId} not properly stored in state!`);
      // Try to store it again
      setRequest(requestId, {
        status: 'processing',
        stage: 'thinking',
        progress: 0,
        startTime: Date.now(),
        question,
        result: null,
        error: null
      });
    } else {
      console.log(`[SERVER] Request ${requestId} confirmed in state`);
    }

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
    console.log(`[SERVER] Request ${requestId} completed successfully`);
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

    // Verify completion was stored
    const completedRequest = getRequest(requestId);
    if (!completedRequest || completedRequest.status !== 'completed') {
      console.error(`[SERVER] CRITICAL ERROR: Completion status for ${requestId} not properly stored!`);
    }

    // Clean up after 2 hours (in a real app, this would be stored in a database)
    setTimeout(() => {
      console.log(`[SERVER] Cleaning up request ${requestId} after timeout`);
      deleteRequest(requestId);
    }, 2 * 60 * 60 * 1000);
  } catch (error) {
    const errorDetail = {
      message: error.message,
      stack: error.stack,
      responseData: error.response?.data,
      responseStatus: error.response?.status,
      code: error.code
    };
    
    console.error(`[SERVER] Processing Error for ${requestId}:`, JSON.stringify(errorDetail, null, 2));
    
    // Store the error
    updateRequest(requestId, {
      status: 'failed',
      error: errorDetail,
      endTime: Date.now()
    });
    
    // Verify error was stored
    const failedRequest = getRequest(requestId);
    if (!failedRequest || failedRequest.status !== 'failed') {
      console.error(`[SERVER] CRITICAL ERROR: Failure status for ${requestId} not properly stored!`);
    }
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
    
    // Validate ElevenLabs configuration
    if (!process.env.ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }
    
    if (!process.env.ELEVENLABS_VOICE_ID) {
      throw new Error('ELEVENLABS_VOICE_ID is not configured');
    }
    
    // Step 1: Generate speech with ElevenLabs
    console.log(`Using ElevenLabs voice ID: ${process.env.ELEVENLABS_VOICE_ID}`);
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
        responseType: 'arraybuffer',
        timeout: 120000 // 2 minute timeout
      }
    );
    
    // Step 2: Upload the audio file to Cloudinary
    console.log('Uploading audio to Cloudinary...');
    
    // Validate Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary configuration is incomplete');
    }
    
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

// Helper function to validate and possibly fix an image URL
function getValidImageUrl(url) {
  if (!url) {
    // Default fallback image if none provided
    return 'https://i.postimg.cc/j22xfNH6/benjamin-franklin.jpg';
  }
  
  // If it's already a direct image URL, return it
  if (url.match(/\.(jpeg|jpg|gif|png)(\?.*)?$/i)) {
    console.log('Using direct image URL:', url);
    return url;
  }
  
  // Handle different image hosting services
  
  // Handle postimg.cc
  if (url.includes('postimg.cc/') && !url.endsWith('.jpg') && !url.endsWith('.png')) {
    // Try to convert from page URL to direct image URL
    // Example: https://postimg.cc/CRTKLmTZ -> https://i.postimg.cc/CRTKLmTZ/benjamin-franklin.jpg
    const id = url.split('/').pop();
    if (id) {
      const directUrl = `https://i.postimg.cc/${id}/benjamin-franklin.jpg`;
      console.log('Converting postimg.cc URL to direct image URL:', directUrl);
      return directUrl;
    }
  }
  
  // Handle imgur
  if (url.includes('imgur.com/') && !url.endsWith('.jpg') && !url.endsWith('.png')) {
    // Try to convert from page URL to direct image URL
    // Example: https://imgur.com/abcd123 -> https://i.imgur.com/abcd123.jpg
    const id = url.split('/').pop();
    if (id) {
      const directUrl = `https://i.imgur.com/${id}.jpg`;
      console.log('Converting imgur URL to direct image URL:', directUrl);
      return directUrl;
    }
  }
  
  // Return original URL with warning
  console.warn('Using potentially invalid image URL:', url);
  return url;
}

async function generateVideo(audioUrl) {
  try {
    console.log('Generating D-ID video with audio URL:', audioUrl);
    
    // Validate D-ID configuration
    if (!process.env.DID_API_KEY) {
      throw new Error('DID_API_KEY is not configured');
    }
    
    if (!process.env.BEN_FRANKLIN_IMAGE_URL) {
      throw new Error('BEN_FRANKLIN_IMAGE_URL is not configured');
    }
    
    // Validate and fix the image URL if needed
    const imageUrl = getValidImageUrl(process.env.BEN_FRANKLIN_IMAGE_URL);
    console.log('Using image URL for D-ID:', imageUrl);
    
    // Validate the image URL is accessible
    try {
      const imageCheckResponse = await axios.head(imageUrl);
      if (imageCheckResponse.status !== 200) {
        console.warn(`Image URL returned status ${imageCheckResponse.status}`);
      }
    } catch (imageError) {
      console.error('Image URL check failed:', imageError.message);
      throw new Error(`The image URL is not accessible: ${imageError.message}`);
    }
    
    // Send the audio URL to D-ID
    const response = await axios.post(
      'https://api.d-id.com/talks',
      {
        script: {
          type: 'audio',
          audio_url: audioUrl,
        },
        source_url: imageUrl,
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
        timeout: 300000 // 5 minute timeout
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
  const maxAttempts = 150; // 150 attempts * 2 second delay = max 5 minutes wait
  console.log(`Waiting for D-ID video to complete, talk ID: ${talkId}`);

  while (attempts < maxAttempts) {
    try {
      console.log(`Polling D-ID API for talk status, attempt ${attempts + 1}/${maxAttempts}`);
      const response = await axios.get(
        `https://api.d-id.com/talks/${talkId}`,
        {
          headers: {
            'Authorization': `Basic ${process.env.DID_API_KEY}`,
          },
          timeout: 30000 // 30 second timeout per poll request
        }
      );

      const status = response.data.status;
      console.log(`D-ID talk status: ${status}`);

      if (status === 'done') {
        const resultUrl = response.data.result_url;
        console.log(`D-ID video complete, result URL: ${resultUrl}`);
        return resultUrl;
      } else if (status === 'failed') {
        console.error('D-ID video generation failed:', response.data);
        throw new Error(`D-ID video generation failed: ${JSON.stringify(response.data)}`);
      } else {
        console.log(`D-ID video status: ${status}, waiting...`);
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

  console.error('D-ID video generation timed out after maximum attempts');
  throw new Error('Video generation timed out');
}