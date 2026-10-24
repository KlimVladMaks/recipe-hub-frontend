/**
 * api.js — клиент мокового API RecipeHub.
 *
 * Единственное место, где выполняются HTTP-запросы. Модули страниц не
 * работают с fetch напрямую: они вызывают методы ресурсов (recipes, users,
 * comments, likes, bookmarks, subscriptions) или auth.
 *
 * Базовый адрес API:
 *  - если фронтенд раздаётся самим json-server (порт 3000), запросы идут
 *    на тот же origin;
 *  - иначе используется http://localhost:3000 (CORS у json-server включён).
 * Адрес можно переопределить глобально: window.RH_API_BASE_URL = '...'.
 */

export const API_BASE_URL =
  window.RH_API_BASE_URL ||
  (window.location.port === '3000' ? '' : 'http://localhost:3000');

const TOKEN_KEY = 'rh_token';

/** Ошибка запроса к API с HTTP-статусом и телом ответа. */
export class ApiError extends Error {
  constructor(message, status, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/* ------------------------------- Токен ------------------------------- */

/** Токен из localStorage («Запомнить меня») или sessionStorage. */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

/** Сохранить токен. remember=true — переживает закрытие браузера. */
export function saveToken(token, remember = true) {
  clearToken();
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, token);
}

/** Удалить токен из обоих хранилищ. */
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

/** Декодировать payload JWT без сторонних библиотек. */
function decodeJwt(token) {
  const [, payload] = String(token).split('.');
  if (!payload) throw new Error('Некорректный токен');

  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const json = decodeURIComponent(
    atob(padded)
      .split('')
      .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
      .join(''),
  );

  return JSON.parse(json);
}

/* ---------------------------- Query-строка --------------------------- */

/** Собрать query-строку. Массивы превращаются в повторяющиеся параметры. */
export function buildQuery(params = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== '') {
          search.append(key, String(item));
        }
      });
      return;
    }

    search.append(key, String(value));
  });

  const query = search.toString();
  return query ? `?${query}` : '';
}

/* ------------------------------ Запросы ------------------------------ */

/**
 * Выполнить запрос к API.
 *
 * @param {string} path — путь относительно API_BASE_URL
 * @param {object} [options]
 * @param {string} [options.method]
 * @param {object} [options.body]
 * @param {boolean} [options.auth] — добавить Authorization: Bearer
 * @param {AbortSignal} [options.signal]
 */
export async function request(
  path,
  { method = 'GET', body, auth: withAuth = false, signal } = {},
) {
  const headers = { Accept: 'application/json' };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();
  if (withAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError(
      'Не удалось связаться с сервером. Проверьте, что запущен npm run api.',
      0,
      error,
    );
  }

  if (response.status === 204) return null;

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      (typeof data === 'string' && data) ||
      (data && (data.error || data.message)) ||
      `Ошибка запроса (${response.status})`;
    throw new ApiError(message, response.status, data);
  }

  return data;
}

/* ----------------------------- Ресурсы ------------------------------- */

export const users = {
  list(params = {}, options = {}) {
    return request(`/users${buildQuery(params)}`, options);
  },
  get(id, options = {}) {
    return request(`/users/${id}`, options);
  },
  update(id, changes) {
    return request(`/users/${id}`, {
      method: 'PATCH',
      body: changes,
      auth: true,
    });
  },
};

export const recipes = {
  list(params = {}, options = {}) {
    return request(`/recipes${buildQuery(params)}`, options);
  },
  get(id, options = {}) {
    return request(`/recipes/${id}`, options);
  },
  create(data) {
    return request('/recipes', { method: 'POST', body: data, auth: true });
  },
  remove(id) {
    return request(`/recipes/${id}`, { method: 'DELETE', auth: true });
  },
};

export const comments = {
  listByRecipe(recipeId, options = {}) {
    return request(
      `/comments${buildQuery({
        recipeId,
        _sort: 'createdAt',
        _order: 'asc',
      })}`,
      options,
    );
  },
  create(data) {
    return request('/comments', { method: 'POST', body: data, auth: true });
  },
  remove(id) {
    return request(`/comments/${id}`, { method: 'DELETE', auth: true });
  },
};

/** Однотипные коллекции «пользователь — рецепт/автор». */
function userCollection(name) {
  return {
    listByUser(userId, options = {}) {
      return request(`/${name}${buildQuery({ userId })}`, options);
    },
    create(data) {
      return request(`/${name}`, { method: 'POST', body: data, auth: true });
    },
    remove(id) {
      return request(`/${name}/${id}`, { method: 'DELETE', auth: true });
    },
  };
}

export const likes = userCollection('likes');
export const bookmarks = userCollection('bookmarks');
export const subscriptions = userCollection('subscriptions');


/* --------------------------- Авторизация ----------------------------- */

export const auth = {
  /** Вход. Возвращает accessToken. */
  async login(email, password) {
    const data = await request('/login', {
      method: 'POST',
      body: { email, password },
    });
    return data.accessToken;
  },

  /** Регистрация. Возвращает accessToken. */
  async register(payload) {
    const data = await request('/register', {
      method: 'POST',
      body: payload,
    });
    return data.accessToken;
  },

  saveToken,
  clearToken,
  getToken,

  /**
   * Текущий пользователь по токену или null.
   * При истёкшем/невалидном токене очищает его.
   */
  async getCurrentUser() {
    const token = getToken();
    if (!token) return null;

    let payload;
    try {
      payload = decodeJwt(token);
    } catch {
      clearToken();
      return null;
    }

    if (payload.exp && payload.exp * 1000 <= Date.now()) {
      clearToken();
      return null;
    }

    try {
      return await users.get(payload.sub);
    } catch (error) {
      if ([401, 403, 404].includes(error.status)) {
        clearToken();
        return null;
      }
      throw error;
    }
  },

  logout() {
    clearToken();
  },
};

