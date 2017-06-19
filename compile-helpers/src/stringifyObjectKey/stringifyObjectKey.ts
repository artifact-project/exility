const R_IS_OBJECT_KEY_NORMAL = /^[a-z0-9$_]+$/i;

export default function stringifyObjectKey(key: string): string {
	return R_IS_OBJECT_KEY_NORMAL.test(key) ? key : `${JSON.stringify(key)}`;
}
