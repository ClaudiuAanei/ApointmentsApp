const htmlEl = document.documentElement;
const themeToggleBtn = document.getElementById("themeToggle");
const icon = themeToggleBtn.querySelector("i");
const navbar = document.getElementById("mainNavbar");

function setTheme(theme) {
  htmlEl.setAttribute("data-bs-theme", theme);
  localStorage.setItem("theme", theme);

  if (theme === "dark") {
    icon.classList.remove("fa-moon");
    icon.classList.add("fa-sun");
    themeToggleBtn.setAttribute("aria-label", "Switch to light mode");
    themeToggleBtn.setAttribute("title", "Switch to light mode");

    navbar.classList.remove("navbar-light", "bg-light");
    navbar.classList.add("navbar-dark", "bg-dark");
  } else {
    icon.classList.remove("fa-sun");
    icon.classList.add("fa-moon");
    themeToggleBtn.setAttribute("aria-label", "Switch to dark mode");
    themeToggleBtn.setAttribute("title", "Switch to dark mode");

    navbar.classList.remove("navbar-dark", "bg-dark");
    navbar.classList.add("navbar-light", "bg-light");
  }
}

// Initialize la încărcare
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem("theme") || "light";
  setTheme(savedTheme);

  // Toggle la click
  themeToggleBtn.addEventListener("click", () => {
    const currentTheme = htmlEl.getAttribute("data-bs-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";
    setTheme(newTheme);
  });
});
