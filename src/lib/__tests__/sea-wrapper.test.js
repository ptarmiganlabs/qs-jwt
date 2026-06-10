import { describe, it, expect } from 'vitest';

import { detectSeaEnvironment } from '../sea-wrapper.js';
import seaWrapper from '../sea-wrapper.js';

describe('sea-wrapper', () => {
    describe('detectSeaEnvironment', () => {
        it('should return true when process.pkg is defined', () => {
            const proc = {
                pkg: {},
                env: {},
                argv0: 'node',
                execPath: '/usr/bin/node',
                argv: ['script.js'],
            };
            expect(detectSeaEnvironment(proc)).toBe(true);
        });

        it('should return true when PKG_EXECPATH env var is set', () => {
            const proc = {
                env: { PKG_EXECPATH: '/some/path' },
                argv0: 'node',
                execPath: '/usr/bin/node',
                argv: ['script.js'],
            };
            expect(detectSeaEnvironment(proc)).toBe(true);
        });

        it('should return true when argv0 === execPath and argv.length === 1', () => {
            const proc = {
                env: {},
                argv0: '/app/qs-jwt',
                execPath: '/app/qs-jwt',
                argv: ['/app/qs-jwt'],
            };
            expect(detectSeaEnvironment(proc)).toBe(true);
        });

        it('should return false when no SEA indicators are present', () => {
            const proc = {
                env: {},
                argv0: 'node',
                execPath: '/usr/bin/node',
                argv: ['node', 'script.js'],
            };
            expect(detectSeaEnvironment(proc)).toBe(false);
        });

        it('should return false when argv0 differs from execPath', () => {
            const proc = { env: {}, argv0: 'node', execPath: '/usr/bin/node', argv: ['script.js'] };
            expect(detectSeaEnvironment(proc)).toBe(false);
        });

        it('should return false when argv.length > 1 even if argv0 === execPath', () => {
            const proc = {
                env: {},
                argv0: '/app/qs-jwt',
                execPath: '/app/qs-jwt',
                argv: ['/app/qs-jwt', '--help'],
            };
            expect(detectSeaEnvironment(proc)).toBe(false);
        });

        it('should return falsy when argv0 is falsy', () => {
            const proc = { env: {}, argv0: '', execPath: '/usr/bin/node', argv: ['script.js'] };
            expect(detectSeaEnvironment(proc)).toBeFalsy();
        });
    });

    describe('seaWrapper', () => {
        describe('isSea', () => {
            it('should return false in test environment', () => {
                expect(seaWrapper.isSea()).toBe(false);
            });
        });

        describe('getAsset', () => {
            it('should return undefined by default', () => {
                expect(seaWrapper.getAsset('package.json', 'utf8')).toBeUndefined();
            });

            it('should return undefined regardless of arguments', () => {
                expect(seaWrapper.getAsset('any-key', 'any-encoding')).toBeUndefined();
            });
        });

        describe('initialize', () => {
            it('should not throw when node:sea is unavailable', async () => {
                await expect(seaWrapper.initialize()).resolves.not.toThrow();
            });
        });

        describe('initializeSync', () => {
            it('should not throw when node:sea is unavailable', () => {
                expect(() => seaWrapper.initializeSync()).not.toThrow();
            });
        });
    });
});
