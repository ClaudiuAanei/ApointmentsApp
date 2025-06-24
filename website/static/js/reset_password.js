document.addEventListener('DOMContentLoaded', function () {

    // --- Selectarea elementelor din DOM ---
    const resetForm = document.getElementById('resetForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm_password');
    const passwordErrorContainer = document.getElementById('password-error-container');
    const confirmPasswordErrorContainer = document.getElementById('confirm-password-error-container');
    const togglePassword = document.getElementById('togglePassword');
    const toggleIcon = document.getElementById('toggleIcon');

    // --- Funcționalitatea pentru afișarea/ascunderea parolei ---
    if (togglePassword) {
        togglePassword.addEventListener('click', function () {
            // Comută tipul input-ului între 'password' și 'text'
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            // Schimbă iconița ochiului
            toggleIcon.classList.toggle('fa-eye');
            toggleIcon.classList.toggle('fa-eye-slash');
        });
    }

    // --- Funcția de validare pentru câmpul de parolă ---
    function validatePassword() {
        // Curăță erorile anterioare
        passwordErrorContainer.innerHTML = '';
        passwordInput.classList.remove('is-invalid', 'is-valid');

        const password = passwordInput.value;
        let errors = [];

        // Verifică condițiile de validare
        if (password.length < 8) {
            errors.push("Parola trebuie să aibă cel puțin 8 caractere.");
        }
        if (!/[a-z]/.test(password)) {
            errors.push("Trebuie să conțină cel puțin o literă mică.");
        }
        if (!/[A-Z]/.test(password)) {
            errors.push("Trebuie să conțină cel puțin o literă mare.");
        }
        if (!/[0-9]/.test(password)) {
            errors.push("Trebuie să conțină cel puțin o cifră.");
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push("Trebuie să conțină cel puțin un caracter special.");
        }

        // Dacă există erori, le afișează
        if (errors.length > 0) {
            passwordInput.classList.add('is-invalid');
            const errorList = errors.map(error => `<div class="invalid-feedback d-block">${error}</div>`).join('');
            passwordErrorContainer.innerHTML = errorList;
            return false; // Validare eșuată
        } else {
            passwordInput.classList.add('is-valid');
            return true; // Validare cu succes
        }
    }

    // --- Funcția de validare pentru câmpul de confirmare a parolei ---
    function validateConfirmPassword() {
        // Curăță erorile anterioare
        confirmPasswordErrorContainer.innerHTML = '';
        confirmPasswordInput.classList.remove('is-invalid', 'is-valid');

        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Verifică dacă parolele se potrivesc
        if (password !== confirmPassword) {
            confirmPasswordInput.classList.add('is-invalid');
            confirmPasswordErrorContainer.innerHTML = '<div class="invalid-feedback d-block">Parolele nu se potrivesc.</div>';
            return false; // Validare eșuată
        } else {
            // Câmpul este valid doar dacă nu e gol și se potrivește
            if (confirmPassword.length > 0) {
                confirmPasswordInput.classList.add('is-valid');
            }
            return true; // Validare cu succes
        }
    }

    // --- Adăugarea evenimentelor pentru validare în timp real ---
    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            validatePassword();
            // Re-validează și câmpul de confirmare, deoarece depinde de acesta
            if (confirmPasswordInput.value.length > 0) {
                validateConfirmPassword();
            }
        });
    }

    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', validateConfirmPassword);
    }

    // --- Validarea finală la trimiterea formularului ---
    if (resetForm) {
        resetForm.addEventListener('submit', function (event) {
            // Rulează ambele validări
            const isPasswordValid = validatePassword();
            const isConfirmPasswordValid = validateConfirmPassword();

            // Dacă oricare validare eșuează, oprește trimiterea formularului
            if (!isPasswordValid || !isConfirmPasswordValid) {
                event.preventDefault(); // Oprește acțiunea default (trimiterea)
                event.stopPropagation(); // Oprește propagarea evenimentului
            }
        });
    }
});
