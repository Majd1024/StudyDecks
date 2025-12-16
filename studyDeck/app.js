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
      window.location.href = "index.html";
    };
  }
}

onAuthStateChanged(auth, (user) => {
  console.log("Auth state:", user);
  const isGuest = localStorage.getItem("studydeck_guest") === "1";

  if (!user && isGuest) {
    setupGuestUI();
    return;
  }

  if (!user && !isGuest) {
    window.location.href = "index.html";
    return;
  }

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
      } catch (err) {
        console.error("Sign-out error:", err);
      }
    };
  }
});

/* ===== Local Storage & Data Model ===== */
function normalizeData(raw) {
  const now = Date.now();
  const data = {
    tasks: Array.isArray(raw.tasks) ? raw.tasks : [],
    flashcards: Array.isArray(raw.flashcards) ? raw.flashcards : []
  };

  data.tasks = data.tasks
    .map((t) => {
      if (typeof t === "string") {
        return {
          text: t,
          category: "",
          done: false,
          createdAt: now
        };
      }
      if (!t || typeof t !== "object") return null;
      return {
        text: t.text || "",
        category: t.category || "",
        done: !!t.done,
        createdAt: typeof t.createdAt === "number" ? t.createdAt : now
      };
    })
    .filter(Boolean);

  const oneDay = 24 * 60 * 60 * 1000;

  data.flashcards = data.flashcards
    .map((c) => {
      if (!c || typeof c !== "object") return null;
      return {
        front: c.front || "",
        back: c.back || "",
        category: c.category || "",
        lastReviewed: typeof c.lastReviewed === "number" ? c.lastReviewed : null,
        nextReview: typeof c.nextReview === "number" ? c.nextReview : null,
        interval: typeof c.interval === "number" && c.interval > 0 ? c.interval : oneDay
      };
    })
    .filter((c) => c.front || c.back);

  return data;
}

function loadData() {
  const saved = localStorage.getItem("studydeck");
  if (!saved) {
    return {
      tasks: [],
      flashcards: []
    };
  }
  try {
    const parsed = JSON.parse(saved);
    return normalizeData(parsed);
  } catch (e) {
    console.error("Error parsing saved data, resetting.", e);
    return {
      tasks: [],
      flashcards: []
    };
  }
}

function saveData() {
  localStorage.setItem("studydeck", JSON.stringify(data));
}

let data = loadData();

/* ===== TASKS ===== */
const tasksList = document.getElementById("tasks-list");
const addTaskBtn = document.getElementById("add-task-btn");
const newTaskInput = document.getElementById("new-task-input");
const newTaskCategoryInput = document.getElementById("new-task-category");
const taskCategoryFilter = document.getElementById("task-category-filter");

function getTaskCategories() {
  const set = new Set();
  data.tasks.forEach((t) => {
    if (t.category && t.category.trim()) {
      set.add(t.category.trim());
    }
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function populateTaskCategoryFilter() {
  if (!taskCategoryFilter) return;
  const current = taskCategoryFilter.value;
  const categories = getTaskCategories();

  taskCategoryFilter.innerHTML = "";
  const optAll = document.createElement("option");
  optAll.value = "";
  optAll.textContent = "All categories";
  taskCategoryFilter.appendChild(optAll);

  categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    taskCategoryFilter.appendChild(opt);
  });

  if (categories.includes(current)) {
    taskCategoryFilter.value = current;
  } else {
    taskCategoryFilter.value = "";
  }
}

function renderTasks() {
  if (!tasksList) return;
  tasksList.innerHTML = "";

  const filterCat = taskCategoryFilter ? taskCategoryFilter.value : "";

  data.tasks.forEach((task, i) => {
    if (filterCat && task.category.trim() !== filterCat) return;

    const li = document.createElement("li");

    const left = document.createElement("div");
    left.className = "task-left";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = task.done;

    const textSpan = document.createElement("span");
    textSpan.className = "task-text";
    textSpan.textContent = task.text;
    if (task.done) {
      textSpan.classList.add("task-text-done");
    }

    checkbox.onchange = () => {
      task.done = checkbox.checked;
      saveData();
      renderTasks();
    };

    left.appendChild(checkbox);
    left.appendChild(textSpan);

    if (task.category && task.category.trim()) {
      const catPill = document.createElement("span");
      catPill.className = "task-category-pill";
      catPill.textContent = task.category;
      left.appendChild(catPill);
    }

    const del = document.createElement("button");
    del.className = "delete-task-btn";
    del.textContent = "×";

    del.onclick = () => {
      data.tasks.splice(i, 1);
      saveData();
      populateTaskCategoryFilter();
      renderTasks();
    };

    li.appendChild(left);
    li.appendChild(del);
    tasksList.appendChild(li);
  });
}

if (addTaskBtn && newTaskInput) {
  addTaskBtn.onclick = () => {
    const t = newTaskInput.value.trim();
    const category = newTaskCategoryInput
      ? newTaskCategoryInput.value.trim()
      : "";
    if (!t) return;

    data.tasks.push({
      text: t,
      category,
      done: false,
      createdAt: Date.now()
    });
    saveData();
    newTaskInput.value = "";
    if (newTaskCategoryInput) newTaskCategoryInput.value = "";
    populateTaskCategoryFilter();
    renderTasks();
  };
}

if (taskCategoryFilter) {
  taskCategoryFilter.onchange = () => {
    renderTasks();
  };
}

/* ===== FLASHCARDS ===== */
const flashFront = document.getElementById("flash-front");
const flashBack = document.getElementById("flash-back");
const flashCategoryInput = document.getElementById("flash-category");
const addFlashBtn = document.getElementById("add-flashcard-btn");
const flashGrid = document.getElementById("flashcard-grid");
const flashCategoryFilter = document.getElementById("flashcard-category-filter");

function getFlashCategories() {
  const set = new Set();
  data.flashcards.forEach((c) => {
    if (c.category && c.category.trim()) {
      set.add(c.category.trim());
    }
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function populateFlashCategoryFilter() {
  if (!flashCategoryFilter) return;
  const current = flashCategoryFilter.value;
  const categories = getFlashCategories();

  flashCategoryFilter.innerHTML = "";
  const optAll = document.createElement("option");
  optAll.value = "";
  optAll.textContent = "All categories";
  flashCategoryFilter.appendChild(optAll);

  categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    flashCategoryFilter.appendChild(opt);
  });

  if (categories.includes(current)) {
    flashCategoryFilter.value = current;
  } else {
    flashCategoryFilter.value = "";
  }
}

function renderFlashcards() {
  if (!flashGrid) return;
  flashGrid.innerHTML = "";

  const filterCat = flashCategoryFilter ? flashCategoryFilter.value : "";

  data.flashcards.forEach((card, i) => {
    if (filterCat && card.category.trim() !== filterCat) return;

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

    // Category pill (both sides)
    if (card.category && card.category.trim()) {
      const catFront = document.createElement("div");
      catFront.className = "flashcard-category-pill";
      catFront.textContent = card.category;
      front.appendChild(catFront);

      const catBack = document.createElement("div");
      catBack.className = "flashcard-category-pill";
      catBack.textContent = card.category;
      back.appendChild(catBack);
    }

    inner.appendChild(front);
    inner.appendChild(back);

    // Actions
    const actions = document.createElement("div");
    actions.className = "flashcard-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "flashcard-edit";
    editBtn.textContent = "✎";

    editBtn.onclick = (e) => {
      e.stopPropagation();
      const newFront = prompt("Edit front:", card.front ?? "");
      if (newFront === null) return;
      const newBack = prompt("Edit back:", card.back ?? "");
      if (newBack === null) return;
      const newCategory = prompt(
        "Edit category (optional):",
        card.category ?? ""
      );
      if (newCategory === null) return;

      data.flashcards[i] = {
        ...card,
        front: newFront.trim() || card.front,
        back: newBack.trim() || card.back,
        category: newCategory.trim()
      };
      saveData();
      populateFlashCategoryFilter();
      renderFlashcards();
    };

    const delBtn = document.createElement("button");
    delBtn.className = "flashcard-delete";
    delBtn.textContent = "×";

    delBtn.onclick = (e) => {
      e.stopPropagation();
      data.flashcards.splice(i, 1);
      saveData();
      populateFlashCategoryFilter();
      renderFlashcards();
    };

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

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
    const category = flashCategoryInput
      ? flashCategoryInput.value.trim()
      : "";
    if (!f || !b) return;

    const oneDay = 24 * 60 * 60 * 1000;

    data.flashcards.push({
      front: f,
      back: b,
      category,
      lastReviewed: null,
      nextReview: null,
      interval: oneDay
    });
    saveData();

    flashFront.value = "";
    flashBack.value = "";
    if (flashCategoryInput) flashCategoryInput.value = "";
    populateFlashCategoryFilter();
    renderFlashcards();
  };
}

if (flashCategoryFilter) {
  flashCategoryFilter.onchange = () => {
    renderFlashcards();
  };
}

/* ===== TABS ===== */
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

/* ===== DAILY REVIEW (flashcards only) ===== */
const startReviewBtn = document.getElementById("start-review-btn");
const reviewPanel = document.getElementById("review-panel");
const reviewMeta = document.getElementById("review-meta");
const reviewContent = document.getElementById("review-content");
const reviewDoneBtn = document.getElementById("review-done-btn");
const reviewAgainBtn = document.getElementById("review-again-btn");
const reviewSkipBtn = document.getElementById("review-skip-btn");
const reviewEndBtn = document.getElementById("review-end-btn");

let reviewQueue = [];
let reviewIndex = 0;

function buildReviewQueue() {
  reviewQueue = [];
  reviewIndex = 0;

  data.flashcards.forEach((card) => {
    reviewQueue.push({ type: "flashcard", item: card });
  });
}

function updateFlashcardSchedule(card, rating) {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  if (!card.interval || card.interval <= 0) {
    card.interval = oneDay;
  }

  if (rating === "good") {
    card.interval = Math.min(card.interval * 2, 30 * oneDay);
  } else if (rating === "again") {
    card.interval = oneDay;
  }

  card.lastReviewed = now;
  card.nextReview = now + card.interval;
}

function showCurrentReviewItem() {
  if (!reviewPanel || !reviewContent || !reviewMeta) return;

  if (reviewQueue.length === 0) {
    reviewMeta.innerHTML = `<span>No flashcards to review yet.</span>`;
    reviewContent.innerHTML = `
      <div class="review-card-hint">
        Go to the Flashcards tab and create some cards, then come back here.
      </div>
    `;
    return;
  }

  const current = reviewQueue[reviewIndex];
  const total = reviewQueue.length;
  const positionText = `${reviewIndex + 1} / ${total}`;
  const typeLabel = "Flashcard";

  reviewMeta.innerHTML = `
    <span>${positionText}</span>
    <span class="review-type-pill">${typeLabel}</span>
  `;

  reviewContent.innerHTML = "";

  const card = current.item;

  const wrapper = document.createElement("div");
  wrapper.className = "flashcard-card-item";

  const inner = document.createElement("div");
  inner.className = "flashcard-inner";

  // FRONT
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

  // BACK
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

  // Category pill (optional) on both sides
  if (card.category && card.category.trim()) {
    const catFront = document.createElement("div");
    catFront.className = "flashcard-category-pill";
    catFront.textContent = card.category;
    front.appendChild(catFront);

    const catBack = document.createElement("div");
    catBack.className = "flashcard-category-pill";
    catBack.textContent = card.category;
    back.appendChild(catBack);
  }

  inner.appendChild(front);
  inner.appendChild(back);
  wrapper.appendChild(inner);
  reviewContent.appendChild(wrapper);

  const hint = document.createElement("div");
  hint.className = "review-card-hint";
  hint.textContent = "Tap the card to flip between question and answer.";
  reviewContent.appendChild(hint);

  wrapper.addEventListener("click", () => {
    inner.classList.toggle("flipped");
  });
}

function goToNextReviewItem() {
  if (reviewQueue.length === 0) {
    showCurrentReviewItem();
    return;
  }
  reviewIndex++;
  if (reviewIndex >= reviewQueue.length) {
    reviewMeta.innerHTML = `<span>Review finished 🎉</span>`;
    reviewContent.innerHTML = `
      <div class="review-card-hint">
        Nice work! You went through all your flashcards.
      </div>
    `;
    return;
  }
  showCurrentReviewItem();
}

if (startReviewBtn && reviewPanel) {
  startReviewBtn.onclick = () => {
    buildReviewQueue();
    reviewPanel.classList.remove("hidden");
    showCurrentReviewItem();
  };
}

if (reviewDoneBtn) {
  reviewDoneBtn.onclick = () => {
    if (reviewQueue.length === 0) return;
    const current = reviewQueue[reviewIndex];
    updateFlashcardSchedule(current.item, "good");
    saveData();
    goToNextReviewItem();
  };
}

if (reviewAgainBtn) {
  reviewAgainBtn.onclick = () => {
    if (reviewQueue.length === 0) return;
    const current = reviewQueue[reviewIndex];
    updateFlashcardSchedule(current.item, "again");
    saveData();
    goToNextReviewItem();
  };
}

if (reviewSkipBtn) {
  reviewSkipBtn.onclick = () => {
    if (reviewQueue.length === 0) return;
    goToNextReviewItem();
  };
}

if (reviewEndBtn && reviewPanel) {
  reviewEndBtn.onclick = () => {
    reviewPanel.classList.add("hidden");
  };
}

/* ===== INITIAL RENDER ===== */
populateTaskCategoryFilter();
renderTasks();
populateFlashCategoryFilter();
renderFlashcards();

