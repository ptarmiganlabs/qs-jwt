const path = require('path');
const { promises: Fs } = require('fs');

const { logger } = require('../globals');

/**
 *
 * @param {*} path
 * @returns
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
 *
 * @param {*} options
 * @returns
 */
const verifyCertificatesExist = (options) =>
    // eslint-disable-next-line no-unused-vars
    new Promise(async (resolve, reject) => {
        try {
            logger.verbose('Checking if signing certificates exists');

            // const certFile = path.resolve(__dirname, options.certfile);
            // const certKeyFile = path.resolve(__dirname, options.certprivatekeyfile);
            const certKeyFile = path.resolve(options.certPrivatekeyFile);

            // const certExists = await exists(certFile);
            const certKeyExists = await exists(certKeyFile);

            // if (certExists === true) {
            //     logger.verbose(`Certificate file ${certFile} exists`);
            // } else {
            //     logger.error(`Certificate file ${certFile} missing`);
            //     resolve(false);
            // }

            if (certKeyExists === true) {
                logger.verbose(`Certificate key file ${certKeyFile} exists`);
            } else {
                logger.error(`Certificate key file ${certKeyFile} missing`);
                resolve(false);
            }

            resolve(true);
        } catch (err) {
            logger.error(`CERT CHECK: ${JSON.stringify(err, null, 2)}`);
            resolve(false);
        }
    });

module.exports = {
    verifyCertificatesExist,
};
