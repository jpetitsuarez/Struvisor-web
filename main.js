/* ==========================================================================
   Struvisor - shared scripts (loaded by every page with <script src="main.js">)
   Each block only runs when the elements it needs exist on the page.
   ========================================================================== */

/* ---------------------------------------------------------------------- */
/* 1. Mobile hamburger menu + scroll-reveal animation
   All pages. */
/* ---------------------------------------------------------------------- */
(function () {
    /* ---------- Mobile hamburger menu ---------- */
    var btn = document.getElementById('menu-toggle');
    var menu = document.getElementById('nav-menu');
    if (btn && menu) {
        var iconOpen = btn.querySelector('.icon-open');
        var iconClose = btn.querySelector('.icon-close');
        var setMenu = function (open) {
            menu.classList.toggle('hidden', !open);
            menu.classList.toggle('menu-open', open);
            btn.setAttribute('aria-expanded', String(open));
            iconOpen.classList.toggle('hidden', open);
            iconClose.classList.toggle('hidden', !open);
        };
        btn.addEventListener('click', function () { setMenu(menu.classList.contains('hidden')); });
        menu.querySelectorAll('a').forEach(function (a) {
            a.addEventListener('click', function () { setMenu(false); });
        });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    }

    /* ---------- Scroll-reveal animation ---------- */
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var targets = [];
    document.querySelectorAll('section .container > *').forEach(function (el) {
        if (el.classList.contains('hero-in')) return;   // animated on load by CSS
        if (el.matches('.grid')) {
            Array.prototype.forEach.call(el.children, function (c) { targets.push(c); });
        } else {
            targets.push(el);
        }
    });

    var io = new IntersectionObserver(function (entries) {
        var n = 0;
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var el = entry.target;
            var delay = n * 200;   // stagger elements that appear together
            n++;
            io.unobserve(el);
            el.style.transitionDelay = delay + 'ms';
            el.classList.add('visible');
            // restore normal hover transitions once the animation ends
            setTimeout(function () {
                el.classList.remove('reveal', 'visible');
                el.style.transitionDelay = '';
            }, delay + 1600);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(function (el) { el.classList.add('reveal'); io.observe(el); });
})();

/* ---------------------------------------------------------------------- */
/* 2. Back-to-top button
   All pages. */
/* ---------------------------------------------------------------------- */
(function () {
    var b = document.getElementById('to-top');
    if (!b) return;
    function toggle() { b.classList.toggle('show', window.scrollY > 400); }
    window.addEventListener('scroll', toggle, { passive: true });
    toggle();
    b.addEventListener('click', function () {
        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
})();

/* ---------------------------------------------------------------------- */
/* 3. Hero carousel
   Home page only (needs #carousel). */
/* ---------------------------------------------------------------------- */
(function () {
    const carousel = document.getElementById('carousel');
    if (!carousel) return;
    const slides = Array.from(carousel.querySelectorAll('.slide'));
    const dotsContainer = document.getElementById('dots');
    const INTERVAL = 5000;
    let current = 0;
    let timer = null;

    const dots = slides.map((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        dot.className = 'w-3 h-3 rounded-full bg-white transition-opacity';
        dot.addEventListener('click', () => { go(i); restart(); });
        dotsContainer.appendChild(dot);
        return dot;
    });

    // Slides after the first one are downloaded only once the page has finished loading
    function loadSlide(i) {
        const img = slides[i];
        if (img.dataset.src) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
    }
    function isReady(i) {
        const img = slides[i];
        return !!img.getAttribute('src') && img.complete && img.naturalWidth > 0;
    }

    function show(n) {
        current = (n + slides.length) % slides.length;
        slides.forEach((img, i) => {
            img.classList.toggle('opacity-100', i === current);
            img.classList.toggle('opacity-0', i !== current);
        });
        dots.forEach((d, i) => { d.style.opacity = i === current ? '1' : '0.5'; });
    }

    // Manual navigation (arrows / dots)
    function go(n) {
        const target = (n + slides.length) % slides.length;
        loadSlide(target);
        show(target);
    }

    // Automatic navigation: only advance when the next image is already downloaded
    function auto() {
        const target = (current + 1) % slides.length;
        loadSlide(target);
        if (isReady(target)) show(target);
    }

    function start() { stop(); timer = setInterval(auto, INTERVAL); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() { stop(); start(); }

    document.getElementById('next').addEventListener('click', () => { go(current + 1); restart(); });
    document.getElementById('prev').addEventListener('click', () => { go(current - 1); restart(); });
    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);

    show(0);

    function init() {
        slides.forEach((_, i) => loadSlide(i));
        start();
    }
    if (document.readyState === 'complete') init();
    else window.addEventListener('load', init);
})();

/* ---------------------------------------------------------------------- */
/* 4. Highlight the menu tab that matches the section in view
   Home page only (needs tabs with data-tab). */
/* ---------------------------------------------------------------------- */
(function () {
    if (!document.querySelector('#nav-menu a[data-tab]')) return;
    var tabs = {};
    document.querySelectorAll('#nav-menu a[data-tab]').forEach(function (a) { tabs[a.dataset.tab] = a; });
    var sections = { values: document.getElementById('values'), contact: document.getElementById('contact') };
    var nav = document.querySelector('nav');
    var ACTIVE = ['gradient-bg', 'text-white', 'font-semibold'];
    var INACTIVE = ['text-gray-700', 'hover:text-blue-600', 'hover:bg-gray-50', 'transition'];
    var current = null, ticking = false;

    function setActive(name) {
        if (name === current) return;
        current = name;
        Object.keys(tabs).forEach(function (k) {
            var on = k === name;
            ACTIVE.forEach(function (c) { tabs[k].classList.toggle(c, on); });
            INACTIVE.forEach(function (c) { tabs[k].classList.toggle(c, !on); });
            if (on) tabs[k].setAttribute('aria-current', 'page');
            else tabs[k].removeAttribute('aria-current');
        });
    }

    function update() {
        ticking = false;
        var line = nav.offsetHeight + window.innerHeight * 0.2;
        var name = 'home';
        if (sections.values && sections.values.getBoundingClientRect().top <= line) name = 'values';
        if (sections.contact && sections.contact.getBoundingClientRect().top <= line) name = 'contact';
        setActive(name);
    }

    function onScroll() {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('hashchange', onScroll);
    update();
})();

/* ---------------------------------------------------------------------- */
/* 5. Contact form (Formspree)
   Contact page only (needs #contact-form). */
/* ---------------------------------------------------------------------- */
(function () {
    const ENDPOINT = 'https://formspree.io/f/xwllavar';
    const form = document.getElementById('contact-form');
    if (!form) return;
    const errorBox = document.getElementById('form-error');
    const successBox = document.getElementById('form-success');
    const button = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        errorBox.classList.add('hidden');
        successBox.classList.add('hidden');

        // Honeypot: bots fill this in, people never see it
        if (document.getElementById('website').value) return;

        const name = document.getElementById('name').value.trim();
        const city = document.getElementById('city').value.trim();
        const email = document.getElementById('email').value.trim();
        const message = document.getElementById('message').value.trim();

        if (!name || !city || !email || !message) {
            return showError('Please fill in all fields.');
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return showError('Please enter a valid email address.');
        }

        button.disabled = true;
        button.textContent = 'Sending...';

        try {
            const res = await fetch(ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    city: city,
                    email: email,
                    message: message,
                    _subject: 'New website inquiry from ' + name
                })
            });

            if (!res.ok) {
                let detail = '';
                try {
                    const data = await res.json();
                    if (data.errors) detail = data.errors.map(function (er) { return er.message; }).join(' ');
                } catch (_) {}
                throw new Error(detail || 'Request failed');
            }

            form.reset();
            successBox.textContent = 'Thank you! Your message has been sent. We will get back to you soon.';
            successBox.classList.remove('hidden');
        } catch (err) {
            showError('Something went wrong. Please try again or email us at info@struvisor.ca.');
        } finally {
            button.disabled = false;
            button.textContent = 'Send Message';
        }
    });

    function showError(text) {
        errorBox.textContent = text;
        errorBox.classList.remove('hidden');
    }
})();

