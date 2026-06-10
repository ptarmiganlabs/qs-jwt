import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockJwtCreateQscloud, mockCreateCloudAssertOptions, mockLogger } = vi.hoisted(() => {
    const mockJwtCreateQscloud = vi.fn().mockResolvedValue(true);
    const mockCreateCloudAssertOptions = vi.fn();
    const mockLogger = {
        error: vi.fn(),
        verbose: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
    };
    return {
        mockJwtCreateQscloud,
        mockCreateCloudAssertOptions,
        mockLogger,
    };
});

vi.mock('../../../globals.js', () => ({
    logger: mockLogger,
    appVersion: '1.0.0-test',
    setLoggingLevel: vi.fn(),
}));

vi.mock('../../cmd/create-qscloud.js', () => ({
    jwtCreateQscloud: mockJwtCreateQscloud,
}));

vi.mock('../../util/assert-options.js', () => ({
    createCloudAssertOptions: mockCreateCloudAssertOptions,
}));

const { handleCreateQscloud } = await import('../../cli/create-qscloud.js');

describe('cli/create-qscloud', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('handleCreateQscloud', () => {
        it('should call createCloudAssertOptions with options', async () => {
            const options = {
                useremail: 'a@b.com',
                useremailVerified: 'true',
                username: 'User',
                issuer: 'iss',
                keyid: 'kid',
                expires: '1h',
            };
            await handleCreateQscloud(options, {});
            expect(mockCreateCloudAssertOptions).toHaveBeenCalledWith(options);
        });

        it('should call jwtCreateQscloud with options and command', async () => {
            const options = {
                useremail: 'a@b.com',
                useremailVerified: 'true',
                username: 'User',
                issuer: 'iss',
                keyid: 'kid',
                expires: '1h',
            };
            const command = { name: () => 'create-qscloud' };
            await handleCreateQscloud(options, command);
            expect(mockJwtCreateQscloud).toHaveBeenCalledWith(options, command);
        });

        it('should log debug message on success', async () => {
            mockJwtCreateQscloud.mockResolvedValueOnce(true);
            const options = {
                useremail: 'a@b.com',
                useremailVerified: 'true',
                username: 'User',
                issuer: 'iss',
                keyid: 'kid',
                expires: '1h',
            };
            await handleCreateQscloud(options, {});
            expect(mockLogger.debug).toHaveBeenCalledWith(expect.stringContaining('succeeded'));
        });

        it('should log error when createCloudAssertOptions throws', async () => {
            mockCreateCloudAssertOptions.mockImplementationOnce(() => {
                throw new Error('Cloud validation failed');
            });
            const options = { useremail: 'a@b.com' };
            await handleCreateQscloud(options, {});
            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining('Cloud validation failed')
            );
        });

        it('should log error when jwtCreateQscloud throws', async () => {
            mockJwtCreateQscloud.mockRejectedValueOnce(new Error('Cloud JWT creation failed'));
            const options = {
                useremail: 'a@b.com',
                useremailVerified: 'true',
                username: 'User',
                issuer: 'iss',
                keyid: 'kid',
                expires: '1h',
            };
            await handleCreateQscloud(options, {});
            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining('Cloud JWT creation failed')
            );
        });
    });
});
