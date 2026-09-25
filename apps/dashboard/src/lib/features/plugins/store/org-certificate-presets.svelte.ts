import { SvelteMap } from 'svelte/reactivity';
import type {
  OrgCertificatePreset,
  GetCertPresetsRequest,
  GetCertPresetRequest,
  CreateCertPresetRequest,
  UpdateCertPresetRequest,
  DeleteCertPresetRequest
} from '../utils/types';
import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { snackbar } from '$features/ui/snackbar/store';

class OrgCertificatePresetsApi extends BaseApiWithErrors {
  presetsByOrg = new SvelteMap<string, OrgCertificatePreset[]>();
  isLoadingByOrg = new SvelteMap<string, boolean>();
  activeOrgId = $state<string | null>(null);
  isSaving = $state(false);

  private requestSeqByOrg = new Map<string, number>();

  setActiveOrgId(orgId: string | null) {
    this.activeOrgId = orgId;
  }

  get presets(): OrgCertificatePreset[] {
    if (!this.activeOrgId) return [];
    return this.presetsByOrg.get(this.activeOrgId) ?? [];
  }

  isOrgLoading(orgId?: string): boolean {
    const targetOrgId = orgId || this.activeOrgId;
    if (!targetOrgId) return this.isLoading;
    return this.isLoadingByOrg.get(targetOrgId) ?? false;
  }

  getPresets(orgId: string): OrgCertificatePreset[] {
    return this.presetsByOrg.get(orgId) ?? [];
  }

  async fetchPreset(orgId: string, presetId: string): Promise<OrgCertificatePreset | null> {
    if (!orgId || !presetId) return null;

    const cachedPreset = this.getPresets(orgId).find((preset) => preset.id === presetId);
    if (cachedPreset) return cachedPreset;

    let fetchedPreset: OrgCertificatePreset | null = null;

    await this.execute<GetCertPresetRequest>({
      requestFn: () =>
        classroomio.plugins['certificate-studio'].presets[':presetId'].$get(
          { param: { presetId } },
          { headers: { 'cio-org-id': orgId } }
        ),
      logContext: 'fetching org certificate preset',
      onSuccess: (response) => {
        fetchedPreset = response.data;
        const currentPresets = this.getPresets(orgId);
        this.presetsByOrg.set(orgId, [...currentPresets, response.data]);
      }
    });

    return fetchedPreset;
  }

  setPresets(orgId: string, items: OrgCertificatePreset[]) {
    this.presetsByOrg.set(orgId, items);
  }

  async fetchPresets(orgId: string) {
    if (!orgId) return;

    this.activeOrgId = orgId;
    this.isLoadingByOrg.set(orgId, true);

    const nextSeq = (this.requestSeqByOrg.get(orgId) ?? 0) + 1;
    this.requestSeqByOrg.set(orgId, nextSeq);

    try {
      await this.execute<GetCertPresetsRequest>({
        requestFn: () =>
          classroomio.plugins['certificate-studio'].presets.$get(
            {},
            {
              headers: { 'cio-org-id': orgId }
            }
          ),
        logContext: 'fetching org certificate presets',
        onSuccess: (response) => {
          if (this.requestSeqByOrg.get(orgId) !== nextSeq) return;
          this.presetsByOrg.set(orgId, response.data);
        }
      });
    } finally {
      if (this.requestSeqByOrg.get(orgId) === nextSeq) {
        this.isLoadingByOrg.set(orgId, false);
      }
    }
  }

  async createPreset(
    orgId: string,
    data: { name: string; description?: string; design: Record<string, unknown> }
  ): Promise<OrgCertificatePreset | null> {
    const targetOrgId = orgId || this.activeOrgId;
    if (!targetOrgId) return null;

    this.isSaving = true;
    let createdItem: OrgCertificatePreset | null = null;

    try {
      await this.execute<CreateCertPresetRequest>({
        requestFn: () =>
          classroomio.plugins['certificate-studio'].presets.$post(
            {
              json: data as any
            },
            {
              headers: { 'cio-org-id': targetOrgId }
            }
          ),
        logContext: 'creating org certificate preset',
        onSuccess: (response) => {
          createdItem = response.data;
          const currentList = this.presetsByOrg.get(targetOrgId) ?? [];
          this.presetsByOrg.set(targetOrgId, [...currentList, response.data]);
          snackbar.success('certificate_studio.snackbar_created');
        }
      });
    } finally {
      this.isSaving = false;
    }

    return createdItem;
  }

  async updatePreset(
    orgId: string,
    presetId: string,
    data: { name?: string; description?: string | null; design?: Record<string, unknown> }
  ): Promise<OrgCertificatePreset | null> {
    const targetOrgId = orgId || this.activeOrgId;
    if (!targetOrgId) return null;

    this.isSaving = true;
    let updatedItem: OrgCertificatePreset | null = null;

    try {
      await this.execute<UpdateCertPresetRequest>({
        requestFn: () =>
          classroomio.plugins['certificate-studio'].presets[':presetId'].$put(
            {
              param: { presetId },
              json: data as any
            },
            {
              headers: { 'cio-org-id': targetOrgId }
            }
          ),
        logContext: 'updating org certificate preset',
        onSuccess: (response) => {
          updatedItem = response.data;
          const currentList = this.presetsByOrg.get(targetOrgId) ?? [];
          this.presetsByOrg.set(
            targetOrgId,
            currentList.map((preset) => (preset.id === presetId ? response.data : preset))
          );
          snackbar.success('certificate_studio.snackbar_updated');
        }
      });
    } finally {
      this.isSaving = false;
    }

    return updatedItem;
  }

  async deletePreset(orgId: string, presetId: string): Promise<boolean> {
    const targetOrgId = orgId || this.activeOrgId;
    if (!targetOrgId) return false;

    const currentList = this.presetsByOrg.get(targetOrgId) ?? [];
    const previousList = [...currentList];

    this.presetsByOrg.set(
      targetOrgId,
      currentList.filter((preset) => preset.id !== presetId)
    );

    let success = false;

    await this.execute<DeleteCertPresetRequest>({
      requestFn: () =>
        classroomio.plugins['certificate-studio'].presets[':presetId'].$delete(
          {
            param: { presetId }
          },
          {
            headers: { 'cio-org-id': targetOrgId }
          }
        ),
      logContext: 'deleting org certificate preset',
      onSuccess: () => {
        success = true;
        snackbar.success('certificate_studio.snackbar_deleted');
      },
      onError: () => {
        this.presetsByOrg.set(targetOrgId, previousList);
      }
    });

    return success;
  }

  async clonePreset(orgId: string, preset: OrgCertificatePreset): Promise<OrgCertificatePreset | null> {
    const targetOrgId = orgId || this.activeOrgId;
    if (!targetOrgId) return null;

    const clonedName = `${preset.name} (Copy)`;
    const design = (preset.design as Record<string, unknown>) ?? {};

    const created = await this.createPreset(targetOrgId, {
      name: clonedName,
      description: preset.description ?? undefined,
      design
    });

    if (created) {
      snackbar.success('certificate_studio.snackbar_cloned');
    }

    return created;
  }
}

export const orgCertificatePresetsApi = new OrgCertificatePresetsApi();
