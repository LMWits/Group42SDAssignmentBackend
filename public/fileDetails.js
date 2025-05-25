function getAuthHeaders() {
  const token = localStorage.getItem('serverToken');
  return token ? { 'Authorization': 'Bearer ' + token } : {};
}

const file = JSON.parse(localStorage.getItem("selectedFile"));

if (!file) {
    document.body.innerHTML = "<p style='color:red; text-align:center;'>No file selected.</p>";
    throw new Error("No file found in localStorage.");
}

const fileId = file._id;
const fileTitle = document.getElementById("file-title");
const fileDescription = document.getElementById("file-description");
const fileFolder = document.getElementById("file-folder");
const fileUrl = document.getElementById("file-url");

const titleInput = document.getElementById("titleInput");
const descriptionInput = document.getElementById("descriptionInput");
const folderInput = document.getElementById("folderInput");
const form = document.getElementById("fileForm");

//1. GET files
/*
replace fetch with:
local - http://localhost:3000/files/${fileId}
or
remote - https://group42backendv2-hyckethpe4fwfjga.uksouth-01.azurewebsites.net/files/${fileId}
*/
// Function to load and display file details
function loadFileDetails() {
  fetch(`https://group42backendv2-hyckethpe4fwfjga.uksouth-01.azurewebsites.net/files/${fileId}`, {
    headers: {
      ...getAuthHeaders()
    }
  })
    .then((res) => res.json())
    .then((file) => {
      fileTitle.textContent = file.title;
      fileDescription.textContent = file.description || "(none)";

      if (file.path && file.path.length !== 0) {
        fileFolder.textContent = file.path.join(" / ");
      } else {
        fileFolder.textContent = "(no folder)";
      }

      // Only fill input fields if they exist (admin page)
      if (titleInput) titleInput.value = file.title;
      if (descriptionInput) descriptionInput.value = file.description;
      if (folderInput) folderInput.value = file.path ? file.path.join("/") : "";
    })
    .catch((err) => console.error("Error loading file:", err));
}
// Function to toggle edit form visibility (admin only)
function toggleEditForm() {
  const formDiv = document.getElementById("edit-form");
  if (formDiv) {
    formDiv.style.display = formDiv.style.display === "none" ? "block" : "none";
  }
}
//2. UPDATE files
/*
replace fetch with:
local - http://localhost:3000/files/${fileId}
or
remote - https://group42backendv2-hyckethpe4fwfjga.uksouth-01.azurewebsites.net/files/${fileId}
*/
// Handle form submission for updating file (admin only)
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const updatedFile = {
      title: titleInput.value,
      description: descriptionInput.value,
      path: folderInput.value ? folderInput.value.split("/").map(f => f.trim()) : [],
    };

    fetch(`https://group42backendv2-hyckethpe4fwfjga.uksouth-01.azurewebsites.net/files/${fileId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify(updatedFile),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to update file.");
        return res.json();
      })
      .then(() => {
        alert("File updated successfully.")
        toggleEditForm();
        loadFileDetails();
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to update file.Please try again");
      });
  });
}


//3. DELETE files
/*
replace fetch with:
local - http://localhost:3000/files/${fileId}
or
remote - https://group42backendv2-hyckethpe4fwfjga.uksouth-01.azurewebsites.netfiles/${fileId}
*/
// Function to delete file (admin only)
function deleteFile() {
  if (!confirm("Are you sure you want to delete this file?")) return;

  fetch(`https://group42backendv2-hyckethpe4fwfjga.uksouth-01.azurewebsites.net/files/${fileId}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders()
    }
  })
    .then((res) => {
      if (!res.ok) throw new Error("Failed to delete file.");
      alert("File deleted successfully.")
      window.location.href = "adminHP.html";
    })
    .catch((err) => {
      console.error(err);
      alert("Failed to delete the file. Please try again");
    });
}

//4. Download the file
function downloadFile() {
  if (!file || !file.blobUrl) {
    alert("File URL not available.");
    return;
  }

  const a = document.createElement("a");
  a.href = file.blobUrl;
  a.download = "";  // Browser decides filename
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}


loadFileDetails();
