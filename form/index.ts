export * from './src/interfaces';

// Decorators
import formify from './src/formify/formify';

// Rules
import * as rules from './src/rules/rules';

// UI
import Form from './src/ui/Form/Form';
import Button from './src/ui/Button/Button';
import Element from './src/ui/Element/Element';
import Error from './src/ui/Error/Error';
import Label from './src/ui/Label/Label';

export const ui = {
	Form,

	Button,
	Element,
	Error,
	Label,
};

export {
	formify,
	rules,

	Form,

	Button,
	Element,
	Error,
	Label,
};
