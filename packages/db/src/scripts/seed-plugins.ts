import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '../drizzle';
import type { TPluginManifest } from '@cio/utils';
import { organization, plugin, pluginGrant, pluginInstallation, pluginPublisher, pluginVersion } from '../schema';

interface ReleaseIndexItem {
  pluginId: string;
  version: string;
  artifactDigest: string;
  manifest: TPluginManifest;
}

interface ReleaseIndex {
  releases: ReleaseIndexItem[];
}

async function main() {
  console.log('Seeding official plugins into database...');

  await db
    .insert(pluginPublisher)
    .values({
      id: 'classroomio',
      name: 'ClassroomIO',
      publisherClass: 'first-party',
      verified: true,
      domain: 'classroomio.com',
      status: 'active'
    })
    .onConflictDoNothing();

  const candidateRoots = [
    process.env.PLUGINS_DEV_PATH,
    path.resolve(process.cwd(), '../classroomio-plugins'),
    path.resolve(process.cwd(), '../../classroomio-plugins'),
    path.resolve(process.cwd(), 'classroomio-plugins'),
    '/Users/emmanuel/Dev/classroomio-plugins'
  ].filter(Boolean) as string[];

  const pluginsRepoRoot = candidateRoots.find((dir) => fs.existsSync(dir));
  if (!pluginsRepoRoot) {
    throw new Error('Could not find classroomio-plugins repository.');
  }

  const releaseIndexPath = path.join(pluginsRepoRoot, '.plugin-artifacts', 'release-index.json');
  if (!fs.existsSync(releaseIndexPath)) {
    throw new Error(`Release index not found at ${releaseIndexPath}. Run "pnpm pack" in classroomio-plugins first.`);
  }

  const releaseIndex = JSON.parse(fs.readFileSync(releaseIndexPath, 'utf8')) as ReleaseIndex;
  const releases = [...releaseIndex.releases];

  const versionIds = new Map<string, string>();

  for (const item of releases) {
    const { manifest, artifactDigest } = item;
    const slug = manifest.slug ?? manifest.id.replace(/^com\.classroomio\./, '');

    await db
      .insert(plugin)
      .values({
        id: manifest.id,
        slug,
        publisherId: 'classroomio',
        name: manifest.name,
        description: manifest.description ?? null,
        publisher: manifest.publisher ?? 'classroomio',
        status: 'published',
        distribution: 'public'
      })
      .onConflictDoUpdate({
        target: plugin.id,
        set: {
          slug,
          name: manifest.name,
          description: manifest.description ?? null,
          updatedAt: sql`now()`
        }
      });

    const [vRow] = await db
      .insert(pluginVersion)
      .values({
        pluginId: manifest.id,
        version: manifest.version,
        manifest,
        artifactDigest: artifactDigest || null,
        reviewStatus: 'approved',
        releasedBy: 'first-party'
      })
      .onConflictDoUpdate({
        target: [pluginVersion.pluginId, pluginVersion.version],
        set: {
          manifest,
          artifactDigest: artifactDigest || null,
          reviewStatus: 'approved'
        }
      })
      .returning();

    versionIds.set(manifest.id, vRow.id);
    console.log(`Registered plugin ${manifest.id}@${manifest.version} (digest: ${artifactDigest || 'none'})`);
  }

  const orgs = await db.select({ id: organization.id, name: organization.name }).from(organization);
  if (orgs.length === 0) {
    console.log('No organizations found in database. Plugins registered in catalog.');
    return;
  }

  for (const org of orgs) {
    console.log(`Installing plugins for organization: ${org.name} (${org.id})...`);

    for (const item of releases) {
      const { manifest } = item;
      const vId = versionIds.get(manifest.id);
      if (!vId) continue;

      const [existingInst] = await db
        .select()
        .from(pluginInstallation)
        .where(
          and(
            eq(pluginInstallation.pluginId, manifest.id),
            eq(pluginInstallation.organizationId, org.id),
            eq(pluginInstallation.ownerType, 'organization')
          )
        )
        .limit(1);

      let installationId: string;

      if (existingInst) {
        installationId = existingInst.id;
        await db
          .update(pluginInstallation)
          .set({
            pluginVersionId: vId,
            status: 'active',
            orgApprovalStatus: 'approved',
            updatedAt: sql`now()`
          })
          .where(eq(pluginInstallation.id, installationId));
      } else {
        const [newInst] = await db
          .insert(pluginInstallation)
          .values({
            pluginId: manifest.id,
            pluginVersionId: vId,
            ownerType: 'organization',
            organizationId: org.id,
            status: 'active',
            orgApprovalStatus: 'approved',
            settings: {}
          })
          .returning();
        installationId = newInst.id;
      }

      const requiredScopes = (manifest.permissions?.required ?? []) as string[];
      for (const scope of requiredScopes) {
        await db
          .insert(pluginGrant)
          .values({
            installationId,
            scope
          })
          .onConflictDoNothing();
      }
    }
  }

  console.log('All official plugins successfully seeded and installed across organizations!');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error seeding plugins:', err);
    process.exit(1);
  });
