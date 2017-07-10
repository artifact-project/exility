import {runRegression} from 'ibi';
import {getComponentInterfaces} from 'tx-reflector';
import regression from '../../interfaces/_regression';

import Button, {ButtonAttrs} from './Button';

regression<ButtonAttrs>('ButtonAttrs', {
});

describe('regression', () => {
	expect(getComponentInterfaces(Button)).toEqual([
		'ButtonAttrs',
		'CanDisabled',
		'Clickable',
	]);

	runRegression(
		getComponentInterfaces(Button),
		Button,
	);
});
