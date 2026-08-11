(function(){
'use strict';

if(window.__DS_CMS_RUNTIME__)return;
window.__DS_CMS_RUNTIME__=2;

const SUPABASE_URL='https://nkdzfxanmvmrhehqtrtl.supabase.co';
const SUPABASE_KEY='sb_publishable_0K8Tq7ng_CCm6wVrRBJxGQ_kNYhwaXq';

const page=location.pathname.split('/').pop()||'index.html';

function getClient(){
  if(window.__DS_SUPABASE_CLIENT__){
    return window.__DS_SUPABASE_CLIENT__;
  }

  if(window.supabase){
    window.__DS_SUPABASE_CLIENT__=
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      );

    return window.__DS_SUPABASE_CLIENT__;
  }

  return null;
}

const c=getClient();

if(!c)return;


function esc(v){
  const d=document.createElement('div');
  d.textContent=v??'';
  return d.innerHTML;
}


function sessionKey(){
  let k=sessionStorage.getItem('ds-cms-session');

  if(!k){
    k=
      Date.now().toString(36)
      +'-'
      +Math.random().toString(36).slice(2);

    sessionStorage.setItem(
      'ds-cms-session',
      k
    );
  }

  return k;
}


async function event(type,ref){
  try{
    await c
      .from('cms_events')
      .insert({
        event_type:type,
        page_slug:page,
        reference_id:ref||null,
        session_key:sessionKey()
      });
  }
  catch(_){}
}


event('page_view');


/* =========================================================
   PAGE OVERRIDES
========================================================= */

let pageOverrides=[];


function applyOverride(x){

  try{

    document
      .querySelectorAll(x.selector)
      .forEach(el=>{

        const v=x.value??'';

        const mark=
          'cmsApplied'
          +String(x.id||'').replace(/-/g,'');


        if(
          [
            'before_html',
            'after_html',
            'append_html'
          ].includes(x.property)
          &&
          el.dataset[mark]
        ){
          return;
        }


        if(x.property==='text'){

          el.textContent=v;

        }

        else if(x.property==='html'){

          el.innerHTML=v;

        }

        else if(x.property==='src'){

          el.setAttribute(
            'src',
            v
          );

        }

        else if(x.property==='href'){

          el.setAttribute(
            'href',
            v
          );

        }

        else if(x.property==='placeholder'){

          el.setAttribute(
            'placeholder',
            v
          );

        }

        else if(x.property==='before_html'){

          el.insertAdjacentHTML(
            'beforebegin',
            v
          );

          el.dataset[mark]='1';

        }

        else if(x.property==='after_html'){

          el.insertAdjacentHTML(
            'afterend',
            v
          );

          el.dataset[mark]='1';

        }

        else if(x.property==='append_html'){

          el.insertAdjacentHTML(
            'beforeend',
            v
          );

          el.dataset[mark]='1';

        }

        else if(x.property==='move_after'){

          const target=
            document.querySelector(v);

          if(
            target &&
            target!==el
          ){
            target.insertAdjacentElement(
              'afterend',
              el
            );
          }

        }

        else if(x.property==='remove'){

          el.remove();

        }

        else if(x.property==='hidden'){

          el.style.display=
            String(v)==='true'
            ?
            'none'
            :
            '';

        }

        else if(
          x.property?.startsWith('style.')
        ){

          el.style[
            x.property.slice(6)
          ]=v;

        }

      });

  }
  catch(_){}

}


function applyOverrides(){

  pageOverrides.forEach(
    applyOverride
  );

}


async function loadOverrides(){

  try{

    const {data}=await c
      .from('cms_page_overrides')
      .select('*')
      .eq('page_slug',page)
      .eq('status','published')
      .is('deleted_at',null)
      .order('sort_order');


    pageOverrides=data||[];


    applyOverrides();


    [
      350,
      900,
      1800
    ].forEach(
      ms=>
        setTimeout(
          applyOverrides,
          ms
        )
    );


    document.addEventListener(
      'divyangsathi:layout-ready',
      ()=>
        setTimeout(
          applyOverrides,
          60
        )
    );

  }
  catch(_){}

}


/* =========================================================
   THEME
========================================================= */

async function loadTheme(){

  try{

    const {data}=await c
      .from('cms_theme')
      .select('*')
      .eq('is_active',true)
      .is('deleted_at',null)
      .order(
        'updated_at',
        {
          ascending:false
        }
      )
      .limit(1)
      .maybeSingle();


    if(!data?.settings)return;


    const x=data.settings;

    const st=
      document.documentElement.style;


    Object.entries(x)
      .forEach(
        ([k,v])=>{

          if(
            k.startsWith('--') &&
            v!=null
          ){
            st.setProperty(
              k,
              String(v)
            );
          }

        }
      );


    let css=
      document.getElementById(
        'dsCmsThemeCss'
      );


    if(!css){

      css=
        document.createElement(
          'style'
        );

      css.id=
        'dsCmsThemeCss';

      document.head.appendChild(
        css
      );

    }


    const primary=
      x['--cms-primary']
      ||
      '#2563eb';


    const secondary=
      x['--cms-secondary']
      ||
      '#16a34a';


    const accent=
      x['--cms-accent']
      ||
      '#f59e0b';


    const bg=
      x['--cms-background']
      ||
      '#fff';


    const font=
      x['--cms-font']
      ||
      'system-ui,sans-serif';


    const radius=
      x['--cms-radius']
      ||
      '16px';


    let generated=`
      body{
        font-family:${font};
        background-color:${bg}
      }

      .home-premium-button,
      .user-primary-btn,
      .ds-primary-btn{
        border-radius:${radius}
      }
    `;


    if(
      x.button_style==='gradient'
    ){

      generated+=`
        .home-premium-button,
        .user-primary-btn,
        .ds-primary-btn{
          background:
            linear-gradient(
              135deg,
              ${primary},
              ${secondary}
            ) !important
        }
      `;

    }

    else if(
      x.button_style==='outline'
    ){

      generated+=`
        .home-premium-button,
        .user-primary-btn,
        .ds-primary-btn{
          background:
            transparent !important;

          color:
            ${primary} !important;

          border:
            2px solid ${primary} !important
        }
      `;

    }


    if(x.background_image){

      generated+=`
        body{
          background-image:
            linear-gradient(
              rgba(255,255,255,.92),
              rgba(255,255,255,.92)
            ),
            url("${x.background_image}");

          background-size:
            cover;

          background-attachment:
            fixed
        }
      `;

    }


    css.textContent=
      generated
      +'\n'
      +(x.custom_css||'');

  }

  catch(_){}

}


/* =========================================================
   SEO
========================================================= */

async function loadSEO(){

  try{

    const {data}=await c
      .from('cms_seo')
      .select('*')
      .eq('page_slug',page)
      .is('deleted_at',null)
      .maybeSingle();


    if(!data)return;


    if(data.title){

      document.title=
        data.title;

    }


    const meta=(
      name,
      val,
      attr='name'
    )=>{

      if(!val)return;


      let m=
        document.head
          .querySelector(
            `meta[${attr}="${name}"]`
          );


      if(!m){

        m=
          document.createElement(
            'meta'
          );

        m.setAttribute(
          attr,
          name
        );

        document.head.appendChild(
          m
        );

      }


      m.content=
        val;

    };


    meta(
      'description',
      data.description
    );


    meta(
      'keywords',
      data.keywords
    );


    meta(
      'robots',
      data.robots
    );


    meta(
      'og:title',
      data.title,
      'property'
    );


    meta(
      'og:description',
      data.description,
      'property'
    );


    meta(
      'og:image',
      data.og_image_url,
      'property'
    );


    if(data.canonical_url){

      let l=
        document.head
          .querySelector(
            'link[rel="canonical"]'
          );


      if(!l){

        l=
          document.createElement(
            'link'
          );

        l.rel=
          'canonical';

        document.head.appendChild(
          l
        );

      }


      l.href=
        data.canonical_url;

    }

  }

  catch(_){}

}


/* =========================================================
   MENU
   FINAL FIX:
   CMS HEADER MENU ONLY UPDATES USER DASHBOARD NAVIGATION.
   PUBLIC REGISTER / LOGIN / HOME HEADER REMAINS ORIGINAL.
========================================================= */

async function loadMenus(){

  try{

    const {data}=await c
      .from('cms_menu_items')
      .select('*')
      .eq('is_visible',true)
      .is('deleted_at',null)
      .order('sort_order');


    if(!data?.length)return;


    const apply=()=>{

      const header=
        data.filter(
          x=>
            x.location==='header'
        );


      const footer=
        data.filter(
          x=>
            x.location==='footer'
        );


      /*
       * IMPORTANT FIX
       *
       * Do NOT target:
       * header nav
       * .home-premium-nav
       * .premium-nav
       *
       * Otherwise public pages such as
       * register.html / login.html
       * get the logged-in CMS menu.
       *
       * Only actual user dashboard navigation
       * is controlled by the CMS user menu.
       */

      const nav=
        document.querySelector(
          '.user-dashboard-navigation'
        );


      if(
        nav &&
        header.length
      ){

        nav
          .querySelectorAll(
            ':scope > a'
          )
          .forEach(
            a=>a.remove()
          );


        const anchor=
          [...nav.children]
            .find(
              x=>
                x.matches(
                  'select,button,.ds-home-tools,.ds-login-header-tools'
                )
            )
          ||
          null;


        header.forEach(
          x=>{

            const a=
              document.createElement(
                'a'
              );


            a.href=
              x.url;


            a.textContent=
              (
                (x.icon||'')
                +' '
                +x.label
              )
              .trim();


            nav.insertBefore(
              a,
              anchor
            );

          }
        );

      }


      /*
       * FOOTER CMS REMAINS GLOBAL.
       */

      const fn=
        document.querySelector(
          '.ds-final-footer-links,.home-footer-links'
        );


      if(
        fn &&
        footer.length
      ){

        fn
          .querySelectorAll('a')
          .forEach(
            a=>a.remove()
          );


        footer.forEach(
          x=>{

            const a=
              document.createElement(
                'a'
              );


            a.href=
              x.url;


            a.textContent=
              (
                (x.icon||'')
                +' '
                +x.label
              )
              .trim();


            fn.appendChild(
              a
            );

          }
        );

      }

    };


    apply();


    document.addEventListener(
      'divyangsathi:layout-ready',
      ()=>
        setTimeout(
          apply,
          50
        )
    );


    setTimeout(
      apply,
      600
    );

  }

  catch(_){}

}


/* =========================================================
   GLOBAL SETTINGS
========================================================= */

async function loadSettings(){

  try{

    const {data}=await c
      .from('cms_settings')
      .select('value')
      .eq('key','global')
      .is('deleted_at',null)
      .maybeSingle();


    const x=
      data?.value;


    if(!x)return;


    const apply=()=>{

      if(x.website_name){

        document
          .querySelectorAll(
            '[data-cms-site-name],.user-dashboard-brand h2'
          )
          .forEach(
            e=>
              e.textContent=
                x.website_name
          );


        const b=
          document.querySelector(
            '.ds-final-footer-brand'
          );


        if(b){

          b.textContent=
            '❤️ '
            +x.website_name;

        }

      }


      if(x.logo_url){

        document
          .querySelectorAll(
            '[data-cms-logo]'
          )
          .forEach(
            e=>
              e.src=
                x.logo_url
          );

      }


      if(x.favicon_url){

        let l=
          document.head
            .querySelector(
              'link[rel="icon"]'
            );


        if(!l){

          l=
            document.createElement(
              'link'
            );

          l.rel=
            'icon';

          document.head.appendChild(
            l
          );

        }


        l.href=
          x.favicon_url;

      }


      if(x.announcement){

        let a=
          document.getElementById(
            'cmsGlobalAnnouncement'
          );


        if(!a){

          a=
            document.createElement(
              'div'
            );

          a.id=
            'cmsGlobalAnnouncement';


          a.style.cssText=
            'padding:9px 14px;'
            +'text-align:center;'
            +'background:#fef3c7;'
            +'color:#78350f;'
            +'font-weight:800;'
            +'position:relative;'
            +'z-index:999';


          document.body.insertBefore(
            a,
            document.body.firstChild
          );

        }


        a.textContent=
          x.announcement;

      }

    };


    apply();


    document.addEventListener(
      'divyangsathi:layout-ready',
      ()=>
        setTimeout(
          apply,
          50
        )
    );


    if(
      x.maintenance_mode &&
      ![
        'login.html',
        'admin-login.html'
      ].includes(page)
    ){

      document.body.innerHTML=
        '<main style="min-height:100vh;display:grid;place-items:center;font-family:system-ui;padding:20px">'
        +'<div style="text-align:center">'
        +'<h1>'
        +esc(
          x.website_name
          ||
          'DivyangSathi'
        )
        +'</h1>'
        +'<h2>Website Maintenance</h2>'
        +'<p>We will be back shortly.</p>'
        +'</div>'
        +'</main>';

    }

  }

  catch(_){}

}


/* =========================================================
   NOTIFICATION STYLES
========================================================= */

function notifStyles(){

  if(
    document.getElementById(
      'dsCmsNotifCss'
    )
  ){
    return;
  }


  const s=
    document.createElement(
      'style'
    );


  s.id=
    'dsCmsNotifCss';


  s.textContent=`
    .ds-cms-banner-stack{
      position:relative;
      z-index:9999
    }

    .ds-cms-banner{
      display:flex;
      align-items:center;
      justify-content:center;
      gap:10px;
      padding:10px 46px 10px 14px;
      background:#0f172a;
      color:#fff;
      position:relative
    }

    .ds-cms-banner img{
      width:36px;
      height:36px;
      object-fit:contain;
      border-radius:8px;
      background:#fff
    }

    .ds-cms-banner a{
      color:#fde68a;
      font-weight:800
    }

    .ds-cms-banner button{
      position:absolute;
      right:12px;
      border:0;
      background:transparent;
      color:#fff;
      font-size:20px;
      cursor:pointer
    }

    .ds-cms-notice{
      position:fixed;
      right:18px;
      bottom:18px;
      z-index:2147482000;
      width:min(380px,calc(100vw - 36px));
      background:#fff;
      border:1px solid #e2e8f0;
      border-radius:16px;
      padding:16px;
      box-shadow:0 20px 60px #0004
    }

    .ds-cms-notice img{
      width:52px;
      height:52px;
      object-fit:contain
    }

    .ds-cms-overlay{
      position:fixed;
      inset:0;
      background:rgba(2,6,23,.82);
      z-index:2147483000;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:18px
    }

    .ds-cms-popup{
      width:min(820px,100%);
      max-height:94vh;
      overflow:auto;
      background:#fff;
      border-radius:24px;
      position:relative;
      box-shadow:0 30px 90px #0008
    }

    .ds-cms-popup.fullpage{
      width:min(1180px,100%);
      min-height:min(760px,92vh)
    }

    .ds-cms-popup .close{
      position:absolute;
      right:12px;
      top:12px;
      z-index:3;
      border:0;
      border-radius:50%;
      width:40px;
      height:40px;
      font-size:22px;
      cursor:pointer
    }

    .ds-cms-popup .banner{
      width:100%;
      max-height:420px;
      object-fit:cover
    }

    .ds-cms-popup .logo{
      width:88px;
      height:88px;
      object-fit:contain;
      border-radius:20px;
      background:#fff;
      padding:8px;
      margin:-44px 0 0 24px;
      position:relative;
      box-shadow:0 8px 28px #0003
    }

    .ds-cms-popup .body{
      padding:22px 28px 30px
    }

    .ds-cms-popup .cta{
      display:inline-block;
      margin-top:16px;
      background:#2563eb;
      color:#fff;
      padding:11px 16px;
      border-radius:10px;
      text-decoration:none;
      font-weight:850
    }

    .ds-cms-popup .navrow{
      display:flex;
      justify-content:space-between;
      align-items:center;
      padding:0 28px 22px
    }

    .ds-cms-popup .navrow button{
      border:0;
      background:#475569;
      color:#fff;
      border-radius:9px;
      padding:8px 12px;
      cursor:pointer
    }
  `;


  document.head.appendChild(
    s
  );

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

async function loadNotifications(){

  try{

    notifStyles();


    const now=
      new Date()
        .toISOString();


    const {data}=await c
      .from('cms_notifications')
      .select('*')
      .eq('status','published')
      .lte('starts_at',now)
      .or(
        'ends_at.is.null,ends_at.gte.'
        +now
      )
      .is('deleted_at',null)
      .order(
        'priority',
        {
          ascending:false
        }
      )
      .limit(30);


    let rows=
      (data||[])
        .filter(
          n=>
            !n.page_slug
            ||
            n.page_slug==='all'
            ||
            n.page_slug===page
        );


    if(!rows.length)return;


    const {
      data:{session}
    }=
      await c.auth
        .getSession();


    const logged=
      !!session?.user;


    rows=
      rows.filter(
        n=>
          !n.target_scope
          ||
          n.target_scope==='all'
          ||
          (
            n.target_scope==='guest'
            &&
            !logged
          )
          ||
          (
            n.target_scope==='logged_in'
            &&
            logged
          )
      );


    if(!rows.length)return;


    const banners=
      rows.filter(
        n=>
          n.popup_type==='banner'
      );


    const notices=
      rows.filter(
        n=>
          n.popup_type==='normal'
      );


    const popups=
      rows.filter(
        n=>
          ![
            'banner',
            'normal'
          ].includes(
            n.popup_type
            ||
            'popup'
          )
      );


    if(banners.length){

      const stack=
        document.createElement(
          'div'
        );


      stack.className=
        'ds-cms-banner-stack';


      banners.forEach(
        n=>{

          if(
            sessionStorage.getItem(
              'cms-notif-'+n.id
            )
          ){
            return;
          }


          const d=
            document.createElement(
              'div'
            );


          d.className=
            'ds-cms-banner';


          d.innerHTML=
            (
              n.logo_url
              ?
              `<img src="${esc(n.logo_url)}">`
              :
              ''
            )
            +
            `<strong>${esc(n.title)}</strong>`
            +
            `<span>${esc(n.message)}</span>`
            +
            (
              n.button_url
              ?
              `<a data-cms-click="${n.id}" href="${esc(n.button_url)}">${esc(n.button_text||'Open')}</a>`
              :
              ''
            )
            +
            `<button aria-label="Close">×</button>`;


          d.querySelector(
            'button'
          ).onclick=
            ()=>{

              sessionStorage.setItem(
                'cms-notif-'+n.id,
                '1'
              );

              d.remove();

            };


          d.querySelector(
            '[data-cms-click]'
          )?.addEventListener(
            'click',
            ()=>
              event(
                'notification_click',
                n.id
              )
          );


          stack.appendChild(
            d
          );


          event(
            'notification_view',
            n.id
          );

        }
      );


      if(
        stack.children.length
      ){

        document.body.insertBefore(
          stack,
          document.body.firstChild
        );

      }

    }


    notices
      .filter(
        n=>
          !sessionStorage.getItem(
            'cms-notif-'+n.id
          )
      )
      .slice(0,3)
      .forEach(
        (n,i)=>{

          setTimeout(
            ()=>{

              const d=
                document.createElement(
                  'div'
                );


              d.className=
                'ds-cms-notice';


              d.style.bottom=
                (18+i*150)
                +'px';


              d.innerHTML=`
                <div style="display:flex;gap:12px">

                  ${
                    n.logo_url
                    ?
                    `<img src="${esc(n.logo_url)}">`
                    :
                    ''
                  }

                  <div>

                    <strong>
                      ${esc(n.title)}
                    </strong>

                    <p>
                      ${esc(n.message)}
                    </p>

                    ${
                      n.button_url
                      ?
                      `<a data-cms-click="${n.id}" href="${esc(n.button_url)}">${esc(n.button_text||'Open')}</a>`
                      :
                      ''
                    }

                  </div>

                  <button style="margin-left:auto;border:0;background:transparent;cursor:pointer">
                    ×
                  </button>

                </div>
              `;


              d.querySelector(
                'button'
              ).onclick=
                ()=>{

                  sessionStorage.setItem(
                    'cms-notif-'+n.id,
                    '1'
                  );

                  d.remove();

                };


              d.querySelector(
                '[data-cms-click]'
              )?.addEventListener(
                'click',
                ()=>
                  event(
                    'notification_click',
                    n.id
                  )
              );


              document.body.appendChild(
                d
              );


              event(
                'notification_view',
                n.id
              );

            },
            i*180
          );

        }
      );


    const queue=
      popups.filter(
        n=>
          !sessionStorage.getItem(
            'cms-notif-'+n.id
          )
      );


    if(queue.length){

      showPopupQueue(
        queue,
        0
      );

    }

  }

  catch(_){}

}


/* =========================================================
   POPUP QUEUE
========================================================= */

function showPopupQueue(
  queue,
  index
){

  const n=
    queue[index];


  if(!n)return;


  const ov=
    document.createElement(
      'div'
    );


  ov.className=
    'ds-cms-overlay';


  const card=
    document.createElement(
      'div'
    );


  card.className=
    'ds-cms-popup '
    +
    (
      n.popup_type==='fullpage'
      ?
      'fullpage'
      :
      ''
    );


  card.innerHTML=`

    <button class="close">
      ×
    </button>

    ${
      n.image_url
      ?
      `<img class="banner" src="${esc(n.image_url)}" alt="">`
      :
      ''
    }

    ${
      n.logo_url
      ?
      `<img class="logo" src="${esc(n.logo_url)}" alt="">`
      :
      ''
    }

    <div class="body">

      <h2>
        ${esc(n.title)}
      </h2>

      <div style="white-space:pre-wrap;line-height:1.65">
        ${esc(n.message)}
      </div>

      ${
        n.button_url
        ?
        `<a class="cta" data-cms-click="${n.id}" href="${esc(n.button_url)}">${esc(n.button_text||'Open')}</a>`
        :
        ''
      }

    </div>

    ${
      queue.length>1
      ?
      `
        <div class="navrow">

          <button
            class="prev"
            ${index===0?'disabled':''}
          >
            ← Previous
          </button>

          <span>
            ${index+1} / ${queue.length}
          </span>

          <button
            class="next"
            ${index===queue.length-1?'disabled':''}
          >
            Next →
          </button>

        </div>
      `
      :
      ''
    }

  `;


  ov.appendChild(
    card
  );


  document.body.appendChild(
    ov
  );


  event(
    'notification_view',
    n.id
  );


  const close=()=>{

    sessionStorage.setItem(
      'cms-notif-'+n.id,
      '1'
    );

    ov.remove();

  };


  card.querySelector(
    '.close'
  ).onclick=
    close;


  card.querySelector(
    '[data-cms-click]'
  )?.addEventListener(
    'click',
    ()=>
      event(
        'notification_click',
        n.id
      )
  );


  card.querySelector(
    '.prev'
  )?.addEventListener(
    'click',
    ()=>{

      close();

      showPopupQueue(
        queue,
        index-1
      );

    }
  );


  card.querySelector(
    '.next'
  )?.addEventListener(
    'click',
    ()=>{

      close();

      showPopupQueue(
        queue,
        index+1
      );

    }
  );

}


/* =========================================================
   SERVICES
========================================================= */

async function loadServices(){

  if(
    page!=='index.html'
  ){
    return;
  }


  try{

    const {data}=await c
      .from('cms_services')
      .select('*')
      .eq('is_active',true)
      .is('deleted_at',null)
      .order('sort_order');


    const rows=
      data||[];


    if(!rows.length)return;


    const services=
      rows.filter(
        x=>
          x.type==='service'
      );


    if(!services.length)return;


    let host=
      document.getElementById(
        'cmsLiveServices'
      );


    if(!host){

      host=
        document.createElement(
          'section'
        );


      host.id=
        'cmsLiveServices';


      host.style.cssText=
        'max-width:1180px;'
        +'margin:30px auto;'
        +'padding:0 18px';


      const footer=
        document.querySelector(
          'footer,#commonFooter'
        );


      (
        footer?.parentNode
        ||
        document.body
      )
      .insertBefore(
        host,
        footer||null
      );

    }


    host.innerHTML=`

      <h2 style="text-align:center">
        Our Services
      </h2>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px">

        ${
          services.map(
            s=>`

              <article style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:16px">

                ${
                  s.image_url
                  ?
                  `<img src="${esc(s.image_url)}" style="width:100%;height:150px;object-fit:cover;border-radius:12px">`
                  :
                  ''
                }

                <h3>
                  ${esc(s.name)}
                </h3>

                <p>
                  ${esc(s.description||'')}
                </p>

              </article>

            `
          )
          .join('')
        }

      </div>

    `;

  }

  catch(_){}

}


/* =========================================================
   DOCUMENTS
========================================================= */

async function loadDocuments(){

  if(
    page!=='contact.html'
  ){
    return;
  }


  try{

    const {data}=await c
      .from('cms_documents')
      .select('*')
      .eq('status','published')
      .is('deleted_at',null)
      .order(
        'updated_at',
        {
          ascending:false
        }
      );


    if(!data?.length)return;


    let host=
      document.getElementById(
        'cmsLiveDocuments'
      );


    if(!host){

      host=
        document.createElement(
          'section'
        );


      host.id=
        'cmsLiveDocuments';


      host.style.cssText=
        'max-width:1100px;'
        +'margin:28px auto;'
        +'padding:0 18px';


      const footer=
        document.querySelector(
          'footer,#commonFooter'
        );


      (
        footer?.parentNode
        ||
        document.body
      )
      .insertBefore(
        host,
        footer||null
      );

    }


    host.innerHTML=`

      <h2>
        Documents
      </h2>

      <div style="display:grid;gap:9px">

        ${
          data.map(
            d=>`

              <a
                href="${esc(d.url)}"
                target="_blank"
                style="padding:12px 14px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;text-decoration:none;font-weight:800;color:#1d4ed8"
              >

                📄 ${esc(d.title)}

                <small style="color:#64748b">
                  ${esc(d.category||'')}
                </small>

              </a>

            `
          )
          .join('')
        }

      </div>

    `;

  }

  catch(_){}

}


/* =========================================================
   RUN
========================================================= */

async function run(){

  await Promise.allSettled([

    loadTheme(),

    loadSEO(),

    loadSettings(),

    loadMenus(),

    loadOverrides(),

    loadServices(),

    loadDocuments()

  ]);


  setTimeout(
    loadNotifications,
    450
  );

}


/* =========================================================
   START
========================================================= */

if(
  document.readyState===
  'loading'
){

  document.addEventListener(
    'DOMContentLoaded',
    ()=>
      setTimeout(
        run,
        60
      )
  );

}

else{

  setTimeout(
    run,
    60
  );

}

})();