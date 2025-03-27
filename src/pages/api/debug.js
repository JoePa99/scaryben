// Debug endpoint to test APIs 
// Simplified for Vercel deployment compatibility

import { fakeDemoMode } from '../../utils/server-state';
import supabase from '../../utils/supabase-client';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      node_env: process.env.NODE_ENV || 'not set',
      vercel: !!process.env.VERCEL,
      vercel_region: process.env.VERCEL_REGION || 'unknown'
    },
    config: {
      demoMode: process.env.FAKE_DEMO_MODE === 'true' ? 'enabled' : 'disabled',
      supabaseConnected: false
    },
    apis: {},
    env_vars: {}
  };

  // Check environment variables (safely - no values, just existence)
  const requiredApiVars = [
    'OPENAI_API_KEY',
    'ELEVENLABS_API_KEY',
    'ELEVENLABS_VOICE_ID',
    'DID_API_KEY',
    'BEN_FRANKLIN_IMAGE_URL',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
  ];

  const dbVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];

  // Check API env vars
  requiredApiVars.forEach(varName => {
    results.env_vars[varName] = !!process.env[varName];
  });

  // Check DB env vars
  dbVars.forEach(varName => {
    results.env_vars[varName] = !!process.env[varName]; 
  });

  // Check Supabase connection
  try {
    const { data, error } = await supabase.from('franklin_requests')
      .select('count(*)')
      .limit(1);
      
    if (error) {
      results.config.supabaseError = error.message;
    } else {
      results.config.supabaseConnected = true;
    }
  } catch (error) {
    results.config.supabaseError = error.message;
  }

  // Check socket.io endpoints
  results.socket = {
    mainEndpoint: '/api/socketio',
    fallbackEndpoint: '/api/socketio-fix',
    vercelEndpoint: '/api/socketio-vercel'
  };

  // Check if we're in demo mode
  if (fakeDemoMode) {
    results.demoMode = true;
    results.apis.status = 'skipped (demo mode enabled)';
  } else {
    results.demoMode = false;
    
    // Simple API status without making actual calls
    results.apis = {
      openai: results.env_vars.OPENAI_API_KEY ? 'configured' : 'not configured',
      elevenlabs: (results.env_vars.ELEVENLABS_API_KEY && results.env_vars.ELEVENLABS_VOICE_ID) ? 'configured' : 'not configured',
      did: (results.env_vars.DID_API_KEY && results.env_vars.BEN_FRANKLIN_IMAGE_URL) ? 'configured' : 'not configured',
      cloudinary: (results.env_vars.CLOUDINARY_CLOUD_NAME && results.env_vars.CLOUDINARY_API_KEY && results.env_vars.CLOUDINARY_API_SECRET) ? 'configured' : 'not configured'
    };
  }

  return res.status(200).json(results);
}