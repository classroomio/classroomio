export type TemplateType =
  | 'calcom'
  | 'webflow-saas'
  | 'posthog-saas'
  | 'classic'
  | 'minimalist'
  | 'calcom'
  | 'default';

export interface CopyFolderParams {
  from: string;
  to: string;
  excludeNames?: string[];
  excludePath?: string | null;
}

export interface CopyCourseFolderParams {
  templatePath: string;
  projectPath: string;
  courses: boolean;
}
