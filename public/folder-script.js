document.addEventListener("DOMContentLoaded", () => {
  const folder = localStorage.getItem("currentFolder");

  if (!folder) {
      folderName.textContent = "No folder selected.";
      return;
  } else {
      folderName.textContent = `Folder: ${folder}`;
  }

  // Clear folderDisplay to prevent old folders from showing after reload
  folderDisplay.innerHTML = "";

  // 1. Fetch all top level folders in the current folder
  fetch(`https://group42backend-cxdxgmhrduhye8b3.uksouth-01.azurewebsites.net/folders/${encodeURIComponent(folder)}`)
      .then(response => {
          if (!response.ok) {
              throw new Error("Network response was not ok");
          }
          return response.json();
      })
      .then(folders => {
          if (folders.length === 0) {
              folderDisplay.innerHTML = "<p>No subfolders found in this folder.</p>";
              return;
          }

          // Dynamically append folder display
          folderDisplay.innerHTML = `<h2>All subfolders in ${folder}</h2>`;

          folders.forEach(folder => {
              const folderDiv = document.createElement("section");
              folderDiv.textContent = folder;
              folderDiv.className = "folder";
              folderDiv.style.margin = "10px";
              folderDiv.style.padding = "10px";
              folderDiv.style.border = "1px solid #888";
              folderDiv.style.borderRadius = "6px";
              folderDiv.style.backgroundColor = "#eef";
              folderDiv.style.cursor = "pointer";

              folderDiv.addEventListener("click", () => {
                  localStorage.setItem("currentFolder", folder);
                  window.location.href = "folder.html";
              });

              folderDisplay.appendChild(folderDiv);
          });

      })
      .catch(error => {
          folderDisplay.innerHTML = "<p style=' text-align:center; margin:10px; border-radius:40px; width:250px; background:red ;color:white;'>Error loading files from server.</p>";
          console.error("Fetch error:", error);
      });

  // 2. fetch files in the cliked folder
  console.log("Folder being fetched:", folder); //remove
  console.log("Fetch URL:", `https://group42backend-cxdxgmhrduhye8b3.uksouth-01.azurewebsites.net/folder/files/${encodeURIComponent(folder)}`); //remove

  fetch(`https://group42backend-cxdxgmhrduhye8b3.uksouth-01.azurewebsites.net/folder/files/${encodeURIComponent(folder)}`)
      .then(res => {
          if (!res.ok) throw new Error(`Server responded with ${res.status}`);
          return res.json();
      })
      .then(files => {
          console.log("Files fetched:", files); //remove

          if (files.length === 0) {
              fileDisplay.innerHTML = "<p>No files in this folder.</p>";
              return;
          }

          fileDisplay.innerHTML = "<h2>Files</h2>";

          files.forEach((file, i) => {
              const fileCard = document.createElement("section");
              fileCard.className = "folder";

              fileCard.innerHTML = `
                  <strong>Title:</strong> ${file.title}<br>
                  <strong>Description:</strong> ${file.description}<br>
                  <strong>Uploaded:</strong> ${new Date(file.uploadDate).toLocaleDateString()}<br>
                  <strong>Path:</strong> ${file.path?.join(" / ") || "None"}<br><br>
                  <button class="infoBtn" data-index="${i}">More Info</button>
              `;

              fileDisplay.appendChild(fileCard);
          });
      })
      .catch(err => {
          fileDisplay.innerHTML = "<p style=' text-align:center; margin:10px; border-radius:40px; width:250px; background:red ;color:white;'>Error loading files.</p>";
          console.error(err);
      });

});
