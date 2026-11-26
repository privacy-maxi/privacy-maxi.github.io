/* privacy maxi catalog: static, dependency-free. */
(function (root) {
  'use strict';

  var DATA_URL = 'data/catalog.json';
  var ISSUE_URL = 'https://github.com/privacy-maxi/privacy-maxi.github.io/issues/new?template=claim-and-correct.yml';
  var TIERS = ['S', 'A', 'B', 'C', 'D', 'U'];
  var TIER_RANK = { S: 0, A: 1, B: 2, C: 3, D: 4, U: 5 };
  var CONF_RANK = { high: 0, medium: 1, low: 2 };
  var PAGE = 200;

  var CATEGORY_LABELS = {
    'privacy-coins': 'Privacy coins',
    'bitcoin-privacy': 'Bitcoin privacy',
    'wallets-payments': 'Wallets and payments',
    'research-standards': 'Research and standards',
    'swaps-exchanges': 'Swaps and exchanges',
    'dark-pools-private-trading': 'Dark pools and private trading',
    'zk-identity-credentials': 'ZK identity and credentials',
    'shielded-pools-mixers': 'Shielded pools and mixers',
    'dev-tooling-libraries': 'Dev tooling and libraries',
    'messaging-social': 'Messaging and social',
    'storage-data-access': 'Storage and data access',
    'communities-funding-education': 'Communities, funding, education',
    'private-ai': 'Private AI',
    'confidential-tokens': 'Confidential tokens',
    'private-voting-governance': 'Private voting and governance',
    'dvpn-bandwidth': 'dVPN and bandwidth',
    'private-smart-contract-chains': 'Private smart contract chains',
    'self-hosting-hardware': 'Self-hosting and hardware',
    'query-read-privacy': 'Query and read privacy',
    'zktls-private-data': 'zkTLS and private data',
    'enterprise-institutional': 'Enterprise and institutional',
    'mev-encrypted-mempools': 'MEV and encrypted mempools',
    'stealth-addresses': 'Stealth addresses',
    'mixnets-anonymity-networks': 'Mixnets and anonymity networks',
    'tee-confidential-compute': 'TEE and confidential compute',
    'adjacent-non-web3': 'Adjacent, non-web3',
    'fhe': 'FHE',
    'mpc-threshold': 'MPC and threshold'
  };

  var STATUS_CLASS = {
    production: 'ok', mainnet: 'ok',
    beta: 'warm', testnet: 'warm', devnet: 'warm',
    research: 'cool', announced: 'cool', unknown: 'cool', dormant: 'cool',
    abandoned: 'bad', 'shut-down': 'bad', sanctioned: 'bad', pivoted: 'bad', acquired: 'bad'
  };

  var TRUST_LABELS = {
    cryptographic: 'Cryptography',
    'trusted-operator': 'Trusted operator',
    'committee-threshold': 'Committee or threshold',
    tee: 'Secure hardware (TEE)',
    mixed: 'Mixed',
    unknown: 'Unknown'
  };
  var TRUST_SHORT = {
    cryptographic: 'Cryptography', 'trusted-operator': 'Operator', 'committee-threshold': 'Committee',
    tee: 'TEE', mixed: 'Mixed', unknown: 'Unknown'
  };

  var DEFAULT_LABELS = {
    'default': 'On for everyone',
    'opt-in': 'Opt-in',
    'n/a': 'Not applicable',
    unknown: 'Unknown'
  };

  var OSS_LABELS = { yes: 'Open source', no: 'Closed source', unknown: 'Unknown' };

  var CHAIN_LABELS = {
    ethereum: 'Ethereum', bitcoin: 'Bitcoin', multichain: 'Multichain', monero: 'Monero', zcash: 'Zcash',
    solana: 'Solana', base: 'Base', other: 'Other', lightning: 'Lightning', midnight: 'Midnight',
    arbitrum: 'Arbitrum', aleo: 'Aleo', aztec: 'Aztec', cosmos: 'Cosmos', 'non-crypto': 'Non-crypto',
    polygon: 'Polygon', nostr: 'Nostr', zama: 'Zama', 'non-web3': 'Non-web3', general: 'General',
    oasis: 'Oasis', starknet: 'Starknet', optimism: 'Optimism', cardano: 'Cardano', bnb: 'BNB Chain',
    avalanche: 'Avalanche', ton: 'TON', near: 'NEAR', secret: 'Secret', mina: 'Mina', namada: 'Namada',
    'robinhood-chain': 'Robinhood Chain', zksync: 'zkSync', scroll: 'Scroll', linea: 'Linea'
  };

  /* ---------- pure helpers (tested in node) ---------- */

  var ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };
  function esc(v) {
    if (v === null || v === undefined) return '';
    return String(v).replace(/[&<>"'`]/g, function (c) { return ESC_MAP[c]; });
  }

  function safeUrl(u) {
    if (typeof u !== 'string') return null;
    var s = u.trim();
    if (!/^https?:\/\/[^\s"'<>`\\]+$/i.test(s)) return null;
    return s;
  }

  function xUrl(x) {
    if (typeof x !== 'string' || !x.trim()) return null;
    var s = x.trim();
    if (/^https?:\/\//i.test(s)) return safeUrl(s);
    var h = s.replace(/^@/, '');
    return /^[A-Za-z0-9_]{1,15}$/.test(h) ? 'https://x.com/' + h : null;
  }

  function titleCase(slug) {
    var s = String(slug || '').replace(/[-_]+/g, ' ');
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function catLabel(slug) {
    if (!slug) return 'Uncategorised';
    return CATEGORY_LABELS[slug] || titleCase(slug);
  }

  function chainLabel(slug) { return CHAIN_LABELS[slug] || titleCase(slug); }

  function hostOf(u) {
    var m = /^https?:\/\/([^\/?#]+)/i.exec(u || '');
    return m ? m[1].replace(/^www\./i, '') : u;
  }

  function fmtInt(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function arr(v) {
    if (Array.isArray(v)) return v.filter(function (x) { return x !== null && x !== undefined && x !== ''; });
    if (v === null || v === undefined || v === '') return [];
    return [v];
  }

  function str(v) {
    return v === null || v === undefined ? '' : String(v);
  }

  function ossOf(v) {
    if (v === true || v === 'true' || v === 'yes') return 'yes';
    if (v === false || v === 'false' || v === 'no') return 'no';
    return 'unknown';
  }

  /* Filter facets. Within one facet a row matches any picked value; across facets it must match all. */
  var FACETS = [
    { key: 'tier', label: 'Tier', vals: function (r) { return [r.tier || 'U']; },
      name: function (v) { return v === 'U' ? 'Unrated' : 'Tier ' + v; }, order: TIERS, open: true },
    { key: 'cat', label: 'Category', vals: function (r) { return [r.category]; }, name: catLabel, limit: 10, open: true, list: true },
    { key: 'hides', label: 'What it hides', vals: function (r) { return r.hides; }, name: function (v) { return v; }, open: true },
    { key: 'trust', label: 'Who you trust', vals: function (r) { return [r.trust_model || 'unknown']; },
      name: function (v) { return TRUST_LABELS[v] || titleCase(v); }, open: true, list: true },
    { key: 'def', label: 'Privacy by default', vals: function (r) { return [r.privacy_default || 'unknown']; },
      name: function (v) { return DEFAULT_LABELS[v] || titleCase(v); }, list: true },
    { key: 'status', label: 'Status', vals: function (r) { return [r.status || 'unknown']; }, name: titleCase, limit: 8, list: true },
    { key: 'chain', label: 'Chain', vals: function (r) { return r.ecosystems; }, name: chainLabel, limit: 12, min: 3 },
    { key: 'oss', label: 'Code', vals: function (r) { return [r.open_source]; },
      name: function (v) { return OSS_LABELS[v] || v; }, order: ['yes', 'no', 'unknown'], list: true }
  ];
  var FACET_BY = {};
  FACETS.forEach(function (f) { FACET_BY[f.key] = f; });

  function normalize(input) {
    var rows = Array.isArray(input) ? input : (input && (input.rows || input.projects || input.items)) || [];
    var out = [];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (!r || typeof r !== 'object') continue;
      var tier = str(r.tier).toUpperCase();
      if (tier === 'UNRATED') tier = 'U';
      if (!(tier in TIER_RANK)) tier = '';
      var launched = r.launched;
      var ln = launched === null || launched === undefined || launched === '' ? null : parseInt(launched, 10);
      var row = {
        id: str(r.id) || 'row-' + i,
        name: str(r.name) || str(r.id),
        aliases: arr(r.aliases).map(str),
        category: str(r.category),
        tier: tier,
        status: str(r.status),
        one_liner: str(r.one_liner),
        hides: arr(r.hides).map(str),
        tech: arr(r.tech).map(str),
        ecosystems: arr(r.ecosystems).map(str),
        trust_model: str(r.trust_model),
        privacy_default: str(r.privacy_default),
        open_source: ossOf(r.open_source),
        launched: isNaN(ln) ? null : ln,
        last_activity: str(r.last_activity) || null,
        website: str(r.website),
        github: str(r.github),
        x: str(r.x),
        docs: str(r.docs),
        tier_reason: str(r.tier_reason),
        adoption: str(r.adoption),
        sources: arr(r.sources).map(str),
        confidence: str(r.confidence)
      };
      row._hay = [row.name, row.id, row.aliases.join(' '), row.one_liner, row.category, catLabel(row.category),
        row.hides.join(' '), row.tech.join(' '), row.ecosystems.join(' '), row.status, row.trust_model]
        .join(' ').toLowerCase();
      row._f = {};
      for (var k = 0; k < FACETS.length; k++) row._f[FACETS[k].key] = FACETS[k].vals(row);
      out.push(row);
    }
    return out;
  }

  function computeStats(rows) {
    var by = { S: 0, A: 0, B: 0, C: 0, D: 0, U: 0 };
    for (var i = 0; i < rows.length; i++) if (rows[i].tier in by) by[rows[i].tier]++;
    return { total: rows.length, byTier: by, live: by.S + by.A + by.B, early: by.C, dead: by.D };
  }

  function categoryCounts(rows) {
    var c = {};
    for (var i = 0; i < rows.length; i++) {
      var k = rows[i].category || '';
      c[k] = (c[k] || 0) + 1;
    }
    return Object.keys(c).map(function (k) { return { slug: k, label: catLabel(k), n: c[k] }; })
      .sort(function (a, b) { return b.n - a.n || a.label.localeCompare(b.label); });
  }

  /* f: { q, sel: {facetKey: Set}, graveyard, except: facetKey to ignore }. f.cats and f.tiers still work. */
  function selOf(f) {
    var sel = {};
    if (f.sel) for (var k in f.sel) if (f.sel[k] && f.sel[k].size) sel[k] = f.sel[k];
    if (f.cats && f.cats.size) sel.cat = f.cats;
    if (f.tiers && f.tiers.size) sel.tier = f.tiers;
    if (f.except) delete sel[f.except];
    return sel;
  }

  function matchSel(r, sel, keys) {
    for (var i = 0; i < keys.length; i++) {
      var set = sel[keys[i]], vals = r._f ? r._f[keys[i]] : FACET_BY[keys[i]].vals(r), hit = false;
      for (var j = 0; j < vals.length; j++) if (set.has(vals[j])) { hit = true; break; }
      if (!hit) return false;
    }
    return true;
  }

  function filterRows(rows, f) {
    var terms = (f.q || '').toLowerCase().split(/\s+/).filter(Boolean);
    var sel = selOf(f), keys = Object.keys(sel);
    var out = [];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (f.graveyard && r.tier !== 'D') continue;
      if (keys.length && !matchSel(r, sel, keys)) continue;
      var ok = true;
      for (var t = 0; t < terms.length; t++) if (r._hay.indexOf(terms[t]) === -1) { ok = false; break; }
      if (ok) out.push(r);
    }
    return out;
  }

  /* counts per value of one facet, with every other filter applied */
  function facetCounts(rows, f, key) {
    var base = filterRows(rows, { q: f.q, sel: f.sel, graveyard: f.graveyard, except: key });
    var c = {};
    for (var i = 0; i < base.length; i++) {
      var vals = base[i]._f ? base[i]._f[key] : FACET_BY[key].vals(base[i]);
      for (var j = 0; j < vals.length; j++) c[vals[j]] = (c[vals[j]] || 0) + 1;
    }
    return c;
  }

  var COLL = (typeof Intl !== 'undefined' && Intl.Collator) ? new Intl.Collator('en', { sensitivity: 'base', numeric: true }) : null;
  function textCmp(a, b) { return COLL ? COLL.compare(a, b) : (a < b ? -1 : a > b ? 1 : 0); }
  function byName(a, b) {
    return textCmp(a.name, b.name);
  }

  /* nulls always sort last, whatever the direction */
  function nullsLast(av, bv, dir, cmp) {
    var an = av === null || av === undefined || av === '';
    var bn = bv === null || bv === undefined || bv === '';
    if (an && bn) return 0;
    if (an) return 1;
    if (bn) return -1;
    return dir * cmp(av, bv);
  }

  function numCmp(a, b) { return a - b; }
  function strCmp(a, b) { return a < b ? -1 : a > b ? 1 : 0; }

  /* flagship projects first within a tier in the default view, so the first screen shows what people know */
  var FEATURED = ['Zcash', 'Monero', 'Tor', 'Signal', 'Cake Wallet', 'Wasabi Wallet', 'Privacy Pools', 'Aztec', 'Zama',
    'TornadoCash', 'Brave Browser', 'Mullvad VPN', 'Proton Mail', 'Session', 'SimpleX Chat', 'Phala Network',
    'Secret Network', 'Oasis Network', 'Aleo', 'Namada', 'Mina', 'Umbra', 'Umbra Privacy', 'Sparrow', 'Bisq', 'Zodl'];
  var FEAT_RANK = {};
  FEATURED.forEach(function (n, i) { FEAT_RANK[n.toLowerCase()] = i; });
  function featRank(r) {
    var k = (r.name || '').toLowerCase();
    return Object.prototype.hasOwnProperty.call(FEAT_RANK, k) ? FEAT_RANK[k] : FEATURED.length;
  }

  var SORT_KEYS = { tier: 1, name: 1, category: 1, status: 1, launched: 1, last_activity: 1, confidence: 1, trust: 1 };

  function sortRows(rows, key, dir) {
    dir = dir === -1 ? -1 : 1;
    var cmp;
    switch (key) {
      case 'name':
        cmp = function (a, b) { return dir * byName(a, b); }; break;
      case 'category':
        cmp = function (a, b) { return dir * textCmp(catLabel(a.category), catLabel(b.category)) || byName(a, b); }; break;
      case 'trust':
        cmp = function (a, b) { return nullsLast(a.trust_model, b.trust_model, dir, strCmp) || TIER_RANK[a.tier || 'U'] - TIER_RANK[b.tier || 'U'] || byName(a, b); }; break;
      case 'status':
        cmp = function (a, b) { return nullsLast(a.status, b.status, dir, strCmp) || byName(a, b); }; break;
      case 'launched':
        cmp = function (a, b) { return nullsLast(a.launched, b.launched, dir, numCmp) || byName(a, b); }; break;
      case 'last_activity':
        cmp = function (a, b) { return nullsLast(a.last_activity, b.last_activity, dir, strCmp) || byName(a, b); }; break;
      case 'confidence':
        cmp = function (a, b) { return nullsLast(CONF_RANK[a.confidence], CONF_RANK[b.confidence], dir, numCmp) || byName(a, b); }; break;
      default:
        cmp = function (a, b) { return nullsLast(TIER_RANK[a.tier], TIER_RANK[b.tier], dir, numCmp) || featRank(a) - featRank(b) || byName(a, b); };
    }
    return rows.slice().sort(cmp);
  }

  function findById(rows, id) {
    for (var i = 0; i < rows.length; i++) if (rows[i].id === id) return rows[i];
    return null;
  }

  function correctionUrl(row) {
    var title = row ? 'Correction: ' + row.name + ' (' + row.id + ')' : 'Correction';
    return ISSUE_URL + '&title=' + encodeURIComponent(title);
  }

  /* dead projects by year of last activity; older years fold into the first bucket */
  function graveYears(rows, first) {
    first = first || 2014;
    var c = {}, max = first, undated = 0;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].tier !== 'D') continue;
      var y = parseInt(String(rows[i].last_activity || '').slice(0, 4), 10);
      if (isNaN(y)) { undated++; continue; }
      if (y < first) y = first;
      c[y] = (c[y] || 0) + 1;
      if (y > max) max = y;
    }
    var out = [];
    for (var yy = first; yy <= max; yy++) out.push({ year: yy, n: c[yy] || 0 });
    return { years: out, undated: undated };
  }

  /* ---------- HTML builders (all data passes through esc) ---------- */

  function tierBadge(t) {
    if (!t) return '<span class="tier t-none" title="No tier">?</span>';
    if (t === 'U') return '<span class="tier t-U" title="Unrated">U</span>';
    return '<span class="tier t-' + esc(t) + '" title="Tier ' + esc(t) + '">' + esc(t) + '</span>';
  }

  function statusPill(s) {
    if (!s) return '';
    return '<span class="pill s-' + (STATUS_CLASS[s] || 'cool') + '">' + esc(s.replace(/-/g, ' ')) + '</span>';
  }

  function tags(list, cls) {
    return list.map(function (h) { return '<span class="' + cls + '">' + esc(h) + '</span>'; }).join('');
  }

  function hashFor(id) {
    return '#' + encodeURIComponent(id);
  }

  var COLUMNS = [
    { key: 'tier', label: 'Tier', cls: 'c-tier' },
    { key: 'name', label: 'Project', cls: 'c-name' },
    { key: 'category', label: 'Category', cls: 'c-cat' },
    { key: 'hides', label: 'Hides', cls: 'c-hides', nosort: true },
    { key: 'trust', label: 'Trust', cls: 'c-trust' },
    { key: 'status', label: 'Status', cls: 'c-status' },
    { key: 'last_activity', label: 'Last seen', cls: 'c-num c-last' }
  ];

  function headHtml(sortKey, sortDir) {
    return COLUMNS.map(function (c) {
      if (c.nosort) return '<th scope="col" class="' + c.cls + '">' + c.label + '</th>';
      var on = c.key === sortKey;
      var aria = on ? (sortDir === 1 ? 'ascending' : 'descending') : 'none';
      var arrow = on ? (sortDir === 1 ? ' ↑' : ' ↓') : '';
      return '<th scope="col" class="' + c.cls + (on ? ' sorted' : '') + '" aria-sort="' + aria + '">' +
        '<button type="button" data-sort="' + c.key + '">' + c.label + '<span class="arrow">' + arrow + '</span></button></th>';
    }).join('');
  }

  function rowHtml(r) {
    return '<tr data-id="' + esc(r.id) + '">' +
      '<td class="c-tier">' + tierBadge(r.tier) + '</td>' +
      '<td class="c-name"><a href="' + esc(hashFor(r.id)) + '" translate="no">' + esc(r.name) + '</a>' +
        (r.one_liner ? '<span class="sub">' + esc(r.one_liner) + '</span>' : '') + '</td>' +
      '<td class="c-cat">' + esc(catLabel(r.category)) + '</td>' +
      '<td class="c-hides">' + tags(r.hides.slice(0, 2), 'hide') + (r.hides.length > 2 ? '<span class="hide more-h">+' + (r.hides.length - 2) + '</span>' : '') + '</td>' +
      '<td class="c-trust">' + esc(TRUST_SHORT[r.trust_model] || r.trust_model) + '</td>' +
      '<td class="c-status">' + statusPill(r.status) + '</td>' +
      '<td class="c-num c-last">' + (r.last_activity ? esc(r.last_activity.slice(0, 7)) : '<span class="dim">-</span>') + '</td>' +
      '</tr>';
  }

  function bodyHtml(rows, limit) {
    if (!rows.length) return '<tr><td colspan="' + COLUMNS.length + '" class="empty">No rows match these filters. Know a project we missed? <a href="' + esc(correctionUrl(null)) + '" rel="noopener noreferrer">Tell us</a>.</td></tr>';
    var n = Math.min(limit, rows.length);
    var parts = new Array(n);
    for (var i = 0; i < n; i++) parts[i] = rowHtml(rows[i]);
    return parts.join('');
  }

  function statsHtml(s) {
    function cell(n, label, cls, href) {
      var inner = '<b>' + esc(fmtInt(n)) + '</b><span>' + esc(label) + '</span>';
      return href ? '<a class="stat ' + cls + '" href="' + esc(href) + '">' + inner + '</a>' : '<div class="stat ' + cls + '">' + inner + '</div>';
    }
    return cell(s.total, 'projects mapped', '') +
      cell(s.live, 'alive, tiers S to B', 'live') +
      cell(s.early, 'early or quiet, tier C', '') +
      cell(s.dead, 'in the Graveyard, tier D', 'dead', '#!graveyard');
  }

  function shortUrl(u) {
    return u.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
  }

  function linkItem(label, url, full) {
    var u = safeUrl(url);
    if (!u) return '';
    return '<li><span class="k">' + esc(label) + '</span><a href="' + esc(u) + '" rel="noopener noreferrer nofollow">' + esc(full ? shortUrl(u) : hostOf(u)) + '</a></li>';
  }

  function field(label, value) {
    if (value === null || value === undefined || value === '') return '';
    return '<div class="f"><dt>' + esc(label) + '</dt><dd>' + value + '</dd></div>';
  }

  function detailHtml(r) {
    if (!r) {
      return '<article class="panel detail"><p><a class="back" href="#">← Back to the catalog</a></p>' +
        '<h2>No row with that id</h2><p>It may have been renamed or merged. Search the catalog, or <a href="' + esc(correctionUrl(null)) + '" rel="noopener noreferrer">tell us what is missing</a>.</p></article>';
    }
    var x = xUrl(r.x);
    var links = linkItem('Website', r.website) + linkItem('GitHub', r.github, true) +
      linkItem('X', x, true) + linkItem('Docs', r.docs, true);
    var srcs = r.sources.map(function (s) {
      var u = safeUrl(s);
      return u ? '<li><a href="' + esc(u) + '" rel="noopener noreferrer nofollow">' + esc(u) + '</a></li>' : '<li>' + esc(s) + '</li>';
    }).join('');
    var back = r.tier === 'D' ? '<a class="back" href="#!graveyard">← Back to the Graveyard</a>' : '<a class="back" href="#">← Back to the catalog</a>';
    return '<article class="panel detail">' +
      '<p class="detail-top">' + back + '<span class="mono dim">#' + esc(r.id) + '</span></p>' +
      '<header class="detail-head">' + tierBadge(r.tier) + '<div><h2 translate="no">' + esc(r.name) + '</h2>' +
        (r.aliases.length ? '<p class="dim">also ' + esc(r.aliases.join(', ')) + '</p>' : '') + '</div></header>' +
      (r.one_liner ? '<p class="one">' + esc(r.one_liner) + '</p>' : '') +
      '<dl class="fields">' +
        field('Category', esc(catLabel(r.category))) +
        field('Status', statusPill(r.status)) +
        field('Hides', r.hides.length ? tags(r.hides, 'hide') : '') +
        field('Trust', esc(TRUST_LABELS[r.trust_model] || r.trust_model)) +
        field('Privacy default', esc(DEFAULT_LABELS[r.privacy_default] || r.privacy_default)) +
        field('Code', r.open_source === 'unknown' ? '' : esc(OSS_LABELS[r.open_source])) +
        field('Launched', r.launched === null ? '' : esc(r.launched)) +
        field('Last activity', r.last_activity ? esc(r.last_activity) : '') +
        field('Confidence', r.confidence ? '<span class="conf c-' + esc(r.confidence) + '">' + esc(r.confidence) + '</span>' : '') +
        field('Tech', r.tech.length ? tags(r.tech, 'tech') : '') +
        field('Chains', esc(r.ecosystems.map(chainLabel).join(', '))) +
      '</dl>' +
      (r.tier_reason ? '<h3>Why tier ' + esc(r.tier) + '</h3><p>' + esc(r.tier_reason) + '</p>' : '') +
      (r.adoption ? '<h3>Adoption</h3><p class="mono-ish">' + esc(r.adoption) + '</p>' : '') +
      (links ? '<h3>Links</h3><ul class="links">' + links + '</ul>' : '') +
      '<h3>Sources <span class="mono dim">' + r.sources.length + '</span></h3>' +
      (srcs ? '<ol class="sources">' + srcs + '</ol>' : '<p class="dim">No sources yet. Add one through the correction form.</p>') +
      '<p class="correct"><a class="btn" href="' + esc(correctionUrl(r)) + '" rel="noopener noreferrer">Correct or claim this row</a>' +
        '<span class="dim">Bring a source. Projects can claim their row the same way.</span></p>' +
      '</article>';
  }

  function chipHtml(facet, value, label, n, on) {
    return '<button type="button" class="chip" aria-pressed="' + (on ? 'true' : 'false') + '" data-facet="' + esc(facet) + '" data-value="' + esc(value) + '">' +
      (facet === 'tier' ? tierBadge(value) + '<span class="sr">' : '') + esc(label) + (facet === 'tier' ? '</span>' : '') +
      (n !== null ? '<span class="c">' + esc(fmtInt(n)) + '</span>' : '') + '</button>';
  }

  /* ---------- browser wiring ---------- */

  function init() {
    var doc = root.document;
    var $ = function (id) { return doc.getElementById(id); };
    var html = doc.documentElement;
    var state = {
      rows: [], q: '', sel: {}, open: {}, expanded: {},
      sortKey: null, sortDir: 1, limit: PAGE, view: null, loaded: false
    };
    FACETS.forEach(function (f) { state.sel[f.key] = new Set(); state.open[f.key] = !!f.open; });
    var views = { list: $('view-list'), map: $('view-map'), detail: $('view-detail'), method: $('view-method') };

    /* data attributes set sizes through CSSOM, which the strict CSP allows */
    function applySizes(el) {
      [].forEach.call(el.querySelectorAll('[data-w]'), function (n) { n.style.width = n.getAttribute('data-w') + '%'; });
      [].forEach.call(el.querySelectorAll('[data-h]'), function (n) { n.style.height = n.getAttribute('data-h') + '%'; });
      [].forEach.call(el.querySelectorAll('[data-d]'), function (n) { n.style.animationDelay = n.getAttribute('data-d') + 'ms'; });
    }

    /* ----- theme ----- */
    var themeBtn = $('theme');
    function syncTheme() {
      var dark = html.getAttribute('data-theme') !== 'light';
      themeBtn.setAttribute('aria-label', 'Switch to ' + (dark ? 'light' : 'dark') + ' theme');
      themeBtn.title = themeBtn.getAttribute('aria-label');
      var m = doc.querySelector('meta[name="theme-color"]');
      if (m) m.setAttribute('content', dark ? '#0b0d10' : '#f1ece2');
    }
    themeBtn.addEventListener('click', function () {
      var next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      html.setAttribute('data-theme', next);
      try { localStorage.setItem('pm-theme', next); } catch (e) { /* storage blocked: theme lasts this visit */ }
      syncTheme();
      map.recolor();
    });
    syncTheme();

    /* ----- URL state: filters live in the query string, views in the hash ----- */
    function defaultSort() { return state.view === 'graveyard' ? { k: 'last_activity', d: -1 } : { k: 'tier', d: 1 }; }
    function curSort() { return state.sortKey ? { k: state.sortKey, d: state.sortDir } : defaultSort(); }

    function readUrl() {
      var p;
      try { p = new URLSearchParams(root.location.search); } catch (e) { return; }
      state.q = (p.get('q') || '').slice(0, 200);
      FACETS.forEach(function (f) {
        var v = p.get(f.key);
        state.sel[f.key] = new Set(v ? v.split(',').filter(Boolean).slice(0, 60) : []);
      });
      var s = p.get('sort') || '';
      var k = s.replace(/^-/, '');
      if (SORT_KEYS[k]) { state.sortKey = k; state.sortDir = s.charAt(0) === '-' ? -1 : 1; }
      $('q').value = state.q;
    }

    function writeUrl() {
      var parts = [];
      if (state.q) parts.push('q=' + encodeURIComponent(state.q));
      FACETS.forEach(function (f) {
        var s = state.sel[f.key];
        if (s.size) parts.push(f.key + '=' + Array.from(s).map(encodeURIComponent).join(','));
      });
      if (state.sortKey) parts.push('sort=' + (state.sortDir === -1 ? '-' : '') + state.sortKey);
      var url = root.location.pathname + (parts.length ? '?' + parts.join('&') : '') + root.location.hash;
      try { root.history.replaceState(null, '', url); } catch (e) { /* file:// or sandbox */ }
    }

    function nSelected() {
      var n = 0;
      FACETS.forEach(function (f) { if (!(state.view === 'graveyard' && f.key === 'tier')) n += state.sel[f.key].size; });
      return n;
    }

    function filt() {
      var sel = {};
      FACETS.forEach(function (f) { sel[f.key] = state.sel[f.key]; });
      if (state.view === 'graveyard') sel.tier = new Set();
      return { q: state.q, sel: sel, graveyard: state.view === 'graveyard' };
    }

    /* ----- facets panel ----- */
    function renderFacets(focus) {
      var f = filt(), out = [];
      FACETS.forEach(function (fc) {
        if (state.view === 'graveyard' && fc.key === 'tier') return;
        var counts = facetCounts(state.rows, f, fc.key), set = state.sel[fc.key];
        var vals = fc.order ? fc.order.slice() : Object.keys(counts).sort(function (a, b) {
          return (counts[b] || 0) - (counts[a] || 0) || textCmp(fc.name(a), fc.name(b));
        });
        vals = vals.filter(function (v) { return set.has(v) || (counts[v] || 0) >= (fc.min || 1); });
        set.forEach(function (v) { if (vals.indexOf(v) === -1) vals.push(v); });
        var lim = fc.limit && !state.expanded[fc.key] ? fc.limit : Infinity;
        var shown = vals.filter(function (v, i) { return i < lim || set.has(v); });
        var chips = shown.map(function (v) { return chipHtml(fc.key, v, fc.name(v), counts[v] || 0, set.has(v)); }).join('');
        if (vals.length > shown.length) chips += '<button type="button" class="chip morebtn" data-expand="' + fc.key + '">+ ' + (vals.length - shown.length) + ' more</button>';
        else if (fc.limit && state.expanded[fc.key] && vals.length > fc.limit) chips += '<button type="button" class="chip morebtn" data-expand="' + fc.key + '">fewer</button>';
        out.push('<details class="facet" data-facet="' + fc.key + '"' + (state.open[fc.key] || set.size ? ' open' : '') + '>' +
          '<summary>' + esc(fc.label) + (set.size ? '<span class="n">' + set.size + '</span>' : '') + '</summary>' +
          (fc.key === 'hides' || fc.key === 'chain' ? '<p class="hint">Rows that match any you pick</p>' : '') +
          '<div class="opts' + (fc.list ? ' vlist' : '') + '">' + chips + '</div></details>');
      });
      $('facets').innerHTML = out.join('');
      if (focus) {
        var sel = focus.expand ? 'button[data-expand="' + focus.facet + '"]'
          : 'button[data-facet="' + focus.facet + '"][data-value="' + (root.CSS && CSS.escape ? CSS.escape(focus.value) : focus.value) + '"]';
        var b = $('facets').querySelector(sel);
        if (b) b.focus();
      }
      var n = nSelected();
      $('f-count').textContent = n ? String(n) : '';
      $('reset').hidden = !(n || state.q);
    }

    function renderActive() {
      var parts = [];
      if (state.q) parts.push('<button type="button" class="chip" data-clear="q">“' + esc(state.q) + '” <span class="x" aria-hidden="true">×</span><span class="sr">remove</span></button>');
      FACETS.forEach(function (fc) {
        if (state.view === 'graveyard' && fc.key === 'tier') return;
        state.sel[fc.key].forEach(function (v) {
          parts.push('<button type="button" class="chip" data-clear="' + fc.key + '" data-value="' + esc(v) + '">' +
            (fc.key === 'tier' ? '' : esc(fc.label) + ': ') + esc(fc.name(v)) + ' <span class="x" aria-hidden="true">×</span><span class="sr">remove</span></button>');
        });
      });
      $('active').innerHTML = parts.join('');
    }

    function renderTable() {
      var s = curSort();
      var sorted = sortRows(filterRows(state.rows, filt()), s.k, s.d);
      $('grid-head').innerHTML = headHtml(s.k, s.d);
      $('grid-body').innerHTML = bodyHtml(sorted, state.limit);
      var shown = Math.min(state.limit, sorted.length);
      var scope = state.view === 'graveyard' ? ' in the Graveyard' : '';
      $('result-count').textContent = fmtInt(sorted.length) + (sorted.length === 1 ? ' project' : ' projects') + scope +
        (shown < sorted.length ? ', showing ' + fmtInt(shown) : '');
      var more = $('more');
      if (shown < sorted.length) {
        more.innerHTML = '<button type="button" class="btn ghost" data-more="page">Show ' + fmtInt(Math.min(PAGE, sorted.length - shown)) + ' more</button>' +
          '<button type="button" class="btn ghost" data-more="all">Show all ' + fmtInt(sorted.length) + '</button>';
      } else {
        more.innerHTML = '';
      }
      var sv = (s.d === -1 ? '-' : '') + s.k, opt = $('sort');
      opt.value = sv;
      if (opt.value !== sv) opt.value = s.k;
    }

    function refresh(focus) {
      state.limit = PAGE;
      renderFacets(focus);
      renderActive();
      renderTable();
      writeUrl();
    }

    /* ----- summary panels (built once, data is static) ----- */
    function renderPanels() {
      var st = computeStats(state.rows);
      $('stats').innerHTML = statsHtml(st);

      var gy = graveYears(state.rows, 2014), mx = 1;
      gy.years.forEach(function (y) { if (y.n > mx) mx = y.n; });
      $('bars').innerHTML = gy.years.map(function (y, i) {
        var lbl = (i === 0 ? y.year + ' or earlier' : y.year) + ': ' + y.n;
        return '<span title="' + esc(lbl) + '" data-h="' + (y.n / mx * 100).toFixed(1) + '" data-d="' + i * 40 + '"></span>';
      }).join('');
      var ys = gy.years;
      $('yrs').innerHTML = ys.length ? '<span>' + ys[0].year + '</span><span>' + ys[Math.floor(ys.length / 2)].year + '</span><span>' + ys[ys.length - 1].year + '</span>' : '';
      $('p-years-link').textContent = 'all ' + fmtInt(st.dead) + ' →';
      $('p-years').querySelector('.cap').textContent = 'Year of last sign of life, dead projects only' + (gy.undated ? '. ' + gy.undated + ' have no date.' : '.');

      var graves = sortRows(state.rows.filter(function (r) { return r.tier === 'D' && r.last_activity; }), 'last_activity', -1).slice(0, 6);
      $('graves').innerHTML = graves.map(function (g) {
        return '<li><a href="' + esc(hashFor(g.id)) + '" translate="no">' + esc(g.name) + '</a><span class="m">' + esc((g.status || '').replace(/-/g, ' ')) + ' · ' + esc(g.last_activity.slice(0, 7)) + '</span></li>';
      }).join('');

      var b = st.byTier, segs = [['S and A', b.S + b.A, 'a', 'S,A'], ['B', b.B, 'b', 'B'], ['C', b.C, 'c', 'C'], ['D', b.D, 'd', 'D'], ['Unrated', b.U, 'u', 'U']];
      $('tierbar').innerHTML = segs.map(function (s) { return '<span class="seg-' + s[2] + '" title="' + esc(s[0] + ': ' + s[1]) + '" data-w="' + (s[1] / st.total * 100).toFixed(2) + '"></span>'; }).join('');
      $('tl').innerHTML = segs.map(function (s) { return '<button type="button" data-tiers="' + s[3] + '">' + esc(s[0]) + ' <b>' + esc(fmtInt(s[1])) + '</b></button>'; }).join('');

      var live = {};
      state.rows.forEach(function (r) { if (r.tier === 'S' || r.tier === 'A' || r.tier === 'B') live[r.category] = (live[r.category] || 0) + 1; });
      var top = Object.keys(live).sort(function (x, y) { return live[y] - live[x]; }).slice(0, 5);
      $('topcats').innerHTML = top.map(function (c) {
        return '<li><button type="button" data-cat="' + esc(c) + '">' + esc(catLabel(c)) + '</button><span class="m">' + esc(fmtInt(live[c])) + ' live</span></li>';
      }).join('');
      applySizes($('panels'));
    }

    function showCatalogWith(facet, values) {
      FACETS.forEach(function (f) { state.sel[f.key].clear(); });
      state.q = ''; $('q').value = '';
      values.forEach(function (v) { state.sel[facet].add(v); });
      state.open[facet] = true;
      state.scrollTo = true;
      state.dirty = true;
      if (root.location.hash && root.location.hash !== '#') { root.location.hash = ''; return; } /* hashchange runs route() */
      route(false);
    }

    $('tl').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-tiers]');
      if (b) showCatalogWith('tier', b.getAttribute('data-tiers').split(','));
    });
    $('topcats').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-cat]');
      if (b) showCatalogWith('cat', [b.getAttribute('data-cat')]);
    });

    /* ----- the map page ----- */
    var map = (function () {
      var cv = $('map'), card = $('mapcard'), tip = $('tip'), cx = cv.getContext('2d');
      var cats = [], pts = [], cells = [], W = 0, H = 0, cols = 1, cw = 0, ch = 0, hover = -1, col = [], fg = {}, raf = 0, t0 = 0, built = false;
      var reduce = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var ORDER = { S: 0, A: 1, B: 2, C: 3, U: 4, '': 4, D: 5 };
      var TIDX = { S: 0, A: 1, B: 2, C: 3, D: 4, U: 5, '': 5 };

      function build(rows) {
        var by = {};
        rows.forEach(function (r) {
          var k = r.category || '';
          if (!by[k]) by[k] = { slug: k, rows: [], live: 0, dead: 0 };
          by[k].rows.push(r);
          if (r.tier === 'S' || r.tier === 'A' || r.tier === 'B') by[k].live++;
          if (r.tier === 'D') by[k].dead++;
        });
        cats = Object.keys(by).map(function (k) { return by[k]; }).sort(function (a, b) { return b.rows.length - a.rows.length; });
        cats.forEach(function (c) { c.rows.sort(function (a, b) { return ORDER[a.tier] - ORDER[b.tier]; }); });
        $('catgrid').innerHTML = cats.map(function (c) {
          var n = c.rows.length, quiet = n - c.live - c.dead;
          return '<button type="button" class="catcell" data-cat="' + esc(c.slug) + '"><span class="nm">' + esc(catLabel(c.slug)) + '</span>' +
            '<span class="mini"><span class="seg-a" data-w="' + (c.live / n * 100).toFixed(1) + '"></span><span class="seg-c" data-w="' + (quiet / n * 100).toFixed(1) + '"></span><span class="seg-d" data-w="' + (c.dead / n * 100).toFixed(1) + '"></span></span>' +
            '<span class="ct"><span>' + fmtInt(n) + ' projects</span><span class="lv">' + fmtInt(c.live) + ' live</span><span class="dd">' + fmtInt(c.dead) + ' dead</span></span></button>';
        }).join('');
        applySizes($('catgrid'));
        built = true;
      }

      function recolor() {
        var cs = root.getComputedStyle(html);
        var g = function (n) { return cs.getPropertyValue(n).trim(); };
        col = [g('--accent'), g('--accent'), g('--b'), g('--mute'), g('--dead'), g('--faint')];
        fg = { mute: g('--mute'), ink: g('--ink') };
        if (built && !views.map.hidden) draw(root.performance ? performance.now() : 0, true);
      }

      function layout() {
        var r = card.getBoundingClientRect();
        if (!r.width) return;
        W = r.width;
        cols = W > 1050 ? 7 : W > 820 ? 6 : W > 600 ? 4 : 3;
        var rows = Math.ceil(cats.length / cols);
        cw = W / cols;
        ch = Math.max(118, Math.min(178, cw * 0.95));
        H = Math.round(rows * ch + 10);
        card.style.height = H + 'px';
        var D = Math.min(2, root.devicePixelRatio || 1);
        cv.width = Math.round(W * D); cv.height = Math.round(H * D);
        cx.setTransform(D, 0, 0, D, 0, 0);
        var maxN = cats.length ? cats[0].rows.length : 1;
        var k = Math.min(cw * 0.44, (ch - 30) / 2) / Math.sqrt(maxN);
        cells = []; pts = [];
        cats.forEach(function (c, i) {
          var cc = i % cols, rr = Math.floor(i / cols);
          var R = Math.sqrt(c.rows.length) * k;
          var cell = { x: (cc + 0.5) * cw, y: rr * ch + 10 + (ch - 30) / 2, R: R, c: c, top: rr * ch, left: cc * cw };
          cells.push(cell);
          var n = c.rows.length;
          /* sunflower spiral: live projects at the core, the dead on the rim */
          for (var j = 0; j < n; j++) {
            var rad = R * Math.sqrt((j + 0.5) / n), a = j * 2.399963 + i;
            pts.push({ x: cell.x + Math.cos(a) * rad, y: cell.y + Math.sin(a) * rad, t: TIDX[c.rows[j].tier], c: i, ph: (j * 7.3) % 6.28, b: j * 2 + i * 25 });
          }
        });
      }

      function label(cell, on) {
        var text = catLabel(cell.c.slug), cnt = ' ' + fmtInt(cell.c.rows.length), max = cw - 14;
        cx.font = '11px JBM, ui-monospace, monospace';
        while (text.length > 4 && cx.measureText(text + cnt).width > max) text = text.slice(0, -2) + '…';
        cx.globalAlpha = on ? 1 : 0.35;
        cx.fillStyle = on && hover >= 0 ? fg.ink : fg.mute;
        cx.textAlign = 'center';
        cx.fillText(text + cnt, cell.x, cell.top + ch - 8);
      }

      function draw(now, once) {
        var t = reduce || once ? 1e6 : now - t0;
        cx.clearRect(0, 0, W, H);
        var animating = false;
        for (var i = 0; i < pts.length; i++) {
          var p = pts[i], a = Math.min(1, Math.max(0, (t - p.b) / 420));
          if (a < 1) animating = true;
          if (!a) continue;
          var tw = (p.t <= 1 && !reduce) ? 0.82 + 0.18 * Math.sin(now / 700 + p.ph) : 1;
          cx.globalAlpha = a * tw * (p.t === 3 ? 0.55 : 1) * (hover < 0 || hover === p.c ? 1 : 0.16);
          cx.fillStyle = col[p.t];
          if (p.t === 4) { cx.fillRect(p.x - 2.2, p.y - 0.6, 4.4, 1.2); cx.fillRect(p.x - 0.6, p.y - 2.2, 1.2, 4.4); }
          else { cx.beginPath(); cx.arc(p.x, p.y, p.t <= 1 ? 2.3 : 1.7, 0, 6.2832); cx.fill(); }
        }
        for (var c = 0; c < cells.length; c++) label(cells[c], hover < 0 || hover === c);
        cx.globalAlpha = 1;
        return animating;
      }

      function loop(now) {
        raf = 0;
        if (views.map.hidden) return;
        draw(now, false);
        if (!reduce) raf = root.requestAnimationFrame(loop);
      }

      function hit(e) {
        var r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        var i = Math.floor(y / ch) * cols + Math.floor(x / cw);
        return { i: i >= 0 && i < cells.length && x >= 0 && x < W ? i : -1, x: x, y: y };
      }

      cv.addEventListener('mousemove', function (e) {
        var h = hit(e);
        if (h.i !== hover) { hover = h.i; if (reduce) draw(0, true); }
        if (hover >= 0) {
          var c = cells[hover].c;
          tip.innerHTML = '<b>' + esc(catLabel(c.slug)) + '</b><br>' + fmtInt(c.rows.length) + ' projects · ' + fmtInt(c.live) + ' live · ' + fmtInt(c.dead) + ' dead<br><span class="dim">Click to open in the catalog</span>';
          tip.hidden = false;
          tip.style.left = Math.max(6, Math.min(h.x + 14, W - 250)) + 'px';
          tip.style.top = Math.min(h.y + 14, H - 80) + 'px';
        } else tip.hidden = true;
      });
      cv.addEventListener('mouseleave', function () { hover = -1; tip.hidden = true; if (reduce) draw(0, true); });
      cv.addEventListener('click', function (e) {
        var h = hit(e);
        if (h.i >= 0) showCatalogWith('cat', [cells[h.i].c.slug]);
      });
      $('catgrid').addEventListener('click', function (e) {
        var b = e.target.closest('button[data-cat]');
        if (b) showCatalogWith('cat', [b.getAttribute('data-cat')]);
      });
      var rt = null;
      root.addEventListener('resize', function () {
        clearTimeout(rt);
        rt = setTimeout(function () { if (!views.map.hidden) { layout(); draw(0, true); } }, 120);
      });

      return {
        build: build,
        recolor: recolor,
        show: function () {
          recolor();
          layout();
          t0 = root.performance ? performance.now() : 0;
          if (reduce) { draw(0, true); return; }
          if (!raf) raf = root.requestAnimationFrame(loop);
        }
      };
    })();

    /* ----- routing ----- */
    var NAV = { all: 'nav-all', map: 'nav-map', graveyard: 'nav-graveyard', method: 'nav-method' };
    function setNav(active) {
      Object.keys(NAV).forEach(function (k) {
        var el = $(NAV[k]);
        if (k === active) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current');
      });
    }

    function route(force) {
      if (!state.loaded) return;
      var raw = (root.location.hash || '').replace(/^#/, '');
      var h;
      try { h = decodeURIComponent(raw); } catch (e) { h = raw; }
      Object.keys(views).forEach(function (k) { views[k].hidden = true; });
      if (h === '!method') {
        setNav('method');
        views.method.hidden = false;
        doc.title = 'Method | privacy maxi';
        root.scrollTo(0, 0);
        return;
      }
      if (h === '!map') {
        setNav('map');
        views.map.hidden = false;
        doc.title = 'The map | privacy maxi';
        map.show();
        return;
      }
      if (h && h.charAt(0) !== '!') {
        var r = findById(state.rows, h);
        setNav(r && r.tier === 'D' ? 'graveyard' : 'all');
        views.detail.innerHTML = detailHtml(r);
        views.detail.hidden = false;
        doc.title = (r ? r.name : 'Not found') + ' | privacy maxi';
        root.scrollTo(0, 0);
        return;
      }
      var next = h === '!graveyard' ? 'graveyard' : 'all';
      var changed = next !== state.view;
      state.view = next;
      var g = next === 'graveyard';
      $('hero').hidden = g;
      $('grave-hero').hidden = !g;
      $('p-tiers').hidden = g;
      $('panels').classList.toggle('two', g);
      $('tier-note').hidden = g;
      if (changed || force || state.dirty) { state.dirty = false; refresh(); }
      setNav(next);
      views.list.hidden = false;
      doc.title = g ? 'The Graveyard | privacy maxi' : 'privacy maxi: every crypto privacy project, alive or dead';
      if (state.scrollTo) {
        state.scrollTo = false;
        $('catalog').scrollIntoView();
      } else if (changed) root.scrollTo(0, 0);
    }

    /* ----- events ----- */
    var qTimer = null;
    $('q').addEventListener('input', function (e) {
      clearTimeout(qTimer);
      var v = e.target.value;
      qTimer = setTimeout(function () { state.q = v.trim(); refresh(); }, 110);
    });

    doc.addEventListener('keydown', function (e) {
      if (e.key === '/' && doc.activeElement && !/^(INPUT|TEXTAREA|SELECT)$/.test(doc.activeElement.tagName)) {
        e.preventDefault();
        if (views.list.hidden) root.location.hash = '';
        $('q').focus();
      }
    });

    $('facets').addEventListener('click', function (e) {
      var x = e.target.closest('button[data-expand]');
      if (x) {
        var k = x.getAttribute('data-expand');
        state.expanded[k] = !state.expanded[k];
        renderFacets({ facet: k, expand: true });
        return;
      }
      var b = e.target.closest('button[data-facet]');
      if (!b) return;
      var fk = b.getAttribute('data-facet'), v = b.getAttribute('data-value'), set = state.sel[fk];
      if (set.has(v)) set.delete(v); else set.add(v);
      refresh({ facet: fk, value: v });
    });
    /* remember which facet sections are open across re-renders (toggle does not bubble, so capture it) */
    $('facets').addEventListener('toggle', function (e) {
      var d = e.target;
      if (d && d.getAttribute && d.getAttribute('data-facet')) state.open[d.getAttribute('data-facet')] = d.open;
    }, true);

    $('active').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-clear]');
      if (!b) return;
      var k = b.getAttribute('data-clear');
      if (k === 'q') { state.q = ''; $('q').value = ''; }
      else state.sel[k].delete(b.getAttribute('data-value'));
      refresh();
    });

    $('reset').addEventListener('click', function () {
      state.q = ''; $('q').value = '';
      FACETS.forEach(function (f) { state.sel[f.key].clear(); });
      refresh();
    });

    $('f-toggle').addEventListener('click', function () {
      var open = !$('filters').classList.contains('open');
      $('filters').classList.toggle('open', open);
      this.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    $('sort').addEventListener('change', function () {
      var v = this.value, k = v.replace(/^-/, '');
      var d = defaultSort();
      if (k === d.k && (v.charAt(0) === '-' ? -1 : 1) === d.d) state.sortKey = null;
      else { state.sortKey = k; state.sortDir = v.charAt(0) === '-' ? -1 : 1; }
      state.limit = PAGE;
      renderTable();
      writeUrl();
    });

    $('grid-head').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-sort]');
      if (!b) return;
      var k = b.getAttribute('data-sort'), s = curSort();
      if (s.k === k) { state.sortKey = k; state.sortDir = -s.d; }
      else { state.sortKey = k; state.sortDir = k === 'last_activity' ? -1 : 1; }
      renderTable();
      writeUrl();
    });

    $('grid-body').addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      var tr = e.target.closest('tr[data-id]');
      if (tr) root.location.hash = hashFor(tr.getAttribute('data-id'));
    });

    $('more').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-more]');
      if (!b) return;
      state.limit = b.getAttribute('data-more') === 'all' ? Infinity : state.limit + PAGE;
      renderTable();
    });

    root.addEventListener('hashchange', function () { route(false); });

    readUrl();
    fetch(DATA_URL, { cache: 'no-cache', credentials: 'omit' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        state.rows = normalize(json);
        state.loaded = true;
        renderPanels();
        map.build(state.rows);
        route(true);
      })
      .catch(function (err) {
        $('stats').innerHTML = '<div class="stat err"><span>The catalog failed to load (' + esc(err.message) + '). The raw file is at <a href="' + esc(DATA_URL) + '">' + esc(DATA_URL) + '</a>.</span></div>';
      });
  }

  var api = {
    esc: esc, safeUrl: safeUrl, xUrl: xUrl, catLabel: catLabel, hostOf: hostOf, fmtInt: fmtInt,
    normalize: normalize, computeStats: computeStats, categoryCounts: categoryCounts, graveYears: graveYears,
    filterRows: filterRows, facetCounts: facetCounts, sortRows: sortRows, findById: findById, correctionUrl: correctionUrl,
    rowHtml: rowHtml, bodyHtml: bodyHtml, headHtml: headHtml, detailHtml: detailHtml, statsHtml: statsHtml, FACETS: FACETS
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else if (root.document) {
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', init);
    else init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
