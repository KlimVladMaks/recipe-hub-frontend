/**
 * auth.js — вход и регистрация.
 *
 * ЛР2: учётные данные проверяет моковый API (json-server-auth).
 * Сервер возвращает JWT, который сохраняется в localStorage
 * («Запомнить меня») или sessionStorage.
 */

import { auth, ApiError } from './api.js';
import { appReady, url } from './main.js';
import * as store from './store.js';

/** Показать/скрыть сообщение об ошибке под полем. */
function setFieldError(field, message) {
  field.classList.add('is-invalid');
  field.classList.remove('is-valid');
  const feedback = field.parentElement.querySelector('.invalid-feedback');
  if (feedback && message) feedback.textContent = message;
}

/** Пометить поле как корректное. */
function setFieldValid(field) {
  field.classList.remove('is-invalid');
  field.classList.add('is-valid');
}

/** Очистить состояние валидации у формы. */
function resetValidation(form) {
  form.querySelectorAll('.is-invalid, .is-valid').forEach((field) => {
    field.classList.remove('is-invalid', 'is-valid');
  });
}

/** Простая проверка e-mail. */
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** Показать/скрыть общий alert формы. */
function showAlert(element, message) {
  if (!element) return;
  element.hidden = false;
  element.textContent = message;
}

function hideAlert(element) {
  if (element) element.hidden = true;
}

/** Заблокировать кнопку отправки и показать текст загрузки. */
function setSubmitting(form, submitting, loadingText) {
  const button = form.querySelector('[type="submit"]');
  if (!button) return;
  if (!button.dataset.originalText) {
    button.dataset.originalText = button.textContent;
  }
  button.disabled = submitting;
  button.textContent = submitting ? loadingText : button.dataset.originalText;
}

/* ------------------------------ Вход ------------------------------ */

function initLoginForm() {
  document.querySelectorAll('[data-login-form]').forEach((form) => {
    if (form.dataset.loginBound) return;
    form.dataset.loginBound = 'true';

    const alertBox = form.querySelector('[data-login-error]');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      resetValidation(form);
      hideAlert(alertBox);

      const email = form.elements.email;
      const password = form.elements.password;
      let isValid = true;

      if (!isValidEmail(email.value.trim())) {
        setFieldError(email, 'Введите корректный e-mail.');
        isValid = false;
      } else {
        setFieldValid(email);
      }

      if (!password.value) {
        setFieldError(password, 'Введите пароль.');
        isValid = false;
      } else {
        setFieldValid(password);
      }

      if (!isValid) return;

      setSubmitting(form, true, 'Вход…');

      try {
        const token = await auth.login(email.value.trim(), password.value);
        const remember = Boolean(form.elements.remember?.checked);
        auth.saveToken(token, remember);
        window.location.href = url('pages/profile.html');
      } catch (error) {
        if (error instanceof ApiError && error.status === 400) {
          showAlert(alertBox, 'Неверный e-mail или пароль.');
        } else if (error instanceof ApiError && error.status === 0) {
          showAlert(alertBox, error.message);
        } else {
          showAlert(alertBox, 'Не удалось войти. Попробуйте ещё раз.');
        }
      } finally {
        setSubmitting(form, false, '');
      }
    });
  });
}

/* --------------------------- Регистрация -------------------------- */

function initRegisterForm() {
  document.querySelectorAll('[data-register-form]').forEach((form) => {
    if (form.dataset.registerBound) return;
    form.dataset.registerBound = 'true';

    const alertBox = document.querySelector('[data-register-error]');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      resetValidation(form);
      hideAlert(alertBox);

      const name = form.elements.name;
      const email = form.elements.email;
      const password = form.elements.password;
      const confirm = form.elements.confirm;
      const terms = form.elements.terms;
      let isValid = true;

      if (name.value.trim().length < 2) {
        setFieldError(name, 'Укажите имя (минимум 2 символа).');
        isValid = false;
      } else {
        setFieldValid(name);
      }

      if (!isValidEmail(email.value.trim())) {
        setFieldError(email, 'Введите корректный e-mail.');
        isValid = false;
      } else {
        setFieldValid(email);
      }

      if (password.value.length < 8) {
        setFieldError(password, 'Пароль должен содержать минимум 8 символов.');
        isValid = false;
      } else {
        setFieldValid(password);
      }

      if (!confirm.value || confirm.value !== password.value) {
        setFieldError(confirm, 'Пароли не совпадают.');
        isValid = false;
      } else {
        setFieldValid(confirm);
      }

      if (terms && !terms.checked) {
        terms.classList.add('is-invalid');
        isValid = false;
      } else if (terms) {
        terms.classList.remove('is-invalid');
      }

      if (!isValid) return;

      setSubmitting(form, true, 'Регистрация…');

      try {
        const token = await auth.register({
          name: name.value.trim(),
          email: email.value.trim(),
          password: password.value,
          bio: '',
          subscribers: 0,
        });

        auth.saveToken(token, true);
        window.location.href = url('pages/profile.html');
      } catch (error) {
        if (error instanceof ApiError && error.status === 400) {
          if (/email/i.test(error.message)) {
            setFieldError(
              email,
              'Пользователь с таким e-mail уже существует.',
            );
            showAlert(alertBox, 'Пользователь с таким e-mail уже существует.');
          } else {
            showAlert(alertBox, 'Проверьте корректность введённых данных.');
          }
        } else if (error instanceof ApiError && error.status === 0) {
          showAlert(alertBox, error.message);
        } else {
          showAlert(alertBox, 'Не удалось зарегистрироваться. Попробуйте ещё раз.');
        }
      } finally {
        setSubmitting(form, false, '');
      }
    });
  });
}

/* ------------------------ Защита страницы ------------------------- */

/**
 * На странице профиля показать предупреждение и скрыть содержимое,
 * если пользователь не авторизован. Данные профиля рендерит profile.js.
 */
async function guardProfilePage() {
  const container = document.querySelector('[data-profile-page]');
  if (!container) return;

  await appReady;

  if (!store.getCurrentUser()) {
    const warning = document.querySelector('[data-profile-guest]');
    if (warning) warning.hidden = false;
    container.hidden = true;
  }
}

function init() {
  initLoginForm();
  initRegisterForm();
  guardProfilePage();
}

document.addEventListener('DOMContentLoaded', init);

