import * as required from './required.js';
import * as minlength from './minlength.js';
import * as maxlength from './maxlength.js';
import * as length from './length.js';
import * as range from './range.js';
import * as regex from './regex.js';
import * as email from './email.js';
import * as number from './number.js';
import * as equalto from './equalto.js';
import * as url from './url.js';

/**
 * All built-in validators.
 */
export const validators = [
  required,
  minlength,
  maxlength,
  length,
  range,
  regex,
  email,
  number,
  equalto,
  url
];

export { required, minlength, maxlength, length, range, regex, email, number, equalto, url };

