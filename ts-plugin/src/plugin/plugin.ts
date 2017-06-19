import * as ts_module from 'typescript/lib/tsserverlibrary';

export default function init(modules: {typescript: typeof ts_module}) {
	const ts = modules.typescript;

	function findAllNodes(sourceFile: ts.SourceFile, cond: (n: ts.Node) => boolean): ts.Node[] {
		const result: ts.Node[] = [];

		function find(node: ts.Node) {
			if (cond(node)) {
				result.push(node);
				return;
			} else {
				ts.forEachChild(node, find);
			}
		}

		find(sourceFile);
		return result;
	}

	function translateDiagnostic(messageText: string, file: ts.SourceFile, start: number, length: number): ts.Diagnostic {
		return {
			code: 9999,
			messageText,
			category: ts.DiagnosticCategory.Error,
			file,
			start,
			length,
		};
	}

	function create(info: ts.server.PluginCreateInfo) {
		// Get a list of things to remove from the completion list from the config object.
		// If nothing was specified, we'll just remove 'caller'
		const whatToRemove: string[] = info.config.remove || ['caller'];

		// Diagnostic logging
		info.project.projectService.logger.info(`I'm getting set up now! Check the log for this message.`);

		// Set up decorator
		const proxy = Object.create(null) as ts.LanguageService;
		const oldLS = info.languageService;

		for (const key in oldLS) {
			proxy[key] = function () {
				return oldLS[key].apply(oldLS, arguments);
			};
		}

		const getAllNodes = (fileName: string, cond: (n: ts.Node) => boolean) => {
			const s = info.languageService.getProgram().getSourceFile(fileName);
			return findAllNodes(s, cond);
		};

		// Remove specified entries from completion list
		proxy.getCompletionsAtPosition = (fileName, position) => {
			const prior = info.languageService.getCompletionsAtPosition(fileName, position);
			const oldLength = prior.entries.length;

			prior.entries = prior.entries.filter(entry => whatToRemove.indexOf(entry.name) < 0);

			// Sample logging for diagnostic purposes
			if (oldLength !== prior.entries.length) {
				info.project.projectService.logger.info(`Removed ${oldLength - prior.entries.length} entries from the completion list`);
			}

			return prior;
		};

		proxy.getSemanticDiagnostics = (fileName: string) => {
			const errors = [...info.languageService.getSemanticDiagnostics(fileName)];
			const nodes = getAllNodes(fileName, (node) => node.kind === ts.SyntaxKind.LiteralType);

			errors.push(translateDiagnostic(
				'Wow!',
				nodes[0].getSourceFile(),
				1,
				2
			));

			return errors;
		};

		return proxy;
	}

	return {create};
}
