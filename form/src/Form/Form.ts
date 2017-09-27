import Block from '@exility/block';

export interface FormAttrs {
	name?: string;
	context?: FormContext;
}

export interface FormContext {
	handleEvent(event: KeyboardEvent);
}

export default class Form extends Block<FormAttrs, {[index:string]: FormContext}> {
	static template = `
		form[
			@submit="handleEvent"
			@reset="handleEvent"
			@focus="handleEvent"
			@blur="handleEvent"
			@input="handleEvent"
			@change="handleEvent"
			@keydown="handleEvent"
			@keyup="handleEvent"
			@keypress="handleEvent"
			@cut="handleEvent"
			@copy="handleEvent"
			@paste="handleEvent"
		]
			::children
	`;

	getContextForNested() {
		return {
			$form: this.getContext(),
		};
	}

	'@handleEvent'({originalEvent}) {
		this.getContext().handleEvent(originalEvent);
	}

	getContext() {
		return (
			this.attrs.context ||
			this.context[`${this.attrs.name}`] ||
			this.context.$form
		);
	}
}
