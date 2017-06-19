import {storiesOf, action, createStore} from '@exility/storybook';
import Breadcrumb, {IBreadcrumbAttrs} from './Breadcrumb';

const stories = storiesOf('Breadcrumb', module);

stories.add<IBreadcrumbAttrs>(
	'nav',
	Breadcrumb,
	{
		attrs: {items: [
			{href: '#home', text: 'Home'},
			{href: '#library', text: 'Library'},
			{href: '#Data', text: 'Data'},
		]}
	}
);
