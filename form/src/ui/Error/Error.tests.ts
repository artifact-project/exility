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
					array: ({value}) => value.includes('foo') || value.length > 2 ? null : {
						id: 'checkers',
						detail: null,
					},
				},
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
		expect(box).toMatchSnapshot();

		box.find('input').val('xyz').simulate('input');
		await frame();
		expect(box).toMatchSnapshot();
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

		await frame();
		expect(box).toMatchSnapshot();

		box.find('input:first-child').attr('checked', false).simulate('change');
		await frame();
		expect(box).toMatchSnapshot();
	});
});
