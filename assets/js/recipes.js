/**
 * recipes.js — рендер карточек рецептов и фильтрация.
 *
 * Используется на главной, в поиске и в личном кабинете. Все пути к
 * изображениям и ссылкам строятся от корня проекта (url()).
 */

import {
  DISH_TYPES,
  DIFFICULTIES,
} from './data.js';
import { getBookmarks, getLikes } from './storage.js';
import {
  escapeHtml,
  url,
  formatDuration,
  getUserName,
  getAllRecipes,
} from './main.js';

/** Разметка одной карточки рецепта. */
export function recipeCardTemplate(recipe) {
  const authorName = getUserName(recipe.authorId);
  const liked = getLikes().includes(recipe.id);
  const bookmarked = getBookmarks().includes(recipe.id);
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

/**
 * Отфильтровать рецепты.
 *
 * @param {{query?: string, dishType?: string, difficulty?: string,
 *          ingredient?: string, maxTime?: number, sort?: string}} filters
 */
export function filterRecipes(filters = {}) {
  const query = (filters.query || '').trim().toLowerCase();
  const ingredient = (filters.ingredient || '').trim().toLowerCase();

  let result = getAllRecipes().filter((recipe) => {
    if (filters.dishType && recipe.dishType !== filters.dishType) return false;
    if (filters.difficulty && recipe.difficulty !== filters.difficulty) return false;
    if (filters.maxTime && recipe.timeMinutes > Number(filters.maxTime)) return false;

    if (query) {
      const haystack = `${recipe.title} ${recipe.description}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    if (ingredient) {
      const hasIngredient = recipe.ingredients.some((item) =>
        item.toLowerCase().includes(ingredient),
      );
      if (!hasIngredient) return false;
    }

    return true;
  });

  switch (filters.sort) {
    case 'likes':
      result = result.sort((a, b) => b.likes - a.likes);
      break;
    case 'time-asc':
      result = result.sort((a, b) => a.timeMinutes - b.timeMinutes);
      break;
    case 'time-desc':
      result = result.sort((a, b) => b.timeMinutes - a.timeMinutes);
      break;
    default:
      result = result.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
  }

  return result;
}

/* --------------------------- Главная ---------------------------- */

function initHomePage() {
  const container = document.querySelector('[data-recipes-list]');
  if (!container) return;

  const limit = Number(container.dataset.recipesList) || getAllRecipes().length;
  const popular = [...getAllRecipes()]
    .sort((a, b) => b.likes - a.likes)
    .slice(0, limit);
  renderRecipes(container, popular);
}

/* ---------------------------- Поиск ----------------------------- */

function initSearchPage() {
  const form = document.querySelector('[data-search-form]');
  if (!form) return;

  const results = document.querySelector('[data-search-results]');
  const counter = document.querySelector('[data-search-counter]');
  fillFilterOptions();

  // Подставить запрос из адреса (переход с главной страницы: search.html?query=...).
  const initialQuery = new URLSearchParams(window.location.search).get('query');
  if (initialQuery && form.elements.query) {
    form.elements.query.value = initialQuery;
  }

  const applyFilters = () => {
    const filters = {
      query: form.elements.query?.value,
      dishType: form.elements.dishType?.value,
      difficulty: form.elements.difficulty?.value,
      ingredient: form.elements.ingredient?.value,
      maxTime: form.elements.maxTime?.value,
      sort: form.elements.sort?.value,
    };
    const list = filterRecipes(filters);
    renderRecipes(results, list);
    if (counter) {
      counter.textContent = `Найдено рецептов: ${list.length}`;
    }
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    applyFilters();
  });

  // Живая фильтрация при изменении любых полей формы (включая связанные
  // через атрибут form, например select сортировки).
  Array.from(form.elements).forEach((control) => {
    control.addEventListener('input', applyFilters);
    control.addEventListener('change', applyFilters);
  });

  const resetButton = form.querySelector('[data-search-reset]');
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      form.reset();
      applyFilters();
    });
  }

  applyFilters();
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
