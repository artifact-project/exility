export default function runBlockTest(fromString) {
	it('Icon', () => {
		const view = fromString(`
			Icon = [name]
				i.icon-\${name}
	
			Icon[name=\${x}]
		`, {x: 'foo'});

		expect(view.templateFactory).toMatchSnapshot();
		expect(view.container.innerHTML).toBe('<i class="icon-foo"></i>');

		view.update({x: 'bar'});
		expect(view.container.innerHTML).toBe('<i class="icon-bar"></i>');
	});

	it('Icon (short)', () => {
		const view = fromString(`
			Icon = [name] > i.icon-\${name}
	
			Icon[name=\${x}]
		`, {x: 'foo'});

		expect(view.templateFactory).toMatchSnapshot();
		expect(view.container.innerHTML).toBe('<i class="icon-foo"></i>');

		view.update({x: 'bar'});
		expect(view.container.innerHTML).toBe('<i class="icon-bar"></i>');
	});

	it('XIf', () => {
		const view = fromString(`
			XIf = [expr] > if (expr) > b
			
			XIf[expr=\${val}]
		`, {val: false});

		expect(view.container.innerHTML).toBe('');

		view.update({val: true});
		expect(view.container.innerHTML).toBe('<b></b>');

		view.update({val: false});
		expect(view.container.innerHTML).toBe('');
	});
}
