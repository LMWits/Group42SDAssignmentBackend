/*
1. Fetches all top level folders
Displays them in folderDsiplay <div > found in <main> in adminHP.html

*Replace fetch with:
remote- https://group42backendv2-hyckethpe4fwfjga.uksouth-01.azurewebsites.net/folders  -new link
or
local - http://localhost:3000/folders


*/
fetch("https://group42backendv2-hyckethpe4fwfjga.uksouth-01.azurewebsites.net/folders")
        .then(response => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })

        .then(folders => {
          const folderList = document.createElement("ul");
          folderList.className = "folderList";

          folders.forEach((folder,index) => {
            const folderItem = document.createElement("li");
            folderItem.className = "folder-item";

            folderItem.innerHTML = `
              <i class="fas fa-folder"></i>
              <button>${folder}</button>`;



      folderItem.addEventListener("click", (e) => {
        e.stopPropagation();

        localStorage.setItem("currentFolder", folder);
        localStorage.setItem("currentPath", JSON.stringify([folder])); //Resets our path
        window.location.href = "folder.html";
      });

      folderList.appendChild(folderItem);
    });

    const sidebar = document.querySelector(".sidebar") || createSidebar();
    sidebar.appendChild(folderList);
  })
      .catch(error => {
          const errorMsg = document.createElement("p");
          errorMsg.style.cssText = "text-align:center; margin:10px; border-radius:40px; width:250px; background:red; color:white;";
          errorMsg.textContent = "Error loading folders from server.";
          document.querySelector(".file-manager").appendChild(errorMsg);
          console.error("Fetch error:", error);
        });

function createSidebar() {
  const sidebar = document.createElement("section");
  sidebar.className = "sidebar";
  document.querySelector(".file-manager").appendChild(sidebar);
  return sidebar;
}


/*
2. Fetches all 'filemetas' json files (with out folders)
Displays them in fileDisplay <div > found in <main> in adminHP.html

*Replace fetch with:
remote- https://group42backendv2-hyckethpe4fwfjga.uksouth-01.azurewebsites.net/fileWithNoFolder  -new link
or
local - http://localhost:3000/fileWithNoFolder

*/
fetch("https://group42backendv2-hyckethpe4fwfjga.uksouth-01.azurewebsites.net/fileWithNoFolder")
        .then(response => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then(files => {
          const fileGrid = document.createElement("section");
          fileGrid.className = "file-grid";

          files.forEach((file,i) => {
            const fileItem = document.createElement("section");
            fileItem.className = "file-item";

            // Determine icon based on file type
            let icon = "fa-file";
            if (file.title) {
              const ext = file.title.split('.').pop().toLowerCase();
              if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) icon = "fa-file-image";
              else if (['mp4', 'mov', 'avi'].includes(ext)) icon = "fa-file-video";
              else if (['mp3', 'wav'].includes(ext)) icon = "fa-file-audio";
              else if (['pdf'].includes(ext)) icon = "fa-file-pdf";
            }

            fileItem.innerHTML = `
              <section class="file-icon">
                <i class="fas ${icon}"></i>
              </section>
              <section class="file-name">${file.title || 'Untitled'}</section>
              <section class="file-size">${formatFileSize(file.size)}</section>
            `;

            // Add click handler for more info
            fileItem.addEventListener("click", () => {
              localStorage.setItem("selectedFile", JSON.stringify(file));
              window.location.href = "fileDetailsAdmin.html";
            });

            fileGrid.appendChild(fileItem);
          });

          // Add file grid to main content
          document.querySelector(".file-manager").appendChild(fileGrid);
        })
        .catch(error => {
          const errorMsg = document.createElement("p");
          errorMsg.style.cssText = "text-align:center; margin:10px; border-radius:40px; width:250px; background:red; color:white;";
          errorMsg.textContent = "Error loading files from server.";
          document.querySelector(".file-manager").appendChild(errorMsg);
          console.error("Fetch error:", error);
        });

       //make sure path is empty if we click on createFolder from the HP
       document.addEventListener("DOMContentLoaded", function () {
        const createFolderBtn = document.getElementById("createFolderBtn");

        if (createFolderBtn) {
          createFolderBtn.addEventListener("click", function () {
            console.log("Create Folder button clicked"); // Debugging log
            localStorage.removeItem("currentFolder");
            localStorage.removeItem("currentPath");
            console.log("localStorage cleared"); // Debugging log
            setTimeout(() => {
              window.location.href = "createFolder.html"; // Ensure redirection happens after clearing
            }, 500); // Delay for a brief moment to ensure localStorage is cleared before redirect
          });
        } else {
          console.error("Create Folder button not found.");
        }
      });

/*
3. Fetches all 'filemetas' json files
Displays them in fileDisplay <div > found in <main> in adminHP.html
*/
/*
fetch("http://localhost:3000/files")
        .then(response => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then(files => {
          //fileDisplay.innerHTML = ""; //Clear old results

          files.forEach((file,i) => {
            const fileCard = document.createElement("section");
            fileCard.style.border = "1px solid #ccc";
            fileCard.style.margin = "10px";
            fileCard.style.padding = "10px";
            fileCard.style.borderRadius = "6px";
            fileCard.style.backgroundColor = "#f9f9f9";

            fileCard.innerHTML = `
              <strong>Title:</strong> ${file.title}<br>
              <strong>Description:</strong> ${file.description}<br>
              <strong>Uploaded:</strong> ${new Date(file.uploadDate).toLocaleDateString()}<br>
              <!--
              <strong>Path:</strong> ${file.path?.join(" / ") || "None"}<br><br>
              <a href="${file.blobUrl}" target="_blank">🔗 View File</a><br><br>
              -->
              <button class="infoBtn" data-index="${i}">More Info</button>
            `;

            fileDisplay.appendChild(fileCard); //add html of fileCard to the <div> called fileDisplay
          });

          // Attach event listeners to all "More Info" buttons
            document.querySelectorAll(".infoBtn").forEach(btn => {
                btn.addEventListener("click", (e) => {
                const index = e.target.dataset.index;
                const file = files[index];

                // Store file data in localStorage
                localStorage.setItem("selectedFile", JSON.stringify(file));

                // Navigate to details.html
                window.location.href = "details.html";
                });
            });
        })
        .catch(error => {
          fileDisplay.innerHTML = "<p style=' text-align:center; margin:10px; border-radius:40px; width:250px; background:red ;color:white;'>Error loading folders from server.</p>";
          console.error("Fetch error:", error);
        });
*/

// Helper function to format file size
function formatFileSize(bytes) {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return bytes + " B";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  else return (bytes / 1048576).toFixed(1) + " MB";
}
