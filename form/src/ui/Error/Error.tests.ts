import {defaultLocale} from '@artifact-project/i18n';
import {create} from '@exility/jacket';
import Block from '@exility/block';
import Error from '../Error/Error';
import Form from '../Form/Form';
import Element from '../Element/Element';
import {FormContext} from '../../Context/Context';
import {requestFrame} from '@perf-tools/balancer';
import {UIFormContext} from '../../interfaces';

defaultLocale.set({
	required: 'No empty',
	minLength: ({detail: {min}}) => `Min ${min}`,
	checkers: ({detail: {foo, min}}) => foo ? `Min ${min}` : 'Foo require',
});

describe('ui / Error', () => {
	let context;

	async function frame() {
		return new Promise(resolve => {
			requestFrame(resolve);
		});
	}

	beforeEach(() => {
		context = {
			$form: new FormContext({
				inline: 'Wow!',
				array: ['foo'],
				switcher: 'bar',
				color: 'blue',
			}, {
				validation: {
					array: ({values}) => {
						return !values.array || values.array.includes('foo') && values.array.length >= 2 ? null : {
							id: 'checkers',
							detail: {
								min: 2,
								foo: values.array.includes('foo'),
							},
						};
					},
				},
				submit: () => Promise.resolve(true),
			}),
		};
	});

	test('err / text', async () => {
		class MyForm extends Block<{}, UIFormContext> {
			static blocks = {Form, Element, Error};
			static template = `
				Form
					Element[name="empty" required minLength="3"]
					Error[for="empty"]
			`;
		}

		const box = create(MyForm, {}, context);

		await frame();
		expect(box).toMatchSnapshot();

		box.find('input').val('x').simulate('input');
		await frame();
		expect(box.classList).toEqual(['changed', 'invalid']);
		expect(box.find('input').classList).toEqual(['changed', 'invalid', 'is-text']);

		box.find('input').val('xyz').simulate('input');
		await frame();
		expect(box.classList).toEqual(['changed']);
		expect(box.find('input').classList).toEqual(['changed', 'is-text']);
	});

	test('err / checked', async () => {
		class MyForm extends Block<{}, UIFormContext> {
			static blocks = {Form, Element, Error};
			static template = `
				Form
					Element[name="array" value="foo" type="checkbox"]
					Element[name="array" value="bar" type="checkbox"]
					Element[name="array" value="qux" type="checkbox"]
					Error[for="array"]
			`;
		}

		const box = create(MyForm, {}, context);

		// foo checked
		await frame();
		expect(box).toMatchSnapshot();
		expect(box.classList).toEqual(['invalid']);

		// no one checked
		box.find('[value="foo"]').attr('checked', false).simulate('change');
		await frame();
		expect(box).toMatchSnapshot();
		expect(box.classList).toEqual(['changed', 'invalid']);

		// foo + qux
		box.find('[value="foo"]').attr('checked', true).simulate('change');
		box.find('[value="qux"]').attr('checked', true).simulate('change');
		await frame();
		expect(box).toMatchSnapshot();
		expect(box.classList).toEqual(['changed']);
	});
});
