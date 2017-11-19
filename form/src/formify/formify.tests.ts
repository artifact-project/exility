import Block from '@exility/block';
import {create} from '@exility/jacket';
import {requestFrame} from '@perf-tools/balancer';

// UI
import Form from '../ui/Form/Form';
import Element from '../ui/Element/Element';
import formify from './formify';

async function frame() {
	return new Promise(resolve => {
		requestFrame(resolve);
	});
}

@formify<{login: string}, {}>({
	submit: () => new Promise(resolve => {
		setTimeout(resolve, 20);
	}),
})
class Login extends Block<{}, UIFormContext> {
	static blocks = {Form, Element};
	static template = `
		Form
			Element[name="email" required]
			button[type="submit"] | Send
	`;
}

it('formify', async () => {
	const wrapper = create(Login);

	await frame();
	expect(wrapper).toMatchSnapshot();

	wrapper.find('input').val('ibn@rubaxa.org').simulate('input');
	await frame();
	expect(wrapper).toMatchSnapshot();

	wrapper.find('button').click();
	await frame();
	expect(wrapper.classList).toEqual(['changed', 'submitting']);
	expect(wrapper.find('input').classList).toEqual(['changed', 'is-text', 'submitting']);
	expect(wrapper.find('input').attr('readOnly')).toBe(true);

	await frame();
	expect(wrapper.classList).toEqual(['submitSucceeded']);
	expect(wrapper.find('input').classList).toEqual(['is-text']);
	expect(wrapper.find('input').attr('readOnly')).toBe(false);
});
