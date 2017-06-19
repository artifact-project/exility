import {XNode} from '@exility/parser';
import stringifyParsedValue, {
	ParsedValue, StringValue,
	R_QUOTE_END, R_QUOTE_START
} from '../stringifyParsedValue/stringifyParsedValue';

function stringifyAttributeValue(name: string, values: ParsedValue[], escape?: string, node?: XNode): StringValue {
	const length = values.length;
	const glue = name === 'class' ? ' ' : '';

	let {value, computed} = stringifyParsedValue(values[0], escape, node);


	if (length > 1) {
		for (let i = 1; i < length; i++) {
			const next = stringifyParsedValue(values[i], escape, node);
			const nextValue = next.value;

			computed = computed || next.computed;

			if (R_QUOTE_END.test(value)) {
				// Добавляем вконец строки `glue`
				value = value.slice(0, -1) + glue +
						(R_QUOTE_START.test(nextValue)
							? nextValue.slice(1) // следующее значение тоже строка, так что отрезаем кавычку
							: `" + ${nextValue}` // возвращаем кавычку
						);
			} else if (R_QUOTE_START.test(nextValue)) {
				// Добавляем строку с `glue`
				value += ` + "${glue}${nextValue.slice(1)}`;
			} else {
				value += (glue ? ` + "${glue}" + ` : ' + ') + nextValue;
			}
		}
	}

	return {value, computed};
}

export default stringifyAttributeValue;
