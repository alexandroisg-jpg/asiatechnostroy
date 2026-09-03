import { readFile } from 'node:fs/promises';

const publicRoot = new URL('../public/', import.meta.url);
const keyFilename = 'indexnow-key.txt';
const key = (await readFile(new URL(keyFilename, publicRoot), 'utf8')).trim();
const sitemap = await readFile(new URL('sitemap.xml', publicRoot), 'utf8');
const argumentsList = process.argv.slice(2);
const allowedFlags = new Set(['--check', '--submit']);
const unknownFlags = argumentsList.filter((argument) => argument.startsWith('--') && !allowedFlags.has(argument));

if (unknownFlags.length > 0) throw new Error(`Unknown option: ${unknownFlags.join(', ')}`);
if (argumentsList.includes('--check') && argumentsList.includes('--submit')) {
    throw new Error('Choose either --check or --submit.');
}

if (!/^[A-Za-z0-9-]{8,128}$/u.test(key)) {
    throw new Error('IndexNow key must contain 8–128 letters, numbers, or dashes.');
}

const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/gu)].map((match) => match[1]);
if (sitemapUrls.length === 0) throw new Error('No URLs found in public/sitemap.xml.');

const origin = new URL(sitemapUrls[0]).origin;
const host = new URL(origin).host;
for (const url of sitemapUrls) {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.origin !== origin) {
        throw new Error(`IndexNow URL must use the canonical HTTPS origin: ${url}`);
    }
}

const requestedUrls = argumentsList.filter((argument) => !argument.startsWith('--'));
const urlList = [...new Set(requestedUrls.length > 0
    ? requestedUrls.map((value) => new URL(value, `${origin}/`).href)
    : sitemapUrls)];

if (urlList.length > 10_000) throw new Error('IndexNow accepts at most 10,000 URLs per request.');

for (const url of urlList) {
    if (new URL(url).origin !== origin || !sitemapUrls.includes(url)) {
        throw new Error(`Only canonical sitemap URLs can be submitted: ${url}`);
    }
}

const payload = {
    host,
    key,
    keyLocation: `${origin}/${keyFilename}`,
    urlList
};

if (!argumentsList.includes('--submit')) {
    console.log(`IndexNow configuration is valid for ${urlList.length} URL(s).`);
} else {
    const fetchText = async (url) => {
        let response;
        try {
            response = await fetch(url, {
                redirect: 'error',
                signal: AbortSignal.timeout(15_000)
            });
        } catch (error) {
            throw new Error(`IndexNow preflight failed for ${url}: ${error?.message || 'network error'}`);
        }
        if (response.status !== 200) {
            throw new Error(`IndexNow preflight expected HTTP 200 for ${url}, received ${response.status}.`);
        }
        return response.text();
    };

    const [publishedKey, publishedSitemap] = await Promise.all([
        fetchText(payload.keyLocation),
        fetchText(`${origin}/sitemap.xml`)
    ]);
    if (publishedKey.trim() !== key) {
        throw new Error('The published IndexNow key does not match the local key. Wait for production deployment.');
    }

    const publishedUrls = new Set(
        [...publishedSitemap.matchAll(/<loc>(.*?)<\/loc>/gu)].map((match) => match[1])
    );
    const unpublishedUrls = urlList.filter((url) => !publishedUrls.has(url));
    if (unpublishedUrls.length > 0) {
        throw new Error(`The production sitemap does not contain: ${unpublishedUrls.join(', ')}`);
    }

    const response = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15_000)
    });
    const responseBody = await response.text();

    if (response.status !== 200 && response.status !== 202) {
        throw new Error(`IndexNow rejected the request (${response.status}): ${responseBody}`);
    }

    const statusMessage = response.status === 202 ? 'key verification pending' : 'accepted';
    console.log(`IndexNow ${statusMessage}: ${urlList.length} URL(s) (${response.status}).`);
}
