/**
 * ASIATECHNOSTROY - Professional Engineering Maintenance
 * ЭТАП 1: Маски, Валидация и Исправленная структура
 */

document.addEventListener('DOMContentLoaded', () => {

    /* 1. ВИЗУАЛЬНЫЕ ЭФФЕКТЫ */
    const initVisuals = () => {
        if (window.lucide) lucide.createIcons();
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });
        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    };

    /* 2. ГЛАВНЫЙ МОДУЛЬ КАЛЬКУЛЯТОРА */
    const initCalculator = () => {
        const DOM = {
            input: document.getElementById('area-input'),
            range: document.getElementById('area-range'),
            total: document.getElementById('total-price'),
            types: document.querySelectorAll('.type-card'),
            systems: document.querySelectorAll('.system-item input'),
            tabs: document.querySelectorAll('.tab-btn'),
            modal: document.getElementById('modalOrder'),
            openModalBtn: document.querySelector('.btn-order'),
            closeModalBtn: document.querySelector('.modal-close'),
            displayArea: document.getElementById('display-area'),
            orderForm: document.getElementById('orderForm'),
            phoneInput: document.getElementById('userPhone')
        };

        if (!DOM.range || !DOM.total) return;

        let state = {
            area: parseInt(DOM.range.value) || 500,
            multiplier: 1.0,
            mode: 'service',
            currentDisplayValue: 0
        };

        const animatePrice = (newVal) => {
            DOM.total.parentElement.classList.remove('updating');
            void DOM.total.offsetWidth; // Магия для перезапуска анимации
            DOM.total.parentElement.classList.add('updating');
            const duration = 600;
            const start = state.currentDisplayValue;
            const end = newVal;
            const startTime = performance.now();
            const step = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const current = Math.floor(start + (end - start) * (1 - Math.pow(2, -10 * progress)));
                DOM.total.innerText = current.toLocaleString('ru-RU');
                state.currentDisplayValue = current;
                if (progress < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        };

        const runLogic = () => {
            let total = 0;
            if (state.mode === 'service') {
                let systemsSum = 0;
                DOM.systems.forEach(s => {
                    if (s.checked) systemsSum += parseFloat(s.getAttribute('data-price') || 0);
                });
                total = state.area * systemsSum * state.multiplier;
            } else {
                total = state.area * 5000 * state.multiplier;
            }
            animatePrice(Math.round(total));
        };

        const updateArea = (val) => {
            let numericVal = parseInt(val);
            if (isNaN(numericVal) || numericVal < 500) numericVal = 500;
            if (numericVal > 15000) numericVal = 15000;
            state.area = numericVal;
            if (DOM.input) DOM.input.value = numericVal;
            DOM.range.value = numericVal;
            runLogic();
        };

        /* ОБРАБОТЧИКИ ПЛОЩАДИ */
        DOM.range.addEventListener('input', (e) => updateArea(e.target.value));
        if (DOM.input) DOM.input.addEventListener('change', (e) => updateArea(e.target.value));

        DOM.types.forEach(card => {
            card.addEventListener('click', function() {
                DOM.types.forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                state.multiplier = parseFloat(this.getAttribute('data-multiplier')) || 1.0;
                runLogic();
            });
        });

        DOM.systems.forEach(s => s.addEventListener('change', runLogic));

        DOM.tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                DOM.tabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                state.mode = this.getAttribute('data-tab');
                runLogic();
            });
        });

        /* --- МАСКА ТЕЛЕФОНА (+998) --- */
        if (DOM.phoneInput) {
            DOM.phoneInput.addEventListener('input', (e) => {
                let matrix = "+998 (__) ___-__-__";
                let i = 0, def = matrix.replace(/\D/g, ""), val = e.target.value.replace(/\D/g, "");
                if (def.length >= val.length) val = def;
                e.target.value = matrix.replace(/./g, a => /[_\d]/.test(a) && i < val.length ? val.charAt(i++) : i >= val.length ? "" : a);
            });
            DOM.phoneInput.addEventListener('focus', () => {
                if (DOM.phoneInput.value === "") DOM.phoneInput.value = "+998 ";
            });
        }

        /* --- МОДАЛЬНОЕ ОКНО --- */
if (DOM.openModalBtn && DOM.modal) {

    DOM.openModalBtn.addEventListener('click', (e) => {
        e.preventDefault();

        if (DOM.displayArea) {
            DOM.displayArea.innerText = state.area;
        }

        DOM.modal.classList.add('active');
        document.body.classList.add('modal-open');
    });

    DOM.closeModalBtn.addEventListener('click', () => {
        DOM.modal.classList.remove('active');
        document.body.classList.remove('modal-open');
    });

}

        /* --- ОТПРАВКА ФОРМЫ С ВАЛИДАЦИЕЙ --- */
        if (DOM.orderForm) {
            DOM.orderForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const name = document.getElementById('userName').value.trim();
                const objName = document.getElementById('objName').value.trim();
                const phone = DOM.phoneInput ? DOM.phoneInput.value.trim() : "";

                // Валидация
                if (name.length < 2 || objName.length < 2 || phone.length < 19) {
                    alert('Пожалуйста, заполните все поля корректно.\nТелефон должен быть в формате +998 (XX) XXX-XX-XX');
                    return;
                }

                const formData = {
                    name,
                    object: objName,
                    phone,
                    area: state.area,
                    total: DOM.total.innerText,
                    systems: Array.from(DOM.systems)
                        .filter(s => s.checked)
                        .map(s => "• " + s.nextElementSibling.querySelector('span').innerText)
                        .join('\n')
                };

                try {
                    const response = await fetch('/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData)
                    });

                    if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `KP_AsiaTechnoStroy.pdf`;
                        a.click();
                        alert('Ваше КП готово!');
                    }
                } catch (err) {
                    console.error("Ошибка:", err);
                }
            });
        }

        runLogic();
    };

    /* 3. ШАПКА И ВИДЕО */
    const initHeader = () => {
        const header = document.querySelector('header');
        if (!header) return;
        window.addEventListener('scroll', () => {
            if (window.scrollY > 60) header.classList.add('shrunk');
            else header.classList.remove('shrunk');
        }, { passive: true });
    };

    const initHeroVideo = () => {
        const video = document.getElementById('heroVideo');
        const poster = document.querySelector('.hero-poster');
        if (!video || !poster) return;
        const playVideo = () => {
            poster.classList.add('fade-out');
            video.play().catch(() => {});
        };
        if (video.readyState >= 3) playVideo();
        else video.addEventListener('canplaythrough', playVideo, { once: true });
    };

    initVisuals();
    initHeader();
    initCalculator();
    initHeroVideo();
});
