# Optional username and email claims in created JWTs

## What changed

The `create-qseow` and `create-qscloud` commands no longer require the `--username` and `--useremail` options.

## Why this matters

Some Qlik Sense integrations only need a stable user ID and other core JWT claims. In those cases, forcing a display name or email address on the command line adds extra work without improving authentication.

This change makes it easier to create JWTs when that information is not available or is managed somewhere else.

## User-facing impact

You can now omit `--username` and `--useremail` when creating JWTs for:

- Qlik Sense Enterprise on Windows (`create-qseow`)
- Qlik Sense Cloud (`create-qscloud`)

If you do provide those options, they are still included in the JWT as before.

## Examples

Create a QSEoW JWT without display name or email:

```bash
qs-jwt create-qseow \
  --userdir MYDIR \
  --userid service-account \
  --audience my-proxy \
  --expires 1h \
  --cert-privatekey-file /path/to/private.pem
```

Create a Qlik Sense Cloud JWT without display name or email (`--useremail-verified` is only needed if you also pass `--useremail`):

```bash
qs-jwt create-qscloud \
  --issuer my-jwt-idp \
  --keyid my-key-id \
  --expires 1h \
  --cert-privatekey-file /path/to/private.pem
```

## Migration notes

No migration is required. Existing scripts that already pass `--username` and `--useremail` continue to work unchanged.
