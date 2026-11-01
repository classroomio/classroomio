type Unregister = () => Promise<void>;

let registeredToken: string | null = null;
let unregister: Unregister | null = null;

export function getRegisteredPushToken() {
  return registeredToken;
}

/** Records the token this device registered and how to remove it, for sign-out. */
export function setRegisteredPushToken(token: string | null, remove: Unregister | null) {
  registeredToken = token;
  unregister = remove;
}

/** Removes this device's push token from the server. Call before the session ends; never throws. */
export async function unregisterPushToken() {
  const remove = unregister;
  registeredToken = null;
  unregister = null;

  await remove?.().catch(() => {});
}
