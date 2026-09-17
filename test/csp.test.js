import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';
import { policyForPath } from '../src/csp.mjs';

test('HTML assets receive exactly one page-specific CSP while keeping status and headers', async () => {
    for (const [pathname, status] of [['/uslugi/elektrosnabzhenie/', 200], ['/unknown/', 404]]) {
        const asset = new Response('<!doctype html><h1>Test</h1>', { status, headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Security-Policy': "default-src 'self'",
            'X-Content-Type-Options': 'nosniff',
            'Cache-Control': 'public, max-age=0'
        }});
        const response = await worker.fetch(new Request('https://asiatechnostroy.uz' + pathname), { ASSETS: { fetch: async () => asset } });
        assert.equal(response.status, status);
        assert.equal(response.headers.get('Content-Security-Policy'), policyForPath(pathname));
        assert.equal(response.headers.get('Content-Security-Policy').includes(','), false);
        assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
        assert.equal(response.headers.get('Cache-Control'), 'public, max-age=0');
        assert.match(await response.text(), /<h1>Test<\/h1>/u);
    }
});

test('non-HTML assets are passed through without buffering or changing their headers', async () => {
    const asset = new Response('body{}', { headers: { 'Content-Type': 'text/css', ETag: '"test"' } });
    const response = await worker.fetch(new Request('https://asiatechnostroy.uz/directions.css'), { ASSETS: { fetch: async () => asset } });
    assert.equal(response, asset);
});

test('unrecognized CSP paths use a strict fallback and cannot inject directives', () => {
    for (const pathname of ['/__proto__', '/constructor', '/?unsafe-inline', '/\nscript-src *']) {
        const policy = policyForPath(pathname);
        assert.ok(policy.includes("script-src 'self'"));
        assert.ok(policy.includes("script-src-attr 'none'"));
        assert.ok(policy.includes("frame-ancestors 'none'"));
        assert.equal(policy.includes("'unsafe-inline'"), false);
        assert.equal(policy.includes('sha256-'), false);
    }
});
