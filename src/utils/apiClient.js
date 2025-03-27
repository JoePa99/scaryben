import axios from 'axios';

// Create axios instance with default configs
// Using baseURL for consistent routing
const apiClient = axios.create({
  baseURL: '/', // Root-relative URLs for simplicity
  timeout: 300000, // 5 minutes - we need a long timeout for the video generation
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor for logging and handling
apiClient.interceptors.request.use(
  (config) => {
    // Log requests in development and production (helps with debugging)
    console.log(`API Request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error.message);
    return Promise.reject(error);
  }
);

// Add a response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response from ${response.config.url}: Status ${response.status}`);
    }
    return response;
  },
  (error) => {
    // Get detailed error information
    const errorInfo = {
      message: error.message || 'Unknown error occurred',
      status: error.response?.status || 'No status',
      statusText: error.response?.statusText || 'No status text',
      url: error.config?.url || 'Unknown URL',
      method: error.config?.method?.toUpperCase() || 'Unknown method',
      data: error.response?.data || {},
    };
    
    // Log detailed error for debugging
    console.error(`API Error (${errorInfo.status}) on ${errorInfo.method} ${errorInfo.url}:`, 
                 errorInfo.message, errorInfo);

    // Create a user-friendly error with detailed debugging information
    const customError = new Error(
      error.response?.data?.error || 
      error.response?.data?.message || 
      'Failed to process your question'
    );
    
    // Add detailed properties to the error object
    customError.status = errorInfo.status;
    customError.statusText = errorInfo.statusText;
    customError.url = errorInfo.url;
    customError.data = errorInfo.data;
    customError.originalError = error;

    return Promise.reject(customError);
  }
);

export default apiClient;
