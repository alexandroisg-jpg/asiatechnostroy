/**
 * ASIATECHNOSTROY - Professional Engineering Maintenance
 * Исправленный скрипт управления калькулятором и интерфейсом
 */

document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       1. ИНИЦИАЛИЗАЦИЯ И ВИЗУАЛ (Lucide & Reveal)
       ========================================================================== */
    const initVisuals = () => {
        try { 
            if (window.lucide) lucide.createIcons(); 
        } catch (e) {
            console.error("Ошибка загрузки иконок:", e);
        }

        const revealOptions = { threshold: 0.15 };
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
       2. ДВИЖОК КАЛЬКУЛЯТОРА
       ========================================================================== */
    const initCalculator = () => {
        const DOM = {
            range: document.getElementById('area-range'),
            total: document.getElementById('total-price'),
            label: document.getElementById('area-val'),
            types: document.querySelectorAll('.type-card'),
            systems: document.querySelectorAll('.system-item input'),
            tabs: document.querySelectorAll('.tab-btn'),
            // Элементы модального окна
            modal: document.getElementById('modalOrder'),
            openModalBtn: document.querySelector('.btn-order'),
            closeModalBtn: document.querySelector('.modal-close'),
            displayArea: document.getElementById('display-area'),
            orderForm: document.getElementById('orderForm')
        };

        if (!DOM.range || !DOM.total) return;

        let state = {
            area: parseInt(DOM.range.value),
            multiplier: 1.0,
            mode: 'service',
            currentDisplayValue: 0
        };

        // Плавная анимация цифр
        const animatePrice = (newVal) => {
            const duration = 600; 
            const start = state.currentDisplayValue;
            const end = newVal;
            let startTime = null;

            const step = (timestamp) => {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / duration, 1);
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
            
            // Считаем выбранные системы через getAttribute для надежности
            DOM.systems.forEach(s => {
                if (s.checked) {
                    systemsRate += parseFloat(s.getAttribute('data-price') || 0);
                }
            });

            // Базовая формула: (Площадь * Ставка систем) * Коэффициент здания
            let result = (state.area * systemsRate) * state.multiplier;

            // Скидка для режима "Аудит"
            if (state.mode === 'audit') result *= 0.35;
            
            // Если системы не выбраны — бюджет 0
            if (systemsRate === 0) result = 0;

            animatePrice(result);
        };

        /* --- ОБРАБОТЧИКИ СОБЫТИЙ --- */

        // Слайдер площади
        DOM.range.addEventListener('input', (e) => {
            state.area = parseInt(e.target.value);
            DOM.label.innerText = `${state.area} м²`;
            runLogic();
        });

        // Выбор типа объекта
        DOM.types.forEach(card => {
            card.addEventListener('click', function() {
                DOM.types.forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                state.multiplier = parseFloat(this.getAttribute('data-multiplier')) || 1.0;
                runLogic();
            });
        });

        // Чекбоксы систем
        DOM.systems.forEach(s => s.addEventListener('change', runLogic));

        // Переключение вкладок (Абонентское / Аудит)
        DOM.tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                DOM.tabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                state.mode = this.getAttribute('data-tab');
                runLogic();
            });
        });

        /* --- ЛОГИКА МОДАЛЬНОГО ОКНА --- */
        if (DOM.openModalBtn && DOM.modal) {
            DOM.openModalBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (DOM.displayArea) DOM.displayArea.innerText = DOM.range.value;
                DOM.modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            });

            DOM.closeModalBtn.addEventListener('click', () => {
                DOM.modal.classList.remove('active');
                document.body.style.overflow = 'auto';
            });

            window.addEventListener('click', (e) => {
                if (e.target === DOM.modal) {
                    DOM.modal.classList.remove('active');
                    document.body.style.overflow = 'auto';
                }
            });
        }

        // Отправка формы
        if (DOM.orderForm) {
    DOM.orderForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Данные из формы
        const name = document.getElementById('userName').value;
        const object = document.getElementById('objName').value;
        const phone = document.getElementById('userPhone').value;
        
        // Данные из калькулятора
        const area = DOM.range.value;
        const total = DOM.total.innerText;
        const type = document.querySelector('.type-card.active span').innerText;
        
        // Собираем список выбранных систем
        const systems = Array.from(DOM.systems)
            .filter(s => s.checked)
            .map(s => "✅ " + s.nextElementSibling.querySelector('span').innerText)
            .join('\n');

        // Текст сообщения для Telegram
        const message = `
🚀 **Новая заявка с сайта!**
👤 **Имя:** ${name}
🏢 **Объект:** ${object}
📞 **Телефон:** ${phone}
📍 **Тип здания:** ${type}
📏 **Площадь:** ${area} м²
🛠 **Системы:** 
${systems}

💰 **Предварительный бюджет:** ${total} сум/мес
        `;

        // Настройки бота (замените на свои данные)
        const BOT_TOKEN = 'ВАШ_ТОКЕН_БОТА';
        const CHAT_ID = 'ВАШ_ID_ЧАТА';

        try {
            const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    text: message,
                    parse_mode: 'Markdown'
                })
            });

            if (response.ok) {
                alert(`Спасибо, ${name}! Заявка отправлена. Мы скоро свяжемся с вами.`);
                DOM.modal.classList.remove('active');
                document.body.style.overflow = 'auto';
                DOM.orderForm.reset();
            } else {
                throw new Error('Ошибка при отправке');
            }
        } catch (error) {
            alert('Произошла ошибка. Пожалуйста, свяжитесь с нами по телефону.');
            console.error(error);
        }
    });
}

        // Запуск при загрузке
        runLogic();
    };

    /* ==========================================================================
       3. ШАПКА И ВИДЕО
       ========================================================================== */
    const initHeader = () => {
        const header = document.querySelector('header');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 60) {
                header.classList.add('shrunk');
            } else {
                header.classList.remove('shrunk');
            }
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

    // Запуск всех модулей
    initVisuals();
    initHeader();
    initCalculator();
    initHeroVideo();
});
