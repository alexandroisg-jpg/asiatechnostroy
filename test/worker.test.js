import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';

import worker, { handleSend } from '../src/worker.js';

if (!globalThis.crypto) {
    Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
}

function validBody(overrides = {}) {
    return {
        name: 'Александр',
        object: 'БЦ Anhor',
        phone: '+998917888805',
        area: 1000,
        mode: 'service',
        type: 'office',
        systemIds: ['conditioning'],
        website: '',
        formElapsedMs: 4_000,
        ...overrides
    };
}

function leadRequest(body, options = {}) {
    const origin = options.origin ?? 'https://asiatechnostroy.uz';
    return new Request('https://asiatechnostroy.uz/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Origin: origin,
            'Sec-Fetch-Site': options.fetchSite ?? 'same-origin',
            'CF-Connecting-IP': '203.0.113.10'
        },
        body: typeof body === 'string' ? body : JSON.stringify(body)
    });
}

function environment(overrides = {}) {
    return {
        TOKEN: 'test-token',
        CHAT_ID: 'test-chat',
        LEAD_RATE_LIMITER: { limit: async () => ({ success: true }) },
        ASSETS: { fetch: async () => new Response('asset') },
        ...overrides
    };
}

test('valid request is repriced on the Worker and sent to the fixed Telegram endpoint', async () => {
    let telegramRequest;
    const fetchStub = async (url, init) => {
        telegramRequest = { url, init, body: JSON.parse(init.body) };
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
    };

    const response = await handleSend(leadRequest(validBody()), environment(), fetchStub);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.notificationSent, true);
    assert.equal(payload.quote.total, 3_200_000);
    assert.equal(payload.quote.pricePeriod, 'сум/мес');
    assert.equal(telegramRequest.url, 'https://api.telegram.org/bottest-token/sendMessage');
    assert.equal(telegramRequest.body.chat_id, 'test-chat');
    assert.equal(telegramRequest.body.parse_mode, undefined);
    assert.match(telegramRequest.body.text, /Стоимость: 3\s200\s000/);
});

test('localized requests return localized quote labels and keep the same server-side price', async () => {
    const response = await handleSend(
        leadRequest(validBody({ locale: 'en' })),
        environment(),
        async () => new Response('{}', { status: 200 })
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.quote.locale, 'en');
    assert.equal(payload.quote.total, 3_200_000);
    assert.equal(payload.quote.modeLabel, 'Ongoing maintenance');
    assert.equal(payload.quote.pricePeriod, 'UZS/month');
});

test('Worker issues a base audit at the 50,000 m² boundary with six systems and exclusions', async () => {
    let telegramBody;
    const response = await handleSend(
        leadRequest(validBody({ area: 50_000, mode: 'audit', systemIds: [] })),
        environment(),
        async (_url, init) => {
            telegramBody = JSON.parse(init.body);
            return new Response('{}', { status: 200 });
        }
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.quote.area, 50_000);
    assert.equal(payload.quote.total, 64_200_000);
    assert.equal(payload.quote.systemLabels.length, 6);
    assert.equal(payload.quote.pricePeriod, 'сум, разово');
    assert.match(telegramBody.text, /Стоимость: 64\s200\s000/);
    assert.match(telegramBody.text, /Слаботочные системы и СКУД исключены/u);
});

test('ineligible and stale-client submissions create no offer and no notification', async () => {
    let calls = 0;
    const scenarios = [
        { area: 500 },
        { systemIds: ['conditioning', 'heating'] },
        { systemIds: ['conditioning', 'heating', 'ventilation', 'water'] },
        { area: 50_010 },
        { area: 150_000 },
        { area: 150_000, mode: 'audit', systemIds: [] },
        { assessment: 'individual' },
        { assessment: 'individual', mode: 'audit', systemIds: [] }
    ];
    for (const scenario of scenarios) {
        const response = await handleSend(leadRequest(validBody(scenario)), environment(), async () => { calls++; return new Response('{}'); });
        const payload = await response.json();
        assert.equal(response.status, 422, JSON.stringify(scenario));
        assert.equal(payload.code, 'QUOTE_REQUIRES_REVIEW');
        assert.equal(payload.quote, undefined);
        assert.equal(payload.total, undefined);
    }
    for (const mode of ['service', 'audit']) {
        const response = await handleSend(leadRequest(validBody({ area: 2000, mode, systemIds: ['low_current'] })), environment(), async () => { calls++; return new Response('{}'); });
        assert.equal(response.status, 400);
    }
    assert.equal(calls, 0);
});

test('client-controlled total and unknown fields are rejected before Telegram', async () => {
    let calls = 0;
    const response = await handleSend(
        leadRequest(validBody({ total: '1' })),
        environment(),
        async () => { calls += 1; return new Response('{}'); }
    );
    assert.equal(response.status, 400);
    assert.equal(calls, 0);
});

test('prototype property names cannot bypass type and system allowlists', async () => {
    let calls = 0;
    const invalidBodies = [
        validBody({ type: '__proto__' }),
        validBody({ type: 'constructor' }),
        validBody({ systemIds: ['toString'] })
    ];

    for (const body of invalidBodies) {
        const response = await handleSend(
            leadRequest(body),
            environment(),
            async () => { calls += 1; return new Response('{}'); }
        );
        assert.equal(response.status, 400);
    }
    assert.equal(calls, 0);
});

test('audit requests cannot attach service-system selections', async () => {
    let calls = 0;
    const response = await handleSend(
        leadRequest(validBody({ mode: 'audit', systemIds: ['conditioning'] })),
        environment(),
        async () => { calls += 1; return new Response('{}'); }
    );

    assert.equal(response.status, 400);
    assert.equal(calls, 0);
});

test('markup remains inert data and cannot trigger a renderer or network fetch', async () => {
    const attackerText = '<img src="http://169.254.169.254/latest/meta-data/">';
    let telegramBody;
    const response = await handleSend(
        leadRequest(validBody({ name: attackerText })),
        environment(),
        async (_url, init) => {
            telegramBody = JSON.parse(init.body);
            return new Response('{}', { status: 200 });
        }
    );
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.quote.name, attackerText);
    assert.match(telegramBody.text, /<img src=/);
});

test('control characters and bidi overrides are rejected before Telegram', async () => {
    let calls = 0;
    for (const name of ['Имя\nОбъект: подмена', 'Имя\u202Etxt.exe']) {
        const response = await handleSend(
            leadRequest(validBody({ name })),
            environment(),
            async () => { calls += 1; return new Response('{}'); }
        );
        assert.equal(response.status, 400);
    }
    assert.equal(calls, 0);
});

test('cross-origin, malformed and oversized requests fail closed', async () => {
    assert.equal((await handleSend(
        leadRequest(validBody(), { origin: 'https://evil.example' }),
        environment(),
        async () => new Response('{}')
    )).status, 403);

    assert.equal((await handleSend(
        leadRequest('{not-json'),
        environment(),
        async () => new Response('{}')
    )).status, 400);

    assert.equal((await handleSend(
        leadRequest(JSON.stringify({ padding: 'x'.repeat(17_000) })),
        environment(),
        async () => new Response('{}')
    )).status, 400);
});

test('streaming bodies are cancelled as soon as the byte limit is crossed', async () => {
    let pulls = 0;
    let cancelled = false;
    const stream = new ReadableStream({
        pull(controller) {
            pulls += 1;
            controller.enqueue(new Uint8Array(1_024));
            if (pulls >= 1_024) controller.close();
        },
        cancel() {
            cancelled = true;
        }
    });
    const request = new Request('https://asiatechnostroy.uz/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Origin: 'https://asiatechnostroy.uz',
            'Sec-Fetch-Site': 'same-origin',
            'CF-Connecting-IP': '203.0.113.10'
        },
        body: stream,
        duplex: 'half'
    });

    const response = await handleSend(request, environment(), async () => new Response('{}'));
    assert.equal(response.status, 400);
    assert.equal(cancelled, true);
    assert.ok(pulls < 64, `stream pulled ${pulls} KiB before cancellation`);
});

test('rate limiting and missing limiter prevent downstream work', async () => {
    let calls = 0;
    const blocked = await handleSend(
        leadRequest(validBody()),
        environment({ LEAD_RATE_LIMITER: { limit: async () => ({ success: false }) } }),
        async () => { calls += 1; return new Response('{}'); }
    );
    assert.equal(blocked.status, 429);
    assert.equal(blocked.headers.get('Retry-After'), '60');

    const unconfigured = await handleSend(
        leadRequest(validBody()),
        environment({ LEAD_RATE_LIMITER: undefined }),
        async () => { calls += 1; return new Response('{}'); }
    );
    assert.equal(unconfigured.status, 503);
    assert.equal(calls, 0);
});

test('Telegram failure stays non-fatal and is reported to the browser', async () => {
    const response = await handleSend(
        leadRequest(validBody({ mode: 'audit', area: 500, systemIds: [] })),
        environment(),
        async () => new Response('{}', { status: 502 })
    );
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.notificationSent, false);
    assert.equal(payload.quote.total, 1_500_000);
    assert.equal(payload.quote.pricePeriod, 'сум, разово');
});

test('health and method contracts are explicit', async () => {
    const health = await worker.fetch(new Request('https://asiatechnostroy.uz/health'), environment());
    assert.equal(health.status, 200);
    assert.equal(health.headers.get('X-Robots-Tag'), 'noindex, nofollow');

    const wrongMethod = await worker.fetch(new Request('https://asiatechnostroy.uz/send'), environment());
    assert.equal(wrongMethod.status, 405);
    assert.equal(wrongMethod.headers.get('Allow'), 'POST');
});

test('production HTTP and www requests redirect to the canonical HTTPS host', async () => {
    let assetCalls = 0;
    const env = environment({
        ASSETS: {
            fetch: async () => {
                assetCalls += 1;
                return new Response('asset');
            }
        }
    });

    const httpResponse = await worker.fetch(
        new Request('http://asiatechnostroy.uz/o-kompanii/?source=test'),
        env
    );
    assert.equal(httpResponse.status, 301);
    assert.equal(httpResponse.headers.get('Location'), 'https://asiatechnostroy.uz/o-kompanii/?source=test');

    const wwwResponse = await worker.fetch(
        new Request('https://www.asiatechnostroy.uz/en/about/'),
        env
    );
    assert.equal(wwwResponse.status, 301);
    assert.equal(wwwResponse.headers.get('Location'), 'https://asiatechnostroy.uz/en/about/');
    assert.equal(assetCalls, 0);

    const previewResponse = await worker.fetch(
        new Request('http://localhost:8787/'),
        env
    );
    assert.equal(previewResponse.status, 200);
    assert.equal(assetCalls, 1);
});
