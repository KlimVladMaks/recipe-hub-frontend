/**
 * store.js — клиентский кэш данных RecipeHub.
 *
 * Все страницы сначала дожидаются appReady (см. main.js), после чего
 * синхронно читают данные через селекторы этого модуля. Мутации
 * обновляют и сервер, и кэш.
 */

import * as api from './api.js';

const state = {
  users: [],
  recipes: [],
  likes: [],
  bookmarks: [],
  subscriptions: [],
  comments: new Map(),
  currentUser: null,
  apiOnline: true,
};

/** Убрать password из объекта пользователя. */
function sanitizeUser(user) {
  if (!user) return user;
  const { password, ...rest } = user;
  return rest;
}

/* --------------------------- Состояние API --------------------------- */

export function setApiOnline(value) {
  state.apiOnline = Boolean(value);
}

export function isApiOnline() {
  return state.apiOnline;
}

/* ------------------------------ Сессия ------------------------------- */

export function setCurrentUser(user) {
  state.currentUser = user ? sanitizeUser(user) : null;
}

export function getCurrentUser() {
  return state.currentUser;
}

/* --------------------------- Пользователи ---------------------------- */

export function getAllUsers() {
  return state.users;
}

export function getUserById(id) {
  return state.users.find((user) => String(user.id) === String(id)) || null;
}

export function getUserName(authorId) {
  const user = getUserById(authorId);
  return user ? user.name : 'Неизвестный автор';
}

export function updateUser(user) {
  const sanitized = sanitizeUser(user);
  const index = state.users.findIndex(
    (item) => String(item.id) === String(sanitized.id),
  );

  if (index === -1) {
    state.users.push(sanitized);
  } else {
    state.users[index] = sanitized;
  }

  if (
    state.currentUser &&
    String(state.currentUser.id) === String(sanitized.id)
  ) {
    setCurrentUser(sanitized);
  }

  return sanitized;
}

/* ------------------------------ Рецепты ------------------------------ */

export function getAllRecipes() {
  return state.recipes;
}

export function getRecipeById(id) {
  return (
    state.recipes.find((recipe) => String(recipe.id) === String(id)) || null
  );
}

export function upsertRecipe(recipe) {
  const index = state.recipes.findIndex(
    (item) => String(item.id) === String(recipe.id),
  );
  if (index === -1) {
    state.recipes.push(recipe);
  } else {
    state.recipes[index] = recipe;
  }
  return recipe;
}

export function removeRecipe(id) {
  state.recipes = state.recipes.filter(
    (recipe) => String(recipe.id) !== String(id),
  );
}

/* ------------------------------- Лайки ------------------------------- */

export function getLikes() {
  return state.likes;
}

export function findLike(recipeId) {
  return (
    state.likes.find((like) => String(like.recipeId) === String(recipeId)) ||
    null
  );
}

export function isLiked(recipeId) {
  return Boolean(findLike(recipeId));
}

export function addLike(like) {
  if (!findLike(like.recipeId)) state.likes.push(like);
  return like;
}

export function removeLike(id) {
  state.likes = state.likes.filter((like) => String(like.id) !== String(id));
}

/* ----------------------------- Закладки ------------------------------ */

export function getBookmarks() {
  return state.bookmarks;
}

export function findBookmark(recipeId) {
  return (
    state.bookmarks.find(
      (bookmark) => String(bookmark.recipeId) === String(recipeId),
    ) || null
  );
}

export function isBookmarked(recipeId) {
  return Boolean(findBookmark(recipeId));
}

export function addBookmark(bookmark) {
  if (!findBookmark(bookmark.recipeId)) state.bookmarks.push(bookmark);
  return bookmark;
}

export function removeBookmark(id) {
  state.bookmarks = state.bookmarks.filter(
    (bookmark) => String(bookmark.id) !== String(id),
  );
}

/* ---------------------------- Подписки ------------------------------- */

export function getSubscriptions() {
  return state.subscriptions;
}

export function findSubscription(authorId) {
  return (
    state.subscriptions.find(
      (subscription) => String(subscription.authorId) === String(authorId),
    ) || null
  );
}

export function isSubscribed(authorId) {
  return Boolean(findSubscription(authorId));
}

export function addSubscription(subscription) {
  if (!findSubscription(subscription.authorId)) {
    state.subscriptions.push(subscription);
  }
  return subscription;
}

export function removeSubscription(id) {
  state.subscriptions = state.subscriptions.filter(
    (subscription) => String(subscription.id) !== String(id),
  );
}


/* ---------------------------- Комментарии ---------------------------- */

export function getComments(recipeId) {
  return state.comments.get(String(recipeId)) || [];
}

export function setComments(recipeId, list) {
  state.comments.set(String(recipeId), list);
}

export function addComment(comment) {
  const list = getComments(comment.recipeId);
  list.push(comment);
  setComments(comment.recipeId, list);
  return comment;
}

/* ----------------------------- Загрузка ------------------------------ */

/** Загрузить справочники и коллекции текущего пользователя. */
export async function loadBase() {
  const [users, recipes] = await Promise.all([
    api.users.list(),
    api.recipes.list(),
  ]);

  state.users = users.map(sanitizeUser);
  state.recipes = recipes;

  await loadUserCollections(state.currentUser ? state.currentUser.id : null);
}

/** Загрузить лайки, закладки и подписки пользователя. */
export async function loadUserCollections(userId) {
  if (userId === null || userId === undefined) {
    state.likes = [];
    state.bookmarks = [];
    state.subscriptions = [];
    return;
  }

  const [likes, bookmarks, subscriptions] = await Promise.all([
    api.likes.listByUser(userId),
    api.bookmarks.listByUser(userId),
    api.subscriptions.listByUser(userId),
  ]);

  state.likes = likes;
  state.bookmarks = bookmarks;
  state.subscriptions = subscriptions;
}

/** Загрузить комментарии рецепта в кэш. */
export async function loadComments(recipeId) {
  const list = await api.comments.listByRecipe(recipeId);
  setComments(recipeId, list);
  return list;
}

/** Полностью сбросить пользовательское состояние (при выходе). */
export function resetUserState() {
  state.currentUser = null;
  state.likes = [];
  state.bookmarks = [];
  state.subscriptions = [];
}

