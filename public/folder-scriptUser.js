document.addEventListener("DOMContentLoaded", () => {
    const folder = localStorage.getItem("currentFolder");
  
    if (!folder) {
        folderName.textContent = "No folder selected.";
        return;
    } else {
        folderName.textContent = `${folder}`;
    }
  
    // Clear folderDisplay to prevent old folders from showing after reload
    folderDisplay.innerHTML = "";
  
    // 1. Fetch all top level folders in the current folder
    /*
  
  * replace fetch with:
  Remote - https://group42backendv2-hyckethpe4fwfjga.uksouth-01.azurewebsites.net/folders/${encodeURIComponent(folder)}
  or
  Local - http://localhost:3000/folders/${encodeURIComponent(folder)}
    */
    fetch(`https://group42backendv2-hyckethpe4fwfjga.uksouth-01.azurewebsites.net/folders/${encodeURIComponent(folder)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(folders => {
            if (folders.length === 0) {
                folderDisplay.innerHTML = `<p style="color: white; >No subfolders found in this folder.</p>`;
                return;
            }
  
            // Dynamically append folder display
            folderDisplay.innerHTML = `<h2 style="color: white; >All subfolders in ${folder}</h2>`;
  
            folders.forEach(folder => {
                const folderDiv = document.createElement("section");
                folderDiv.textContent = folder;
                folderDiv.className = "folder";
  
                folderDiv.addEventListener("click", () => {
                    localStorage.setItem("currentFolder", folder);
                    window.location.href = "folderUser.html";
                });
  
                folderDisplay.appendChild(folderDiv);
            });
  
        })
        .catch(error => {
            folderDisplay.innerHTML = "<p style=' text-align:center; margin:10px; border-radius:40px; width:250px; background:red ;color:white;'>Error loading files from server.</p>";
            console.error("Fetch error:", error);
        });
  
  
  // 2. fetch files in the clicked folder
  /*
  replace fetch with:
  remote - https://group42backendv2-hyckethpe4fwfjga.uksouth-01.azurewebsites.net/folder/files/${encodeURIComponent(folder)}
  or
  local - http://localhost:3000/folder/files/${encodeURIComponent(folder)}
    */
    console.log("Folder being fetched:", folder); //remove
    console.log("Fetch URL:", `https://group42backendv2-hyckethpe4fwfjga.uksouth-01.azurewebsites.net/folder/files/${encodeURIComponent(folder)}`); //remove
  
    fetch(`https://group42backendv2-hyckethpe4fwfjga.uksouth-01.azurewebsites.net/folder/files/${encodeURIComponent(folder)}`)
        .then(res => {
            if (!res.ok) throw new Error(`Server responded with ${res.status}`);
            return res.json();
        })
        .then(files => {
            console.log("Files fetched:", files); //remove
  
            if (files.length === 0) {
                fileDisplay.innerHTML = `<p style="color: white; >No files in this folder.</p>`;
                return;
            }
  
            fileDisplay.innerHTML = `<h2 style="color: white; >Files</h2>`;
  
            files.forEach((file, i) => {
                const fileCard = document.createElement("section");
                fileCard.className = "files";
  
                fileCard.innerHTML = `
                    <strong>Title:</strong> ${file.title}<br>
                    <strong>Description:</strong> ${file.description}<br>
                    <strong>Uploaded:</strong> ${new Date(file.uploadDate).toLocaleDateString()}<br>
                    <strong>Path:</strong> ${file.path?.join(" / ") || "None"}<br><br>
                    <button class="infoBtn" data-index="${i}">More Info</button>
                `;
  
                fileDisplay.appendChild(fileCard);
            });
  
            // Attach event listeners to all "More Info" buttons
            document.querySelectorAll(".infoBtn").forEach(btn => {
              btn.addEventListener("click", (e) => {
              const index = e.target.dataset.index;
              const file = files[index];
  
              // Store file data in localStorage
              localStorage.setItem("selectedFile", JSON.stringify(file));
  
              // Navigate to details.html
              window.location.href = "fileDetailsUser.html";
              });
          });
        })
        .catch(err => {
            fileDisplay.innerHTML = "<p style=' text-align:center; margin:10px; border-radius:40px; width:250px; background:red ;color:white;'>Error loading files.</p>";
            console.error(err);
        });

        //Back button funtionality for current path
        document.getElementById("backBtn").addEventListener("click", () => {
            const currentPath = JSON.parse(localStorage.getItem("currentPath")) || [];
    
            currentPath.pop();
    
            const newCurrentFolder = currentPath.length > 0 ? currentPath[currentPath.length - 1] : null;
    
            if (newCurrentFolder) {
                localStorage.setItem("currentFolder", newCurrentFolder);
                localStorage.setItem("currentPath", JSON.stringify(currentPath));
                window.location.href = "folderUser.html";
            } else {
                localStorage.removeItem("currentFolder");
                localStorage.removeItem("currentPath");
                window.location.href = "userHP.html";
            }
        });

  
  });
  
