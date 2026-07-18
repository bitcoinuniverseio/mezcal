# Mezcal documentation

Bitcoin Universe documentation for Mezcal, rebuilt from the official product site, protocol repository, validator, and CLI.

## Documentation pages

- [Overview](index.html): protocol model, branded visual system, and source trail
- [Reference](reference.html): current Mezcalstone schema, validated payloads, and field rules
- [CLI and build guide](guide.html): official commands and a production transaction checklist
- [Attribution](ATTRIBUTION.md): official colors, visuals, fonts, code sources, and pinned revisions

## What is covered

Mezcal uses a UTF-8 JSON Mezcalstone directly after an OP_RETURN. The current reference validator accepts only known fields and treats malformed data, bad edict output indexes, and invalid zero-block IDs as cenotaph conditions.

The reference page includes the three accepted protocol identifiers, the strict-schema surface, etching, mint, edict, pointer, priced mint, and flex mint guidance. The guide includes supported Mezcal CLI commands from the official CLI README.

## Primary sources

- [Mezcal application](https://mezcal.sh)
- [Mezcal protocol and indexer](https://github.com/bitapeslabs/mezcal)
- [Mezcalstone validator, pinned source revision](https://github.com/bitapeslabs/mezcal/blob/0f3323ffc1c657ad529529f04543b5ba93250fd6/src/lib/mezcalstone.ts)
- [Mezcal CLI, pinned source revision](https://github.com/bitapeslabs/mezcal-cli/blob/cc232a2523a9b459868e0f5aa72c9a4fe151c1a7/README.md)

## Scope

This site is a documentation and integration aid. For a real transaction, validate the current upstream parser and inspect the finalized Bitcoin transaction before signing.
