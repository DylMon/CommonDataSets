(function () {
    // Drives the header's search dropdown (#school-search / #search-clear /
    // #search-dropdown, injected by js/header.js) on every page — focus with
    // an empty query shows Recently Viewed + Favorites (read straight from
    // localStorage, same cds_recently_viewed/cds_favorites keys school.js's
    // rail and index.html's own sidebar use), typing switches to live
    // autocomplete. Self-contained (own schools fetch, own alias map) rather
    // than importing from index.html, matching how logoSrc/LOGO_ONERR/
    // ALL_YEAR_FILES are already duplicated per-file across this codebase
    // (js/school.js, js/chanceme.js, index.html) instead of shared via a
    // module — this is the one copy of that pattern usable from any page.
    const LOGO_ONERR = "this.style.display='none'";
    const logoSrc = slug => `/images/logos/${slug}.png`;

    // Every year we've ever parsed CDS data for, oldest first — same list
    // index.html's loadAllSchools() uses, just without the scorecard/plans/
    // GPA/cost merges this dropdown doesn't need (name + slug is enough to
    // match and link).
    const ALL_YEAR_FILES = [
        '/data/schools-2021-2022.json',
        '/data/schools-2022-2023.json',
        '/data/schools-2023-2024.json',
        '/data/schools-2024-2025.json',
        '/data/schools-2025-2026.json',
    ];

    // Common acronyms/nicknames that don't already appear as a substring of
    // the school's official name — kept in sync with index.html's own copy
    // (used there for the restored page-level search bar's grid filter).
    const SCHOOL_ALIASES = {
        'american': ['AU'],
        'asu': ['Arizona State'],
        'berkeley': ['Cal', 'UC Berkeley', 'UCB'],
        'boston-college': ['BC'],
        'boston-university': ['BU'],
        'caltech': ['Cal Tech'],
        'case-western': ['CWRU'],
        'claremont-mckenna': ['CMC'],
        'cmu': ['Carnegie Mellon'],
        'coloradoboulder': ['CU Boulder', 'CU'],
        'csufullerton': ['Cal State Fullerton', 'CSUF'],
        'csulb': ['Long Beach State', 'LBSU'],
        'csusb': ['Cal State San Bernardino', 'CSUSB'],
        'fsu': ['Florida State'],
        'georgia-tech': ['Georgia Tech', 'GT'],
        'georgetown': ['GU'],
        'gwu': ['GW', 'George Washington'],
        'harvey-mudd': ['Mudd'],
        'jhu': ['Johns Hopkins', 'Hopkins'],
        'mit': ['MIT'],
        'miami': ['The U'],
        'michigan-tech': ['Michigan Tech', 'MTU'],
        'mizzou': ['Mizzou', 'Missouri'],
        'nc-state': ['NC State', 'North Carolina State'],
        'notre-dame': ['ND'],
        'ohio-state': ['OSU', 'Ohio State'],
        'olemiss': ['Ole Miss', 'Mississippi'],
        'penn-state': ['Penn State', 'PSU'],
        'pitt': ['Pitt'],
        'rutgers-camden': ['Rutgers'],
        'rutgers-newark': ['Rutgers'],
        'smu': ['SMU'],
        'stony-brook': ['SBU'],
        'suny-albany': ['SUNY Albany', 'Albany'],
        'texaschristian': ['TCU'],
        'texas-am': ['Texas A&M', 'A&M'],
        'uc-davis': ['UCD', 'Davis'],
        'uc-irvine': ['UCI', 'Irvine'],
        'uc-merced': ['UCM', 'Merced'],
        'uc-riverside': ['UCR', 'Riverside'],
        'uc-san-diego': ['UCSD'],
        'uc-santa-cruz': ['UCSC'],
        'uchicago': ['UChicago'],
        'uconn': ['UConn', 'Connecticut'],
        'ucsb': ['UCSB'],
        'udelaware': ['UDel', 'Delaware'],
        'uf': ['UF'],
        'uga': ['UGA'],
        'uic': ['UIC'],
        'uiuc': ['UIUC', 'Illinois'],
        'umass-amherst': ['UMass', 'UMass Amherst'],
        'umass-lowell': ['UMass Lowell'],
        'umbc': ['UMBC'],
        'umich': ['Michigan', 'UMich'],
        'unc': ['UNC', 'Chapel Hill'],
        'university-maryland-college-park': ['Maryland', 'UMD'],
        'uofminnesota-twin-cities': ['Minnesota', 'UMN'],
        'upenn': ['Penn', 'UPenn'],
        'usc': ['USC'],
        'usf': ['USF', 'South Florida'],
        'usma-west-point': ['West Point', 'Army'],
        'ut-austin': ['UT Austin', 'Texas', 'UT'],
        'ut-dallas': ['UT Dallas', 'UTD'],
        'uva': ['UVA', 'Virginia'],
        'vanderbilt': ['Vandy'],
        'villanova': ['Nova'],
        'virginia-tech': ['Virginia Tech', 'VT'],
        'virginiacommonwealth': ['VCU'],
        'wake-forest': ['Wake'],
        'washington-seattle': ['UW', 'Washington'],
        'washington-stateu': ['WSU'],
        'washu': ['WashU'],
        'william-mary': ['W&M', 'William and Mary'],
        'wisconsin-madison': ['UW-Madison', 'Wisconsin'],
        'wpi': ['WPI'],
    };

    function schoolMatchesSearch(s, q) {
        if (s.name.toLowerCase().includes(q)) return true;
        const aliases = SCHOOL_ALIASES[s.slug];
        return aliases ? aliases.some(a => a.toLowerCase().includes(q)) : false;
    }

    let allSchools = [];

    async function loadAllSchools() {
        const results = await Promise.all(ALL_YEAR_FILES.map(async url => {
            try {
                const res = await fetch(url);
                if (!res.ok) return [];
                const { schools } = await res.json();
                return schools.filter(s => s.name != null);
            } catch (err) {
                console.error(`Header search failed to load ${url}:`, err);
                return [];
            }
        }));
        // Oldest-first, so a later file's record for the same slug simply
        // overwrites the earlier one — every school ends up with just its
        // single most recent name/slug.
        const bySlug = new Map();
        for (const yearSchools of results) {
            for (const s of yearSchools) {
                if (s.slug) bySlug.set(s.slug, s);
            }
        }
        allSchools = [...bySlug.values()];
    }

    // One row of the dropdown — same logo/name markup as the favorites/
    // history sidebar's .history-item, wrapped in .search-dropdown-item for
    // its own hover/padding instead.
    function dropdownItemHtml(slug) {
        const school = allSchools.find(s => s.slug === slug);
        if (!school) return '';
        return `<a class="search-dropdown-item" href="/schools/${slug}/">
            <img class="history-logo" src="${logoSrc(slug)}" alt="" onerror="${LOGO_ONERR}">
            <span class="history-name">${school.name}</span>
        </a>`;
    }

    // Empty query, just focused: Recently Viewed, then Favorites, each
    // under their own label — read straight from localStorage each time
    // (rather than a page-local Set) so this stays correct no matter which
    // page the header is rendered on. Non-empty query: live autocomplete,
    // capped at 8 so a broad query doesn't produce an unreadably long list.
    function updateSearchDropdown(searchInput, searchDropdown) {
        const q = searchInput.value.trim().toLowerCase();
        if (!q) {
            const historySlugs = JSON.parse(localStorage.getItem('cds_recently_viewed') ?? '[]');
            const favoriteSlugs = JSON.parse(localStorage.getItem('cds_favorites') ?? '[]');
            const historyItems = historySlugs.map(dropdownItemHtml).filter(Boolean);
            const favoriteItems = favoriteSlugs.map(dropdownItemHtml).filter(Boolean);
            const sections = [];
            if (historyItems.length) sections.push(`<div class="search-dropdown-label">Recently Viewed</div>${historyItems.join('')}`);
            if (favoriteItems.length) sections.push(`<div class="search-dropdown-label">Favorites</div>${favoriteItems.join('')}`);
            if (!sections.length) { searchDropdown.hidden = true; return; }
            searchDropdown.innerHTML = sections.join('');
            searchDropdown.hidden = false;
            return;
        }
        const matches = allSchools.filter(s => schoolMatchesSearch(s, q)).slice(0, 8);
        if (!matches.length) { searchDropdown.hidden = true; return; }
        searchDropdown.innerHTML = matches.map(s => dropdownItemHtml(s.slug)).join('');
        searchDropdown.hidden = false;
    }

    // js/header.js injects the header (including this input) inside its own
    // DOMContentLoaded handler, and its <script> tag appears earlier in
    // every page's <head> than this one — same-event listeners fire in
    // registration order, so by the time this runs the header always
    // already exists.
    document.addEventListener('DOMContentLoaded', () => {
        const searchInput = document.getElementById('school-search');
        const searchClear = document.getElementById('search-clear');
        const searchDropdown = document.getElementById('search-dropdown');
        if (!searchInput || !searchClear || !searchDropdown) return;

        function updateSearchClear() {
            searchClear.hidden = searchInput.value.length === 0;
        }

        searchInput.addEventListener('focus', () => updateSearchDropdown(searchInput, searchDropdown));

        searchInput.addEventListener('input', () => {
            updateSearchClear();
            updateSearchDropdown(searchInput, searchDropdown);
        });

        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            updateSearchClear();
            searchInput.focus();
            updateSearchDropdown(searchInput, searchDropdown);
        });

        document.addEventListener('click', e => {
            if (!e.target.closest('#header-search')) searchDropdown.hidden = true;
        });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') searchDropdown.hidden = true;
        });

        loadAllSchools();
    });
})();
