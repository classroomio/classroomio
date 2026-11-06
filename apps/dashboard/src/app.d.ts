import type { TUser, TSession } from '@cio/db/types';

// src/app.d.ts
declare global {
  namespace App {
    interface Locals {
      user: TUser | null;
      session: TSession | null;
      orgRoles: Record<string, number>;
      fromSessions?: boolean;
      // getAccount: () =>
    }
    // interface PageData {}
    // interface Error {}
    // interface Platform {}
  }
}

export {};
