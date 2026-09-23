/**
 * recipe.js — рендер страницы одного рецепта.
 *
 * Рецепт выбирается по параметру ?id= в адресе. Если рецепт не найден,
 * показывается предупреждение. Все данные берутся из data.js.
 */

import { getRecipeById } from './data.js';
import {
  escapeHtml,
  url,
  formatDuration,
  getAllRecipes,
  getAllUsers,
} from './main.js';

/** id рецепта из query-параметров адреса. */
function getRecipeIdFromUrl() {
  return new URLSearchParams(window.location.search).get('id');
}

/** Найти рецепт по id среди всех (статических и локальных). */
function findRecipe(id) {
  return (
    getAllRecipes().find((recipe) => String(recipe.id) === String(id)) ||
    getRecipeById(id)
  );
}

/** Заполнить страницу данными рецепта. */
function renderRecipe(recipe) {
  const view = document.querySelector('[data-recipe-view]');
  if (!view) return;

  const author = getAllUsers().find(
    (user) => String(user.id) === String(recipe.authorId),
  );
  const image = view.querySelector('[data-recipe-image]');

  document.title = `${recipe.title} — RecipeHub`;
  image.src = url(recipe.image);
  image.alt = `Фотография блюда «${recipe.title}»`;

  view.querySelector('[data-recipe-title]').textContent = recipe.title;
  view.querySelector('[data-recipe-title-crumb]').textContent = recipe.title;
  view.querySelector('[data-recipe-time]').textContent = formatDuration(recipe.timeMinutes);
  view.querySelector('[data-recipe-difficulty]').textContent = `Сложность: ${recipe.difficulty}`;
  view.querySelector('[data-recipe-servings]').textContent = `Порций: ${recipe.servings}`;
  view.querySelector('[data-recipe-dish]').textContent = recipe.dishType;
  view.querySelector('[data-recipe-description]').textContent = recipe.description;

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
  }

  // Автор
  view.querySelector('[data-author-name]').textContent = author ? author.name : 'Неизвестный автор';
  view.querySelector('[data-author-bio]').textContent = author ? author.bio : '';
  const subscribe = view.querySelector('[data-subscribe-author]');
  if (subscribe) {
    subscribe.dataset.subscribeAuthor = recipe.authorId;
  }

  // Привязка действий к конкретному рецепту
  view.querySelector('[data-like-recipe]').dataset.likeRecipe = recipe.id;
  view.querySelector('[data-bookmark-recipe]').dataset.bookmarkRecipe = recipe.id;

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
  if (!button || !input) return;

  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(input.value);
      button.textContent = 'Скопировано';
      setTimeout(() => {
        button.textContent = 'Скопировать ссылку';
      }, 1500);
    } catch {
      input.select();
    }
  });
}

function init() {
  const id = getRecipeIdFromUrl();
  const recipe = id ? findRecipe(id) : null;

  if (!recipe) {
    const notFound = document.querySelector('[data-recipe-not-found]');
    if (notFound) notFound.hidden = false;
  } else {
    renderRecipe(recipe);
  }

  initShareButton();
}

document.addEventListener('DOMContentLoaded', init);
