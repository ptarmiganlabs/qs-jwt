import { Option } from 'commander';

import { logger } from '../../globals.js';
import { jwtCreateQscloud } from '../cmd/create-qscloud.js';
import { createCloudAssertOptions } from '../util/assert-options.js';

/**
 * Action handler for the create-qscloud command.
 *
 * @param {object} options - Parsed CLI options.
 * @param {object} command - Commander command object.
 */
const handleCreateQscloud = async (options, command) => {
    try {
        createCloudAssertOptions(options);

        const res = await jwtCreateQscloud(options, command);
        logger.debug(`Call to jwtCreateQscloud succeeded: ${res}`);
    } catch (err) {
        logger.error(`MAIN jwt create: ${err}`);
    }
};

/**
 * Sets up the create-qscloud command on the given program.
 *
 * @param {import('commander').Command} program - Commander program to attach the command to.
 */
const setupCreateQscloudCommand = (program) => {
    program
        .command('create-qscloud')
        .allowExcessArguments(false)
        .description('Create a JWT for use with Qlik Sense Cloud.')
        .action(handleCreateQscloud)
        .addOption(
            new Option('--loglevel <level>', 'Logging level')
                .choices(['error', 'warn', 'info', 'verbose', 'debug'])
                .default('info')
        )
        .option('--useremail <email>', 'Email address that will be embedded in the JWT')
        .requiredOption(
            '--useremail-verified <name>',
            'Claim indicating that the creator of the JWT has verified that the email address belongs to the user.'
        )
        .option('--username <name>', 'User name (e.g. John Smith) that will be embedded in the JWT')
        .option('--groups <groups...>', 'Groups associated with the user. ')
        .requiredOption(
            '--issuer <issuer>',
            'JWT Issuer field. Must match the issuer in the Qlik Sense Cloud JWT IdP.'
        )
        .requiredOption(
            '--keyid <id>',
            'JWT key ID. Must match the Key ID in the Qlik Sense Cloud JWT IdP.'
        )
        .requiredOption(
            '--expires <time>',
            'Time during which the JWT will be valid. Examples: 60m (60 minutes), 48h (48 hours), 365d (365 days), 5y (5 years).'
        )
        .option(
            '--cert-privatekey-file <file>',
            'File containing private key of certificate that will be used to sign the JWT.'
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
        .option('--cert-file-prefix <prefix>', 'Prefix to place before certificate file names.', '')
        .addOption(
            new Option(
                '--cert-create-expires-days <days>',
                'Number of days the new certificate should be valid for'
            ).argParser((value) => Number.parseInt(value, 10))
        )
        .option(
            '--minimal-output',
            'Output only the JWT token, without any additional info. Useful with log level warn or error'
        );
};

export { setupCreateQscloudCommand, handleCreateQscloud };
