Exility DOM
------------
DOM Renderer.


### Example

```ts
import Block from '@exility/block';
import {mountTo} from '@exility/dom';

class Timer extends Block<{initial: number, duration?: number}> {
	static template = (attrs) => `
		.time | ${new Date(attrs.initial + attrs.duration)}
	`;

	protected connectedCallback(): void {
		this._start = Date.now();

		this.pid = this.setTimeout(() => {
			this.update({
				duration: Date.now() - this._start,
			});
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


### Development

 - `npm i`
 - `npm test`, [code coverage](./coverage/lcov-report/index.html)

