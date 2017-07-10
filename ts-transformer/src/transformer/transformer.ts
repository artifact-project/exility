import * as ts from 'typescript';
import {createCompiler} from '@exility/dom';

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
		imports[name] = createImport(name, path);
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

function visitNode(node, imports) {
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
		'__blocks__',
		'__this__',
		'__slots__',
	];

	meta.cssModule && scope.push('__classNames__');

	const compile = createCompiler({
		...meta,
		scope,
	});
	const templateFactory = compile(templateString);
	const code = templateFactory
					.toString()
					.replace(/__STDDOM_CMP_SET_COMPILER\(.*?\);\n/, '');

	return ts.updateProperty(
		node,
		undefined,
		node.modifiers,
		ts.createIdentifier('prototype.__template__'),
		node.type,
		ts.createCall(
			ts.createParen(ts.createIdentifier(code)),
			undefined,
			[generateDepsObject(imports, {
				'stdlib': '@exility/compile-helpers/src/stdlib/stdlib',
				'stddom': '@exility/dom/src/stddom/stddom',
			})]
		)
	);
}

function visitNodeAndChildren(node, context, imports) {
	// Ходим только по классам, методам, функциям и свойствам
	if (
		node == null || !(
			node.kind === ts.SyntaxKind.SourceFile ||
			node.kind === ts.SyntaxKind.PropertyDeclaration ||
			node.kind === ts.SyntaxKind.ClassDeclaration ||
			node.kind === ts.SyntaxKind.ClassExpression ||
			node.kind === ts.SyntaxKind.ArrowFunction ||
			node.kind === ts.SyntaxKind.FunctionDeclaration ||
			node.kind === ts.SyntaxKind.FunctionExpression
		)
	) {
		return node;
	}

	return ts.visitEachChild(
		visitNode(node, imports),
		(childNode) => visitNodeAndChildren(childNode, context, imports),
		context
	);
}

function getMeta(node) {
	const meta = {blocks: [], cssModule: false};

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

function exilityTransformerFactory(context) {
	return function (file) {
		const imports = {};
		const result = visitNodeAndChildren(file, context, imports);

		return ts.updateSourceFileNode(
			result,
			Object.keys(imports)
				.map(name => imports[name])
				.concat(result.statements)
		);
	};
}

export default exilityTransformerFactory;
