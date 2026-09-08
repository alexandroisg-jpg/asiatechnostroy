import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { LOCALES, ROUTES, SITE } from '../site/content.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = path.join(projectRoot, 'public');
const pageTypes = Object.keys(ROUTES);
const localeKeys = Object.keys(LOCALES);

function fileForRoute(route) {
    return route === '/'
        ? path.join(publicRoot, 'index.html')
        : path.join(publicRoot, route.slice(1), 'index.html');
}

function localReferences(html) {
    return [...html.matchAll(/(?:href|src|poster)="(\/[^"]+)"/gu)]
        .map((match) => match[1])
        .filter((value) => !value.startsWith('//') && !value.startsWith('/#'));
}

async function htmlFiles(root, current = root) {
    const files = [];
    for (const entry of await readdir(current, { withFileTypes: true })) {
        const filename = path.join(current, entry.name);
        if (entry.isDirectory()) {
            files.push(...await htmlFiles(root, filename));
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
            files.push(path.relative(root, filename));
        }
    }
    return files;
}

test('public contains exactly the generated HTML pages', async () => {
    const expected = [
        '404.html',
        ...pageTypes.flatMap((pageType) =>
            localeKeys.map((localeKey) => path.relative(publicRoot, fileForRoute(ROUTES[pageType][localeKey])))
        )
    ].sort();

    assert.deepEqual((await htmlFiles(publicRoot)).sort(), expected);
});

test('the generated site contains six reciprocal pages in all three languages', async () => {
    assert.equal(pageTypes.length, 6);
    assert.deepEqual(localeKeys, ['ru', 'uz', 'en']);

    const canonicals = new Set();
    const titles = new Set();
    const descriptions = new Set();

    for (const pageType of pageTypes) {
        for (const localeKey of localeKeys) {
            const route = ROUTES[pageType][localeKey];
            const canonical = `${SITE.domain}${route}`;
            const html = await readFile(fileForRoute(route), 'utf8');

            assert.match(html, new RegExp(`<html lang="${LOCALES[localeKey].htmlLang}">`));
            assert.equal((html.match(/<h1(?:\s|>)/gu) || []).length, 1);
            assert.ok(html.includes('<div class="language-switch" role="group"'));
            if (pageType !== 'home') {
                assert.ok(html.includes(`<nav class="breadcrumbs" aria-label="${LOCALES[localeKey].breadcrumbLabel}">`));
            }
            assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`));
            assert.ok(html.includes(`<link rel="alternate" hreflang="x-default" href="${SITE.domain}${ROUTES[pageType].ru}">`));

            for (const alternateLocale of localeKeys) {
                assert.ok(html.includes(
                    `<link rel="alternate" hreflang="${LOCALES[alternateLocale].hreflang}" href="${SITE.domain}${ROUTES[pageType][alternateLocale]}">`
                ));
            }

            const title = html.match(/<title>(.*?)<\/title>/u)?.[1];
            const description = html.match(/<meta name="description" content="(.*?)">/u)?.[1];
            assert.ok(title);
            assert.ok(description);
            assert.equal(titles.has(title), false, `duplicate title: ${title}`);
            assert.equal(descriptions.has(description), false, `duplicate description: ${description}`);
            titles.add(title);
            descriptions.add(description);
            canonicals.add(canonical);

            const schemaText = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/u)?.[1];
            assert.ok(schemaText);
            const schema = JSON.parse(schemaText);
            assert.ok(Array.isArray(schema['@graph']));
            assert.ok(schema['@graph'].some((item) => item.url === canonical));
        }
    }

    assert.equal(canonicals.size, 18);
    assert.equal(titles.size, 18);
    assert.equal(descriptions.size, 18);
});

test('calculator results and the shared 404 page are accessible in every language', async () => {
    for (const localeKey of localeKeys) {
        for (const pageType of ['home', 'audit']) {
            const html = await readFile(fileForRoute(ROUTES[pageType][localeKey]), 'utf8');
            assert.ok(html.includes('<output id="price-announcement" class="sr-only" aria-live="polite" aria-atomic="true"></output>'));
            assert.ok(html.includes('id="area-input" min="500" max="150000"'));
            assert.ok(html.includes('id="area-range" min="500" max="150000"'));
            assert.ok(html.includes('<div class="area-scale" aria-hidden="true"><span>500</span><span>50 000</span><span>100 000</span><span>150 000</span></div>'));
            assert.ok(html.includes(`href="${ROUTES.privacy[localeKey]}">${LOCALES[localeKey].common.privacy}</a>`));
        }
    }

    const notFound = await readFile(path.join(publicRoot, '404.html'), 'utf8');
    assert.ok(notFound.includes('<html lang="mul">'));
    assert.ok(notFound.includes('<p lang="ru">'));
    assert.ok(notFound.includes('<p lang="uz">'));
    assert.ok(notFound.includes('<p lang="en">'));
    assert.ok(notFound.includes('<meta name="robots" content="noindex, nofollow">'));
});

test('audit calls to action and form errors have unambiguous accessible destinations', async () => {
    for (const localeKey of localeKeys) {
        const home = await readFile(fileForRoute(ROUTES.home[localeKey]), 'utf8');
        const service = await readFile(fileForRoute(ROUTES.service[localeKey]), 'utf8');
        assert.ok(home.includes(`href="${ROUTES.audit[localeKey]}#audit-calculator">${LOCALES[localeKey].common.auditCta}</a>`));
        assert.ok(home.includes(`aria-label="${LOCALES[localeKey].common.serviceDetails}"`));
        assert.ok(home.includes(`aria-label="${LOCALES[localeKey].common.auditDetails}"`));
        assert.ok(service.includes(`href="${ROUTES.audit[localeKey]}#audit-calculator">${LOCALES[localeKey].common.startAudit}`));
        assert.ok(home.includes('aria-describedby="userName-error"'));
        assert.ok(home.includes('id="userName-error" role="alert" hidden'));
    }
});

test('commercial guidance and the unavailable scope are consistent in all calculator languages', async () => {
    for (const localeKey of localeKeys) {
        const copy = LOCALES[localeKey].calculator;
        const home = await readFile(fileForRoute(ROUTES.home[localeKey]), 'utf8');
        assert.match(home, /<input type="checkbox" disabled data-unavailable="true" data-system="low_current"/u);
        assert.equal((home.match(/data-system="[^"]+"/gu) || []).length, 7);
        assert.ok(home.includes('id="service-review"'));
        for (const pageType of ['home', 'audit']) {
            const html = await readFile(fileForRoute(ROUTES[pageType][localeKey]), 'utf8');
            const scope = html.match(/<ul class="audit-systems">([\s\S]*?)<\/ul>/u)?.[1];
            assert.ok(scope);
            assert.equal((scope.match(/<li class="audit-system">/gu) || []).length, 6);
            assert.equal((scope.match(/<li class="audit-system is-unavailable">/gu) || []).length, 1);
            assert.ok(scope.includes(`<button type="button" class="availability-badge" disabled>${copy.unavailable}</button>`));
            assert.ok(html.includes('id="audit-review"'));
            assert.ok(html.includes('class="btn-premium btn-order" disabled aria-describedby="calcStatus"'));
            assert.ok(html.includes('id="total-price" aria-hidden="true">—</span>'));
            assert.ok(html.includes('data-quote-guidance hidden'));
            assert.ok(html.includes(`href="${ROUTES.contact[localeKey]}">${copy.contactEngineer}`));
            assert.equal(html.includes('NaN'), false);
            for (const key of ['minimumText', 'largeText', 'reviewText', 'auditExclusion', 'pdfAuditNote']) {
                assert.ok(copy[key]?.length > 20, `${localeKey}: missing ${key}`);
            }
        }
    }
});

test('sitemap and CSP cover every indexable page and inline schema', async () => {
    const sitemap = await readFile(path.join(publicRoot, 'sitemap.xml'), 'utf8');
    const headers = await readFile(path.join(publicRoot, '_headers'), 'utf8');
    const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/gu)].map((match) => match[1]);
    const expectedLocations = pageTypes.flatMap((pageType) =>
        localeKeys.map((localeKey) => `${SITE.domain}${ROUTES[pageType][localeKey]}`)
    );

    assert.deepEqual(new Set(locations), new Set(expectedLocations));
    assert.equal(locations.length, 18);

    for (const pageType of pageTypes) {
        for (const localeKey of localeKeys) {
            const html = await readFile(fileForRoute(ROUTES[pageType][localeKey]), 'utf8');
            const schemaText = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/u)?.[1];
            const hash = createHash('sha256').update(schemaText, 'utf8').digest('base64');
            assert.ok(headers.includes(`'sha256-${hash}'`));
        }
    }

    assert.ok(headers.includes("script-src-attr 'none'"));
    assert.equal(headers.includes("'unsafe-inline'"), false);
    assert.match(headers, /\/assets\/\*\n  Cache-Control: public, max-age=86400, stale-while-revalidate=604800/u);
    assert.equal(/\/assets\/\*[\s\S]*?Cache-Control:[^\n]*immutable/u.test(headers), false);
});

test('local page resources use root-relative URLs and exist in public', async () => {
    const allRoutes = pageTypes.flatMap((pageType) => localeKeys.map((localeKey) => ROUTES[pageType][localeKey]));

    for (const route of allRoutes) {
        const html = await readFile(fileForRoute(route), 'utf8');
        assert.equal(/(?:href|src|poster)="(?!\/|https?:|#|tel:|mailto:|javascript:)/u.test(html), false);

        for (const reference of localReferences(html)) {
            const pathname = new URL(reference, SITE.domain).pathname;
            if (pathname.endsWith('/')) {
                await access(fileForRoute(pathname));
            } else {
                await access(path.join(publicRoot, pathname.slice(1)));
            }
        }
    }
});

test('shared CSS and browser modules keep asset references root-relative', async () => {
    const css = await readFile(path.join(publicRoot, 'style.css'), 'utf8');
    const browserScript = await readFile(path.join(publicRoot, 'script.js'), 'utf8');
    const cssReferences = [...css.matchAll(/url\(["']?([^"')]+)["']?\)/gu)].map((match) => match[1]);
    const moduleImports = [...browserScript.matchAll(/from\s+["']([^"']+)["']/gu)].map((match) => match[1]);

    assert.ok(cssReferences.every((value) => value.startsWith('/') || value.startsWith('data:')));
    assert.ok(moduleImports.every((value) => value.startsWith('/')));
});
