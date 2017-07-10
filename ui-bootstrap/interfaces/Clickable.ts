import regression from './_regression';
import CanDisabled from './CanDisabled';

interface Clickable extends CanDisabled {
	'@click'?(evt: Event): void;
}

export default Clickable;

regression<Clickable>('Clickable', {
	'onClick': {
		initialData: {},
		initialTest(wrapper) {
			const log: MouseEvent[] = [];

			wrapper.on<MouseEvent>('click', (evt) => log.push(evt));
			wrapper.simulate('click');

			expect(log.length).toBe(1);
			expect(log[0].type).toBe('click');
		},

		data: {disabled: true},
		test(wrapper) {
			const log: MouseEvent[] = [];

			wrapper.on<MouseEvent>('click', (evt) => log.push(evt));
			wrapper.simulate('click');

			expect(log.length).toBe(0);
		},
	},
});
