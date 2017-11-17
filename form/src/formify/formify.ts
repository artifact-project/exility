import Block, {BlockClass} from '@exility/block';
import {FormContextConfig} from '../interfaces';
import {FormContext} from '../Context/Context';

export interface FormifyAttrs<V> {
	values: V;
	initialValues: V;
}

export default function formify<V = {}, A = {}>(config: FormContextConfig): (Target: BlockClass) => Block<FormifyAttrs<A, V>> {
	return class Formify extends Block<FormifyAttrs<A, V>> {
		private formContext: FormContext;

		constructor(attrs: FormifyAttrs<A>, options) {
			super(attrs, options);
			this.formContext = new FormContext<V>(attrs.initialValues, config);
		}

		getContextForNested() {
			return {$form: this.formContext};
		}

		attributeChangedCallback(name: string, newValue) {
			if (name === 'initialValues') {
				this.formContext.setInitialValues(newValue);
			}
		}
	};
}
