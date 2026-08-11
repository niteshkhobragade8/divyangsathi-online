// ======================================
// DIVYANGSATHI SMART COMMON LAYOUT
// FINAL FIXED VERSION
// ======================================

(function () {

  const ADMIN_PAGES = [
    "admin-cms.html",
    "admin.html",
    "admin-profiles.html",
    "admin-memberships.html",
    "admin-requests.html",
    "admin-moderation.html",
    "admin-support.html"
  ];

  const EXCLUDED_PAGES = [
    "index.html",
    "login.html",
    "register.html",
    "admin-login.html"
  ];


  function getCurrentPage() {

    return (
      window.location.pathname
        .split("/")
        .pop() ||
      "index.html"
    );

  }


  function isAdminPage(pageName) {

    return ADMIN_PAGES.includes(
      pageName
    );

  }


  function isExcludedPage(pageName) {

    return EXCLUDED_PAGES.includes(
      pageName
    );

  }


  async function fetchHtml(fileName) {

    const response =
      await fetch(fileName, {
        cache: "no-store"
      });

    if (!response.ok) {

      throw new Error(
        fileName +
        " load failed: " +
        response.status
      );

    }

    return response.text();

  }


  function findOldHeader(adminPage) {

    if (adminPage) {

      return document.querySelector(
        "header.admin-header"
      );

    }

    return document.querySelector(
      [
        "header.user-dashboard-header",
        "header.website-header",
        "header.main-header",
        "header.page-header",
        "body > header"
      ].join(",")
    );

  }


  function findOldFooter() {

    return document.querySelector(
      [
        "footer.common-footer",
        "footer.website-footer",
        "footer.main-footer",
        "footer.page-footer",
        "body > footer"
      ].join(",")
    );

  }


  function createOrGetHeaderContainer(
    adminPage
  ) {

    let container =
      document.getElementById(
        "commonHeader"
      );

    if (container) {

      const oldHeader =
        findOldHeader(adminPage);

      if (
        oldHeader &&
        !container.contains(oldHeader)
      ) {

        oldHeader.remove();

      }

      return container;

    }

    const oldHeader =
      findOldHeader(adminPage);

    container =
      document.createElement("div");

    container.id =
      "commonHeader";

    if (oldHeader) {

      oldHeader.replaceWith(
        container
      );

    } else {

      document.body.prepend(
        container
      );

    }

    return container;

  }


  function createOrGetFooterContainer() {

    let container =
      document.getElementById(
        "commonFooter"
      );

    if (container) {

      const oldFooter =
        findOldFooter();

      if (
        oldFooter &&
        oldFooter !== container &&
        !container.contains(oldFooter)
      ) {

        oldFooter.remove();

      }

      return container;

    }

    const oldFooter =
      findOldFooter();

    container =
      document.createElement("div");

    container.id =
      "commonFooter";

    if (oldFooter) {

      oldFooter.replaceWith(
        container
      );

    } else {

      document.body.appendChild(
        container
      );

    }

    return container;

  }


  function activateCurrentNavigation() {

    const currentPage =
      getCurrentPage();

    document
      .querySelectorAll(
        "#commonHeader a[href]"
      )
      .forEach(function (link) {

        const href =
          link
            .getAttribute("href")
            ?.split("#")[0];

        if (href === currentPage) {

          link.classList.add(
            "active"
          );

        } else {

          link.classList.remove(
            "active"
          );

        }

      });

  }


  function connectUserLogout() {

    const logoutButton =
      document.getElementById(
        "headerLogoutBtn"
      );

    if (!logoutButton) {
      return;
    }

    logoutButton.onclick =
      async function () {

        logoutButton.disabled = true;

        logoutButton.textContent =
          "Logging out...";

        try {

          const { error } =
            await client.auth.signOut({ scope: "local" });

          if (error) {
            throw error;
          }

          window.location.replace(
            "login.html"
          );

        } catch (error) {

          console.error(
            "User logout error:",
            error
          );

          alert(
            "Logout nahi hua: " +
            error.message
          );

          logoutButton.disabled =
            false;

          logoutButton.textContent =
            "🚪 Logout";

        }

      };

  }


  function connectAdminLogout() {

    const logoutButton =
      document.getElementById(
        "adminLogoutBtn"
      );

    if (!logoutButton) {
      return;
    }

    logoutButton.onclick =
      async function () {

        const confirmed =
          confirm(
            "Kya aap Admin Panel se logout karna chahte hain?"
          );

        if (!confirmed) {
          return;
        }

        logoutButton.disabled = true;

        logoutButton.textContent =
          "Logging out...";

        try {

          const { error } =
            await client.auth.signOut({ scope: "local" });

          if (error) {
            throw error;
          }

          localStorage.removeItem(
            "adminLoggedIn"
          );

          localStorage.removeItem(
            "adminLogin"
          );

          sessionStorage.clear();

          window.location.replace(
  "admin-login.html"
);

        } catch (error) {

          console.error(
            "Admin logout error:",
            error
          );

          alert(
            "Logout nahi hua: " +
            error.message
          );

          logoutButton.disabled =
            false;

          logoutButton.textContent =
            "🔓 Admin Logout";

        }

      };

  }



  function connectAdminSidebarLogout() {

    const sidebarLogoutButton =
      document.getElementById(
        "adminSidebarLogoutBtn"
      );

    if (!sidebarLogoutButton) {
      return;
    }

    sidebarLogoutButton.onclick =
      async function () {

        const confirmed =
          confirm(
            "Kya aap Admin Panel se logout karna chahte hain?"
          );

        if (!confirmed) {
          return;
        }

        sidebarLogoutButton.disabled = true;
        sidebarLogoutButton.textContent =
          "Logging out...";

        try {

          const { error } =
            await client.auth.signOut({ scope: "local" });

          if (error) {
            throw error;
          }

          localStorage.removeItem(
            "adminLoggedIn"
          );

          localStorage.removeItem(
            "adminLogin"
          );

          sessionStorage.clear();

          window.location.replace(
            "admin-login.html"
          );

        } catch (error) {

          console.error(
            "Admin sidebar logout error:",
            error
          );

          alert(
            "Logout nahi hua: " +
            error.message
          );

          sidebarLogoutButton.disabled =
            false;

          sidebarLogoutButton.textContent =
            "🔓 Admin Logout";

        }

      };

  }


  function restoreSavedTheme(
    adminPage
  ) {

    if (adminPage) {

      const savedTheme =
        localStorage.getItem(
          "divyangsathi-admin-theme"
        );

      if (savedTheme === "dark") {

        document.body.classList.add(
          "admin-dark-mode"
        );

      }

      return;

    }

    const savedTheme =
      localStorage.getItem(
        "divyangsathi-theme"
      );

    if (savedTheme === "dark") {

      document.body.classList.add(
        "dark-mode"
      );

    }

  }


  function initializeLanguage() {

    if (
      typeof window
        .applyDivyangSathiLanguage ===
      "function"
    ) {

      const savedLanguage =
        localStorage.getItem(
          "divyangsathi-language"
        ) || "en";

      window
        .applyDivyangSathiLanguage(
          savedLanguage
        );

    }

  }


  async function loadCommonLayout() {

    const currentPage =
      getCurrentPage();

    if (
      isExcludedPage(currentPage)
    ) {
      return;
    }

    const adminPage =
      isAdminPage(currentPage);

    try {

      const headerContainer =
        createOrGetHeaderContainer(
          adminPage
        );

      const headerFile =
        adminPage
          ? "admin-header.html"
          : "header.html";

      const headerHtml =
        await fetchHtml(headerFile);

      headerContainer.innerHTML =
        headerHtml;

      // Admin pages already contain their own professional admin footer.
      // Never replace it with the public/user footer.
      if (!adminPage) {

        const footerContainer =
          createOrGetFooterContainer();

        const footerHtml =
          await fetchHtml("footer.html");

        footerContainer.innerHTML =
          footerHtml;

      }

      restoreSavedTheme(
        adminPage
      );

      activateCurrentNavigation();

      if (adminPage) {

        connectAdminLogout();
        connectAdminSidebarLogout();

      } else {

        connectUserLogout();

      }

      initializeLanguage();

      document.dispatchEvent(
        new CustomEvent(
          "divyangsathi:layout-ready",
          {
            detail: {
              adminPage,
              currentPage
            }
          }
        )
      );

      console.log(
        "Common layout loaded:",
        currentPage
      );

    } catch (error) {

      console.error(
        "Common layout error:",
        error
      );

    }

  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      loadCommonLayout
    );

  } else {

    loadCommonLayout();

  }

})();

// ==========================================
// GLOBAL FULL-PAGE LANGUAGE LOADER
// User + Admin
// ==========================================

(function () {

  function loadFullPageI18n() {

    if (
      document.querySelector(
        'script[src="full-page-i18n.js"]'
      )
    ) {
      return;
    }

    const script =
      document.createElement("script");

    script.src =
      "full-page-i18n.js";

    script.defer = true;

    script.onload = function () {

      const language =
        localStorage.getItem(
          "divyangsathi_language"
        ) ||
        localStorage.getItem(
          "adminLanguage"
        ) ||
        "en";

      if (
        typeof window
          .setDivyangSathiLanguage ===
        "function"
      ) {
        window
          .setDivyangSathiLanguage(
            language
          );
      }

    };

    document.body.appendChild(
      script
    );
  }

  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      loadFullPageI18n
    );

  } else {

    loadFullPageI18n();

  }

  document.addEventListener(
    "divyangsathi:layout-ready",
    loadFullPageI18n
  );

})();