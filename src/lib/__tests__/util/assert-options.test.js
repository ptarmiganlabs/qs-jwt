import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../../globals.js', () => ({
    logger: {
        error: vi.fn(),
        verbose: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
    },
}));

import {
    createQseowAssertOptions,
    createCloudAssertOptions,
    createDecodeAssertOptions,
} from '../../util/assert-options.js';
import { logger } from '../../../globals.js';

describe('util/assert-options', () => {
    let originalExit;

    beforeEach(() => {
        originalExit = process.exit;
        process.exit = vi.fn();
        vi.clearAllMocks();
    });

    afterEach(() => {
        process.exit = originalExit;
    });

    describe('createQseowAssertOptions', () => {
        it('should not exit when certCreate is false', () => {
            const options = { certCreate: 'false' };
            createQseowAssertOptions(options);
            expect(process.exit).not.toHaveBeenCalled();
        });

        it('should not exit when certCreate is undefined', () => {
            const options = {};
            createQseowAssertOptions(options);
            expect(process.exit).not.toHaveBeenCalled();
        });

        it('should exit when certCreate is true but certCreateExpiresDays is missing', () => {
            const options = { certCreate: 'true' };
            createQseowAssertOptions(options);
            expect(process.exit).toHaveBeenCalledWith(1);
            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining('--cert-create-expires-days is missing')
            );
        });

        it('should exit when certCreate is true and certCreateExpiresDays is NaN', () => {
            const options = { certCreate: true, certCreateExpiresDays: NaN };
            createQseowAssertOptions(options);
            expect(process.exit).toHaveBeenCalledWith(1);
            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining('must be an integer')
            );
        });

        it('should not exit when certCreate is true and certCreateExpiresDays is valid', () => {
            const options = { certCreate: 'true', certCreateExpiresDays: 365 };
            createQseowAssertOptions(options);
            expect(process.exit).not.toHaveBeenCalled();
        });
    });

    describe('createCloudAssertOptions', () => {
        it('should not exit when certCreate is false', () => {
            const options = { certCreate: 'false' };
            createCloudAssertOptions(options);
            expect(process.exit).not.toHaveBeenCalled();
        });

        it('should exit when certCreate is true but certCreateExpiresDays is missing', () => {
            const options = { certCreate: 'true' };
            createCloudAssertOptions(options);
            expect(process.exit).toHaveBeenCalledWith(1);
            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining('--cert-create-expires-days is missing')
            );
        });

        it('should exit when certCreate is true and certCreateExpiresDays is NaN', () => {
            const options = { certCreate: true, certCreateExpiresDays: NaN };
            createCloudAssertOptions(options);
            expect(process.exit).toHaveBeenCalledWith(1);
            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining('must be an integer')
            );
        });

        it('should not exit when certCreate is true and certCreateExpiresDays is valid', () => {
            const options = { certCreate: 'true', certCreateExpiresDays: 30 };
            createCloudAssertOptions(options);
            expect(process.exit).not.toHaveBeenCalled();
        });

        it('should exit when useremail is provided without useremailVerified', () => {
            const options = { useremail: 'test@example.com' };
            createCloudAssertOptions(options);
            expect(process.exit).toHaveBeenCalledWith(1);
            expect(logger.error).toHaveBeenCalledWith(
                '--useremail-verified is required when --useremail is provided.'
            );
        });

        it('should not exit when useremail and useremailVerified are both omitted', () => {
            const options = { certCreate: 'false' };
            createCloudAssertOptions(options);
            expect(process.exit).not.toHaveBeenCalled();
        });

        it('should not exit when useremailVerified is explicitly false', () => {
            const options = { useremail: 'test@example.com', useremailVerified: 'false' };
            createCloudAssertOptions(options);
            expect(process.exit).not.toHaveBeenCalled();
        });
    });

    describe('createDecodeAssertOptions', () => {
        it('should not exit when jwt is provided', () => {
            const options = { jwt: 'header.payload.signature' };
            createDecodeAssertOptions(options);
            expect(process.exit).not.toHaveBeenCalled();
        });

        it('should not exit when jwtFile is provided', () => {
            const options = { jwtFile: '/path/to/jwt.txt' };
            createDecodeAssertOptions(options);
            expect(process.exit).not.toHaveBeenCalled();
        });

        it('should exit when neither jwt nor jwtFile is provided', () => {
            const options = {};
            createDecodeAssertOptions(options);
            expect(process.exit).toHaveBeenCalledWith(1);
            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining('Either --jwt or --jwt-file must be provided')
            );
        });

        it('should exit when both jwt and jwtFile are provided', () => {
            const options = { jwt: 'header.payload.signature', jwtFile: '/path/to/jwt.txt' };
            createDecodeAssertOptions(options);
            expect(process.exit).toHaveBeenCalledWith(1);
            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining('Only one of --jwt or --jwt-file')
            );
        });

        it('should exit when expectedAudience is provided without public key', () => {
            const options = { jwt: 'header.payload.signature', expectedAudience: 'test-aud' };
            createDecodeAssertOptions(options);
            expect(process.exit).toHaveBeenCalledWith(1);
            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining('--expected-audience requires a public key')
            );
        });

        it('should not exit when expectedAudience is provided with certPublickey', () => {
            const options = {
                jwt: 'header.payload.signature',
                expectedAudience: 'test-aud',
                certPublickey: '-----BEGIN PUBLIC KEY-----\ntest\n-----END PUBLIC KEY-----',
            };
            createDecodeAssertOptions(options);
            expect(process.exit).not.toHaveBeenCalled();
        });

        it('should not exit when expectedAudience is provided with certPublickeyFile', () => {
            const options = {
                jwt: 'header.payload.signature',
                expectedAudience: 'test-aud',
                certPublickeyFile: '/path/to/public.pem',
            };
            createDecodeAssertOptions(options);
            expect(process.exit).not.toHaveBeenCalled();
        });
    });
});
