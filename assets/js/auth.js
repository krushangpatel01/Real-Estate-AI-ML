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


//------------------------------------------------------------------------------------------------------------------------------------------//


/* =========================================================
   ESTATEAI
   LOGIN AUTHENTICATION
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       API
    ===================================================== */

    const API_URL = "http://127.0.0.1:8000";


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const loginForm =
        document.getElementById("loginForm");

    const loginMessage =
        document.getElementById("loginMessage");

    const loginBtn =
        document.getElementById("loginBtn");

    const loginBtnText =
        document.getElementById("loginBtnText");

    const emailInput =
        document.getElementById("email");

    const passwordInput =
        document.getElementById("password");

    const togglePassword =
        document.getElementById("togglePassword");

    const rememberMe =
        document.getElementById("rememberMe");


    /* =====================================================
       CHECK FORM
    ===================================================== */

    if (!loginForm) {

        console.error(
            "EstateAI: loginForm not found."
        );

        return;
    }


    /* =====================================================
       SHOW MESSAGE
    ===================================================== */

    function showLoginMessage(
        message,
        type
    ) {

        if (!loginMessage) {
            alert(message);
            return;
        }

        loginMessage.textContent =
            message;

        loginMessage.className =
            "login-message " + type;

    }


    /* =====================================================
       SHOW / HIDE PASSWORD
    ===================================================== */

    if (
        togglePassword &&
        passwordInput
    ) {

        togglePassword.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                if (
                    passwordInput.type ===
                    "password"
                ) {

                    passwordInput.type =
                        "text";

                    togglePassword.textContent =
                        "Hide";

                    togglePassword.setAttribute(
                        "aria-label",
                        "Hide password"
                    );

                } else {

                    passwordInput.type =
                        "password";

                    togglePassword.textContent =
                        "Show";

                    togglePassword.setAttribute(
                        "aria-label",
                        "Show password"
                    );

                }

            }
        );

    }


    /* =====================================================
       LOGIN SUBMIT
    ===================================================== */

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            console.log(
                "EstateAI: Login form submitted."
            );


            /* =============================================
               GET VALUES
            ============================================= */

            const email =
                emailInput
                    ? emailInput.value.trim()
                    : "";

            const password =
                passwordInput
                    ? passwordInput.value
                    : "";

            const remember =
                rememberMe
                    ? rememberMe.checked
                    : false;


            /* =============================================
               VALIDATION
            ============================================= */

            if (!email) {

                showLoginMessage(
                    "Please enter your email address.",
                    "error"
                );

                if (emailInput) {
                    emailInput.focus();
                }

                return;
            }


            if (!password) {

                showLoginMessage(
                    "Please enter your password.",
                    "error"
                );

                if (passwordInput) {
                    passwordInput.focus();
                }

                return;
            }


            /* =============================================
               BUTTON LOADING
            ============================================= */

            if (loginBtn) {

                loginBtn.disabled =
                    true;

                loginBtn.style.opacity =
                    "0.65";

                loginBtn.style.cursor =
                    "wait";

            }

            if (loginBtnText) {

                loginBtnText.textContent =
                    "Signing In...";

            }


            /* =============================================
               CLEAR OLD MESSAGE
            ============================================= */

            if (loginMessage) {

                loginMessage.textContent =
                    "";

                loginMessage.className =
                    "login-message";

            }


            try {

                console.log(
                    "EstateAI: Sending login request..."
                );


                /* =========================================
                   LOGIN REQUEST
                ========================================= */

                const response =
                    await fetch(
                        `${API_URL}/api/auth/login`,
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Accept":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    email:
                                        email,

                                    password:
                                        password

                                })

                        }
                    );


                console.log(
                    "EstateAI: Server status:",
                    response.status
                );


                /* =========================================
                   READ RESPONSE
                ========================================= */

                let data = {};

                const responseText =
                    await response.text();


                if (responseText) {

                    try {

                        data =
                            JSON.parse(
                                responseText
                            );

                    } catch (error) {

                        console.error(
                            "Invalid JSON response:",
                            responseText
                        );

                    }

                }


                /* =========================================
                   SERVER ERROR
                ========================================= */

                if (!response.ok) {

                    let errorMessage =
                        "Invalid email or password.";


                    if (data.detail) {

                        if (
                            typeof data.detail ===
                            "string"
                        ) {

                            errorMessage =
                                data.detail;

                        } else if (
                            Array.isArray(
                                data.detail
                            )
                        ) {

                            errorMessage =
                                data.detail
                                    .map(
                                        function (item) {

                                            return (
                                                item.msg ||
                                                "Invalid input."
                                            );

                                        }
                                    )
                                    .join(" ");

                        }

                    }


                    throw new Error(
                        errorMessage
                    );

                }


                /* =========================================
                   TOKEN
                ========================================= */

                const token =
                    data.access_token ||
                    data.token;


                if (!token) {

                    console.warn(
                        "Login successful but no token was returned.",
                        data
                    );

                } else {

                    localStorage.setItem(
                        "estateai_token",
                        token
                    );

                }


                /* =========================================
                   USER
                ========================================= */

                if (data.user) {

                    localStorage.setItem(
                        "estateai_user",
                        JSON.stringify(
                            data.user
                        )
                    );

                }


                /* =========================================
                   REMEMBER ME
                ========================================= */

                if (remember) {

                    localStorage.setItem(
                        "estateai_remember",
                        "true"
                    );

                } else {

                    localStorage.removeItem(
                        "estateai_remember"
                    );

                    sessionStorage.setItem(
                        "estateai_session",
                        "true"
                    );

                }


                /* =========================================
                   SUCCESS
                ========================================= */

                showLoginMessage(
                    "Login successful! Redirecting...",
                    "success"
                );


                console.log(
                    "EstateAI: Login successful."
                );


                /* =========================================
                   REDIRECT
                ========================================= */

                setTimeout(
                    function () {

                        window.location.href =
                            "properties.html";

                    },
                    800
                );


            } catch (error) {

                console.error(
                    "EstateAI Login Error:",
                    error
                );


                /* =========================================
                   CONNECTION ERROR
                ========================================= */

                let message =
                    error.message;


                if (
                    error instanceof
                    TypeError
                ) {

                    message =
                        "Cannot connect to EstateAI server. Make sure FastAPI is running on port 8000.";

                }


                showLoginMessage(
                    message ||
                    "Login failed. Please try again.",
                    "error"
                );


            } finally {

                /* =========================================
                   RESET BUTTON
                ========================================= */

                if (loginBtn) {

                    loginBtn.disabled =
                        false;

                    loginBtn.style.opacity =
                        "";

                    loginBtn.style.cursor =
                        "";

                }

                if (loginBtnText) {

                    loginBtnText.textContent =
                        "Sign In";

                }

            }

        }
    );


    /* =====================================================
       ENTER KEY
    ===================================================== */

    if (emailInput) {

        emailInput.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    if (passwordInput) {
                        passwordInput.focus();
                    }

                }

            }
        );

    }


    console.log(
        "EstateAI: auth.js loaded successfully."
    );

});
//------------------------------------------------------------------------------------------------------------------------------------------//



/* ============================================================
   ESTATEAI FORGOT PASSWORD
============================================================ */

const forgotForm =
    document.getElementById("forgotForm");


if (forgotForm) {

    const forgotEmail =
        document.getElementById("forgotEmail");

    const forgotBtn =
        document.getElementById("forgotBtn");

    const forgotMessage =
        document.getElementById("forgotMessage");


    function showForgotMessage(
        message,
        type
    ) {

        forgotMessage.textContent =
            message;

        forgotMessage.className =
            `forgot-message ${type}`;

    }


    forgotForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const email =
                forgotEmail.value.trim();


            /* ================================================
               VALIDATION
            ================================================ */

            if (!email) {

                showForgotMessage(
                    "Please enter your email address.",
                    "error"
                );

                forgotEmail.focus();

                return;

            }


            const emailPattern =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


            if (!emailPattern.test(email)) {

                showForgotMessage(
                    "Please enter a valid email address.",
                    "error"
                );

                forgotEmail.focus();

                return;

            }


            /* ================================================
               LOADING
            ================================================ */

            forgotBtn.disabled = true;

            forgotBtn
                .querySelector("span")
                .textContent =
                "Sending...";


            try {

                /*
                 * This endpoint must match the
                 * forgot-password route in FastAPI.
                 */

                const response =
                    await fetch(
                        `${API_URL}/api/auth/forgot-password`,
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({
                                    email: email
                                })

                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    let message =
                        "Unable to process your request.";


                    if (data.detail) {

                        message =
                            typeof data.detail ===
                            "string"

                                ? data.detail

                                : "Unable to process your request.";

                    }


                    throw new Error(message);

                }


                /* ============================================
                   SUCCESS
                ============================================ */

                showForgotMessage(
                    data.message ||
                    "If an account exists with this email, a password reset link has been sent.",
                    "success"
                );


                forgotForm.reset();


            } catch (error) {

                console.error(
                    "Forgot Password Error:",
                    error
                );


                showForgotMessage(
                    error.message ||
                    "Unable to connect to the server.",
                    "error"
                );

            } finally {

                forgotBtn.disabled = false;

                forgotBtn
                    .querySelector("span")
                    .textContent =
                    "Send Reset Link";

            }

        }
    );

}