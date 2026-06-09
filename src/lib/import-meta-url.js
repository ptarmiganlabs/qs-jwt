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
import { pathToFileURL } from 'node:url';

export const import_meta_url = pathToFileURL(__filename);
