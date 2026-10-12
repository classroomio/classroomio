import {
  activityScorm,
  asset,
  assetUsage,
  contentPackageUnit,
  contentPackageVersion,
  course,
  courseActivity,
  db,
  eq,
  group
} from '@db/drizzle';

const ENTERPRISE_ORG_ID = '2b8f4a1c-6d3e-4b2a-9f7e-1c4d8a6e9b0f';
const ENTERPRISE_ADMIN_USER_ID = '3c9052de-7e4f-4c3a-8d8e-2d5e9b7f1a3c';

const HIPAA_COURSE_ID = '7e000000-2000-4000-8000-000000000001';
const HIPAA_SECTION_ID = '7e000000-3000-4000-8000-000000000001';

const HIPAA_ACTIVITY_ID = '7e000000-6000-4000-8000-000000000001';
const HIPAA_ASSET_ID = '7e000000-7000-4000-8000-000000000001';
const HIPAA_VERSION_ID = '7e000000-8000-4000-8000-000000000001';

const SCORM_COURSE_GROUP_ID = '7e000000-1000-4000-8000-000000000101';
const SCORM_COURSE_ID = '7e000000-2000-4000-8000-000000000101';
const SCORM_COURSE_ACTIVITY_ID = '7e000000-6000-4000-8000-000000000101';
const SCORM_COURSE_ASSET_ID = '7e000000-7000-4000-8000-000000000101';
const SCORM_COURSE_VERSION_ID = '7e000000-8000-4000-8000-000000000101';

async function ensurePackageAsset(assetId: string, title: string, description: string) {
  const existing = await db.select({ id: asset.id }).from(asset).where(eq(asset.id, assetId));

  if (existing.length > 0) {
    console.log(`   ✓ SCORM package asset "${title}" already exists, skipping`);
    return;
  }

  await db.insert(asset).values({
    id: assetId,
    organizationId: ENTERPRISE_ORG_ID,
    kind: 'scorm',
    provider: 'upload',
    storageProvider: 's3',
    storageKey: `scorm/${assetId}`,
    mimeType: 'application/zip',
    title,
    description,
    isExternal: false,
    status: 'active',
    createdByProfileId: ENTERPRISE_ADMIN_USER_ID
  });
  console.log(`   ✓ Inserted SCORM package asset "${title}"`);
}

async function ensurePackageVersion(versionId: string, assetId: string, title: string, modules: string[]) {
  const existing = await db
    .select({ id: contentPackageVersion.id })
    .from(contentPackageVersion)
    .where(eq(contentPackageVersion.id, versionId));

  if (existing.length > 0) {
    console.log(`   ✓ Package version for "${title}" already exists, skipping`);
    return;
  }

  await db.insert(contentPackageVersion).values({
    id: versionId,
    assetId,
    versionNumber: 1,
    isCurrent: true,
    status: 'ready',
    format: 'scorm2004_4',
    title,
    warnings: [],
    uploadKey: `scorm/${assetId}/v1.zip`,
    contentPrefix: `scorm/${assetId}/v1`,
    zipBytes: 1024,
    extractedBytes: 2048,
    fileCount: modules.length + 1,
    createdByProfileId: ENTERPRISE_ADMIN_USER_ID
  });
  await db.insert(contentPackageUnit).values(
    modules.map((moduleTitle, index) => ({
      packageVersionId: versionId,
      identifier: `sco-${index + 1}`,
      title: moduleTitle,
      position: index + 1,
      unitType: 'sco',
      href: `sco-${index + 1}.html`
    }))
  );
  console.log(`   ✓ Inserted package version for "${title}"`);
}

async function ensureActivityAttachment(activityId: string, assetId: string) {
  const existing = await db
    .select({ activityId: activityScorm.activityId })
    .from(activityScorm)
    .where(eq(activityScorm.activityId, activityId));

  if (existing.length > 0) return;

  await db.insert(activityScorm).values({ activityId, assetId });
  await db.insert(assetUsage).values({
    organizationId: ENTERPRISE_ORG_ID,
    assetId,
    targetType: 'activity',
    targetId: activityId,
    slotType: 'activity_package',
    createdByProfileId: ENTERPRISE_ADMIN_USER_ID
  });
}

/**
 * Opt-in demo data for SCORM packages. Adds one SCORM item to HIPAA Awareness
 * 2026 and one SCORM-format course to Coursera Test. Existing seed data is
 * left untouched. Runs only when `SEED_SCORM=true`.
 */
export async function seedScormActivities() {
  const hipaaCourses = await db.select({ id: course.id }).from(course).where(eq(course.id, HIPAA_COURSE_ID));
  if (hipaaCourses.length === 0) {
    console.log('   ⏭️  Skipping SCORM seed: HIPAA Awareness 2026 is not seeded');
    return;
  }

  await ensurePackageAsset(
    HIPAA_ASSET_ID,
    'Protecting patient information',
    'Seeded SCORM package for HIPAA Awareness 2026.'
  );
  await ensurePackageAsset(
    SCORM_COURSE_ASSET_ID,
    'Workplace safety library',
    'Seeded SCORM package for the demo SCORM course.'
  );

  await ensurePackageVersion(HIPAA_VERSION_ID, HIPAA_ASSET_ID, 'Protecting patient information', [
    'Privacy rule essentials',
    'Breach notification walkthrough'
  ]);
  await ensurePackageVersion(SCORM_COURSE_VERSION_ID, SCORM_COURSE_ASSET_ID, 'Workplace safety library', [
    'Safety orientation',
    'Hazard reporting',
    'Emergency procedures'
  ]);

  const hipaaActivities = await db
    .select({ id: courseActivity.id })
    .from(courseActivity)
    .where(eq(courseActivity.id, HIPAA_ACTIVITY_ID));
  if (hipaaActivities.length === 0) {
    await db.insert(courseActivity).values({
      id: HIPAA_ACTIVITY_ID,
      courseId: HIPAA_COURSE_ID,
      sectionId: HIPAA_SECTION_ID,
      kind: 'scorm',
      title: 'Protecting patient information',
      slug: 'protecting-patient-information',
      order: 3,
      isUnlocked: true,
      createdByProfileId: ENTERPRISE_ADMIN_USER_ID
    });
    console.log('   ✓ Inserted HIPAA SCORM activity');
  } else {
    console.log('   ✓ HIPAA SCORM activity already exists, skipping');
  }
  await ensureActivityAttachment(HIPAA_ACTIVITY_ID, HIPAA_ASSET_ID);

  const scormGroups = await db.select({ id: group.id }).from(group).where(eq(group.id, SCORM_COURSE_GROUP_ID));
  if (scormGroups.length === 0) {
    await db.insert(group).values({
      id: SCORM_COURSE_GROUP_ID,
      name: 'Workplace safety library',
      description: 'Seeded demo SCORM course.',
      organizationId: ENTERPRISE_ORG_ID
    });
    console.log('   ✓ Inserted demo SCORM course group');
  }

  const scormCourses = await db.select({ id: course.id }).from(course).where(eq(course.id, SCORM_COURSE_ID));
  if (scormCourses.length === 0) {
    await db.insert(course).values({
      id: SCORM_COURSE_ID,
      title: 'Workplace safety library',
      description: 'Seeded demo course that holds one SCORM package.',
      overview: '<p>Seeded demo course that holds one SCORM package.</p>',
      groupId: SCORM_COURSE_GROUP_ID,
      isTemplate: false,
      slug: 'workplace-safety-library',
      cost: 0,
      currency: 'USD',
      isPublished: true,
      certificate: { isDownloadable: false, theme: 'professional' },
      status: 'ACTIVE',
      type: 'SELF_PACED',
      format: 'scorm'
    });
    console.log('   ✓ Inserted demo SCORM course');
  } else {
    console.log('   ✓ Demo SCORM course already exists, skipping');
  }

  const scormActivities = await db
    .select({ id: courseActivity.id })
    .from(courseActivity)
    .where(eq(courseActivity.id, SCORM_COURSE_ACTIVITY_ID));
  if (scormActivities.length === 0) {
    await db.insert(courseActivity).values({
      id: SCORM_COURSE_ACTIVITY_ID,
      courseId: SCORM_COURSE_ID,
      sectionId: null,
      kind: 'scorm',
      title: 'Workplace safety library',
      slug: 'workplace-safety-library',
      order: 1,
      isUnlocked: true,
      createdByProfileId: ENTERPRISE_ADMIN_USER_ID
    });
    console.log('   ✓ Inserted demo SCORM course activity');
  } else {
    console.log('   ✓ Demo SCORM course activity already exists, skipping');
  }
  await ensureActivityAttachment(SCORM_COURSE_ACTIVITY_ID, SCORM_COURSE_ASSET_ID);
}
