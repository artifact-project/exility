expect['addSnapshotSerializer']({
	test: (val) => /function|string/.test(typeof val),
	print: (val) => val.toString(),
});
