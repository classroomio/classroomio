#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import path from 'path';
import { scaffoldTemplate } from '../lib/scaffoldTemplate';

const spinner = ora();

const templates = ['calcom', 'webflow-saas', 'posthog-saas', 'classic', 'minimalist'];

program.version('1.0.0').description('ClassroomIO CLI');

program
  .argument('[projectName]', 'name of the project')
  .option('-t, --template <template>', 'name of the template')
  .option('-c, --courses', 'use demo courses')
  .action(async (projectName, option) => {
    let { template, courses } = option;

    if (!projectName) {
      const answer = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: 'Enter the project name',
          default: '.',
          when: !projectName
        }
      ]);
      projectName = answer.projectName;
    }
    const projectPath =
      projectName === '.' ? process.cwd() : path.resolve(process.cwd(), projectName);

    if (!template) {
      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'template',
          message: 'Select a template',
          choices: templates,
          default: templates[0]
        }
      ]);
      template = answer.template;
    }

    if (courses === undefined) {
      const answer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'course',
          message: 'Would you like to use our demo courses',
          default: true
        }
      ]);
      courses = answer.course;
    }

    spinner.start('Scaffolding project....');

    try {
      await scaffoldTemplate({ template, courses, projectPath, projectName });
      spinner.succeed(chalk.green('Done! Your project is ready.'));
      console.log(
        `To get started,  ${chalk.blue(
          'cd into your project'
        )} then run ${chalk.blue('npm install')}`
      );
      console.log(`Now run ${chalk.blue('npm run dev')}`);
      chalk.blue('Happy hacking ');
    } catch (error) {
      spinner.fail(chalk.red(`Failed to scaffold the project. ${error}`));
      process.exit(1);
    }
  });

program.parse(process.argv);

// async function createTemplate() {
//   const { template, projectName } = await inquirer.prompt([
//     {
//       type: 'list',
//       name: 'template',
//       message: 'Which template would you like to use?',
//       choices: templates
//     },
//     {
//       type: 'input',
//       name: 'projectName',
//       message: 'What is the name of your project?',
//       default: 'my-classroomio-app'
//     }
//   ]);

//   const targetDir = path.join(process.cwd(), projectName);

//   console.log('Creating SvelteKit project...');
//   execSync(`npm create svelte@latest ${projectName}`, { stdio: 'inherit' });

//   console.log('Installing dependencies...');
//   process.chdir(targetDir);
//   execSync('npm install', { stdio: 'inherit' });
//   execSync('npm install -D tailwindcss postcss autoprefixer', { stdio: 'inherit' });
//   execSync('npx tailwindcss init -p', { stdio: 'inherit' });

//   console.log('Applying template...');
//   const templateDir = path.join(__dirname, 'templates', template);
//   await fs.copy(templateDir, targetDir, { overwrite: true });

//   console.log(`Template '${template}' has been applied to ${targetDir}`);
// }

// createTemplate();
