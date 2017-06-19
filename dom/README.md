Exility DOM
------------
Рендерер в DOM.


### Пример

```ts
import Block from '@exility/block';
import {mountTo} from '@exility/dom';

class Timer extends Block<{initial: number, duration?: number}> {
	static template = (attrs) => `
		.time | ${new Date(attrs.initial + attrs.duration)}
	`
	protected connectedCallback(): void {
		this._start = Date.now();

		this.pid = this.setTimeout(() => {
			this.update({duration: Date.now() - this._start})
		}, 1000);
	}

	protected disconnectedCallback(): void {
		clearTimeout(this.pid);
	}
}

mountTo(document.body, new Timer({
	initial: Date.now(),
});
```


### Разработка

 - `npm i`
 - `npm test`


### Code coverage

 - [coverage/lcov-report/index.html](./coverage/lcov-report/index.html)
