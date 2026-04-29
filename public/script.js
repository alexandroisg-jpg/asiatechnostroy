/**
 * ASIATECHNOSTROY - Advanced Engineering Logic
 * Version: 3.0 (Smart State Management)
 */

document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       1. ГЛОБАЛЬНЫЕ ВИЗУАЛЬНЫЕ ЭФФЕКТЫ
       ========================================================================== */
    const initVisuals = () => {
        // Инициализация Lucide
        if (window.lucide) lucide.createIcons();

        // Анимация Reveal (плавное появление блоков)
        const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target); // Оптимизация: анимируем 1 раз
                }
            });
        }, observerOptions);

        document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
    };


    /* ==========================================================================
       2. МОДУЛЬ УМНОГО КАЛЬКУЛЯТОРА
       ========================================================================== */
    const initCalculator = () => {
        const UI = {
            range: document.getElementById('area-range'),
            areaLabel: document.getElementById('area-val'),
            totalPrice: document.getElementById('total-price'),
            typeCards: document.querySelectorAll('.type-card'),
            systems: document.querySelectorAll('.system-item input'),
            tabBtns: document.querySelectorAll('.tab-btn'),
            calcContainer: document.querySelector('.calc-container')
        };

        if (!UI.range || !UI.totalPrice) return;

        // Состояние калькулятора (единый источник истины)
        const state = {
            area: parseInt(UI.range.value),
            multiplier: 1.0,
            mode: 'service',
            lastTotal: 0
        };

        // Плавная анимация чисел (Easing function)
        const animateNumber = (target, start, end, duration = 600) => {
            let startTimestamp = null;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                // Использование easeOutExpo для "дорогого" эффекта замедления в конце
                const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                const current = Math.floor(easeProgress * (end - start) + start);
                
                target.innerText = current.toLocaleString('ru-RU');
                if (progress < 1) window.requestAnimationFrame(step);
            };
            window.requestAnimationFrame(step);
        };

        const updateCalculation = () => {
            let systemsRate = 0;
            UI.systems.forEach(input => {
                if (input.checked) systemsRate += parseFloat(input.dataset.price || 0);
            });

            // Расчет: (Площадь * Сумма тарифов) * Коэффициент объекта
            let newTotal = (state.area * systemsRate) * state.multiplier;

            // Коэффициент для режима "Технический аудит" (30% от чека)
            if (state.mode === 'audit') newTotal *= 0.35;

            // Запуск анимации от старого значения к новому
            animateNumber(UI.totalPrice, state.lastTotal, newTotal);
            state.lastTotal = newTotal;
        };

        // --- ОБРАБОТЧИКИ СОБЫТИЙ ---

        // Слайдер площади
        UI.range.addEventListener('input', (e) => {
            state.area = parseInt(e.target.value);
            UI.areaLabel.innerText = `${state.area} м²`;
            updateCalculation();
        });

        // Типы объектов (Delegation-like)
        UI.typeCards.forEach(card => {
            card.addEventListener('click', () => {
                UI.typeCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                state.multiplier = parseFloat(card.dataset.multiplier || 1);
                updateCalculation();
            });
        });

        // Системы (чекбоксы)
        UI.systems.forEach(input => {
            input.addEventListener('change', updateCalculation);
        });

        // Вкладки (Сервис / Аудит)
        UI.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                UI.tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.mode = btn.dataset.tab;
                updateCalculation();
            });
        });

        // Начальный расчет
        updateCalculation();
    };


    /* ==========================================================================
       3. МОДУЛЬ ГЕРОЙ-ВИДЕО (Оптимизация загрузки)
       ========================================================================== */
    const initHeroSection = () => {
        const video = document.getElementById('heroVideo');
        const poster = document.querySelector('.hero-poster');
        
        if (!video || !poster) return;

        const playVideo = () => {
            video.play()
                .then(() => poster.classList.add('fade-out'))
                .catch(() => console.log("Video auto-play blocked by browser."));
        };

        // Запуск если видео загружено или через страховку в 3 секунды
        video.readyState >= 3 ? playVideo() : video.addEventListener('canplaythrough', playVideo, { once: true });
        setTimeout(playVideo, 3000);
    };


    /* ==========================================================================
       4. МОДУЛЬ ШАПКИ (Scroll Performance)
       ========================================================================== */
    const initHeader = () => {
        const header = document.querySelector('header');
        if (!header) return;

        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    window.scrollY > 60 ? header.classList.add('shrunk') : header.classList.remove('shrunk');
                    ticking = false;
                });
                ticking = true;
            }
        });
    };

    // Запуск всех систем
    initVisuals();
    initCalculator();
    initHeroSection();
    initHeader();
});
