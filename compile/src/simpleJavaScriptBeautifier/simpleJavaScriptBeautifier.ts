const tabs = '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t';

const R_IF_ELSE = /^}\s*(if|else)/;
const R_RETURN = /return.*?;$/;
const R_BLOCK_CLOSE = /^}[;,]?$/;
const R_BLOCK_OPEN = /(function(\s\w+)?|if|for|return(\sfunc.*?)?)\s*[\(\{]/;
const R_VAR_OPEN = /^var.+(\{|\(|[^\}],)$/;
const R_INVOKE_BLOCK_OPEN = /^[a-z_][a-z0-9_]*\([^)]*$/i;
const R_INVOKE_BLOCK_CLOSE = /^\}?\);?$/i;
const R_EMPTY_LINE = /^\s+$/;

function combine(...rules: RegExp[]): RegExp {
	return new RegExp(rules.map(rule => rule.source).join('|'));
}

const R_OPEN = combine(
	R_BLOCK_OPEN,
	R_INVOKE_BLOCK_OPEN,
	R_VAR_OPEN,
);
const R_CLOSE = combine(
	R_BLOCK_CLOSE,
	R_INVOKE_BLOCK_CLOSE,
);

function simpleJavaScriptBeautifier(source: string) {
	let indent = 0;

	return source
		.trim()
		.split('\n')
		.map((line) => {
			line = line.trim();

			if (R_IF_ELSE.test(line)) {
				line = tabs.substr(0, indent - 1) + line;
			} else if (R_OPEN.test(line)) {
				line = tabs.substr(0, indent) + line;
				!R_RETURN.test(line) && indent++;
			} else {
				R_CLOSE.test(line) && indent--;
				line = tabs.substr(0, indent) + line;
			}

			return R_EMPTY_LINE.test(line) ? '' : line;
		})
		.join('\n')
		.replace(/\n{2,}/g, '\n\n')
		.replace(/\{\n+/g, '{\n')
		.replace(/\n+(\s+\})/g, '\n$1')
	;
}

export default simpleJavaScriptBeautifier;
