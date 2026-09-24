import { GPA_BUCKETS, renderGpaHistogram, normalizeGpaDistribution, classRankSegments, renderClassRankHistogram } from './charts.js?v=6';

const SCHOOL_META = {
  'mit':          { color: '#a41931', banner: 'bannerMIT.png' },
  'harvard':      { color: '#a6152c', banner: 'bannerharvard.png' },
  'stanford':     { color: '#8c1515', banner: 'bannerstanford2.jpg' },
  'princeton':    { color: '#ed6d0b', banner: 'bannerprinceton.png' },
  'yale':         { color: '#00356b', banner: 'banneryale.png' },
  'columbia':     { color: '#6dabe4', banner: 'bannercolumbia.png' },
  'upenn':        { color: '#00144d', banner: 'bannerupenn.png' },
  'caltech':      { color: '#ff6e1e', banner: 'bannerCaltech.png' },
  'duke':         { color: '#004c97', banner: 'bannerduke.png' },
  'jhu':          { color: '#002d72', banner: 'bannerJHU.png' },
  'northwestern': { color: '#4e2686', banner: 'bannerNU.png' },
  'dartmouth':    { color: '#00693e', banner: 'bannerdartmouth.png' },
  'brown':        { color: '#4e3629', banner: 'bannerbrown.png' },
  'vanderbilt':   { color: '#dcb163', banner: 'bannervandy.png' },
  'rice':         { color: '#002169', banner: 'bannerrice.png' },
  'washu':        { color: '#a60c10', banner: 'bannerwashu.png' },
  'notre-dame':   { color: '#0c2340', banner: 'bannerND.png' },
  'cornell':      { color: '#b31b1b', banner: 'bannercornell.png' },
  'uchicago':     { color: '#a6152c', banner: 'banneruchicago.jpg' },
  'cmu':          { color: '#c41230', banner: 'bannercmu.png' },
  'georgetown':   { color: '#041e42', banner: 'bannergeorgetown.png' },
  'emory':        { color: '#002878', banner: 'banneremory.png' },
  'wake-forest':  { color: '#1a1a1a', banner: 'bannerwakeforest.png' },
  'tufts':        { color: '#3172ae', banner: 'bannertufts.png' },
  'ucla':         { color: '#017dc3', banner: 'bannerucla.png' },
  'berkeley':     { color: '#193460', banner: 'bannerberkeley.png' },
  'ucsb':         { color: '#003660', banner: 'bannerucsb.png' },
  'uva':          { color: '#232d4b', banner: 'bannerUVA.png' },
  'umich':        { color: '#00274c', banner: 'bannerUMich.png' },
  'unc':          { color: '#4b9cd3', banner: 'bannerUNC.png' },
  'uf':           { color: '#fa4616', banner: 'banneruf.png' },
  'usc':          { color: '#990000', banner: 'bannerUSC.png' },
  'nyu':          { color: '#58078d', banner: 'bannerNYU.png' },

  // Schools added in the 33 → 80 expansion. No banner images yet, so these
  // fall back to the gradient hero background built from `color` alone.
  'american':           { color: '#004fa2' },
  'baylor':             { color: '#154734' },
  'binghamton':         { color: '#005a43' },
  'boston-university':  { color: '#cc0000' },
  'brandeis':           { color: '#003478' },
  'buffalo':            { color: '#005bbb' },
  'case-western':       { color: '#003071' },
  'clemson':            { color: '#f56600' },
  'drexel':             { color: '#07294d' },
  'fiu':                { color: '#081e3f' },
  'fsu':                { color: '#782f40' },
  'georgia-tech':       { color: '#b3a369' },
  'gwu':                { color: '#033c5a' },
  'howard':             { color: '#003a63' },
  'indiana-bloomington':{ color: '#990000' },
  'lehigh':             { color: '#502d0e' },
  'marquette':          { color: '#003366' },
  'miami':              { color: '#f47321' },
  'michigan-state':     { color: '#18453b' },
  'nc-state':           { color: '#cc0000' },
  'njit':               { color: '#d22630' },
  'northeastern':       { color: '#c8102e' },
  'ohio-state':         { color: '#bb0000' },
  'penn-state':         { color: '#001e44' },
  'pepperdine':         { color: '#1e2859' },
  'pitt':               { color: '#003594' },
  'purdue':             { color: '#cfb991' },
  'rit':                { color: '#f76902' },
  'rochester':          { color: '#001e5f' },
  'rpi':                { color: '#d6001c' },
  'santa-clara':        { color: '#a32035' },
  'smu':                { color: '#354ca1' },
  'stevens':            { color: '#9d1535' },
  'stony-brook':        { color: '#990000' },
  'texas-am':           { color: '#500000' },
  'tulane':             { color: '#285c4d' },
  'uc-davis':           { color: '#022851' },
  'uc-irvine':          { color: '#255799' },
  'uc-merced':          { color: '#002856' },
  'uc-riverside':       { color: '#003da5' },
  'uc-san-diego':       { color: '#182b49' },
  'uc-santa-cruz':      { color: '#003c6c' },
  'uconn':              { color: '#000e2f' },
  'uga':                { color: '#ba0c2f' },
  'uic':                { color: '#d50032' },
  'uiuc':               { color: '#ff5f05' },
  'umass-amherst':      { color: '#881c1c' },
  'usf':                { color: '#006747' },
  'ut-austin':          { color: '#bf5700' },
  'villanova':          { color: '#002664' },
  'virginia-tech':      { color: '#630031' },
  'washington-seattle': { color: '#4b2e83' },
  'william-mary':       { color: '#004e38' },
  'wisconsin-madison':  { color: '#c5050c' },
  'wpi':                { color: '#a6192e' },
  'asu': { color: '#8C1D40' },
  'chapman': { color: '#A50034' },
  'clarkson': { color: '#0D433B' },
  'coloradoboulder': { color: '#CFB87C' },
  'colorado-state': { color: '#1e4d2b' },
  'creighton': { color: '#005CA9' },
  'famu': { color: '#D44500' },
  'florida-atlantic': { color: '#003366' },
  'iowa-state-science-tech': { color: '#c8102e' },
  'kansas-state': { color: '#512888' },
  'csulb': { color: '#EBA91B' },
  'csusb': { color: '#0065BD' },
  'montclair-state': { color: '#D1190D' },
  'oklahoma-state': { color: '#fe5c00' },
  'olemiss': { color: '#c8102e' },
  'oregon-state': { color: '#d73f09' },
  'rowan': { color: '#57150B' },
  'sdsu': { color: '#D41736' },
  'templeu': { color: '#9E1B34' },
  'tennessee-knoxville': { color: '#ff8200' },
  'texaschristian': { color: '#4d1979' },
  'ualabama': { color: '#9e1b32' },
  'uarkansas': { color: '#9D2235' },
  'ucentralflorida': { color: '#ffc904' },
  'udenver': { color: '#BA0C2F' },
  'ukentucky': { color: '#0033a0' },
  'umbc': { color: '#fdb515' },
  'unevada-reno': { color: '#041E42' },
  'usandiego': { color: '#002868' },
  'ut-dallas': { color: '#e87500' },
  'uvermont': { color: '#154734' },
  'washington-stateu': { color: '#981e32' },
  'duquense': { color: '#BA0C2F' },
  'boston-college': { color: '#98002E' },
  'bradley': { color: '#e11837' },
  'clark': { color: '#ee2e24' },
  'east-carolina': { color: '#592a8a' },
  'fairfield': { color: '#C8102E' },
  'hofstra': { color: '#0B1E73' },
  'suny-albany': { color: '#461660' },
  'udelaware': { color: '#00539f' },
  'ukansas': { color: '#0051ba' },
  'ulouisville': { color: '#AD0000' },
  'umass-lowell': { color: '#0067B1' },
  'unc-wilmington': { color: '#007680' },
  'uofiowa': { color: '#FFCD00' },
  'uofminnesota-twin-cities': { color: '#7a0019' },
  'uoklahoma': { color: '#841617' },
  'usanfrancisco': { color: '#00543C' },
  'virginiacommonwealth': { color: '#ffb300' },
  'illinois-tech': { color: '#CC0000' },
  'mizzou': { color: '#FDB719' },
  'quinnipiac': { color: '#0C2340' },
  'rutgers-camden': { color: '#cc0033' },
  'rutgers-newark': { color: '#cc0033' },
};

// Logos live at images/logos/<slug>.png. A few schools have none yet; the
// onerror hook hides the broken <img> rather than showing a torn-image icon.
const logoSrc = slug => `../images/logos/${slug}.png`;
const LOGO_ONERR = "this.style.display='none'";

// ── Favorites & History ────────────────────────────────────────────────

const FAV_KEY     = 'cds_favorites';
const HISTORY_KEY = 'cds_recently_viewed';

function getFavs()     { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]')); }
function saveFavs(set) { localStorage.setItem(FAV_KEY, JSON.stringify([...set])); }

function renderFavoritesBox(allSchools) {
  const slugs = [...getFavs()];
  const box = document.getElementById('school-fav-box');
  if (!box) return;
  if (!slugs.length) { box.style.display = 'none'; return; }
  box.style.display = '';
  document.getElementById('school-fav-list').innerHTML = slugs.map(sl => {
    const school = allSchools.find(s => s.slug === sl);
    if (!school) return '';
    return `<a class="history-item" href="${sl}.html">
      <img class="history-logo" src="${logoSrc(sl)}" alt="" onerror="${LOGO_ONERR}">
      <span class="history-name">${school.name}</span>
    </a>`;
  }).filter(Boolean).join('');
}

function renderHistoryBox(allSchools) {
  const slugs = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
  const box = document.getElementById('school-history-box');
  if (!box) return;
  if (!slugs.length) { box.style.display = 'none'; return; }
  box.style.display = '';
  document.getElementById('school-history-list').innerHTML = slugs.map(sl => {
    const school = allSchools.find(s => s.slug === sl);
    if (!school) return '';
    return `<a class="history-item" href="${sl}.html">
      <img class="history-logo" src="${logoSrc(sl)}" alt="" onerror="${LOGO_ONERR}">
      <span class="history-name">${school.name}</span>
    </a>`;
  }).filter(Boolean).join('');
}

// ── Helpers ────────────────────────────────────────────────────────────

function fmt(val, type) {
  if (val == null) return '—';
  if (type === 'money') return '$' + Number(val).toLocaleString();
  if (type === 'pct')   return (val * 100).toFixed(1) + '%';
  return val;
}

function tableHtml(headers, rows) {
  const th = headers.map(h => `<th>${h}</th>`).join('');
  const tbody = rows.map(r =>
    `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`
  ).join('');
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr>${th}</tr></thead><tbody>${tbody}</tbody></table></div>`;
}

function scoreBarHtml(label, val25, val75, scaleMin, scaleMax) {
  if (val25 == null || val75 == null) {
    return `<div class="score-row">
      <div class="score-row-label">${label}</div>
      <span class="score-na-text">Not reported</span>
    </div>`;
  }
  const left  = ((val25 - scaleMin) / (scaleMax - scaleMin) * 100).toFixed(1);
  const width = ((val75  - val25)   / (scaleMax - scaleMin) * 100).toFixed(1);
  return `<div class="score-row">
    <div class="score-row-label">${label}</div>
    <div class="score-bar-wrap">
      <div class="score-bar-track">
        <div class="score-bar-fill" style="left:${left}%;width:${width}%"></div>
      </div>
      <div class="score-bar-vals">${val25} – ${val75}</div>
    </div>
  </div>`;
}

function demoBarHtml(label, val) {
  if (val == null) return '';
  const pct = (val * 100);
  const barWidth = Math.max(pct, 0.3).toFixed(1);
  return `<div class="demo-bar-row">
    <div class="demo-bar-label">${label}</div>
    <div class="demo-bar-track"><div class="demo-bar-fill" style="width:${barWidth}%"></div></div>
    <div class="demo-bar-pct">${pct.toFixed(1)}%</div>
  </div>`;
}

// ── Render: Hero ────────────────────────────────────────────────────────

function renderHero(s, slug, meta) {
  const bannerStyle = meta.banner
    ? `background-image:url('../images/banners/${meta.banner}');background-size:cover;background-position:center;background-repeat:no-repeat`
    : `background:linear-gradient(135deg,${meta.color},#000)`;
  const logo = `<img class="hero-logo" src="${logoSrc(slug)}" alt="${s.name}" onerror="${LOGO_ONERR}">`;
  const metaParts = [s.location, s.school_type].filter(Boolean);
  const siteLink = s.website
    ? ` · <a class="hero-site-link" href="${/^https?:\/\//.test(s.website) ? '' : 'https://'}${s.website}" target="_blank" rel="noopener">Official Site →</a>`
    : '';
  return `
    <div class="school-hero" style="${bannerStyle}">
      <div class="hero-overlay">
        ${logo}
        <div class="hero-text">
          <h1 class="hero-name">
            ${s.name}
            <button class="fav-btn hero-fav-btn${getFavs().has(slug) ? ' favorited' : ''}" id="hero-fav-btn" title="${getFavs().has(slug) ? 'Remove from favorites' : 'Add to favorites'}">
              <svg viewBox="0 0 24 24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
            </button>
          </h1>
          <p class="hero-meta">${metaParts.join(' · ')}${siteLink}</p>
        </div>
      </div>
    </div>`;
}

// ── Render: Stats strip ─────────────────────────────────────────────────

function renderStatsStrip(s) {
  const satVal   = s.sat_composite_25 != null && s.sat_composite_75 != null
    ? `${s.sat_composite_25}–${s.sat_composite_75}`
    : '—';

  const act25 = s.act_composite_25;
  const act75 = s.act_composite_75;

  const tuitionOOS = s.tuition_out_of_state ?? s.tuition;

  const chips = [
    ['Acceptance Rate', s.acceptance_rate != null ? (s.acceptance_rate * 100).toFixed(1) + '%' : '—'],
    ['SAT Range',       satVal],
    ['ACT Range',       act25 != null && act75 != null ? `${act25}–${act75}` : '—'],
    ['Avg GPA (W)',     s.avg_gpa_weighted != null ? parseFloat(s.avg_gpa_weighted).toFixed(2) : 'Not reported'],
    ['Undergrads',      s.total_undergrads != null ? s.total_undergrads.toLocaleString() : '—'],
    ['Tuition (OOS)',   tuitionOOS != null ? '$' + tuitionOOS.toLocaleString() : '—'],
  ];
  return chips.map((c, i) =>
    (i > 0 ? '<div class="stat-divider"></div>' : '') +
    `<div class="stat-chip">
      <div class="stat-chip-val">${c[1]}</div>
      <div class="stat-chip-label">${c[0]}</div>
    </div>`
  ).join('');
}

// ── Render: Admissions summary (paired side-by-side with Cost) ─────────

function renderAdmissionsSummary(s) {
  function kv(label, val) {
    return `<div class="kv-label">${label}</div><div class="kv-val">${val ?? '—'}</div>`;
  }

  const kvGrid = `<div class="kv-grid">
    ${kv('Location',                  s.location)}
    ${kv('School Type',               s.school_type)}
    ${kv('Early Action / Decision',   s.ea_ed_type)}
    ${kv('EA/ED Deadline',            s.ea_ed_deadline)}
    ${kv('Regular Decision Deadline', s.rd_deadline)}
    ${kv('Application Fee',           s.application_fee != null ? '$' + s.application_fee : null)}
  </div>`;

  return `
    <section class="school-section">
      <h2 class="section-title">Admissions</h2>
      ${kvGrid}
    </section>`;
}

// ── Render: Selectivity (funnel + admit rates by round and by gender) ───

function renderSelectivitySection(s) {
  const ratePct = s.acceptance_rate != null ? (s.acceptance_rate * 100).toFixed(1) + '%' : null;
  const funnel = `<div class="funnel">
    <div class="funnel-step">
      <div class="funnel-val">${s.applicants_total != null ? s.applicants_total.toLocaleString() : '—'}</div>
      <div class="funnel-label">Applied</div>
    </div>
    <div class="funnel-arrow">→</div>
    <div class="funnel-step">
      <div class="funnel-val">${s.admitted_total != null ? s.admitted_total.toLocaleString() : '—'}</div>
      <div class="funnel-label">Admitted</div>
      ${ratePct ? `<div class="funnel-pct">${ratePct} rate</div>` : ''}
    </div>
    <div class="funnel-arrow">→</div>
    <div class="funnel-step">
      <div class="funnel-val">${s.enrolled_total != null ? s.enrolled_total.toLocaleString() : '—'}</div>
      <div class="funnel-label">Enrolled</div>
    </div>
  </div>`;

  let poolsHtml = '<p class="no-data">Data not yet available.</p>';
  if (s.applicant_pools) {
    const p = s.applicant_pools;
    poolsHtml = tableHtml(
      ['Round', 'Applied', 'Accepted', 'Rate'],
      [
        ['Early Action / Decision', fmt(p.ea?.applied), fmt(p.ea?.admitted ?? p.ea?.accepted),
          p.ea?.rate != null ? (p.ea.rate * 100).toFixed(1) + '%' : '—'],
        ['Regular Decision', fmt(p.rd?.applied), fmt(p.rd?.admitted ?? p.rd?.accepted),
          p.rd?.rate != null ? (p.rd.rate * 100).toFixed(1) + '%' : '—'],
        ['Waitlist Offered / Accepted', fmt(p.waitlist?.offered), fmt(p.waitlist?.accepted_spots), '—'],
      ]
    );
  }

  let genderRoundsHtml = '<p class="no-data">Data not yet available.</p>';
  if (s.gender_breakdown) {
    const g = s.gender_breakdown;
    genderRoundsHtml = tableHtml(
      ['', 'Applied', 'Accepted', 'Enrolled'],
      [
        ['Male',   fmt(g.applied?.male),   fmt(g.accepted?.male),   fmt(g.enrolled?.male)],
        ['Female', fmt(g.applied?.female), fmt(g.accepted?.female), fmt(g.enrolled?.female)],
      ]
    );
  }

  return `
    <section class="school-section">
      <h2 class="section-title">Selectivity</h2>
      ${funnel}
      <div class="cols-2">
        <div>
          <h3 class="subsection-title">By Round (EA vs RD)</h3>
          ${poolsHtml}
        </div>
        <div>
          <h3 class="subsection-title">By Gender</h3>
          ${genderRoundsHtml}
        </div>
      </div>
    </section>`;
}

// ── Render: Academic Profile (test score ranges + GPA distribution) ─────

function renderAcademicProfileSection(s) {
  let submissionHtml = '';
  if (s.sat_act_breakdown) {
    const b = s.sat_act_breakdown;
    submissionHtml = `
      <h3 class="subsection-title">Score Submission (Enrolled)</h3>
      ${tableHtml(
        ['Test', 'Submitted', '% of Enrolled'],
        [
          ['SAT', b.sat_submitted_count != null ? b.sat_submitted_count.toLocaleString() : '—', b.sat_submitted_pct != null ? (b.sat_submitted_pct * 100).toFixed(0) + '%' : '—'],
          ['ACT', b.act_submitted_count != null ? b.act_submitted_count.toLocaleString() : '—', b.act_submitted_pct != null ? (b.act_submitted_pct * 100).toFixed(0) + '%' : '—'],
        ]
      )}`;
  }

  const scoresCol = `
    <div>
      <h3 class="subsection-title">SAT — 25th to 75th Percentile</h3>
      <div class="score-rows">
        ${scoreBarHtml('Composite', s.sat_composite_25, s.sat_composite_75, 400, 1600)}
        ${scoreBarHtml('Reading &amp; Writing', s.sat_reading_25, s.sat_reading_75, 200, 800)}
        ${scoreBarHtml('Math', s.sat_math_25, s.sat_math_75, 200, 800)}
      </div>
      <h3 class="subsection-title">ACT — 25th to 75th Percentile</h3>
      <div class="score-rows">
        ${scoreBarHtml('Composite', s.act_composite_25, s.act_composite_75, 1, 36)}
        ${scoreBarHtml('Math', s.act_math_25, s.act_math_75, 1, 36)}
        ${scoreBarHtml('English', s.act_english_25, s.act_english_75, 1, 36)}
      </div>
      ${submissionHtml}
    </div>`;

  let gpaCol = `
    <div>
      <h3 class="subsection-title">GPA Distribution of Enrolled Students</h3>
      <p class="no-data">Data not yet available.</p>
    </div>`;
  const g = normalizeGpaDistribution(s.gpa_distribution);
  if (g) {
    const rows = GPA_BUCKETS.slice().reverse().map(([key, label]) =>
      [label, g[key] != null ? (g[key] * 100).toFixed(0) + '%' : '—']);
    const gpaDistHtml = tableHtml(['GPA Range', '% of Enrolled'], rows);

    const chartPoints = GPA_BUCKETS
      .map(([key, label]) => ({ label, value: g[key] }))
      .filter(p => p.value != null);

    const chartBlock = chartPoints.length >= 2
      ? `<div class="gpa-chart-wrap"><canvas id="gpa-chart"></canvas></div>
         <p class="chart-caption">GPA bands aren't evenly sized (the top band is a single value, 4.0, while others span up to a full point), and schools often don't report bands below 3.0 — read this as a shape, not a precise curve.</p>`
      : '';

    gpaCol = `
      <div>
        <h3 class="subsection-title">GPA Distribution of Enrolled Students</h3>
        ${chartBlock}
        ${gpaDistHtml}
      </div>`;
  }

  return `
    <section class="school-section">
      <h2 class="section-title">Academic Profile</h2>
      <div class="cols-2">
        ${scoresCol}
        ${gpaCol}
      </div>
    </section>`;
}

// ── Render: Class Rank (chart, when the school reports it) ──────────────

function renderClassRankSection(s) {
  const cr = s.class_rank;
  const segments = classRankSegments(cr);

  if (!segments) {
    return `
      <section class="school-section">
        <h2 class="section-title">Class Rank of Enrolled Students</h2>
        <p class="no-data">Not reported in CDS — many high schools no longer calculate class rank.</p>
      </section>`;
  }

  const rows = [
    ['Top 10%', cr.top10],
    ['Top 25%', cr.top25],
    ['Top 50%', cr.top50],
    ['Bottom 50%', cr.bottom50],
    ['Bottom 25%', cr.bottom25],
  ]
    .filter(([, v]) => v != null)
    .map(([label, v]) => [label, (v * 100).toFixed(0) + '%']);

  return `
    <section class="school-section">
      <h2 class="section-title">Class Rank of Enrolled Students</h2>
      <div class="gpa-chart-wrap"><canvas id="class-rank-chart"></canvas></div>
      <p class="chart-caption">Reported as cumulative percentiles (e.g. "top 25%" includes the "top 10%" group), split here into the actual share of the class in each band.</p>
      ${tableHtml(['Percentile', 'Cumulative Share'], rows)}
    </section>`;
}

// ── Render: Admission Factors (name + 4-dot importance meter, 2 columns) ─

const FACTOR_LABELS = {
  rigor: 'Rigor of Secondary School Record', class_rank: 'Class Rank',
  academic_gpa: 'Academic GPA', test_scores: 'Standardized Test Scores',
  essay: 'Application Essay', recommendations: 'Recommendations',
  interview: 'Interview', extracurriculars: 'Extracurricular Activities',
  talent: 'Talent / Ability', character: 'Character / Personal Qualities',
  first_gen: 'First Generation', alumni_relation: 'Alumni/ae Relation',
  geo_residence: 'Geographical Residence', state_residence: 'State Residence',
  religious: 'Religious Affiliation', racial_ethnic: 'Racial / Ethnic Status',
  volunteer: 'Volunteer Work', work_experience: 'Work Experience',
  applicant_interest: "Level of Applicant's Interest",
};

const FACTOR_SCORE = { very_important: 4, important: 3, considered: 2, not_considered: 1 };
const FACTOR_SCORE_LABEL = ['—', 'Not considered', 'Considered', 'Important', 'Very important'];

function factorMeter(score) {
  const dots = [1, 2, 3, 4]
    .map(n => `<span class="factor-dot${n <= score ? ' on' : ''}"></span>`).join('');
  return `<span class="factor-meter" title="${FACTOR_SCORE_LABEL[score]}">${dots}</span>`;
}

function renderAdmissionFactorsSection(s) {
  let body = '<p class="no-data">Data not yet available.</p>';

  if (s.admission_factors) {
    const items = Object.entries(FACTOR_LABELS)
      .map(([key, label]) => ({ label, score: FACTOR_SCORE[s.admission_factors[key]] ?? 0 }))
      .filter(it => it.score > 0);

    if (items.length) {
      const rowHtml = it =>
        `<div class="factor-row"><span class="factor-name">${it.label}</span>${factorMeter(it.score)}</div>`;
      const mid = Math.ceil(items.length / 2);
      const legend = [4, 3, 2, 1]
        .map(n => `<span>${factorMeter(n)} ${FACTOR_SCORE_LABEL[n]}</span>`).join('');
      body = `
        <div class="factor-legend">${legend}</div>
        <div class="cols-2 factor-cols">
          <div class="factor-list">${items.slice(0, mid).map(rowHtml).join('')}</div>
          <div class="factor-list">${items.slice(mid).map(rowHtml).join('')}</div>
        </div>`;
    }
  }

  return `
    <section class="school-section">
      <h2 class="section-title">What Matters in the Decision</h2>
      ${body}
    </section>`;
}

// ── Render: Cost section ────────────────────────────────────────────────

function renderCostSection(s) {
  const tuitionIn  = s.tuition_in_state  ?? s.tuition;
  const tuitionOut = s.tuition_out_of_state ?? s.tuition;
  const feesIn     = s.required_fees;
  const feesOut    = s.required_fees;
  const otherIn    = s.other_expenses;
  const otherOut   = s.other_expenses;

  const inTotal  = [tuitionIn,  s.room_and_board, s.books_supplies, feesIn,  otherIn]
    .reduce((a, v) => a + (v || 0), 0);
  const outTotal = [tuitionOut, s.room_and_board, s.books_supplies, feesOut, otherOut]
    .reduce((a, v) => a + (v || 0), 0);

  const rows = [
    ['Tuition',                       fmt(tuitionIn, 'money'),      fmt(tuitionOut, 'money')],
    ['Room &amp; Board',              fmt(s.room_and_board, 'money'), fmt(s.room_and_board, 'money')],
    ['Books &amp; Supplies',          fmt(s.books_supplies, 'money'), fmt(s.books_supplies, 'money')],
    ['Required Fees',                 fmt(feesIn, 'money'),          fmt(feesOut, 'money')],
    ['Other Expenses',                fmt(otherIn, 'money'),         fmt(otherOut, 'money')],
    [
      '<strong>Total Cost of Attendance</strong>',
      inTotal  > 0 ? `<strong>$${inTotal.toLocaleString()}</strong>`  : '—',
      outTotal > 0 ? `<strong>$${outTotal.toLocaleString()}</strong>` : '—',
    ],
  ];

  const appFee = s.application_fee != null
    ? `<p class="section-note" style="margin-top:14px">Application Fee: <strong>$${s.application_fee}</strong></p>`
    : '';

  return `
    <section class="school-section">
      <h2 class="section-title">Cost</h2>
      ${tableHtml(['', 'In-State', 'Out-of-State'], rows)}
      ${appFee}
    </section>`;
}

// ── Render: Student Body section ────────────────────────────────────────

function renderStudentBodySection(s) {
  let raceHtml = '<p class="no-data">Data not yet available.</p>';

  if (s.demographics_detail?.undergrad) {
    // CDS path — raw counts; convert to fractions using total
    const d     = s.demographics_detail.undergrad;
    const total = d.total || 1;
    raceHtml = `<div class="demo-bars">
      ${demoBarHtml('Asian',                            d.asian            != null ? d.asian            / total : null)}
      ${demoBarHtml('White',                            d.white            != null ? d.white            / total : null)}
      ${demoBarHtml('Hispanic / Latino',                d.hispanic         != null ? d.hispanic         / total : null)}
      ${demoBarHtml('Black / African American',         d.black            != null ? d.black            / total : null)}
      ${demoBarHtml('Nonresident Aliens',               d.nonresident_aliens != null ? d.nonresident_aliens / total : null)}
      ${demoBarHtml('Two or More Races',                d.two_or_more      != null ? d.two_or_more      / total : null)}
      ${demoBarHtml('American Indian / Alaska Native',  d.american_indian  != null ? d.american_indian  / total : null)}
      ${demoBarHtml('Native Hawaiian / Pac. Islander',  d.pacific_islander != null ? d.pacific_islander / total : null)}
      ${demoBarHtml('Unknown',                          d.unknown          != null ? d.unknown          / total : null)}
    </div>`;
  }

  let genderHtml = '<p class="no-data">Data not yet available.</p>';
  if (s.undergrads_male != null && s.total_undergrads) {
    // CDS path — raw counts
    const total = s.total_undergrads;
    genderHtml = `<div class="demo-bars">
      ${demoBarHtml('Men',   s.undergrads_male   / total)}
      ${demoBarHtml('Women', s.undergrads_female / total)}
    </div>`;
  }

  let geoHtml = '<p class="no-data">Data not yet available.</p>';
  if (s.pct_out_of_state != null) {
    const inState = 1 - s.pct_out_of_state;
    geoHtml = `<div class="demo-bars">
      ${demoBarHtml('In-State',      inState > 0 ? inState : null)}
      ${demoBarHtml('Out-of-State',  s.pct_out_of_state)}
    </div>`;
  }

  let transferHtml = '<p class="no-data">Data not yet available.</p>';
  if (s.transfer_stats) {
    const t = s.transfer_stats;
    transferHtml = tableHtml(
      ['', 'Applied', 'Admitted', 'Enrolled'],
      [
        ['Male',   fmt(t.male?.applied),   fmt(t.male?.admitted),   fmt(t.male?.enrolled)],
        ['Female', fmt(t.female?.applied), fmt(t.female?.admitted), fmt(t.female?.enrolled)],
        ['Total',  fmt(t.total?.applied),  fmt(t.total?.admitted),  fmt(t.total?.enrolled)],
      ]
    );
  }

  const ugNote = s.total_undergrads != null
    ? `<p class="section-note">Total Undergraduates: <strong>${s.total_undergrads.toLocaleString()}</strong></p>`
    : '';

  return `
    <section class="school-section">
      <h2 class="section-title">Student Body</h2>
      ${ugNote}
      <h3 class="subsection-title">Race / Ethnicity</h3>
      ${raceHtml}
      <div class="cols-2">
        <div>
          <h3 class="subsection-title">Gender</h3>
          ${genderHtml}
        </div>
        <div>
          <h3 class="subsection-title">Geographic Origin</h3>
          ${geoHtml}
        </div>
      </div>
      <h3 class="subsection-title">Transfer Admissions</h3>
      ${transferHtml}
    </section>`;
}

// ── Init ────────────────────────────────────────────────────────────────

async function init() {
  const slug = window.SCHOOL_SLUG || new URLSearchParams(window.location.search).get('school');

  if (!slug) {
    document.getElementById('school-sections').innerHTML =
      '<p class="loading">No school specified. Add <code>?school=mit</code> to the URL.</p>';
    return;
  }

  // Record immediately — synchronous, before any async work
  const historyKey = 'cds_recently_viewed';
  let recentHistory = JSON.parse(localStorage.getItem(historyKey) ?? '[]');
  recentHistory = [slug, ...recentHistory.filter(s => s !== slug)].slice(0, 5);
  localStorage.setItem(historyKey, JSON.stringify(recentHistory));

  const res = await fetch('../data/schools-2025-2026.json');
  if (!res.ok) {
    document.getElementById('school-sections').innerHTML =
      '<p class="loading">Failed to load school data.</p>';
    return;
  }
  const { schools } = await res.json();
  const s = schools.find(school => school.slug === slug);

  if (!s) {
    document.getElementById('school-sections').innerHTML =
      `<p class="loading">School not found: <strong>${slug}</strong></p>`;
    return;
  }

  const meta = SCHOOL_META[slug] ?? { color: '#333', banner: null };

  document.documentElement.style.setProperty('--brand', meta.color);
  document.title = `${s.name} Admissions Data — CommonDataSets`;

  const pct = s.acceptance_rate != null ? (s.acceptance_rate * 100).toFixed(1) + '%' : null;
  const descParts = [`${s.name} admissions data for ${s.data_year}`];
  if (pct) descParts.push(`${pct} acceptance rate`);
  const satRange = s.sat_composite_25 != null
    ? `${s.sat_composite_25}–${s.sat_composite_75} SAT`
    : null;
  if (satRange) descParts.push(satRange);
  if (s.location) descParts.push(s.location);
  document.querySelector('meta[name="description"]').content = descParts.join(' · ') + '.';

  document.getElementById('school-hero').innerHTML = renderHero(s, slug, meta);

  document.getElementById('hero-fav-btn').addEventListener('click', () => {
    const favs = getFavs();
    const btn  = document.getElementById('hero-fav-btn');
    if (favs.has(slug)) {
      favs.delete(slug);
      btn.classList.remove('favorited');
      btn.title = 'Add to favorites';
    } else {
      favs.add(slug);
      btn.classList.add('favorited');
      btn.title = 'Remove from favorites';
    }
    saveFavs(favs);
    refreshRail();
  });

  document.getElementById('stats-strip').innerHTML = renderStatsStrip(s);
  document.getElementById('school-sections').innerHTML =
    `<div class="school-section-row">
      ${renderAdmissionsSummary(s)}
      ${renderCostSection(s)}
    </div>` +
    renderSelectivitySection(s) +
    renderAcademicProfileSection(s) +
    renderClassRankSection(s) +
    renderAdmissionFactorsSection(s) +
    renderStudentBodySection(s);

  renderGpaHistogram(document.getElementById('gpa-chart'), s.gpa_distribution, meta.color);
  renderClassRankHistogram(document.getElementById('class-rank-chart'), s.class_rank, meta.color);

  // Inject right sidebar alongside school-sections
  const sectionsEl = document.getElementById('school-sections');
  const layout = document.createElement('div');
  layout.className = 'school-page-layout';
  sectionsEl.parentElement.insertBefore(layout, sectionsEl);
  layout.appendChild(sectionsEl);

  const sidebar = document.createElement('div');
  sidebar.className = 'right-sidebar';
  sidebar.innerHTML = `
    <div class="history-box" id="school-fav-box" style="display:none">
      <div class="history-title">Favorites</div>
      <div id="school-fav-list"></div>
    </div>
    <div class="history-box" id="school-history-box" style="display:none">
      <div class="history-title">History</div>
      <div id="school-history-list"></div>
    </div>`;
  layout.appendChild(sidebar);

  // Re-render both rail boxes and collapse the whole rail (along with its
  // top border on narrow layouts) when the visitor has neither favorites
  // nor history yet. Hoisted so the hero favorite button can call it too.
  function refreshRail() {
    renderFavoritesBox(schools);
    renderHistoryBox(schools);
    const railEmpty = ['school-fav-box', 'school-history-box']
      .every(id => document.getElementById(id).style.display === 'none');
    sidebar.style.display = railEmpty ? 'none' : '';
  }

  refreshRail();

  const back = document.createElement('a');
  back.className = 'floating-back';
  back.href = '../index.html';
  back.textContent = '← Schools';
  document.body.appendChild(back);
}

init();
