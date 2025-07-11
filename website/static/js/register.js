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
            first_name: {
                required: true,
                minlength: 2,
                maxlength: 20,
                remote: {
                    url: "/check_first_name", // Make sure this URL is correct! (e.g., /auth/check_first_name if you have a blueprint prefix)
                    type: "post",
                    data: {
                        first_name: function() {
                            return $("#first_name").val();
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
            last_name: {
                required: true,
                minlength: 2,
                maxlength: 20,
                remote: {
                    url: "/check_last_name", // Make sure this URL is correct! (e.g., /auth/check_last_name if you have a blueprint prefix)
                    type: "post",
                    data: {
                        last_name: function() {
                            return $("#last_name").val();
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
            first_name: {
                required: "Please enter your first name.",
                minlength: "First name must be between 2 and 20 characters.",
                maxlength: "First name must be between 2 and 20 characters.",
            },
            last_name: {
                required: "Please enter your last name.",
                minlength: "Last name must be between 2 and 20 characters.",
                maxlength: "Last name must be between 2 and 20 characters.",
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
            } else if (element.attr("id") === "first_name") {
                targetContainer = $("#first_name-error-container");
            } else if (element.attr("id") === "last_name") {
                targetContainer = $("#last_name-error-container");
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