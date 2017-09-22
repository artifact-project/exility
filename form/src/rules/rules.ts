export type ValueBox = {
	value?: string;
	checked?: boolean;
	selectedIndex?: number;
}

export type Validity = {
	id: string;
	detail: object;
	nested?: Validity;
};

export type Validation = (vbox: ValueBox) => Validity;

function compose(id: string, detail: object, rules: Validation[]): Validation {
	return (vbox) => {
		for (let i = 0; i < rules.length; i++) {
			const invalid = rules[i](vbox);

			if (invalid) {
				// todo: proto?
				return {
					id,
					detail,
					nested: invalid,
				};
			}
		}

		return null;
	};
}

export function regexp(pattern: RegExp): Validation {
	return ({value}) => pattern.test(value) ? null : {
		id: 'regexp',
		detail: {pattern},
	};
}

export function custom(validate: (vbox: ValueBox) => boolean): Validation {
	return (vbox) => validate(vbox) ? null : {
		id: 'custom',
		detail: {validate},
	};
}

export function minLength(min: number): Validation {
	return ({value}) => value.length >= min ? null : {
		id: 'minLength',
		detail: {min},
	};
}

export function required(): Validation {
	return compose('required', {}, [minLength(1)]);
}

export function email(): Validation {
	return compose('email', {}, [regexp(/^.@[^@]+\..+$/)]);
}

export function password(additionalRules: Validation[] = []): Validation {
	return compose('password', {}, [
		required(),
		minLength(6),
	].concat(additionalRules));
}
