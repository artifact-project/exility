Exility Form
------------
Working with forms in all its glory.


### Usage

```ts
import {Form, Element, validate, types, rules} from '@exility/form`;

@validate({
	name: types.text(
		rules.regexp(/^[a-z]/i, 'firstLetter', 'Первая символ может содержать только буквы'),
		rules.minLength(3),
		rules.maxLength(32),
	),
	email: types.email(rules.required()),
	password: types.password(rules.required()),
})
export default class extends Block<{}> {
	static blocks = {
		Form,
		Element,
	};

	static template = `
		Form
			Element[name="name"]
			Element[name="email"]
			Element[name="password"]

		if (attrs.$form.name.touched && attrs.$form.name.invalid)
			| ${attrs.$form.name.hasError('firstLetter')}
	`;
}
```


### Development

 - `npm i`
 - `npm test`, [code coverage](./coverage/lcov-report/index.html)
