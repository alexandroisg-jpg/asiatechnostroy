import { DIRECTION_COPY } from './directions-copy.mjs';

export const DIRECTIONS = Object.freeze({
    conditioning: { number: '01', icon: 'snowflake', image: 'hvac-rooftop.webp', systems: 'conditioning', routes: { ru: '/uslugi/konditsionirovanie/', uz: '/uz/xizmatlar/konditsionerlash/', en: '/en/services/air-conditioning/' } },
    ventilation: { number: '02', icon: 'wind', image: 'ventilation-units.webp', systems: 'ventilation', routes: { ru: '/uslugi/ventilyatsiya/', uz: '/uz/xizmatlar/ventilyatsiya/', en: '/en/services/ventilation/' } },
    heating: { number: '03', icon: 'thermometer', image: 'plant-room.webp', systems: 'heating', routes: { ru: '/uslugi/otoplenie/', uz: '/uz/xizmatlar/isitish/', en: '/en/services/heating/' } },
    electricity: { number: '04', icon: 'zap', image: 'electrical-editorial.webp', illustration: true, systems: 'electricity', routes: { ru: '/uslugi/elektrosnabzhenie/', uz: '/uz/xizmatlar/elektr-taminoti/', en: '/en/services/electrical-maintenance/' } },
    plumbing: { number: '05', icon: 'droplets', image: 'water-editorial.webp', illustration: true, systems: 'water,sewerage', routes: { ru: '/uslugi/santehnika/', uz: '/uz/xizmatlar/santexnika/', en: '/en/services/plumbing/' } }
});

export const DIRECTION_ROUTES = Object.freeze(Object.fromEntries(
    Object.entries(DIRECTIONS).map(([key, value]) => [key, Object.freeze(value.routes)])
));

export const DIRECTION_UI = Object.freeze({
    ru: {
        eyebrow: 'ИНЖЕНЕРНЫЕ НАПРАВЛЕНИЯ / ТАШКЕНТ',
        scope: 'Состав работ', scopeTitle: 'Обслуживание, определённое по оборудованию',
        scopeNote: 'Ниже — возможный состав программы. Конкретные операции, периодичность и материалы фиксируются в договоре.',
        workflow: 'Порядок работы', workflowTitle: 'От исходных данных к рабочему регламенту',
        steps: [
            ['01', 'Уточняем объект', 'Оборудование, документация, режим эксплуатации и доступ. При необходимости — отдельное первичное обследование.'],
            ['02', 'Согласовываем программу', 'Перечень операций, периодичность, материалы, отключения и границы ответственности.'],
            ['03', 'Работаем и фиксируем', 'Выполненные операции, технические замечания и следующие действия — в отчёте для ответственного за объект.']
        ],
        result: 'Результат для заказчика', boundary: 'Что согласовывается отдельно',
        faq: 'Практические вопросы', faqTitle: 'До начала обслуживания',
        budget: 'Оценить бюджет обслуживания', discuss: 'Обсудить состав работ',
        quoteNote: 'Калькулятор даёт ориентир, а не фиксированную оферту. Минимумы договора и условия индивидуального расчёта сохраняются.',
        auditTitle: 'Сначала — техническая картина объекта',
        auditText: 'Если состояние систем и объём работ пока не определены, начнём с обследования. Базовый аудит, расширенная диагностика и регулярное обслуживание — разные программы.',
        related: 'Другие направления', directory: 'Пять направлений. Один порядок работы.',
        directoryText: 'Откройте направление, чтобы посмотреть состав работ, результат и границы обслуживания.',
        details: 'Состав и условия', illustration: 'Техническая иллюстрация · не фотография объекта',
        lowName: 'Слаботочные системы / СКУД', lowText: 'Направление сохранено для дальнейшего развития. Сейчас недоступно для заказа и расчёта.'
    },
    uz: {
        eyebrow: 'MUHANDISLIK YO‘NALISHLARI / TOSHKENT',
        scope: 'Ishlar tarkibi', scopeTitle: 'Uskunaga mos xizmat dasturi',
        scopeNote: 'Quyida dasturga kiritilishi mumkin bo‘lgan ishlar berilgan. Aniq operatsiyalar, davriylik va materiallar shartnomada belgilanadi.',
        workflow: 'Ish tartibi', workflowTitle: 'Boshlang‘ich ma’lumotlardan ish reglamentigacha',
        steps: [
            ['01', 'Obyektni aniqlashtiramiz', 'Uskunalar, hujjatlar, ekspluatatsiya rejimi va kirish shartlari. Zarur bo‘lsa — alohida dastlabki tekshiruv.'],
            ['02', 'Dasturni kelishamiz', 'Operatsiyalar, davriylik, materiallar, o‘chirishlar va javobgarlik chegaralari.'],
            ['03', 'Bajaramiz va qayd etamiz', 'Bajarilgan ishlar, texnik kamchiliklar va keyingi harakatlar obyekt uchun mas’ul shaxsga hisobotda taqdim etiladi.']
        ],
        result: 'Buyurtmachi uchun natija', boundary: 'Alohida kelishiladigan ishlar',
        faq: 'Amaliy savollar', faqTitle: 'Xizmat boshlanishidan oldin',
        budget: 'Xizmat budjetini baholash', discuss: 'Ishlar tarkibini muhokama qilish',
        quoteNote: 'Kalkulyator qat’iy oferta emas, dastlabki hisob beradi. Shartnoma minimumlari va individual hisob shartlari saqlanadi.',
        auditTitle: 'Avval — obyektning texnik holati',
        auditText: 'Tizimlar holati va ishlar hajmi hali aniqlanmagan bo‘lsa, tekshiruvdan boshlaymiz. Bazaviy audit, kengaytirilgan diagnostika va muntazam xizmat — alohida dasturlar.',
        related: 'Boshqa yo‘nalishlar', directory: 'Besh yo‘nalish. Yagona ish tartibi.',
        directoryText: 'Ishlar tarkibi, natija va xizmat chegaralarini ko‘rish uchun yo‘nalishni oching.',
        details: 'Tarkib va shartlar', illustration: 'Texnik illyustratsiya · obyekt fotosurati emas',
        lowName: 'Past tok tizimlari / SKUD', lowText: 'Yo‘nalish kelgusidagi rivojlanish uchun saqlangan. Hozir buyurtma va hisob uchun mavjud emas.'
    },
    en: {
        eyebrow: 'ENGINEERING DISCIPLINES / TASHKENT',
        scope: 'Scope of work', scopeTitle: 'Maintenance defined by the equipment',
        scopeNote: 'The activities below may form part of the programme. Specific tasks, intervals and materials are recorded in the agreement.',
        workflow: 'Working process', workflowTitle: 'From source information to a working plan',
        steps: [
            ['01', 'Establish the scope', 'Equipment, documentation, operating hours and access. A separate initial survey where necessary.'],
            ['02', 'Agree the programme', 'Tasks, intervals, materials, shutdowns and responsibility boundaries.'],
            ['03', 'Complete and document', 'Completed tasks, technical observations and next actions are reported to the person responsible for the facility.']
        ],
        result: 'What the client receives', boundary: 'Agreed separately',
        faq: 'Practical questions', faqTitle: 'Before maintenance begins',
        budget: 'Estimate a maintenance budget', discuss: 'Discuss the scope of work',
        quoteNote: 'The calculator provides an estimate, not a fixed offer. Contract minimums and individual assessment requirements still apply.',
        auditTitle: 'First, establish the technical picture',
        auditText: 'If the system condition and scope are not yet clear, start with a survey. A basic audit, extended diagnostics and regular maintenance are separate programmes.',
        related: 'Other disciplines', directory: 'Five disciplines. One working process.',
        directoryText: 'Explore each discipline for the scope, deliverables and maintenance boundaries.',
        details: 'Scope and terms', illustration: 'Technical illustration · not a facility photograph',
        lowName: 'Low-voltage / Access control', lowText: 'Retained for future development. Currently unavailable for orders and estimates.'
    }
});

export function directionPages(localeKey) {
    return Object.fromEntries(Object.keys(DIRECTIONS).map((key) => [key, Object.freeze({
        ...DIRECTION_COPY[localeKey][key],
        direction: true
    })]));
}
