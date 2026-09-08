import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { LOCALES } from '../site/content.mjs';
import { evaluateQuote, AUDIT_SYSTEM_IDS, UNAVAILABLE_SYSTEM_IDS } from '../public/pricing.js';

const source = await readFile(new URL('../public/script.js', import.meta.url), 'utf8');
const pdfFunctions = source.slice(source.indexOf('function formatMoney('), source.indexOf('function initializeSite('));

function pdfHarness(locale) {
    const drawings = [];
    const context = {
        font: '24px Arial',
        measureText(value) { return { width: [...String(value)].length * Number(this.font.match(/(\d+)px/u)?.[1] || 24) }; },
        fillText(value, x, y) { drawings.push({ value, x, y, width: this.measureText(value).width }); },
        fillRect(x, y, width, height) { drawings.push({ rectangle: true, x, y, width, height }); },
        strokeRect() {}
    };
    const canvas = { width: 0, height: 0, getContext: () => context, toBlob: (callback) => callback(new Blob([new Uint8Array([255, 216, 255, 217])])) };
    const sandbox = vm.createContext({
        locale, text: locale.calculator, UNAVAILABLE_SYSTEM_IDS, TextEncoder, Uint8Array,
        document: { createElement: () => canvas }
    });
    const build = vm.runInContext(`${pdfFunctions}\nbuildQuotePdf`, sandbox);
    return { build, drawings };
}

test('PDF pricing blocks fit with maximum-length inputs and all six systems in every language', async () => {
    for (const [language, locale] of Object.entries(LOCALES)) {
        for (const mode of ['service', 'audit']) {
            const { build, drawings } = pdfHarness(locale);
            const quote = {
                ...evaluateQuote({ mode, area: 50_000, type: 'bank', systemIds: mode === 'service' ? AUDIT_SYSTEM_IDS : [], locale: language }),
                name: 'W'.repeat(80), object: 'W'.repeat(120), phone: '+998917000000', number: 'TEST', date: '08.09.2026'
            };
            const bytes = await build(quote);
            assert.equal(new TextDecoder().decode(bytes.slice(0, 8)), '%PDF-1.4');
            const budget = drawings.find((item) => item.rectangle && item.height === 220);
            assert.ok(budget && budget.y + budget.height < 1575, `${language}/${mode}: price overlaps notes`);
            const dataRows = drawings.filter((item) => !item.rectangle && item.y >= 394 && item.y < budget.y);
            assert.ok(dataRows.every((item) => item.x + item.width <= 1150), `${language}/${mode}: clipped field`);
            const longText = dataRows.filter((item) => /^W+$/u.test(item.value)).map((item) => item.value).join('');
            assert.equal(longText.length, 200, `${language}/${mode}: long names truncated`);
            const noteLines = drawings.filter((item) => !item.rectangle && item.y >= 1575);
            assert.ok(noteLines.every((item) => item.y + 26 < 1754));
            assert.ok(noteLines.every((item) => !item.value.includes('…')), `${language}/${mode}: scope note truncated`);
        }
    }
});

test('PDF is refused for a blocked or unavailable scope', async () => {
    const { build, drawings } = pdfHarness(LOCALES.ru);
    const blocked = evaluateQuote({ mode: 'service', area: 500, type: 'office', systemIds: ['conditioning'] });
    await assert.rejects(build(blocked));
    const allowed = evaluateQuote({ mode: 'service', area: 1000, type: 'office', systemIds: ['conditioning'] });
    await assert.rejects(build({ ...allowed, systemIds: ['low_current'] }));
    assert.equal(drawings.length, 0);
});
