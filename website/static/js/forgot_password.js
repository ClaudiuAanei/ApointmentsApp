$(document).ready(function () {
    $("#fpForm").validate({
        // CHANGED: Validation messages are now in English.
        rules: {
            email: {
                required: true,
                email: true
            }
        },
        messages: {
            email: {
                required: "Please enter your email address.",
                email: "Please enter a valid email address."
            }
        },

        errorElement: 'div',
        errorClass: 'invalid-feedback',
        validClass: 'is-valid',

        // Recommended for better UX
        onfocusout: function(element) {
            this.element(element);
        },

        highlight: function (element, errorClass, validClass) {
            $(element).removeClass(validClass).addClass('is-invalid');
        },

        unhighlight: function (element, errorClass, validClass) {
            $(element).removeClass('is-invalid').addClass(validClass);
        },

        errorPlacement: function (error, element) {
            error.insertAfter(element);
        },

        submitHandler: function (form) {
            const $form = $(form);
            const $submitBtn = $form.find('[type="submit"]');
            const $statusContainer = $("#form-status-message");
            const $emailField = $("#email");

            // Removes the green border on submit for a cleaner transition
            $emailField.removeClass('is-valid');

            $statusContainer.html('');

            // CHANGED: Processing message is now simpler and in English.
            const processingHtml = `
                <div class="d-flex align-items-center text-muted">
                    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    <span>Processing...</span>
                </div>`;
            $statusContainer.html(processingHtml);

            $submitBtn.prop('disabled', true);

            $.ajax({
                url: $form.attr('action'),
                type: "POST",
                data: $form.serialize(),
                success: function (response) {
                    if (response.status === "success") {
                        // CHANGED: Success message is now simple green text, no background, not bold.
                        const successHtml = `<div class="text-success">${response.message}</div>`;
                        $statusContainer.html(successHtml);
                        $form[0].reset();
                    } else {
                        // CHANGED: Server-side error message is now simple red text.
                        const errorMsg = response.message || "An unexpected error occurred.";
                        const errorHtml = `<div class="text-danger">${errorMsg}</div>`;
                        $statusContainer.html(errorHtml);
                    }
                },
                error: function (xhr) {
                    // CHANGED: AJAX error message is now simple red text and in English.
                    const errMsg = xhr.responseJSON?.message || "An error occurred. Please try again.";
                    const errorHtml = `<div class="text-danger">${errMsg}</div>`;
                    $statusContainer.html(errorHtml);
                },
                complete: function () {
                    $submitBtn.prop('disabled', false);
                }
            });

            return false;
        }
    });
});