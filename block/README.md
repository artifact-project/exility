Exility Block
-------------
Базовый «Блок» для построения UI (основан на web components)

### Пример

```ts
import Block from '@exility/block';

// Used blocks
import Icon from './icon';

// Available attributes
interface IBtnAttrs {
	type?: string;
	icon?: string;
	value: string;
}

class Button extends Block<IBtnAttrs> {
	static blocks = {Icon};

	static template = (attrs) => `
		button.btn[type="${attrs.type}"]
			if (${attrs.icon}) > Icon[name=attrs.icon]
			| ${attrs.value}
	`;

	getDefaults() {
		return {
			type: 'button',
		};
	}

	protected connectedCallback(): void {
	}

	protected disconnectedCallback(): void {
	}

	protected attributeChangedCallback(attrName, oldValue, newValue): void {
	}
}
```


### Development

 - `npm i`
 - `npm test`, [code coverage](./coverage/lcov-report/index.html)

