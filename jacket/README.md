Exility Jacket
--------------
Utility for testing your blocks.


### Пример

```ts
import {mount} from '@exility/jacket';
import Button from 'path/to/Button/Button';

const wrapper = mount(
	new Button({disabled: true}), // instance
	{	// Event listeners
		click(evt) {/* ... */}
	}
);

wrapper.attr('aria-disabled'); // 'true'
```

### Public API

 - mount(instance:`Block`[, events]):`DOMWrapper`


### DOMWrapper API

 - target: `Block`
 - on(eventName: `string`, listener: `(evt: Event) => void`)
 - off(eventName: `string`)
 - html(): `string`
 - text(): `string`
 - simulate(eventName: `string`)
 - attr(name: `string`)
 - attrs(): `object`
 - find(selector: `string`): `DOMWrapper`
 - update(attrs: `object`)


### Development

 - `npm i`
 - `npm test`, [code coverage](./coverage/lcov-report/index.html)

