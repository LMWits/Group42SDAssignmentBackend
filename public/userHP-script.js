/*
1. Fetches all top level folders
Displays them in folderDsiplay <div > found in <main> in adminHP.html

*Replace fetch with:
remote - https://group42backend-cxdxgmhrduhye8b3.uksouth-01.azurewebsites.net/folders
or
local - http://localhost:3000/folders

*/
fetch("https://group42backend-cxdxgmhrduhye8b3.uksouth-01.azurewebsites.net/folders")
        .then(response => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then(folders => {
          folderDisplay.innerHTML = `<h2 style="color: white;">All top level folders</h2>`;

          folders.forEach(folder => {
            const folderDiv = document.createElement("section"); //create a <div> for each folder
            folderDiv.textContent = folder; //adds folder name stored in folder as text to <div> created in line above
            folderDiv.className = "folder";

            //store folder name and go to folder.html when <div> clicked on
            folderDiv.addEventListener("click", () => {
              localStorage.setItem("currentFolder", folder);
              window.location.href = "folder.html";
            });

            folderDisplay.appendChild(folderDiv); //add html of folderDiv to the <div> called fileDisplay
          });
        })
        .catch(error => {
          folderDisplay.innerHTML = "<p style=' text-align:center; margin:10px; border-radius:40px; width:250px; background:red ;color:white;'>Error loading folders from server.</p>";
          console.error("Fetch error:", error);
        });
/*
2. Fetches all 'filemetas' json files (with out folders)
Displays them in fileDisplay <div > found in <main> in adminHP.html

*Replace fetch with:
remote - https://group42backend-cxdxgmhrduhye8b3.uksouth-01.azurewebsites.net/fileWithNoFolder
or
local - http://localhost:3000/fileWithNoFolder

*/
fetch("https://group42backend-cxdxgmhrduhye8b3.uksouth-01.azurewebsites.net/fileWithNoFolder")
        .then(response => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then(files => {
          fileDisplay.innerHTML = `<h2 style="color: white;" >All Files Without Folders</h2>`; //Clear old results

          files.forEach((file,i) => {
            const fileCard = document.createElement("section");
            fileCard.className = "files";

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
                window.location.href = "fileDetailsUser.html";
                });
            });
        })
        .catch(error => {
          fileDisplay.innerHTML = "<p style=' text-align:center; margin:10px; border-radius:40px; width:250px; background:red ;color:white;'>Error loading folders from server.</p>";
          console.error("Fetch error:", error);
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
