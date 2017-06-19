import Block from '@exility/block';
import mountTo from '@exility/dom/src/mountTo/mountTo';
import Button from '@exility/ui-bootstrap/blocks/Button/Button';

class App extends Block<{username: string}> {
	static blocks = {Button};
	static template = `
		Button[
			@click="foo:click"
			value="Foo"
		]
	`;

	'@foo:click'(evt) {
		console.log('App:', evt);
	}
}

const app = new App({
	username: '%username%'
});


window['app'] = app;
mountTo(document.getElementById('root'), app);
