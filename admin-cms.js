(function(){

'use strict';


const $ =
(s,r=document) =>
r.querySelector(s);


const $$ =
(s,r=document) =>
[...r.querySelectorAll(s)];


const pages = [

'admin.html',

'admin-profiles.html',

'admin-memberships.html',

'admin-requests.html',

'admin-moderation.html',

'admin-support.html'

];


const esc = v => {

const d =
document.createElement('div');

d.textContent =
v ?? '';

return d.innerHTML;

};


function toast(m){

const x =
$('#cmsToast');

if(!x)return;

x.textContent =
m;

x.style.display =
'block';

clearTimeout(
window.__acToast
);

window.__acToast =
setTimeout(
()=>x.style.display='none',
2200
);

}


/* =====================================================
ADMIN ACCESS
===================================================== */

async function check(){

const {
data:{user},
error:userError
}=
await client.auth.getUser();

if(userError || !user){
location.replace('admin-login.html');
return false;
}

// Preferred check through the SECURITY DEFINER helper. This keeps
// Admin CMS working even when admins-table RLS blocks direct SELECT.
try{
const {data:ok,error:rpcError}=
await client.rpc('is_active_admin');
if(!rpcError && ok === true){
return true;
}
}catch(_){}

// Backward-compatible fallback.
const {data,error}=
await client
.from('admins')
.select('active')
.eq('id',user.id)
.maybeSingle();

if(error || !data?.active){
location.replace('admin-login.html');
return false;
}

return true;
}


/* =====================================================
TABS
===================================================== */

$$(
'#acTabs .cms-tab'
).forEach(

b =>

b.onclick =
() => {

$$(
'#acTabs .cms-tab'
).forEach(
x =>
x.classList.remove(
'active'
)
);


$$(
'.cms-panel'
).forEach(
x =>
x.classList.remove(
'active'
)
);


b.classList.add(
'active'
);


$(
`[data-ap="${b.dataset.a}"]`
)?.classList.add(
'active'
);

}

);


/* =====================================================
SELECTOR GENERATOR
===================================================== */

function selectorFor(
el,
doc
){

if(el.id){

return '#' +
CSS.escape(
el.id
);

}


const cls =
[
...el.classList
]
.filter(
z =>
![
'active',
'hidden',
'show'
].includes(z)
);


if(
cls.length
){

const s =

el.tagName
.toLowerCase()

+

'.'

+

cls
.slice(0,2)
.map(CSS.escape)
.join('.');


try{

if(
doc.querySelectorAll(s)
.length === 1
){

return s;

}

}catch(_){}

}


let path = [];

let cur =
el;


while(
cur &&
cur !== doc.body &&
path.length < 6
){

let x =
cur.tagName
.toLowerCase();


if(cur.id){

path.unshift(
'#' +
CSS.escape(cur.id)
);

break;

}


const c =
[
...cur.classList
]
.filter(
z =>
![
'active',
'hidden',
'show'
].includes(z)
)[0];


if(c){

x +=
'.' +
CSS.escape(c);

}


const sib =
cur.parentElement
?
[
...cur.parentElement.children
]
.filter(
z =>
z.tagName ===
cur.tagName
)
:
[];


if(
sib.length > 1
){

x +=
`:nth-of-type(${
sib.indexOf(cur)+1
})`;

}


path.unshift(x);

cur =
cur.parentElement;

}


return path.join(
' > '
);

}


/* =====================================================
ELEMENT TYPE
===================================================== */

function kind(el){

const c =
String(
el.className || ''
);


if(
c.includes(
'admin-stat-card'
)
){

return 'Statistic Card';

}


if(
c.includes(
'admin-analytics-card'
)
){

return 'Analytics Card';

}


if(
c.includes(
'admin-chart-card'
)
){

return 'Chart Card';

}


if(
el.tagName ===
'CANVAS'
){

return 'Chart Canvas';

}


if(
el.tagName ===
'A'
){

return 'Menu / Link';

}


if(
el.tagName ===
'BUTTON'
){

return 'Button';

}


if(
/^H[1-6]$/
.test(
el.tagName
)
){

return 'Heading';

}


if(
el.tagName ===
'IMG'
){

return 'Image';

}


if(
el.tagName ===
'SECTION'
){

return 'Section';

}


return 'Element';

}


/* =====================================================
LABEL
===================================================== */

function label(el){

const text =

(
el.getAttribute(
'aria-label'
)

||

el.getAttribute(
'title'
)

||

el.textContent

||

el.id

||

el.tagName

)

.replace(
/\s+/g,
' '
)

.trim()

.slice(
0,
90
);


return `${kind(el)} · ${
text ||
el.tagName.toLowerCase()
}`;

}


/* =====================================================
ELEMENT SNAPSHOT
===================================================== */

function snapshot(el){

return {

text:

(
el.textContent ||
''
)

.replace(
/\s+/g,
' '
)

.trim(),


html:

el.innerHTML ||
'',


href:

el.getAttribute(
'href'
) ||
'',


src:

el.getAttribute(
'src'
) ||
'',


title:

el.getAttribute(
'title'
) ||
'',


alt:

el.getAttribute(
'alt'
) ||
'',


hidden:

(
el.hasAttribute(
'hidden'
)

||

el.style.display ===
'none'
)

?
'true'
:
'false',


'style.color':

el.style.color ||
'',


'style.backgroundColor':

el.style.backgroundColor ||
'',


'style.borderRadius':

el.style.borderRadius ||
'',


'style.borderColor':

el.style.borderColor ||
'',


'style.order':

el.style.order ||
''

};

}


let scan = [];

let activeOverrides = [];


/* =====================================================
GROUP DETECTION
===================================================== */

function groupFor(el){

if(
el.closest(
'#dashboard .admin-stat-card'
)
){

return 'stats';

}


if(
el.closest(
'#analyticsCharts'
)
){

return 'charts';

}


if(
el.closest(
'#advancedAnalytics'
)
){

return 'advanced';

}


if(
el.closest(
'#analytics'
)
){

return 'analytics';

}


if(
el.closest(
'.admin-v3-sidebar-nav'
)
){

return 'menu';

}


return 'general';

}


/* =====================================================
CARD TITLE
===================================================== */

function cardTitle(el){

const card =

el.matches(
'.admin-stat-card,.admin-analytics-card,.admin-chart-card'
)

?
el

:

el.closest(
'.admin-stat-card,.admin-analytics-card,.admin-chart-card'
);


if(!card){

return '';

}


const h =
card.querySelector(
'h2,h3,h4'
);


const p =
card.querySelector(
'.admin-stat-footer,p'
);


return (

h?.textContent

||

p?.textContent

||

card.textContent

||

''

)

.replace(
/\s+/g,
' '
)

.trim()

.slice(
0,
100
);

}


/* =====================================================
SCAN ADMIN PAGE
===================================================== */

async function scanPage(){

try{

const page =
$('#acPage').value;


const res =
await fetch(
page,
{
cache:'no-store'
}
);


if(!res.ok){

throw new Error(
page +
' returned ' +
res.status
);

}


const doc =

new DOMParser()
.parseFromString(
await res.text(),
'text/html'
);


scan = [];


const seen =
new Set();


const selectorList = [

'.admin-v3-sidebar-nav a',

'#dashboard',

'#dashboard .admin-stat-card',

'#dashboard .admin-stat-card h3',

'#dashboard .admin-stat-card .admin-stat-badge',

'#dashboard .admin-stat-card .admin-stat-footer',

'#dashboard .admin-stat-card .admin-stat-icon',

'#analytics',

'#analytics .admin-panel-header',

'#analytics .admin-analytics-card',

'#analytics .admin-analytics-card p',

'#analytics .admin-analytics-card .admin-analytics-icon',

'#refreshAdminAnalytics',

'#advancedAnalytics',

'#advancedAnalytics .admin-panel-header',

'#advancedAnalytics .admin-analytics-card',

'#advancedAnalytics .admin-analytics-card p',

'#analyticsCharts',

'#analyticsCharts .admin-panel-header',

'#analyticsCharts .admin-chart-card',

'#analyticsCharts .admin-chart-card h3',

'#analyticsCharts canvas',

'main section',

'main h1',

'main h2',

'main h3',

'main h4',

'main p',

'main span',

'main a',

'main button',

'main img',

'main canvas'

].join(',');


doc
.querySelectorAll(
selectorList
)
.forEach(
el => {

if(
el.closest(
'script,style,noscript'
)
){

return;

}


const sel =
selectorFor(
el,
doc
);


if(
!sel ||
seen.has(sel)
){

return;

}


seen.add(sel);


const group =
groupFor(el);


const title =
cardTitle(el);


scan.push({

selector:
sel,

label:
title
?
`${kind(el)} · ${title}`
:
label(el),

tag:
el.tagName
.toLowerCase(),

cls:
String(
el.className ||
''
),

group,

values:
snapshot(el)

});

}
);


$('#acSelector').innerHTML =

'<option value="">Choose admin element…</option>'

+

scan.map(
x =>

`<option
value="${esc(x.selector)}"
data-tag="${x.tag}">
${esc(x.label)} — ${esc(x.selector)}
</option>`

).join('');


renderDetected();

updatePropertyOptions();

loadCurrentValue();


}catch(e){

console.error(
'Admin page scan failed:',
e
);


alert(
'Admin page scan failed: ' +
e.message
);

}

}


/* =====================================================
PROPERTY OPTIONS
===================================================== */

function updatePropertyOptions(force){

const tag =

$('#acSelector')
.selectedOptions[0]
?.dataset.tag

||

'';


let o = [

[
'text',
'Text / Label'
],

[
'html',
'Replace HTML'
],

[
'before_html',
'Add Before'
],

[
'after_html',
'Add After'
],

[
'append_html',
'Add Inside'
],

[
'move_after',
'Move / Reorder After'
],

[
'hidden',
'Show / Hide'
],

[
'remove',
'Delete / Remove'
],

[
'style.color',
'Text Color'
],

[
'style.backgroundColor',
'Background Color'
],

[
'style.borderColor',
'Border Color'
],

[
'style.borderRadius',
'Radius'
],

[
'style.order',
'Order'
]

];


if(
tag ===
'a'
){

o.splice(
2,
0,
[
'attr.href',
'Destination Link'
]
);

}


if(
tag ===
'img'
){

o = [

[
'attr.src',
'Image Source'
],

[
'attr.alt',
'Alt Text'
],

[
'hidden',
'Show / Hide'
],

[
'remove',
'Delete / Remove'
],

[
'style.borderRadius',
'Radius'
]

];

}


if(
tag ===
'button'
){

o.splice(
2,
0,
[
'attr.title',
'Button Title'
]
);

}


$('#acProperty').innerHTML =

o.map(
([v,l]) =>
`<option value="${v}">
${l}
</option>`
)
.join('');


if(
force &&
![
...$('#acProperty').options
]
.some(
x =>
x.value === force
)
){

$('#acProperty')
.insertAdjacentHTML(
'beforeend',
`<option value="${esc(force)}">
${esc(force)}
</option>`
);

}


if(force){

$('#acProperty').value =
force;

}


updateValueMode();

}


/* =====================================================
VALUE MODE
===================================================== */

function updateValueMode(){

const p =
$('#acProperty').value;


if(
p ===
'hidden'
){

$('#acValue').placeholder =
'Use true to hide, false to show';

}


else if(
p ===
'move_after'
){

$('#acValue').placeholder =
'Destination selector, e.g. #analytics';

}


else if(
p ===
'remove'
){

$('#acValue').placeholder =
'No value needed';

}


else{

$('#acValue').placeholder =
'Enter updated value';

}

}


/* =====================================================
CURRENT VALUE
===================================================== */

function loadCurrentValue(){

const item =
scan.find(
x =>
x.selector ===
$('#acSelector').value
);


const p =
$('#acProperty').value;


if(!item){

$('#acValue').value =
'';

return;

}


let key =

p.startsWith(
'attr.'
)

?
p.slice(5)

:
p;


$('#acValue').value =

p ===
'remove'

?
''

:

(
item.values[key]

??

item.values[p]

??

''
);

}


/* =====================================================
CARD GROUP CHECK
===================================================== */

function isStats(x){

return (

x.group ===
'stats'

||

/admin-stat-card|admin-stat-|#totalUsers|#totalProfiles|#membershipRequests|#approvedProfiles|#blockedProfiles|#totalInterests|#pendingReports/

.test(
x.cls +
' ' +
x.selector
)

);

}


function isAnalytics(x){

return (

[
'analytics',
'advanced',
'charts'
]
.includes(
x.group
)

||

/analytics|admin-chart|chart/i
.test(

x.cls

+
' '

+
x.selector

+
' '

+
x.label

)

);

}


/* =====================================================
TOP LEVEL ITEMS
===================================================== */

function topLevelOnly(
rows,
group
){

if(
group ===
'stats'
){

return rows.filter(
x =>

x.group ===
'stats'

&&

(
/admin-stat-card/
.test(
x.cls
)

||

x.selector ===
'#dashboard'

)

);

}


return rows.filter(
x =>

[
'analytics',
'advanced',
'charts'
]
.includes(
x.group
)

&&

(

x.selector ===
'#analytics'

||

x.selector ===
'#advancedAnalytics'

||

x.selector ===
'#analyticsCharts'

||

/admin-analytics-card|admin-chart-card/
.test(
x.cls
)

||

x.tag ===
'canvas'

||

x.selector ===
'#refreshAdminAnalytics'

)

);

}


/* =====================================================
ORDER
===================================================== */

function currentOrder(
selector,
rows
){

const r =

activeOverrides.find(
x =>

x.page_slug ===
$('#acPage').value

&&

x.selector ===
selector

&&

x.property ===
'style.order'
);


if(
r &&
r.value !==
''
){

return Number(
r.value
) || 0;

}


return Math.max(
0,
rows.findIndex(
x =>
x.selector === selector
)
);

}


/* =====================================================
GET OVERRIDE
===================================================== */

function getOverrideValue(
selector,
property,
fallback=''
){

const row =

activeOverrides.find(
r =>

r.page_slug ===
$('#acPage').value

&&

r.selector ===
selector

&&

r.property ===
property

&&

r.deleted_at == null
);


return row?.value
??
fallback;

}


/* =====================================================
COLOR CONVERSION
===================================================== */

function normaliseColor(
value,
fallback
){

const v =
String(
value ||
''
)
.trim();


if(
/^#[0-9a-f]{6}$/i
.test(v)
){

return v;

}


if(
/^#[0-9a-f]{3}$/i
.test(v)
){

return '#'

+

v.slice(1)

.split('')

.map(
c =>
c+c
)

.join('');

}


return fallback;

}


/* =====================================================
CHILD ICON SELECTOR
===================================================== */

function iconSelector(
selector,
group
){

if(
group ===
'stats'
){

return `${selector} .admin-stat-icon`;

}


return `${selector} .admin-analytics-icon, ${selector} h2, ${selector} h3, ${selector} h4`;

}


/* =====================================================
LIST CARDS
===================================================== */

function mini(
rows,
group
){

const list =
topLevelOnly(
rows,
group
);


const title =

group ===
'stats'

?
'Original Dashboard Statistics / Cards'

:
'Original Analytics Dashboard / Advanced Live Analytics / Charts';


return `

<div class="cms-source-note">

<strong>
${title}
</strong>

<span>
${list.length} items detected from admin.html
</span>

</div>


<div class="cms-table-wrap">

<table class="cms-table">

<tr>

<th>
Original Dashboard Item
</th>

<th>
Type
</th>

<th>
Controls
</th>

</tr>


${

list.map(
x => {

const changes =

activeOverrides.filter(
r =>

r.page_slug ===
$('#acPage').value

&&

(
r.selector ===
x.selector

||

r.selector.startsWith(
x.selector +
' '
)

)
);


const deleted =

changes.some(
r =>

r.selector ===
x.selector

&&

r.property ===
'remove'

&&

r.value ===
'true'
);


const hidden =

changes.some(
r =>

r.selector ===
x.selector

&&

r.property ===
'hidden'

&&

r.value ===
'true'
);


return `

<tr>

<td>

<strong>
${esc(x.label)}
</strong>

<br>

<code>
${esc(x.selector)}
</code>

</td>


<td>

${esc(

x.group ===
'advanced'

?
'Advanced Analytics'

:

x.group ===
'charts'

?
'Chart'

:

x.group ===
'analytics'

?
'Analytics'

:

kind({
className:x.cls,
tagName:x.tag.toUpperCase()
})

)}

</td>


<td class="cms-actions-cell">


<button
class="cms-btn gray"
data-pick="${esc(x.selector)}">

Edit / Update

</button>


<button
class="cms-btn green"
data-color="${esc(x.selector)}"
data-color-group="${group}">

🎨 Colours

</button>


${

deleted

?

`

<button
class="cms-btn green"
data-original="${esc(x.selector)}">

Restore

</button>

`

:

`

<button
class="cms-btn gold"
data-hide="${esc(x.selector)}">

${hidden ? 'Show' : 'Hide'}

</button>


<button
class="cms-btn gray"
data-moveup="${esc(x.selector)}">

↑

</button>


<button
class="cms-btn gray"
data-movedown="${esc(x.selector)}">

↓

</button>


<button
class="cms-btn red"
data-remove="${esc(x.selector)}">

Delete

</button>

`

}


${

changes.length &&
!deleted

?

`

<button
class="cms-btn green"
data-original="${esc(x.selector)}">

Restore Original

</button>

`

:

''

}


</td>

</tr>

`;

}
)

.join('')

||

`

<tr>

<td colspan="3">

No original items detected.
Refresh the page once.

</td>

</tr>

`

}


</table>

</div>

`;

}


/* =====================================================
RENDER DETECTED
===================================================== */

function renderDetected(){

if(
$('#acStatRows')
){

$('#acStatRows').innerHTML =

mini(
scan.filter(isStats),
'stats'
);

}


if(
$('#acAnalyticsRows')
){

$('#acAnalyticsRows').innerHTML =

mini(
scan.filter(isAnalytics),
'analytics'
);

}

}


/* =====================================================
SAVE QUICK
===================================================== */

async function saveQuick(
selector,
property,
value
){

const old =

activeOverrides.find(
r =>

r.page_slug ===
$('#acPage').value

&&

r.selector ===
selector

&&

r.property ===
property

&&

r.deleted_at == null
);


const obj = {

page_slug:
$('#acPage').value,

selector,

property,

value:
String(
value ??
''
),

sort_order:
0,

status:
'published',

updated_at:
new Date()
.toISOString(),

deleted_at:
null

};


const z =

old

?

await client
.from(
'admin_cms_overrides'
)
.update(obj)
.eq(
'id',
old.id
)

:

await client
.from(
'admin_cms_overrides'
)
.insert(obj);


if(z.error){

alert(
z.error.message
);

return false;

}


return true;

}


/* =====================================================
REFRESH AFTER SAVE
===================================================== */

async function refreshAfterChange(
message
){

await overrides();

renderDetected();

toast(message);

}


/* =====================================================
RESTORE ORIGINAL
===================================================== */

async function restoreOriginal(
selector
){

const ids =

activeOverrides

.filter(
r =>

r.page_slug ===
$('#acPage').value

&&

(

r.selector ===
selector

||

r.selector.startsWith(
selector +
' '
)

)

)

.map(
r =>
r.id
);


if(
!ids.length
){

toast(
'Original element already active'
);

return;

}


const {
error
} =

await client
.from(
'admin_cms_overrides'
)
.update({

deleted_at:
new Date()
.toISOString(),

updated_at:
new Date()
.toISOString()

})
.in(
'id',
ids
);


if(error){

alert(
error.message
);

return;

}


await overrides();

await trash();

renderDetected();


toast(
'Original dashboard item restored'
);

}


/* =====================================================
OPEN COLOR EDITOR
===================================================== */

function openColorEditor(
group,
selector
){

const item =

scan.find(
x =>
x.selector ===
selector
);


if(!item){

return;

}


const child =
iconSelector(
selector,
group
);


if(
group ===
'stats'
){

$('#acStatColorSelector').value =
selector;


$('#acStatColorItem').value =
item.label;


$('#acStatBgColor').value =

normaliseColor(

getOverrideValue(
selector,
'style.backgroundColor',
item.values[
'style.backgroundColor'
]
),

'#ffffff'

);


$('#acStatTextColor').value =

normaliseColor(

getOverrideValue(
selector,
'style.color',
item.values[
'style.color'
]
),

'#0f172a'

);


$('#acStatBorderColor').value =

normaliseColor(

getOverrideValue(
selector,
'style.borderColor',
item.values[
'style.borderColor'
]
),

'#e2e8f0'

);


$('#acStatIconColor').value =

normaliseColor(

getOverrideValue(
child,
'style.color',
''
),

'#4f46e5'

);


$('#acStatColorEditor')
.style.display =
'block';


$('#acStatColorEditor')
.scrollIntoView({

behavior:
'smooth',

block:
'start'

});

}


else{


$('#acAnalyticsColorSelector').value =
selector;


$('#acAnalyticsColorItem').value =
item.label;


$('#acAnalyticsBgColor').value =

normaliseColor(

getOverrideValue(
selector,
'style.backgroundColor',
item.values[
'style.backgroundColor'
]
),

'#ffffff'

);


$('#acAnalyticsTextColor').value =

normaliseColor(

getOverrideValue(
selector,
'style.color',
item.values[
'style.color'
]
),

'#0f172a'

);


$('#acAnalyticsBorderColor').value =

normaliseColor(

getOverrideValue(
selector,
'style.borderColor',
item.values[
'style.borderColor'
]
),

'#e2e8f0'

);


$('#acAnalyticsIconColor').value =

normaliseColor(

getOverrideValue(
child,
'style.color',
''
),

'#4f46e5'

);


$('#acAnalyticsColorEditor')
.style.display =
'block';


$('#acAnalyticsColorEditor')
.scrollIntoView({

behavior:
'smooth',

block:
'start'

});

}

}


/* =====================================================
SAVE COLOR SET
===================================================== */

async function saveColorSet(
group,
selector,
background,
text,
border,
icon
){

if(!selector){

alert(
'Choose an item.'
);

return;

}


const ok1 =
await saveQuick(
selector,
'style.backgroundColor',
background
);


if(!ok1)return;


const ok2 =
await saveQuick(
selector,
'style.color',
text
);


if(!ok2)return;


const ok3 =
await saveQuick(
selector,
'style.borderColor',
border
);


if(!ok3)return;


const child =
iconSelector(
selector,
group
);


const ok4 =
await saveQuick(
child,
'style.color',
icon
);


if(!ok4)return;


await refreshAfterChange(

group ===
'stats'

?
'Statistic / Card colours updated'

:
'Analytics / Chart colours updated'

);

}


/* =====================================================
RESTORE COLOR SET
===================================================== */

async function restoreColorSet(
group,
selector
){

if(!selector){

return;

}


const child =
iconSelector(
selector,
group
);


const ids =

activeOverrides

.filter(
r =>

r.page_slug ===
$('#acPage').value

&&

(

(
r.selector ===
selector

&&

[
'style.backgroundColor',
'style.color',
'style.borderColor'
]
.includes(
r.property
)
)

||

(
r.selector ===
child

&&

r.property ===
'style.color'
)

)

)

.map(
r =>
r.id
);


if(
!ids.length
){

toast(
'Original colours already active'
);

return;

}


const {
error
} =

await client
.from(
'admin_cms_overrides'
)
.update({

deleted_at:
new Date()
.toISOString(),

updated_at:
new Date()
.toISOString()

})
.in(
'id',
ids
);


if(error){

alert(
error.message
);

return;

}


await overrides();

await trash();

renderDetected();


toast(
'Original colours restored'
);

}


/* =====================================================
CARD BUTTON ACTIONS
===================================================== */

document
.addEventListener(
'click',
async e => {

const b =

e.target.closest(

'[data-pick],[data-hide],[data-remove],[data-original],[data-moveup],[data-movedown],[data-color]'

);


if(!b)return;


/* COLOR */

if(
b.dataset.color
){

openColorEditor(

b.dataset.colorGroup,

b.dataset.color

);

return;

}


/* EDIT */

if(
b.dataset.pick
){

$('#acSelector').value =
b.dataset.pick;


updatePropertyOptions();

loadCurrentValue();


document
.querySelector(
'[data-a="elements"]'
)
.click();


return;

}


/* HIDE */

if(
b.dataset.hide
){

const sel =
b.dataset.hide;


const hidden =

activeOverrides.find(
r =>

r.page_slug ===
$('#acPage').value

&&

r.selector ===
sel

&&

r.property ===
'hidden'

&&

r.value ===
'true'
);


await saveQuick(

sel,

'hidden',

hidden
?
'false'
:
'true'

);


await refreshAfterChange(
'Visibility updated'
);


return;

}


/* MOVE */

if(
b.dataset.moveup ||
b.dataset.movedown
){

const sel =

b.dataset.moveup

||

b.dataset.movedown;


const source =
scan.filter(
x =>
isStats(x) ||
isAnalytics(x)
);


let order =

currentOrder(
sel,
source
)

+

(
b.dataset.moveup
?
-1
:
1
);


await saveQuick(
sel,
'style.order',
order
);


await refreshAfterChange(
'Order updated'
);


return;

}


/* DELETE */

if(
b.dataset.remove
){

if(
confirm(
'Delete this item from the live Admin Dashboard? It will remain recoverable with Restore.'
)
){

await saveQuick(
b.dataset.remove,
'remove',
'true'
);


await refreshAfterChange(
'Dashboard item deleted'
);

}


return;

}


/* RESTORE */

if(
b.dataset.original
){

if(
confirm(
'Restore this Admin Dashboard item to its original file version?'
)
){

await restoreOriginal(
b.dataset.original
);

}

}

}
);


/* =====================================================
STAT COLOR FORM
===================================================== */

$('#acStatColorForm')
.onsubmit =
async e => {

e.preventDefault();


await saveColorSet(

'stats',

$('#acStatColorSelector').value,

$('#acStatBgColor').value,

$('#acStatTextColor').value,

$('#acStatBorderColor').value,

$('#acStatIconColor').value

);

};


$('#acStatColorRestore')
.onclick =
() =>

restoreColorSet(

'stats',

$('#acStatColorSelector').value

);


$('#acStatColorClose')
.onclick =
() => {

$('#acStatColorEditor')
.style.display =
'none';

};


/* =====================================================
ANALYTICS COLOR FORM
===================================================== */

$('#acAnalyticsColorForm')
.onsubmit =
async e => {

e.preventDefault();


await saveColorSet(

'analytics',

$('#acAnalyticsColorSelector').value,

$('#acAnalyticsBgColor').value,

$('#acAnalyticsTextColor').value,

$('#acAnalyticsBorderColor').value,

$('#acAnalyticsIconColor').value

);

};


$('#acAnalyticsColorRestore')
.onclick =
() =>

restoreColorSet(

'analytics',

$('#acAnalyticsColorSelector').value

);


$('#acAnalyticsColorClose')
.onclick =
() => {

$('#acAnalyticsColorEditor')
.style.display =
'none';

};


/* =====================================================
ELEMENT EVENTS
===================================================== */

$('#acSelector')
.onchange =
() => {

updatePropertyOptions();

loadCurrentValue();

};


$('#acProperty')
.onchange =
() => {

updateValueMode();

loadCurrentValue();

};


$('#acPage')
.onchange =
scanPage;


/* =====================================================
OVERRIDES
===================================================== */

async function overrides(){

const {
data,
error
} =

await client
.from(
'admin_cms_overrides'
)
.select('*')
.is(
'deleted_at',
null
)
.order(
'updated_at',
{
ascending:false
}
);


if(error){

throw error;

}


activeOverrides =
data || [];


const rows =
activeOverrides;


$('#acRows').innerHTML = `

<div class="cms-table-wrap">

<table class="cms-table">

<tr>

<th>
Page
</th>

<th>
Element
</th>

<th>
Property
</th>

<th>
Value
</th>

<th>
Status
</th>

<th>
Actions
</th>

</tr>


${

rows.map(
r => `

<tr>

<td>
${esc(r.page_slug)}
</td>

<td>
<code>
${esc(r.selector)}
</code>
</td>

<td>
${esc(r.property)}
</td>

<td>
${esc(
String(
r.value ??
''
)
.slice(
0,
70
)
)}
</td>

<td>
${esc(r.status)}
</td>

<td>

<button
class="cms-btn gray"
data-oe="${r.id}">

Edit

</button>


<button
class="cms-btn red"
data-od="${r.id}">

Delete Change

</button>

</td>

</tr>

`
)

.join('')

||

`

<tr>

<td colspan="6">

No Admin Dashboard changes yet.

</td>

</tr>

`

}

</table>

</div>

`;


/* EDIT OVERRIDE */

$$(
'[data-oe]'
)
.forEach(
b =>

b.onclick =
async () => {

const r =
rows.find(
x =>
x.id ===
b.dataset.oe
);


$('#acId').value =
r.id;


$('#acPage').value =
r.page_slug;


await scanPage();


$('#acSelector').value =
r.selector;


updatePropertyOptions(
r.property
);


$('#acValue').value =
r.value ||
'';


$('#acSort').value =
r.sort_order ||
0;


$('#acStatus').value =
r.status;

}
);


/* DELETE CHANGE */

$$(
'[data-od]'
)
.forEach(
b =>

b.onclick =
async () => {

if(
!confirm(
'Remove this CMS change and restore the original dashboard value?'
)
){

return;

}


await client
.from(
'admin_cms_overrides'
)
.update({

deleted_at:
new Date()
.toISOString(),

updated_at:
new Date()
.toISOString()

})
.eq(
'id',
b.dataset.od
);


await overrides();

await trash();

renderDetected();

}
);


renderDetected();

}


/* =====================================================
ELEMENT FORM SAVE
===================================================== */

$('#acElementForm')
.onsubmit =
async e => {

e.preventDefault();


const id =
$('#acId').value;


const p =
$('#acProperty').value;


if(
!$('#acSelector').value
){

alert(
'Choose an Admin Dashboard element.'
);

return;

}


const obj = {

page_slug:
$('#acPage').value,

selector:
$('#acSelector').value,

property:
p,

value:
p ===
'remove'

?
'true'

:
$('#acValue').value,

sort_order:
+$('#acSort').value ||
0,

status:
$('#acStatus').value,

updated_at:
new Date()
.toISOString(),

deleted_at:
null

};


const z =

id

?

await client
.from(
'admin_cms_overrides'
)
.update(obj)
.eq(
'id',
id
)

:

await client
.from(
'admin_cms_overrides'
)
.insert(obj);


if(z.error){

alert(
z.error.message
);

return;

}


toast(
'Admin Dashboard updated'
);


$('#acId').value =
'';


await overrides();

renderDetected();

};


/* =====================================================
RESTORE ORIGINAL BUTTON
===================================================== */

$('#acRestoreOriginal')
.onclick =
() => {

const s =
$('#acSelector').value;


if(!s){

alert(
'Choose an Admin Dashboard element.'
);

return;

}


restoreOriginal(s);

};


/* =====================================================
CLEAR FORM
===================================================== */

$('#acClear')
.onclick =
() => {

$('#acElementForm')
.reset();


$('#acId').value =
'';


scanPage();

};


/* =====================================================
SYNC ORIGINAL MENU
===================================================== */

async function syncMenu(){

try{

const [

res,

existingRes

] =

await Promise.all([

fetch(
'admin.html',
{
cache:'no-store'
}
),

client
.from(
'admin_cms_menu'
)
.select('*')

]);


if(!res.ok){

throw new Error(
'admin.html returned ' +
res.status
);

}


const doc =

new DOMParser()
.parseFromString(
await res.text(),
'text/html'
);


const source =

[
...doc.querySelectorAll(
'.admin-v3-sidebar-nav a'
)
]

.map(
(a,i) => {

const sp =
a.querySelector(
'span'
);


const full =

(
a.textContent ||
''
)

.replace(
/\s+/g,
' '
)

.trim();


const label =

(
sp?.textContent
||
full
)

.trim();


const icon =

full
.slice(
0,
Math.max(
0,
full.indexOf(label)
)
)

.trim();


return {

label,

icon,

url:
a.getAttribute(
'href'
)
||
'#',

sort_order:
i,

is_visible:
true

};

}
);


const existing =
existingRes.data ||
[];


const missing =

source.filter(
src =>

!existing.some(
x =>

x.url ===
src.url

||

x.label ===
src.label

)
);


if(
missing.length
){

const {
error
} =

await client
.from(
'admin_cms_menu'
)
.insert(
missing
);


if(error){

throw error;

}

}


}catch(e){

console.warn(
'Admin menu sync:',
e
);

}

}


/* =====================================================
MENU LIST
===================================================== */

async function menus(){

const {
data,
error
} =

await client
.from(
'admin_cms_menu'
)
.select('*')
.is(
'deleted_at',
null
)
.order(
'sort_order'
);


if(error){

throw error;

}


const rows =
data || [];


$('#acMenuRows').innerHTML = `

<div class="cms-table-wrap">

<table class="cms-table">

<tr>

<th>
Label
</th>

<th>
Destination
</th>

<th>
Order
</th>

<th>
Visible
</th>

<th>
Actions
</th>

</tr>


${

rows.map(
r => `

<tr>

<td>

${esc(r.icon || '')}

${esc(r.label)}

</td>


<td>
${esc(r.url)}
</td>


<td>
${r.sort_order}
</td>


<td>
${r.is_visible ? 'Yes' : 'No'}
</td>


<td>

<button
class="cms-btn gray"
data-me="${r.id}">

Edit

</button>


<button
class="cms-btn gold"
data-mv="${r.id}">

${r.is_visible ? 'Hide' : 'Show'}

</button>


<button
class="cms-btn red"
data-md="${r.id}">

Delete

</button>

</td>

</tr>

`
)

.join('')

}

</table>

</div>

`;


/* MENU EDIT */

$$(
'[data-me]'
)
.forEach(
b =>

b.onclick =
() => {

const r =
rows.find(
x =>
x.id ===
b.dataset.me
);


$('#acMenuId').value =
r.id;


$('#acMenuLabel').value =
r.label;


$('#acMenuIcon').value =
r.icon ||
'';


$('#acMenuUrl').value =
r.url;


$('#acMenuSort').value =
r.sort_order;


$('#acMenuVisible').value =
String(
r.is_visible
);

}
);


/* MENU VISIBILITY */

$$(
'[data-mv]'
)
.forEach(
b =>

b.onclick =
async () => {

const r =
rows.find(
x =>
x.id ===
b.dataset.mv
);


await client
.from(
'admin_cms_menu'
)
.update({

is_visible:
!r.is_visible,

updated_at:
new Date()
.toISOString()

})
.eq(
'id',
r.id
);


menus();

}
);


/* MENU DELETE */

$$(
'[data-md]'
)
.forEach(
b =>

b.onclick =
async () => {

if(
!confirm(
'Delete this Admin Dashboard menu item? It can be restored from Recycle Bin.'
)
){

return;

}


await client
.from(
'admin_cms_menu'
)
.update({

deleted_at:
new Date()
.toISOString(),

updated_at:
new Date()
.toISOString()

})
.eq(
'id',
b.dataset.md
);


menus();

trash();

}
);

}


/* =====================================================
MENU SAVE
===================================================== */

$('#acMenuForm')
.onsubmit =
async e => {

e.preventDefault();


const id =
$('#acMenuId').value;


const obj = {

label:
$('#acMenuLabel').value,

icon:
$('#acMenuIcon').value,

url:
$('#acMenuUrl').value,

sort_order:
+$('#acMenuSort').value ||
0,

is_visible:
$('#acMenuVisible').value ===
'true',

updated_at:
new Date()
.toISOString(),

deleted_at:
null

};


const z =

id

?

await client
.from(
'admin_cms_menu'
)
.update(obj)
.eq(
'id',
id
)

:

await client
.from(
'admin_cms_menu'
)
.insert(obj);


if(z.error){

alert(
z.error.message
);

return;

}


toast(
'Admin menu saved'
);


e.target.reset();


$('#acMenuId').value =
'';


menus();

};


/* =====================================================
ADMIN THEME
UNCHANGED
===================================================== */

function ts(){

return {

primary:
$('#acThemePrimary').value,

secondary:
$('#acThemeSecondary').value,

background:
$('#acThemeBg').value,

card:
$('#acThemeCard').value,

text:
$('#acThemeText').value,

radius:
$('#acThemeRadius').value,

custom_css:
$('#acThemeCss').value

};

}


async function themes(){

const {
data,
error
} =

await client
.from(
'admin_cms_themes'
)
.select('*')
.is(
'deleted_at',
null
)
.order(
'updated_at',
{
ascending:false
}
);


if(error){

throw error;

}


const rows =
data || [];


$('#acThemeRows').innerHTML = `

<div class="cms-table-wrap">

<table class="cms-table">

<tr>

<th>
Name
</th>

<th>
Status
</th>

<th>
Actions
</th>

</tr>


${

rows.map(
r => `

<tr>

<td>
${esc(r.name)}
</td>


<td>

${r.is_active ? 'ACTIVE' : 'Saved'}

</td>


<td>

<button
class="cms-btn green"
data-tap="${r.id}">

Apply

</button>


<button
class="cms-btn gray"
data-ted="${r.id}">

Edit

</button>


<button
class="cms-btn red"
data-tdel="${r.id}"
${r.is_active ? 'disabled' : ''}>

Delete

</button>

</td>

</tr>

`
)

.join('')

}

</table>

</div>

`;


/* APPLY THEME */

$$(
'[data-tap]'
)
.forEach(
b =>

b.onclick =
async () => {

await client
.from(
'admin_cms_themes'
)
.update({
is_active:false
})
.eq(
'is_active',
true
);


await client
.from(
'admin_cms_themes'
)
.update({
is_active:true
})
.eq(
'id',
b.dataset.tap
);


toast(
'Admin theme applied'
);


themes();

}
);


/* EDIT THEME */

$$(
'[data-ted]'
)
.forEach(
b =>

b.onclick =
() => {

const r =
rows.find(
x =>
x.id ===
b.dataset.ted
);


const x =
r.settings ||
{};


$('#acThemeId').value =
r.id;


$('#acThemeName').value =
r.name;


$('#acThemePrimary').value =
x.primary ||
'#4f46e5';


$('#acThemeSecondary').value =
x.secondary ||
'#7c3aed';


$('#acThemeBg').value =
x.background ||
'#f8fafc';


$('#acThemeCard').value =
x.card ||
'#fff';


$('#acThemeText').value =
x.text ||
'#0f172a';


$('#acThemeRadius').value =
x.radius ||
'16px';


$('#acThemeCss').value =
x.custom_css ||
'';

}
);


/* DELETE THEME */

$$(
'[data-tdel]'
)
.forEach(
b =>

b.onclick =
async () => {

if(
!confirm(
'Delete saved admin theme?'
)
){

return;

}


await client
.from(
'admin_cms_themes'
)
.update({

deleted_at:
new Date()
.toISOString()

})
.eq(
'id',
b.dataset.tdel
)
.eq(
'is_active',
false
);


themes();

trash();

}
);

}


/* =====================================================
SAVE THEME
===================================================== */

async function saveTheme(
active=false,
update=false
){

let id =
$('#acThemeId').value;


if(active){

await client
.from(
'admin_cms_themes'
)
.update({
is_active:false
})
.eq(
'is_active',
true
);

}


let obj = {

name:
$('#acThemeName').value
||
'Admin Theme',

settings:
ts(),

is_active:
active,

updated_at:
new Date()
.toISOString(),

deleted_at:
null

};


let z =

update &&
id

?

await client
.from(
'admin_cms_themes'
)
.update(obj)
.eq(
'id',
id
)

:

await client
.from(
'admin_cms_themes'
)
.insert(obj);


if(z.error){

alert(
z.error.message
);

return;

}


toast(

active

?
'Admin theme applied live'

:

update

?
'Admin theme updated'

:

'Admin theme saved'

);


themes();

}


$('#acThemeSave')
.onclick =
() =>
saveTheme(
false,
false
);


$('#acThemeUpdate')
.onclick =
() =>
saveTheme(
false,
true
);


$('#acThemeForm')
.onsubmit =
e => {

e.preventDefault();

saveTheme(
true,
false
);

};


$('#acThemeDefault')
.onclick =
async () => {

if(
!confirm(
'Restore default Admin Dashboard theme?'
)
){

return;

}


$('#acThemePrimary').value =
'#4f46e5';


$('#acThemeSecondary').value =
'#7c3aed';


$('#acThemeBg').value =
'#f8fafc';


$('#acThemeCard').value =
'#ffffff';


$('#acThemeText').value =
'#0f172a';


$('#acThemeRadius').value =
'16px';


$('#acThemeCss').value =
'';


saveTheme(
true,
false
);

};


/* =====================================================
RECYCLE BIN
===================================================== */

async function trash(){

let [

a,

m,

t

] =

await Promise.all([

client
.from(
'admin_cms_overrides'
)
.select('*')
.not(
'deleted_at',
'is',
null
),

client
.from(
'admin_cms_menu'
)
.select('*')
.not(
'deleted_at',
'is',
null
),

client
.from(
'admin_cms_themes'
)
.select('*')
.not(
'deleted_at',
'is',
null
)

]);


const rows = [

...(
a.data ||
[]
)
.map(
x => ({
...x,

table:
'admin_cms_overrides',

label:
`${x.page_slug} · ${x.selector} · ${x.property}`

})
),


...(
m.data ||
[]
)
.map(
x => ({
...x,

table:
'admin_cms_menu',

label:
x.label

})
),


...(
t.data ||
[]
)
.map(
x => ({
...x,

table:
'admin_cms_themes',

label:
x.name

})
)

];


$('#acTrashRows').innerHTML = `

<div class="cms-table-wrap">

<table class="cms-table">

<tr>

<th>
Type
</th>

<th>
Item
</th>

<th>
Actions
</th>

</tr>


${

rows.map(
r => `

<tr>

<td>
${esc(r.table)}
</td>


<td>
${esc(r.label)}
</td>


<td>

<button
class="cms-btn green"
data-rs="${r.table}|${r.id}">

Restore

</button>


<button
class="cms-btn red"
data-rp="${r.table}|${r.id}">

Delete Forever

</button>

</td>

</tr>

`
)

.join('')

||

`

<tr>

<td colspan="3">

Recycle Bin is empty.

</td>

</tr>

`

}

</table>

</div>

`;


/* RESTORE */

$$(
'[data-rs]'
)
.forEach(
b =>

b.onclick =
async () => {

let [
table,
id
] =
b.dataset.rs
.split('|');


const {
error
} =

await client
.from(table)
.update({

deleted_at:
null,

updated_at:
new Date()
.toISOString()

})
.eq(
'id',
id
);


if(error){

alert(
error.message
);

return;

}


toast(
'Restored'
);


load();

}
);


/* DELETE FOREVER */

$$(
'[data-rp]'
)
.forEach(
b =>

b.onclick =
async () => {

if(
!confirm(
'Delete forever? This cannot be undone.'
)
){

return;

}


let [
table,
id
] =
b.dataset.rp
.split('|');


const {
error
} =

await client
.from(table)
.delete()
.eq(
'id',
id
);


if(error){

alert(
error.message
);

return;

}


toast(
'Deleted forever'
);


load();

}
);

}


/* =====================================================
LOAD
===================================================== */

async function load(){

await syncMenu();


await Promise.all([

overrides(),

menus(),

themes(),

trash()

]);


await scanPage();

}


/* =====================================================
INIT
===================================================== */

async function init(){

await check();

load();

}


if(
document.readyState ===
'loading'
){

document.addEventListener(
'DOMContentLoaded',
init
);

}

else{

init();

}


})();