import simpleJavaScriptBeautifier
from './simpleJavaScriptBeautifier';

it('empty', () => {
	expect(simpleJavaScriptBeautifier('')).toBe('');
});

it('function', () => {
	expect(simpleJavaScriptBeautifier(`
		function foo() {
			var a = 1;
						var b = 2;
		var c = 3;
		return a + b + c; 
			}
	`)).toMatchSnapshot();
});

it('function > function', () => {
	expect(simpleJavaScriptBeautifier(`
		function foo() {
		function bar() {
		}
		return bar;
			}
	`)).toMatchSnapshot();
});

it('function > return function', () => {
	expect(simpleJavaScriptBeautifier(`
function templateFactory() {
"use strict"
return function compiledTemplate(__SCOPE__) {
__SCOPE__ = __SCOPE__ || {};
// CODE:START
var __ROOT = "<!DOCTYPE html>";
return __ROOT
// CODE:END
}
}
`)).toMatchSnapshot();
});

it('if', () => {
	expect(simpleJavaScriptBeautifier(`
		if (expr) {
	expr = false;
		}
	`)).toMatchSnapshot();
});

it('if/else', () => {
	expect(simpleJavaScriptBeautifier(`
		if (expr) {
	expr = false;
				} else {
expr = true;
		}
	`)).toMatchSnapshot();
});

it('if/else if', () => {
	expect(simpleJavaScriptBeautifier(`
if (expr) {
			expr = false;
					} else if (!expr) {
expr = true;
		}
	`)).toMatchSnapshot();
});

it('if/else if/else', () => {
	expect(simpleJavaScriptBeautifier(`
if (expr) {
			expr = false;
					} else if (!expr) {
expr = true;
		} else {
	// LOL!
		}
	`)).toMatchSnapshot();
});


it('invoke', () => {
	expect(simpleJavaScriptBeautifier(`
		call(
		a,
	b,
			c
);
	`)).toMatchSnapshot();
});

it('var object', () => {
	expect(simpleJavaScriptBeautifier(`
function () {
				var __ctx = __STDDOM_CONTEXT();
		var __super__ = {
		"children": __PE_children_2
	};
		var __frag = __STDDOM_FRAGMENT();
}
	`)).toMatchSnapshot();
});

it('call multiline', () => {
	expect(simpleJavaScriptBeautifier(`
__CMP_ATTRS["name"] = (x);
		var __x1 = __STDDOM_CMP_CREATE_INLINE(__CMP_INLINE_STORE,

		__frag,
			__this__,
			"Icon",
		__CMP_ATTRS,
	null
	);
	`)).toMatchSnapshot();
});
