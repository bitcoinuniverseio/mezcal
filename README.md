# Mezcal documentation

Bitcoin Universe documentation for Mezcal on Bitcoin.

## What this covers

Mezcalstones are JSON messages placed immediately after OP_RETURN. A stone can etch a named Mezcal asset, mint an existing asset, and allocate balances with edicts. The protocol is deliberately JSON rather than the compact binary encoding used by Runes.

## State model

A Mezcalstone makes allocation explicit. Etching defines metadata and mint terms. Minting adds units to the transaction pool. Edicts and pointer decide which outputs receive those units.

## Documentation site

- Overview: [index.html](index.html)
- Field reference: [reference.html](reference.html)
- Build and verification playbook: [guide.html](guide.html)

## Core rules

- The payload is JSON directly after OP_RETURN, with no OP_13 marker.
- Mezcal names are lowercase letters, digits, and hyphens, one through 15 characters.
- Amounts are strings interpreted as unsigned 128-bit values.
- Edicts include asset ID, amount, and output index.
- A pointer selects the fallback destination for unallocated amounts.
- Price-enabled mints must satisfy the required payment output rules.

## Source material

- [Mezcal protocol site](https://mezcal.sh)
- [Mezcal reference implementation](https://github.com/bitapeslabs/mezcal)

## Scope

A correct-looking JSON object can still allocate to the wrong output. Freeze transaction outputs before deriving edict indexes or pointer values.
