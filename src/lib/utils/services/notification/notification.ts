import { supabase } from '$lib/utils/functions/supabase';

export class Notification {
  name = '';
  accessToken = '';

  constructor(name: string) {
    this.name = name;
  }

  async getAccessToken() {
    const { data } = await supabase.auth.getSession();
    this.accessToken = data.session?.access_token || '';

    return this.accessToken;
  }

  async send(path: string, body: { [k: string]: string }) {
    try {
      await this.getAccessToken();
      const response = await fetch(path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.accessToken
        },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const result = await response.json();

      console.log(`${this.name} sent email result`, result);
    } catch (error) {
      console.log(`${this.name} sent email error`, error);
    }
  }
}

export class InviteNotification extends Notification {}
