import { LOCALES, PAGES, ROUTES, SITE } from './content.mjs';
import { SERVICE_MINIMUMS, UNAVAILABLE_SYSTEM_IDS } from '../public/pricing.js';

const ASSET_VERSION = SITE.assetVersion;

const ICONS = Object.freeze({
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/>',
    building2: '<path d="M3 21h18M6 21V5l6-3v19M18 21V9l-6-3M9 9h.01M9 13h.01M9 17h.01M15 13h.01M15 17h.01"/>',
    landmark: '<path d="m3 10 9-6 9 6M5 10h14M6 10v8M10 10v8M14 10v8M18 10v8M4 18h16M3 22h18"/>',
    shopping: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>',
    hotel: '<path d="M2 20v-9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v9M2 14h20M6 9V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4"/>',
    warehouse: '<path d="M3 21V8l9-5 9 5v13M7 21v-8h10v8M7 17h10M7 13h10"/>',
    hospital: '<path d="M3 21V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16M9 21v-4h6v4M9 8h6M12 5v6"/>',
    snowflake: '<path d="m12 2 0 20M4.22 6.5l15.56 9M4.22 17.5l15.56-9M8 4l4 2 4-2M8 20l4-2 4 2M3.5 10l.5 4-3 2M23 8l-3 2 .5 4"/>',
    wind: '<path d="M3 8h10a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7"/>',
    thermometer: '<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0Z"/><path d="M11.5 6v10"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/>',
    droplets: '<path d="M12 2 6 9a6 6 0 1 0 12 0l-6-7Z"/><path d="M8.5 14.5a3.5 3.5 0 0 0 7 0"/>',
    waves: '<path d="M2 6c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2M2 12c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2M2 18c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2"/>',
    cpu: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/>',
    clipboard: '<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4V2h6v2M9 11h6M9 15h6M9 19h4"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>'
});

const TYPE_ICONS = Object.freeze({
    office: 'building',
    bc: 'building2',
    bank: 'landmark',
    mall: 'shopping',
    hotel: 'hotel',
    warehouse: 'warehouse',
    clinic: 'hospital'
});

const SYSTEM_ICONS = Object.freeze({
    conditioning: 'snowflake',
    heating: 'thermometer',
    ventilation: 'wind',
    electricity: 'zap',
    water: 'droplets',
    low_current: 'cpu',
    sewerage: 'waves'
});

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function icon(name, className = '') {
    const body = ICONS[name] || ICONS.clipboard;
    const classAttribute = className ? ` class="${escapeHtml(className)}"` : '';
    return `<svg${classAttribute} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

function route(pageType, localeKey) {
    return ROUTES[pageType][localeKey];
}

function absolute(pathname) {
    return `${SITE.domain}${pathname}`;
}

function pageImage(pageType) {
    if (pageType === 'audit') return '/assets/img/engineering/plant-room.webp';
    if (pageType === 'service') return '/assets/img/engineering/hvac-rooftop.webp';
    if (pageType === 'about') return '/assets/img/engineering/building-exterior.webp';
    return '/preview.jpg';
}

function schemaFor(localeKey, pageType, page) {
    const locale = LOCALES[localeKey];
    const canonical = absolute(route(pageType, localeKey));
    const organizationId = `${SITE.domain}/#organization`;
    const websiteId = `${SITE.domain}/#website`;
    const webpageId = `${canonical}#webpage`;
    const graph = [
        {
            '@type': 'Organization',
            '@id': organizationId,
            name: SITE.name,
            alternateName: SITE.displayName,
            url: `${SITE.domain}/`,
            logo: {
                '@type': 'ImageObject',
                url: `${SITE.domain}/apple-touch-icon.png`,
                width: 180,
                height: 180
            },
            image: `${SITE.domain}/preview.jpg`,
            telephone: SITE.phoneHref,
            foundingDate: String(SITE.founded),
            areaServed: {
                '@type': 'City',
                name: SITE.city,
                containedInPlace: {
                    '@type': 'Country',
                    name: SITE.country
                }
            }
        },
        {
            '@type': 'WebSite',
            '@id': websiteId,
            url: `${SITE.domain}/`,
            name: SITE.name,
            publisher: { '@id': organizationId },
            inLanguage: ['ru-UZ', 'uz-UZ', 'en']
        },
        {
            '@type': pageType === 'about' ? 'AboutPage' : pageType === 'contact' ? 'ContactPage' : 'WebPage',
            '@id': webpageId,
            url: canonical,
            name: page.title,
            description: page.description,
            inLanguage: locale.hreflang,
            isPartOf: { '@id': websiteId },
            about: { '@id': organizationId },
            primaryImageOfPage: {
                '@type': 'ImageObject',
                url: absolute(pageImage(pageType))
            }
        }
    ];

    if (pageType !== 'home') {
        graph.push({
            '@type': 'BreadcrumbList',
            '@id': `${canonical}#breadcrumb`,
            itemListElement: [
                {
                    '@type': 'ListItem',
                    position: 1,
                    name: locale.nav.home,
                    item: absolute(route('home', localeKey))
                },
                {
                    '@type': 'ListItem',
                    position: 2,
                    name: locale.nav[pageType],
                    item: canonical
                }
            ]
        });
    }

    if (pageType === 'audit' || pageType === 'service') {
        graph.push({
            '@type': 'Service',
            '@id': `${canonical}#service`,
            name: page.heroTitle,
            description: page.description,
            serviceType: pageType === 'audit' ? 'Technical audit of building engineering systems' : 'Integrated engineering operations and maintenance',
            provider: { '@id': organizationId },
            areaServed: {
                '@type': 'City',
                name: SITE.city
            },
            url: canonical
        });
    }

    return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
}

function head(localeKey, pageType, page, schemaText) {
    const locale = LOCALES[localeKey];
    const canonicalPath = route(pageType, localeKey);
    const canonical = absolute(canonicalPath);
    const alternateLinks = Object.keys(LOCALES)
        .map((key) => `<link rel="alternate" hreflang="${LOCALES[key].hreflang}" href="${absolute(route(pageType, key))}">`)
        .join('\n    ');
    const alternateLocales = Object.keys(LOCALES)
        .filter((key) => key !== localeKey)
        .map((key) => `<meta property="og:locale:alternate" content="${LOCALES[key].ogLocale}">`)
        .join('\n    ');

    return `<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="dark">
    <meta name="theme-color" content="#010409">
    <meta name="robots" content="index, follow, max-image-preview:large">
    <title>${escapeHtml(page.title)}</title>
    <meta name="description" content="${escapeHtml(page.description)}">
    <link rel="canonical" href="${canonical}">
    ${alternateLinks}
    <link rel="alternate" hreflang="x-default" href="${absolute(route(pageType, 'ru'))}">
    <meta property="og:title" content="${escapeHtml(page.title)}">
    <meta property="og:description" content="${escapeHtml(page.description)}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="${SITE.domain}/preview.jpg">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:width" content="1731">
    <meta property="og:image:height" content="909">
    <meta property="og:image:alt" content="AsiaTechnoStroy Engineering Group">
    <meta property="og:locale" content="${locale.ogLocale}">
    ${alternateLocales}
    <meta property="og:site_name" content="${SITE.name}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(page.title)}">
    <meta name="twitter:description" content="${escapeHtml(page.description)}">
    <meta name="twitter:image" content="${SITE.domain}/preview.jpg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&amp;family=Syncopate:wght@400;700&amp;display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/style.css?v=${ASSET_VERSION}">
    <script type="module" src="/script.js?v=${ASSET_VERSION}"></script>
    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="icon" type="image/png" href="/favicon-32.png" sizes="32x32">
    <link rel="icon" type="image/png" href="/favicon-16.png" sizes="16x16">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <script type="application/ld+json">${schemaText}</script>
</head>`;
}

function languageSwitch(localeKey, pageType) {
    const locale = LOCALES[localeKey];
    const items = Object.keys(LOCALES).map((key) => {
        const active = key === localeKey;
        return `<a class="language-switch__link${active ? ' is-active' : ''}" href="${route(pageType, key)}" lang="${LOCALES[key].htmlLang}" hreflang="${LOCALES[key].hreflang}"${active ? ' aria-current="page"' : ''}>${LOCALES[key].short}</a>`;
    }).join('');
    return `<div class="language-switch" role="group" aria-label="${escapeHtml(locale.languageLabel)}">${items}</div>`;
}

function header(localeKey, pageType) {
    const locale = LOCALES[localeKey];
    const navItems = ['about', 'service', 'audit', 'calculator', 'contact'].map((key) => {
        const href = key === 'calculator' ? `${route('home', localeKey)}#calculators` : route(key, localeKey);
        const active = key === pageType;
        return `<li><a href="${href}" class="nav__link${active ? ' is-active' : ''}"${active ? ' aria-current="page"' : ''}>${escapeHtml(locale.nav[key])}</a></li>`;
    }).join('');

    return `<header class="header">
    <div class="header__nav-full">
        <a href="${route('home', localeKey)}" class="logo-block" aria-label="${SITE.name}">
            <div class="logo-main">AsiaTechnoStroy</div>
            <div class="logo-badge" aria-hidden="true">
                <span class="badge-text-primary">engineering</span>
                <div class="logo-separator"></div>
                <span class="badge-text-secondary">group</span>
            </div>
        </a>
        <button type="button" class="nav-toggle" aria-expanded="false" aria-controls="site-navigation" data-open-label="${escapeHtml(locale.openMenu)}" data-close-label="${escapeHtml(locale.closeMenu)}" aria-label="${escapeHtml(locale.openMenu)}">
            <span></span><span></span><span></span>
        </button>
        <div class="header__menu" id="site-navigation">
            <nav class="nav" aria-label="${escapeHtml(locale.navigationLabel)}">
                <ul class="nav__list">${navItems}</ul>
            </nav>
            ${languageSwitch(localeKey, pageType)}
        </div>
    </div>
</header>`;
}

function footer(localeKey) {
    const locale = LOCALES[localeKey];
    return `<footer class="footer">
    <div class="container footer-grid">
        <div class="footer-brand">
            <a href="${route('home', localeKey)}" class="footer-logo">AsiaTechnoStroy</a>
            <p>${escapeHtml(locale.common.established)} · ${escapeHtml(locale.common.tashkent)}</p>
        </div>
        <nav class="footer-nav" aria-label="${escapeHtml(locale.navigationLabel)}">
            <a href="${route('about', localeKey)}">${escapeHtml(locale.nav.about)}</a>
            <a href="${route('service', localeKey)}">${escapeHtml(locale.nav.service)}</a>
            <a href="${route('audit', localeKey)}">${escapeHtml(locale.nav.audit)}</a>
            <a href="${route('contact', localeKey)}">${escapeHtml(locale.nav.contact)}</a>
            <a href="${route('privacy', localeKey)}">${escapeHtml(locale.nav.privacy)}</a>
        </nav>
        <div class="footer-contact">
            <a href="tel:${SITE.phoneHref}">${SITE.phoneDisplay}</a>
            <a href="${SITE.whatsapp}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
        </div>
    </div>
    <div class="container footer-bottom">
        <p>© ${SITE.founded}–<span id="copyright-year">2026</span> ${SITE.displayName}</p>
    </div>
</footer>`;
}

function pageHeader(localeKey, pageType, page) {
    const locale = LOCALES[localeKey];
    const heroClass = pageType === 'privacy' ? 'contact' : pageType;
    let actions;
    if (pageType === 'audit') {
        actions = `<a class="btn-premium" href="#audit-calculator">${escapeHtml(locale.common.auditCta)} ${icon('arrow', 'button-icon')}</a>
            <a class="hero-secondary" href="tel:${SITE.phoneHref}">${escapeHtml(locale.common.call)}: ${SITE.phoneDisplay}</a>`;
    } else if (pageType === 'contact') {
        actions = `<a class="btn-premium" href="tel:${SITE.phoneHref}">${escapeHtml(locale.common.call)}: ${SITE.phoneDisplay}</a>
            <a class="hero-secondary" href="${SITE.whatsapp}" target="_blank" rel="noopener noreferrer">${escapeHtml(locale.common.whatsapp)}</a>`;
    } else if (pageType === 'privacy') {
        actions = `<a class="btn-premium" href="${route('home', localeKey)}">${escapeHtml(locale.common.backHome)} ${icon('arrow', 'button-icon')}</a>
            <a class="hero-secondary" href="tel:${SITE.phoneHref}">${escapeHtml(locale.common.call)}: ${SITE.phoneDisplay}</a>`;
    } else {
        const label = pageType === 'service' ? locale.common.startAudit : locale.common.auditCta;
        actions = `<a class="btn-premium" href="${route('audit', localeKey)}#audit-calculator">${escapeHtml(label)} ${icon('arrow', 'button-icon')}</a>
            <a class="hero-secondary" href="tel:${SITE.phoneHref}">${escapeHtml(locale.common.call)}: ${SITE.phoneDisplay}</a>`;
    }

    return `<section class="page-hero page-hero--${heroClass}">
    <div class="page-hero__shade"></div>
    <div class="container page-hero__content">
        <nav class="breadcrumbs" aria-label="${escapeHtml(locale.breadcrumbLabel)}">
            <a href="${route('home', localeKey)}">${escapeHtml(locale.nav.home)}</a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">${escapeHtml(locale.nav[pageType])}</span>
        </nav>
        <p class="eyebrow">${escapeHtml(page.eyebrow)}</p>
        <h1>${escapeHtml(page.heroTitle)}</h1>
        <p class="page-hero__lead">${escapeHtml(page.heroText)}</p>
        <div class="page-hero__actions">
            ${actions}
        </div>
    </div>
</section>`;
}

function numberedGrid(items, className = '') {
    return `<div class="numbered-grid ${className}">${items.map(([number, title, text]) => `<article class="numbered-item reveal">
        <span class="numbered-item__number">${escapeHtml(number)}</span>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(text)}</p>
    </article>`).join('')}</div>`;
}

function factGrid(items) {
    return `<ul class="fact-grid">${items.map(([value, label]) => `<li><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></li>`).join('')}</ul>`;
}

function checklist(items, className = '', unavailable = {}) {
    return `<ul class="technical-list ${className}">${items.map((item, index) => `<li${unavailable[index] ? ' class="scope-unavailable"' : ''}><span aria-hidden="true">${icon(unavailable[index] ? 'cpu' : 'shield')}</span><span>${escapeHtml(item)}${unavailable[index] ? `<small class="availability-badge">${escapeHtml(unavailable[index])}</small>` : ''}</span></li>`).join('')}</ul>`;
}

function contactPanel(localeKey, title, text) {
    const locale = LOCALES[localeKey];
    return `<section id="contact" class="section contact-section" aria-labelledby="contact-title">
    <div class="container">
        <div class="contact-card bento-base reveal">
            <div>
                <p class="contact-kicker">${escapeHtml(locale.common.tashkent)}</p>
                <h2 id="contact-title">${escapeHtml(title)}</h2>
                <p>${escapeHtml(text)}</p>
            </div>
            <div class="contact-actions">
                <a class="btn-premium" href="tel:${SITE.phoneHref}">${SITE.phoneDisplay}</a>
                <a class="contact-link" href="${SITE.whatsapp}" target="_blank" rel="noopener noreferrer">${escapeHtml(locale.common.whatsapp)}</a>
            </div>
        </div>
    </div>
</section>`;
}

function calculator(localeKey, { auditOnly = false } = {}) {
    const locale = LOCALES[localeKey];
    const text = locale.calculator;
    const typeButtons = locale.objectTypes.map(([id, label], index) => `<button type="button" class="type-card${index === 0 ? ' active' : ''}" data-type="${id}" aria-pressed="${index === 0 ? 'true' : 'false'}">
        ${icon(TYPE_ICONS[id])}
        <span>${escapeHtml(label)}</span>
    </button>`).join('');
    const systemButtons = locale.systems.map(([id, label], index) => {
        const unavailable = UNAVAILABLE_SYSTEM_IDS.includes(id);
        const minimum = unavailable ? text.unavailable : text.standaloneFrom.replace('{amount}', new Intl.NumberFormat(locale.intlLocale).format(SERVICE_MINIMUMS[id]));
        return `<label class="system-item${unavailable ? ' is-unavailable' : ''}">
        <input type="checkbox"${unavailable ? ' disabled data-unavailable="true"' : index === 0 ? ' checked' : ''} data-system="${id}" aria-describedby="system-note-${id}">
        <span class="system-box">${icon(SYSTEM_ICONS[id])}<span>${escapeHtml(label)}</span><small class="system-minimum${unavailable ? ' availability-badge' : ''}" id="system-note-${id}">${escapeHtml(minimum)}</small></span>
    </label>`;
    }).join('');
    const auditSystems = locale.systems.map(([id, label]) => `<li class="audit-system${UNAVAILABLE_SYSTEM_IDS.includes(id) ? ' is-unavailable' : ''}">${icon(SYSTEM_ICONS[id])}<span>${escapeHtml(label)}</span>${UNAVAILABLE_SYSTEM_IDS.includes(id) ? `<button type="button" class="availability-badge" disabled>${escapeHtml(text.unavailable)}</button>` : `<small>${escapeHtml(text.included)}</small>`}</li>`).join('');

    return `<div class="calc-container bento-base reveal" data-default-mode="${auditOnly ? 'audit' : 'service'}" data-locale="${localeKey}">
${auditOnly ? '' : `        <div class="calc-tabs" role="group" aria-label="${escapeHtml(text.tabsLabel)}">
            <button type="button" class="tab-btn active" data-tab="service" aria-pressed="true">${escapeHtml(text.serviceTab)}</button>
            <button type="button" class="tab-btn" data-tab="audit" aria-pressed="false">${escapeHtml(text.auditTab)}</button>
        </div>`}
        <div class="calc-content-full">
            <p class="calc-intro">${escapeHtml(text.subtitle)}</p>
            <div class="setting-group">
                <div class="setting-label" id="object-type-label">${escapeHtml(text.objectType)}</div>
                <div class="type-grid-full" role="group" aria-labelledby="object-type-label">${typeButtons}</div>
            </div>
            <div class="label-row">
                <label class="setting-label" for="area-input">${escapeHtml(text.area)}</label>
                <div class="area-input-wrapper">
                    <input type="number" id="area-input" min="500" max="150000" step="10" value="500" inputmode="numeric" placeholder="500" aria-describedby="calcStatus">
                    <span>m²</span>
                </div>
            </div>
            <input type="range" id="area-range" min="500" max="150000" step="10" value="500" class="slider-premium-full" aria-label="${escapeHtml(text.area)}">
            <div class="area-scale" aria-hidden="true"><span>500</span><span>50 000</span><span>100 000</span><span>150 000</span></div>
${auditOnly ? '' : `            <div class="setting-group systems-setting" data-service-controls>
                <div class="setting-label" id="systems-label">${escapeHtml(text.systems)}</div>
                <div class="systems-grid-full" role="group" aria-labelledby="systems-label">${systemButtons}</div>
            </div>`}
            <div class="audit-coverage${auditOnly ? ' is-visible' : ''}" data-audit-coverage${auditOnly ? '' : ' hidden'}>
                <span class="audit-coverage__icon">${icon('clipboard')}</span>
                <div><h3>${escapeHtml(text.auditCoverageTitle)}</h3><p>${escapeHtml(text.auditCoverageText)}</p><ul class="audit-systems">${auditSystems}</ul><p class="audit-exclusion">${escapeHtml(text.auditExclusion)}</p></div>
            </div>
            <div class="review-settings">
${auditOnly ? '' : `                <label class="review-choice" data-review-service><input type="checkbox" id="service-review"><span>${escapeHtml(text.reviewService)}<small>${escapeHtml(text.reviewHint)}</small></span></label>\n`}\
                <label class="review-choice" data-review-audit${auditOnly ? '' : ' hidden'}><input type="checkbox" id="audit-review"><span>${escapeHtml(text.reviewAudit)}<small>${escapeHtml(text.reviewHint)}</small></span></label>
            </div>
            <div class="calc-result-full" data-result>
                <div class="result-info-center">
                    <span class="result-label">${escapeHtml(text.budget)}</span>
                    <div class="result-price"><span id="total-price" aria-hidden="true">—</span> <small id="price-period"></small></div>
                    <output id="price-announcement" class="sr-only" aria-live="polite" aria-atomic="true"></output>
                    <p class="result-note" id="result-note">${escapeHtml(auditOnly ? text.auditNote : text.serviceNote)}</p>
                </div>
                <div class="btn-wrapper">
                    <button type="button" class="btn-premium btn-order" disabled aria-describedby="calcStatus">${escapeHtml(auditOnly ? text.orderAudit : text.orderService)}</button>
                </div>
            </div>
            <div class="quote-guidance" data-quote-guidance hidden>
                <div class="quote-guidance__heading">${icon('clipboard')}<h3 data-guidance-title></h3></div>
                <p data-guidance-text></p><p class="quote-guidance__help" data-guidance-help></p>
                <div class="quote-guidance__actions">
                    <button type="button" class="quote-link" data-expand-systems>${escapeHtml(text.expandSystems)}</button>
                    <button type="button" class="quote-link" data-switch-audit>${escapeHtml(text.switchAudit)}</button>
                    <a class="quote-link quote-link--primary" href="${route('contact', localeKey)}">${escapeHtml(text.contactEngineer)} ${icon('arrow', 'button-icon')}</a>
                </div>
            </div>
            <p id="calcStatus" class="calc-status" role="status" aria-live="polite"></p>
        </div>
    </div>`;
}

function modal(localeKey) {
    const text = LOCALES[localeKey].calculator;
    return `<div id="modalOrder" class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-hidden="true">
    <div class="modal-content bento-base" tabindex="-1">
        <button type="button" class="modal-close" aria-label="${escapeHtml(LOCALES[localeKey].closeDialog)}">&times;</button>
        <div class="modal-header">
            <h3 id="modal-title" data-service-title="${escapeHtml(text.modalTitleService)}" data-audit-title="${escapeHtml(text.modalTitleAudit)}">${escapeHtml(text.modalTitleService)}</h3>
            <p>${escapeHtml(text.objectParameters)}: <span id="display-area">0</span> m²</p>
        </div>
        <form id="orderForm" class="modal-form" novalidate>
            <div class="input-group">
                <label for="userName">${escapeHtml(text.nameLabel)}</label>
                <input type="text" id="userName" name="name" placeholder="${escapeHtml(text.namePlaceholder)}" autocomplete="name" minlength="2" maxlength="80" aria-describedby="userName-error" required>
                <p class="input-error" id="userName-error" role="alert" hidden>${escapeHtml(text.nameError)}</p>
            </div>
            <div class="input-group">
                <label for="objName">${escapeHtml(text.objectLabel)}</label>
                <input type="text" id="objName" name="object" placeholder="${escapeHtml(text.objectPlaceholder)}" autocomplete="organization" minlength="2" maxlength="120" aria-describedby="objName-error" required>
                <p class="input-error" id="objName-error" role="alert" hidden>${escapeHtml(text.objectError)}</p>
            </div>
            <div class="input-group">
                <label for="userPhone">${escapeHtml(text.phoneLabel)}</label>
                <input type="tel" id="userPhone" name="phone" placeholder="+998 (__) ___-__-__" autocomplete="tel" inputmode="tel" maxlength="19" aria-describedby="userPhone-error" required>
                <p class="input-error" id="userPhone-error" role="alert" hidden>${escapeHtml(text.phoneError)}</p>
            </div>
            <div class="honeypot" aria-hidden="true">
                <label for="companyWebsite">Website</label>
                <input type="text" id="companyWebsite" name="website" tabindex="-1" autocomplete="off">
            </div>
            <button type="submit" class="btn-submit-premium" data-service-label="${escapeHtml(text.submitService)}" data-audit-label="${escapeHtml(text.submitAudit)}">
                <span>${escapeHtml(text.submitService)}</span>
            </button>
            <p id="formStatus" class="form-status" role="status" aria-live="polite"></p>
            <p class="form-disclaimer">${escapeHtml(text.disclaimer)} <a href="${route('privacy', localeKey)}">${escapeHtml(LOCALES[localeKey].common.privacy)}</a>.</p>
        </form>
    </div>
</div>`;
}

function renderHome(localeKey, page) {
    const locale = LOCALES[localeKey];
    const serviceCards = page.services.map(([iconName, title, text], index) => `<article class="bento-item bento-base reveal" data-future-section="true">
        <div class="bento-number">${String(index + 1).padStart(2, '0')}</div>
        <div class="feature-icon">${icon(iconName)}</div>
        <h3>${escapeHtml(title)}</h3>
        <div class="indicator-line"></div>
        <p>${escapeHtml(text)}</p>
    </article>`).join('');
    const segments = page.segments.map(([iconName, title, text]) => `<article class="bento-base segment-card reveal" data-future-section="true">
        <div class="segment-card-top"><div class="feature-icon">${icon(iconName)}</div><h3>${escapeHtml(title)}</h3></div>
        <div class="indicator-line"></div><p>${escapeHtml(text)}</p>
    </article>`).join('');

    return `<main id="main-content">
    <section class="hero">
        <div class="hero-poster"></div>
        <video id="heroVideo" autoplay loop muted playsinline preload="metadata" poster="/assets/img/video_poster.jpg" class="back-video">
            <source src="/assets/video/bg_video.webm" type="video/webm">
            <source src="/assets/video/bg_video.mp4" type="video/mp4">
        </video>
        <div class="hero-section">
            <div class="badge"><span>EST. ${SITE.founded}</span><div class="badge-separator"></div><span>TASHKENT</span></div>
            <h1>${escapeHtml(page.heroTitle[0])}<br> <span>${escapeHtml(page.heroTitle[1])}</span></h1>
            <p class="hero-description">${escapeHtml(page.heroText)}</p>
            <div class="hero-actions">
                <a class="btn-premium hero-primary" href="#calculators">${escapeHtml(locale.common.serviceCta)}</a>
                <a class="hero-secondary" href="${route('audit', localeKey)}">${escapeHtml(locale.nav.audit)} →</a>
            </div>
        </div>
    </section>

    <section id="about" class="about about-premium">
        <div class="container">
            <div class="about-premium__intro">
                <div class="about-premium__copy reveal">
                    <p class="eyebrow">ASIATECHNOSTROY · ENGINEERING GROUP</p>
                    <h2>${escapeHtml(page.aboutTitle)}</h2>
                    ${page.aboutParagraphs.map((paragraph) => `<p class="about-description">${escapeHtml(paragraph)}</p>`).join('')}
                    <a class="text-link" href="${route('about', localeKey)}">${escapeHtml(locale.nav.about)} ${icon('arrow', 'button-icon')}</a>
                </div>
                <figure class="about-media reveal">
                    <img class="about-media__primary" src="/assets/img/engineering/hvac-rooftop.webp" width="1800" height="1201" loading="lazy" alt="${escapeHtml(page.photoCaption)}">
                    <img class="about-media__detail" src="/assets/img/engineering/ventilation-units.webp" width="1800" height="1200" loading="lazy" alt="">
                    <figcaption><span>ATS / ENGINEERING</span>${escapeHtml(page.photoCaption)}</figcaption>
                </figure>
            </div>
            ${factGrid(page.facts)}
            <div class="section-heading section-heading--left"><p class="eyebrow">01 / ${escapeHtml(locale.sections.standard)}</p><h2>${escapeHtml(page.principlesTitle)}</h2></div>
            ${numberedGrid(page.principles, 'principles-grid')}
        </div>
    </section>

    <section class="section object-segments" aria-labelledby="segments-title">
        <div class="container">
            <div class="section-heading"><p class="eyebrow">02 / ${escapeHtml(locale.sections.facilities)}</p><h2 id="segments-title">${escapeHtml(page.segmentsTitle)}</h2></div>
            <div class="about-features">${segments}</div>
        </div>
    </section>

    <section id="services" class="section" aria-labelledby="services-title">
        <div class="container">
            <div class="section-heading"><p class="eyebrow">03 / ${escapeHtml(locale.sections.systems)}</p><h2 id="services-title">${escapeHtml(page.servicesTitle)}</h2></div>
            <div class="bento-grid">
                <article class="bento-item bento-item--intro bento-base reveal">
                    <div class="intro-content"><h3>${escapeHtml(page.servicesIntroTitle)}</h3><div class="indicator-line"></div><p>${escapeHtml(page.servicesIntroText)}</p><a class="text-link" href="${route('service', localeKey)}" aria-label="${escapeHtml(locale.common.serviceDetails)}">${escapeHtml(locale.common.serviceDetails)} ${icon('arrow', 'button-icon')}</a></div>
                </article>
                ${serviceCards}
            </div>
        </div>
    </section>

    <section id="audit" class="section audit-feature" aria-labelledby="audit-title">
        <div class="container audit-feature__grid">
            <div class="audit-feature__content reveal">
                <p class="eyebrow">04 / ${escapeHtml(page.auditEyebrow)}</p>
                <h2 id="audit-title">${escapeHtml(page.auditTitle)}</h2>
                <p class="audit-feature__lead">${escapeHtml(page.auditText)}</p>
                ${numberedGrid(page.auditSteps, 'audit-step-grid')}
                <div class="hero-actions hero-actions--left">
                    <a class="btn-premium" href="${route('audit', localeKey)}" aria-label="${escapeHtml(locale.common.auditDetails)}">${escapeHtml(locale.common.auditDetails)} ${icon('arrow', 'button-icon')}</a>
                    <a class="hero-secondary" href="${route('audit', localeKey)}#audit-calculator">${escapeHtml(locale.common.auditCta)}</a>
                </div>
            </div>
            <div class="audit-feature__visual reveal">
                <img src="/assets/img/engineering/plant-room.webp" width="1800" height="1198" loading="lazy" alt="${escapeHtml(page.auditImageAlt)}">
                <div class="report-preview" aria-hidden="true">
                    <div class="report-preview__head"><span>ASIATECHNOSTROY</span><strong>${escapeHtml(locale.sections.technicalAudit)}</strong></div>
                    ${page.auditDeliverables.map((item, index) => `<div class="report-preview__row"><span>${String(index + 1).padStart(2, '0')}</span><i></i><b>${escapeHtml(item)}</b></div>`).join('')}
                </div>
            </div>
        </div>
    </section>

    <section id="calculators" class="section calculator-section" aria-labelledby="calculator-title">
        <div class="container">
            <div class="section-heading"><p class="eyebrow">05 / ${escapeHtml(locale.sections.estimate)}</p><h2 id="calculator-title">${escapeHtml(locale.calculator.title)}</h2></div>
            ${calculator(localeKey)}
        </div>
    </section>
    ${contactPanel(localeKey, page.contactTitle, page.contactText)}
</main>
${modal(localeKey)}`;
}

function renderAbout(localeKey, page) {
    const locale = LOCALES[localeKey];
    return `<main id="main-content">
        ${pageHeader(localeKey, 'about', page)}
        <section class="section editorial-section">
            <div class="container editorial-grid">
                <div class="section-heading section-heading--left reveal"><p class="eyebrow">01 / ${escapeHtml(locale.sections.approach)}</p><h2>${escapeHtml(page.introTitle)}</h2></div>
                <div class="editorial-copy reveal">${page.introParagraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}</div>
            </div>
            <div class="container editorial-media reveal"><img src="/assets/img/engineering/hvac-rooftop.webp" width="1800" height="1201" loading="eager" alt="${escapeHtml(page.editorialImageAlt)}"><span>ASIATECHNOSTROY / TASHKENT</span></div>
        </section>
        <section class="section section--surface">
            <div class="container"><div class="section-heading section-heading--left"><p class="eyebrow">02 / ${escapeHtml(locale.sections.operatingModel)}</p><h2>${escapeHtml(page.modelTitle)}</h2></div>${numberedGrid(page.model, 'operating-model')}</div>
        </section>
        <section class="section responsibility-section">
            <div class="container responsibility-grid">
                <div class="responsibility-copy reveal"><p class="eyebrow">03 / ${escapeHtml(locale.sections.boundaries)}</p><h2>${escapeHtml(page.responsibilityTitle)}</h2><p>${escapeHtml(page.responsibilityText)}</p></div>
                <div class="responsibility-facts reveal">${factGrid(page.facts)}</div>
            </div>
        </section>
        <section class="section audit-cta"><div class="container"><div class="audit-cta__card bento-base reveal"><div><p class="eyebrow">04 / ${escapeHtml(locale.sections.technicalAudit)}</p><h2>${escapeHtml(page.ctaTitle)}</h2><p>${escapeHtml(page.ctaText)}</p></div><a class="btn-premium" href="${route('audit', localeKey)}#audit-calculator">${escapeHtml(locale.common.auditCta)} ${icon('arrow', 'button-icon')}</a></div></div></section>
        ${contactPanel(localeKey, locale.common.discuss, page.ctaText)}
    </main>`;
}

function renderAudit(localeKey, page) {
    const locale = LOCALES[localeKey];
    return `<main id="main-content">
        ${pageHeader(localeKey, 'audit', page)}
        <section class="section audit-intro"><div class="container editorial-grid"><div class="section-heading section-heading--left reveal"><p class="eyebrow">01 / ${escapeHtml(locale.sections.purpose)}</p><h2>${escapeHtml(page.introTitle)}</h2></div><div class="editorial-copy reveal"><p>${escapeHtml(page.introText)}</p></div></div></section>
        <section class="section section--surface"><div class="container"><div class="section-heading section-heading--left"><p class="eyebrow">02 / ${escapeHtml(locale.sections.process)}</p><h2>${escapeHtml(page.stagesTitle)}</h2></div>${numberedGrid(page.stages, 'audit-process')}</div></section>
        <section class="section audit-scope"><div class="container split-panel"><div class="split-panel__media reveal"><img src="/assets/img/engineering/ventilation-units.webp" width="1800" height="1200" loading="lazy" alt="${escapeHtml(page.scopeImageAlt)}"></div><div class="split-panel__content reveal"><p class="eyebrow">03 / ${escapeHtml(locale.sections.scope)}</p><h2>${escapeHtml(page.scopeTitle)}</h2><p>${escapeHtml(page.scopeIntro)}</p>${checklist(page.scope, '', { 5: locale.calculator.unavailable })}<p class="audit-exclusion">${escapeHtml(locale.calculator.auditExclusion)}</p></div></div></section>
        <section class="section report-section section--surface"><div class="container"><div class="section-heading section-heading--left"><p class="eyebrow">04 / ${escapeHtml(locale.sections.deliverable)}</p><h2>${escapeHtml(page.reportTitle)}</h2><p>${escapeHtml(page.reportIntro)}</p></div>${numberedGrid(page.report, 'report-grid')}<div class="confidentiality-note reveal"><span>${icon('shield')}</span><div><h3>${escapeHtml(page.confidentialityTitle)}</h3><p>${escapeHtml(page.confidentialityText)}</p></div></div></div></section>
        <section id="audit-calculator" class="section calculator-section"><div class="container"><div class="section-heading"><p class="eyebrow">05 / ${escapeHtml(locale.sections.estimate)}</p><h2>${escapeHtml(page.calculatorTitle)}</h2><p>${escapeHtml(page.calculatorText)}</p></div>${calculator(localeKey, { auditOnly: true })}</div></section>
        ${contactPanel(localeKey, locale.common.discuss, page.calculatorText)}
    </main>
    ${modal(localeKey)}`;
}

function renderService(localeKey, page) {
    const locale = LOCALES[localeKey];
    return `<main id="main-content">
        ${pageHeader(localeKey, 'service', page)}
        <section class="section editorial-section"><div class="container editorial-grid"><div class="section-heading section-heading--left reveal"><p class="eyebrow">01 / ${escapeHtml(locale.sections.scope)}</p><h2>${escapeHtml(page.introTitle)}</h2></div><div class="editorial-copy reveal"><p>${escapeHtml(page.introText)}</p></div></div></section>
        <section class="section section--surface"><div class="container"><div class="section-heading section-heading--left"><p class="eyebrow">02 / ${escapeHtml(locale.sections.operatingCycle)}</p><h2>${escapeHtml(page.cycleTitle)}</h2></div>${numberedGrid(page.cycle, 'operating-model')}</div></section>
        <section class="section"><div class="container dual-lists"><article class="bento-base reveal"><p class="eyebrow">03 / ${escapeHtml(locale.sections.documents)}</p><h2>${escapeHtml(page.documentsTitle)}</h2>${checklist(page.documents)}</article><article class="bento-base reveal"><p class="eyebrow">04 / ${escapeHtml(locale.sections.agreement)}</p><h2>${escapeHtml(page.boundaryTitle)}</h2>${checklist(page.boundary)}</article></div></section>
        <section class="section audit-cta"><div class="container"><div class="audit-cta__card bento-base reveal"><div><p class="eyebrow">05 / ${escapeHtml(locale.sections.technicalAudit)}</p><h2>${escapeHtml(page.ctaTitle)}</h2><p>${escapeHtml(page.ctaText)}</p></div><a class="btn-premium" href="${route('audit', localeKey)}#audit-calculator">${escapeHtml(locale.common.startAudit)} ${icon('arrow', 'button-icon')}</a></div></div></section>
        ${contactPanel(localeKey, locale.common.discuss, page.ctaText)}
    </main>`;
}

function renderContact(localeKey, page) {
    const locale = LOCALES[localeKey];
    return `<main id="main-content">
        ${pageHeader(localeKey, 'contact', page)}
        <section class="section contact-page"><div class="container contact-page__grid">
            <article class="contact-details bento-base reveal"><p class="eyebrow">01 / ${escapeHtml(locale.sections.contact)}</p><h2>${escapeHtml(page.contactTitle)}</h2><dl><div><dt>${escapeHtml(page.phoneLabel)}</dt><dd><a href="tel:${SITE.phoneHref}">${SITE.phoneDisplay}</a></dd></div><div><dt>${escapeHtml(page.channelLabel)}</dt><dd><a href="${SITE.whatsapp}" target="_blank" rel="noopener noreferrer">${escapeHtml(page.channelValue)}</a></dd></div><div><dt>${escapeHtml(page.serviceAreaLabel)}</dt><dd>${escapeHtml(page.serviceArea)}</dd></div></dl></article>
            <article class="contact-preparation reveal"><p class="eyebrow">02 / ${escapeHtml(locale.sections.brief)}</p><h2>${escapeHtml(page.nextTitle)}</h2>${checklist(page.next)}<div class="hero-actions hero-actions--left"><a class="btn-premium" href="tel:${SITE.phoneHref}">${escapeHtml(locale.common.call)}</a><a class="hero-secondary" href="${SITE.whatsapp}" target="_blank" rel="noopener noreferrer">${escapeHtml(locale.common.whatsapp)}</a></div></article>
        </div></section>
        <section class="section calculator-link-section"><div class="container"><div class="calculator-link-card reveal"><p class="eyebrow">03 / ${escapeHtml(locale.sections.estimate)}</p><h2>${escapeHtml(locale.calculator.title)}</h2><p>${escapeHtml(locale.calculator.subtitle)}</p><a class="text-link" href="${route('home', localeKey)}#calculators">${escapeHtml(locale.nav.calculator)} ${icon('arrow', 'button-icon')}</a></div></div></section>
    </main>`;
}

function renderPrivacy(localeKey, page) {
    const locale = LOCALES[localeKey];
    return `<main id="main-content">
        ${pageHeader(localeKey, 'privacy', page)}
        <section class="section editorial-section"><div class="container editorial-grid"><div class="section-heading section-heading--left reveal"><p class="eyebrow">01 / ${escapeHtml(locale.sections.data)}</p><h2>${escapeHtml(page.introTitle)}</h2></div><div class="editorial-copy reveal">${page.introParagraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}</div></div></section>
        <section class="section section--surface"><div class="container"><div class="section-heading section-heading--left"><p class="eyebrow">02 / ${escapeHtml(locale.sections.processing)}</p><h2>${escapeHtml(locale.nav.privacy)}</h2></div>${numberedGrid(page.items, 'report-grid')}</div></section>
        ${contactPanel(localeKey, page.contactTitle, page.contactText)}
    </main>`;
}

function bodyFor(localeKey, pageType, page) {
    if (pageType === 'home') return renderHome(localeKey, page);
    if (pageType === 'about') return renderAbout(localeKey, page);
    if (pageType === 'audit') return renderAudit(localeKey, page);
    if (pageType === 'service') return renderService(localeKey, page);
    if (pageType === 'contact') return renderContact(localeKey, page);
    if (pageType === 'privacy') return renderPrivacy(localeKey, page);
    throw new Error(`Unknown page type: ${pageType}`);
}

export function renderPage(localeKey, pageType) {
    const locale = LOCALES[localeKey];
    const page = PAGES[localeKey]?.[pageType];
    if (!locale || !page) throw new Error(`Missing content for ${localeKey}/${pageType}`);
    const schemaText = schemaFor(localeKey, pageType, page);
    const html = `<!DOCTYPE html>
<html lang="${locale.htmlLang}">
${head(localeKey, pageType, page, schemaText)}
<body data-locale="${localeKey}" data-page="${pageType}">
<a class="skip-link" href="#main-content">${escapeHtml(locale.skip)}</a>
${header(localeKey, pageType)}
${bodyFor(localeKey, pageType, page)}
${footer(localeKey)}
</body>
</html>
`;
    return Object.freeze({ html, schemaText });
}
