import { preprocess } from 'svelte/compiler'
import { pathToFileURL } from 'url'

const { source, filename, svelteConfig, showConsoleLog } = process.env

// convert option string to boolean
const showConsoleLogOption = showConsoleLog && showConsoleLog.toLowerCase() === 'true'

// redefine console.log to hide its output, so it does not interfere with the svelte-compiler
if (!showConsoleLogOption && console) {
  console.log = console.error = console.info = console.debug = console.warn = console.trace = console.dir = console.dirxml = console.group = console.groupEnd = console.time = console.timeEnd = console.assert = console.profile = () => {}
}

import(pathToFileURL(svelteConfig)).then(configImport => {
  // ESM or CommonJS
  const config = configImport.default ? configImport.default : configImport

  preprocess(source, config.preprocess || {}, { filename }).then((r) => {
    process.stdout.write(JSON.stringify(r))
  })
}).catch(err => process.stderr.write(err))
