import {registerRegression, RegressionEnv, Regression, RegressionCases} from 'ibi';
import {mount, DOMWrapper} from '@exility/jacket';

export default function regression<T>(name: string, cases: RegressionCases<DOMWrapper, T, RegressionEnv>) {
	class UIRegression extends Regression<DOMWrapper, T, RegressionEnv> {
		factory(Class, data) {
			return mount(new Class(data));
		}

		update(wrapper, data) {
			wrapper.update(data);
		}

		getAll() {
			return cases;
		}
	}

	registerRegression(name, UIRegression);
}
