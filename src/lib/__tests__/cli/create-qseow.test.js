import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockJwtCreateQseow, mockCreateQseowAssertOptions, mockLogger } = vi.hoisted(() => {
    const mockJwtCreateQseow = vi.fn().mockResolvedValue(true);
    const mockCreateQseowAssertOptions = vi.fn();
    const mockLogger = {
        error: vi.fn(),
        verbose: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
    };
    return {
        mockJwtCreateQseow,
        mockCreateQseowAssertOptions,
        mockLogger,
    };
});

vi.mock('../../../globals.js', () => ({
    logger: mockLogger,
    appVersion: '1.0.0-test',
    setLoggingLevel: vi.fn(),
}));

vi.mock('../../cmd/create-qseow.js', () => ({
    jwtCreateQseow: mockJwtCreateQseow,
}));

vi.mock('../../util/assert-options.js', () => ({
    createQseowAssertOptions: mockCreateQseowAssertOptions,
}));

const { handleCreateQseow } = await import('../../cli/create-qseow.js');

describe('cli/create-qseow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('handleCreateQseow', () => {
        it('should call createQseowAssertOptions with options', async () => {
            const options = {
                userdir: 'DIR',
                userid: 'user',
                username: 'User',
                useremail: 'a@b.com',
                expires: '1h',
                audience: 'aud',
            };
            await handleCreateQseow(options, {});
            expect(mockCreateQseowAssertOptions).toHaveBeenCalledWith(options);
        });

        it('should call jwtCreateQseow with options and command', async () => {
            const options = {
                userdir: 'DIR',
                userid: 'user',
                username: 'User',
                useremail: 'a@b.com',
                expires: '1h',
                audience: 'aud',
            };
            const command = { name: () => 'create-qseow' };
            await handleCreateQseow(options, command);
            expect(mockJwtCreateQseow).toHaveBeenCalledWith(options, command);
        });

        it('should log debug message on success', async () => {
            mockJwtCreateQseow.mockResolvedValueOnce(true);
            const options = {
                userdir: 'DIR',
                userid: 'user',
                username: 'User',
                useremail: 'a@b.com',
                expires: '1h',
                audience: 'aud',
            };
            await handleCreateQseow(options, {});
            expect(mockLogger.debug).toHaveBeenCalledWith(expect.stringContaining('succeeded'));
        });

        it('should log error when createQseowAssertOptions throws', async () => {
            mockCreateQseowAssertOptions.mockImplementationOnce(() => {
                throw new Error('Validation failed');
            });
            const options = { userdir: 'DIR' };
            await handleCreateQseow(options, {});
            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining('Validation failed')
            );
        });

        it('should log error when jwtCreateQseow throws', async () => {
            mockJwtCreateQseow.mockRejectedValueOnce(new Error('JWT creation failed'));
            const options = {
                userdir: 'DIR',
                userid: 'user',
                username: 'User',
                useremail: 'a@b.com',
                expires: '1h',
                audience: 'aud',
            };
            await handleCreateQseow(options, {});
            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining('JWT creation failed')
            );
        });
    });
});
