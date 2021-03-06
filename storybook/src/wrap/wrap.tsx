import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
	mountTo,
	runtimeBlockActivate,
} from '@exility/dom';
import Block from '@exility/block';

function stringifySlots(slots) {
	return Object.keys(slots).map(name => {
		const value = slots[name]
						.trim()
						.split('\n')
						.map(line => `\n    ${line.trim()}`)
						.join('')
					;

		return `  ::${name}${value}`;
	}).join('\n');
}

export default function wrap(Target, slots, blocks: object = {}, events = {}) {
	class TargetWithSlots extends Block<object> {
		static blocks = {Target, ...blocks};
		static template = 'Target[__attrs__=${attrs}]' + (
			slots
				? '\n' + stringifySlots(slots)
				: ''
		);
	}

	runtimeBlockActivate(TargetWithSlots);

	class ReactExilityWrapper extends React.Component<any, any> {
		block;
		displayName = Target.name;

		componentDidMount() {
			const root = ReactDOM.findDOMNode(this) as HTMLElement;

			this.block = new (TargetWithSlots as any)({...this.props}, {
				events: Object.keys(events).reduce((obj, name) => {
					obj[name] = {
						ctx: {[`@${name}`]: events[name]},
						fn: name,
					};
					return obj;
				}, {}),
			});

			mountTo(root, this.block);
		}

		componentDidUpdate() {
			const newAttrs = {...this.props};
			const defaults = this.block.getDefaults();

			Object.keys(this.block.attrs).forEach(name => {
				if (!newAttrs.hasOwnProperty(name)) {
					newAttrs[name] = defaults[name];
				}
			});

			this.block.update(newAttrs);
		}

		componentWillUnmount() {
			// todo: unmount;
		}

		render() {
			return <div/>;
		}
	}

	return ReactExilityWrapper as any;
}
