const opts = (pairs) => pairs.map(([v, l]) => ({ value: v, label: l || v }));

const memberStatusOptions = opts([['active', '활성'], ['inactive', '비활성'], ['banned', '차단']]);
const sellerStatusOptions = opts([['pending', '대기'], ['reviewing', '검토중'], ['approved', '승인'], ['rejected', '반려'], ['suspended', '정지']]);
const technicianStatusOptions = opts([['pending', '대기'], ['reviewing', '검토중'], ['approved', '승인'], ['rejected', '반려'], ['suspended', '정지']]);

const accountViews = {
  customers: {
    id: 'customers',
    name: '회원',
    list: '/api/admin/members',
    create: '/api/admin/members',
    filterRows: (items) => items.filter((r) => r.role === 'customer'),
    createDefaults: { role: 'customer' },
    formCreate: [
      { key: 'name', label: '이름', type: 'text', required: true },
      { key: 'phone', label: '전화번호', type: 'text', required: true },
      { key: 'password', label: '초기 비밀번호', type: 'password', required: true, minLength: 5 },
    ],
    formEdit: [
      { key: 'name', label: '이름', type: 'text' },
      { key: 'phone', label: '전화번호', type: 'text' },
      { key: 'password', label: '비밀번호 변경(비우면 유지)', type: 'password', minLength: 5 },
      { key: 'status', label: '상태', type: 'select', options: memberStatusOptions },
      { key: 'marketingConsent', label: '마케팅 수신 동의', type: 'checkbox' },
      { key: 'memo', label: '메모', type: 'textarea' },
    ],
  },
  sellers: {
    id: 'sellers',
    name: '판매자',
    list: '/api/admin/sellers',
    create: '/api/admin/sellers',
    formCreate: [
      { key: 'ownerName', label: '담당자명', type: 'text', required: true },
      { key: 'phone', label: '전화번호', type: 'text', required: true },
      { key: 'password', label: '초기 비밀번호', type: 'password', required: true, minLength: 5 },
      { key: 'companyName', label: '상호명', type: 'text', required: true },
      { key: 'businessNumber', label: '사업자번호', type: 'text' },
      { key: 'productCategory', label: '취급 품목', type: 'text' },
      { key: 'status', label: '상태', type: 'select', options: opts([['approved', '승인'], ['pending', '대기'], ['reviewing', '검토중'], ['rejected', '반려'], ['suspended', '정지']]) },
      { key: 'memo', label: '메모', type: 'textarea' },
    ],
    formEdit: [
      { key: 'ownerName', label: '담당자명', type: 'text' },
      { key: 'phone', label: '전화번호', type: 'text' },
      { key: 'password', label: '비밀번호 변경(비우면 유지)', type: 'password', minLength: 5 },
      { key: 'companyName', label: '상호명', type: 'text' },
      { key: 'businessNumber', label: '사업자번호', type: 'text' },
      { key: 'productCategory', label: '취급 품목', type: 'text' },
      { key: 'status', label: '상태', type: 'select', options: sellerStatusOptions },
      { key: 'memo', label: '메모', type: 'textarea' },
    ],
  },
  technicians: {
    id: 'technicians',
    name: '기사',
    list: '/api/admin/technicians',
    create: '/api/admin/technicians',
    formCreate: [
      { key: 'name', label: '이름', type: 'text', required: true },
      { key: 'phone', label: '전화번호', type: 'text', required: true },
      { key: 'password', label: '초기 비밀번호', type: 'password', required: true, minLength: 5 },
      { key: 'baseRegion', label: '활동 지역', type: 'text' },
    ],
    formEdit: [
      { key: 'name', label: '이름', type: 'text' },
      { key: 'phone', label: '전화번호', type: 'text' },
      { key: 'password', label: '비밀번호 변경(비우면 유지)', type: 'password', minLength: 5 },
      { key: 'baseRegion', label: '활동 지역', type: 'text' },
      { key: 'status', label: '상태', type: 'select', options: technicianStatusOptions },
    ],
  },
  admins: {
    id: 'admins',
    name: '관리자',
    list: '/api/admin/members',
    create: '/api/admin/members',
    filterRows: (items) => items.filter((r) => r.role === 'admin' || r.role === 'super_admin'),
    formCreate: [
      { key: 'name', label: '이름', type: 'text', required: true },
      { key: 'phone', label: '전화번호', type: 'text', required: true },
      { key: 'password', label: '초기 비밀번호', type: 'password', required: true, minLength: 5 },
      { key: 'role', label: '권한', type: 'select', options: opts([['admin', '관리자'], ['super_admin', '슈퍼관리자']]) },
    ],
    formEdit: [
      { key: 'name', label: '이름', type: 'text' },
      { key: 'phone', label: '전화번호', type: 'text' },
      { key: 'password', label: '비밀번호 변경(비우면 유지)', type: 'password', minLength: 5 },
      { key: 'role', label: '권한', type: 'select', options: opts([['admin', '관리자'], ['super_admin', '슈퍼관리자']]) },
      { key: 'status', label: '상태', type: 'select', options: memberStatusOptions },
      { key: 'memo', label: '메모', type: 'textarea' },
    ],
  },
};

const tabs = [
  {
    id: 'accounts',
    name: '전체 회원관리',
    accountHub: true,
  },
  {
    id: 'onboarding',
    name: '기사등록/승인',
    list: '/api/admin/technician-onboarding',
    patchBase: '/api/admin/technician-onboarding',
    formCreate: null,
    formEdit: [
      { key: 'name', label: '이름', type: 'text' },
      { key: 'phone', label: '전화번호', type: 'text' },
    ],
  },
  {
    id: 'bookings',
    name: '주문/배차',
    list: '/api/admin/customer-orders',
    create: '/api/admin/bookings',
    patchBase: '/api/admin/customer-orders',
    bulkDelete: false,
    selectable: false,
    formCreate: [
      { key: 'customerName', label: '고객명', type: 'text', required: true },
      { key: 'customerPhone', label: '고객 전화', type: 'text', required: true },
      { key: 'region', label: '지역', type: 'text', required: true },
      { key: 'symptomCode', label: '접수 유형 코드', type: 'text', required: true },
    ],
    formEdit: [
      {
        key: 'orderStatus',
        label: '주문 상태',
        type: 'select',
        options: opts([
          ['created', '생성(미결제)'],
          ['payment_pending', '결제대기'],
          ['paid', '결제표시만'],
          ['matching', '매칭중'],
          ['assigned', '배정'],
          ['accepted', '수락'],
          ['on_the_way', '출발'],
          ['arrived', '도착'],
          ['diagnosed', '진단'],
          ['extra_payment_pending', '추가금대기'],
          ['working', '작업중'],
          ['completed', '완료'],
          ['settlement_pending', '정산대기'],
          ['settled', '정산완료'],
          ['cancelled', '취소'],
          ['refunded', '환불'],
        ]),
      },
      { key: 'assignedTechnicianId', label: '기사 UUID(비우면 미배정)', type: 'text' },
      { key: 'adminMemo', label: '관리자 메모', type: 'textarea' },
    ],
  },
  {
    id: 'emergency_leads',
    name: '긴급접수',
    list: '/api/admin/emergency-leads',
    selectable: false,
    bulkDelete: false,
    formCreate: null,
    patchBase: '/api/admin/emergency-leads',
    formEdit: [
      {
        key: 'matchingStatus',
        label: '매칭상태',
        type: 'select',
        options: opts([
          ['pending', '대기(pending)'],
          ['timed_out', '타임아웃'],
          ['contact_saved', '연락처입력'],
          ['converted_to_order', '주문전환'],
        ]),
      },
    ],
  },
  {
    id: 'rewards',
    name: '리워드/쿠폰',
    list: '/api/admin/coupons',
    create: '/api/admin/coupons',
    formCreate: [
      { key: 'userId', label: '회원 ID', type: 'text', required: true },
      {
        key: 'couponType',
        label: '쿠폰 유형',
        type: 'select',
        required: true,
        options: opts([['signup', 'signup'], ['aircon_register', 'aircon_register'], ['referral', 'referral'], ['manual', 'manual']]),
      },
      { key: 'amount', label: '금액(원)', type: 'number', required: true, min: 1000, step: 1 },
      { key: 'expiresAt', label: '만료일시(ISO, 선택)', type: 'text', required: false },
    ],
    formEdit: [
      {
        key: 'status',
        label: '상태',
        type: 'select',
        options: opts([['active', '활성'], ['used', '사용됨'], ['expired', '만료'], ['cancelled', '취소']]),
      },
      { key: 'expiresAt', label: '만료일시(ISO)', type: 'text' },
    ],
  },
  {
    id: 'settlements',
    name: '결제/정산',
    list: '/api/admin/settlements',
    formCreate: null,
    formEdit: [
      {
        key: 'status',
        label: '상태',
        type: 'select',
        options: opts([
          ['pending', '대기'],
          ['confirmed', '확정'],
          ['paid', '지급완료'],
          ['held', '보류'],
          ['cancelled', '취소'],
        ]),
      },
    ],
    patchUrl: (id) => `/api/admin/settlements/${id}/status`,
  },
  {
    id: 'service_products',
    name: '설치·청소상품(B)',
    list: '/api/admin/service-products',
    listSuffix: '?includeInactive=1',
    create: '/api/admin/service-products',
    patchBase: '/api/admin/service-products',
    formCreate: [
      { key: 'categoryId', label: '카테고리 UUID', type: 'text', required: true },
      { key: 'name', label: '상품명', type: 'text', required: true },
      { key: 'code', label: '코드', type: 'text', required: true },
      { key: 'serviceType', label: '서비스 유형', type: 'select', options: opts([['install', '설치'], ['cleaning', '청소']]) },
      { key: 'airconType', label: '에어컨 유형', type: 'select', options: opts([['wall', '벽걸이'], ['stand', '스탠드'], ['two_in_one', '투인원'], ['system', '시스템']]) },
      { key: 'basePrice', label: '예약 설치 금액', type: 'number', required: true },
      { key: 'sameDayPrice', label: '당일 설치 금액', type: 'number', required: true },
      { key: 'sameDayExtraPrice', label: '당일 추가금', type: 'number', required: true },
      { key: 'description', label: '설명', type: 'textarea' },
    ],
    formEdit: [
      { key: 'name', label: '상품명', type: 'text' },
      { key: 'basePrice', label: '예약 설치 금액', type: 'number' },
      { key: 'sameDayPrice', label: '당일 설치 금액', type: 'number' },
      { key: 'sameDayExtraPrice', label: '당일 추가금(설명용)', type: 'number' },
      { key: 'includedPipeMeter', label: '포함 배관(m)', type: 'number' },
      { key: 'includedRefrigerantCount', label: '포함 냉매(회)', type: 'number' },
      { key: 'includedHoleCount', label: '포함 타공(회)', type: 'number' },
      { key: 'description', label: '설명', type: 'textarea' },
      { key: 'sortOrder', label: '정렬순서', type: 'number' },
      { key: 'isActive', label: '노출/판매', type: 'checkbox' },
    ],
  },
  {
    id: 'service_addons',
    name: '추가금 항목(B)',
    list: '/api/admin/service-addons',
    listSuffix: '?includeInactive=1',
    patchBase: '/api/admin/service-addons',
    formCreate: [
      { key: 'name', label: '이름', type: 'text', required: true },
      { key: 'code', label: '코드', type: 'text', required: true },
      { key: 'unit', label: '단위', type: 'text', required: false },
      { key: 'customerPrice', label: '고객가(원)', type: 'number', required: false },
      { key: 'description', label: '설명', type: 'text', required: false },
    ],
    formEdit: [
      { key: 'name', label: '이름', type: 'text' },
      { key: 'customerPrice', label: '고객가', type: 'number' },
      { key: 'technicianCostAllowance', label: '기사 인정 원가', type: 'number' },
      { key: 'platformFeeRate', label: '플랫폼 수수료율(0~1)', type: 'number' },
      { key: 'description', label: '설명', type: 'textarea' },
      { key: 'sortOrder', label: '정렬순서', type: 'number' },
      { key: 'isActive', label: '사용', type: 'checkbox' },
    ],
  },
];

let active = tabs.find((t) => t.id === 'accounts') || tabs[0];
let accountSection = 'customers';
let rows = [];
let selected = null;
let modalState = { mode: 'create', record: null };

const $tabs = document.getElementById('tabs');
const $title = document.getElementById('title');
const $list = document.getElementById('list');
const $detail = document.getElementById('detail');
const $actions = document.getElementById('actions');
const $toolbar = document.getElementById('toolbar');
const $sessionRole = document.getElementById('sessionRole');
const $roleSelect = document.getElementById('roleSelect');
const $logoutBtn = document.getElementById('logoutBtn');
const $modalRoot = document.getElementById('modalRoot');
const $modalTitle = document.getElementById('modalTitle');
const $modalForm = document.getElementById('modalForm');
const $modalCancel = document.getElementById('modalCancel');
const $modalBackdrop = document.getElementById('modalBackdrop');
const ALLOWED_ROLES = ['dispatch_admin', 'ops_admin', 'finance_admin', 'super_admin'];
const DISPATCH_READONLY_TABS = new Set(['bookings', 'emergency_leads', 'settlements']);
const DISPATCH_VISIBLE_TABS = new Set(['settlements', 'emergency_leads', 'bookings']);
let activeRole = (() => {
  try {
    const q = new URL(location.href).searchParams.get('role');
    return ALLOWED_ROLES.includes(q) ? q : 'super_admin';
  } catch {
    return 'super_admin';
  }
})();

function currentRole() {
  return activeRole;
}

function isReadOnlyForActiveTab() {
  return currentRole() === 'dispatch_admin' && DISPATCH_READONLY_TABS.has(active.id);
}

function getVisibleTabs() {
  if (currentRole() !== 'dispatch_admin') return tabs;
  return tabs.filter((t) => DISPATCH_VISIBLE_TABS.has(t.id));
}

function currentAccountView() {
  return accountViews[accountSection] || accountViews.customers;
}

function activeConfig() {
  return active.accountHub ? currentAccountView() : active;
}

/** 랜딩 등에서 `/admin/index.html?tab=onboarding` 형태로 진입 */
function readTabFromUrl() {
  try {
    const u = new URL(location.href);
    const q = u.searchParams.get('tab');
    if (q) return String(q).trim();
    const hash = u.hash.replace(/^#/, '');
    if (hash.startsWith('tab=')) return hash.slice(4).trim();
    if (hash && !hash.includes('=')) return hash.trim();
  } catch {
    /* ignore */
  }
  return '';
}

function readAccountSectionFromUrl() {
  try {
    const q = new URL(location.href).searchParams.get('section');
    return accountViews[q] ? q : '';
  } catch {
    return '';
  }
}

function syncTabToUrl() {
  try {
    const u = new URL(location.href);
    u.searchParams.set('tab', active.id);
    if (active.accountHub) u.searchParams.set('section', accountSection);
    else u.searchParams.delete('section');
    u.hash = '';
    history.replaceState(null, '', `${u.pathname}?${u.searchParams.toString()}`);
  } catch {
    /* ignore */
  }
}

/** Nest 와 같은 호스트면 빈 문자열. Vite 등에서 열었다면 index.html 에서 window.__ADMIN_API_BASE__ 설정 */
function apiUrl(path) {
  const raw = typeof window.__ADMIN_API_BASE__ === 'string' ? window.__ADMIN_API_BASE__.trim().replace(/\/$/, '') : '';
  if (!path.startsWith('/')) return `${raw}/${path}`;
  return `${raw}${path}`;
}

function headers(extra = {}) {
  return { 'Content-Type': 'application/json', 'x-admin-role': currentRole(), ...extra };
}

async function req(url, opt = {}) {
  const res = await fetch(apiUrl(url), { ...opt, headers: headers(opt.headers || {}) });
  const json = await res.json();
  if (!json.ok) throw new Error(JSON.stringify(json.error));
  return json.data;
}

function patchUrlFor(tab, id) {
  if (typeof tab.patchUrl === 'function') return tab.patchUrl(id);
  const base = tab.patchBase || tab.list;
  return `${base}/${id}`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDetailPanel(row) {
  if (!row) return '';
  let text = JSON.stringify(row, null, 2);
  if (active.id === 'bookings' && row.sourceEmergencyLeadId) {
    text += `\n---\n원본 긴급 접수 리드 · ${String(row.sourceEmergencyLeadId)}\n(주문 초안은 긴급 접수 탭의 convertedOrderId 또는 설치주문 목록 참고)`;
  }
  if (active.id === 'emergency_leads') {
    const lines = [];
    if (row.convertedOrderId) lines.push(`전환 주문(order): ${row.convertedOrderId}`);
    if (row.convertedBookingId) lines.push(`호환 필드(convertedBookingId): ${row.convertedBookingId}`);
    if (lines.length) text += `\n---\n${lines.join('\n')}`;
  }
  return text;
}

function formatCell(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  const s = String(v);
  return s.length > 28 ? `${s.slice(0, 28)}…` : s;
}

function renderTabs() {
  const visibleTabs = getVisibleTabs();
  if (!visibleTabs.some((t) => t.id === active.id)) {
    active = visibleTabs[0] || tabs[0];
  }
  $tabs.innerHTML = tabs
    .filter((t) => !t.shortcutOnly && visibleTabs.some((v) => v.id === t.id))
    .map((t) => `<button class="tab-btn ${t.id === active.id ? 'active' : ''}" data-id="${t.id}">${t.name}</button>`)
    .join('');
  $tabs.querySelectorAll('button').forEach((btn) => {
    btn.onclick = () => {
      active = visibleTabs.find((t) => t.id === btn.dataset.id) || active;
      load();
    };
  });
}

function renderAccountSubtabs() {
  const entries = [
    ['customers', '회원'],
    ['sellers', '판매자'],
    ['technicians', '기사'],
    ['admins', '관리자'],
  ];
  return `
    <div class="subtabs" role="tablist" aria-label="회원 유형">
      ${entries.map(([id, label]) => `<button type="button" class="subtab ${accountSection === id ? 'active' : ''}" data-section="${id}">${label}</button>`).join('')}
    </div>
  `;
}

/** @param {typeof tabs[number]} tab */
function tableForRows(items, tab) {
  if (!items.length) return '<p class="muted">데이터 없음</p>';
  const selectable = tab.selectable !== false;
  const sample = items[0];
  const keys = Object.keys(sample).filter((k) => k !== 'id');
  const displayKeys = keys.slice(0, 6);
  const checkHead = selectable
    ? `<th class="col-check"><input type="checkbox" id="checkAll" class="row-check" title="전체 선택" /></th>`
    : '';
  const checkCell = (id) =>
    selectable
      ? `<td class="col-check"><input type="checkbox" class="row-check row-cb" value="${escapeHtml(id)}" /></td>`
      : '';
  const head = `${checkHead}<th class="col-id">ID</th>${displayKeys.map((k) => `<th>${escapeHtml(k)}</th>`).join('')}`;
  const body = items
    .map((r) => {
      const cells = displayKeys.map((k) => `<td>${escapeHtml(formatCell(r[k]))}</td>`).join('');
      return `<tr data-id="${escapeHtml(r.id)}" class="data-row">
        ${checkCell(r.id)}
        <td class="col-id"><button type="button" class="id-link" data-id="${escapeHtml(r.id)}">${escapeHtml(r.id)}</button></td>
        ${cells}
      </tr>`;
    })
    .join('');
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function getCheckedIds() {
  return [...$list.querySelectorAll('.row-cb:checked')].map((el) => el.value);
}

function wireTableHandlers() {
  const checkAll = document.getElementById('checkAll');
  if (checkAll) {
    checkAll.onchange = () => {
      $list.querySelectorAll('.row-cb').forEach((cb) => {
        cb.checked = checkAll.checked;
      });
    };
  }
  $list.querySelectorAll('.row-cb').forEach((cb) => {
    cb.addEventListener('click', (e) => e.stopPropagation());
  });
  $list.querySelectorAll('.id-link').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const row = rows.find((r) => r.id === id);
      if (!row) return;
      if (isReadOnlyForActiveTab()) {
        selected = row;
        $detail.textContent = formatDetailPanel(selected);
        renderActions();
        return;
      }
      openModal('edit', row);
    });
  });
  $list.querySelectorAll('tr.data-row').forEach((tr) => {
    tr.addEventListener('click', () => {
      const id = tr.dataset.id;
      selected = rows.find((r) => r.id === id) || null;
      $list.querySelectorAll('tr.data-row').forEach((r) => r.classList.remove('row-selected'));
      tr.classList.add('row-selected');
      $detail.textContent = selected ? formatDetailPanel(selected) : '';
      renderActions();
    });
  });
}

function renderToolbar() {
  const parts = [];
  const cfg = activeConfig();
  const readOnly = isReadOnlyForActiveTab();
  if (active.accountHub) parts.push(renderAccountSubtabs());
  if (cfg.formCreate && !readOnly) parts.push(`<button class="primary" type="button" id="btnCreate">생성</button>`);
  if (cfg.bulkDelete !== false && !readOnly) {
    parts.push(`<button type="button" class="danger" id="btnDeleteChecked" title="체크한 행 삭제">선택 삭제</button>`);
  }
  if (cfg.id === 'bookings') parts.push(`<button type="button" id="btnRefresh">리프레시</button>`);
  $toolbar.className = 'toolbar';
  $toolbar.innerHTML = parts.join('');
  $toolbar.querySelectorAll('.subtab').forEach((btn) => {
    btn.onclick = () => {
      if (!accountViews[btn.dataset.section]) return;
      accountSection = btn.dataset.section;
      load();
    };
  });
  const c = document.getElementById('btnCreate');
  if (c) c.onclick = () => openModal('create', null);
  const del = document.getElementById('btnDeleteChecked');
  if (del) del.onclick = onDeleteChecked;
  const r = document.getElementById('btnRefresh');
  if (r) r.onclick = load;
}

function renderActions() {
  const cfg = activeConfig();
  const activeId = cfg.id;
  $actions.className = 'actions';
  if (!selected) {
    $actions.innerHTML = '<span class="muted">행을 선택하면 액션 버튼이 나옵니다.</span>';
    return;
  }
  if (isReadOnlyForActiveTab()) {
    $actions.innerHTML = '<span class="muted">기사 role은 이 탭에서 조회만 가능합니다.</span>';
    return;
  }
  if (activeId === 'customers' || activeId === 'admins') {
    $actions.innerHTML = `<button data-s="active">활성</button><button data-s="inactive">비활성</button><button data-s="banned">차단</button>`;
    $actions.querySelectorAll('button').forEach((b) => (b.onclick = () => patch(`${cfg.list}/${selected.id}`, { status: b.dataset.s })));
  } else if (activeId === 'sellers') {
    $actions.innerHTML = `<button data-s="approved">승인</button><button data-s="reviewing">검토중</button><button data-s="suspended">정지</button><button data-s="rejected">반려</button>`;
    $actions.querySelectorAll('button').forEach((b) => (b.onclick = () => patch(`${cfg.list}/${selected.id}`, { status: b.dataset.s })));
  } else if (activeId === 'technicians') {
    $actions.innerHTML = `<button data-s="approved">승인</button><button data-s="suspended">정지</button>`;
    $actions.querySelectorAll('button').forEach((b) => (b.onclick = () => patch(`${cfg.list}/${selected.id}`, { status: b.dataset.s })));
  } else if (activeId === 'onboarding') {
    $actions.innerHTML = `<button data-s="reviewing">검토중</button><button data-s="approved">승인</button><button data-s="rejected">반려</button>`;
    $actions
      .querySelectorAll('button')
      .forEach((b) => (b.onclick = () => post(`/api/admin/technician-onboarding/${selected.id}/review`, { status: b.dataset.s })));
  } else if (activeId === 'bookings') {
    $actions.innerHTML = `<button type="button" id="orderMockPay">테스트결제 확정</button><button id="toMatching">matching</button><button id="assign">기사 UUID 배정</button><button id="unassign">배정해제</button><button id="toDone">completed</button>`;
    document.getElementById('orderMockPay').onclick = async () => {
      try {
        await req(`/api/payments/mock-confirm`, { method: 'POST', body: JSON.stringify({ orderId: selected.id }) });
        await load();
      } catch (err) {
        alert(err.message);
      }
    };
    document.getElementById('toMatching').onclick = () =>
      patch(`/api/admin/customer-orders/${selected.id}`, { orderStatus: 'matching' });
    document.getElementById('assign').onclick = () => {
      const technicianId = prompt('배정할 승인 기사 UUID를 입력하세요.', selected.assignedTechnicianId || '');
      if (!technicianId) return;
      patch(`/api/admin/customer-orders/${selected.id}`, { orderStatus: 'assigned', assignedTechnicianId: technicianId.trim() });
    };
    document.getElementById('unassign').onclick = () =>
      patch(`/api/admin/customer-orders/${selected.id}`, { orderStatus: 'matching', assignedTechnicianId: null });
    document.getElementById('toDone').onclick = () =>
      patch(`/api/admin/customer-orders/${selected.id}`, { orderStatus: 'completed' });
  } else if (activeId === 'rewards') {
    $actions.innerHTML = `<button data-s="active">활성</button><button data-s="cancelled">취소</button>`;
    $actions
      .querySelectorAll('button')
      .forEach((b) => (b.onclick = () => patch(`/api/admin/coupons/${selected.id}`, { status: b.dataset.s })));
  } else if (activeId === 'settlements') {
    $actions.innerHTML = `<button>정산확정</button><button>지급완료</button><button>보류</button>`;
    const [a, b, c] = $actions.querySelectorAll('button');
    a.onclick = () => post(`/api/admin/settlements/${selected.id}/confirm`, { adjustmentAmount: 0 });
    b.onclick = () => patch(`/api/admin/settlements/${selected.id}/status`, { status: 'paid' });
    c.onclick = () => patch(`/api/admin/settlements/${selected.id}/status`, { status: 'held' });
  } else if (activeId === 'emergency_leads') {
    $actions.innerHTML =
      '<span class="muted">행 선택 후 ID 또는 행 클릭 → 매칭상태만 수정합니다. 공개 접수는 고객 폼에서 저장됩니다.</span>';
  } else if (activeId === 'service_products' || activeId === 'service_addons') {
    $actions.innerHTML =
      '<span class="muted">목록 행(ID) 클릭으로 가격을 수정합니다. 선택 삭제는 비활성 처리입니다.</span>';
  }
}

function closeModal() {
  modalState = { mode: 'create', record: null };
  $modalRoot.classList.add('hidden');
  $modalRoot.setAttribute('aria-hidden', 'true');
  $modalForm.innerHTML = '';
}

function buildFieldHtml(f, value) {
  const id = `f_${f.key}`;
  const v = value !== undefined && value !== null ? value : '';
  if (f.type === 'textarea') {
    return `<label for="${id}">${escapeHtml(f.label)}<textarea id="${id}" name="${escapeHtml(f.key)}">${escapeHtml(String(v))}</textarea></label>`;
  }
  if (f.type === 'select') {
    const options = (f.options || [])
      .map((o) => `<option value="${escapeHtml(o.value)}" ${String(o.value) === String(v) ? 'selected' : ''}>${escapeHtml(o.label)}</option>`)
      .join('');
    return `<label for="${id}">${escapeHtml(f.label)}<select id="${id}" name="${escapeHtml(f.key)}">${options}</select></label>`;
  }
  if (f.type === 'checkbox') {
    const checked = v === true || v === 'true' ? 'checked' : '';
    return `<label style="flex-direction:row;align-items:center;gap:8px;"><input type="checkbox" id="${id}" name="${escapeHtml(f.key)}" ${checked} /> ${escapeHtml(f.label)}</label>`;
  }
  const min = f.min !== undefined ? ` min="${f.min}"` : '';
  const step = f.step !== undefined ? ` step="${f.step}"` : '';
  const minLength = f.minLength !== undefined ? ` minlength="${f.minLength}"` : '';
  const req = f.required ? ' required' : '';
  return `<label for="${id}">${escapeHtml(f.label)}<input type="${f.type}" id="${id}" name="${escapeHtml(f.key)}" value="${escapeHtml(String(v))}"${min}${step}${minLength}${req} /></label>`;
}

function openModal(mode, record) {
  const cfg = activeConfig();
  const fields = mode === 'create' ? cfg.formCreate : cfg.formEdit;
  if (!fields || !fields.length) {
    alert(mode === 'create' ? '이 탭에서는 생성할 수 없습니다.' : '이 탭에서는 수정 폼이 없습니다.');
    return;
  }
  modalState = { mode, record };
  const title = active.accountHub ? `${active.name} · ${cfg.name}` : active.name;
  $modalTitle.textContent = mode === 'create' ? `${title} — 새로 만들기` : `${title} — 수정 (${record.id})`;
  $modalForm.innerHTML = fields
    .map((f) => buildFieldHtml(f, record && record[f.key] !== undefined ? record[f.key] : ''))
    .join('');
  $modalRoot.classList.remove('hidden');
  $modalRoot.setAttribute('aria-hidden', 'false');
}

async function onModalSubmit(e) {
  e.preventDefault();
  const cfg = activeConfig();
  const fields = modalState.mode === 'create' ? cfg.formCreate : cfg.formEdit;
  const fd = new FormData($modalForm);
  const body = {};
  for (const f of fields) {
    if (f.type === 'checkbox') {
      const el = $modalForm.querySelector(`[name="${f.key}"]`);
      body[f.key] = el ? el.checked : false;
      continue;
    }
    let raw = fd.get(f.key);
    if (raw === null || raw === undefined) raw = '';
    raw = String(raw).trim();
    if (f.type === 'number') {
      if (raw === '') {
        if (f.required) {
          alert(`${f.label}을(를) 입력하세요.`);
          return;
        }
        continue;
      }
      body[f.key] = Number(raw);
    } else {
      if (raw === '' && f.required && modalState.mode === 'create') {
        alert(`${f.label}을(를) 입력하세요.`);
        return;
      }
      if (raw === '') {
        if (modalState.mode === 'edit' && active.id === 'bookings' && f.key === 'assignedTechnicianId')
          body[f.key] = null;
        continue;
      }
      body[f.key] = raw;
    }
  }
  if (modalState.mode === 'create' && cfg.createDefaults) {
    Object.assign(body, cfg.createDefaults);
  }
  try {
    if (modalState.mode === 'create') {
      await req(cfg.create, { method: 'POST', body: JSON.stringify(body) });
    } else {
      const id = modalState.record.id;
      const url = patchUrlFor(cfg, id);
      const patchBody = { ...body };
      if (cfg.id === 'settlements') {
        await req(url, { method: 'PATCH', body: JSON.stringify({ status: patchBody.status }) });
      } else {
        await req(url, { method: 'PATCH', body: JSON.stringify(patchBody) });
      }
    }
    closeModal();
    await load();
  } catch (err) {
    alert(err.message);
  }
}

async function onDeleteChecked() {
  const ids = getCheckedIds();
  if (!ids.length) {
    alert('삭제할 항목을 체크하세요.');
    return;
  }
  if (!confirm(`${ids.length}건을 삭제할까요?`)) return;
  const cfg = activeConfig();
  const base =
    cfg.patchBase ||
    (cfg.id === 'onboarding' ? '/api/admin/technician-onboarding' : cfg.list);
  try {
    for (const id of ids) {
      await req(`${base}/${id}`, { method: 'DELETE' });
    }
    await load();
  } catch (err) {
    alert(err.message);
  }
}

async function post(url, body) {
  await req(url, { method: 'POST', body: JSON.stringify(body) });
  await load();
}

async function patch(url, body) {
  await req(url, { method: 'PATCH', body: JSON.stringify(body) });
  await load();
}

async function load() {
  renderTabs();
  const cfg = activeConfig();
  $title.textContent = active.accountHub ? `${active.name} · ${cfg.name}` : active.name;
  renderToolbar();
  try {
    const data = await req(cfg.list + (cfg.listSuffix || ''));
    rows = typeof cfg.filterRows === 'function' ? cfg.filterRows(data) : data;
    selected = rows[0] || null;
    $list.innerHTML = tableForRows(rows, cfg);
    wireTableHandlers();
    if (selected) {
      const tr = $list.querySelector(`tr[data-id="${selected.id.replace(/"/g, '')}"]`);
      if (tr) tr.classList.add('row-selected');
    }
    $detail.textContent = formatDetailPanel(selected);
    renderActions();
    syncTabToUrl();
  } catch (e) {
    $list.innerHTML = `<p class="muted">오류: ${escapeHtml(e.message)}</p>`;
    $detail.textContent = '';
    $actions.innerHTML = '';
    syncTabToUrl();
  }
}

$modalForm.addEventListener('submit', onModalSubmit);
$modalCancel.onclick = closeModal;
$modalBackdrop.onclick = closeModal;

if ($roleSelect) {
  $roleSelect.value = activeRole;
  $roleSelect.onchange = () => {
    activeRole = ALLOWED_ROLES.includes($roleSelect.value) ? $roleSelect.value : 'super_admin';
    if ($sessionRole) $sessionRole.textContent = `role: ${activeRole} · temporary`;
    load();
  };
}
if ($sessionRole) $sessionRole.textContent = `role: ${activeRole} · temporary`;
if ($logoutBtn) {
  $logoutBtn.onclick = () => {
    if (window.ACnowSession) window.ACnowSession.logout('/index.html');
    else {
      sessionStorage.removeItem('acnow.session.v1');
      location.href = '/index.html';
    }
  };
}
{
  const want = readTabFromUrl();
  if (want) {
    const visibleTabs = getVisibleTabs();
    const legacyAccountMap = { members: 'customers', sellers: 'sellers', technicians: 'technicians', admins: 'admins' };
    if (legacyAccountMap[want]) {
      active = visibleTabs.find((t) => t.id === 'accounts') || active;
      accountSection = legacyAccountMap[want];
    } else {
      const found = visibleTabs.find((t) => t.id === want);
      if (found) active = found;
    }
  }
  const section = readAccountSectionFromUrl();
  if (section) accountSection = section;
}
load();
