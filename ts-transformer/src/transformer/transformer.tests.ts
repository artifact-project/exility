import * as ts from 'typescript';
import transformer from './transformer';

const compilerOptions = {
	module: ts.ModuleKind.CommonJS,
	target: ts.ScriptTarget.ES5,
};

const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
	removeComments: false,
});

function transform(source: string): string {
	const sourceFile = ts.createSourceFile('source.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
	const transformationResult = ts.transform(sourceFile, [transformer()], compilerOptions);

	return printer.printFile(transformationResult.transformed[0]);
}


it('string', () => {
	expect(transform(`
		function () {
			class Str extends Block {
				static template = 'h1 | \${attrs.text}!';
			}
		}
	`)).toMatchSnapshot();
});

it('arrow function', () => {
	expect(transform(`
		class ArrowFunction extends Block<null> {
			static template = (attrs) => \`h1 | \${attrs.text}!\`;
		}
	`)).toMatchSnapshot();
});

it('arrow function: if', () => {
	expect(transform(`
		class ArrowIf extends Block<null> {
			static template = (attrs) => \`if (\${attrs.text}) > h1\`;
		}
	`)).toMatchSnapshot();
});

it('arrow function: for (item in items)', () => {
	expect(transform(`
		class ArrowFor extends Block<null> {
			static template = (attrs) => \`for (item in \${attrs.items}) > div | \${item}\`;
		}
	`)).toMatchSnapshot();
});

it('blocks', () => {
	expect(transform(`
		class App extends Block<{username: string}> {
			static blocks = {Button};
			static template = \`
				Button[
					value="Foo"
				]
			\`;
		}
	`)).toMatchSnapshot();
});

it('classNames', () => {
	expect(transform(`
		class App extends Block<{username: string}> {
			static classNames = css;
			static template = \`.foo | bar\`;
		}
	`)).toMatchSnapshot();
});

it('factory', () => {
	expect(transform(`
		function factory<R>(): any {
			class Formify extends Block<R> {
				static template = 'h1 | Wow';
			}
			
			return Formify;
		}
	`)).toMatchSnapshot();
});
