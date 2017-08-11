Exility CSS
-----------


### Features

 - CSS deduplication
 - Smaller Critical CSS
 - Nesting
 - Media Queries (todo)
 - Minimalistic API


```ts
import css, {getUsedCSS} from '@exility/css';

const cx = css({
	'main': {
		color: 'red',
		fontSize: 14,
	},
});

console.log(cx.main); // "main-nssjx7" (dev)
console.log(cx.main); // "_rs" (production)

console.log(getUsedCSS());
// {
// 	names: ['nssjx7'],
// 	cssText: '._nssjx7{color red;font-size: 14px;}',
// }
```


### Usage
Add `style#__css__` into `head` and before including `@exility/css`.

```html
<style id="__css__" data-names="%__USED_CSS_NAMES__%">%__USED_CSS_TEXT__%</style>
<script type="module">
	import css from '/node_modules/@exility/css/index.js';

	const cx = css({
		'link': {
			color: '#3c0',

			'&:hover': {
				color: 'red',
			},
		},
	});
</script>
```


### API

 - `css(rules): {[name:string]: string}`
 - `getUsedCSS(all?: boolean): {names: string[], cssText: string}`


### Killer-feature

```ts
import css, {getUsedCSS} from '@exility/css';

const some = css({
	'main': {
		color: '#333',
		fontSize: 14,
	},
});

const link = css({
	'root': {
		color: '#333',
		fontSize: 14,

		'&:hover': {
			color: 'red',
		},
	},
});

console.log(some.main); // "_rs" (1)
console.log(link.root); // "_rt" (2)

// and CSS result, wow! (3)
console.log(getUsedCSS().cssText);
//  ._rs, _rt {color #333;font-size: 14px;}
//  ._rs:hover {color red;}
```


### Configuration

 - `process.env.NODE_ENV: 'production' | 'dev'`
 - `process.env.RUN_AT: 'server' | 'client'`


### Development

 - `npm i`
 - `npm test`, [code coverage](./coverage/lcov-report/index.html)
