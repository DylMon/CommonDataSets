(function () {
    const path = window.location.pathname;
    const inSubdir = path.includes('/schools/');
    const root = inSubdir ? '../' : '';

    const active = path.includes('compare')  ? 'compare'
                 : path.includes('chanceme') ? 'chanceme'
                 : path.includes('info')     ? 'info'
                 : path.includes('privacy') || path.includes('terms') ? null
                 : 'index';

    function navLink(href, label, key) {
        const cls = active === key ? ' active-nav-link' : '';
        return `<div class="nav-link-wrapper${cls}"><a href="${root}${href}">${label}</a></div>`;
    }

    const nav = `
        <header class="site-header">
            <div class="nav-wrapper">
                <div class="nav-brand">CommonDataSets</div>
            </div>
            <div class="header-accent-bar">
                <div class="left-side">
                    ${navLink('index.html', 'Data Sets', 'index')}
                    ${navLink('compare.html', 'Compare', 'compare')}
                    ${navLink('chanceme.html', 'Chance Me', 'chanceme')}
                    ${navLink('info.html', 'About', 'info')}
                </div>
            </div>
        </header>`;

    document.addEventListener('DOMContentLoaded', function () {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/png';
        link.href = root + 'favicon.png';
        document.head.appendChild(link);

        const container = document.querySelector('.container');
        if (container) container.insertAdjacentHTML('afterbegin', nav);

        // School pages only: hide the header on scroll down, bring it back
        // on scroll up. Everywhere else it just stays put (sticky to top).
        if (inSubdir) {
            const header = document.querySelector('.site-header');
            if (header) {
                let lastY = window.scrollY;
                let ticking = false;

                function updateHeader() {
                    const y = window.scrollY;
                    if (Math.abs(y - lastY) > 5) {
                        const shouldHide = y > lastY && y > header.offsetHeight;
                        header.classList.toggle('site-header--hidden', shouldHide);
                        // Mirrored on <body> so the sticky right-sidebar (see
                        // css/base.css) can rise into the space the header
                        // just vacated instead of leaving it empty above it.
                        document.body.classList.toggle('header-hidden', shouldHide);
                        lastY = y;
                    }
                    ticking = false;
                }

                window.addEventListener('scroll', function () {
                    if (!ticking) {
                        window.requestAnimationFrame(updateHeader);
                        ticking = true;
                    }
                }, { passive: true });
            }
        }
    });
})();
