/**
 * ASIATECHNOSTROY - Advanced Engineering Logic v4.0
 * Модульная архитектура с эффектом инерционной анимации
 */

document.addEventListener('DOMContentLoaded', () => {

    // Вспомогательная функция для плавного форматирования валюты
    const formatCurrency = (val) => Math.round(val).toLocaleString('ru-RU');

    /* ==========================================================================
       1. МОДУЛЬ ИНТЕРФЕЙСА (UI & Visuals)
       ========================================================================== */
    const initVisuals = () => {
        // Инициализация Lucide с защитой
        try { if (window.lucide) lucide.createIcons(); } catch (e) {}

        // Умный Reveal (появление блоков)
        const revealOptions = { threshold: 0.15, rootMargin: "0px 0px -50px 0px" };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, revealOptions);

        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    };

    /* ==========================================================================
       2. ДВИЖОК КАЛЬКУЛЯТОРА (The Engine)
       ========================================================================== */
    const initCalculator = () => {
        const DOM = {
            range: document.getElementById('area-range'),
            total: document.getElementById('total-price'),
            label: document.getElementById('area-val'),
            types: document.querySelectorAll('.type-card'),
            systems: document.querySelectorAll('.system-item input'),
            tabs: document.querySelectorAll('.tab-btn')
        };

        if (!DOM.range || !DOM.total) return;

        // Внутреннее состояние (State)
        let state = {
            area: parseInt(DOM.range.value),
            multiplier: 1.0,
            mode: 'service',
            currentDisplayValue: 0
        };

        // Анимация числа "набеганием" (Easing)
        const animatePrice = (newVal) => {
            const duration = 600; 
            const start = state.currentDisplayValue;
            const end = newVal;
            let startTime = null;

            const step = (timestamp) => {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / duration, 1);
                
                // Функция плавности (Out-Expo)
                const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                const current = Math.floor(ease * (end - start) + start);
                
                DOM.total.innerText = current.toLocaleString('ru-RU');
                
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                } else {
                    state.currentDisplayValue = end;
                }
            };
            window.requestAnimationFrame(step);
        };

        const runLogic = () => {
            let systemsRate = 0;
            
            // Считаем активные системы
            DOM.systems.forEach(s => {
                if (s.checked) systemsRate += parseFloat(s.dataset.price || 0);
            });

            // Базовая формула
            let result = (state.area * systemsRate) * state.multiplier;

            // Логика режима (Аудит обычно дешевле обслуживания в 3 раза)
            if (state.mode === 'audit') result *= 0.35;

            animatePrice(result);
        };

        // --- Event Listeners ---

        // 1. Слайдер с "эффектом тяжести"
        DOM.range.addEventListener('input', (e) => {
            state.area = parseInt(e.target.value);
            DOM.label.innerText = `${state.area} м²`;
            
            // Визуальный фидбек для больших площадей
            DOM.label.style.color = state.area > 7000 ? '#00f2ff' : '';
            DOM.label.style.fontWeight = state.area > 7000 ? '800' : '400';
            
            runLogic();
        });

        // 2. Карточки объектов (с вибро-откликом, если доступно)
        DOM.types.forEach(card => {
            card.addEventListener('click', function() {
                if (window.navigator.vibrate) window.navigator.vibrate(5);
                
                DOM.types.forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                
                state.multiplier = parseFloat(this.dataset.multiplier) || 1.0;
                runLogic();
            });
        });

        // 3. Чекбоксы систем
        DOM.systems.forEach(s => s.addEventListener('change', runLogic));

        // 4. Переключатель табов
        DOM.tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                DOM.tabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                state.mode = this.dataset.tab;
                runLogic();
            });
        });

        // Первый запуск
        runLogic();
    };

    /* ==========================================================================
       3. МОДУЛЬ СКРОЛЛА И ШАПКИ
       ========================================================================== */
    const initHeader = () => {
        const header = document.querySelector('header');
        if (!header) return;

        let lastScroll = 0;
        window.addEventListener('scroll', () => {
            const currentScroll = window.scrollY;
            
            if (currentScroll > 60) {
                header.classList.add('shrunk');
            } else {
                header.classList.remove('shrunk');
            }
            lastScroll = currentScroll;
        }, { passive: true });
    };

    /* ==========================================================================
       4. МОДУЛЬ ВИДЕО (Smart Play)
       ========================================================================== */
    const initHeroVideo = () => {
        const video = document.getElementById('heroVideo');
        const poster = document.querySelector('.hero-poster');
        
        if (!video || !poster) return;

        const startVideo = () => {
            poster.classList.add('fade-out');
            video.play().catch(() => {
                console.log("Видео ждет взаимодействия");
            });
        };

        if (video.readyState >= 3) {
            startVideo();
        } else {
            video.addEventListener('canplaythrough', startVideo, { once: true });
        }
    };

    // Запуск всех систем по блокам
    initVisuals();
    initHeader();
    initCalculator();
    initHeroVideo();
});
