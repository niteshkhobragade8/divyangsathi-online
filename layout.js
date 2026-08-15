// ======================================
// DIVYANGSATHI SMART COMMON LAYOUT
// FINAL FIXED VERSION
// ======================================

(function () {

  const ADMIN_PAGES = [
    "admin-cms.html",
    "admin-dashboard-cms.html",
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


  // ======================================
  // CURRENT PAGE
  // ======================================

  function getCurrentPage() {

    return (
      window.location.pathname
        .split("/")
        .pop() ||
      "index.html"
    );

  }


  // ======================================
  // PAGE TYPE CHECK
  // ======================================

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


  // ======================================
  // FETCH HTML
  // ======================================

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


  // ======================================
  // FIND OLD HEADER
  // ======================================

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


  // ======================================
  // FIND OLD FOOTER
  // ======================================

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


  // ======================================
  // HEADER CONTAINER
  // ======================================

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


  // ======================================
  // FOOTER CONTAINER
  // ======================================

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


  // ======================================
  // ADMIN WEBSITE LINK
  // OPEN WEBSITE IN NEW TAB
  // ======================================

  function configureAdminWebsiteLinks(
    adminPage
  ) {

    if (!adminPage) {
      return;
    }


    const header =
      document.getElementById(
        "commonHeader"
      );

    if (!header) {
      return;
    }


    header
      .querySelectorAll("a[href]")
      .forEach(function (link) {

        const rawHref =
          (
            link.getAttribute("href") ||
            ""
          ).trim();

        const linkText =
          (
            link.textContent ||
            ""
          )
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();


        let destinationPage =
          "";

        try {

          const parsedUrl =
            new URL(
              rawHref,
              window.location.href
            );

          destinationPage =
            parsedUrl.pathname
              .split("/")
              .pop() ||
            "index.html";

        } catch (error) {

          destinationPage =
            rawHref
              .split("#")[0]
              .split("?")[0]
              .split("/")
              .pop();

        }


        const isWebsiteLink =
          destinationPage ===
            "index.html" &&
          (
            linkText.includes(
              "website"
            ) ||
            linkText.includes(
              "website home"
            ) ||
            linkText.includes(
              "home"
            )
          );


        if (!isWebsiteLink) {
          return;
        }


        // Open public website
        // in a separate browser tab.
        link.setAttribute(
          "target",
          "_blank"
        );

        link.setAttribute(
          "rel",
          "noopener noreferrer"
        );

      });

  }


  // ======================================
  // ACTIVE NAVIGATION
  // ======================================

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
            ?.split("#")[0]
            ?.split("?")[0]
            ?.split("/")
            ?.pop();


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


  // ======================================
  // USER LOGOUT
  // ======================================

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

        logoutButton.disabled =
          true;

        logoutButton.textContent =
          "Logging out...";


        try {

          const { error } =
            await client.auth.signOut({
              scope: "local"
            });


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


  // ======================================
  // ADMIN TOP HEADER LOGOUT
  // ======================================

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


        logoutButton.disabled =
          true;

        logoutButton.textContent =
          "Logging out...";


        try {

          const { error } =
            await client.auth.signOut({
              scope: "local"
            });


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


  // ======================================
  // ADMIN SIDEBAR LOGOUT
  // ======================================

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


        sidebarLogoutButton.disabled =
          true;

        sidebarLogoutButton.textContent =
          "Logging out...";


        try {

          const { error } =
            await client.auth.signOut({
              scope: "local"
            });


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


  // ======================================
  // RESTORE SAVED THEME
  // ======================================

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


  // ======================================
  // INITIALIZE LANGUAGE
  // ======================================

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


  // ======================================
  // LOAD COMMON LAYOUT
  // ======================================

  async function loadCommonLayout() {

    const currentPage =
      getCurrentPage();


    if (
      isExcludedPage(
        currentPage
      )
    ) {
      return;
    }


    const adminPage =
      isAdminPage(
        currentPage
      );


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
        await fetchHtml(
          headerFile
        );


      headerContainer.innerHTML =
        headerHtml;


      // ======================================
      // IMPORTANT:
      // Admin header Website button
      // opens public website in new tab.
      // ======================================

      configureAdminWebsiteLinks(
        adminPage
      );


      // Admin pages already contain their
      // professional admin footer.
      // Never replace it with public footer.

      if (!adminPage) {

        const footerContainer =
          createOrGetFooterContainer();


        const footerHtml =
          await fetchHtml(
            "footer.html"
          );


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


  // ======================================
  // START COMMON LAYOUT
  // ======================================

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
// USER + ADMIN
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
      document.createElement(
        "script"
      );


    script.src =
      "full-page-i18n.js";


    script.defer =
      true;


    script.onload =
      function () {

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
    document.readyState ===
    "loading"
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
