import {create} from '@exility/jacket';
import Block from '@exility/block';
import Label from './Label';
import Form from '../Form/Form';
import Element from '../Element/Element';
import {FormContext} from '../../Context/Context';
import {requestFrame} from '@perf-tools/balancer';
import {UIFormContext} from '../../interfaces';

Form.classNames = false;
Label.classNames = false;
Element.classNames = false;

describe('ui / Label', () => {
	let context;

	async function frame() {
		return new Promise(resolve => {
			requestFrame(resolve);
		});
	}

	beforeEach(() => {
		context = {
			$form: new FormContext({}, {submit: () => Promise.resolve(true)}),
		};
	});

	test('label / click', async () => {
		class MyForm extends Block<{}, UIFormContext> {
			static blocks = {Form, Element, Label};
			static template = `
				Form
					Label[for="empty"] | Empty
					Element[name="empty"]
			`;
		}

		const box = create(MyForm, {}, context);

		await frame();
		expect(box).toMatchSnapshot();
		expect(box.find('input').classList).toEqual(['is-text']);
		expect(document.activeElement).not.toBe(box.find('input').getRootNode());

		box.find('label').simulate('click');
		await frame();
		expect(document.activeElement).toBe(box.find('input').getRootNode());
		expect(box.find('input').classList).toEqual(['active', 'is-text']);
	});
});
