import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockJwtDecode, mockCreateDecodeAssertOptions, mockLogger } = vi.hoisted(() => {
    const mockJwtDecode = vi.fn().mockResolvedValue(true);
    const mockCreateDecodeAssertOptions = vi.fn();
    const mockLogger = {
        error: vi.fn(),
        verbose: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
    };
    return {
        mockJwtDecode,
        mockCreateDecodeAssertOptions,
        mockLogger,
    };
});

vi.mock('../../../globals.js', () => ({
    logger: mockLogger,
    appVersion: '1.0.0-test',
    setLoggingLevel: vi.fn(),
}));

vi.mock('../../cmd/decode.js', () => ({
    jwtDecode: mockJwtDecode,
}));

vi.mock('../../util/assert-options.js', () => ({
    createDecodeAssertOptions: mockCreateDecodeAssertOptions,
}));

const { handleDecode } = await import('../../cli/decode.js');

describe('cli/decode', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('handleDecode', () => {
        it('should call createDecodeAssertOptions with options', async () => {
            const options = {
                jwt: 'header.payload.signature',
            };
            await handleDecode(options, {});
            expect(mockCreateDecodeAssertOptions).toHaveBeenCalledWith(options);
        });

        it('should call jwtDecode with options and command', async () => {
            const options = {
                jwt: 'header.payload.signature',
            };
            const command = { name: () => 'decode' };
            await handleDecode(options, command);
            expect(mockJwtDecode).toHaveBeenCalledWith(options, command);
        });

        it('should log debug message on success', async () => {
            mockJwtDecode.mockResolvedValueOnce(true);
            const options = {
                jwt: 'header.payload.signature',
            };
            await handleDecode(options, {});
            expect(mockLogger.debug).toHaveBeenCalledWith(expect.stringContaining('succeeded'));
        });

        it('should log error when createDecodeAssertOptions throws', async () => {
            mockCreateDecodeAssertOptions.mockImplementationOnce(() => {
                throw new Error('Decode validation failed');
            });
            const options = { jwt: 'header.payload.signature' };
            await handleDecode(options, {});
            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining('Decode validation failed')
            );
        });

        it('should log error when jwtDecode throws', async () => {
            mockJwtDecode.mockRejectedValueOnce(new Error('JWT decode failed'));
            const options = {
                jwt: 'header.payload.signature',
            };
            await handleDecode(options, {});
            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining('JWT decode failed')
            );
        });
    });
});
