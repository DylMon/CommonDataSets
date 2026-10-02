(function () {
    // Normalizes the data_year field's inconsistent source formats
    // ("2025-26", "2025-2026", "2024-25", "2024-2025") into one display
    // form, and flags anything that isn't the current cycle as stale.
    const CURRENT_CYCLE = '2025-26';

    function normalizeYear(raw) {
        if (!raw) return { label: 'Unknown', stale: true };
        const parts = raw.split('-');
        const start = parts[0];
        const endRaw = parts[1] || '';
        const end = endRaw.length > 2 ? endRaw.slice(-2) : endRaw;
        const label = `${start}–${end}`;
        const shortForm = `${start}-${end}`;
        return { label, stale: shortForm !== CURRENT_CYCLE };
    }

    // Falls back to the school's homepage only when we don't have a
    // researched CDS-page URL for it (see data/school-cds-links.json).
    function schoolWebsiteUrl(website) {
        if (!website) return null;
        const hasProtocol = /^https?:\/\//.test(website);
        return hasProtocol ? website : `https://${website}`;
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str ?? '';
        return div.innerHTML;
    }

    function renderRows(schools, cdsLinks) {
        const tbody = document.getElementById('resources-tbody');
        if (!schools.length) {
            tbody.innerHTML = '<tr><td colspan="3" class="resources-empty">No schools match that search.</td></tr>';
            return;
        }
        tbody.innerHTML = schools.map(s => {
            const year = normalizeYear(s.data_year);
            const link = cdsLinks[s.slug];
            const homepageUrl = schoolWebsiteUrl(s.website);

            let cell;
            if (link && link.url) {
                const uncertainMark = link.confidence === 'uncertain'
                    ? `<span class="resources-uncertain" title="${escapeHtml(link.note || 'Found via search but could not be fully re-verified.')}">?</span>`
                    : '';
                cell = `<a class="resources-find-link" href="${link.url}" target="_blank" rel="noopener">Common Data Set${uncertainMark}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                   </a>`;
            } else if (homepageUrl) {
                cell = `<a class="resources-find-link resources-find-link--fallback" href="${homepageUrl}" target="_blank" rel="noopener" title="${escapeHtml(link?.note || 'No specific CDS page found — linking to their website instead.')}">Visit Website
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                   </a>`;
            } else {
                cell = '<span class="resources-empty" style="padding:0">Not found</span>';
            }

            return `<tr>
                <td class="resources-school-name">${escapeHtml(s.name)}</td>
                <td class="resources-year${year.stale ? ' is-stale' : ''}">${year.label}${year.stale ? ' (older)' : ''}</td>
                <td>${cell}</td>
            </tr>`;
        }).join('');
    }

    async function init() {
        let allSchools = [];
        let cdsLinks = {};
        try {
            const [schoolsRes, linksRes] = await Promise.all([
                fetch('/data/schools-2025-2026.json'),
                fetch('/data/school-cds-links.json'),
            ]);
            const data = await schoolsRes.json();
            const linksList = await linksRes.json();
            cdsLinks = Object.fromEntries(linksList.map(l => [l.slug, l]));
            allSchools = (data.schools || [])
                .filter(s => s.name != null)
                .sort((a, b) => a.name.localeCompare(b.name));
        } catch {
            document.getElementById('resources-tbody').innerHTML =
                '<tr><td colspan="3" class="resources-empty">Couldn\'t load the school list — try refreshing.</td></tr>';
            return;
        }

        const countEl = document.getElementById('resources-count');
        function applyFilter() {
            const q = searchInput.value.trim().toLowerCase();
            const filtered = q ? allSchools.filter(s => s.name.toLowerCase().includes(q)) : allSchools;
            renderRows(filtered, cdsLinks);
            countEl.textContent = `${filtered.length} of ${allSchools.length} schools`;
        }

        const searchInput = document.getElementById('resources-search');
        searchInput.addEventListener('input', applyFilter);
        applyFilter();
    }

    init();
})();
