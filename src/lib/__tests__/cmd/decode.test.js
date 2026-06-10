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

vi.mock('../../../globals.js', () => ({
    logger: {
        error: vi.fn(),
        verbose: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
    },
    setLoggingLevel: vi.fn(),
}));

import { jwtDecode } from '../../cmd/decode.js';
import { logger } from '../../../globals.js';
import fs from 'node:fs';

describe('cmd/decode', () => {
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
            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining('JWT file not found')
            );
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
            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining('Invalid JWT format')
            );
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
            fs.readFileSync.mockReturnValue(
                '-----BEGIN PUBLIC KEY-----\nfile-key\n-----END PUBLIC KEY-----'
            );

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
            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining('Public key file not found')
            );
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

        it('should show expiration message with hours when expired > 60 minutes', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            const mockHeader = { alg: 'RS256', typ: 'JWT' };
            const expiredTime = Math.floor(Date.now() / 1000) - 7200; // 2 hours ago
            const mockPayload = {
                userId: 'testuser',
                exp: expiredTime,
                iat: expiredTime - 3600,
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
            const output = consoleSpy.mock.calls.map((call) => call[0]).join('\n');
            expect(output).toMatch(/2 hours/);

            consoleSpy.mockRestore();
        });

        it('should detect token issued in the future', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            const mockHeader = { alg: 'RS256', typ: 'JWT' };
            const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour in future
            const mockPayload = {
                userId: 'testuser',
                iat: futureTime,
                exp: futureTime + 3600,
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
            const output = consoleSpy.mock.calls.map((call) => call[0]).join('\n');
            expect(output).toMatch(/issued in the future/);

            consoleSpy.mockRestore();
        });

        it('should detect token not yet valid', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            const mockHeader = { alg: 'RS256', typ: 'JWT' };
            const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour in future
            const mockPayload = {
                userId: 'testuser',
                nbf: futureTime,
                iat: Math.floor(Date.now() / 1000),
                exp: futureTime + 3600,
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
            const output = consoleSpy.mock.calls.map((call) => call[0]).join('\n');
            expect(output).toMatch(/not yet valid/);

            consoleSpy.mockRestore();
        });

        it('should output verification details in JSON when minimalOutput is true', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

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
                loglevel: 'error',
                jwt: 'header.payload.signature',
                certPublickey: '-----BEGIN PUBLIC KEY-----\ntest\n-----END PUBLIC KEY-----',
                minimalOutput: true,
            };

            const result = await jwtDecode(options);

            expect(result).toBe(true);
            expect(consoleSpy).toHaveBeenCalled();
            const output = JSON.parse(consoleSpy.mock.calls[0][0]);

            expect(output.verification).toBeDefined();
            expect(output.verification.status).toBe('valid');
            expect(output.verification.algorithm).toBe('RS256');
            expect(output.verification.keyId).toBe('key-123');
            expect(output.verification.integrity).toBe(true);
            expect(output.verification.issuedAt).toBeDefined();
            expect(output.verification.expiresAt).toBeDefined();
            expect(output.verification.currentlyValid).toBe(true);
            expect(output.verification.audience).toBe('test-aud');
            expect(output.verification.audienceMatch).toBe(true);
            expect(output.verification.issuer).toBe('test-issuer');

            consoleSpy.mockRestore();
        });

        it('should output failure reason in JSON when verification fails', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            const mockHeader = { alg: 'RS256', typ: 'JWT' };
            const mockPayload = { userId: 'testuser' };

            mockDecode.mockReturnValue({ header: mockHeader, payload: mockPayload });
            mockVerify.mockImplementation(() => {
                throw new Error('invalid signature');
            });

            const options = {
                loglevel: 'error',
                jwt: 'header.payload.signature',
                certPublickey: '-----BEGIN PUBLIC KEY-----\ntest\n-----END PUBLIC KEY-----',
                minimalOutput: true,
            };

            const result = await jwtDecode(options);

            expect(result).toBe(true);
            expect(consoleSpy).toHaveBeenCalled();
            const output = JSON.parse(consoleSpy.mock.calls[0][0]);

            expect(output.verification).toBeDefined();
            expect(output.verification.status).toBe('invalid');
            expect(output.verification.reason).toBe('invalid signature');

            consoleSpy.mockRestore();
        });

        it('should display nbf field in payload when present', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            const mockHeader = { alg: 'RS256', typ: 'JWT' };
            const mockPayload = {
                userId: 'testuser',
                nbf: 1717948800,
                iat: 1717948800,
                exp: 9999999999,
            };

            mockDecode.mockReturnValue({ header: mockHeader, payload: mockPayload });

            const options = {
                loglevel: 'info',
                jwt: 'header.payload.signature',
            };

            const result = await jwtDecode(options);

            expect(result).toBe(true);
            const output = consoleSpy.mock.calls.map((call) => call[0]).join('\n');
            expect(output).toContain('nbf');
            expect(output).toMatch(/1717948800/);

            consoleSpy.mockRestore();
        });

        it('should display array audience in normal output mode', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            const mockHeader = { alg: 'RS256', typ: 'JWT' };
            const mockPayload = {
                userId: 'testuser',
                aud: ['aud1', 'aud2'],
                iat: 1717948800,
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
            const output = consoleSpy.mock.calls.map((call) => call[0]).join('\n');
            expect(output).toContain('aud1, aud2');

            consoleSpy.mockRestore();
        });

        it('should handle expectedAudience with array audience match', async () => {
            const mockHeader = { alg: 'RS256', typ: 'JWT' };
            const mockPayload = {
                userId: 'testuser',
                aud: ['aud1', 'aud2', 'target-aud'],
                exp: 9999999999,
            };

            mockDecode.mockReturnValue({ header: mockHeader, payload: mockPayload });
            mockVerify.mockReturnValue(mockPayload);

            const options = {
                loglevel: 'info',
                jwt: 'header.payload.signature',
                certPublickey: '-----BEGIN PUBLIC KEY-----\ntest\n-----END PUBLIC KEY-----',
                expectedAudience: 'target-aud',
            };

            const result = await jwtDecode(options);

            expect(result).toBe(true);
            expect(mockVerify).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String),
                expect.objectContaining({ audience: 'target-aud' })
            );
        });
    });
});
