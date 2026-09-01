# Contributing

This repository is the documentation for the Mezcal protocol. Contributions are
welcome, with one hard rule: **every factual claim must be traceable to source.**

## The grounding rule

A pull request that changes a protocol fact must say where the fact comes from:
a repository, a file, and ideally a commit. Acceptable sources, in order of
preference:

1. The Mezcal reference implementation at
   [bitapeslabs/mezcal](https://github.com/bitapeslabs/mezcal). Code beats prose:
   where the upstream README and the upstream code disagree, the code decides and
   the divergence is documented.
2. Bitcoin Universe source code, for claims about what Bitcoin Universe products
   do.
3. On-chain evidence, quoted with the transaction id.

Not acceptable: a roadmap, an announcement, a screenshot, another documentation
site, or an assumption from a similar protocol. Code presence is not released
capability: if a code path exists but the product does not declare it supported,
say exactly that.

## House style

- No em dash characters anywhere. Use commas, colons, periods, or parentheses.
- Plain, direct sentences. No filler, no superlatives, no urgency.
- Prefer a table, a diagram, or a worked example over a paragraph.
- Numbers are exact. If you state a byte count, compute it.
- Never claim support for a wallet, marketplace, or indexer that cannot be
  verified in the org's own code.

## Technical constraints

The site is static by design and must stay that way.

- Hand-authored HTML and CSS with a little vanilla JavaScript. No build step, no
  framework, no package manager, no bundler.
- No external requests of any kind: no CDNs, no web fonts, no analytics, no
  third-party images. Everything is committed to this repository.
- Every page must be fully readable with JavaScript disabled. Scripts may only
  enhance search, the theme toggle, and the validator.
- Both themes must meet WCAG 2.2 AA contrast. Keep the layout usable down to
  320px wide with no horizontal page overflow; wide tables and code scroll inside
  their own container.
- Every diagram is inline SVG with a `<title>` and a `<desc>`, and uses the CSS
  custom properties so it stays legible in both themes.
- Keep the totals small: under 50KB of CSS and under 60KB of JavaScript.

## When you change a page

1. Update `search-index.json` if you added or renamed a heading or an anchor.
2. Update `sitemap.xml` and `llms.txt` if you added or removed a page.
3. Update `docs.manifest.json` if the lifecycle, version, or verified commit
   changed, and validate it against the shared schema before committing.
4. Add an entry to `changelog.html` describing what changed and what you verified
   it against.
5. Check that the footer of the page you touched still states the right source
   path and version.

## Pull requests

Branch from `main`, keep the change focused, and describe in the pull request
what you verified and where. A change to a protocol rule should also state
whether the [test vectors](https://bitcoinuniverseio.github.io/mezcal/vectors.html)
still hold.

Security issues go through [SECURITY.md](SECURITY.md), never through a public
issue or pull request.
