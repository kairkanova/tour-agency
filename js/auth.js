/* Вход и регистрация. Пользователи: data/users.json + localStorage. */
(() => {
  UI.renderHeader('profile');
  UI.renderFooter();

  const $ = id => document.getElementById(id);
  const formError = $('form-error');
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // Куда вернуться после входа. Разрешаем только страницы этого сайта.
  const nextParam = new URLSearchParams(location.search).get('next') || '';
  const next = /^[a-z]+\.html(\?[\w=&-]*)?$/i.test(nextParam) ? nextParam : 'profile.html';
  ['to-register', 'to-login'].forEach(linkId => {
    const link = $(linkId);
    if (link && nextParam) link.href += `?next=${encodeURIComponent(next)}`;
  });

  function setError(field, message) {
    const box = document.querySelector(`[data-error-for="${field}"]`);
    if (box) box.textContent = message;
    const input = $(field);
    if (input && input.classList.contains('input')) input.classList.toggle('is-invalid', Boolean(message));
    return !message;
  }

  function showFormError(message) {
    formError.textContent = message;
    formError.hidden = !message;
  }

  // Вход
  const loginForm = $('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      showFormError('');
      const email = $('email').value.trim();
      const password = $('password').value;
      let ok = setError('email', !email ? 'Введите email' : !EMAIL_RE.test(email) ? 'Некорректный email' : '');
      ok = setError('password', password ? '' : 'Введите пароль') && ok;
      if (!ok) return;

      try {
        const user = await Store.login(email, password);
        UI.toast(`Здравствуйте, ${user.firstName}!`, 'success');
        setTimeout(() => { location.href = next; }, 500);
      } catch (err) {
        showFormError(err.message);
      }
    });
  }

  // Регистрация
  const regForm = $('register-form');
  if (regForm) {
    regForm.addEventListener('submit', async e => {
      e.preventDefault();
      showFormError('');
      const v = id => $(id).value.trim();
      const data = {
        firstName: v('firstName'),
        lastName: v('lastName'),
        email: v('email'),
        phone: v('phone'),
        password: $('password').value
      };

      let ok = true;
      ok = setError('firstName', data.firstName.length >= 2 ? '' : 'Введите имя') && ok;
      ok = setError('lastName', data.lastName.length >= 2 ? '' : 'Введите фамилию') && ok;
      ok = setError('email', !data.email ? 'Введите email' : !EMAIL_RE.test(data.email) ? 'Некорректный email' : '') && ok;
      ok = setError('phone', !data.phone || /^[+\d\s()-]{7,20}$/.test(data.phone) ? '' : 'Некорректный телефон') && ok;
      ok = setError('password', data.password.length >= 6 ? '' : 'Пароль - минимум 6 символов') && ok;
      ok = setError('password2', $('password2').value === data.password ? '' : 'Пароли не совпадают') && ok;
      ok = setError('agree', $('agree').checked ? '' : 'Необходимо согласие') && ok;
      if (!ok) return;

      try {
        const user = await Store.register(data);
        UI.toast(`Аккаунт создан. Добро пожаловать, ${user.firstName}!`, 'success');
        setTimeout(() => { location.href = next; }, 600);
      } catch (err) {
        showFormError(err.message);
      }
    });
  }

  // Убираем ошибку поля, как только пользователь начал его исправлять.
  document.addEventListener('input', e => {
    if (e.target.id) setError(e.target.id, '');
  });
})();
