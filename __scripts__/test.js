const {join} = require('path');
const {readdir, readFile} = promisify(require('fs'));
const {exec} = promisify(require('child_process'));

function promisify(target) {
	return Object.entries(target).reduce((result, [name, fn]) => {
		result[name] = function promisifyWrapper(...args) {
			return new Promise((resolve, reject) => {
				fn.call(target, ...[...args, (err, ...results) => {
					err
						? reject(err)
						: resolve(results.length ? results[0] : results)
					;
				}]);
			});
		};

		return result;
	}, {});
}

function fetchPackage(path, name) {
	return readFile(join(path, name, 'package.json'))
		.then(body => JSON.parse(body + ''))
		.then(meta => ({path: join(path, name), meta}))
		.catch(() => null)
	;
}

function fetchPackages(path) {
	return readdir(path)
		.then(entries => Promise.all(entries.map(name => fetchPackage(path, name))))
		.then(packages => packages.filter(pkg => pkg && pkg.meta.scripts.test))
	;
}

function runTest({path, meta: {name}}) {
	process.stdout.write(` - ${name}...`);
	return exec('npm test -- --no-cache', {cwd: path})
		.then((result) => {
			process.stdout.write('OK\n');
			return result;
		})
		.catch((err) => {
			process.stdout.write('ERROR\n');
			return Promise.reject(err);
		})
	;
}

function runAllTests(packages) {
	return packages.reduce((flow, pkg) => flow.then(() => runTest(pkg)), Promise.resolve());
}

// Main
fetchPackages(join(__dirname, '..', ''))
	// .then(packages => packages.slice(0, 2))
	.then(runAllTests)
	.catch(err => {
		console.error(err);
	})
;
