Exility Form
------------
Working with forms in all its glory.


### Usage

```ts
import {formify, Form, FormContext, Element, rules, mask} from '@exility/form`;

@formify({
	masks: {
		phone: mask.phone(),
	},

	validate: {
		login: rules.minLength(3),
		phone: rules.compose(
			rules.required(),
			rules.regexp(/^\+\d+$/, 'phone'),
		),
		email: rules.email(),
		password: rules.password(),
	},

	'@submit'({detail: data}) {
		return fetch('/api/reg', {method: 'post', body: data});
	}
})
export default class extends Block<{$form: FormContext}, null> {
	static blocks = {
		Form,
		Element,
	};

	static template = `
		const form = attrs.$form;

		Form
			Element[name="login" required minLength="3" maxLength="32"]
			Element[name="phone" type="phone" required mask="phone"]
			Element[name="email" type="email" required]
			Element[name="password" type="password" required]

			hr + button[disabled=\${form.submitting}] | Submit

		form.elem('login').invalid
	`;
}
```


### Development

 - `npm i`
 - `npm test`, [code coverage](./coverage/lcov-report/index.html)
