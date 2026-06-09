# JWT Decode Command

## Overview

The `decode` command allows you to inspect the contents of a JWT (JSON Web Token) and optionally verify its signature. This is useful for:

- Debugging authentication issues with Qlik Sense APIs
- Verifying that a JWT contains the expected user information
- Checking if a JWT has expired
- Confirming that a JWT was signed by the expected key

## When to Use

Use the decode command when you need to:

- **Troubleshoot API authentication failures** - See what user information is embedded in the JWT
- **Verify token validity** - Check if a token has expired or is not yet valid
- **Confirm signature integrity** - Ensure the JWT hasn't been tampered with
- **Inspect claims** - View all the information embedded in the JWT (user ID, directory, email, groups, etc.)

## Command Syntax

```bash
qs-jwt decode [options]
```

## Options

### Required (one of)

| Option              | Description                       |
| ------------------- | --------------------------------- |
| `--jwt <token>`     | The JWT string to decode          |
| `--jwt-file <file>` | Path to a file containing the JWT |

You must provide either `--jwt` or `--jwt-file`, but not both.

### Optional

| Option                           | Description                                                         |
| -------------------------------- | ------------------------------------------------------------------- |
| `--cert-publickey-file <file>`   | Path to a file containing the public key for signature verification |
| `--cert-publickey <key>`         | Public key string for signature verification                        |
| `--expected-audience <audience>` | Expected audience value to verify (requires a public key)           |
| `--loglevel <level>`             | Logging level: error, warn, info, verbose, debug (default: info)    |
| `--minimal-output`               | Output as JSON only, without additional formatting                  |

## Usage Examples

### Basic Decoding

Decode a JWT and display its contents:

```bash
qs-jwt decode --jwt "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJqb2huc21pdGgiLCJ1c2VyRGlyZWN0b3J5IjoiTVlESVIifQ.signature"
```

Or read from a file:

```bash
qs-jwt decode --jwt-file /path/to/token.txt
```

### Verifying Signature

Verify that the JWT was signed with a specific public key:

```bash
qs-jwt decode --jwt "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." \
  --cert-publickey-file /path/to/publickey.pem
```

### Verifying Audience

Verify that the JWT audience matches your expected value:

```bash
qs-jwt decode --jwt "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." \
  --cert-publickey-file /path/to/publickey.pem \
  --expected-audience "my-qlik-sense-app"
```

### JSON Output

Output the decoded JWT as JSON (useful for scripting):

```bash
qs-jwt decode --jwt "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." --minimal-output
```

## Output Format

### Normal Output

When running without `--minimal-output`, the command displays:

1. **JWT Header** - Contains metadata about the token (algorithm, type, key ID)
2. **JWT Payload** - Contains the claims (user information, timestamps, audience, etc.)
3. **Signature Verification** (if public key provided) - Shows verification status and details

Example:

```
JWT Header:
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "qs-jwt-key-2024"
}

JWT Payload:
{
  "userId": "johnsmith",
  "userDirectory": "MYDIR",
  "name": "John Smith",
  "email": "john.smith@example.com",
  "iat": 1717948800 (2024-06-09T12:00:00.000Z),
  "exp": 1717952400 (2024-06-09T13:00:00.000Z),
  "aud": "my-qlik-sense-app",
  "iss": "qs-jwt"
}

Signature Verification:
  Status: ✅ Valid
  Algorithm: RS256 (verified)
  Key ID: qs-jwt-key-2024
  Integrity: Token has not been tampered with
  Validity:
    Issued: 2024-06-09T12:00:00.000Z
    Expires: 2024-06-09T13:00:00.000Z
    Current: ✅ Valid (not expired)
  Audience: my-qlik-sense-app ✅
  Issuer: qs-jwt
```

### Minimal Output (JSON)

When using `--minimal-output`, the command outputs a JSON object:

```json
{
    "header": { "alg": "RS256", "typ": "JWT", "kid": "qs-jwt-key-2024" },
    "payload": {
        "userId": "johnsmith",
        "userDirectory": "MYDIR",
        "name": "John Smith",
        "email": "john.smith@example.com",
        "iat": 1717948800,
        "exp": 1717952400,
        "aud": "my-qlik-sense-app",
        "iss": "qs-jwt"
    },
    "verification": {
        "status": "valid",
        "algorithm": "RS256",
        "keyId": "qs-jwt-key-2024",
        "integrity": true,
        "issuedAt": "2024-06-09T12:00:00.000Z",
        "expiresAt": "2024-06-09T13:00:00.000Z",
        "notBefore": "N/A",
        "currentlyValid": true,
        "audience": "my-qlik-sense-app",
        "audienceMatch": true,
        "issuer": "qs-jwt"
    }
}
```

## Understanding the Output

### JWT Header

The header contains metadata about the token:

- **alg** - The algorithm used to sign the token (e.g., RS256)
- **typ** - The token type (always "JWT")
- **kid** - Key ID (optional) - identifies which key was used to sign the token

### JWT Payload

The payload contains the claims (data) embedded in the token:

- **userId** - The user ID that will be authenticated
- **userDirectory** - The user directory in Qlik Sense
- **name** - The user's display name
- **email** - The user's email address
- **iat** - Issued at time (Unix timestamp)
- **exp** - Expiration time (Unix timestamp)
- **nbf** - Not before time (optional - when the token becomes valid)
- **aud** - Audience (must match the Qlik Sense virtual proxy configuration)
- **iss** - Issuer (must match the Qlik Sense configuration)
- **group** - Groups the user belongs to (optional)

### Signature Verification

When a public key is provided, the command verifies:

- **Status** - ✅ Valid or ❌ Invalid
- **Algorithm** - The algorithm used (confirmed as verified)
- **Key ID** - Which key was used (if present in header)
- **Integrity** - Whether the token has been tampered with
- **Validity** - Time-based validity:
    - **Issued** - When the token was created
    - **Expires** - When the token expires
    - **Current** - Whether the token is currently valid (not expired)
- **Audience** - The audience claim (✅ if it matches `--expected-audience`)
- **Issuer** - Who issued the token

## Common Error Messages

### "Invalid JWT format. Expected 3 parts separated by dots"

The JWT is malformed. A valid JWT has three parts separated by dots: `header.payload.signature`. This error may also occur if you try to decode a JWE (encrypted) token, which is not supported.

### "Failed to decode JWT. Token may be malformed"

The JWT structure is invalid or the base64 encoding is incorrect.

### "Signature verification failed: jwt expired"

The token has expired. Check the `exp` claim in the payload to see when it expired. You'll need to create a new JWT with a longer expiration time.

### "Signature verification failed: jwt audience invalid"

The audience in the JWT doesn't match the expected audience. This could mean:

- The JWT was created for a different Qlik Sense virtual proxy
- The `--expected-audience` value is incorrect

### "Signature verification failed: invalid signature"

The signature doesn't match the provided public key. This could mean:

- The public key doesn't match the private key used to sign the JWT
- The token has been tampered with

## Tips

1. **Use the public key from your Qlik Sense configuration** - The same public key that's configured in your Qlik Sense virtual proxy should be used for verification.

2. **Check expiration times** - If API calls are failing with authentication errors, first check if the JWT has expired.

3. **Verify audience matches** - The audience in the JWT must exactly match the audience configured in your Qlik Sense virtual proxy.

4. **Use minimal output for scripting** - When integrating with scripts or automation, use `--minimal-output` to get clean JSON that's easy to parse.

5. **Store JWTs securely** - JWTs provide authentication access to Qlik Sense. Treat them like passwords and don't log or expose them unnecessarily.
