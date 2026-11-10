/* Страница тура (UC-02) и добавление в избранное (UC-03). */
(async () => {
  UI.renderHeader('');
  UI.renderFooter();

  const root = document.getElementById('tour-root');
  const id = new URLSearchParams(location.search).get('id');
  const esc = UI.escapeHtml;

  let tour;
  try {
    if (!id) throw new Error('Тур не выбран. Вернитесь на главную и выберите тур из списка.');
    tour = await Store.getTour(id);
    if (!tour) throw new Error('Тур не найден. Возможно, он был удалён из каталога.');
  } catch (err) {
    root.innerHTML = `<div class="section">${UI.errorBlock(err.message)}</div>`;
    return;
  }

  const isFav = await Store.isFavorite(tour.id);
  document.title = `${tour.title} - Атлас`;

  const avgReview = tour.reviews.reduce((s, r) => s + r.rating, 0) / tour.reviews.length;
  const flightText = tour.flight.direct ? 'Прямой рейс' : 'С пересадкой';

  root.innerHTML = `
    <nav class="breadcrumbs" aria-label="Навигация">
      <a href="index.html">Главная</a><span>›</span>
      <span>${esc(tour.country)}</span><span>›</span>
      <span>${esc(tour.title)}</span>
    </nav>

    <div class="tour-layout">
      <div class="tour-main">
        <div class="card">
          <div class="tour-title-row">
            <div>
              <span class="tag">${UI.icon.check} ${esc(tour.hotel.type)} · ${tour.hotel.stars}★</span>
              <h1 class="tour-title">${esc(tour.title)}</h1>
              <div class="tour-sub">
                <span class="stars">${UI.starsText(tour.hotel.stars)}</span>
                <span><span class="rating">${tour.hotel.rating.toFixed(1)}</span> ${UI.reviewsText(tour.hotel.reviews)}</span>
                <span class="loc">${UI.icon.pin} ${esc(tour.city)}, ${esc(tour.country)} · ${esc(tour.resort)}</span>
              </div>
            </div>
            <div class="tour-price-box">
              <div class="muted small">Стоимость от</div>
              <div class="price">${UI.formatPrice(tour.price)}</div>
              <div class="muted small">за человека</div>
            </div>
          </div>
        </div>

        <!-- Фотографии: галерея локаций -->
        <div class="gallery">
          ${tour.images.map((src, i) => `
            <button type="button" data-photo="${i}" aria-label="Открыть фото ${i + 1}">
              <img src="${src}" alt="${esc(tour.title)} - фото ${i + 1}" ${i ? 'loading="lazy"' : ''}>
            </button>`).join('')}
        </div>

        <!-- Ключевые параметры -->
        <div class="features">
          ${feature(UI.icon.plane, 'Перелёт', `${esc(tour.flight.airline)}<br>${flightText}`)}
          ${feature(UI.icon.meal, 'Питание', esc(tour.meal))}
          ${feature(UI.icon.hotel, 'Отель', `${esc(tour.hotel.type)}, ${tour.hotel.stars}★`)}
          ${feature(UI.icon.calendar, 'Даты', `${UI.formatDate(tour.dateFrom)} - ${UI.formatDate(tour.dateTo)}<br>${UI.nightsText(tour.nights)}`)}
          ${feature(UI.icon.shield, 'Страховка', 'Включена')}
        </div>

        <div class="card">
          <div class="tabs" role="tablist">
            <button class="tab is-active" role="tab" data-tab="overview">Обзор</button>
            <button class="tab" role="tab" data-tab="route">Маршрут</button>
            <button class="tab" role="tab" data-tab="amenities">Удобства</button>
            <button class="tab" role="tab" data-tab="reviews">Отзывы (${tour.reviews.length})</button>
          </div>

          <div class="tab-panel" data-panel="overview">
            <h3>Описание тура</h3>
            <p>${esc(tour.description)}</p>

            <h3>Основные моменты</h3>
            <ul class="check-list">${tour.highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul>

            <h3>Условия тура</h3>
            <table class="info-table">
              <tr><td>Страна и город</td><td>${esc(tour.country)}, ${esc(tour.city)}</td></tr>
              <tr><td>Курорт</td><td>${esc(tour.resort)}</td></tr>
              <tr><td>Период</td><td>${UI.formatDateFull(tour.dateFrom)} - ${UI.formatDateFull(tour.dateTo)} (${UI.nightsText(tour.nights)})</td></tr>
              <tr><td>Авиакомпания</td><td>${esc(tour.flight.airline)}, ${flightText.toLowerCase()}</td></tr>
              <tr><td>Багаж</td><td>${esc(tour.flight.baggage)}</td></tr>
              <tr><td>Питание</td><td>${esc(tour.meal)}</td></tr>
              <tr><td>Страховка</td><td>${esc(tour.insurance)}</td></tr>
            </table>
          </div>

          <div class="tab-panel" data-panel="route" hidden>
            <h3>Программа тура</h3>
            <ol class="timeline">
              ${tour.program.map(p => `<li><b>${esc(p.day)}</b><span>${esc(p.text)}</span></li>`).join('')}
            </ol>
          </div>

          <div class="tab-panel" data-panel="amenities" hidden>
            <h3>${esc(tour.hotel.name)}</h3>
            <p class="muted">${esc(tour.hotel.type)} · ${UI.starsText(tour.hotel.stars)} · рейтинг ${tour.hotel.rating.toFixed(1)} из 5</p>
            <h3>Удобства</h3>
            <div class="amenities">${tour.amenities.map(a => `<span class="amenity">${esc(a)}</span>`).join('')}</div>
          </div>

          <div class="tab-panel" data-panel="reviews" hidden>
            <div class="review-score">
              <span class="big">${tour.hotel.rating.toFixed(1)}</span>
              <div>
                <div class="stars">${UI.starsText(tour.hotel.stars)}</div>
                <div class="muted small">${UI.reviewsText(tour.hotel.reviews)} об отеле</div>
              </div>
            </div>
            ${tour.reviews.map(r => `
              <div class="review">
                <div class="review-head"><b>${esc(r.name)}</b><span class="rating">${r.rating.toFixed(1)}</span></div>
                <p>${esc(r.text)}</p>
              </div>`).join('')}
            <p class="muted small" style="margin-top:12px">Средняя оценка отзывов: ${avgReview.toFixed(1)}</p>
          </div>
        </div>
      </div>

      <!-- Стоимость и расчёт -->
      <aside class="card side-card">
        <h3>Стоимость тура</h3>
        <div>
          <span class="field-label">Количество туристов</span>
          <div class="stepper">
            <button type="button" id="minus" aria-label="Меньше">−</button>
            <output id="travellers">2 туриста</output>
            <button type="button" id="plus" aria-label="Больше">+</button>
          </div>
        </div>
        <div>
          <div class="calc-row"><span>Перелёт</span><b>${UI.formatPrice(tour.priceDetails.flight)}</b></div>
          <div class="calc-row"><span>Проживание, ${UI.nightsText(tour.nights)}</span><b>${UI.formatPrice(tour.priceDetails.hotel)}</b></div>
          <div class="calc-row"><span>Трансфер</span><b>${UI.formatPrice(tour.priceDetails.transfer)}</b></div>
          <div class="calc-row"><span>Страховка</span><b>${UI.formatPrice(tour.priceDetails.insurance)}</b></div>
          <div class="calc-row"><span>Итого за человека</span><b>${UI.formatPrice(tour.price)}</b></div>
        </div>
        <div class="calc-total">
          <b id="total-label">Итого за 2 туристов</b>
          <span class="price" id="total">${UI.formatPrice(tour.price * 2)}</span>
        </div>
        <button type="button" class="btn btn-primary btn-block fav-big${isFav ? ' is-active' : ''}" data-fav="${tour.id}" aria-pressed="${isFav}">
          ${UI.icon.heart}<span class="fav-label">${isFav ? 'В избранном' : 'В избранное'}</span>
        </button>
        <p class="muted small">Цены указаны в долларах США. ${Store.isLoggedIn() ? '' : 'Чтобы сохранить тур, войдите в аккаунт.'}</p>
      </aside>
    </div>`;

  function feature(svg, title, text) {
    return `<div class="feature"><span class="feature-icon">${svg}</span><b>${title}</b><span>${text}</span></div>`;
  }

  // Вкладки
  root.querySelector('.tabs').addEventListener('click', e => {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    root.querySelectorAll('.tab').forEach(t => t.classList.toggle('is-active', t === tab));
    root.querySelectorAll('.tab-panel').forEach(p => { p.hidden = p.dataset.panel !== tab.dataset.tab; });
  });

  // Расчёт стоимости
  let people = 2;
  const minus = document.getElementById('minus');
  const plus = document.getElementById('plus');
  function updateTotal() {
    const word = UI.plural(people, ['турист', 'туриста', 'туристов']);
    document.getElementById('travellers').textContent = `${people} ${word}`;
    document.getElementById('total-label').textContent =
      `Итого за ${people} ${UI.plural(people, ['туриста', 'туристов', 'туристов'])}`;
    document.getElementById('total').textContent = UI.formatPrice(tour.price * people);
    minus.disabled = people <= 1;
    plus.disabled = people >= 6;
  }
  minus.addEventListener('click', () => { people--; updateTotal(); });
  plus.addEventListener('click', () => { people++; updateTotal(); });
  updateTotal();

  // Избранное
  UI.bindFavButtons(root);

  // Просмотр фото
  root.querySelector('.gallery').addEventListener('click', e => {
    const btn = e.target.closest('[data-photo]');
    if (btn) openLightbox(Number(btn.dataset.photo));
  });

  function openLightbox(index) {
    let i = index;
    const box = document.createElement('div');
    box.className = 'lightbox';
    box.innerHTML = `
      <img alt="">
      <button class="lightbox-close" aria-label="Закрыть">×</button>
      <button class="lightbox-nav lightbox-prev" aria-label="Предыдущее">‹</button>
      <button class="lightbox-nav lightbox-next" aria-label="Следующее">›</button>`;
    const img = box.querySelector('img');
    const show = () => { img.src = tour.images[i]; img.alt = `${tour.title} - фото ${i + 1}`; };
    const step = d => { i = (i + d + tour.images.length) % tour.images.length; show(); };
    const close = () => { box.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = e => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    };
    box.addEventListener('click', e => {
      if (e.target === box || e.target.closest('.lightbox-close')) close();
      else if (e.target.closest('.lightbox-prev')) step(-1);
      else if (e.target.closest('.lightbox-next')) step(1);
    });
    document.addEventListener('keydown', onKey);
    show();
    document.body.appendChild(box);
  }
})();
