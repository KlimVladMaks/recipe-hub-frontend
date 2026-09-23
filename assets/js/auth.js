/**
 * auth.js — вход и регистрация.
 *
 * ЛР1: «авторизация» полностью клиентская. Аккаунты хранятся в localStorage
 * (см. storage.js), сессия — там же. Валидация форм реализована вручную,
 * с использованием классов Bootstrap is-invalid / invalid-feedback.
 */

import { addLocalUser, setSessionUserId, getSessionUserId } from './storage.js';
import { getAllUsers, url } from './main.js';

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

/** Возвращает true, если пользователь с таким e-mail уже существует. */
function emailExists(email) {
  return getAllUsers().some(
    (user) => user.email.toLowerCase() === email.toLowerCase(),
  );
}

/* ------------------------------ Вход ------------------------------ */

function initLoginForm() {
  document.querySelectorAll('[data-login-form]').forEach((form) => {
    if (form.dataset.loginBound) return;
    form.dataset.loginBound = 'true';

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      resetValidation(form);

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

      const value = email.value.trim();

      // Демонстрационный аккаунт доступен всегда.
      if (value === 'demo@recipehub.ru' && password.value === 'demo1234') {
        setSessionUserId('demo');
        window.location.href = url('pages/profile.html');
        return;
      }

      const account = getAllUsers().find(
        (user) => user.email.toLowerCase() === value.toLowerCase(),
      );

      if (!account || account.password !== password.value) {
        const alertBox = form.querySelector('[data-login-error]');
        if (alertBox) {
          alertBox.hidden = false;
          alertBox.textContent = 'Неверный e-mail или пароль.';
        }
        return;
      }

      setSessionUserId(account.id);
      window.location.href = url('pages/profile.html');
    });
  });
}

/* --------------------------- Регистрация -------------------------- */

function initRegisterForm() {
  document.querySelectorAll('[data-register-form]').forEach((form) => {
    if (form.dataset.registerBound) return;
    form.dataset.registerBound = 'true';

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      resetValidation(form);

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
      } else if (emailExists(email.value.trim())) {
        setFieldError(email, 'Пользователь с таким e-mail уже существует.');
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

      const newUser = {
        id: `local-${Date.now()}`,
        name: name.value.trim(),
        email: email.value.trim(),
        password: password.value,
        bio: '',
        subscribers: 0,
      };

      addLocalUser(newUser);
      setSessionUserId(newUser.id);
      window.location.href = url('pages/profile.html');
    });
  });
}

/* ------------------------ Защита страницы ------------------------- */

/**
 * На странице профиля показать предупреждение и скрыть содержимое,
 * если пользователь не авторизован. Сами данные профиля рендерит profile.js.
 */
function guardProfilePage() {
  const container = document.querySelector('[data-profile-page]');
  if (!container) return;
  if (!getSessionUserId()) {
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
