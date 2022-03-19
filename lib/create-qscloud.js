const jsonWebToken = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const forge = require('node-forge');
const uid = require('uid-safe');

const { logger, setLoggingLevel } = require('../globals');
const { verifyCertificatesExist } = require('./certificates');

const jwtCreateQscloud = async (options) => {
    try {
        // Set log level
        setLoggingLevel(options.loglevel);

        // Key used to encrypt JWT
        let jwtEncryptionKey = '';
        let publicKeyPem = '';
        let privateKeyPem = '';

        // Should a certificate be created?
        if (options.certCreate === true || options.certCreate === 'true') {
            const { pki } = forge;

            const keys = pki.rsa.generateKeyPair(4096);
            const cert = pki.createCertificate();

            // Get key pair
            publicKeyPem = pki.publicKeyToPem(keys.publicKey);
            privateKeyPem = pki.privateKeyToPem(keys.privateKey);

            // Create cert
            const rightNow = new Date();
            cert.publicKey = keys.publicKey;
            cert.serialNumber = '01';
            cert.validity.notBefore = rightNow;
            cert.validity.notAfter.setDate(rightNow.getDate() + options.certCreateExpiresDays);

            // Ensure validity dates are valid
            if (Number.isNaN(cert.validity.notBefore.valueOf())) {
                throw Error('Invalid certificate start date.');
            }
            if (Number.isNaN(cert.validity.notAfter.valueOf())) {
                throw Error('Invalid certificate end date.');
            }

            const commonName = 'qs-jwt';
            const attrs = [
                {
                    name: 'commonName',
                    value: commonName,
                },
            ];
            cert.setSubject(attrs);
            cert.setIssuer(attrs);

            // self-sign certificate
            cert.sign(keys.privateKey);

            // convert a Forge certificate to PEM
            const certPem = pki.certificateToPem(cert);

            logger.verbose(`Public key:\n${publicKeyPem}`);
            logger.verbose(`Private key:\n${privateKeyPem}`);
            logger.verbose(`Certificate:\n${certPem}`);

            const certPublicFile = path.resolve(`${options.certFilePrefix}publickey.pem`);
            const certPrivateFile = path.resolve(`${options.certFilePrefix}privatekey.pem`);
            const certFile = path.resolve(`${options.certFilePrefix}publickey.cer`);

            fs.writeFileSync(certPublicFile, publicKeyPem);
            fs.writeFileSync(certPrivateFile, privateKeyPem);
            fs.writeFileSync(certFile, certPem);

            logger.info(
                `Created new certificate, stored in\n  ${certPublicFile}\n  ${certPrivateFile}\n  ${certFile}`
            );
            logger.info(`New certificate start date : ${cert.validity.notBefore}`);
            logger.info(`New certificate end date   : ${cert.validity.notAfter}`);
            logger.info(`New certificate common name: ${commonName}`);
        }

        // Ensure needed certificates are available
        let certsExist = false;

        // Prio 1: Newly created cert, if it exists
        if (certsExist === false && publicKeyPem.length > 0 && privateKeyPem.length > 0) {
            certsExist = true;

            jwtEncryptionKey = privateKeyPem;
        }

        // Prio 2: Cert passed in as text string
        if (certsExist === false && options.certPrivatekey && options.certPrivatekey.length > 0) {
            certsExist = true;

            jwtEncryptionKey = options.certPrivatekey;
        }

        // Prio 3: Cert passed in as file name
        if (
            certsExist === false &&
            options.certPrivatekeyFile &&
            options.certPrivatekeyFile.length > 0
        ) {
            certsExist = await verifyCertificatesExist(options);

            const certKeyFile = path.resolve(options.certPrivatekeyFile);
            jwtEncryptionKey = fs.readFileSync(certKeyFile);
        }

        if (certsExist === false) {
            throw Error('Missing certificate and/or private key.');
        } else {
            logger.verbose(`Certificate private key found`);
        }

        // Options for signing the JWT
        const signingOptions = {
            algorithm: 'RS256',
            expiresIn: options.expires,
            notBefore: '0s',
            keyid: options.keyid,
            issuer: options.issuer,
            audience: 'qlik.api/login/jwt-session',
        };
        logger.verbose(`JWT signing options: ${JSON.stringify(signingOptions, null, 2)}`);

        // Creating a Qlik Sense on Windows payload.
        const jti = uid.sync(32);
        const sub = uid.sync(42);

        const payload = {
            jti,
            sub,
            subType: 'user',
            name: options.username,
            email: options.useremail,
            email_verified: options.useremailVerified,
            group: options.groups,
        };
        logger.debug(`JWT payload: ${JSON.stringify(payload, null, 2)}`);

        // Create the JWT
        const token = jsonWebToken.sign(
            payload,
            { key: jwtEncryptionKey, passphrase: '' },
            signingOptions
        );
        logger.info(`Created JWT:`);
        logger.info(token);

        return true;
    } catch (err) {
        logger.error(`JWT-CREATE-QSEOW: ${err}`);
        return false;
    }
};

module.exports = {
    jwtCreateQscloud,
};
