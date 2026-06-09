import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../globals.js', () => ({
    logger: {
        error: vi.fn(),
        verbose: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
    },
}));

import { verifyCertificatesExist } from '../certificates.js';
import { logger } from '../../globals.js';

describe('certificates', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('verifyCertificatesExist', () => {
        it('should return true when cert file exists', async () => {
            const options = { certPrivatekeyFile: 'package.json' };
            const result = await verifyCertificatesExist(options);
            expect(result).toBe(true);
            expect(logger.verbose).toHaveBeenCalledWith(
                expect.stringContaining('exists')
            );
        });

        it('should return false when cert file does not exist', async () => {
            const options = { certPrivatekeyFile: '/nonexistent/path/key.pem' };
            const result = await verifyCertificatesExist(options);
            expect(result).toBe(false);
            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining('missing')
            );
        });

        it('should return false when options.certPrivatekeyFile is undefined', async () => {
            const options = {};
            const result = await verifyCertificatesExist(options);
            expect(result).toBe(false);
        });

        it('should handle errors gracefully', async () => {
            const options = { certPrivatekeyFile: null };
            const result = await verifyCertificatesExist(options);
            expect(result).toBe(false);
        });
    });
});
