export * from './src/interfaces';

// Decorators


// Rules
import * as rules from './src/rules/rules';

// UI
import Form from './src/ui/Form/Form';
import Element from './src/ui/Element/Element';
import Error from './src/ui/Error/Error';
import Label from './src/ui/Label/Label';

export const ui = {
	Form,
	Element,
	Error,
	Label,
};

export {
	rules,
};
