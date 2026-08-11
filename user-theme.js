// =========================================================
// DIVYANGSATHI — UNIFIED USER THEME HELPERS
// Non-admin only. No Supabase/database logic is changed here.
// =========================================================
(function () {
  if (window.location.pathname.includes("admin")) return;

  function applySavedTheme() {
    const saved = localStorage.getItem("divyangsathi-theme");
    document.body.classList.toggle("dark-mode", saved === "dark");
  }

  function connectDarkMode() {
    const button = document.getElementById("darkModeToggle");
    if (!button || button.dataset.unifiedConnected === "true") return;
    button.dataset.unifiedConnected = "true";

    function updateText() {
      button.textContent = document.body.classList.contains("dark-mode")
        ? "☀️ Light Mode"
        : "🌙 Dark Mode";
    }

    updateText();
    button.addEventListener("click", function () {
      const active = document.body.classList.toggle("dark-mode");
      localStorage.setItem("divyangsathi-theme", active ? "dark" : "light");
      updateText();
    });
  }

  function connectMobileMenu() {
    const header = document.querySelector("#commonHeader .common-user-header");
    if (!header || header.dataset.mobileMenuReady === "true") return;
    header.dataset.mobileMenuReady = "true";

    const nav = header.querySelector(".user-dashboard-navigation");
    const brand = header.querySelector(".user-dashboard-brand");
    if (!nav || !brand) return;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "ds-mobile-menu-toggle";
    toggle.setAttribute("aria-label", "Open navigation");
    toggle.textContent = "☰";
    brand.insertAdjacentElement("afterend", toggle);

    toggle.addEventListener("click", function () {
      header.classList.toggle("ds-menu-open");
      toggle.textContent = header.classList.contains("ds-menu-open") ? "✕" : "☰";
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        header.classList.remove("ds-menu-open");
        toggle.textContent = "☰";
      });
    });
  }

  function initialize() {
    applySavedTheme();
    connectDarkMode();
    connectMobileMenu();
  }

  document.addEventListener("DOMContentLoaded", initialize);
  document.addEventListener("divyangsathi:layout-ready", initialize);
  if (document.readyState !== "loading") initialize();
})();

// Final shared UX polish: active navigation + back-to-top.
(function(){
  if (window.location.pathname.includes("admin")) return;
  function polish(){
    const page=(window.location.pathname.split('/').pop()||'index.html').toLowerCase();
    document.querySelectorAll('#commonHeader a[href], header a[href]').forEach(a=>{
      const href=(a.getAttribute('href')||'').split('?')[0].split('#')[0].toLowerCase();
      if(href===page) a.classList.add('active');
    });
    if(!document.getElementById('dsBackToTop')){
      const b=document.createElement('button'); b.id='dsBackToTop'; b.type='button'; b.textContent='↑'; b.setAttribute('aria-label','Back to top');
      Object.assign(b.style,{position:'fixed',right:'18px',bottom:'18px',width:'44px',height:'44px',border:'0',borderRadius:'50%',background:'#2563eb',color:'#fff',fontSize:'22px',fontWeight:'800',cursor:'pointer',boxShadow:'0 10px 25px rgba(37,99,235,.28)',zIndex:'999',display:'none'});
      b.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'})); document.body.appendChild(b);
      window.addEventListener('scroll',()=>{b.style.display=window.scrollY>500?'block':'none'},{passive:true});
    }
  }
  document.addEventListener('DOMContentLoaded',polish); document.addEventListener('divyangsathi:layout-ready',polish); if(document.readyState!=='loading')polish();
})();
