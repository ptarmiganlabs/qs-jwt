<h1 align="center">QS-JWT</h1>
<h3 align="center">Easily create Qlik Sense JWTs</h3>
<p align="center">
<a href="https://github.com/ptarmiganlabs/qs-jwt"><img src="https://img.shields.io/badge/Source---" alt="Source"></a>
<a href="https://github.com/ptarmiganlabs/qs-jwt/actions/workflows/docker-image-build.yml"><img src="https://github.com/ptarmiganlabs/qs-jwt/actions/workflows/docker-image-build.yml/badge.svg" alt="Continuous Integration"></a>
<a href="https://github.com/ptarmiganlabs/qs-jwt/actions/workflows/selfhosted-test-macos.yml"><img src="https://github.com/ptarmiganlabs/qs-jwt/actions/workflows/selfhosted-test-macos.yml/badge.svg?branch=main" alt="Continuous Integration"></a>
<a href="https://github.com/ptarmiganlabs/qs-jwt/actions/workflows/selfhosted-test-winsrv2016.yml"><img src="https://github.com/ptarmiganlabs/qs-jwt/actions/workflows/selfhosted-test-winsrv2016.yml/badge.svg?branch=main" alt="Continuous Integration"></a>
</p>

A cross platform, command line tool for creating JWTs (=JSON Web Tokens) that can be used to authenticate with Qlik Sense.
JWTs for both Qlik Sense Cloud and Qlik Sense Enterprise on Windows (QSEoW) can be created.

qs-jwt nicely complements the more operationally focused open source tools in the [Butler family](https://github.com/ptarmiganlabs).  
Those tools focus on things such as real-time monitoring of client-managed Qlik Sense environments, flexible and powerful alerts/notifications when reloads fail, automatically creating sheet thumbnails and much more. More info at [https://github.com/ptarmiganlabs](https://github.com/ptarmiganlabs).

<h2>Table of contents</h2>

- [Introduction](#introduction)
  - [JWT pros and cons](#jwt-pros-and-cons)
  - [Online JWT resources](#online-jwt-resources)
  - [What is qs-jwt](#what-is-qs-jwt)
- [Install](#install)
- [qs-jwt concepts](#qs-jwt-concepts)
  - [Command line tool](#command-line-tool)
  - [JWT claims](#jwt-claims)
- [Modes of operation](#modes-of-operation)
  - [Getting help](#getting-help)
  - [QSEoW: Create JWTs using existing certificate and private key files](#qseow-create-jwts-using-existing-certificate-and-private-key-files)
    - [Running qs-jwt on macOS](#running-qs-jwt-on-macos)
    - [Running qs-jwt on Windows Server 2016](#running-qs-jwt-on-windows-server-2016)
  - [QSEoW: Create JWTs using existing certificate and private passed as parameters](#qseow-create-jwts-using-existing-certificate-and-private-passed-as-parameters)
  - [QSEoW: Create new certificate and key pair, then create JWT](#qseow-create-new-certificate-and-key-pair-then-create-jwt)
- [Logging](#logging)
- [Security and isclosure](#security-and-isclosure)

---

# Introduction

JSON Web Tokens (JWTs) is a way to authenticate API access. It can be used for other kinds of authentication as well, but with respect to Qlik Sense the API auth use case is the most relevant one.

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

- A Qlik Sense user directory and id is embedded in the JWT.
- Once a tool presents the JWT to a Qlik Sense API, Sense will be able to use the user dir/id in the JWT to first authenticate the user, then also decide (using security rules) what the user should be allowed to do in Sense.
- Each JWT can be configured with an expiry time. It's a good security principle to keep the expiry dates short.
- Additional metadata can be included in the JWT. Example include email address, real name, group belonging, access roles etc. This information is available in Sense security rules.
- The JWT is not encrypted, but it is cryptographically signed. This means that it's not possible to modify or tamper with the JWT once it's been created.
- JWTs can be used with both client-managed Qlik Sense (=Qlik Sense Enterprise on Windows, QSEoW) as well as Qlik Sense Cloud.

## JWT pros and cons

Benefits of JWTs include

- The Qlik Sense admin can control both who gets API access and how long that access will be valid for
- The JWT can include any metadata
- Well-established, proven concept

Drawbacks of JWTs

- Once created and handed over to someone it's not possible to revoke the JWT. It will simply work until its expiry date has passed.
- The revoking issue can be solved, but this requires additional software/services outside of Qlik Sense. Sense itself does not have a built-in revokation service.
- The JWT used with Qlik Sense are not encrypted. This means they can be read by anyone able to listen on the network traffic. Using https solves this problem.

## Online JWT resources

- [jwt.io](https://jwt.io) is a great starting point for anything JWT related.
- [Blog post](https://blog.logrocket.com/jwt-authentication-best-practices/) explaining how JWTs can be used for authentication
- qlik.dev has good articles about [using JWTs with QSEoW](https://qlik.dev/tutorials/using-qlik-sense-on-windows-repository-api-qrs-with-qlik-cli) as well as with [Qlik Sense Cloud](https://qlik.dev/tutorials/create-signed-tokens-for-jwt-authorization).

## What is qs-jwt

JWTs can be created using various online tools.  
This can be fine during development and testing, but in production scenarious it's not be ideal (should not be accepted - period!) to enter user credentials in some random web page.  

If limited to web based JWT tools it is also difficult or impossible to automate creation of JWTs.  
While not a problem for some it may be a showstopper for others, for example if the JWTs are created with short expiry times and need to be automatically recreated.  

> *The core idea behind qs-jwt is to simplify JWT creation and make it easier to include JWTs in CI/CD pipelines and similar scenarios.*

# Install

qs-jwt does not need to be installed.  
It is a standalone, cross-platform executable that is just downloaded and executed.

The latest version is always available from the [download page](https://github.com/ptarmiganlabs/qs-jwt/releases).  
Make sure to check for new versions (or subscribe to updates) - new features are added and security updates applied.

# qs-jwt concepts


## Command line tool

qs-jwt is a command line tool intended to be used from scripts written in Powershell, bash or similar shells.  
Or just from the command line for one-off creation of JWTs.

Given the above focus on integration in various automation scenarios, all needed information are passed in as parameters to the tool.  
There are thus - by design - no interactive prompts what so ever in qs-jwt.

## JWT claims

A JWT "claim" is a piece of information that's included in the JWT. Examples include email address, user name, group belongings etc.  
Claims may sound like a strange term for this, but you can think of it as metadata presented by the calling system to Qlik Sense during the API call.

# Modes of operation

There are a few different variants to consider when creating JWTs for Qlik Sense:

- Will the JWT be used with client-managed Qlik Sense (=Qlik Sense Enterprise on Windows, QSEoW) or with Qlik Sense cloud? 
  These use JWTs with slightly different structure inside.
- Do you already have a crypto certificate with an associated key pair, or do you need to create one first?

qs-jwt currently supports creating JWTs for QSEoW, but Qlik Sense Cloud support is around the corner.  
The certificate question is handled though: qs-jwt can either use existing certificate/keys or create new ones.

## Getting help

You can always pass in the `--help` option to see a complete list of all options:

```bash



```

## QSEoW: Create JWTs using existing certificate and private key files

![qs-jwt using existing cert and key files](./docs/img/qs-jwt-existing-cert-file-1.png "qs-jwt using existing cert and key files")

If you already have a certificate with associated key pair (PEM encoded) those can be used to sign the created JWT.

An example could be if Qlik Sense is running in Azure/Google Cloud/Amazon EC2 and you use their various feature for handling secrets and certificates. A certificate and key value pair can then be created and stored there and then used with qs-jwt.

If you want to create a certificate and a private key manually that's easy too.  
On macOS it can look like this:

```bash
➜  qs-jwt openssl genrsa -out privatekey.pem 4096
Generating RSA private key, 4096 bit long modulus
..............................++
..................................++
e is 65537 (0x10001)
➜  qs-jwt openssl req -new -x509 -key privatekey.pem -out publickey.cer -days 1825
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
➜  qs-jwt ls -la
total 16
drwxr-xr-x   4 goran  staff   128 Mar 12 20:32 .
drwxr-xr-x  33 goran  staff  1056 Mar 12 20:31 ..
-rw-r--r--   1 goran  staff  3243 Mar 12 20:32 privatekey.pem
-rw-r--r--   1 goran  staff  1663 Mar 12 20:32 publickey.cer
➜  qs-jwt
```

Doing the same on Windows is a bit tricky as openssl is not natively supported on Windows. There are however several projects that make openssl available on Windows, for example [here](https://slproweb.com/products/Win32OpenSSL.html).

### Running qs-jwt on macOS

```bash

```

### Running qs-jwt on Windows Server 2016




## QSEoW: Create JWTs using existing certificate and private passed as parameters

![qs-jwt using existing cert and key as parameters](./docs/img/qs-jwt-existing-cert-param-1.png "qs-jwt using existing cert and key as parameters")


```bash
```

## QSEoW: Create new certificate and key pair, then create JWT

![qs-jwt creating both new cert, keys and JWT](./docs/img/qs-jwt-new-cert-1.png "qs-jwt creating both new cert, keys and JWT")

# Logging

Possible logging levels are `error`, `warning`, `info`, `verbose`, `debug`.

Default logging level is `info`

# Security and isclosure

qs-jwt is open source and you have access to all source code.  
It is *your own* responsibility to determine if qs-jwt is suitable for *your* use case.  
The creators of qs-jwt, including Ptarmigan Labs, Göran Sander or any other contributor, can never be held liable to past or future security issues of qs-jwt.  
If you have security concerns or ideas around qs-jwt, please get involved in the project and contribute to making it better!

> If you discover a serious bug with qs-jwt that may pose a security problem, please disclose it confidentially to security@ptarmiganlabs.com first, so that it can be assessed and hopefully fixed prior to being exploited. Please do not raise GitHub issues for security-related doubts or problems.
