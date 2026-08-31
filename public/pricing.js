export const AREA_MIN = 500;
export const AREA_MAX = 15_000;
export const AREA_STEP = 10;
export const AUDIT_RATE = 5_000;

export const OBJECT_TYPES = Object.freeze({
    office: Object.freeze({ label: 'Административное здание / офис', multiplierPercent: 100 }),
    bc: Object.freeze({ label: 'Бизнес-центр', multiplierPercent: 100 }),
    bank: Object.freeze({ label: 'Банк / режимный объект', multiplierPercent: 130 }),
    mall: Object.freeze({ label: 'Торговый центр', multiplierPercent: 120 }),
    hotel: Object.freeze({ label: 'Гостиница / отель', multiplierPercent: 145 }),
    warehouse: Object.freeze({ label: 'Склад / цех', multiplierPercent: 85 }),
    clinic: Object.freeze({ label: 'Медицинский центр', multiplierPercent: 160 })
});

export const ENGINEERING_SYSTEMS = Object.freeze({
    conditioning: Object.freeze({ label: 'Кондиционирование', rate: 3_200 }),
    heating: Object.freeze({ label: 'Отопление', rate: 1_600 }),
    ventilation: Object.freeze({ label: 'Вентиляция', rate: 1_800 }),
    electricity: Object.freeze({ label: 'Электроснабжение', rate: 2_400 }),
    water: Object.freeze({ label: 'Водоснабжение', rate: 1_000 }),
    low_current: Object.freeze({ label: 'Слаботочка / СКУД', rate: 1_500 }),
    sewerage: Object.freeze({ label: 'Канализация', rate: 500 })
});

export function normalizeArea(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return AREA_MIN;

    const clamped = Math.min(AREA_MAX, Math.max(AREA_MIN, numericValue));
    return AREA_MIN + Math.round((clamped - AREA_MIN) / AREA_STEP) * AREA_STEP;
}

export function calculateQuote({ area, mode, type, systemIds }) {
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
        modeLabel: mode === 'service' ? 'Абонентское обслуживание' : 'Технический аудит',
        type,
        typeLabel: objectType.label,
        systemIds: Object.freeze(uniqueSystemIds),
        systemLabels: Object.freeze(uniqueSystemIds.map((id) => ENGINEERING_SYSTEMS[id].label)),
        rate: Math.round((baseRate * objectType.multiplierPercent) / 100),
        total,
        pricePeriod: mode === 'service' ? 'сум/мес' : 'сум, разово'
    });
}
