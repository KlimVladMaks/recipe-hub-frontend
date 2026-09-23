/**
 * storage.js — тонкая обёртка над localStorage.
 *
 * Единая точка доступа к состоянию приложения: сессия пользователя,
 * лайки, сохранённые рецепты, подписки, локально добавленные аккаунты
 * и комментарии. В ЛР2 часть этого состояния переедет на сервер.
 */

const KEYS = {
  session: 'rh_session',
  users: 'rh_users',
  profileOverrides: 'rh_profile_overrides',
  recipes: 'rh_recipes',
  likes: 'rh_likes',
  bookmarks: 'rh_bookmarks',
  subscriptions: 'rh_subscriptions',
  comments: 'rh_comments',
};

/** Чтение JSON-значения с запасным вариантом. */
function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn(`storage: не удалось прочитать "${key}"`, error);
    return fallback;
  }
}

/** Запись JSON-значения. */
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`storage: не удалось записать "${key}"`, error);
    return false;
  }
}

/* ----------------------------- Сессия ----------------------------- */

/** Идентификатор текущего пользователя или null. */
export function getSessionUserId() {
  return read(KEYS.session, null);
}

/** Запомнить вход пользователя. */
export function setSessionUserId(userId) {
  write(KEYS.session, userId);
}

/** Завершить сессию. */
export function clearSession() {
  localStorage.removeItem(KEYS.session);
}

/* ------------------------ Локальные аккаунты ---------------------- */

/** Аккаунты, зарегистрированные на этом устройстве. */
export function getLocalUsers() {
  return read(KEYS.users, []);
}

/** Сохранить новый аккаунт. */
export function addLocalUser(user) {
  const users = getLocalUsers();
  users.push(user);
  write(KEYS.users, users);
}

/** Изменения профилей (имя, bio), сохранённые на устройстве. */
export function getProfileOverrides() {
  return read(KEYS.profileOverrides, {});
}

/** Сохранить изменения профиля конкретного пользователя. */
export function saveProfileOverride(userId, changes) {
  const overrides = getProfileOverrides();
  overrides[String(userId)] = {
    ...(overrides[String(userId)] || {}),
    ...changes,
  };
  write(KEYS.profileOverrides, overrides);
}

/* --------------------------- Коллекции ---------------------------- */

/** Рецепты, созданные на этом устройстве. */
export function getLocalRecipes() {
  return read(KEYS.recipes, []);
}

/** Добавить локальный рецепт, вернуть созданную запись. */
export function addLocalRecipe(recipe) {
  const list = getLocalRecipes();
  list.push(recipe);
  write(KEYS.recipes, list);
  return recipe;
}

/** Список id рецептов, которым пользователь поставил лайк. */
export function getLikes() {
  return read(KEYS.likes, []);
}

/** Переключить лайк, вернуть новое состояние (true — лайк поставлен). */
export function toggleLike(recipeId) {
  const id = Number(recipeId);
  const likes = getLikes();
  const index = likes.indexOf(id);
  if (index === -1) {
    likes.push(id);
    write(KEYS.likes, likes);
    return true;
  }
  likes.splice(index, 1);
  write(KEYS.likes, likes);
  return false;
}

/** Сохранённые (добавленные в закладки) рецепты. */
export function getBookmarks() {
  return read(KEYS.bookmarks, []);
}

/** Переключить сохранение рецепта, вернуть новое состояние. */
export function toggleBookmark(recipeId) {
  const id = Number(recipeId);
  const bookmarks = getBookmarks();
  const index = bookmarks.indexOf(id);
  if (index === -1) {
    bookmarks.push(id);
    write(KEYS.bookmarks, bookmarks);
    return true;
  }
  bookmarks.splice(index, 1);
  write(KEYS.bookmarks, bookmarks);
  return false;
}

/** Подписки на авторов (id кулинаров). */
export function getSubscriptions() {
  return read(KEYS.subscriptions, []);
}

/** Переключить подписку, вернуть новое состояние. */
export function toggleSubscription(authorId) {
  const id = Number(authorId);
  const subscriptions = getSubscriptions();
  const index = subscriptions.indexOf(id);
  if (index === -1) {
    subscriptions.push(id);
    write(KEYS.subscriptions, subscriptions);
    return true;
  }
  subscriptions.splice(index, 1);
  write(KEYS.subscriptions, subscriptions);
  return false;
}

/* -------------------------- Комментарии --------------------------- */

/** Локально добавленные комментарии. */
export function getLocalComments() {
  return read(KEYS.comments, []);
}

/** Добавить комментарий, вернуть созданную запись. */
export function addComment(comment) {
  const list = getLocalComments();
  list.push(comment);
  write(KEYS.comments, list);
  return comment;
}

/* ---------------------------- Утилиты ----------------------------- */

/** Полная очистка состояния приложения (для отладки). */
export function resetAll() {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
}
