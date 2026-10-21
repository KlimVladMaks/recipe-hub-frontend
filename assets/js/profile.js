/**
 * profile.js — личный кабинет пользователя.
 *
 * Данные профиля, публикации, сохранённые рецепты и подписки загружаются
 * из API. Создание рецепта и редактирование профиля также идут через API.
 */

import * as api from './api.js';
import * as store from './store.js';
import {
  appReady,
  escapeHtml,
  getCurrentUser,
  closeModal,
  setLoading,
  showApiError,
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

  const form = document.querySelector('[data-edit-profile-form]');
  if (form) {
    form.elements.name.value = user.name;
    form.elements.bio.value = user.bio || '';
  }
}

/** Отобразить публикации пользователя. */
async function renderPublished(user) {
  const container = document.querySelector('[data-profile-published]');
  if (!container) return;

  setLoading(container, true);
  try {
    const list = await api.recipes.list({
      userId: user.id,
      _sort: 'createdAt',
      _order: 'desc',
    });
    list.forEach(store.upsertRecipe);
    renderCollection(container, list);
  } catch (error) {
    showApiError(error, container);
  } finally {
    setLoading(container, false);
  }
}

/** Отобразить сохранённые рецепты. */
async function renderSaved(user) {
  const container = document.querySelector('[data-profile-saved]');
  if (!container) return;

  setLoading(container, true);
  try {
    const bookmarks = await api.bookmarks.listByUser(user.id);
    const ids = bookmarks.map((bookmark) => String(bookmark.recipeId));

    const list = store
      .getAllRecipes()
      .filter((recipe) => ids.includes(String(recipe.id)));

    renderCollection(container, list);
  } catch (error) {
    showApiError(error, container);
  } finally {
    setLoading(container, false);
  }
}

/** Отобразить подписки на кулинаров. */
async function renderSubscriptions(user) {
  const container = document.querySelector('[data-profile-subscriptions]');
  if (!container) return;

  setLoading(container, true);
  try {
    const subscriptions = await api.subscriptions.listByUser(user.id);
    const authorIds = subscriptions.map((item) => String(item.authorId));

    const authors = store
      .getAllUsers()
      .filter((author) => authorIds.includes(String(author.id)));

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
  } catch (error) {
    showApiError(error, container);
  } finally {
    setLoading(container, false);
  }
}


/* ------------------------- Модальные формы ------------------------ */

/** Создание нового рецепта. */
function initNewRecipeForm(user) {
  const form = document.querySelector('[data-new-recipe-form]');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
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
      userId: user.id,
      title: title.value.trim(),
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

    const button = form.querySelector('[type="submit"]');
    if (button) button.disabled = true;

    try {
      const created = await api.recipes.create(recipe);
      store.upsertRecipe(created);
      form.reset();
      closeModal('newRecipeModal');
      await renderPublished(user);
    } catch (error) {
      showApiError(error);
    } finally {
      if (button) button.disabled = false;
    }
  });
}

/** Редактирование имени и описания профиля. */
function initEditProfileForm(user) {
  const form = document.querySelector('[data-edit-profile-form]');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
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

    const button = form.querySelector('[type="submit"]');
    if (button) button.disabled = true;

    try {
      const updated = await api.users.update(user.id, changes);
      store.updateUser(updated);
      closeModal('editProfileModal');

      renderProfileHeader(updated);
      document.querySelectorAll('[data-auth-username]').forEach((element) => {
        element.textContent = updated.name;
      });
    } catch (error) {
      showApiError(error);
    } finally {
      if (button) button.disabled = false;
    }
  });
}

/* --------------------------- Инициализация ------------------------ */

async function init() {
  const page = document.querySelector('[data-profile-page]');
  if (!page) return; // не страница профиля

  await appReady;

  const user = getCurrentUser();
  if (!user) return; // предупреждение покажет auth.js

  page.hidden = false;
  fillFilterOptions();
  renderProfileHeader(user);

  await Promise.all([
    renderPublished(user),
    renderSaved(user),
    renderSubscriptions(user),
  ]);

  initNewRecipeForm(user);
  initEditProfileForm(user);
}

document.addEventListener('DOMContentLoaded', init);

