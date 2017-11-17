import {create} from '@exility/jacket';
import UIElement from './Element';
import {FormContext} from '../../Context/Context';
import {requestFrame} from '@perf-tools/balancer';
import {UIElementAttrs, UIElementContext} from '../../interfaces';

describe('ui / Element', () => {
	let context;

	async function frame() {
		return new Promise(resolve => {
			requestFrame(resolve);
		});
	}

	async function simulateEvent(wrapper, event = 'input') {
		context.$form.handleEvent(wrapper.target, {
			type: event,
			target: wrapper.target.getRootNode(),
		});
		await frame();
	}

	beforeEach(() => {
		context = {
			$form: new FormContext({
				inline: 'Wow!',
				array: ['foo'],
				switcher: 'bar',
				color: 'blue',
			}, {
				rules: {
					// Only English alphabet
					username: ({value}) => /^[a-z]*$/i.test(value) ? null : {
						id: 'onlyEng',
						detail: null,
					},
				},
				submit: () => Promise.resolve(true),
			}),
		};
	});

	describe('text', () => {
		it('empty', async () => {
			const text = create<UIElementAttrs, UIElementContext>(
				UIElement,
				{name: 'empty'},
				context,
			);

			expect(text).toMatchSnapshot();
			expect((text.target as any).input instanceof HTMLInputElement).toBe(true);
			expect(context.$form.values).toEqual({empty: ''});

			text.attr('value', 'ok');
			await simulateEvent(text);

			expect(context.$form.values).toEqual({empty: 'ok'});
		});

		it('with initial value', async () => {
			const text = create(
				UIElement,
				{name: 'empty', value: 'Foo'},
				context,
			);
			expect(text).toMatchSnapshot();
			expect(context.$form.values).toEqual({empty: 'Foo'});
		});

		it('with value', async () => {
			expect(create<UIElementAttrs, UIElementContext>(
				UIElement,
				{name: 'inline'},
				context,
			)).toMatchSnapshot();
		});
	});

	describe('checkbox', () => {
		it('empty', async () => {
			const cbx = create(
				UIElement,
				{name: 'empty', type: 'checkbox'},
				context,
			);

			expect(cbx).toMatchSnapshot();
			expect(cbx.attr('checked')).toBe(false);
		});

		it('with inline checked', async () => {
			const cbx = create(
				UIElement,
				{name: 'empty', type: 'checkbox', checked: true},
				context,
			);

			expect(cbx.attr('checked')).toBe(true);
		});

		it('with checked: foo', async () => {
			const cbx = create(
				UIElement,
				{name: 'array', type: 'checkbox', value: 'foo'},
				context,
			);

			expect(cbx).toMatchSnapshot();
			expect(cbx.attr('checked')).toBe(true);
		});

		it('with checked: bar', async () => {
			const foo = create(
				UIElement,
				{name: 'array', type: 'checkbox', value: 'foo'},
				context,
			);

			const bar = create(
				UIElement,
				{name: 'array', type: 'checkbox', value: 'bar'},
				context,
			);

			expect(bar).toMatchSnapshot();
			expect(context.$form.values).toEqual({array: ['foo']});
			expect(foo.attr('checked')).toBe(true);
			expect(bar.attr('checked')).toBe(false);

			bar.attr('checked', true);
			await simulateEvent(bar);
			expect(context.$form.values).toEqual({array: ['foo', 'bar']});

			foo.attr('checked', false);
			await simulateEvent(foo);
			expect(context.$form.values).toEqual({array: ['bar']});

			bar.attr('checked', false);
			await simulateEvent(bar);
			expect(context.$form.values).toEqual({array: []});
		});
	});

	describe('radio', () => {
		it('empty', async () => {
			const radio = create(
				UIElement,
				{name: 'empty', type: 'radio'},
				context,
			);

			expect(radio).toMatchSnapshot();
			expect(radio.attr('checked')).toBe(false);
		});

		it('with checked', async () => {
			const foo = create(
				UIElement,
				{name: 'switcher', type: 'radio', value: 'foo'},
				context,
			);

			const bar = create(
				UIElement,
				{name: 'switcher', type: 'radio', value: 'bar'},
				context,
			);

			const baz = create(
				UIElement,
				{name: 'switcher', type: 'radio', value: 'baz'},
				context,
			);

			expect(foo.attr('checked')).toBe(false);
			expect(bar.attr('checked')).toBe(true);
			expect(baz.attr('checked')).toBe(false);
			expect(context.$form.values).toEqual({switcher: 'bar'});

			baz.attr('checked', true);
			await simulateEvent(baz);

			expect(foo.attr('checked')).toBe(false);
			expect(bar.attr('checked')).toBe(false);
			expect(baz.attr('checked')).toBe(true);
			expect(context.$form.values).toEqual({switcher: 'baz'});
		});
	});

	describe('textarea', () => {
		it('with initial value', async () => {
			expect(create(
				UIElement,
				{name: 'empty', value: 'Foo', type: 'textarea'},
				context,
			)).toMatchSnapshot();
		});
	});

	describe('select', () => {
		it('with value', async () => {
			const select = create(
				UIElement,
				{
					name: 'color',
					type: 'select',
					options: [
						{value: 'red', text: 'Red'},
						{value: 'green', text: 'Green'},
						{value: 'blue', text: 'Blue'},
					],
				},
				context,
			);

			expect(select).toMatchSnapshot();
			expect(select.attr('selectedIndex')).toBe(2);
		});
	});

	it('focus/blur', async () => {
		const text = create<UIElementAttrs, UIElementContext>(
			UIElement,
			{name: 'empty'},
			context,
		);

		await simulateEvent(text, 'focus');
		expect(text.classList).toEqual(['active', 'is-text']);

		await simulateEvent(text, 'blur');
		expect(text.classList).toEqual(['is-text', 'touched']);
	});

	it('changed', async () => {
		const text = create<UIElementAttrs, UIElementContext>(
			UIElement,
			{name: 'empty'},
			context,
		);

		await simulateEvent(text, 'focus');
		text.attr('value', 'wow');
		await simulateEvent(text);

		expect(text.classList).toEqual(['active', 'changed', 'is-text']);

		await simulateEvent(text, 'blur');
		expect(text.classList).toEqual(['changed', 'is-text', 'touched']);

		text.attr('value', '');
		await simulateEvent(text);
		expect(text.classList).toEqual(['is-text', 'touched']);
	});

	it('invalid / required', async () => {
		const text = create(
			UIElement,
			{name: 'username', required: true},
			context,
		);
		const textFormElem = (text.target as UIElement).getFormElement();

		await frame();
		expect(!!textFormElem.errors).toBe(true);
		expect(text.classList).toEqual(['invalid', 'is-text']);

		text.attr('value', 'X');
		await simulateEvent(text);
		expect(text.classList).toEqual(['changed', 'is-text']);
		expect(textFormElem.errors).toEqual({});
	});

	it('invalid / minLength', async () => {
		const text = create(
			UIElement,
			{name: 'username', minLength: 3},
			context,
		);
		const textFormElem = (text.target as UIElement).getFormElement();

		text.attr('value', 'X');
		await simulateEvent(text);

		expect(!!textFormElem.errors.minLength).toBe(true);
		expect(text.classList).toEqual(['changed', 'invalid', 'is-text']);

		text.attr('value', 'Xy!');
		await simulateEvent(text);
		expect(!!textFormElem.errors.minLength).toBe(false);
		expect(!!textFormElem.errors.onlyEng).toBe(true);
		expect(text.classList).toEqual(['changed', 'invalid', 'is-text']);

		text.attr('value', 'Xyz');
		await simulateEvent(text);
		expect(text.classList).toEqual(['changed', 'is-text']);
		expect(textFormElem.errors).toEqual({});
	});

	it('readOnly/LockedForm', async () => {
		const text = create<UIElementAttrs, UIElementContext>(
			UIElement,
			{name: 'empty'},
			context,
		);

		context.$form.lock();
		expect(text.attr('readOnly')).toBe(true);
		expect(text.classList).toEqual(['is-text', 'readOnly']);

		context.$form.unlock();
		expect(text.attr('readOnly')).toBe(false);
		expect(text.classList).toEqual(['is-text']);
	});
});
