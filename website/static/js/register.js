$(document).ready(function() {
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
                minlength: 8
            },
            confirm_password: {
                required: true,
                equalTo: "#password"
            }
        },
        messages: {
            username: {
                required: "Enter your username.",
                minlength: "Username must have between 4 and 20 characters.",
                maxlength: "Username must have between 4 and 20 characters.",
                remote: "This username is already taken."
            },
            email: {
                required: "Enter your email address.",
                email: "This is not a valid email address.",
                remote: "This email is already registered."
            },
            password: {
                required: "Enter your password.",
                minlength: "Password must have a minimum of 8 characters."
            },
            confirm_password: {
                required: "Confirm your password.",
                equalTo: "Passwords do not match."
            }
        },
        errorElement: 'div',
        errorClass: 'invalid-feedback',
        validClass: 'is-valid',

        highlight: function(element, errorClass, validClass) {
            $(element).addClass('is-invalid').removeClass('is-valid');
            // Find the parent input-group (if it exists) and add the invalid class
            $(element).closest('.input-group').addClass('is-invalid').removeClass('is-valid');
        },
        unhighlight: function(element, errorClass, validClass) {
            $(element).removeClass('is-invalid').addClass('is-valid');
            // Find the parent input-group and remove the invalid class
            $(element).closest('.input-group').removeClass('is-invalid').addClass('is-valid');
        },
        errorPlacement: function(error, element) {
            // Crucial logic: Place the error in the specific container, not directly after the input
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
                // Fallback for other elements that don't have a specific container
                error.insertAfter(element);
                targetContainer = null;
            }

            if (targetContainer && targetContainer.length) {
                error.appendTo(targetContainer);
            }

            error.addClass('d-block'); // Ensure the error message is visible (Bootstrap hides .invalid-feedback by default)
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

    // The code for "toggleConfirmPassword" has been removed.
});