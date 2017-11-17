Exility Form
------------
Working with forms in all its glory.


### Usage

```ts
import {
	ui,
	formify,
	rules,
	mask,
} from '@exility/form`;

@formify({
	masks: {
		phone: mask.phone(),
	},

	rules: {
		phone: rules.compose(
			rules.required(),
			rules.regexp(/^\+\d+$/, 'phone'),
		),
	},

	'@submit'({detail: values}) {
		return fetch('/api/reg', {method: 'post', body: values});
	},
})
export default class extends Block<null, {$form: FormContext}> {
	static blocks = {...ui};

	static template = `
		const form = context.$form;

		Form
			Element[placeholder="Login" name="login" required minLength="3" maxLength="32"]
			Element[name="phone" type="phone" required mask="phone"]
			Element[name="email" type="email" required]
			Element[name="password" type="password" required]

			hr + button[disabled=\${form.submitting}] | Submit
	`;
});
```


### Development

 - `npm i`
 - `npm test`, [code coverage](./coverage/lcov-report/index.html)
