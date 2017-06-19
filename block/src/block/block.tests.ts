import Block from './block';

describe('classify', () => {
	it('string', () => {
		const Icon = Block.classify('i.icon');

		expect(Icon.template).toBe('i.icon');
		expect(new Icon({}) instanceof Block).toBe(true);
	});

	it('object', () => {
		const Icon = Block.classify({template: 'i.icon'});

		expect(Icon.template).toBe('i.icon');
		expect(new Icon({}) instanceof Block).toBe(true);
	});
});

describe('events', () => {
	it('@dispatchEvent', () => {
		const log = [];
		const Icon = class extends Block<{x: number, y?: number}> {
			'@foo'(evt) {
				log.push(`${evt.type}:${JSON.stringify(evt.detail)}`);
			}
		};
		const icon = new Icon({x: 10});

		icon.dispatchEvent('foo', {value: 'bar'});
		expect(log[0]).toBe('foo:{"value":"bar"}');
	});
});
