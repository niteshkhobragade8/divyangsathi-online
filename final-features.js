function connectAdminHeaderControls() {
  if (!isAdmin() || page() === "admin-login.html") return;

  // =========================
  // ADMIN DARK MODE
  // =========================

  let darkButton =
    document.getElementById("adminDarkModeToggle");

  if (darkButton) {

    // Purane/duplicate click listeners hatao
    const cleanDarkButton =
      darkButton.cloneNode(true);

    darkButton.replaceWith(cleanDarkButton);
    darkButton = cleanDarkButton;

    function updateDarkButton() {
      const dark =
        document.body.classList.contains(
          "admin-dark-mode"
        );

      darkButton.innerHTML = dark
        ? "☀️ <span>Light</span>"
        : "🌙 <span>Dark</span>";
    }

    const savedTheme =
      localStorage.getItem(
        "divyangsathi-admin-theme"
      );

    if (savedTheme === "dark") {
      document.body.classList.add(
        "admin-dark-mode"
      );
    } else {
      document.body.classList.remove(
        "admin-dark-mode"
      );
    }

    updateDarkButton();

    darkButton.addEventListener(
      "click",
      function () {

        document.body.classList.toggle(
          "admin-dark-mode"
        );

        const dark =
          document.body.classList.contains(
            "admin-dark-mode"
          );

        localStorage.setItem(
          "divyangsathi-admin-theme",
          dark ? "dark" : "light"
        );

        updateDarkButton();
      }
    );
  }


  // =========================
  // ADMIN LANGUAGE SELECTOR
  // =========================

  const languageSelector =
    document.getElementById(
      "adminLanguageSelector"
    );

  if (languageSelector) {

    const savedLanguage =
      localStorage.getItem(
        "divyangsathi_language"
      ) || "en";

    languageSelector.value =
      savedLanguage;

    if (
      languageSelector.dataset
        .finalAdminLanguage !== "1"
    ) {
      languageSelector.dataset
        .finalAdminLanguage = "1";

      languageSelector.addEventListener(
        "change",
        function () {

          const language =
            languageSelector.value;

          localStorage.setItem(
            "divyangsathi_language",
            language
          );

          if (
            typeof window
              .setDivyangSathiLanguage ===
            "function"
          ) {
            window.setDivyangSathiLanguage(
              language
            );
          }
        }
      );
    }
  }
}

async function initAdminBellAllPages() {

  if (
    !isAdmin() ||
    page() === "admin-login.html"
  ) {
    return;
  }

  let bell =
    document.getElementById(
      "adminNotificationBtn"
    );

  if (!bell) return;

  // Purane notification listeners hatao
  if (
    bell.dataset.finalAdminBell !== "1"
  ) {
    const cleanBell =
      bell.cloneNode(true);

    bell.replaceWith(cleanBell);
    bell = cleanBell;

    bell.dataset.finalAdminBell = "1";
  }


  const count =
    bell.querySelector(
      "#adminNotificationCount"
    ) ||
    document.getElementById(
      "adminNotificationCount"
    );


  // Purane panels remove
  document
    .querySelectorAll(
      ".admin-notification-panel"
    )
    .forEach(function (panel) {
      panel.remove();
    });


  let panel =
    document.getElementById(
      "adminNotificationPanelFinal"
    );

  if (!panel) {

    panel =
      document.createElement("div");

    panel.id =
      "adminNotificationPanelFinal";

    panel.className =
      "admin-notification-panel final-admin-panel";

    panel.style.cssText = `
      display:none;
      position:fixed;
      top:75px;
      right:20px;
      width:min(380px,calc(100vw - 30px));
      max-height:70vh;
      overflow-y:auto;
      background:#ffffff;
      border:1px solid #e2e8f0;
      border-radius:16px;
      box-shadow:0 20px 50px rgba(15,23,42,.22);
      z-index:999999;
    `;

    document.body.appendChild(panel);
  }


  async function loadAdminBell() {

    panel.innerHTML = `
      <div class="admin-notification-item">
        Loading notifications...
      </div>
    `;

    try {

      const {
        data: { user },
        error: userError
      } =
        await client.auth.getUser();

      if (userError || !user) {

        if (count) {
          count.textContent = "0";
        }

        panel.innerHTML = `
          <div class="admin-notification-item">
            Admin login required.
          </div>
        `;

        return;
      }


      const {
        data: admin,
        error: adminError
      } =
        await client
          .from("admins")
          .select("id, active")
          .eq("id", user.id)
          .maybeSingle();


      if (
        adminError ||
        !admin ||
        admin.active !== true
      ) {

        if (count) {
          count.textContent = "0";
        }

        panel.innerHTML = `
          <div class="admin-notification-item">
            Admin access required.
          </div>
        `;

        return;
      }


      const {
        data,
        error
      } =
        await client
          .from("admin_notifications")
          .select(`
            id,
            type,
            title,
            message,
            reference_id,
            is_read,
            created_at
          `)
          .order(
            "created_at",
            {
              ascending: false
            }
          )
          .limit(60);


      if (error) {
        throw error;
      }


      const rows = data || [];

      const unread =
        rows.filter(function (item) {
          return item.is_read !== true;
        }).length;


      if (count) {
        count.textContent =
          String(unread);
      }


      panel.innerHTML = `
        <div
          style="
            padding:14px 16px;
            border-bottom:1px solid #e2e8f0;
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:10px;
          "
        >
          <strong>
            🔔 Admin Notifications
          </strong>

          <button
            type="button"
            id="finalMarkAllAdminRead"
            style="
              border:0;
              background:none;
              cursor:pointer;
              font-weight:700;
              color:#2563eb;
            "
          >
            Mark All Read
          </button>
        </div>

        <div id="finalAdminNotificationList">
        ${
          rows.length
            ? rows.map(function (item) {

                return `
                  <div
                    class="admin-notification-item"
                    data-final-admin-notification="${esc(item.id)}"
                    style="
                      padding:14px 16px;
                      border-bottom:1px solid #e2e8f0;
                      cursor:pointer;
                      ${
                        item.is_read !== true
                          ? "background:#eff6ff;"
                          : ""
                      }
                    "
                  >
                    <strong>
                      ${esc(
                        item.title ||
                        "Admin Notification"
                      )}
                    </strong>

                    <p style="margin:5px 0;">
                      ${esc(
                        item.message || ""
                      )}
                    </p>

                    <small>
                      ${
                        item.created_at
                          ? new Date(
                              item.created_at
                            ).toLocaleString(
                              "en-IN"
                            )
                          : ""
                      }
                    </small>
                  </div>
                `;

              }).join("")
            : `
                <div
                  class="admin-notification-item"
                  style="padding:18px;"
                >
                  No notifications.
                </div>
              `
        }
        </div>
      `;


      const markAll =
        document.getElementById(
          "finalMarkAllAdminRead"
        );

      if (markAll) {

        markAll.onclick =
          async function (event) {

            event.stopPropagation();

            const {
              error
            } =
              await client
                .from(
                  "admin_notifications"
                )
                .update({
                  is_read: true
                })
                .eq(
                  "is_read",
                  false
                );

            if (error) {
              console.error(
                "Mark all read:",
                error.message
              );
              return;
            }

            await loadAdminBell();
          };
      }


      panel
        .querySelectorAll(
          "[data-final-admin-notification]"
        )
        .forEach(function (item) {

          item.onclick =
            async function () {

              const id =
                item.getAttribute(
                  "data-final-admin-notification"
                );

              const {
                error
              } =
                await client
                  .from(
                    "admin_notifications"
                  )
                  .update({
                    is_read: true
                  })
                  .eq(
                    "id",
                    id
                  );

              if (!error) {
                await loadAdminBell();
              }
            };
        });


    } catch (error) {

      if (count) {
        count.textContent = "0";
      }

      panel.innerHTML = `
        <div
          class="admin-notification-item"
          style="padding:18px;"
        >
          ${esc(error.message)}
        </div>
      `;

      console.error(
        "Admin notification error:",
        error
      );
    }
  }


  bell.onclick =
    async function (event) {

      event.preventDefault();
      event.stopPropagation();

      const open =
        panel.style.display === "block";

      panel.style.display =
        open ? "none" : "block";

      if (!open) {
        await loadAdminBell();
      }
    };


  if (
    document.body.dataset
      .adminBellOutsideClick !== "1"
  ) {

    document.body.dataset
      .adminBellOutsideClick = "1";

    document.addEventListener(
      "click",
      function (event) {

        const currentPanel =
          document.getElementById(
            "adminNotificationPanelFinal"
          );

        const currentBell =
          document.getElementById(
            "adminNotificationBtn"
          );

        if (
          currentPanel &&
          currentBell &&
          !currentPanel.contains(
            event.target
          ) &&
          !currentBell.contains(
            event.target
          )
        ) {
          currentPanel.style.display =
            "none";
        }
      }
    );
  }


  await loadAdminBell();
}