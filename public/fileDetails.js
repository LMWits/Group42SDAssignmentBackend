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

function toggleEditForm() {
  const formDiv = document.getElementById("edit-form");
  formDiv.style.display = formDiv.style.display === "none" ? "block" : "none";
}

//1. GET files
/*
replace fetch with:
local - http://localhost:3000/files/${fileId}
or
remote - https://group42backend-cxdxgmhrduhye8b3.uksouth-01.azurewebsites.net/files/${fileId}
*/
function loadFileDetails() {
  fetch(`https://group42backend-cxdxgmhrduhye8b3.uksouth-01.azurewebsites.net/files/${fileId}`)
    .then((res) => res.json())
    .then((file) => {
      fileTitle.textContent = file.title;
      fileDescription.textContent = file.description || "(none)";
      
      if(file.path.length!=0){
        fileFolder.textContent = file.path || "(no folder)";
      }else{
        fileFolder.textContent = "(no folder)";
      }
      
      titleInput.value = file.title;
      descriptionInput.value = file.description;
      folderInput.value = file.folderPath || "";
    })
    .catch((err) => console.error("Error loading file:", err));
}

//2. UPDATE files
/*
replace fetch with:
local - http://localhost:3000/files/${fileId}
or
remote - https://group42backend-cxdxgmhrduhye8b3.uksouth-01.azurewebsites.net/files/${fileId}
*/
form.addEventListener("submit", (e) => {
  e.preventDefault();

  //auto-fill file & handle input
  const updatedFile = {
    title: titleInput.value,
    description: descriptionInput.value,
    path: folderInput.value ? folderInput.value.split("/").map(f => f.trim()) : [], // split by "/" to get folders
  };

  //update request
  fetch(`https://group42backend-cxdxgmhrduhye8b3.uksouth-01.azurewebsites.net/files/${fileId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedFile),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Failed to update file.");
      return res.json();
    })
    .then(() => {
      toggleEditForm();
      loadFileDetails();
    })
    .catch((err) => console.error(err));
});

//3. DELETE files
/*
replace fetch with:
local - http://localhost:3000/files/${fileId}
or
remote - https://group42backend-cxdxgmhrduhye8b3.uksouth-01.azurewebsites.net/files/${fileId}
*/
function deleteFile() {
  if (!confirm("Are you sure you want to delete this file?")) return;

  //delete request
  fetch(`https://group42backend-cxdxgmhrduhye8b3.uksouth-01.azurewebsites.net/files/${fileId}`, {
    method: "DELETE",
  })
    .then((res) => {
      if (!res.ok) throw new Error("Failed to delete file.");
      window.location.href = "adminHP.html";
    })
    .catch((err) => console.error(err));
}

loadFileDetails();

