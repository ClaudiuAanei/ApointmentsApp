// --- THEME TOGGLER SCRIPT (CORRECTED) ---
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
        // Set Bootstrap's native theme attribute (for Bootstrap components)
        document.documentElement.setAttribute('data-bs-theme', theme);

        // Target the icon and the main <html> element
        const toggleButtonIcon = document.querySelector('#themeToggle i');
        const htmlElement = document.documentElement;

        if (theme === 'dark') {
            // Add .dark-theme class for custom styles from style.css
            htmlElement.classList.add('dark-theme');

            // Update button icon and state
            if (toggleButtonIcon) {
                toggleButtonIcon.classList.remove('bi-moon-stars-fill');
                toggleButtonIcon.classList.add('bi-sun-fill');
            }
            if (themeToggleButton) {
                themeToggleButton.classList.add('active');
            }
        } else {
            // Remove .dark-theme class for light mode
            htmlElement.classList.remove('dark-theme');

            // Update button icon and state
             if (toggleButtonIcon) {
                toggleButtonIcon.classList.remove('bi-sun-fill');
                toggleButtonIcon.classList.add('bi-moon-stars-fill');
            }
            if (themeToggleButton) {
                themeToggleButton.classList.remove('active');
            }
        }
    };

    // Set the theme on initial page load
    setTheme(getPreferredTheme());

    // Listen for changes in the OS theme preference
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (!getStoredTheme()) {
            setTheme(getPreferredTheme());
        }
    });

    // Add the click event listener to the toggle button
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-bs-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            setStoredTheme(newTheme);
            setTheme(newTheme);
        });
    }
})()