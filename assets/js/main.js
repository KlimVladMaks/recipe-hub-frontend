/**
 * main.js — общая инициализация всех страниц RecipeHub.
 *
 * Задачи модуля:
 *  - определить корень проекта (data-root) и строить пути к ресурсам;
 *  - экранировать пользовательский текст при вставке в DOM;
 *  - восстановить сессию и загрузить данные API (appReady);
 *  - синхронизировать навигацию с состоянием авторизации;
 *  - дать общие хелперы для модальных окон и ошибок.
 */

import { auth, ApiError } from './api.js';
import * as store from './store.js';

/* ---------------------------- Пути ---------------------------- */

/** Корень проекта: "" для index.html и ".." для страниц в pages/. */
export function root() {
  return document.body.dataset.root ?? '';
}

/** Собрать путь к ресурсу от корня проекта. */
export function url(relativePath) {
  const base = root();
  return base ? `${base}/${relativePath}` : relativePath;
}

/* ------------------------- Безопасность ------------------------- */

/** Экранирование текста перед вставкой через innerHTML. */
export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/* --------------------------- Формат ---------------------------- */

/** Человекочитаемая длительность: 90 -> "1 ч 30 мин". */
export function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} мин`;
  if (!rest) return `${hours} ч`;
  return `${hours} ч ${rest} мин`;
}

/** Дата в формате ДД.ММ.ГГГГ. */
export function formatDate(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ru-RU');
}

/* --------------------------- Сессия ----------------------------- */

/**
 * Готовность приложения: восстановление сессии и загрузка справочников.
 * Все страничные модули начинают работу с `await appReady`.
 */
export const appReady = (async () => {
  try {
    const user = await auth.getCurrentUser();
    store.setCurrentUser(user);
    await store.loadBase();
    store.setApiOnline(true);
  } catch (error) {
    console.error('RecipeHub: не удалось загрузить данные API', error);
    store.setApiOnline(false);
  }
})();

/** Доступен ли API (используется для баннера). */
export function isApiOnline() {
  return store.isApiOnline();
}

/* -------------------------- Пользователь ------------------------ */

export function getAllUsers() {
  return store.getAllUsers();
}

export function getAllRecipes() {
  return store.getAllRecipes();
}

export function getCurrentUser() {
  return store.getCurrentUser();
}

export function getUserName(authorId) {
  return store.getUserName(authorId);
}

/* ---------------------------- Ошибки ---------------------------- */

/**
 * Показать ошибку API. Если передан контейнер — рендерит alert внутри него,
 * иначе использует alert().
 */
export function showApiError(error, container = null) {
  console.error(error);
  const message =
    error instanceof ApiError
      ? error.message
      : 'Произошла ошибка. Попробуйте ещё раз.';

  if (container) {
    container.innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger mb-0" role="alert">${escapeHtml(message)}</div>
      </div>
    `;
    return;
  }

  window.alert(message);
}

/** Пометить контейнер как загружающийся (aria-busy). */
export function setLoading(container, isLoading) {
  if (!container) return;
  container.setAttribute('aria-busy', String(Boolean(isLoading)));
}

/* --------------------------- Навигация -------------------------- */

/** Активный пункт меню по текущему файлу. */
function markActiveNavLink() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('[data-nav-link]').forEach((link) => {
    const target = link.getAttribute('href')?.split('/').pop();
    const isActive = target === current;
    link.classList.toggle('active', isActive);
    if (isActive) link.setAttribute('aria-current', 'page');
  });
}

/** Показать в шапке либо кнопки входа, либо меню пользователя. */
function renderAuthState() {
  const user = getCurrentUser();

  document.querySelectorAll('[data-auth-guest]').forEach((block) => {
    block.hidden = Boolean(user);
  });
  document.querySelectorAll('[data-auth-user]').forEach((block) => {
    block.hidden = !user;
  });
  document.querySelectorAll('[data-auth-username]').forEach((output) => {
    output.textContent = user ? user.name : '';
  });

  document.querySelectorAll('[data-logout]').forEach((button) => {
    if (button.dataset.logoutBound) return;
    button.dataset.logoutBound = 'true';
    button.addEventListener('click', () => {
      auth.logout();
      store.resetUserState();
      window.location.href = url('index.html');
    });
  });
}

/** Баннер, если API недоступен. */
function renderApiStatus() {
  if (store.isApiOnline()) return;
  if (document.querySelector('[data-api-error]')) return;

  const main = document.querySelector('main');
  if (!main) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'container mt-3';
  wrapper.innerHTML = `
    <div class="alert alert-danger" role="alert" data-api-error>
      Не удалось подключиться к API. Запустите <code>npm run api</code>
      и обновите страницу.
    </div>
  `;
  main.prepend(wrapper);
}

/* ---------------------------- Модалки --------------------------- */

/** Открыть модальное окно Bootstrap по id. */
export function openModal(id) {
  const element = document.getElementById(id);
  if (!element) return null;
  const modal = bootstrap.Modal.getOrCreateInstance(element);
  modal.show();
  return modal;
}

/** Закрыть модальное окно Bootstrap по id. */
export function closeModal(id) {
  const element = document.getElementById(id);
  if (!element) return;

  const modal = bootstrap.Modal.getOrCreateInstance(element);

  // Если окно ещё в процессе открытия, Bootstrap проигнорирует hide().
  // В этом случае закрываем его сразу после завершения анимации показа.
  if (modal._isTransitioning) {
    element.addEventListener('shown.bs.modal', () => modal.hide(), {
      once: true,
    });
    return;
  }

  modal.hide();
}

/* ------------------------- Инициализация ------------------------ */

document.addEventListener('DOMContentLoaded', async () => {
  await appReady;
  markActiveNavLink();
  renderAuthState();
  renderApiStatus();
});

