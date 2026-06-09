import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockDecode, mockVerify } = vi.hoisted(() => {
    const mockDecode = vi.fn();
    const mockVerify = vi.fn();
    return { mockDecode, mockVerify };
});

vi.mock('jsonwebtoken', () => ({
    default: {
        decode: mockDecode,
        verify: mockVerify,
    },
}));

vi.mock('node:fs', () => ({
    default: {
        readFileSync: vi.fn(),
        existsSync: vi.fn(),
    },
}));

vi.mock('../../globals.js', () => ({
    logger: {
        error: vi.fn(),
        verbose: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
    },
    setLoggingLevel: vi.fn(),
}));

import { jwtDecode } from '../decode-jwt.js';
import { logger } from '../../globals.js';
import fs from 'node:fs';

describe('decode-jwt', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('jwtDecode', () => {
        it('should decode valid JWT with --jwt option', async () => {
            const mockHeader = { alg: 'RS256', typ: 'JWT' };
            const mockPayload = {
                userId: 'testuser',
                userDirectory: 'TESTDIR',
                iat: 1717948800,
                exp: 1717952400,
            };

            mockDecode.mockReturnValue({ header: mockHeader, payload: mockPayload });

            const options = {
                loglevel: 'info',
                jwt: 'header.payload.signature',
            };

            const result = await jwtDecode(options);

            expect(result).toBe(true);
            expect(mockDecode).toHaveBeenCalledWith('header.payload.signature', { complete: true });
        });

        it('should decode JWT from file with --jwt-file option', async () => {
            const mockHeader = { alg: 'RS256', typ: 'JWT' };
            const mockPayload = { userId: 'testuser' };

            mockDecode.mockReturnValue({ header: mockHeader, payload: mockPayload });
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('header.payload.signature\n');

            const options = {
                loglevel: 'info',
                jwtFile: '/path/to/jwt.txt',
            };

            const result = await jwtDecode(options);

            expect(result).toBe(true);
            expect(fs.readFileSync).toHaveBeenCalledWith('/path/to/jwt.txt', 'utf8');
        });

        it('should return false when JWT file not found', async () => {
            fs.existsSync.mockReturnValue(false);

            const options = {
                loglevel: 'info',
                jwtFile: '/nonexistent/jwt.txt',
            };

            const result = await jwtDecode(options);

            expect(result).toBe(false);
            expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('JWT file not found'));
        });

        it('should return false when no JWT provided', async () => {
            const options = {
                loglevel: 'info',
            };

            const result = await jwtDecode(options);

            expect(result).toBe(false);
            expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('No JWT provided'));
        });

        it('should return false for malformed JWT (wrong number of parts)', async () => {
            const options = {
                loglevel: 'info',
                jwt: 'only.two',
            };

            const result = await jwtDecode(options);

            expect(result).toBe(false);
            expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Invalid JWT format'));
        });

        it('should return false when decode returns null', async () => {
            mockDecode.mockReturnValue(null);

            const options = {
                loglevel: 'info',
                jwt: 'invalid.token.here',
            };

            const result = await jwtDecode(options);

            expect(result).toBe(false);
            expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to decode'));
        });

        it('should verify signature with valid public key', async () => {
            const mockHeader = { alg: 'RS256', typ: 'JWT', kid: 'key-123' };
            const mockPayload = {
                userId: 'testuser',
                iat: 1717948800,
                exp: 9999999999,
                aud: 'test-aud',
                iss: 'test-issuer',
            };

            mockDecode.mockReturnValue({ header: mockHeader, payload: mockPayload });
            mockVerify.mockReturnValue(mockPayload);

            const options = {
                loglevel: 'info',
                jwt: 'header.payload.signature',
                certPublickey: '-----BEGIN PUBLIC KEY-----\ntest\n-----END PUBLIC KEY-----',
            };

            const result = await jwtDecode(options);

            expect(result).toBe(true);
            expect(mockVerify).toHaveBeenCalled();
        });

        it('should handle signature verification failure', async () => {
            const mockHeader = { alg: 'RS256', typ: 'JWT' };
            const mockPayload = { userId: 'testuser' };

            mockDecode.mockReturnValue({ header: mockHeader, payload: mockPayload });
            mockVerify.mockImplementation(() => {
                throw new Error('invalid signature');
            });

            const options = {
                loglevel: 'info',
                jwt: 'header.payload.signature',
                certPublickey: '-----BEGIN PUBLIC KEY-----\nwrong\n-----END PUBLIC KEY-----',
            };

            const result = await jwtDecode(options);

            expect(result).toBe(true);
            expect(mockVerify).toHaveBeenCalled();
        });

        it('should verify audience when --expected-audience provided', async () => {
            const mockHeader = { alg: 'RS256', typ: 'JWT' };
            const mockPayload = {
                userId: 'testuser',
                aud: 'expected-audience',
                exp: 9999999999,
            };

            mockDecode.mockReturnValue({ header: mockHeader, payload: mockPayload });
            mockVerify.mockReturnValue(mockPayload);

            const options = {
                loglevel: 'info',
                jwt: 'header.payload.signature',
                certPublickey: '-----BEGIN PUBLIC KEY-----\ntest\n-----END PUBLIC KEY-----',
                expectedAudience: 'expected-audience',
            };

            const result = await jwtDecode(options);

            expect(result).toBe(true);
            expect(mockVerify).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String),
                expect.objectContaining({ audience: 'expected-audience' })
            );
        });

        it('should handle audience mismatch', async () => {
            const mockHeader = { alg: 'RS256', typ: 'JWT' };
            const mockPayload = {
                userId: 'testuser',
                aud: 'wrong-audience',
                exp: 9999999999,
            };

            mockDecode.mockReturnValue({ header: mockHeader, payload: mockPayload });
            mockVerify.mockImplementation(() => {
                throw new Error('jwt audience invalid. expected: expected-aud');
            });

            const options = {
                loglevel: 'info',
                jwt: 'header.payload.signature',
                certPublickey: '-----BEGIN PUBLIC KEY-----\ntest\n-----END PUBLIC KEY-----',
                expectedAudience: 'expected-aud',
            };

            const result = await jwtDecode(options);

            expect(result).toBe(true);
        });

        it('should use public key from file', async () => {
            const mockHeader = { alg: 'RS256', typ: 'JWT' };
            const mockPayload = { userId: 'testuser', exp: 9999999999 };

            mockDecode.mockReturnValue({ header: mockHeader, payload: mockPayload });
            mockVerify.mockReturnValue(mockPayload);
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('-----BEGIN PUBLIC KEY-----\nfile-key\n-----END PUBLIC KEY-----');

            const options = {
                loglevel: 'info',
                jwt: 'header.payload.signature',
                certPublickeyFile: '/path/to/public.pem',
            };

            const result = await jwtDecode(options);

            expect(result).toBe(true);
            expect(fs.readFileSync).toHaveBeenCalledWith('/path/to/public.pem', 'utf8');
        });

        it('should return false when public key file not found', async () => {
            const mockHeader = { alg: 'RS256', typ: 'JWT' };
            const mockPayload = { userId: 'testuser' };

            mockDecode.mockReturnValue({ header: mockHeader, payload: mockPayload });
            fs.existsSync.mockReturnValue(false);

            const options = {
                loglevel: 'info',
                jwt: 'header.payload.signature',
                certPublickeyFile: '/nonexistent/public.pem',
            };

            const result = await jwtDecode(options);

            expect(result).toBe(false);
            expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Public key file not found'));
        });

        it('should output JSON when minimalOutput is true', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            const mockHeader = { alg: 'RS256', typ: 'JWT' };
            const mockPayload = { userId: 'testuser', iat: 1717948800 };

            mockDecode.mockReturnValue({ header: mockHeader, payload: mockPayload });

            const options = {
                loglevel: 'error',
                jwt: 'header.payload.signature',
                minimalOutput: true,
            };

            await jwtDecode(options);

            expect(consoleSpy).toHaveBeenCalled();
            const output = JSON.parse(consoleSpy.mock.calls[0][0]);
            expect(output.header).toEqual(mockHeader);
            expect(output.payload).toEqual(mockPayload);

            consoleSpy.mockRestore();
        });

        it('should handle JWT with array audience', async () => {
            const mockHeader = { alg: 'RS256', typ: 'JWT' };
            const mockPayload = {
                userId: 'testuser',
                aud: ['aud1', 'aud2'],
                exp: 9999999999,
            };

            mockDecode.mockReturnValue({ header: mockHeader, payload: mockPayload });
            mockVerify.mockReturnValue(mockPayload);

            const options = {
                loglevel: 'info',
                jwt: 'header.payload.signature',
                certPublickey: '-----BEGIN PUBLIC KEY-----\ntest\n-----END PUBLIC KEY-----',
            };

            const result = await jwtDecode(options);

            expect(result).toBe(true);
        });

        it('should handle JWT with missing optional claims', async () => {
            const mockHeader = { alg: 'RS256', typ: 'JWT' };
            const mockPayload = { userId: 'testuser' };

            mockDecode.mockReturnValue({ header: mockHeader, payload: mockPayload });

            const options = {
                loglevel: 'info',
                jwt: 'header.payload.signature',
            };

            const result = await jwtDecode(options);

            expect(result).toBe(true);
        });
    });
});
