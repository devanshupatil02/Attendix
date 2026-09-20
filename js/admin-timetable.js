import {
  initializeApp,
  getApps,
  getApp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// ============================================
// FIREBASE CONFIG
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyAxVUvIhjrBhmR_0uyXJyQmD00eQ9mgq9M",
  authDomain: "attendix-rfid-attendance.firebaseapp.com",
  projectId: "attendix-rfid-attendance",
  storageBucket: "attendix-rfid-attendance.firebasestorage.app",
  messagingSenderId: "1038365817716",
  appId: "1:1038365817716:web:a1160a5265dfb417da8a21",
  measurementId: "G-ZYCH6VZHD0"
};


// ============================================
// FIREBASE INITIALIZATION
// ============================================

const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);


// ============================================
// ELEMENTS
// ============================================

const timetableGrid =
  document.getElementById("timetableGrid");

const branchSelect =
  document.getElementById("branchSelect");

const timetableStatus =
  document.getElementById("timetableStatus");

const totalClasses =
  document.getElementById("totalClasses");

const todayClasses =
  document.getElementById("todayClasses");

const totalSubjects =
  document.getElementById("totalSubjects");

const teachersAssigned =
  document.getElementById("teachersAssigned");

const addClassBtn =
  document.getElementById("addClassBtn");


// ============================================
// DATA
// ============================================

let timetableData = [];
let subjectsMap = new Map();
let teachersMap = new Map();
let editingClassId = null;


// ============================================
// DAYS
// ============================================

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];


// ============================================
// STATUS
// ============================================

function showStatus(message, type = "") {

  if (!timetableStatus) return;

  timetableStatus.textContent = message;

  timetableStatus.className =
    `timetable-status ${type}`;
}


// ============================================
// LOAD ALL FIREBASE DATA
// ============================================

async function loadTimetableData() {

  try {

    showStatus("Loading timetable...", "loading");


    // ========================================
    // LOAD TIMETABLE
    // ========================================

    const timetableSnapshot =
      await getDocs(
        collection(db, "timetable")
      );

    timetableData =
      timetableSnapshot.docs
        .map((item) => {

          const data = item.data();

          return {

            id: item.id,

            day:
              data.day || "",

            startTime:
              data.startTime || "",

            endTime:
              data.endTime || "",

            branch:
              data.branch || "",

            room:
              data.room || "",

            subjectID:
              data.subjectID || "",

            teacherUid:
              data.teacherUid || "",

            type:
              data.type || "Lecture",

            active:
              data.active !== false

          };

        })
        .filter(
          item => item.active !== false
        );


    // ========================================
    // LOAD SUBJECTS
    // ========================================

    const subjectsSnapshot =
      await getDocs(
        collection(db, "subjects")
      );

    subjectsMap.clear();

    subjectsSnapshot.forEach((item) => {

      const data = item.data();

      // Ignore inactive subjects
      if (data.active === false) {
        return;
      }

      subjectsMap.set(
        item.id,
        {
          id: item.id,

          name:
            data.name ||
            "Unnamed Subject",

          code:
            data.code ||
            ""
        }
      );

    });


    // ========================================
    // LOAD TEACHERS
    //
    // IMPORTANT:
    // Your actual teachers are stored in:
    //
    // teachers
    //
    // NOT users.
    // ========================================

    const teachersSnapshot =
      await getDocs(
        collection(db, "teachers")
      );

    teachersMap.clear();

    teachersSnapshot.forEach((item) => {

      const data = item.data();

      // Ignore inactive teachers
      if (data.active === false) {
        return;
      }

      const teacherId = item.id;

      teachersMap.set(
        teacherId,
        {
          id: teacherId,

          name:
            data.name ||
            "Unnamed Teacher",

          email:
            data.email ||
            "",

          department:
            data.department ||
            ""
        }
      );

    });


    // ========================================
    // DEBUG
    // ========================================

    console.log(
      "Subjects:",
      [...subjectsMap.values()]
    );

    console.log(
      "Teachers:",
      [...teachersMap.values()]
    );

    console.log(
      "Timetable:",
      timetableData
    );


    // ========================================
    // UPDATE PAGE
    // ========================================

    populateBranches();

    updateStatistics();

    renderTimetable();

    showStatus("", "success");


  } catch (error) {

    console.error(
      "Error loading timetable:",
      error
    );


    if (
      error.code ===
      "permission-denied"
    ) {

      showStatus(
        "Permission denied. Check Firestore Rules.",
        "error"
      );

    } else {

      showStatus(
        "Failed to load timetable data.",
        "error"
      );

    }

  }

}


// ============================================
// BRANCH FILTER
// ============================================

function populateBranches() {

  if (!branchSelect) return;

  const currentValue =
    branchSelect.value;

  const branches = [
    ...new Set(
      timetableData
        .map(item => item.branch)
        .filter(Boolean)
    )
  ].sort();

  branchSelect.innerHTML = `
    <option value="">
      All Branches
    </option>

    ${branches.map(branch => `
      <option value="${escapeAttribute(branch)}">
        ${escapeHTML(branch)}
      </option>
    `).join("")}
  `;

  if (
    branches.includes(currentValue)
  ) {

    branchSelect.value =
      currentValue;

  }

}


// ============================================
// FILTERED DATA
// ============================================

function getFilteredData() {

  const branch =
    branchSelect?.value || "";

  return timetableData.filter(
    item =>
      !branch ||
      item.branch === branch
  );

}


// ============================================
// STATISTICS
// ============================================

function updateStatistics() {

  const data =
    getFilteredData();


  // Total classes
  if (totalClasses) {

    totalClasses.textContent =
      data.length;

  }


  // Subjects used in timetable
  if (totalSubjects) {

    const subjectIds =
      new Set(
        data
          .map(item => item.subjectID)
          .filter(Boolean)
      );

    totalSubjects.textContent =
      subjectIds.size;

  }


  // Teachers assigned
  if (teachersAssigned) {

    const teacherIds =
      new Set(
        data
          .map(item => item.teacherUid)
          .filter(Boolean)
      );

    teachersAssigned.textContent =
      teacherIds.size;

  }


  // Today's classes
  if (todayClasses) {

    const today =
      new Date().toLocaleDateString(
        "en-US",
        {
          weekday: "long",
          timeZone: "Asia/Kolkata"
        }
      );

    todayClasses.textContent =
      data.filter(
        item => item.day === today
      ).length;

  }

}


// ============================================
// RENDER TIMETABLE
// ============================================

function renderTimetable() {

  if (!timetableGrid) return;

  const data =
    getFilteredData();


  if (!data.length) {

    timetableGrid.innerHTML = `
      <div class="empty-state">
        <h3>No classes found</h3>
        <p>Add a class or change the branch filter.</p>
      </div>
    `;

    return;

  }


  const grouped = {};


  DAYS.forEach(day => {
    grouped[day] = [];
  });


  data.forEach(item => {

    if (!grouped[item.day]) {
      grouped[item.day] = [];
    }

    grouped[item.day].push(item);

  });


  timetableGrid.innerHTML = "";


  DAYS.forEach(day => {

    const classes =
      grouped[day];

    if (!classes.length) return;


    classes.sort(
      (a, b) =>
        (a.startTime || "")
          .localeCompare(
            b.startTime || ""
          )
    );


    const daySection =
      document.createElement(
        "section"
      );

    daySection.className =
      "timetable-day";


    daySection.innerHTML = `

      <div class="day-heading">

        <h3>
          ${escapeHTML(day)}
        </h3>

        <span>
          ${classes.length}
          ${classes.length === 1
            ? "class"
            : "classes"}
        </span>

      </div>


      <div class="day-classes">

        ${classes
          .map(renderClass)
          .join("")}

      </div>

    `;


    timetableGrid.appendChild(
      daySection
    );

  });


  attachClassActions();

}


// ============================================
// RENDER CLASS
// ============================================

function renderClass(item) {

  const subject =
    subjectsMap.get(
      item.subjectID
    );


  const teacher =
    teachersMap.get(
      item.teacherUid
    );


  const subjectName =
    subject?.name ||
    "Unknown Subject";


  const subjectCode =
    subject?.code ||
    "";


  const teacherName =
    teacher?.name ||
    "Unassigned";


  const status =
    getClassStatus(item);


  return `

    <article
      class="class-card"
      data-class-id="${escapeAttribute(item.id)}"
    >

      <div class="class-time">

        ${escapeHTML(
          item.startTime || "--:--"
        )}

        -

        ${escapeHTML(
          item.endTime || "--:--"
        )}

      </div>


      <div class="class-details">

        <h4>
          ${escapeHTML(subjectName)}
        </h4>


        ${
          subjectCode
            ? `
              <span class="subject-code">
                ${escapeHTML(subjectCode)}
              </span>
            `
            : ""
        }


        <p>
          <strong>Teacher:</strong>
          ${escapeHTML(teacherName)}
        </p>


        <p>
          <strong>Branch:</strong>
          ${escapeHTML(
            item.branch ||
            "Not specified"
          )}
        </p>


        ${
          item.room
            ? `
              <p>
                <strong>Room:</strong>
                ${escapeHTML(item.room)}
              </p>
            `
            : ""
        }


        ${
          item.type
            ? `
              <p>
                <strong>Type:</strong>
                ${escapeHTML(item.type)}
              </p>
            `
            : ""
        }

      </div>


      <div class="class-footer">

        <span
          class="class-status ${escapeHTML(
            status.toLowerCase()
          )}"
        >
          ${escapeHTML(status)}
        </span>


        <div class="class-actions">

          <button
            class="edit-class-btn"
            data-id="${escapeAttribute(item.id)}"
          >
            Edit
          </button>


          <button
            class="delete-class-btn"
            data-id="${escapeAttribute(item.id)}"
          >
            Delete
          </button>

        </div>

      </div>

    </article>

  `;

}


// ============================================
// CLASS STATUS
// ============================================

function getClassStatus(item) {

  if (
    !item.startTime ||
    !item.endTime
  ) {

    return "Upcoming";

  }


  const now =
    new Date();


  const today =
    now.toLocaleDateString(
      "en-US",
      {
        weekday: "long",
        timeZone: "Asia/Kolkata"
      }
    );


  if (item.day !== today) {
    return "Upcoming";
  }


  const currentTime =
    now.toLocaleTimeString(
      "en-GB",
      {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kolkata"
      }
    );


  if (
    currentTime <
    item.startTime
  ) {

    return "Upcoming";

  }


  if (
    currentTime >= item.startTime &&
    currentTime <= item.endTime
  ) {

    return "Ongoing";

  }


  return "Completed";

}


// ============================================
// EDIT / DELETE ACTIONS
// ============================================

function attachClassActions() {

  document
    .querySelectorAll(
      ".edit-class-btn"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          openClassModal(
            button.dataset.id
          );

        }
      );

    });


  document
    .querySelectorAll(
      ".delete-class-btn"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          deleteClass(
            button.dataset.id
          );

        }
      );

    });

}


// ============================================
// ADD / EDIT MODAL
// ============================================

function openClassModal(
  classId = null
) {

  editingClassId =
    classId;


  const existingClass =
    classId
      ? timetableData.find(
          item =>
            item.id === classId
        )
      : null;


  // Remove old modal if exists
  const oldModal =
    document.getElementById(
      "classModal"
    );

  if (oldModal) {
    oldModal.remove();
  }


  const modal =
    document.createElement(
      "div"
    );


  modal.className =
    "class-modal-overlay";


  modal.id =
    "classModal";


  modal.innerHTML = `

    <div class="class-modal">

      <div class="modal-header">

        <h2>
          ${
            existingClass
              ? "Edit Class"
              : "Add Class"
          }
        </h2>


        <button
          type="button"
          id="closeClassModal"
        >
          ×
        </button>

      </div>


      <form id="classForm">


        <!-- DAY -->

        <label>

          Day

          <select
            id="classDay"
            required
          >

            <option value="">
              Select Day
            </option>

            ${DAYS.map(day => `

              <option
                value="${escapeAttribute(day)}"
                ${
                  existingClass?.day === day
                    ? "selected"
                    : ""
                }
              >
                ${escapeHTML(day)}
              </option>

            `).join("")}

          </select>

        </label>


        <!-- START TIME -->

        <label>

          Start Time

          <input
            type="time"
            id="classStartTime"
            value="${escapeAttribute(
              existingClass?.startTime || ""
            )}"
            required
          >

        </label>


        <!-- END TIME -->

        <label>

          End Time

          <input
            type="time"
            id="classEndTime"
            value="${escapeAttribute(
              existingClass?.endTime || ""
            )}"
            required
          >

        </label>


        <!-- BRANCH -->

        <label>

          Branch

          <input
            type="text"
            id="classBranch"
            value="${escapeAttribute(
              existingClass?.branch || ""
            )}"
            placeholder="AI and Data Science"
            required
          >

        </label>


        <!-- SUBJECT -->

        <label>

          Subject

          <select
            id="classSubject"
            required
          >

            <option value="">
              Select Subject
            </option>

            ${
              [...subjectsMap.values()]
                .map(subject => `

                  <option
                    value="${escapeAttribute(
                      subject.id
                    )}"
                    ${
                      existingClass?.subjectID ===
                      subject.id
                        ? "selected"
                        : ""
                    }
                  >

                    ${escapeHTML(
                      subject.name
                    )}

                    ${
                      subject.code
                        ? `(${escapeHTML(
                            subject.code
                          )})`
                        : ""
                    }

                  </option>

                `)
                .join("")
            }

          </select>

        </label>


        <!-- TEACHER -->

        <label>

          Teacher

          <select
            id="classTeacher"
            required
          >

            <option value="">
              Select Teacher
            </option>

            ${
              [...teachersMap.values()]
                .map(teacher => `

                  <option
                    value="${escapeAttribute(
                      teacher.id
                    )}"
                    ${
                      existingClass?.teacherUid ===
                      teacher.id
                        ? "selected"
                        : ""
                    }
                  >

                    ${escapeHTML(
                      teacher.name
                    )}

                  </option>

                `)
                .join("")
            }

          </select>

        </label>


        <!-- ROOM -->

        <label>

          Room

          <input
            type="text"
            id="classRoom"
            value="${escapeAttribute(
              existingClass?.room || ""
            )}"
            placeholder="418"
          >

        </label>


        <!-- CLASS TYPE -->

        <label>

          Class Type

          <select
            id="classType"
          >

            ${
              [
                "Lecture",
                "Lab",
                "Tutorial",
                "Practical"
              ]
                .map(type => `

                  <option
                    value="${escapeAttribute(type)}"
                    ${
                      (
                        existingClass?.type ||
                        "Lecture"
                      ) === type
                        ? "selected"
                        : ""
                    }
                  >
                    ${escapeHTML(type)}
                  </option>

                `)
                .join("")
            }

          </select>

        </label>


        <p
          id="classFormError"
          class="form-error"
        ></p>


        <div class="modal-actions">

          <button
            type="button"
            id="cancelClassBtn"
          >
            Cancel
          </button>


          <button
            type="submit"
          >
            ${
              existingClass
                ? "Update Class"
                : "Add Class"
            }
          </button>

        </div>


      </form>

    </div>

  `;


  document.body.appendChild(
    modal
  );


  // Close button
  document
    .getElementById(
      "closeClassModal"
    )
    .addEventListener(
      "click",
      closeClassModal
    );


  // Cancel button
  document
    .getElementById(
      "cancelClassBtn"
    )
    .addEventListener(
      "click",
      closeClassModal
    );


  // Form submit
  document
    .getElementById(
      "classForm"
    )
    .addEventListener(
      "submit",
      saveClass
    );

}


// ============================================
// CLOSE MODAL
// ============================================

function closeClassModal() {

  const modal =
    document.getElementById(
      "classModal"
    );


  if (modal) {
    modal.remove();
  }


  editingClassId =
    null;

}


// ============================================
// SAVE CLASS
// ============================================

async function saveClass(event) {

  event.preventDefault();


  const errorElement =
    document.getElementById(
      "classFormError"
    );


  const day =
    document.getElementById(
      "classDay"
    ).value;


  const startTime =
    document.getElementById(
      "classStartTime"
    ).value;


  const endTime =
    document.getElementById(
      "classEndTime"
    ).value;


  const branch =
    document.getElementById(
      "classBranch"
    ).value.trim();


  const subjectID =
    document.getElementById(
      "classSubject"
    ).value;


  const teacherUid =
    document.getElementById(
      "classTeacher"
    ).value;


  const room =
    document.getElementById(
      "classRoom"
    ).value.trim();


  const type =
    document.getElementById(
      "classType"
    ).value;


  // ========================================
  // VALIDATION
  // ========================================

  if (
    !day ||
    !startTime ||
    !endTime ||
    !branch ||
    !subjectID ||
    !teacherUid
  ) {

    errorElement.textContent =
      "Please fill in all required fields.";

    return;

  }


  if (
    startTime >= endTime
  ) {

    errorElement.textContent =
      "End time must be after start time.";

    return;

  }


  // ========================================
  // FIRESTORE DATA
  // ========================================

  const classData = {

    day,

    startTime,

    endTime,

    branch,

    subjectID,

    teacherUid,

    room,

    type,

    active: true,

    updatedAt:
      serverTimestamp()

  };


  try {

    // ======================================
    // UPDATE EXISTING CLASS
    // ======================================

    if (editingClassId) {

      await updateDoc(

        doc(
          db,
          "timetable",
          editingClassId
        ),

        classData

      );

    }

    // ======================================
    // ADD NEW CLASS
    // ======================================

    else {

      await addDoc(

        collection(
          db,
          "timetable"
        ),

        {
          ...classData,

          createdAt:
            serverTimestamp()

        }

      );

    }


    closeClassModal();


    await loadTimetableData();


  } catch (error) {

    console.error(
      "Error saving class:",
      error
    );


    if (
      error.code ===
      "permission-denied"
    ) {

      errorElement.textContent =
        "Permission denied. Check Firestore Rules.";

    } else {

      errorElement.textContent =
        "Failed to save class. Try again.";

    }

  }

}


// ============================================
// DELETE CLASS
// ============================================

async function deleteClass(
  classId
) {

  const confirmed =
    confirm(
      "Are you sure you want to delete this class?"
    );


  if (!confirmed) return;


  try {

    await deleteDoc(
      doc(
        db,
        "timetable",
        classId
      )
    );


    await loadTimetableData();


  } catch (error) {

    console.error(
      "Error deleting class:",
      error
    );


    alert(
      "Failed to delete class."
    );

  }

}


// ============================================
// ADD CLASS BUTTON
// ============================================

if (addClassBtn) {

  addClassBtn.addEventListener(
    "click",
    () => {

      openClassModal();

    }
  );

}


// ============================================
// BRANCH FILTER
// ============================================

if (branchSelect) {

  branchSelect.addEventListener(
    "change",
    () => {

      updateStatistics();

      renderTimetable();

    }
  );

}


// ============================================
// ESCAPE HTML
// ============================================

function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}


function escapeAttribute(value) {

  return escapeHTML(value);

}


// ============================================
// AUTHENTICATION
// ============================================

onAuthStateChanged(
  auth,
  (user) => {

    if (user) {

      console.log(
        "Authenticated user:",
        user.uid
      );

      loadTimetableData();

    } else {

      console.error(
        "No authenticated user found."
      );

      showStatus(
        "Please log in first.",
        "error"
      );


      if (addClassBtn) {
        addClassBtn.disabled = true;
      }

    }

  }
);