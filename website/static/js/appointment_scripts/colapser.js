document.addEventListener('DOMContentLoaded', () => {
// --- SELECTOARE & INSTANTE BOOTSTRAP ---
const employeePanel = {
    header: document.querySelector('[data-bs-target="#employee-list-collapse"]'),
    el: document.getElementById('employee-list-collapse'),
    items: document.querySelectorAll('.person-item')
};
const calendarPanel = {
    header: document.querySelector('[data-bs-target="#calendar-collapse"]'),
    el: document.getElementById('calendar-collapse'),
    daysContainer: document.getElementById('calendar-days')
};
const hoursPanel = {
    header: document.querySelector('[data-bs-target="#hours-collapse"]'),
    el: document.getElementById('hours-collapse'),
    slots: document.querySelectorAll('.time-slot')
};

const bsEmployeeCollapse = employeePanel.el ? new bootstrap.Collapse(employeePanel.el, { toggle: false }) : null;
const bsCalendarCollapse = calendarPanel.el ? new bootstrap.Collapse(calendarPanel.el, { toggle: false }) : null;
const bsHoursCollapse = hoursPanel.el ? new bootstrap.Collapse(hoursPanel.el, { toggle: false }) : null;

const allHeaders = [employeePanel.header, calendarPanel.header, hoursPanel.header].filter(Boolean);
const allCollapseInstances = [bsEmployeeCollapse, bsCalendarCollapse, bsHoursCollapse].filter(Boolean);

// --- LOGICA PENTRU ROTIREA SAGETII (CHEVRON) ---
allCollapseInstances.forEach(instance => {
    if (!instance) return;
    const header = document.querySelector(`[data-bs-target="#${instance._element.id}"]`);
    if (header) {
        instance._element.addEventListener('show.bs.collapse', () => {
            header.setAttribute('aria-expanded', 'true');
        });
        instance._element.addEventListener('hide.bs.collapse', () => {
            header.setAttribute('aria-expanded', 'false');
        });
    }
});

const manageDisplayMode = () => {
    const isDesktop = window.innerWidth >= 992;

    if (isDesktop) {
        allCollapseInstances.forEach(collapse => collapse.show());
        allHeaders.forEach(header => {
            header.classList.add('collapse-disabled');
            header.removeAttribute('data-bs-toggle');
            const icon = header.querySelector('.chevron-icon');
            if (icon) icon.style.display = 'none';
        });
    } else {
        allHeaders.forEach(header => {
            header.classList.remove('collapse-disabled');
            header.setAttribute('data-bs-toggle', 'collapse');
            const icon = header.querySelector('.chevron-icon');
            if (icon) icon.style.display = 'block';
        });
        bsEmployeeCollapse.show();
        bsCalendarCollapse.hide();
        bsHoursCollapse.hide();
    }
};

const isMobile = () => window.innerWidth < 992;

// --- LOGICA PAS-CU-PAS DECLANSATA DE SELECTII ---
if (employeePanel.items.length > 0) {
    employeePanel.items.forEach(item => {
        item.addEventListener('click', () => {
            employeePanel.items.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            if (isMobile()) {
                bsEmployeeCollapse.hide();
                bsCalendarCollapse.show();
            }
        });
    });
}

if (calendarPanel.daysContainer) {
     calendarPanel.daysContainer.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('calendar-day') && !target.classList.contains('empty')) {
            const selectedDay = calendarPanel.daysContainer.querySelector('.selected');
            if (selectedDay) selectedDay.classList.remove('selected');
            target.classList.add('selected');

            if (isMobile()) {
                bsCalendarCollapse.hide();
                bsHoursCollapse.show();
            }
        }
    });
}

if (hoursPanel.slots.length > 0) {
    hoursPanel.slots.forEach(slot => {
        slot.addEventListener('click', () => {
            const activeSlot = hoursPanel.el.querySelector('.time-slot.active');
            if (activeSlot) activeSlot.classList.remove('active');
            slot.classList.add('active');
        });
    });
}

// --- LOGICA CALENDAR ---
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
let currentDate = new Date();
const currentMonthYear = document.getElementById('current-month-year');

function renderCalendar() {
    if (!calendarPanel.daysContainer) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    calendarPanel.daysContainer.innerHTML = '';
    if (currentMonthYear) currentMonthYear.textContent = `${monthNames[month]} ${year}`;

    const weekdaysContainer = document.getElementById('calendar-weekdays');
    if(weekdaysContainer) {
        weekdaysContainer.innerHTML = '';
        dayNames.forEach(day => weekdaysContainer.innerHTML += `<div class="calendar-weekday">${day}</div>`);
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
        dayCell.dataset.date = new Date(year, month, day).toISOString();

        if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
            dayCell.classList.add('today');
        }
        calendarPanel.daysContainer.appendChild(dayCell);
    }
}

const prevBtn = document.getElementById('prev-month-btn');
const nextBtn = document.getElementById('next-month-btn');
if(prevBtn) prevBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});
if(nextBtn) nextBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

// --- INITIALIZARE ---
renderCalendar();
manageDisplayMode();
window.addEventListener('resize', manageDisplayMode);
});