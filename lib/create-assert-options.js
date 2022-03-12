const { logger } = require('../globals');

const createAssertOptions = (options) => {
    if (options.target !== 'qseow' && options.target !== 'cloud') {
        logger.error('--target must be either `qseow` or `cloud`');
        process.exit(1);
    }

    // If certificates are to be created: Ensure all required field are present with valid values
    if (options.certCreate === true || options.certCreate === 'true') {
        // Ensure --cert-create-expires-days has valid number
        if (!options.certCreateExpiresDays) {
            logger.error(
                '--cert-create-expires-days is missing or invalid. Use it to specify how long the created certificate should be valid.'
            );
            process.exit(1);
        }
        if (Number.isNaN(options.certCreateExpiresDays)) {
            logger.error('--cert-create-expires-days must be an integer');
            process.exit(1);
        }
    }
};

module.exports = {
    createAssertOptions,
};
