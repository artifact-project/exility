Exility Bootstrap
-----------------
Старый добрый [bootstrap](http://getbootstrap.com/).


### Пример

```ts
import Block from '@exility/block';

// Используеиые блоки
import Button from '@exility/ui-bootstrap/blocks/Button/Button';
import Badge from '@exility/ui-bootstrap/blocks/Badge/Badge';
// и так далее

class App extends Block<null> {
	static blocks = {Button, Badge};
	static template = (attrs) => `
		Button[value="Wow!"]
		Badge[type="info"] | new
	`;
}
```


### Разработка

 - `npm i`
 - `npm test`


### Code coverage

 - [coverage/lcov-report/index.html](./coverage/lcov-report/index.html)
