/**
 * Loads Google Identity Services + Picker API and opens a Drive file picker for video files.
 * Requires PUBLIC_GOOGLE_PICKER_CLIENT_ID and PUBLIC_GOOGLE_PICKER_API_KEY (browser API key).
 */

type TokenResponse = {
  error?: string;
  access_token?: string;
};

type PickerDocument = {
  id: string;
  name: string;
  mimeType: string;
};

type PickerData = {
  action: string;
  docs?: PickerDocument[];
};

type GapiLoad = {
  load: (api: string, onLoaded: () => void) => void;
};

type GooglePickerGlobal = {
  picker: {
    PickerBuilder: new () => {
      addView: (view: unknown) => unknown;
      setOAuthToken: (token: string) => unknown;
      setDeveloperKey: (key: string) => unknown;
      setCallback: (cb: (data: PickerData) => void) => unknown;
      build: () => { setVisible: (visible: boolean) => void };
    };
    DocsView: new (viewId?: string) => unknown;
    ViewId: { DOCS_VIDEOS: string };
    Action: { PICKED: string; CANCEL: string };
  };
  accounts: {
    oauth2: {
      initTokenClient: (config: { client_id: string; scope: string; callback: (response: TokenResponse) => void }) => {
        requestAccessToken: (overrideConfig?: Record<string, unknown>) => void;
      };
    };
  };
};

function appendScriptOnce(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(id);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

async function ensurePickerApiLoaded(): Promise<void> {
  await appendScriptOnce('https://accounts.google.com/gsi/client', 'cio-google-gsi-client');
  await appendScriptOnce('https://apis.google.com/js/api.js', 'cio-google-api-js');

  const gapi = (window as unknown as { gapi?: GapiLoad }).gapi;
  if (!gapi?.load) {
    throw new Error('Google API client failed to initialize');
  }

  await new Promise<void>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error('Google Picker load timed out')), 20000);

    try {
      gapi.load('picker', () => {
        window.clearTimeout(timeoutId);
        resolve();
      });
    } catch {
      window.clearTimeout(timeoutId);
      reject(new Error('Failed to load Google Picker module'));
    }
  });
}

function getGoogle(): GooglePickerGlobal {
  const google = (window as unknown as { google?: GooglePickerGlobal }).google;
  if (!google?.picker || !google?.accounts?.oauth2) {
    throw new Error('Google Picker is not available');
  }
  return google;
}

export type GoogleDrivePickResult = {
  fileId: string;
  name: string;
  mimeType: string;
};

/**
 * Opens OAuth consent (if needed) and the Drive video picker. Resolves with the first selected file, or null if cancelled / error.
 */
export async function pickGoogleDriveVideo(params: {
  clientId: string;
  apiKey: string;
}): Promise<GoogleDrivePickResult | null> {
  await ensurePickerApiLoaded();
  const google = getGoogle();

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: GoogleDrivePickResult | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: params.clientId,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      callback: (tokenResponse: TokenResponse) => {
        if (tokenResponse.error || !tokenResponse.access_token) {
          finish(null);
          return;
        }

        const view = new google.picker.DocsView(google.picker.ViewId.DOCS_VIDEOS);
        const picker = new google.picker.PickerBuilder()
          .addView(view)
          .setOAuthToken(tokenResponse.access_token)
          .setDeveloperKey(params.apiKey)
          .setCallback((data: PickerData) => {
            if (data.action === google.picker.Action.PICKED && data.docs?.[0]?.id) {
              const doc = data.docs[0];
              finish({
                fileId: doc.id,
                name: doc.name,
                mimeType: doc.mimeType
              });
              return;
            }

            if (data.action === google.picker.Action.CANCEL) {
              finish(null);
            }
          })
          .build();

        picker.setVisible(true);
      }
    });

    tokenClient.requestAccessToken();
  });
}

export function googleDrivePreviewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

export function googleDriveThumbnailUrl(fileId: string): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
}
