/**
 * social.js — социальные функции: лайки, сохранения, подписки, комментарии.
 *
 * Работает на странице рецепта и в карточках авторов. Состояние хранится
 * в localStorage (см. storage.js). Все действия доступны только
 * авторизованному пользователю.
 */

import { getCommentsByRecipe } from './data.js';
import {
  toggleLike,
  toggleBookmark,
  toggleSubscription,
  getLikes,
  getBookmarks,
  getSubscriptions,
  addComment,
  getLocalComments,
} from './storage.js';
import {
  escapeHtml,
  formatDate,
  getUserName,
  getCurrentUser,
  getAllRecipes,
  getAllUsers,
} from './main.js';

/** Найти рецепт по id среди всех (статических и локальных). */
function findRecipe(id) {
  return getAllRecipes().find((recipe) => String(recipe.id) === String(id)) || null;
}

/** Обновить счётчик и вид кнопки лайка. */
function syncLikeButton(button, recipe) {
  const active = getLikes().includes(recipe.id);
  const count = recipe.likes + (active ? 1 : 0);
  button.classList.toggle('is-active', active);
  button.setAttribute('aria-pressed', String(active));
  const output = button.querySelector('[data-count]');
  if (output) output.textContent = count;
  const label = button.querySelector('[data-label]');
  if (label) label.textContent = active ? 'Вам нравится' : 'Нравится';
}

/** Инициализация лайков. */
function initLikeButtons() {
  document.querySelectorAll('[data-like-recipe]').forEach((button) => {
    const recipe = findRecipe(button.dataset.likeRecipe);
    if (!recipe) return;
    syncLikeButton(button, recipe);

    button.addEventListener('click', () => {
      if (!getCurrentUser()) {
        alert('Чтобы поставить лайк, войдите в аккаунт.');
        return;
      }
      toggleLike(recipe.id);
      syncLikeButton(button, recipe);
    });
  });
}

/** Инициализация кнопок сохранения (закладок). */
function initBookmarkButtons() {
  document.querySelectorAll('[data-bookmark-recipe]').forEach((button) => {
    const recipe = findRecipe(button.dataset.bookmarkRecipe);
    if (!recipe) return;
    const sync = () => {
      const active = getBookmarks().includes(recipe.id);
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
      const label = button.querySelector('[data-label]');
      if (label) label.textContent = active ? 'Сохранён' : 'Сохранить';
    };
    sync();
    button.addEventListener('click', () => {
      if (!getCurrentUser()) {
        alert('Чтобы сохранить рецепт, войдите в аккаунт.');
        return;
      }
      toggleBookmark(recipe.id);
      sync();
    });
  });
}

/** Инициализация подписок на авторов. */
function initSubscribeButtons() {
  document.querySelectorAll('[data-subscribe-author]').forEach((button) => {
    const author = getAllUsers().find(
      (user) => String(user.id) === String(button.dataset.subscribeAuthor),
    );
    if (!author) return;
    const sync = () => {
      const active = getSubscriptions().includes(author.id);
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
      button.textContent = active ? 'Вы подписаны' : 'Подписаться';
    };
    sync();
    button.addEventListener('click', () => {
      if (!getCurrentUser()) {
        alert('Чтобы подписаться, войдите в аккаунт.');
        return;
      }
      toggleSubscription(author.id);
      sync();
    });
  });
}

/* --------------------------- Комментарии -------------------------- */

/** Разметка одного комментария. */
function commentTemplate(comment) {
  return `
    <li class="rh-comment py-3">
      <div class="d-flex justify-content-between align-items-baseline gap-2">
        <strong>${escapeHtml(getUserName(comment.authorId))}</strong>
        <span class="text-muted small">${escapeHtml(formatDate(comment.createdAt))}</span>
      </div>
      <p class="mb-0">${escapeHtml(comment.text)}</p>
    </li>
  `;
}

function initComments() {
  const list = document.querySelector('[data-comments-list]');
  if (!list) return;

  const recipeId = Number(list.dataset.commentsList);
  const counter = document.querySelector('[data-comments-count]');

  const render = () => {
    const local = getLocalComments().filter(
      (comment) => comment.recipeId === recipeId,
    );
    const all = [...getCommentsByRecipe(recipeId), ...local];
    list.innerHTML = all.length
      ? all.map(commentTemplate).join('')
      : '<li class="text-muted py-3">Комментариев пока нет.</li>';
    if (counter) counter.textContent = all.length;
  };

  render();

  const form = document.querySelector('[data-comment-form]');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const user = getCurrentUser();
    if (!user) {
      alert('Чтобы оставить комментарий, войдите в аккаунт.');
      return;
    }
    const textarea = form.elements.text;
    const text = textarea.value.trim();
    if (!text) return;

    addComment({
      id: `local-${Date.now()}`,
      recipeId,
      authorId: user.id,
      text,
      createdAt: new Date().toISOString(),
    });
    textarea.value = '';
    render();
  });
}

function init() {
  initLikeButtons();
  initBookmarkButtons();
  initSubscribeButtons();
  initComments();
}

document.addEventListener('DOMContentLoaded', init);
