import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { copyCoursesFolder } from '../utils/copyCoursesFolder';
import { copyFolderSync } from '../utils/copyFolder';

// Define the interface for function parameters
interface ScaffoldTemplateParams {
  template: string; // Template name
  courses: boolean; // Whether to include demo courses
  projectPath: string; // Path to the project
  projectName: string; // Name of the project
}

// Using require.resolve() instead of import.meta.url for better compatibility
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

  // Path to the entire template directory
  const templateDirPath: string = path.resolve(packageRoot, 'src', 'template');

  const coursePathToExclude: string = path.join(templateDirPath, 'src', 'courses');
  // Check if the template directory exists
  if (!fs.existsSync(templateDirPath)) {
    throw new Error(`Template directory does not exist at "${templateDirPath}".`);
  }

  // Path to the specific template within the components directory
  const specificTemplatePath: string = path.resolve(
    templateDirPath,
    'src',
    'lib',
    'components',
    template
  );

  // Check if the specific template exists
  if (!fs.existsSync(specificTemplatePath)) {
    throw new Error(`Template "${template}" does not exist at "${specificTemplatePath}".`);
  }

  // Get all templates in the components directory
  const allTemplates = fs
    .readdirSync(path.join(templateDirPath, 'src', 'lib', 'components'))
    .filter((file) =>
      fs.statSync(path.join(templateDirPath, 'src', 'lib', 'components', file)).isDirectory()
    );

  // Exclude all templates except the selected one and the ui folder
  const excludeTemplates = allTemplates.filter((temp) => temp !== template && temp !== 'ui');

  // Copy the selected template files to the project path, excluding others
  await copyFolderSync({
    from: templateDirPath,
    to: projectPath,
    excludeNames: ['node_modules', ...excludeTemplates], // Exclude node_modules if present
    excludePath: coursePathToExclude
  });

  // If the user wants demo courses, copy the courses folder
  spinner.text = chalk.yellow('Setting up courses folder...');
  await copyCoursesFolder({ templatePath: templateDirPath, projectPath, courses });
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
