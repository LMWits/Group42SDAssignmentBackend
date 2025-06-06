/*
1. Fetches all top level folders
Displays them in folderDsiplay <div > found in <main> in adminHP.html

*Replace fetch with:
remote- https://group42backendv2-hyckethpe4fwfjga.uksouth-01.azurewebsites.net/folders  -new link
or
local - http://localhost:3000/folders
*/

// Extract token from URL and store in localStorage if present
(function storeTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  if (token) {
    localStorage.setItem('serverToken', token); // Use the correct key for your app
    // Optionally, remove the token from the URL for cleanliness
    window.history.replaceState({}, document.title, window.location.pathname);
  }
})();

// Helper function to get Authorization headers
function getAuthHeaders() {
  const token = localStorage.getItem('serverToken');
  return token ? { 'Authorization': 'Bearer ' + token } : {};
}

fetch(`https://group42backendv2-hyckethpe4fwfjga.uksouth-01.azurewebsites.net/folders`, {
  headers: getAuthHeaders()
})
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
fetch(`https://group42backendv2-hyckethpe4fwfjga.uksouth-01.azurewebsites.net/fileWithNoFolder`, {
  headers: getAuthHeaders()
})
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
            if (file.originalName) {
              const ext = file.originalName.split('.').pop().toLowerCase();
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
              <section class="file-desc">${file.description}</section>
              <section class="file-year">${formatDate(file.uploadDate)}</section>
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
3. Fetches files as they are being typed into the search bar

*Replace fetch with:
remote- https://group42backendv2-hyckethpe4fwfjga.uksouth-01.azurewebsites.net/search?query=${encodeURIComponent(query)}  -new link
or
local - http://localhost:3000/search?query=${encodeURIComponent(query)}
*/

const searchInput = document.getElementById("searchInput");
const searchButton = document.querySelector(".searchButton");

// Option a: trigger search as you type
searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim();
  if (query.length > 1) performSearch(query);
});

// Option b: full search when button clicked
searchButton.addEventListener("click", () => {
  const query = searchInput.value.trim();
  if (query) performSearch(query);
});

function performSearch(query) {
  fetch(`https://group42backendv2-hyckethpe4fwfjga.uksouth-01.azurewebsites.net/search?query=${encodeURIComponent(query)}`,
    { headers: getAuthHeaders() })
    .then(res => res.json())
    .then(results => {

      const queryWords = query.toLowerCase().split(/\s+/); //for highlighting


      const fileGrid = document.createElement("section");
      fileGrid.className = "file-grid";
      fileGrid.innerHTML = ""; // clear old results

      console.log(results); //remove

      results.forEach((file, i) => {

        console.log(file);//remove

        const fileItem = document.createElement("section");
        fileItem.className = "file-item";

        const icon = getFileIcon(file.originalName);

        //try highlighting, fallback to plain text if no matches
        let title = file.title || 'Untitled';
        let description = file.description || 'No description';
        let date = formatDate(file.uploadDate) || 'No Date';
        let path = file.path || 'No path';

        const highlightedTitle = highlightMatches(title, queryWords);
        const highlightedDesc = highlightMatches(description, queryWords);
        const highlightedDate = highlightMatches(date, queryWords);
        const highlightedPath = highlightMatches(path.join("/"), queryWords);

        if(highlightedTitle.includes('<mark>')){
          title = highlightedTitle
        }
        if(highlightedDesc.includes('<mark>')){
          description = highlightedDesc
        }
        if(highlightedDate.includes('<mark>')){
          date = highlightedDate
        }
        if(highlightedPath.includes('<mark>')){
          path = highlightedPath
        }


        fileItem.innerHTML = `
          <section class="file-icon">
            <i class="fas ${icon}"></i>
          </section>
          <section class="file-name">${title}</section>
          <section class="file-desc">${description}</section>
          <section class="file-date">${date}</section>
          <section class="file-path">${path}</section>
        `;

        fileItem.addEventListener("click", () => {
          localStorage.setItem("selectedFile", JSON.stringify(file));
          window.location.href = "fileDetailsAdmin.html";
        });

        fileGrid.appendChild(fileItem);
      });

      const displayArea = document.querySelector(".file-manager");
      displayArea.innerHTML = ""; // clear everything for now
      displayArea.appendChild(fileGrid);
    })
    .catch(err => {
      console.error("Search failed:", err);
    });
}

function getFileIcon(originalName = "") {
  if (!originalName || typeof originalName !== "string") return "fa-file";
  const ext = originalName.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return "fa-file-image";
  if (['mp4', 'mov', 'avi'].includes(ext)) return "fa-file-video";
  if (['mp3', 'wav'].includes(ext)) return "fa-file-audio";
  if (['pdf'].includes(ext)) return "fa-file-pdf";
  return "fa-file";
}

//high lights characters
function highlightMatches(text, words) {
  if (!text) return '';
  let highlighted = text;

  words.forEach(word => {
    const regex = new RegExp(`(${word})`, 'ig');
    highlighted = highlighted.replace(regex, '<mark>$1</mark>');
  });

  return highlighted;
}

//formats date
function formatDate(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-UK', {
    year: 'numeric',
    day: 'numeric',
    month: 'short',
  });
}




/*
4. Fetches all 'filemetas' json files
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


