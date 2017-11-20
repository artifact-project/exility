import Block from '@exility/block';
import {create} from '@exility/jacket';
import {requestFrame} from '@perf-tools/balancer';

// UI
import Form from '../ui/Form/Form';
import Element from '../ui/Element/Element';
import formify from './formify';
import {UIFormContext} from '../interfaces';

async function frame() {
	return new Promise(resolve => {
		requestFrame(resolve);
	});
}

type Attrs = {log: string[]};

const Login = formify<{login: string}, Attrs>({
	submit: () => new Promise(resolve => {
		setTimeout(resolve, 30);
	}),
})(class extends Block<Attrs> {
	static blocks = {Form, Element};
	static template = `
		Form[@submit="sended"]
			Element[name="email" required]
			button[type="submit"] | Send
	`;

	'@sended'({detail}) {
		this.attrs.log.push(detail);
	}
});

it('formify', async () => {
	const log = [];
	const wrapper = create(Login, {log});

	await frame();
	expect(wrapper).toMatchSnapshot();

	wrapper.find('input').val('ibn@rubaxa.org').simulate('input');
	await frame();
	expect(wrapper).toMatchSnapshot();

	wrapper.find('button').click();
	await frame();
	expect(log).toEqual([{values: {email: 'ibn@rubaxa.org'}}]);
	expect(wrapper.classList).toEqual(['changed', 'submitting']);
	expect(wrapper.find('input').classList).toEqual(['changed', 'is-text', 'submitting']);
	expect(wrapper.find('input').attr('readOnly')).toBe(true);

	await frame();
	expect(wrapper.classList).toEqual(['submitSucceeded']);
	expect(wrapper.find('input').classList).toEqual(['is-text']);
	expect(wrapper.find('input').attr('readOnly')).toBe(false);
});
