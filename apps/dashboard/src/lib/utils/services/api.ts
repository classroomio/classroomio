import axios from 'axios';
import { env } from '$env/dynamic/public';
import { getAccessToken } from '$lib/utils/functions/supabase';

export const apiClient = axios.create({
  baseURL: `${env.PUBLIC_SERVER_URL}`,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
