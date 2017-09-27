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

export type ValidateRule = (vbox: ValueBox) => Validity;

function compose(id: string, detail: object, rules: ValidateRule[]): ValidateRule {
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

export function regexp(pattern: RegExp, id?: string): ValidateRule {
	return ({value}) => pattern.test(value) ? null : {
		id: id || 'regexp',
		detail: {pattern},
	};
}

export function custom(validate: (vbox: ValueBox) => boolean, id?: string): ValidateRule {
	return (vbox) => validate(vbox) ? null : {
		id: id || 'custom',
		detail: {validate},
	};
}

export function minLength(min: number): ValidateRule {
	return ({value}) => value.length >= min ? null : {
		id: 'minLength',
		detail: {min},
	};
}

export function required(): ValidateRule {
	return compose('required', {}, [minLength(1)]);
}

export function email(): ValidateRule {
	return compose('email', {}, [regexp(/^.@[^@]+\..+$/)]);
}

export function password(additionalRules: ValidateRule[] = []): ValidateRule {
	return compose('password', {}, [
		required(),
		minLength(6),
	].concat(additionalRules));
}
