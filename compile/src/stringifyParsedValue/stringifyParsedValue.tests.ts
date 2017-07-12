import {XNode, utils} from '@exility/parser';
import stringifyAttribute from './stringifyParsedValue';

const {EXPRESSION_TYPE, INHERIT_TYPE, GROUP_TYPE} = utils;

it('null', () => {
	expect(stringifyAttribute(null)).toEqual({
		value: null,
		computed: false,
	});
});

it('void 0', () => {
	expect(stringifyAttribute(void 0)).toEqual({
		value: null,
		computed: false,
	});
});

it('"foo"', () => {
	expect(stringifyAttribute('foo')).toEqual({
		value: '"foo"',
		computed: false,
	});
});

it('["foo"]', () => {
	expect(stringifyAttribute(['foo'])).toEqual({
		value: '"foo"',
		computed: false,
	});
});

it('["foo", "bar"]', () => {
	expect(stringifyAttribute(['foo', 'bar'])).toEqual({
		value: '"foobar"',
		computed: false,
	});
});

it('["foo", "bar", "baz"]', () => {
	expect(stringifyAttribute(['foo', 'bar', 'baz'])).toEqual({
		value: '"foobarbaz"',
		computed: false,
	});
});

it('[true]', () => {
	expect(stringifyAttribute([true])).toEqual({
		value: 'true',
		computed: false,
	});

	expect(stringifyAttribute([[true]])).toEqual({
		value: 'true',
		computed: false,
	});
});

it('[${x}]', () => {
	expect(stringifyAttribute([{type: EXPRESSION_TYPE, raw: 'x'}])).toEqual({
		value: '(x)',
		computed: true,
	});
});

it('[${x}] + TO_STRING', () => {
	expect(stringifyAttribute([{type: EXPRESSION_TYPE, raw: 'x'}], 'TO_STRING')).toEqual({
		value: 'TO_STRING(x)',
		computed: true,
	});
});

it('[[${x}]]', () => {
	expect(stringifyAttribute([[{type: EXPRESSION_TYPE, raw: 'x'}]])).toEqual({
		value: '(x)',
		computed: true,
	});
});

it('[[${x}], "foo"]', () => {
	expect(stringifyAttribute([{type: EXPRESSION_TYPE, raw: 'x'}, 'foo'])).toEqual({
		value: '(x) + "foo"',
		computed: true,
	});
});

it('[[${x}], "foo", "bar"]', () => {
	expect(stringifyAttribute([{type: EXPRESSION_TYPE, raw: 'x'}, 'foo', 'bar'])).toEqual({
		value: '(x) + "foobar"',
		computed: true,
	});
});

it('["foo", [${x}], "bar"]', () => {
	expect(stringifyAttribute(['foo', {type: EXPRESSION_TYPE, raw: 'x'}, 'bar'])).toEqual({
		value: '"foo" + (x) + "bar"',
		computed: true,
	});
});

it('["foo", ["bar"], [${x}], "bar"]', () => {
	expect(stringifyAttribute(['foo', ['bar'], {type: EXPRESSION_TYPE, raw: 'x'}])).toEqual({
		value: '"foobar" + (x)',
		computed: true,
	});
});

it('GROUP', () => {
	expect(stringifyAttribute([{type: GROUP_TYPE, test: 'true', raw: 'foo'}])).toEqual({
		value: '(true ? "foo" : "")',
		computed: true,
	});
});

it('GROUP + EXPRESSION', () => {
	expect(stringifyAttribute([{
		type: GROUP_TYPE,
		test: 'a + b',
		raw: ['foo', {type: EXPRESSION_TYPE, raw: 'bar'}]
	}])).toEqual({
		value: '(a + b ? "foo" + (bar) : "")',
		computed: true,
	});
});

it('INHERIT: self (???)', () => {
	const bone = new XNode('tag', {attrs: {class: ['foo']}});

	expect(stringifyAttribute({type: INHERIT_TYPE, raw: 'self'}, null, bone)).toEqual({
		value: '"foo"',
		computed: false
	});
});

it('INHERIT: self', () => {
	const bone = new XNode('tag', {attrs: {class: ['foo']}});

	expect(stringifyAttribute([
		{type: INHERIT_TYPE, raw: 'self'},
		'_bar'
	], null, bone)).toEqual({
		value: '"foo_bar"',
		computed: false
	});
});

it('INHERIT: parent', () => {
	const bone = new XNode('tag', {attrs: {class: ['foo']}}).add(new XNode('tag', {}));

	expect(stringifyAttribute([
		{type: INHERIT_TYPE, raw: 'parent'},
		'__bar'
	], null, bone.last)).toEqual({
		value: '"foo__bar"',
		computed: false
	});
});

it('INHERIT: self + EXPRESSION', () => {
	const bone = new XNode('tag', {attrs: {class: [{type: EXPRESSION_TYPE, raw: 'foo'}]}});

	expect(stringifyAttribute([
		{type: INHERIT_TYPE, raw: 'self'},
		'--bar'
	], null, bone)).toEqual({
		value: '(foo) + "--bar"',
		computed: true
	});
});

it('INHERIT: fail', () => {
	const bone = new XNode('tag', {attrs: {}});

	expect(stringifyAttribute([
		{type: INHERIT_TYPE, raw: 'self'},
		'--bar'
	], null, bone)).toEqual({
		value: '"NULL_INHERIT_REF--bar"',
		computed: false
	});
});
