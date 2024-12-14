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
    console.log('\n');

    spinner.start('Scaffolding project....');

    try {
      console.log('\n');

      await scaffoldTemplate({ template, courses, projectPath, projectName });

      spinner.succeed(`${chalk.green('Done! Your template is ready.')}`);
      console.log(
        `\nTo get started:\n\n${chalk.green(`cd ${projectName}`)}\n${chalk.green(
          'pnpm i'
        )}\n${chalk.green('pnpm run dev')}`
      );

      console.log(`\nDM on X if you face any issues: https://x.com/rotimi_best`);
    } catch (error) {
      spinner.fail(chalk.red(`Failed to scaffold the project. ${error}`));
      process.exit(1);
    }
  });

program.parse(process.argv);
