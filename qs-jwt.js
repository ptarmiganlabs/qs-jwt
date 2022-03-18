const { Command, Option } = require('commander');
const { logger, appVersion } = require('./globals');

const { jwtCreateQseow } = require('./lib/create-qseow');
const { jwtCreateQscloud } = require('./lib/create-qscloud');
const {
    createQseowAssertOptions,
    createCloudAssertOptions,
} = require('./lib/create-assert-options');

const program = new Command();

/**
 * Top level async function.
 * Workaround to deal with the fact that Node.js doesn't currently support top level async functions.
 */
(async () => {
    // Basic app info
    program
        .version(appVersion)
        .name('qs-jwt')
        .description(
            'This is a tool that creates JWTs (JSON Web Tokens) that can be used with Qlik Sense Enterprise on Windows (self-managed) as well as Qlik Sense Cloud/SaaS.\nThe JWTs can be used when accessing Sense APIs from third party applications and services.\nJWTs are usually preferred over certuficates as JWTs embed a specific user, which means access control can be applied when JWTs are used. '
        );

    // -----------------------------
    // create-qseow
    program
        .command('create-qseow')
        .allowExcessArguments(false)
        .description(
            'Create a JWT for use with client-managed Qlik Sense (a.k.a Qlik Sense Enterprise on Windows).'
        )
        .action(async (options, command) => {
            try {
                createQseowAssertOptions(options);

                const res = await jwtCreateQseow(options, command);
                logger.debug(`Call to jwtQseowCreate succeeded: ${res}`);
            } catch (err) {
                logger.error(`MAIN jwt create: ${err}`);
            }
        })
        .addOption(
            new Option('--loglevel <level>', 'Logging level')
                .choices(['error', 'warning', 'info', 'verbose', 'debug'])
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
        );

    // -----------------------------
    // create-qscloud
    program
        .command('create-qscloud')
        .allowExcessArguments(false)
        .description('Create a JWT for use with Qlik Sense Cloud.')
        .action(async (options, command) => {
            try {
                createCloudAssertOptions(options);

                const res = await jwtCreateQscloud(options, command);
                logger.debug(`Call to jwtCreateQscloud succeeded: ${res}`);
            } catch (err) {
                logger.error(`MAIN jwt create: ${err}`);
            }
        })
        .addOption(
            new Option('--loglevel <level>', 'Logging level')
                .choices(['error', 'warning', 'info', 'verbose', 'debug'])
                .default('info')
        )
        .requiredOption('--useremail <email>', 'Email address that will be embedded in the JWT')
        .requiredOption(
            '--useremail-verified <name>',
            'Claim indicating that the creator of thw JWT has verified that the email address belongs to the user.'
        )
        .requiredOption(
            '--username <name>',
            'User name (e.g. John Smith) that will be embedded in the JWT'
        )
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
        // .option('--cert-create', 'Should a new certificate be created?', false)
        .option('--cert-file-prefix <prefix>', 'Prefix to place before certificate file names.', '')
        .addOption(
            new Option(
                '--cert-create-expires-days <days>',
                'Number of days the new certificate should be valid for'
            ).argParser(parseInt)
        );

    // Parse command line params
    await program.parseAsync(process.argv);
})();
