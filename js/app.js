// ============================================================
// ATTENDIX - FIREBASE LOGIN
// ADMIN / TEACHER / STUDENT
// ============================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    setPersistence,
    browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// ============================================================
// FIREBASE CONFIG
// ============================================================

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
// INITIALIZE
// ============================================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


// ============================================================
// ELEMENTS
// ============================================================

const loginForm =
    document.getElementById("loginForm");

const roleInput =
    document.getElementById("role");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const loginButton =
    document.getElementById("loginBtn");

const loginError =
    document.getElementById("login-error");

const togglePasswordButton =
    document.getElementById("togglePassword");


// ============================================================
// ERROR
// ============================================================

function showError(message) {

    if (!loginError) return;

    loginError.textContent = message;

    loginError.hidden = false;
}


function hideError() {

    if (!loginError) return;

    loginError.textContent = "";

    loginError.hidden = true;
}


// ============================================================
// LOADING
// ============================================================

function setLoading(value) {

    if (!loginButton) return;

    loginButton.disabled = value;

    loginButton.textContent =
        value
            ? "Signing In..."
            : "Sign In";
}


// ============================================================
// PASSWORD TOGGLE
// ============================================================

if (togglePasswordButton) {

    togglePasswordButton.addEventListener(
        "click",
        () => {

            const passwordVisible =
                passwordInput.type === "text";

            passwordInput.type =
                passwordVisible
                    ? "password"
                    : "text";

        }
    );
}


// ============================================================
// ERROR MESSAGE
// ============================================================

function getErrorMessage(error) {

    console.error(
        "Firebase error code:",
        error.code
    );

    console.error(
        "Firebase error message:",
        error.message
    );


    switch (error.code) {

        case "auth/invalid-email":
            return "Invalid email address.";

        case "auth/user-not-found":
            return "Student account does not exist in Firebase Authentication.";

        case "auth/wrong-password":
            return "Incorrect password.";

        case "auth/invalid-credential":
            return "Invalid email or password.";

        case "auth/user-disabled":
            return "This account has been disabled.";

        case "auth/too-many-requests":
            return "Too many attempts. Try again later.";

        case "auth/network-request-failed":
            return "Network error. Check your internet.";

        default:
            return "Login failed: " + (
                error.code || "Unknown error"
            );
    }
}


// ============================================================
// LOGIN
// ============================================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            hideError();

            const selectedRole =
                String(roleInput.value)
                    .trim()
                    .toLowerCase();

            const email =
                String(emailInput.value)
                    .trim();

            const password =
                passwordInput.value;


            // ------------------------------------------------
            // VALIDATION
            // ------------------------------------------------

            if (!selectedRole) {

                showError(
                    "Please select your role."
                );

                return;
            }


            if (!email) {

                showError(
                    "Please enter your email."
                );

                return;
            }


            if (!password) {

                showError(
                    "Please enter your password."
                );

                return;
            }


            setLoading(true);


            try {

                // ------------------------------------------------
                // PERSIST LOGIN
                // ------------------------------------------------

                await setPersistence(
                    auth,
                    browserLocalPersistence
                );


                // ------------------------------------------------
                // FIREBASE AUTH LOGIN
                // ------------------------------------------------

                const credential =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    credential.user;


                console.log(
                    "LOGIN SUCCESS"
                );

                console.log(
                    "Email:",
                    user.email
                );

                console.log(
                    "UID:",
                    user.uid
                );


                // ------------------------------------------------
                // GET USER PROFILE
                // ------------------------------------------------

                const userRef =
                    doc(
                        db,
                        "users",
                        user.uid
                    );


                const userSnap =
                    await getDoc(userRef);


                if (!userSnap.exists()) {

                    await signOut(auth);

                    showError(
                        "Firebase login succeeded, but users profile was not found."
                    );

                    return;
                }


                const userData =
                    userSnap.data();


                console.log(
                    "Firestore user:",
                    userData
                );


                // ------------------------------------------------
                // ROLE
                // ------------------------------------------------

                const firestoreRole =
                    String(
                        userData.role || ""
                    )
                    .trim()
                    .toLowerCase();


                console.log(
                    "Role:",
                    firestoreRole
                );


                if (!firestoreRole) {

                    await signOut(auth);

                    showError(
                        "No role assigned to this account."
                    );

                    return;
                }


                // ------------------------------------------------
                // ROLE MATCH
                // ------------------------------------------------

                if (
                    selectedRole !==
                    firestoreRole
                ) {

                    await signOut(auth);

                    showError(
                        `This account is registered as ${firestoreRole}.`
                    );

                    return;
                }


                // =================================================
                // ADMIN
                // =================================================

                if (
                    firestoreRole === "admin"
                ) {

                    window.location.replace(
                        "pages/admin.html"
                    );

                    return;
                }


                // =================================================
                // TEACHER
                // =================================================

                if (
                    firestoreRole === "teacher"
                ) {

                    window.location.replace(
                        "pages/teacher.html"
                    );

                    return;
                }


                // =================================================
                // STUDENT
                // =================================================

                if (
                    firestoreRole === "student"
                ) {

                    // Make sure student profile is linked

                    if (!userData.student_id) {

                        await signOut(auth);

                        showError(
                            "Student ID is missing from your profile."
                        );

                        return;
                    }


                    console.log(
                        "Student ID:",
                        userData.student_id
                    );


                    window.location.replace(
                        "pages/student-dashboard.html"
                    );

                    return;
                }


                // ------------------------------------------------
                // INVALID ROLE
                // ------------------------------------------------

                await signOut(auth);

                showError(
                    "Invalid role. Contact administrator."
                );

            } catch (error) {

                console.error(
                    "ATTENDIX LOGIN ERROR:",
                    error
                );

                showError(
                    getErrorMessage(error)
                );

            } finally {

                setLoading(false);
            }

        }
    );
}