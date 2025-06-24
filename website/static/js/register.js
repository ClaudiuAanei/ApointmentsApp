$(document).ready(function() {
    // 1. Add custom validation methods for each password complexity condition
    $.validator.addMethod("hasUppercase", function(value, element) {
        return this.optional(element) || /[A-Z]/.test(value);
    }, "Password must contain at least one uppercase letter.");

    $.validator.addMethod("hasLowercase", function(value, element) {
        return this.optional(element) || /[a-z]/.test(value);
    }, "Password must contain at least one lowercase letter.");

    $.validator.addMethod("hasDigit", function(value, element) {
        return this.optional(element) || /\d/.test(value);
    }, "Password must contain at least one digit.");

    $.validator.addMethod("hasSpecialChar", function(value, element) {
        // Set of special characters: !@#$%^&*()_+=-[]{};':"\\|,.<>/?`~
        return this.optional(element) || /[!@#$%^&*()_+=\-[\]{};':"\\|,.<>/?`~]/.test(value);
    }, "Password must contain at least one special character.");


    $("#registrationForm").validate({
        rules: {
            username: {
                required: true,
                minlength: 4,
                maxlength: 20,
                remote: {
                    url: "/check_username", // Make sure this URL is correct! (e.g., /auth/check_username if you have a blueprint prefix)
                    type: "post",
                    data: {
                        username: function() {
                            return $("#username").val();
                        },
                        csrf_token: function() {
                            return $('input[name="csrf_token"]').val();
                        }
                    },
                    dataFilter: function(response) {
                        var parsedResponse = JSON.parse(response);
                        if (parsedResponse.exists) {
                            return false; // Return FALSE (boolean) to indicate validation error
                        }
                        return true; // Return TRUE (boolean) to indicate successful validation
                    }
                }
            },
            email: {
                required: true,
                email: true,
                remote: {
                    url: "/check_email", // Make sure this URL is correct!
                    type: "post",
                    data: {
                        email: function() {
                            return $("#email").val();
                        },
                        csrf_token: function() {
                            return $('input[name="csrf_token"]').val();
                        }
                    },
                    dataFilter: function(response) {
                        var parsedResponse = JSON.parse(response);
                        if (parsedResponse.exists) {
                            return false; // Return FALSE (boolean)
                        }
                        return true; // Return TRUE (boolean)
                    }
                }
            },
            password: {
                required: true,
                // Length conditions
                minlength: 8, // Password must be at least 12 characters long
                maxlength: 64, // Password can be at most 64 characters long
                // Complexity conditions (strong password)
                hasUppercase: true,   // New method for uppercase letter
                hasLowercase: true,   // New method for lowercase letter
                hasDigit: true,       // New method for digit
                hasSpecialChar: true  // New method for special character
            },
            confirm_password: {
                required: true,
                equalTo: "#password"
            }
        },
        messages: {
            username: {
                required: "Please enter a username.",
                minlength: "Username must be between 4 and 20 characters.",
                maxlength: "Username must be between 4 and 20 characters.",
                remote: "This username is already taken."
            },
            email: {
                required: "Please enter your email address.",
                email: "This is not a valid email address.",
                remote: "This email is already registered."
            },
            password: {
                required: "Please enter a password.",
                minlength: "Password must be at least 8 characters long.",
                maxlength: "Password can be at most 64 characters long."
                // Messages for other conditions are defined directly in addMethod
            },
            confirm_password: {
                required: "Please confirm your password.",
                equalTo: "Passwords do not match."
            }
        },
        errorElement: 'div',
        errorClass: 'invalid-feedback',
        validClass: 'is-valid',

        highlight: function(element, errorClass, validClass) {
            $(element).addClass('is-invalid').removeClass('is-valid');
            $(element).closest('.input-group').addClass('is-invalid').removeClass('is-valid');
        },
        unhighlight: function(element, errorClass, validClass) {
            $(element).removeClass('is-invalid').addClass('is-valid');
            $(element).closest('.input-group').removeClass('is-invalid').addClass('is-valid');
        },
        errorPlacement: function(error, element) {
            let targetContainer;

            if (element.attr("id") === "password") {
                targetContainer = $("#password-error-container");
            } else if (element.attr("id") === "confirm_password") {
                targetContainer = $("#confirm-password-error-container");
            } else if (element.attr("id") === "username") {
                targetContainer = $("#username-error-container");
            } else if (element.attr("id") === "email") {
                targetContainer = $("#email-error-container");
            } else {
                error.insertAfter(element);
                targetContainer = null;
            }

            if (targetContainer && targetContainer.length) {
                error.appendTo(targetContainer);
            }

            error.addClass('d-block');
        },
        submitHandler: function(form) {
            form.submit();
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