document.addEventListener('DOMContentLoaded', () => {
    // 0. Page Transition Loader
    const loaderHTML = `
        <div id="pageTransitionLoader" class="page-loader">
            <img src="logo/logo_transparent_v2.png" alt="Boxing Center" class="loader-logo">
            <h2 class="loader-text" id="loaderDestText">Chargement...</h2>
        </div>
    `;
    document.body.insertAdjacentHTML('afterbegin', loaderHTML);
    const pageLoader = document.getElementById('pageTransitionLoader');
    const loaderText = document.getElementById('loaderDestText');

    // Fade out on initial load
    setTimeout(() => {
        pageLoader.classList.add('hide');
    }, 400);

    // Handle link clicks for transitions
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function(e) {
            const targetUrl = this.getAttribute('href');

            // Ignore links that shouldn't trigger the loader
            if (!targetUrl ||
                targetUrl.startsWith('#') ||
                targetUrl.startsWith('tel:') ||
                targetUrl.startsWith('mailto:') ||
                e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) {
                return;
            }

            // Le loader ne doit s'appliquer qu'à la navigation interne.
            // Sans ces deux gardes, preventDefault() + window.location.href
            // écrasait target="_blank" : la boutique, la réservation et les
            // réseaux sociaux s'ouvraient dans l'onglet courant, et le
            // visiteur quittait le site au lieu d'ouvrir un second onglet.
            if (this.target && this.target !== '_self') {
                return;
            }
            if (this.host && this.host !== window.location.host) {
                return;
            }
            // Lien de téléchargement : le loader le détournerait vers un
            // window.location.href, qui afficherait le fichier au lieu de
            // l'enregistrer.
            if (this.hasAttribute('download')) {
                return;
            }

            e.preventDefault();

            // Determine page name for the loader
            let destName = this.textContent.trim();
            if (!destName || destName.length > 20 || this.querySelector('img') || this.querySelector('svg')) {
                if(targetUrl.includes('clubs.html')) destName = "Le Club";
                else if(targetUrl.includes('disciplines.html')) destName = "Disciplines";
                else if(targetUrl.includes('planning.html')) destName = "Plannings";
                else if(targetUrl.includes('contact.html')) destName = "Contact";
                else if(targetUrl.includes('boutique.boxingcenter.fr')) destName = "Boutique & Réservations";
                else if(targetUrl.includes('index.html') || targetUrl === '/' || targetUrl === './') destName = "Accueil";
                else destName = "Redirection...";
            }

            loaderText.textContent = destName;
            pageLoader.classList.remove('hide');

            // Wait for transition then navigate
            setTimeout(() => {
                window.location.href = targetUrl;
            }, 600);
        });
    });

    // Also handle pages served from cache (Safari/bfcache)
    window.addEventListener('pageshow', (event) => {
        if (event.persisted && pageLoader) {
            pageLoader.classList.add('hide');
        }
    });
    // 1. Header scroll effect
    const header = document.querySelector('header');
    const handleScroll = () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    // 2. Hamburger Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // 3. Highlight current active page in navigation
    const currentPath = window.location.pathname;
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        const link = item.querySelector('a');
        if (link) {
            const href = link.getAttribute('href');
            // Check if current path ends with href or if it's the root path and href is index.html
            if (currentPath.endsWith(href) || (currentPath.endsWith('/') && href === 'index.html')) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        }
    });

    // 4. Scroll Reveal Animation using IntersectionObserver and CSS classes
    const revealElements = document.querySelectorAll('.card, .img-card, .feature-info, .feature-img-wrapper, .price-card, .schedule-table-wrapper');
    
    if ('IntersectionObserver' in window && revealElements.length > 0) {
        // Add reveal class to all target elements
        revealElements.forEach(el => el.classList.add('reveal'));

        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            root: null,
            threshold: 0.15,
            rootMargin: '0px 0px -40px 0px'
        });

        // Trigger observer on next frame to avoid flash
        requestAnimationFrame(() => {
            revealElements.forEach(el => revealObserver.observe(el));
        });
    }

    // 5. (Ancien formulaire de contact — supprimé)
    // Le gestionnaire qui vivait ici simulait un envoi : il bloquait la soumission,
    // affichait « ✓ Message envoyé ! » puis vidait les champs, sans jamais rien
    // transmettre. Le formulaire a été retiré de contact.html ; la prise de contact
    // passe désormais par le téléphone, l'email et la réservation en ligne.

    // 6. Sticky Scroll Media Switcher
    const slides = document.querySelectorAll('.content-slide');
    const stickyImages = document.querySelectorAll('.sticky-img');
    
    if (slides.length > 0 && stickyImages.length > 0) {
        const slideObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const targetId = entry.target.getAttribute('data-target');
                    
                    // Deactivate all images
                    stickyImages.forEach(img => img.classList.remove('active'));
                    
                    // Activate target image
                    const activeImg = document.getElementById(targetId);
                    if (activeImg) {
                        activeImg.classList.add('active');
                    }
                    
                    // Visual active feedback on slide text (dim inactive slides on desktop)
                    if (window.innerWidth > 992) {
                        slides.forEach(s => s.style.opacity = '0.25');
                        entry.target.style.opacity = '1';
                    } else {
                        slides.forEach(s => s.style.opacity = '1');
                    }
                }
            });
        }, {
            root: null,
            threshold: 0.5,
            rootMargin: '-20% 0px -20% 0px'
        });

        slides.forEach(slide => slideObserver.observe(slide));
    }

    // 7. FAQ Accordion Toggle
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const item = question.parentElement;
            const answer = question.nextElementSibling;
            
            if (item.classList.contains('active')) {
                item.classList.remove('active');
                answer.style.maxHeight = null;
            } else {
                document.querySelectorAll('.faq-item').forEach(otherItem => {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-answer').style.maxHeight = null;
                });
                
                item.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });
});
