import { Option } from 'commander';

import { logger } from '../../globals.js';
import { jwtDecode } from '../cmd/decode.js';
import { createDecodeAssertOptions } from '../util/assert-options.js';

/**
 * Action handler for the decode command.
 *
 * @param {object} options - Parsed CLI options.
 * @param {object} command - Commander command object.
 */
const handleDecode = async (options, command) => {
    try {
        createDecodeAssertOptions(options);

        const res = await jwtDecode(options, command);
        logger.debug(`Call to jwtDecode succeeded: ${res}`);
    } catch (err) {
        logger.error(`MAIN jwt decode: ${err}`);
    }
};

/**
 * Sets up the decode command on the given program.
 *
 * @param {import('commander').Command} program - Commander program to attach the command to.
 */
const setupDecodeCommand = (program) => {
    program
        .command('decode')
        .allowExcessArguments(false)
        .description(
            'Decode a JWT and display its header and payload. Optionally verify the signature.'
        )
        .action(handleDecode)
        .addOption(
            new Option('--loglevel <level>', 'Logging level')
                .choices(['error', 'warn', 'info', 'verbose', 'debug'])
                .default('info')
        )
        .option('--jwt <token>', 'JWT string to decode')
        .option('--jwt-file <file>', 'File containing the JWT to decode')
        .option(
            '--cert-publickey-file <file>',
            'File containing public key for signature verification'
        )
        .option('--cert-publickey <key>', 'Public key string for signature verification')
        .option(
            '--expected-audience <audience>',
            'Expected audience value to verify (requires public key)'
        )
        .option('--minimal-output', 'Output as JSON only, without additional formatting');
};

export { setupDecodeCommand, handleDecode };
