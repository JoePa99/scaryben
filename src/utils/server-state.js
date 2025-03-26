// This is a simple in-memory store that will persist between API requests
// In a production app, you would use a database instead

// NOTE: This approach works better on Vercel than pure serverless environments
// but is still not 100% reliable for production. In production, you should use
// a proper database like MongoDB, PostgreSQL, or a serverless database.

const pendingRequests = new Map();

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

// For demo purposes only - ALWAYS enabled for now until we fix API issues
export const fakeDemoMode = true;

// This function is used only in demo mode - you can safely remove it in production
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

  try {
    // Simulate thinking stage (3 seconds)
    await new Promise(resolve => setTimeout(resolve, 1000));
    updateRequest(requestId, {
      stage: 'thinking',
      progress: 20,
      message: 'Generating Franklin\'s response'
    });

    // Simulate animation generation (6 seconds)
    await new Promise(resolve => setTimeout(resolve, 3000));
    updateRequest(requestId, {
      stage: 'animating',
      progress: 60,
      message: 'Animating Benjamin Franklin'
    });

    // Complete the request with fake data
    await new Promise(resolve => setTimeout(resolve, 3000));
    updateRequest(requestId, {
      status: 'completed',
      stage: 'completed',
      progress: 100,
      endTime: Date.now(),
      result: {
        answer: "The national debt is a burden we place upon future generations. As I once wrote, 'Think what you do when you run in debt; you give to another power over your liberty.' Today's debt, exceeding $34 trillion, would be incomprehensible in my day. We fought for economic freedom from Britain, yet now America binds itself with chains of financial obligation. Remember, a penny saved is a penny earned, but trillions borrowed is liberty spurned.",
        audioUrl: "https://elevenlabs.io/api/download/demo-franklin-audio",
        videoUrl: "https://d-id-talks-prod.s3.us-west-2.amazonaws.com/or9uzctrt2/tlk_Wl-oSCPzXm3GQHD3oZO9h/1706747167146.mp4"
      }
    });

    // Clean up after 1 hour
    setTimeout(() => {
      deleteRequest(requestId);
    }, 60 * 60 * 1000);
  } catch (error) {
    updateRequest(requestId, {
      status: 'failed',
      error: {
        message: error.message,
        details: error.stack
      },
      endTime: Date.now()
    });
  }
};