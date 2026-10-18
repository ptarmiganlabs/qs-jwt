# The Windows download is digitally signed

**Applies to:** the Windows download of qs-jwt. The macOS download was already signed and notarized, and the Linux download is unaffected.

**Suggested target pages:** wherever the site covers downloading and installing the Windows binary, and the troubleshooting page (a "Windows warns about the publisher" symptom).

<!--
Do not publish until a release signed this way exists. Until then the newest Windows download is
still an unsigned one, and this page would tell administrators to expect a signature that download
does not carry.

The certificate details in the table come from the signing rehearsals of other Ptarmigan Labs tools,
which sign through the same Azure account and certificate profile. Check them against the first
qs-jwt release signed this way with the commands below, the issuing CA in particular, and set the
version gate from that release. Do not guess the version number.
-->

::: warning Requires qs-jwt X.Y.Z or later
Earlier Windows downloads, including 1.12.0 to 1.14.1, are not signed.
:::

## What changed

The Windows executable, `qs-jwt.exe`, now carries a digital signature. It is signed with a certificate issued to **Ptarmigan Labs AB**, the company behind qs-jwt, through Microsoft's Azure Artifact Signing service. Windows shows the publisher as Ptarmigan Labs AB.

Earlier Windows downloads carried no signature at all.

Nothing about how qs-jwt works has changed. This affects only how Windows identifies the file.

## What the signature does for you

**It proves where the file came from.** A valid signature confirms the executable was published by Ptarmigan Labs AB and has not been altered since, whether by a mirror, a proxy, or anything else between the release page and your machine.

**Publisher rules now work.** Many organisations enforce application control with AppLocker or Windows Defender Application Control, and allow programs by their publisher. An unsigned executable cannot be allowed by a publisher rule under any configuration, so earlier versions needed a file hash rule, which has to be replaced for every release. A publisher rule for Ptarmigan Labs AB covers every signed release.

**Antivirus false positives become less likely.** qs-jwt is a single-file executable built from the Node.js runtime, a construction that antivirus products sometimes flag. A valid signature helps, though it guarantees nothing.

## What you may need to do

**If you allowed qs-jwt by file hash,** consider replacing that rule with a publisher rule for Ptarmigan Labs AB. A hash rule matches one exact file, so it has to be updated for every release; a publisher rule does not.

**Do not allow it by certificate thumbprint.** Azure Artifact Signing issues short-lived certificates, valid for about three days and renewed automatically, so the thumbprint is different from one release to the next. A rule pinned to one thumbprint matches one release.

**Do not build the rule on the issuing CA either.** The certificate is issued by one of several numbered Microsoft CAs (see the table below), and a later release may be issued by another. Match on the publisher, Ptarmigan Labs AB, which stays the same. An AppLocker publisher rule matches on the publisher name. A Windows Defender Application Control rule at the Publisher level pairs the publisher with the CA one step below Microsoft's root, Microsoft ID Verified Code Signing PCA 2021, which also stays the same.

The signature stays valid after the certificate behind it expires. Every release is timestamped when it is signed, and Windows checks the certificate against that moment, not against today.

## Checking the signature yourself

In PowerShell, in the folder holding the executable:

```powershell
$sig = Get-AuthenticodeSignature -LiteralPath .\qs-jwt.exe
$sig | Format-List Status, StatusMessage
$sig.SignerCertificate | Format-List Subject, Issuer, NotBefore, NotAfter
$sig.TimeStamperCertificate | Format-List Subject
```

You can also right-click the file, choose **Properties**, and look at the **Digital Signatures** tab.

`Status` should read `Valid`, and the subject should name **Ptarmigan Labs AB**. `Valid` alone only means some trusted certificate signed the file; the publisher name is what says it was us.

|                       |                                                                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Issued to (publisher) | `Ptarmigan Labs AB`                                                                                                    |
| Issued by             | `Microsoft ID Verified CS AOC CA 03`. One of several numbered issuing CAs, so a release may show another number        |
| Above that            | `Microsoft ID Verified Code Signing PCA 2021`, under `Microsoft Identity Verification Root Certificate Authority 2020` |
| Timestamped by        | `Microsoft Public RSA Time Stamping Authority`                                                                         |
| Certificate lifetime  | About three days. A new certificate, and a new thumbprint, for each release                                            |

`NotAfter` will usually be a date close to the release, and may well be in the past by the time you check. That is expected, and `Status` still reads `Valid`, because of the timestamp.

## SmartScreen

Microsoft Defender SmartScreen may still warn about a new release:

> **Windows protected your PC**
> Microsoft Defender SmartScreen prevented an unrecognised app from starting.

SmartScreen warns based on the reputation a publisher and a file have built up, not merely on whether a signature exists, and a newly published file has none yet. Choose **More info**, check that the publisher reads Ptarmigan Labs AB, then **Run anyway**.
