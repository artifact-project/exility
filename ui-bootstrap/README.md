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


### Настройка Webpack 2+

`npm i --save-dev style-loader css-loader`

```js
const path = require('path');
const webpack = require('webpack');

module.exports = {
	entry: {
		vendor: [/* ... */],
		app: ['./index.ts'],
		bootstrap: [
			'@exility/ui-bootstrap/blocks/Core/Core',
		],
	},
	output: { /* ... */ },
	module: {
		rules: [
			// ...ts
			{
				test: /\.css$/,
				use: [
					{loader: 'style-loader'},
					{loader: 'css-loader'},
				],
			},
		]
	},
	plugins: [
		new webpack.optimize.CommonsChunkPlugin({name: 'vendor'}),
	],
};
```


### Development

 - `npm i`
 - `npm test`, [code coverage](./coverage/lcov-report/index.html)

