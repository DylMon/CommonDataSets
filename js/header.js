(function () {
    // Root-relative absolute paths throughout (the site has a fixed custom
    // domain — see CNAME) rather than computing a `../` prefix per nesting
    // level, since every page now lives one or two directories deep
    // (/compare/, /schools/{slug}/) under the clean-URL convention.
    const path = window.location.pathname;

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
                <div class="nav-drawer" id="nav-drawer">
                    <div class="left-side">
                        ${navLink('/', 'Data Sets', 'index')}
                        ${navLink('/compare/', 'Compare', 'compare')}
                        ${navLink('/chanceme/', 'Chance Me', 'chanceme')}
                    </div>
                    <div class="nav-right-group">
                        <div class="header-search" id="header-search">
                            <button type="button" class="header-search-toggle" id="header-search-toggle" aria-label="Search schools" aria-expanded="false">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                            </button>
                            <div class="search-wrap">
                                <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                <input type="text" id="school-search" class="search-input" placeholder="Search schools…" autocomplete="off">
                                <button type="button" class="search-clear" id="search-clear" aria-label="Clear search" hidden>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                                <div class="search-dropdown" id="search-dropdown" hidden></div>
                            </div>
                        </div>
                        <div class="nav-corner-links">
                            <a href="/resources/">Resources</a>
                            <a href="/info/">About Us</a>
                            <a href="/contact/">Contact Us</a>
                        </div>
                    </div>
                </div>
                <button type="button" class="nav-hamburger" id="nav-hamburger" aria-label="Menu" aria-expanded="false" aria-controls="nav-drawer">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                </button>
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

        // The search bar collapses to a round icon everywhere (see
        // css/base.css's .header-search) since there's rarely room for it
        // inline next to the nav links/shortcuts. The toggle expands it in
        // place instead of fighting the row for space.
        const searchToggle = document.getElementById('header-search-toggle');
        const headerSearch = document.getElementById('header-search');
        if (searchToggle && headerSearch) {
            function setSearchExpanded(open) {
                headerSearch.classList.toggle('expanded', open);
                searchToggle.setAttribute('aria-expanded', String(open));
                if (open) document.getElementById('school-search')?.focus();
            }
            searchToggle.addEventListener('click', () => setSearchExpanded(!headerSearch.classList.contains('expanded')));
            document.addEventListener('click', e => {
                if (!e.target.closest('#header-search')) setSearchExpanded(false);
            });
            document.addEventListener('keydown', e => { if (e.key === 'Escape') setSearchExpanded(false); });
        }

        // Below ~1250px (see css/base.css) everything but the brand and
        // this button collapses into .nav-drawer, a panel that drops down
        // from under the header instead of progressively stacking/hiding
        // pieces of the row.
        const navHamburger = document.getElementById('nav-hamburger');
        const navDrawer = document.getElementById('nav-drawer');
        if (navHamburger && navDrawer) {
            function setDrawerOpen(open) {
                navDrawer.classList.toggle('open', open);
                navHamburger.setAttribute('aria-expanded', String(open));
            }
            navHamburger.addEventListener('click', () => setDrawerOpen(!navDrawer.classList.contains('open')));
            document.addEventListener('click', e => {
                if (!e.target.closest('#nav-drawer') && !e.target.closest('#nav-hamburger')) setDrawerOpen(false);
            });
            document.addEventListener('keydown', e => { if (e.key === 'Escape') setDrawerOpen(false); });
        }

        syncHeaderHeight();
        window.addEventListener('resize', syncHeaderHeight);
        window.addEventListener('load', syncHeaderHeight);

        // Pages with the "Hide" scroll variant (the .scroll-hide class):
        // hide the header on scroll down, bring it back on scroll up.
        // Everywhere else — including school pages — it just stays put
        // (sticky to top). .is-scrolled drives the "Shrink" scroll variant,
        // which applies everywhere.
        const header = document.querySelector('.site-header');
        if (header) {
            let lastY = window.scrollY;
            let ticking = false;

            function updateHeader() {
                const y = window.scrollY;
                // Hysteresis band (not a single y > 30 cutoff) so the
                // shrink/grow toggle can't flap back and forth when the
                // scroll position settles right at the boundary.
                if (y > 40) header.classList.add('is-scrolled');
                else if (y < 15) header.classList.remove('is-scrolled');
                const hides = header.classList.contains('scroll-hide');
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
