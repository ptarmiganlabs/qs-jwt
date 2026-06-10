import { Command } from 'commander';
import { appVersion } from './globals.js';

import { setupCreateQseowCommand } from './lib/cli/create-qseow.js';
import { setupCreateQscloudCommand } from './lib/cli/create-qscloud.js';
import { setupDecodeCommand } from './lib/cli/decode.js';

/**
 * Creates and configures the Commander program.
 *
 * @returns {Command} Configured Commander program.
 */
const createProgram = () => {
    const program = new Command();

    program
        .version(appVersion)
        .name('qs-jwt')
        .description(
            'This is a tool that creates JWTs (JSON Web Tokens) that can be used with Qlik Sense Enterprise on Windows (self-managed) as well as Qlik Sense Cloud/SaaS.\nThe JWTs can be used when accessing Sense APIs from third party applications and services.\nJWTs are usually preferred over certificates as JWTs embed a specific user, which means access control can be applied when JWTs are used. '
        );

    setupCreateQseowCommand(program);
    setupCreateQscloudCommand(program);
    setupDecodeCommand(program);

    return program;
};

/**
 * Runs the CLI application.
 *
 * @param {string[]} [argv] - Command line arguments.
 * @returns {Promise<void>}
 */
const run = async (argv = process.argv) => {
    const program = createProgram();
    await program.parseAsync(argv);
};

run();

export { createProgram, run };
