
// Redirect to login if token is missing
(function checkAuthToken() {
  const token = localStorage.getItem('serverToken');
  if (!token) {
    alert('You must be logged in to access this page.');
    window.location.href = 'login.html'; // Change to your actual login page if different
  }
})();

// Helper function to get Authorization headers
function getAuthHeaders() {
  const token = localStorage.getItem('serverToken');
  return token ? { 'Authorization': 'Bearer ' + token } : {};
}

document.getElementById("createFolderForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const title = document.getElementById("folderTitle").value.trim();
    const description = document.getElementById("folderDescription").value.trim();

    let path = [];
    const currentFolder = localStorage.getItem("currentFolder");
    const currentPath = JSON.parse(localStorage.getItem("currentPath") || "[]");

    if (currentFolder && currentPath.length > 0) {
        // If the user is inside a folder, preserve that path
        path = [...currentPath, title];
    } else {
        path = [title]; // Explicitly set to empty (top level folder)
    }

    const payload = {
        title,
        description,
        path
    };

    const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders() // Include authorization headers
    };
    
    console.log('Token:', localStorage.getItem('serverToken'));
    console.log('Headers being sent:', headers);

    try {
        const response = await fetch('/api/folders', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error('Failed to create folder');
        }
        
        // Handle successful response
        const data = await response.json();
        console.log('Folder created:', data);
        // You might want to redirect or update the UI here
        
    } catch (error) {
        console.error('Error creating folder:', error);
        alert('Error creating folder: ' + error.message);
    }
});



