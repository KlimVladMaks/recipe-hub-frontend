/**
 * main.js — общая инициализация всех страниц RecipeHub.
 *
 * Задачи модуля:
 *  - определить корень проекта (data-root) и строить пути к ресурсам;
 *  - экранировать пользовательский текст при вставке в DOM;
 *  - синхронизировать навигацию с состоянием авторизации;
 *  - дать общие хелперы для модальных окон Bootstrap.
 */

import { users, recipes, getUserById } from './data.js';
import {
  getSessionUserId,
  getLocalUsers,
  getProfileOverrides,
  getLocalRecipes,
  clearSession,
} from './storage.js';

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

/* -------------------------- Пользователь ------------------------ */

/** Все аккаунты: статические + созданные на устройстве, с учётом правок. */
export function getAllUsers() {
  const overrides = getProfileOverrides();
  return [...users, ...getLocalUsers()].map((user) => {
    const patch = overrides[String(user.id)];
    return patch ? { ...user, ...patch } : user;
  });
}

/** Все рецепты: статические + созданные на устройстве. */
export function getAllRecipes() {
  return [...recipes, ...getLocalRecipes()];
}

/** Текущий авторизованный пользователь или null. */
export function getCurrentUser() {
  const id = getSessionUserId();
  if (id == null) return null;
  // Сначала ищем среди локальных (id вида "local-..."), затем среди статических.
  const all = getAllUsers();
  return all.find((user) => String(user.id) === String(id)) || getUserById(Number(id));
}

/** Имя пользователя по id (для комментариев и карточек). */
export function getUserName(authorId) {
  const user = getAllUsers().find((u) => String(u.id) === String(authorId));
  return user ? user.name : 'Неизвестный автор';
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
  const nameOutputs = document.querySelectorAll('[data-auth-username]');

  document.querySelectorAll('[data-auth-guest]').forEach((block) => {
    block.hidden = Boolean(user);
  });
  document.querySelectorAll('[data-auth-user]').forEach((block) => {
    block.hidden = !user;
  });

  nameOutputs.forEach((output) => {
    output.textContent = user ? user.name : '';
  });

  document.querySelectorAll('[data-logout]').forEach((button) => {
    button.addEventListener('click', () => {
      clearSession();
      window.location.href = url('index.html');
    });
  });
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
  bootstrap.Modal.getOrCreateInstance(element).hide();
}

/* ------------------------- Инициализация ------------------------ */

function init() {
  markActiveNavLink();
  renderAuthState();
}

document.addEventListener('DOMContentLoaded', init);
