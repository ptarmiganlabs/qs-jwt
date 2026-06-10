import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const {
    mockJwtCreateQseow,
    mockJwtCreateQscloud,
    mockJwtDecode,
    mockCreateQseowAssertOptions,
    mockCreateCloudAssertOptions,
    mockCreateDecodeAssertOptions,
    mockLogger,
} = vi.hoisted(() => {
    const mockJwtCreateQseow = vi.fn().mockResolvedValue(true);
    const mockJwtCreateQscloud = vi.fn().mockResolvedValue(true);
    const mockJwtDecode = vi.fn().mockResolvedValue(true);
    const mockCreateQseowAssertOptions = vi.fn();
    const mockCreateCloudAssertOptions = vi.fn();
    const mockCreateDecodeAssertOptions = vi.fn();
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
        mockJwtDecode,
        mockCreateQseowAssertOptions,
        mockCreateCloudAssertOptions,
        mockCreateDecodeAssertOptions,
        mockLogger,
    };
});

vi.mock('../globals.js', () => ({
    logger: mockLogger,
    appVersion: '1.0.0-test',
    setLoggingLevel: vi.fn(),
}));

vi.mock('../lib/cmd/create-qseow.js', () => ({
    jwtCreateQseow: mockJwtCreateQseow,
}));

vi.mock('../lib/cmd/create-qscloud.js', () => ({
    jwtCreateQscloud: mockJwtCreateQscloud,
}));

vi.mock('../lib/cmd/decode.js', () => ({
    jwtDecode: mockJwtDecode,
}));

vi.mock('../lib/util/assert-options.js', () => ({
    createQseowAssertOptions: mockCreateQseowAssertOptions,
    createCloudAssertOptions: mockCreateCloudAssertOptions,
    createDecodeAssertOptions: mockCreateDecodeAssertOptions,
}));

const originalExit = process.exit;
const originalArgv = process.argv;
const originalStdoutWrite = process.stdout.write;
const originalStderrWrite = process.stderr.write;

process.exit = vi.fn();
process.argv = ['node', 'qs-jwt'];
process.stdout.write = vi.fn();
process.stderr.write = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    process.exit = vi.fn();
    process.argv = ['node', 'qs-jwt'];
    process.stdout.write = vi.fn();
    process.stderr.write = vi.fn();
});

afterEach(() => {
    process.exit = originalExit;
    process.argv = originalArgv;
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
});

const { createProgram, run } = await import('../qs-jwt.js');

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

        it('should have decode command registered', () => {
            const program = createProgram();
            const decodeCmd = program.commands.find((cmd) => cmd.name() === 'decode');
            expect(decodeCmd).toBeDefined();
        });

        it('should have exactly 3 commands', () => {
            const program = createProgram();
            expect(program.commands.length).toBe(3);
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
});
