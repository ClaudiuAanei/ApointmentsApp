$(document).ready(function() {
    // Initialize validation for the login form
    $("#loginForm").validate({
        rules: {
            email: {
                required: true,
                email: true
            }
            ,
            password: {
                required: true
            }
        },
        messages: {
            email: {
                required: "Please enter your email address.",
                email: "Please enter a valid email address."
            },
            password: {
                required: "Please enter your password."
            }
        },
        errorElement: 'div',
        errorClass: 'invalid-feedback',
        validClass: 'is-valid',

        // Prevents validation from running on every key release and when element loses focus
        onkeyup: false,
        onfocusout: false,

        // Function to run when an element fails validation
        highlight: function(element, errorClass, validClass) {
            // Adăugăm clasa 'is-invalid' pentru a afișa feedback-ul roșu
            $(element).addClass('is-invalid').removeClass('is-valid');
            // Dacă elementul face parte dintr-un input-group, evidențiem și grupul
            $(element).closest('.input-group').addClass('is-invalid').removeClass('is-valid');
        },
        // Function to run when an element passes validation or needs to be unhighlighted
        unhighlight: function(element, errorClass, validClass) {
            // Nu adăugăm clasa 'is-valid' pentru feedback-ul verde
            // Doar eliminăm 'is-invalid' dacă a fost aplicată
            $(element).removeClass('is-invalid').removeClass('is-valid');
            $(element).closest('.input-group').removeClass('is-invalid').removeClass('is-valid');
        },
        // Custom placement for error messages
        errorPlacement: function(error, element) {
            let targetContainer;

            if (element.attr("id") === "password") {
                targetContainer = $("#password-error-container");
            } else if (element.attr("id") === "email") {
                targetContainer = $("#email-error-container");
            } else {
                // Fallback for any other elements if they ever appear
                error.insertAfter(element);
                targetContainer = null;
            }

            if (targetContainer && targetContainer.length) {
                error.appendTo(targetContainer);
            }

            error.addClass('d-block'); // Ensure the error message is visible (Bootstrap hides .invalid-feedback by default)
        },
        // What to do when the form is valid and ready for submission
        submitHandler: function(form) {
            form.submit(); // Submit the form
        }
    });
    // --- "Show password" functionality (ONLY for the main password field) ---
    $("#togglePassword").click(function() {
        const passwordField = $("#password");
        const type = passwordField.attr("type") === "password" ? "text" : "password";
        passwordField.attr("type", type);
        $(this).find('i').toggleClass("fa-eye fa-eye-slash");
    });
});
