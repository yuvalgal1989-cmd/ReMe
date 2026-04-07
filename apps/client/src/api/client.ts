import axios from 'axios';

// In development the Vite proxy rewrites /api → localhost:3001.
// In a Capacitor/production build, set VITE_API_URL to your deployed
// server (e.g. https://reme-server.fly.dev) so the app can reach it.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
