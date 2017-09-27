import {ValidateRule} from '../rules/rules';
import Element from '../Element/Element';

export interface FormConfig {
	name?: string;
	elements: FormElementsConfig;
}

export interface FormElementsConfig {
	[name: string]: (options: FormElementTypeOptions) => FormElement;
}

export class FormElement {
	value: string = '';
	checked: boolean = false;
	selectedIndex: number = 0;

	initialValue: string = '';
	initialChecked: boolean = false;
	initialSelectedIndex: number = 0;

	get name(): string {
		return this.block.attrs.name;
	}

	get required(): boolean {
		return this.block.attrs.required;
	}

	get readOnly(): boolean {
		return this.block.attrs.readOnly;
	}

	get disabled(): boolean {
		return this.block.attrs.readOnly;
	}

	get minLength(): number {
		return +this.block.attrs.minLength || 0;
	}

	get maxLength(): number {
		return +this.block.attrs.minLength || Number.POSITIVE_INFINITY;
	}

	get active(): boolean {
		return this.block.getRootNode() === document.activeElement;
	}

	changed: boolean = false;
	invalid: boolean = false;
	touched: boolean = false;

	constructor(public form: Form, public block: Element) {
		this.initialValue = <string>this.form.get('value');
		this.initialChecked = <boolean>this.form.get('checked');
		this.initialSelectedIndex = <number>this.form.get('selectedIndex');
	}
}

export interface FormElementTypeOptions {
	validate?: ValidateRule[];
}

export class Form {
	changed: boolean = false;
	invalid: boolean = false;

	submitting: boolean = false;
	submitFailed: boolean = false;
	submitSucceeded: boolean = false;

	private state = {};
	private elements = {};

	constructor() {
	}

	get(name: string): string | boolean | number {
		// return this.form.get(this.name, )
	}

	register(block: Element) {
		this.elements[block.attrs.name] = new FormElement(this, block);
	}

	unregister(block: Element) {
		delete this.elements[block.attrs.name];
	}
}


// function formify(config: FormConfig): Form
// function formify(name: string, config: FormConfig): Form
// function formify(): Form {
// }
