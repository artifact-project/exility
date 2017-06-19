import parse, {IXNode} from '@exility/parser';
import Block from '@exility/block';

import simpleJavaScriptBeautifier from '../simpleJavaScriptBeautifier/simpleJavaScriptBeautifier';

// todo: Удалить debug, просто всегда денлать «красивый» код
export interface ICompilerOptions {
	pure?: boolean;
	debug?: boolean;
	blocks?: string[];
	cssModule?: boolean;
	scope: string[];
}

export interface IPureLibrary {
	[index: string]: any;
}

export interface ICompileArtifact {
	deps?: {[index: string]: [string, IPureLibrary]};
	args?: string[];
	before?: string;
	code: string;
	after?: string;
}

export type ICompilerFactory<O> = (options: O) => ICompiler<O>;
export type ICompilerConfigurator<O> = (options: O) => Function;
export type ICompiler<O> = (node: IXNode, options?: O) => ICompileArtifact;

function serialize(value) {
	if (value instanceof Function || value instanceof RegExp) {
		return value.toString();
	} else if (value instanceof Object) {
		return JSON.stringify(value);
	} else {
		return value;
	}
}

function extractLib(input, libName, [prefix, lib], pure) {
	const regexp = new RegExp(`\\b${prefix}_([A-Z_]+)\\b`, 'g');
	const methods: string[] = [];
	let code = '';
	let matches;

	while (matches = regexp.exec(input)) {
		const method = matches[1];
		!methods.includes(method) && methods.push(method);
	}

	if (methods.length) {
		code = `${methods.map(name => `var ${prefix}_${name} = ${prefix}.${name};`).join('\n')}`;

		if (pure) {
			const vars: string[] = [];
			let exports = methods.map(name => {
				if (!lib[name]) {
					throw `${libName}.${name} — not found`;
				}

				const source = serialize(lib[name]);
				const matches = source.match(/\b[A-Z_]+\b/g);

				if (matches) {
					matches.forEach(name => {
						const value = `var ${name} = ${serialize(lib[name])};`;
						!vars.includes(value) && vars.push(value);
					});
				}

				return `this.${name} = ${source};`;
			}).join('\n');

			if (vars.length) {
				exports = `${vars.join('\n')}\n${exports}`;
			}

			code = `var ${prefix} = new (function () {\n${exports}\n});\n\n${code}`;
		} else {
			code = `var ${prefix} = __DEPS__.${libName};\n${code}`;
		}
	}

	return code;

}

function normalize(input: string) {
	if (input) {
		let initialIndent = input.match(/^\n+([ \t]+)/);

		if (initialIndent) {
			const regexp = new RegExp(`^${initialIndent[1]}`);
			input = input.trim().split(/\n/).map(line => line.replace(regexp, '')).join('\n');
		}

	}

	return input;
}

export default function createCompiler<O extends ICompilerOptions>(factory: ICompilerFactory<O>): ICompilerConfigurator<O> {
	return function compilerConfigurator(options: O) {
		const compile: ICompiler<O> = factory(options);

		return function compiler(input: string) {
			const frag = parse(normalize(input));
			const source = [];
			const artifact = compile(frag, options);
			let noDeps = true;

			artifact.before && source.push(artifact.before, '');

			source.push('return function compiledTemplate(__SCOPE__) {');

			if (options.scope && options.scope.length) {
				source.push('__SCOPE__ = __SCOPE__ || {};');

				options.scope
					.filter(name => /^[_a-z]([0-9a-z_]*)$/i.test(name))
					.forEach(name => {
						source.push(`var ${name} = __SCOPE__.${name};`);
					});

				if (options.scope.indexOf('__this__') === -1 && /__this__/.test(artifact.code)) {
					source.push('var __this__ = __SCOPE__;');
				}

				source.push('');
			}

			source.push(artifact.code);

			source.push('}');
			artifact.after && source.push(artifact.after);

			let code = source.join('\n');

			// Создаём фабрику шаблона
			if (artifact.deps) {
				Object.keys(artifact.deps).forEach(libName => {
					const result = extractLib(code, libName, artifact.deps[libName], options.pure);

					if (result) {
						code = `${result}\n${code}`;
						noDeps = false;
					}
				});
			}

			code = `function templateFactory(${options.pure || noDeps ? '' : '__DEPS__'}) {\n"use strict";\n${code}\n}`;
			code = simpleJavaScriptBeautifier(code);

			try {
				return <any>Function('__COMPILER__', `return (${code})`)({
					deps: artifact.deps,
					options,
					blockify: Block.classify,
					configure: (extra) => compilerConfigurator({
						...Object(options),
						...Object(extra),
					}),
				});
			} catch (err) {
				return <any>Function(`return (${simpleJavaScriptBeautifier(`
					function templateCompileFailedFactory() {
						return function templateCompileFailed() {
							/***********************************
								${code}
							************************************/
							return new Error(${JSON.stringify(err.stack || err.message)});
						};
					}
				`)});`);
			}

			// .bind({
			// 	fromString: (template, extraOptions) => this.fromString(template, {
			// 		...options,
			// 		...extraOptions
			// 	}),
			// });
		};
	};
}
