(function () {
    const path = window.location.pathname;
    const inSubdir = path.includes('/schools/');
    const root = inSubdir ? '../' : '';

    const active = path.includes('compare') ? 'compare'
                 : path.includes('about')   ? 'about'
                 : 'index';

    function navLink(href, label, key) {
        const cls = active === key ? ' active-nav-link' : '';
        return `<div class="nav-link-wrapper${cls}"><a href="${root}${href}">${label}</a></div>`;
    }

    const nav = `
        <div class="nav-wrapper">
            <div class="left-side">
                ${navLink('index.html', 'Data Sets', 'index')}
                ${navLink('compare.html', 'Compare', 'compare')}
            </div>
            <div class="center-brand">
                <div class="brand">CommonDataSets</div>
                <p class="brand-sub">Current data through 2023–2024</p>
            </div>
        </div>`;

    document.addEventListener('DOMContentLoaded', function () {
        const container = document.querySelector('.container');
        if (container) container.insertAdjacentHTML('afterbegin', nav);
    });
})();
