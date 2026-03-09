import { LICENSE_FEATURE_IDS, type LicenseFeatureId } from '@cio/utils/license';

class LicenseApi {
  features = $state<LicenseFeatureId[]>([]);
  isResolved = $state(false);

  setFeatures(features: string[] = []) {
    this.features = this.sanitize(features);
    this.isResolved = true;
  }

  hasAccess(feature: LicenseFeatureId): boolean {
    return this.features.includes(feature);
  }

  reset() {
    this.features = [];
    this.isResolved = false;
  }

  private sanitize(features: string[]): LicenseFeatureId[] {
    const deduped: LicenseFeatureId[] = [];

    for (const feature of features) {
      if (LICENSE_FEATURE_IDS.includes(feature)) {
        const typedFeature = feature as LicenseFeatureId;
        if (!deduped.includes(typedFeature)) {
          deduped.push(typedFeature);
        }
      }
    }

    return deduped;
  }
}

export const licenseApi = new LicenseApi();
