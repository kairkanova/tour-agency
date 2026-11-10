// Работа с данными: туры и пользователи из JSON, новые пользователи и избранное в localStorage
const Store = (() => {
  const LS_USERS = 'tourapp_users';     // массив пользователей (формат как в users.json)
  const LS_SESSION = 'tourapp_session'; // email текущего пользователя

  let toursCache = null;
  let baseUsersCache = null;

  // Загрузка JSON

  async function loadJSON(path) {
    let response;
    try {
      response = await fetch(path, { cache: 'no-cache' });
    } catch (e) {
      throw new Error('Не удалось загрузить данные. Откройте сайт через Live Server.');
    }
    if (!response.ok) throw new Error(`Файл ${path} не найден (код ${response.status}).`);
    return response.json();
  }

  async function getTours() {
    if (!toursCache) toursCache = await loadJSON('data/tours.json');
    return toursCache;
  }

  async function getTour(id) {
    const tours = await getTours();
    return tours.find(t => t.id === Number(id)) || null;
  }

  // localStorage

  function readLS(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeLS(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      throw new Error('Не удалось сохранить данные в браузере.');
    }
  }

  // Пользователи

  async function getBaseUsers() {
    if (!baseUsersCache) baseUsersCache = await loadJSON('data/users.json');
    return baseUsersCache;
  }

  // Пользователи из users.json + из localStorage (локальная версия важнее).
  async function getAllUsers() {
    const base = await getBaseUsers();
    const local = readLS(LS_USERS, []);
    const map = new Map();
    base.forEach(u => map.set(u.email.toLowerCase(), { ...u }));
    local.forEach(u => map.set(u.email.toLowerCase(), { ...u }));
    return [...map.values()];
  }

  async function findUser(email) {
    const users = await getAllUsers();
    return users.find(u => u.email.toLowerCase() === String(email).trim().toLowerCase()) || null;
  }

  // Сохраняет пользователя в localStorage (добавляет или заменяет по email).
  function saveUserLocal(user) {
    const local = readLS(LS_USERS, []);
    const idx = local.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
    if (idx >= 0) local[idx] = user; else local.push(user);
    writeLS(LS_USERS, local);
  }

  async function register(data) {
    const email = data.email.trim().toLowerCase();
    if (await findUser(email)) throw new Error('Пользователь с таким email уже зарегистрирован.');

    const users = await getAllUsers();
    const user = {
      id: users.reduce((max, u) => Math.max(max, u.id), 0) + 1,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email,
      passwordHash: await sha256(data.password),
      phone: data.phone.trim(),
      birthDate: '',
      city: '',
      country: '',
      createdAt: new Date().toISOString().slice(0, 10),
      trips: 0,
      bonuses: 500,           // приветственные бонусы
      reviewsCount: 0,
      favorites: []
    };
    saveUserLocal(user);
    writeLS(LS_SESSION, email);
    return user;
  }

  async function login(email, password) {
    const user = await findUser(email);
    if (!user || user.passwordHash !== await sha256(password)) {
      throw new Error('Неверный email или пароль.');
    }
    writeLS(LS_SESSION, user.email.toLowerCase());
    return user;
  }

  function logout() {
    try { localStorage.removeItem(LS_SESSION); } catch (e) { /* ignore */ }
  }

  function isLoggedIn() {
    return Boolean(readLS(LS_SESSION, null));
  }

  async function currentUser() {
    const email = readLS(LS_SESSION, null);
    if (!email) return null;
    const user = await findUser(email);
    if (!user) logout();
    return user;
  }

  async function updateUser(patch) {
    const user = await currentUser();
    if (!user) throw new Error('Необходимо войти в аккаунт.');
    const updated = { ...user, ...patch, email: user.email, id: user.id };
    saveUserLocal(updated);
    return updated;
  }

  // Избранное

  async function getFavoriteIds() {
    const user = await currentUser();
    return user ? user.favorites : [];
  }

  async function isFavorite(tourId) {
    return (await getFavoriteIds()).includes(Number(tourId));
  }

  // Добавляет тур, если его нет, иначе удаляет. Возвращает { added, count }.
  async function toggleFavorite(tourId) {
    const user = await currentUser();
    if (!user) throw new Error('AUTH_REQUIRED');
    const id = Number(tourId);
    const has = user.favorites.includes(id);
    const favorites = has ? user.favorites.filter(f => f !== id) : [...user.favorites, id];
    await updateUser({ favorites });
    return { added: !has, count: favorites.length };
  }

  async function removeFavorite(tourId) {
    const user = await currentUser();
    if (!user) throw new Error('AUTH_REQUIRED');
    const favorites = user.favorites.filter(f => f !== Number(tourId));
    await updateUser({ favorites });
    return favorites.length;
  }

  async function getFavoriteTours() {
    const ids = await getFavoriteIds();
    const tours = await getTours();
    return ids.map(id => tours.find(t => t.id === id)).filter(Boolean);
  }

  // Хеширование пароля (SHA-256)

  async function sha256(text) {
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
    }
    return sha256Fallback(text);
  }

  function sha256Fallback(ascii) {
    const rr = (v, a) => (v >>> a) | (v << (32 - a));
    const bytes = new TextEncoder().encode(ascii);
    const K = [], H = [];
    let n = 2;
    while (K.length < 64) {
      let prime = true;
      for (let d = 2; d * d <= n; d++) if (n % d === 0) { prime = false; break; }
      if (prime) {
        if (H.length < 8) H.push((Math.pow(n, 1 / 2) * 2 ** 32) | 0);
        K.push((Math.pow(n, 1 / 3) * 2 ** 32) | 0);
      }
      n++;
    }
    const len = bytes.length;
    const words = [];
    const padded = new Uint8Array(((len + 9 + 63) >> 6) << 6);
    padded.set(bytes);
    padded[len] = 0x80;
    const bitLen = len * 8;
    padded[padded.length - 4] = (bitLen >>> 24) & 255;
    padded[padded.length - 3] = (bitLen >>> 16) & 255;
    padded[padded.length - 2] = (bitLen >>> 8) & 255;
    padded[padded.length - 1] = bitLen & 255;
    for (let i = 0; i < padded.length; i += 4) {
      words.push((padded[i] << 24) | (padded[i + 1] << 16) | (padded[i + 2] << 8) | padded[i + 3]);
    }
    for (let j = 0; j < words.length; j += 16) {
      const w = words.slice(j, j + 16);
      const old = H.slice(0);
      for (let i = 0; i < 64; i++) {
        if (i >= 16) {
          const w15 = w[i - 15], w2 = w[i - 2];
          w[i] = (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] +
                  (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0;
        }
        const [a, b, c, d, e, f, g, h] = H;
        const t1 = h + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i];
        const t2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c));
        H.unshift((t1 + t2) | 0);
        H.pop();
        H[4] = (H[4] + t1) | 0;
      }
      for (let i = 0; i < 8; i++) H[i] = (H[i] + old[i]) | 0;
    }
    return H.map(v => (v >>> 0).toString(16).padStart(8, '0')).join('');
  }

  return {
    getTours, getTour,
    register, login, logout, isLoggedIn, currentUser, updateUser,
    getFavoriteIds, isFavorite, toggleFavorite, removeFavorite, getFavoriteTours,
    sha256
  };
})();
