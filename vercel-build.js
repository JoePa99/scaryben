// This script runs before the build to ensure all dependencies are properly set up
const fs = require('fs');
const path = require('path');

console.log('🔨 Running pre-build setup for Vercel deployment...');

// Check for essential environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

let missingVars = [];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    missingVars.push(envVar);
    // Set placeholder values to prevent build failures
    process.env[envVar] = 'placeholder-for-build';
  }
}

if (missingVars.length > 0) {
  console.warn(`⚠️ Missing environment variables: ${missingVars.join(', ')}`);
  console.warn('Using placeholder values for build process');
  console.warn('Please set these in the Vercel dashboard to ensure proper functionality');
} else {
  console.log('✅ All required environment variables are set');
}

// Check for essential dependencies
try {
  require('@supabase/supabase-js');
  require('socket.io');
  require('socket.io-client');
  console.log('✅ All required dependencies are installed');
} catch (error) {
  console.error('❌ Dependency check failed:', error.message);
  console.error('Attempting to install missing dependencies...');
  
  // This is a fallback and should never be needed if package.json is correct
  require('child_process').execSync('npm install @supabase/supabase-js socket.io socket.io-client', {
    stdio: 'inherit'
  });
}

// Ensure the build can proceed by confirming directories exist
const requiredDirs = ['src', 'public'];
for (const dir of requiredDirs) {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) {
    console.error(`❌ Required directory not found: ${dir}`);
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created missing directory: ${dir}`);
  }
}

console.log('🚀 Pre-build setup complete, proceeding with Next.js build...');