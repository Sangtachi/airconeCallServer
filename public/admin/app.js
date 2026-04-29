const tabs = [
  { id: 'members', name: '회원관리', list: '/api/admin/members', create: '/api/admin/members' },
  { id: 'technicians', name: '기사관리', list: '/api/admin/technicians', create: '/api/admin/technicians' },
  { id: 'onboarding', name: '기사등록/승인', list: '/api/admin/technician-onboarding' },
  { id: 'bookings', name: '접수/배차', list: '/api/admin/bookings', create: '/api/admin/bookings' },
  { id: 'rewards', name: '리워드/쿠폰', list: '/api/admin/coupons', create: '/api/admin/coupons' },
  { id: 'settlements', name: '결제/정산', list: '/api/admin/settlements' },
];

let active = tabs[0];
let rows = [];
let selected = null;

const $tabs = document.getElementById('tabs');
const $title = document.getElementById('title');
const $list = document.getElementById('list');
const $detail = document.getElementById('detail');
const $actions = document.getElementById('actions');
const $toolbar = document.getElementById('toolbar');
const $role = document.getElementById('role');

function headers(extra = {}) {
  return { 'Content-Type': 'application/json', 'x-admin-role': $role.value, ...extra };
}

async function req(url, opt = {}) {
  const res = await fetch(url, { ...opt, headers: headers(opt.headers || {}) });
  const json = await res.json();
  if (!json.ok) throw new Error(JSON.stringify(json.error));
  return json.data;
}

function renderTabs() {
  $tabs.innerHTML = tabs.map(t => `<button class="tab-btn ${t.id===active.id?'active':''}" data-id="${t.id}">${t.name}</button>`).join('');
  $tabs.querySelectorAll('button').forEach(btn => btn.onclick = () => { active = tabs.find(t=>t.id===btn.dataset.id); load(); });
}

function tableForRows(items) {
  if (!items.length) return '<p class="muted">데이터 없음</p>';
  const keys = Object.keys(items[0]).slice(0, 6);
  return `<table><thead><tr>${keys.map(k=>`<th>${k}</th>`).join('')}</tr></thead><tbody>${
    items.map((r,i)=>`<tr data-i="${i}">${keys.map(k=>`<td>${typeof r[k]==='string'&&r[k].length>24?r[k].slice(0,24)+'...':r[k]}</td>`).join('')}</tr>`).join('')
  }</tbody></table>`;
}

function renderToolbar() {
  let html = '';
  if (active.create) html += `<button class="primary" id="btnCreate">생성</button>`;
  if (active.id === 'bookings') html += `<button id="btnRefresh">리프레시</button>`;
  $toolbar.className = 'toolbar';
  $toolbar.innerHTML = html;
  const c = document.getElementById('btnCreate');
  if (c) c.onclick = onCreate;
  const r = document.getElementById('btnRefresh');
  if (r) r.onclick = load;
}

function renderActions() {
  $actions.className = 'actions';
  if (!selected) { $actions.innerHTML = '<span class="muted">행을 선택하면 액션 버튼이 나옵니다.</span>'; return; }
  if (active.id === 'members') {
    $actions.innerHTML = `<button data-s="active">활성</button><button data-s="inactive">비활성</button><button data-s="banned">차단</button>`;
    $actions.querySelectorAll('button').forEach(b=>b.onclick=()=>patch(`${active.list}/${selected.id}`,{status:b.dataset.s}));
  } else if (active.id === 'technicians') {
    $actions.innerHTML = `<button data-s="approved">승인</button><button data-s="suspended">정지</button>`;
    $actions.querySelectorAll('button').forEach(b=>b.onclick=()=>patch(`${active.list}/${selected.id}`,{status:b.dataset.s}));
  } else if (active.id === 'onboarding') {
    $actions.innerHTML = `<button data-s="reviewing">검토중</button><button data-s="approved">승인</button><button data-s="rejected">반려</button>`;
    $actions.querySelectorAll('button').forEach(b=>b.onclick=()=>post(`/api/admin/technician-onboarding/${selected.id}/review`,{status:b.dataset.s}));
  } else if (active.id === 'bookings') {
    $actions.innerHTML = `<button id="toMatching">matching</button><button id="assign">기사배정 t_1</button><button id="unassign">배정해제</button>`;
    document.getElementById('toMatching').onclick=()=>patch(`/api/admin/bookings/${selected.id}/status`,{toStatus:'matching'});
    document.getElementById('assign').onclick=()=>post(`/api/admin/bookings/${selected.id}/assign-technician`,{technicianId:'t_1'});
    document.getElementById('unassign').onclick=()=>post(`/api/admin/bookings/${selected.id}/unassign-technician`,{});
  } else if (active.id === 'rewards') {
    $actions.innerHTML = `<button data-s="active">활성</button><button data-s="cancelled">취소</button>`;
    $actions.querySelectorAll('button').forEach(b=>b.onclick=()=>patch(`/api/admin/coupons/${selected.id}`,{status:b.dataset.s}));
  } else if (active.id === 'settlements') {
    $actions.innerHTML = `<button>정산확정</button><button>지급완료</button><button>보류</button>`;
    const [a,b,c] = $actions.querySelectorAll('button');
    a.onclick=()=>post(`/api/admin/settlements/${selected.id}/confirm`,{adjustmentAmount:0});
    b.onclick=()=>patch(`/api/admin/settlements/${selected.id}/status`,{status:'paid'});
    c.onclick=()=>patch(`/api/admin/settlements/${selected.id}/status`,{status:'held'});
  }
}

async function onCreate() {
  try {
    if (active.id === 'members') await post(active.create, { name:'신규회원', phone:'01000001111' });
    if (active.id === 'technicians') await post(active.create, { name:'신규기사', phone:'01022223333', baseRegion:'경기 고양' });
    if (active.id === 'bookings') await post(active.create, { customerName:'신규접수', customerPhone:'01033334444', region:'경기 고양시', symptomCode:'water_leak' });
    if (active.id === 'rewards') await post(active.create, { userId:'m_1', couponType:'manual', amount:5000 });
    await load();
  } catch (e) { alert(e.message); }
}

async function post(url, body) { await req(url, { method:'POST', body: JSON.stringify(body) }); await load(); }
async function patch(url, body) { await req(url, { method:'PATCH', body: JSON.stringify(body) }); await load(); }

async function load() {
  renderTabs();
  $title.textContent = active.name;
  renderToolbar();
  try {
    rows = await req(active.list);
    selected = rows[0] || null;
    $list.innerHTML = tableForRows(rows);
    $list.querySelectorAll('tr[data-i]').forEach((tr)=>tr.onclick=()=>{
      selected = rows[Number(tr.dataset.i)];
      $detail.textContent = JSON.stringify(selected, null, 2);
      renderActions();
    });
    $detail.textContent = JSON.stringify(selected, null, 2);
    renderActions();
  } catch (e) {
    $list.innerHTML = `<p class="muted">오류: ${e.message}</p>`;
    $detail.textContent = '';
    $actions.innerHTML = '';
  }
}

$role.onchange = load;
load();
