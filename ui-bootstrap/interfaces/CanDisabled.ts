import regression from './_regression';

interface CanDisabled {
	disabled?: boolean;
}

export default CanDisabled;

regression<CanDisabled>('CanDisabled', {
	'disabled: undefined -> true': {
		initialData: {},
		initialTest(wrapper) {
			expect(wrapper.attr('disabled')).toBe(false);
			expect(wrapper.attr('aria-disabled')).toBe(null);
		},

		data: {disabled: true},
		test(wrapper) {
			expect(wrapper.attr('disabled')).toBe(true);
			expect(wrapper.attr('aria-disabled')).toBe('true');
		},
	},

	'disabled: true -> false': {
		initialData: {disabled: true},
		initialTest(wrapper) {
			expect(wrapper.attr('disabled')).toBe(true);
			expect(wrapper.attr('aria-disabled')).toBe('true');
		},

		data: {disabled: false},
		test(wrapper) {
			expect(wrapper.attr('disabled')).toBe(false);
			expect(wrapper.attr('aria-disabled')).toBe(null);
		},
	},
});
