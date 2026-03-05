import { ssoApi } from '../api/sso.svelte';
import type { SsoConfig } from '../utils/types';
import { normalizeSsoConfig } from '../utils/sso';

/**
 * SSO Store - Manages SSO configuration state across the app
 * Uses Svelte 5 runes for reactive state management
 */
class SsoStore {
  // The SSO configuration data
  config = $state<SsoConfig | null>(null);

  // Loading states
  isLoading = $state(false);
  isInitialized = $state(false);

  // Error state
  error = $state<string | null>(null);

  /**
   * Load SSO config from API (only if not already loaded)
   * Call this on first page render
   */
  async loadConfig(force = false) {
    // Skip if already loaded and not forcing refresh
    if (this.isInitialized && !force) {
      return;
    }

    // Skip if already loading
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    try {
      const result = await ssoApi.getSsoConfig();
      if (result?.data) {
        this.config = normalizeSsoConfig(result.data);
      }
      this.isInitialized = true;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to load SSO config';
      console.error('Failed to load SSO config:', err);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Refresh the config from API
   * Use this after creating/updating/deleting connections
   */
  async refreshConfig() {
    return this.loadConfig(true);
  }

  /**
   * Update local config after policy changes
   */
  updatePolicy(policy: SsoConfig['policy']) {
    if (this.config) {
      this.config = {
        ...this.config,
        policy
      };
    }
  }

  /**
   * Update local config after connection changes
   */
  updateConfig(config: SsoConfig['config']) {
    if (this.config) {
      this.config = {
        ...this.config,
        config
      };
    } else {
      this.config = { config, policy: null };
    }
  }

  /**
   * Clear the store (e.g., on logout)
   */
  clear() {
    this.config = null;
    this.isInitialized = false;
    this.error = null;
  }

  /**
   * Check if SSO is configured for current org
   */
  get hasConfig() {
    return this.config?.config !== null;
  }

  /**
   * Check if SSO is active
   */
  get isActive() {
    return this.config?.config?.isActive ?? false;
  }

  /**
   * Check if Force SSO is enabled
   */
  get forceSso() {
    return this.config?.policy?.forceSso ?? false;
  }
}

// Export singleton instance
export const ssoStore = new SsoStore();
