/* Главная страница: подбор тура по фильтрам (UC-01). */
(async () => {
  UI.renderHeader('home');
  UI.renderFooter();

  const $ = id => document.getElementById(id);
  const form = $('filter-form');
  const list = $('tours-list');
  const showBtn = $('show-btn');

  let tours = [];
  let favIds = [];
  let shown = [];          // туры, показанные после последнего нажатия «Показать»

  try {
    tours = await Store.getTours();
    favIds = await Store.getFavoriteIds();
  } catch (err) {
    list.innerHTML = UI.errorBlock(err.message);
    showBtn.disabled = true;
    return;
  }

  // Заполнение полей из данных

  const countries = [...new Set(tours.map(t => t.country))].sort((a, b) => a.localeCompare(b, 'ru'));
  $('country-chips').innerHTML = countries
    .map(c => `<button type="button" class="chip" data-country="${UI.escapeHtml(c)}">${UI.escapeHtml(c)}</button>`)
    .join('');

  const airlines = [...new Set(tours.map(t => t.flight.airline))].sort();
  $('airline').insertAdjacentHTML('beforeend',
    airlines.map(a => `<option value="${UI.escapeHtml(a)}">${UI.escapeHtml(a)}</option>`).join(''));

  // Чтение фильтров

  function readFilters() {
    const num = el => (el.value === '' ? null : Number(el.value));
    return {
      countries: [...document.querySelectorAll('#country-chips .chip.is-active')].map(c => c.dataset.country),
      dateFrom: $('date-from').value || null,
      dateTo: $('date-to').value || null,
      priceMin: num($('price-min')),
      priceMax: num($('price-max')),
      rating: Number(document.querySelector('#rating-chips .chip.is-active').dataset.rating),
      airline: $('airline').value,
      directOnly: $('direct-only').checked
    };
  }

  // Проверка значений: «от» не может быть больше «до», цена не отрицательная.
  function validate(f) {
    let priceMsg = '';
    if ((f.priceMin !== null && f.priceMin < 0) || (f.priceMax !== null && f.priceMax < 0)) {
      priceMsg = 'Цена не может быть отрицательной';
    } else if (f.priceMin !== null && f.priceMax !== null && f.priceMin > f.priceMax) {
      priceMsg = 'Цена «от» больше цены «до»';
    }
    const dateMsg = f.dateFrom && f.dateTo && f.dateFrom > f.dateTo ? 'Дата начала позже даты окончания' : '';

    $('price-error').textContent = priceMsg;
    $('price-min').classList.toggle('is-invalid', Boolean(priceMsg));
    $('price-max').classList.toggle('is-invalid', Boolean(priceMsg));
    $('date-error').textContent = dateMsg;
    $('date-from').classList.toggle('is-invalid', Boolean(dateMsg));
    $('date-to').classList.toggle('is-invalid', Boolean(dateMsg));
    return !priceMsg && !dateMsg;
  }

  // Фильтрация

  function applyFilters(f) {
    return tours.filter(t =>
      (!f.countries.length || f.countries.includes(t.country)) &&
      (!f.dateFrom || t.dateFrom >= f.dateFrom) &&        // тур начинается не раньше «с»
      (!f.dateTo || t.dateTo <= f.dateTo) &&              // и заканчивается не позже «по»
      (f.priceMin === null || t.price >= f.priceMin) &&
      (f.priceMax === null || t.price <= f.priceMax) &&
      t.hotel.rating >= f.rating &&
      (!f.airline || t.flight.airline === f.airline) &&
      (!f.directOnly || t.flight.direct)
    );
  }

  function sortTours(arr) {
    const by = $('sort').value;
    const copy = [...arr];
    if (by === 'price-asc') copy.sort((a, b) => a.price - b.price);
    else if (by === 'price-desc') copy.sort((a, b) => b.price - a.price);
    else if (by === 'rating') copy.sort((a, b) => b.hotel.rating - a.hotel.rating);
    else if (by === 'date') copy.sort((a, b) => a.dateFrom.localeCompare(b.dateFrom));
    else copy.sort((a, b) => b.hotel.reviews - a.hotel.reviews);
    return copy;
  }

  // Обновляет число на кнопке при каждом изменении фильтров.
  function updateCount() {
    const f = readFilters();
    if (!validate(f)) {
      showBtn.disabled = true;
      showBtn.textContent = 'Исправьте параметры';
      return;
    }
    const n = applyFilters(f).length;
    showBtn.disabled = false;
    showBtn.textContent = n ? `Показать ${UI.toursText(n)}` : 'Туров не найдено';
  }

  function renderList(arr, title) {
    $('results-title').textContent = title;
    if (!arr.length) {
      list.innerHTML = `
        <div class="state-box">
          <div class="state-icon">${UI.icon.pin}</div>
          <h3>По вашим параметрам туров не найдено</h3>
          <p>Попробуйте изменить даты, расширить диапазон цены или выбрать другую страну.</p>
          <button type="button" class="btn btn-primary" data-reset>Сбросить фильтры</button>
        </div>`;
      return;
    }
    list.innerHTML = `<div class="tours-grid">${sortTours(arr).map(t => UI.tourCard(t, favIds.includes(t.id))).join('')}</div>`;
  }

  function resetFilters() {
    form.reset();
    document.querySelectorAll('#country-chips .chip').forEach(c => c.classList.remove('is-active'));
    document.querySelectorAll('#rating-chips .chip').forEach(c => c.classList.toggle('is-active', c.dataset.rating === '0'));
    updateCount();
    shown = tours;
    renderList(shown, 'Все туры');
  }

  // События

  $('country-chips').addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    chip.classList.toggle('is-active');
    updateCount();
  });

  $('rating-chips').addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll('#rating-chips .chip').forEach(c => c.classList.toggle('is-active', c === chip));
    updateCount();
  });

  form.addEventListener('input', updateCount);
  form.addEventListener('change', updateCount);

  form.addEventListener('submit', e => {
    e.preventDefault();
    const f = readFilters();
    if (!validate(f)) return;
    shown = applyFilters(f);
    renderList(shown, shown.length ? `Найдено ${UI.toursText(shown.length)}` : 'Ничего не найдено');
    $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  $('reset-btn').addEventListener('click', resetFilters);
  list.addEventListener('click', e => { if (e.target.closest('[data-reset]')) resetFilters(); });

  $('sort').addEventListener('change', () => renderList(shown, $('results-title').textContent));

  UI.bindFavButtons(list, async () => { favIds = await Store.getFavoriteIds(); });

  // Старт
  shown = tours;
  updateCount();
  renderList(shown, 'Все туры');
})();
