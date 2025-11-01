// Code from https://github.com/vercel/platforms/blob/1ed55b13bcae97b037c69ec40b4c32df21c2412c/lib/domains.ts

import { env } from '$env/dynamic/private';
import type { DomainConfigResponse, DomainResponse, DomainVerificationResponse } from '$lib/utils/types/org';

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
        // Optional: Redirect www. to root domain
        // ...(domain.startsWith("www.") && {
        //   redirect: domain.replace("www.", ""),
        // }),
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

export const removeDomainFromVercelTeam = async (domain: string) => {
  return await fetch(
    `https://api.vercel.com/v6/domains/${domain}${env.TEAM_ID_VERCEL ? `?teamId=${env.TEAM_ID_VERCEL}` : ''}`,
    {
      headers: {
        Authorization: `Bearer ${env.AUTH_BEARER_TOKEN}`
      },
      method: 'DELETE'
    }
  ).then((res) => res.json());
};

export const getDomainResponse = async (
  domain: string
): Promise<DomainResponse & { error: { code: string; message: string } }> => {
  return await fetch(
    `https://api.vercel.com/v9/projects/${env.PROJECT_ID_VERCEL}/domains/${domain}${
      env.TEAM_ID_VERCEL ? `?teamId=${env.TEAM_ID_VERCEL}` : ''
    }`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${env.AUTH_BEARER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  ).then((res) => {
    return res.json();
  });
};

export const getConfigResponse = async (domain: string): Promise<DomainConfigResponse> => {
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

export const verifyDomain = async (domain: string): Promise<DomainVerificationResponse> => {
  return await fetch(
    `https://api.vercel.com/v9/projects/${env.PROJECT_ID_VERCEL}/domains/${domain}/verify${
      env.TEAM_ID_VERCEL ? `?teamId=${env.TEAM_ID_VERCEL}` : ''
    }`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.AUTH_BEARER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  ).then((res) => res.json());
};

export const getSubdomain = (name: string, apexName: string) => {
  if (name === apexName) return null;
  return name.slice(0, name.length - apexName.length - 1);
};

export const getApexDomain = (url: string) => {
  let domain;
  try {
    domain = new URL(url).hostname;
  } catch (e) {
    return '';
  }
  const parts = domain.split('.');
  if (parts.length > 2) {
    // if it's a subdomain (e.g. project.vercel.app), return the last 2 parts
    return parts.slice(-2).join('.');
  }
  // if it's a normal domain (e.g. training.yourdomain.com), we return the domain
  return domain;
};
