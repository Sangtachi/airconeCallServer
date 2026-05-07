(() => {
  const KEY = 'acnow.session.v1';

  function read() {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || !parsed.role) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function write(session) {
    const next = {
      id: session.id || session.memberId || session.technicianId || session.sellerId || null,
      role: session.role,
      name: session.name || session.companyName || '사용자',
      phone: session.phone || null,
      status: session.status || null,
      signedInAt: new Date().toISOString(),
    };
    sessionStorage.setItem(KEY, JSON.stringify(next));
    return next;
  }

  function clear() {
    sessionStorage.removeItem(KEY);
  }

  function displayName(session) {
    const role = session?.role || '';
    const base = session?.name || session?.companyName || '사용자';
    if (/대표님$|기사님$|회원님$/.test(base)) return base;
    if (role === 'seller' || role === 'admin' || role === 'super_admin') return `${base} 대표님`;
    if (role === 'technician') return `${base} 기사님`;
    if (role === 'customer') return `${base} 회원님`;
    return base;
  }

  function dashboardHref(session = read()) {
    if (!session) return '/auth.html#login';
    return '/dashboard.html';
  }

  function logout(to = '/index.html') {
    clear();
    window.location.href = to;
  }

  function bindLogout(selector = '[data-logout]') {
    document.querySelectorAll(selector).forEach((el) => {
      el.addEventListener('click', (event) => {
        event.preventDefault();
        logout(el.getAttribute('data-logout-target') || '/index.html');
      });
    });
  }

  window.ACnowSession = {
    KEY,
    read,
    write,
    clear,
    displayName,
    dashboardHref,
    logout,
    bindLogout,
  };
})();
