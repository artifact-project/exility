Exility: String
---------------
Рендерер в строку.


```js
import {renderToString} from '@exility/string';

const results = renderToString('h1.title-${size} | Hi, ${name}!', {
	name: 'Bro',
	size: 'xxl',
});
// "<h1 class="title-xxl">Hi, Bro!</h1>"
```


### Продвинутый режим
```js
import {stringCompilerFactory} from '@exility/string';

const compiler = stringCompilerFactory({
	scope: ['name', 'size'], // Переменные шаблона
	pure: true, // Чистая функция без зависимостей
});

const templateFactory = compiler('h1.title-${size} | Hi, ${name}!');
const template = templateFactory();

template({
	name: 'Bro',
	size: 'xxl',
});
// "<h1 class="title-xxl">Hi, Bro!</h1>"

template.toString(); // Код функции для сохранения
```

### Development

 - `npm i`
 - `npm test`, [code coverage](./coverage/lcov-report/index.html)

