const opts = (pairs) => pairs.map(([v, l]) => ({ value: v, label: l || v }));

const memberStatusOptions = opts([['active', '활성'], ['inactive', '비활성'], ['banned', '차단']]);
const sellerStatusOptions = opts([['pending', '대기'], ['reviewing', '검토중'], ['approved', '승인'], ['rejected', '반려'], ['suspended', '정지']]);
const technicianStatusOptions = opts([['pending', '대기'], ['reviewing', '검토중'], ['approved', '승인'], ['rejected', '반려'], ['suspended', '정지']]);
const bankVerificationOptions = opts([['unsubmitted', '미제출'], ['pending', '검토대기'], ['verified', '검증완료'], ['rejected', '반려']]);
const paymentStatusOptions = opts([['paid', '결제완료'], ['ready', '대기'], ['failed', '실패'], ['cancelled', '취소'], ['partial_cancelled', '부분취소']]);
const settlementStatusOptions = opts([['pending', '대기'], ['confirmed', '확정'], ['paid', '지급완료'], ['held', '보류'], ['cancelled', '취소']]);
const quoteStatusOptions = opts([['requested', '요청'], ['approved', '고객승인'], ['paid', '결제완료'], ['rejected', '반려'], ['cancelled', '취소']]);
const materialMarketStatusOptions = opts([['active', '판매중'], ['sold_out', '품절'], ['hidden', '숨김'], ['draft', '작성중']]);
const materialOrderStatusOptions = opts([['requested', '요청'], ['confirmed', '확인'], ['preparing', '준비중'], ['shipped', '배송중'], ['delivered', '완료'], ['cancelled', '취소']]);

function money(n) {
  const v = Number(n ?? 0);
  return `${Number.isFinite(v) ? v.toLocaleString() : '0'}원`;
}

function metricLabel(key) {
  return {
    todayBookings: '오늘 주문',
    members: '전체 회원',
    technicians: '승인 기사',
    matching: '매칭중',
    completed: '완료 주문',
    paidAmount: '누적 결제금액',
    settlementPending: '정산 대기',
    canonicalModel: '상태 기준',
  }[key] || key;
}

function renderDashboard(data) {
  const entries = [
    ['todayBookings', data.todayBookings],
    ['members', data.members],
    ['technicians', data.technicians],
    ['matching', data.matching],
    ['completed', data.completed],
    ['paidAmount', money(data.paidAmount)],
    ['settlementPending', data.settlementPending],
    ['canonicalModel', data.canonicalModel],
  ];
  return `
    <div class="metric-grid">
      ${entries
        .map(([key, value]) => `<div class="metric"><span>${escapeHtml(metricLabel(key))}</span><strong>${escapeHtml(value)}</strong></div>`)
        .join('')}
    </div>
    <p class="muted">운영 상태는 Supabase orders/payment/settlement 기준으로 집계합니다. 결제·감사·추가금 상세는 좌측 탭에서 확인하세요.</p>
  `;
}

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
      { key: 'bankVerificationStatus', label: '계좌 검증', type: 'select', options: bankVerificationOptions },
      { key: 'bankRejectReason', label: '계좌 반려 사유', type: 'text' },
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
    id: 'dashboard',
    name: '운영 대시보드',
    adminRoles: ['super_admin', 'ops_admin', 'dispatch_admin', 'finance_admin'],
    list: '/api/admin/dashboard',
    singleton: true,
    renderList: renderDashboard,
    selectable: false,
    bulkDelete: false,
    formCreate: null,
  },
  {
    id: 'accounts',
    name: '전체 회원관리',
    adminRoles: ['super_admin', 'ops_admin'],
    accountHub: true,
  },
  {
    id: 'onboarding',
    name: '기사등록/승인',
    adminRoles: ['super_admin', 'ops_admin'],
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
    adminRoles: ['super_admin', 'ops_admin', 'dispatch_admin'],
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
      { key: 'adminMemo', label: '관리자 메모', type: 'textarea' },
    ],
  },
  {
    id: 'emergency_leads',
    name: '긴급접수',
    adminRoles: ['super_admin', 'ops_admin', 'dispatch_admin'],
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
    adminRoles: ['super_admin', 'ops_admin', 'finance_admin'],
    list: '/api/admin/coupons',
    create: '/api/admin/coupons',
    formCreate: [
      { key: 'userId', label: '회원 식별값', type: 'text', required: true },
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
    name: '정산',
    adminRoles: ['super_admin', 'finance_admin', 'dispatch_admin'],
    list: '/api/admin/settlements',
    formCreate: null,
    quickFilters: [{ key: 'status', label: '상태', options: settlementStatusOptions }],
    formEdit: [
      {
        key: 'status',
        label: '상태',
        type: 'select',
        options: settlementStatusOptions,
      },
    ],
    patchUrl: (id) => `/api/admin/settlements/${id}/status`,
  },
  {
    id: 'payments',
    name: '결제 목록',
    adminRoles: ['super_admin', 'finance_admin'],
    list: '/api/admin/payments',
    formCreate: null,
    selectable: false,
    bulkDelete: false,
    quickFilters: [{ key: 'status', label: '상태', options: paymentStatusOptions }],
    formEdit: null,
  },
  {
    id: 'extra_quotes',
    name: '추가금 견적',
    adminRoles: ['super_admin', 'ops_admin', 'dispatch_admin', 'finance_admin'],
    list: '/api/admin/extra-quotes',
    formCreate: null,
    selectable: false,
    bulkDelete: false,
    quickFilters: [{ key: 'status', label: '상태', options: quoteStatusOptions }],
    queryInputs: [{ key: 'orderId', label: '주문 검색값' }],
    formEdit: null,
  },
  {
    id: 'settlement_events',
    name: '정산 감사',
    adminRoles: ['super_admin', 'finance_admin', 'dispatch_admin'],
    list: '/api/admin/settlement-events',
    formCreate: null,
    selectable: false,
    bulkDelete: false,
    queryInputs: [{ key: 'orderId', label: '주문 검색값' }],
    formEdit: null,
  },
  {
    id: 'admin_logs',
    name: '관리 로그',
    adminRoles: ['super_admin'],
    list: '/api/admin/logs',
    formCreate: null,
    selectable: false,
    bulkDelete: false,
    formEdit: null,
  },
  {
    id: 'service_products',
    name: '설치·청소상품(B)',
    adminRoles: ['super_admin', 'ops_admin'],
    list: '/api/admin/service-products',
    listSuffix: '?includeInactive=1',
    create: '/api/admin/service-products',
    patchBase: '/api/admin/service-products',
    formCreate: [
      { key: 'categoryId', label: '카테고리', type: 'text', required: true },
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
    adminRoles: ['super_admin', 'ops_admin'],
    list: '/api/admin/service-addons',
    listSuffix: '?includeInactive=1',
    create: '/api/admin/service-addons',
    patchBase: '/api/admin/service-addons',
    formCreate: [
      { key: 'name', label: '이름', type: 'text', required: true },
      { key: 'code', label: '코드', type: 'text', required: true },
      { key: 'unit', label: '단위', type: 'text', required: false },
      { key: 'customerPrice', label: '고객가(원)', type: 'number', required: true },
      { key: 'technicianCostAllowance', label: '기사 인정 원가', type: 'number', required: false },
      { key: 'platformFeeRate', label: '플랫폼 수수료율(0~1)', type: 'number', required: false, step: '0.01' },
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
  {
    id: 'materials',
    name: '자재/판매가(B)',
    adminRoles: ['super_admin'],
    list: '/api/admin/materials',
    create: '/api/admin/materials',
    patchBase: '/api/admin/materials',
    quickFilters: [{ key: 'isActive', label: '상태', options: opts([[true, '사용'], [false, '비활성']]) }],
    formCreate: [
      { key: 'name', label: '자재/상품명', type: 'text', required: true },
      { key: 'code', label: '코드', type: 'text', required: true },
      { key: 'category', label: '카테고리', type: 'text' },
      { key: 'unit', label: '단위', type: 'text' },
      { key: 'customerPrice', label: '고객가(원)', type: 'number' },
      { key: 'technicianCostAllowance', label: '기사 인정 원가', type: 'number' },
      { key: 'platformFeeRate', label: '플랫폼 수수료율(0~1)', type: 'number', step: '0.01' },
      { key: 'supplierName', label: '공급자/판매자명', type: 'text' },
      { key: 'description', label: '상품 설명', type: 'textarea' },
      { key: 'imageUrl', label: '이미지 URL', type: 'text' },
      { key: 'stockQuantity', label: '재고', type: 'number' },
      { key: 'marketStatus', label: '마켓 상태', type: 'select', options: materialMarketStatusOptions },
      { key: 'deliveryNote', label: '배송 안내', type: 'textarea' },
      { key: 'minOrderQuantity', label: '최소 주문 수량', type: 'number' },
      { key: 'oemAvailable', label: 'OEM 가능', type: 'checkbox' },
    ],
    formEdit: [
      { key: 'name', label: '자재/상품명', type: 'text' },
      { key: 'category', label: '카테고리', type: 'text' },
      { key: 'unit', label: '단위', type: 'text' },
      { key: 'customerPrice', label: '고객가(원)', type: 'number' },
      { key: 'technicianCostAllowance', label: '기사 인정 원가', type: 'number' },
      { key: 'platformFeeRate', label: '플랫폼 수수료율(0~1)', type: 'number', step: '0.01' },
      { key: 'supplierName', label: '공급자/판매자명', type: 'text' },
      { key: 'description', label: '상품 설명', type: 'textarea' },
      { key: 'imageUrl', label: '이미지 URL', type: 'text' },
      { key: 'stockQuantity', label: '재고', type: 'number' },
      { key: 'marketStatus', label: '마켓 상태', type: 'select', options: materialMarketStatusOptions },
      { key: 'deliveryNote', label: '배송 안내', type: 'textarea' },
      { key: 'minOrderQuantity', label: '최소 주문 수량', type: 'number' },
      { key: 'oemAvailable', label: 'OEM 가능', type: 'checkbox' },
      { key: 'isActive', label: '사용', type: 'checkbox' },
    ],
  },
  {
    id: 'material_orders',
    name: '기사 자재 구매관리',
    adminRoles: ['super_admin', 'ops_admin'],
    list: '/api/admin/material-orders',
    patchBase: '/api/admin/material-orders',
    bulkDelete: false,
    quickFilters: [{ key: 'status', label: '상태', options: materialOrderStatusOptions }],
    formCreate: null,
    formEdit: [
      { key: 'status', label: '상태', type: 'select', options: materialOrderStatusOptions },
      { key: 'sellerMemo', label: '판매자 메모', type: 'textarea' },
      { key: 'adminMemo', label: '관리자 메모', type: 'textarea' },
    ],
  },
];

let active = tabs.find((t) => t.id === 'accounts') || tabs[0];
let accountSection = 'customers';
let rows = [];
let rawRows = [];
let selected = null;
let modalState = { mode: 'create', record: null };
const filterState = {};

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
const READONLY_BY_ROLE = {
  dispatch_admin: new Set(['dashboard', 'bookings', 'emergency_leads', 'settlements', 'extra_quotes', 'settlement_events']),
};
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
  return READONLY_BY_ROLE[currentRole()]?.has(active.id) || false;
}

function getVisibleTabs() {
  return tabs.filter((t) => (t.adminRoles || []).includes(currentRole()));
}

function currentAccountView() {
  return accountViews[accountSection] || accountViews.customers;
}

function activeConfig() {
  return active.accountHub ? currentAccountView() : active;
}

function filtersFor(id) {
  if (!filterState[id]) filterState[id] = {};
  return filterState[id];
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

function listUrlFor(cfg) {
  const base = cfg.list + (cfg.listSuffix || '');
  const qs = new URLSearchParams();
  const f = filtersFor(cfg.id || active.id);
  (cfg.queryInputs || []).forEach((input) => {
    const value = String(f[input.key] || '').trim();
    if (value) qs.set(input.key, value);
  });
  if (!qs.toString()) return base;
  return `${base}${base.includes('?') ? '&' : '?'}${qs.toString()}`;
}

async function req(url, opt = {}) {
  const res = await fetch(apiUrl(url), { ...opt, headers: headers(opt.headers || {}) });
  const json = await res.json();
  if (!json.ok) throw new Error(JSON.stringify(json.error));
  return json.data;
}

async function openPreview(kind, id) {
  const endpoint =
    kind === 'seller'
      ? `/api/admin/sellers/${encodeURIComponent(id)}/preview-session`
      : `/api/admin/technicians/${encodeURIComponent(id)}/preview-session`;
  try {
    const preview = await req(endpoint);
    const key = window.ACnowSession?.KEY || 'acnow.session.v1';
    sessionStorage.setItem(
      key,
      JSON.stringify({
        ...preview,
        signedInAt: new Date().toISOString(),
        previewReturn: location.href,
      }),
    );
    location.href = '/dashboard.html?preview=admin';
  } catch (err) {
    alert(err.message);
  }
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

function isInternalIdentifierKey(key) {
  const raw = String(key || '');
  const lower = raw.toLowerCase();
  if (lower === 'id') return true;
  if (/_id$/i.test(raw)) return true;
  if (/Id$/.test(raw)) return true;
  return false;
}

function isSensitiveDisplayKey(key) {
  const lower = String(key || '').toLowerCase();
  return lower.includes('password') || lower.includes('hash') || lower.includes('token');
}

function displayKeysFor(row) {
  return Object.keys(row).filter((k) => !isInternalIdentifierKey(k) && !isSensitiveDisplayKey(k));
}

function sanitizeForDisplay(value) {
  if (Array.isArray(value)) return value.map(sanitizeForDisplay);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !isInternalIdentifierKey(key) && !isSensitiveDisplayKey(key))
      .map(([key, val]) => [key, sanitizeForDisplay(val)]),
  );
}

function formatDetailPanel(row) {
  if (!row) return '';
  let text = JSON.stringify(sanitizeForDisplay(row), null, 2);
  if (active.id === 'bookings' && row.sourceEmergencyLeadId) {
    text += '\n---\n긴급 접수에서 전환된 주문입니다.';
  }
  if (active.id === 'emergency_leads') {
    const lines = [];
    if (row.convertedOrderId) lines.push('주문 전환 완료');
    if (row.convertedBookingId) lines.push('이전 호환 필드가 남아 있습니다.');
    if (lines.length) text += `\n---\n${lines.join('\n')}`;
  }
  if (active.id === 'extra_quotes' && Array.isArray(row.items)) {
    const lines = row.items.map((it) => `${it.name} · ${it.quantity}${it.unit || ''} × ${money(it.unitPrice)} = ${money(it.amount)}`);
    if (lines.length) text += `\n---\n추가금 항목\n${lines.join('\n')}`;
  }
  return text;
}

function formatCell(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return JSON.stringify(sanitizeForDisplay(v));
  const s = String(v);
  return s.length > 28 ? `${s.slice(0, 28)}…` : s;
}

function applyFilters(items, cfg) {
  let out = [...items];
  const f = filtersFor(cfg.id || active.id);
  (cfg.quickFilters || []).forEach((filter) => {
    const value = String(f[filter.key] || '').trim();
    if (value) out = out.filter((row) => String(row[filter.key] ?? '') === value);
  });
  const search = String(f.search || '').trim().toLowerCase();
  if (search) {
    out = out.filter((row) => JSON.stringify(row).toLowerCase().includes(search));
  }
  return out;
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
  const keys = displayKeysFor(sample);
  const displayKeys = keys.slice(0, 6);
  const canEdit = Boolean(tab.formEdit) && !isReadOnlyForActiveTab();
  const hasRowAction = canEdit || selectable;
  const checkHead = selectable
    ? `<th class="col-check"><input type="checkbox" id="checkAll" class="row-check" title="전체 선택" /></th>`
    : '';
  const checkCell = (id) =>
    selectable
      ? `<td class="col-check"><input type="checkbox" class="row-check row-cb" value="${escapeHtml(id)}" /></td>`
      : '';
  const actionHead = hasRowAction ? '<th class="col-actions">관리</th>' : '';
  const actionCell = (id) =>
    hasRowAction
      ? `<td class="col-actions"><button type="button" class="row-action" data-row-action="${canEdit ? 'edit' : 'select'}" data-id="${escapeHtml(id)}">${canEdit ? '수정' : '보기'}</button></td>`
      : '';
  const head = `${checkHead}${displayKeys.map((k) => `<th>${escapeHtml(k)}</th>`).join('')}${actionHead}`;
  const body = items
    .map((r) => {
      const cells = displayKeys.map((k) => `<td>${escapeHtml(formatCell(r[k]))}</td>`).join('');
      return `<tr data-id="${escapeHtml(r.id)}" class="data-row">
        ${checkCell(r.id)}
        ${cells}
        ${actionCell(r.id)}
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
  $list.querySelectorAll('.row-action').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const row = rows.find((r) => r.id === id);
      if (!row) return;
      if (btn.dataset.rowAction !== 'edit' || isReadOnlyForActiveTab() || !activeConfig().formEdit) {
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
  if (!cfg.singleton) {
    const f = filtersFor(cfg.id || active.id);
    parts.push(`<input class="toolbar-input" id="filterSearch" type="search" placeholder="검색" value="${escapeHtml(f.search || '')}" />`);
    (cfg.quickFilters || []).forEach((filter) => {
      const value = String(f[filter.key] || '');
      const options = [`<option value="">${escapeHtml(filter.label)} 전체</option>`]
        .concat((filter.options || []).map((o) => `<option value="${escapeHtml(o.value)}" ${String(o.value) === value ? 'selected' : ''}>${escapeHtml(o.label)}</option>`))
        .join('');
      parts.push(`<select class="toolbar-input" data-filter-key="${escapeHtml(filter.key)}">${options}</select>`);
    });
    (cfg.queryInputs || []).forEach((input) => {
      parts.push(`<input class="toolbar-input wide" data-query-key="${escapeHtml(input.key)}" type="text" placeholder="${escapeHtml(input.label)}" value="${escapeHtml(f[input.key] || '')}" />`);
    });
  }
  if (cfg.formCreate && !readOnly) parts.push(`<button class="primary" type="button" id="btnCreate">생성</button>`);
  if (cfg.bulkDelete !== false && !readOnly) {
    parts.push(`<button type="button" class="danger" id="btnDeleteChecked" title="체크한 행 삭제">선택 삭제</button>`);
  }
  if (!cfg.singleton) parts.push(`<button type="button" id="btnApplyFilters">필터 적용</button>`);
  parts.push(`<button type="button" id="btnRefresh">리프레시</button>`);
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
  const search = document.getElementById('filterSearch');
  if (search) {
    search.oninput = () => {
      filtersFor(cfg.id || active.id).search = search.value;
      rows = applyFilters(rawRows, cfg);
      selected = rows[0] || null;
      $list.innerHTML = tableForRows(rows, cfg);
      wireTableHandlers();
      $detail.textContent = formatDetailPanel(selected);
      renderActions();
    };
  }
  $toolbar.querySelectorAll('[data-filter-key]').forEach((el) => {
    el.onchange = () => {
      filtersFor(cfg.id || active.id)[el.dataset.filterKey] = el.value;
      load();
    };
  });
  $toolbar.querySelectorAll('[data-query-key]').forEach((el) => {
    el.onchange = () => {
      filtersFor(cfg.id || active.id)[el.dataset.queryKey] = el.value;
    };
    el.onkeydown = (e) => {
      if (e.key === 'Enter') {
        filtersFor(cfg.id || active.id)[el.dataset.queryKey] = el.value;
        load();
      }
    };
  });
  const apply = document.getElementById('btnApplyFilters');
  if (apply) apply.onclick = () => {
    $toolbar.querySelectorAll('[data-query-key]').forEach((el) => {
      filtersFor(cfg.id || active.id)[el.dataset.queryKey] = el.value;
    });
    load();
  };
  const r = document.getElementById('btnRefresh');
  if (r) r.onclick = load;
}

function technicianOptionLabel(row) {
  return [row.name, row.phone, row.baseRegion].filter(Boolean).join(' · ') || '승인 기사';
}

async function fillApprovedTechnicianSelect(select, currentId) {
  select.innerHTML = '<option value="">승인 기사 불러오는 중</option>';
  try {
    const items = await req('/api/admin/technicians');
    const approved = (Array.isArray(items) ? items : []).filter((row) => row.status === 'approved');
    select.innerHTML = '<option value="">승인 기사 선택</option>';
    approved.forEach((row) => {
      const option = document.createElement('option');
      option.value = row.id;
      option.textContent = technicianOptionLabel(row);
      if (currentId && row.id === currentId) option.selected = true;
      select.appendChild(option);
    });
    if (!approved.length) select.innerHTML = '<option value="">승인 기사가 없습니다</option>';
  } catch (err) {
    select.innerHTML = '<option value="">기사 목록 로드 실패</option>';
  }
}

function renderActions() {
  const cfg = activeConfig();
  const activeId = cfg.id;
  $actions.className = 'actions';
  if (cfg.singleton) {
    $actions.innerHTML = '<span class="muted">대시보드는 실시간 집계 조회 전용입니다.</span>';
    return;
  }
  if (!selected) {
    $actions.innerHTML = '<span class="muted">행을 선택하면 액션 버튼이 나옵니다.</span>';
    return;
  }
  if (isReadOnlyForActiveTab()) {
    $actions.innerHTML = `<span class="muted">${escapeHtml(currentRole())} role은 이 탭에서 조회만 가능합니다.</span>`;
    return;
  }
  if (activeId === 'customers' || activeId === 'admins') {
    $actions.innerHTML = `<button data-s="active">활성</button><button data-s="inactive">비활성</button><button data-s="banned">차단</button>`;
    $actions.querySelectorAll('button').forEach((b) => (b.onclick = () => patch(`${cfg.list}/${selected.id}`, { status: b.dataset.s })));
  } else if (activeId === 'sellers') {
    $actions.innerHTML = `<button data-s="approved">승인</button><button data-s="reviewing">검토중</button><button data-s="suspended">정지</button><button data-s="rejected">반려</button><button id="sellerPreview" class="primary" type="button">판매자 화면 보기</button>`;
    $actions.querySelectorAll('button[data-s]').forEach((b) => (b.onclick = () => patch(`${cfg.list}/${selected.id}`, { status: b.dataset.s })));
    document.getElementById('sellerPreview').onclick = () => openPreview('seller', selected.id);
  } else if (activeId === 'technicians') {
    $actions.innerHTML = `<button data-s="approved">승인</button><button data-s="suspended">정지</button><button data-b="verified">계좌검증</button><button data-b="rejected">계좌반려</button><button id="technicianPreview" class="primary" type="button">기사 화면 보기</button>`;
    $actions.querySelectorAll('button[data-s]').forEach((b) => (b.onclick = () => patch(`${cfg.list}/${selected.id}`, { status: b.dataset.s })));
    $actions.querySelectorAll('button[data-b]').forEach((b) => (b.onclick = () => patch(`${cfg.list}/${selected.id}`, { bankVerificationStatus: b.dataset.b })));
    document.getElementById('technicianPreview').onclick = () => openPreview('technician', selected.id);
  } else if (activeId === 'onboarding') {
    $actions.innerHTML = `<button data-s="reviewing">검토중</button><button data-s="approved">승인</button><button data-s="rejected">반려</button>`;
    $actions
      .querySelectorAll('button')
      .forEach((b) => (b.onclick = () => post(`/api/admin/technician-onboarding/${selected.id}/review`, { status: b.dataset.s })));
  } else if (activeId === 'bookings') {
    $actions.innerHTML = `<button type="button" id="orderMockPay">테스트결제 확정</button><button id="toMatching">matching</button><select id="assignTechnician" aria-label="배정 기사 선택"></select><button id="assign">기사 배정</button><button id="unassign">배정해제</button><button id="toDone">completed</button>`;
    fillApprovedTechnicianSelect(document.getElementById('assignTechnician'), selected.assignedTechnicianId);
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
      const technicianId = document.getElementById('assignTechnician')?.value || '';
      if (!technicianId) return;
      patch(`/api/admin/customer-orders/${selected.id}`, { orderStatus: 'assigned', assignedTechnicianId: technicianId });
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
  } else if (activeId === 'payments') {
    $actions.innerHTML = `<button class="danger" type="button" id="cancelPayment">결제 취소 기록</button>`;
    document.getElementById('cancelPayment').onclick = async () => {
      const reason = prompt('취소 사유를 입력하세요.', '운영자 수동 취소');
      if (reason === null) return;
      try {
        await req(`/api/admin/payments/${selected.id}/cancel`, {
          method: 'POST',
          headers: { 'idempotency-key': `admin-payment-cancel-${selected.id}-${Date.now()}` },
          body: JSON.stringify({ reason }),
        });
        await load();
      } catch (err) {
        alert(err.message);
      }
    };
  } else if (activeId === 'extra_quotes') {
    $actions.innerHTML = `<button id="quoteApprove">고객승인</button><button id="quoteReject">반려</button><button id="quoteCancel">취소</button><button id="quoteMockPay">추가결제 기록</button>`;
    document.getElementById('quoteApprove').onclick = () => post(`/api/admin/extra-quotes/${selected.id}/customer-approved`, {});
    document.getElementById('quoteReject').onclick = () => post(`/api/admin/extra-quotes/${selected.id}/reject`, {});
    document.getElementById('quoteCancel').onclick = () => post(`/api/admin/extra-quotes/${selected.id}/cancel`, {});
    document.getElementById('quoteMockPay').onclick = () => post(`/api/admin/extra-quotes/${selected.id}/mock-record-payment`, {});
  } else if (activeId === 'settlements') {
    $actions.innerHTML = `<button>정산확정</button><button>지급완료</button><button>보류</button>`;
    const [a, b, c] = $actions.querySelectorAll('button');
    a.onclick = () => post(`/api/admin/settlements/${selected.id}/confirm`, { adjustmentAmount: 0 });
    b.onclick = () => patch(`/api/admin/settlements/${selected.id}/status`, { status: 'paid' });
    c.onclick = () => patch(`/api/admin/settlements/${selected.id}/status`, { status: 'held' });
  } else if (activeId === 'settlement_events') {
    $actions.innerHTML = '<span class="muted">정산 상태 변경, 확정, 취소 처리의 감사 이력을 조회합니다. 주문 검색값 필터를 사용할 수 있습니다.</span>';
  } else if (activeId === 'admin_logs') {
    $actions.innerHTML = '<span class="muted">관리자 CRUD/상태 변경 로그입니다. 검색으로 작업명, 대상 테이블, 변경 내용을 찾을 수 있습니다.</span>';
  } else if (activeId === 'emergency_leads') {
    $actions.innerHTML =
      '<span class="muted">행 선택 후 수정 버튼 또는 행 클릭으로 매칭상태를 관리합니다. 공개 접수는 고객 폼에서 저장됩니다.</span>';
  } else if (activeId === 'service_products' || activeId === 'service_addons' || activeId === 'materials') {
    $actions.innerHTML =
      '<span class="muted">목록 행의 수정 버튼으로 가격을 수정합니다. 선택 삭제는 비활성 처리입니다. 판매자 공급가도 DB row 기준으로 관리합니다.</span>';
  } else if (activeId === 'material_orders') {
    $actions.innerHTML =
      '<span class="muted">구매요청 행의 수정 버튼으로 상태와 메모를 관리합니다. 실제 결제는 아직 연결하지 않은 요청형 MVP입니다.</span>';
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
  $modalTitle.textContent = mode === 'create' ? `${title} — 새로 만들기` : `${title} — 수정`;
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
    const data = await req(listUrlFor(cfg));
    if (typeof cfg.renderList === 'function') {
      rawRows = [];
      rows = [];
      selected = null;
      $list.innerHTML = cfg.renderList(data);
      $detail.textContent = JSON.stringify(data, null, 2);
      renderActions();
      syncTabToUrl();
      return;
    }
    const listData = Array.isArray(data) ? data : [];
    rawRows = typeof cfg.filterRows === 'function' ? cfg.filterRows(listData) : listData;
    rows = applyFilters(rawRows, cfg);
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
