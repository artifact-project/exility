export type ValueBox = {
	value: string;
	checked: boolean;
	selectedIndex: number;
}

export type ValidateResult = null | {
	id: string;
	message?: string;
};

export type Validator = (vbox: ValueBox) => boolean;
export type ValidateRule = (vbox: ValueBox) => ValidateResult;

export function createRule<T>(id, configurate): (value?: T) => ValidateRule {
	return function (value: T) {
		const validate = configurate(value);
		return (vbox) => validate(vbox) ? {id} : null;
	};
}

function convert(validate, id) {
	return (vbox) => ({...validate(vbox), id});
}

function some(...rules) {
	return (vbox) => rules.map(validate => {
		const x = validate(vbox);
		return x.state ? false : x;
	});
}

export function regexp(pattern: RegExp) {
	return ({value}) => ({
		id: 'regexp',
		state: pattern.test(value),
	});
}

export function minLength(min: number) {
	return ({value}) => ({
		id: 'minLength',
		state: value.length >= min,
	});
}

export function required() {
	return convert(minLength(1), 'required');
}

export function password() {
	return some(required(), minLength(6));
}

export function email() {
	return convert(regexp(/.@.+\..+/), 'email');
}
