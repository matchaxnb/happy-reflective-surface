import french from './fr-fr.json';
import frenchNnv from './fr-nnv.json';
import english from './en-en.json';
import blueprint from './blueprint.json';

export const tpl = blueprint;
export const fr = french;
export const en = english;
export const nnv = frenchNnv;

const definitions = {
  'fr-fr': fr,
  'en-en': en,
  'fr-nnv': nnv,
  tpl
};

export default definitions;