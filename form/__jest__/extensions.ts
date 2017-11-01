import * as toDiffableHtml from 'diffable-html';

function cleanClassNames(value) {
	return value.replace(/(\sclass=")([^"]+)/g, (_, attr, classes) => {
		return attr + classes.trim().split(/\s+/).sort().join(' ');
	});
}

expect['addSnapshotSerializer']({
	test: (val) => val && val.isDOMWrapper,
	print: (val) => toDiffableHtml(cleanClassNames(val.html())).trim(),
});
