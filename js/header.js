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
                    <span class="nav-placeholder">Resources</span>
                    <a href="/info/">About Us</a>
                    <a href="/contact/">Contact Us</a>
                </div>
            </div>
            <div class="header-sub-bar"></div>
        </header>`;

    // HEADER VARIANTS (preview) — see the matching block in css/base.css.
    // Each option either toggles a class on .site-header (structure: layout,
    // highlight, logo size...) or sets CSS variables on it (colors, fonts,
    // sizes, shadow). On localhost only, a floating panel switches between
    // them (choice remembered across pages). Delete once a combo is picked.
    const B = 'var(--brand, #ed6d0b)';
    const mix = (pct, other) => `color-mix(in srgb, ${B} ${pct}%, ${other})`;
    const light = (bg, border, extra) => Object.assign({
        '--hdr-bg': bg, '--hdr-fg': '#333', '--hdr-wordmark': B,
        '--hdr-accent': B, '--hdr-on-accent': '#fff', '--hdr-line': B, '--hdr-line-text': B,
        '--hdr-divider': 'rgba(0, 0, 0, 0.14)', '--hdr-border': border, '--logo-filter': 'none',
    }, extra);
    const dark = (bg, extra) => Object.assign({
        '--hdr-bg': bg, '--hdr-fg': '#f2f2f2', '--hdr-wordmark': '#fff',
        '--hdr-accent': B, '--hdr-on-accent': '#fff', '--hdr-line': B, '--hdr-line-text': '#fff',
        '--hdr-divider': 'rgba(255, 255, 255, 0.25)',
    }, extra);
    const sub = bg => ({ '--sub-display': 'block', '--sub-bg': bg });
    const hlColor = (fill, text) => ({ '--hdr-accent': fill, '--hdr-on-accent': text, '--hdr-line': fill });
    const textColors = prop => [
        ['auto', 'Match bar', ''],
        ['white', 'White', { [prop]: '#fff' }],
        ['cream', 'Cream', { [prop]: '#FFF1E2' }],
        ['orange', 'Orange', { [prop]: B }],
        ['deep', 'Deep orange', { [prop]: mix(78, '#000') }],
        ['amber', 'Amber', { [prop]: mix(55, '#ffc04d') }],
        ['peach', 'Peach', { [prop]: mix(30, '#fff') }],
        ['espresso', 'Espresso', { [prop]: '#2a1c13' }],
        ['charcoal', 'Charcoal', { [prop]: '#2b2b2b' }],
        ['gray', 'Gray', { [prop]: '#6b6b6b' }],
    ];
    const font = (prop, family, extra) => Object.assign({ [prop]: family }, extra);

    // [value, label, class name or {css var: value}]
    const VARIANT_GROUPS = [
        { tab: 'Colors', key: 'style', label: 'Bar color', options: [
            ['orange', 'Orange', ''],
            ['deep', 'Deep orange', { '--hdr-bg': mix(80, '#000'), '--hdr-on-accent': mix(80, '#000') }],
            ['sunset', 'Sunset', { '--hdr-bg': `linear-gradient(90deg, ${B}, ${mix(55, '#ffb347')})` }],
            ['ember', 'Ember', { '--hdr-bg': `linear-gradient(90deg, ${mix(75, '#000')}, ${B})` }],
            ['peach', 'Peach', light(mix(12, '#fff'), mix(25, '#fff'))],
            ['cream', 'Cream', light('#FFFCFA', '#f0e4d8')],
            ['white', 'White', light('#fff', '#eee')],
            ['glass', 'Frosted glass', light('rgba(255, 255, 255, 0.72)', 'rgba(0, 0, 0, 0.06)',
                { '--hdr-backdrop': 'blur(14px) saturate(1.5)' })],
            ['dark', 'Dark', dark('#1d1d1f')],
            ['espresso', 'Espresso', dark('#2a1c13', { '--hdr-fg': '#f6ebe2' })]] },

        // Text colors — after Bar color so they override that theme's text.
        { tab: 'Colors', key: 'tcolor', label: 'Title text', options: textColors('--hdr-wordmark') },
        { tab: 'Colors', key: 'lcolor', label: 'Link text', options: textColors('--hdr-link') },
        { tab: 'Colors', key: 'ccolor', label: 'About area text', options: textColors('--hdr-corner') },

        { tab: 'Bar & shadow', key: 'sub', label: 'Sub-bar', options: [
            ['none', 'None', ''],
            ['white', 'White', sub('#fff')],
            ['cream', 'Cream', sub('#FFFCFA')],
            ['peach', 'Peach', sub(mix(18, '#fff'))],
            ['orange', 'Orange', sub(B)],
            ['deep', 'Deep orange', sub(mix(78, '#000'))],
            ['amber', 'Amber', sub(mix(55, '#ffc04d'))],
            ['fade', 'Orange fade', sub(`linear-gradient(90deg, ${B}, ${mix(40, '#ffd27a')})`)],
            ['dark', 'Dark', sub('#1d1d1f')]] },
        { tab: 'Bar & shadow', key: 'subh', label: 'Thickness', options: [
            ['hair', 'Hairline', { '--sub-height': '2px' }],
            ['thin', 'Thin', ''],
            ['medium', 'Medium', { '--sub-height': '10px' }],
            ['thick', 'Thick', { '--sub-height': '18px' }],
            ['tall', 'Tall', { '--sub-height': '32px' }]] },
        { tab: 'Bar & shadow', key: 'subpos', label: 'Position', options: [
            ['below', 'Below', ''], ['above', 'Above', 'sub-top']] },
        { tab: 'Bar & shadow', key: 'shadow', label: 'Shadow', options: [
            ['none', 'None', { '--hdr-shadow': 'none' }],
            ['line', 'Hairline', { '--hdr-shadow': '0 1px 0 rgba(0, 0, 0, 0.12)' }],
            ['soft', 'Soft', { '--hdr-shadow': '0 1px 6px rgba(0, 0, 0, 0.10)' }],
            ['medium', 'Medium', ''],
            ['strong', 'Strong', { '--hdr-shadow': '0 4px 16px rgba(0, 0, 0, 0.35)' }],
            ['float', 'Floating', { '--hdr-shadow': '0 12px 28px -8px rgba(0, 0, 0, 0.4)' }],
            ['glow', 'Orange glow', { '--hdr-shadow': `0 4px 20px ${mix(60, 'transparent')}` }]] },

        { tab: 'Layout', key: 'layout', label: 'Layout', options: [
            ['grouped', 'Next to logo', 'nav-grouped'], ['centered', 'Centered', ''],
            ['right', 'Right', 'nav-right'], ['split', 'Logo middle', 'nav-split'],
            ['stacked', 'Stacked', 'nav-stacked']] },
        { tab: 'Layout', key: 'width', label: 'Width', options: [
            ['full', 'Edge to edge', ''], ['contained', 'Contained', 'width-contained']] },
        { tab: 'Highlight', key: 'hl', label: 'Shape', options: [
            ['block', 'Block', ''], ['pill', 'Pill', 'hl-pill'], ['outline', 'Outline', 'hl-outline'],
            ['underline', 'Underline (bar edge)', 'hl-underline'], ['close', 'Underline (close)', 'hl-underline-close'],
            ['dot', 'Dot', 'hl-dot']] },
        // Comes after Bar color in this list so it overrides that theme's
        // highlight colors. Also recolors the Contact Us button.
        { tab: 'Highlight', key: 'hlc', label: 'Color', options: [
            ['auto', 'Match bar', ''],
            ['cream', 'Cream', hlColor('#FFFCFA', B)],
            ['white', 'White', hlColor('#fff', B)],
            ['orange', 'Orange', hlColor(B, '#fff')],
            ['deep', 'Deep orange', hlColor(mix(78, '#000'), '#fff')],
            ['amber', 'Amber', hlColor(mix(55, '#ffc04d'), '#2a1c13')],
            ['peach', 'Peach', hlColor(mix(18, '#fff'), mix(80, '#000'))],
            ['dark', 'Dark', hlColor('#1d1d1f', '#fff')]] },
        { tab: 'Highlight', key: 'hlw', label: 'Line weight', options: [
            ['auto', 'Default', ''], ['thin', 'Thin', { '--hl-line-w': '2px' }],
            ['medium', 'Medium', { '--hl-line-w': '3px' }], ['thick', 'Thick', { '--hl-line-w': '5px' }]] },
        { tab: 'Layout', key: 'cta', label: 'Contact Us', options: [
            ['plain', 'Plain text', ''], ['pill', 'Button', 'cta-pill'], ['outline', 'Outline button', 'cta-outline']] },
        { tab: 'Layout', key: 'logo', label: 'Logo', options: [
            ['s', 'Small', 'logo-s'], ['m', 'Medium', ''], ['l', 'Large', 'logo-l'], ['hang', 'Hang', 'logo-hang']] },

        { tab: 'Type', key: 'brand', label: 'Wordmark font', options: [
            ['serif', 'Spectral', ''],
            ['sourceserif', 'Source Serif', font('--wordmark-font', "'Source Serif 4', Georgia, serif")],
            ['playfair', 'Playfair', font('--wordmark-font', "'Playfair Display', Georgia, serif")],
            ['dmserif', 'DM Serif', font('--wordmark-font', "'DM Serif Display', Georgia, serif", { '--wordmark-weight': '400' })],
            ['fraunces', 'Fraunces', font('--wordmark-font', "'Fraunces', Georgia, serif")],
            ['baskerville', 'Baskerville', font('--wordmark-font', "'Libre Baskerville', Georgia, serif")],
            ['lora', 'Lora', font('--wordmark-font', "'Lora', Georgia, serif")],
            ['cormorant', 'Cormorant', font('--wordmark-font', "'Cormorant Garamond', Georgia, serif")],
            ['sans', 'Public Sans', font('--wordmark-font', "'Public Sans', sans-serif")],
            ['montserrat', 'Montserrat', font('--wordmark-font', "'Montserrat', sans-serif")],
            ['poppins', 'Poppins', font('--wordmark-font', "'Poppins', sans-serif")],
            ['outfit', 'Outfit', font('--wordmark-font', "'Outfit', sans-serif")],
            ['none', 'Hidden', 'brand-none']] },
        { tab: 'Type', key: 'bsize', label: 'Wordmark size', options: [
            ['s', 'Small', { '--wordmark-size': '1.5em' }], ['m', 'Medium', ''], ['l', 'Large', { '--wordmark-size': '2.2em' }]] },
        { tab: 'Type', key: 'lfont', label: 'Link font', options: [
            ['public', 'Public Sans', ''],
            ['inter', 'Inter', font('--link-font', "'Inter', sans-serif")],
            ['dmsans', 'DM Sans', font('--link-font', "'DM Sans', sans-serif")],
            ['montserrat', 'Montserrat', font('--link-font', "'Montserrat', sans-serif")],
            ['poppins', 'Poppins', font('--link-font', "'Poppins', sans-serif")],
            ['outfit', 'Outfit', font('--link-font', "'Outfit', sans-serif")],
            ['sourceserif', 'Source Serif', font('--link-font', "'Source Serif 4', Georgia, serif")],
            ['spectral', 'Spectral', font('--link-font', "'Spectral', Georgia, serif")]] },
        { tab: 'Type', key: 'lsize', label: 'Link size', options: [
            ['s', 'Small', { '--link-size': '1em' }], ['m', 'Medium', ''], ['l', 'Large', { '--link-size': '1.3em' }]] },
        { tab: 'Type', key: 'lweight', label: 'Link weight', options: [
            ['regular', 'Regular', { '--link-weight': '400' }], ['medium', 'Medium', { '--link-weight': '500' }],
            ['semi', 'Semibold', ''], ['bold', 'Bold', { '--link-weight': '700' }]] },
        { tab: 'Type', key: 'text', label: 'Capitals', options: [
            ['caps', 'ALL CAPS', ''], ['brand', 'Only wordmark', 'text-brand-caps'], ['normal', 'Normal', 'text-normal']] },

        { tab: 'Motion', key: 'hover', label: 'Link hover', options: [
            ['none', 'Just highlight', ''], ['grow', 'Grow', 'hover-grow'],
            ['lift', 'Lift', 'hover-lift'], ['glow', 'Glow', 'hover-glow']] },
        { tab: 'Motion', key: 'lhover', label: 'Logo hover', options: [
            ['grow', 'Grow', ''], ['spin', 'Spin', 'logo-spin'], ['tilt', 'Tilt', 'logo-tilt'], ['still', 'None', 'logo-still']] },
        // Default keeps today's behavior: hide-on-scroll on school pages only.
        { tab: 'Motion', key: 'scroll', label: 'On scroll', options: [
            ['default', 'Default', ''], ['shrink', 'Shrink', 'scroll-shrink'], ['hide', 'Hide (all pages)', 'scroll-hide']] },
    ];
    const VARIANT_TABS = ['Colors', 'Bar & shadow', 'Layout', 'Highlight', 'Type', 'Motion'];
    const VARIANT_DEFAULTS = {
        style: 'orange', tcolor: 'auto', lcolor: 'auto', ccolor: 'auto', sub: 'none', subh: 'thin', subpos: 'below', shadow: 'medium',
        layout: 'grouped', width: 'full', cta: 'plain', logo: 'm',
        hl: 'pill', hlc: 'auto', hlw: 'auto',
        brand: 'serif', bsize: 'm', lfont: 'public', lsize: 'm', lweight: 'semi', text: 'normal',
        hover: 'none', lhover: 'grow', scroll: 'default',
    };

    // Fonts beyond the three every page already loads — preview only.
    const PREVIEW_FONTS = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700' +
        '&family=DM+Serif+Display&family=Fraunces:wght@600;700&family=Libre+Baskerville:wght@700' +
        '&family=Lora:wght@600;700&family=Cormorant+Garamond:wght@600;700' +
        '&family=Montserrat:wght@400;500;600;700&family=Poppins:wght@400;500;600;700' +
        '&family=Inter:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700' +
        '&family=Outfit:wght@400;500;600;700&display=swap';

    // Defaults, then the remembered choice, then any ?style=/?layout=/...
    // in the URL (handy for linking straight to one combination).
    function readVariant() {
        const v = Object.assign({}, VARIANT_DEFAULTS);
        try {
            Object.assign(v, JSON.parse(localStorage.getItem('headerVariant')) || {});
        } catch (e) {}
        const params = new URLSearchParams(window.location.search);
        VARIANT_GROUPS.forEach(g => {
            const val = params.get(g.key);
            if (val !== null) v[g.key] = val;
            if (!g.options.some(([o]) => o === v[g.key])) v[g.key] = VARIANT_DEFAULTS[g.key];
        });
        return v;
    }

    // Sticky sidebars offset themselves by --header-height, so keep it in
    // step with whatever height the chosen layout/logo actually renders at.
    function syncHeaderHeight() {
        const header = document.querySelector('.site-header');
        if (header) document.documentElement.style.setProperty('--header-height', header.offsetHeight + 'px');
    }

    function setHeaderClasses(v) {
        const header = document.querySelector('.site-header');
        if (!header) return;
        VARIANT_GROUPS.forEach(g => g.options.forEach(([val, , effect]) => {
            const on = v[g.key] === val;
            if (typeof effect === 'string') {
                if (effect) header.classList.toggle(effect, on);
            } else {
                Object.keys(effect).forEach(prop => {
                    if (on) header.style.setProperty(prop, effect[prop]);
                });
            }
        }));
        // Clear any variable the current choices don't set (left over from
        // a previous choice), so it falls back to the stylesheet default.
        const keep = new Set();
        VARIANT_GROUPS.forEach(g => g.options.forEach(([val, , effect]) => {
            if (v[g.key] === val && typeof effect !== 'string') Object.keys(effect).forEach(p => keep.add(p));
        }));
        Array.from(header.style).forEach(prop => {
            if (prop.startsWith('--') && !keep.has(prop)) header.style.removeProperty(prop);
        });
        syncHeaderHeight();
    }

    function describeVariant(v) {
        return VARIANT_GROUPS.map(g => {
            const opt = g.options.find(([o]) => o === v[g.key]);
            return `${g.label}: ${opt ? opt[1] : v[g.key]}`;
        }).join('\n');
    }

    function applyHeaderVariant() {
        const v = readVariant();
        setHeaderClasses(v);
        window.addEventListener('resize', syncHeaderHeight);
        window.addEventListener('load', syncHeaderHeight);

        if (!/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)) return;

        const fonts = document.createElement('link');
        fonts.rel = 'stylesheet';
        fonts.href = PREVIEW_FONTS;
        fonts.addEventListener('load', syncHeaderHeight);
        document.head.appendChild(fonts);

        // ?panel=off — preview fonts still load, but no panel (clean screenshots).
        if (new URLSearchParams(window.location.search).get('panel') === 'off') return;

        let tab = VARIANT_TABS[0];
        let collapsed = false;
        try {
            if (VARIANT_TABS.includes(localStorage.getItem('headerPanelTab'))) tab = localStorage.getItem('headerPanelTab');
            collapsed = localStorage.getItem('headerPanelCollapsed') === '1';
        } catch (e) {}

        const btn = 'font:inherit;cursor:pointer;border:1px solid #ccc;border-radius:6px;padding:3px 8px;background:#fff;color:#222';
        const panel = document.createElement('div');
        panel.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:9999;background:#fff;' +
            'border:1px solid #ddd;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,.2);' +
            'padding:10px 12px;font:13px/1.3 sans-serif;color:#222;width:min(480px,calc(100vw - 32px));' +
            'max-height:calc(100vh - 32px);overflow:auto;';
        panel.innerHTML =
            `<div style="display:flex;align-items:center;gap:6px">
                <strong style="flex:1">Header preview</strong>
                <button type="button" data-action="copy" style="${btn}">Copy</button>
                <button type="button" data-action="reset" style="${btn}">Reset</button>
                <button type="button" data-action="toggle" style="${btn};width:28px"></button>
            </div>
            <div data-body>
                <div style="display:flex;flex-wrap:wrap;gap:2px;margin:8px 0 4px;border-bottom:1px solid #eee">
                    ${VARIANT_TABS.map(t =>
                        `<button type="button" data-tab="${t}" style="font:inherit;cursor:pointer;border:0;` +
                        `background:none;padding:5px 8px;border-bottom:2px solid transparent;margin-bottom:-1px">${t}</button>`
                    ).join('')}
                </div>` +
                VARIANT_GROUPS.map(g =>
                    `<div data-group-tab="${g.tab}" style="display:flex;align-items:flex-start;gap:6px;margin:6px 0">
                        <span style="flex:0 0 92px;color:#666;padding-top:4px">${g.label}</span>
                        <div style="display:flex;flex-wrap:wrap;gap:5px">
                        ${g.options.map(([val, text]) =>
                            `<button type="button" data-k="${g.key}" data-v="${val}" style="${btn}">${text}</button>`
                        ).join('')}
                        </div>
                    </div>`
                ).join('') +
            '</div>';

        const body = panel.querySelector('[data-body]');
        const toggle = panel.querySelector('[data-action="toggle"]');
        const copy = panel.querySelector('[data-action="copy"]');

        function paint() {
            panel.querySelectorAll('button[data-k]').forEach(b => {
                const on = v[b.dataset.k] === b.dataset.v;
                b.style.background = on ? '#ed6d0b' : '#fff';
                b.style.color = on ? '#fff' : '#222';
                b.style.borderColor = on ? '#ed6d0b' : '#ccc';
            });
            panel.querySelectorAll('button[data-tab]').forEach(b => {
                const on = b.dataset.tab === tab;
                b.style.borderBottomColor = on ? '#ed6d0b' : 'transparent';
                b.style.color = on ? '#ed6d0b' : '#555';
                b.style.fontWeight = on ? '700' : '400';
            });
            panel.querySelectorAll('[data-group-tab]').forEach(row => {
                row.style.display = row.dataset.groupTab === tab ? 'flex' : 'none';
            });
            body.style.display = collapsed ? 'none' : '';
            toggle.textContent = collapsed ? '+' : '–';
            toggle.title = collapsed ? 'Expand' : 'Collapse';
        }

        function save() {
            try { localStorage.setItem('headerVariant', JSON.stringify(v)); } catch (err) {}
            setHeaderClasses(v);
            paint();
        }

        panel.addEventListener('click', function (e) {
            const b = e.target.closest('button');
            if (!b) return;
            if (b.dataset.action === 'toggle') {
                collapsed = !collapsed;
                try { localStorage.setItem('headerPanelCollapsed', collapsed ? '1' : '0'); } catch (err) {}
                paint();
            } else if (b.dataset.action === 'reset') {
                Object.assign(v, VARIANT_DEFAULTS);
                save();
            } else if (b.dataset.action === 'copy') {
                const text = describeVariant(v);
                const done = () => { copy.textContent = 'Copied!'; setTimeout(() => { copy.textContent = 'Copy'; }, 1500); };
                if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => window.prompt('Copy these settings:', text));
                else window.prompt('Copy these settings:', text);
            } else if (b.dataset.tab) {
                tab = b.dataset.tab;
                try { localStorage.setItem('headerPanelTab', tab); } catch (err) {}
                paint();
            } else {
                v[b.dataset.k] = b.dataset.v;
                save();
            }
        });

        paint();
        document.body.appendChild(panel);
    }

    document.addEventListener('DOMContentLoaded', function () {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/png';
        link.href = '/favicon.png';
        document.head.appendChild(link);

        const container = document.querySelector('.container');
        if (container) container.insertAdjacentHTML('afterbegin', nav);

        applyHeaderVariant();

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
                    // Mirrored on <body> so the sticky right-sidebar (see
                    // css/base.css) can rise into the space the header
                    // just vacated instead of leaving it empty above it.
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
