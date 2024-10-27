document.addEventListener("DOMContentLoaded", () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    alert('You must be logged in to view this page.');
    window.location.href = 'index.html'; // Redirect to login page
  }
});
