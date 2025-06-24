const htmlEl = document.documentElement;
const themeToggleBtn = document.getElementById("themeToggle");
const icon = themeToggleBtn.querySelector("i"); // Icona este acum "thumb"-ul

const navbar = document.getElementById("mainNavbar"); // Asigură-te că navbar este definit

function setTheme(theme) {
  // 1. Toggle custom theme classes on HTML element
  htmlEl.classList.remove("light-theme", "dark-theme");
  htmlEl.classList.add(`${theme}-theme`);
  localStorage.setItem("theme", theme);

  // 2. Toggle Bootstrap navbar classes for component styling
  if (theme === "dark") {
    navbar.classList.remove("navbar-light", "bg-light");
    navbar.classList.add("navbar-dark", "bg-dark");
  } else {
    navbar.classList.remove("navbar-dark", "bg-dark");
    navbar.classList.add("navbar-light", "bg-light");
  }

  // 3. Update theme toggle icon position and attributes (NEW LOGIC)
  if (theme === "dark") {
    // Muta iconița (thumb-ul) la dreapta și schimbă-i culoarea/clasa vizual
    themeToggleBtn.classList.add('active'); // Adaugă o clasă pentru stilizarea dark mode
    icon.classList.remove("fa-moon");
    icon.classList.add("fa-sun");
    themeToggleBtn.setAttribute("aria-label", "Switch to light mode");
    themeToggleBtn.setAttribute("title", "Switch to light mode");
  } else {
    // Muta iconița (thumb-ul) la stânga și schimbă-i culoarea/clasa vizual
    themeToggleBtn.classList.remove('active'); // Scoate clasa pentru stilizarea light mode
    icon.classList.remove("fa-sun");
    icon.classList.add("fa-moon");
    themeToggleBtn.setAttribute("aria-label", "Switch to dark mode");
    themeToggleBtn.setAttribute("title", "Switch to dark mode");
  }
}

// Inline script deja setează tema inițială pe htmlEl și navbar.
// Aici, ne asigurăm că butonul de toggle are starea vizuală corectă la încărcare.
document.addEventListener('DOMContentLoaded', () => {
  const initialTheme = localStorage.getItem("theme") || "light";
  if (initialTheme === "dark") {
    themeToggleBtn.classList.add('active'); // Aplică clasa 'active' dacă tema e dark
    icon.classList.remove("fa-moon");
    icon.classList.add("fa-sun");
  } else {
    themeToggleBtn.classList.remove('active');
    icon.classList.remove("fa-sun");
    icon.classList.add("fa-moon");
  }

  // Add click listener for theme toggling
  themeToggleBtn.addEventListener("click", () => {
    const currentTheme = htmlEl.classList.contains("light-theme") ? "light" : "dark";
    const newTheme = currentTheme === "light" ? "dark" : "light";
    setTheme(newTheme);
  });
});