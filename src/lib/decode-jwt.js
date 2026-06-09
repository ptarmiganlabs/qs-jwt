import jsonWebToken from 'jsonwebtoken';
import fs from 'node:fs';

import { logger, setLoggingLevel } from '../globals.js';

/**
 * Formats a Unix timestamp as a human-readable ISO date string.
 *
 * @param {number} timestamp - Unix timestamp in seconds.
 * @returns {string} ISO date string or 'N/A' if invalid.
 */
const formatTimestamp = (timestamp) => {
    if (!timestamp || typeof timestamp !== 'number') return 'N/A';
    return new Date(timestamp * 1000).toISOString();
};

/**
 * Checks if a token is currently valid based on iat, exp, and nbf claims.
 *
 * @param {object} payload - Decoded JWT payload.
 * @returns {{ valid: boolean, reason: string }} Validity status and reason.
 */
const checkTokenValidity = (payload) => {
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && now > payload.exp) {
        const expiredAgo = now - payload.exp;
        const hours = Math.floor(expiredAgo / 3600);
        const minutes = Math.floor((expiredAgo % 3600) / 60);
        return {
            valid: false,
            reason: `Token expired ${hours > 0 ? `${hours} hours ` : ''}${minutes} minutes ago (expired at ${formatTimestamp(payload.exp)})`,
        };
    }

    if (payload.nbf && now < payload.nbf) {
        return {
            valid: false,
            reason: `Token not yet valid (valid from ${formatTimestamp(payload.nbf)})`,
        };
    }

    if (payload.iat && now < payload.iat) {
        return {
            valid: false,
            reason: `Token issued in the future (issued at ${formatTimestamp(payload.iat)})`,
        };
    }

    return { valid: true, reason: 'Token is currently valid' };
};

/**
 * Formats verification results for normal output mode.
 *
 * @param {object} header - JWT header.
 * @param {object} payload - JWT payload.
 * @param {object} verification - Verification result object.
 * @returns {string} Formatted verification output.
 */
const formatVerificationOutput = (header, payload, verification) => {
    const lines = [];

    lines.push('Signature Verification:');

    if (verification.success) {
        lines.push('  Status: ✅ Valid');
        lines.push(`  Algorithm: ${header.alg} (verified)`);

        if (header.kid) {
            lines.push(`  Key ID: ${header.kid}`);
        }

        lines.push('  Integrity: Token has not been tampered with');

        lines.push('  Validity:');
        lines.push(`    Issued: ${formatTimestamp(payload.iat)}`);
        lines.push(`    Expires: ${formatTimestamp(payload.exp)}`);

        const validity = checkTokenValidity(payload);
        const validityIcon = validity.valid ? '✅' : '❌';
        lines.push(`    Current: ${validityIcon} ${validity.reason}`);

        if (payload.aud) {
            const audIcon = verification.audienceMatch ? '✅' : '❌';
            const audValue = Array.isArray(payload.aud) ? payload.aud.join(', ') : payload.aud;
            lines.push(`  Audience: ${audValue} ${audIcon}`);
        }

        if (payload.iss) {
            lines.push(`  Issuer: ${payload.iss}`);
        }
    } else {
        lines.push('  Status: ❌ Invalid');
        lines.push(`  Reason: ${verification.reason}`);
    }

    return lines.join('\n');
};

/**
 * Formats verification results for minimal (JSON) output mode.
 *
 * @param {object} header - JWT header.
 * @param {object} payload - JWT payload.
 * @param {object} verification - Verification result object.
 * @returns {object} JSON-serializable verification object.
 */
const formatVerificationJson = (header, payload, verification) => {
    const result = {
        header,
        payload,
    };

    if (verification) {
        result.verification = {
            status: verification.success ? 'valid' : 'invalid',
            algorithm: header.alg,
            integrity: verification.success,
            issuedAt: formatTimestamp(payload.iat),
            expiresAt: formatTimestamp(payload.exp),
            notBefore: formatTimestamp(payload.nbf),
            currentlyValid: checkTokenValidity(payload).valid,
        };

        if (header.kid) {
            result.verification.keyId = header.kid;
        }

        if (payload.aud) {
            result.verification.audience = payload.aud;
            result.verification.audienceMatch = verification.audienceMatch;
        }

        if (payload.iss) {
            result.verification.issuer = payload.iss;
        }

        if (!verification.success) {
            result.verification.reason = verification.reason;
        }
    }

    return result;
};

/**
 * Formats a JWT payload for display, adding human-readable dates for timestamp fields.
 *
 * @param {object} payload - JWT payload.
 * @returns {object} Payload with formatted timestamp fields.
 */
const formatPayloadForDisplay = (payload) => {
    const display = { ...payload };

    if (payload.iat && typeof payload.iat === 'number') {
        display.iat = `${payload.iat} (${formatTimestamp(payload.iat)})`;
    }

    if (payload.exp && typeof payload.exp === 'number') {
        display.exp = `${payload.exp} (${formatTimestamp(payload.exp)})`;
    }

    if (payload.nbf && typeof payload.nbf === 'number') {
        display.nbf = `${payload.nbf} (${formatTimestamp(payload.nbf)})`;
    }

    return display;
};

/**
 * Decodes a JWT and displays its header and payload.
 * Optionally verifies the signature using a provided public key.
 *
 * @param {object} options - Parsed CLI options for JWT decoding.
 * @returns {Promise<boolean>} True if JWT was decoded successfully, false otherwise.
 */
const jwtDecode = async (options) => {
    try {
        setLoggingLevel(options.loglevel);

        let token = '';

        if (options.jwt) {
            token = options.jwt;
        } else if (options.jwtFile) {
            const jwtFilePath = fs.existsSync(options.jwtFile)
                ? options.jwtFile
                : (() => {
                      throw new Error(`JWT file not found: ${options.jwtFile}`);
                  })();
            token = fs.readFileSync(jwtFilePath, 'utf8').trim();
        }

        if (!token) {
            throw new Error('No JWT provided. Use --jwt or --jwt-file to specify the token.');
        }

        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error(
                `Invalid JWT format. Expected 3 parts separated by dots, got ${parts.length}. This may be a JWE token (encrypted), which is not supported.`
            );
        }

        const decoded = jsonWebToken.decode(token, { complete: true });

        if (!decoded) {
            throw new Error('Failed to decode JWT. Token may be malformed.');
        }

        const { header, payload } = decoded;

        let verification = null;

        if (options.certPublickey || options.certPublickeyFile) {
            let publicKey = '';

            if (options.certPublickey) {
                publicKey = options.certPublickey;
            } else if (options.certPublickeyFile) {
                if (!fs.existsSync(options.certPublickeyFile)) {
                    throw new Error(`Public key file not found: ${options.certPublickeyFile}`);
                }
                publicKey = fs.readFileSync(options.certPublickeyFile, 'utf8');
            }

            try {
                const verifyOptions = {
                    algorithms: ['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512'],
                };

                if (options.expectedAudience) {
                    verifyOptions.audience = options.expectedAudience;
                }

                jsonWebToken.verify(token, publicKey, verifyOptions);

                verification = {
                    success: true,
                    audienceMatch: options.expectedAudience
                        ? payload.aud === options.expectedAudience ||
                          (Array.isArray(payload.aud) &&
                              payload.aud.includes(options.expectedAudience))
                        : true,
                };
            } catch (err) {
                verification = {
                    success: false,
                    reason: err.message,
                };
            }
        }

        if (options?.minimalOutput === true) {
            const output = formatVerificationJson(header, payload, verification);
            console.log(JSON.stringify(output, null, 2));
        } else {
            logger.info('JWT Header:');
            console.log(JSON.stringify(header, null, 2));

            logger.info('\nJWT Payload:');
            console.log(JSON.stringify(formatPayloadForDisplay(payload), null, 2));

            if (verification) {
                console.log('\n' + formatVerificationOutput(header, payload, verification));
            }
        }

        return true;
    } catch (err) {
        logger.error(`JWT-DECODE: ${err.message}`);
        return false;
    }
};

export { jwtDecode };
