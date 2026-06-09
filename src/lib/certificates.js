import path from 'node:path';
import { promises as Fs } from 'node:fs';

import { logger } from '../globals.js';

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
const verifyCertificatesExist = (options) =>
    new Promise((resolve) => {
        (async () => {
            try {
                logger.verbose('Checking if signing certificates exists');

                const certKeyFile = path.resolve(options.certPrivatekeyFile);

                const certKeyExists = await exists(certKeyFile);

                if (certKeyExists === true) {
                    logger.verbose(`Certificate key file ${certKeyFile} exists`);
                    resolve(true);
                    return;
                }

                logger.error(`Certificate key file ${certKeyFile} missing`);
                resolve(false);
            } catch (err) {
                logger.error(`CERT CHECK: ${JSON.stringify(err, null, 2)}`);
                resolve(false);
            }
        })();
    });

export { verifyCertificatesExist };
