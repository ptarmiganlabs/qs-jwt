import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../globals.js', () => ({
    logger: {
        error: vi.fn(),
        verbose: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
    },
}));

import { createQseowAssertOptions, createCloudAssertOptions } from '../create-assert-options.js';
import { logger } from '../../globals.js';

describe('create-assert-options', () => {
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
    });
});
