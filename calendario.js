// JavaScript Code - calendario.js
document.addEventListener("DOMContentLoaded", function () {
    const calendarTable = document.getElementById("calendarTable");
    const currentMonth = document.getElementById("currentMonth");
    const prevMonthBtn = document.getElementById("prevMonthBtn");
    const nextMonthBtn = document.getElementById("nextMonthBtn");

    let currentDate = new Date();
    let events = {};

    function displayCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const lastDay = new Date(year, month + 1, 0).getDate();

        currentMonth.textContent = `${getMonthName(month)} ${year}`;

        let cells = "<tr> <td class='titolo'> Domenica </td> <td class='titolo'> Lunedì </td>  <td class='titolo'> Martedì </td> <td class='titolo'> Mercoledì </td> <td class='titolo'> Giovedì </td> <td class='titolo'> Venerdì </td> <td class='titolo'> Sabato </td>";

        cells += "<tr>";
        for (let i = 0; i < firstDay; i++) {
            cells += "<td class='empty'></td>";
        }

        for (let day = 1; day <= lastDay; day++) {
            const dateKey = `${year}-${month + 1}-${day}`;
            const eventText = events[dateKey] ? `<br>${events[dateKey]}` : '';
            cells += `<td class='cell' data-date='${dateKey}'>${day}${eventText}</td>`;
            if ((firstDay + day - 1) % 7 === 6 && day !== lastDay) {
                cells += "</tr><tr>";
            }
        }
        cells += "</tr>";

        calendarTable.innerHTML = cells;
    }

    function getMonthName(monthIndex) {
        const monthNames = [
            "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio",
            "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
        ];
        return monthNames[monthIndex];
    }

    displayCalendar();

    prevMonthBtn.addEventListener("click", function () {
        currentDate.setMonth(currentDate.getMonth() - 1);
        displayCalendar();
    });

    nextMonthBtn.addEventListener("click", function () {
        currentDate.setMonth(currentDate.getMonth() + 1);
        displayCalendar();
    });

    calendarTable.addEventListener("click", function (event) {
        const cell = event.target;
        const date = cell.dataset.date;
        if (date) {
            const currentEvent = events[date];
            if (currentEvent) {
                // If there's already an event, prompt to remove it
                if (confirm(`Vuoi rimuovere l'impegno: "${currentEvent}"?`)) {
                    delete events[date];
                    displayCalendar();
                }
            } else {
                // If no event, prompt to add one
                const input = prompt("Inserisci l'impegno per il giorno " + date + ":");
                if (input !== null && input.trim() !== "") {
                    events[date] = input;
                    displayCalendar();
                }
            }
        }
    });
});