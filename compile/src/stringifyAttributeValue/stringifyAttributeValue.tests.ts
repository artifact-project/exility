import {utils} from '@exility/parser';
import stringifyAttributeValue from './stringifyAttributeValue';

const {EXPRESSION_TYPE} = utils;

it('class', () => {
	expect(stringifyAttributeValue('class', ['foo'])).toEqual({
		computed: false,
		value: '"foo"',
	});

	expect(stringifyAttributeValue('class', ['foo', 'bar'])).toEqual({
		computed: false,
		value: '"foo bar"',
	});
});

it('class: foo (prefix + bar)', () => {
	expect(stringifyAttributeValue('class', ['foo', [{type: EXPRESSION_TYPE, raw: 'prefix'}, 'bar']])).toEqual({
		computed: true,
		value: '"foo " + (prefix) + "bar"',
	});
});

it('class: (x) foo bar', () => {
	expect(stringifyAttributeValue('class', [{type: EXPRESSION_TYPE, raw: 'x'}, 'foo', ['bar']])).toEqual({
		computed: true,
		value: '(x) + " foo bar"',
	});
});

it('class: foo (x) (y + bar)', () => {
	expect(stringifyAttributeValue('class', ['foo', {type: EXPRESSION_TYPE, raw: 'x'}, [{type: EXPRESSION_TYPE, raw: 'y'}, 'bar']])).toEqual({
		computed: true,
		value: '"foo " + (x) + " " + (y) + "bar"',
	});
});

it('class: (x + y) bar', () => {
	expect(stringifyAttributeValue('class', [[{type: EXPRESSION_TYPE, raw: 'x'}, {type: EXPRESSION_TYPE, raw: 'y'}], 'bar'])).toEqual({
		computed: true,
		value: '(x) + (y) + " bar"',
	});
});

it('value', () => {
	expect(stringifyAttributeValue('value', ['foo'])).toEqual({
		computed: false,
		value: '"foo"',
	});

	expect(stringifyAttributeValue('value', ['foo', 'bar'])).toEqual({
		computed: false,
		value: '"foobar"',
	});

	expect(stringifyAttributeValue('value', ['foo', {type: EXPRESSION_TYPE, raw: 'x'}, [{type: EXPRESSION_TYPE, raw: 'y'}, 'bar']])).toEqual({
		computed: true,
		value: '"foo" + (x) + (y) + "bar"',
	});
});
