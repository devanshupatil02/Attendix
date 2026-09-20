
/*
============================================
ATTENDIX – Admin Students
Firebase / Firestore
Add, Edit and Delete Students
============================================
*/

import {
    initializeApp,
    getApps,
    getApp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getFirestore,
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy
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
// INITIALIZE FIREBASE
// ============================================

const app = getApps().length
    ? getApp()
    : initializeApp(firebaseConfig);

const db = getFirestore(app);


// ============================================
// ELEMENTS
// ============================================

const totalStudentsEl =
    document.getElementById("totalStudents");

const goodAttendanceEl =
    document.getElementById("goodAttendance");

const lowAttendanceEl =
    document.getElementById("lowAttendance");

const averageAttendanceEl =
    document.getElementById("averageAttendance");

const studentsTableBody =
    document.getElementById("studentsTableBody");

const searchInput =
    document.getElementById("searchInput");

const yearFilter =
    document.getElementById("yearFilter");

const branchFilter =
    document.getElementById("branchFilter");

const addStudentBtn =
    document.getElementById("addStudentBtn");

const studentModal =
    document.getElementById("studentModal");

const closeStudentModal =
    document.getElementById("closeStudentModal");

const cancelStudentBtn =
    document.getElementById("cancelStudentBtn");

const studentForm =
    document.getElementById("studentForm");

const studentFormError =
    document.getElementById("studentFormError");

const saveStudentBtn =
    document.getElementById("saveStudentBtn");

const studentModalTitle =
    document.getElementById("studentModalTitle");


// ============================================
// DATA
// ============================================

let students = [];

let editingStudentId = null;


// ============================================
// FORM ELEMENTS
// ============================================

const studentNameInput =
    document.getElementById("studentName");

const studentRollNoInput =
    document.getElementById("studentRollNo");

const studentEmailInput =
    document.getElementById("studentEmail");

const studentClassInput =
    document.getElementById("studentClass");

const studentDepartmentInput =
    document.getElementById("studentDepartment");

const studentRfidInput =
    document.getElementById("studentRfid");

const studentActiveInput =
    document.getElementById("studentActive");


// ============================================
// LOAD STUDENTS
// ============================================

async function loadStudents() {

    try {

        studentsTableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;">
                    Loading students...
                </td>
            </tr>
        `;

        let snapshot;

        try {

            const studentsQuery = query(
                collection(db, "students"),
                orderBy("roll_no")
            );

            snapshot = await getDocs(studentsQuery);

        } catch (error) {

            console.warn(
                "Ordered query failed. Loading without orderBy.",
                error
            );

            snapshot = await getDocs(
                collection(db, "students")
            );

        }

        students = snapshot.docs.map(studentDoc => ({
            id: studentDoc.id,
            ...studentDoc.data()
        }));

        updateStudentCount();

        renderStudents();

    } catch (error) {

        console.error(
            "Error loading students:",
            error
        );

        studentsTableBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    style="text-align:center;color:#dc2626;"
                >
                    Failed to load students.
                </td>
            </tr>
        `;

    }

}


// ============================================
// UPDATE STUDENT COUNT
// ============================================

function updateStudentCount() {

    const activeStudents =
        students.filter(student =>
            student.active !== false
        );

    if (totalStudentsEl) {

        totalStudentsEl.textContent =
            activeStudents.length;

    }

    /*
    Attendance statistics will be connected
    to the attendance collection later.
    */

    if (goodAttendanceEl) {
        goodAttendanceEl.textContent = "—";
    }

    if (lowAttendanceEl) {
        lowAttendanceEl.textContent = "—";
    }

    if (averageAttendanceEl) {
        averageAttendanceEl.textContent = "—";
    }

}


// ============================================
// RENDER STUDENTS
// ============================================

function renderStudents() {

    let filteredStudents = students.filter(student =>
        student.active !== false
    );

    const search =
        searchInput?.value
            ?.trim()
            .toLowerCase() || "";

    const selectedYear =
        yearFilter?.value
            ?.trim()
            .toLowerCase() || "";

    const selectedBranch =
        branchFilter?.value
            ?.trim()
            .toLowerCase() || "";


    // ========================================
    // SEARCH FILTER
    // ========================================

    if (search) {

        filteredStudents =
            filteredStudents.filter(student => {

                const name =
                    String(student.name || "")
                        .toLowerCase();

                const rollNo =
                    String(student.roll_no || "")
                        .toLowerCase();

                const email =
                    String(student.email || "")
                        .toLowerCase();

                const rfid =
                    String(student.rfid_uid || "")
                        .toLowerCase();

                return (
                    name.includes(search) ||
                    rollNo.includes(search) ||
                    email.includes(search) ||
                    rfid.includes(search)
                );

            });

    }


    // ========================================
    // YEAR FILTER
    // ========================================

    if (selectedYear) {

        filteredStudents =
            filteredStudents.filter(student =>
                String(student.class || "")
                    .trim()
                    .toLowerCase() === selectedYear
            );

    }


    // ========================================
    // BRANCH FILTER
    // ========================================

    if (selectedBranch) {

        filteredStudents =
            filteredStudents.filter(student =>
                String(student.department || "")
                    .trim()
                    .toLowerCase() === selectedBranch
            );

    }


    // ========================================
    // EMPTY STATE
    // ========================================

    if (filteredStudents.length === 0) {

        studentsTableBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    style="text-align:center;"
                >
                    ${
                        students.length === 0
                            ? "No students registered yet."
                            : "No students match the selected filters."
                    }
                </td>
            </tr>
        `;

        return;

    }


    // ========================================
    // STUDENT TABLE
    // ========================================

    studentsTableBody.innerHTML =
        filteredStudents.map(student => {

            const name =
                escapeHTML(student.name || "Unknown");

            const rollNo =
                escapeHTML(student.roll_no || "—");

            const department =
                escapeHTML(student.department || "—");

            const studentClass =
                escapeHTML(student.class || "—");


            return `
                <tr>

                    <td>
                        ${rollNo}
                    </td>

                    <td>
                        <strong>
                            ${name}
                        </strong>
                    </td>

                    <td>
                        ${department}
                    </td>

                    <td>
                        ${studentClass}
                    </td>

                    <td>
                        <span
                            style="
                                color:#6b7280;
                                font-size:13px;
                            "
                        >
                            —
                        </span>
                    </td>

                    <td>
                        <span
                            style="
                                color:#6b7280;
                                font-size:13px;
                            "
                        >
                            —
                        </span>
                    </td>

                    <td>
                        <span class="badge badge-good">
                            Active
                        </span>
                    </td>

                    <td>
                        <div
                            style="
                                display:flex;
                                gap:6px;
                                flex-wrap:wrap;
                            "
                        >

                            <button
                                type="button"
                                class="btn btn-secondary btn-sm edit-student-btn"
                                data-id="${student.id}"
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                class="btn btn-danger btn-sm delete-student-btn"
                                data-id="${student.id}"
                            >
                                Delete
                            </button>

                        </div>
                    </td>

                </tr>
            `;

        }).join("");

}


// ============================================
// OPEN ADD MODAL
// ============================================

function openAddStudentModal() {

    editingStudentId = null;

    studentForm.reset();

    if (studentActiveInput) {
        studentActiveInput.checked = true;
    }

    if (studentModalTitle) {
        studentModalTitle.textContent = "Add Student";
    }

    if (saveStudentBtn) {
        saveStudentBtn.textContent = "Add Student";
    }

    openStudentModal();

}


// ============================================
// OPEN MODAL
// ============================================

function openStudentModal() {

    if (!studentModal) return;

    studentModal.hidden = false;

    document.body.style.overflow = "hidden";

    clearFormError();

    setTimeout(() => {

        studentNameInput?.focus();

    }, 50);

}


// ============================================
// CLOSE MODAL
// ============================================

function closeModal() {

    if (!studentModal) return;

    studentModal.hidden = true;

    document.body.style.overflow = "";

    clearFormError();

    editingStudentId = null;

    if (studentModalTitle) {
        studentModalTitle.textContent = "Add Student";
    }

    if (saveStudentBtn) {
        saveStudentBtn.textContent = "Add Student";
    }

}


// ============================================
// CLEAR FORM ERROR
// ============================================

function clearFormError() {

    if (!studentFormError) return;

    studentFormError.textContent = "";

    studentFormError.hidden = true;

}


// ============================================
// SHOW FORM ERROR
// ============================================

function showFormError(message) {

    if (!studentFormError) return;

    studentFormError.textContent = message;

    studentFormError.hidden = false;

}


// ============================================
// GET FORM DATA
// ============================================

function getStudentFormData() {

    const name =
        studentNameInput?.value.trim() || "";

    const rollNo =
        studentRollNoInput?.value.trim() || "";

    const email =
        studentEmailInput?.value.trim() || "";

    const studentClass =
        studentClassInput?.value.trim() || "";

    const department =
        studentDepartmentInput?.value.trim() || "";

    const rfidUid =
        studentRfidInput?.value.trim() || "";

    const active =
        studentActiveInput?.checked ?? true;


    const normalizedRfid =
        rfidUid
            .replace(/\s+/g, " ")
            .trim()
            .toUpperCase();


    return {
        name,
        rollNo,
        email,
        studentClass,
        department,
        normalizedRfid,
        active
    };

}


// ============================================
// VALIDATE STUDENT DATA
// ============================================

function validateStudentData(data) {

    const {
        name,
        rollNo,
        email,
        studentClass,
        department,
        normalizedRfid
    } = data;


    if (
        !name ||
        !rollNo ||
        !email ||
        !studentClass ||
        !department ||
        !normalizedRfid
    ) {

        showFormError(
            "Please fill in all required fields."
        );

        return false;

    }


    // ========================================
    // DUPLICATE ROLL NUMBER
    // ========================================

    const duplicateRoll =
        students.some(student => {

            if (student.id === editingStudentId) {
                return false;
            }

            return String(student.roll_no || "")
                .trim()
                .toLowerCase() === rollNo.toLowerCase();

        });


    if (duplicateRoll) {

        showFormError(
            "A student with this roll number already exists."
        );

        return false;

    }


    // ========================================
    // DUPLICATE RFID
    // ========================================

    const duplicateRfid =
        students.some(student => {

            if (student.id === editingStudentId) {
                return false;
            }

            return String(student.rfid_uid || "")
                .trim()
                .toUpperCase() === normalizedRfid;

        });


    if (duplicateRfid) {

        showFormError(
            "This RFID UID is already registered."
        );

        return false;

    }


    return true;

}


// ============================================
// SAVE STUDENT
// ============================================

async function saveStudent(event) {

    event.preventDefault();

    clearFormError();

    const data = getStudentFormData();

    if (!validateStudentData(data)) {
        return;
    }


    const studentData = {

        active: data.active,

        class: data.studentClass,

        department: data.department,

        email: data.email,

        name: data.name,

        rfid_uid: data.normalizedRfid,

        roll_no: data.rollNo

    };


    const isEditing =
        Boolean(editingStudentId);


    const originalButtonText =
        saveStudentBtn?.textContent ||
        "Save";


    if (saveStudentBtn) {

        saveStudentBtn.disabled = true;

        saveStudentBtn.textContent =
            isEditing
                ? "Updating..."
                : "Adding...";

    }


    try {

        if (isEditing) {

            await updateDoc(
                doc(db, "students", editingStudentId),
                studentData
            );

        } else {

            await addDoc(
                collection(db, "students"),
                studentData
            );

        }


        studentForm.reset();

        if (studentActiveInput) {
            studentActiveInput.checked = true;
        }

        editingStudentId = null;

        closeModal();

        await loadStudents();


    } catch (error) {

        console.error(
            "Error saving student:",
            error
        );


        let message =
            isEditing
                ? "Failed to update student. Please try again."
                : "Failed to add student. Please try again.";


        if (error.code === "permission-denied") {

            message =
                "Permission denied. Check your Firestore security rules.";

        }


        showFormError(message);


    } finally {

        if (saveStudentBtn) {

            saveStudentBtn.disabled = false;

            saveStudentBtn.textContent =
                originalButtonText;

        }

    }

}


// ============================================
// EDIT STUDENT
// ============================================

function editStudent(studentId) {

    const student =
        students.find(student =>
            student.id === studentId
        );


    if (!student) return;


    editingStudentId = studentId;


    if (studentModalTitle) {
        studentModalTitle.textContent = "Edit Student";
    }

    if (saveStudentBtn) {
        saveStudentBtn.textContent = "Update Student";
    }


    studentNameInput.value =
        student.name || "";

    studentRollNoInput.value =
        student.roll_no || "";

    studentEmailInput.value =
        student.email || "";

    studentClassInput.value =
        student.class || "";

    studentDepartmentInput.value =
        student.department || "";

    studentRfidInput.value =
        student.rfid_uid || "";

    studentActiveInput.checked =
        student.active !== false;


    openStudentModal();

}


// ============================================
// DELETE STUDENT
// ============================================

async function deleteStudent(studentId) {

    const student =
        students.find(student =>
            student.id === studentId
        );


    if (!student) return;


    const confirmed =
        window.confirm(
            `Are you sure you want to permanently delete ${
                student.name || "this student"
            }?`
        );


    if (!confirmed) return;


    try {

        await deleteDoc(
            doc(db, "students", studentId)
        );


        await loadStudents();


        window.alert(
            "Student deleted successfully."
        );


    } catch (error) {

        console.error(
            "Error deleting student:",
            error
        );


        if (error.code === "permission-denied") {

            window.alert(
                "Permission denied. Check your Firestore security rules."
            );

        } else {

            window.alert(
                "Failed to delete student. Please try again."
            );

        }

    }

}


// ============================================
// ESCAPE HTML
// ============================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ============================================
// EVENT LISTENERS
// ============================================

// Add student

addStudentBtn?.addEventListener(
    "click",
    openAddStudentModal
);


// Close modal

closeStudentModal?.addEventListener(
    "click",
    closeModal
);


// Cancel modal

cancelStudentBtn?.addEventListener(
    "click",
    closeModal
);


// Form submit

studentForm?.addEventListener(
    "submit",
    saveStudent
);


// Search

searchInput?.addEventListener(
    "input",
    renderStudents
);


// Year filter

yearFilter?.addEventListener(
    "change",
    renderStudents
);


// Branch filter

branchFilter?.addEventListener(
    "change",
    renderStudents
);


// Edit and Delete buttons

studentsTableBody?.addEventListener(
    "click",
    event => {

        const editButton =
            event.target.closest(".edit-student-btn");

        const deleteButton =
            event.target.closest(".delete-student-btn");


        if (editButton) {

            editStudent(
                editButton.dataset.id
            );

        }


        if (deleteButton) {

            deleteStudent(
                deleteButton.dataset.id
            );

        }

    }
);


// Close when clicking outside

studentModal?.addEventListener(
    "click",
    event => {

        if (event.target === studentModal) {

            closeModal();

        }

    }
);


// Close using Escape key

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            studentModal &&
            !studentModal.hidden
        ) {

            closeModal();

        }

    }
);


// ============================================
// INITIAL LOAD
// ============================================

loadStudents();