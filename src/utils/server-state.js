// This is a simple in-memory store that will persist between API requests
// In a production app, you would use a database instead

// NOTE: This approach only works in development with Next.js
// In production, serverless functions would not share memory
// You should use a database or redis for production

let pendingRequests = new Map();

export const getRequest = (requestId) => {
  return pendingRequests.get(requestId);
};

export const setRequest = (requestId, data) => {
  pendingRequests.set(requestId, data);
};

export const deleteRequest = (requestId) => {
  pendingRequests.delete(requestId);
};

export const updateRequest = (requestId, updates) => {
  const request = pendingRequests.get(requestId);
  if (request) {
    pendingRequests.set(requestId, {
      ...request,
      ...updates,
      lastUpdated: Date.now()
    });
    return pendingRequests.get(requestId);
  }
  return null;
};

// For demo purposes only - we'll implement a fake database
// that returns mock results

// This approach provides a way to see the demo working without
// actually setting up the external APIs or databases
export const fakeDemoMode = process.env.FAKE_DEMO_MODE === 'true';

// Pre-generated responses for demo
const demoResponses = {
  answer: "Greetings from beyond the veil. The national debt you speak of would render me speechless, were I still drawing breath. In my day, we fought vigorously to establish financial independence from Britain, yet today America owes over $34 trillion - a sum incomprehensible even to a polymath such as myself. This burden represents approximately $100,000 for every American soul, a modern form of taxation without representation imposed upon future generations. Remember, a penny saved is a penny earned, but trillions borrowed is liberty spurned. We founded this nation on principles of fiscal responsibility - I pray you return to them before the debt collector comes calling.",
  videoUrl: "https://d-id-talks-prod.s3.us-west-2.amazonaws.com/auth0%7C6599e248dfe75d91d4312ac1/tlk_vrsliKDRHI01q_jBN1cLY/1706747167146.mp4?AWSAccessKeyId=AKIA5CUMPJBIK65W6FGA&Expires=1706833571&Signature=f%2FBdXm5ujRFbsdgJ2U5Y3r8uT0I%3D"
};

// Simulate processing with artificial delays
export const simulateProcessing = async (requestId, question) => {
  // Initialize the request
  setRequest(requestId, {
    status: 'processing',
    stage: 'thinking',
    progress: 0,
    startTime: Date.now(),
    question,
    result: null,
    error: null
  });

  // Simulate thinking stage (3 seconds)
  await new Promise(resolve => setTimeout(resolve, 1000));
  updateRequest(requestId, {
    stage: 'thinking',
    progress: 20,
    message: 'Generating Franklin\'s response'
  });

  // Simulate speech generation (4 seconds)
  await new Promise(resolve => setTimeout(resolve, 1500));
  updateRequest(requestId, {
    stage: 'speaking',
    progress: 50,
    message: 'Converting text to speech'
  });

  // Simulate video generation (5 seconds)
  await new Promise(resolve => setTimeout(resolve, 1500));
  updateRequest(requestId, {
    stage: 'animating',
    progress: 80,
    message: 'Animating Benjamin Franklin'
  });

  // Complete the request
  await new Promise(resolve => setTimeout(resolve, 1000));
  updateRequest(requestId, {
    status: 'completed',
    stage: 'completed',
    progress: 100,
    endTime: Date.now(),
    result: {
      answer: demoResponses.answer,
      audioUrl: 'https://example.com/fake-audio-url.mp3',
      videoUrl: demoResponses.videoUrl
    }
  });

  // Clean up after 1 hour
  setTimeout(() => {
    deleteRequest(requestId);
  }, 60 * 60 * 1000);
};