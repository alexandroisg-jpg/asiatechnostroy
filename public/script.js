import { calculateQuote, normalizeArea } from '/pricing.js';
import { CLIENT_LOCALES } from '/i18n.js';

const PHONE_PREFIX = '998';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const localeKey = Object.hasOwn(CLIENT_LOCALES, document.body.dataset.locale)
    ? document.body.dataset.locale
    : 'ru';
const locale = CLIENT_LOCALES[localeKey];
const text = locale.calculator;

function formatMoney(value) {
    return Number(value).toLocaleString(locale.intlLocale);
}

function formatPhone(value) {
    let digits = String(value ?? '').replace(/\D/g, '');
    if (digits.startsWith(PHONE_PREFIX)) digits = digits.slice(PHONE_PREFIX.length);
    digits = digits.slice(0, 9);

    let formatted = '+998';
    if (digits.length > 0) formatted += ` (${digits.slice(0, 2)}`;
    if (digits.length >= 2) formatted += ')';
    if (digits.length > 2) formatted += ` ${digits.slice(2, 5)}`;
    if (digits.length > 5) formatted += `-${digits.slice(5, 7)}`;
    if (digits.length > 7) formatted += `-${digits.slice(7, 9)}`;
    return formatted;
}

function normalizePhone(value) {
    const digits = String(value ?? '').replace(/\D/g, '');
    return digits.length === 12 && digits.startsWith(PHONE_PREFIX) ? `+${digits}` : null;
}

function setStatus(element, message, type = '') {
    if (!element) return;
    element.textContent = message;
    element.dataset.type = type;
}

function drawWrappedText(context, value, x, y, maxWidth, lineHeight, maxLines = 20) {
    const words = String(value ?? '').trim().split(/\s+/).filter(Boolean);
    const lines = [];
    let currentLine = '';

    for (const word of words) {
        const candidate = currentLine ? `${currentLine} ${word}` : word;
        if (context.measureText(candidate).width <= maxWidth) {
            currentLine = candidate;
            continue;
        }
        if (currentLine) lines.push(currentLine);
        currentLine = word;
        if (lines.length >= maxLines - 1) break;
    }

    if (currentLine && lines.length < maxLines) lines.push(currentLine);
    lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
    return y + lines.length * lineHeight;
}

function canvasToJpeg(canvas) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error(text.statusFailure));
                return;
            }
            resolve(blob);
        }, 'image/jpeg', 0.92);
    });
}

function concatenateBytes(parts) {
    const length = parts.reduce((sum, part) => sum + part.length, 0);
    const result = new Uint8Array(length);
    let offset = 0;
    for (const part of parts) {
        result.set(part, offset);
        offset += part.length;
    }
    return result;
}

function createSingleImagePdf(jpegBytes, width, height) {
    const encoder = new TextEncoder();
    const encode = (value) => encoder.encode(value);
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const pageContent = encode(`q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im0 Do\nQ\n`);
    const objects = [
        [encode('<< /Type /Catalog /Pages 2 0 R >>')],
        [encode('<< /Type /Pages /Kids [3 0 R] /Count 1 >>')],
        [encode(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /ProcSet [/PDF /ImageC] /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`)],
        [
            encode(`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`),
            jpegBytes,
            encode('\nendstream')
        ],
        [encode(`<< /Length ${pageContent.length} >>\nstream\n`), pageContent, encode('endstream')]
    ];

    const parts = [encode('%PDF-1.4\n% AsiaTechnoStroy\n')];
    const offsets = [0];
    let byteLength = parts[0].length;

    objects.forEach((bodyParts, index) => {
        offsets.push(byteLength);
        const objectParts = [encode(`${index + 1} 0 obj\n`), ...bodyParts, encode('\nendobj\n')];
        parts.push(...objectParts);
        byteLength += objectParts.reduce((sum, part) => sum + part.length, 0);
    });

    const xrefOffset = byteLength;
    const xrefEntries = offsets.slice(1)
        .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
        .join('');
    parts.push(encode(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${xrefEntries}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`));
    return concatenateBytes(parts);
}

async function buildQuotePdf(quote) {
    if (document.fonts?.ready) await document.fonts.ready;

    const canvas = document.createElement('canvas');
    canvas.width = 1240;
    canvas.height = 1754;
    const context = canvas.getContext('2d');
    if (!context) throw new Error(text.statusFailure);

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#07111f';
    context.fillRect(0, 0, canvas.width, 260);
    context.fillStyle = '#00cfe0';
    context.fillRect(0, 254, canvas.width, 6);
    context.textBaseline = 'top';
    context.fillStyle = '#00e8f4';
    context.font = '700 30px Inter, Arial, sans-serif';
    context.fillText('ASIATECHNOSTROY', 90, 62);
    context.fillStyle = '#ffffff';
    context.font = '800 52px Inter, Arial, sans-serif';
    context.fillText(text.pdfTitle, 90, 116);
    context.fillStyle = '#a9b7c9';
    context.font = '500 24px Inter, Arial, sans-serif';
    context.fillText(`№ ${quote.number}  •  ${quote.date}`, 90, 198);

    const drawSectionTitle = (title, y) => {
        context.fillStyle = '#0b1728';
        context.font = '800 28px Inter, Arial, sans-serif';
        context.fillText(title, 90, y);
        context.fillStyle = '#00b8c7';
        context.fillRect(90, y + 42, 90, 4);
        return y + 76;
    };

    const drawLabelValue = (label, value, y) => {
        context.fillStyle = '#657387';
        context.font = '700 19px Inter, Arial, sans-serif';
        context.fillText(label.toUpperCase(), 90, y);
        context.fillStyle = '#101b2b';
        context.font = '600 27px Inter, Arial, sans-serif';
        return drawWrappedText(context, value, 90, y + 32, 1060, 36, 3) + 22;
    };

    let y = drawSectionTitle(text.pdfClient, 318);
    y = drawLabelValue(text.pdfName, quote.name, y);
    y = drawLabelValue(text.pdfObject, quote.object, y);
    y = drawLabelValue(text.pdfPhone, quote.phone, y);
    y = drawSectionTitle(text.pdfParameters, y + 14);
    y = drawLabelValue(text.pdfFormat, quote.modeLabel, y);
    y = drawLabelValue(text.pdfType, quote.typeLabel, y);
    y = drawLabelValue(text.pdfArea, `${formatMoney(quote.area)} m²`, y);
    const systemsText = quote.systemLabels?.length ? quote.systemLabels.join(' • ') : text.pdfAuditSystems;
    y = drawLabelValue(text.pdfSystems, systemsText, y);

    const totalTop = Math.max(y + 36, 1320);
    context.fillStyle = '#eef8fa';
    context.fillRect(70, totalTop, 1100, 220);
    context.strokeStyle = '#00b8c7';
    context.lineWidth = 3;
    context.strokeRect(70, totalTop, 1100, 220);
    context.fillStyle = '#516174';
    context.font = '700 22px Inter, Arial, sans-serif';
    context.fillText(text.pdfBudget, 110, totalTop + 42);
    context.fillStyle = '#07111f';
    context.font = '900 58px Inter, Arial, sans-serif';
    context.fillText(formatMoney(quote.total), 110, totalTop + 88);
    context.fillStyle = '#00a8b7';
    context.font = '800 25px Inter, Arial, sans-serif';
    context.fillText(quote.pricePeriod, 110, totalTop + 164);
    context.fillStyle = '#667589';
    context.font = '500 19px Inter, Arial, sans-serif';
    drawWrappedText(context, text.pdfNote, 90, 1600, 1060, 28, 4);

    const jpegBlob = await canvasToJpeg(canvas);
    const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
    return createSingleImagePdf(jpegBytes, canvas.width, canvas.height);
}

async function downloadQuotePdf(quote) {
    const pdfBytes = await buildQuotePdf(quote);
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AsiaTechnoStroy_${quote.mode}_${quote.number}.pdf`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2_000);
}

document.addEventListener('DOMContentLoaded', () => {
    const revealElements = document.querySelectorAll('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window)) {
        revealElements.forEach((element) => element.classList.add('visible'));
    } else {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.1 });
        revealElements.forEach((element) => observer.observe(element));
    }

    const header = document.querySelector('.header');
    const navToggle = document.querySelector('.nav-toggle');
    const menu = document.querySelector('.header__menu');
    const closeMenu = () => {
        header?.classList.remove('menu-open');
        document.body.classList.remove('nav-open');
        navToggle?.setAttribute('aria-expanded', 'false');
        if (navToggle) navToggle.setAttribute('aria-label', navToggle.dataset.openLabel || 'Menu');
    };
    navToggle?.addEventListener('click', () => {
        const opening = !header?.classList.contains('menu-open');
        header?.classList.toggle('menu-open', opening);
        document.body.classList.toggle('nav-open', opening);
        navToggle.setAttribute('aria-expanded', String(opening));
        navToggle.setAttribute('aria-label', opening ? navToggle.dataset.closeLabel : navToggle.dataset.openLabel);
    });
    menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
    document.addEventListener('pointerdown', (event) => {
        if (
            header?.classList.contains('menu-open')
            && !menu?.contains(event.target)
            && !navToggle?.contains(event.target)
        ) closeMenu();
    });
    window.addEventListener('resize', () => {
        if (navToggle && getComputedStyle(navToggle).display === 'none') closeMenu();
    }, { passive: true });
    const updateHeader = () => header?.classList.toggle('shrunk', window.scrollY > 60);
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });

    const video = document.getElementById('heroVideo');
    const poster = document.querySelector('.hero-poster');
    if (video && poster) {
        if (reduceMotion) {
            video.pause();
        } else {
            const hidePoster = () => poster.classList.add('fade-out');
            if (video.readyState >= 3) hidePoster();
            video.addEventListener('canplay', hidePoster, { once: true });
            video.play().catch(() => {});
        }
    }

    const year = document.getElementById('copyright-year');
    if (year) year.textContent = String(new Date().getFullYear());

    const elements = {
        calculator: document.querySelector('.calc-container'),
        areaInput: document.getElementById('area-input'),
        areaRange: document.getElementById('area-range'),
        total: document.getElementById('total-price'),
        priceAnnouncement: document.getElementById('price-announcement'),
        period: document.getElementById('price-period'),
        resultNote: document.getElementById('result-note'),
        typeButtons: [...document.querySelectorAll('.type-card')],
        systems: [...document.querySelectorAll('.system-item input[data-system]')],
        systemsSetting: document.querySelector('[data-service-controls]'),
        auditCoverage: document.querySelector('[data-audit-coverage]'),
        tabs: [...document.querySelectorAll('.tab-btn')],
        orderButton: document.querySelector('.btn-order'),
        calcStatus: document.getElementById('calcStatus'),
        modal: document.getElementById('modalOrder'),
        modalTitle: document.getElementById('modal-title'),
        closeModalButton: document.querySelector('.modal-close'),
        displayArea: document.getElementById('display-area'),
        form: document.getElementById('orderForm'),
        nameInput: document.getElementById('userName'),
        objectInput: document.getElementById('objName'),
        phoneInput: document.getElementById('userPhone'),
        formStatus: document.getElementById('formStatus'),
        languageLinks: [...document.querySelectorAll('.language-switch__link')]
    };

    if (!elements.calculator || !elements.areaRange || !elements.total) {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeMenu();
        });
        return;
    }

    const defaultMode = elements.calculator.dataset.defaultMode === 'audit' ? 'audit' : 'service';
    const urlState = new URLSearchParams(window.location.search);
    const requestedMode = urlState.get('calcMode');
    const restoredMode = defaultMode === 'audit'
        ? 'audit'
        : requestedMode === 'audit' || requestedMode === 'service' ? requestedMode : defaultMode;
    const validTypes = new Set(elements.typeButtons.map((button) => button.dataset.type));
    const requestedType = urlState.get('calcType');
    const restoredType = requestedType && validTypes.has(requestedType) ? requestedType : 'office';
    const validSystems = new Set(elements.systems.map((input) => input.dataset.system));
    const requestedSystems = urlState.has('calcSystems')
        ? urlState.get('calcSystems').split(',').filter((id) => validSystems.has(id))
        : null;
    const requestedArea = Number(urlState.get('calcArea'));
    const restoredArea = urlState.has('calcArea') && Number.isFinite(requestedArea)
        ? normalizeArea(requestedArea)
        : normalizeArea(elements.areaRange.value);
    const state = {
        area: restoredArea,
        mode: restoredMode,
        type: restoredType,
        quote: null,
        displayedTotal: 0,
        animationFrame: null,
        formStartedAt: 0,
        lastFocused: null
    };

    elements.typeButtons.forEach((button) => {
        const selected = button.dataset.type === state.type;
        button.classList.toggle('active', selected);
        button.setAttribute('aria-pressed', String(selected));
    });
    if (requestedSystems) {
        elements.systems.forEach((input) => { input.checked = requestedSystems.includes(input.dataset.system); });
    }

    const checkedSystemIds = () => elements.systems
        .filter((input) => input.checked)
        .map((input) => input.dataset.system);
    const selectedSystemIds = () => state.mode === 'audit' ? [] : checkedSystemIds();

    const updateLanguageLinks = () => {
        elements.languageLinks.forEach((link) => {
            const baseHref = link.dataset.baseHref || link.getAttribute('href');
            link.dataset.baseHref = baseHref;
            const target = new URL(baseHref, window.location.origin);
            target.searchParams.set('calcMode', state.mode);
            target.searchParams.set('calcArea', String(state.area));
            target.searchParams.set('calcType', state.type);
            target.searchParams.set('calcSystems', checkedSystemIds().join(','));
            target.hash = window.location.hash;
            link.href = `${target.pathname}${target.search}${target.hash}`;
        });
    };

    const animatePrice = (target) => {
        if (state.animationFrame) cancelAnimationFrame(state.animationFrame);
        const announcePrice = () => {
            if (elements.priceAnnouncement) {
                elements.priceAnnouncement.textContent = `${text.budget}: ${formatMoney(target)} ${elements.period.textContent}`;
            }
        };
        if (reduceMotion) {
            state.displayedTotal = target;
            elements.total.textContent = formatMoney(target);
            announcePrice();
            return;
        }

        const start = state.displayedTotal;
        const difference = target - start;
        const duration = 420;
        let startedAt;
        const step = (timestamp) => {
            if (startedAt === undefined) startedAt = timestamp;
            const progress = Math.min((timestamp - startedAt) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = progress === 1 ? target : Math.round(start + difference * eased);
            state.displayedTotal = value;
            elements.total.textContent = formatMoney(value);
            if (progress < 1) {
                state.animationFrame = requestAnimationFrame(step);
            } else {
                state.animationFrame = null;
                elements.total.textContent = formatMoney(target);
                announcePrice();
            }
        };
        state.animationFrame = requestAnimationFrame(step);
    };

    const updateModePresentation = () => {
        const auditMode = state.mode === 'audit';
        elements.tabs.forEach((tab) => {
            const selected = tab.dataset.tab === state.mode;
            tab.classList.toggle('active', selected);
            tab.setAttribute('aria-pressed', String(selected));
        });
        elements.systems.forEach((input) => { input.disabled = auditMode; });
        if (elements.systemsSetting) elements.systemsSetting.hidden = auditMode;
        if (elements.auditCoverage) {
            elements.auditCoverage.hidden = !auditMode;
            elements.auditCoverage.classList.toggle('is-visible', auditMode);
        }
        if (elements.resultNote) elements.resultNote.textContent = auditMode ? text.auditNote : text.serviceNote;
        if (elements.orderButton) elements.orderButton.textContent = auditMode ? text.orderAudit : text.orderService;
        if (elements.modalTitle) elements.modalTitle.textContent = auditMode
            ? elements.modalTitle.dataset.auditTitle
            : elements.modalTitle.dataset.serviceTitle;
        const submit = elements.form?.querySelector('button[type="submit"]');
        const submitLabel = submit?.querySelector('span');
        if (submit && submitLabel) {
            submitLabel.textContent = auditMode ? submit.dataset.auditLabel : submit.dataset.serviceLabel;
        }
    };

    const updateQuote = () => {
        try {
            state.quote = calculateQuote({
                area: state.area,
                mode: state.mode,
                type: state.type,
                systemIds: selectedSystemIds(),
                locale: localeKey
            });
            elements.period.textContent = state.quote.pricePeriod;
            setStatus(elements.calcStatus, '');
            animatePrice(state.quote.total);
        } catch {
            state.quote = null;
            elements.period.textContent = state.mode === 'service' ? text.servicePeriod : text.auditPeriod;
            setStatus(elements.calcStatus, state.mode === 'service' ? text.statusSelection : text.statusQuoteError, 'error');
            animatePrice(0);
        }
        updateLanguageLinks();
    };

    const setArea = (value) => {
        state.area = normalizeArea(value);
        elements.areaInput.value = state.area;
        elements.areaRange.value = state.area;
        updateQuote();
    };

    elements.areaRange.addEventListener('input', (event) => setArea(event.target.value));
    elements.areaInput?.addEventListener('input', (event) => {
        const rawValue = event.target.value.trim();
        const numericValue = Number(rawValue);
        const minimum = Number(elements.areaInput.min);
        const maximum = Number(elements.areaInput.max);
        if (!rawValue || !Number.isFinite(numericValue) || numericValue < minimum || numericValue > maximum) return;
        state.area = normalizeArea(numericValue);
        elements.areaRange.value = state.area;
        updateQuote();
    });
    elements.areaInput?.addEventListener('change', (event) => setArea(event.target.value));
    elements.areaInput?.addEventListener('blur', (event) => setArea(event.target.value));

    elements.typeButtons.forEach((button) => {
        button.addEventListener('click', () => {
            state.type = button.dataset.type;
            elements.typeButtons.forEach((item) => {
                const selected = item === button;
                item.classList.toggle('active', selected);
                item.setAttribute('aria-pressed', String(selected));
            });
            updateQuote();
        });
    });

    elements.systems.forEach((input) => input.addEventListener('change', updateQuote));
    elements.tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            state.mode = tab.dataset.tab;
            updateModePresentation();
            updateQuote();
        });
    });

    const fieldErrors = new Map([
        [elements.nameInput, document.getElementById('userName-error')],
        [elements.objectInput, document.getElementById('objName-error')],
        [elements.phoneInput, document.getElementById('userPhone-error')]
    ].filter(([input, error]) => input && error));
    const setFieldError = (input, invalid) => {
        const error = fieldErrors.get(input);
        if (!error) return;
        if (invalid) {
            input.setAttribute('aria-invalid', 'true');
            error.hidden = false;
        } else {
            input.removeAttribute('aria-invalid');
            error.hidden = true;
        }
    };
    const resetFieldErrors = () => fieldErrors.forEach((_, input) => setFieldError(input, false));
    fieldErrors.forEach((_, input) => input.addEventListener('input', () => setFieldError(input, false)));

    const closeModal = () => {
        elements.modal?.classList.remove('active');
        elements.modal?.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        state.lastFocused?.focus();
    };

    const openModal = () => {
        if (!state.quote) {
            setStatus(elements.calcStatus, text.statusSelection, 'error');
            elements.systems[0]?.focus();
            return;
        }
        state.lastFocused = document.activeElement;
        state.formStartedAt = Date.now();
        elements.displayArea.textContent = formatMoney(state.area);
        setStatus(elements.formStatus, '');
        resetFieldErrors();
        updateModePresentation();
        elements.modal?.classList.add('active');
        elements.modal?.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        window.setTimeout(() => document.getElementById('userName')?.focus(), 100);
    };

    elements.orderButton?.addEventListener('click', openModal);
    elements.closeModalButton?.addEventListener('click', closeModal);
    elements.modal?.addEventListener('click', (event) => {
        if (event.target === elements.modal) closeModal();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeMenu();
            if (elements.modal?.classList.contains('active')) {
                event.preventDefault();
                closeModal();
            }
            return;
        }
        if (event.key !== 'Tab' || !elements.modal?.classList.contains('active')) return;
        const focusable = [...elements.modal.querySelectorAll('button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), a[href]')];
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    elements.phoneInput?.addEventListener('input', (event) => {
        event.target.value = formatPhone(event.target.value);
    });
    elements.phoneInput?.addEventListener('focus', (event) => {
        if (!event.target.value) event.target.value = '+998 ';
    });

    elements.form?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const name = elements.nameInput?.value.trim() ?? '';
        const object = elements.objectInput?.value.trim() ?? '';
        const phone = normalizePhone(elements.phoneInput?.value);
        const website = document.getElementById('companyWebsite')?.value ?? '';

        const invalidFields = [
            [elements.nameInput, name.length < 2 || name.length > 80],
            [elements.objectInput, object.length < 2 || object.length > 120],
            [elements.phoneInput, !phone]
        ].filter(([input, invalid]) => input && invalid);
        resetFieldErrors();
        invalidFields.forEach(([input]) => setFieldError(input, true));
        if (invalidFields.length) {
            setStatus(elements.formStatus, text.statusValidation, 'error');
            invalidFields[0][0].focus();
            return;
        }

        updateQuote();
        if (!state.quote) {
            setStatus(elements.formStatus, text.statusQuoteError, 'error');
            return;
        }

        const submitButton = elements.form.querySelector('button[type="submit"]');
        const submitLabel = submitButton.querySelector('span');
        const defaultLabel = state.mode === 'audit' ? submitButton.dataset.auditLabel : submitButton.dataset.serviceLabel;
        submitButton.disabled = true;
        submitButton.setAttribute('aria-busy', 'true');
        submitLabel.textContent = text.statusBusy;
        setStatus(elements.formStatus, text.statusPreparing, 'loading');

        try {
            const response = await fetch('/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    object,
                    phone,
                    area: state.area,
                    mode: state.mode,
                    type: state.type,
                    systemIds: selectedSystemIds(),
                    locale: localeKey,
                    website,
                    formElapsedMs: Date.now() - state.formStartedAt
                })
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.ok || !data.quote) {
                const fallback = response.status === 429 ? text.statusRateLimit : text.statusFailure;
                throw new Error(localeKey === 'ru' && data.message ? data.message : fallback);
            }

            await downloadQuotePdf(data.quote);
            setStatus(elements.formStatus, data.notificationSent ? text.statusSuccess : text.statusWarning, data.notificationSent ? 'success' : 'warning');
            state.formStartedAt = Date.now();
        } catch (error) {
            setStatus(elements.formStatus, error.message || text.statusFailure, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.removeAttribute('aria-busy');
            submitLabel.textContent = defaultLabel;
        }
    });

    window.addEventListener('hashchange', updateLanguageLinks);
    updateModePresentation();
    setArea(state.area);
});
