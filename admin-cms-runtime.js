(async function () {
'use strict';

/* =========================================================
   ADMIN CMS RUNTIME
========================================================= */

if (typeof client === 'undefined' || !client) {
  console.warn('Admin CMS Runtime: Supabase client not available.');
  return;
}

const page = location.pathname.split('/').pop() || 'admin.html';

const esc = s =>
  String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));

let overrideCache = [];
let menuCache = [];

let observer = null;
let applyTimer = null;
let isApplying = false;
let lastLiveSync = 0;


/* =========================================================
   PROFESSIONAL SVG ICONS
========================================================= */

const ADMIN_CMS_SVG_ICONS = {

  dashboard: `
    <svg viewBox="0 0 24 24" width="18" height="18"
      fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>`,

  analytics: `
    <svg viewBox="0 0 24 24" width="18" height="18"
      fill="none" stroke="currentColor" stroke-width="2">
      <path d="M4 19V9"/>
      <path d="M10 19V5"/>
      <path d="M16 19v-7"/>
      <path d="M22 19V3"/>
    </svg>`,

  charts: `
    <svg viewBox="0 0 24 24" width="18" height="18"
      fill="none" stroke="currentColor" stroke-width="2">
      <path d="M3 3v18h18"/>
      <path d="M7 16l4-5 3 3 5-7"/>
    </svg>`,

  users: `
    <svg viewBox="0 0 24 24" width="18" height="18"
      fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="9" cy="8" r="4"/>
      <path d="M2 21c0-4 3-7 7-7s7 3 7 7"/>
      <path d="M16 4c3 0 5 2 5 5"/>
      <path d="M17 14c3 1 5 3 5 7"/>
    </svg>`,

  membership: `
    <svg viewBox="0 0 24 24" width="18" height="18"
      fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="5" width="18" height="14" rx="2"/>
      <path d="M3 10h18"/>
      <path d="M7 15h4"/>
    </svg>`,

  interests: `
    <svg viewBox="0 0 24 24" width="18" height="18"
      fill="none" stroke="currentColor" stroke-width="2">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>
    </svg>`,

  messages: `
    <svg viewBox="0 0 24 24" width="18" height="18"
      fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>
    </svg>`,

  notifications: `
    <svg viewBox="0 0 24 24" width="18" height="18"
      fill="none" stroke="currentColor" stroke-width="2">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/>
      <path d="M10 21h4"/>
    </svg>`,

  reports: `
    <svg viewBox="0 0 24 24" width="18" height="18"
      fill="none" stroke="currentColor" stroke-width="2">
      <path d="M4 4h16v16H4z"/>
      <path d="M8 9h8"/>
      <path d="M8 13h8"/>
      <path d="M8 17h5"/>
    </svg>`,

  verification: `
    <svg viewBox="0 0 24 24" width="18" height="18"
      fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 3l7 4v5c0 5-3 8-7 9-4-1-7-4-7-9V7z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>`,

  support: `
    <svg viewBox="0 0 24 24" width="18" height="18"
      fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="9"/>
      <path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .7-1.5 1.2-1.5 2"/>
      <path d="M12 17h.01"/>
    </svg>`,

  settings: `
    <svg viewBox="0 0 24 24" width="18" height="18"
      fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14v-4a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6V3h4a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9A1.7 1.7 0 0 0 21 10v4a1.7 1.7 0 0 0-1.6 1z"/>
    </svg>`,

  website: `
    <svg viewBox="0 0 24 24" width="18" height="18"
      fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="9"/>
      <path d="M3 12h18"/>
      <path d="M12 3c3 3 4 6 4 9s-1 6-4 9"/>
      <path d="M12 3c-3 3-4 6-4 9s1 6 4 9"/>
    </svg>`,

  cms: `
    <svg viewBox="0 0 24 24" width="18" height="18"
      fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M8 8h8"/>
      <path d="M8 12h8"/>
      <path d="M8 16h5"/>
    </svg>`,

  logout: `
    <svg viewBox="0 0 24 24" width="18" height="18"
      fill="none" stroke="currentColor" stroke-width="2">
      <path d="M10 17l5-5-5-5"/>
      <path d="M15 12H3"/>
      <path d="M13 3h7v18h-7"/>
    </svg>`
};


/* =========================================================
   A-Z UNIVERSAL ADMIN CMS ICON SYSTEM
   Any text entered in Icon field will render as an icon.
========================================================= */

function createUniversalLetterIcon(text) {
  const clean = String(text || '?').trim();

  const letter =
    (clean.charAt(0) || '?')
      .toUpperCase()
      .replace(/[^A-Z0-9]/, '•');

  return `
    <svg
      viewBox="0 0 24 24"
      width="19"
      height="19"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      />

      <text
        x="12"
        y="16"
        text-anchor="middle"
        font-size="11"
        font-family="Arial, sans-serif"
        font-weight="700"
        fill="currentColor"
      >
        ${letter}
      </text>
    </svg>
  `;
}


/* Common keyword aliases */
const ADMIN_CMS_ICON_ALIASES = {

  home: 'dashboard',
  dashboard: 'dashboard',

  user: 'users',
  users: 'users',
  profile: 'users',
  profiles: 'users',
  member: 'users',

  analytics: 'analytics',
  analysis: 'analytics',

  chart: 'charts',
  charts: 'charts',
  graph: 'charts',

  membership: 'membership',
  memberships: 'membership',
  payment: 'membership',
  payments: 'membership',

  interest: 'interests',
  interests: 'interests',
  heart: 'interests',

  chat: 'messages',
  message: 'messages',
  messages: 'messages',

  notification: 'notifications',
  notifications: 'notifications',
  bell: 'notifications',

  report: 'reports',
  reports: 'reports',

  verification: 'verification',
  verify: 'verification',
  aadhaar: 'verification',
  adhaar: 'verification',
  face: 'verification',

  contact: 'support',
  support: 'support',
  help: 'support',

  setting: 'settings',
  settings: 'settings',

  website: 'website',
  web: 'website',

  cms: 'cms',
  editor: 'cms',

  logout: 'logout',
  signout: 'logout'
};


function renderAdminCmsProfessionalIcons() {

  document
    .querySelectorAll('.admin-cms-menu-icon')
    .forEach(iconBox => {

      const raw =
        (
          iconBox.dataset.iconName ||
          iconBox.textContent ||
          ''
        ).trim();

      if (!raw) {
        return;
      }


      /*
        Emoji entered directly:
        keep emoji as-is.
      */

      if (
        /[^\x00-\x7F]/.test(raw) &&
        raw.length <= 6
      ) {

        iconBox.textContent = raw;

        iconBox.style.display = 'inline-flex';
        iconBox.style.alignItems = 'center';
        iconBox.style.justifyContent = 'center';
        iconBox.style.width = '22px';
        iconBox.style.flexShrink = '0';

        return;
      }


      const normalized =
        raw
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9_-]/g, '');


      const alias =
        ADMIN_CMS_ICON_ALIASES[
          normalized
        ] || normalized;


      /*
        Existing professional SVG available
      */

      if (
        ADMIN_CMS_SVG_ICONS[
          alias
        ]
      ) {

        iconBox.innerHTML =
          ADMIN_CMS_SVG_ICONS[
            alias
          ];

      }

      /*
        Unknown text:
        automatically create icon
      */

      else {

        iconBox.innerHTML =
          createUniversalLetterIcon(
            raw
          );

      }


      iconBox.dataset.iconName =
        raw;

      iconBox.style.display =
        'inline-flex';

      iconBox.style.alignItems =
        'center';

      iconBox.style.justifyContent =
        'center';

      iconBox.style.width =
        '22px';

      iconBox.style.flexShrink =
        '0';

    });
}


/* =========================================================
   APPLY SINGLE OVERRIDE
========================================================= */

function applyOne(el, property, value, rowId) {

  if (!el) return;

  const v = value ?? '';

  if (property === 'text') {

    if (el.textContent !== String(v)) {
      el.textContent = String(v);
    }

  }

  else if (property === 'html') {

    if (el.innerHTML !== String(v)) {
      el.innerHTML = String(v);
    }

  }

  else if (property === 'hidden') {

    const next =
      String(v) === 'true'
        ? 'none'
        : '';

    if (el.style.display !== next) {
      el.style.display = next;
    }

  }

  else if (property === 'remove') {

    el.dataset.adminCmsDeleted = 'true';
    el.style.display = 'none';

  }

  else if (property === 'before_html') {

    const marker =
      `admin-cms-before-${rowId}`;

    if (
      !document.querySelector(
        `[data-admin-cms-marker="${marker}"]`
      )
    ) {

      const box =
        document.createElement('div');

      box.dataset.adminCmsMarker =
        marker;

      box.innerHTML =
        String(v);

      el.parentNode?.insertBefore(
        box,
        el
      );
    }

  }

  else if (property === 'after_html') {

    const marker =
      `admin-cms-after-${rowId}`;

    if (
      !document.querySelector(
        `[data-admin-cms-marker="${marker}"]`
      )
    ) {

      const box =
        document.createElement('div');

      box.dataset.adminCmsMarker =
        marker;

      box.innerHTML =
        String(v);

      el.parentNode?.insertBefore(
        box,
        el.nextSibling
      );
    }

  }

  else if (property === 'append_html') {

    const marker =
      `admin-cms-append-${rowId}`;

    if (
      !el.querySelector(
        `[data-admin-cms-marker="${marker}"]`
      )
    ) {

      const box =
        document.createElement('div');

      box.dataset.adminCmsMarker =
        marker;

      box.innerHTML =
        String(v);

      el.appendChild(box);
    }

  }

  else if (property === 'move_after') {

    const target =
      document.querySelector(
        String(v)
      );

    if (
      target &&
      target !== el &&
      target.nextElementSibling !== el
    ) {

      target.insertAdjacentElement(
        'afterend',
        el
      );
    }

  }

  else if (
    property.startsWith('style.')
  ) {

    const cssProperty =
      property.slice(6);

    if (
      el.style[cssProperty] !==
      String(v)
    ) {

      el.style[cssProperty] =
        String(v);
    }

  }

  else if (
    property.startsWith('attr.')
  ) {

    const attr =
      property.slice(5);

    if (
      v === '' ||
      v === null
    ) {

      if (el.hasAttribute(attr)) {
        el.removeAttribute(attr);
      }

    }

    else if (
      el.getAttribute(attr) !==
      String(v)
    ) {

      el.setAttribute(
        attr,
        String(v)
      );
    }
  }
}


/* =========================================================
   APPLY OVERRIDE ROW
========================================================= */

function applyOverride(row) {

  try {

    if (
      !row?.selector ||
      !row?.property
    ) {
      return;
    }

    document
      .querySelectorAll(
        row.selector
      )
      .forEach(el => {

        applyOne(
          el,
          row.property,
          row.value,
          row.id
        );

      });

  }

  catch (error) {

    console.warn(
      'Admin CMS selector skipped:',
      row.selector,
      error
    );

  }
}


/* =========================================================
   ADMIN MENU HTML
========================================================= */

function getMenuHtml() {

  return menuCache

    .filter(item =>
      item.is_visible !== false
    )

    .map(item => {

      const icon =
        String(item.icon || '').trim();

      return `
        <a
          href="${esc(item.url || '#')}"
          data-admin-cms-menu-id="${esc(item.id)}"
        >

          <span
            class="admin-cms-menu-icon"
            data-icon-name="${esc(icon.toLowerCase())}"
          >
            ${esc(icon)}
          </span>

          <span class="admin-cms-menu-label">
            ${esc(item.label || '')}
          </span>

        </a>
      `;

    })

    .join('');
}


/* =========================================================
   APPLY ADMIN MENU
========================================================= */

function applyMenu() {

  const nav =
    document.querySelector(
      '.admin-v3-sidebar-nav'
    );

  if (
    !nav ||
    !menuCache.length
  ) {
    return;
  }

  /*
    Always rebuild from CMS cache.
    This prevents layout.js from
    restoring the old menu.
  */

  nav.innerHTML =
    getMenuHtml();


  const here =
    (
      location.pathname
        .split('/')
        .pop() ||
      'admin.html'
    ) +
    (location.hash || '');


  nav
    .querySelectorAll('a')
    .forEach(a => {

      const href =
        a.getAttribute('href') ||
        '';

      a.classList.remove('active');

      if (
        href === here ||
        (
          href.split('#')[0] === page &&
          location.hash &&
          href.endsWith(
            location.hash
          )
        )
      ) {

        a.classList.add('active');

      }

    });


  renderAdminCmsProfessionalIcons();
}


/* =========================================================
   APPLY ALL
========================================================= */

function applyAll() {

  if (isApplying) return;

  isApplying = true;

  try {

    applyMenu();

    overrideCache.forEach(
      applyOverride
    );

    renderAdminCmsProfessionalIcons();

  }

  catch (error) {

    console.warn(
      'Admin CMS apply error:',
      error
    );

  }

  finally {

    setTimeout(() => {
      isApplying = false;
    }, 50);

  }
}


/* =========================================================
   SCHEDULE APPLY
========================================================= */

function scheduleApply(delay = 80) {

  clearTimeout(applyTimer);

  applyTimer =
    setTimeout(
      applyAll,
      delay
    );
}


/* =========================================================
   LOAD DATABASE DATA
========================================================= */

async function loadRuntimeData() {

  try {

    const [
      overrideResult,
      menuResult
    ] = await Promise.all([

      client
        .from('admin_cms_overrides')
        .select('*')
        .eq('page_slug', page)
        .eq('status', 'published')
        .is('deleted_at', null)
        .order(
          'sort_order',
          { ascending: true }
        ),

      client
        .from('admin_cms_menu')
        .select('*')
        .is('deleted_at', null)
        .order(
          'sort_order',
          { ascending: true }
        )

    ]);


    if (overrideResult.error) {

      console.warn(
        'Admin CMS overrides:',
        overrideResult.error
      );

    }

    else {

      overrideCache =
        overrideResult.data || [];

    }


    if (menuResult.error) {

      console.warn(
        'Admin CMS menu:',
        menuResult.error
      );

    }

    else {

      menuCache =
        menuResult.data || [];

    }

  }

  catch (error) {

    console.warn(
      'Admin CMS data load:',
      error
    );

  }
}


/* =========================================================
   EXISTING ADMIN THEME
========================================================= */

async function applyAdminTheme() {

  try {

    const {
      data,
      error
    } = await client

      .from('admin_cms_themes')

      .select('*')

      .eq(
        'is_active',
        true
      )

      .is(
        'deleted_at',
        null
      )

      .order(
        'updated_at',
        {
          ascending: false
        }
      )

      .limit(1);


    if (
      error ||
      !data?.length
    ) {
      return;
    }


    const x =
      data[0]?.settings;

    if (!x) return;


    let style =
      document.getElementById(
        'adminCmsThemeRuntime'
      );


    if (!style) {

      style =
        document.createElement(
          'style'
        );

      style.id =
        'adminCmsThemeRuntime';

      document.head.appendChild(
        style
      );

    }


    style.textContent = `

      body.admin-body {
        background:
          ${x.background} !important;

        color:
          ${x.text} !important;
      }

      .admin-v3-sidebar,
      .admin-v3-topbar {
        --admin-primary:
          ${x.primary};

        --admin-secondary:
          ${x.secondary};
      }

      .admin-stat-card,
      .admin-analytics-card,
      .admin-chart-card,
      .admin-panel {
        border-radius:
          ${x.radius} !important;
      }

      ${x.custom_css || ''}

    `;

  }

  catch (error) {

    console.warn(
      'Admin CMS theme runtime:',
      error
    );

  }
}


/* =========================================================
   MUTATION OBSERVER
========================================================= */

function startObserver() {

  if (observer) {
    observer.disconnect();
  }


  observer =
    new MutationObserver(
      mutations => {

        if (isApplying) {
          return;
        }


        const relevant =
          mutations.some(
            mutation =>

              mutation.type ===
                'childList' ||

              mutation.type ===
                'attributes' ||

              mutation.type ===
                'characterData'
          );


        if (relevant) {

          scheduleApply(120);

        }

      }
    );


  observer.observe(
    document.body,
    {

      childList: true,

      subtree: true,

      attributes: true,

      characterData: true,

      attributeFilter: [
        'class',
        'style',
        'hidden'
      ]

    }
  );
}


/* =========================================================
   FORCE LIVE SYNC
========================================================= */

async function forceAdminCmsLiveSync() {

  const now =
    Date.now();


  if (
    now - lastLiveSync <
    400
  ) {
    return;
  }


  lastLiveSync =
    now;


  try {

    await loadRuntimeData();

    scheduleApply(0);

  }

  catch (error) {

    console.warn(
      'Admin CMS live sync:',
      error
    );

  }
}


/* =========================================================
   SUPABASE REALTIME
========================================================= */

function startRealtime() {

  try {

    client

      .channel(
        'admin-cms-live-runtime'
      )

      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table:
            'admin_cms_menu'
        },
        () => {
          forceAdminCmsLiveSync();
        }
      )

      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table:
            'admin_cms_overrides'
        },
        () => {
          forceAdminCmsLiveSync();
        }
      )

      .subscribe();

  }

  catch (error) {

    console.warn(
      'Admin CMS realtime unavailable:',
      error
    );

  }
}


/* =========================================================
   INITIALIZE
========================================================= */

async function initAdminCmsRuntime() {

  try {

    await loadRuntimeData();

    await applyAdminTheme();


    /*
      Immediate apply
    */

    scheduleApply(0);


    /*
      layout.js / app.js may
      render later.
    */

    setTimeout(
      () => scheduleApply(0),
      250
    );

    setTimeout(
      () => scheduleApply(0),
      700
    );

    setTimeout(
      () => scheduleApply(0),
      1400
    );

    setTimeout(
      () => scheduleApply(0),
      2500
    );


    /*
      Watch dynamic dashboard
    */

    startObserver();


    /*
      Supabase realtime
    */

    startRealtime();


    /*
      Layout ready event
    */

    document.addEventListener(
      'divyangsathi:layout-ready',
      () => {

        scheduleApply(50);

      }
    );


    /*
      Hash navigation
    */

    window.addEventListener(
      'hashchange',
      () => {

        scheduleApply(50);

      }
    );


    /*
      Browser navigation
    */

    window.addEventListener(
      'popstate',
      () => {

        scheduleApply(50);

      }
    );


    /*
      Dashboard tab becomes
      visible again.
    */

    document.addEventListener(
      'visibilitychange',
      () => {

        if (
          document.visibilityState ===
          'visible'
        ) {

          forceAdminCmsLiveSync();

        }

      }
    );


    /*
      Window focus
    */

    window.addEventListener(
      'focus',
      () => {

        forceAdminCmsLiveSync();

      }
    );


    /*
      Another tab may save
      Admin CMS changes.
    */

    window.addEventListener(
      'storage',
      () => {

        forceAdminCmsLiveSync();

      }
    );


    /*
      Backup sync every
      2 seconds.
    */

    setInterval(
      forceAdminCmsLiveSync,
      2000
    );

  }

  catch (error) {

    console.warn(
      'Admin CMS runtime:',
      error
    );

  }
}


/* =========================================================
   START
========================================================= */

if (
  document.readyState ===
  'loading'
) {

  document.addEventListener(
    'DOMContentLoaded',
    initAdminCmsRuntime
  );

}

else {

  initAdminCmsRuntime();

}

})();