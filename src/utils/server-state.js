// This implementation uses Supabase for state storage in serverless environments
// Much more reliable and scalable than in-memory or file-based storage

import supabase from './supabase-client';

// Cache for performance
const requestCache = new Map();

// Table name in Supabase
const TABLE_NAME = 'franklin_requests';

// Get a request by ID
export const getRequest = async (requestId) => {
  // Check cache first for performance
  if (requestCache.has(requestId)) {
    return requestCache.get(requestId);
  }

  try {
    // Query Supabase for the request
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('request_id', requestId)
      .single();

    if (error) {
      console.error(`[SUPABASE] Error getting request ${requestId}:`, error.message);
      return null;
    }

    if (!data) {
      console.log(`[SUPABASE] Request ${requestId} not found`);
      return null;
    }

    // Parse the JSON fields
    const request = {
      ...data,
      result: data.result ? JSON.parse(data.result) : null,
      error: data.error ? JSON.parse(data.error) : null
    };

    // Update cache
    requestCache.set(requestId, request);
    
    console.log(`[SUPABASE] Retrieved request ${requestId}`);
    return request;
  } catch (error) {
    console.error(`[SUPABASE] Exception getting request ${requestId}:`, error.message);
    return null;
  }
};

// Set a new request
export const setRequest = async (requestId, data) => {
  try {
    // Prepare data for Supabase
    const dbData = {
      request_id: requestId,
      status: data.status,
      stage: data.stage,
      progress: data.progress,
      message: data.message,
      start_time: new Date(data.startTime).toISOString(),
      last_updated: new Date().toISOString(),
      question: data.question,
      result: data.result ? JSON.stringify(data.result) : null,
      error: data.error ? JSON.stringify(data.error) : null
    };

    // Insert into Supabase
    const { error } = await supabase
      .from(TABLE_NAME)
      .insert(dbData);

    if (error) {
      console.error(`[SUPABASE] Error setting request ${requestId}:`, error.message);
      return null;
    }

    // Update cache
    requestCache.set(requestId, data);
    
    console.log(`[SUPABASE] Saved request ${requestId}`);
    return data;
  } catch (error) {
    console.error(`[SUPABASE] Exception setting request ${requestId}:`, error.message);
    return null;
  }
};

// Delete a request
export const deleteRequest = async (requestId) => {
  try {
    // Remove from Supabase
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('request_id', requestId);

    if (error) {
      console.error(`[SUPABASE] Error deleting request ${requestId}:`, error.message);
      return false;
    }

    // Remove from cache
    requestCache.delete(requestId);
    
    console.log(`[SUPABASE] Deleted request ${requestId}`);
    return true;
  } catch (error) {
    console.error(`[SUPABASE] Exception deleting request ${requestId}:`, error.message);
    return false;
  }
};

// Update an existing request
export const updateRequest = async (requestId, updates) => {
  try {
    // Get the current state first
    const currentData = await getRequest(requestId);
    
    if (!currentData) {
      console.warn(`[SUPABASE] Cannot update request ${requestId} - not found`);
      return null;
    }

    // Create the updated data
    const updatedData = {
      ...currentData,
      ...updates,
      last_updated: new Date().toISOString()
    };

    // Prepare the database update
    const dbUpdates = {
      status: updatedData.status,
      stage: updatedData.stage,
      progress: updatedData.progress,
      message: updatedData.message,
      last_updated: updatedData.last_updated,
      result: updatedData.result ? JSON.stringify(updatedData.result) : null,
      error: updatedData.error ? JSON.stringify(updatedData.error) : null
    };

    // Update in Supabase
    const { error } = await supabase
      .from(TABLE_NAME)
      .update(dbUpdates)
      .eq('request_id', requestId);

    if (error) {
      console.error(`[SUPABASE] Error updating request ${requestId}:`, error.message);
      return null;
    }

    // Update cache with the new merged data
    const cachedData = {
      ...currentData,
      ...updates,
      lastUpdated: new Date().getTime()
    };
    requestCache.set(requestId, cachedData);
    
    console.log(`[SUPABASE] Updated request ${requestId}:`, updates);
    return cachedData;
  } catch (error) {
    console.error(`[SUPABASE] Exception updating request ${requestId}:`, error.message);
    return null;
  }
};

// Get all requests
export const getAllRequests = async () => {
  try {
    // Query Supabase for all requests
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('last_updated', { ascending: false });

    if (error) {
      console.error('[SUPABASE] Error getting all requests:', error.message);
      return [];
    }

    return data.map(item => ({
      ...item,
      result: item.result ? JSON.parse(item.result) : null,
      error: item.error ? JSON.parse(item.error) : null
    }));
  } catch (error) {
    console.error('[SUPABASE] Exception getting all requests:', error.message);
    return [];
  }
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
  await setRequest(requestId, {
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
    await updateRequest(requestId, {
      stage: 'thinking',
      progress: 20,
      message: 'Generating Franklin\'s response'
    });

    // Simulate animation generation (6 seconds)
    await new Promise(resolve => setTimeout(resolve, 3000));
    await updateRequest(requestId, {
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
    await updateRequest(requestId, {
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
    await updateRequest(requestId, {
      status: 'failed',
      error: {
        message: error.message,
        details: error.stack
      },
      endTime: Date.now()
    });
  }
};