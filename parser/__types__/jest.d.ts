/// <reference types="jest"/>

declare namespace jest {
	interface Matchers<R> {
		toEqualFrag(actual: object): void;
	}
}
