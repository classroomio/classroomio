import { supabase } from '$lib/utils/functions/supabase';

export const NOTIFICATION_NAME = {
  WELCOME_TO_APP: 'WELCOME TO APP'
};

const NAME_TO_PATH = {
  [NOTIFICATION_NAME.WELCOME_TO_APP]: '/api/email/welcome'
};

const getAccessToken = async () => {
  const { data } = await supabase.auth.getSession();

  return data.session?.access_token || '';
};

export const triggerSendEmail = async (name: string, body: { [k: string]: string }) => {
  try {
    const accessToken = await getAccessToken();
    const path = NAME_TO_PATH[name];

    if (!path) {
      console.error('Could not trigger send');
      return;
    }

    const response = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: accessToken
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      throw new Error(await response.text());
    }
    const result = await response.json();

    console.log(`${name} sent email result`, result);
  } catch (error) {
    console.log(`${name} sent email error`, error);
  }
};
