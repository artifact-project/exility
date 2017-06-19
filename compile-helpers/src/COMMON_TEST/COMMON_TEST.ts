export interface ICT {
	title: string;
	template: string;
	data: any;
	snapshot?: boolean;
	results: string | string[];
}

const COMMON_TEST:ICT[] = [
	{
		title: 'text',
		template: '| foo',
		data: {},
		results: 'foo'
	},
	
	{
		title: 'page',
		template: 'html\n\thead > title | foo\n\tbody > h1.title | Bar',
		data: {},
		results: '<html><head><title>foo</title></head><body><h1 class=\"title\">Bar</h1></body></html>'
	},

	{
		title: 'tag + text + interpolate',
		template: 'h1.title-${size} | Hi, ${user}!',
		data: [{user: 'xtpl', size: 'xxl'}, {user: 'X', size: 'wow'}],
		results: ['<h1 class="title-xxl">Hi, xtpl!</h1>', '<h1 class="title-wow">Hi, X!</h1>']
	},

	// {
	// 	'Shorty interpolate syntaxis',
	// 	'${tag}.{y}.-{y}.{y}-.-{y}-[class.{y}={z}][prop={z} bar="~{z}~"] | Hi, {txt}!',
	// 	[{tag: 'a', y: 'cls', z: 'foo', txt: 'Wow'}],
	// 	['<a class=\"cls -cls cls- -cls- cls\" prop=\"foo\" bar=\"~foo~\">Hi, Wow!</a>']
	// },

	{
		title: 'Nesting',
		template: '.btn > .&__text',
		data: {},
		results: '<div class=\"btn\"><div class=\"btn__text\"></div></div>'
	},

	{
		title: 'Nesting + interpolate',
		template: '.${x} > .&__text',
		data: {x: 'ico'},
		results: '<div class=\"ico\"><div class=\"ico__text\"></div></div>'
	},

	{
		title: 'Nesting + inherit self',
		template: '.foo[class.&_small]',
		data: {},
		results: '<div class=\"foo foo_small\"></div>'
	},
	
	{
		title: 'Nesting + inherit self + interpolate',
		template: '.foo[class.&_${mode}]',
		data: {mode: 'bar'},
		results: '<div class=\"foo foo_bar\"></div>'
	},

	{
		title: 'Nesting + hidden_class',
		template: '.foo > %-bar > .&__ico + .&__txt',
		data: {},
		results: '<div class=\"foo\"><div class=\"foo-bar__ico\"></div><div class=\"foo-bar__txt\"></div></div>'
	},

	{
		title: 'IF statement',
		template: 'foo\nif (x)\n  bar',
		snapshot: true,
		data: [{x: null}, {x: false}, {x: true}],
		results: ['<foo></foo>', '<foo></foo>', '<foo></foo><bar></bar>']
	},

	{
		title: 'IF/ELSE statement',
		template: 'if (x)\n  a\nelse\n  b',
		snapshot: true,
		data: [{x: true}, {x: false}],
		results: ['<a></a>', '<b></b>']
	},

	{
		title: 'IF/ELSE IF/ELSE statement',
		template: 'if (x == 1)\n  a\nelse if (x == 2)\n  b\nelse\n  c',
		snapshot: true,
		data: [{x: 1}, {x: 2}, {x: null}],
		results: ['<a></a>', '<b></b>', '<c></c>']
	},

	{
		title: 'FOR statement',
		snapshot: true,
		template: 'for (val in data)\n  | ${val},',
		data: {data: [1, 2]},
		results: '1,2,'
	},

	{
		title: 'FOR statement with key',
		snapshot: true,
		template: 'for ([key, val] in data)\n  | ${key}:${val},',
		data: {data: [1, 2]},
		results: '0:1,1:2,'
	},

	{
		title: 'Custom element',
		snapshot: true,
		template: [
			'btn = [text, url]',
			'  ${url ? "a" : "button"}.btn[href="${url}"] | ${text}',
			'btn[text="${text}" url="${href}"]'
		].join('\n'),
		data: [{text: 'Wow!', href: null}, {text: 'LOL!', href: 'domain.com'}],
		results: ['<button class=\"btn\">Wow!</button>', '<a class=\"btn\" href=\"domain.com\">LOL!</a>']
	},
];

export default COMMON_TEST;
