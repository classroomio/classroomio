import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';

const ACTIVE_ORG_STORAGE_KEY = 'classroomio.active_org';

let activeOrgId: string | null = SecureStore.getItem(ACTIVE_ORG_STORAGE_KEY);
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getActiveOrgId() {
  return activeOrgId;
}

export function setActiveOrg(orgId: string) {
  activeOrgId = orgId;
  SecureStore.setItem(ACTIVE_ORG_STORAGE_KEY, orgId);
  emit();
}

export function clearActiveOrg() {
  activeOrgId = null;
  void SecureStore.deleteItemAsync(ACTIVE_ORG_STORAGE_KEY);
  emit();
}

export function useActiveOrgId() {
  return useSyncExternalStore(subscribe, getActiveOrgId);
}
