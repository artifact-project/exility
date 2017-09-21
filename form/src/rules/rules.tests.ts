import {required, minLength, email, password, ValueBox} from './rules';

it('minLength', () => {
	expect(minLength(2)({value: 'a'})).toBe('minLength');
	expect(minLength(2)({value: 'ab'})).toBe(null);
});

it('required', () => {
	expect(required()({value: ''})).toBe('required.minLength');
	expect(required()({value: 'a'})).toBe(null);
});

it('email', () => {
	expect(email()({value: ''})).toBe('email.regexp');
	expect(email()({value: 'a'})).toBe('email.regexp');
	expect(email()({value: 'a@a.r'})).toBe(null);
	expect(email()({value: '@a.r'})).toBe('email.regexp');
	expect(email()({value: 'a@@a.r'})).toBe('email.regexp');
});

it('password', () => {
	expect(password()({value: ''})).toBe('password.required.minLength');
	expect(password()({value: '123'})).toBe('password.minLength');
	expect(password()({value: '123456'})).toBe(null);
});

it('password: additionalRules', () => {
	const additionalRules = ({value}: ValueBox) => /^\d+$/.test(value) ? 'onlyNumbers' : null;

	expect(password(additionalRules)({value: '123456'})).toBe('password.onlyNumbers');
	expect(password(additionalRules)({value: 'a1234'})).toBe('password.minLength');
	expect(password(additionalRules)({value: 'a1234dddd'})).toBe(null);
});
