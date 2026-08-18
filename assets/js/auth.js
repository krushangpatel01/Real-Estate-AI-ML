// EstateAI JavaScript file - implementation will be added step by step.
const API_URL = "http://127.0.0.1:8000";


/* ============================================================
   ELEMENTS
============================================================ */

const registerForm =
    document.getElementById("registerForm");

const messageBox =
    document.getElementById("regMessage");

const registerBtn =
    document.getElementById("registerBtn");

const passwordInput =
    document.getElementById("password");

const confirmPasswordInput =
    document.getElementById("confirmPassword");


/* ============================================================
   SHOW MESSAGE
============================================================ */

function showRegisterMessage(message, type) {

    messageBox.textContent = message;

    messageBox.className =
        `reg-message ${type}`;

}


/* ============================================================
   PASSWORD VALIDATION
============================================================ */

function updatePasswordRules() {

    const password =
        passwordInput.value;


    document
        .getElementById("ruleLength")
        .classList.toggle(
            "valid",
            password.length >= 8
        );


    document
        .getElementById("ruleUpper")
        .classList.toggle(
            "valid",
            /[A-Z]/.test(password)
        );


    document
        .getElementById("ruleLower")
        .classList.toggle(
            "valid",
            /[a-z]/.test(password)
        );


    document
        .getElementById("ruleNumber")
        .classList.toggle(
            "valid",
            /\d/.test(password)
        );


    document
        .getElementById("ruleSpecial")
        .classList.toggle(
            "valid",
            /[^A-Za-z0-9]/.test(password)
        );
}


passwordInput.addEventListener(
    "input",
    updatePasswordRules
);


/* ============================================================
   SHOW / HIDE PASSWORD
============================================================ */

document
    .querySelectorAll(".reg-password-toggle")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const target =
                    document.getElementById(
                        button.dataset.target
                    );


                if (target.type === "password") {

                    target.type = "text";

                    button.textContent = "Hide";

                } else {

                    target.type = "password";

                    button.textContent = "Show";

                }

            }
        );

    });


/* ============================================================
   REGISTER
============================================================ */

registerForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const fullName =
            document
                .getElementById("fullName")
                .value
                .trim();


        const username =
            document
                .getElementById("username")
                .value
                .trim();


        const email =
            document
                .getElementById("email")
                .value
                .trim();


        const mobile =
            document
                .getElementById("mobile")
                .value
                .trim();


        const password =
            passwordInput.value;


        const confirmPassword =
            confirmPasswordInput.value;


        const role =
            document
                .getElementById("role")
                .value;


        const terms =
            document
                .getElementById("terms")
                .checked;


        /* ==============================================
           USERNAME
        ============================================== */

        if (
            username.length < 4 ||
            !/\d/.test(username)
        ) {

            showRegisterMessage(
                "Username must contain at least 4 characters and one number.",
                "error"
            );

            return;
        }


        /* ==============================================
           PASSWORD
        ============================================== */

        const strongPassword =
            password.length >= 8 &&
            /[A-Z]/.test(password) &&
            /[a-z]/.test(password) &&
            /\d/.test(password) &&
            /[^A-Za-z0-9]/.test(password);


        if (!strongPassword) {

            showRegisterMessage(
                "Password must contain 8+ characters, uppercase, lowercase, number and special character.",
                "error"
            );

            return;
        }


        /* ==============================================
           CONFIRM PASSWORD
        ============================================== */

        if (password !== confirmPassword) {

            showRegisterMessage(
                "Passwords do not match.",
                "error"
            );

            return;
        }


        /* ==============================================
           TERMS
        ============================================== */

        if (!terms) {

            showRegisterMessage(
                "Please accept the Terms & Conditions.",
                "error"
            );

            return;
        }


        /* ==============================================
           LOADING
        ============================================== */

        registerBtn.disabled = true;

        registerBtn.querySelector("span").textContent =
            "Creating Account...";


        try {

            const response =
                await fetch(
                    `${API_URL}/api/auth/register`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                full_name:
                                    fullName,

                                username:
                                    username,

                                email:
                                    email,

                                mobile:
                                    mobile || null,

                                password:
                                    password,

                                confirm_password:
                                    confirmPassword,

                                role:
                                    role

                            })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                let errorMessage =
                    "Registration failed.";


                if (data.detail) {

                    if (
                        Array.isArray(
                            data.detail
                        )
                    ) {

                        errorMessage =
                            data.detail
                                .map(
                                    error =>
                                        error.msg
                                )
                                .join(" ");

                    } else {

                        errorMessage =
                            data.detail;

                    }

                }


                throw new Error(
                    errorMessage
                );
            }


            showRegisterMessage(
                "Account created successfully! Redirecting to login...",
                "success"
            );


            registerForm.reset();

            updatePasswordRules();


            setTimeout(
                () => {

                    window.location.href =
                        "login.html";

                },
                1500
            );


        } catch (error) {

            console.error(error);


            showRegisterMessage(
                error.message ||
                "Unable to connect to the server.",
                "error"
            );

        } finally {

            registerBtn.disabled = false;

            registerBtn.querySelector("span").textContent =
                "Create Account";

        }

    }
);