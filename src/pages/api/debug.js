// Debug endpoint to test APIs individually

import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const results = {
    environment: {},
    tests: {}
  };

  // 1. Test environment variables
  try {
    results.environment = {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Set (first few chars: ' + process.env.OPENAI_API_KEY.substring(0, 4) + '...)' : 'Not set',
      ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY ? 'Set (first few chars: ' + process.env.ELEVENLABS_API_KEY.substring(0, 4) + '...)' : 'Not set',
      ELEVENLABS_VOICE_ID: process.env.ELEVENLABS_VOICE_ID || 'Not set',
      DID_API_KEY: process.env.DID_API_KEY ? 'Set (first few chars: ' + process.env.DID_API_KEY.substring(0, 4) + '...)' : 'Not set',
      BEN_FRANKLIN_IMAGE_URL: process.env.BEN_FRANKLIN_IMAGE_URL || 'Not set',
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || 'Not set',
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? 'Set (first few chars: ' + process.env.CLOUDINARY_API_KEY.substring(0, 4) + '...)' : 'Not set',
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? 'Set (first few chars: ' + process.env.CLOUDINARY_API_SECRET.substring(0, 4) + '...)' : 'Not set',
      FAKE_DEMO_MODE: process.env.FAKE_DEMO_MODE || 'Not set'
    };
  } catch (error) {
    results.environment.error = error.message;
  }

  // 2. Test OpenAI API
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

  // 3. Test ElevenLabs API
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
    const voiceExists = elevenLabsResponse.data.voices.some(
      voice => voice.voice_id === process.env.ELEVENLABS_VOICE_ID
    );
    
    results.tests.elevenlabs = {
      success: true,
      voiceCount: elevenLabsResponse.data.voices.length,
      ourVoiceExists: voiceExists
    };
  } catch (error) {
    results.tests.elevenlabs = {
      success: false,
      error: error.message,
      details: error.response?.data || 'No additional details'
    };
  }

  // 4. Test D-ID API
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
      recentTalksCount: didResponse.data.talks?.length || 0
    };
  } catch (error) {
    results.tests.did = {
      success: false,
      error: error.message,
      details: error.response?.data || 'No additional details'
    };
  }

  // 5. Test Cloudinary API
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

  // Return all results
  return res.status(200).json({
    timestamp: new Date().toISOString(),
    results
  });
}