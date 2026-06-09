import winston from 'winston';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sea from './lib/sea-wrapper.js';

// Initialize SEA wrapper synchronously (required for CJS bundle in SEA)
sea.initializeSync();

let appVersion;
if (sea.isSea()) {
    // Running as SEA binary - read package.json from bundled assets
    const packageJson = sea.getAsset('package.json', 'utf8');
    appVersion = JSON.parse(packageJson).version;
} else {
    // Running as regular Node.js - read package.json from filesystem
    appVersion = JSON.parse(
        readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)))
    ).version;
}

// Set up logger with timestamps and colors, and optional logging to disk file
const logTransports = [];

logTransports.push(
    new winston.transports.Console({
        name: 'console',
        level: 'info',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
        ),
    })
);

const logger = winston.createLogger({
    transports: logTransports,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
    ),
});

/**
 * Gets the current console logging level.
 *
 * @returns {string} The current console logging level.
 */
const getLoggingLevel = () => logTransports.find((transport) => transport.name === 'console').level;

/**
 * Sets the console logging level.
 *
 * @param {string} newLevel - The new logging level to set.
 */
const setLoggingLevel = (newLevel) => {
    logTransports.find((transport) => transport.name === 'console').level = newLevel;
};

export { logger, appVersion, getLoggingLevel, setLoggingLevel };
