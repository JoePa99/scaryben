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

// Demo mode - set to false to use real APIs
export const fakeDemoMode = process.env.FAKE_DEMO_MODE === 'true';

// Sample videos for demo mode
const SAMPLE_VIDEOS = [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
];

// Sample questions and answers for demo mode
const SAMPLE_ANSWERS = {
  "default": "The national debt is a burden we place upon future generations. As I once wrote, 'Think what you do when you run in debt; you give to another power over your liberty.' Today's debt, exceeding $34 trillion, would be incomprehensible in my day. We fought for economic freedom from Britain, yet now America binds itself with chains of financial obligation. Remember, a penny saved is a penny earned, but trillions borrowed is liberty spurned.",
  "economy": "The economy of our young nation was built on fiscal responsibility. I advised in Poor Richard's Almanack, 'Beware of little expenses; a small leak will sink a great ship.' Today's national debt would appear as an unfathomable leak. Your federal government now spends far beyond its means, creating obligations your children must honor. This practice contradicts the very principles of liberty we fought to establish.",
  "inflation": "Inflation is taxation without legislation. When money loses value, it is the common citizen who suffers most. In my day, we struggled with the devaluation of Continental currency, which led to the phrase 'not worth a Continental.' Today's monetary policies of unlimited printing would horrify the founders who understood that sound money is essential to a republic's survival."
};

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

    // Select a random sample video
    const videoUrl = SAMPLE_VIDEOS[Math.floor(Math.random() * SAMPLE_VIDEOS.length)];
    
    // Select an appropriate answer based on the question
    let answer = SAMPLE_ANSWERS.default;
    if (question.toLowerCase().includes('economy')) {
      answer = SAMPLE_ANSWERS.economy;
    } else if (question.toLowerCase().includes('inflation')) {
      answer = SAMPLE_ANSWERS.inflation;
    }

    // Complete the request with demo data
    await new Promise(resolve => setTimeout(resolve, 3000));
    updateRequest(requestId, {
      status: 'completed',
      stage: 'completed',
      progress: 100,
      endTime: Date.now(),
      result: {
        answer: answer,
        audioUrl: videoUrl,
        videoUrl: videoUrl
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