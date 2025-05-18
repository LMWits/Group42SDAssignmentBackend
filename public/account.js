import { auth, db } from './firebaseAuth.js';
import { doc, getDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { deleteUser } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

let currentUser;

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    document.getElementById("account-info").innerText = "Not signed in.";
    return;
  }

  currentUser = user;
  const userDocRef = doc(db, "users", user.uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    const userData = userDocSnap.data();

    document.getElementById("account-info").innerHTML = `
      <p><strong>Name:</strong> ${userData.name}</p>
      <p><strong>Email:</strong> ${user.email}</p>
    `;

    document.getElementById("name").value = userData.name;

  } else {
    document.getElementById("account-info").innerText = "User data not found.";
  }
});

// Show edit form
document.getElementById("editBtn").addEventListener("click", () => {
  document.getElementById("edit-form").style.display = "block";
});

// Save updated name
document.getElementById("saveChanges").addEventListener("click", async () => {
  const newName = document.getElementById("name").value;

  if (currentUser && newName) {
    const userDocRef = doc(db, "users", currentUser.uid);
    await updateDoc(userDocRef, { name: newName });
    alert("Name updated!");
    location.reload();
  }
});

// Delete account
document.getElementById("deleteBtn").addEventListener("click", async () => {
  if (!confirm("Are you sure you want to permanently delete your account?")) return;

  try {
    const uid = currentUser.uid;

    // Delete from Firestore
    await deleteDoc(doc(db, "users", uid));

    // Delete auth account
    await deleteUser(currentUser);

    alert("Account deleted.");
    window.location.href = "index.html";
  } catch (error) {
    alert("Error deleting account: " + error.message);
  }
});
