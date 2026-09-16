/* ============================================================
   ESTATEAI
   SELLER DASHBOARD
============================================================ */


/* ============================================================
   AUTH CHECK
============================================================ */

const estateToken =
    localStorage.getItem("estateai_token");


/*
 * For development we don't immediately redirect.
 *
 * Once login is fully connected, this can be changed to:
 *
 * if (!estateToken) {
 *     window.location.href = "../../frontend/login.html";
 * }
 */


/* ============================================================
   LOAD USER
============================================================ */

const savedUser =
    localStorage.getItem("estateai_user");


if (savedUser) {

    try {

        const user =
            JSON.parse(savedUser);


        const sellerName =
            user.full_name ||
            user.username ||
            "Seller";


        const sellerNameElement =
            document.getElementById(
                "sellerName"
            );


        const welcomeNameElement =
            document.getElementById(
                "welcomeSellerName"
            );


        if (sellerNameElement) {

            sellerNameElement.textContent =
                sellerName;

        }


        if (welcomeNameElement) {

            welcomeNameElement.textContent =
                sellerName;

        }

    } catch (error) {

        console.error(
            "Unable to read saved user:",
            error
        );

    }

}


/* ============================================================
   MOBILE SIDEBAR
============================================================ */

const menuButton =
    document.getElementById(
        "sellerMenuButton"
    );


const sidebar =
    document.getElementById(
        "sellerSidebar"
    );


const sidebarOverlay =
    document.getElementById(
        "sellerSidebarOverlay"
    );


function openSidebar() {

    if (!sidebar) return;

    sidebar.classList.add("open");

    sidebarOverlay?.classList.add(
        "active"
    );

}


function closeSidebar() {

    if (!sidebar) return;

    sidebar.classList.remove("open");

    sidebarOverlay?.classList.remove(
        "active"
    );

}


menuButton?.addEventListener(
    "click",
    openSidebar
);


sidebarOverlay?.addEventListener(
    "click",
    closeSidebar
);


/* ============================================================
   CLOSE SIDEBAR AFTER NAVIGATION
============================================================ */

document
    .querySelectorAll(".seller-nav-item")
    .forEach(function (item) {

        item.addEventListener(
            "click",
            closeSidebar
        );

    });


/* ============================================================
   LOGOUT
============================================================ */

const logoutButton =
    document.getElementById(
        "sellerLogout"
    );


logoutButton?.addEventListener(
    "click",
    function () {

        localStorage.removeItem(
            "estateai_token"
        );

        localStorage.removeItem(
            "estateai_user"
        );

        sessionStorage.clear();


        window.location.href =
            "../../frontend/login.html";

    }
);


/* ============================================================
   DASHBOARD STATISTICS
============================================================ */

function loadSellerStatistics() {

    /*
     * For now these values are placeholders.
     *
     * After the Property API is connected,
     * these will be loaded from:
     *
     * GET /api/properties/my
     */


    const total =
        document.getElementById(
            "totalProperties"
        );


    const active =
        document.getElementById(
            "activeProperties"
        );


    const sold =
        document.getElementById(
            "soldProperties"
        );


    const views =
        document.getElementById(
            "propertyViews"
        );


    if (total) total.textContent = "0";

    if (active) active.textContent = "0";

    if (sold) sold.textContent = "0";

    if (views) views.textContent = "0";

}


loadSellerStatistics();