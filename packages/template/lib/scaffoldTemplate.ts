import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { copyCoursesFolder } from '../utils/copyCoursesFolder';
import { copyFolderSync } from '../utils/copyFolder';

// Define available templates
type TemplateType = 'calcom' | 'default'; // Add other template types as needed

// Define the TEMPLATES object with proper typing
const TEMPLATES: Record<TemplateType, string> = {
  calcom: 'calcom',
  default: 'default'
} as const;

// Define the interface for function parameters
interface ScaffoldTemplateParams {
  template: TemplateType;
  courses: boolean;
  projectPath: string;
  projectName: string;
}

// Using require.resolve() instead of import.meta.url for better compatibility
// const __filename = require.resolve('./scaffoldTemplate.ts');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.join(__dirname, '..');
const spinner = ora();

export async function scaffoldTemplate({
  template,
  courses,
  projectPath,
  projectName
}: ScaffoldTemplateParams): Promise<void> {
  spinner.text = chalk.yellow('Getting project...');
  const templatePath: string = path.resolve(packageRoot, 'templates', template);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template "${template}" "${templatePath}" "${__dirname}" does not exist.`);
  }

  if (projectPath !== process.cwd() && !fs.existsSync(projectPath)) {
    fs.mkdirSync(projectPath, { recursive: true });
  }
  const coursePathToExclude: string = path.join(templatePath, 'src/lib/courses');

  spinner.text = chalk.yellow('Copying template files...');
  await copyFolderSync({
    from: templatePath,
    to: projectPath,
    excludeNames: ['node_modules'],
    excludePath: coursePathToExclude
  });

  // Always copy the courses folder structure, conditionally copy contents
  spinner.text = chalk.yellow('Setting up courses folder...');
  await copyCoursesFolder({ templatePath, projectPath, courses });

  console.log(
    chalk.yellow(
      `Project ${projectName} created using template "${template}" ${
        courses ? 'with' : 'without'
      } demo courses.`
    )
  );
  console.log(
    chalk.yellow(
      `You can ${
        courses
          ? 'edit or create new courses in the courses folder'
          : 'create new courses in the courses folder'
      }`
    )
  );
}
