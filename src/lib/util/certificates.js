import path from 'node:path';
import { promises as Fs } from 'node:fs';

import { logger } from '../../globals.js';

/**
 * Checks whether a file exists at the given path.
 *
 * @param {string} pathToCheck - Absolute or relative path to check.
 * @returns {Promise<boolean>} True if the file exists, false otherwise.
 */
async function exists(pathToCheck) {
    try {
        await Fs.access(pathToCheck);
        return true;
    } catch {
        return false;
    }
}

/**
 * Verifies that the required certificate private key file exists on disk.
 *
 * @param {object} options - CLI options containing certPrivatekeyFile path.
 * @returns {Promise<boolean>} True if all required certificate files exist.
 */
async function verifyCertificatesExist(options) {
    try {
        logger.verbose('Checking if signing certificates exist');

        const certKeyFile = path.resolve(options.certPrivatekeyFile);
        const certKeyExists = await exists(certKeyFile);

        if (certKeyExists === true) {
            logger.verbose(`Certificate key file ${certKeyFile} exists`);
            return true;
        }

        logger.error(`Certificate key file ${certKeyFile} missing`);
        return false;
    } catch (err) {
        logger.error(`CERT CHECK: ${JSON.stringify(err, null, 2)}`);
        return false;
    }
}

export { verifyCertificatesExist };
