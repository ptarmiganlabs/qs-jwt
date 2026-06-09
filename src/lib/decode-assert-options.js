import { logger } from '../globals.js';

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

export { createDecodeAssertOptions };
