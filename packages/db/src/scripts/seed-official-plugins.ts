import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { sql } from 'drizzle-orm';
import { db } from '../drizzle';
import { organization, plugin, pluginGrant, pluginInstallation, pluginPublisher, pluginVersion } from '../schema';

async function main() {
  console.log('Seeding official plugins into database...');

  // 1. Ensure official publisher
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

  // 2. Load release index from classroomio-plugins
  const candidateRoots = [
    path.resolve(process.cwd(), '../../../classroomio-plugins'),
    path.resolve(process.cwd(), '../../classroomio-plugins'),
    path.resolve(process.cwd(), '../classroomio-plugins'),
    path.resolve(process.cwd(), 'classroomio-plugins')
  ];
  const pluginsRepoRoot = candidateRoots.find((dir) => fs.existsSync(dir));
  if (!pluginsRepoRoot) {
    throw new Error('Could not find classroomio-plugins directory.');
  }

  const releaseIndexPath = path.join(pluginsRepoRoot, '.plugin-artifacts', 'release-index.json');
  if (!fs.existsSync(releaseIndexPath)) {
    throw new Error(
      `Release index not found at ${releaseIndexPath}. Run "pnpm build:artifacts" in classroomio-plugins first.`
    );
  }

  const { releases } = JSON.parse(fs.readFileSync(releaseIndexPath, 'utf8')) as {
    releases: Array<{
      pluginId: string;
      version: string;
      artifactDigest: string;
      manifest: any;
    }>;
  };

  // Add declarative linkedin-sharing plugin
  const linkedinManifestPath = path.join(pluginsRepoRoot, 'linkedin-sharing', 'plugin.json');
  if (fs.existsSync(linkedinManifestPath)) {
    const linkedinManifest = JSON.parse(fs.readFileSync(linkedinManifestPath, 'utf8'));
    releases.push({
      pluginId: linkedinManifest.id,
      version: linkedinManifest.version,
      artifactDigest: '',
      manifest: linkedinManifest
    });
  }

  // 3. Register plugins and versions
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
        reviewStatus: 'approved'
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

  // 4. Fetch organizations to install for
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

      // Upsert installation
      const existingInst = await db
        .select()
        .from(pluginInstallation)
        .where(
          sql`${pluginInstallation.pluginId} = ${manifest.id} AND ${pluginInstallation.organizationId} = ${org.id}`
        )
        .limit(1);

      let installationId: string;

      if (existingInst[0]) {
        installationId = existingInst[0].id;
        await db
          .update(pluginInstallation)
          .set({
            pluginVersionId: vId,
            status: 'active',
            orgApprovalStatus: 'approved',
            updatedAt: sql`now()`
          })
          .where(sql`${pluginInstallation.id} = ${installationId}`);
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

      // Grant permissions
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

  console.log('All official plugins successfully seeded and installed!');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error seeding plugins:', err);
    process.exit(1);
  });
