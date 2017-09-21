export type ValueBox = {
	value?: string;
	checked?: boolean;
	selectedIndex?: number;
}

export type Validity = string | null;
export type Validation = (vbox: ValueBox) => Validity;

function compose(id, rules: Validation[]): Validation {
	return (vbox) => {
		for (let i = 0; i < rules.length; i++) {
			const invalid = rules[i](vbox);

			if (invalid) {
				return `${id}.${invalid}`;
			}
		}

		return null;
	};
}

export function regexp(pattern: RegExp): Validation {
	return ({value}) => pattern.test(value) ? null : 'regexp';
}

export function minLength(min: number): Validation {
	return ({value}) => value.length >= min ? null : 'minLength';
}

export function required(): Validation {
	return compose('required', [minLength(1)]);
}

export function email(): Validation {
	return compose('email', [regexp(/^.@[^@]+\..+$/)]);
}

export function password(additionalRules: Validation[] = []): Validation {
	return compose('password', [
		required(),
		minLength(6),
	].concat(additionalRules));
}
