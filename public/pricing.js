export const AREA_MIN = 500;
export const AREA_MAX = 150_000;
export const AREA_STEP = 10;
export const AUDIT_RATE = 3_000;
export const SUPPORTED_LOCALES = Object.freeze(['ru', 'uz', 'en']);
export const AUTO_QUOTE_AREA_MAX = 50_000;
export const UNAVAILABLE_SYSTEM_IDS = Object.freeze(['low_current']);
export const SERVICE_MINIMUMS = Object.freeze({
    conditioning: 2_200_000,
    heating: 1_200_000,
    ventilation: 1_500_000,
    electricity: 2_800_000,
    water: 1_200_000,
    sewerage: 800_000
});

// Each rate applies only to the part of the area inside its band. This keeps
// large-facility estimates realistic without retroactively discounting the
// first square metres when a facility crosses a threshold.
export const SERVICE_AREA_TIERS = Object.freeze([
    Object.freeze({ upTo: 2_000, multiplierPercent: 100 }),
    Object.freeze({ upTo: 5_000, multiplierPercent: 90 }),
    Object.freeze({ upTo: 10_000, multiplierPercent: 80 }),
    Object.freeze({ upTo: 25_000, multiplierPercent: 70 }),
    Object.freeze({ upTo: 50_000, multiplierPercent: 60 }),
    Object.freeze({ upTo: 100_000, multiplierPercent: 50 }),
    Object.freeze({ upTo: AREA_MAX, multiplierPercent: 40 })
]);

export const AUDIT_AREA_TIERS = Object.freeze([
    Object.freeze({ upTo: 2_000, rate: AUDIT_RATE }),
    Object.freeze({ upTo: 5_000, rate: 2_400 }),
    Object.freeze({ upTo: 10_000, rate: 1_800 }),
    Object.freeze({ upTo: 25_000, rate: 1_300 }),
    Object.freeze({ upTo: 50_000, rate: 900 }),
    Object.freeze({ upTo: 100_000, rate: 600 }),
    Object.freeze({ upTo: AREA_MAX, rate: 400 })
]);

const LABELS = Object.freeze({
    ru: Object.freeze({
        modes: Object.freeze({ service: 'Абонентское обслуживание', audit: 'Технический аудит' }),
        periods: Object.freeze({ service: 'сум/мес', audit: 'сум, разово' }),
        objectTypes: Object.freeze({
            office: 'Административное здание / офис', bc: 'Бизнес-центр', bank: 'Банк / объект с контролируемым доступом', mall: 'Торговый центр', hotel: 'Гостиница / отель', warehouse: 'Склад / цех', clinic: 'Медицинский центр'
        }),
        systems: Object.freeze({
            conditioning: 'Кондиционирование', heating: 'Отопление', ventilation: 'Вентиляция', electricity: 'Электроснабжение', water: 'Водоснабжение', low_current: 'Слаботочные системы / СКУД', sewerage: 'Канализация'
        })
    }),
    uz: Object.freeze({
        modes: Object.freeze({ service: 'Abonent texnik xizmati', audit: 'Texnik audit' }),
        periods: Object.freeze({ service: 'so‘m/oy', audit: 'so‘m, bir martalik' }),
        objectTypes: Object.freeze({
            office: 'Ma’muriy bino / ofis', bc: 'Biznes markazi', bank: 'Bank / rejimli obyekt', mall: 'Savdo markazi', hotel: 'Mehmonxona', warehouse: 'Ombor / sex', clinic: 'Tibbiyot markazi'
        }),
        systems: Object.freeze({
            conditioning: 'Konditsionerlash', heating: 'Isitish', ventilation: 'Ventilyatsiya', electricity: 'Elektr ta’minoti', water: 'Suv ta’minoti', low_current: 'Past tok / SKUD', sewerage: 'Kanalizatsiya'
        })
    }),
    en: Object.freeze({
        modes: Object.freeze({ service: 'Ongoing maintenance', audit: 'Technical audit' }),
        periods: Object.freeze({ service: 'UZS/month', audit: 'UZS, one-off' }),
        objectTypes: Object.freeze({
            office: 'Administrative building / office', bc: 'Business centre', bank: 'Bank / restricted facility', mall: 'Shopping centre', hotel: 'Hotel', warehouse: 'Warehouse / workshop', clinic: 'Medical centre'
        }),
        systems: Object.freeze({
            conditioning: 'Air conditioning', heating: 'Heating', ventilation: 'Ventilation', electricity: 'Electrical systems', water: 'Water supply', low_current: 'Low-voltage / access control', sewerage: 'Drainage'
        })
    })
});

export const OBJECT_TYPES = Object.freeze({
    office: Object.freeze({ multiplierPercent: 100 }),
    bc: Object.freeze({ multiplierPercent: 100 }),
    bank: Object.freeze({ multiplierPercent: 130 }),
    mall: Object.freeze({ multiplierPercent: 120 }),
    hotel: Object.freeze({ multiplierPercent: 145 }),
    warehouse: Object.freeze({ multiplierPercent: 85 }),
    clinic: Object.freeze({ multiplierPercent: 160 })
});

export const ENGINEERING_SYSTEMS = Object.freeze({
    conditioning: Object.freeze({ rate: 3_200 }),
    heating: Object.freeze({ rate: 1_600 }),
    ventilation: Object.freeze({ rate: 1_800 }),
    electricity: Object.freeze({ rate: 2_400 }),
    water: Object.freeze({ rate: 1_000 }),
    low_current: Object.freeze({ rate: 1_500 }),
    sewerage: Object.freeze({ rate: 500 })
});

export const AUDIT_SYSTEM_IDS = Object.freeze(
    Object.keys(ENGINEERING_SYSTEMS).filter((id) => !UNAVAILABLE_SYSTEM_IDS.includes(id))
);

export function normalizeArea(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return AREA_MIN;

    const clamped = Math.min(AREA_MAX, Math.max(AREA_MIN, numericValue));
    return AREA_MIN + Math.round((clamped - AREA_MIN) / AREA_STEP) * AREA_STEP;
}

function calculateTieredAmount(area, tiers, tierRate) {
    let lowerBound = 0;
    let amount = 0;

    for (const tier of tiers) {
        const upperBound = Math.min(area, tier.upTo);
        const areaInTier = Math.max(0, upperBound - lowerBound);
        amount += areaInTier * tierRate(tier);

        if (area <= tier.upTo) break;
        lowerBound = tier.upTo;
    }

    return amount;
}

export function calculateQuote({ area, mode, type, systemIds, locale = 'ru' }) {
    if (!Number.isInteger(area) || area < AREA_MIN || area > AREA_MAX || (area - AREA_MIN) % AREA_STEP !== 0) {
        throw new TypeError('Некорректная площадь');
    }
    if (mode !== 'service' && mode !== 'audit') {
        throw new TypeError('Некорректный тип расчёта');
    }
    if (typeof type !== 'string' || !Object.hasOwn(OBJECT_TYPES, type)) {
        throw new TypeError('Неизвестный тип объекта');
    }
    const objectType = OBJECT_TYPES[type];
    if (!SUPPORTED_LOCALES.includes(locale)) {
        throw new TypeError('Неизвестный язык');
    }
    const labels = LABELS[locale];
    if (!Array.isArray(systemIds)) {
        throw new TypeError('Инженерные системы должны быть массивом');
    }

    const uniqueSystemIds = [...new Set(systemIds)];
    if (uniqueSystemIds.some((id) => UNAVAILABLE_SYSTEM_IDS.includes(id))) {
        throw new TypeError('Слаботочные системы и СКУД временно недоступны для расчёта и аудита.');
    }
    if (
        uniqueSystemIds.length !== systemIds.length
        || uniqueSystemIds.some((id) => typeof id !== 'string' || !Object.hasOwn(ENGINEERING_SYSTEMS, id))
    ) {
        throw new TypeError('Неизвестная инженерная система');
    }
    if (mode === 'service' && uniqueSystemIds.length === 0) {
        throw new TypeError('Выберите хотя бы одну инженерную систему');
    }
    if (mode === 'audit' && uniqueSystemIds.length !== 0) {
        throw new TypeError('Для технического аудита инженерные системы не выбираются');
    }

    const systemRate = uniqueSystemIds.reduce((sum, id) => sum + ENGINEERING_SYSTEMS[id].rate, 0);
    const baseTotal = mode === 'service'
        ? calculateTieredAmount(
            area,
            SERVICE_AREA_TIERS,
            (tier) => (systemRate * tier.multiplierPercent) / 100
        )
        : calculateTieredAmount(area, AUDIT_AREA_TIERS, (tier) => tier.rate);
    const total = Math.round((baseTotal * objectType.multiplierPercent) / 100);

    return Object.freeze({
        area,
        mode,
        modeLabel: labels.modes[mode],
        type,
        typeLabel: labels.objectTypes[type],
        systemIds: Object.freeze(uniqueSystemIds),
        systemLabels: Object.freeze((mode === 'audit' ? AUDIT_SYSTEM_IDS : uniqueSystemIds).map((id) => labels.systems[id])),
        excludedSystemIds: UNAVAILABLE_SYSTEM_IDS,
        rate: Math.round(total / area),
        total,
        pricePeriod: labels.periods[mode],
        locale
    });
}

// Shared commercial gate. A request for engineering review can never unlock
// an automatic quote or turn an unverified equipment count into a price.
export function evaluateQuote({ assessment = 'standard', ...parameters }) {
    if (!['standard', 'individual'].includes(assessment)) {
        throw new TypeError('Некорректный формат обследования.');
    }
    const calculation = calculateQuote(parameters);
    const count = calculation.systemIds.length;
    const minimumContract = calculation.mode === 'audit' ? 0
        : count === 1 ? SERVICE_MINIMUMS[calculation.systemIds[0]]
            : count <= 3 ? 5_000_000 : 10_000_000;
    const reason = assessment === 'individual' ? 'individual_review'
        : calculation.area > AUTO_QUOTE_AREA_MAX ? 'large_facility'
            : calculation.total < minimumContract ? 'minimum_contract' : 'eligible';
    const showPrice = reason === 'eligible' || reason === 'large_facility';
    return Object.freeze({
        ...calculation,
        assessment,
        total: showPrice ? calculation.total : null,
        rate: showPrice ? calculation.rate : null,
        eligibility: Object.freeze({
            reason,
            canAutoQuote: reason === 'eligible',
            minimumContract
        })
    });
}
