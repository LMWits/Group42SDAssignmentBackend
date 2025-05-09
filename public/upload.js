document.getElementById("file").addEventListener("change", function () {
    const fileName = this.files[0]?.name || "No file chosen";
    document.getElementById("fileNameDisplay").textContent = fileName;
  });
  
  document.getElementById("uploadForm").addEventListener("submit", async function (e) {
    e.preventDefault();
  
    const form = e.target;
    const formData = new FormData(form);
  
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
  
      const result = await response.json();
  
      if (response.ok) {
        document.getElementById("status").innerText = result.message;
      } else {
        document.getElementById("status").innerText = `❌ ${result.message}`;
      }
    } catch (err) {
      console.error("Error during file upload:", err);
      document.getElementById("status").innerText = "❌ Upload failed. Please try again.";
    }
  });
  