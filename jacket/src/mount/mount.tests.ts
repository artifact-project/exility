import Block from '@exility/block';
import mount from './mount';

interface BtnAttrs {
	value: string;
	type?: string;
	disabled?: boolean;
}

class Btn extends Block<BtnAttrs, null> {
	static template = `
	button.btn[
		@click
		type=\${attrs.type}
		disabled=\${attrs.disabled}
		class.is-disabled=\${attrs.disabled}
	]
		i.icon[@mousedown="iconTap \${attrs}"]
		| \${attrs.value}
`;

	getDefaults() {
		return {
			type: 'button',
		};
	}
}

describe('api', () => {
	const eventsLog = [];
	const wrapper = mount(new Btn({value: 'Wow'}), {
		click(evt) {
			eventsLog.push(evt);
		},
		iconTap(evt) {
			eventsLog.push(evt);
		}
	});

	beforeEach(() => {
		eventsLog.length = 0;
	});

	it('html', () => {
		expect(wrapper.html()).toBe('<button class="btn " type="button"><i class=\"icon\"></i>Wow</button>');
	});

	it('text', () => {
		expect(wrapper.text()).toBe('Wow');
	});

	it('attr', () => {
		expect(wrapper.attr('disabled')).toBe(false);
	});

	it('attrs', () => {
		expect(wrapper.attrs()).toEqual({
			class: 'btn ',
			type: 'button'
		});
	});

	it('btn.simulate', () => {
		wrapper.simulate('click');

		expect(eventsLog.length).toBe(1);
		expect(eventsLog[0].type).toBe('click');
		expect(eventsLog[0].target).toBe(wrapper.target);
		expect(eventsLog[0].originalEvent.type).toBe('click');
	});

	it('find + simulate', () => {
		wrapper.find('.icon').simulate('mousedown');

		expect(eventsLog.length).toBe(1);
		expect(eventsLog[0].type).toBe('iconTap');
		expect(eventsLog[0].detail.attrs.value).toBe('Wow');
	});

	it('update', () => {
		wrapper.update({value: '!!!'});
		expect(wrapper.text()).toBe('!!!');
	});
});
