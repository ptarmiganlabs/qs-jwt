<h1 align="center">QS-JWT</h1>
<h3 align="center">Easily create Qlik Sense JWTs</h3>
<p align="center">
<a href="https://github.com/ptarmiganlabs/qs-jwt">
<img src="https://img.shields.io/badge/Source---" alt="Source"></a>
<a href="https://github.com/ptarmiganlabs/qs-jwt/actions/workflows/release-please.yml"><img src="https://github.com/ptarmiganlabs/qs-jwt/actions/workflows/release-please.yml/badge.svg?branch=main" alt="Continuous Integration"></a>
<a href="https://www.repostatus.org/#active"><img src="https://www.repostatus.org/badges/latest/active.svg" alt="Project Status: Active – The project has reached a stable, usable state and is being actively developed." /></a>
</p>

A cross platform, command line tool for creating JWTs (=JSON Web Tokens) that can be used to authenticate with Qlik Sense.  
qs-jwt is available on Windows, Linux and macOS.

JWTs for both client-managed Qlik Sense Enterprise on Windows (QSEoW) and Qlik Sense Cloud can be created.

qs-jwt nicely complements the more operationally focused open source tools in the [Butler family](https://github.com/ptarmiganlabs).  
Those tools focus on things such as real-time monitoring of client-managed Qlik Sense environments, flexible and powerful alerts/notifications when reloads fail, automatically creating sheet thumbnails and much more. More info at [https://github.com/ptarmiganlabs](https://github.com/ptarmiganlabs).

### Ptarmigan Labs

qs-jwt is sponsored by Ptarmigan Labs, a Swedish consulting company specialising in advanced Qlik Sense development.  
More info at [ptarmiganlabs.com](https://ptarmiganlabs.com) where you can also [sign up for the newsletter](https://ptarmiganlabs.com/#/portal/signup) that will give all Qlik related updates straight to your inbox.

<h2>Table of contents</h2>

- [Introduction](#introduction)
  - [JWT pros and cons](#jwt-pros-and-cons)
  - [Online JWT resources](#online-jwt-resources)
  - [What is qs-jwt](#what-is-qs-jwt)
- [Install](#install)
- [qs-jwt concepts](#qs-jwt-concepts)
  - [Command line tool](#command-line-tool)
  - [JWT claims](#jwt-claims)
- [Commands](#commands)
  - ["create-qseow" command](#create-qseow-command)
  - ["create-qscloud" command](#create-qscloud-command)
- [Modes of operation](#modes-of-operation)
  - [QSEoW: Create JWTs using existing private key file](#qseow-create-jwts-using-existing-private-key-file)
    - [Create a certificate using openssl](#create-a-certificate-using-openssl)
    - [Running qs-jwt on macOS](#running-qs-jwt-on-macos)
    - [Running qs-jwt on Windows Server](#running-qs-jwt-on-windows-server)
  - [QSEoW: Create JWTs using existing private key passed as parameter](#qseow-create-jwts-using-existing-private-key-passed-as-parameter)
    - [Running qs-jwt on macOS](#running-qs-jwt-on-macos-1)
    - [Running qs-jwt on Windows Server](#running-qs-jwt-on-windows-server-1)
  - [QSEoW: Create new certificate and key files, then create JWT](#qseow-create-new-certificate-and-key-files-then-create-jwt)
    - [Running qs-jwt on macOS](#running-qs-jwt-on-macos-2)
    - [Running qs-jwt on Windows Server](#running-qs-jwt-on-windows-server-2)
  - [QS Cloud: Create JWTs using existing private key file](#qs-cloud-create-jwts-using-existing-private-key-file)
    - [Running qs-jwt on macOS](#running-qs-jwt-on-macos-3)
    - [Running qs-jwt on Windows Server](#running-qs-jwt-on-windows-server-3)
  - [QS Cloud: Create JWTs using existing private key passed as parameter](#qs-cloud-create-jwts-using-existing-private-key-passed-as-parameter)
    - [Running qs-jwt on macOS](#running-qs-jwt-on-macos-4)
    - [Running qs-jwt on Windows Server](#running-qs-jwt-on-windows-server-4)
  - [QS Cloud: Create new certificate and key pair, then create JWT](#qs-cloud-create-new-certificate-and-key-pair-then-create-jwt)
    - [Running qs-jwt on macOS](#running-qs-jwt-on-macos-5)
    - [Running qs-jwt on Windows Server](#running-qs-jwt-on-windows-server-5)
- [Connecting to APIs using JWTs](#connecting-to-apis-using-jwts)
  - [Client-managed Qlik Sense (=QSEoW)](#client-managed-qlik-sense-qseow)
  - [Qlik Sense Cloud](#qlik-sense-cloud)
- [QSEoW: Using JWTs in security rules](#qseow-using-jwts-in-security-rules)
- [Logging](#logging)
- [Security and disclosure](#security-and-disclosure)
  - [Virus scanning](#virus-scanning)
    - [Positive scan vs false positives](#positive-scan-vs-false-positives)
  - [Signed binaries](#signed-binaries)

---

# Introduction

JSON Web Tokens (JWTs) are typically used to authenticate API access. It can be used for other kinds of authentication as well, in a Qlik Sense context it can for example also be used to authenticate a web mashup's access to Sense.

**Note that JWTs (when used with Qlik Sense) contain unencrypted information about users and provide access to the Qlik Sense system.  
In other words: Qlik Sense JWTs should be treated just like user IDs and password.**

[This](https://blog.logrocket.com/jwt-authentication-best-practices/) blog post nicely describes what JWTs are:

> A JWT is a mechanism to verify the owner of some JSON data. It’s an encoded, URL-safe string that can contain an unlimited amount of data (unlike a cookie) and is cryptographically signed.
>
> When a server receives a JWT, it can guarantee the data it contains can be trusted because it’s signed by the source. No middleman can modify a JWT once it’s sent.
>
> It’s important to note that a JWT guarantees data ownership but not encryption. The JSON data you store into a JWT can be seen by anyone that intercepts the token because it’s just serialized, not encrypted.
>
> For this reason, it’s highly recommended to use HTTPS with JWTs (and HTTPS in general, by the way).

So what does this mean in a Qlik Sense context?
Let's break it down a bit:

- Qlik Sense user credentials and other metadata is embedded in the JWT. Exactly what data is embedded differs a bit between QSEoW and Qlik Sense Cloud.
- Each JWT is configured with an expiry time. It's a good security principle to keep the expiry dates short.
- Additional metadata can be included in the JWT. Example include email address, real name, group belonging, access roles etc. This information is available in Sense security rules (security rules only exist on QSEoW).
- The JWT is not encrypted, but it is cryptographically signed. This means that it's not possible to modify or tamper with the JWT once it's been created.
- JWTs can be used with both client-managed Qlik Sense (=Qlik Sense Enterprise on Windows, QSEoW) as well as Qlik Sense Cloud. The exact format vary though, so those JWTs are not interchangeable.
- Once a tool presents the JWT to a Qlik Sense API, Sense will be able to access the contents of the JWT. If the JWT is used with QSEoW the information embedded in the JWT can be used in security rules.

## JWT pros and cons

Benefits of JWTs include

- The Qlik Sense admin can control which Sense user/account is given API access and how long that access will be valid for.
- The JWT can include any metadata that will then be available in Sense security rules.
- Well-established, proven concept to provide authenticated API access.

Drawbacks of JWTs

- Once created and handed over to someone it's not possible to revoke the JWT. It will simply work until its expiry date has passed or the central certificate is changed. But that will revoke *all* JWTs created using that certificate/key.
- The revoking issue can be solved, but this requires additional software/services outside of Qlik Sense. Sense itself does not have a built-in revokation service.
- The JWT used with Qlik Sense are not encrypted. This means they can be read by anyone able to listen on the network traffic. Using https goes a long way towards solving this problem.

## Online JWT resources

- [jwt.io](https://jwt.io) is a good starting point for anything JWT related.
- [Blog post](https://blog.logrocket.com/jwt-authentication-best-practices/) explaining how JWTs can be used for authentication
- qlik.dev has good articles about [using JWTs with QSEoW](https://qlik.dev/tutorials/using-qlik-sense-on-windows-repository-api-qrs-with-qlik-cli) as well as with [Qlik Sense Cloud](https://qlik.dev/tutorials/create-signed-tokens-for-jwt-authorization).
- Qlik Sense Enterprise on Windows [help pages](https://help.qlik.com/en-US/sense-admin/February2022/Subsystems/DeployAdministerQSE/Content/Sense_DeployAdminister/QSEoW/Administer_QSEoW/Managing_QSEoW/JWT-authentication.htm) has a good description of JWT authentication within QSEoW.
- Qlik article describing how to [set up a JWT enabled virtual proxy](https://community.qlik.com/t5/Knowledge/Qlik-Sense-How-to-set-up-JWT-authentication/ta-p/1716226) in QSEoW.

## What is qs-jwt

JWTs can be created using various online tools.

This can be fine during development and testing, but in production scenarious it's not ideal (should not be accepted - period!) to enter user credentials in some random web page.  

If limited to web based JWT tools it is also difficult or impossible to automate creation of JWTs.  
While not a problem for some it may be a showstopper for others, for example if the JWTs are created with short expiry times and/or need to be automatically recreated.

> *The core idea behind qs-jwt is to simplify JWT creation and make it easier to include JWTs in CI/CD pipelines and similar scenarios.*

# Install

qs-jwt does not need to be installed.  
It is a standalone, cross-platform executable that is just downloaded and executed.

The latest version is always available from the [download page](https://github.com/ptarmiganlabs/qs-jwt/releases).

Make sure to check for new versions (and star the [GitHub repositry](https://github.com/ptarmiganlabs/qs-jwt) and subscribe to updates!) - new features are added and security updates applied.

# qs-jwt concepts

## Command line tool

qs-jwt is a command line tool intended to be used from scripts written in Powershell, bash or similar shells.  
Or just from the command line for one-off creation of JWTs.

Given the focus on integration in various automation scenarios, all needed information is passed to qs-jwt as parameters and options.

There are thus - by design - no interactive prompts what so ever in qs-jwt.

## JWT claims

A JWT "claim" is a piece of information that's included in the JWT. Examples include email address, user name, group belongings and other metadata associated with user accounts.

Claims may sound like a strange term for this, but you can think of it as metadata presented by the calling system to Qlik Sense during the API call. The fact that the JWT is signed means Sense can trust that the JWT has not been modified since it was created.

# Commands

Run `qs-jwt --help` to get a list of available commands and options  

```bash
➜  demo-dir ./qs-jwt --help
Usage: qs-jwt [options] [command]

This is a tool that creates JWTs (JSON Web Tokens) that can be used with Qlik Sense Enterprise on Windows (client-managed) as well as Qlik Sense Cloud (SaaS).
The JWTs can be used when accessing Sense APIs from third party applications and services.
JWTs are usually preferred over certificates as JWTs embed a specific user, which means access control can be applied when JWTs are used.

Options:
  -V, --version             output the version number
  -h, --help                display help for command

Commands:
  create-qseow [options]    Create a JWT for use with client-managed Qlik Sense (a.k.a Qlik Sense Enterprise on Windows).
  create-qscloud [options]  Create a JWT for use with Qlik Sense Cloud.
  help [command]            display help for command
➜  demo-dir➜  demo-dir
```

## "create-qseow" command

Purpose: To create a new JWT that can be used with client-managed Qlik Sense.

Syntax:

```bash
➜  demo-dir ./qs-jwt create-qseow --help
Usage: qs-jwt create-qseow [options]

Create a JWT for use with client-managed Qlik Sense (a.k.a Qlik Sense Enterprise on Windows).

Options:
  --loglevel <level>                 Logging level (choices: "error", "warning", "info", "verbose", "debug", default: "info")
  --userdir <directory>              user directory (e.g. MYDIRNAME) that will be embedded in the JWT
  --userid <userid>                  user ID (e.g. johnsmith) that will be embedded in the JWT
  --username <name>                  User name (e.g. John Smith) that will be embedded in the JWT
  --useremail <email>                Email address that will be embedded in the JWT
  --groups <groups...>               Groups associated with the user dir/ID.
  --expires <time>                   Time during which the JWT will be valid. Examples: 60m (60 minutes), 48h (48 hours), 365d (365
                                     days), 5y (5 years)
  --audience <audience>              JWT audience field. Audience in JWT must match the audience defined in the QSEoW virtual proxy
                                     being used
  --cert-privatekey-file <file>      File containing private key of certificate that will be used to sign the JWT
  --cert-privatekey <privatekey>     Private key of certificate that will be used to sign the JWT.
  --cert-create [true|false]         Should a new certificate be created? (choices: "true", "false", default: "false")
  --cert-file-prefix <prefix>        Prefix to place before certificate file names (default: "")
  --cert-create-expires-days <days>  Number of days the new certificate should be valid for
  -h, --help                         display help for command
➜  demo-dir
```

## "create-qscloud" command

Purpose: To create a new JWT that can be used with Qlik Sense Cloud.

Syntax:

```bash
➜  demo-dir ./qs-jwt create-qscloud --help
Usage: qs-jwt create-qscloud [options]

Create a JWT for use with Qlik Sense Cloud.

Options:
  --loglevel <level>                 Logging level (choices: "error", "warning", "info", "verbose", "debug", default: "info")
  --useremail <email>                Email address that will be embedded in the JWT
  --useremail-verified <name>        Claim indicating that the creator of thw JWT has verified that the email address belongs to the
                                     user.
  --username <name>                  User name (e.g. John Smith) that will be embedded in the JWT
  --groups <groups...>               Groups associated with the user.
  --issuer <issuer>                  JWT Issuer field. Must match the issuer in the Qlik Sense Cloud JWT IdP.
  --keyid <id>                       JWT key ID. Must match the Key ID in the Qlik Sense Cloud JWT IdP.
  --expires <time>                   Time during which the JWT will be valid. Examples: 60m (60 minutes), 48h (48 hours), 365d (365
                                     days), 5y (5 years).
  --cert-privatekey-file <file>      File containing private key of certificate that will be used to sign the JWT.
  --cert-privatekey <privatekey>     Private key of certificate that will be used to sign the JWT.
  --cert-create [true|false]         Should a new certificate be created? (choices: "true", "false", default: "false")
  --cert-file-prefix <prefix>        Prefix to place before certificate file names. (default: "")
  --cert-create-expires-days <days>  Number of days the new certificate should be valid for
  -h, --help                         display help for command
➜  demo-dir
```

# Modes of operation

There are a couple of things to consider when creating JWTs for Qlik Sense:

- Will the JWT be used with client-managed Qlik Sense (=Qlik Sense Enterprise on Windows, QSEoW) or with Qlik Sense cloud? These use JWTs with slightly different structure inside.
- Do you already have a certificate/private key, or do you need to create those first?

Both points above are supported and handled by qs-jwt:  
qs-jwt supports creating JWTs for both QSEoW and Qlik Sense Cloud and qs-jwt can either use an existing certificate/key or create new ones.

The different use cases are described in the following sections.

## QSEoW: Create JWTs using existing private key file

![qs-jwt using existing cert and key files](./docs/img/qs-jwt-qseow-existing-cert-file-1.png "qs-jwt using existing cert and key files")

If you already have a certificate with an associated private key (PEM encoded), that key can (proably) be used to sign the created JWT. The public part of the certificate is entered in the QSEoW virtual proxy configuration.

An example could be if Qlik Sense is running in Azure/Google Cloud/Amazon EC2 and you use their various feature for handling secrets and certificates.  
A certificate and associated private key can then be created and stored there and then used with qs-jwt.

You could in theory sign JWTs with the certificate/key created as part of every QSEoW installation, that is however not recommended except (barely) for testing purposes. Much better and more flexible to have a cert/key dedicated for JWT creation and authentication.

### Create a certificate using openssl

If you want to create a certificate and a private key manually that's easy too.

On macOS it can look like this:

```bash
➜  demo-dir ll
total 236448
-rwxr-xr-x@ 1 goran  staff   115M Mar 14 06:56 qs-jwt
➜  demo-dir
➜  demo-dir openssl genrsa -out privatekey.pem 4096
Generating RSA private key, 4096 bit long modulus
.......................................................................................................................................................................................................................................................................................................................................++
...............................................................++
e is 65537 (0x10001)
➜  demo-dir
➜  demo-dir openssl req -new -x509 -key privatekey.pem -out publickey.cer -days 1825
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) []:.
State or Province Name (full name) []:.
Locality Name (eg, city) []:.
Organization Name (eg, company) []:.
Organizational Unit Name (eg, section) []:.
Common Name (eg, fully qualified host name) []:qs-jwt
Email Address []:.
➜  demo-dir
➜  demo-dir ll
total 236464
-rw-r--r--  1 goran  staff   3.2K Mar 14 07:00 privatekey.pem
-rw-r--r--  1 goran  staff   1.6K Mar 14 07:01 publickey.cer
-rwxr-xr-x@ 1 goran  staff   115M Mar 14 06:56 qs-jwt
➜  demo-dir
```

Doing the same on Windows is a bit tricky as openssl is not natively supported on Windows. There are however several projects that make openssl available on Windows, for example [here](https://slproweb.com/products/Win32OpenSSL.html).

### Running qs-jwt on macOS

This example will

- Create a JWT for Qlik Sense Enterprise on Windows (the `create-qseow` command).
- Create a JWT for user `anna` in Sense userdirectory `GRUSGRUS`. "Grusgrus" is a fictitious company.
- The JWT will expire in 365 days.
- The private key in file `privatekey.pem` will be used to sign the JWT.
- Set claims for `useremail` and `username` to `anna@grusgrus.com` and `Anna Anderson`, respectively.
- The audience option must match the audience specified in the Qlik Sense virtual proxy.
- Two groups are defined for this user: `group1` and `group 2`. These correspond to groups in Qlik Sense.

Command (assuming the qs-jwt binary is available in the current directory):

```bash
./qs-jwt create-qseow --userdir GRUSGRUS --userid anna --username "Anna Anderson" --useremail "anna@grusgrus.com" --audience hdJh34wkK --cert-privatekey-file privatekey.pem --groups group1 "group 2" --expires 365d
```

![qs-jwt running on macOS, using existing key file](./docs/img/qs-jwt-qseow-macos-1.png "qs-jwt running on macOS, using existing key file")

### Running qs-jwt on Windows Server

This example uses a private key that was created using openssl, as describe above.

Remember: Don't forget to unblock the downloaded qs-jwt ZIP file before unzipping it.  
Failing to unblock it may prevent proper execution of qs-jwt.exe.

```powershell
qs-jwt.exe create-qseow --userdir GRUSGRUS --userid anna --username "Anna Anderson" --useremail "anna@grusgrus.com" --audience hdJh34wkK --cert-privatekey-file privatekey.pem --groups group1 "group 2" --expires 365d
```

![qs-jwt running on Windows Server 2016, using existing key file](./docs/img/qs-jwt-qseow-winsrv2016-1.png "qs-jwt running on Windows Server 2016, using existing key file")

## QSEoW: Create JWTs using existing private key passed as parameter

![qs-jwt using existing cert and key as parameters](./docs/img/qs-jwt-qseow-existing-cert-param-1.png "qs-jwt using existing cert and key as parameters")

### Running qs-jwt on macOS

This example will

- Set the environment variable `QSJWTPRIVKEY` to the contents of the private key in `privatekey.pem` file.
- Create a JWT for Qlik Sense Enterprise on Windows (the `create-qseow` command).
- Create a JWT for user `anna` in Sense userdirectory `GRUSGRUS`. Grusgrus is a fictitious company.
- The JWT will expire in 365 days.
- The private key in environment variable `QSJWTPRIVKEY` will be used to sign the JWT.
- Set claims for `useremail` and `username` to `anna@grusgrus.com` and `Anna Anderson`, respectively.
- The audience option must match the audience specified in the Qlik Sense virtual proxy.
- Two groups are defined for this user: `group1` and `group 2`. These correspond to groups in Qlik Sense.

Command (assuming the qs-jwt binary is available in the current directory):

```bash
export QSJWTPRIVKEY=$(cat ./privatekey.pem)
```

```bash
./qs-jwt create-qseow --userdir GRUSGRUS --userid anna --username "Anna Anderson" --useremail "anna@grusgrus.com" --audience hdJh34wkK --cert-privatekey "$QSJWTPRIVKEY" --groups group1 "group 2" --expires 365d
```

![qs-jwt running on macOS, using existing key file](./docs/img/qs-jwt-qseow-macos-2.png "qs-jwt running on macOS, using existing key file")

### Running qs-jwt on Windows Server

This example uses a private key that was created using openssl, as describe above.  
Here PowerShell is used to run qs-jwt, with the private key stored in an environment variable.

Remember: Don't forget to unblock the downloaded qs-jwt ZIP file before unzipping it. Failing to unblock it may prevent proper execution of qs-jwt.exe.

```powershell
$QSJWTPRIVKEY = Get-Content .\privatekey.pem -Raw
```

```powershell
.\qs-jwt.exe create-qseow --userdir GRUSGRUS --userid anna --username 'Anna Anderson' --useremail 'anna@grusgrus.com' --audience hdJh34wkK --cert-privatekey "$QSJWTPRIVKEY" --groups group1 'group 2' --expires 365d
```

![qs-jwt running on Windows Server 2016, using existing key file](./docs/img/qs-jwt-qseow-winsrv2016-2.png "qs-jwt running on Windows Server 2016, using existing key file")

## QSEoW: Create new certificate and key files, then create JWT

![qs-jwt creating both new cert, keys and JWT](./docs/img/qs-jwt-qseow-new-cert-1.png "qs-jwt creating both new cert, keys and JWT")

If you **do not** have a certificate with associated private key (PEM encoded) qs-jwt can create these for you.  
You will get a complete public-private key pair rather than just the private key (which is what qs-jwt uses).

The created certificate and keys will be stored on disk as `privatekey.pem`, `publickey.pem` and `publickey.cer`.  
An optional prefix can be added to the file names, this is done by using the `--cert-file-prefix` option.

### Running qs-jwt on macOS

This example will

- Create a JWT for Qlik Sense Enterprise on Windows (the `create-qseow` command).
- Create a JWT for user `anna` in Sense userdirectory `GRUSGRUS`. Grusgrus is a fictitious company.
- The JWT will expire in 365 days.
- A new private/public key pair will be created, as well as a new certificate based on that private key.
- The created files will be prefixed with `qsjwt_`.
- The created certificate will expire in 400 days.
- The newly created private key will be used to sign the JWT.
- Set claims for useremail and username to `anna@grusgrus.com` and `Anna Anderson`, respectively.
- The audience option must match the audience specified in the Qlik Sense virtual proxy.
- Two groups are defined for this user: `group1` and `group 2`.

Command (assuming the qs-jwt binary is available in the current directory):

```bash
./qs-jwt create-qseow --userdir GRUSGRUS --userid anna --username "Anna Anderson" --useremail "anna@grusgrus.com" --audience hdJh34wkK --cert-create true --cert-create-expires-days 400 --cert-file-prefix "qsjwt_" --groups group1 "group 2" --expires 365d
```

![qs-jwt running on macOS, creating new cert and keys](./docs/img/qs-jwt-qseow-macos-3.png "qs-jwt running on macOS, creating new cert and keys")

### Running qs-jwt on Windows Server

Here cmd.exe is used to run qs-jwt, PowerShell works equally well.

Remember: Don't forget to unblock the downloaded qs-jwt ZIP file before unzipping it. Failing to unblock it may prevent proper execution of qs-jwt.exe.

```powershell
.\qs-jwt.exe create-qseow --userdir GRUSGRUS --userid anna --username "Anna Anderson" --useremail "anna@grusgrus.com" --audience hdJh34wkK --cert-create true --cert-create-expires-days 400 --cert-file-prefix "qsjwt_" --groups group1 "group 2" --expires 365d
```

![qs-jwt running on Windows Server 2016, creating new cert and key](./docs/img/qs-jwt-qseow-winsrv2016-3.png "qs-jwt running on Windows Server 2016, creating new cert and key")

## QS Cloud: Create JWTs using existing private key file

The concept is identical to using QSEoW, [please see that section](#qseow-create-jwts-using-existing-private-key-file) for an overview.

### Running qs-jwt on macOS

This example will

- Create a JWT for Qlik Sense Cloud (the `create-qscloud` command).
- The JWT will expire in 365 days.
- The private key in file `privatekey.pem` will be used to sign the JWT.
- Set claims for useremail and username to `anna@grusgrus.com` and `Anna Anderson`, respectively.
- Set claim for verified email address to `true`.
- The issuer option must match ditto specified in the Qlik Sense JWT IdP (Identify Provider).
- The keyid option must match ditto specified in the Qlik Sense JWT IdP.  
- Two groups are defined for this user: `group1` and `group 2`.

Command (assuming the qs-jwt binary is available in the current directory):

```bash
./qs-jwt create-qscloud --username "Anna Anderson" --useremail "anna@grusgrus.com" --useremail-verified true --issuer "<removed>.eu.qlikcloud.com" --keyid "<removed>" --expires 365d --cert-privatekey-file ./privatekey.pem
```

![qs-jwt running on macOS, using existing key file](./docs/img/qs-jwt-qscloud-macos-1.png "qs-jwt running on macOS, using existing key file")

### Running qs-jwt on Windows Server

This example uses a private key that was created using openssl, as describe above.  
No groups are included in the JWT in this example.

Remember: Don't forget to unblock the downloaded qs-jwt ZIP file before unzipping it. Failing to unblock it may prevent proper execution of qs-jwt.exe.

```powershell
qs-jwt.exe create-qscloud --username "Anna Anderson" --useremail "anna@grusgrus.com" --useremail-verified true --issuer "<removed>.eu.qlikcloud.com" --keyid "<removed>" --expires 365d --cert-privatekey-file ./privatekey.pem
```

![qs-jwt running on Windows Server 2016, using existing key file](./docs/img/qs-jwt-qscloud-winsrv2016-1.png "qs-jwt running on Windows Server 2016, using existing key file")

## QS Cloud: Create JWTs using existing private key passed as parameter

Same concept as for QSEoW, but adapted for QS Cloud.
### Running qs-jwt on macOS

This example will

- Set the environment variable `QSJWTPRIVKEY` to the contents of the private key in `privatekey.pem` file.
- Create a JWT for Qlik Sense Cloud (the `create-qscloud` command).
- The JWT will expire in 365 days.
- The private key in environment variable `QSJWTPRIVKEY` will be used to sign the JWT.
- Set claims for useremail and username to `anna@grusgrus.com` and `Anna Anderson`, respectively.
- Set claim for verified email address to `true`.
- The issuer option must match ditto specified in the Qlik Sense JWT IdP (Identify Provider).
- The keyid option must match ditto specified in the Qlik Sense JWT IdP.  
- Two groups are defined for this user: `group1` and `group 2`.

Command (assuming the qs-jwt binary is available in the current directory):

```bash
export QSJWTPRIVKEY=$(cat ./privatekey.pem)
```

```bash
./qs-jwt create-qscloud --username "Anna Anderson" --useremail "anna@grusgrus.com" --useremail-verified true --issuer "<removed>.eu.qlikcloud.com" --keyid "<removed>" --expires 365d --cert-privatekey "$QSJWTPRIVKEY" --groups group1 "group 2"
```

![qs-jwt running on macOS, using existing private key file](./docs/img/qs-jwt-qscloud-macos-2.png "qs-jwt running on macOS, using existing private key file")

### Running qs-jwt on Windows Server

This example uses a private key that was created using openssl, as described above.  
Here PowerShell is used to run qs-jwt, with the private key stored in an environment variable.

Remember: Don't forget to unblock the downloaded qs-jwt ZIP file before unzipping it. Failing to unblock it may prevent proper execution of qs-jwt.exe.

```powershell
$QSJWTPRIVKEY = Get-Content .\privatekey.pem -Raw
```

```powershell
.\qs-jwt.exe create-qscloud --username "Anna Anderson" --useremail "anna@grusgrus.com" --useremail-verified true --issuer "<removed>.eu.qlikcloud.com" --keyid "<removed>" --expires 365d --cert-privatekey "$QSJWTPRIVKEY" --groups group1 "group 2"
```

![qs-jwt running on Windows Server 2016, using existing private key file](./docs/img/qs-jwt-qscloud-winsrv2016-2.png "qs-jwt running on Windows Server 2016, using existing private key file")

## QS Cloud: Create new certificate and key pair, then create JWT

![qs-jwt creating both new cert, keys and JWT](./docs/img/qs-jwt-qscloud-new-cert-1.png "qs-jwt creating both new cert, keys and JWT")

If you **do not** have a certificate with associated private key (PEM encoded) qs-jwt can create these for you.  
You will get a complete public-private key pair + certificate based on the private key, rather than just the private key (which is what qs-jwt uses).

The created certificate and keys will be stored on disk as `privatekey.pem`, `publickey.pem` and `publickey.cer`.  
An optional prefix can be added to the file names, this is done by using the `--cert-file-prefix`  option.

### Running qs-jwt on macOS

This example will

- Create a JWT for Qlik Sense Cloud (the `create-qscloud` command).
- The JWT will expire in 365 days.
- A new private/public key pair will be created, as well as a new certificate based on that private key.
- The created files will be prefixed with `qsjwt_`.
- The created certificate will expire in 400 days.
- The newly created private key will be used to sign the JWT.
- Set claims for useremail and username to `anna@grusgrus.com` and `Anna Anderson`, respectively.
- Set claim for verified email address to `true`.
- The issuer option must match ditto specified in the Qlik Sense JWT IdP (Identify Provider).
- The keyid option must match ditto specified in the Qlik Sense JWT IdP.  
- Two groups are defined for this user: `group1` and `group 2`.

Command (assuming the qs-jwt binary is available in the current directory):

```bash
./qs-jwt create-qscloud --username "Anna Anderson" --useremail "anna@grusgrus.com" --useremail-verified true --issuer "<removed>.eu.qlikcloud.com" --keyid "<removed>" --expires 365d --cert-create true --cert-create-expires-days 400 --cert-file-prefix "qsjwt_" --groups group1 "group 2"
```

![qs-jwt running on macOS, creating new cert and key](./docs/img/qs-jwt-qscloud-macos-3.png "qs-jwt running on macOS, creating new cert and key")

### Running qs-jwt on Windows Server

Here cmd.exe is used to run qs-jwt, PowerShell works equally well.

Remember: Don't forget to unblock the downloaded qs-jwt ZIP file before unzipping it. Failing to unblock it may prevent proper execution of qs-jwt.exe.

```powershell
.\qs-jwt.exe create-qscloud --username "Anna Anderson" --useremail "anna@grusgrus.com" --useremail-verified true --issuer "<removed>.eu.qlikcloud.com" --keyid "<removed>" --expires 365d --cert-create true --cert-create-expires-days 400 --cert-file-prefix "qsjwt_" --groups group1 "group 2"
```

![qs-jwt running on Windows Server 2016, creating new cert and key](./docs/img/qs-jwt-qscloud-winsrv2016-3.png "qs-jwt running on Windows Server 2016, creating new cert and key")

# Connecting to APIs using JWTs

## Client-managed Qlik Sense (=QSEoW)

A couple of things are needed to connect to a QSEoW API using a JWT:

1. A virtual proxy configured to use JWT authentication
2. A JWT containing the claims required by Qlik Sense.

The call is then made with the JWT passed along in the "Authentication" http header, using a "Bearer" prefix.

A XSRF protection header is also needed.  
This is a combination of an http parameter (`Xrfkey`) and a header (`X-Qlik-Xrfkey`), both which should have the same, 16 character string. Ideally it should be a random string that's not re-used between calls.

Using cURL on macOS it can look like this:

```bash
➜  demo-dir curl "https://qliksense.some.company.com/jwt/qrs/about?Xrfkey=abcdefghij123456" \
-H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJnb3JhbiIsInVzZXJEaXJlY3RvcnkiOiJMQUIiLCJuYW1lIjoiR8O2cmFuIFNhbmRlciIsImVtYWlsIjoiIiwiaWF0IjoxNjQ3NjIxMTk2LCJleHAiOjE2NzkxNTcxOTYsImF1ZCI6ImFiYzEyMyJ9.Pr3CEVlP1HI2Pd__mhooJPrngU_yME7LNHMYRdAjVU0UPUbWgGk2ilABl8AI5W3NEPewWx_Ks-q7JRjKLh7pBkENCR0eiNpwAHrt2xvK0ZBa8XPNYdwJ6ZUf9_lZPsGZhgfeZLpcQU-8jQNpEr770NKZMknMLd1bDyDvKLVZuTbx3iAew4T_sTNZsPMPe-zN05CmOgYyjEfExGWN31_iQp3njLiBtCOf5TmjoZmXw2T_BFQKMhyx6B-hE4vjnOH13EqPclwjpHA1ovrjQlwGyZ6Mwgtrb0wIEUVqijWqkLMVmxNIgHsQn7beFaGWVZVnBDe1cvyNuBiUtQ74yineCtl31xOu8qV2Ls2R19FA-JqwHQUq_amddd06HEvxepaXtnvvTnQvyeXbDOU62MsLZwr9wByJvEEFPLCN7ZLFUe3pN7FwyYhy8fZPylUFJH6XfrA8lyMUJBGUCEe3iyONclKKj2ifizxtO5ETdXuZ7w6Q1kPI8y1eD6scYZcmxhEowzEjWgAjFWPGLHhO9sINqRLcGZFhwW9TxeRgUwQd4_2MG4Z3ctip0UvBjseQcO7XrBjVF0h70iXkyOF51okrzK21IB24rGDnoEV2fgUZ_Nz9nN5qJwyzfSLcctg0I80T99VE3YmjcEMZNSZE3mfA6lAGvXuw7yDXOwPvCik8oX4' \
-H 'X-Qlik-Xrfkey: abcdefghij123456'

{"buildVersion":"30.4.0.0","buildDate":"10/8/2021 12:43:37 PM","databaseProvider":"Devart.Data.PostgreSql","nodeType":1,"sharedPersistence":true,"requiresBootstrap":false,"singleNodeOnly":false,"schemaPath":"About"}%
➜  demo-dir
```

Powershell on Windows Server 2016:

![Calling QSEoW API from Windows Server 2016 using JWT](./docs/img/qs-jwt-qseow-winsrv2016-api-powershell-1.png "Calling QSEoW API from Windows Server 2016 using JWT")

Powershell on macOS:

![Calling QSEoW API from macOS using JWT](./docs/img/qs-jwt-qseow-macos-api-powershell-1.png "Calling QSEoW API from macOS using JWT")

## Qlik Sense Cloud

These days (May 2023) JWTs are enabled on all Qlik Cloud tentants by default. In the past this feature was enabled for tenants only on a case-by-case basis - that is no longer the case though.

Qlik Sense Cloud is quite flexible when it comes to authentication and Identify Providers (IdPs) and there are officially supported options (e.g. some OAuth based variant) that can probably be used in most scenarios where JWTs are considered.  
Still, JWTs are a simple and proven concept that has its own advantages.

Using JWTs with Qlik Sense Cloud consists of two parts:

1. Do a call to the `/login/jwt-session` endpoint, including the JWT Authentication http header. This will return a set of cookies.
2. Call the desired [API](https://qlik.dev/apis). Include the session cookies from step 1. The JWT Authentication header is not needed here.

Using cURL on macOS:

```bash
➜  demo-dir curl \
  -X "POST" \
  "https://<removed>.eu.qlikcloud.com/login/jwt-session" \
  -H 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjAzMzBkM2U3LTE5NjYtNDFjNC1iM2VmLWQzMTFkMWZmNzE5MSJ9.<removed>kIWTxUZf7tv258UUSj4Ef1tYCdYA' \
  -c cookies.txt
OK%
➜  demo-dir curl "https://<removed>.eu.qlikcloud.com/api/v1/spaces" -b cookies.txt
{"data":[{"id":"619516<removed>bedb","type":"managed","ownerId":"2jG2t<removed>SgXmj3","tenantId":"Ev1d<removed>N7OO","name":"ChargeAmps EV charging","description":"Metrics from an 18-node charging network for electrical vehicles.","meta":{"actions":["create","read","update","delete","publish"],"roles":[],"assignableRoles":["consumer","contributor","dataconsumer","facilitator","publisher"]},"links":{"self":{"href":"https://<removed>.eu.qlikcloud.com/api/v1/spaces/619<removed>bedb"},"assignments":{"href":"https://<removed>.eu.qlikcloud.com/api/v1/spaces/6195<removed>edb/assignments"}},"createdAt":"2021-11-17T14:50:03.619Z","createdBy":"2jG2t<removed>gXmj3","updatedAt":"2021-11-17T14:50:16.715Z"}],"meta":{"count":1},"links":{"self":{"href":"https://<removed>.eu.qlikcloud.com/api/v1/spaces"}}}
➜  demo-dir
```

Powershell on Windows Server 2016:

![Calling QSEoW API from Windows Server 2016 using JWT](./docs/img/qs-jwt-qscloud-winsrv2016-api-powershell-1.png "Calling QSEoW API from Windows Server 2016 using JWT")

Powershell on macOS:

![Calling QSEoW API from macOS using JWT](./docs/img/qs-jwt-qscloud-macos-api-powershell-1.png "Calling QSEoW API from macOS using JWT")

# QSEoW: Using JWTs in security rules

Any claim embedded in the JWT can be used in QSEoW security rules.

The claims are available as `user.environment.<claim name>` in the security rules.  
You must write the security rule manually in the Conditions text box (i.e. the authoring tool doesn't work for JWT claims).

A rule that gives access to a specific stream for all JWTs where the `group` claim is "group 2" can look like this:

![QSEoW security rule using data from a JWT](./docs/img/qs-jwt-qseow-rule-1.png "QSEoW security rule using data from a JWT")

# Logging

Possible qs-jwt logging levels are `error`, `warning`, `info`, `verbose`, `debug`.

Default logging level is `info`

# Security and disclosure

qs-jwt is open source and you have access to all source code.  
It is **your own responsibility** to determine if qs-jwt is suitable for **your** use case.
The creators of qs-jwt, including Ptarmigan Labs, Göran Sander or any other contributor, can and must never be held liable to past or future security issues of qs-jwt.
If you have security concerns or ideas around qs-jwt, please get involved in the project and contribute to making it better!

    If you discover a serious bug with qs-jwt that may pose a security problem, please disclose it  
    confidentially to security@ptarmiganlabs.com first, so it can be assessed and hopefully fixed  
    prior to being exploited.  
    
    Please do not raise GitHub issues for serious security-related doubts or problems.

## Virus scanning

Every time a qs-jwt release is done the created binaries are sent to [VirusTotal](https://www.virustotal.com/) for scanning.  
VirusTotal acts as an aggregated virus scanner that sends the qs-jwt binaries to dozens of anti-virus scanners, including many of the major, established ones.  

Links to the VirusTotal scan report are included in each release notes, making it easy to check the status of each binary:

![VirusTotal scans as part of qs-jwt release notes](docs/img/virustotal_release_4.png "VirusTotal scans as part of qs-jwt release notes")

A VirusTotal scan that reports "no risks found" can look like this:

![VirusTotal scans with no risks found](docs/img/virustotal_scan_clear_4.png "VirusTotal scans with no risks found")

### Positive scan vs false positives

If one or more of the security vendors used by VirusTotal reports an issue you have to make a decision.  
Is it a real issue or a false positive?

You have to decide this yourself, but some general lines of thought can be:

    Is it a single vendor that reports the qs-jwt binary file to be a risk, or several vendors?
    If one vendor reports an issue and 60+ vendors don't, you might be looking at a false positive.

But again - at the end of the day it's **you** that must make that decision.

A scan where a single security vendor reports an issue can look like this:

![VirusTotal scans with one issue found](docs/img/virustotal_scan_1_issue_4.png "VirusTotal scans with one issue found")

## Signed binaries

The macOS executable binary is signed and notarized by Apple's standard process.  
A warning may still be shown first time the app is started. This is expected and normal.

The Windows executable binary is signed by "Ptarmigan Labs AB".
