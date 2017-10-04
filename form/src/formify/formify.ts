import {ValidateRule, Validity} from '../rules/rules';
import Element from '../Element/Element';

const RADIO_TYPE = 'radio';
const CHECKBOX_TYPE = 'checkbox';
const SELECT_TYPE = 'select';

const FOCUS_EVENT_NAME = 'focus';
const BLUR_EVENT_NAME = 'blur';
const INPUT_EVENT_NAME = 'input';
const CHANGE_EVENT_NAME = 'change';

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
		return this.block.attrs.disabled;
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
		// this.initialValue = <string>this.form.get('value');
		// this.initialChecked = <boolean>this.form.get('checked');
		// this.initialSelectedIndex = <number>this.form.get('selectedIndex');
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

	private initialState = {};
	private elements = {};
	private elementsIndex = {};
	private validateLock: boolean = false;
	private validateRules: any = {};

	constructor() {
		this.validate = this.validate.bind(this);
	}

	register(block: Element) {
		const {type, name, value} = block.attrs;
		const element = new FormElement(this, block);
		const elementList = (this.elements[name] || (this.elements[name] = []));
		let values = this.initialState[name];

		if (!Array.isArray(values)) {
			this.initialState[name] = values = [values];
		}

		if (type === CHECKBOX_TYPE || type === RADIO_TYPE) {
			element.checked = values.indexOf(value) > -1;
		} else if (type === SELECT_TYPE) {
			element.selectedIndex = block.attrs.options.findIndex(opt => {
				return (opt.value == null ? opt.text : opt.value) == value;
			});
		} else {
			element.value = String(values.shift());
		}

		element.initialValue = element.value;
		element.initialChecked = element.checked;
		element.initialSelectedIndex = element.selectedIndex;

		this.elementsIndex[block.cid] = element;
		elementList.push(element);

	}

	unregister(block: Element) {
		const element = this.elementsIndex[block.cid];
		const elementList = this.elements[block.attrs.name];
		const idx = elementList.indexOf(element);

		if (idx >= 0) {
			elementList.splice(idx, 1);
			delete this.elementsIndex[block.cid];
		} else {
			throw new Error('Unregister for unknown block');
		}
	}

	handleEvent(block: Element, evt: Event) {
		const type = evt.type;
		const target = evt.target as (HTMLInputElement & HTMLSelectElement);
		const element = this.elementsIndex[block.cid];
		const elements = this.elements[block.attrs.name];

		if (type === FOCUS_EVENT_NAME) {
			element.active = true;
		} else if (type === BLUR_EVENT_NAME) {
			element.active = false;
			element.touched = true;
		}

		if (type === INPUT_EVENT_NAME || type === CHANGE_EVENT_NAME) {
			switch (element.type) {
				case SELECT_TYPE:
					element.value = target.value;
					element.selectedIndex = target.selectedIndex;
					break;

				case CHECKBOX_TYPE:
					element.checked = target.checked;
					break;

				case RADIO_TYPE:
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
		const values = Object.keys(this.elementsIndex).reduce((values, key) => {
			const element = this.elementsIndex[key];
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
