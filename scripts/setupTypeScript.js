/**
 * Run this script to convert the project to TypeScript. This is only guaranteed to work
 * on the unmodified default template; if you have done code changes you are likely need
 * to touch up the generated project manually.
 */

// @ts-check
const fs = require("fs");
const path = require("path");
const { argv } = require("process");

const projectRoot = argv[2] || path.join(__dirname, "..");

function warn(message) {
  console.warn("Warning: " + message);
}

function replaceInFile(fileName, replacements) {
  if (fs.existsSync(fileName)) {
    let contents = fs.readFileSync(fileName, "utf8");
    let hadUpdates = false;

    replacements.forEach(([from, to]) => {
      const newContents = contents.replace(from, to);

      const isAlreadyApplied = typeof to !== "string" || contents.includes(to);

      if (newContents !== contents) {
        contents = newContents;
        hadUpdates = true;
      } else if (!isAlreadyApplied) {
        warn(`Wanted to update "${from}" in ${fileName}, but did not find it.`);
      }
    });

    if (hadUpdates) {
      fs.writeFileSync(fileName, contents);
    } else {
      console.log(`${fileName} had already been updated.`);
    }
  } else {
    warn(`Wanted to update ${fileName} but the file did not exist.`);
  }
}

function createFile(fileName, contents) {
  if (fs.existsSync(fileName)) {
    warn(
      `Wanted to create ${fileName}, but it already existed. Leaving existing file.`
    );
  } else {
    fs.writeFileSync(fileName, contents);
  }
}

function addDepsToPackageJson() {
  const pkgJSONPath = path.join(projectRoot, "package.json");
  const packageJSON = JSON.parse(fs.readFileSync(pkgJSONPath, "utf8"));
  packageJSON.devDependencies = Object.assign(packageJSON.devDependencies, {
    "@rollup/plugin-typescript": "^6.0.0",
    "@tsconfig/svelte": "^1.0.10",
    "@types/compression": "^1.7.0",
    "@types/node": "^14.11.1",
    "@types/polka": "^0.5.1",
    "svelte-check": "^1.0.46",
    "svelte-preprocess": "^4.3.0",
    tslib: "^2.0.1",
    typescript: "^4.0.3"
  });

  // Add script for checking
  packageJSON.scripts = Object.assign(packageJSON.scripts, {
    validate: "svelte-check --ignore src/node_modules/@sapper"
  });

  // Write the package JSON
  fs.writeFileSync(pkgJSONPath, JSON.stringify(packageJSON, null, "  "));
}

function changeJsExtensionToTs(dir) {
  const elements = fs.readdirSync(dir, { withFileTypes: true });

  for (let i = 0; i < elements.length; i++) {
    if (elements[i].isDirectory()) {
      changeJsExtensionToTs(path.join(dir, elements[i].name));
    } else if (elements[i].name.match(/^((?!json).)*js$/)) {
      fs.renameSync(
        path.join(dir, elements[i].name),
        path.join(dir, elements[i].name).replace(".js", ".ts")
      );
    }
  }
}

function updateSingleSvelteFile({ view, vars, contextModule }) {
  replaceInFile(path.join(projectRoot, "src", `${view}.svelte`), [
    [
      /(?:<script)(( .*?)*?)>/gm,
      (m, attrs) =>
        `<script${attrs}${!attrs.includes('lang="ts"') ? ' lang="ts"' : ""}>`
    ],
    ...(vars
      ? vars.map(({ name, type }) => [
          `export let ${name};`,
          `export let ${name}: ${type};`
        ])
      : []),
    ...(contextModule ? contextModule.map(({ js, ts }) => [js, ts]) : [])
  ]);
}

// Switch the *.svelte file to use TS
function updateSvelteFiles() {
  [
    {
      view: "components/Nav",
      vars: [{ name: "segment", type: "string" }]
    },
    {
      view: "routes/_layout",
      vars: [{ name: "segment", type: "string" }]
    },
    {
      view: "routes/_error",
      vars: [
        { name: "status", type: "number" },
        { name: "error", type: "Error" }
      ]
    },
    {
      view: "routes/blog/index",
      vars: [
        { name: "posts", type: "{ id: string; title: string, html: any }[]" }
      ],
      contextModule: [
        {
          js: ".then(r => r.json())",
          ts: ".then((r: { json: () => any; }) => r.json())"
        },
        {
          js: ".then(posts => {",
          ts: ".then((posts: { id: string; title: string, html: any }[]) => {"
        }
      ]
    },
    {
      view: "routes/blog/[id]",
      vars: [
        { name: "post", type: "{ id: string; title: string, html: any }" }
      ]
    }
  ].forEach(updateSingleSvelteFile);
}

function updateRollupConfig() {
  // Edit rollup config
  replaceInFile(path.join(projectRoot, "rollup.config.js"), [
    // Edit imports
    [
      /'rollup-plugin-terser';\n(?!import sveltePreprocess)/,
      `'rollup-plugin-terser';
import sveltePreprocess from 'svelte-preprocess';
import typescript from '@rollup/plugin-typescript';`
    ],
    // Edit inputs
    [
      /(?<!THIS_IS_UNDEFINED[^\n]*\n\s*)onwarn\(warning\);/,
      `(warning.code === 'THIS_IS_UNDEFINED') ||\n\tonwarn(warning);`
    ],
    [
      /input: config.client.input\(\)(?!\.replace)/,
      `input: config.client.input().replace(/\.js$/, '.ts')`
    ],
    [
      /input: config.server.input\(\)(?!\.replace)/,
      `input: { server: config.server.input().server.replace(/\.js$/, ".ts") }`
    ],
    [
      /input: config.serviceworker.input\(\)(?!\.replace)/,
      `input: config.serviceworker.input().replace(/\.js$/, '.ts')`
    ],
    // Add preprocess to the svelte config, this is tricky because there's no easy signifier.
    // Instead we look for 'hydratable: true,'
    [
      /hydratable: true(?!,\n\s*preprocess)/g,
      "hydratable: true,\n\t\t\t\tpreprocess: sveltePreprocess()"
    ],
    // Add TypeScript
    [
      /commonjs\(\)(?!,\n\s*typescript)/g,
      "commonjs(),\n\t\t\ttypescript({ sourceMap: dev })"
    ]
  ]);
}

function updateServiceWorker() {
  replaceInFile(path.join(projectRoot, "src", "service-worker.ts"), [
    [`shell.concat(files);`, `(shell as string[]).concat(files as string[]);`],
    [
      `'install', event =>`,
      `'install', <EventType extends ExtendableEvent>(event: EventType) =>`
    ],
    [
      `self.skipWaiting();`,
      `((self as any) as ServiceWorkerGlobalScope).skipWaiting();`
    ],
    [
      `'activate', event =>`,
      `'activate', <EventType extends ExtendableEvent>(event: EventType) =>`
    ],
    [
      `self.clients.claim();`,
      `((self as any) as ServiceWorkerGlobalScope).clients.claim();`
    ],
    [
      `'fetch', event =>`,
      `'fetch', <EventType extends FetchEvent>(event: EventType) =>`
    ]
  ]);
}

function createTsConfig() {
  const tsconfig = `{
		"extends": "@tsconfig/svelte/tsconfig.json",
		"compilerOptions": {
			"lib": ["DOM", "ES2017", "WebWorker"]
		},
		"include": ["src/**/*", "src/node_modules/**/*"],
		"exclude": ["node_modules/*", "__sapper__/*", "static/*"]
	}`;

  createFile(path.join(projectRoot, "tsconfig.json"), tsconfig);
}

// Adds the extension recommendation
function configureVsCode() {
  const dir = path.join(projectRoot, ".vscode");

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  createFile(
    path.join(projectRoot, ".vscode", "extensions.json"),
    `{"recommendations": ["svelte.svelte-vscode"]}`
  );
}

function deleteThisScript() {
  fs.unlinkSync(path.join(__filename));

  // Check for Mac's DS_store file, and if it's the only one left remove it
  const remainingFiles = fs.readdirSync(path.join(__dirname));
  if (remainingFiles.length === 1 && remainingFiles[0] === ".DS_store") {
    fs.unlinkSync(path.join(__dirname, ".DS_store"));
  }

  // Check if the scripts folder is empty
  if (fs.readdirSync(path.join(__dirname)).length === 0) {
    // Remove the scripts folder
    fs.rmdirSync(path.join(__dirname));
  }
}

console.log("Adding TypeScript with Rollup...");

addDepsToPackageJson();

changeJsExtensionToTs(path.join(projectRoot, "src"));

updateSvelteFiles();

updateRollupConfig();

updateServiceWorker();

createTsConfig();

configureVsCode();

// Delete this script, but not during testing
if (!argv[2]) {
  deleteThisScript();
}

console.log("Converted to TypeScript.");

if (fs.existsSync(path.join(projectRoot, "node_modules"))) {
  console.log(`\nYou will need to re-run 'npm install' to get started.`);
}
