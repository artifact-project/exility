import {configure} from '@storybook/react';
import {setOptions} from '@storybook/addon-options';

// setOptions({
// 	name: 'UI Bootstrap / Exility storybook',
// });

configure(function () {
	const req = require.context('blocks/', true, /\.stories\.ts$/);

	req.keys().forEach(function (entry) {
		req(entry)
	});
}, module);
