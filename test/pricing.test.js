import test from 'node:test';
import assert from 'node:assert/strict';

import {
    AREA_MAX,
    AREA_MIN,
    calculateQuote,
    evaluateQuote,
    normalizeArea
} from '../public/pricing.js';

const ALL_SYSTEMS = [
    'conditioning',
    'heating',
    'ventilation',
    'electricity',
    'water',
    'sewerage'
];

test('service pricing matches the published calculator matrix', () => {
    assert.equal(calculateQuote({
        area: 500,
        mode: 'service',
        type: 'office',
        systemIds: ['conditioning']
    }).total, 1_600_000);

    assert.equal(calculateQuote({
        area: 500,
        mode: 'service',
        type: 'bank',
        systemIds: ['conditioning']
    }).total, 2_080_000);

    assert.equal(calculateQuote({
        area: 500,
        mode: 'service',
        type: 'office',
        systemIds: ALL_SYSTEMS
    }).total, 5_250_000);
});

test('service pricing adds each area band at its own marginal rate', () => {
    const quoteAtBoundary = calculateQuote({
        area: 2_000,
        mode: 'service',
        type: 'office',
        systemIds: ['conditioning']
    });
    const quotePastBoundary = calculateQuote({
        area: 2_010,
        mode: 'service',
        type: 'office',
        systemIds: ['conditioning']
    });

    assert.equal(quoteAtBoundary.total, 6_400_000);
    assert.equal(quotePastBoundary.total, 6_428_800);
    assert.notEqual(quotePastBoundary.total, 2_010 * 2_880);
});

test('large service estimates use cumulative bands through 150,000 square metres', () => {
    const expectedTotals = new Map([
        [500, 5_250_000],
        [2_000, 21_000_000],
        [5_000, 49_350_000],
        [10_000, 91_350_000],
        [20_000, 164_850_000],
        [25_000, 201_600_000],
        [50_000, 359_100_000],
        [100_000, 621_600_000],
        [150_000, 831_600_000]
    ]);

    for (const [area, expectedTotal] of expectedTotals) {
        const quote = calculateQuote({
            area,
            mode: 'service',
            type: 'office',
            systemIds: ALL_SYSTEMS
        });
        assert.equal(quote.total, expectedTotal, `unexpected service total for ${area} m2`);
    }
});

test('audit pricing is one-time and independent of service systems', () => {
    const quote = calculateQuote({
        area: 500,
        mode: 'audit',
        type: 'office',
        systemIds: []
    });
    assert.equal(quote.total, 1_500_000);
    assert.equal(quote.pricePeriod, 'сум, разово');
});

test('audit pricing is a lower one-off cumulative scale, not a maintenance rate', () => {
    const expectedTotals = new Map([
        [500, 1_500_000],
        [2_000, 6_000_000],
        [5_000, 13_200_000],
        [10_000, 22_200_000],
        [20_000, 35_200_000],
        [25_000, 41_700_000],
        [50_000, 64_200_000],
        [100_000, 94_200_000],
        [150_000, 114_200_000]
    ]);

    for (const [area, expectedTotal] of expectedTotals) {
        const audit = calculateQuote({
            area,
            mode: 'audit',
            type: 'office',
            systemIds: []
        });
        const service = calculateQuote({
            area,
            mode: 'service',
            type: 'office',
            systemIds: ['conditioning']
        });
        assert.equal(audit.total, expectedTotal, `unexpected audit total for ${area} m2`);
        assert.ok(audit.total < service.total);
    }

    const auditPastBoundary = calculateQuote({
        area: 2_010,
        mode: 'audit',
        type: 'office',
        systemIds: []
    });
    assert.equal(auditPastBoundary.total, 6_024_000);
});

test('object complexity multiplier is applied after cumulative area pricing', () => {
    const office = calculateQuote({
        area: 50_000,
        mode: 'service',
        type: 'office',
        systemIds: ALL_SYSTEMS
    });
    const bank = calculateQuote({
        area: 50_000,
        mode: 'service',
        type: 'bank',
        systemIds: ALL_SYSTEMS
    });

    assert.equal(office.total, 359_100_000);
    assert.equal(bank.total, 466_830_000);
});

test('quote labels are localized while the commercial calculation stays identical', () => {
    const base = {
        area: 500,
        mode: 'service',
        type: 'bank',
        systemIds: ['conditioning', 'ventilation']
    };
    const ru = calculateQuote({ ...base, locale: 'ru' });
    const uz = calculateQuote({ ...base, locale: 'uz' });
    const en = calculateQuote({ ...base, locale: 'en' });

    assert.equal(ru.total, uz.total);
    assert.equal(uz.total, en.total);
    assert.equal(uz.modeLabel, 'Abonent texnik xizmati');
    assert.equal(uz.pricePeriod, 'so‘m/oy');
    assert.equal(en.typeLabel, 'Bank / restricted facility');
    assert.deepEqual(en.systemLabels, ['Air conditioning', 'Ventilation']);
});

test('area normalization clamps and snaps to the public step', () => {
    assert.equal(normalizeArea(100), AREA_MIN);
    assert.equal(normalizeArea(505), 510);
    assert.equal(normalizeArea(149_999), AREA_MAX);
    assert.equal(normalizeArea(150_001), AREA_MAX);
});

test('150,000 square metres is accepted while raw off-step and over-limit areas are rejected', () => {
    const base = { mode: 'service', type: 'office', systemIds: ['conditioning'] };

    assert.equal(calculateQuote({ ...base, area: 150_000 }).area, AREA_MAX);
    assert.throws(() => calculateQuote({ ...base, area: 149_999 }), /площадь/i);
    assert.throws(() => calculateQuote({ ...base, area: 150_010 }), /площадь/i);
});

test('invalid modes, types, areas and system selections are rejected', () => {
    const base = { area: 500, mode: 'service', type: 'office', systemIds: ['conditioning'] };
    assert.throws(() => calculateQuote({ ...base, area: 505 }), /площадь/i);
    assert.throws(() => calculateQuote({ ...base, mode: 'other' }), /тип расчёта/i);
    assert.throws(() => calculateQuote({ ...base, type: 'other' }), /тип объекта/i);
    assert.throws(() => calculateQuote({ ...base, type: '__proto__' }), /тип объекта/i);
    assert.throws(() => calculateQuote({ ...base, type: 'constructor' }), /тип объекта/i);
    assert.throws(() => calculateQuote({ ...base, locale: 'de' }), /язык/i);
    assert.throws(() => calculateQuote({ ...base, systemIds: [] }), /хотя бы одну/i);
    assert.throws(() => calculateQuote({ ...base, systemIds: ['conditioning', 'conditioning'] }), /инженерная система/i);
    assert.throws(() => calculateQuote({ ...base, systemIds: ['unknown'] }), /инженерная система/i);
    assert.throws(() => calculateQuote({ ...base, systemIds: ['toString'] }), /инженерная система/i);
    assert.throws(
        () => calculateQuote({ ...base, mode: 'audit', systemIds: ['conditioning'] }),
        /аудита/i
    );
});

test('single-system thresholds apply after object coefficients and suppress the low price', () => {
    const firstEligibleAreas = { conditioning: 690, heating: 750, ventilation: 840, electricity: 1170, water: 1200, sewerage: 1600 };
    for (const [id, area] of Object.entries(firstEligibleAreas)) {
        const base = { mode: 'service', type: 'office', systemIds: [id] };
        const blocked = evaluateQuote({ ...base, area: area - 10 });
        assert.equal(blocked.eligibility.reason, 'minimum_contract', id);
        assert.equal(blocked.eligibility.canAutoQuote, false);
        assert.equal(blocked.total, null);
        assert.equal(blocked.rate, null);
        assert.equal(evaluateQuote({ ...base, area }).eligibility.canAutoQuote, true, id);
    }
    const base = { area: 500, mode: 'service', systemIds: ['conditioning'] };
    assert.equal(evaluateQuote({ ...base, type: 'bank' }).eligibility.canAutoQuote, false);
    assert.equal(evaluateQuote({ ...base, type: 'clinic' }).eligibility.canAutoQuote, true);
    assert.equal(evaluateQuote({ ...base, type: 'warehouse' }).eligibility.canAutoQuote, false);
});

test('bundle minimum is based on the whole scope, with exact equality accepted', () => {
    const base = { area: 1000, mode: 'service', type: 'office' };
    const two = ['conditioning', 'heating'];
    const three = [...two, 'ventilation'];
    const four = [...three, 'water'];
    assert.equal(evaluateQuote({ ...base, systemIds: two }).total, null);
    assert.equal(evaluateQuote({ ...base, systemIds: three }).total, 6_600_000);
    assert.equal(evaluateQuote({ ...base, systemIds: four }).total, null);
    assert.equal(evaluateQuote({ ...base, systemIds: ALL_SYSTEMS }).total, 10_500_000);
    const exact = evaluateQuote({ ...base, systemIds: ['conditioning', 'ventilation'] });
    assert.equal(exact.total, 5_000_000);
    assert.equal(exact.eligibility.canAutoQuote, true);
    assert.equal(evaluateQuote({ ...base, area: 900, systemIds: ALL_SYSTEMS }).total, null);
});

test('large sites and individual scopes cannot issue an automatic offer in either mode', () => {
    for (const mode of ['service', 'audit']) {
        const base = { mode, type: 'office', systemIds: mode === 'audit' ? [] : ALL_SYSTEMS };
        assert.equal(evaluateQuote({ ...base, area: 50_000 }).eligibility.canAutoQuote, true);
        for (const area of [50_010, 150_000]) {
            const quote = evaluateQuote({ ...base, area });
            assert.equal(quote.eligibility.reason, 'large_facility');
            assert.equal(quote.eligibility.canAutoQuote, false);
            assert.ok(quote.total > 0);
        }
        const review = evaluateQuote({ ...base, area: 1000, assessment: 'individual' });
        assert.equal(review.total, null);
        assert.equal(review.eligibility.reason, 'individual_review');
    }
});

test('unavailable low-voltage systems cannot be priced or included in an audit', () => {
    for (const mode of ['service', 'audit']) {
        assert.throws(() => evaluateQuote({ area: 2000, mode, type: 'office', systemIds: ['low_current'] }), /временно недоступны/u);
    }
    for (const locale of ['ru', 'uz', 'en']) {
        const quote = evaluateQuote({ area: 500, mode: 'audit', type: 'office', systemIds: [], locale });
        assert.equal(quote.systemLabels.length, 6);
        assert.deepEqual(quote.excludedSystemIds, ['low_current']);
        assert.equal(quote.eligibility.canAutoQuote, true);
        assert.equal(quote.total, 1_500_000);
    }
});
