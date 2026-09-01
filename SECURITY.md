# Security policy

## Reporting a vulnerability

Use GitHub private vulnerability reporting for this repository:
<https://github.com/bitcoinuniverseio/mezcal/security/advisories/new>

Do not open a public issue for a security problem, and do not include secrets,
private keys, seed phrases, or wallet files in a report. Nothing in this
repository ever needs them.

Please include:

- the page or file involved, and the exact text or rule id;
- what you believe the correct behaviour is;
- the source you checked it against, ideally a commit and a file path;
- if the report concerns the validator, the payload you pasted and the result you
  expected.

## What belongs here

This repository is documentation and one client-side tool. Reports in scope:

- a rule, limit, or example that is wrong in a way that could cause someone to
  lose funds, for instance a payload we describe as safe that would in fact be a
  cenotaph;
- a defect in the validator or builder that reports a bad payload as valid, or
  produces bytes that do not match what it displays;
- any script on this site making a network request, storing what a visitor typed,
  or loading a third-party resource. It should never do any of these.

## What belongs elsewhere

- **The Mezcal protocol or its reference implementation:** report upstream at
  [bitapeslabs/mezcal](https://github.com/bitapeslabs/mezcal).
- **Bitcoin Universe products** such as the marketplace, wallet, or indexers:
  report through the private vulnerability reporting of the repository that owns
  the code, not here.

## Handling

Reports are acknowledged and triaged privately. A confirmed error that could put
funds at risk is corrected and recorded in the
[changelog](https://bitcoinuniverseio.github.io/mezcal/changelog.html). Credit is
given to the reporter unless anonymity is requested.

## Scope note

The published site is static and self-contained: no cookies, no analytics, no
third-party requests, and no server-side code. The validator runs entirely in the
visitor's browser and transmits nothing.
