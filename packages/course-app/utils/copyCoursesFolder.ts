import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { copyFolderSync } from './copyFolder';
import { CopyCourseFolderParams } from './types';

export async function copyCoursesFolder({
  templatePath,
  projectPath,
  courses
}: CopyCourseFolderParams): Promise<void> {
  console.log('include contents', courses);
  const from = path.join(templatePath, 'src/lib/courses');
  const to = path.join(projectPath, 'src/lib/courses');

  // Create the 'courses' folder if it doesn't exist
  fs.mkdirSync(to, { recursive: true });

  if (courses && fs.existsSync(from)) {
    // Copy all contents of the courses folder if courses is true
    await copyFolderSync({ from, to });
  } else {
    // Just create an empty 'courses' folder, without copying any content
    console.log(chalk.yellow(`Created empty courses folder at: ${to}`));
  }
}
