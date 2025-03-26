import axios from 'axios';

// Create axios instance with default configs
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 120000, // 2 minutes - we need a long timeout for the video generation
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor for logging and handling
apiClient.interceptors.request.use(
  (config) => {
    // You can add logging here in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request to ${config.url}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Transform and standardize error responses
    const customError = {
      message: 'An error occurred while processing your request',
      status: error.response?.status || 500,
      data: error.response?.data || {},
    };

    // You could add error reporting to a service like Sentry here

    return Promise.reject(customError);
  }
);

export default apiClient;
