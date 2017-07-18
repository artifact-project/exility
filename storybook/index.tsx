import * as React from 'react';
import { storiesOf as originalStoriesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { linkTo } from '@storybook/addon-links';

import wrap from './src/wrap/wrap';

export interface ISlots {
	[index: string]: string;
}

export interface ISpec<A> {
	attrs: A | A[];
	slots?: ISlots;
	events?: object;
}

export type Spec<A> = A | ISpec<A>;
export type ListSpec<A> = {[index:string]: Spec<A>[]};

function toSpec<A>(item: Spec<A>): ISpec<A> {
	let res: ISpec<A> = item as ISpec<A>;

	if (!(res.attrs || res.slots)) {
		res = {attrs: item as A, slots: null};
	}

	return res;
}

export function storiesOf(title, module) {
	const stories = originalStoriesOf(title, module);

	return {
		add<A>(title, Block, spec: Spec<A> | Spec<A>[]) {
			if (!Array.isArray(spec)) {
				spec = [toSpec<A>(spec)];
			}

			stories.add(title, () => (
				<div className="exility-storybook-items">
					{(spec as ISpec<A>[]).map((item, idx) => {
						const Wrapper = wrap(Block, item.slots, item.events);
						return <Wrapper key={idx} {...Object(item.attrs)}/>;
					})}
				</div>
			));

			return this;
		},

		addList<A>(title, Block, list: ListSpec<A>, blocks?: object) {
			stories.add(title, () => (<div className="exility-storybook-list">{Object.keys(list).map(subTitle => {

				return [].concat(list[subTitle]).map((item: ISpec<A>) => {
					const children = [];

					item = toSpec(item);

					[].concat(item.attrs).forEach((attrs, idx) => {
						const Wrapper = wrap(Block, item.slots, blocks, item.events);
						children.push(<Wrapper key={idx} {...attrs}/>);
					});

					return (
						<div key={subTitle} className="exility-storybook-list-item">
							<div className="exility-storybook-list-item-title">{subTitle}</div>
							<div className="exility-storybook-items">{children}</div>
						</div>
					);
				});

			})}</div>));

			return this;
		}
	};
}

export {
	action,
	linkTo,
};

export function createStore<A>(initial: A) {
	let state: A = {...Object(initial)};
	const listeners = [];

	return {
		getState() {
			return state;
		},

		subscribe(fn) {
			listeners.push(fn);

			return function unsubscribe() {
				listeners.splice(listeners.indexOf(fn), 1);
			};
		},

		update(patch: Partial<A>) {
			state = {
				...Object(state),
				...Object(patch),
			};

			listeners.forEach(fn => fn(this));
		}
	};
}
