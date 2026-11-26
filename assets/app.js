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

  var DEFAULT_LABELS = {
    'default': 'On for everyone',
    'opt-in': 'Opt-in',
    'n/a': 'Not applicable',
    unknown: 'Unknown'
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

  function catLabel(slug) {
    if (!slug) return 'Uncategorised';
    if (CATEGORY_LABELS[slug]) return CATEGORY_LABELS[slug];
    var s = String(slug).replace(/[-_]+/g, ' ');
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

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

  function filterRows(rows, f) {
    var terms = (f.q || '').toLowerCase().split(/\s+/).filter(Boolean);
    var cats = f.cats && f.cats.size ? f.cats : null;
    var tiers = f.tiers && f.tiers.size ? f.tiers : null;
    var out = [];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (f.graveyard && r.tier !== 'D') continue;
      if (tiers && !tiers.has(r.tier)) continue;
      if (cats && !cats.has(r.category)) continue;
      var ok = true;
      for (var t = 0; t < terms.length; t++) if (r._hay.indexOf(terms[t]) === -1) { ok = false; break; }
      if (ok) out.push(r);
    }
    return out;
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

  function sortRows(rows, key, dir) {
    dir = dir === -1 ? -1 : 1;
    var cmp;
    switch (key) {
      case 'name':
        cmp = function (a, b) { return dir * byName(a, b); }; break;
      case 'category':
        cmp = function (a, b) { return dir * textCmp(catLabel(a.category), catLabel(b.category)) || byName(a, b); }; break;
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
    { key: 'status', label: 'Status', cls: 'c-status' },
    { key: 'launched', label: 'Launched', cls: 'c-num c-launched' },
    { key: 'last_activity', label: 'Last activity', cls: 'c-num c-last' }
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
      '<td class="c-name"><a href="' + esc(hashFor(r.id)) + '">' + esc(r.name) + '</a>' +
        (r.one_liner ? '<span class="sub">' + esc(r.one_liner) + '</span>' : '') + '</td>' +
      '<td class="c-cat">' + esc(catLabel(r.category)) + '</td>' +
      '<td class="c-hides">' + tags(r.hides.slice(0, 4), 'hide') + (r.hides.length > 4 ? '<span class="hide more-h">+' + (r.hides.length - 4) + '</span>' : '') + '</td>' +
      '<td class="c-status">' + statusPill(r.status) + '</td>' +
      '<td class="c-num c-launched">' + (r.launched === null ? '<span class="dim">-</span>' : esc(r.launched)) + '</td>' +
      '<td class="c-num c-last">' + (r.last_activity ? esc(r.last_activity) : '<span class="dim">-</span>') + '</td>' +
      '</tr>';
  }

  function bodyHtml(rows, limit) {
    if (!rows.length) return '<tr><td colspan="' + COLUMNS.length + '" class="empty">No rows match. Know a project we missed? <a href="' + esc(correctionUrl(null)) + '" rel="noopener noreferrer">Tell us</a>.</td></tr>';
    var n = Math.min(limit, rows.length);
    var parts = new Array(n);
    for (var i = 0; i < n; i++) parts[i] = rowHtml(rows[i]);
    return parts.join('');
  }

  function statsHtml(s) {
    function cell(n, label, cls, href) {
      var inner = '<span class="stat-n">' + esc(fmtInt(n)) + '</span><span class="stat-l">' + esc(label) + '</span>';
      return href ? '<a class="stat ' + cls + '" href="' + esc(href) + '">' + inner + '</a>' : '<div class="stat ' + cls + '">' + inner + '</div>';
    }
    var tiers = TIERS.map(function (t) {
      return '<span class="tc"><span class="tier t-' + t + '">' + t + '</span><span class="mono">' + esc(fmtInt(s.byTier[t])) + '</span></span>';
    }).join('');
    return cell(s.total, 'projects tracked', 'st-total') +
      cell(s.live, 'live (tiers S, A, B)', 'st-live') +
      cell(s.early, 'early or quiet (tier C)', 'st-early') +
      cell(s.dead, 'in the Graveyard (tier D)', 'st-dead', '#!graveyard') +
      '<div class="stat st-tiers"><span class="stat-l">By tier</span><span class="tier-row">' + tiers + '</span></div>';
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
      return '<article class="receipt detail"><p><a class="back" href="#">← Back to the catalog</a></p>' +
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
    return '<article class="receipt detail">' +
      '<p class="detail-top">' + back + '<span class="mono dim">#' + esc(r.id) + '</span></p>' +
      '<header class="detail-head">' + tierBadge(r.tier) + '<div><h2>' + esc(r.name) + '</h2>' +
        (r.aliases.length ? '<p class="dim">also ' + esc(r.aliases.join(', ')) + '</p>' : '') + '</div></header>' +
      (r.one_liner ? '<p class="one">' + esc(r.one_liner) + '</p>' : '') +
      '<dl class="fields">' +
        field('Category', esc(catLabel(r.category))) +
        field('Status', statusPill(r.status)) +
        field('Hides', r.hides.length ? tags(r.hides, 'hide') : '') +
        field('Trust', esc(TRUST_LABELS[r.trust_model] || r.trust_model)) +
        field('Privacy default', esc(DEFAULT_LABELS[r.privacy_default] || r.privacy_default)) +
        field('Launched', r.launched === null ? '' : '<span class="mono">' + esc(r.launched) + '</span>') +
        field('Last activity', r.last_activity ? '<span class="mono">' + esc(r.last_activity) + '</span>' : '') +
        field('Confidence', r.confidence ? '<span class="conf c-' + esc(r.confidence) + '">' + esc(r.confidence) + '</span>' : '') +
        field('Tech', r.tech.length ? tags(r.tech, 'tech') : '') +
        field('Chains', esc(r.ecosystems.join(', '))) +
      '</dl>' +
      (r.tier_reason ? '<h3>Why tier ' + esc(r.tier) + '</h3><p>' + esc(r.tier_reason) + '</p>' : '') +
      (r.adoption ? '<h3>Adoption</h3><p class="mono-ish">' + esc(r.adoption) + '</p>' : '') +
      (links ? '<h3>Links</h3><ul class="links">' + links + '</ul>' : '') +
      '<h3>Sources <span class="mono dim">' + r.sources.length + '</span></h3>' +
      (srcs ? '<ol class="sources">' + srcs + '</ol>' : '<p class="dim">No sources yet. Add one through the correction form.</p>') +
      '<p class="correct"><a class="btn" href="' + esc(correctionUrl(r)) + '" rel="noopener noreferrer">Correct this row</a>' +
        '<span class="dim">Bring a source. Projects can claim their row the same way.</span></p>' +
      '</article>';
  }

  function chipHtml(group, value, label, n, on) {
    return '<button type="button" class="chip' + (on ? ' on' : '') + '" aria-pressed="' + (on ? 'true' : 'false') + '" data-group="' + group + '" data-value="' + esc(value) + '">' +
      esc(label) + (n !== null ? ' <span class="mono">' + esc(fmtInt(n)) + '</span>' : '') + '</button>';
  }

  /* ---------- browser wiring ---------- */

  function init() {
    var doc = root.document;
    var $ = function (id) { return doc.getElementById(id); };
    var state = {
      rows: [], q: '', cats: new Set(), tiers: new Set(),
      sortKey: 'tier', sortDir: 1, limit: PAGE, view: 'all'
    };
    var listView = $('view-list'), detailView = $('view-detail'), methodView = $('view-method');

    function renderChips() {
      var tierSrc = state.rows;
      var tc = computeStats(tierSrc).byTier;
      $('tier-chips').innerHTML = TIERS.map(function (t) {
        return chipHtml('tier', t, t === 'U' ? 'Unrated' : 'Tier ' + t, tc[t], state.tiers.has(t));
      }).join('');
      var base = state.view === 'graveyard' ? state.rows.filter(function (r) { return r.tier === 'D'; }) : state.rows;
      $('cat-chips').innerHTML = categoryCounts(base).map(function (c) {
        return chipHtml('cat', c.slug, c.label, c.n, state.cats.has(c.slug));
      }).join('');
      $('cat-count').textContent = state.cats.size ? state.cats.size + ' selected' : '';
      $('tier-chips').hidden = state.view === 'graveyard';
      $('grave-intro').hidden = state.view !== 'graveyard';
    }

    function renderTable() {
      var filtered = filterRows(state.rows, { q: state.q, cats: state.cats, tiers: state.view === 'graveyard' ? null : state.tiers, graveyard: state.view === 'graveyard' });
      var sorted = sortRows(filtered, state.sortKey, state.sortDir);
      $('grid-head').innerHTML = headHtml(state.sortKey, state.sortDir);
      $('grid-body').innerHTML = bodyHtml(sorted, state.limit);
      var shown = Math.min(state.limit, sorted.length);
      var scope = state.view === 'graveyard' ? ' in the Graveyard' : '';
      $('result-count').textContent = fmtInt(sorted.length) + ' rows' + scope + (shown < sorted.length ? ', showing ' + fmtInt(shown) : '');
      var more = $('more');
      if (shown < sorted.length) {
        more.innerHTML = '<button type="button" class="btn ghost" data-more="page">Show ' + fmtInt(Math.min(PAGE, sorted.length - shown)) + ' more</button>' +
          '<button type="button" class="btn ghost" data-more="all">Show all ' + fmtInt(sorted.length) + '</button>';
      } else {
        more.innerHTML = '';
      }
      var dirty = state.q || state.cats.size || state.tiers.size;
      $('reset').hidden = !dirty;
    }

    function setTabs(active) {
      ['all', 'graveyard', 'method'].forEach(function (k) {
        var el = $('tab-' + k);
        var on = k === active;
        el.classList.toggle('on', on);
        el.setAttribute('aria-selected', on ? 'true' : 'false');
      });
    }

    function route() {
      if (!state.loaded) return;
      var raw = (root.location.hash || '').replace(/^#/, '');
      var h;
      try { h = decodeURIComponent(raw); } catch (e) { h = raw; }
      listView.hidden = detailView.hidden = methodView.hidden = true;
      if (h === '!method') {
        setTabs('method');
        methodView.hidden = false;
        doc.title = 'Method | privacy maxi';
        return;
      }
      if (h && h.charAt(0) !== '!') {
        var r = findById(state.rows, h);
        setTabs(r && r.tier === 'D' ? 'graveyard' : 'all');
        detailView.innerHTML = detailHtml(r);
        detailView.hidden = false;
        doc.title = (r ? r.name : 'Not found') + ' | privacy maxi';
        root.scrollTo(0, 0);
        return;
      }
      var next = h === '!graveyard' ? 'graveyard' : 'all';
      if (next !== state.view) {
        state.view = next;
        state.limit = PAGE;
        if (next === 'graveyard') { state.sortKey = 'last_activity'; state.sortDir = -1; }
        else { state.sortKey = 'tier'; state.sortDir = 1; }
        renderChips();
        renderTable();
      }
      setTabs(state.view);
      listView.hidden = false;
      doc.title = state.view === 'graveyard' ? 'The Graveyard | privacy maxi' : 'privacy maxi: every crypto privacy project, alive or dead';
    }

    var qTimer = null;
    $('q').addEventListener('input', function (e) {
      clearTimeout(qTimer);
      var v = e.target.value;
      qTimer = setTimeout(function () { state.q = v.trim(); state.limit = PAGE; renderTable(); }, 90);
    });

    doc.addEventListener('keydown', function (e) {
      if (e.key === '/' && doc.activeElement && !/^(INPUT|TEXTAREA|SELECT)$/.test(doc.activeElement.tagName)) {
        e.preventDefault();
        if (listView.hidden) root.location.hash = '';
        $('q').focus();
      }
    });

    function onChip(e) {
      var b = e.target.closest('button.chip');
      if (!b) return;
      var set = b.getAttribute('data-group') === 'tier' ? state.tiers : state.cats;
      var v = b.getAttribute('data-value');
      if (set.has(v)) set.delete(v); else set.add(v);
      state.limit = PAGE;
      renderChips();
      renderTable();
    }
    $('tier-chips').addEventListener('click', onChip);
    $('cat-chips').addEventListener('click', onChip);

    $('reset').addEventListener('click', function () {
      state.q = ''; $('q').value = '';
      state.cats.clear(); state.tiers.clear();
      state.limit = PAGE;
      renderChips();
      renderTable();
    });

    $('grid-head').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-sort]');
      if (!b) return;
      var k = b.getAttribute('data-sort');
      if (state.sortKey === k) state.sortDir = -state.sortDir;
      else { state.sortKey = k; state.sortDir = (k === 'last_activity' || k === 'launched') ? -1 : 1; }
      renderTable();
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

    root.addEventListener('hashchange', route);

    fetch(DATA_URL, { cache: 'no-cache', credentials: 'omit' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        state.rows = normalize(json);
        state.loaded = true;
        $('stats').innerHTML = statsHtml(computeStats(state.rows));
        renderChips();
        renderTable();
        state.view = null; /* force first route to render the right list */
        route();
      })
      .catch(function (err) {
        $('stats').innerHTML = '<div class="stat st-err"><span class="stat-l">The catalog failed to load (' + esc(err.message) + '). The raw file is at <a href="' + esc(DATA_URL) + '">' + esc(DATA_URL) + '</a>.</span></div>';
      });
  }

  var api = {
    esc: esc, safeUrl: safeUrl, xUrl: xUrl, catLabel: catLabel, hostOf: hostOf, fmtInt: fmtInt,
    normalize: normalize, computeStats: computeStats, categoryCounts: categoryCounts,
    filterRows: filterRows, sortRows: sortRows, findById: findById, correctionUrl: correctionUrl,
    rowHtml: rowHtml, bodyHtml: bodyHtml, headHtml: headHtml, detailHtml: detailHtml, statsHtml: statsHtml
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else if (root.document) {
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', init);
    else init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
