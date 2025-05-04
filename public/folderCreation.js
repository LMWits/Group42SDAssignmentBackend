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
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
  
      const result=await response.json();
  
      if (response.ok) {
        document.getElementById("status").innerText = "✅ Folder created successfully!";
      } else {
        document.getElementById("status").innerText = "❌ Error: " + result.message;
      }
    } catch (err) {
      console.error(err);
      document.getElementById("status").innerText = "❌ Failed to connect to server.";
    }
  });
  