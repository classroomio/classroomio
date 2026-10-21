import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCourseById: vi.fn(),
  getGroupMemberIdByCourseAndProfile: vi.fn(),
  syncComplianceProgressFromSubmission: vi.fn(),
  evaluateAndRecordCourseCompletion: vi.fn()
}));

vi.mock('@cio/db/queries/course', () => ({ getCourseById: mocks.getCourseById }));
vi.mock('@cio/db/queries/group/group', () => ({
  getGroupMemberIdByCourseAndProfile: mocks.getGroupMemberIdByCourseAndProfile
}));
vi.mock('../compliance', () => ({
  syncComplianceProgressFromSubmission: mocks.syncComplianceProgressFromSubmission
}));
vi.mock('../completion', () => ({
  evaluateAndRecordCourseCompletion: mocks.evaluateAndRecordCourseCompletion
}));

import { recordCourseCompletionFromProgress } from '../progress-completion';

describe('recordCourseCompletionFromProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getGroupMemberIdByCourseAndProfile.mockResolvedValue('member-1');
  });

  it('completes the compliance cycle, which records course completion itself', async () => {
    mocks.getCourseById.mockResolvedValue([{ type: 'COMPLIANCE' }]);
    mocks.syncComplianceProgressFromSubmission.mockResolvedValue({ status: 'compliant', completed: true });

    await recordCourseCompletionFromProgress('course-1', 'ada');

    expect(mocks.syncComplianceProgressFromSubmission).toHaveBeenCalledWith('course-1', 'member-1');
    expect(mocks.evaluateAndRecordCourseCompletion).not.toHaveBeenCalled();
  });

  it('still records course completion when a compliance course has no cycle to update', async () => {
    mocks.getCourseById.mockResolvedValue([{ type: 'COMPLIANCE' }]);
    mocks.syncComplianceProgressFromSubmission.mockResolvedValue({ status: 'not_started', completed: false });

    await recordCourseCompletionFromProgress('course-1', 'ada');

    expect(mocks.evaluateAndRecordCourseCompletion).toHaveBeenCalledWith('course-1', 'ada');
  });

  it('only evaluates completion for other courses', async () => {
    mocks.getCourseById.mockResolvedValue([{ type: 'SELF_PACED' }]);

    await recordCourseCompletionFromProgress('course-1', 'ada');

    expect(mocks.getGroupMemberIdByCourseAndProfile).not.toHaveBeenCalled();
    expect(mocks.syncComplianceProgressFromSubmission).not.toHaveBeenCalled();
    expect(mocks.evaluateAndRecordCourseCompletion).toHaveBeenCalledWith('course-1', 'ada');
  });
});
