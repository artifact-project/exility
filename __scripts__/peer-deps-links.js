const fs = require('fs');
const docroot = '.';

function createSymlinks(pkgPath, deps) {
	Object.keys(deps).forEach(depName => {
		const [scope, name] = depName.split('/');
		const target = `${docroot}/../../../${name}`;
		const path = `${pkgPath}/node_modules/${scope}/${name}`;

		console.log(` - ${pkgPath.split('/').pop()}: ${depName} -> ${path}`);

		fs.mkdir(`${pkgPath}/node_modules/${scope}`, () => {
			fs.symlink(target, path, 'dir', (err) => {
				// console.log(err);
			});
		});
	});
}

fs.readdir(docroot, (err, entries) => entries.forEach(name => {
	const pkgPath = `${docroot}/${name}`;

	fs.readFile(`${pkgPath}/package.json`, (err, contents) => {
		if (!err) {
			const pkg = JSON.parse(contents + '');

			if (pkg.peerDependencies) {
				createSymlinks(pkgPath, pkg.peerDependencies);
			}
		}
	});
}));
