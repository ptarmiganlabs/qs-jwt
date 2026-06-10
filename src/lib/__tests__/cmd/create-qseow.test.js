import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSign, mockGenerateKeyPair, mockCreateCertificate, mockPki } = vi.hoisted(() => {
    const mockSign = vi.fn();
    const mockGenerateKeyPair = vi.fn();
    const mockCreateCertificate = vi.fn();
    const mockPki = {
        rsa: {
            generateKeyPair: mockGenerateKeyPair,
        },
        createCertificate: mockCreateCertificate,
        publicKeyToPem: vi.fn(),
        privateKeyToPem: vi.fn(),
        certificateToPem: vi.fn(),
    };
    return { mockSign, mockGenerateKeyPair, mockCreateCertificate, mockPki };
});

vi.mock('jsonwebtoken', () => ({
    default: {
        sign: mockSign,
    },
}));

vi.mock('node-forge', () => ({
    default: {
        pki: mockPki,
    },
}));

vi.mock('node:fs', () => ({
    default: {
        writeFileSync: vi.fn(),
        readFileSync: vi.fn(),
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

vi.mock('../../util/certificates.js', () => ({
    verifyCertificatesExist: vi.fn(),
}));

import { jwtCreateQseow } from '../../cmd/create-qseow.js';
import { logger } from '../../../globals.js';
import { verifyCertificatesExist } from '../../util/certificates.js';
import fs from 'node:fs';

describe('cmd/create-qseow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSign.mockReturnValue('mock-jwt-token');
    });

    describe('jwtCreateQseow', () => {
        it('should create JWT with provided private key string', async () => {
            const options = {
                loglevel: 'info',
                certCreate: 'false',
                certPrivatekey: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----',
                userid: 'testuser',
                userdir: 'TESTDIR',
                username: 'Test User',
                useremail: 'test@example.com',
                groups: ['group1'],
                expires: '60m',
                audience: 'test-audience',
            };

            const result = await jwtCreateQseow(options);

            expect(result).toBe(true);
            expect(mockSign).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'testuser',
                    userDirectory: 'TESTDIR',
                    name: 'Test User',
                    email: 'test@example.com',
                    group: ['group1'],
                }),
                expect.any(Object),
                expect.objectContaining({
                    algorithm: 'RS256',
                    expiresIn: '60m',
                    audience: 'test-audience',
                })
            );
        });

        it('should create JWT with private key from file', async () => {
            verifyCertificatesExist.mockResolvedValue(true);
            fs.readFileSync.mockReturnValue(
                '-----BEGIN PRIVATE KEY-----\nfile-key\n-----END PRIVATE KEY-----'
            );

            const options = {
                loglevel: 'info',
                certCreate: 'false',
                certPrivatekeyFile: '/path/to/key.pem',
                userid: 'testuser',
                userdir: 'TESTDIR',
                username: 'Test User',
                useremail: 'test@example.com',
                expires: '1h',
                audience: 'test-aud',
            };

            const result = await jwtCreateQseow(options);

            expect(result).toBe(true);
            expect(verifyCertificatesExist).toHaveBeenCalledWith(options);
            expect(fs.readFileSync).toHaveBeenCalled();
        });

        it('should create new certificate when certCreate is true', async () => {
            const mockKeys = {
                publicKey: 'mock-public-key',
                privateKey: 'mock-private-key',
            };
            const mockCert = {
                publicKey: null,
                serialNumber: '',
                validity: {
                    notBefore: new Date(),
                    notAfter: new Date(),
                },
                setSubject: vi.fn(),
                setIssuer: vi.fn(),
                sign: vi.fn(),
            };

            mockGenerateKeyPair.mockReturnValue(mockKeys);
            mockCreateCertificate.mockReturnValue(mockCert);
            mockPki.publicKeyToPem.mockReturnValue(
                '-----BEGIN PUBLIC KEY-----\npublic\n-----END PUBLIC KEY-----'
            );
            mockPki.privateKeyToPem.mockReturnValue(
                '-----BEGIN PRIVATE KEY-----\nprivate\n-----END PRIVATE KEY-----'
            );
            mockPki.certificateToPem.mockReturnValue(
                '-----BEGIN CERTIFICATE-----\ncert\n-----END CERTIFICATE-----'
            );

            const options = {
                loglevel: 'info',
                certCreate: 'true',
                certCreateExpiresDays: 365,
                certFilePrefix: '',
                userid: 'testuser',
                userdir: 'TESTDIR',
                username: 'Test User',
                useremail: 'test@example.com',
                expires: '1d',
                audience: 'test-aud',
            };

            const result = await jwtCreateQseow(options);

            expect(result).toBe(true);
            expect(mockGenerateKeyPair).toHaveBeenCalledWith(4096);
            expect(mockCreateCertificate).toHaveBeenCalled();
            expect(fs.writeFileSync).toHaveBeenCalledTimes(3);
            expect(logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Created new certificate')
            );
        });

        it('should return false when no certificate or key is available', async () => {
            verifyCertificatesExist.mockResolvedValue(false);

            const options = {
                loglevel: 'info',
                certCreate: 'false',
                certPrivatekeyFile: '/nonexistent/key.pem',
                userid: 'testuser',
                userdir: 'TESTDIR',
                username: 'Test User',
                useremail: 'test@example.com',
                expires: '1h',
                audience: 'test-aud',
            };

            const result = await jwtCreateQseow(options);

            expect(result).toBe(false);
            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining('Missing certificate')
            );
        });

        it('should output JWT to console when minimalOutput is true', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            const options = {
                loglevel: 'error',
                certCreate: 'false',
                certPrivatekey: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----',
                userid: 'testuser',
                userdir: 'TESTDIR',
                username: 'Test User',
                useremail: 'test@example.com',
                expires: '1h',
                audience: 'test-aud',
                minimalOutput: true,
            };

            await jwtCreateQseow(options);

            expect(consoleSpy).toHaveBeenCalledWith('mock-jwt-token');
            consoleSpy.mockRestore();
        });

        it('should handle JWT signing errors', async () => {
            mockSign.mockImplementation(() => {
                throw new Error('Signing failed');
            });

            const options = {
                loglevel: 'info',
                certCreate: 'false',
                certPrivatekey: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----',
                userid: 'testuser',
                userdir: 'TESTDIR',
                username: 'Test User',
                useremail: 'test@example.com',
                expires: '1h',
                audience: 'test-aud',
            };

            const result = await jwtCreateQseow(options);

            expect(result).toBe(false);
            expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('JWT-CREATE-QSEOW'));
        });
    });
});
