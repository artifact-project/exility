import * as ts from 'typescript';

const fileNames = [`${__dirname}/plugin.fixture.ts`];
const options = {
	module: ts.ModuleKind.CommonJS,
	target: ts.ScriptTarget.ES5,
	plugins: [
		{name: 'ts-plugin'},
	]
};

it('diagnostic', () => {
	let program = ts.createProgram(fileNames, options);
	let emitResult = program.emit();

	let allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

	allDiagnostics.forEach(diagnostic => {
		console.log(diagnostic);
		let {line, character} = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
		let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
		console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
	});

	let exitCode = emitResult.emitSkipped ? 1 : 0;
	console.log(`Process exiting with code '${exitCode}'.`);
});
