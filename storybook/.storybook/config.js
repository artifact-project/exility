import {configure} from '@storybook/react';
import {setOptions} from '@storybook/addon-options';

// setOptions({
// 	name: 'UI Bootstrap / Exility storybook',
// });

configure(() => {
	const req = require.context('blocks/', true, /\.stories\.ts$/);
	req.keys().forEach(entry => req(entry));
}, module);
