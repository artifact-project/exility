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
		button.btn[type="${attrs.type}" @click.prevent]
			if (${attrs.icon}) > Icon[name=attrs.icon]
			| ${attrs.value}
	`;

	getDefaults() {
		return {
			type: 'button',
		};
	}
	
	'@click'(evt: XEvent) {
		// ...
	}

	protected connectedCallback(): void {
	}

	protected disconnectedCallback(): void {
	}

	protected attributeChangedCallback(attrName, oldValue, newValue): void {
	}
}
```


### XEvent

 - `type: string` - тип события
 - `detail: <D>` - детали
 - `originalEvent: E` - оригинальное событие

 - `target: <T>` - ссылка на Block
 - `currentTarget: <T>` - ссылка на Block

 - `domType: string` - тип dom-события
 - `domTarget: HTMLElement` - ссылка на DOM-элемент

 - `defaultPrevented: boolean`
 - `propagationStopped: boolean`
 - `propagationImmediateStopped: boolean`



### Development

 - `npm i`
 - `npm test`, [code coverage](./coverage/lcov-report/index.html)

