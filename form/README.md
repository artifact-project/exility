Exility Form
------------
Working with forms in all its glory.


### Usage

```ts
import {
	formify,
	mask,
	rules,
	Form,
	Element,
} from '@exility/form';

export default formify({
	masks: {
		phone: mask.phone(),
	},

	rules: {
		phone: rules.compose(
			rules.required(),
			rules.regexp(/^\+\d+$/, 'phone'),
		),
	},

	submit(values) {
		return fetch('/api/reg', {method: 'post', body: values});
	},
})(class extends Block<{}> {
	static blocks = {Form, Element};

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

---

#### Theming

```ts
import {theme} from '@exility/css';
import {Form, Element} from '@exility/form';

const myTheme = theme.create(
	css.for(Form, {
		':host': {
			borderRadius: 3,
			boxShadow: '0 1px 3px rgba(0,0,0,.3)',
			padding: 10,
		},
	}),

	css.for(Element, {
		':host': { /*...*/ },
		'is-text': {
			border: '1px solid #ccc',
		}
		// ...
	}),
);

formify({
	theme: myTheme,
	...
})(class ...);
```

---


### Development

 - `npm i`
 - `npm test`, [code coverage](./coverage/lcov-report/index.html)
