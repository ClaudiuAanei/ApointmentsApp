document.addEventListener('DOMContentLoaded', function() {
// --- CALENDAR LOGIC ---
const calendarDays = document.getElementById('calendar-days');
const calendarWeekdays = document.getElementById('calendar-weekdays');
const currentMonthYear = document.getElementById('current-month-year');
const prevMonthBtn = document.getElementById('prev-month-btn');
const nextMonthBtn = document.getElementById('next-month-btn');

let currentDate = new Date();
let selectedCell = null;

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    calendarDays.innerHTML = '';
    currentMonthYear.textContent = `${monthNames[month]} ${year}`;
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('calendar-day', 'empty');
        calendarDays.appendChild(emptyCell);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('calendar-day');
        dayCell.textContent = day;
        dayCell.dataset.date = new Date(year, month, day).toISOString();

        // Highlight today's date
        const today = new Date();
        if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
            dayCell.classList.add('today');
        }

        // Maintain selection after re-rendering
        if (selectedCell && selectedCell.dataset.date === dayCell.dataset.date) {
            dayCell.classList.add('selected');
            selectedCell = dayCell; // Update reference to the new cell
        }

        dayCell.addEventListener('click', () => selectDate(dayCell));
        calendarDays.appendChild(dayCell);
    }
}

function renderWeekdays() {
    calendarWeekdays.innerHTML = '';
    dayNames.forEach(day => {
       const weekdayCell = document.createElement('div');
       weekdayCell.classList.add('calendar-weekday');
       weekdayCell.textContent = day;
       calendarWeekdays.appendChild(weekdayCell);
    });
}

function selectDate(cell) {
    if (selectedCell) {
        selectedCell.classList.remove('selected');
    }
    selectedCell = cell;
    selectedCell.classList.add('selected');
}

prevMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

renderWeekdays();
renderCalendar();

// --- PEOPLE PANEL LOGIC ---
const personItems = document.querySelectorAll('.person-item');

personItems.forEach(item => {
    item.addEventListener('click', () => {
        const currentActive = document.querySelector('.person-item.active');
        if (currentActive) {
            currentActive.classList.remove('active');
        }
        item.classList.add('active');
    });
});

// --- TIME SLOTS LOGIC ---
const timeSlots = document.querySelectorAll('.time-slot');

timeSlots.forEach(slot => {
    slot.addEventListener('click', () => {
        const currentActiveSlot = document.querySelector('.time-slot.active');
        if (currentActiveSlot) {
            currentActiveSlot.classList.remove('active');
        }
        slot.classList.add('active');
    });
});

// --- SUBMIT BUTTON LOGIC ---
const submitBtn = document.getElementById('submit-booking-btn');
submitBtn.addEventListener('click', () => {
    // Add logic here to submit the appointment
    // For example, you can collect the selected data
    const selectedPerson = document.querySelector('.person-item.active');
    const selectedDay = document.querySelector('.calendar-day.selected');
    const selectedTime = document.querySelector('.time-slot.active');

    if (selectedPerson && selectedDay && selectedTime) {
        alert(
            `Appointment requested for: ${selectedPerson.textContent.trim()}\n` +
            `Date: ${new Date(selectedDay.dataset.date).toLocaleDateString('en-US')}\n` +
            `Time: ${selectedTime.textContent.trim()}`
        );
    } else {
        alert('Please select a person, a day, and a time slot.');
    }
});
});