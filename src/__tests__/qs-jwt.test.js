import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const {
    mockJwtCreateQseow,
    mockJwtCreateQscloud,
    mockCreateQseowAssertOptions,
    mockCreateCloudAssertOptions,
    mockLogger,
} = vi.hoisted(() => {
    const mockJwtCreateQseow = vi.fn().mockResolvedValue(true);
    const mockJwtCreateQscloud = vi.fn().mockResolvedValue(true);
    const mockCreateQseowAssertOptions = vi.fn();
    const mockCreateCloudAssertOptions = vi.fn();
    const mockLogger = {
        error: vi.fn(),
        verbose: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
    };
    return {
        mockJwtCreateQseow,
        mockJwtCreateQscloud,
        mockCreateQseowAssertOptions,
        mockCreateCloudAssertOptions,
        mockLogger,
    };
});

vi.mock('../globals.js', () => ({
    logger: mockLogger,
    appVersion: '1.0.0-test',
    setLoggingLevel: vi.fn(),
}));

vi.mock('../lib/create-qseow.js', () => ({
    jwtCreateQseow: mockJwtCreateQseow,
}));

vi.mock('../lib/create-qscloud.js', () => ({
    jwtCreateQscloud: mockJwtCreateQscloud,
}));

vi.mock('../lib/create-assert-options.js', () => ({
    createQseowAssertOptions: mockCreateQseowAssertOptions,
    createCloudAssertOptions: mockCreateCloudAssertOptions,
}));

const originalExit = process.exit;
const originalArgv = process.argv;

beforeEach(() => {
    vi.clearAllMocks();
    process.exit = vi.fn();
    process.argv = ['node', 'qs-jwt'];
});

afterEach(() => {
    process.exit = originalExit;
    process.argv = originalArgv;
});

const { createProgram, run, handleCreateQseow, handleCreateQscloud } = await import('../qs-jwt.js');

describe('qs-jwt', () => {
    describe('createProgram', () => {
        it('should create a program with correct name', () => {
            const program = createProgram();
            expect(program.name()).toBe('qs-jwt');
        });

        it('should create a program with correct version', () => {
            const program = createProgram();
            expect(program.version()).toBe('1.0.0-test');
        });

        it('should have create-qseow command registered', () => {
            const program = createProgram();
            const qseowCmd = program.commands.find((cmd) => cmd.name() === 'create-qseow');
            expect(qseowCmd).toBeDefined();
        });

        it('should have create-qscloud command registered', () => {
            const program = createProgram();
            const qscloudCmd = program.commands.find((cmd) => cmd.name() === 'create-qscloud');
            expect(qscloudCmd).toBeDefined();
        });

        it('should have exactly 2 commands', () => {
            const program = createProgram();
            expect(program.commands.length).toBe(2);
        });
    });

    describe('run', () => {
        it('should parse argv and route to correct command', async () => {
            await run([
                'node',
                'qs-jwt',
                'create-qseow',
                '--userdir',
                'DIR',
                '--userid',
                'user',
                '--username',
                'User',
                '--useremail',
                'a@b.com',
                '--expires',
                '1h',
                '--audience',
                'aud',
                '--cert-privatekey',
                '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----',
            ]);
            expect(mockCreateQseowAssertOptions).toHaveBeenCalled();
            expect(mockJwtCreateQseow).toHaveBeenCalled();
        });
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
