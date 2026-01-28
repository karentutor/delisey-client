//client/src/lib/backendApi.js
import axios from 'axios';

export const backendApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // ✅ sends/receives auth cookie
});
