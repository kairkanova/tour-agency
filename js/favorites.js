/* Избранное (UC-04): список сохранённых туров, переход на тур, удаление. */
(async () => {
  UI.renderHeader('favorites');
  UI.renderFooter();

  const root = document.getElementById('fav-root');
  const title = document.getElementById('fav-title');
  const esc = UI.escapeHtml;

  if (!Store.isLoggedIn()) {
    root.innerHTML = `
      <div class="state-box">
        <div class="state-icon">${UI.icon.user}</div>
        <h3>Войдите, чтобы видеть избранное</h3>
        <p>Избранные туры привязаны к вашему аккаунту и сохраняются при следующем заходе.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
          <a href="login.html?next=favorites.html" class="btn btn-primary">Войти</a>
          <a href="register.html?next=favorites.html" class="btn btn-ghost">Зарегистрироваться</a>
        </div>
      </div>`;
    return;
  }

  async function render() {
    let tours;
    try {
      tours = await Store.getFavoriteTours();
    } catch (err) {
      root.innerHTML = UI.errorBlock(err.message);
      return;
    }
    title.textContent = `Сохранённые туры (${tours.length})`;

    if (!tours.length) {
      root.innerHTML = `
        <div class="state-box">
          <div class="state-icon">${UI.icon.heart}</div>
          <h3>В избранном пока пусто</h3>
          <p>Нажмите на сердечко на карточке или странице тура, чтобы сохранить его здесь.</p>
          <a href="index.html" class="btn btn-primary">Подобрать тур</a>
        </div>`;
      return;
    }

    root.innerHTML = `<div class="fav-list">${tours.map(t => `
      <article class="fav-item">
        <a href="tour.html?id=${t.id}" class="fav-item-img"><img src="${t.images[0]}" alt="${esc(t.title)}"></a>
        <div>
          <div class="tour-card-loc">${UI.icon.pin}${esc(t.resort)}</div>
          <h3>${esc(t.city)}, ${esc(t.country)}</h3>
          <p class="muted small">${esc(t.title)} · ${UI.formatDate(t.dateFrom)} - ${UI.formatDate(t.dateTo)}</p>
          <div class="fav-item-tags">
            <span>${UI.nightsText(t.nights)}</span>
            <span>${esc(t.hotel.type)} ${t.hotel.stars}★</span>
            <span>${esc(t.meal)}</span>
            <span>${esc(t.flight.airline)}</span>
          </div>
        </div>
        <div class="fav-item-side">
          <div><span class="muted small">от</span> <span class="price">${UI.formatPrice(t.price)}</span></div>
          <div class="actions">
            <button type="button" class="icon-btn" data-remove="${t.id}" aria-label="Удалить из избранного" title="Удалить">${UI.icon.trash}</button>
            <a href="tour.html?id=${t.id}" class="btn btn-primary btn-sm">Смотреть тур</a>
          </div>
        </div>
      </article>`).join('')}</div>`;
  }

  root.addEventListener('click', async e => {
    const btn = e.target.closest('[data-remove]');
    if (!btn) return;
    try {
      const count = await Store.removeFavorite(btn.dataset.remove);
      UI.updateFavBadge(count);
      UI.toast('Тур удалён из избранного');
      render();
    } catch (err) {
      UI.toast('Не удалось удалить: ' + err.message, 'error');
    }
  });

  render();
})();
