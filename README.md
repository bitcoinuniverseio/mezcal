# Mezcal protocol documentation

Authoritative documentation for **Mezcal**, a fungible token protocol on Bitcoin
mainnet whose instructions travel as UTF-8 JSON pushed after `OP_RETURN`.

**Site: <https://bitcoinuniverseio.github.io/mezcal/>**

Mezcal did not originate at Bitcoin Universe. The protocol and its reference
implementation are the work of [bitapeslabs/mezcal](https://github.com/bitapeslabs/mezcal),
and [mezcal.sh](https://mezcal.sh) is the project's own site. This repository
documents the protocol as the ecosystem uses it and marks every Bitcoin Universe
indexing or marketplace decision as such. See [ATTRIBUTION.md](ATTRIBUTION.md).

## Pages

| Page | What it holds |
| --- | --- |
| [Overview](https://bitcoinuniverseio.github.io/mezcal/) | What the protocol is, chain and network, entry points, support summary |
| [Specification](https://bitcoinuniverseio.github.io/mezcal/spec.html) | Numbered normative rules: carrier, grammar, ids, units, etching, minting, edicts, pointer, burning, cenotaphs, ordering |
| [Guide](https://bitcoinuniverseio.github.io/mezcal/guide.html) | Etch, mint, transfer and burn walked through, plus a signing checklist and the support matrix |
| [Reference](https://bitcoinuniverseio.github.io/mezcal/reference.html) | Terminology, indexer semantics, fees and sizes, limitations, security, implementation checklist |
| [Test vectors](https://bitcoinuniverseio.github.io/mezcal/vectors.html) | 24 payloads with hex and expected outcomes, valid and invalid |
| [Validator](https://bitcoinuniverseio.github.io/mezcal/validator.html) | Client-side payload validator and builder, no network requests |
| [Changelog](https://bitcoinuniverseio.github.io/mezcal/changelog.html) | Documentation version history |

## Key facts

| Field | Value |
| --- | --- |
| Chain and network | bitcoin / mainnet |
| Carrier | `OP_RETURN` push data |
| Encoding | UTF-8 JSON |
| Asset id | `block:tx` |
| Genesis | block 898750, asset `1:0` |
| Divisibility | integer 0 to 18 |
| Amount range | u128, expressed in base units as decimal strings |
| Rules pinned to | `bitapeslabs/mezcal` at `0f3323ffc1c657ad529529f04543b5ba93250fd6` |
| Documentation version | 2026.09.01 |
| Lifecycle | beta |

A payload is one JSON object:

```json
{"p":"https://mezcal.sh","edicts":[["899284:20","7700000000",0]]}
```

`p` is required and must be `"mezcal"`, `"https://mezcal.sh"`, or
`"https://t.me/mezcalbtc"`. The optional keys are `edicts`, `etching`, `mint`,
and `pointer`. Any other key, any type error, or any out-of-range value makes the
transaction a **cenotaph**, which burns every Mezcal balance on its inputs.

## Bitcoin Universe support

Claims here come from the org's own code, not from a roadmap.

- **Discovery and explorer views:** supported.
- **Marketplace mutations:** the Core protocol registry declares the Mezcal
  marketplace surface read-only. List, update, unlist, and buy are declared
  unsupported until authoritative ownership, transferability, builder,
  signed-transaction validation, broadcast, settlement, and reorg recovery are
  deployed and proven.
- **Wallet and inscribe surfaces:** view, send, receive, and etch, mint, transfer
  are declared in the capability registry.
- **Indexing:** a Universe-operated Mezcal indexer publishes confirmed assets,
  deployments, mints, transfers, burns, and holder balances, each verified against
  Bitcoin Core block membership. Coverage is reported as partial: there is no
  complete Mezcal mempool feed.
- **Purchases** built by Core carry exactly one derived instruction,
  `{"p":"https://mezcal.sh","edicts":[[ticker,baseUnits,0]]}`, compared byte for
  byte against what the listing verification proved. Mixed tickers are refused.

Nothing is claimed for third-party wallets or marketplaces.

## Repository layout

Static, hand-authored HTML and CSS with a little vanilla JavaScript. No build
step, no framework, no external requests, no trackers. Published by GitHub Pages
from `main` at the repository root.

```
index.html spec.html guide.html reference.html vectors.html validator.html
changelog.html 404.html
theme.css site.js validator.js
favicon.svg og-mezcal.svg
search-index.json llms.txt sitemap.xml robots.txt docs.manifest.json
```

Everything works with JavaScript disabled except search, the theme toggle, and
the validator, which are enhancements.

## Contributing and reporting

- Documentation errors: open an issue or a pull request. See [CONTRIBUTING.md](CONTRIBUTING.md).
- Questions: see [SUPPORT.md](SUPPORT.md).
- Security: see [SECURITY.md](SECURITY.md). Protocol-level flaws belong upstream at
  [bitapeslabs/mezcal](https://github.com/bitapeslabs/mezcal).

Central documentation portal: <https://docs.bitcoinuniverse.io>
