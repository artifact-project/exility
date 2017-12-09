#!/usr/bin/env node

import {join} from 'path';
import {existsSync, readFileSync, writeFileSync} from 'fs';
import * as glob from 'glob';
import * as ts from 'typescript';
import transformer from '../src/transformer/transformer';

interface TSFile {
	version: number;
}

const vcs = (function () {
	const store: ts.MapLike<TSFile> = {};

	return {
		get(fileName): TSFile {
			if (!store.hasOwnProperty(fileName)) {
				store[fileName] = {version: 0};
			}

			return store[fileName];
		},

		version(fileName): string {
			return this.get(fileName).version + '';
		},

		up(fileName): void {
			this.get(fileName).version++;
		},
	};
})();

function compile(fileNames: string[], compilerOptions: ts.CompilerOptions): void {
	const servicesHost: ts.LanguageServiceHost = {
		getScriptFileNames: () => fileNames,
		getScriptVersion: (fileName) => vcs.version(fileName),
		getScriptSnapshot: (fileName) => {
			if (!existsSync(fileName)) {
				return undefined;
			}

			return ts.ScriptSnapshot.fromString(readFileSync(fileName).toString());
		},
		getCurrentDirectory: () => process.cwd(),
		getCompilationSettings: () => compilerOptions,
		getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
		fileExists: ts.sys.fileExists,
		readFile: ts.sys.readFile,
		readDirectory: ts.sys.readDirectory,
		getCustomTransformers: () => ({
			before: [transformer({
				isomorphic: 'env',
			})],
			after: [],
		}),
	};

    const service = ts.createLanguageService(servicesHost, ts.createDocumentRegistry());

    fileNames.forEach(fileName => {
        const output = service.getEmitOutput(fileName);

        if (!output.emitSkipped) {
            console.log(` - ${fileName}`);
        } else {
            console.error(` - ${fileName} failed`);
            logErrors(fileName);
        }

        output.outputFiles.forEach(out => {
            writeFileSync(out.name, out.text, 'utf8');
        });
    });

	function logErrors(fileName: string) {
        service.getCompilerOptionsDiagnostics()
            .concat(service.getSyntacticDiagnostics(fileName))
            .concat(service.getSemanticDiagnostics(fileName))
            .forEach(diagnostic => {
				const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");

				if (diagnostic.file) {
					const {line, character} = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
					console.error(`  Error ${diagnostic.file.fileName}:${line + 1}:${character + 1})  -> ${message}`);
				} else {
					console.error(`  Error: ${message}`);
				}
        	}
        );
    }
}

function converOptions(options): ts.CompilerOptions {
	const target = {
		es3: ts.ScriptTarget.ES3,
		es5: ts.ScriptTarget.ES5,
		es2015: ts.ScriptTarget.ES2015,
		es2016: ts.ScriptTarget.ES2016,
		es2017: ts.ScriptTarget.ES2017,
		esnext: ts.ScriptTarget.ESNext,
		latest: ts.ScriptTarget.Latest,
	};
	const module = {
		none: ts.ModuleKind.None,
		commonjs: ts.ModuleKind.CommonJS,
		amd: ts.ModuleKind.AMD,
		umd: ts.ModuleKind.UMD,
		system: ts.ModuleKind.System,
		es2015: ts.ModuleKind.ES2015,
		es2017: ts.ModuleKind.ESNext,
	};
	const moduleResolution = {
		classic: ts.ModuleResolutionKind.Classic,
		node: ts.ModuleResolutionKind.NodeJs,
	};

	return {
		...options,

		lib: void 0,
		target: target[options.target] || ts.ScriptTarget.ES2015,
		module: module[options.module] || ts.ModuleKind.CommonJS,
		moduleResolution: moduleResolution[options.moduleResolution] || ts.ModuleResolutionKind.NodeJs,
	};
}

// Main
const files = process.argv.slice(2);
const exec = (err: Error, files: string[]) => {
	const tsconfigFileName = join(process.cwd(), 'tsconfig.json');

	if (err) {
		console.error(err);
	} else {
		console.log(`[@exility/ts-transformer] tsconfig: ${tsconfigFileName}`);

		compile(
			files.filter(f => !/\.d\.ts$/.test(f)),
			converOptions(require(tsconfigFileName).compilerOptions),
		);
	}
};

console.log(`[@exility/ts-transformer] Started`);

if (files.length) {
	exec(null, files);
} else {
	glob('**/*.ts', {ignore: ['node_modules']}, exec);
}

