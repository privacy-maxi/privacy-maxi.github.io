# Method, v0

How the Privacy Map rates projects. Version 0, open for comment: open an issue to challenge any rule.

## 1. Maturity tiers

**Tiers measure maturity, not quality.** A tier says how far a project has come and whether it is still moving. It
is a maturity and adoption reading on the snapshot date, separate from a security review or a privacy score. An S
project can leak more than a C project.

| Tier | Definition |
|---|---|
| **S** | In production or mainnet for about 2 years or more, maintained in the last 6 months, and a category leader by measurable adoption or reference status. |
| **A** | Live in production or mainnet with real, evidenced usage, maintained in the last 6 to 12 months. |
| **B** | Early mainnet, beta or limited usage, or a public testnet with active development in the last 6 months. |
| **C** | Research, spec, devnet, announced, hackathon-stage, or dormant (no visible activity for 12 months or more, death not confirmed). |
| **D** (graveyard) | Confirmed shut down, abandoned (site gone and no activity for 24 months or more), sanctioned or seized, or pivoted away from privacy. Every D row carries a source. |
| **Unrated** | Listed with its facts and sources, without a tier. |

Every tier comes with a one-line `tier_reason` and the sources behind it. Each row also carries a `confidence`
(high, medium, low) for how strong that evidence is.

## 2. How "dead" is dated

Dead means dated evidence. A D row records:

- **What happened**, in `status`: `shut-down`, `abandoned`, `sanctioned`, `pivoted` or `acquired`.
- **When**, in `last_activity`: the date of the last sign of life we could verify, such as the last commit, last
  release, last post, or the date of the team's shutdown notice.
- **The evidence**, in `tier_reason` and `sources`: a shutdown announcement, a court or regulator notice, a dated
  archive capture, or checks such as "site unreachable, repository last pushed 2019-07".

`abandoned` requires both: the site is gone and nothing has moved for 24 months or more. Quiet for 12 months with
the site still up is `dormant`, which stays in tier C. Dead domains are documented through archive captures, never
linked live.

Every grave has a way back: a team that is still building opens an issue with proof, and the row moves.

## 3. Sources policy

- Every claim points to something a reader can check: code, chain data, or a dated page.
- Preferred, in order: (1) on-chain data and the project's own code, (2) the project's own docs, releases and
  notices, (3) court, regulator and sanction records, (4) independent research and reputable reporting, (5) aggregators.
- Adoption figures (market cap, TVL, users, stars) always carry their source and the date measured. Check the
  linked source before quoting a number.
- We rate mechanisms, not people. "The upgrade key can change the verifier with no delay" is a finding. Intent
  words (scam, rug, fraud) appear only when a court, a regulator or the team itself said it, quoted and linked.
- Where a deep review exists elsewhere, such as an [ETHBEAT](https://ethbeat.org/privacy) privacy review, we link it.

## 4. The Receipt card

Top projects get a Receipt: what the project hides from each of five adversaries, in the same vocabulary ETHBEAT
uses, so the two read side by side. Each cell is rated green, amber or red, with a source.

| Adversary | Who they are | Receipt fields |
|---|---|---|
| **Public observer** | Anyone reading the chain, an explorer or the app's public pages | What it hides (sender, receiver, amount, asset, balance); private by default or opt-in |
| **Chain analyst** | A firm or researcher linking activity with heuristics: timing, amounts, deposits and withdrawals | Measured usage and anonymity set; linkability between actions; amount and timing leaks |
| **Network observer** | An ISP, RPC provider, relayer or node operator that sees IPs, queries and timing | IP and metadata protection; private reads; relayer and RPC route |
| **Privileged insider** | Whoever holds special power: operators, committees, enclave vendors, upgrade and pause keys, setup ceremony participants, viewing key holders | Trust model; upgrade and pause keys and their delays; trusted setup; who can see what |
| **Future adversary** | Someone holding today's public data tomorrow: broken assumptions, quantum computers, leaked keys | Cryptographic assumptions; post-quantum path; what stays public on chain for good |

Every Receipt also states the project's status, its tier and the date of the review.

## 5. Corrections within 48 hours

Anyone can open a [claim and correct issue](https://github.com/privacy-maxi/privacy-maxi.github.io/issues/new?template=claim-and-correct.yml).
Every correction gets a public answer within 48 hours. Accepted fixes are merged in the open, logged with the date,
and credited to the person who sent them. Errors we publish get a public correction, posted where the error ran.

## 6. Right of reply

Before a Receipt goes out, the project's official contact receives the draft card and has 72 hours to correct facts
or send a quote. Teams correct facts, and the rating stays ours. We print their reply in full, or "no reply by
publication".

## 7. Independence

No paid posts. No money from projects we cover. Method and data are open: check every rating.
