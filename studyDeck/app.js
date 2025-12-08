/* ===== Firebase ===== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBtXkSiHpAzQUfr6ebTh9DwUgQYihJvJu4",
  authDomain: "studydeck-e1bc7.firebaseapp.com",
  projectId: "studydeck-e1bc7",
  storageBucket: "studydeck-e1bc7.appspot.com",
  messagingSenderId: "208651535564",
  appId: "1:208651535564:web:1a4784768cca12110c2e69",
  measurementId: "G-EPQ9CNKQVN"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/* ===== USER BAR ===== */
const userPhoto = document.getElementById("user-photo");
const userName = document.getElementById("user-name");
const logoutBtn = document.getElementById("logout-btn");

function setupGuestUI() {
  if (userName) userName.textContent = "Guest";
  if (userPhoto) userPhoto.style.display = "none";
  if (logoutBtn) {
    logoutBtn.textContent = "Back";
    logoutBtn.onclick = () => {
      localStorage.removeItem("studydeck_guest");
      window.location.href = "Register.html"; // landing page
    };
  }
}

onAuthStateChanged(auth, (user) => {
  console.log("Auth state:", user);
  const isGuest = localStorage.getItem("studydeck_guest") === "1";

  // Guest mode -> allow without Firebase user
  if (!user && isGuest) {
    setupGuestUI();
    return;
  }

  // Not guest and not logged in -> back to landing
  if (!user && !isGuest) {
    window.location.href = "Register.html";
    return;
  }

  // Logged-in user
  localStorage.removeItem("studydeck_guest");

  if (userName) {
    userName.textContent = user.displayName?.split(" ")[0] || "User";
  }

  if (userPhoto) {
    if (user.photoURL) {
      userPhoto.src = user.photoURL;
      userPhoto.style.display = "block";
    } else {
      userPhoto.style.display = "none";
    }
  }

  if (logoutBtn) {
    logoutBtn.textContent = "Sign out";
    logoutBtn.onclick = async () => {
      try {
        await signOut(auth);
        // onAuthStateChanged will redirect back to Register.html
      } catch (err) {
        console.error("Sign-out error:", err);
      }
    };
  }
});

/* ===== Local Storage ===== */
function loadData() {
  const saved = localStorage.getItem("studydeck");
  return saved ? JSON.parse(saved) : { tasks: [], flashcards: [] };
}

function saveData() {
  localStorage.setItem("studydeck", JSON.stringify(data));
}

let data = loadData();

/* ===== TASKS ===== */
const tasksList = document.getElementById("tasks-list");
const addTaskBtn = document.getElementById("add-task-btn");
const newTaskInput = document.getElementById("new-task-input");

function renderTasks() {
  if (!tasksList) return;
  tasksList.innerHTML = "";
  data.tasks.forEach((task, i) => {
    const li = document.createElement("li");
    li.textContent = task;

    const del = document.createElement("button");
    del.className = "delete-task-btn";
    del.textContent = "×";

    del.onclick = () => {
      data.tasks.splice(i, 1);
      saveData();
      renderTasks();
    };

    li.appendChild(del);
    tasksList.appendChild(li);
  });
}

if (addTaskBtn && newTaskInput) {
  addTaskBtn.onclick = () => {
    const t = newTaskInput.value.trim();
    if (!t) return;
    data.tasks.push(t);
    saveData();
    newTaskInput.value = "";
    renderTasks();
  };
}

renderTasks();

/* ===== FLASHCARDS (flip, edit, delete) ===== */
const flashFront = document.getElementById("flash-front");
const flashBack = document.getElementById("flash-back");
const addFlashBtn = document.getElementById("add-flashcard-btn");
const flashGrid = document.getElementById("flashcard-grid");

function renderFlashcards() {
  if (!flashGrid) return;

  flashGrid.innerHTML = "";

  data.flashcards.forEach((card, i) => {
    const wrapper = document.createElement("div");
    wrapper.className = "flashcard-card-item";

    const inner = document.createElement("div");
    inner.className = "flashcard-inner";

    // Front
    const front = document.createElement("div");
    front.className = "flashcard-face flashcard-front";

    const frontLabel = document.createElement("div");
    frontLabel.className = "flashcard-label";
    frontLabel.textContent = "Front";

    const frontText = document.createElement("div");
    frontText.className = "flashcard-text";
    frontText.textContent = card.front;

    front.appendChild(frontLabel);
    front.appendChild(frontText);

    // Back
    const back = document.createElement("div");
    back.className = "flashcard-face flashcard-back";

    const backLabel = document.createElement("div");
    backLabel.className = "flashcard-label";
    backLabel.textContent = "Back";

    const backText = document.createElement("div");
    backText.className = "flashcard-text";
    backText.textContent = card.back;

    back.appendChild(backLabel);
    back.appendChild(backText);

    inner.appendChild(front);
    inner.appendChild(back);

    // Actions (edit + delete)
    const actions = document.createElement("div");
    actions.className = "flashcard-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "flashcard-edit";
    editBtn.textContent = "✎";

    editBtn.onclick = (e) => {
      e.stopPropagation(); // don't flip when editing
      const newFront = prompt("Edit front:", card.front);
      if (newFront === null) return;
      const newBack = prompt("Edit back:", card.back);
      if (newBack === null) return;

      data.flashcards[i] = {
        front: newFront.trim() || card.front,
        back: newBack.trim() || card.back
      };
      saveData();
      renderFlashcards();
    };

    const delBtn = document.createElement("button");
    delBtn.className = "flashcard-delete";
    delBtn.textContent = "×";

    delBtn.onclick = (e) => {
      e.stopPropagation(); // don't flip when deleting
      data.flashcards.splice(i, 1);
      saveData();
      renderFlashcards();
    };

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    // Flip on click
    wrapper.addEventListener("click", () => {
      inner.classList.toggle("flipped");
    });

    wrapper.appendChild(inner);
    wrapper.appendChild(actions);
    flashGrid.appendChild(wrapper);
  });
}

if (addFlashBtn && flashFront && flashBack) {
  addFlashBtn.onclick = () => {
    const f = flashFront.value.trim();
    const b = flashBack.value.trim();
    if (!f || !b) return;

    data.flashcards.push({ front: f, back: b });
    saveData();

    flashFront.value = "";
    flashBack.value = "";
    renderFlashcards();
  };
}

renderFlashcards();

/* ===== Tabs ===== */
document.querySelectorAll(".tab-button").forEach((btn) => {
  btn.onclick = () => {
    document
      .querySelectorAll(".tab-button")
      .forEach((b) => b.classList.remove("active"));
    document
      .querySelectorAll(".tab")
      .forEach((tab) => tab.classList.remove("active"));

    btn.classList.add("active");
    document
      .getElementById("tab-" + btn.dataset.tab)
      .classList.add("active");
  };
});
