// Add an onclick function to a button with an ID "uploadButton"
document.getElementById("submit").onclick = function () {
    alert("Upload button clicked!");
};

// Existing code for handling form submission
document.getElementById("uploadForm").addEventListener("submit", async function (e) {
    e.preventDefault();
  
    const data = new FormData(this);
  
    const response = await fetch('/api/upload', {
        method: 'POST',
        body: data
    });
  
    const ans = await response.json();
    document.getElementById("status").innerText = ans.message;
});
