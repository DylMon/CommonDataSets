(function () {
    // Root-relative absolute paths throughout (the site has a fixed custom
    // domain — see CNAME) rather than computing a `../` prefix per nesting
    // level, since every page now lives one or two directories deep
    // (/compare/, /schools/{slug}/) under the clean-URL convention.
    const path = window.location.pathname;
    const onSchoolPage = path.includes('/schools/');

    const active = path.includes('compare')  ? 'compare'
                 : path.includes('chanceme') ? 'chanceme'
                 : path.includes('info')     ? 'info'
                 : path.includes('privacy') || path.includes('terms') ? null
                 : 'index';

    function navLink(href, label, key) {
        const cls = active === key ? ' active-nav-link' : '';
        return `<div class="nav-link-wrapper${cls}"><a href="${href}">${label}</a></div>`;
    }

    const nav = `
        <header class="site-header">
            <div class="nav-wrapper">
                <a class="nav-brand-group" href="/">
                    <img class="site-logo" src="/images/logo-transparent.png" alt="">
                    <span class="nav-brand">CommonDataSets</span>
                </a>
                <div class="left-side">
                    ${navLink('/', 'Data Sets', 'index')}
                    ${navLink('/compare/', 'Compare', 'compare')}
                    ${navLink('/chanceme/', 'Chance Me', 'chanceme')}
                </div>
                <div class="nav-corner-links">
                    <a href="/info/">About Us</a>
                    <a href="/contact/">Contact Us</a>
                </div>
            </div>
        </header>`;

    document.addEventListener('DOMContentLoaded', function () {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/png';
        link.href = '/favicon.png';
        document.head.appendChild(link);

        const container = document.querySelector('.container');
        if (container) container.insertAdjacentHTML('afterbegin', nav);

        // School pages only: hide the header on scroll down, bring it back
        // on scroll up. Everywhere else it just stays put (sticky to top).
        if (onSchoolPage) {
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
