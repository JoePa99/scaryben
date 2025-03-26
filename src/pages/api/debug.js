// Debug endpoint to test APIs individually

import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';
import { fakeDemoMode } from '../../utils/server-state';

// Configure Cloudinary if credentials are available
if (process.env.CLOUDINARY_CLOUD_NAME && 
    process.env.CLOUDINARY_API_KEY && 
    process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const results = {
    environment: {},
    tests: {},
    serverInfo: {
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV || 'not set',
      fakeDemo: fakeDemoMode ? 'enabled' : 'disabled'
    }
  };

  // 1. Test environment variables (safely)
  try {
    const safeSubstring = (str) => {
      if (!str) return 'Not set';
      return `Set (first few chars: ${str.substring(0, 4)}...)`;
    };

    results.environment = {
      OPENAI_API_KEY: safeSubstring(process.env.OPENAI_API_KEY),
      ELEVENLABS_API_KEY: safeSubstring(process.env.ELEVENLABS_API_KEY),
      ELEVENLABS_VOICE_ID: process.env.ELEVENLABS_VOICE_ID || 'Not set',
      DID_API_KEY: safeSubstring(process.env.DID_API_KEY),
      BEN_FRANKLIN_IMAGE_URL: process.env.BEN_FRANKLIN_IMAGE_URL || 'Not set',
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || 'Not set',
      CLOUDINARY_API_KEY: safeSubstring(process.env.CLOUDINARY_API_KEY),
      CLOUDINARY_API_SECRET: safeSubstring(process.env.CLOUDINARY_API_SECRET),
      FAKE_DEMO_MODE: process.env.FAKE_DEMO_MODE || 'Not set'
    };
  } catch (error) {
    results.environment.error = error.message;
  }

  // Skip API tests if in fake demo mode
  if (fakeDemoMode) {
    results.demoMode = {
      message: "API tests skipped - fake demo mode is enabled"
    };
    
    return res.status(200).json({
      timestamp: new Date().toISOString(),
      results
    });
  }

  // 2. Test OpenAI API (only if API key is set)
  if (process.env.OPENAI_API_KEY) {
    try {
      const openaiResponse = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'Say hello in one word.' }
          ],
          max_tokens: 10,
          temperature: 0.7,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        }
      );
      
      results.tests.openai = {
        success: true,
        response: openaiResponse.data.choices[0].message.content
      };
    } catch (error) {
      results.tests.openai = {
        success: false,
        error: error.message,
        details: error.response?.data || 'No additional details'
      };
    }
  } else {
    results.tests.openai = {
      success: false,
      error: "OpenAI API key not configured",
      details: "Environment variable OPENAI_API_KEY is not set"
    };
  }

  // 3. Test ElevenLabs API (only if API key is set)
  if (process.env.ELEVENLABS_API_KEY) {
    try {
      const elevenLabsResponse = await axios.get(
        'https://api.elevenlabs.io/v1/voices',
        {
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
          },
        }
      );
      
      // Check if our voice ID exists
      const voiceExists = process.env.ELEVENLABS_VOICE_ID && 
                        elevenLabsResponse.data.voices.some(
                          voice => voice.voice_id === process.env.ELEVENLABS_VOICE_ID
                        );
      
      results.tests.elevenlabs = {
        success: true,
        voiceCount: elevenLabsResponse.data.voices.length,
        ourVoiceExists: voiceExists,
        voiceIdConfigured: !!process.env.ELEVENLABS_VOICE_ID
      };
    } catch (error) {
      results.tests.elevenlabs = {
        success: false,
        error: error.message,
        details: error.response?.data || 'No additional details'
      };
    }
  } else {
    results.tests.elevenlabs = {
      success: false,
      error: "ElevenLabs API key not configured",
      details: "Environment variable ELEVENLABS_API_KEY is not set"
    };
  }

  // 4. Test D-ID API (only if API key is set)
  if (process.env.DID_API_KEY) {
    try {
      const didResponse = await axios.get(
        'https://api.d-id.com/talks',
        {
          headers: {
            'Authorization': `Basic ${process.env.DID_API_KEY}`,
          },
        }
      );
      
      results.tests.did = {
        success: true,
        recentTalksCount: didResponse.data.talks?.length || 0,
        imageUrlConfigured: !!process.env.BEN_FRANKLIN_IMAGE_URL
      };
    } catch (error) {
      results.tests.did = {
        success: false,
        error: error.message,
        details: error.response?.data || 'No additional details'
      };
    }
  } else {
    results.tests.did = {
      success: false,
      error: "D-ID API key not configured",
      details: "Environment variable DID_API_KEY is not set"
    };
  }

  // 5. Test Cloudinary API (only if required config is set)
  if (process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET) {
    try {
      const resources = await new Promise((resolve, reject) => {
        cloudinary.api.resources(
          { type: 'upload', prefix: 'franklin-audio', max_results: 1 },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
      });
      
      results.tests.cloudinary = {
        success: true,
        resourceCount: resources.resources?.length || 0
      };
    } catch (error) {
      results.tests.cloudinary = {
        success: false,
        error: error.message,
        details: error.response?.data || 'No additional details'
      };
    }
  } else {
    results.tests.cloudinary = {
      success: false,
      error: "Cloudinary configuration incomplete",
      details: "One or more Cloudinary environment variables are not set"
    };
  }

  // 6. Test internal API endpoints
  try {
    // Make a request to the status API with a dummy ID
    const testRequestId = "test-" + Date.now();
    const statusUrl = `/api/question/${testRequestId}/status`;
    const fullStatusUrl = `${req.headers.host.startsWith('localhost') ? 'http' : 'https'}://${req.headers.host}${statusUrl}`;
    
    results.tests.internalEndpoints = {
      statusEndpoint: {
        url: statusUrl,
        expectNotFound: true,
        message: "Status endpoint accessible (will return 404 for test ID which is expected)"
      },
      socketEndpoint: {
        url: "/api/socketio",
        message: "Socket.io endpoint configured"
      }
    };
  } catch (error) {
    results.tests.internalEndpoints = {
      error: error.message,
      details: "Error checking internal endpoints"
    };
  }

  // Return all results
  return res.status(200).json({
    timestamp: new Date().toISOString(),
    results
  });
}