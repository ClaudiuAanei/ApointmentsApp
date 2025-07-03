document.addEventListener('DOMContentLoaded', () => {
    // ---------------------------------
    // SECTION 1: STATE & CONFIGURATION
    // ---------------------------------
    let selectedEmployeeId = null;
    let selectedDate = null;
    let selectedTimeSlot = null;
    let currentDate = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // ---------------------------------
    // SECTION 2: DOM ELEMENT SELECTORS
    // ---------------------------------
    const employeePanel = {
        header: document.querySelector('[data-bs-target="#employee-list-collapse"]'),
        el: document.getElementById('employee-list-collapse'),
        list: document.querySelector('.people-list')
    };
    const calendarPanel = {
        header: document.querySelector('[data-bs-target="#calendar-collapse"]'),
        el: document.getElementById('calendar-collapse'),
        daysContainer: document.getElementById('calendar-days'),
        weekdaysContainer: document.getElementById('calendar-weekdays'),
        currentMonthYear: document.getElementById('current-month-year'),
        prevBtn: document.getElementById('prev-month-btn'),
        nextBtn: document.getElementById('next-month-btn')
    };
    const hoursPanel = {
        header: document.querySelector('[data-bs-target="#hours-collapse"]'),
        el: document.getElementById('hours-collapse'),
        container: document.querySelector('.time-slots-container')
    };
    const bookBtn = document.getElementById('submit-booking-btn');
    const finalConfirmBtn = document.getElementById('confirm-booking-final-btn');
    const confirmationModalEl = document.getElementById('confirmationModal');
    const messageContainer = document.getElementById('booking-message-container');
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    const findDayBtn = document.getElementById('find-first-day-btn');


    // ------------------------------------------
    // SECTION 3: BOOTSTRAP COLLAPSE INSTANCES
    // ------------------------------------------
    const bsEmployeeCollapse = employeePanel.el ? new bootstrap.Collapse(employeePanel.el, { toggle: false }) : null;
    const bsCalendarCollapse = calendarPanel.el ? new bootstrap.Collapse(calendarPanel.el, { toggle: false }) : null;
    const bsHoursCollapse = hoursPanel.el ? new bootstrap.Collapse(hoursPanel.el, { toggle: false }) : null;
    const allCollapseInstances = [bsEmployeeCollapse, bsCalendarCollapse, bsHoursCollapse].filter(Boolean);

    // ---------------------------------
    // SECTION 4: HELPER FUNCTIONS
    // ---------------------------------
    const isMobile = () => window.innerWidth < 992;

    const showMessage = (message, isError = false) => {
        if (messageContainer) {
            messageContainer.innerHTML = message;
            messageContainer.className = 'w-100 text-center ' + (isError ? 'message-error' : 'message-success');
        }
    };

    const formatDate = (dateInput) => {
        const dateObject = new Date(dateInput);
        const year = dateObject.getFullYear();
        const month = String(dateObject.getMonth() + 1).padStart(2, '0');
        const day = String(dateObject.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // ---------------------------------
    // SECTION 5: CORE LOGIC (CALENDAR & API)
    // ---------------------------------
    function renderWeekdays() {
        if (!calendarPanel.weekdaysContainer) return;
        calendarPanel.weekdaysContainer.innerHTML = '';
        dayNames.forEach(day => {
            const weekdayCell = document.createElement('div');
            weekdayCell.classList.add('calendar-weekday');
            weekdayCell.textContent = day;
            calendarPanel.weekdaysContainer.appendChild(weekdayCell);
        });
    }

    function renderCalendar() {
        if (!calendarPanel.daysContainer) return;
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        calendarPanel.daysContainer.innerHTML = '';
        if (calendarPanel.currentMonthYear) {
            calendarPanel.currentMonthYear.textContent = `${monthNames[month]} ${year}`;
        }

        const firstOfDisplayedMonth = new Date(year, month, 1);
        const firstOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        if (calendarPanel.prevBtn) {
            calendarPanel.prevBtn.disabled = firstOfDisplayedMonth <= firstOfCurrentMonth;
        }

        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('calendar-day', 'empty');
            calendarPanel.daysContainer.appendChild(emptyCell);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('calendar-day');
            dayCell.textContent = day;
            const cellDate = new Date(year, month, day);
            dayCell.dataset.date = cellDate.toISOString();

            if (cellDate < today) {
                dayCell.classList.add('disabled');
            }
            if (formatDate(cellDate) === formatDate(today)) {
                dayCell.classList.add('today');
            }
            if (selectedDate && formatDate(cellDate) === formatDate(selectedDate)) {
                 dayCell.classList.add('selected');
            }
            calendarPanel.daysContainer.appendChild(dayCell);
        }
    }

    const fetchAvailableHours = async () => {
        if (!selectedEmployeeId || !selectedDate) return;
        const formattedDate = formatDate(selectedDate);
        if (!csrfToken) {
            console.error('CSRF token not found!');
            return;
        }
        try {
            const response = await fetch('/get_available_hours', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
                body: JSON.stringify({ employee_id: selectedEmployeeId, date: formattedDate }),
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const availableHours = await response.json();
            updateAvailableHoursUI(availableHours);
        } catch (error) {
            console.error('Error fetching available hours:', error);
            if (hoursPanel.container) {
                hoursPanel.container.innerHTML = '<p class="message-error">Could not load hours.</p>';
            }
        }
    };

    const updateAvailableHoursUI = (hours) => {
        if (!hoursPanel.container || !findDayBtn) return;
        hoursPanel.container.innerHTML = '';
        selectedTimeSlot = null;
        findDayBtn.style.display = 'none';

        if (hours.length === 0) {
            hoursPanel.container.innerHTML = '<p>No available slots for this day.</p>';
            if (selectedEmployeeId && selectedDate) {
                 findDayBtn.style.display = 'block';
            }
            return;
        }

        hours.forEach(slot => {
            const slotDiv = document.createElement('div');
            slotDiv.classList.add('time-slot');
            slotDiv.textContent = slot;
            hoursPanel.container.appendChild(slotDiv);
        });
    };

    // -------------------------------------------
    // SECTION 6: RESPONSIVE & UI DISPLAY LOGIC
    // -------------------------------------------
    const manageDisplayMode = () => {
        const allHeaders = [employeePanel.header, calendarPanel.header, hoursPanel.header].filter(Boolean);
        if (!isMobile()) {
            // Comportament pe Desktop: Toate panourile sunt deschise și nu pot fi închise
            allCollapseInstances.forEach(collapse => collapse?.show());
            allHeaders.forEach(header => {
                header.classList.add('collapse-disabled');
                header.removeAttribute('data-bs-toggle');
                const icon = header.querySelector('.chevron-icon');
                if (icon) icon.style.display = 'none';
            });
        } else {
            // START: MODIFIED SECTION FOR MOBILE
            // Comportament pe Mobil: Toate panourile sunt deschise, dar pot fi închise de utilizator
            allHeaders.forEach(header => {
                header.classList.remove('collapse-disabled');
                header.setAttribute('data-bs-toggle', 'collapse');
                const icon = header.querySelector('.chevron-icon');
                if (icon) icon.style.display = 'block';
            });
            // Deschide toate panourile la încărcare
            allCollapseInstances.forEach(collapse => collapse?.show());
            // END: MODIFIED SECTION FOR MOBILE
        }
    };

    // ---------------------------------
    // SECTION 7: EVENT LISTENERS
    // ---------------------------------
    if (employeePanel.list) {
        employeePanel.list.addEventListener('click', (event) => {
            const personItem = event.target.closest('.person-item');
            if (!personItem) return;

            showMessage('');

            employeePanel.list.querySelectorAll('.person-item').forEach(item => item.classList.remove('active'));
            personItem.classList.add('active');
            selectedEmployeeId = personItem.dataset.employeeId;
            selectedDate = null;
            selectedTimeSlot = null;
            if (calendarPanel.daysContainer) calendarPanel.daysContainer.querySelectorAll('.selected').forEach(d => d.classList.remove('selected'));
            if (hoursPanel.container) hoursPanel.container.innerHTML = '<p>Select a date to see available hours.</p>';

            if(findDayBtn) findDayBtn.style.display = 'none';

            if (selectedDate) {
                fetchAvailableHours();
            }

            // START: MODIFIED SECTION FOR MOBILE SCROLL
            // În loc să închidă panoul curent și să-l deschidă pe următorul, acum va derula la panoul calendarului
            if (isMobile() && calendarPanel.el) {
                setTimeout(() => {
                    calendarPanel.el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100); // Un mic delay pentru a asigura o tranziție fluidă
            }
            // END: MODIFIED SECTION FOR MOBILE SCROLL
        });
    }

    if (calendarPanel.daysContainer) {
        calendarPanel.daysContainer.addEventListener('click', (event) => {
            const dayElement = event.target.closest('.calendar-day:not(.empty):not(.disabled)');
            if (!dayElement) return;

             showMessage('');

            if (!selectedEmployeeId) {
                return showMessage("Please select an employee first.", true);
            }
            calendarPanel.daysContainer.querySelectorAll('.calendar-day').forEach(item => item.classList.remove('selected'));
            dayElement.classList.add('selected');
            selectedDate = dayElement.dataset.date;
            fetchAvailableHours();

            // START: MODIFIED SECTION FOR MOBILE SCROLL
            // În loc să închidă panoul calendarului și să-l deschidă pe cel al orelor, acum va derula la panoul orelor
            if (isMobile() && hoursPanel.el) {
                 setTimeout(() => {
                    hoursPanel.el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100); // Un mic delay pentru a asigura o tranziție fluidă
            }
            // END: MODIFIED SECTION FOR MOBILE SCROLL
        });
    }

    if (calendarPanel.prevBtn) {
        calendarPanel.prevBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
    }

    if (calendarPanel.nextBtn) {
        calendarPanel.nextBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }

    if (hoursPanel.container) {
        hoursPanel.container.addEventListener('click', (event) => {
            const timeSlotElement = event.target.closest('.time-slot');
            if (!timeSlotElement) return;
            showMessage('');
            hoursPanel.container.querySelectorAll('.time-slot').forEach(slot => slot.classList.remove('active'));
            timeSlotElement.classList.add('active');
            selectedTimeSlot = timeSlotElement.textContent;
        });
    }

    if (findDayBtn) {
        findDayBtn.addEventListener('click', async () => {
            if (!selectedEmployeeId) {
                showMessage('An employee must be selected to find the first available day.', true);
                return;
            }

            findDayBtn.disabled = true;
            findDayBtn.textContent = 'Searching...';
            showMessage('');

            try {
                const response = await fetch('/firstday-available', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
                    body: JSON.stringify({ employee_id: selectedEmployeeId }),
                });

                const result = await response.json();

                if (response.ok && result.status === true) {
                    const [year, month, day] = result.data.split('-').map(Number);
                    const newAvailableDate = new Date(Date.UTC(year, month - 1, day));

                    currentDate = newAvailableDate;
                    selectedDate = newAvailableDate.toISOString();

                    renderCalendar();
                    await fetchAvailableHours();

                } else {
                    showMessage(result.message || 'No available day found in the next 60 days.', true);
                }

            } catch (error) {
                console.error('Error finding first available day:', error);
                showMessage('An unexpected network error occurred. Please try again.', true);
            } finally {
                findDayBtn.disabled = false;
                findDayBtn.textContent = 'Find First Day Available';
            }
        });
    }

    if (bookBtn && finalConfirmBtn && confirmationModalEl) {
        const confirmationModal = new bootstrap.Modal(confirmationModalEl);

        bookBtn.addEventListener('click', () => {
            showMessage('', false);

            if (!selectedEmployeeId) return showMessage('You must select an employee.', true);
            if (!selectedDate) return showMessage('You must select a date.', true);
            if (!selectedTimeSlot) return showMessage('You must select a time slot.', true);

            const employeeElement = document.querySelector(`.person-item[data-employee-id="${selectedEmployeeId}"] span`);
            const employeeName = employeeElement ? employeeElement.textContent.trim() : 'N/A';

            const displayDate = new Date(selectedDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            document.getElementById('confirm-employee').textContent = employeeName;
            document.getElementById('confirm-date').textContent = displayDate;
            document.getElementById('confirm-time').textContent = selectedTimeSlot;

            confirmationModal.show();
        });

        finalConfirmBtn.addEventListener('click', async () => {
            try {
                finalConfirmBtn.disabled = true;
                finalConfirmBtn.innerHTML = '<strong>Booking...</strong>';

                const response = await fetch('/book_appointment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
                    body: JSON.stringify({
                        employee_id: selectedEmployeeId,
                        date: formatDate(selectedDate),
                        time_slot: selectedTimeSlot
                    })
                });
                const result = await response.json();
                confirmationModal.hide();
                if (response.ok) {
                    showMessage(result.message, false);
                    bookBtn.disabled = true;
                    setTimeout(() => {
                        if (bookBtn.dataset.successUrl) {
                            window.location.href = bookBtn.dataset.successUrl;
                        }
                    }, 2000);
                } else {
                    showMessage(result.message, true);
                }
            } catch (error) {
                confirmationModal.hide();
                console.error('Booking failed:', error);
                showMessage('An unexpected network error occurred. Please try again.', true);
            } finally {
                finalConfirmBtn.disabled = false;
                finalConfirmBtn.innerHTML = '<strong>Yes, confirm</strong>';
            }
        });
    }

    allCollapseInstances.forEach(instance => {
        if (!instance) return;
        const header = document.querySelector(`[data-bs-target="#${instance._element.id}"]`);
        if (header) {
            instance._element.addEventListener('show.bs.collapse', () => header.setAttribute('aria-expanded', 'true'));
            instance._element.addEventListener('hide.bs.collapse', () => header.setAttribute('aria-expanded', 'false'));
        }
    });

    window.addEventListener('resize', manageDisplayMode);

    // ---------------------------------
    // SECTION 8: INITIALIZATION
    // ---------------------------------
    renderWeekdays();
    renderCalendar();
    manageDisplayMode();
});