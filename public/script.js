document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    // 1. Анимация появления блоков
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { 
            if (entry.isIntersecting) entry.target.classList.add('visible'); 
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // 2. Функция универсального расчета
    function updateCalc(inputId, checkClass, displayId, pricePerMeter = 0) {
        const inputEl = document.getElementById(inputId);
        const area = inputEl ? (parseFloat(inputEl.value) || 0) : 0;
        let base = 0;
        document.querySelectorAll(checkClass).forEach(c => { 
            if(c.checked) base += parseFloat(c.dataset.price); 
        });
        
        const total = base + (area * pricePerMeter);
        const displayEl = document.getElementById(displayId);
        if (displayEl) {
            displayEl.innerText = total > 0 ? Math.round(total).toLocaleString('ru-RU') + ' сум' : '0 сум';
        }
    }

    // 3. Слушатели для калькуляторов
    const areaServ = document.getElementById('area-service');
    if (areaServ) {
        const servChecks = document.querySelectorAll('.service-sys');
        areaServ.addEventListener('input', () => updateCalc('area-service', '.service-sys', 'total-service', 150));
        servChecks.forEach(c => c.addEventListener('change', () => updateCalc('area-service', '.service-sys', 'total-service', 150)));
    }

    const auditChecks = document.querySelectorAll('.audit-sys');
    auditChecks.forEach(c => c.addEventListener('change', () => updateCalc(null, '.audit-sys', 'total-audit', 0)));

    // 4. Логика видео и постера (ИСПРАВЛЕНО: удалены дубликаты переменных)
    const heroVideo = document.getElementById('heroVideo');
    const heroPoster = document.querySelector('.hero-poster');

    if (heroVideo && heroPoster) {
        const hidePoster = () => {
            heroPoster.classList.add('fade-out');
            heroVideo.play().catch(err => console.log("Автозапуск заблокирован:", err));
        };

        if (heroVideo.readyState >= 3) {
            hidePoster();
        } else {
            heroVideo.addEventListener('canplaythrough', hidePoster, { once: true });
        }

        setTimeout(() => {
            if (!heroPoster.classList.contains('fade-out')) hidePoster();
        }, 3000);
    }
});

// 5. Логика скролла шапки
window.addEventListener('scroll', function() {
  const header = document.querySelector('header');
  if (header) {
      if (window.scrollY > 50) {
        header.classList.add('shrunk');
      } else {
        header.classList.remove('shrunk');
      }
  }
});
