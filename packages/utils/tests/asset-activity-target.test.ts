import { describe, expect, it } from 'vitest';

import { ACTIVITY_PACKAGE_SLOT, ZAssetAttach, ZAssetCreateUpload, ZAssetDetach } from '../src/validation/assets/assets';

describe('activity asset targets', () => {
  it('accepts the activity target with the package slot', () => {
    expect(
      ZAssetAttach.parse({ targetType: 'activity', targetId: 'activity-1', slotType: ACTIVITY_PACKAGE_SLOT })
    ).toMatchObject({ targetType: 'activity', slotType: 'activity_package' });
  });

  it('keeps lesson targets working and rejects unknown ones', () => {
    expect(ZAssetAttach.parse({ targetType: 'lesson', targetId: 'lesson-1', slotType: 'lesson_video' })).toMatchObject({
      targetType: 'lesson'
    });
    expect(() =>
      ZAssetAttach.parse({ targetType: 'course', targetId: 'course-1', slotType: 'lesson_video' })
    ).toThrow();
  });

  it('accepts scorm assets and activity detach selectors', () => {
    expect(
      ZAssetCreateUpload.parse({ kind: 'scorm', storageKey: 'scorm/asset-1/original.zip', byteSize: 1024 })
    ).toMatchObject({ kind: 'scorm' });
    expect(
      ZAssetDetach.parse({ targetType: 'activity', targetId: 'activity-1', slotType: ACTIVITY_PACKAGE_SLOT })
    ).toMatchObject({ targetType: 'activity' });
  });
});
