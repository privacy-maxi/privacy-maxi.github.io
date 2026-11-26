# The Privacy Map

Every crypto privacy project, alive or dead: what it hides, who you trust, receipts for each.

**Browse it:** https://privacy-maxi.github.io
**Follow it:** [@privacy_maxi on X](https://x.com/privacy_maxi)

## What it is

An open, sourced catalog of nearly 3,000 privacy projects across 28 categories: privacy coins, shielded pools,
stealth addresses, wallets, Bitcoin privacy, private chains, dark pools, mixnets, private reads, FHE, MPC, TEE,
zkTLS, identity, messaging, storage and the standards underneath them. Every chain. The live ones and the
graveyard.

Each row answers five questions:

| Question | Fields |
|---|---|
| What does it hide? | `hides` (sender, receiver, amount, balance, IP, query, identity, and more), `privacy_default` |
| Who do you trust? | `trust_model` (cryptographic, trusted operator, committee or threshold, TEE, mixed) |
| How does it work? | `tech`, `category`, `ecosystems` |
| Is it alive? | `status`, `last_activity`, `tier`, `tier_reason` |
| Says who? | `sources`, `confidence`, `adoption` (each figure with its source and date) |

Tiers S, A, B, C and D measure maturity, not quality. D is the graveyard: every dead project carries a dated
source. Full rules in [METHOD.md](METHOD.md).

## How to browse

- **The site:** search by name, filter by category, chain, tier, trust model or what it hides. Each project has
  its own row card with links and sources.
- **The data:** the full dataset lives in [`data/`](data/) as JSON and CSV. Load it in anything.
- **The graveyard:** filter tier D for every dead, seized, sanctioned or pivoted project, each with the date of its
  last sign of life.

## How to correct a row

Spot something wrong or missing? Open a
[claim and correct issue](https://github.com/privacy-maxi/privacy-maxi.github.io/issues/new?template=claim-and-correct.yml):
project, field, correct value, source link. Projects bring facts, and the rating stays ours. Corrections land in public
within 48 hours. Details in [CONTRIBUTING.md](CONTRIBUTING.md).

## Independence

No paid posts. No money from projects we cover. Method and data are open: check every rating.

## Credits and licences

- Seeded from [Web3Privacy Now explorer-data](https://github.com/web3privacy/explorer-data), used under the
  [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/). Thank you to everyone who built it. See
  [NOTICE](NOTICE).
- Data: ODbL 1.0 ([LICENSE-DATA](LICENSE-DATA)). Code: MIT ([LICENSE](LICENSE)).
- Market cap and TVL figures are quoted with links to their original sources (CoinGecko, DefiLlama and others).
