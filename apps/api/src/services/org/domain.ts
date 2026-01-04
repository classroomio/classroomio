// Code from https://github.com/vercel/platforms/blob/1ed55b13bcae97b037c69ec40b4c32df21c2412c/lib/domains.ts

import { env } from '@api/config/env';

export const addDomainToVercel = async (domain: string) => {
  return await fetch(
    `https://api.vercel.com/v10/projects/${env.PROJECT_ID_VERCEL}/domains${
      env.TEAM_ID_VERCEL ? `?teamId=${env.TEAM_ID_VERCEL}` : ''
    }`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.AUTH_BEARER_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: domain
      })
    }
  ).then((res) => res.json());
};

export const removeDomainFromVercelProject = async (domain: string) => {
  return await fetch(
    `https://api.vercel.com/v9/projects/${env.PROJECT_ID_VERCEL}/domains/${domain}${
      env.TEAM_ID_VERCEL ? `?teamId=${env.TEAM_ID_VERCEL}` : ''
    }`,
    {
      headers: {
        Authorization: `Bearer ${env.AUTH_BEARER_TOKEN}`
      },
      method: 'DELETE'
    }
  ).then((res) => res.json());
};

export const getConfigResponse = async (domain: string) => {
  return await fetch(
    `https://api.vercel.com/v6/domains/${domain}/config${env.TEAM_ID_VERCEL ? `?teamId=${env.TEAM_ID_VERCEL}` : ''}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${env.AUTH_BEARER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  ).then((res) => res.json());
};
