# RecipeHub — фронтенд сервиса обмена рецептами

Учебный проект по дисциплине «Фронтенд-разработка» (ИТМО).
Вариант №5: сервис для обмена рецептами и кулинарных блогов.

## Текущий этап — Лабораторная работа 2

Сайт из ЛР1 подключён к моковому API на **json-server**. Реализовано:

- регистрация и вход с JWT (`json-server-auth`);
- разграничение прав: владелец изменяет свои записи, читать могут все;
- загрузка рецептов, пользователей и комментариев из API;
- серверная фильтрация и сортировка рецептов;
- лайки, закладки, подписки и комментарии через API;
- личный кабинет: публикации, сохранённые рецепты, подписки, создание
  рецепта и редактирование профиля.

В `localStorage` больше не хранятся данные приложения — только JWT
(в `localStorage` при «Запомнить меня» или в `sessionStorage` иначе).

## Стек

- HTML5, CSS3, Bootstrap 5.3.8 (подключён локально);
- JavaScript (ES-модули, без сборщиков и транспиляции);
- `fetch` для запросов к API;
- `json-server@0.17.4` — моковый REST API;
- `json-server-auth@2.1.0` — JWT-авторизация, bcrypt и guards;
- Node.js 18+ (проверено на Node 24).

Версии `json-server` и `json-server-auth` зафиксированы без `^`:
ветка `json-server` 1.x несовместима с `json-server-auth`.

## Структура проекта

```
recipe-hub-frontend/
├── index.html                  # Главная: лента и кулинары
├── pages/
│   ├── login.html              # Вход
│   ├── register.html           # Регистрация
│   ├── profile.html            # Личный кабинет
│   ├── search.html             # Поиск с фильтрацией
│   └── recipe.html             # Страница рецепта
├── assets/
│   ├── css/
│   │   ├── variables.css       # CSS-переменные (задел под ДЗ3)
│   │   └── style.css           # минимальные кастомные стили
│   ├── img/
│   │   ├── sprite.svg          # SVG-спрайт иконок
│   │   ├── favicon.svg         # иконка сайта
│   │   └── recipe-placeholder.svg
│   ├── js/
│   │   ├── api.js              # fetch-клиент, JWT, ресурсы API
│   │   ├── store.js            # кэш данных и селекторы
│   │   ├── constants.js        # справочники типов и сложности
│   │   ├── main.js             # appReady, навигация, утилиты
│   │   ├── auth.js             # вход и регистрация
│   │   ├── recipes.js          # главная и поиск
│   │   ├── recipe.js           # страница рецепта
│   │   ├── profile.js          # личный кабинет
│   │   └── social.js           # лайки, закладки, подписки, комментарии
│   └── vendor/bootstrap/       # Bootstrap 5.3.8
├── server/
│   └── index.js                # json-server + auth + статика + guards
├── scripts/
│   ├── reset-db.js             # сброс рабочей базы
│   └── smoke.js                # проверка API
├── db.json                     # рабочая база (изменяется при работе)
├── db.seed.json                # эталон базы для сброса
├── package.json
└── README.md
```

## Запуск

```bash
npm install
npm run api
# открыть http://localhost:3000/
```

`npm run api` запускает `server/index.js`: json-server раздаёт и API,
и статические файлы на одном порту `3000`. Благодаря этому origin
совпадает, а CORS не требуется.

Если открыть фронтенд через другой сервер (например,
`python3 -m http.server 8000`), API всё равно будет доступен на
`http://localhost:3000` — CORS у json-server включён по умолчанию.

### Полезные команды

```bash
npm run api        # API + статика на http://localhost:3000
npm run reset-db   # восстановить db.json из db.seed.json
npm run smoke      # проверить API (нужен запущенный сервер)
```

## Демо-аккаунты

| E-mail | Пароль | Имя |
|---|---|---|
| `demo@recipehub.ru` | `demo1234` | Демо Пользователь |
| `anna@recipehub.ru` | `anna1234` | Анна Петрова |
| `igor@recipehub.ru` | `igor1234` | Игорь Смирнов |
| `maria@recipehub.ru` | `maria1234` | Мария Кузнецова |

В `db.json` пароли хранятся в виде bcrypt-хэшей, поэтому исходные
значения зафиксированы только в этой таблице.

## API

Базовый URL: `http://localhost:3000`.

| Метод | Путь | Назначение | Доступ |
|---|---|---|---|
| POST | `/register` | Регистрация | публичный |
| POST | `/login` | Вход, возвращает `accessToken` | публичный |
| GET | `/users` | Список кулинаров | публичный |
| GET | `/users/:id` | Профиль пользователя | публичный |
| PATCH | `/users/:id` | Редактирование профиля | владелец |
| GET | `/recipes` | Список рецептов + фильтры | публичный |
| GET | `/recipes/:id` | Один рецепт | публичный |
| POST | `/recipes` | Создание рецепта | владелец |
| GET | `/comments?recipeId=` | Комментарии рецепта | публичный |
| POST | `/comments` | Добавить комментарий | владелец |
| GET | `/likes?userId=` | Лайки пользователя | публичный |
| POST / DELETE | `/likes`, `/likes/:id` | Поставить / снять лайк | владелец |
| GET | `/bookmarks?userId=` | Закладки пользователя | публичный |
| POST / DELETE | `/bookmarks`, `/bookmarks/:id` | Сохранить / убрать | владелец |
| GET | `/subscriptions?userId=` | Подписки пользователя | публичный |
| POST / DELETE | `/subscriptions`, `/subscriptions/:id` | Подписаться / отписаться | владелец |

### Фильтры и сортировка

`json-server` поддерживает query-параметры, которые использует страница
поиска:

```
GET /recipes?q=тыква
GET /recipes?dishType=Супы&difficulty=Средняя
GET /recipes?timeMinutes_lte=30
GET /recipes?ingredients_like=авокадо
GET /recipes?_sort=likes&_order=desc&_limit=6
GET /recipes?id=1&id=2
```

### Авторизация

```bash
# Вход
curl -X POST http://localhost:3000/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@recipehub.ru","password":"demo1234"}'
# → {"accessToken":"..."}

# Запрос с токеном
curl http://localhost:3000/users/1 \
  -H 'Authorization: Bearer <accessToken>'
```

JWT живёт 1 час. При истечении токена клиент очищает его и работает
как гость; защищённые действия требуют повторного входа.

### Права доступа

В `server/index.js` для всех коллекций задан режим **`644`**:

- `6` — владелец ресурса может читать и писать;
- `4` — остальные авторизованные могут читать;
- `4` — гости могут читать.

Владелец определяется по полю `userId` (для `users` — по `id`).
Поэтому `POST /recipes` с чужим `userId` и `PATCH /users/:id` чужого
профиля возвращают `403`. Поле `password` вырезается из всех ответов
middleware в `server/index.js`.

## Как устроен клиент

- **`api.js`** — единственное место с `fetch`. Содержит `ApiError`,
  работу с токеном, `buildQuery`, методы `users`, `recipes`, `comments`,
  `likes`, `bookmarks`, `subscriptions` и `auth`.
- **`store.js`** — кэш пользователей, рецептов, лайков, закладок, подписок
  и комментариев. После `appReady` страницы читают данные синхронно через
  селекторы (`getAllRecipes`, `getCurrentUser`, `getUserName` и т. д.).
- **`main.js`** — `appReady`: восстановление сессии (`GET /users/:id` по
  JWT) и загрузка справочников. Все страничные модули начинают работу
  с `await appReady`.
- **`recipes.js`** — загрузка ленты (`_sort=likes&_limit=6`) и серверная
  фильтрация с debounce 300 мс и `AbortController` (устаревшие запросы
  отменяются).
- **`auth.js`** — вход и регистрация. Чекбокс «Запомнить меня» выбирает
  `localStorage` или `sessionStorage` для токена.
- **`social.js`** — лайки, закладки, подписки и комментарии. После
  отрисовки рецепта `recipe.js` вызывает `initRecipeSocial(recipe)`, что
  устраняет гонку инициализации между модулями.
- **`profile.js`** — публикации, сохранённые, подписки, создание рецепта
  и редактирование профиля.

## Модель данных

| Коллекция | Основные поля |
|---|---|
| `users` | `id`, `email`, `password` (bcrypt), `name`, `bio`, `subscribers` |
| `recipes` | `id`, `userId`, `title`, `dishType`, `difficulty`, `timeMinutes`, `servings`, `description`, `ingredients[]`, `steps[]`, `image`, `likes`, `videoUrl`, `createdAt` |
| `comments` | `id`, `recipeId`, `userId`, `text`, `createdAt` |
| `likes` | `id`, `userId`, `recipeId` |
| `bookmarks` | `id`, `userId`, `recipeId` |
| `subscriptions` | `id`, `userId`, `authorId` |

## Отличия от ЛР1

- Удалены `data.js` и `storage.js`: данные и состояние приложения
  перенесены на сервер.
- Поле `authorId` в рецептах и комментариях заменено на `userId` —
  этого требует механизм проверки владельца в `json-server-auth`.
- Блок «Популярные кулинары» на главной рендерится из API, а не вручную.
- Добавлены состояния загрузки (`aria-busy`), сообщения об ошибках API
  и баннер, если сервер не запущен.
- `localStorage` используется только для JWT.

## Проверка

```bash
npm run api
npm run smoke
```

`npm run smoke` проверяет чтение, вход, скрытие пароля, `401` без токена,
`403` на чужой ресурс, создание/удаление своего рецепта и фильтры.
На текущей базе проходят **9 из 9** проверок.

Дополнительно вручную проверены сценарии: гость → вход → лайк (42 → 43)
→ закладка → перезагрузка (состояние сохранилось) → сохранённые в
профиле → комментарий → повторная регистрация с занятым e-mail → подписка
→ редактирование профиля → создание рецепта → выход → регистрация нового
пользователя.

## Ограничения

- JWT живёт 1 час и не обновляется; при `401` требуется повторный вход.
- `json-server` — учебный мок, а не production-бэкенд.
- Для работы приложения нужен локальный API-сервер: размещение только
  статических файлов (например, на GitHub Pages) не обеспечит работу
  авторизации и данных.
- `db.json` изменяется при работе. Для возврата к исходным данным
  используйте `npm run reset-db`.
- Пароли демо-аккаунтов известны и предназначены только для проверки.

## Дальше — ЛР3

Клиентский слой уже разделён по зонам ответственности
(`api` / `store` / страничные модули), поэтому при переходе на Vue
логично ляжет на `axios`, composables, Vue Router и хранилище состояния.

