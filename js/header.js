(function () {
    // Root-relative absolute paths throughout (the site has a fixed custom
    // domain — see CNAME) rather than computing a `../` prefix per nesting
    // level, since every page now lives one or two directories deep
    // (/compare/, /schools/{slug}/) under the clean-URL convention.
    const path = window.location.pathname;
    const onSchoolPage = path.includes('/schools/');

    const active = path.includes('compare')   ? 'compare'
                 : path.includes('chanceme')  ? 'chanceme'
                 : path.includes('info')      ? 'info'
                 : path.includes('resources') ? 'resources'
                 : path.includes('privacy') || path.includes('terms') ? null
                 : 'index';

    function navLink(href, label, key) {
        const cls = active === key ? ' active-nav-link' : '';
        return `<div class="nav-link-wrapper${cls}"><a href="${href}">${label}</a></div>`;
    }

    // Header look (Umber bar, orange block highlight, Outfit wordmark/links,
    // links grouped next to the logo, hanging logo, grow link hover, logo
    // tilt, shrink-on-scroll) is baked directly into this class list and
    // the matching --hdr-*/--wordmark-*/--link-* defaults in css/base.css's
    // .site-header rule — see the variant panel on the header-option-3
    // branch if it needs to change.
    const nav = `
        <header class="site-header nav-grouped cta-outline logo-hang text-normal hover-grow logo-tilt scroll-shrink">
            <div class="nav-wrapper">
                <a class="nav-brand" href="/">
                    <img class="site-logo" src="/images/logo-transparent.png" alt="">
                    <span>CommonDataSets</span>
                </a>
                <div class="left-side">
                    ${navLink('/', 'Data Sets', 'index')}
                    ${navLink('/compare/', 'Compare', 'compare')}
                    ${navLink('/chanceme/', 'Chance Me', 'chanceme')}
                </div>
                <div class="nav-corner-links">
                    <a href="/resources/">Resources</a>
                    <a href="/info/">About Us</a>
                    <a href="/contact/">Contact Us</a>
                </div>
            </div>
            <div class="header-sub-bar"></div>
        </header>`;

    // Sticky sidebars offset themselves by --header-height, so keep it in
    // step with whatever height the header actually renders at (it varies
    // with viewport width and the shrink-on-scroll state).
    function syncHeaderHeight() {
        const header = document.querySelector('.site-header');
        if (header) document.documentElement.style.setProperty('--header-height', header.offsetHeight + 'px');
    }

    document.addEventListener('DOMContentLoaded', function () {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/png';
        link.href = '/favicon.png';
        document.head.appendChild(link);

        const container = document.querySelector('.container');
        if (container) container.insertAdjacentHTML('afterbegin', nav);

        syncHeaderHeight();
        window.addEventListener('resize', syncHeaderHeight);
        window.addEventListener('load', syncHeaderHeight);

        // School pages (or any page with the "Hide" scroll variant): hide the
        // header on scroll down, bring it back on scroll up. Everywhere else
        // it just stays put (sticky to top). .is-scrolled drives the
        // "Shrink" scroll variant.
        const header = document.querySelector('.site-header');
        if (header) {
            let lastY = window.scrollY;
            let ticking = false;

            function updateHeader() {
                const y = window.scrollY;
                header.classList.toggle('is-scrolled', y > 30);
                const hides = onSchoolPage || header.classList.contains('scroll-hide');
                if (!hides) {
                    header.classList.remove('site-header--hidden');
                    document.body.classList.remove('header-hidden');
                } else if (Math.abs(y - lastY) > 5) {
                    const shouldHide = y > lastY && y > header.offsetHeight;
                    header.classList.toggle('site-header--hidden', shouldHide);
                    document.body.classList.toggle('header-hidden', shouldHide);
                }
                if (Math.abs(y - lastY) > 5) lastY = y;
                ticking = false;
            }

            window.addEventListener('scroll', function () {
                if (!ticking) {
                    window.requestAnimationFrame(updateHeader);
                    ticking = true;
                }
            }, { passive: true });

            // Shrink changes the header's height mid-scroll; keep the sticky
            // sidebars' offset in step once it settles.
            header.addEventListener('transitionend', syncHeaderHeight);
            updateHeader();
        }
    });
})();
