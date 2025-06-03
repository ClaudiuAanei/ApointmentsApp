// google-login.js

function googleLoginPopup() {
  const width = 500;
  const height = 600;

  const left = screen.width / 2 - width / 2;
  const top = screen.height / 2 - height / 2;

  const popup = window.open(
    gmailLoginUrl, // variabila definită în base.html
    "googleLoginWindow",
    `width=${width},height=${height},top=${top},left=${left}`
  );

  const interval = setInterval(() => {
    if (popup.closed) {
      clearInterval(interval);
      window.location.reload(); // sau redirecționezi programatic
    }
  }, 1000);
}
