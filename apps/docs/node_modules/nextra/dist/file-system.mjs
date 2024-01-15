// src/file-system.ts
import fs from "graceful-fs";
import * as findPagesDirImport from "next/dist/lib/find-pages-dir.js";
import { CWD } from "./constants.mjs";
import { getDefault } from "./utils.mjs";
var { findPagesDir } = getDefault(findPagesDirImport);
var { existsSync } = fs;
function findPagesDirectory() {
  const res = findPagesDir(CWD);
  return res.pagesDir || // next v13
  res.pages;
}
var PAGES_DIR = process.env.VITEST_WORKER_ID ? "" : findPagesDirectory();
export {
  PAGES_DIR,
  existsSync,
  findPagesDirectory
};
