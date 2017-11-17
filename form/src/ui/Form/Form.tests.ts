import {create} from '@exility/jacket';
import Block from '@exility/block';
import Form from './Form';
import Element from '../Element/Element';
import {FormContext} from '../../Context/Context';
import {requestFrame} from '@perf-tools/balancer';
import {UIFormContext} from '../../interfaces';

describe('ui / Form', () => {
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

	function createForm(children) {
		class MyForm extends Block<{}, UIFormContext> {
			static blocks = {Form, Element};
			static template = `Form > ${children}`;
		}

		return create(
			MyForm,
			{},
			context,
		);
	}

	test('changed / empty', async () => {
		const hi = createForm(`Element[name="empty"]`);

		await frame();
		expect(hi).toMatchSnapshot();
		expect(hi.classList).toEqual([]);

		hi.find('input').val('123098').simulate('input');

		await frame();
		expect(hi).toMatchSnapshot();
		expect(hi.classList).toEqual(['changed']);
	});

	test('changed / inline', async () => {
		const hi = createForm(`Element[name="inline" minLength="6"]`);

		await frame();
		expect(hi).toMatchSnapshot();
		expect(hi.classList).toEqual(['invalid']);

		hi.find('input').val('Exility/Value').simulate('input');

		await frame();
		expect(hi).toMatchSnapshot();
		expect(hi.classList).toEqual(['changed']);
	});
});
