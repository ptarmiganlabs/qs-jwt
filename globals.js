import winston from 'winston';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const appVersion = JSON.parse(
    readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)))
).version;

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
