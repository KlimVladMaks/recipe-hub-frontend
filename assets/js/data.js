/**
 * data.js — данные-заглушки RecipeHub.
 *
 * На этапе ЛР1 реального API нет. Все сущности описаны статически.
 * В ЛР2 этот модуль будет заменён (или дополнен) запросами к моковому
 * JSON-серверу, поэтому структура данных приближена к тому, что вернул бы API.
 */

/** Справочник типов блюд (используется в фильтрах и формах). */
export const DISH_TYPES = [
  'Салаты',
  'Супы',
  'Основные блюда',
  'Выпечка',
  'Десерты',
  'Напитки',
];

/** Справочник уровней сложности. */
export const DIFFICULTIES = ['Низкая', 'Средняя', 'Высокая'];

/** Кулинары (авторы рецептов). */
export const users = [
  {
    id: 'demo',
    name: 'Демо Пользователь',
    email: 'demo@recipehub.ru',
    password: 'demo1234',
    bio: 'Демонстрационный аккаунт для проверки интерфейса.',
    subscribers: 0,
  },
  {
    id: 1,
    name: 'Анна Петрова',
    email: 'anna@recipehub.ru',
    password: 'anna1234',
    bio: 'Люблю домашнюю выпечку и десерты без лишнего сахара.',
    subscribers: 128,
  },
  {
    id: 2,
    name: 'Игорь Смирнов',
    email: 'igor@recipehub.ru',
    password: 'igor1234',
    bio: 'Готовлю простые сытные блюда на каждый день.',
    subscribers: 74,
  },
  {
    id: 3,
    name: 'Мария Кузнецова',
    email: 'maria@recipehub.ru',
    password: 'maria1234',
    bio: 'Вегетарианская кухня и сезонные продукты.',
    subscribers: 203,
  },
];

/**
 * Рецепты.
 *
 * Поля:
 *  - image      — путь от корня проекта (подставляется через data-root);
 *  - steps      — массив шагов приготовления;
 *  - likes      — базовое число лайков (к нему добавляются лайки пользователя);
 *  - ingredients — массив строк для фильтра по ингредиентам.
 */
export const recipes = [
  {
    id: 1,
    title: 'Овощной салат с авокадо',
    authorId: 3,
    dishType: 'Салаты',
    difficulty: 'Низкая',
    timeMinutes: 15,
    servings: 2,
    description:
      'Лёгкий салат из свежих овощей с авокадо и оливковым маслом. Отлично подойдёт для лёгкого ужина.',
    ingredients: ['авокадо', 'помидоры', 'огурец', 'оливковое масло', 'зелень'],
    steps: [
      'Помойте и нарежьте помидоры, огурцы и авокадо крупными кубиками.',
      'Смешайте овощи в салатнике, посолите и поперчите по вкусу.',
      'Заправьте оливковым маслом и посыпьте мелко нарезанной зеленью.',
    ],
    image: 'assets/img/recipe-placeholder.svg',
    likes: 42,
    videoUrl: '',
    createdAt: '2026-09-02',
  },
  {
    id: 2,
    title: 'Крем-суп из тыквы',
    authorId: 2,
    dishType: 'Супы',
    difficulty: 'Средняя',
    timeMinutes: 40,
    servings: 4,
    description:
      'Бархатистый тыквенный крем-суп со сливками и имбирём — тёплое осеннее блюдо.',
    ingredients: ['тыква', 'сливки', 'лук', 'имбирь', 'бульон'],
    steps: [
      'Нарежьте тыкву и лук, обжарьте лук до прозрачности.',
      'Добавьте тыкву и имбирь, залейте бульоном и варите 25 минут.',
      'Пробейте суп блендером, влейте сливки и прогрейте, не доводя до кипения.',
    ],
    image: 'assets/img/recipe-placeholder.svg',
    likes: 87,
    videoUrl: 'https://rutube.ru/play/embed/9289f2d7c9c4d8a9738737199e096dd6/',
    createdAt: '2026-09-05',
  },
  {
    id: 3,
    title: 'Паста карбонара',
    authorId: 2,
    dishType: 'Основные блюда',
    difficulty: 'Средняя',
    timeMinutes: 30,
    servings: 2,
    description:
      'Классическая итальянская паста с беконом, яйцами и тёртым сыром.',
    ingredients: ['спагетти', 'бекон', 'яйца', 'пармезан', 'перец'],
    steps: [
      'Отварите спагетти до состояния аль денте.',
      'Обжарьте бекон до золотистой корочки.',
      'Смешайте яйца с тёртым сыром и быстро соедините с горячей пастой и беконом.',
    ],
    image: 'assets/img/recipe-placeholder.svg',
    likes: 156,
    videoUrl: '',
    createdAt: '2026-09-07',
  },
  {
    id: 4,
    title: 'Шоколадный брауни',
    authorId: 1,
    dishType: 'Десерты',
    difficulty: 'Средняя',
    timeMinutes: 45,
    servings: 6,
    description:
      'Влажный шоколадный брауни с хрустящей корочкой сверху и мягкой серединой.',
    ingredients: ['шоколад', 'масло', 'сахар', 'яйца', 'мука', 'какао'],
    steps: [
      'Растопите шоколад вместе с маслом на водяной бане.',
      'Взбейте яйца с сахаром, влейте шоколадную смесь.',
      'Добавьте муку и какао, перемешайте и выпекайте 25 минут при 180 °C.',
    ],
    image: 'assets/img/recipe-placeholder.svg',
    likes: 219,
    videoUrl: 'https://rutube.ru/play/embed/e8bd8c583519ddd6a75595f5532edc3c/',
    createdAt: '2026-09-09',
  },
  {
    id: 5,
    title: 'Домашний лимонад с мятой',
    authorId: 3,
    dishType: 'Напитки',
    difficulty: 'Низкая',
    timeMinutes: 10,
    servings: 4,
    description:
      'Освежающий лимонад из лимонов и мяты — идеальный напиток в жаркий день.',
    ingredients: ['лимон', 'мята', 'сахар', 'вода', 'лёд'],
    steps: [
      'Вскипятите воду с сахаром и остудите сироп.',
      'Выжмите сок лимонов, добавьте мяту и сироп.',
      'Долейте холодной воды, добавьте лёд и подавайте.',
    ],
    image: 'assets/img/recipe-placeholder.svg',
    likes: 61,
    videoUrl: '',
    createdAt: '2026-09-11',
  },
  {
    id: 6,
    title: 'Дрожжевой хлеб на закваске',
    authorId: 1,
    dishType: 'Выпечка',
    difficulty: 'Высокая',
    timeMinutes: 180,
    servings: 8,
    description:
      'Ароматный хлеб с хрустящей коркой, приготовленный на пшеничной закваске.',
    ingredients: ['мука', 'вода', 'закваска', 'соль'],
    steps: [
      'Смешайте муку, воду и закваску, оставьте тесто на 40 минут.',
      'Добавьте соль, вымесите и оставьте на 3 часа, складывая каждые 40 минут.',
      'Сформируйте буханку и выпекайте 40 минут при 230 °C под крышкой, затем 15 минут без неё.',
    ],
    image: 'assets/img/recipe-placeholder.svg',
    likes: 133,
    videoUrl: 'https://rutube.ru/play/embed/fccbb9a1d88c7fe1c7da0906cf6b75a2/',
    createdAt: '2026-09-13',
  },
  {
    id: 7,
    title: 'Овсяная каша с ягодами',
    authorId: 2,
    dishType: 'Основные блюда',
    difficulty: 'Низкая',
    timeMinutes: 15,
    servings: 2,
    description:
      'Полезный завтрак: овсянка на молоке с сезонными ягодами и мёдом.',
    ingredients: ['овсянка', 'молоко', 'ягоды', 'мёд'],
    steps: [
      'Залейте овсянку молоком и доведите до кипения.',
      'Варите 5 минут, помешивая.',
      'Подавайте с ягодами и мёдом.',
    ],
    image: 'assets/img/recipe-placeholder.svg',
    likes: 48,
    videoUrl: '',
    createdAt: '2026-09-14',
  },
  {
    id: 8,
    title: 'Греческий салат',
    authorId: 3,
    dishType: 'Салаты',
    difficulty: 'Низкая',
    timeMinutes: 20,
    servings: 3,
    description:
      'Свежий салат с фетой, маслинами и хрустящими огурцами по греческому рецепту.',
    ingredients: ['фета', 'маслины', 'помидоры', 'огурец', 'красный лук'],
    steps: [
      'Крупно нарежьте овощи, лук — тонкими полукольцами.',
      'Добавьте маслины и раскрошенную фету.',
      'Заправьте оливковым маслом и посыпьте орегано.',
    ],
    image: 'assets/img/recipe-placeholder.svg',
    likes: 95,
    videoUrl: 'https://rutube.ru/play/embed/6b3f6dcfd23a3d33c80f0e0b6efc8f2d/',
    createdAt: '2026-09-15',
  },
];

/** Комментарии к рецептам. */
export const comments = [
  {
    id: 1,
    recipeId: 1,
    authorId: 1,
    text: 'Добавила немного бальзамика — получилось очень свежо!',
    createdAt: '2026-09-10',
  },
  {
    id: 2,
    recipeId: 2,
    authorId: 3,
    text: 'Отличный суп, взяла вместо сливок кокосовое молоко.',
    createdAt: '2026-09-12',
  },
  {
    id: 3,
    recipeId: 3,
    authorId: 1,
    text: 'Классика, всё получилось с первого раза. Спасибо!',
    createdAt: '2026-09-13',
  },
];

/** Найти пользователя по id. */
export function getUserById(id) {
  return users.find((user) => user.id === id) || null;
}

/**
 * Найти рецепт по id среди статических рецептов.
 *
 * Локально созданные (в личном кабинете) рецепты добавляются вызывающим
 * модулем через getAllRecipes() из recipes.js — здесь о них знать не нужно.
 */
export function getRecipeById(id) {
  return recipes.find((recipe) => recipe.id === Number(id)) || null;
}

/** Комментарии конкретного рецепта. */
export function getCommentsByRecipe(recipeId) {
  return comments.filter((comment) => comment.recipeId === Number(recipeId));
}
