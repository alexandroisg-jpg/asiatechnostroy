export const AREA_MIN = 500;
export const AREA_MAX = 15_000;
export const AREA_STEP = 10;
export const AUDIT_RATE = 5_000;
export const SUPPORTED_LOCALES = Object.freeze(['ru', 'uz', 'en']);

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

export function normalizeArea(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return AREA_MIN;

    const clamped = Math.min(AREA_MAX, Math.max(AREA_MIN, numericValue));
    return AREA_MIN + Math.round((clamped - AREA_MIN) / AREA_STEP) * AREA_STEP;
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
    const baseRate = mode === 'service' ? systemRate : AUDIT_RATE;
    const total = Math.round((area * baseRate * objectType.multiplierPercent) / 100);

    return Object.freeze({
        area,
        mode,
        modeLabel: labels.modes[mode],
        type,
        typeLabel: labels.objectTypes[type],
        systemIds: Object.freeze(uniqueSystemIds),
        systemLabels: Object.freeze(uniqueSystemIds.map((id) => labels.systems[id])),
        rate: Math.round((baseRate * objectType.multiplierPercent) / 100),
        total,
        pricePeriod: labels.periods[mode],
        locale
    });
}
