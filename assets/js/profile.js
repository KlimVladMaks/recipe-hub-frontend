/**
 * profile.js — личный кабинет пользователя.
 *
 * Отображает данные профиля, коллекции рецептов (публикации, сохранённые,
 * подписки), а также обрабатывает модальные формы: создание рецепта и
 * редактирование профиля.
 */

import {
  getBookmarks,
  getSubscriptions,
  addLocalRecipe,
  saveProfileOverride,
} from './storage.js';
import {
  escapeHtml,
  getCurrentUser,
  getAllRecipes,
  getAllUsers,
  closeModal,
} from './main.js';
import { fillFilterOptions, renderCollection } from './recipes.js';

/** Заполнить шапку профиля. */
function renderProfileHeader(user) {
  const container = document.querySelector('[data-profile-page]');
  if (!container || !user) return;

  container.querySelector('[data-profile-name]').textContent = user.name;
  container.querySelector('[data-profile-email]').textContent = user.email;
  container.querySelector('[data-profile-bio]').textContent =
    user.bio || 'Расскажите о себе в настройках профиля.';

  // Предзаполнить форму редактирования.
  const form = document.querySelector('[data-edit-profile-form]');
  if (form) {
    form.elements.name.value = user.name;
    form.elements.bio.value = user.bio || '';
  }
}

/** Отобразить публикации пользователя. */
function renderPublished(user) {
  const container = document.querySelector('[data-profile-published]');
  if (!container) return;

  const mine = getAllRecipes().filter(
    (recipe) => String(recipe.authorId) === String(user.id),
  );
  renderCollection(container, mine);
}

/** Отобразить сохранённые рецепты. */
function renderSaved() {
  const container = document.querySelector('[data-profile-saved]');
  if (!container) return;

  const bookmarks = getBookmarks();
  const list = getAllRecipes().filter((recipe) => bookmarks.includes(recipe.id));
  renderCollection(container, list);
}

/** Отобразить подписки на кулинаров. */
function renderSubscriptions() {
  const container = document.querySelector('[data-profile-subscriptions]');
  if (!container) return;

  const subscriptions = getSubscriptions();
  const authors = getAllUsers().filter((user) => subscriptions.includes(user.id));

  if (!authors.length) {
    container.innerHTML = `
      <div class="col-12">
        <div class="alert alert-light border text-center mb-0" role="status">
          Вы пока ни на кого не подписаны. Найдите кулинаров на
          <a href="search.html">странице поиска</a>.
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = authors
    .map(
      (author) => `
        <div class="col">
          <div class="card h-100">
            <div class="card-body">
              <h2 class="h6 mb-1">${escapeHtml(author.name)}</h2>
              <p class="text-muted small mb-0">${escapeHtml(author.bio || '')}</p>
            </div>
          </div>
        </div>
      `,
    )
    .join('');
}

/* ------------------------- Модальные формы ------------------------ */

function initNewRecipeForm(user) {
  const form = document.querySelector('[data-new-recipe-form]');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const title = form.elements.title;
    if (!title.value.trim()) {
      title.classList.add('is-invalid');
      return;
    }
    title.classList.remove('is-invalid');

    const steps = form.elements.steps.value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const recipe = {
      id: `local-${Date.now()}`,
      title: title.value.trim(),
      authorId: user.id,
      dishType: form.elements.dishType.value || 'Основные блюда',
      difficulty: form.elements.difficulty.value || 'Низкая',
      timeMinutes: Number(form.elements.timeMinutes.value) || 30,
      servings: Number(form.elements.servings.value) || 2,
      description: form.elements.description.value.trim(),
      ingredients: form.elements.ingredients.value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      steps,
      image: 'assets/img/recipe-placeholder.svg',
      likes: 0,
      videoUrl: '',
      createdAt: new Date().toISOString(),
    };

    addLocalRecipe(recipe);
    form.reset();
    closeModal('newRecipeModal');
    renderPublished(user);
  });
}

function initEditProfileForm(user) {
  const form = document.querySelector('[data-edit-profile-form]');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = form.elements.name;
    if (name.value.trim().length < 2) {
      name.classList.add('is-invalid');
      return;
    }
    name.classList.remove('is-invalid');

    const changes = {
      name: name.value.trim(),
      bio: form.elements.bio.value.trim(),
    };
    saveProfileOverride(user.id, changes);
    closeModal('editProfileModal');

    // Обновить данные на странице без перезагрузки.
    const updated = { ...user, ...changes };
    renderProfileHeader(updated);
    document.querySelectorAll('[data-auth-username]').forEach((el) => {
      el.textContent = updated.name;
    });
  });
}

/* --------------------------- Инициализация ------------------------ */

function init() {
  const page = document.querySelector('[data-profile-page]');
  if (!page) return; // не страница профиля

  const user = getCurrentUser();
  if (!user) return; // предупреждение покажет auth.js

  page.hidden = false;
  fillFilterOptions();
  renderProfileHeader(user);
  renderPublished(user);
  renderSaved();
  renderSubscriptions();

  initNewRecipeForm(user);
  initEditProfileForm(user);
}

document.addEventListener('DOMContentLoaded', init);
