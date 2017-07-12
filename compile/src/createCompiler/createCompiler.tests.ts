import createCompiler, {ICompilerOptions} from './createCompiler';

interface ITestCompilerOptions extends ICompilerOptions {
	code: string;
}

it('success', () => {
	const compiler = createCompiler<ITestCompilerOptions>((options) => () => ({
		code: options.code,
	}));

	const compile = compiler({
		code: 'alert(1)',
		debug: true,
		scope: [],
	});

	expect(compile('').toString()).toMatchSnapshot();
	expect(compile(null).toString()).toBe(compile('').toString());
});
