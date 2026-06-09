import { createRequire } from 'node:module';

/**
 * Pure function to detect SEA environment from a process-like object.
 *
 * @param {object} proc - Process-like object with pkg, env, argv0, execPath, argv.
 * @returns {boolean} True if running as SEA, false otherwise.
 */
const detectSeaEnvironment = (proc) => {
    return (
        proc.pkg !== undefined ||
        proc.env.PKG_EXECPATH !== undefined ||
        (proc.argv0 && proc.argv0 === proc.execPath && proc.argv.length === 1)
    );
};

const seaWrapper = {
    /**
     * Check if running in SEA mode.
     *
     * @returns {boolean} True if running as SEA, false otherwise.
     */
    isSea() {
        try {
            return detectSeaEnvironment(process);
        } catch {
            return false;
        }
    },

    /**
     * Get an asset from SEA bundle.
     *
     * @param {string} _key - Asset key.
     * @param {string} _encoding - Encoding type.
     * @returns {string|Buffer|undefined} The asset content or undefined.
     */
    getAsset(_key, _encoding) {
        return undefined;
    },

    /**
     * Initialize the real SEA module if available.
     *
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            const seaModule = await import('node:sea');
            this.isSea = seaModule.isSea;
            this.getAsset = seaModule.getAsset;
        } catch {
            // SEA module not available, keep fallback implementations
        }
    },

    /**
     * Synchronously initialize the real SEA module if available.
     * Used in CJS bundles (SEA) where top-level await is not supported.
     */
    initializeSync() {
        try {
            const require = createRequire(import.meta.url);
            const realSea = require('node:sea');
            this.isSea = realSea.isSea.bind(realSea);
            this.getAsset = realSea.getAsset.bind(realSea);
        } catch {
            // SEA module not available, keep fallback implementations
        }
    },
};

export { detectSeaEnvironment };
export default seaWrapper;
