/**
 * recipe.js — рендер страницы одного рецепта.
 *
 * Рецепт выбирается по параметру ?id= в адресе. Данные загружаются из API,
 * после чего social.js привязывает лайки, закладки, подписку и комментарии.
 */

import * as api from './api.js';
import * as store from './store.js';
import {
  appReady,
  announce,
  escapeHtml,
  url,
  formatDuration,
  setLoading,
  showApiError,
} from './main.js';
import { initRecipeSocial } from './social.js';

/** id рецепта из query-параметров адреса. */
function getRecipeIdFromUrl() {
  return new URLSearchParams(window.location.search).get('id');
}

/** Заполнить страницу данными рецепта. */
function renderRecipe(recipe, author) {
  const view = document.querySelector('[data-recipe-view]');
  if (!view) return;

  const image = view.querySelector('[data-recipe-image]');

  document.title = `${recipe.title} — RecipeHub`;
  image.src = url(recipe.image);
  image.alt = `Фотография блюда «${recipe.title}»`;

  view.querySelector('[data-recipe-title]').textContent = recipe.title;
  view.querySelector('[data-recipe-title-crumb]').textContent = recipe.title;
  view.querySelector('[data-recipe-time]').textContent = formatDuration(
    recipe.timeMinutes,
  );
  view.querySelector('[data-recipe-difficulty]').textContent =
    `Сложность: ${recipe.difficulty}`;
  view.querySelector('[data-recipe-servings]').textContent =
    `Порций: ${recipe.servings}`;
  view.querySelector('[data-recipe-dish]').textContent = recipe.dishType;
  view.querySelector('[data-recipe-description]').textContent =
    recipe.description;

  // Ингредиенты
  view.querySelector('[data-recipe-ingredients]').innerHTML = recipe.ingredients
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('');

  // Шаги
  view.querySelector('[data-recipe-steps]').innerHTML = recipe.steps
    .map(
      (step, index) => `
        <li class="d-flex gap-3 ${index ? 'mt-3' : ''}">
          <span class="rh-step-number" aria-hidden="true">${index + 1}</span>
          <p class="mb-0 pt-1">${escapeHtml(step)}</p>
        </li>
      `,
    )
    .join('');

  // Видео (если задано)
  const videoBlock = view.querySelector('[data-recipe-video-block]');
  const videoFrame = view.querySelector('[data-recipe-video]');
  if (recipe.videoUrl) {
    videoBlock.hidden = false;
    videoFrame.src = recipe.videoUrl;
    videoFrame.title = `Видео приготовления: ${recipe.title}`;
  }

  // Автор
  view.querySelector('[data-author-name]').textContent = author
    ? author.name
    : 'Неизвестный автор';
  view.querySelector('[data-author-bio]').textContent = author
    ? author.bio || ''
    : '';

  const subscribe = view.querySelector('[data-subscribe-author]');
  if (subscribe) subscribe.dataset.subscribeAuthor = recipe.userId;

  // Привязка действий к конкретному рецепту
  view.querySelector('[data-like-recipe]').dataset.likeRecipe = recipe.id;
  view.querySelector('[data-bookmark-recipe]').dataset.bookmarkRecipe =
    recipe.id;

  // Ссылка для «Поделиться»
  const shareInput = document.querySelector('[data-share-link]');
  if (shareInput) shareInput.value = window.location.href;

  // Комментарии привязываются к id рецепта в social.js
  const commentsList = document.querySelector('[data-comments-list]');
  if (commentsList) commentsList.dataset.commentsList = recipe.id;

  view.hidden = false;
}

/** Настроить кнопку копирования ссылки. */
function initShareButton() {
  const button = document.querySelector('[data-copy-link]');
  const input = document.querySelector('[data-share-link]');
  if (!button || !input || button.dataset.shareBound) return;
  button.dataset.shareBound = 'true';

  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(input.value);
      button.textContent = 'Скопировано';
      announce('Ссылка на рецепт скопирована');
      setTimeout(() => {
        button.textContent = 'Скопировать ссылку';
      }, 1500);
    } catch {
      input.select();
      announce('Ссылка выделена. Скопируйте её вручную.');
    }
  });
}

/** Показать и озвучить состояние «рецепт не найден». */
function showNotFound(alertElement) {
  if (!alertElement) return;
  alertElement.hidden = false;
  alertElement.focus();
}

async function init() {
  const view = document.querySelector('[data-recipe-view]');
  const notFound = document.querySelector('[data-recipe-not-found]');
  const id = getRecipeIdFromUrl();

  if (!id) {
    showNotFound(notFound);
    initShareButton();
    return;
  }

  setLoading(view, true);

  try {
    await appReady;

    const recipe = await api.recipes.get(id);
    const comments = await api.comments.listByRecipe(recipe.id);

    store.upsertRecipe(recipe);
    store.setComments(recipe.id, comments);

    let author = store.getUserById(recipe.userId);
    if (!author) {
      author = await api.users.get(recipe.userId);
      store.updateUser(author);
    }

    renderRecipe(recipe, author);
    initRecipeSocial(recipe);
  } catch (error) {
    if (view) view.hidden = true;

    if (error instanceof api.ApiError && error.status === 404) {
      showNotFound(notFound);
    } else {
      showApiError(error);
    }
  } finally {
    setLoading(view, false);
  }

  initShareButton();
}

document.addEventListener('DOMContentLoaded', init);
