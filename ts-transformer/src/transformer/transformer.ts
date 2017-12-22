import * as ts from 'typescript';
import {createCompiler as createDOMCompiler} from '@exility/dom';
import {createCompiler as createStringCompiler} from '@exility/string';

export interface TXOptions {
	isomorphic?: boolean | 'env';
}

function createImport(name, path) {
	return ts.createImportDeclaration(
		undefined,
		undefined,
		ts.createImportClause(ts.createIdentifier(name), undefined),
		ts.createLiteral(path)
	);
}

function addImport(imports: object, path) {
	const name = path.replace(/[^a-z0-9]/g, '_');

	if (!imports.hasOwnProperty(name)) {
		// imports[name] = createImport(name, path);
		// TypeError: Cannot set property text of #<IdentifierObject> which has only a getter

		Object.defineProperty(imports, name, {
			enumerable: true,
			value: createImport(name, path),
		});
	}

	return imports[name];
}

function generateDepsObject(imports, deps) {
	const props = Object.keys(deps).map(name => {
		const importDecl = addImport(imports, deps[name]);
		const importName = ts.getGeneratedNameForNode(importDecl);

		return ts.createPropertyAssignment(name, ts.createPropertyAccess(importName, 'default'));
	});

	return ts.createObjectLiteral(props);
}


function isBlocks(node) {
	return (
		node.kind === ts.SyntaxKind.PropertyDeclaration &&
		node.name.text === 'blocks' &&
		node.initializer && (node.initializer.kind === ts.SyntaxKind.ObjectLiteralExpression)
	);
}

function isClassNames(node) {
	return (
		node.kind === ts.SyntaxKind.PropertyDeclaration &&
		node.name.text === 'classNames'
	);
}

function hasExtends(node) {
	return node && node.heritageClauses && node.heritageClauses.length;
}

function isStringTemplate({kind}) {
	return (
		kind === ts.SyntaxKind.StringLiteral ||
		kind === ts.SyntaxKind.TemplateExpression ||
		kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral
	);
}

function isArrowTemplate({kind}) {
	return kind === ts.SyntaxKind.ArrowFunction;
}

function isTemplate(node) {
	return (
		node.kind === ts.SyntaxKind.PropertyDeclaration &&
		node.name.text === 'template' &&
		(isStringTemplate(node.initializer) || isArrowTemplate(node.initializer)) &&
		hasExtends(node.parent)
	);
}

function glueTemplateExpression(node: ts.TemplateExpression): string {
	const chunks = [node.head.text];

	node.templateSpans.forEach((node) => {
		const expression = node.expression.getText();
		const code = node.literal.text;

		if (/\b(if\s*\(|in\s*)$/.test(chunks[chunks.length - 1])) {
			chunks.push(`${expression}${code}`);
		} else {
			chunks.push(`\${${expression}}${code}`);
		}
	});

	return chunks.join('');
}

function addCompiled(statements, compiled) {
	compiled.forEach(([refNode, node]) => {
		let idx = statements.length;

		while (idx--) {
			if (statements[idx].pos === refNode.pos && statements[idx].end === refNode.end) {
				statements.splice(idx + 1, 0, node);
			}
		}
	});
	compiled.length = 0;

	return statements;
}

function visitNode(node, imports, compiled, options: TXOptions) {
	if (!isTemplate(node)) {
		return node;
	}

	let templateString = '';

	if (isArrowTemplate(node.initializer)) {
		templateString = glueTemplateExpression(node.initializer.body);
	} else {
		templateString = node.initializer.text;
	}

	const meta = getMeta(node.parent);
	const scope = [
		'attrs',
		'context',
		'__blocks__',
		'__this__',
		'__slots__',
	];

	meta.cssModule && scope.push('__classNames__');

	const domCompile = createDOMCompiler({
		...meta,
		scope,
		isomorphic: !!options.isomorphic,
	});
	let code = domCompile(templateString)
					.toString()
					.replace(/__STDDOM_CMP_SET_COMPILER\(.*?\);\n/, '');

	if (options.isomorphic === 'env') {
		const stringCompile = createStringCompiler({
			...meta,
			scope,
			metaComments: true,
		});
		code = `process.env.RUN_AT === "server"
			? (${stringCompile(templateString).toString()})
			: (${code})
		`.replace(
			/\b__COMPILER__[^\n]+;/g,
			'require("@exility/string").runtimeBlockActivate(blocks[name], {metaComments: true})',
		);
	}

	const __template__ = ts.createCall(
		ts.createParen(ts.createIdentifier(code)),
		undefined,
		[
			generateDepsObject(imports, {
				'stdlib': '@exility/stdlib/src/core/core',
				'stddom': '@exility/stdlib/src/dom/dom',
			}),
		],
	);

	compiled.push([node.parent, ts.createStatement(ts.createBinary(
		ts.createIdentifier(`${node.parent.name.text || node.parent.name.escapedText}.prototype.__template__`),
		ts.SyntaxKind.EqualsToken,
		__template__,
	))]);

	return (ts.updateProperty as Function)(
		node,
		undefined,
		node.modifiers,
		ts.createIdentifier(node.name.text),
		node.type,
		ts.createIdentifier('null'),
	);
}

function visitNodeAndChildren(node, context, imports, compiled, options: TXOptions) {
	// Ходим только по классам, методам, функциям и свойствам
	if (
		(node == null) || !(
			node.kind === ts.SyntaxKind.SourceFile ||
			node.kind === ts.SyntaxKind.Block ||
			node.kind === ts.SyntaxKind.CallExpression ||
			node.kind === ts.SyntaxKind.ExpressionStatement ||
			node.kind === ts.SyntaxKind.PropertyDeclaration ||
			node.kind === ts.SyntaxKind.ClassDeclaration ||
			node.kind === ts.SyntaxKind.ClassExpression ||
			node.kind === ts.SyntaxKind.ArrowFunction ||
			node.kind === ts.SyntaxKind.FunctionDeclaration ||
			node.kind === ts.SyntaxKind.FunctionExpression
		)
	) {
		return node; // exit
	}

	const isBlock = node.kind === ts.SyntaxKind.Block;

	if (isBlock) {
		compiled = [];
	}

	const visitedNode = ts.visitEachChild(
		visitNode(node, imports, compiled, options),
		(childNode) => visitNodeAndChildren(childNode, context, imports, compiled, options),
		context
	);

	if (isBlock && compiled.length) {
		return ts.updateBlock(
			visitedNode,
			addCompiled(visitedNode.statements, compiled),
		);
	}

	return visitedNode;
}

function getMeta(node) {
	const meta = {
		// name: node.name.escapedText,
		blocks: [],
		cssModule: false,
	};

	function visitNode(node) {
		if (isBlocks(node)) {
			meta.blocks = node.initializer.properties.map(node => node.name.text);
		} else if (isClassNames(node)) {
			meta.cssModule = true;
		}
	}

	ts.forEachChild(
		node,
		visitNode,
	);

	return meta;
}

function exilityTransformerFactoryConfigurate(options: TXOptions = {}) {
	return function exilityTransformerFactory(context) {
		return function (file) {
			const imports = {};
			const compiled = [];
			const result = visitNodeAndChildren(file, context, imports, compiled, options);

			return ts.updateSourceFileNode(
				result,
				Object.keys(imports)
					.map(name => imports[name])
					.concat(addCompiled(result.statements, compiled))
			);
		};
	}
}

export default exilityTransformerFactoryConfigurate;
