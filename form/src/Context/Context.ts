import {SimpleDict, T} from '@artifact-project/i18n';
import Block from '@exility/block';


import {FormContextConfig, IFormContext, IFormElement, ValidateRule, Validity, ValueBox} from '../interfaces';
import {minLength, createSomeOf, required} from '../rules/rules';
import UIElement from '../ui/Element/Element';
import {debounce, F_IMPORTANT, F_NO_ARGS} from '@perf-tools/balancer';
import UIForm from '../ui/Form/Form';
import UIError from '../ui/Error/Error';

const RADIO_TYPE = 'radio';
const CHECKBOX_TYPE = 'checkbox';
const SELECT_TYPE = 'select';

const SUBMIT_EVENT_NAME = 'submit';
const RESET_EVENT_NAME = 'reset';

const FOCUS_EVENT_NAME = 'focus';
const BLUR_EVENT_NAME = 'blur';
const INPUT_EVENT_NAME = 'input';
const CHANGE_EVENT_NAME = 'change';

const EMPTY_ERRORS = {};

export class Element implements IFormElement {
	initialValue: string = '';
	initialChecked: boolean = false;
	initialSelectedIndex: number = 0;

	value: string = '';
	checked: boolean = false;
	selectedIndex: number = 0;

	get id(): string {
		return this.block.attrs.id;
	}

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
		return this.block.attrs.readOnly || this.form.locked;
	}

	get disabled(): boolean {
		return this.block.attrs.disabled;
	}

	get minLength(): number {
		return +this.block.attrs.minLength || -1;
	}

	get maxLength(): number {
		return +this.block.attrs.maxLength || -1;
	}

	errors: {[name: string]: Validity} = {};
	active: boolean = false;
	changed: boolean = false;
	invalid: boolean = false;
	touched: boolean = false;
	validity: Validity = null;

	private validateRule: ValidateRule;

	constructor(public form: FormContext, public block: UIElement) {
		const rules: ValidateRule[] = form.getValidateRule(this.name);

		if (this.required) {
			rules.push(required());
		}

		if (this.minLength >= 0) {
			rules.push(minLength(this.minLength));
		}

		this.validateRule = createSomeOf(rules);
	}

	validate(vbox: ValueBox): Validity {
		return this.validateRule(vbox);
	}

	forceUpdate() {
		this.block.forceUpdate();
	}
}

export class ElementsGroup {
	private list: Element[] = [];
	private extraValidaty: Validity = null;

	get validaty() {
		return this.extraValidaty || (this.length ? this.list[0].validity : null);
	}

	set validaty(value) {
		this.extraValidaty = value;
	}

	get active() {
		return this.hasFlag('active');
	}

	get invalid() {
		return this.hasFlag('invalid');
	}

	get touched() {
		return this.hasFlag('touched');
	}

	get changed() {
		return this.hasFlag('changed');
	}

	get length() {
		return this.list.length;
	}

	constructor() {
	}

	eq(index: number) {
		return this.list[index];
	}

	hasFlag(name: string): boolean {
		let idx = this.length;

		if (name === 'invalid' && this.extraValidaty) {
			return true;
		}

		if (idx) {
			if (idx === 1) {
				return this.list[0][name];
			}

			while (idx--) {
				if (this.list[idx][name]) {
					return true;
				}
			}
		}

		return false;
	}

	forEach(iterator: (el: Element, idx: number) => void, thisArg?: {}) {
		this.list.forEach(iterator, thisArg);
	}

	add(element: Element) {
		this.list.push(element);
	}

	remove(element: Element): boolean {
		const idx = this.list.indexOf(element);

		if (idx > -1) {
			this.list.splice(idx, 1);
			return true;
		} else {
			return false
		}
	}

	getErrorText(i18nDict?: SimpleDict) {
		if (this.length) {
			const validity = this.validaty;
			return T(validity, i18nDict);
		}
	}
}

export class FormContext<V = {}> {
	id: string;
	values: V = {};
	changed: boolean = false;
	invalid: boolean = false;
	locked: boolean = false;

	submitting: boolean = false;
	submitFailed: boolean = false;
	submitSucceeded: boolean = false;
	forceValidate: () => void;

	private initialValues: V = {};
	private config: FormContextConfig;

	private forms: UIForm[] = [];
	private errors: UIError[] = [];

	private elements: Element[] = [];
	private elementsGroups: {[name:string]: ElementsGroup} = {};
	private elementsIndex: {[cid:string]: Element} = {};

	private validateLock: boolean = false;
	private validateRules: any = {};

	constructor(initialValues: V, config: FormContextConfig) {
		this.initialValues = initialValues;
		this.config = config;

		this.forceValidate = this.validate;
		this.validate = <() => void>debounce(
			this.validate,
			this,
			[],
			{flags: F_NO_ARGS & F_IMPORTANT},
		);
	}

	setInitialValues(values: V) {
		this.initialValues = values;
	}

	lock() {
		this.locked = true;
		this.forceUpdateAll();
	}

	unlock() {
		this.locked = false;
		this.forceUpdateAll();
	}

	getValidateRule(name: string) {
		const {rules = {}} = this.config;
		return rules.hasOwnProperty(name) ? [rules[name]] : [];
	}

	getElementByLabel(name): UIElement {
		let element = this.elements.find(el => el.id === name);

		if (!element) {
			element = this.getElementsGroup(name).eq(0);
		}

		return element.block;
	}

	getElementsGroup(name) {
		let group = this.elementsGroups[name];

		if (group === void 0) {
			this.elementsGroups[name] = group = new ElementsGroup();
		}

		return group;
	}

	connectForm(form: UIForm) {
		this.forms.push(form);
	}

	disconnectForm(form: UIForm) {
		this.forms.splice(this.forms.indexOf(form), 1);
	}

	connectError(error: UIError) {
		// this.getElementsGroup(error.attrs.for).connectError(error);
		this.errors.push(error);
	}

	disconnectError(error: UIError) {
		// this.getElementsGroup(error.attrs.for).disconnectError(error);
	}

	connectElement(block: UIElement): Element {
		const {type, name} = block.attrs;
		const element = new Element(this, block);
		const elementsGroup = this.getElementsGroup(name);
		let {value} = block.attrs;
		let values = this.initialValues[name];

		if (!Array.isArray(values)) {
			values = values == null ? [] : [values];
		}

		if (type === CHECKBOX_TYPE || type === RADIO_TYPE) {
			if (value == null) {
				value = 'on';
			}

			element.checked = values.includes(value) || (block.attrs.checked !== null && block.attrs.checked);
		} else {
			const initialValue = values[elementsGroup.length];

			if (initialValue != null) {
				value = initialValue;
			}

			if (type === SELECT_TYPE) {
				element.selectedIndex = block.attrs.options.findIndex(opt => {
					return (opt.value == null ? opt.text : opt.value) == value;
				});
			}
		}

		element.value = value = (value == null ? '' : value + '');
		element.initialValue = element.value;
		element.initialChecked = element.checked;
		element.initialSelectedIndex = element.selectedIndex;

		elementsGroup.add(element);

		if (type === CHECKBOX_TYPE) {
			!this.values.hasOwnProperty(name) && (this.values[name] = []);
			element.checked && this.values[name].push(value);
		} else if (type === RADIO_TYPE) {
			!this.values.hasOwnProperty(name) && (this.values[name] = '');
			element.checked && (this.values[name] = value);
		} else {
			this.values[name] = value;
		}

		this.elements.push(element);
		this.elementsIndex[block.cid] = element;
		this.validate();

		return element;
	}

	disconnectElement(block: UIElement) {
		const element = this.elementsIndex[block.cid];
		const elementsGroup = this.elementsGroups[block.attrs.name];
		const idx = this.elements.indexOf(element);

		(idx > -1) && this.elements.splice(idx, 1);

		if (elementsGroup && elementsGroup.remove(element)) {
			delete this.elementsIndex[block.cid];
		} else {
			throw new Error('[@exility/form] Unregister unknown block');
		}

		this.validate();
	}

	handleEvent(block: UIElement, evt: Event) {
		const type = evt.type;
		const target = evt.target as (HTMLInputElement & HTMLSelectElement);
		const element = this.elementsIndex[block.cid];
		const elementsGroup = this.elementsGroups[block.attrs.name];

		if (elementsGroup === void 0 || elementsGroup.length === 0) {
			console.warn('[@exility/form] Finding unregister element');
			return;
		}

		if (type === SUBMIT_EVENT_NAME) {
			evt.preventDefault();
			this.forceValidate();

			if (!this.invalid) {
				this.submit(true);
			}
		} else if (type === RESET_EVENT_NAME) {
			throw new Error('todo: reset');
		} else if (type === FOCUS_EVENT_NAME) {
			element.active = true;
		} else if (type === BLUR_EVENT_NAME) {
			element.active = false;
			element.touched = true;
		} else if (type === INPUT_EVENT_NAME || type === CHANGE_EVENT_NAME) {
			switch (element.type) {
				case SELECT_TYPE:
					element.value = target.value;
					element.selectedIndex = target.selectedIndex;
					break;

				case CHECKBOX_TYPE:
					element.checked = target.checked;
					break;

				case RADIO_TYPE:
					elementsGroup.forEach(el => {
						if (el !== element) {
							el.checked = false;
							el.changed = el.initialChecked !== el.changed;
							el.forceUpdate();
						}
					});
					element.checked = target.checked;
					break;

				default:
					element.value = target.value;
					break;
			}

			element.changed = (
				element.initialValue !== element.value ||
				element.initialChecked !== element.checked ||
				element.initialSelectedIndex !== element.selectedIndex
			);
		}

		element.forceUpdate();
		this.validate();
	}

	private validate() {
		const names = []; // названия элементов
		const targets: Element[] = []; // цели валидации

		this.changed = false;

		// Значения вормы
		const values = Object.keys(this.elementsIndex).reduce((values, key) => {
			const element = this.elementsIndex[key];
			const {type, name, value, checked} = element;

			targets.push(element);

			if (element.changed) {
				this.changed = true;
			}

			if (values.hasOwnProperty(name)) {
				if (type === CHECKBOX_TYPE) {
					checked && values[name].push(value);
				} else if (type === RADIO_TYPE) {
					checked && (values[name] = value);
				} else {
					values[name] = [].concat(values[name], value);
				}
			} else {
				names.push(name);

				if (type === CHECKBOX_TYPE) {
					values[name] = checked ? [value] : [];
				} else {
					values[name] = (type !== RADIO_TYPE || checked) ? value : '';
				}
			}

			return values;
		}, {});

		this.invalid = false;

		// Валидируем все цели
		// todo: только те цели, для которых валидация в прицнипе нужна
		targets.forEach((element) => {
			const curInvalidState = element.invalid;

			element.errors = EMPTY_ERRORS;
			element.invalid = false;

			const vbox = {
				name: element.name,
				value: element.value,
				checked: element.checked,
				values,
			};

			// todo: Поддержка промиса
			const validity = element.validate(vbox);

			if (isThenable(validity)) {
				// todo: короче, это надо потом делать, пока лень
				// todo: Незабыть про таймауты при изменении invalid и forceUpdate
				validity.then((validity) => {
					setValidation(this, element, validity, curInvalidState);
				});
			} else {
				setValidation(this, element, validity, curInvalidState);
			}
		});

		// todo: Нужно не забыть, как быть, когда нет UIError для `validation`, т.е. нужен варнинг какой-то в консоль
		this.config.validation && Object.keys(this.config.validation).forEach(name => {
			const vbox = {
				name,
				value: null,
				checked: null,
				values,
			};
			const group = this.getElementsGroup(name);
			const validaty = this.config.validation[name](vbox);

			group.validaty = validaty;
			validaty && (this.invalid = true);
		});

		this.values = (values as V);
		this.validateLock = false;

		forceUpdateAll(this.forms);
		forceUpdateAll(this.errors);
	}

	private forceUpdateAll() {
		forceUpdateAll(this.forms);
		forceUpdateAll(this.errors);
		forceUpdateAll(this.elements);
	}

	private handleSubmitting(success) {
		this.submitting = false;
		this.submitSucceeded = success;
		this.submitFailed = !success;
		this.forceUpdateAll();
	}

	submit(withoutForceValidate = false) {
		if (!this.submitting) {
			!withoutForceValidate && this.forceValidate();

			this.submitting = true;
			this.forceUpdateAll();

			new Promise<any>(resolve => {
				resolve(this.config.submit(this.values, this));
			})
				.then(this.handleSubmitting.bind(this, true))
				.catch(this.handleSubmitting.bind(this, false))
			;
		}
	}
}

function forceUpdateAll(blocks: {forceUpdate(): void}[]) {
	switch (blocks.length) {
		case 1: forceUpdate(blocks[0]); break;
		default: blocks.forEach(forceUpdate);
	}
}

function forceUpdate(block: {forceUpdate(): void}) {
	block.forceUpdate();
}

function setValidation(form: FormContext, element: Element, validity: Validity, curInvalidState :boolean) {
	if (validity != null) {
		form.invalid = true;
		element.errors = {[validity.id]: validity};
		element.invalid = true;
		element.validity = validity;
	}

	(curInvalidState !== element.invalid) && element.forceUpdate();
}

function isThenable(validity: any): validity is Promise<Validity> {
	return !!(validity && typeof validity['then'] === 'function');
}
