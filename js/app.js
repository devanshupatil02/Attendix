// ============================================
// ATTENDIX - Firebase Authentication
// ============================================

// Firebase Core
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

// Firebase Authentication
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

// Firebase Firestore
import {
    getFirestore,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// ============================================
// FIREBASE CONFIGURATION
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

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


// ============================================
// DOM ELEMENTS
// ============================================

const loginForm = document.getElementById("loginForm");
const roleInput = document.getElementById("role");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const loginButton = document.getElementById("loginBtn");
const loginError = document.getElementById("login-error");

const togglePasswordButton =
    document.getElementById("togglePassword");


// ============================================
// SHOW ERROR MESSAGE
// ============================================

function showError(message) {

    if (!loginError) return;

    loginError.textContent = message;
    loginError.hidden = false;
}


// ============================================
// HIDE ERROR MESSAGE
// ============================================

function hideError() {

    if (!loginError) return;

    loginError.textContent = "";
    loginError.hidden = true;
}


// ============================================
// LOGIN BUTTON LOADING STATE
// ============================================

function setLoginLoading(isLoading) {

    if (!loginButton) return;

    loginButton.disabled = isLoading;

    if (isLoading) {
        loginButton.textContent = "Signing In...";
    } else {
        loginButton.textContent = "Sign In";
    }
}


// ============================================
// PASSWORD VISIBILITY
// ============================================

if (togglePasswordButton) {

    togglePasswordButton.addEventListener("click", () => {

        const isPassword =
            passwordInput.type === "password";

        passwordInput.type =
            isPassword ? "text" : "password";

        togglePasswordButton.setAttribute(
            "aria-label",
            isPassword ? "Hide password" : "Show password"
        );

        togglePasswordButton.setAttribute(
            "aria-pressed",
            String(isPassword)
        );
    });
}


// ============================================
// FIREBASE ERROR HANDLER
// ============================================

function getLoginErrorMessage(errorCode) {

    switch (errorCode) {

        case "auth/invalid-email":
            return "Please enter a valid email address.";

        case "auth/user-not-found":
            return "No account was found with this email.";

        case "auth/wrong-password":
            return "Incorrect password.";

        case "auth/invalid-credential":
            return "Invalid email or password.";

        case "auth/user-disabled":
            return "This account has been disabled.";

        case "auth/too-many-requests":
            return "Too many login attempts. Please try again later.";

        case "auth/network-request-failed":
            return "Network error. Please check your internet connection.";

        default:
            return "Login failed. Please try again.";
    }
}


// ============================================
// LOGIN FORM
// ============================================

if (loginForm) {

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        hideError();

        const selectedRole =
            roleInput.value.trim().toLowerCase();

        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;


        // ----------------------------------------
        // BASIC VALIDATION
        // ----------------------------------------

        if (!selectedRole) {
            showError("Please select your role.");
            roleInput.focus();
            return;
        }

        if (selectedRole !== "admin" && selectedRole !== "teacher") {
            showError("Invalid role selected.");
            return;
        }

        if (!email) {
            showError("Please enter your email address.");
            emailInput.focus();
            return;
        }

        if (!password) {
            showError("Please enter your password.");
            passwordInput.focus();
            return;
        }


        // ----------------------------------------
        // START LOGIN
        // ----------------------------------------

        setLoginLoading(true);

        try {

            // Firebase Authentication
            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            const user =
                userCredential.user;


            // ----------------------------------------
            // GET USER PROFILE FROM FIRESTORE
            // ----------------------------------------

            const userRef =
                doc(db, "users", user.uid);

            const userSnapshot =
                await getDoc(userRef);


            // User document does not exist
            if (!userSnapshot.exists()) {

                await signOut(auth);

                showError(
                    "Your account is not configured in ATTENDIX. Please contact the administrator."
                );

                return;
            }


            // ----------------------------------------
            // USER DATA
            // ----------------------------------------

            const userData =
                userSnapshot.data();

            const firestoreRole =
                String(userData.role || "")
                    .trim()
                    .toLowerCase();


            // ----------------------------------------
            // CHECK USER ROLE
            // ----------------------------------------

            if (!firestoreRole) {

                await signOut(auth);

                showError(
                    "Your account does not have a role assigned."
                );

                return;
            }


            if (firestoreRole !== selectedRole) {

                await signOut(auth);

                showError(
                    `This account is registered as ${firestoreRole}, not ${selectedRole}.`
                );

                return;
            }


            // ----------------------------------------
            // LOGIN SUCCESS
            // ----------------------------------------

            if (firestoreRole === "admin") {

                window.location.href =
                    "pages/admin.html";

                return;
            }


            if (firestoreRole === "teacher") {

                window.location.href =
                    "pages/teacher.html";

                return;
            }


            // ----------------------------------------
            // UNKNOWN ROLE
            // ----------------------------------------

            await signOut(auth);

            showError(
                "Your account has an invalid role. Please contact the administrator."
            );

        } catch (error) {

            console.error("ATTENDIX Login Error:", error);

            showError(
                getLoginErrorMessage(error.code)
            );

        } finally {

            setLoginLoading(false);
        }
    });
}