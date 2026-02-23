import * as z from 'zod';

/**
 * GitHub repository name validation rules:
 * - Allowed characters: A-Za-z0-9, hyphens (-), underscores (_), periods (.)
 * - Length: 1-100 characters
 * - Can start/end with hyphens, underscores, or periods
 * @see https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository
 */
const GITHUB_REPOSITORY_NAME_REGEX = /^[A-Za-z0-9_.-]+$/;
const GITHUB_REPOSITORY_NAME_MAX_LENGTH = 100;
const GITHUB_REPOSITORY_NAME_MIN_LENGTH = 1;

const reservedRepositoryNames = ['.', '..', '.git', '.github'];

/**
 * Validates a GitHub repository name (e.g. "classroomio", "my-repo", "project.v2").
 */
export const ZRepositoryName = z
  .string()
  .min(GITHUB_REPOSITORY_NAME_MIN_LENGTH, {
    message: 'validations.repository_name.too_small'
  })
  .max(GITHUB_REPOSITORY_NAME_MAX_LENGTH, {
    message: 'validations.repository_name.too_big'
  })
  .refine((val) => GITHUB_REPOSITORY_NAME_REGEX.test(val), {
    message: 'validations.repository_name.invalid_format'
  })
  .refine((val) => !reservedRepositoryNames.includes(val), {
    message: 'validations.repository_name.reserved'
  });

export type TRepositoryName = z.infer<typeof ZRepositoryName>;

/**
 * GitHub owner/username validation - same character set as repository names.
 */
const GITHUB_OWNER_REGEX = /^[A-Za-z0-9_-]+$/;
const GITHUB_OWNER_MAX_LENGTH = 39; // GitHub username max length

export const ZRepositoryOwner = z
  .string()
  .min(1, { message: 'validations.repository_owner.too_small' })
  .max(GITHUB_OWNER_MAX_LENGTH, { message: 'validations.repository_owner.too_big' })
  .refine((val) => GITHUB_OWNER_REGEX.test(val), {
    message: 'validations.repository_owner.invalid_format'
  });

export type TRepositoryOwner = z.infer<typeof ZRepositoryOwner>;

/**
 * Validates "owner/repository" format (e.g. "classroomio/classroomio").
 */
export const ZRepositoryIdentifier = z
  .string()
  .min(1)
  .refine(
    (val) => {
      const parts = val.split('/');
      if (parts.length !== 2) return false;
      const [owner, repo] = parts;
      return ZRepositoryOwner.safeParse(owner).success && ZRepositoryName.safeParse(repo).success;
    },
    { message: 'validations.repository_identifier.invalid_format' }
  );

export type TRepositoryIdentifier = z.infer<typeof ZRepositoryIdentifier>;

/**
 * Schema for parsing and validating owner and repository name from a string.
 */
export const ZRepositoryOwnerAndName = z.object({
  owner: ZRepositoryOwner,
  repo: ZRepositoryName
});

export type TRepositoryOwnerAndName = z.infer<typeof ZRepositoryOwnerAndName>;
