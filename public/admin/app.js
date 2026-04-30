const opts = (pairs) => pairs.map(([v, l]) => ({ value: v, label: l || v }));

const tabs = [
  {
    id: 'members',
    name: '회원관리',
    list: '/api/admin/members',
    create: '/api/admin/members',
    formCreate: [
      { key: 'name', label: '이름', type: 'text', required: true },
      { key: 'phone', label: '전화번호', type: 'text', required: true },
    ],
    formEdit: [
      { key: 'name', label: '이름', type: 'text' },
      { key: 'phone', label: '전화번호', type: 'text' },
      { key: 'status', label: '상태', type: 'select', options: opts([['active', '활성'], ['inactive', '비활성'], ['banned', '차단']]) },
      { key: 'marketingConsent', label: '마케팅 수신 동의', type: 'checkbox' },
      { key: 'memo', label: '메모', type: 'textarea' },
    ],
  },
  {
    id: 'technicians',
    name: '기사관리',
    list: '/api/admin/technicians',
    create: '/api/admin/technicians',
    formCreate: [
      { key: 'name', label: '이름', type: 'text', required: true },
      { key: 'phone', label: '전화번호', type: 'text', required: true },
      { key: 'baseRegion', label: '활동 지역', type: 'text', required: false },
    ],
    formEdit: [
      { key: 'name', label: '이름', type: 'text' },
      { key: 'phone', label: '전화번호', type: 'text' },
      { key: 'baseRegion', label: '활동 지역', type: 'text' },
      {
        key: 'status',
        label: '상태',
        type: 'select',
        options: opts([['pending', '대기'], ['approved', '승인'], ['rejected', '반려'], ['suspended', '정지']]),
      },
    ],
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
    name: '접수/배차',
    list: '/api/admin/bookings',
    create: '/api/admin/bookings',
    formCreate: [
      { key: 'customerName', label: '고객명', type: 'text', required: true },
      { key: 'customerPhone', label: '고객 전화', type: 'text', required: true },
      { key: 'region', label: '지역', type: 'text', required: true },
      { key: 'symptomCode', label: '증상 코드', type: 'text', required: true },
    ],
    formEdit: [
      { key: 'customerName', label: '고객명', type: 'text' },
      { key: 'customerPhone', label: '고객 전화', type: 'text' },
      { key: 'region', label: '지역', type: 'text' },
      { key: 'symptomCode', label: '증상 코드', type: 'text' },
      { key: 'adminMemo', label: '관리자 메모', type: 'textarea' },
    ],
  },
  {
    id: 'install_orders',
    name: '설치주문(목업)',
    list: '/api/admin/customer-orders',
    patchBase: '/api/admin/customer-orders',
    bulkDelete: false,
    selectable: false,
    formCreate: null,
    formEdit: [
      {
        key: 'orderStatus',
        label: '주문 상태',
        type: 'select',
        options: opts([
          ['created', '생성(미결제)'],
          ['paid', '결제표시만'],
          ['matching', '매칭중'],
          ['assigned', '배정'],
          ['accepted', '수락'],
          ['on_the_way', '출발'],
          ['working', '작업중'],
          ['completed', '완료'],
          ['cancelled', '취소'],
          ['refunded', '환불'],
        ]),
      },
      { key: 'assignedTechnicianId', label: '기사 ID(비우면 미배정)', type: 'text' },
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
    patchBase: '/api/admin/service-products',
    formCreate: null,
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

let active = tabs[0];
let rows = [];
let selected = null;
let modalState = { mode: 'create', record: null };

const $tabs = document.getElementById('tabs');
const $title = document.getElementById('title');
const $list = document.getElementById('list');
const $detail = document.getElementById('detail');
const $actions = document.getElementById('actions');
const $toolbar = document.getElementById('toolbar');
const $role = document.getElementById('role');
const $modalRoot = document.getElementById('modalRoot');
const $modalTitle = document.getElementById('modalTitle');
const $modalForm = document.getElementById('modalForm');
const $modalCancel = document.getElementById('modalCancel');
const $modalBackdrop = document.getElementById('modalBackdrop');

/** Nest 와 같은 호스트면 빈 문자열. Vite 등에서 열었다면 index.html 에서 window.__ADMIN_API_BASE__ 설정 */
function apiUrl(path) {
  const raw = typeof window.__ADMIN_API_BASE__ === 'string' ? window.__ADMIN_API_BASE__.trim().replace(/\/$/, '') : '';
  if (!path.startsWith('/')) return `${raw}/${path}`;
  return `${raw}${path}`;
}

function headers(extra = {}) {
  return { 'Content-Type': 'application/json', 'x-admin-role': $role.value, ...extra };
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
    if (row.convertedBookingId) lines.push(`접수/배차(booking): ${row.convertedBookingId}`);
    if (row.convertedOrderId) lines.push(`설치 주문 초안(order): ${row.convertedOrderId}`);
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
  $tabs.innerHTML = tabs
    .map((t) => `<button class="tab-btn ${t.id === active.id ? 'active' : ''}" data-id="${t.id}">${t.name}</button>`)
    .join('');
  $tabs.querySelectorAll('button').forEach((btn) => {
    btn.onclick = () => {
      active = tabs.find((t) => t.id === btn.dataset.id);
      load();
    };
  });
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
      if (row) openModal('edit', row);
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
  if (active.formCreate) parts.push(`<button class="primary" type="button" id="btnCreate">생성</button>`);
  if (active.bulkDelete !== false) {
    parts.push(`<button type="button" class="danger" id="btnDeleteChecked" title="체크한 행 삭제">선택 삭제</button>`);
  }
  if (active.id === 'bookings') parts.push(`<button type="button" id="btnRefresh">리프레시</button>`);
  $toolbar.className = 'toolbar';
  $toolbar.innerHTML = parts.join('');
  const c = document.getElementById('btnCreate');
  if (c) c.onclick = () => openModal('create', null);
  const del = document.getElementById('btnDeleteChecked');
  if (del) del.onclick = onDeleteChecked;
  const r = document.getElementById('btnRefresh');
  if (r) r.onclick = load;
}

function renderActions() {
  $actions.className = 'actions';
  if (!selected) {
    $actions.innerHTML = '<span class="muted">행을 선택하면 액션 버튼이 나옵니다.</span>';
    return;
  }
  if (active.id === 'members') {
    $actions.innerHTML = `<button data-s="active">활성</button><button data-s="inactive">비활성</button><button data-s="banned">차단</button>`;
    $actions.querySelectorAll('button').forEach((b) => (b.onclick = () => patch(`${active.list}/${selected.id}`, { status: b.dataset.s })));
  } else if (active.id === 'technicians') {
    $actions.innerHTML = `<button data-s="approved">승인</button><button data-s="suspended">정지</button>`;
    $actions.querySelectorAll('button').forEach((b) => (b.onclick = () => patch(`${active.list}/${selected.id}`, { status: b.dataset.s })));
  } else if (active.id === 'onboarding') {
    $actions.innerHTML = `<button data-s="reviewing">검토중</button><button data-s="approved">승인</button><button data-s="rejected">반려</button>`;
    $actions
      .querySelectorAll('button')
      .forEach((b) => (b.onclick = () => post(`/api/admin/technician-onboarding/${selected.id}/review`, { status: b.dataset.s })));
  } else if (active.id === 'bookings') {
    $actions.innerHTML = `<button id="toMatching">matching</button><button id="assign">기사배정 t_1</button><button id="unassign">배정해제</button>`;
    document.getElementById('toMatching').onclick = () => patch(`/api/admin/bookings/${selected.id}/status`, { toStatus: 'matching' });
    document.getElementById('assign').onclick = () => post(`/api/admin/bookings/${selected.id}/assign-technician`, { technicianId: 't_1' });
    document.getElementById('unassign').onclick = () => post(`/api/admin/bookings/${selected.id}/unassign-technician`, {});
  } else if (active.id === 'rewards') {
    $actions.innerHTML = `<button data-s="active">활성</button><button data-s="cancelled">취소</button>`;
    $actions
      .querySelectorAll('button')
      .forEach((b) => (b.onclick = () => patch(`/api/admin/coupons/${selected.id}`, { status: b.dataset.s })));
  } else if (active.id === 'settlements') {
    $actions.innerHTML = `<button>정산확정</button><button>지급완료</button><button>보류</button>`;
    const [a, b, c] = $actions.querySelectorAll('button');
    a.onclick = () => post(`/api/admin/settlements/${selected.id}/confirm`, { adjustmentAmount: 0 });
    b.onclick = () => patch(`/api/admin/settlements/${selected.id}/status`, { status: 'paid' });
    c.onclick = () => patch(`/api/admin/settlements/${selected.id}/status`, { status: 'held' });
  } else if (active.id === 'emergency_leads') {
    $actions.innerHTML =
      '<span class="muted">행 선택 후 ID 또는 행 클릭 → 매칭상태만 수정합니다. 공개 접수는 고객 폼에서 저장됩니다.</span>';
  } else if (active.id === 'install_orders') {
    $actions.innerHTML = `<button type="button" id="iomMockPay">목업결제 확정</button><button type="button" id="iomMatch">matching</button><button type="button" id="iomAssign">assign t_1</button><button type="button" id="iomDone">completed</button>`;
    document.getElementById('iomMockPay').onclick = async () => {
      try {
        await req(`/api/payments/mock-confirm`, { method: 'POST', body: JSON.stringify({ orderId: selected.id }) });
        await load();
      } catch (err) {
        alert(err.message);
      }
    };
    document.getElementById('iomMatch').onclick = () =>
      patch(`/api/admin/customer-orders/${selected.id}`, { orderStatus: 'matching' });
    document.getElementById('iomAssign').onclick = () =>
      patch(`/api/admin/customer-orders/${selected.id}`, { orderStatus: 'assigned', assignedTechnicianId: 't_1' });
    document.getElementById('iomDone').onclick = () =>
      patch(`/api/admin/customer-orders/${selected.id}`, { orderStatus: 'completed' });
  } else if (active.id === 'service_products' || active.id === 'service_addons') {
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
  const req = f.required ? ' required' : '';
  return `<label for="${id}">${escapeHtml(f.label)}<input type="${f.type}" id="${id}" name="${escapeHtml(f.key)}" value="${escapeHtml(String(v))}"${min}${step}${req} /></label>`;
}

function openModal(mode, record) {
  const fields = mode === 'create' ? active.formCreate : active.formEdit;
  if (!fields || !fields.length) {
    alert(mode === 'create' ? '이 탭에서는 생성할 수 없습니다.' : '이 탭에서는 수정 폼이 없습니다.');
    return;
  }
  modalState = { mode, record };
  $modalTitle.textContent = mode === 'create' ? `${active.name} — 새로 만들기` : `${active.name} — 수정 (${record.id})`;
  $modalForm.innerHTML = fields
    .map((f) => buildFieldHtml(f, record && record[f.key] !== undefined ? record[f.key] : ''))
    .join('');
  $modalRoot.classList.remove('hidden');
  $modalRoot.setAttribute('aria-hidden', 'false');
}

async function onModalSubmit(e) {
  e.preventDefault();
  const fields = modalState.mode === 'create' ? active.formCreate : active.formEdit;
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
        if (modalState.mode === 'edit' && active.id === 'install_orders' && f.key === 'assignedTechnicianId')
          body[f.key] = null;
        continue;
      }
      body[f.key] = raw;
    }
  }
  try {
    if (modalState.mode === 'create') {
      await req(active.create, { method: 'POST', body: JSON.stringify(body) });
    } else {
      const id = modalState.record.id;
      const url = patchUrlFor(active, id);
      const patchBody = { ...body };
      if (active.id === 'settlements') {
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
  const base =
    active.patchBase ||
    (active.id === 'onboarding' ? '/api/admin/technician-onboarding' : active.list);
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
  $title.textContent = active.name;
  renderToolbar();
  try {
    rows = await req(active.list + (active.listSuffix || ''));
    selected = rows[0] || null;
    $list.innerHTML = tableForRows(rows, active);
    wireTableHandlers();
    if (selected) {
      const tr = $list.querySelector(`tr[data-id="${selected.id.replace(/"/g, '')}"]`);
      if (tr) tr.classList.add('row-selected');
    }
    $detail.textContent = formatDetailPanel(selected);
    renderActions();
  } catch (e) {
    $list.innerHTML = `<p class="muted">오류: ${escapeHtml(e.message)}</p>`;
    $detail.textContent = '';
    $actions.innerHTML = '';
  }
}

$modalForm.addEventListener('submit', onModalSubmit);
$modalCancel.onclick = closeModal;
$modalBackdrop.onclick = closeModal;

$role.onchange = load;
load();
