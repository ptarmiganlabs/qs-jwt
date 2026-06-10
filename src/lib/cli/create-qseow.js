import { Option } from 'commander';

import { logger } from '../../globals.js';
import { jwtCreateQseow } from '../cmd/create-qseow.js';
import { createQseowAssertOptions } from '../util/assert-options.js';

/**
 * Action handler for the create-qseow command.
 *
 * @param {object} options - Parsed CLI options.
 * @param {object} command - Commander command object.
 */
const handleCreateQseow = async (options, command) => {
    try {
        createQseowAssertOptions(options);

        const res = await jwtCreateQseow(options, command);
        logger.debug(`Call to jwtCreateQseow succeeded: ${res}`);
    } catch (err) {
        logger.error(`MAIN jwt create: ${err}`);
    }
};

/**
 * Sets up the create-qseow command on the given program.
 *
 * @param {import('commander').Command} program - Commander program to attach the command to.
 */
const setupCreateQseowCommand = (program) => {
    program
        .command('create-qseow')
        .allowExcessArguments(false)
        .description(
            'Create a JWT for use with client-managed Qlik Sense (a.k.a Qlik Sense Enterprise on Windows).'
        )
        .action(handleCreateQseow)
        .addOption(
            new Option('--loglevel <level>', 'Logging level')
                .choices(['error', 'warn', 'info', 'verbose', 'debug'])
                .default('info')
        )
        .requiredOption(
            '--userdir <directory>',
            'user directory (e.g. MYDIRNAME) that will be embedded in the JWT'
        )
        .requiredOption(
            '--userid <userid>',
            'user ID (e.g. johnsmith) that will be embedded in the JWT'
        )
        .requiredOption(
            '--username <name>',
            'User name (e.g. John Smith) that will be embedded in the JWT'
        )
        .requiredOption('--useremail <email>', 'Email address that will be embedded in the JWT')
        .option('--groups <groups...>', 'Groups associated with the user dir/ID.')
        .requiredOption(
            '--expires <time>',
            'Time during which the JWT will be valid. Examples: 60m (60 minutes), 48h (48 hours), 365d (365 days), 5y (5 years)'
        )
        .requiredOption(
            '--audience <audience>',
            'JWT audience field. Audience in JWT must match the audience defined in the QSEoW virtual proxy being used'
        )
        .option(
            '--cert-privatekey-file <file>',
            'File containing private key of certificate that will be used to sign the JWT'
        )
        .option(
            '--cert-privatekey <privatekey>',
            'Private key of certificate that will be used to sign the JWT.'
        )
        .addOption(
            new Option('--cert-create [true|false]', 'Should a new certificate be created?')
                .choices(['true', 'false'])
                .default('false')
        )
        .option('--cert-file-prefix <prefix>', 'Prefix to place before certificate file names', '')
        .addOption(
            new Option(
                '--cert-create-expires-days <days>',
                'Number of days the new certificate should be valid for'
            ).argParser(parseInt)
        )
        .option(
            '--minimal-output',
            'Output only the JWT token, without any additional info. Useful with log level warn or error'
        );
};

export { setupCreateQseowCommand, handleCreateQseow };
