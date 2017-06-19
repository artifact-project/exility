/// <reference types="jest"/>

declare namespace jest {
	interface Matchers {
		toEqualFrag(actual: object): void;
	}
}
