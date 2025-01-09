#!/usr/bin/env node
import { program as d } from "commander";
import r from "chalk";
import m from "inquirer";
import h from "ora";
import n from "path";
import a from "fs";
import { fileURLToPath as j } from "url";
async function f({
  from: o,
  to: i,
  excludeNames: t = [],
  excludePath: s = null
}) {
  a.mkdirSync(i, { recursive: !0 });
  for (const e of a.readdirSync(o)) {
    const c = n.join(o, e), l = n.join(i, e);
    if (t.includes(e)) {
      console.log(r.yellow(`skipping ${e}`));
      continue;
    }
    s && c === s || (a.lstatSync(c).isFile() ? a.copyFileSync(c, l) : await f({ from: c, to: l, excludeNames: t, excludePath: s }));
  }
}
async function S({
  templatePath: o,
  projectPath: i,
  courses: t
}) {
  console.log("include contents", t);
  const s = n.join(o, "src/courses"), e = n.join(i, "src/courses");
  a.mkdirSync(e, { recursive: !0 }), t && a.existsSync(s) ? await f({ from: s, to: e }) : console.log(r.yellow(`Created empty courses folder at: ${e}`));
}
const $ = j(import.meta.url), v = n.dirname($), T = n.join(v, ".."), y = h();
async function x({
  template: o,
  courses: i,
  projectPath: t,
  projectName: s
}) {
  y.text = r.yellow("Getting project...");
  const e = n.resolve(T, "src", "template"), c = n.join(e, "src", "courses");
  if (!a.existsSync(e))
    throw new Error(`Template directory does not exist at "${e}".`);
  const l = n.resolve(
    e,
    "src",
    "lib",
    "components",
    o
  );
  if (!a.existsSync(l))
    throw new Error(`Template "${o}" does not exist at "${l}".`);
  const g = a.readdirSync(n.join(e, "src", "lib", "components")).filter(
    (p) => a.statSync(n.join(e, "src", "lib", "components", p)).isDirectory()
  ).filter((p) => p !== o && p !== "ui");
  await f({
    from: e,
    to: t,
    excludeNames: ["node_modules", ...g],
    // Exclude node_modules if present
    excludePath: c
  }), y.text = r.yellow("Setting up courses folder..."), await S({ templatePath: e, projectPath: t, courses: i }), console.log(
    r.yellow(
      `Project ${s} created using template "${o}" ${i ? "with" : "without"} demo courses.`
    )
  ), console.log(
    r.yellow(
      `You can ${i ? "edit or create new courses in the courses folder" : "create new courses in the courses folder"}`
    )
  );
}
const u = h(), w = ["cal", "classic", "minimal", "posthog"];
d.version("1.0.0").description("ClassroomIO CLI");
d.argument("[projectName]", "name of the project").option("-t, --template <template>", "name of the template").option("-c, --courses", "use demo courses").action(async (o, i) => {
  let { template: t, courses: s } = i;
  o || (o = (await m.prompt([
    {
      type: "input",
      name: "projectName",
      message: "Enter the project name",
      default: ".",
      when: !o
    }
  ])).projectName);
  const e = o === "." ? process.cwd() : n.resolve(process.cwd(), o);
  t || (t = (await m.prompt([
    {
      type: "list",
      name: "template",
      message: "Select a template",
      choices: w,
      default: w[0]
    }
  ])).template), s === void 0 && (s = (await m.prompt([
    {
      type: "confirm",
      name: "course",
      message: "Would you like to use our demo courses",
      default: !0
    }
  ])).course), u.start("Scaffolding project....");
  try {
    await x({ template: t, courses: s, projectPath: e, projectName: o }), u.succeed(r.green("Done! Your project is ready.")), console.log(
      `To get started,  ${r.blue("cd into your project")} then run ${r.blue(
        "npm install"
      )}`
    ), console.log(`Now run ${r.blue("npm run dev")}`), r.blue("Happy hacking ");
  } catch (c) {
    u.fail(r.red(`Failed to scaffold the project. ${c}`)), process.exit(1);
  }
});
d.parse(process.argv);
