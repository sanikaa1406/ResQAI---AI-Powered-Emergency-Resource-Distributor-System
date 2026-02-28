document.addEventListener("DOMContentLoaded", function () {

  const form = document.getElementById("responderForm");
  const successMsg = document.getElementById("successMsg");
  const errorMsg = document.getElementById("errorMsg");

  form.addEventListener("submit", async function (e) {

    e.preventDefault();   // 🔥 stops page refresh

    successMsg.textContent = "";
    errorMsg.textContent = "";

    const formData = {
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      state: document.getElementById("state").value,
      type: document.getElementById("type").value
    };

    try {

      const response = await fetch("http://localhost:5000/api/responders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {

        successMsg.textContent = "Registration successful! Redirecting...";

        setTimeout(() => {
          window.location.href = `responder-dashboard.html?id=${data._id}`;
        }, 1500);

      } else {
        errorMsg.textContent = data.error || "Registration failed";
      }

    } catch (error) {
      errorMsg.textContent = "Server not reachable";
      console.error(error);
    }

  });

});