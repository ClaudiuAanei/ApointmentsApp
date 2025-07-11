document.addEventListener('DOMContentLoaded', function() {

    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

    function createAppointmentCard(appointment, isUpcoming = true) {
        const statusBadge = `<span class="badge bg-secondary-subtle text-secondary-emphasis rounded-pill">${appointment.status}</span>`;
        const cancelLink = `<a href="#" class="text-danger text-decoration-none fw-bold px-2 cancel-btn" data-appointment-id="${appointment.appointmentId}">Cancel</a>`;
        if (isUpcoming) {
            return `
            <div class="card-body">
                <div class="pb-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <h6 class="card-title fw-bold mb-0">${appointment.employee}</h6>
                        ${statusBadge}
                    </div>
                    <p class="card-text text-muted mb-0">${appointment.service}</p>
                </div>
                <div class="card-footer bg-transparent d-flex flex-column border-top-0 pt-2">
                    <div class="d-flex justify-content-between align-items-end mt-auto">
                        <div class="d-flex flex-column">
                            <small class="text-muted"><i class="bi bi-clock me-1"></i>${appointment.time}</small>
                            <small class="text-muted"><i class="bi bi-calendar-check"></i> ${appointment.date}</small>
                        </div>
                        ${cancelLink}
                    </div>
                </div>
                <hr>
            </div>`;
        } else {
            return `
            <div class="card-body">
                <div class="pb-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <h6 class="card-title fw-bold mb-0">${appointment.employee}</h6>
                        ${statusBadge}
                    </div>
                    <p class="card-text mb-2 mt-1">${appointment.service}</p>
                    <div class="d-flex flex-column">
                        <small class="text-muted"><i class="bi bi-clock me-1"></i>${appointment.time}</small>
                        <small class="text-muted"><i class="bi bi-calendar-check"></i> ${appointment.date}</small>
                    </div>
                </div>
                <div class="card-footer bg-transparent d-flex justify-content-between align-items-center border-top-0 pt-2">
                    <a href="{{ url_for('views.appointments_manager') }}" class="btn btn-sm btn-primary"><i class="bi bi-arrow-repeat me-1"></i>Book Again</a>
                    <button class="btn btn-sm btn-outline-secondary"><i class="bi bi-pencil-square me-1"></i>Write a Review</button>
                </div>
                <hr>
            </div>`;
        }
    }

    function populateAppointments(containerIds, appointments, isUpcoming) {
        containerIds.forEach(id => {
            const container = document.getElementById(id);
            if (!container) return;
            container.innerHTML = '';
            if (appointments.status === false) {
                container.innerHTML = `<p class="text-muted">${appointments.message}</p>`;
                return;
            }
            if (Array.isArray(appointments) && appointments.length > 0) {
                appointments.forEach((app, index) => {
                    const cardHtml = createAppointmentCard(app, isUpcoming);
                    const cardWrapper = document.createElement('div');
                    cardWrapper.innerHTML = cardHtml.trim();
                    container.appendChild(cardWrapper.firstChild);
                    if (index < appointments.length - 1) {
                        container.appendChild(document.createElement('hr'));
                    }
                });
            } else {
                 container.innerHTML = `<p class="text-muted">No appointments found.</p>`;
            }
        });
    }

    async function loadAppointmentData() {
        const upcomingContainers = ['upcoming-appointments-mobile', 'upcoming-appointments-desktop'];
        const pastContainers = ['past-appointments-mobile', 'past-appointments-desktop'];
        upcomingContainers.concat(pastContainers).forEach(id => {
            const container = document.getElementById(id);
            if (container) container.innerHTML = '<p class="text-muted">Loading...</p>';
        });
        try {
            const upcomingResponse = await fetch('/upcoming-appointments');
            const upcomingData = await upcomingResponse.json();
            populateAppointments(upcomingContainers, upcomingData, true);
            const pastResponse = await fetch('/previous-appointments');
            const pastData = await pastResponse.json();
            populateAppointments(pastContainers, pastData, false);
        } catch (error) {
            console.error("Failed to load appointment data:", error);
            upcomingContainers.concat(pastContainers).forEach(id => {
                const container = document.getElementById(id);
                if (container) container.innerHTML = '<p class="text-danger">Error loading data. Please try again later.</p>';
            });
        }
    }

    async function cancelAppointment(appointmentId) {
        if (!confirm('Are you sure you want to cancel this appointment?')) {
            return;
        }
        try {
            const response = await fetch('/cancel-appointment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({ appointmentId: appointmentId }),
            });
            const result = await response.json();
            if (response.ok && result.status === true) {
                alert(result.message);
                loadAppointmentData();
            } else {
                alert('Error: ' + (result.message || 'Could not cancel the appointment.'));
            }
        } catch (error) {
            console.error("Failed to cancel appointment:", error);
            alert("An error occurred. Please try again.");
        }
    }

    document.body.addEventListener('click', function(event) {
        if (event.target.classList.contains('cancel-btn')) {
            event.preventDefault();
            const appointmentId = event.target.dataset.appointmentId;
            if (appointmentId) {
                cancelAppointment(appointmentId);
            }
        }
    });

    async function loadUserDetails() {
        try {
            const response = await fetch('/user-data');
            if (!response.ok) throw new Error('Failed to fetch user data');
            const data = await response.json();

            document.querySelectorAll('.user-full-name').forEach(el => el.textContent = `${data.first_name || ''} ${data.last_name || ''}`.trim());
            document.querySelectorAll('.user-email').forEach(el => el.textContent = data.email || '');
            document.querySelectorAll('.user-photo-main').forEach(img => img.src = data.picture || 'https://placehold.co/100x100/EFEFEF/AAAAAA&text=Photo');

            document.querySelectorAll('.detail-item').forEach(item => {
                const field = item.dataset.field;
                if (!field || !data.hasOwnProperty(field)) return;

                const displaySpan = item.querySelector('.display-view span');
                let displayValue = data[field];

                if (field === 'birthday' && data[field]) {
                    const dateString = data[field].split(' ')[0];
                    const dateParts = dateString.split('-');
                    const localDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
                    displayValue = localDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
                    const input = item.querySelector('.edit-view input');
                    if (input) input.value = dateString;
                } else if (field === 'phone' && data[field]) {
                    const prefixSelect = item.querySelector('.phone-prefix');
                    const numberInput = item.querySelector('.phone-number');
                    const prefixes = Array.from(prefixSelect.options).map(opt => opt.value);
                    let foundPrefix = false;
                    for (const p of prefixes) {
                        if (data.phone.startsWith(p)) {
                            prefixSelect.value = p;
                            numberInput.value = data.phone.substring(p.length);
                            foundPrefix = true;
                            break;
                        }
                    }
                    if (!foundPrefix) numberInput.value = data.phone;
                } else {
                    const input = item.querySelector('.edit-view input');
                    if (input) input.value = data[field] || '';
                }

                if (displaySpan) displaySpan.textContent = displayValue || 'N/A';
                if (field === 'picture' && data[field]) item.querySelector('img').src = data[field];
            });

        } catch (error) {
            console.error("Error loading user details:", error);
        }
    }

    const setupEditSaveLogic = (containerSelector) => {
        const container = document.querySelector(containerSelector);
        if (!container) return;
        let currentlyEditing = null;

        const closeAllEdits = () => {
            if (currentlyEditing) {
                currentlyEditing.querySelector('.display-view').style.display = 'block';
                currentlyEditing.querySelector('.edit-view').style.display = 'none';
                currentlyEditing.querySelector('.edit-btn').style.display = 'block';
                currentlyEditing = null;
            }
        };

        container.addEventListener('click', async function(event) {
            const editBtn = event.target.closest('.edit-btn');
            const saveBtn = event.target.closest('.save-btn');
            const detailItem = event.target.closest('.detail-item');

            if (editBtn && detailItem) {
                event.stopPropagation();
                closeAllEdits();
                document.querySelectorAll('.update-success-msg, .update-error-msg').forEach(msg => msg.classList.add('d-none'));
                currentlyEditing = detailItem;
                detailItem.querySelector('.display-view').style.display = 'none';
                detailItem.querySelector('.edit-view').style.display = 'block';
                editBtn.style.display = 'none';
            } else if (saveBtn && detailItem) {
                const fieldName = detailItem.dataset.field;
                const errorMsgElement = detailItem.querySelector('.update-error-msg');
                let newValue;

                if (errorMsgElement) errorMsgElement.classList.add('d-none');

                try {
                    if (fieldName === 'password') {
                        // Re-check validation on save, although button should be disabled if invalid
                        if (saveBtn.disabled) {
                            throw new Error('Password does not meet all security requirements.');
                        }
                        newValue = detailItem.querySelector('input').value;
                    } else if (fieldName === 'phone') {
                        const prefix = detailItem.querySelector('.phone-prefix').value;
                        const numberInput = detailItem.querySelector('.phone-number');
                        const numberValue = numberInput.value.replace(/\s/g, '');

                        if (!/^\d{9}$/.test(numberValue)) {
                            throw new Error('The number must contain exactly 9 digits.');
                        }
                        newValue = prefix + numberValue;
                    } else {
                        const input = detailItem.querySelector('input, select');
                        newValue = input.value;
                    }

                    const response = await fetch('/edit-user-details', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
                        body: JSON.stringify({ field: fieldName, value: newValue })
                    });
                    const result = await response.json();
                    if (!response.ok || result.success === false) {
                        throw new Error(result.message || 'An unknown error occurred.');
                    }

                    const successMsgElement = detailItem.querySelector('.update-success-msg');
                    if (successMsgElement) {
                        successMsgElement.textContent = result.message;
                        successMsgElement.classList.remove('d-none');
                        setTimeout(() => {
                            successMsgElement.classList.add('d-none');
                        }, 4000);
                    }

                    const displaySpan = detailItem.querySelector('.display-view span');
                    if (fieldName === 'birthday' && newValue) {
                         const date = new Date(newValue);
                         displaySpan.textContent = new Date(date.getTime() + (date.getTimezoneOffset() * 60000)).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
                    } else if (fieldName !== 'password') {
                        displaySpan.textContent = newValue;
                    }
                    if (fieldName === 'password') {
                        detailItem.querySelector('input').value = '';
                    }

                    closeAllEdits();
                } catch (error) {
                    console.error('Failed to update user details:', error);
                    if (errorMsgElement) {
                        errorMsgElement.textContent = error.message;
                        errorMsgElement.classList.remove('d-none');
                    } else {
                        alert(`Error: ${error.message}`);
                    }
                }
            }
        });

        document.addEventListener('click', (event) => {
            if (currentlyEditing && !container.contains(event.target)) closeAllEdits();
        });
    };

    const setupProfilePicturePreview = (containerSelector) => {
        const container = document.querySelector(containerSelector);
        if (!container) return;
        const input = container.querySelector('input[type="file"]');
        const preview = container.querySelector('img[id$="_profilePicturePreview"]');
        if (input && preview) {
            input.addEventListener('change', function() {
                if (this.files && this.files[0]) {
                    const reader = new FileReader();
                    reader.onload = (e) => { preview.src = e.target.result; };
                    reader.readAsDataURL(this.files[0]);
                }
            });
        }
    };

    const setupPasswordValidation = (containerSelector) => {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const passwordItem = container.querySelector('.detail-item[data-field="password"]');
        if (!passwordItem) return;

        const input = passwordItem.querySelector('input[type="password"]');
        const saveBtn = passwordItem.querySelector('.save-btn');
        const id_prefix = containerSelector.includes('mobile') ? 'mobile' : 'desktop';

        const conditions = {
            length: { el: document.getElementById(`${id_prefix}_pw-length`), re: /^.{8,64}$/ },
            uppercase: { el: document.getElementById(`${id_prefix}_pw-uppercase`), re: /[A-Z]/ },
            lowercase: { el: document.getElementById(`${id_prefix}_pw-lowercase`), re: /[a-z]/ },
            digit: { el: document.getElementById(`${id_prefix}_pw-digit`), re: /\d/ },
            special: { el: document.getElementById(`${id_prefix}_pw-special`), re: /[!@#$%^&*]/ }
        };

        const updateValidationUI = (element, isValid) => {
            if (!element) return;
            const icon = element.querySelector('i');
            if (isValid) {
                element.classList.remove('text-muted');
                element.classList.add('text-success');
                icon.classList.remove('bi-x-circle');
                icon.classList.add('bi-check-circle-fill');
            } else {
                element.classList.add('text-muted');
                element.classList.remove('text-success');
                icon.classList.remove('bi-check-circle-fill');
                icon.classList.add('bi-x-circle');
            }
        };

        input.addEventListener('input', () => {
            const password = input.value;
            let allValid = true;

            for (const key in conditions) {
                const isValid = conditions[key].re.test(password);
                updateValidationUI(conditions[key].el, isValid);
                if (!isValid) {
                    allValid = false;
                }
            }
            saveBtn.disabled = !allValid;
        });

        // Reset UI when edit button is clicked
        const editBtn = passwordItem.closest('.detail-item').querySelector('.edit-btn');
        editBtn.addEventListener('click', () => {
            input.value = '';
            saveBtn.disabled = true;
            for (const key in conditions) {
                updateValidationUI(conditions[key].el, false);
            }
             // Hide any lingering server error messages
            const errorMsgElement = passwordItem.querySelector('.update-error-msg');
            if (errorMsgElement) errorMsgElement.classList.add('d-none');
        });
    };

    // --- Initialization ---
    loadAppointmentData();
    loadUserDetails();
    setupEditSaveLogic('#details-content-mobile');
    setupEditSaveLogic('#details-content-desktop');
    setupProfilePicturePreview('#details-content-mobile');
    setupProfilePicturePreview('#details-content-desktop');
    setupPasswordValidation('#details-content-mobile');
    setupPasswordValidation('#details-content-desktop');

    // --- LOGIC TO KEEP THE ACTIVE TAB AFTER REFRESH (Desktop only) ---
    // This functionality applies to the desktop view that uses tabs.
    // The mobile view uses offcanvas menus, which have a different behavior (they close and return to the main menu).
    const desktopMenu = document.querySelector('#desktop-menu-tab');
    if (desktopMenu) {
        // Step 1: When a new tab is shown, we save its ID in localStorage.
        desktopMenu.addEventListener('shown.bs.tab', event => {
            const tabId = event.target.getAttribute('data-bs-target');
            if (tabId) {
                localStorage.setItem('activeProfileTab', tabId);
            }
        });

        // Step 2: On page load, we look for a saved tab in localStorage.
        const lastActiveTabId = localStorage.getItem('activeProfileTab');
        if (lastActiveTabId) {
            // Find the button that activates the saved tab.
            const triggerEl = document.querySelector(`button[data-bs-target='${lastActiveTabId}']`);
            if (triggerEl) {
                // We use the Bootstrap JavaScript API to show the correct tab.
                // This will handle adding/removing the 'active' and 'show' classes.
                const tab = new bootstrap.Tab(triggerEl);
                tab.show();
            }
        }
    }
});
