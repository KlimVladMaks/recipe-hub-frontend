/**
 * social.js — социальные функции: лайки, закладки, подписки, комментарии.
 *
 * Все действия выполняются через API и требуют авторизации. Коллекции
 * likes / bookmarks / subscriptions защищены guards 644: читать может
 * любой, изменять — только владелец записи (userId).
 */

import * as api from './api.js';
import * as store from './store.js';
import {
  appReady,
  escapeHtml,
  formatDate,
  getUserName,
  getCurrentUser,
  showApiError,
} from './main.js';

/** Проверить авторизацию перед действием. */
function requireUser(actionLabel) {
  const user = getCurrentUser();
  if (!user) {
    window.alert(`Чтобы ${actionLabel}, войдите в аккаунт.`);
    return null;
  }
  return user;
}

/** Единая обработка ошибок социальных действий. */
function handleActionError(error) {
  if (error instanceof api.ApiError && error.status === 401) {
    window.alert('Сессия истекла. Войдите в аккаунт заново.');
    return;
  }
  showApiError(error);
}

/* ------------------------------- Лайки ------------------------------- */

function syncLikeButton(button, recipe) {
  const active = store.isLiked(recipe.id);
  const count = recipe.likes + (active ? 1 : 0);

  button.classList.toggle('is-active', active);
  button.setAttribute('aria-pressed', String(active));

  const output = button.querySelector('[data-count]');
  if (output) output.textContent = count;

  const label = button.querySelector('[data-label]');
  if (label) label.textContent = active ? 'Вам нравится' : 'Нравится';
}

async function toggleLike(button, recipe) {
  const user = requireUser('поставить лайк');
  if (!user) return;

  button.disabled = true;
  try {
    if (store.isLiked(recipe.id)) {
      const like = store.findLike(recipe.id);
      await api.likes.remove(like.id);
      store.removeLike(like.id);
    } else {
      const created = await api.likes.create({
        userId: user.id,
        recipeId: recipe.id,
      });
      store.addLike(created);
    }
    syncLikeButton(button, recipe);
  } catch (error) {
    handleActionError(error);
  } finally {
    button.disabled = false;
  }
}

/* ----------------------------- Закладки ------------------------------ */

function syncBookmarkButton(button, recipe) {
  const active = store.isBookmarked(recipe.id);
  button.classList.toggle('is-active', active);
  button.setAttribute('aria-pressed', String(active));

  const label = button.querySelector('[data-label]');
  if (label) label.textContent = active ? 'Сохранён' : 'Сохранить';
}

async function toggleBookmark(button, recipe) {
  const user = requireUser('сохранить рецепт');
  if (!user) return;

  button.disabled = true;
  try {
    if (store.isBookmarked(recipe.id)) {
      const bookmark = store.findBookmark(recipe.id);
      await api.bookmarks.remove(bookmark.id);
      store.removeBookmark(bookmark.id);
    } else {
      const created = await api.bookmarks.create({
        userId: user.id,
        recipeId: recipe.id,
      });
      store.addBookmark(created);
    }
    syncBookmarkButton(button, recipe);
  } catch (error) {
    handleActionError(error);
  } finally {
    button.disabled = false;
  }
}

/* ----------------------------- Подписки ------------------------------ */

function syncSubscribeButton(button, authorId) {
  const active = store.isSubscribed(authorId);
  const author = store.getUserById(authorId);

  button.classList.toggle('is-active', active);
  button.setAttribute('aria-pressed', String(active));
  button.textContent = active ? 'Вы подписаны' : 'Подписаться';

  if (author) {
    const count = author.subscribers + (active ? 1 : 0);
    document
      .querySelectorAll(`[data-subscribers="${author.id}"]`)
      .forEach((element) => {
        element.textContent = count;
      });
  }
}

async function toggleSubscription(button, authorId) {
  const user = requireUser('подписаться');
  if (!user) return;

  button.disabled = true;
  try {
    if (store.isSubscribed(authorId)) {
      const subscription = store.findSubscription(authorId);
      await api.subscriptions.remove(subscription.id);
      store.removeSubscription(subscription.id);
    } else {
      const created = await api.subscriptions.create({
        userId: user.id,
        authorId,
      });
      store.addSubscription(created);
    }
    syncSubscribeButton(button, authorId);
  } catch (error) {
    handleActionError(error);
  } finally {
    button.disabled = false;
  }
}

/** Привязать все кнопки подписки, найденные в DOM. */
export function initSubscribeButtons() {
  document.querySelectorAll('[data-subscribe-author]').forEach((button) => {
    const authorId = button.dataset.subscribeAuthor;
    if (!authorId || button.dataset.subscribeBound) return;

    button.dataset.subscribeBound = 'true';
    syncSubscribeButton(button, authorId);
    button.addEventListener('click', () => toggleSubscription(button, authorId));
  });
}

/* --------------------------- Комментарии -------------------------- */

/** Разметка одного комментария. */
function commentTemplate(comment) {
  return `
    <li class="rh-comment py-3">
      <div class="d-flex justify-content-between align-items-baseline gap-2">
        <strong>${escapeHtml(getUserName(comment.userId))}</strong>
        <span class="text-muted small">${escapeHtml(formatDate(comment.createdAt))}</span>
      </div>
      <p class="mb-0">${escapeHtml(comment.text)}</p>
    </li>
  `;
}

/** Перерисовать список комментариев из кэша. */
function renderComments(recipeId) {
  const list = document.querySelector('[data-comments-list]');
  if (!list) return;

  const comments = store.getComments(recipeId);
  const counter = document.querySelector('[data-comments-count]');

  list.innerHTML = comments.length
    ? comments.map(commentTemplate).join('')
    : '<li class="text-muted py-3">Комментариев пока нет.</li>';

  if (counter) counter.textContent = comments.length;
}

/** Привязать форму добавления комментария. */
function initCommentForm(recipeId) {
  const form = document.querySelector('[data-comment-form]');
  if (!form || form.dataset.commentBound) return;
  form.dataset.commentBound = 'true';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const user = requireUser('оставить комментарий');
    if (!user) return;

    const textarea = form.elements.text;
    const text = textarea.value.trim();
    if (!text) return;

    const button = form.querySelector('[type="submit"]');
    if (button) button.disabled = true;

    try {
      const created = await api.comments.create({
        recipeId,
        userId: user.id,
        text,
        createdAt: new Date().toISOString(),
      });

      store.addComment(created);
      textarea.value = '';
      renderComments(recipeId);
    } catch (error) {
      handleActionError(error);
    } finally {
      if (button) button.disabled = false;
    }
  });
}

/* ------------------------ Страница рецепта ------------------------ */

/**
 * Привязать социальные действия к отрендеренному рецепту.
 * Вызывается из recipe.js после заполнения DOM.
 */
export function initRecipeSocial(recipe) {
  const likeButton = document.querySelector('[data-like-recipe]');
  if (likeButton && !likeButton.dataset.likeBound) {
    likeButton.dataset.likeBound = 'true';
    syncLikeButton(likeButton, recipe);
    likeButton.addEventListener('click', () => toggleLike(likeButton, recipe));
  }

  const bookmarkButton = document.querySelector('[data-bookmark-recipe]');
  if (bookmarkButton && !bookmarkButton.dataset.bookmarkBound) {
    bookmarkButton.dataset.bookmarkBound = 'true';
    syncBookmarkButton(bookmarkButton, recipe);
    bookmarkButton.addEventListener('click', () =>
      toggleBookmark(bookmarkButton, recipe),
    );
  }

  initSubscribeButtons();
  renderComments(recipe.id);
  initCommentForm(recipe.id);
}

/* ------------------------ Популярные кулинары --------------------- */

/** Карточка кулинара на главной странице. */
function authorCardTemplate(author) {
  const count = author.subscribers + (store.isSubscribed(author.id) ? 1 : 0);

  return `
    <div class="col">
      <div class="card h-100">
        <div class="card-body">
          <h3 class="h6 mb-1">${escapeHtml(author.name)}</h3>
          <p class="text-muted small mb-2">${escapeHtml(author.bio || '')}</p>
          <span class="badge text-bg-light border">
            <span data-subscribers="${author.id}">${count}</span> подписчиков
          </span>
        </div>
        <div class="card-footer bg-white border-top-0">
          <button class="btn btn-sm btn-outline-secondary w-100" type="button"
            data-subscribe-author="${author.id}">
            Подписаться
          </button>
        </div>
      </div>
    </div>
  `;
}

/** Отрисовать топ-3 авторов на главной. */
async function initPopularAuthors() {
  const container = document.querySelector('[data-popular-authors]');
  if (!container) return;

  await appReady;

  try {
    const authors = [...store.getAllUsers()]
      .sort((a, b) => b.subscribers - a.subscribers)
      .slice(0, 3);

    if (!authors.length) {
      container.innerHTML = `
        <div class="col-12">
          <div class="alert alert-light border text-center mb-0" role="status">
            Пока нет зарегистрированных кулинаров.
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = authors.map(authorCardTemplate).join('');
    initSubscribeButtons();
  } catch (error) {
    showApiError(error, container);
  }
}

/* --------------------------- Инициализация ------------------------ */

document.addEventListener('DOMContentLoaded', () => {
  initPopularAuthors();
  appReady.then(initSubscribeButtons);
});

