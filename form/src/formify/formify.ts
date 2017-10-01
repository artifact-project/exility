import {ValidateRule, Validity} from '../rules/rules';
import Element from '../Element/Element';

export interface FormConfig {
	name?: string;
	elements: FormElementsConfig;
}

export interface FormElementsConfig {
	[name: string]: (options: FormElementTypeOptions) => FormElement;
}

export class FormElement {
	initialValue: string = '';
	initialChecked: boolean = false;
	initialSelectedIndex: number = 0;

	value: string = '';
	checked: boolean = false;
	selectedIndex: number = 0;

	get type(): string {
		return this.block.attrs.type;
	}

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

	active: boolean = false;
	changed: boolean = false;
	invalid: boolean = false;
	validity: Validity = null;
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
	private index = {};
	private validateLock: boolean = false;
	private validateRules: any = {};

	constructor() {
		this.validate = this.validate.bind(this);
	}

	get(name: string): string | boolean | number {
		return this.state[name];
	}

	register(block: Element) {
		const name = block.attrs.name;
		const element = new FormElement(this, block);

		this.index[block.cid] = element;
		(this.elements[name] || (this.elements[name] = [])).push(element);
	}

	unregister(block: Element) {
		delete this.elements[block.attrs.name];
	}

	handleEvent(block: Element, evt: Event) {
		const type = evt.type;
		const target = evt.target as (HTMLInputElement & HTMLSelectElement);
		const element = this.index[block.cid];
		const elements = this.elements[block.attrs.name];

		if (type === 'focus') {
			element.active = true;
		} else if (type === 'blur') {
			element.active = false;
			element.touched = true;
		}

		if (type === 'input' || type === 'change') {
			switch (element.type) {
				case 'select':
					element.value = target.value;
					element.selectedIndex = target.selectedIndex;
					break;

				case 'checkbox':
					element.checked = target.checked;
					break;

				case 'radio':
					elements.forEach(el => {
						el.checked = false;
						el.changed = el.initialChecked !== el.changed;
					});
					element.checked = target.checked;
					break;

				default:
					element.value = target.value;
					break;
			}

			element.changed = (
				element.initialValue !== element.value ||
				element.initialChecked !== element.changed ||
				element.initialSelectedIndex !== element.selectedIndex
			);
		}

		if (!this.validateLock) {
			this.validateLock = true;
			requestAnimationFrame(this.validate);
		}
	}

	validate() {
		const names = [];
		const values = Object.keys(this.index).reduce((values, key) => {
			const element = this.index[key];
			const {name, value, checked} = element;

			if (values.hasOwnProperty(name)) {
				values[name] = [].concat(values[name], value);
			} else {
				names.push(name);
				values[name] = value;
			}


			return values;
		}, {});

		names.forEach(name => {
			const validate = this.validateRules[name];
			const validity = validate ? validate({
				name,
				value: values[name],
			}) : null;

			// element.invalid = validity !== null;
			// element.validity = validity;
		});

		this.validateLock = false;
	}
}


// function formify(config: FormConfig): Form
// function formify(name: string, config: FormConfig): Form
// function formify(): Form {
// }
