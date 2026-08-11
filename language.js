// ======================================
// DIVYANGSATHI SMART LANGUAGE SWITCHER
// ======================================

(function () {

  const defaultLanguage = "en";

  const headerTranslations = {

    en: {
      "index.html": "🏠 Website Home",
      "profile.html": "👤 My Profile",
      "search.html": "🔍 Search Profiles",
      "matches.html": "🎯 Recommended",
      "received.html": "❤️ Interests",
      "favourites.html": "⭐ Favourites",
      "chat.html": "💬 Messages",
      "notifications.html": "🔔 Notifications",
      "membership.html": "💎 Membership",
      "success-stories.html": "💖 Success Stories",
      "contact.html": "📩 Contact"
    },

    hi: {
      "index.html": "🏠 वेबसाइट होम",
      "profile.html": "👤 मेरी प्रोफ़ाइल",
      "search.html": "🔍 प्रोफ़ाइल खोजें",
      "matches.html": "🎯 सुझाए गए रिश्ते",
      "received.html": "❤️ रुचियाँ",
      "favourites.html": "⭐ पसंदीदा",
      "chat.html": "💬 संदेश",
      "notifications.html": "🔔 सूचनाएँ",
      "membership.html": "💎 सदस्यता",
      "success-stories.html": "💖 सफलता की कहानियाँ",
      "contact.html": "📩 संपर्क"
    },

    mr: {
      "index.html": "🏠 वेबसाइट मुख्यपृष्ठ",
      "profile.html": "👤 माझे प्रोफाइल",
      "search.html": "🔍 प्रोफाइल शोधा",
      "matches.html": "🎯 सुचवलेले जोडीदार",
      "received.html": "❤️ आवडी",
      "favourites.html": "⭐ आवडते",
      "chat.html": "💬 संदेश",
      "notifications.html": "🔔 सूचना",
      "membership.html": "💎 सदस्यत्व",
      "success-stories.html": "💖 यशोगाथा",
      "contact.html": "📩 संपर्क"
    }

  };


  function getSavedLanguage() {

    const savedLanguage =
      localStorage.getItem(
        "divyangsathi-language"
      );

    if (
      savedLanguage &&
      LANGUAGES[savedLanguage]
    ) {
      return savedLanguage;
    }

    return defaultLanguage;

  }


  function translateCommonHeader(languageCode) {

    const translations =
      headerTranslations[languageCode];

    if (!translations) {
      return;
    }

    document
      .querySelectorAll(
        "#commonHeader a[href]"
      )
      .forEach(function (link) {

        const href =
          link
            .getAttribute("href")
            ?.split("#")[0];

        if (
          href &&
          translations[href]
        ) {

          const countElement =
            link.querySelector(
              "#notificationCount"
            );

          const savedCount =
            countElement
              ? countElement.textContent
              : null;

          link.textContent =
            translations[href];

          if (
            href ===
              "notifications.html" &&
            savedCount !== null
          ) {

            const count =
              document.createElement(
                "span"
              );

            count.id =
              "notificationCount";

            count.textContent =
              savedCount;

            link.appendChild(count);

          }

        }

      });


    const logoutButton =
      document.getElementById(
        "headerLogoutBtn"
      );

    if (logoutButton) {

      logoutButton.textContent =
        languageCode === "hi"
          ? "🚪 लॉग आउट"
          : languageCode === "mr"
          ? "🚪 लॉगआउट"
          : "🚪 Logout";

    }


    const adminLogoutButton =
      document.getElementById(
        "adminLogoutBtn"
      );

    if (adminLogoutButton) {

      adminLogoutButton.textContent =
        languageCode === "hi"
          ? "🔓 एडमिन लॉग आउट"
          : languageCode === "mr"
          ? "🔓 ॲडमिन लॉगआउट"
          : "🔓 Admin Logout";

    }

  }


  function applyLanguage(languageCode) {

    const translations =
      LANGUAGES[languageCode];

    if (!translations) {
      return;
    }

    document
      .querySelectorAll("[data-lang]")
      .forEach(function (element) {

        const translationKey =
          element.getAttribute(
            "data-lang"
          );

        if (
          translations[translationKey] !==
          undefined
        ) {

          element.textContent =
            translations[translationKey];

        }

      });


    document
      .querySelectorAll(
        "[data-lang-placeholder]"
      )
      .forEach(function (element) {

        const translationKey =
          element.getAttribute(
            "data-lang-placeholder"
          );

        if (
          translations[translationKey] !==
          undefined
        ) {

          element.placeholder =
            translations[translationKey];

        }

      });


    translateCommonHeader(
      languageCode
    );

    document.documentElement.lang =
      languageCode;

    localStorage.setItem(
      "divyangsathi-language",
      languageCode
    );


    document
      .querySelectorAll(
        ".language-selector"
      )
      .forEach(function (selector) {

        selector.value =
          languageCode;

      });

  }


  function connectLanguageSelectors() {

    document
      .querySelectorAll(
        ".language-selector"
      )
      .forEach(function (selector) {

        if (
          selector.dataset
            .languageConnected ===
          "true"
        ) {
          return;
        }

        selector.dataset
          .languageConnected =
          "true";

        selector.value =
          getSavedLanguage();

        selector.addEventListener(
          "change",
          function () {

            applyLanguage(
              this.value
            );

          }
        );

      });

  }


  function initializeLanguageSystem() {

    connectLanguageSelectors();

    applyLanguage(
      getSavedLanguage()
    );

  }


  document.addEventListener(
    "DOMContentLoaded",
    initializeLanguageSystem
  );


  document.addEventListener(
    "divyangsathi:layout-ready",
    initializeLanguageSystem
  );


  window.applyDivyangSathiLanguage =
    applyLanguage;

})();

// =====================================================
// DIVYANGSATHI USER FULL-PAGE LANGUAGE BRIDGE
// Admin pages are intentionally excluded.
// =====================================================
(function () {
  "use strict";

  function isAdminPage() {
    const file =
      location.pathname.split("/").pop() || "index.html";

    return file.startsWith("admin");
  }

  if (isAdminPage()) return;

  let loadingI18n = false;

  function getUserLanguage() {
    return (
      localStorage.getItem("divyangsathi-language") ||
      localStorage.getItem("divyangsathi_language") ||
      "en"
    );
  }

  function syncLanguageKeys(lang) {
    localStorage.setItem(
      "divyangsathi-language",
      lang
    );

    localStorage.setItem(
      "divyangsathi_language",
      lang
    );
  }

  function runFullPageTranslation(lang) {
    syncLanguageKeys(lang);

    document.documentElement.lang = lang;

    // full-page-i18n.js ka available public function
    if (
      typeof window.setDivyangSathiLanguage ===
      "function"
    ) {
      window.setDivyangSathiLanguage(lang);
      return true;
    }

    if (
      typeof window.applyFullPageLanguage ===
      "function"
    ) {
      window.applyFullPageLanguage(lang);
      return true;
    }

    if (
      typeof window.translateFullPage ===
      "function"
    ) {
      window.translateFullPage(lang);
      return true;
    }

    return false;
  }

  function loadFullPageI18n(lang) {
    if (runFullPageTranslation(lang)) return;

    if (loadingI18n) return;

    const existing =
      document.querySelector(
        'script[src$="full-page-i18n.js"]'
      );

    if (existing) {
      setTimeout(function () {
        runFullPageTranslation(lang);
      }, 100);

      setTimeout(function () {
        runFullPageTranslation(lang);
      }, 500);

      return;
    }

    loadingI18n = true;

    const script =
      document.createElement("script");

    script.src =
      "full-page-i18n.js?v=20260808-user";

    script.onload = function () {
      loadingI18n = false;

      runFullPageTranslation(lang);

      setTimeout(function () {
        runFullPageTranslation(lang);
      }, 200);
    };

    script.onerror = function () {
      loadingI18n = false;

      console.error(
        "full-page-i18n.js load nahi hua."
      );
    };

    document.body.appendChild(script);
  }

  function connectUserLanguageBridge() {
    document
      .querySelectorAll(".language-selector")
      .forEach(function (selector) {

        if (
          selector.dataset
            .fullPageLanguageConnected === "true"
        ) {
          return;
        }

        selector.dataset
          .fullPageLanguageConnected = "true";

        selector.addEventListener(
          "change",
          function () {

            const lang = this.value;

            syncLanguageKeys(lang);

            // Existing menu translator ko chalne do,
            // uske baad full page translate karo.
            setTimeout(function () {
              loadFullPageI18n(lang);
            }, 0);

            setTimeout(function () {
              runFullPageTranslation(lang);
            }, 300);
          }
        );
      });
  }

  function initUserFullLanguage() {
    if (isAdminPage()) return;

    const lang = getUserLanguage();

    syncLanguageKeys(lang);

    connectUserLanguageBridge();

    loadFullPageI18n(lang);
  }

  document.addEventListener(
    "DOMContentLoaded",
    initUserFullLanguage
  );

  document.addEventListener(
    "divyangsathi:layout-ready",
    function () {
      setTimeout(
        initUserFullLanguage,
        50
      );
    }
  );

  if (document.readyState !== "loading") {
    initUserFullLanguage();
  }

})();