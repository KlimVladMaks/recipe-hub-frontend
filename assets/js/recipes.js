/**
 * recipes.js — рендер карточек рецептов, главная страница и поиск.
 *
 * Данные приходят из API. Фильтрация выполняется на стороне json-server
 * через query-параметры, с debounce и отменой устаревших запросов.
 */

import { DISH_TYPES, DIFFICULTIES } from './constants.js';
import * as api from './api.js';
import * as store from './store.js';
import {
  appReady,
  escapeHtml,
  url,
  formatDuration,
  getUserName,
  setLoading,
  showApiError,
} from './main.js';

/** Разметка одной карточки рецепта. */
export function recipeCardTemplate(recipe) {
  const authorName = getUserName(recipe.userId);
  const liked = store.isLiked(recipe.id);
  const bookmarked = store.isBookmarked(recipe.id);
  const likesCount = recipe.likes + (liked ? 1 : 0);

  return `
    <article class="card h-100 shadow-sm">
      <a href="${url(`pages/recipe.html?id=${recipe.id}`)}" class="rh-link-reset">
        <img src="${url(recipe.image)}" alt="" class="card-img-top rh-card-image">
      </a>
      <div class="card-body d-flex flex-column">
        <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
          <span class="badge text-bg-light border">${escapeHtml(recipe.dishType)}</span>
          <span class="text-muted small">${escapeHtml(recipe.difficulty)} сложность</span>
        </div>
        <h3 class="h6 card-title mb-1">
          <a href="${url(`pages/recipe.html?id=${recipe.id}`)}" class="rh-link-reset stretched-link">${escapeHtml(recipe.title)}</a>
        </h3>
        <p class="card-text text-muted small flex-grow-1">${escapeHtml(authorName)}</p>
        <div class="d-flex justify-content-between align-items-center small text-muted">
          <span class="d-inline-flex align-items-center gap-1">
            <svg class="rh-icon" aria-hidden="true"><use href="${url('assets/img/sprite.svg#icon-clock')}"></use></svg>
            ${escapeHtml(formatDuration(recipe.timeMinutes))}
          </span>
          <span class="d-inline-flex align-items-center gap-1">
            <svg class="rh-icon" aria-hidden="true"><use href="${url('assets/img/sprite.svg#icon-heart')}"></use></svg>
            <span data-like-count="${recipe.id}">${likesCount}</span>
          </span>
          ${bookmarked ? '<span class="badge text-bg-secondary">Сохранён</span>' : ''}
        </div>
      </div>
    </article>
  `;
}

/** Отрисовать список рецептов в контейнер. */
export function renderRecipes(container, list) {
  if (!container) return;

  if (!list.length) {
    container.innerHTML = `
      <div class="col-12">
        <div class="alert alert-light border text-center mb-0" role="status">
          Рецепты не найдены. Попробуйте изменить условия поиска.
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(recipeCardTemplate).join('');
}

/** Заполнить select-ы фильтров значениями справочников. */
export function fillFilterOptions() {
  document.querySelectorAll('[data-filter="dishType"]').forEach((select) => {
    DISH_TYPES.forEach((type) => {
      select.insertAdjacentHTML(
        'beforeend',
        `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`,
      );
    });
  });

  document.querySelectorAll('[data-filter="difficulty"]').forEach((select) => {
    DIFFICULTIES.forEach((level) => {
      select.insertAdjacentHTML(
        'beforeend',
        `<option value="${escapeHtml(level)}">${escapeHtml(level)}</option>`,
      );
    });
  });
}

/** Параметры сортировки json-server. */
function sortParams(sort) {
  switch (sort) {
    case 'likes':
      return { _sort: 'likes', _order: 'desc' };
    case 'time-asc':
      return { _sort: 'timeMinutes', _order: 'asc' };
    case 'time-desc':
      return { _sort: 'timeMinutes', _order: 'desc' };
    default:
      return { _sort: 'createdAt', _order: 'desc' };
  }
}

/* --------------------------- Главная ---------------------------- */

function initHomePage() {
  const container = document.querySelector('[data-recipes-list]');
  if (!container) return;

  const limit = Number(container.dataset.recipesList) || 6;

  appReady.then(async () => {
    setLoading(container, true);
    try {
      const list = await api.recipes.list({
        _sort: 'likes',
        _order: 'desc',
        _limit: limit,
      });
      renderRecipes(container, list);
    } catch (error) {
      showApiError(error, container);
    } finally {
      setLoading(container, false);
    }
  });
}

/* ---------------------------- Поиск ----------------------------- */

function initSearchPage() {
  const form = document.querySelector('[data-search-form]');
  if (!form) return;

  const results = document.querySelector('[data-search-results]');
  const counter = document.querySelector('[data-search-counter]');

  let controller = null;
  let timer = null;

  const applyFilters = async () => {
    const params = {
      q: form.elements.query?.value?.trim(),
      dishType: form.elements.dishType?.value,
      difficulty: form.elements.difficulty?.value,
      timeMinutes_lte: form.elements.maxTime?.value,
      ingredients_like: form.elements.ingredient?.value?.trim(),
      ...sortParams(form.elements.sort?.value),
    };

    if (controller) controller.abort();
    const current = new AbortController();
    controller = current;

    setLoading(results, true);
    if (counter) counter.textContent = 'Загрузка…';

    try {
      const list = await api.recipes.list(params, {
        signal: current.signal,
      });
      renderRecipes(results, list);
      if (counter) counter.textContent = `Найдено рецептов: ${list.length}`;
    } catch (error) {
      if (error.name === 'AbortError') return;
      showApiError(error, results);
      if (counter) counter.textContent = 'Не удалось загрузить рецепты';
    } finally {
      if (controller === current) {
        setLoading(results, false);
      }
    }
  };

  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(applyFilters, 300);
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearTimeout(timer);
    applyFilters();
  });

  Array.from(form.elements).forEach((control) => {
    control.addEventListener('input', schedule);
    control.addEventListener('change', schedule);
  });

  const resetButton = form.querySelector('[data-search-reset]');
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      form.reset();
      clearTimeout(timer);
      applyFilters();
    });
  }

  appReady.then(() => {
    fillFilterOptions();

    const initialQuery = new URLSearchParams(window.location.search).get(
      'query',
    );
    if (initialQuery && form.elements.query) {
      form.elements.query.value = initialQuery;
    }

    applyFilters();
  });
}

/* ------------------------ Личный кабинет ------------------------- */

/**
 * Отрисовать коллекцию рецептов в контейнере (используется profile.js).
 * Оставлено как публичная обёртка над renderRecipes.
 */
export function renderCollection(container, list) {
  renderRecipes(container, list);
}

function init() {
  initHomePage();
  initSearchPage();
}

document.addEventListener('DOMContentLoaded', init);

