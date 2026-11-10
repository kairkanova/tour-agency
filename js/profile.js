/* Профиль пользователя: данные, статистика, избранные туры, экспорт JSON, выход. */
(async () => {
  UI.renderHeader('profile');
  UI.renderFooter();

  const root = document.getElementById('profile-root');
  const esc = UI.escapeHtml;

  let user;
  try {
    user = await Store.currentUser();
  } catch (err) {
    root.innerHTML = UI.errorBlock(err.message);
    return;
  }
  if (!user) {
    location.replace('login.html?next=profile.html');
    return;
  }

  async function render() {
    const favTours = await Store.getFavoriteTours();
    const since = user.createdAt ? `Участник с ${user.createdAt.slice(0, 4)} года` : 'Новый участник';

    root.innerHTML = `
      <section class="card">
        <div class="profile-top">
          <div class="avatar">${esc(UI.initials(user))}</div>
          <div class="info">
            <h1>${esc(user.firstName)} ${esc(user.lastName)}</h1>
            <div class="muted">${esc(user.email)}</div>
            <span class="member-tag">${since}</span>
          </div>
          <a href="#personal" class="btn btn-ghost btn-sm">Редактировать</a>
        </div>
      </section>

      <section class="stats">
        <div class="stat"><b>${user.trips}</b><span>Поездки</span></div>
        <div class="stat"><b id="stat-fav">${favTours.length}</b><span>Избранное</span></div>
        <div class="stat"><b>${user.bonuses.toLocaleString('ru-RU')}</b><span>Бонусы</span></div>
        <div class="stat"><b>${user.reviewsCount}</b><span>Отзывы</span></div>
      </section>

      <section class="card">
        <div class="tabs" role="tablist">
          <button class="tab is-active" data-tab="personal">Личные данные</button>
          <button class="tab" data-tab="favorites">Избранные туры</button>
          <button class="tab" data-tab="json">Мои данные (JSON)</button>
        </div>

        <form class="tab-panel" data-panel="personal" id="personal" novalidate>
          <div class="form-grid">
            ${field('firstName', 'Имя', user.firstName)}
            ${field('lastName', 'Фамилия', user.lastName)}
            ${field('email', 'Email', user.email, 'email', true)}
            ${field('phone', 'Телефон', user.phone, 'tel')}
            ${field('birthDate', 'Дата рождения', user.birthDate, 'date')}
            ${field('city', 'Город', user.city)}
          </div>
          <div class="alert alert-error" id="profile-error" hidden style="margin-top:14px"></div>
          <div class="profile-actions" style="margin-top:20px">
            <button type="submit" class="btn btn-primary">Сохранить изменения</button>
            <button type="button" class="btn btn-danger" id="logout">Выйти</button>
          </div>
        </form>

        <div class="tab-panel" data-panel="favorites" hidden>
          ${favTours.length ? favTours.map(t => `
            <a href="tour.html?id=${t.id}" class="mini-tour">
              <img src="${t.images[0]}" alt="">
              <div class="grow">
                <h4>${esc(t.title)}</h4>
                <div class="muted small">${UI.formatDate(t.dateFrom)} - ${UI.formatDate(t.dateTo)} · ${UI.nightsText(t.nights)} · ${esc(t.meal)}</div>
                <div class="muted small">${esc(t.city)}, ${esc(t.country)}</div>
              </div>
              <span class="price">${UI.formatPrice(t.price)}</span>
            </a>`).join('') + `<p style="margin-top:14px"><a href="favorites.html">Перейти в избранное →</a></p>`
          : `<p class="muted">Вы ещё не сохранили ни одного тура. <a href="index.html">Подобрать тур</a></p>`}
        </div>

        <div class="tab-panel" data-panel="json" hidden>
          <p class="muted" style="margin-bottom:12px">Так ваша запись выглядит в формате <b>users.json</b>.
            Пароль хранится только в виде хеша SHA-256.</p>
          <pre class="json-view">${esc(JSON.stringify(user, null, 2))}</pre>
          <button type="button" class="btn btn-ghost" id="download-json" style="margin-top:14px">Скачать мои данные (.json)</button>
        </div>
      </section>`;

    bind();
  }

  function field(id, label, value, type = 'text', readonly = false) {
    return `<div>
      <label class="field-label" for="${id}">${label}</label>
      <input class="input" id="${id}" type="${type}" value="${esc(value || '')}" ${readonly ? 'readonly' : ''}>
    </div>`;
  }

  function bind() {
    root.querySelector('.tabs').addEventListener('click', e => {
      const tab = e.target.closest('.tab');
      if (tab) openTab(tab.dataset.tab);
    });

    root.querySelector('a[href="#personal"]').addEventListener('click', e => {
      e.preventDefault();
      openTab('personal');
      document.getElementById('firstName').focus();
    });

    document.getElementById('personal').addEventListener('submit', async e => {
      e.preventDefault();
      const val = id => document.getElementById(id).value.trim();
      const err = document.getElementById('profile-error');
      const patch = {
        firstName: val('firstName'), lastName: val('lastName'),
        phone: val('phone'), birthDate: val('birthDate'), city: val('city')
      };
      if (patch.firstName.length < 2 || patch.lastName.length < 2) {
        err.textContent = 'Имя и фамилия должны содержать минимум 2 символа.';
        err.hidden = false;
        return;
      }
      try {
        user = await Store.updateUser(patch);
        UI.toast('Изменения сохранены', 'success');
        UI.renderHeader('profile');
        render();
      } catch (ex) {
        err.textContent = ex.message;
        err.hidden = false;
      }
    });

    document.getElementById('logout').addEventListener('click', () => {
      Store.logout();
      location.href = 'index.html';
    });

    document.getElementById('download-json').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(user, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `user-${user.id}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
  }

  function openTab(name) {
    root.querySelectorAll('.tab').forEach(t => t.classList.toggle('is-active', t.dataset.tab === name));
    root.querySelectorAll('.tab-panel').forEach(p => { p.hidden = p.dataset.panel !== name; });
  }

  render();
})();
