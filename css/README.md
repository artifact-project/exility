Exility CSS
-----------
PoC: CSS in JS.


### Features

 - Smaller Critical CSS
 - CSS Rules deduplication
 - Minimalist API


```ts
import css, {getUsedCSS} from '@exility/css';

const cx = css({
	'main': {
		color: 'red',
		fontSize: 14,
	},
});

console.log(cx.main); // "main[ _nssjx7 ]" (dev)
console.log(cx.main); // "_nssjx7" (production)

console.log(getUsedCSS());
// {
// 	names: ['main'],
// 	cssText: '._nssjx7 {color red;font-size: 14px}',
// }
```


### Setup
Add `style#__css__` into `head` and before including `@exility/css`.

```html
<style id="__css__"></style>
```


### API

 - `css(rules): {[name:string]: string}`
 - `getUsedCSS(): {names: string[], cssText: string}`


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
	},

	'root:hover': {
		color: 'red',
	},
});

console.log(some.main); // "_nssjx7" (1)
console.log(link.root); // "_nssjx7 _nssjx7-_ac7b3" (2)

// and CSS result, wow! (3)
console.log(getUsedCSS());
{
	names: ['_nssjx7', '_ac7b3'],
	cssText: `
		._nssjx7 {color #333;font-size: 14px}
		._ac7b3, ._nssjx7-_ac7b3:hover {color red;}
	`,
}
```


### Configuration

 - `process.env.NODE_ENV: 'production' | 'dev'`
 - `process.env.RUN_AT: 'server' | 'client'`


### Development

 - `npm i`
 - `npm test`, [code coverage](./coverage/lcov-report/index.html)
