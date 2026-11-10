// Общие функции для всех страниц
const UI = (() => {
  const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
    ));
  }

  function formatPrice(value) {
    return '$' + Number(value).toLocaleString('ru-RU').replace(/ /g, ' ');
  }

  function formatDate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return `${d} ${MONTHS[m - 1]}`;
  }

  function formatDateFull(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return `${d} ${MONTHS[m - 1]} ${y}`;
  }

  // plural(7, ['ночь', 'ночи', 'ночей']) -> 'ночей'
  function plural(n, forms) {
    const n10 = n % 10, n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return forms[0];
    if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return forms[1];
    return forms[2];
  }

  const nightsText = n => `${n} ${plural(n, ['ночь', 'ночи', 'ночей'])}`;
  const toursText = n => `${n} ${plural(n, ['тур', 'тура', 'туров'])}`;
  const reviewsText = n => `${n} ${plural(n, ['отзыв', 'отзыва', 'отзывов'])}`;
  const starsText = n => '★'.repeat(n);

  // Иконки (inline SVG)
  const icon = {
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.4 4.5 6.9 4.5c2 0 3.6 1.1 5.1 2.9 1.5-1.8 3.1-2.9 5.1-2.9 3.5 0 5.5 3.5 4.2 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"/></svg>',
    plane: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15.5v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0v5l-8 5v2l8-2.5V18l-2 1.5V21l3.5-1 3.5 1v-1.5L13 18v-5z"/></svg>',
    meal: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2v8a2 2 0 0 0 2 2v10h2V12a2 2 0 0 0 2-2V2h-1.5v6h-1V2h-1v6h-1V2zm10 0c-2 0-3.5 2.5-3.5 6v5H16v9h2V2z"/></svg>',
    hotel: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4h4a2 2 0 0 1 2 2v10h-7v-4h-4v4zm4-14v2h2V7zm4 0v2h2V7zm-4 4v2h2v-2zm4 0v2h2v-2zm6 2v2h2v-2zm0 4v2h2v-2z"/></svg>',
    shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5zm-1.2 13.4l5.7-5.7-1.4-1.4-4.3 4.3-2.1-2.1-1.4 1.4z"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h2v2h6V2h2v2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2zm-2 8v10h14V10z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 16.2l-4.2-4.2-1.4 1.4 5.6 5.6 11-11-1.4-1.4z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6l1 2h4v2H4V5h4zm-3 6h12l-1 12H7z"/></svg>',
    luggage: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 2h6v4h2a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2v1h-2v-1H9v1H7v-1a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2zm2 2v2h2V4zM8 10v8h2v-8zm6 0v8h2v-8z"/></svg>',
    user: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.4 0-9 2.2-9 5.5V22h18v-2.5C21 16.2 16.4 14 12 14z"/></svg>'
  };

  // Шапка и подвал

  async function renderHeader(active) {
    const el = document.getElementById('site-header');
    if (!el) return;
    let user = null;
    try { user = await Store.currentUser(); } catch (e) { /* данные не загрузились - шапка без пользователя */ }
    const favCount = user ? user.favorites.length : 0;
    const link = (href, key, text, extra = '') =>
      `<a href="${href}" class="nav-link${active === key ? ' is-active' : ''}">${text}${extra}</a>`;

    el.innerHTML = `
      <div class="header-inner container">
        <a href="index.html" class="logo" aria-label="На главную">
          <span class="logo-mark">${icon.plane}</span>
          <span class="logo-text">Атлас<small>турагентство</small></span>
        </a>
        <button class="burger" aria-label="Меню" aria-expanded="false"><span></span><span></span><span></span></button>
        <nav class="nav">
          ${link('index.html', 'home', 'Главная')}
          ${link('favorites.html', 'favorites', 'Избранное',
            `<span class="badge" data-fav-count ${favCount ? '' : 'hidden'}>${favCount}</span>`)}
          ${link('about.html', 'about', 'О нас')}
          ${user
            ? `<a href="profile.html" class="nav-user${active === 'profile' ? ' is-active' : ''}">
                 <span class="avatar avatar-sm">${escapeHtml(initials(user))}</span>
                 <span>${escapeHtml(user.firstName)}</span>
               </a>`
            : `<a href="login.html" class="btn btn-primary btn-sm">Войти</a>`}
        </nav>
      </div>`;

    const burger = el.querySelector('.burger');
    burger.addEventListener('click', () => {
      const open = el.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', String(open));
    });
  }

  function updateFavBadge(count) {
    document.querySelectorAll('[data-fav-count]').forEach(b => {
      b.textContent = count;
      b.hidden = !count;
    });
  }

  function renderFooter() {
    const el = document.getElementById('site-footer');
    if (!el) return;
    el.innerHTML = `
      <div class="container footer-inner">
        <div>
          <div class="logo logo-footer"><span class="logo-mark">${icon.plane}</span><span class="logo-text">Атлас<small>турагентство</small></span></div>
          <p class="muted">Подбор туров по вашим датам, бюджету и направлению.</p>
        </div>
        <nav class="footer-nav">
          <a href="index.html">Главная</a>
          <a href="favorites.html">Избранное</a>
          <a href="profile.html">Профиль</a>
          <a href="about.html">О нас</a>
        </nav>
        <p class="muted small">© ${new Date().getFullYear()} Атлас. Учебный проект.</p>
      </div>`;
  }

  function initials(user) {
    return ((user.firstName || '')[0] || '') + ((user.lastName || '')[0] || '');
  }

  // Уведомления

  function toast(message, type = 'info') {
    let box = document.querySelector('.toasts');
    if (!box) {
      box = document.createElement('div');
      box.className = 'toasts';
      box.setAttribute('role', 'status');
      box.setAttribute('aria-live', 'polite');
      document.body.appendChild(box);
    }
    const item = document.createElement('div');
    item.className = `toast toast-${type}`;
    item.textContent = message;
    box.appendChild(item);
    setTimeout(() => item.classList.add('is-hiding'), 2800);
    setTimeout(() => item.remove(), 3200);
  }

  // Карточка тура

  function tourCard(tour, isFav) {
    return `
      <article class="tour-card">
        <a href="tour.html?id=${tour.id}" class="tour-card-img">
          <img src="${tour.images[0]}" alt="${escapeHtml(tour.title)}" loading="lazy">
          <span class="tour-card-nights">${nightsText(tour.nights)}</span>
        </a>
        <button class="fav-btn${isFav ? ' is-active' : ''}" data-fav="${tour.id}"
                aria-pressed="${isFav}" aria-label="${isFav ? 'Убрать из избранного' : 'Добавить в избранное'}">
          ${icon.heart}
        </button>
        <div class="tour-card-body">
          <div class="tour-card-loc">${icon.pin}${escapeHtml(tour.city)}, ${escapeHtml(tour.country)}</div>
          <h3 class="tour-card-title"><a href="tour.html?id=${tour.id}">${escapeHtml(tour.title)}</a></h3>
          <div class="tour-card-meta">
            <span class="stars">${starsText(tour.hotel.stars)}</span>
            <span class="rating">${tour.hotel.rating.toFixed(1)}</span>
            <span class="muted">· ${escapeHtml(tour.meal)}</span>
          </div>
          <div class="tour-card-meta muted">
            ${formatDate(tour.dateFrom)} - ${formatDate(tour.dateTo)} · ${escapeHtml(tour.flight.airline)}${tour.flight.direct ? ', прямой' : ''}
          </div>
          <div class="tour-card-foot">
            <div><span class="muted small">от</span> <span class="price">${formatPrice(tour.price)}</span></div>
            <a href="tour.html?id=${tour.id}" class="btn btn-ghost btn-sm">Подробнее</a>
          </div>
        </div>
      </article>`;
  }

  // кнопки "в избранное", без входа отправляем на страницу входа
  function bindFavButtons(container, onChange) {
    container.addEventListener('click', async e => {
      const btn = e.target.closest('[data-fav]');
      if (!btn) return;
      e.preventDefault();
      try {
        const { added, count } = await Store.toggleFavorite(btn.dataset.fav);
        container.querySelectorAll(`[data-fav="${btn.dataset.fav}"]`).forEach(b => setFavState(b, added));
        updateFavBadge(count);
        toast(added ? 'Тур добавлен в избранное' : 'Тур удалён из избранного', added ? 'success' : 'info');
        if (onChange) onChange(added, count);
      } catch (err) {
        if (err.message === 'AUTH_REQUIRED') {
          toast('Войдите, чтобы сохранять туры в избранное');
          setTimeout(() => goLogin(), 900);
        } else {
          toast('Не удалось сохранить: ' + err.message, 'error');
        }
      }
    });
  }

  function setFavState(btn, active) {
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', String(active));
    btn.setAttribute('aria-label', active ? 'Убрать из избранного' : 'Добавить в избранное');
    const label = btn.querySelector('.fav-label');
    if (label) label.textContent = active ? 'В избранном' : 'В избранное';
  }

  function goLogin() {
    const pageName = location.pathname.split('/').pop() || 'index.html';
    const next = encodeURIComponent(pageName + location.search);
    location.href = `login.html?next=${next}`;
  }

  function errorBlock(message) {
    return `<div class="state-box state-error">
      <h3>Что-то пошло не так</h3>
      <p>${escapeHtml(message)}</p>
      <a href="index.html" class="btn btn-primary">На главную</a>
    </div>`;
  }

  return {
    escapeHtml, formatPrice, formatDate, formatDateFull, plural, nightsText, toursText, reviewsText, starsText,
    icon, renderHeader, renderFooter, updateFavBadge, initials, toast, tourCard, bindFavButtons, setFavState,
    goLogin, errorBlock
  };
})();
