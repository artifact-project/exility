Exility Form
------------
Working with forms in all its glory.


### Usage

```ts
import {
	formify,
	Form,
	Element,
	Row,
	Label,
	Errors,
	rules,
	mask,
} from '@exility/form`;

export default formify({
	masks: {
		phone: mask.phone(),
	},

	validate: {
		phone: rules.compose(
			rules.required(),
			rules.regexp(/^\+\d+$/, 'phone'),
		),
	},

	'@submit'({detail: values}) {
		return fetch('/api/reg', {method: 'post', body: values});
	},
})(class extends Block<{$form: FormContext}, null> {
	static blocks = {
		Form,
		Element,
		Row,
		Label,
		Errors,
	};

	static template = `
		const form = attrs.$form;

		Form
			Row[flex="1 3"]
				div
					Label[for="login"] | Login
					Errors[for="login"]
				Element[name="login" required minLength="3" maxLength="32"]

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
