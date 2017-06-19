import {JSDOM} from 'jsdom';

expect['addSnapshotSerializer']({
	test: (val) => /function|string/.test(typeof val) && !val.hasOwnProperty('frag'),
	print: (val) => val.toString(),
});

expect['addSnapshotSerializer']({
	test: (val) => val && val.hasOwnProperty('frag'),
	print: (view) => {
		const container = JSDOM.fragment('');
		view.mountTo(container);
		return container.length ? container.firstChild.outerHTML : '';
	},
});
