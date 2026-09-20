// ============================================================
// ATTENDIX - MY STUDENTS
// Teacher Student List + Attendance
// ============================================================

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
    getDocs
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// ============================================================
// FIREBASE CONFIG
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyAxVUvIhjrBhmR_0uyXJyQmD00eQ9mgq9M",
    authDomain: "attendix-rfid-attendance.firebaseapp.com",
    projectId: "attendix-rfid-attendance",
    storageBucket: "attendix-rfid-attendance.firebasestorage.app",
    messagingSenderId: "1038365817716",
    appId: "1:1038365817716:web:a1160a5265dfb417da8a21",
    measurementId: "G-ZYCH6VZHD0"
};


// ============================================================
// FIREBASE INITIALIZATION
// ============================================================

const app = getApps().length
    ? getApp()
    : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);


// ============================================================
// GLOBAL DATA
// ============================================================

let allStudents = [];
let allAttendance = [];
let allTimetable = [];
let allAssignments = [];
let allSubjects = [];

let currentTeacherUid = "";


// ============================================================
// ELEMENTS
// ============================================================

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

const statusFilter =
    document.getElementById("statusFilter");

const pageSubtitle =
    document.getElementById("pageSubtitle");

const studentGroup =
    document.getElementById("studentGroup");

const studentTableSubtitle =
    document.getElementById(
        "studentTableSubtitle"
    );


// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function normalize(value) {

    return String(value ?? "")
        .trim()
        .toLowerCase();

}


function formatDate(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


function formatScanTime(
    date,
    time
) {

    if (!date && !time) {
        return "Never";
    }

    if (date && time) {

        return `${date} ${formatTime(time)}`;

    }

    if (date) {
        return date;
    }

    return formatTime(time);

}


function formatTime(time) {

    if (!time) {
        return "";
    }

    const parts =
        String(time).split(":");

    if (parts.length < 2) {
        return time;
    }

    let hour =
        Number(parts[0]);

    const minute =
        parts[1];

    const suffix =
        hour >= 12
            ? "PM"
            : "AM";

    hour =
        hour % 12 || 12;

    return `${hour}:${minute} ${suffix}`;

}


// ============================================================
// LOAD FIREBASE DATA
// ============================================================

async function loadStudentData() {

    try {

        console.log(
            "ATTENDIX: Loading My Students..."
        );


        // ====================================================
        // LOAD STUDENTS
        // ====================================================

        const studentsSnapshot =
            await getDocs(
                collection(
                    db,
                    "students"
                )
            );

        allStudents =
            studentsSnapshot.docs.map(
                (item) => ({
                    id: item.id,
                    ...item.data()
                })
            );


        // ====================================================
        // LOAD ATTENDANCE
        // ====================================================

        const attendanceSnapshot =
            await getDocs(
                collection(
                    db,
                    "attendance"
                )
            );

        allAttendance =
            attendanceSnapshot.docs.map(
                (item) => ({
                    id: item.id,
                    ...item.data()
                })
            );


        // ====================================================
        // LOAD TIMETABLE
        // ====================================================

        const timetableSnapshot =
            await getDocs(
                collection(
                    db,
                    "timetable"
                )
            );

        allTimetable =
            timetableSnapshot.docs.map(
                (item) => ({
                    id: item.id,
                    ...item.data()
                })
            );


        // ====================================================
        // LOAD TEACHER ASSIGNMENTS
        // ====================================================

        const assignmentsSnapshot =
            await getDocs(
                collection(
                    db,
                    "teacher_assignments"
                )
            );

        allAssignments =
            assignmentsSnapshot.docs.map(
                (item) => ({
                    id: item.id,
                    ...item.data()
                })
            );


        // ====================================================
        // LOAD SUBJECTS
        // ====================================================

        const subjectsSnapshot =
            await getDocs(
                collection(
                    db,
                    "subjects"
                )
            );

        allSubjects =
            subjectsSnapshot.docs.map(
                (item) => ({
                    id: item.id,
                    ...item.data()
                })
            );


        // ====================================================
        // DEBUG
        // ====================================================

        console.log(
            "Students:",
            allStudents
        );

        console.log(
            "Attendance:",
            allAttendance
        );

        console.log(
            "Timetable:",
            allTimetable
        );

        console.log(
            "Teacher assignments:",
            allAssignments
        );

        console.log(
            "Subjects:",
            allSubjects
        );


        // ====================================================
        // UPDATE PAGE
        // ====================================================

        updatePage();

    } catch (error) {

        console.error(
            "ATTENDIX My Students Error:",
            error
        );

        showError(
            "Unable to load student data."
        );

    }

}


// ============================================================
// GET TEACHER STUDENTS
// ============================================================

function getTeacherStudents() {

    const teacherUid =
        currentTeacherUid;


    // --------------------------------------------------------
    // STEP 1
    // Find subjects assigned to teacher
    // --------------------------------------------------------

    const assignedSubjectIds =
        new Set();


    allAssignments.forEach(
        (assignment) => {

            if (
                assignment.teacher_uid ===
                teacherUid
            ) {

                if (
                    assignment.subject_id
                ) {

                    assignedSubjectIds.add(
                        assignment.subject_id
                    );

                }

            }

        }
    );


    // --------------------------------------------------------
    // STEP 2
    // Find timetable subjects
    // --------------------------------------------------------

    allTimetable.forEach(
        (item) => {

            if (
                item.teacherUid ===
                teacherUid
            ) {

                if (
                    item.subjectID
                ) {

                    assignedSubjectIds.add(
                        item.subjectID
                    );

                }

            }

        }
    );


    console.log(
        "Teacher assigned subjects:",
        [...assignedSubjectIds]
    );


    // --------------------------------------------------------
    // STEP 3
    // Find attendance records belonging to teacher
    // --------------------------------------------------------

    const teacherAttendance =
        allAttendance.filter(
            (record) => {

                return (
                    record.teacher_uid ===
                    teacherUid
                );

            }
        );


    // --------------------------------------------------------
    // STEP 4
    // Find students from attendance
    // --------------------------------------------------------

    const studentIds =
        new Set();


    teacherAttendance.forEach(
        (record) => {

            if (
                record.student_id
            ) {

                studentIds.add(
                    record.student_id
                );

            }

        }
    );


    // --------------------------------------------------------
    // STEP 5
    // If no attendance exists,
    // use students matching assigned subjects
    // through timetable/attendance relationship.
    // --------------------------------------------------------

    let teacherStudents =
        allStudents.filter(
            (student) => {

                return (
                    student.active !== false &&
                    studentIds.has(
                        student.id
                    )
                );

            }
        );


    // --------------------------------------------------------
    // If there is no attendance yet,
    // return active students.
    //
    // This is useful while the RFID system
    // is still being populated.
    // --------------------------------------------------------

    if (
        teacherStudents.length === 0
    ) {

        teacherStudents =
            allStudents.filter(
                (student) =>
                    student.active !== false
            );

    }


    return teacherStudents;

}


// ============================================================
// CALCULATE STUDENT ATTENDANCE
// ============================================================

function calculateAttendance(
    studentId
) {

    const studentAttendance =
        allAttendance.filter(
            (record) => {

                return (
                    record.student_id ===
                    studentId
                );

            }
        );


    // No attendance
    if (
        studentAttendance.length === 0
    ) {

        return {

            total: 0,

            present: 0,

            percentage: 0,

            lastScan: null,

            status: "Absent"

        };

    }


    // --------------------------------------------------------
    // Count attendance records
    // --------------------------------------------------------

    const present =
        studentAttendance.length;


    // --------------------------------------------------------
    // Find last scan
    // --------------------------------------------------------

    const sorted =
        [...studentAttendance]
            .sort(
                (a, b) => {

                    const dateA =
                        `${a.date || ""} ${
                            a.time || ""
                        }`;

                    const dateB =
                        `${b.date || ""} ${
                            b.time || ""
                        }`;

                    return dateB.localeCompare(
                        dateA
                    );

                }
            );


    const lastScan =
        sorted[0] || null;


    // --------------------------------------------------------
    // IMPORTANT:
    //
    // The attendance collection currently stores
    // successful scans only.
    //
    // There is no separate "absent" record.
    //
    // Therefore we calculate attendance using
    // teacher timetable class count when available.
    // --------------------------------------------------------

    const teacherClasses =
        allTimetable.filter(
            (item) =>
                item.teacherUid ===
                currentTeacherUid
        );


    const totalClasses =
        teacherClasses.length;


    let percentage = 0;


    if (
        totalClasses > 0
    ) {

        percentage =
            Math.round(
                Math.min(
                    (
                        present /
                        totalClasses
                    ) * 100,
                    100
                )
            );

    } else {

        // If timetable is not configured yet,
        // show 100% for a student with scans.
        percentage =
            present > 0
                ? 100
                : 0;

    }


    return {

        total:
            totalClasses,

        present,

        percentage,

        lastScan,

        status:
            percentage >= 75
                ? "Present"
                : "Absent"

    };

}


// ============================================================
// UPDATE PAGE
// ============================================================

function updatePage() {

    const teacherStudents =
        getTeacherStudents();


    // ========================================================
    // CALCULATE ALL STUDENT ATTENDANCE
    // ========================================================

    const studentsWithAttendance =
        teacherStudents.map(
            (student) => {

                return {

                    ...student,

                    attendance:
                        calculateAttendance(
                            student.id
                        )

                };

            }
        );


    // ========================================================
    // STATS
    // ========================================================

    updateStatistics(
        studentsWithAttendance
    );


    // ========================================================
    // TABLE
    // ========================================================

    renderStudents(
        studentsWithAttendance
    );


    // ========================================================
    // PAGE TEXT
    // ========================================================

    updatePageText(
        teacherStudents
    );

}


// ============================================================
// UPDATE STATISTICS
// ============================================================

function updateStatistics(
    students
) {

    const total =
        students.length;


    const good =
        students.filter(
            (student) =>
                student.attendance
                    .percentage >= 75
        ).length;


    const low =
        students.filter(
            (student) =>
                student.attendance
                    .percentage < 75
        ).length;


    let average = 0;


    if (total > 0) {

        const sum =
            students.reduce(
                (
                    totalValue,
                    student
                ) => {

                    return (
                        totalValue +
                        student.attendance
                            .percentage
                    );

                },
                0
            );


        average =
            Math.round(
                sum / total
            );

    }


    if (totalStudentsEl) {

        totalStudentsEl.textContent =
            total;

    }


    if (goodAttendanceEl) {

        goodAttendanceEl.textContent =
            good;

    }


    if (lowAttendanceEl) {

        lowAttendanceEl.textContent =
            low;

    }


    if (averageAttendanceEl) {

        averageAttendanceEl.textContent =
            `${average}%`;

    }

}


// ============================================================
// UPDATE PAGE TEXT
// ============================================================

function updatePageText(
    students
) {

    const activeStudents =
        students.filter(
            (student) =>
                student.active !== false
        );


    const branches =
        [
            ...new Set(
                activeStudents
                    .map(
                        (student) =>
                            student.department
                    )
                    .filter(Boolean)
            )
        ];


    const classes =
        [
            ...new Set(
                activeStudents
                    .map(
                        (student) =>
                            student.class
                    )
                    .filter(Boolean)
            )
        ];


    if (pageSubtitle) {

        if (
            classes.length
        ) {

            pageSubtitle.textContent =
                classes.join(
                    " · "
                );

        } else {

            pageSubtitle.textContent =
                `${students.length} assigned students`;

        }

    }


    if (studentGroup) {

        if (
            branches.length
        ) {

            studentGroup.textContent =
                branches.join(
                    " · "
                );

        } else {

            studentGroup.textContent =
                "Assigned students";

        }

    }


    if (studentTableSubtitle) {

        studentTableSubtitle.textContent =
            `${students.length} students enrolled`;

    }

}


// ============================================================
// RENDER STUDENTS
// ============================================================

function renderStudents(
    students
) {

    if (!studentsTableBody) {
        return;
    }


    if (!students.length) {

        studentsTableBody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    style="
                        text-align:center;
                        padding:30px;
                    "
                >

                    No students found.

                </td>

            </tr>

        `;

        return;

    }


    studentsTableBody.innerHTML =
        students.map(
            (student) => {

                const attendance =
                    student.attendance;


                const percentage =
                    attendance.percentage;


                const initials =
                    getInitials(
                        student.name
                    );


                let progressClass =
                    "green";


                if (
                    percentage < 75 &&
                    percentage >= 60
                ) {

                    progressClass =
                        "orange";

                }


                if (
                    percentage < 60
                ) {

                    progressClass =
                        "red";

                }


                const status =
                    percentage >= 75
                        ? "Present"
                        : "Absent";


                const statusClass =
                    percentage >= 75
                        ? "badge-present"
                        : "badge-absent";


                let lastScan =
                    "Never";


                if (
                    attendance.lastScan
                ) {

                    lastScan =
                        formatScanTime(
                            attendance
                                .lastScan
                                .date,
                            attendance
                                .lastScan
                                .time
                        );

                }


                return `

                    <tr
                        data-student-id="${escapeHTML(
                            student.id
                        )}"
                    >


                        <!-- ROLL NO -->

                        <td>

                            ${escapeHTML(
                                student.roll_no ||
                                "—"
                            )}

                        </td>


                        <!-- NAME -->

                        <td>

                            <div
                                class="student-name"
                            >

                                <div
                                    class="student-avatar"
                                >
                                    ${escapeHTML(
                                        initials
                                    )}
                                </div>


                                <div
                                    class="student-details"
                                >

                                    <strong>
                                        ${escapeHTML(
                                            student.name ||
                                            "Unnamed Student"
                                        )}
                                    </strong>

                                    <span>
                                        ${escapeHTML(
                                            student.class ||
                                            "—"
                                        )}
                                    </span>

                                </div>

                            </div>

                        </td>


                        <!-- BRANCH -->

                        <td>

                            ${escapeHTML(
                                student.department ||
                                "—"
                            )}

                        </td>


                        <!-- ATTENDANCE -->

                        <td>

                            <div
                                class="attendance-cell"
                            >

                                <div
                                    class="progress-bar-wrap"
                                >

                                    <div
                                        class="progress-bar-fill ${progressClass}"
                                        style="width:${percentage}%"
                                    ></div>

                                </div>


                                <span
                                    class="attendance-pct"
                                >
                                    ${percentage}%
                                </span>

                            </div>

                        </td>


                        <!-- LAST SCAN -->

                        <td>

                            ${escapeHTML(
                                lastScan
                            )}

                        </td>


                        <!-- STATUS -->

                        <td>

                            <span
                                class="badge ${statusClass}"
                            >
                                ${status}
                            </span>

                        </td>


                    </tr>

                `;

            }
        ).join("");

}


// ============================================================
// GET INITIALS
// ============================================================

function getInitials(
    name
) {

    const words =
        String(
            name || ""
        )
        .trim()
        .split(
            /\s+/
        )
        .filter(Boolean);


    if (!words.length) {
        return "ST";
    }


    if (words.length === 1) {

        return words[0]
            .slice(0, 2)
            .toUpperCase();

    }


    return (
        words[0][0] +
        words[1][0]
    ).toUpperCase();

}


// ============================================================
// SEARCH
// ============================================================

function applyFilters() {

    const teacherStudents =
        getTeacherStudents();


    const students =
        teacherStudents.map(
            (student) => ({

                ...student,

                attendance:
                    calculateAttendance(
                        student.id
                    )

            })
        );


    const search =
        normalize(
            searchInput?.value
        );


    const year =
        normalize(
            yearFilter?.value
        );


    const status =
        normalize(
            statusFilter?.value
        );


    const filtered =
        students.filter(
            (student) => {

                // --------------------------------------------
                // SEARCH
                // --------------------------------------------

                const searchText =
                    [
                        student.name,
                        student.roll_no,
                        student.email,
                        student.rfid_uid
                    ]
                    .map(normalize)
                    .join(" ");


                if (
                    search &&
                    !searchText.includes(
                        search
                    )
                ) {

                    return false;

                }


                // --------------------------------------------
                // YEAR
                // --------------------------------------------

                if (
                    year &&
                    normalize(
                        student.class
                    ) !== year
                ) {

                    return false;

                }


                // --------------------------------------------
                // STATUS
                // --------------------------------------------

                const studentStatus =
                    student.attendance
                        .percentage >= 75
                        ? "present"
                        : "absent";


                if (
                    status &&
                    studentStatus !== status
                ) {

                    return false;

                }


                return true;

            }
        );


    renderStudents(
        filtered
    );

}


// ============================================================
// FILTER EVENTS
// ============================================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        applyFilters
    );

}


if (yearFilter) {

    yearFilter.addEventListener(
        "change",
        applyFilters
    );

}


if (statusFilter) {

    statusFilter.addEventListener(
        "change",
        applyFilters
    );

}


// ============================================================
// ERROR
// ============================================================

function showError(
    message
) {

    if (!studentsTableBody) {
        return;
    }


    studentsTableBody.innerHTML = `

        <tr>

            <td
                colspan="6"
                style="
                    text-align:center;
                    padding:30px;
                    color:#dc2626;
                "
            >

                ${escapeHTML(
                    message
                )}

            </td>

        </tr>

    `;

}


// ============================================================
// AUTHENTICATION
// ============================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "../index.html";

            return;

        }


        currentTeacherUid =
            user.uid;


        console.log(
            "Logged-in Teacher UID:",
            currentTeacherUid
        );


        await loadStudentData();

    }
);


// ============================================================
// REFRESH WHEN USER IS READY
// ============================================================

document.addEventListener(
    "attendixUserReady",
    (event) => {

        if (
            event.detail &&
            event.detail.uid
        ) {

            currentTeacherUid =
                event.detail.uid;

        }

    }
);