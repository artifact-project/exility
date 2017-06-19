import * as diff from 'jest-diff';

const glueByName = {
	'class': ' ',
	'style': ';'
};

function normalize(data, glue?: string) {
	if (/number|string|boolean/.test(typeof data)) {
		return data;
	} else if (data.type === 'expression') {
		return '${' + data.raw + '}';
	} else if (data instanceof Array) {
		return data.map((item) => normalize(item, '')).join(glue || '');
	} else {
		const newData = {};

		Object.keys(data).forEach(name => {
			newData[name] = normalize(data[name], glueByName[name]);
		});

		return newData;
	}
}

expect.extend({
	toEqualFrag(actual: object, expected: object) {
		const norm = normalize(actual);
		const pass: boolean = this['equals'](norm, expected);

		if (pass) {
			return {
				message: () => 'Expected value to equal',
				pass: true,
			};
		} else {
			return {
				message: () => {
					const diffString = diff(norm, expected, {
						expand: this['expand'],
					});

					return (
						`Expected value to equal:\n  ${this.utils.printExpected(expected)}\n` +
						`Received:\n  ${this.utils.printReceived(norm)}` +
						(diffString ? `\n\nDifference:\n\n${diffString}` : '')
					);
				},
				pass: false,
			};
		}
	},
});
