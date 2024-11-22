#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import inquirer from 'inquirer';
import ora from 'ora';
import path from 'path';
import { scaffoldTemplate } from '../lib/scaffoldTemplate';

function getTemplateNames(): string[] {
  const srcPath = path.join(process.cwd(), 'src');

  if (!fs.existsSync(srcPath)) {
    return [];
  }

  const files = fs
    .readdirSync(srcPath)
    .filter((file: string) => fs.statSync(path.join(srcPath, file)).isDirectory());

  return files;
}
const spinner = ora();

const templates = getTemplateNames();

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
        `To get started,  ${chalk.blue('cd into your project')} then run ${chalk.blue(
          'npm install'
        )}`
      );
      console.log(`Now run ${chalk.blue('npm run dev')}`);
      chalk.blue('Happy hacking ');
    } catch (error) {
      spinner.fail(chalk.red(`Failed to scaffold the project. ${error}`));
      process.exit(1);
    }
  });

program.parse(process.argv);
