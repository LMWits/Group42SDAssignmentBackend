document.getElementById("file").addEventListener("change", function () {
    const fileName = this.files[0]?.name || "No file chosen";
    document.getElementById("fileNameDisplay").textContent = fileName;
  });

  function getAuthHeaders() {
    const token = localStorage.getItem('serverToken');
    return token ? { 'Authorization': 'Bearer ' + token } : {};
  }

  document.getElementById("uploadForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          ...getAuthHeaders()
        }
      });

      const result = await response.json();

      if (response.ok) {
        document.getElementById("status").innerText = result.message;
        alert("File uploaded successfully.")
      } else {
        document.getElementById("status").innerText = `❌ ${result.message}`;
        alert("File couldn't upload. Please try again.")
      }
    } catch (err) {
      console.error("Error during file upload:", err);
      document.getElementById("status").innerText = "❌ Upload failed. Please try again.";
    }
  });
