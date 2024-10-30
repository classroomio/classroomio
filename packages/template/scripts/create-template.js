const inquirer = require('inquirer');
const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

const templates = ['webflow-saas', 'posthog-saas', 'classic', 'minimalist'];

async function createTemplate() {
  const { template, projectName } = await inquirer.prompt([
    {
      type: 'list',
      name: 'template',
      message: 'Which template would you like to use?',
      choices: templates
    },
    {
      type: 'input',
      name: 'projectName',
      message: 'What is the name of your project?',
      default: 'my-classroomio-app'
    }
  ]);

  const targetDir = path.join(process.cwd(), projectName);

  console.log('Creating SvelteKit project...');
  execSync(`npm create svelte@latest ${projectName}`, { stdio: 'inherit' });

  console.log('Installing dependencies...');
  process.chdir(targetDir);
  execSync('npm install', { stdio: 'inherit' });
  execSync('npm install -D tailwindcss postcss autoprefixer', { stdio: 'inherit' });
  execSync('npx tailwindcss init -p', { stdio: 'inherit' });

  console.log('Applying template...');
  const templateDir = path.join(__dirname, 'templates', template);
  await fs.copy(templateDir, targetDir, { overwrite: true });

  console.log(`Template '${template}' has been applied to ${targetDir}`);
}

createTemplate();
