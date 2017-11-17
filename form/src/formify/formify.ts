import Block, {BlockClass} from '@exility/block';
import {FormContextConfig} from '../interfaces';
import {FormContext} from '../Context/Context';

export type FormifyAttrs<A, V> = A & {
	values: V;
	initialValues: V;
};

export default function formify<V extends object = {}, A = {}>(config: FormContextConfig<V>) {
	return (Target: BlockClass<A>): Block<FormifyAttrs<A, V>> => {
		return <any>class extends Block<FormifyAttrs<A, V>> {
			private formContext: FormContext<V>;

			static blocks = {FormBlock: Target};
			static template = `FormBlock[__attrs__=\${attrs}]`;

			constructor(attrs: FormifyAttrs<A, V>, options) {
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
	};
};
