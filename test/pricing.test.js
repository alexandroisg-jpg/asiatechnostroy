import test from 'node:test';
import assert from 'node:assert/strict';

import {
    AREA_MAX,
    AREA_MIN,
    calculateQuote,
    normalizeArea
} from '../public/pricing.js';

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
        systemIds: [
            'conditioning',
            'heating',
            'ventilation',
            'electricity',
            'water',
            'low_current',
            'sewerage'
        ]
    }).total, 6_000_000);
});

test('audit pricing is one-time and independent of service systems', () => {
    const quote = calculateQuote({
        area: 500,
        mode: 'audit',
        type: 'office',
        systemIds: []
    });
    assert.equal(quote.total, 2_500_000);
    assert.equal(quote.pricePeriod, 'сум, разово');
});

test('area normalization clamps and snaps to the public step', () => {
    assert.equal(normalizeArea(100), AREA_MIN);
    assert.equal(normalizeArea(505), 510);
    assert.equal(normalizeArea(99_999), AREA_MAX);
});

test('invalid modes, types, areas and system selections are rejected', () => {
    const base = { area: 500, mode: 'service', type: 'office', systemIds: ['conditioning'] };
    assert.throws(() => calculateQuote({ ...base, area: 505 }), /площадь/i);
    assert.throws(() => calculateQuote({ ...base, mode: 'other' }), /тип расчёта/i);
    assert.throws(() => calculateQuote({ ...base, type: 'other' }), /тип объекта/i);
    assert.throws(() => calculateQuote({ ...base, type: '__proto__' }), /тип объекта/i);
    assert.throws(() => calculateQuote({ ...base, type: 'constructor' }), /тип объекта/i);
    assert.throws(() => calculateQuote({ ...base, systemIds: [] }), /хотя бы одну/i);
    assert.throws(() => calculateQuote({ ...base, systemIds: ['conditioning', 'conditioning'] }), /инженерная система/i);
    assert.throws(() => calculateQuote({ ...base, systemIds: ['unknown'] }), /инженерная система/i);
    assert.throws(() => calculateQuote({ ...base, systemIds: ['toString'] }), /инженерная система/i);
    assert.throws(
        () => calculateQuote({ ...base, mode: 'audit', systemIds: ['conditioning'] }),
        /аудита/i
    );
});
