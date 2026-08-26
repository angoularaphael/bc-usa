document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('header');
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handleScroll = () => {
        if (!header) return;
        header.classList.toggle('scrolled', window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    const closeMenu = () => {
        if (!hamburger || !navMenu) return;
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-label', 'Ouvrir le menu');
        document.body.style.overflow = '';
    };

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            const open = !navMenu.classList.contains('active');
            hamburger.classList.toggle('active', open);
            navMenu.classList.toggle('active', open);
            hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
            hamburger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
            document.body.style.overflow = open ? 'hidden' : '';
        });

        navMenu.querySelectorAll('.nav-link').forEach((link) => {
            link.addEventListener('click', closeMenu);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeMenu();
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 992) closeMenu();
        });
    }

    const currentFile = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-item').forEach((item) => {
        const link = item.querySelector('a');
        if (!link) return;
        const href = (link.getAttribute('href') || '').split('#')[0];
        if (!href || href.startsWith('http')) return;
        const isActive = href === currentFile;
        item.classList.toggle('active', isActive);
        if (isActive) {
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    });

    initReveal(reduceMotion);
    initCounters(reduceMotion);
    initHeroParallax(reduceMotion);
    initFaq();
    initBackToTop(reduceMotion);
    if (typeof initOffers === 'function') initOffers(reduceMotion);
});

/* Apparition au scroll.
   Chaque élément se révèle quand il entre réellement dans le viewport : c'est ce
   qui guide le regard section par section. Les enfants d'une même grille sont
   décalés (stagger) pour donner un ordre de lecture au lieu d'un bloc qui
   apparaît d'un coup.
   NB : une ancienne version forçait l'état "active" sur TOUS les éléments après
   2,5 s. Résultat, tout ce qui était sous la ligne de flottaison — dont les
   offres — était déjà révélé avant même qu'on y arrive : l'animation existait
   dans le code mais n'était jamais visible. */
function initReveal(reduceMotion) {
    const groups = [
        '.plan-grid', '.home-plans', '.decide-grid', '.plan-conditions',
        '.bento-spaces', '.disc-tiles', '.disc-chips', '.stats-home',
        '.planning-preview', '.coach-home-grid', '.network-grid', '.proof-grid',
        '.faq-accordion', '.grid-3', '.grid-2'
    ].join(',');

    document.querySelectorAll(groups).forEach((group) => {
        Array.from(group.children).forEach((child, i) => {
            child.style.setProperty('--reveal-i', String(Math.min(i, 5)));
        });
    });

    const revealSelector = [
        '.reveal-item', '.card', '.img-card', '.feature-info', '.feature-img-wrapper',
        '.price-card', '.plan-card', '.schedule-table-wrapper', '.stat-home',
        '.space-card', '.bento-tile', '.editorial-copy', '.editorial-media',
        '.discipline-card', '.disc-tile', '.planning-card', '.coach-home', '.faq-item',
        '.location-block', '.location-card', '.network-card', '.decide-card', '.proof-item',
        '.section-head', '.trial-banner', '.coach-card', '.amenity-card',
        '.gallery-item', '.chip-list', '.discipline-row', '.immersive-body',
        '.values-inner'
    ].join(',');

    const revealElements = document.querySelectorAll(revealSelector);
    if (revealElements.length === 0) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
        revealElements.forEach((el) => el.classList.add('is-revealed', 'active'));
        return;
    }

    revealElements.forEach((el) => el.classList.add('reveal'));

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-revealed', 'active');
            obs.unobserve(entry.target);
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -10% 0px'
    });

    revealElements.forEach((el) => observer.observe(el));
}

/* Chiffres clés animés.
   Réservé à la bande de chiffres de l'accueil : la surface (1 200 m²) est le
   principal argument de cette salle, le décompte amène l'œil dessus au moment
   où la bande entre à l'écran. Une seule exécution, pas de boucle. */
function initCounters(reduceMotion) {
    const counters = document.querySelectorAll('.stat-home strong[data-count-to], .hero-stats strong[data-count-to]');
    if (counters.length === 0) return;

    const render = (el, value) => {
        const suffix = el.dataset.suffix ? ' ' + el.dataset.suffix : '';
        const text = value >= 1000
            ? Math.floor(value / 1000) + '\u202f' + String(value % 1000).padStart(3, '0')
            : String(value);
        el.textContent = text + suffix;
    };

    if (reduceMotion || !('IntersectionObserver' in window)) return;

    const run = (el) => {
        const target = Number(el.dataset.countTo);
        if (!Number.isFinite(target)) return;
        const duration = 1300;
        const start = performance.now();
        const step = (now) => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            render(el, Math.round(target * eased));
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            run(entry.target);
            obs.unobserve(entry.target);
        });
    }, { threshold: 0.6 });

    counters.forEach((el) => {
        render(el, 0);
        observer.observe(el);
    });
}

function initHeroParallax(reduceMotion) {
    const img = document.querySelector('.hero-visual img');
    const hero = document.querySelector('.hero');
    if (!img || !hero || reduceMotion) return;

    let ticking = false;
    const update = () => {
        ticking = false;
        const rect = hero.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        const shift = Math.min(Math.max(-rect.top, 0), 80) * 0.22;
        img.style.transform = 'translate3d(0, ' + shift + 'px, 0) scale(1.06)';
    };

    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
    }, { passive: true });
}

function initFaq() {
    document.querySelectorAll('.faq-question').forEach((question) => {
        const item = question.parentElement;
        const answer = question.nextElementSibling;
        question.setAttribute('aria-expanded', 'false');

        question.addEventListener('click', () => {
            const isOpen = item.classList.contains('active');

            document.querySelectorAll('.faq-item').forEach((otherItem) => {
                otherItem.classList.remove('active');
                const otherQ = otherItem.querySelector('.faq-question');
                const otherA = otherItem.querySelector('.faq-answer');
                if (otherQ) otherQ.setAttribute('aria-expanded', 'false');
                if (otherA) otherA.style.maxHeight = null;
            });

            if (!isOpen) {
                item.classList.add('active');
                question.setAttribute('aria-expanded', 'true');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });
}

function initBackToTop(reduceMotion) {
    const topBtn = document.createElement('button');
    topBtn.type = 'button';
    topBtn.className = 'back-to-top';
    topBtn.setAttribute('aria-label', 'Retour en haut de page');
    topBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="18 15 12 9 6 15"></polyline></svg>';
    document.body.appendChild(topBtn);

    window.addEventListener('scroll', () => {
        topBtn.classList.toggle('is-visible', window.scrollY > 600);
    }, { passive: true });

    topBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
}
