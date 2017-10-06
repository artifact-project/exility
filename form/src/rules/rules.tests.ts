import {required, minLength, email, password, custom} from './rules';
import {ValueBox} from '../interfaces';

it('minLength', () => {
	expect(minLength(2)({value: 'a'})).toEqual({
		id: 'minLength',
		detail: {min: 2},
	});
	expect(minLength(2)({value: 'ab'})).toEqual(null);
});

it('required', () => {
	expect(required()({value: ''})).toEqual({
		id: 'required',
		detail: {},
		nested: {
			id: 'minLength',
			detail: {min: 1},
		},
	});
	expect(required()({value: 'a'})).toEqual(null);
});

it('email', () => {
	expect(email()({value: ''}).id).toEqual('email');
	expect(email()({value: 'a'}).id).toEqual('email');
	expect(email()({value: 'a@a.r'})).toEqual(null);
	expect(email()({value: '@a.r'}).id).toEqual('email');
	expect(email()({value: 'a@@a.r'}).id).toEqual('email');
});

it('password', () => {
	expect(password()({value: ''})).toEqual({
		id: 'password',
		detail: {},
		nested: {
			id: 'required',
			detail: {},
			nested: {
				id: 'minLength',
				detail: {min: 1},
			},
		},
	});

	expect(password()({value: '123'})).toEqual({
		id: 'password',
		detail: {},
		nested: {
			id: 'minLength',
			detail: {min: 6},
		},
	});

	expect(password()({value: '123456'})).toEqual(null);
});

it('password: additionalRules', () => {
	const additionalRules = [
		({value}: ValueBox) => /^\d+$/.test(value) ? {id: 'onlyNumbers', detail: {}} : null
	];

	expect(password(additionalRules)({value: '123456'})).toEqual({
		id: 'password',
		detail: {},
		nested: {
			id: 'onlyNumbers',
			detail: {},
		},
	});

	expect(password(additionalRules)({value: 'a1234'})).toEqual({
		id: 'password',
		detail: {},
		nested: {
			id: 'minLength',
			detail: {min: 6},
		},
	});

	expect(password(additionalRules)({value: 'a1234dddd'})).toEqual(null);
});

it('custom', () => {
	const validate = ({value}) => value === '123';
	const upperCase = custom(validate);

	expect(upperCase({value: ''})).toEqual({
		id: 'custom',
		detail: {validate},
	});

	expect(upperCase({value: '123'})).toEqual(null);
});
