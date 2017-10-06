import Block from '@exility/block';

export interface FormAttrs {
	name?: string;
	context?: FormContext;
}

export interface FormContext {
	handleEvent(event: KeyboardEvent);
}

export default class Form extends Block<FormAttrs, {$form: FormContext}> {
	static template = `
		const form = context.$form;
	
		form.form[
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
			
			class.submitting=\${form.submitting}
			class.submitFailed=\${form.submitFailed}
			class.submitSucceeded=\${form.submitSucceeded}
		]
			::children
	`;

	'@handleEvent'({originalEvent}) {
		this.context.$form.handleEvent(originalEvent);
	}
}
