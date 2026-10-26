/**
 * theme.js — переключение светлой и тёмной темы (ДР3).
 *
 * Настройка хранится в localStorage под ключом `recipehub-theme` и принимает
 * значения `system`, `light` или `dark`. По умолчанию используется `system`:
 * тема следует за настройкой ОС (prefers-color-scheme).
 *
 * Тема применяется атрибутом data-bs-theme на <html>: Bootstrap 5.3 читает
 * его для своих color modes, а variables.css — для токенов --rh-*.
 *
 * До загрузки CSS в <head> каждой страницы есть небольшой inline-скрипт,
 * который применяет сохранённую тему без вспышки светлого экрана. Здесь
 * та же логика повторяется для переключения во время работы страницы.
 */

/** Ключ пользовательской настройки в localStorage. */
export const THEME_STORAGE_KEY = 'recipehub-theme';

const PREFERENCES = ['system', 'light', 'dark'];

const THEME_META = {
  light: { label: 'Светлая', icon: 'icon-sun' },
  dark: { label: 'Тёмная', icon: 'icon-moon' },
  system: { label: 'Системная', icon: 'icon-monitor' },
};

const mediaQuery = window.matchMedia
  ? window.matchMedia('(prefers-color-scheme: dark)')
  : null;

let currentPreference = readPreference();
let announceMessage = () => {};

/** Прочитать настройку из localStorage (при ошибке — «как в системе»). */
function readPreference() {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return PREFERENCES.includes(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

/** Сохранить настройку. Ошибки приватного режима не должны ломать UI. */
function savePreference(preference) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    /* localStorage может быть недоступен — тема продолжит работать в памяти. */
  }
}

/** Текущая пользовательская настройка: system, light или dark. */
export function getThemePreference() {
  return currentPreference;
}

/**
 * Какая тема реально будет применена.
 * Для `system` учитывается текущая настройка операционной системы.
 */
export function resolveTheme(preference = currentPreference) {
  if (preference === 'light' || preference === 'dark') return preference;
  return mediaQuery?.matches ? 'dark' : 'light';
}

/** Обновить подписи, иконки и состояния пунктов меню. */
function updateControls() {
  const meta = THEME_META[currentPreference];

  document.querySelectorAll('[data-theme-switcher]').forEach((switcher) => {
    const label = switcher.querySelector('[data-theme-label]');
    if (label) label.textContent = meta.label;

    const icon = switcher.querySelector('[data-theme-icon]');
    if (icon) {
      const href = icon.getAttribute('href') || '';
      const nextHref = href.replace(/#[^#]*$/, `#${meta.icon}`);
      if (nextHref !== href) icon.setAttribute('href', nextHref);
    }
  });

  document.querySelectorAll('[data-theme-set]').forEach((button) => {
    const selected = button.dataset.themeSet === currentPreference;
    button.setAttribute('aria-pressed', String(selected));

    const check = button.querySelector('[data-theme-check]');
    if (check) check.classList.toggle('invisible', !selected);
  });
}

/** Применить тему к документу и синхронизировать элементы управления. */
function applyTheme({ notify = false } = {}) {
  const resolved = resolveTheme();
  document.documentElement.setAttribute('data-bs-theme', resolved);
  updateControls();

  if (!notify) return;

  if (currentPreference === 'system') {
    const resolvedLabel = resolved === 'dark' ? 'тёмная' : 'светлая';
    announceMessage(`Тема оформления: как в системе (сейчас ${resolvedLabel})`);
    return;
  }

  announceMessage(
    `Тема оформления: ${resolved === 'dark' ? 'тёмная' : 'светлая'}`,
  );
}

/**
 * Изменить настройку темы.
 *
 * @param {'system'|'light'|'dark'} preference
 * @param {{ persist?: boolean, notify?: boolean }} options
 */
export function setThemePreference(preference, { persist = true, notify = true } = {}) {
  currentPreference = PREFERENCES.includes(preference) ? preference : 'system';
  if (persist) savePreference(currentPreference);
  applyTheme({ notify });
}

/**
 * Инициализировать переключатель темы на странице.
 *
 * @param {{ announce?: (message: string) => void }} options
 */
export function initTheme({ announce } = {}) {
  if (typeof announce === 'function') announceMessage = announce;

  currentPreference = readPreference();
  applyTheme();

  document.querySelectorAll('[data-theme-set]').forEach((button) => {
    if (button.dataset.themeBound) return;
    button.dataset.themeBound = 'true';
    button.addEventListener('click', () => {
      setThemePreference(button.dataset.themeSet);
    });
  });

  // Если выбрано «как в системе», реагируем на смену темы ОС.
  if (mediaQuery) {
    const onSystemThemeChange = () => {
      if (currentPreference === 'system') applyTheme();
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', onSystemThemeChange);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(onSystemThemeChange);
    }
  }

  // Синхронизация между вкладками: выбор темы в одной вкладке
  // применяется и в остальных открытых страницах приложения.
  window.addEventListener('storage', (event) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    currentPreference = readPreference();
    applyTheme();
  });
}
