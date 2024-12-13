#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import path from 'path';
import TEMPLATES from '../templates.json';
import { scaffoldTemplate } from '../lib/scaffoldTemplate';

const spinner = ora();

const templates = TEMPLATES.map((template) => template.name);

program.version('0.0.1').description('Courseapp CLI');

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
          message: 'Would you like to use our demo courses?',
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
        `To get started:\n${chalk.blue(`cd ${projectName}`)}\n${chalk.blue('pnpm i')}\n${chalk.blue(
          'pnpm run dev'
        )}`
      );

      chalk.blue('Happy hacking ;)');
    } catch (error) {
      spinner.fail(chalk.red(`Failed to scaffold the project. ${error}`));
      process.exit(1);
    }
  });

program.parse(process.argv);
