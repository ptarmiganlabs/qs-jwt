/**
 * Utility module to provide a compatible import.meta.url equivalent in CJS bundles.
 *
 * This module creates a URL object that represents the current file's path,
 * which can be used in a similar way to import.meta.url in ES modules.
 * This is necessary when esbuild bundles ESM source code into a CJS output
 * (required for Node.js SEA), where import.meta.url is not available.
 *
 * @module import-meta-url
 */
const { createRequire } = require('node:module');
require = createRequire(__filename);
export var import_meta_url = require('url').pathToFileURL(__filename);
