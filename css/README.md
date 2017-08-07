Exility CSS
-----------
Очень простенькая обертка CSS in JS.

```ts
import css from '@exility/css';

const classNames = css({
	'main': {
		color: 'red',
		fontSize: 14,
	},
});

console.log(classNames.main); // main[ _nssjx7 ] (dev)
console.log(classNames.main); // _nssjx7 (production)
```

### API

 - `css(rules): object` — создать
 - `getUsedCSS(): string` — получить только используемый css


### Development

 - `npm i`
 - `npm test`, [code coverage](./coverage/lcov-report/index.html)
