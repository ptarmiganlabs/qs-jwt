import { logger } from '../../globals.js';

/**
 * Validates CLI options for the create-qseow command.
 * Exits the process if required certificate creation options are missing or invalid.
 *
 * @param {object} options - Parsed CLI options.
 */
const createQseowAssertOptions = (options) => {
    // If certificates are to be created: Ensure all required field are present with valid values
    if (options.certCreate === true || options.certCreate === 'true') {
        // Ensure --cert-create-expires-days has valid number
        if (!options.certCreateExpiresDays) {
            logger.error(
                '--cert-create-expires-days is missing or invalid. Use it to specify how long the created certificate should be valid.'
            );
            process.exit(1);
        }
        if (Number.isNaN(options.certCreateExpiresDays)) {
            logger.error('--cert-create-expires-days must be an integer');
            process.exit(1);
        }
    }
};

/**
 * Validates CLI options for the create-qscloud command.
 * Exits the process if required certificate creation options are missing or invalid.
 *
 * @param {object} options - Parsed CLI options.
 */
const createCloudAssertOptions = (options) => {
    // If certificates are to be created: Ensure all required field are present with valid values
    if (options.certCreate === true || options.certCreate === 'true') {
        // Ensure --cert-create-expires-days has valid number
        if (!options.certCreateExpiresDays) {
            logger.error(
                '--cert-create-expires-days is missing or invalid. Use it to specify how long the created certificate should be valid.'
            );
            process.exit(1);
        }
        if (Number.isNaN(options.certCreateExpiresDays)) {
            logger.error('--cert-create-expires-days must be an integer');
            process.exit(1);
        }
    }
};

/**
 * Validates CLI options for the decode command.
 * Exits the process if required options are missing or invalid.
 *
 * @param {object} options - Parsed CLI options.
 */
const createDecodeAssertOptions = (options) => {
    const hasJwt = options.jwt && options.jwt.length > 0;
    const hasJwtFile = options.jwtFile && options.jwtFile.length > 0;

    if (!hasJwt && !hasJwtFile) {
        logger.error('Either --jwt or --jwt-file must be provided.');
        process.exit(1);
    }

    if (hasJwt && hasJwtFile) {
        logger.error('Only one of --jwt or --jwt-file can be provided, not both.');
        process.exit(1);
    }

    const hasPublicKey = options.certPublickey && options.certPublickey.length > 0;
    const hasPublicKeyFile = options.certPublickeyFile && options.certPublickeyFile.length > 0;

    if (options.expectedAudience && !hasPublicKey && !hasPublicKeyFile) {
        logger.error(
            '--expected-audience requires a public key for verification. Provide --cert-publickey or --cert-publickey-file.'
        );
        process.exit(1);
    }
};

export { createQseowAssertOptions, createCloudAssertOptions, createDecodeAssertOptions };
