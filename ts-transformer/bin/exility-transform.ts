import {join} from 'path';
import {existsSync, readFileSync, writeFileSync} from 'fs';
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
			before: [transformer()],
			after: [],
		}),
	};

    const service = ts.createLanguageService(servicesHost, ts.createDocumentRegistry());

    fileNames.forEach(fileName => {
        const output = service.getEmitOutput(fileName);

        if (!output.emitSkipped) {
            console.log(`Emitting ${fileName}`);
        } else {
            console.log(`Emitting ${fileName} failed`);
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
					console.log(`  Error ${diagnostic.file.fileName}:${line + 1}:${character + 1})  -> ${message}`);
				} else {
					console.log(`  Error: ${message}`);
				}
        	}
        );
    }
}

const tsconfigFileName = join(__dirname, 'tsconfig.json');

console.log(`TS Config: ${tsconfigFileName}`);
compile(process.argv.slice(2), require(tsconfigFileName));
