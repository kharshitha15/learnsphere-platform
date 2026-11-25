import axios from 'axios';

let rawUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
if (rawUrl && !rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
  rawUrl = `https://${rawUrl}`;
}
// Strip any trailing slash
rawUrl = rawUrl.replace(/\/+$/, "");

const api = axios.create({ 
  baseURL: `${rawUrl}/api` 
});

// Axios interceptor to attach JWT token for secure API calls
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
