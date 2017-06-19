import {Bone, IBone, BoneConstructor} from 'skeletik';

import xml from './src/xml/xml';
import exility from './src/exility/exility';
import expression from './src/expression/expression';
import * as utils from './src/utils/utils';

// Default
export default exility;

// All
export {
	xml,
	utils,
	exility,
	expression,
};

// XNode
export interface IXNode extends IBone {
}

export type XNodeConstructor = {
    new (name, raw): IXNode;
}

export class XNode extends Bone {}
