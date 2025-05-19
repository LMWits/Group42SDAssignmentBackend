document.getElementById("createFolderForm").addEventListener("submit", async function (e) {
    e.preventDefault();

const title = document.getElementById("folderTitle").value.trim();
const description = document.getElementById("folderDescription").value.trim();

let path = [];

const currentFolder = localStorage.getItem("currentFolder");
const currentPath = JSON.parse(localStorage.getItem("currentPath") || "[]");

if (currentFolder && currentPath.length > 0)
    {
  //If the user is inside a folder, preserve that path
  path = [...currentPath,title];
} else
{
  path = [title]; // Explicitly set to empty (top level folder)
}

    const payload={
      title,
      description,
      path
    };

    try {
      const response = await fetch("https://group42backendv2-hyckethpe4fwfjga.uksouth-01.azurewebsites.net/createFolder", {
        method: "POST",
        headers: {
           "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      const result=await response.json();

      if (response.ok) {
        document.getElementById("status").innerText = "✅ Folder created successfully!";
        alert("Folder created successfully.");
        window.location.href = "adminHP.html"; // check if this is fine to go back to home page
      } else {
        document.getElementById("status").innerText = "❌ Error: " + result.message;
        alert("Failed to create folder. Please try again");
        window.location.href = "adminHP.html";
      }
    } catch (err) {
      console.error(err);
      document.getElementById("status").innerText = "❌ Failed to connect to server.";
    }
  });


// Helper function to get Authorization headers
function getAuthHeaders() {
  const token = localStorage.getItem('serverToken');
  return token ? { 'Authorization': 'Bearer ' + token } : {};
}

