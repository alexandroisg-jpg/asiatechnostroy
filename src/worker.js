import { calculateQuote } from '../public/pricing.js';

const MAX_BODY_BYTES = 16 * 1024;
const MIN_FORM_TIME_MS = 1_500;
const MAX_FORM_TIME_MS = 2 * 60 * 60 * 1_000;
const ALLOWED_FIELDS = new Set([
    'name',
    'object',
    'phone',
    'area',
    'mode',
    'type',
    'systemIds',
    'website',
    'formElapsedMs'
]);
const UNSAFE_TEXT = /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u;

class InputError extends Error {}

function jsonResponse(payload, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff',
            'Referrer-Policy': 'no-referrer',
            ...extraHeaders
        }
    });
}

function normalizeSingleLine(value, fieldName, minLength, maxLength) {
    if (typeof value !== 'string') throw new InputError(`Поле «${fieldName}» заполнено неверно.`);
    const unicodeNormalized = value.normalize('NFKC');
    if (UNSAFE_TEXT.test(unicodeNormalized)) {
        throw new InputError(`Проверьте поле «${fieldName}».`);
    }
    const normalized = unicodeNormalized.trim().replace(/\s+/gu, ' ');
    if (normalized.length < minLength || normalized.length > maxLength) {
        throw new InputError(`Проверьте поле «${fieldName}».`);
    }
    return normalized;
}

function parseLead(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new InputError('Неверный формат заявки.');
    }

    if (Object.keys(body).some((key) => !ALLOWED_FIELDS.has(key))) {
        throw new InputError('Заявка содержит неизвестные поля.');
    }

    if (typeof body.website !== 'string' || body.website.length !== 0) {
        throw new InputError('Не удалось проверить форму.');
    }

    if (!Number.isFinite(body.formElapsedMs) || body.formElapsedMs < MIN_FORM_TIME_MS || body.formElapsedMs > MAX_FORM_TIME_MS) {
        throw new InputError('Обновите страницу и повторите отправку.');
    }

    const name = normalizeSingleLine(body.name, 'имя', 2, 80);
    const object = normalizeSingleLine(body.object, 'объект', 2, 120);
    if (typeof body.phone !== 'string' || !/^\+998\d{9}$/.test(body.phone)) {
        throw new InputError('Укажите телефон в формате +998 (XX) XXX-XX-XX.');
    }

    let calculation;
    try {
        calculation = calculateQuote({
            area: body.area,
            mode: body.mode,
            type: body.type,
            systemIds: body.systemIds
        });
    } catch (error) {
        throw new InputError(error.message);
    }

    return Object.freeze({ name, object, phone: body.phone, calculation });
}

function createQuote(lead, now = new Date()) {
    const date = new Intl.DateTimeFormat('ru-RU', {
        timeZone: 'Asia/Tashkent',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(now);
    const datePrefix = now.toISOString().slice(0, 10).replaceAll('-', '');
    const randomPart = crypto.randomUUID().replaceAll('-', '').slice(0, 6).toUpperCase();

    return Object.freeze({
        number: `${datePrefix}-${randomPart}`,
        date,
        name: lead.name,
        object: lead.object,
        phone: lead.phone,
        ...lead.calculation
    });
}

function telegramText(quote) {
    const systems = quote.systemLabels.length ? quote.systemLabels.join(', ') : 'комплексный аудит';
    return [
        'Новая заявка с сайта',
        `КП: ${quote.number}`,
        `Имя: ${quote.name}`,
        `Объект: ${quote.object}`,
        `Телефон: ${quote.phone}`,
        `Формат: ${quote.modeLabel}`,
        `Тип: ${quote.typeLabel}`,
        `Площадь: ${quote.area} м²`,
        `Системы: ${systems}`,
        `Стоимость: ${quote.total.toLocaleString('ru-RU')} ${quote.pricePeriod}`
    ].join('\n');
}

async function notifyTelegram(quote, env, fetchImpl = fetch) {
    if (!env.TOKEN || !env.CHAT_ID) {
        console.error('Telegram integration is not configured.');
        return false;
    }

    try {
        const response = await fetchImpl(`https://api.telegram.org/bot${env.TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: env.CHAT_ID,
                text: telegramText(quote),
                disable_web_page_preview: true
            }),
            signal: AbortSignal.timeout(8_000)
        });

        if (!response.ok) console.error(`Telegram request failed with status ${response.status}.`);
        return response.ok;
    } catch (error) {
        console.error(`Telegram request failed: ${error?.name || 'Error'}.`);
        return false;
    }
}

async function readJsonBody(request) {
    const contentType = request.headers.get('Content-Type') || '';
    if (!contentType.toLowerCase().startsWith('application/json')) {
        throw new InputError('Ожидается JSON-заявка.');
    }

    const declaredLength = Number(request.headers.get('Content-Length'));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
        throw new InputError('Заявка слишком большая.');
    }

    if (!request.body) {
        throw new InputError('Заявка пустая или слишком большая.');
    }

    const reader = request.body.getReader();
    const chunks = [];
    let byteLength = 0;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        byteLength += value.byteLength;
        if (byteLength > MAX_BODY_BYTES) {
            await reader.cancel('Request body exceeds the limit.').catch(() => {});
            throw new InputError('Заявка пустая или слишком большая.');
        }
        chunks.push(value);
    }

    if (byteLength === 0) {
        throw new InputError('Заявка пустая или слишком большая.');
    }

    const bytes = new Uint8Array(byteLength);
    let offset = 0;
    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
    }

    try {
        return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    } catch {
        throw new InputError('Неверный JSON.');
    }
}

export async function handleSend(request, env, fetchImpl = fetch) {
    const requestUrl = new URL(request.url);
    const origin = request.headers.get('Origin');
    if (origin !== requestUrl.origin) {
        return jsonResponse({ ok: false, message: 'Запрос отклонён.' }, 403);
    }

    const fetchSite = request.headers.get('Sec-Fetch-Site');
    if (fetchSite && fetchSite !== 'same-origin') {
        return jsonResponse({ ok: false, message: 'Запрос отклонён.' }, 403);
    }

    if (!env.LEAD_RATE_LIMITER?.limit) {
        console.error('Lead rate limiter is not configured.');
        return jsonResponse({ ok: false, message: 'Форма временно недоступна.' }, 503);
    }

    const clientKey = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimit = await env.LEAD_RATE_LIMITER.limit({ key: `lead:${clientKey}` });
    if (!rateLimit.success) {
        return jsonResponse(
            { ok: false, message: 'Слишком много попыток. Подождите минуту и повторите.' },
            429,
            { 'Retry-After': '60' }
        );
    }

    try {
        const body = await readJsonBody(request);
        const lead = parseLead(body);
        const quote = createQuote(lead);
        const notificationSent = await notifyTelegram(quote, env, fetchImpl);
        return jsonResponse({ ok: true, notificationSent, quote });
    } catch (error) {
        if (error instanceof InputError) {
            return jsonResponse({ ok: false, message: error.message }, 400);
        }
        console.error(`Lead handler failed: ${error?.name || 'Error'}.`);
        return jsonResponse({ ok: false, message: 'Не удалось обработать заявку.' }, 500);
    }
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname === '/health') {
            if (request.method !== 'GET') {
                return jsonResponse({ ok: false }, 405, { Allow: 'GET' });
            }
            return jsonResponse({ ok: true });
        }

        if (url.pathname === '/send') {
            if (request.method !== 'POST') {
                return jsonResponse({ ok: false, message: 'Метод не поддерживается.' }, 405, { Allow: 'POST' });
            }
            return handleSend(request, env);
        }

        return env.ASSETS.fetch(request);
    }
};
