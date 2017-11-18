import Form from '../ui/Form/Form';
import Element from '../ui/Element/Element';

async function frame() {
	return new Promise(resolve => {
		requestFrame(resolve);
	});
}

class Login extends Block<{}, UIFormContext> {
	static blocks = {Form, Element};
	static template = `
		Form
			Element[name="login"]
	`;
}

it('formify', async () => {


});
