// Demo mode utility for Vercel deployment
// Provides fallback content when API keys are not configured

// Sample videos for demo mode
export const SAMPLE_VIDEOS = [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
];

// Sample questions and answers for demo mode
export const SAMPLE_ANSWERS = {
  "default": "The national debt is a burden we place upon future generations. As I once wrote, 'Think what you do when you run in debt; you give to another power over your liberty.' Today's debt, exceeding $34 trillion, would be incomprehensible in my day. We fought for economic freedom from Britain, yet now America binds itself with chains of financial obligation. Remember, a penny saved is a penny earned, but trillions borrowed is liberty spurned.",
  "economy": "The economy of our young nation was built on fiscal responsibility. I advised in Poor Richard's Almanack, 'Beware of little expenses; a small leak will sink a great ship.' Today's national debt would appear as an unfathomable leak. Your federal government now spends far beyond its means, creating obligations your children must honor. This practice contradicts the very principles of liberty we fought to establish.",
  "inflation": "Inflation is taxation without legislation. When money loses value, it is the common citizen who suffers most. In my day, we struggled with the devaluation of Continental currency, which led to the phrase 'not worth a Continental.' Today's monetary policies of unlimited printing would horrify the founders who understood that sound money is essential to a republic's survival."
};

// Get a sample video URL
export function getSampleVideo() {
  return SAMPLE_VIDEOS[Math.floor(Math.random() * SAMPLE_VIDEOS.length)];
}

// Get a sample answer based on the question
export function getSampleAnswer(question) {
  const lowerQuestion = (question || "").toLowerCase();
  
  if (lowerQuestion.includes('economy')) {
    return SAMPLE_ANSWERS.economy;
  } else if (lowerQuestion.includes('inflation')) {
    return SAMPLE_ANSWERS.inflation;
  } else {
    return SAMPLE_ANSWERS.default;
  }
}

// Check if we're in demo mode
export function isDemoMode() {
  return process.env.FAKE_DEMO_MODE === 'true' || 
         !process.env.OPENAI_API_KEY || 
         !process.env.ELEVENLABS_API_KEY ||
         !process.env.DID_API_KEY;
}

// Helper function to determine if required APIs are configured
export function getConfigStatus() {
  return {
    openai: !!process.env.OPENAI_API_KEY,
    elevenlabs: !!(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID),
    did: !!(process.env.DID_API_KEY && process.env.BEN_FRANKLIN_IMAGE_URL),
    cloudinary: !!(process.env.CLOUDINARY_CLOUD_NAME && 
                  process.env.CLOUDINARY_API_KEY && 
                  process.env.CLOUDINARY_API_SECRET),
    demoMode: isDemoMode()
  };
}