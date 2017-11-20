import Block, {BlockClass} from '@exility/block';
import {FormContextConfig} from '../interfaces';
import {FormContext} from '../Context/Context';

export type FormifyAttrs<A, V extends object> = A & {
	values?: V;
	initialValues?: V;
};

function factory<
	A,
	V extends object,
	R extends FormifyAttrs<A, V>
>(
	config: FormContextConfig<V>,
	FormBlock: BlockClass<A>,
): BlockClass<R> {
	class Formify extends Block<R> {
		private formContext: FormContext<V>;

		static blocks = {FormBlock};
		static template = `FormBlock[__attrs__=\${attrs}]`;

		constructor(attrs: R, options) {
			super(attrs, options);
		}

		getDefaults() {
			return {
				initialValues: {} as V,
			} as Partial<R>;
		}

		getContextForNested() {
			if (this.formContext === void 0) {
				this.formContext = new FormContext<V>(this.attrs.initialValues, config);
			}

			return {$form: this.formContext};
		}

		attributeChangedCallback(name: string, newValue) {
			if (name === 'initialValues') {
				this.formContext.setInitialValues(newValue);
			}
		}
	}

	return Formify;
}

export default function formify<
	V extends object = {},
	A = {}
>(config: FormContextConfig<V>) {
	return (FormBlock: any) => {
		return factory<A, V, FormifyAttrs<A, V>>(config, FormBlock);
	};
};
