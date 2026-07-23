alert("APP JS WORKING");

document
  .getElementById("registerForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    alert("FORM SUBMITTED");
  });
