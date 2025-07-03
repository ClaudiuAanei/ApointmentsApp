// --- SCRIPT PENTRU SCHIMBAREA TEMEI ---
(() => {
    'use strict'

    const themeToggleButton = document.getElementById('themeToggle');
    const getStoredTheme = () => localStorage.getItem('theme');
    const setStoredTheme = theme => localStorage.setItem('theme', theme);

    const getPreferredTheme = () => {
        const storedTheme = getStoredTheme();
        if (storedTheme) {
            return storedTheme;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const setTheme = theme => {
        document.documentElement.setAttribute('data-bs-theme', theme);
        const toggleButtonIcon = document.querySelector('#themeToggle i');
        const htmlElement = document.documentElement;

        if (theme === 'dark') {
            htmlElement.classList.add('dark-theme');
            if (toggleButtonIcon) {
                toggleButtonIcon.classList.remove('bi-moon-stars-fill');
                toggleButtonIcon.classList.add('bi-sun-fill');
            }
            if (themeToggleButton) {
                themeToggleButton.classList.add('active');
            }
        } else {
            htmlElement.classList.remove('dark-theme');
            if (toggleButtonIcon) {
                toggleButtonIcon.classList.remove('bi-sun-fill');
                toggleButtonIcon.classList.add('bi-moon-stars-fill');
            }
            if (themeToggleButton) {
                themeToggleButton.classList.remove('active');
            }
        }
    };

    setTheme(getPreferredTheme());

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (!getStoredTheme()) {
            setTheme(getPreferredTheme());
        }
    });

    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-bs-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            setStoredTheme(newTheme);
            setTheme(newTheme);
        });
    }
})();

// --- SCRIPT PENTRU ASCUNDEREA BAREI DE NAVIGARE LA SCROLL ---
(() => {
    'use strict';

    // Am actualizat selectorul pentru a se potrivi cu ID-ul tău: #mainNavbar
    const navbar = document.querySelector('#mainNavbar');
    let lastScrollTop = 0;

    if (navbar) {
        window.addEventListener('scroll', function() {
            let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            if (scrollTop > lastScrollTop) {
                // Scroll în jos: ascunde bara de navigare
                // Folosim înălțimea reală a barei pentru a o ascunde complet
                navbar.style.top = `-${navbar.offsetHeight}px`;
            } else {
                // Scroll în sus: afișează instantaneu bara de navigare
                navbar.style.top = '0';
            }
            // Actualizăm ultima poziție de scroll
            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
        }, false);
    }
})();