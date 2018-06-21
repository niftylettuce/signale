(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Signale = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

/*  ------------------------------------------------------------------------ */

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

const O = Object;

/*  See https://misc.flogisoft.com/bash/tip_colors_and_formatting
    ------------------------------------------------------------------------ */

const colorCodes = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'lightGray', '', 'default'],
      colorCodesLight = ['darkGray', 'lightRed', 'lightGreen', 'lightYellow', 'lightBlue', 'lightMagenta', 'lightCyan', 'white', ''],
      styleCodes = ['', 'bright', 'dim', 'italic', 'underline', '', '', 'inverse'],
      asBright = { 'red': 'lightRed',
    'green': 'lightGreen',
    'yellow': 'lightYellow',
    'blue': 'lightBlue',
    'magenta': 'lightMagenta',
    'cyan': 'lightCyan',
    'black': 'darkGray',
    'lightGray': 'white' },
      types = { 0: 'style',
    2: 'unstyle',
    3: 'color',
    9: 'colorLight',
    4: 'bgColor',
    10: 'bgColorLight' },
      subtypes = { color: colorCodes,
    colorLight: colorCodesLight,
    bgColor: colorCodes,
    bgColorLight: colorCodesLight,
    style: styleCodes,
    unstyle: styleCodes

    /*  ------------------------------------------------------------------------ */

};const clean = obj => {
    for (const k in obj) {
        if (!obj[k]) {
            delete obj[k];
        }
    }
    return O.keys(obj).length === 0 ? undefined : obj;
};

/*  ------------------------------------------------------------------------ */

class Color {

    constructor(background, name, brightness) {

        this.background = background;
        this.name = name;
        this.brightness = brightness;
    }

    get inverse() {
        return new Color(!this.background, this.name || (this.background ? 'black' : 'white'), this.brightness);
    }

    get clean() {
        return clean({ name: this.name === 'default' ? '' : this.name,
            bright: this.brightness === Code.bright,
            dim: this.brightness === Code.dim });
    }

    defaultBrightness(value) {

        return new Color(this.background, this.name, this.brightness || value);
    }

    css(inverted) {

        const color = inverted ? this.inverse : this;

        const rgbName = color.brightness === Code.bright && asBright[color.name] || color.name;

        const prop = color.background ? 'background:' : 'color:',
              rgb = Colors.rgb[rgbName],
              alpha = this.brightness === Code.dim ? 0.5 : 1;

        return rgb ? prop + 'rgba(' + [].concat(_toConsumableArray(rgb), [alpha]).join(',') + ');' : !color.background && alpha < 1 ? 'color:rgba(0,0,0,0.5);' : ''; // Chrome does not support 'opacity' property...
    }
}

/*  ------------------------------------------------------------------------ */

class Code {

    constructor(n) {
        if (n !== undefined) {
            this.value = Number(n);
        }
    }

    get type() {
        return types[Math.floor(this.value / 10)];
    }

    get subtype() {
        return subtypes[this.type][this.value % 10];
    }

    get str() {
        return this.value ? '\u001b\[' + this.value + 'm' : '';
    }

    static str(x) {
        return new Code(x).str;
    }

    get isBrightness() {
        return this.value === Code.noBrightness || this.value === Code.bright || this.value === Code.dim;
    }
}

/*  ------------------------------------------------------------------------ */

O.assign(Code, {

    bright: 1,
    dim: 2,
    inverse: 7,
    noBrightness: 22,
    noItalic: 23,
    noUnderline: 24,
    noInverse: 27,
    noColor: 39,
    noBgColor: 49
});

/*  ------------------------------------------------------------------------ */

const replaceAll = (str, a, b) => str.split(a).join(b);

/*  ANSI brightness codes do not overlap, e.g. "{bright}{dim}foo" will be rendered bright (not dim).
    So we fix it by adding brightness canceling before each brightness code, so the former example gets
    converted to "{noBrightness}{bright}{noBrightness}{dim}foo" – this way it gets rendered as expected.
 */

const denormalizeBrightness = s => s.replace(/(\u001b\[(1|2)m)/g, '\u001b[22m$1');
const normalizeBrightness = s => s.replace(/\u001b\[22m(\u001b\[(1|2)m)/g, '$1');

const wrap = (x, openCode, closeCode) => {

    const open = Code.str(openCode),
          close = Code.str(closeCode);

    return String(x).split('\n').map(line => denormalizeBrightness(open + replaceAll(normalizeBrightness(line), close, open) + close)).join('\n');
};

/*  ------------------------------------------------------------------------ */

const camel = (a, b) => a + b.charAt(0).toUpperCase() + b.slice(1);

const stringWrappingMethods = (() => [].concat(_toConsumableArray(colorCodes.map((k, i) => !k ? [] : [// color methods

[k, 30 + i, Code.noColor], [camel('bg', k), 40 + i, Code.noBgColor]])), _toConsumableArray(colorCodesLight.map((k, i) => !k ? [] : [// light color methods

[k, 90 + i, Code.noColor], [camel('bg', k), 100 + i, Code.noBgColor]])), _toConsumableArray(['', 'BrightRed', 'BrightGreen', 'BrightYellow', 'BrightBlue', 'BrightMagenta', 'BrightCyan'].map((k, i) => !k ? [] : [['bg' + k, 100 + i, Code.noBgColor]])), _toConsumableArray(styleCodes.map((k, i) => !k ? [] : [// style methods

[k, i, k === 'bright' || k === 'dim' ? Code.noBrightness : 20 + i]]))).reduce((a, b) => a.concat(b)))();

/*  ------------------------------------------------------------------------ */

const assignStringWrappingAPI = function (target) {
    let wrapBefore = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : target;
    return stringWrappingMethods.reduce((memo, _ref) => {
        var _ref2 = _slicedToArray(_ref, 3);

        let k = _ref2[0],
            open = _ref2[1],
            close = _ref2[2];
        return O.defineProperty(memo, k, {
            get: () => assignStringWrappingAPI(str => wrapBefore(wrap(str, open, close)))
        });
    }, target);
};

/*  ------------------------------------------------------------------------ */

/**
 * Represents an ANSI-escaped string.
 */
class Colors {

    /**
     * @param {string} s a string containing ANSI escape codes.
     */
    constructor(s) {

        if (s) {

            const r = /\u001b\[(\d+)m/g;

            const spans = s.split(/\u001b\[\d+m/);
            const codes = [];

            for (let match; match = r.exec(s);) codes.push(match[1]);

            this.spans = spans.map((s, i) => ({ text: s, code: new Code(codes[i]) }));
        } else {
            this.spans = [];
        }
    }

    get str() {
        return this.spans.reduce((str, p) => str + p.text + p.code.str, '');
    }

    get parsed() {

        var color = new Color(),
            bgColor = new Color(true /* background */),
            brightness = undefined,
            styles = new Set();

        return O.assign(new Colors(), {

            spans: this.spans.map(span => {

                const c = span.code;

                const inverted = styles.has('inverse'),
                      underline = styles.has('underline') ? 'text-decoration: underline;' : '',
                      italic = styles.has('italic') ? 'font-style: italic;' : '',
                      bold = brightness === Code.bright ? 'font-weight: bold;' : '';

                const foreColor = color.defaultBrightness(brightness);

                const styledSpan = O.assign({ css: bold + italic + underline + foreColor.css(inverted) + bgColor.css(inverted) }, clean({ bold: !!bold, color: foreColor.clean, bgColor: bgColor.clean }), span);

                for (const k of styles) {
                    styledSpan[k] = true;
                }

                if (c.isBrightness) {

                    brightness = c.value;
                } else {

                    switch (span.code.type) {

                        case 'color':
                        case 'colorLight':
                            color = new Color(false, c.subtype);break;

                        case 'bgColor':
                        case 'bgColorLight':
                            bgColor = new Color(true, c.subtype);break;

                        case 'style':
                            styles.add(c.subtype);break;
                        case 'unstyle':
                            styles.delete(c.subtype);break;
                    }
                }

                return styledSpan;
            }).filter(s => s.text.length > 0)
        });
    }

    /*  Outputs with Chrome DevTools-compatible format     */

    get asChromeConsoleLogArguments() {

        const spans = this.parsed.spans;

        return [spans.map(s => '%c' + s.text).join('')].concat(_toConsumableArray(spans.map(s => s.css)));
    }

    get browserConsoleArguments() /* LEGACY, DEPRECATED */{
        return this.asChromeConsoleLogArguments;
    }

    /**
     * @desc installs String prototype extensions
     * @example
     * require ('ansicolor').nice
     * console.log ('foo'.bright.red)
     */
    static get nice() {

        Colors.names.forEach(k => {
            if (!(k in String.prototype)) {
                O.defineProperty(String.prototype, k, { get: function () {
                        return Colors[k](this);
                    } });
            }
        });

        return Colors;
    }

    /**
     * @desc parses a string containing ANSI escape codes
     * @return {Colors} parsed representation.
     */
    static parse(s) {
        return new Colors(s).parsed;
    }

    /**
     * @desc strips ANSI codes from a string
     * @param {string} s a string containing ANSI escape codes.
     * @return {string} clean string.
     */
    static strip(s) {
        return s.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-PRZcf-nqry=><]/g, ''); // hope V8 caches the regexp
    }

    /**
     * @example
     * const spans = [...ansi.parse ('\u001b[7m\u001b[7mfoo\u001b[7mbar\u001b[27m')]
     */
    [Symbol.iterator]() {
        return this.spans[Symbol.iterator]();
    }
}

/*  ------------------------------------------------------------------------ */

assignStringWrappingAPI(Colors, str => str);

/*  ------------------------------------------------------------------------ */

Colors.names = stringWrappingMethods.map((_ref3) => {
    var _ref4 = _slicedToArray(_ref3, 1);

    let k = _ref4[0];
    return k;
});

/*  ------------------------------------------------------------------------ */

Colors.rgb = {

    black: [0, 0, 0],
    darkGray: [100, 100, 100],
    lightGray: [200, 200, 200],
    white: [255, 255, 255],

    red: [204, 0, 0],
    lightRed: [255, 51, 0],

    green: [0, 204, 0],
    lightGreen: [51, 204, 51],

    yellow: [204, 102, 0],
    lightYellow: [255, 153, 51],

    blue: [0, 0, 255],
    lightBlue: [26, 140, 255],

    magenta: [204, 0, 204],
    lightMagenta: [255, 0, 255],

    cyan: [0, 153, 255],
    lightCyan: [0, 204, 255]

    /*  ------------------------------------------------------------------------ */

};module.exports = Colors;

/*  ------------------------------------------------------------------------ */

},{}],2:[function(require,module,exports){
(function (global){
'use strict';

// compare and isBuffer taken from https://github.com/feross/buffer/blob/680e9e5e488f22aac27599a57dc844a6315928dd/index.js
// original notice:

/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
function compare(a, b) {
  if (a === b) {
    return 0;
  }

  var x = a.length;
  var y = b.length;

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break;
    }
  }

  if (x < y) {
    return -1;
  }
  if (y < x) {
    return 1;
  }
  return 0;
}
function isBuffer(b) {
  if (global.Buffer && typeof global.Buffer.isBuffer === 'function') {
    return global.Buffer.isBuffer(b);
  }
  return !!(b != null && b._isBuffer);
}

// based on node assert, original notice:

// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var util = require('util/');
var hasOwn = Object.prototype.hasOwnProperty;
var pSlice = Array.prototype.slice;
var functionsHaveNames = (function () {
  return function foo() {}.name === 'foo';
}());
function pToString (obj) {
  return Object.prototype.toString.call(obj);
}
function isView(arrbuf) {
  if (isBuffer(arrbuf)) {
    return false;
  }
  if (typeof global.ArrayBuffer !== 'function') {
    return false;
  }
  if (typeof ArrayBuffer.isView === 'function') {
    return ArrayBuffer.isView(arrbuf);
  }
  if (!arrbuf) {
    return false;
  }
  if (arrbuf instanceof DataView) {
    return true;
  }
  if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
    return true;
  }
  return false;
}
// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

var regex = /\s*function\s+([^\(\s]*)\s*/;
// based on https://github.com/ljharb/function.prototype.name/blob/adeeeec8bfcc6068b187d7d9fb3d5bb1d3a30899/implementation.js
function getName(func) {
  if (!util.isFunction(func)) {
    return;
  }
  if (functionsHaveNames) {
    return func.name;
  }
  var str = func.toString();
  var match = str.match(regex);
  return match && match[1];
}
assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  } else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = getName(stackStartFunction);
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function truncate(s, n) {
  if (typeof s === 'string') {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}
function inspect(something) {
  if (functionsHaveNames || !util.isFunction(something)) {
    return util.inspect(something);
  }
  var rawname = getName(something);
  var name = rawname ? ': ' + rawname : '';
  return '[Function' +  name + ']';
}
function getMessage(self) {
  return truncate(inspect(self.actual), 128) + ' ' +
         self.operator + ' ' +
         truncate(inspect(self.expected), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

assert.deepStrictEqual = function deepStrictEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'deepStrictEqual', assert.deepStrictEqual);
  }
};

function _deepEqual(actual, expected, strict, memos) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;
  } else if (isBuffer(actual) && isBuffer(expected)) {
    return compare(actual, expected) === 0;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if ((actual === null || typeof actual !== 'object') &&
             (expected === null || typeof expected !== 'object')) {
    return strict ? actual === expected : actual == expected;

  // If both values are instances of typed arrays, wrap their underlying
  // ArrayBuffers in a Buffer each to increase performance
  // This optimization requires the arrays to have the same type as checked by
  // Object.prototype.toString (aka pToString). Never perform binary
  // comparisons for Float*Arrays, though, since e.g. +0 === -0 but their
  // bit patterns are not identical.
  } else if (isView(actual) && isView(expected) &&
             pToString(actual) === pToString(expected) &&
             !(actual instanceof Float32Array ||
               actual instanceof Float64Array)) {
    return compare(new Uint8Array(actual.buffer),
                   new Uint8Array(expected.buffer)) === 0;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else if (isBuffer(actual) !== isBuffer(expected)) {
    return false;
  } else {
    memos = memos || {actual: [], expected: []};

    var actualIndex = memos.actual.indexOf(actual);
    if (actualIndex !== -1) {
      if (actualIndex === memos.expected.indexOf(expected)) {
        return true;
      }
    }

    memos.actual.push(actual);
    memos.expected.push(expected);

    return objEquiv(actual, expected, strict, memos);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b, strict, actualVisitedObjects) {
  if (a === null || a === undefined || b === null || b === undefined)
    return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b))
    return a === b;
  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
    return false;
  var aIsArgs = isArguments(a);
  var bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b, strict);
  }
  var ka = objectKeys(a);
  var kb = objectKeys(b);
  var key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length !== kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] !== kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key], strict, actualVisitedObjects))
      return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

assert.notDeepStrictEqual = notDeepStrictEqual;
function notDeepStrictEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'notDeepStrictEqual', notDeepStrictEqual);
  }
}


// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  }

  try {
    if (actual instanceof expected) {
      return true;
    }
  } catch (e) {
    // Ignore.  The instanceof check doesn't work for arrow functions.
  }

  if (Error.isPrototypeOf(expected)) {
    return false;
  }

  return expected.call({}, actual) === true;
}

function _tryBlock(block) {
  var error;
  try {
    block();
  } catch (e) {
    error = e;
  }
  return error;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (typeof block !== 'function') {
    throw new TypeError('"block" argument must be a function');
  }

  if (typeof expected === 'string') {
    message = expected;
    expected = null;
  }

  actual = _tryBlock(block);

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  var userProvidedMessage = typeof message === 'string';
  var isUnwantedException = !shouldThrow && util.isError(actual);
  var isUnexpectedException = !shouldThrow && actual && !expected;

  if ((isUnwantedException &&
      userProvidedMessage &&
      expectedException(actual, expected)) ||
      isUnexpectedException) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws(true, block, error, message);
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
  _throws(false, block, error, message);
};

assert.ifError = function(err) { if (err) throw err; };

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"util/":5}],3:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],4:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],5:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./support/isBuffer":4,"_process":45,"inherits":3}],6:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  for (var i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],7:[function(require,module,exports){

},{}],8:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],9:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  get: function () {
    if (!(this instanceof Buffer)) {
      return undefined
    }
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  get: function () {
    if (!(this instanceof Buffer)) {
      return undefined
    }
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('Invalid typed array length')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (isArrayBuffer(value) || (value && isArrayBuffer(value.buffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  return fromObject(value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj) {
    if (ArrayBuffer.isView(obj) || 'length' in obj) {
      if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
        return createBuffer(0)
      }
      return fromArrayLike(obj)
    }

    if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
      return fromArrayLike(obj.data)
    }
  }

  throw new TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object.')
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (ArrayBuffer.isView(buf)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isArrayBuffer(string)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : new Buffer(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffers from another context (i.e. an iframe) do not pass the `instanceof` check
// but they should be treated as valid. See: https://github.com/feross/buffer/issues/166
function isArrayBuffer (obj) {
  return obj instanceof ArrayBuffer ||
    (obj != null && obj.constructor != null && obj.constructor.name === 'ArrayBuffer' &&
      typeof obj.byteLength === 'number')
}

function numberIsNaN (obj) {
  return obj !== obj // eslint-disable-line no-self-compare
}

},{"base64-js":6,"ieee754":28}],10:[function(require,module,exports){
(function (process){
"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _instanceof(left, right) { if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) { return right[Symbol.hasInstance](left); } else { return left instanceof right; } }

var escapeStringRegexp = require('escape-string-regexp');

var ansiStyles = require('ansi-styles');

var stdoutColor = require('supports-color').stdout; // determine if we're in a browser


var isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined'; // if we're in a browser then we DO support colors
// but we need to make it aware to users that they need to
// use ansicolor <https://github.com/xpl/ansicolor>

if (isBrowser) stdoutColor = {
  level: 3,
  hasBasic: true,
  has256: true,
  has16m: true
};

var template = require('./templates.js');

var isSimpleWindowsTerm = process.platform === 'win32' && !(process.env.TERM || '').toLowerCase().startsWith('xterm'); // `supportsColor.level` → `ansiStyles.color[name]` mapping

var levelMapping = ['ansi', 'ansi', 'ansi256', 'ansi16m']; // `color-convert` models to exclude from the Chalk API due to conflicts

var skipModels = new Set(['gray']);
var styles = Object.create(null);

function applyOptions(obj, options) {
  options = options || {}; // Detect level if not set manually

  var scLevel = stdoutColor ? stdoutColor.level : 0;
  obj.level = options.level === undefined ? scLevel : options.level;
  obj.enabled = 'enabled' in options ? options.enabled : obj.level > 0;
}

function Chalk(options) {
  // We check for this.template here since calling `chalk.constructor()`
  // by itself will have a `this` of a previously constructed chalk object
  if (!this || !_instanceof(this, Chalk) || this.template) {
    var chalk = {};
    applyOptions(chalk, options);

    chalk.template = function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return chalkTag.apply(void 0, _toConsumableArray([chalk.template].concat(args)));
    };

    Object.setPrototypeOf(chalk, Chalk.prototype);
    Object.setPrototypeOf(chalk.template, chalk);
    chalk.template.constructor = Chalk;
    return chalk.template;
  }

  applyOptions(this, options);
} // Use bright blue on Windows as the normal blue color is illegible


if (isSimpleWindowsTerm) {
  ansiStyles.blue.open = "\x1B[94m";
}

var _arr = Object.keys(ansiStyles);

var _loop = function _loop() {
  var key = _arr[_i];
  ansiStyles[key].closeRe = new RegExp(escapeStringRegexp(ansiStyles[key].close), 'g');
  styles[key] = {
    get: function get() {
      var codes = ansiStyles[key];
      return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, key);
    }
  };
};

for (var _i = 0; _i < _arr.length; _i++) {
  _loop();
}

styles.visible = {
  get: function get() {
    return build.call(this, this._styles || [], true, 'visible');
  }
};
ansiStyles.color.closeRe = new RegExp(escapeStringRegexp(ansiStyles.color.close), 'g');

var _arr2 = Object.keys(ansiStyles.color.ansi);

var _loop2 = function _loop2() {
  var model = _arr2[_i2];

  if (skipModels.has(model)) {
    return "continue";
  }

  styles[model] = {
    get: function get() {
      var level = this.level;
      return function () {
        for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
          args[_key3] = arguments[_key3];
        }

        var open = ansiStyles.color[levelMapping[level]][model].apply(null, args);
        var codes = {
          open: open,
          close: ansiStyles.color.close,
          closeRe: ansiStyles.color.closeRe
        };
        return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, model);
      };
    }
  };
};

for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
  var _ret = _loop2();

  if (_ret === "continue") continue;
}

ansiStyles.bgColor.closeRe = new RegExp(escapeStringRegexp(ansiStyles.bgColor.close), 'g');

var _arr3 = Object.keys(ansiStyles.bgColor.ansi);

var _loop3 = function _loop3() {
  var model = _arr3[_i3];

  if (skipModels.has(model)) {
    return "continue";
  }

  var bgModel = 'bg' + model[0].toUpperCase() + model.slice(1);
  styles[bgModel] = {
    get: function get() {
      var level = this.level;
      return function () {
        for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
          args[_key4] = arguments[_key4];
        }

        var open = ansiStyles.bgColor[levelMapping[level]][model].apply(null, args);
        var codes = {
          open: open,
          close: ansiStyles.bgColor.close,
          closeRe: ansiStyles.bgColor.closeRe
        };
        return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, model);
      };
    }
  };
};

for (var _i3 = 0; _i3 < _arr3.length; _i3++) {
  var _ret2 = _loop3();

  if (_ret2 === "continue") continue;
}

var proto = Object.defineProperties(function () {}, styles);

function build(_styles, _empty, key) {
  var builder = function builder() {
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    return applyStyle.apply(builder, args);
  };

  builder._styles = _styles;
  builder._empty = _empty;
  var self = this;
  Object.defineProperty(builder, 'level', {
    enumerable: true,
    get: function get() {
      return self.level;
    },
    set: function set(level) {
      self.level = level;
    }
  });
  Object.defineProperty(builder, 'enabled', {
    enumerable: true,
    get: function get() {
      return self.enabled;
    },
    set: function set(enabled) {
      self.enabled = enabled;
    }
  }); // See below for fix regarding invisible grey/dim combination on Windows

  builder.hasGrey = this.hasGrey || key === 'gray' || key === 'grey'; // `__proto__` is used because we must return a function, but there is
  // no way to create a function with a different prototype

  builder.__proto__ = proto; // eslint-disable-line no-proto

  return builder;
}

function applyStyle() {
  // Support varags, but simply cast to string in case there's only one arg
  var argsLen = arguments.length;
  var str = String(arguments.length <= 0 ? undefined : arguments[0]);

  if (argsLen === 0) {
    return '';
  }

  if (argsLen > 1) {
    // Don't slice `arguments`, it prevents V8 optimizations
    for (var a = 1; a < argsLen; a++) {
      str += ' ' + (a < 0 || arguments.length <= a ? undefined : arguments[a]);
    }
  }

  if (!this.enabled || this.level <= 0 || !str) {
    return this._empty ? '' : str;
  } // Turns out that on Windows dimmed gray text becomes invisible in cmd.exe,
  // see https://github.com/chalk/chalk/issues/58
  // If we're on Windows and we're dealing
  // with a gray color, temporarily make 'dim' a noop.


  var originalDim = ansiStyles.dim.open;

  if (isSimpleWindowsTerm && this.hasGrey) {
    ansiStyles.dim.open = '';
  }

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = this._styles.slice().reverse()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var code = _step.value;
      // Replace any instances already present with a re-opening code
      // otherwise only the part of the string until said closing code
      // will be colored, and the rest will simply be 'plain'.
      str = code.open + str.replace(code.closeRe, code.open) + code.close; // Close the styling before a linebreak and reopen
      // after next line to fix a bleed issue on macOS
      // https://github.com/chalk/chalk/pull/92

      str = str.replace(/\r?\n/g, "".concat(code.close, "$&").concat(code.open));
    } // Reset the original `dim` if we changed it to
    // work around the Windows dimmed gray issue

  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return != null) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  ansiStyles.dim.open = originalDim;
  return str;
}

function chalkTag(chalk, strings) {
  if (!Array.isArray(strings)) {
    // If chalk() was called by itself or with a string,
    // return the string itself as a string.
    //
    // TODO: fix rest params later
    // eslint-disable-next-line prefer-rest-params
    return [].slice.call(arguments, 1).join(' ');
  } // TODO: fix rest params later
  // eslint-disable-next-line prefer-rest-params


  var args = [].slice.call(arguments, 2);
  var parts = [strings.raw[0]];

  for (var i = 1; i < strings.length; i++) {
    parts.push(String(args[i - 1]).replace(/[{}\\]/g, '\\$&'));
    parts.push(String(strings.raw[i]));
  }

  return template(chalk, parts.join(''));
}

Object.defineProperties(Chalk.prototype, styles);
module.exports = Chalk(); // eslint-disable-line new-cap

module.exports.supportsColor = stdoutColor;
module.exports.default = module.exports; // For TypeScript

}).call(this,require('_process'))

},{"./templates.js":11,"_process":45,"ansi-styles":12,"escape-string-regexp":20,"supports-color":63}],11:[function(require,module,exports){
"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

// eslint-disable-next-line max-len
var TEMPLATE_REGEX = /(?:\\(u[a-f\d]{4}|x[a-f\d]{2}|.))|(?:\{(~)?(\w+(?:\([^)]*\))?(?:\.\w+(?:\([^)]*\))?)*)(?:[ \t]|(?=\r?\n)))|(\})|((?:.|[\r\n\f])+?)/gi;
var STYLE_REGEX = /(?:^|\.)(\w+)(?:\(([^)]*)\))?/g;
var STRING_REGEX = /^(['"])((?:\\.|(?!\1)[^\\])*)\1$/;
var ESCAPE_REGEX = /\\(u[a-f\d]{4}|x[a-f\d]{2}|.)|([^\\])/gi;
var ESCAPES = new Map([['n', '\n'], ['r', '\r'], ['t', '\t'], ['b', '\b'], ['f', '\f'], ['v', '\v'], ['0', '\0'], ['\\', '\\'], ['e', "\x1B"], ['a', "\x07"]]);

function unescape(c) {
  if (c[0] === 'u' && c.length === 5 || c[0] === 'x' && c.length === 3) {
    return String.fromCharCode(parseInt(c.slice(1), 16));
  }

  return ESCAPES.get(c) || c;
}

function parseArguments(name, args) {
  var results = [];
  var chunks = args.trim().split(/\s*,\s*/g);
  var matches;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = chunks[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var chunk = _step.value;

      if (!isNaN(chunk)) {
        results.push(Number(chunk));
      } else if (matches = chunk.match(STRING_REGEX)) {
        results.push(matches[2].replace(ESCAPE_REGEX, function (m, escape, chr) {
          return escape ? unescape(escape) : chr;
        }));
      } else {
        throw new Error("Invalid Chalk template style argument: ".concat(chunk, " (in style '").concat(name, "')"));
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return != null) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return results;
}

function parseStyle(style) {
  STYLE_REGEX.lastIndex = 0;
  var results = [];
  var matches;

  while ((matches = STYLE_REGEX.exec(style)) !== null) {
    var name = matches[1];

    if (matches[2]) {
      var args = parseArguments(name, matches[2]);
      results.push([name].concat(args));
    } else {
      results.push([name]);
    }
  }

  return results;
}

function buildStyle(chalk, styles) {
  var enabled = {};
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = styles[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var layer = _step2.value;
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = layer.styles[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var style = _step3.value;
          enabled[style[0]] = layer.inverse ? null : style.slice(1);
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  var current = chalk;

  var _arr = Object.keys(enabled);

  for (var _i = 0; _i < _arr.length; _i++) {
    var styleName = _arr[_i];

    if (Array.isArray(enabled[styleName])) {
      if (!(styleName in current)) {
        throw new Error("Unknown Chalk style: ".concat(styleName));
      }

      if (enabled[styleName].length > 0) {
        var _current;

        current = (_current = current)[styleName].apply(_current, _toConsumableArray(enabled[styleName]));
      } else {
        current = current[styleName];
      }
    }
  }

  return current;
}

module.exports = function (chalk, tmp) {
  var styles = [];
  var chunks = [];
  var chunk = []; // eslint-disable-next-line max-params

  tmp.replace(TEMPLATE_REGEX, function (m, escapeChar, inverse, style, close, chr) {
    if (escapeChar) {
      chunk.push(unescape(escapeChar));
    } else if (style) {
      var str = chunk.join('');
      chunk = [];
      chunks.push(styles.length === 0 ? str : buildStyle(chalk, styles)(str));
      styles.push({
        inverse: inverse,
        styles: parseStyle(style)
      });
    } else if (close) {
      if (styles.length === 0) {
        throw new Error('Found extraneous } in Chalk template literal');
      }

      chunks.push(buildStyle(chalk, styles)(chunk.join('')));
      chunk = [];
      styles.pop();
    } else {
      chunk.push(chr);
    }
  });
  chunks.push(chunk.join(''));

  if (styles.length > 0) {
    var errMsg = "Chalk template literal is missing ".concat(styles.length, " closing bracket").concat(styles.length === 1 ? '' : 's', " (`}`)");
    throw new Error(errMsg);
  }

  return chunks.join('');
};

},{}],12:[function(require,module,exports){
"use strict";

var colorConvert = require('color-convert');

var wrapAnsi16 = function wrapAnsi16(fn, offset) {
  return function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var code = fn.apply(colorConvert, args);
    return "\x1B[".concat(code + offset, "m");
  };
};

var wrapAnsi256 = function wrapAnsi256(fn, offset) {
  return function () {
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    var code = fn.apply(colorConvert, args);
    return "\x1B[".concat(38 + offset, ";5;").concat(code, "m");
  };
};

var wrapAnsi16m = function wrapAnsi16m(fn, offset) {
  return function () {
    for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }

    var rgb = fn.apply(colorConvert, args);
    return "\x1B[".concat(38 + offset, ";2;").concat(rgb[0], ";").concat(rgb[1], ";").concat(rgb[2], "m");
  };
};

function assembleStyles() {
  var codes = new Map();
  var styles = {
    modifier: {
      reset: [0, 0],
      // 21 isn't widely supported and 22 does the same thing
      bold: [1, 22],
      dim: [2, 22],
      italic: [3, 23],
      underline: [4, 24],
      inverse: [7, 27],
      hidden: [8, 28],
      strikethrough: [9, 29]
    },
    color: {
      black: [30, 39],
      red: [31, 39],
      green: [32, 39],
      yellow: [33, 39],
      blue: [34, 39],
      magenta: [35, 39],
      cyan: [36, 39],
      white: [37, 39],
      gray: [90, 39],
      // Bright color
      redBright: [91, 39],
      greenBright: [92, 39],
      yellowBright: [93, 39],
      blueBright: [94, 39],
      magentaBright: [95, 39],
      cyanBright: [96, 39],
      whiteBright: [97, 39]
    },
    bgColor: {
      bgBlack: [40, 49],
      bgRed: [41, 49],
      bgGreen: [42, 49],
      bgYellow: [43, 49],
      bgBlue: [44, 49],
      bgMagenta: [45, 49],
      bgCyan: [46, 49],
      bgWhite: [47, 49],
      // Bright color
      bgBlackBright: [100, 49],
      bgRedBright: [101, 49],
      bgGreenBright: [102, 49],
      bgYellowBright: [103, 49],
      bgBlueBright: [104, 49],
      bgMagentaBright: [105, 49],
      bgCyanBright: [106, 49],
      bgWhiteBright: [107, 49]
    }
  }; // Fix humans

  styles.color.grey = styles.color.gray;

  var _arr = Object.keys(styles);

  for (var _i = 0; _i < _arr.length; _i++) {
    var groupName = _arr[_i];
    var group = styles[groupName];

    var _arr3 = Object.keys(group);

    for (var _i3 = 0; _i3 < _arr3.length; _i3++) {
      var styleName = _arr3[_i3];
      var style = group[styleName];
      styles[styleName] = {
        open: "\x1B[".concat(style[0], "m"),
        close: "\x1B[".concat(style[1], "m")
      };
      group[styleName] = styles[styleName];
      codes.set(style[0], style[1]);
    }

    Object.defineProperty(styles, groupName, {
      value: group,
      enumerable: false
    });
    Object.defineProperty(styles, 'codes', {
      value: codes,
      enumerable: false
    });
  }

  var ansi2ansi = function ansi2ansi(n) {
    return n;
  };

  var rgb2rgb = function rgb2rgb(r, g, b) {
    return [r, g, b];
  };

  styles.color.close = '\u001B[39m';
  styles.bgColor.close = '\u001B[49m';
  styles.color.ansi = {
    ansi: wrapAnsi16(ansi2ansi, 0)
  };
  styles.color.ansi256 = {
    ansi256: wrapAnsi256(ansi2ansi, 0)
  };
  styles.color.ansi16m = {
    rgb: wrapAnsi16m(rgb2rgb, 0)
  };
  styles.bgColor.ansi = {
    ansi: wrapAnsi16(ansi2ansi, 10)
  };
  styles.bgColor.ansi256 = {
    ansi256: wrapAnsi256(ansi2ansi, 10)
  };
  styles.bgColor.ansi16m = {
    rgb: wrapAnsi16m(rgb2rgb, 10)
  };

  var _arr2 = Object.keys(colorConvert);

  for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
    var key = _arr2[_i2];

    if (typeof colorConvert[key] !== 'object') {
      continue;
    }

    var suite = colorConvert[key];

    if (key === 'ansi16') {
      key = 'ansi';
    }

    if ('ansi16' in suite) {
      styles.color.ansi[key] = wrapAnsi16(suite.ansi16, 0);
      styles.bgColor.ansi[key] = wrapAnsi16(suite.ansi16, 10);
    }

    if ('ansi256' in suite) {
      styles.color.ansi256[key] = wrapAnsi256(suite.ansi256, 0);
      styles.bgColor.ansi256[key] = wrapAnsi256(suite.ansi256, 10);
    }

    if ('rgb' in suite) {
      styles.color.ansi16m[key] = wrapAnsi16m(suite.rgb, 0);
      styles.bgColor.ansi16m[key] = wrapAnsi16m(suite.rgb, 10);
    }
  }

  return styles;
} // Make the export immutable


Object.defineProperty(module, 'exports', {
  enumerable: true,
  get: assembleStyles
});

},{"color-convert":14}],13:[function(require,module,exports){
"use strict";

/* MIT license */
var cssKeywords = require('color-name'); // NOTE: conversions should only return primitive values (i.e. arrays, or
//       values that give correct `typeof` results).
//       do not use box values types (i.e. Number(), String(), etc.)


var reverseKeywords = {};

for (var key in cssKeywords) {
  if (Object.prototype.hasOwnProperty.call(cssKeywords, key)) {
    reverseKeywords[cssKeywords[key]] = key;
  }
}

var conversions = {
  rgb: {
    channels: 3,
    labels: 'rgb'
  },
  hsl: {
    channels: 3,
    labels: 'hsl'
  },
  hsv: {
    channels: 3,
    labels: 'hsv'
  },
  hwb: {
    channels: 3,
    labels: 'hwb'
  },
  cmyk: {
    channels: 4,
    labels: 'cmyk'
  },
  xyz: {
    channels: 3,
    labels: 'xyz'
  },
  lab: {
    channels: 3,
    labels: 'lab'
  },
  lch: {
    channels: 3,
    labels: 'lch'
  },
  hex: {
    channels: 1,
    labels: ['hex']
  },
  keyword: {
    channels: 1,
    labels: ['keyword']
  },
  ansi16: {
    channels: 1,
    labels: ['ansi16']
  },
  ansi256: {
    channels: 1,
    labels: ['ansi256']
  },
  hcg: {
    channels: 3,
    labels: ['h', 'c', 'g']
  },
  apple: {
    channels: 3,
    labels: ['r16', 'g16', 'b16']
  },
  gray: {
    channels: 1,
    labels: ['gray']
  }
}; // hide .channels and .labels properties

for (var model in conversions) {
  if (Object.prototype.hasOwnProperty.call(conversions, model)) {
    if (!('channels' in conversions[model])) {
      throw new Error('missing channels property: ' + model);
    }

    if (!('labels' in conversions[model])) {
      throw new Error('missing channel labels property: ' + model);
    }

    if (conversions[model].labels.length !== conversions[model].channels) {
      throw new Error('channel and label counts mismatch: ' + model);
    }

    var _conversions$model = conversions[model],
        channels = _conversions$model.channels,
        labels = _conversions$model.labels;
    delete conversions[model].channels;
    delete conversions[model].labels;
    Object.defineProperty(conversions[model], 'channels', {
      value: channels
    });
    Object.defineProperty(conversions[model], 'labels', {
      value: labels
    });
  }
}

conversions.rgb.hsl = function (rgb) {
  var r = rgb[0] / 255;
  var g = rgb[1] / 255;
  var b = rgb[2] / 255;
  var min = Math.min(r, g, b);
  var max = Math.max(r, g, b);
  var delta = max - min;
  var h;
  var s;

  if (max === min) {
    h = 0;
  } else if (r === max) {
    h = (g - b) / delta;
  } else if (g === max) {
    h = 2 + (b - r) / delta;
  } else if (b === max) {
    h = 4 + (r - g) / delta;
  }

  h = Math.min(h * 60, 360);

  if (h < 0) {
    h += 360;
  }

  var l = (min + max) / 2;

  if (max === min) {
    s = 0;
  } else if (l <= 0.5) {
    s = delta / (max + min);
  } else {
    s = delta / (2 - max - min);
  }

  return [h, s * 100, l * 100];
};

conversions.rgb.hsv = function (rgb) {
  var rdif;
  var gdif;
  var bdif;
  var h;
  var s;
  var r = rgb[0] / 255;
  var g = rgb[1] / 255;
  var b = rgb[2] / 255;
  var v = Math.max(r, g, b);
  var diff = v - Math.min(r, g, b);

  var diffc = function diffc(c) {
    return (v - c) / 6 / diff + 1 / 2;
  };

  if (diff === 0) {
    s = 0;
    h = s;
  } else {
    s = diff / v;
    rdif = diffc(r);
    gdif = diffc(g);
    bdif = diffc(b);

    if (r === v) {
      h = bdif - gdif;
    } else if (g === v) {
      h = 1 / 3 + rdif - bdif;
    } else if (b === v) {
      h = 2 / 3 + gdif - rdif;
    }

    if (h < 0) {
      h += 1;
    } else if (h > 1) {
      h -= 1;
    }
  }

  return [h * 360, s * 100, v * 100];
};

conversions.rgb.hwb = function (rgb) {
  var r = rgb[0];
  var g = rgb[1];
  var b = rgb[2];
  var h = conversions.rgb.hsl(rgb)[0];
  var w = 1 / 255 * Math.min(r, Math.min(g, b));
  b = 1 - 1 / 255 * Math.max(r, Math.max(g, b));
  return [h, w * 100, b * 100];
};

conversions.rgb.cmyk = function (rgb) {
  var r = rgb[0] / 255;
  var g = rgb[1] / 255;
  var b = rgb[2] / 255;
  var k = Math.min(1 - r, 1 - g, 1 - b);
  var c = (1 - r - k) / (1 - k) || 0;
  var m = (1 - g - k) / (1 - k) || 0;
  var y = (1 - b - k) / (1 - k) || 0;
  return [c * 100, m * 100, y * 100, k * 100];
}; // See https://en.m.wikipedia.org/wiki/Euclidean_distance#Squared_Euclidean_distance


function comparativeDistance(x, y) {
  return Math.pow(x[0] - y[0], 2) + Math.pow(x[1] - y[1], 2) + Math.pow(x[2] - y[2], 2);
}

conversions.rgb.keyword = function (rgb) {
  var reversed = reverseKeywords[rgb];

  if (reversed) {
    return reversed;
  }

  var currentClosestDistance = Infinity;
  var currentClosestKeyword;

  for (var keyword in cssKeywords) {
    if (Object.prototype.hasOwnProperty.call(cssKeywords, keyword)) {
      var value = cssKeywords[keyword]; // Compute comparative distance

      var distance = comparativeDistance(rgb, value); // Check if its less, if so set as closest

      if (distance < currentClosestDistance) {
        currentClosestDistance = distance;
        currentClosestKeyword = keyword;
      }
    }
  }

  return currentClosestKeyword;
};

conversions.keyword.rgb = function (keyword) {
  return cssKeywords[keyword];
};

conversions.rgb.xyz = function (rgb) {
  var r = rgb[0] / 255;
  var g = rgb[1] / 255;
  var b = rgb[2] / 255; // assume sRGB

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
  var x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  var y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  var z = r * 0.0193 + g * 0.1192 + b * 0.9505;
  return [x * 100, y * 100, z * 100];
};

conversions.rgb.lab = function (rgb) {
  var xyz = conversions.rgb.xyz(rgb);
  var x = xyz[0];
  var y = xyz[1];
  var z = xyz[2];
  x /= 95.047;
  y /= 100;
  z /= 108.883;
  x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;
  var l = 116 * y - 16;
  var a = 500 * (x - y);
  var b = 200 * (y - z);
  return [l, a, b];
};

conversions.hsl.rgb = function (hsl) {
  var h = hsl[0] / 360;
  var s = hsl[1] / 100;
  var l = hsl[2] / 100;
  var t2;
  var t3;
  var val;

  if (s === 0) {
    val = l * 255;
    return [val, val, val];
  }

  if (l < 0.5) {
    t2 = l * (1 + s);
  } else {
    t2 = l + s - l * s;
  }

  var t1 = 2 * l - t2;
  var rgb = [0, 0, 0];

  for (var i = 0; i < 3; i++) {
    t3 = h + 1 / 3 * -(i - 1);

    if (t3 < 0) {
      t3++;
    }

    if (t3 > 1) {
      t3--;
    }

    if (6 * t3 < 1) {
      val = t1 + (t2 - t1) * 6 * t3;
    } else if (2 * t3 < 1) {
      val = t2;
    } else if (3 * t3 < 2) {
      val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
    } else {
      val = t1;
    }

    rgb[i] = val * 255;
  }

  return rgb;
};

conversions.hsl.hsv = function (hsl) {
  var h = hsl[0];
  var s = hsl[1] / 100;
  var l = hsl[2] / 100;
  var smin = s;
  var lmin = Math.max(l, 0.01);
  l *= 2;
  s *= l <= 1 ? l : 2 - l;
  smin *= lmin <= 1 ? lmin : 2 - lmin;
  var v = (l + s) / 2;
  var sv = l === 0 ? 2 * smin / (lmin + smin) : 2 * s / (l + s);
  return [h, sv * 100, v * 100];
};

conversions.hsv.rgb = function (hsv) {
  var h = hsv[0] / 60;
  var s = hsv[1] / 100;
  var v = hsv[2] / 100;
  var hi = Math.floor(h) % 6;
  var f = h - Math.floor(h);
  var p = 255 * v * (1 - s);
  var q = 255 * v * (1 - s * f);
  var t = 255 * v * (1 - s * (1 - f));
  v *= 255; // eslint-disable-next-line default-case

  switch (hi) {
    case 0:
      return [v, t, p];

    case 1:
      return [q, v, p];

    case 2:
      return [p, v, t];

    case 3:
      return [p, q, v];

    case 4:
      return [t, p, v];

    case 5:
      return [v, p, q];
  }
};

conversions.hsv.hsl = function (hsv) {
  var h = hsv[0];
  var s = hsv[1] / 100;
  var v = hsv[2] / 100;
  var vmin = Math.max(v, 0.01);
  var sl;
  var l;
  l = (2 - s) * v;
  var lmin = (2 - s) * vmin;
  sl = s * vmin;
  sl /= lmin <= 1 ? lmin : 2 - lmin;
  sl = sl || 0;
  l /= 2;
  return [h, sl * 100, l * 100];
}; // http://dev.w3.org/csswg/css-color/#hwb-to-rgb


conversions.hwb.rgb = function (hwb) {
  var h = hwb[0] / 360;
  var wh = hwb[1] / 100;
  var bl = hwb[2] / 100;
  var ratio = wh + bl; // wh + bl cant be > 1

  if (ratio > 1) {
    wh /= ratio;
    bl /= ratio;
  }

  var i = Math.floor(6 * h);
  var v = 1 - bl;
  var f = 6 * h - i;

  if ((i & 0x01) !== 0) {
    f = 1 - f;
  }

  var n = wh + f * (v - wh); // linear interpolation

  var r;
  var g;
  var b;

  switch (i) {
    default:
    case 6:
    case 0:
      r = v;
      g = n;
      b = wh;
      break;

    case 1:
      r = n;
      g = v;
      b = wh;
      break;

    case 2:
      r = wh;
      g = v;
      b = n;
      break;

    case 3:
      r = wh;
      g = n;
      b = v;
      break;

    case 4:
      r = n;
      g = wh;
      b = v;
      break;

    case 5:
      r = v;
      g = wh;
      b = n;
      break;
  }

  return [r * 255, g * 255, b * 255];
};

conversions.cmyk.rgb = function (cmyk) {
  var c = cmyk[0] / 100;
  var m = cmyk[1] / 100;
  var y = cmyk[2] / 100;
  var k = cmyk[3] / 100;
  var r = 1 - Math.min(1, c * (1 - k) + k);
  var g = 1 - Math.min(1, m * (1 - k) + k);
  var b = 1 - Math.min(1, y * (1 - k) + k);
  return [r * 255, g * 255, b * 255];
};

conversions.xyz.rgb = function (xyz) {
  var x = xyz[0] / 100;
  var y = xyz[1] / 100;
  var z = xyz[2] / 100;
  var r;
  var g;
  var b;
  r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  b = x * 0.0557 + y * -0.204 + z * 1.057; // assume sRGB

  r = r > 0.0031308 ? 1.055 * Math.pow(r, 1.0 / 2.4) - 0.055 : r * 12.92;
  g = g > 0.0031308 ? 1.055 * Math.pow(g, 1.0 / 2.4) - 0.055 : g * 12.92;
  b = b > 0.0031308 ? 1.055 * Math.pow(b, 1.0 / 2.4) - 0.055 : b * 12.92;
  r = Math.min(Math.max(0, r), 1);
  g = Math.min(Math.max(0, g), 1);
  b = Math.min(Math.max(0, b), 1);
  return [r * 255, g * 255, b * 255];
};

conversions.xyz.lab = function (xyz) {
  var x = xyz[0];
  var y = xyz[1];
  var z = xyz[2];
  x /= 95.047;
  y /= 100;
  z /= 108.883;
  x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;
  var l = 116 * y - 16;
  var a = 500 * (x - y);
  var b = 200 * (y - z);
  return [l, a, b];
};

conversions.lab.xyz = function (lab) {
  var l = lab[0];
  var a = lab[1];
  var b = lab[2];
  var x;
  var y;
  var z;
  y = (l + 16) / 116;
  x = a / 500 + y;
  z = y - b / 200;
  var y2 = Math.pow(y, 3);
  var x2 = Math.pow(x, 3);
  var z2 = Math.pow(z, 3);
  y = y2 > 0.008856 ? y2 : (y - 16 / 116) / 7.787;
  x = x2 > 0.008856 ? x2 : (x - 16 / 116) / 7.787;
  z = z2 > 0.008856 ? z2 : (z - 16 / 116) / 7.787;
  x *= 95.047;
  y *= 100;
  z *= 108.883;
  return [x, y, z];
};

conversions.lab.lch = function (lab) {
  var l = lab[0];
  var a = lab[1];
  var b = lab[2];
  var h;
  var hr = Math.atan2(b, a);
  h = hr * 360 / 2 / Math.PI;

  if (h < 0) {
    h += 360;
  }

  var c = Math.sqrt(a * a + b * b);
  return [l, c, h];
};

conversions.lch.lab = function (lch) {
  var l = lch[0];
  var c = lch[1];
  var h = lch[2];
  var hr = h / 360 * 2 * Math.PI;
  var a = c * Math.cos(hr);
  var b = c * Math.sin(hr);
  return [l, a, b];
};

conversions.rgb.ansi16 = function (args) {
  var r = args[0];
  var g = args[1];
  var b = args[2]; // hsv -> ansi16 optimization

  var value = 1 in arguments ? arguments[1] : conversions.rgb.hsv(args)[2];
  value = Math.round(value / 50);

  if (value === 0) {
    return 30;
  }

  var ansi = 30 + (Math.round(b / 255) << 2 | Math.round(g / 255) << 1 | Math.round(r / 255));

  if (value === 2) {
    ansi += 60;
  }

  return ansi;
};

conversions.hsv.ansi16 = function (args) {
  // optimization here; we already know the value and don't need to get
  // it conversionsed for us.
  return conversions.rgb.ansi16(conversions.hsv.rgb(args), args[2]);
};

conversions.rgb.ansi256 = function (args) {
  var r = args[0];
  var g = args[1];
  var b = args[2]; // we use the extended greyscale palette here, with the exception of
  // black and white. normal palette only has 4 greyscale shades.

  if (r === g && g === b) {
    if (r < 8) {
      return 16;
    }

    if (r > 248) {
      return 231;
    }

    return Math.round((r - 8) / 247 * 24) + 232;
  }

  var ansi = 16 + 36 * Math.round(r / 255 * 5) + 6 * Math.round(g / 255 * 5) + Math.round(b / 255 * 5);
  return ansi;
};

conversions.ansi16.rgb = function (args) {
  var color = args % 10; // handle greyscale

  if (color === 0 || color === 7) {
    if (args > 50) {
      color += 3.5;
    }

    color = color / 10.5 * 255;
    return [color, color, color];
  }

  var mult = (~~(args > 50) + 1) * 0.5;
  var r = (color & 1) * mult * 255;
  var g = (color >> 1 & 1) * mult * 255;
  var b = (color >> 2 & 1) * mult * 255;
  return [r, g, b];
};

conversions.ansi256.rgb = function (args) {
  // handle greyscale
  if (args >= 232) {
    var c = (args - 232) * 10 + 8;
    return [c, c, c];
  }

  args -= 16;
  var rem;
  var r = Math.floor(args / 36) / 5 * 255;
  var g = Math.floor((rem = args % 36) / 6) / 5 * 255;
  var b = rem % 6 / 5 * 255;
  return [r, g, b];
};

conversions.rgb.hex = function (args) {
  var integer = ((Math.round(args[0]) & 0xff) << 16) + ((Math.round(args[1]) & 0xff) << 8) + Number(Math.round(args[2]) & 0xff);
  var string = integer.toString(16).toUpperCase();
  return '000000'.substring(string.length) + string;
};

conversions.hex.rgb = function (args) {
  var match = args.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);

  if (!match) {
    return [0, 0, 0];
  }

  var colorString = match[0];

  if (match[0].length === 3) {
    colorString = colorString.split('').map(function (char) {
      return char + char;
    }).join('');
  }

  var integer = parseInt(colorString, 16);
  var r = integer >> 16 & 0xff;
  var g = integer >> 8 & 0xff;
  var b = integer & 0xff;
  return [r, g, b];
};

conversions.rgb.hcg = function (rgb) {
  var r = rgb[0] / 255;
  var g = rgb[1] / 255;
  var b = rgb[2] / 255;
  var max = Math.max(Math.max(r, g), b);
  var min = Math.min(Math.min(r, g), b);
  var chroma = max - min;
  var grayscale;
  var hue;

  if (chroma < 1) {
    grayscale = min / (1 - chroma);
  } else {
    grayscale = 0;
  }

  if (chroma <= 0) {
    hue = 0;
  } else if (max === r) {
    hue = (g - b) / chroma % 6;
  } else if (max === g) {
    hue = 2 + (b - r) / chroma;
  } else {
    hue = 4 + (r - g) / chroma + 4;
  }

  hue /= 6;
  hue %= 1;
  return [hue * 360, chroma * 100, grayscale * 100];
};

conversions.hsl.hcg = function (hsl) {
  var s = hsl[1] / 100;
  var l = hsl[2] / 100;
  var c = 1;
  var f = 0;

  if (l < 0.5) {
    c = 2.0 * s * l;
  } else {
    c = 2.0 * s * (1.0 - l);
  }

  if (c < 1.0) {
    f = (l - 0.5 * c) / (1.0 - c);
  }

  return [hsl[0], c * 100, f * 100];
};

conversions.hsv.hcg = function (hsv) {
  var s = hsv[1] / 100;
  var v = hsv[2] / 100;
  var c = s * v;
  var f = 0;

  if (c < 1.0) {
    f = (v - c) / (1 - c);
  }

  return [hsv[0], c * 100, f * 100];
};

conversions.hcg.rgb = function (hcg) {
  var h = hcg[0] / 360;
  var c = hcg[1] / 100;
  var g = hcg[2] / 100;

  if (c === 0.0) {
    return [g * 255, g * 255, g * 255];
  }

  var pure = [0, 0, 0];
  var hi = h % 1 * 6;
  var v = hi % 1;
  var w = 1 - v;
  var mg = 0;

  switch (Math.floor(hi)) {
    case 0:
      pure[0] = 1;
      pure[1] = v;
      pure[2] = 0;
      break;

    case 1:
      pure[0] = w;
      pure[1] = 1;
      pure[2] = 0;
      break;

    case 2:
      pure[0] = 0;
      pure[1] = 1;
      pure[2] = v;
      break;

    case 3:
      pure[0] = 0;
      pure[1] = w;
      pure[2] = 1;
      break;

    case 4:
      pure[0] = v;
      pure[1] = 0;
      pure[2] = 1;
      break;

    default:
      pure[0] = 1;
      pure[1] = 0;
      pure[2] = w;
  }

  mg = (1.0 - c) * g;
  return [(c * pure[0] + mg) * 255, (c * pure[1] + mg) * 255, (c * pure[2] + mg) * 255];
};

conversions.hcg.hsv = function (hcg) {
  var c = hcg[1] / 100;
  var g = hcg[2] / 100;
  var v = c + g * (1.0 - c);
  var f = 0;

  if (v > 0.0) {
    f = c / v;
  }

  return [hcg[0], f * 100, v * 100];
};

conversions.hcg.hsl = function (hcg) {
  var c = hcg[1] / 100;
  var g = hcg[2] / 100;
  var l = g * (1.0 - c) + 0.5 * c;
  var s = 0;

  if (l > 0.0 && l < 0.5) {
    s = c / (2 * l);
  } else if (l >= 0.5 && l < 1.0) {
    s = c / (2 * (1 - l));
  }

  return [hcg[0], s * 100, l * 100];
};

conversions.hcg.hwb = function (hcg) {
  var c = hcg[1] / 100;
  var g = hcg[2] / 100;
  var v = c + g * (1.0 - c);
  return [hcg[0], (v - c) * 100, (1 - v) * 100];
};

conversions.hwb.hcg = function (hwb) {
  var w = hwb[1] / 100;
  var b = hwb[2] / 100;
  var v = 1 - b;
  var c = v - w;
  var g = 0;

  if (c < 1) {
    g = (v - c) / (1 - c);
  }

  return [hwb[0], c * 100, g * 100];
};

conversions.apple.rgb = function (apple) {
  return [apple[0] / 65535 * 255, apple[1] / 65535 * 255, apple[2] / 65535 * 255];
};

conversions.rgb.apple = function (rgb) {
  return [rgb[0] / 255 * 65535, rgb[1] / 255 * 65535, rgb[2] / 255 * 65535];
};

conversions.gray.rgb = function (args) {
  return [args[0] / 100 * 255, args[0] / 100 * 255, args[0] / 100 * 255];
};

conversions.gray.hsv = function (args) {
  return [0, 0, args[0]];
};

conversions.gray.hsl = conversions.gray.hsv;

conversions.gray.hwb = function (gray) {
  return [0, 100, gray[0]];
};

conversions.gray.cmyk = function (gray) {
  return [0, 0, 0, gray[0]];
};

conversions.gray.lab = function (gray) {
  return [gray[0], 0, 0];
};

conversions.gray.hex = function (gray) {
  var val = Math.round(gray[0] / 100 * 255) & 0xff;
  var integer = (val << 16) + (val << 8) + val;
  var string = integer.toString(16).toUpperCase();
  return '000000'.substring(string.length) + string;
};

conversions.rgb.gray = function (rgb) {
  var val = (rgb[0] + rgb[1] + rgb[2]) / 3;
  return [val / 255 * 100];
};

module.exports = conversions;

},{"color-name":16}],14:[function(require,module,exports){
"use strict";

var conversions = require('./conversions');

var route = require('./route');

var convert = {};
var models = Object.keys(conversions);

function wrapRaw(fn) {
  var wrappedFn = function wrappedFn(args) {
    if (args === undefined || args === null) {
      return args;
    }

    if (arguments.length > 1) {
      args = Array.prototype.slice.call(arguments);
    }

    return fn(args);
  }; // preserve .conversion property if there is one


  if ('conversion' in fn) {
    wrappedFn.conversion = fn.conversion;
  }

  return wrappedFn;
}

function wrapRounded(fn) {
  var wrappedFn = function wrappedFn(args) {
    if (args === undefined || args === null) {
      return args;
    }

    if (arguments.length > 1) {
      args = Array.prototype.slice.call(arguments);
    }

    var result = fn(args); // we're assuming the result is an array here.
    // see notice in conversions.js; don't use box types
    // in conversion functions.

    if (typeof result === 'object') {
      for (var len = result.length, i = 0; i < len; i++) {
        result[i] = Math.round(result[i]);
      }
    }

    return result;
  }; // preserve .conversion property if there is one


  if ('conversion' in fn) {
    wrappedFn.conversion = fn.conversion;
  }

  return wrappedFn;
}

models.forEach(function (fromModel) {
  convert[fromModel] = {};
  Object.defineProperty(convert[fromModel], 'channels', {
    value: conversions[fromModel].channels
  });
  Object.defineProperty(convert[fromModel], 'labels', {
    value: conversions[fromModel].labels
  });
  var routes = route(fromModel);
  var routeModels = Object.keys(routes);
  routeModels.forEach(function (toModel) {
    var fn = routes[toModel];
    convert[fromModel][toModel] = wrapRounded(fn);
    convert[fromModel][toModel].raw = wrapRaw(fn);
  });
});
module.exports = convert;

},{"./conversions":13,"./route":15}],15:[function(require,module,exports){
"use strict";

var conversions = require('./conversions');
/*
	this function routes a model to all other models.

	all functions that are routed have a property `.conversion` attached
	to the returned synthetic function. This property is an array
	of strings, each with the steps in between the 'from' and 'to'
	color models (inclusive).

	conversions that are not possible simply are not included.
*/


function buildGraph() {
  var graph = {}; // https://jsperf.com/object-keys-vs-for-in-with-closure/3

  var models = Object.keys(conversions);

  for (var len = models.length, i = 0; i < len; i++) {
    graph[models[i]] = {
      // http://jsperf.com/1-vs-infinity
      // micro-opt, but this is simple.
      distance: -1,
      parent: null
    };
  }

  return graph;
} // https://en.wikipedia.org/wiki/Breadth-first_search


function deriveBFS(fromModel) {
  var graph = buildGraph();
  var queue = [fromModel]; // unshift -> queue -> pop

  graph[fromModel].distance = 0;

  while (queue.length) {
    var current = queue.pop();
    var adjacents = Object.keys(conversions[current]);

    for (var len = adjacents.length, i = 0; i < len; i++) {
      var adjacent = adjacents[i];
      var node = graph[adjacent];

      if (node.distance === -1) {
        node.distance = graph[current].distance + 1;
        node.parent = current;
        queue.unshift(adjacent);
      }
    }
  }

  return graph;
}

function link(from, to) {
  return function (args) {
    return to(from(args));
  };
}

function wrapConversion(toModel, graph) {
  var path = [graph[toModel].parent, toModel];
  var fn = conversions[graph[toModel].parent][toModel];
  var cur = graph[toModel].parent;

  while (graph[cur].parent) {
    path.unshift(graph[cur].parent);
    fn = link(conversions[graph[cur].parent][cur], fn);
    cur = graph[cur].parent;
  }

  fn.conversion = path;
  return fn;
}

function route(fromModel) {
  var graph = deriveBFS(fromModel);
  var conversion = {};
  var models = Object.keys(graph);

  for (var len = models.length, i = 0; i < len; i++) {
    var toModel = models[i];
    var node = graph[toModel];

    if (node.parent === null) {
      // no possible conversion, or this node is the source model.
      continue;
    }

    conversion[toModel] = wrapConversion(toModel, graph);
  }

  return conversion;
}

module.exports = route;

},{"./conversions":13}],16:[function(require,module,exports){
'use strict'

module.exports = {
	"aliceblue": [240, 248, 255],
	"antiquewhite": [250, 235, 215],
	"aqua": [0, 255, 255],
	"aquamarine": [127, 255, 212],
	"azure": [240, 255, 255],
	"beige": [245, 245, 220],
	"bisque": [255, 228, 196],
	"black": [0, 0, 0],
	"blanchedalmond": [255, 235, 205],
	"blue": [0, 0, 255],
	"blueviolet": [138, 43, 226],
	"brown": [165, 42, 42],
	"burlywood": [222, 184, 135],
	"cadetblue": [95, 158, 160],
	"chartreuse": [127, 255, 0],
	"chocolate": [210, 105, 30],
	"coral": [255, 127, 80],
	"cornflowerblue": [100, 149, 237],
	"cornsilk": [255, 248, 220],
	"crimson": [220, 20, 60],
	"cyan": [0, 255, 255],
	"darkblue": [0, 0, 139],
	"darkcyan": [0, 139, 139],
	"darkgoldenrod": [184, 134, 11],
	"darkgray": [169, 169, 169],
	"darkgreen": [0, 100, 0],
	"darkgrey": [169, 169, 169],
	"darkkhaki": [189, 183, 107],
	"darkmagenta": [139, 0, 139],
	"darkolivegreen": [85, 107, 47],
	"darkorange": [255, 140, 0],
	"darkorchid": [153, 50, 204],
	"darkred": [139, 0, 0],
	"darksalmon": [233, 150, 122],
	"darkseagreen": [143, 188, 143],
	"darkslateblue": [72, 61, 139],
	"darkslategray": [47, 79, 79],
	"darkslategrey": [47, 79, 79],
	"darkturquoise": [0, 206, 209],
	"darkviolet": [148, 0, 211],
	"deeppink": [255, 20, 147],
	"deepskyblue": [0, 191, 255],
	"dimgray": [105, 105, 105],
	"dimgrey": [105, 105, 105],
	"dodgerblue": [30, 144, 255],
	"firebrick": [178, 34, 34],
	"floralwhite": [255, 250, 240],
	"forestgreen": [34, 139, 34],
	"fuchsia": [255, 0, 255],
	"gainsboro": [220, 220, 220],
	"ghostwhite": [248, 248, 255],
	"gold": [255, 215, 0],
	"goldenrod": [218, 165, 32],
	"gray": [128, 128, 128],
	"green": [0, 128, 0],
	"greenyellow": [173, 255, 47],
	"grey": [128, 128, 128],
	"honeydew": [240, 255, 240],
	"hotpink": [255, 105, 180],
	"indianred": [205, 92, 92],
	"indigo": [75, 0, 130],
	"ivory": [255, 255, 240],
	"khaki": [240, 230, 140],
	"lavender": [230, 230, 250],
	"lavenderblush": [255, 240, 245],
	"lawngreen": [124, 252, 0],
	"lemonchiffon": [255, 250, 205],
	"lightblue": [173, 216, 230],
	"lightcoral": [240, 128, 128],
	"lightcyan": [224, 255, 255],
	"lightgoldenrodyellow": [250, 250, 210],
	"lightgray": [211, 211, 211],
	"lightgreen": [144, 238, 144],
	"lightgrey": [211, 211, 211],
	"lightpink": [255, 182, 193],
	"lightsalmon": [255, 160, 122],
	"lightseagreen": [32, 178, 170],
	"lightskyblue": [135, 206, 250],
	"lightslategray": [119, 136, 153],
	"lightslategrey": [119, 136, 153],
	"lightsteelblue": [176, 196, 222],
	"lightyellow": [255, 255, 224],
	"lime": [0, 255, 0],
	"limegreen": [50, 205, 50],
	"linen": [250, 240, 230],
	"magenta": [255, 0, 255],
	"maroon": [128, 0, 0],
	"mediumaquamarine": [102, 205, 170],
	"mediumblue": [0, 0, 205],
	"mediumorchid": [186, 85, 211],
	"mediumpurple": [147, 112, 219],
	"mediumseagreen": [60, 179, 113],
	"mediumslateblue": [123, 104, 238],
	"mediumspringgreen": [0, 250, 154],
	"mediumturquoise": [72, 209, 204],
	"mediumvioletred": [199, 21, 133],
	"midnightblue": [25, 25, 112],
	"mintcream": [245, 255, 250],
	"mistyrose": [255, 228, 225],
	"moccasin": [255, 228, 181],
	"navajowhite": [255, 222, 173],
	"navy": [0, 0, 128],
	"oldlace": [253, 245, 230],
	"olive": [128, 128, 0],
	"olivedrab": [107, 142, 35],
	"orange": [255, 165, 0],
	"orangered": [255, 69, 0],
	"orchid": [218, 112, 214],
	"palegoldenrod": [238, 232, 170],
	"palegreen": [152, 251, 152],
	"paleturquoise": [175, 238, 238],
	"palevioletred": [219, 112, 147],
	"papayawhip": [255, 239, 213],
	"peachpuff": [255, 218, 185],
	"peru": [205, 133, 63],
	"pink": [255, 192, 203],
	"plum": [221, 160, 221],
	"powderblue": [176, 224, 230],
	"purple": [128, 0, 128],
	"rebeccapurple": [102, 51, 153],
	"red": [255, 0, 0],
	"rosybrown": [188, 143, 143],
	"royalblue": [65, 105, 225],
	"saddlebrown": [139, 69, 19],
	"salmon": [250, 128, 114],
	"sandybrown": [244, 164, 96],
	"seagreen": [46, 139, 87],
	"seashell": [255, 245, 238],
	"sienna": [160, 82, 45],
	"silver": [192, 192, 192],
	"skyblue": [135, 206, 235],
	"slateblue": [106, 90, 205],
	"slategray": [112, 128, 144],
	"slategrey": [112, 128, 144],
	"snow": [255, 250, 250],
	"springgreen": [0, 255, 127],
	"steelblue": [70, 130, 180],
	"tan": [210, 180, 140],
	"teal": [0, 128, 128],
	"thistle": [216, 191, 216],
	"tomato": [255, 99, 71],
	"turquoise": [64, 224, 208],
	"violet": [238, 130, 238],
	"wheat": [245, 222, 179],
	"white": [255, 255, 255],
	"whitesmoke": [245, 245, 245],
	"yellow": [255, 255, 0],
	"yellowgreen": [154, 205, 50]
};

},{}],17:[function(require,module,exports){
module.exports={
  "O_RDONLY": 0,
  "O_WRONLY": 1,
  "O_RDWR": 2,
  "S_IFMT": 61440,
  "S_IFREG": 32768,
  "S_IFDIR": 16384,
  "S_IFCHR": 8192,
  "S_IFBLK": 24576,
  "S_IFIFO": 4096,
  "S_IFLNK": 40960,
  "S_IFSOCK": 49152,
  "O_CREAT": 512,
  "O_EXCL": 2048,
  "O_NOCTTY": 131072,
  "O_TRUNC": 1024,
  "O_APPEND": 8,
  "O_DIRECTORY": 1048576,
  "O_NOFOLLOW": 256,
  "O_SYNC": 128,
  "O_SYMLINK": 2097152,
  "O_NONBLOCK": 4,
  "S_IRWXU": 448,
  "S_IRUSR": 256,
  "S_IWUSR": 128,
  "S_IXUSR": 64,
  "S_IRWXG": 56,
  "S_IRGRP": 32,
  "S_IWGRP": 16,
  "S_IXGRP": 8,
  "S_IRWXO": 7,
  "S_IROTH": 4,
  "S_IWOTH": 2,
  "S_IXOTH": 1,
  "E2BIG": 7,
  "EACCES": 13,
  "EADDRINUSE": 48,
  "EADDRNOTAVAIL": 49,
  "EAFNOSUPPORT": 47,
  "EAGAIN": 35,
  "EALREADY": 37,
  "EBADF": 9,
  "EBADMSG": 94,
  "EBUSY": 16,
  "ECANCELED": 89,
  "ECHILD": 10,
  "ECONNABORTED": 53,
  "ECONNREFUSED": 61,
  "ECONNRESET": 54,
  "EDEADLK": 11,
  "EDESTADDRREQ": 39,
  "EDOM": 33,
  "EDQUOT": 69,
  "EEXIST": 17,
  "EFAULT": 14,
  "EFBIG": 27,
  "EHOSTUNREACH": 65,
  "EIDRM": 90,
  "EILSEQ": 92,
  "EINPROGRESS": 36,
  "EINTR": 4,
  "EINVAL": 22,
  "EIO": 5,
  "EISCONN": 56,
  "EISDIR": 21,
  "ELOOP": 62,
  "EMFILE": 24,
  "EMLINK": 31,
  "EMSGSIZE": 40,
  "EMULTIHOP": 95,
  "ENAMETOOLONG": 63,
  "ENETDOWN": 50,
  "ENETRESET": 52,
  "ENETUNREACH": 51,
  "ENFILE": 23,
  "ENOBUFS": 55,
  "ENODATA": 96,
  "ENODEV": 19,
  "ENOENT": 2,
  "ENOEXEC": 8,
  "ENOLCK": 77,
  "ENOLINK": 97,
  "ENOMEM": 12,
  "ENOMSG": 91,
  "ENOPROTOOPT": 42,
  "ENOSPC": 28,
  "ENOSR": 98,
  "ENOSTR": 99,
  "ENOSYS": 78,
  "ENOTCONN": 57,
  "ENOTDIR": 20,
  "ENOTEMPTY": 66,
  "ENOTSOCK": 38,
  "ENOTSUP": 45,
  "ENOTTY": 25,
  "ENXIO": 6,
  "EOPNOTSUPP": 102,
  "EOVERFLOW": 84,
  "EPERM": 1,
  "EPIPE": 32,
  "EPROTO": 100,
  "EPROTONOSUPPORT": 43,
  "EPROTOTYPE": 41,
  "ERANGE": 34,
  "EROFS": 30,
  "ESPIPE": 29,
  "ESRCH": 3,
  "ESTALE": 70,
  "ETIME": 101,
  "ETIMEDOUT": 60,
  "ETXTBSY": 26,
  "EWOULDBLOCK": 35,
  "EXDEV": 18,
  "SIGHUP": 1,
  "SIGINT": 2,
  "SIGQUIT": 3,
  "SIGILL": 4,
  "SIGTRAP": 5,
  "SIGABRT": 6,
  "SIGIOT": 6,
  "SIGBUS": 10,
  "SIGFPE": 8,
  "SIGKILL": 9,
  "SIGUSR1": 30,
  "SIGSEGV": 11,
  "SIGUSR2": 31,
  "SIGPIPE": 13,
  "SIGALRM": 14,
  "SIGTERM": 15,
  "SIGCHLD": 20,
  "SIGCONT": 19,
  "SIGSTOP": 17,
  "SIGTSTP": 18,
  "SIGTTIN": 21,
  "SIGTTOU": 22,
  "SIGURG": 16,
  "SIGXCPU": 24,
  "SIGXFSZ": 25,
  "SIGVTALRM": 26,
  "SIGPROF": 27,
  "SIGWINCH": 28,
  "SIGIO": 23,
  "SIGSYS": 12,
  "SSL_OP_ALL": 2147486719,
  "SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION": 262144,
  "SSL_OP_CIPHER_SERVER_PREFERENCE": 4194304,
  "SSL_OP_CISCO_ANYCONNECT": 32768,
  "SSL_OP_COOKIE_EXCHANGE": 8192,
  "SSL_OP_CRYPTOPRO_TLSEXT_BUG": 2147483648,
  "SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS": 2048,
  "SSL_OP_EPHEMERAL_RSA": 0,
  "SSL_OP_LEGACY_SERVER_CONNECT": 4,
  "SSL_OP_MICROSOFT_BIG_SSLV3_BUFFER": 32,
  "SSL_OP_MICROSOFT_SESS_ID_BUG": 1,
  "SSL_OP_MSIE_SSLV2_RSA_PADDING": 0,
  "SSL_OP_NETSCAPE_CA_DN_BUG": 536870912,
  "SSL_OP_NETSCAPE_CHALLENGE_BUG": 2,
  "SSL_OP_NETSCAPE_DEMO_CIPHER_CHANGE_BUG": 1073741824,
  "SSL_OP_NETSCAPE_REUSE_CIPHER_CHANGE_BUG": 8,
  "SSL_OP_NO_COMPRESSION": 131072,
  "SSL_OP_NO_QUERY_MTU": 4096,
  "SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION": 65536,
  "SSL_OP_NO_SSLv2": 16777216,
  "SSL_OP_NO_SSLv3": 33554432,
  "SSL_OP_NO_TICKET": 16384,
  "SSL_OP_NO_TLSv1": 67108864,
  "SSL_OP_NO_TLSv1_1": 268435456,
  "SSL_OP_NO_TLSv1_2": 134217728,
  "SSL_OP_PKCS1_CHECK_1": 0,
  "SSL_OP_PKCS1_CHECK_2": 0,
  "SSL_OP_SINGLE_DH_USE": 1048576,
  "SSL_OP_SINGLE_ECDH_USE": 524288,
  "SSL_OP_SSLEAY_080_CLIENT_DH_BUG": 128,
  "SSL_OP_SSLREF2_REUSE_CERT_TYPE_BUG": 0,
  "SSL_OP_TLS_BLOCK_PADDING_BUG": 512,
  "SSL_OP_TLS_D5_BUG": 256,
  "SSL_OP_TLS_ROLLBACK_BUG": 8388608,
  "ENGINE_METHOD_DSA": 2,
  "ENGINE_METHOD_DH": 4,
  "ENGINE_METHOD_RAND": 8,
  "ENGINE_METHOD_ECDH": 16,
  "ENGINE_METHOD_ECDSA": 32,
  "ENGINE_METHOD_CIPHERS": 64,
  "ENGINE_METHOD_DIGESTS": 128,
  "ENGINE_METHOD_STORE": 256,
  "ENGINE_METHOD_PKEY_METHS": 512,
  "ENGINE_METHOD_PKEY_ASN1_METHS": 1024,
  "ENGINE_METHOD_ALL": 65535,
  "ENGINE_METHOD_NONE": 0,
  "DH_CHECK_P_NOT_SAFE_PRIME": 2,
  "DH_CHECK_P_NOT_PRIME": 1,
  "DH_UNABLE_TO_CHECK_GENERATOR": 4,
  "DH_NOT_SUITABLE_GENERATOR": 8,
  "NPN_ENABLED": 1,
  "RSA_PKCS1_PADDING": 1,
  "RSA_SSLV23_PADDING": 2,
  "RSA_NO_PADDING": 3,
  "RSA_PKCS1_OAEP_PADDING": 4,
  "RSA_X931_PADDING": 5,
  "RSA_PKCS1_PSS_PADDING": 6,
  "POINT_CONVERSION_COMPRESSED": 2,
  "POINT_CONVERSION_UNCOMPRESSED": 4,
  "POINT_CONVERSION_HYBRID": 6,
  "F_OK": 0,
  "R_OK": 4,
  "W_OK": 2,
  "X_OK": 1,
  "UV_UDP_REUSEADDR": 4
}

},{}],18:[function(require,module,exports){
(function (Buffer){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.

function isArray(arg) {
  if (Array.isArray) {
    return Array.isArray(arg);
  }
  return objectToString(arg) === '[object Array]';
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = Buffer.isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

}).call(this,{"isBuffer":require("../../is-buffer/index.js")})

},{"../../is-buffer/index.js":31}],19:[function(require,module,exports){
'use strict';

var util = require('util');
var isArrayish = require('is-arrayish');

var errorEx = function errorEx(name, properties) {
	if (!name || name.constructor !== String) {
		properties = name || {};
		name = Error.name;
	}

	var errorExError = function ErrorEXError(message) {
		if (!this) {
			return new ErrorEXError(message);
		}

		message = message instanceof Error
			? message.message
			: (message || this.message);

		Error.call(this, message);
		Error.captureStackTrace(this, errorExError);

		this.name = name;

		Object.defineProperty(this, 'message', {
			configurable: true,
			enumerable: false,
			get: function () {
				var newMessage = message.split(/\r?\n/g);

				for (var key in properties) {
					if (!properties.hasOwnProperty(key)) {
						continue;
					}

					var modifier = properties[key];

					if ('message' in modifier) {
						newMessage = modifier.message(this[key], newMessage) || newMessage;
						if (!isArrayish(newMessage)) {
							newMessage = [newMessage];
						}
					}
				}

				return newMessage.join('\n');
			},
			set: function (v) {
				message = v;
			}
		});

		var overwrittenStack = null;

		var stackDescriptor = Object.getOwnPropertyDescriptor(this, 'stack');
		var stackGetter = stackDescriptor.get;
		var stackValue = stackDescriptor.value;
		delete stackDescriptor.value;
		delete stackDescriptor.writable;

		stackDescriptor.set = function (newstack) {
			overwrittenStack = newstack;
		};

		stackDescriptor.get = function () {
			var stack = (overwrittenStack || ((stackGetter)
				? stackGetter.call(this)
				: stackValue)).split(/\r?\n+/g);

			// starting in Node 7, the stack builder caches the message.
			// just replace it.
			if (!overwrittenStack) {
				stack[0] = this.name + ': ' + this.message;
			}

			var lineCount = 1;
			for (var key in properties) {
				if (!properties.hasOwnProperty(key)) {
					continue;
				}

				var modifier = properties[key];

				if ('line' in modifier) {
					var line = modifier.line(this[key]);
					if (line) {
						stack.splice(lineCount++, 0, '    ' + line);
					}
				}

				if ('stack' in modifier) {
					modifier.stack(this[key], stack);
				}
			}

			return stack.join('\n');
		};

		Object.defineProperty(this, 'stack', stackDescriptor);
	};

	if (Object.setPrototypeOf) {
		Object.setPrototypeOf(errorExError.prototype, Error.prototype);
		Object.setPrototypeOf(errorExError, Error);
	} else {
		util.inherits(errorExError, Error);
	}

	return errorExError;
};

errorEx.append = function (str, def) {
	return {
		message: function (v, message) {
			v = v || def;

			if (v) {
				message[0] += ' ' + str.replace('%s', v.toString());
			}

			return message;
		}
	};
};

errorEx.line = function (str, def) {
	return {
		line: function (v) {
			v = v || def;

			if (v) {
				return str.replace('%s', v.toString());
			}

			return null;
		}
	};
};

module.exports = errorEx;

},{"is-arrayish":30,"util":67}],20:[function(require,module,exports){
'use strict';

var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

module.exports = function (str) {
	if (typeof str !== 'string') {
		throw new TypeError('Expected a string');
	}

	return str.replace(matchOperatorsRe, '\\$&');
};

},{}],21:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var objectCreate = Object.create || objectCreatePolyfill
var objectKeys = Object.keys || objectKeysPolyfill
var bind = Function.prototype.bind || functionBindPolyfill

function EventEmitter() {
  if (!this._events || !Object.prototype.hasOwnProperty.call(this, '_events')) {
    this._events = objectCreate(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

var hasDefineProperty;
try {
  var o = {};
  if (Object.defineProperty) Object.defineProperty(o, 'x', { value: 0 });
  hasDefineProperty = o.x === 0;
} catch (err) { hasDefineProperty = false }
if (hasDefineProperty) {
  Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
    enumerable: true,
    get: function() {
      return defaultMaxListeners;
    },
    set: function(arg) {
      // check whether the input is a positive number (whose value is zero or
      // greater and not a NaN).
      if (typeof arg !== 'number' || arg < 0 || arg !== arg)
        throw new TypeError('"defaultMaxListeners" must be a positive number');
      defaultMaxListeners = arg;
    }
  });
} else {
  EventEmitter.defaultMaxListeners = defaultMaxListeners;
}

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || isNaN(n))
    throw new TypeError('"n" argument must be a positive number');
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a variable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.
function emitNone(handler, isFn, self) {
  if (isFn)
    handler.call(self);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self);
  }
}
function emitOne(handler, isFn, self, arg1) {
  if (isFn)
    handler.call(self, arg1);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1);
  }
}
function emitTwo(handler, isFn, self, arg1, arg2) {
  if (isFn)
    handler.call(self, arg1, arg2);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2);
  }
}
function emitThree(handler, isFn, self, arg1, arg2, arg3) {
  if (isFn)
    handler.call(self, arg1, arg2, arg3);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2, arg3);
  }
}

function emitMany(handler, isFn, self, args) {
  if (isFn)
    handler.apply(self, args);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].apply(self, args);
  }
}

EventEmitter.prototype.emit = function emit(type) {
  var er, handler, len, args, i, events;
  var doError = (type === 'error');

  events = this._events;
  if (events)
    doError = (doError && events.error == null);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    if (arguments.length > 1)
      er = arguments[1];
    if (er instanceof Error) {
      throw er; // Unhandled 'error' event
    } else {
      // At least give some kind of context to the user
      var err = new Error('Unhandled "error" event. (' + er + ')');
      err.context = er;
      throw err;
    }
    return false;
  }

  handler = events[type];

  if (!handler)
    return false;

  var isFn = typeof handler === 'function';
  len = arguments.length;
  switch (len) {
      // fast cases
    case 1:
      emitNone(handler, isFn, this);
      break;
    case 2:
      emitOne(handler, isFn, this, arguments[1]);
      break;
    case 3:
      emitTwo(handler, isFn, this, arguments[1], arguments[2]);
      break;
    case 4:
      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
      break;
      // slower
    default:
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
      emitMany(handler, isFn, this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');

  events = target._events;
  if (!events) {
    events = target._events = objectCreate(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener) {
      target.emit('newListener', type,
          listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (!existing) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
          prepend ? [listener, existing] : [existing, listener];
    } else {
      // If we've already got an array, just append.
      if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
    }

    // Check for listener leak
    if (!existing.warned) {
      m = $getMaxListeners(target);
      if (m && m > 0 && existing.length > m) {
        existing.warned = true;
        var w = new Error('Possible EventEmitter memory leak detected. ' +
            existing.length + ' "' + String(type) + '" listeners ' +
            'added. Use emitter.setMaxListeners() to ' +
            'increase limit.');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        if (typeof console === 'object' && console.warn) {
          console.warn('%s: %s', w.name, w.message);
        }
      }
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    switch (arguments.length) {
      case 0:
        return this.listener.call(this.target);
      case 1:
        return this.listener.call(this.target, arguments[0]);
      case 2:
        return this.listener.call(this.target, arguments[0], arguments[1]);
      case 3:
        return this.listener.call(this.target, arguments[0], arguments[1],
            arguments[2]);
      default:
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; ++i)
          args[i] = arguments[i];
        this.listener.apply(this.target, args);
    }
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = bind.call(onceWrapper, state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = this._events;
      if (!events)
        return this;

      list = events[type];
      if (!list)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = objectCreate(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else
          spliceOne(list, position);

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (!events)
        return this;

      // not listening for removeListener, no need to emit
      if (!events.removeListener) {
        if (arguments.length === 0) {
          this._events = objectCreate(null);
          this._eventsCount = 0;
        } else if (events[type]) {
          if (--this._eventsCount === 0)
            this._events = objectCreate(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = objectKeys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = objectCreate(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (!events)
    return [];

  var evlistener = events[type];
  if (!evlistener)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};

// About 1.5x faster than the two-arg version of Array#splice().
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
    list[i] = list[k];
  list.pop();
}

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function objectCreatePolyfill(proto) {
  var F = function() {};
  F.prototype = proto;
  return new F;
}
function objectKeysPolyfill(obj) {
  var keys = [];
  for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) {
    keys.push(k);
  }
  return k;
}
function functionBindPolyfill(context) {
  var fn = this;
  return function () {
    return fn.apply(context, arguments);
  };
}

},{}],22:[function(require,module,exports){
(function (process){
'use strict';
const escapeStringRegexp = require('escape-string-regexp');

const platform = process.platform;

const main = {
	tick: '✔',
	cross: '✖',
	star: '★',
	square: '▇',
	squareSmall: '◻',
	squareSmallFilled: '◼',
	play: '▶',
	circle: '◯',
	circleFilled: '◉',
	circleDotted: '◌',
	circleDouble: '◎',
	circleCircle: 'ⓞ',
	circleCross: 'ⓧ',
	circlePipe: 'Ⓘ',
	circleQuestionMark: '?⃝',
	bullet: '●',
	dot: '․',
	line: '─',
	ellipsis: '…',
	pointer: '❯',
	pointerSmall: '›',
	info: 'ℹ',
	warning: '⚠',
	hamburger: '☰',
	smiley: '㋡',
	mustache: '෴',
	heart: '♥',
	arrowUp: '↑',
	arrowDown: '↓',
	arrowLeft: '←',
	arrowRight: '→',
	radioOn: '◉',
	radioOff: '◯',
	checkboxOn: '☒',
	checkboxOff: '☐',
	checkboxCircleOn: 'ⓧ',
	checkboxCircleOff: 'Ⓘ',
	questionMarkPrefix: '?⃝',
	oneHalf: '½',
	oneThird: '⅓',
	oneQuarter: '¼',
	oneFifth: '⅕',
	oneSixth: '⅙',
	oneSeventh: '⅐',
	oneEighth: '⅛',
	oneNinth: '⅑',
	oneTenth: '⅒',
	twoThirds: '⅔',
	twoFifths: '⅖',
	threeQuarters: '¾',
	threeFifths: '⅗',
	threeEighths: '⅜',
	fourFifths: '⅘',
	fiveSixths: '⅚',
	fiveEighths: '⅝',
	sevenEighths: '⅞'
};

const win = {
	tick: '√',
	cross: '×',
	star: '*',
	square: '█',
	squareSmall: '[ ]',
	squareSmallFilled: '[█]',
	play: '►',
	circle: '( )',
	circleFilled: '(*)',
	circleDotted: '( )',
	circleDouble: '( )',
	circleCircle: '(○)',
	circleCross: '(×)',
	circlePipe: '(│)',
	circleQuestionMark: '(?)',
	bullet: '*',
	dot: '.',
	line: '─',
	ellipsis: '...',
	pointer: '>',
	pointerSmall: '»',
	info: 'i',
	warning: '‼',
	hamburger: '≡',
	smiley: '☺',
	mustache: '┌─┐',
	heart: main.heart,
	arrowUp: main.arrowUp,
	arrowDown: main.arrowDown,
	arrowLeft: main.arrowLeft,
	arrowRight: main.arrowRight,
	radioOn: '(*)',
	radioOff: '( )',
	checkboxOn: '[×]',
	checkboxOff: '[ ]',
	checkboxCircleOn: '(×)',
	checkboxCircleOff: '( )',
	questionMarkPrefix: '？',
	oneHalf: '1/2',
	oneThird: '1/3',
	oneQuarter: '1/4',
	oneFifth: '1/5',
	oneSixth: '1/6',
	oneSeventh: '1/7',
	oneEighth: '1/8',
	oneNinth: '1/9',
	oneTenth: '1/10',
	twoThirds: '2/3',
	twoFifths: '2/5',
	threeQuarters: '3/4',
	threeFifths: '3/5',
	threeEighths: '3/8',
	fourFifths: '4/5',
	fiveSixths: '5/6',
	fiveEighths: '5/8',
	sevenEighths: '7/8'
};

if (platform === 'linux') {
	// the main one doesn't look that good on Ubuntu
	main.questionMarkPrefix = '?';
}

const figures = platform === 'win32' ? win : main;

const fn = str => {
	if (figures === main) {
		return str;
	}

	Object.keys(main).forEach(key => {
		if (main[key] === figures[key]) {
			return;
		}

		str = str.replace(new RegExp(escapeStringRegexp(main[key]), 'g'), figures[key]);
	});

	return str;
};

module.exports = Object.assign(fn, figures);

}).call(this,require('_process'))

},{"_process":45,"escape-string-regexp":20}],23:[function(require,module,exports){
'use strict';
const path = require('path');
const locatePath = require('locate-path');

module.exports = (filename, opts) => {
	opts = opts || {};

	const startDir = path.resolve(opts.cwd || '');
	const root = path.parse(startDir).root;

	const filenames = [].concat(filename);

	return new Promise(resolve => {
		(function find(dir) {
			locatePath(filenames, {cwd: dir}).then(file => {
				if (file) {
					resolve(path.join(dir, file));
				} else if (dir === root) {
					resolve(null);
				} else {
					find(path.dirname(dir));
				}
			});
		})(startDir);
	});
};

module.exports.sync = (filename, opts) => {
	opts = opts || {};

	let dir = path.resolve(opts.cwd || '');
	const root = path.parse(dir).root;

	const filenames = [].concat(filename);

	// eslint-disable-next-line no-constant-condition
	while (true) {
		const file = locatePath.sync(filenames, {cwd: dir});

		if (file) {
			return path.join(dir, file);
		} else if (dir === root) {
			return null;
		}

		dir = path.dirname(dir);
	}
};

},{"locate-path":35,"path":40}],24:[function(require,module,exports){
'use strict'

var fs = require('fs')

module.exports = clone(fs)

function clone (obj) {
  if (obj === null || typeof obj !== 'object')
    return obj

  if (obj instanceof Object)
    var copy = { __proto__: obj.__proto__ }
  else
    var copy = Object.create(null)

  Object.getOwnPropertyNames(obj).forEach(function (key) {
    Object.defineProperty(copy, key, Object.getOwnPropertyDescriptor(obj, key))
  })

  return copy
}

},{"fs":8}],25:[function(require,module,exports){
(function (process){
var fs = require('fs')
var polyfills = require('./polyfills.js')
var legacy = require('./legacy-streams.js')
var queue = []

var util = require('util')

function noop () {}

var debug = noop
if (util.debuglog)
  debug = util.debuglog('gfs4')
else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || ''))
  debug = function() {
    var m = util.format.apply(util, arguments)
    m = 'GFS4: ' + m.split(/\n/).join('\nGFS4: ')
    console.error(m)
  }

if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || '')) {
  process.on('exit', function() {
    debug(queue)
    require('assert').equal(queue.length, 0)
  })
}

module.exports = patch(require('./fs.js'))
if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH) {
  module.exports = patch(fs)
}

// Always patch fs.close/closeSync, because we want to
// retry() whenever a close happens *anywhere* in the program.
// This is essential when multiple graceful-fs instances are
// in play at the same time.
module.exports.close =
fs.close = (function (fs$close) { return function (fd, cb) {
  return fs$close.call(fs, fd, function (err) {
    if (!err)
      retry()

    if (typeof cb === 'function')
      cb.apply(this, arguments)
  })
}})(fs.close)

module.exports.closeSync =
fs.closeSync = (function (fs$closeSync) { return function (fd) {
  // Note that graceful-fs also retries when fs.closeSync() fails.
  // Looks like a bug to me, although it's probably a harmless one.
  var rval = fs$closeSync.apply(fs, arguments)
  retry()
  return rval
}})(fs.closeSync)

function patch (fs) {
  // Everything that references the open() function needs to be in here
  polyfills(fs)
  fs.gracefulify = patch
  fs.FileReadStream = ReadStream;  // Legacy name.
  fs.FileWriteStream = WriteStream;  // Legacy name.
  fs.ReadStream = ReadStream;
  fs.WriteStream = WriteStream;
  fs.createReadStream = createReadStream
  fs.createWriteStream = createWriteStream
  var fs$readFile = fs.readFile
  fs.readFile = readFile
  function readFile (path, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null

    return go$readFile(path, options, cb)

    function go$readFile (path, options, cb) {
      return fs$readFile(path, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$readFile, [path, options, cb]])
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments)
          retry()
        }
      })
    }
  }

  var fs$writeFile = fs.writeFile
  fs.writeFile = writeFile
  function writeFile (path, data, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null

    return go$writeFile(path, data, options, cb)

    function go$writeFile (path, data, options, cb) {
      return fs$writeFile(path, data, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$writeFile, [path, data, options, cb]])
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments)
          retry()
        }
      })
    }
  }

  var fs$appendFile = fs.appendFile
  if (fs$appendFile)
    fs.appendFile = appendFile
  function appendFile (path, data, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null

    return go$appendFile(path, data, options, cb)

    function go$appendFile (path, data, options, cb) {
      return fs$appendFile(path, data, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$appendFile, [path, data, options, cb]])
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments)
          retry()
        }
      })
    }
  }

  var fs$readdir = fs.readdir
  fs.readdir = readdir
  function readdir (path, options, cb) {
    var args = [path]
    if (typeof options !== 'function') {
      args.push(options)
    } else {
      cb = options
    }
    args.push(go$readdir$cb)

    return go$readdir(args)

    function go$readdir$cb (err, files) {
      if (files && files.sort)
        files.sort()

      if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
        enqueue([go$readdir, [args]])
      else {
        if (typeof cb === 'function')
          cb.apply(this, arguments)
        retry()
      }
    }
  }

  function go$readdir (args) {
    return fs$readdir.apply(fs, args)
  }

  if (process.version.substr(0, 4) === 'v0.8') {
    var legStreams = legacy(fs)
    ReadStream = legStreams.ReadStream
    WriteStream = legStreams.WriteStream
  }

  var fs$ReadStream = fs.ReadStream
  ReadStream.prototype = Object.create(fs$ReadStream.prototype)
  ReadStream.prototype.open = ReadStream$open

  var fs$WriteStream = fs.WriteStream
  WriteStream.prototype = Object.create(fs$WriteStream.prototype)
  WriteStream.prototype.open = WriteStream$open

  fs.ReadStream = ReadStream
  fs.WriteStream = WriteStream

  function ReadStream (path, options) {
    if (this instanceof ReadStream)
      return fs$ReadStream.apply(this, arguments), this
    else
      return ReadStream.apply(Object.create(ReadStream.prototype), arguments)
  }

  function ReadStream$open () {
    var that = this
    open(that.path, that.flags, that.mode, function (err, fd) {
      if (err) {
        if (that.autoClose)
          that.destroy()

        that.emit('error', err)
      } else {
        that.fd = fd
        that.emit('open', fd)
        that.read()
      }
    })
  }

  function WriteStream (path, options) {
    if (this instanceof WriteStream)
      return fs$WriteStream.apply(this, arguments), this
    else
      return WriteStream.apply(Object.create(WriteStream.prototype), arguments)
  }

  function WriteStream$open () {
    var that = this
    open(that.path, that.flags, that.mode, function (err, fd) {
      if (err) {
        that.destroy()
        that.emit('error', err)
      } else {
        that.fd = fd
        that.emit('open', fd)
      }
    })
  }

  function createReadStream (path, options) {
    return new ReadStream(path, options)
  }

  function createWriteStream (path, options) {
    return new WriteStream(path, options)
  }

  var fs$open = fs.open
  fs.open = open
  function open (path, flags, mode, cb) {
    if (typeof mode === 'function')
      cb = mode, mode = null

    return go$open(path, flags, mode, cb)

    function go$open (path, flags, mode, cb) {
      return fs$open(path, flags, mode, function (err, fd) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$open, [path, flags, mode, cb]])
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments)
          retry()
        }
      })
    }
  }

  return fs
}

function enqueue (elem) {
  debug('ENQUEUE', elem[0].name, elem[1])
  queue.push(elem)
}

function retry () {
  var elem = queue.shift()
  if (elem) {
    debug('RETRY', elem[0].name, elem[1])
    elem[0].apply(null, elem[1])
  }
}

}).call(this,require('_process'))

},{"./fs.js":24,"./legacy-streams.js":26,"./polyfills.js":27,"_process":45,"assert":2,"fs":8,"util":67}],26:[function(require,module,exports){
(function (process){
var Stream = require('stream').Stream

module.exports = legacy

function legacy (fs) {
  return {
    ReadStream: ReadStream,
    WriteStream: WriteStream
  }

  function ReadStream (path, options) {
    if (!(this instanceof ReadStream)) return new ReadStream(path, options);

    Stream.call(this);

    var self = this;

    this.path = path;
    this.fd = null;
    this.readable = true;
    this.paused = false;

    this.flags = 'r';
    this.mode = 438; /*=0666*/
    this.bufferSize = 64 * 1024;

    options = options || {};

    // Mixin options into this
    var keys = Object.keys(options);
    for (var index = 0, length = keys.length; index < length; index++) {
      var key = keys[index];
      this[key] = options[key];
    }

    if (this.encoding) this.setEncoding(this.encoding);

    if (this.start !== undefined) {
      if ('number' !== typeof this.start) {
        throw TypeError('start must be a Number');
      }
      if (this.end === undefined) {
        this.end = Infinity;
      } else if ('number' !== typeof this.end) {
        throw TypeError('end must be a Number');
      }

      if (this.start > this.end) {
        throw new Error('start must be <= end');
      }

      this.pos = this.start;
    }

    if (this.fd !== null) {
      process.nextTick(function() {
        self._read();
      });
      return;
    }

    fs.open(this.path, this.flags, this.mode, function (err, fd) {
      if (err) {
        self.emit('error', err);
        self.readable = false;
        return;
      }

      self.fd = fd;
      self.emit('open', fd);
      self._read();
    })
  }

  function WriteStream (path, options) {
    if (!(this instanceof WriteStream)) return new WriteStream(path, options);

    Stream.call(this);

    this.path = path;
    this.fd = null;
    this.writable = true;

    this.flags = 'w';
    this.encoding = 'binary';
    this.mode = 438; /*=0666*/
    this.bytesWritten = 0;

    options = options || {};

    // Mixin options into this
    var keys = Object.keys(options);
    for (var index = 0, length = keys.length; index < length; index++) {
      var key = keys[index];
      this[key] = options[key];
    }

    if (this.start !== undefined) {
      if ('number' !== typeof this.start) {
        throw TypeError('start must be a Number');
      }
      if (this.start < 0) {
        throw new Error('start must be >= zero');
      }

      this.pos = this.start;
    }

    this.busy = false;
    this._queue = [];

    if (this.fd === null) {
      this._open = fs.open;
      this._queue.push([this._open, this.path, this.flags, this.mode, undefined]);
      this.flush();
    }
  }
}

}).call(this,require('_process'))

},{"_process":45,"stream":60}],27:[function(require,module,exports){
(function (process){
var fs = require('./fs.js')
var constants = require('constants')

var origCwd = process.cwd
var cwd = null

var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform

process.cwd = function() {
  if (!cwd)
    cwd = origCwd.call(process)
  return cwd
}
try {
  process.cwd()
} catch (er) {}

var chdir = process.chdir
process.chdir = function(d) {
  cwd = null
  chdir.call(process, d)
}

module.exports = patch

function patch (fs) {
  // (re-)implement some things that are known busted or missing.

  // lchmod, broken prior to 0.6.2
  // back-port the fix here.
  if (constants.hasOwnProperty('O_SYMLINK') &&
      process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
    patchLchmod(fs)
  }

  // lutimes implementation, or no-op
  if (!fs.lutimes) {
    patchLutimes(fs)
  }

  // https://github.com/isaacs/node-graceful-fs/issues/4
  // Chown should not fail on einval or eperm if non-root.
  // It should not fail on enosys ever, as this just indicates
  // that a fs doesn't support the intended operation.

  fs.chown = chownFix(fs.chown)
  fs.fchown = chownFix(fs.fchown)
  fs.lchown = chownFix(fs.lchown)

  fs.chmod = chmodFix(fs.chmod)
  fs.fchmod = chmodFix(fs.fchmod)
  fs.lchmod = chmodFix(fs.lchmod)

  fs.chownSync = chownFixSync(fs.chownSync)
  fs.fchownSync = chownFixSync(fs.fchownSync)
  fs.lchownSync = chownFixSync(fs.lchownSync)

  fs.chmodSync = chmodFixSync(fs.chmodSync)
  fs.fchmodSync = chmodFixSync(fs.fchmodSync)
  fs.lchmodSync = chmodFixSync(fs.lchmodSync)

  fs.stat = statFix(fs.stat)
  fs.fstat = statFix(fs.fstat)
  fs.lstat = statFix(fs.lstat)

  fs.statSync = statFixSync(fs.statSync)
  fs.fstatSync = statFixSync(fs.fstatSync)
  fs.lstatSync = statFixSync(fs.lstatSync)

  // if lchmod/lchown do not exist, then make them no-ops
  if (!fs.lchmod) {
    fs.lchmod = function (path, mode, cb) {
      if (cb) process.nextTick(cb)
    }
    fs.lchmodSync = function () {}
  }
  if (!fs.lchown) {
    fs.lchown = function (path, uid, gid, cb) {
      if (cb) process.nextTick(cb)
    }
    fs.lchownSync = function () {}
  }

  // on Windows, A/V software can lock the directory, causing this
  // to fail with an EACCES or EPERM if the directory contains newly
  // created files.  Try again on failure, for up to 60 seconds.

  // Set the timeout this long because some Windows Anti-Virus, such as Parity
  // bit9, may lock files for up to a minute, causing npm package install
  // failures. Also, take care to yield the scheduler. Windows scheduling gives
  // CPU to a busy looping process, which can cause the program causing the lock
  // contention to be starved of CPU by node, so the contention doesn't resolve.
  if (platform === "win32") {
    fs.rename = (function (fs$rename) { return function (from, to, cb) {
      var start = Date.now()
      var backoff = 0;
      fs$rename(from, to, function CB (er) {
        if (er
            && (er.code === "EACCES" || er.code === "EPERM")
            && Date.now() - start < 60000) {
          setTimeout(function() {
            fs.stat(to, function (stater, st) {
              if (stater && stater.code === "ENOENT")
                fs$rename(from, to, CB);
              else
                cb(er)
            })
          }, backoff)
          if (backoff < 100)
            backoff += 10;
          return;
        }
        if (cb) cb(er)
      })
    }})(fs.rename)
  }

  // if read() returns EAGAIN, then just try it again.
  fs.read = (function (fs$read) { return function (fd, buffer, offset, length, position, callback_) {
    var callback
    if (callback_ && typeof callback_ === 'function') {
      var eagCounter = 0
      callback = function (er, _, __) {
        if (er && er.code === 'EAGAIN' && eagCounter < 10) {
          eagCounter ++
          return fs$read.call(fs, fd, buffer, offset, length, position, callback)
        }
        callback_.apply(this, arguments)
      }
    }
    return fs$read.call(fs, fd, buffer, offset, length, position, callback)
  }})(fs.read)

  fs.readSync = (function (fs$readSync) { return function (fd, buffer, offset, length, position) {
    var eagCounter = 0
    while (true) {
      try {
        return fs$readSync.call(fs, fd, buffer, offset, length, position)
      } catch (er) {
        if (er.code === 'EAGAIN' && eagCounter < 10) {
          eagCounter ++
          continue
        }
        throw er
      }
    }
  }})(fs.readSync)
}

function patchLchmod (fs) {
  fs.lchmod = function (path, mode, callback) {
    fs.open( path
           , constants.O_WRONLY | constants.O_SYMLINK
           , mode
           , function (err, fd) {
      if (err) {
        if (callback) callback(err)
        return
      }
      // prefer to return the chmod error, if one occurs,
      // but still try to close, and report closing errors if they occur.
      fs.fchmod(fd, mode, function (err) {
        fs.close(fd, function(err2) {
          if (callback) callback(err || err2)
        })
      })
    })
  }

  fs.lchmodSync = function (path, mode) {
    var fd = fs.openSync(path, constants.O_WRONLY | constants.O_SYMLINK, mode)

    // prefer to return the chmod error, if one occurs,
    // but still try to close, and report closing errors if they occur.
    var threw = true
    var ret
    try {
      ret = fs.fchmodSync(fd, mode)
      threw = false
    } finally {
      if (threw) {
        try {
          fs.closeSync(fd)
        } catch (er) {}
      } else {
        fs.closeSync(fd)
      }
    }
    return ret
  }
}

function patchLutimes (fs) {
  if (constants.hasOwnProperty("O_SYMLINK")) {
    fs.lutimes = function (path, at, mt, cb) {
      fs.open(path, constants.O_SYMLINK, function (er, fd) {
        if (er) {
          if (cb) cb(er)
          return
        }
        fs.futimes(fd, at, mt, function (er) {
          fs.close(fd, function (er2) {
            if (cb) cb(er || er2)
          })
        })
      })
    }

    fs.lutimesSync = function (path, at, mt) {
      var fd = fs.openSync(path, constants.O_SYMLINK)
      var ret
      var threw = true
      try {
        ret = fs.futimesSync(fd, at, mt)
        threw = false
      } finally {
        if (threw) {
          try {
            fs.closeSync(fd)
          } catch (er) {}
        } else {
          fs.closeSync(fd)
        }
      }
      return ret
    }

  } else {
    fs.lutimes = function (_a, _b, _c, cb) { if (cb) process.nextTick(cb) }
    fs.lutimesSync = function () {}
  }
}

function chmodFix (orig) {
  if (!orig) return orig
  return function (target, mode, cb) {
    return orig.call(fs, target, mode, function (er) {
      if (chownErOk(er)) er = null
      if (cb) cb.apply(this, arguments)
    })
  }
}

function chmodFixSync (orig) {
  if (!orig) return orig
  return function (target, mode) {
    try {
      return orig.call(fs, target, mode)
    } catch (er) {
      if (!chownErOk(er)) throw er
    }
  }
}


function chownFix (orig) {
  if (!orig) return orig
  return function (target, uid, gid, cb) {
    return orig.call(fs, target, uid, gid, function (er) {
      if (chownErOk(er)) er = null
      if (cb) cb.apply(this, arguments)
    })
  }
}

function chownFixSync (orig) {
  if (!orig) return orig
  return function (target, uid, gid) {
    try {
      return orig.call(fs, target, uid, gid)
    } catch (er) {
      if (!chownErOk(er)) throw er
    }
  }
}


function statFix (orig) {
  if (!orig) return orig
  // Older versions of Node erroneously returned signed integers for
  // uid + gid.
  return function (target, cb) {
    return orig.call(fs, target, function (er, stats) {
      if (!stats) return cb.apply(this, arguments)
      if (stats.uid < 0) stats.uid += 0x100000000
      if (stats.gid < 0) stats.gid += 0x100000000
      if (cb) cb.apply(this, arguments)
    })
  }
}

function statFixSync (orig) {
  if (!orig) return orig
  // Older versions of Node erroneously returned signed integers for
  // uid + gid.
  return function (target) {
    var stats = orig.call(fs, target)
    if (stats.uid < 0) stats.uid += 0x100000000
    if (stats.gid < 0) stats.gid += 0x100000000
    return stats;
  }
}

// ENOSYS means that the fs doesn't support the op. Just ignore
// that, because it doesn't matter.
//
// if there's no getuid, or if getuid() is something other
// than 0, and the error is EINVAL or EPERM, then just ignore
// it.
//
// This specific case is a silent failure in cp, install, tar,
// and most other unix tools that manage permissions.
//
// When running as root, or if other types of errors are
// encountered, then it's strict.
function chownErOk (er) {
  if (!er)
    return true

  if (er.code === "ENOSYS")
    return true

  var nonroot = !process.getuid || process.getuid() !== 0
  if (nonroot) {
    if (er.code === "EINVAL" || er.code === "EPERM")
      return true
  }

  return false
}

}).call(this,require('_process'))

},{"./fs.js":24,"_process":45,"constants":17}],28:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],29:[function(require,module,exports){
arguments[4][3][0].apply(exports,arguments)
},{"dup":3}],30:[function(require,module,exports){
'use strict';

module.exports = function isArrayish(obj) {
	if (!obj) {
		return false;
	}

	return obj instanceof Array || Array.isArray(obj) ||
		(obj.length >= 0 && obj.splice instanceof Function);
};

},{}],31:[function(require,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

},{}],32:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],33:[function(require,module,exports){
'use strict'

module.exports = parseJson
function parseJson (txt, reviver, context) {
  context = context || 20
  try {
    return JSON.parse(txt, reviver)
  } catch (e) {
    if (typeof txt !== 'string') {
      const isEmptyArray = Array.isArray(txt) && txt.length === 0
      const errorMessage = 'Cannot parse ' +
      (isEmptyArray ? 'an empty array' : String(txt))
      throw new TypeError(errorMessage)
    }
    const syntaxErr = e.message.match(/^Unexpected token.*position\s+(\d+)/i)
    const errIdx = syntaxErr
    ? +syntaxErr[1]
    : e.message.match(/^Unexpected end of JSON.*/i)
    ? txt.length - 1
    : null
    if (errIdx != null) {
      const start = errIdx <= context
      ? 0
      : errIdx - context
      const end = errIdx + context >= txt.length
      ? txt.length
      : errIdx + context
      e.message += ` while parsing near '${
        start === 0 ? '' : '...'
      }${txt.slice(start, end)}${
        end === txt.length ? '' : '...'
      }'`
    } else {
      e.message += ` while parsing '${txt.slice(0, context * 2)}'`
    }
    throw e
  }
}

},{}],34:[function(require,module,exports){
(function (process){
'use strict';
const path = require('path');
const fs = require('graceful-fs');
const stripBom = require('strip-bom');
const parseJson = require('parse-json');
const pify = require('pify');

const parse = (data, filePath, options = {}) => {
	data = stripBom(data);

	if (typeof options.beforeParse === 'function') {
		data = options.beforeParse(data);
	}

	return parseJson(data, options.reviver, path.relative(process.cwd(), filePath));
};

module.exports = (filePath, options) => pify(fs.readFile)(filePath, 'utf8').then(data => parse(data, filePath, options));
module.exports.sync = (filePath, options) => parse(fs.readFileSync(filePath, 'utf8'), filePath, options);

}).call(this,require('_process'))

},{"_process":45,"graceful-fs":25,"parse-json":39,"path":40,"pify":42,"strip-bom":62}],35:[function(require,module,exports){
(function (process){
'use strict';
const path = require('path');
const pathExists = require('path-exists');
const pLocate = require('p-locate');

module.exports = (iterable, opts) => {
	opts = Object.assign({
		cwd: process.cwd()
	}, opts);

	return pLocate(iterable, el => pathExists(path.resolve(opts.cwd, el)), opts);
};

module.exports.sync = (iterable, opts) => {
	opts = Object.assign({
		cwd: process.cwd()
	}, opts);

	for (const el of iterable) {
		if (pathExists.sync(path.resolve(opts.cwd, el))) {
			return el;
		}
	}
};

}).call(this,require('_process'))

},{"_process":45,"p-locate":37,"path":40,"path-exists":41}],36:[function(require,module,exports){
'use strict';
const pTry = require('p-try');

module.exports = concurrency => {
	if (concurrency < 1) {
		throw new TypeError('Expected `concurrency` to be a number from 1 and up');
	}

	const queue = [];
	let activeCount = 0;

	const next = () => {
		activeCount--;

		if (queue.length > 0) {
			queue.shift()();
		}
	};

	return fn => new Promise((resolve, reject) => {
		const run = () => {
			activeCount++;

			pTry(fn).then(
				val => {
					resolve(val);
					next();
				},
				err => {
					reject(err);
					next();
				}
			);
		};

		if (activeCount < concurrency) {
			run();
		} else {
			queue.push(run);
		}
	});
};

},{"p-try":38}],37:[function(require,module,exports){
'use strict';
const pLimit = require('p-limit');

class EndError extends Error {
	constructor(value) {
		super();
		this.value = value;
	}
}

// the input can also be a promise, so we `Promise.all()` them both
const finder = el => Promise.all(el).then(val => val[1] === true && Promise.reject(new EndError(val[0])));

module.exports = (iterable, tester, opts) => {
	opts = Object.assign({
		concurrency: Infinity,
		preserveOrder: true
	}, opts);

	const limit = pLimit(opts.concurrency);

	// start all the promises concurrently with optional limit
	const items = Array.from(iterable).map(el => [el, limit(() => Promise.resolve(el).then(tester))]);

	// check the promises either serially or concurrently
	const checkLimit = pLimit(opts.preserveOrder ? 1 : Infinity);

	return Promise.all(items.map(el => checkLimit(() => finder(el))))
		.then(() => {})
		.catch(err => err instanceof EndError ? err.value : Promise.reject(err));
};

},{"p-limit":36}],38:[function(require,module,exports){
'use strict';
module.exports = cb => new Promise(resolve => {
	resolve(cb());
});

},{}],39:[function(require,module,exports){
'use strict';
const errorEx = require('error-ex');
const fallback = require('json-parse-better-errors');

const JSONError = errorEx('JSONError', {
	fileName: errorEx.append('in %s')
});

module.exports = (input, reviver, filename) => {
	if (typeof reviver === 'string') {
		filename = reviver;
		reviver = null;
	}

	try {
		try {
			return JSON.parse(input, reviver);
		} catch (err) {
			fallback(input, reviver);

			throw err;
		}
	} catch (err) {
		err.message = err.message.replace(/\n/g, '');

		const jsonErr = new JSONError(err);
		if (filename) {
			jsonErr.fileName = filename;
		}

		throw jsonErr;
	}
};

},{"error-ex":19,"json-parse-better-errors":33}],40:[function(require,module,exports){
(function (process){
// 'path' module extracted from Node.js v8.11.1 (only the posix part)
// transplited with Babel

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

function assertPath(path) {
  if (typeof path !== 'string') {
    throw new TypeError('Path must be a string. Received ' + JSON.stringify(path));
  }
}

// Resolves . and .. elements in a path with directory names
function normalizeStringPosix(path, allowAboveRoot) {
  var res = '';
  var lastSegmentLength = 0;
  var lastSlash = -1;
  var dots = 0;
  var code;
  for (var i = 0; i <= path.length; ++i) {
    if (i < path.length)
      code = path.charCodeAt(i);
    else if (code === 47 /*/*/)
      break;
    else
      code = 47 /*/*/;
    if (code === 47 /*/*/) {
      if (lastSlash === i - 1 || dots === 1) {
        // NOOP
      } else if (lastSlash !== i - 1 && dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 /*.*/ || res.charCodeAt(res.length - 2) !== 46 /*.*/) {
          if (res.length > 2) {
            var lastSlashIndex = res.lastIndexOf('/');
            if (lastSlashIndex !== res.length - 1) {
              if (lastSlashIndex === -1) {
                res = '';
                lastSegmentLength = 0;
              } else {
                res = res.slice(0, lastSlashIndex);
                lastSegmentLength = res.length - 1 - res.lastIndexOf('/');
              }
              lastSlash = i;
              dots = 0;
              continue;
            }
          } else if (res.length === 2 || res.length === 1) {
            res = '';
            lastSegmentLength = 0;
            lastSlash = i;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0)
            res += '/..';
          else
            res = '..';
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0)
          res += '/' + path.slice(lastSlash + 1, i);
        else
          res = path.slice(lastSlash + 1, i);
        lastSegmentLength = i - lastSlash - 1;
      }
      lastSlash = i;
      dots = 0;
    } else if (code === 46 /*.*/ && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}

function _format(sep, pathObject) {
  var dir = pathObject.dir || pathObject.root;
  var base = pathObject.base || (pathObject.name || '') + (pathObject.ext || '');
  if (!dir) {
    return base;
  }
  if (dir === pathObject.root) {
    return dir + base;
  }
  return dir + sep + base;
}

var posix = {
  // path.resolve([from ...], to)
  resolve: function resolve() {
    var resolvedPath = '';
    var resolvedAbsolute = false;
    var cwd;

    for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path;
      if (i >= 0)
        path = arguments[i];
      else {
        if (cwd === undefined)
          cwd = process.cwd();
        path = cwd;
      }

      assertPath(path);

      // Skip empty entries
      if (path.length === 0) {
        continue;
      }

      resolvedPath = path + '/' + resolvedPath;
      resolvedAbsolute = path.charCodeAt(0) === 47 /*/*/;
    }

    // At this point the path should be resolved to a full absolute path, but
    // handle relative paths to be safe (might happen when process.cwd() fails)

    // Normalize the path
    resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);

    if (resolvedAbsolute) {
      if (resolvedPath.length > 0)
        return '/' + resolvedPath;
      else
        return '/';
    } else if (resolvedPath.length > 0) {
      return resolvedPath;
    } else {
      return '.';
    }
  },

  normalize: function normalize(path) {
    assertPath(path);

    if (path.length === 0) return '.';

    var isAbsolute = path.charCodeAt(0) === 47 /*/*/;
    var trailingSeparator = path.charCodeAt(path.length - 1) === 47 /*/*/;

    // Normalize the path
    path = normalizeStringPosix(path, !isAbsolute);

    if (path.length === 0 && !isAbsolute) path = '.';
    if (path.length > 0 && trailingSeparator) path += '/';

    if (isAbsolute) return '/' + path;
    return path;
  },

  isAbsolute: function isAbsolute(path) {
    assertPath(path);
    return path.length > 0 && path.charCodeAt(0) === 47 /*/*/;
  },

  join: function join() {
    if (arguments.length === 0)
      return '.';
    var joined;
    for (var i = 0; i < arguments.length; ++i) {
      var arg = arguments[i];
      assertPath(arg);
      if (arg.length > 0) {
        if (joined === undefined)
          joined = arg;
        else
          joined += '/' + arg;
      }
    }
    if (joined === undefined)
      return '.';
    return posix.normalize(joined);
  },

  relative: function relative(from, to) {
    assertPath(from);
    assertPath(to);

    if (from === to) return '';

    from = posix.resolve(from);
    to = posix.resolve(to);

    if (from === to) return '';

    // Trim any leading backslashes
    var fromStart = 1;
    for (; fromStart < from.length; ++fromStart) {
      if (from.charCodeAt(fromStart) !== 47 /*/*/)
        break;
    }
    var fromEnd = from.length;
    var fromLen = fromEnd - fromStart;

    // Trim any leading backslashes
    var toStart = 1;
    for (; toStart < to.length; ++toStart) {
      if (to.charCodeAt(toStart) !== 47 /*/*/)
        break;
    }
    var toEnd = to.length;
    var toLen = toEnd - toStart;

    // Compare paths to find the longest common path from root
    var length = fromLen < toLen ? fromLen : toLen;
    var lastCommonSep = -1;
    var i = 0;
    for (; i <= length; ++i) {
      if (i === length) {
        if (toLen > length) {
          if (to.charCodeAt(toStart + i) === 47 /*/*/) {
            // We get here if `from` is the exact base path for `to`.
            // For example: from='/foo/bar'; to='/foo/bar/baz'
            return to.slice(toStart + i + 1);
          } else if (i === 0) {
            // We get here if `from` is the root
            // For example: from='/'; to='/foo'
            return to.slice(toStart + i);
          }
        } else if (fromLen > length) {
          if (from.charCodeAt(fromStart + i) === 47 /*/*/) {
            // We get here if `to` is the exact base path for `from`.
            // For example: from='/foo/bar/baz'; to='/foo/bar'
            lastCommonSep = i;
          } else if (i === 0) {
            // We get here if `to` is the root.
            // For example: from='/foo'; to='/'
            lastCommonSep = 0;
          }
        }
        break;
      }
      var fromCode = from.charCodeAt(fromStart + i);
      var toCode = to.charCodeAt(toStart + i);
      if (fromCode !== toCode)
        break;
      else if (fromCode === 47 /*/*/)
        lastCommonSep = i;
    }

    var out = '';
    // Generate the relative path based on the path difference between `to`
    // and `from`
    for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
      if (i === fromEnd || from.charCodeAt(i) === 47 /*/*/) {
        if (out.length === 0)
          out += '..';
        else
          out += '/..';
      }
    }

    // Lastly, append the rest of the destination (`to`) path that comes after
    // the common path parts
    if (out.length > 0)
      return out + to.slice(toStart + lastCommonSep);
    else {
      toStart += lastCommonSep;
      if (to.charCodeAt(toStart) === 47 /*/*/)
        ++toStart;
      return to.slice(toStart);
    }
  },

  _makeLong: function _makeLong(path) {
    return path;
  },

  dirname: function dirname(path) {
    assertPath(path);
    if (path.length === 0) return '.';
    var code = path.charCodeAt(0);
    var hasRoot = code === 47 /*/*/;
    var end = -1;
    var matchedSlash = true;
    for (var i = path.length - 1; i >= 1; --i) {
      code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          if (!matchedSlash) {
            end = i;
            break;
          }
        } else {
        // We saw the first non-path separator
        matchedSlash = false;
      }
    }

    if (end === -1) return hasRoot ? '/' : '.';
    if (hasRoot && end === 1) return '//';
    return path.slice(0, end);
  },

  basename: function basename(path, ext) {
    if (ext !== undefined && typeof ext !== 'string') throw new TypeError('"ext" argument must be a string');
    assertPath(path);

    var start = 0;
    var end = -1;
    var matchedSlash = true;
    var i;

    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
      if (ext.length === path.length && ext === path) return '';
      var extIdx = ext.length - 1;
      var firstNonSlashEnd = -1;
      for (i = path.length - 1; i >= 0; --i) {
        var code = path.charCodeAt(i);
        if (code === 47 /*/*/) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
              start = i + 1;
              break;
            }
          } else {
          if (firstNonSlashEnd === -1) {
            // We saw the first non-path separator, remember this index in case
            // we need it if the extension ends up not matching
            matchedSlash = false;
            firstNonSlashEnd = i + 1;
          }
          if (extIdx >= 0) {
            // Try to match the explicit extension
            if (code === ext.charCodeAt(extIdx)) {
              if (--extIdx === -1) {
                // We matched the extension, so mark this as the end of our path
                // component
                end = i;
              }
            } else {
              // Extension does not match, so our result is the entire path
              // component
              extIdx = -1;
              end = firstNonSlashEnd;
            }
          }
        }
      }

      if (start === end) end = firstNonSlashEnd;else if (end === -1) end = path.length;
      return path.slice(start, end);
    } else {
      for (i = path.length - 1; i >= 0; --i) {
        if (path.charCodeAt(i) === 47 /*/*/) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
              start = i + 1;
              break;
            }
          } else if (end === -1) {
          // We saw the first non-path separator, mark this as the end of our
          // path component
          matchedSlash = false;
          end = i + 1;
        }
      }

      if (end === -1) return '';
      return path.slice(start, end);
    }
  },

  extname: function extname(path) {
    assertPath(path);
    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    var preDotState = 0;
    for (var i = path.length - 1; i >= 0; --i) {
      var code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            startPart = i + 1;
            break;
          }
          continue;
        }
      if (end === -1) {
        // We saw the first non-path separator, mark this as the end of our
        // extension
        matchedSlash = false;
        end = i + 1;
      }
      if (code === 46 /*.*/) {
          // If this is our first dot, mark it as the start of our extension
          if (startDot === -1)
            startDot = i;
          else if (preDotState !== 1)
            preDotState = 1;
      } else if (startDot !== -1) {
        // We saw a non-dot and non-path separator before our dot, so we should
        // have a good chance at having a non-empty extension
        preDotState = -1;
      }
    }

    if (startDot === -1 || end === -1 ||
        // We saw a non-dot character immediately before the dot
        preDotState === 0 ||
        // The (right-most) trimmed path component is exactly '..'
        preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      return '';
    }
    return path.slice(startDot, end);
  },

  format: function format(pathObject) {
    if (pathObject === null || typeof pathObject !== 'object') {
      throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof pathObject);
    }
    return _format('/', pathObject);
  },

  parse: function parse(path) {
    assertPath(path);

    var ret = { root: '', dir: '', base: '', ext: '', name: '' };
    if (path.length === 0) return ret;
    var code = path.charCodeAt(0);
    var isAbsolute = code === 47 /*/*/;
    var start;
    if (isAbsolute) {
      ret.root = '/';
      start = 1;
    } else {
      start = 0;
    }
    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    var i = path.length - 1;

    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    var preDotState = 0;

    // Get non-dir info
    for (; i >= start; --i) {
      code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            startPart = i + 1;
            break;
          }
          continue;
        }
      if (end === -1) {
        // We saw the first non-path separator, mark this as the end of our
        // extension
        matchedSlash = false;
        end = i + 1;
      }
      if (code === 46 /*.*/) {
          // If this is our first dot, mark it as the start of our extension
          if (startDot === -1) startDot = i;else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
        // We saw a non-dot and non-path separator before our dot, so we should
        // have a good chance at having a non-empty extension
        preDotState = -1;
      }
    }

    if (startDot === -1 || end === -1 ||
    // We saw a non-dot character immediately before the dot
    preDotState === 0 ||
    // The (right-most) trimmed path component is exactly '..'
    preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      if (end !== -1) {
        if (startPart === 0 && isAbsolute) ret.base = ret.name = path.slice(1, end);else ret.base = ret.name = path.slice(startPart, end);
      }
    } else {
      if (startPart === 0 && isAbsolute) {
        ret.name = path.slice(1, startDot);
        ret.base = path.slice(1, end);
      } else {
        ret.name = path.slice(startPart, startDot);
        ret.base = path.slice(startPart, end);
      }
      ret.ext = path.slice(startDot, end);
    }

    if (startPart > 0) ret.dir = path.slice(0, startPart - 1);else if (isAbsolute) ret.dir = '/';

    return ret;
  },

  sep: '/',
  delimiter: ':',
  win32: null,
  posix: null
};

posix.posix = posix;

module.exports = posix;

}).call(this,require('_process'))

},{"_process":45}],41:[function(require,module,exports){
'use strict';
const fs = require('fs');

module.exports = fp => new Promise(resolve => {
	fs.access(fp, err => {
		resolve(!err);
	});
});

module.exports.sync = fp => {
	try {
		fs.accessSync(fp);
		return true;
	} catch (err) {
		return false;
	}
};

},{"fs":8}],42:[function(require,module,exports){
'use strict';

const processFn = (fn, opts) => function () {
	const P = opts.promiseModule;
	const args = new Array(arguments.length);

	for (let i = 0; i < arguments.length; i++) {
		args[i] = arguments[i];
	}

	return new P((resolve, reject) => {
		if (opts.errorFirst) {
			args.push(function (err, result) {
				if (opts.multiArgs) {
					const results = new Array(arguments.length - 1);

					for (let i = 1; i < arguments.length; i++) {
						results[i - 1] = arguments[i];
					}

					if (err) {
						results.unshift(err);
						reject(results);
					} else {
						resolve(results);
					}
				} else if (err) {
					reject(err);
				} else {
					resolve(result);
				}
			});
		} else {
			args.push(function (result) {
				if (opts.multiArgs) {
					const results = new Array(arguments.length - 1);

					for (let i = 0; i < arguments.length; i++) {
						results[i] = arguments[i];
					}

					resolve(results);
				} else {
					resolve(result);
				}
			});
		}

		fn.apply(this, args);
	});
};

module.exports = (obj, opts) => {
	opts = Object.assign({
		exclude: [/.+(Sync|Stream)$/],
		errorFirst: true,
		promiseModule: Promise
	}, opts);

	const filter = key => {
		const match = pattern => typeof pattern === 'string' ? key === pattern : pattern.test(key);
		return opts.include ? opts.include.some(match) : !opts.exclude.some(match);
	};

	let ret;
	if (typeof obj === 'function') {
		ret = function () {
			if (opts.excludeMain) {
				return obj.apply(this, arguments);
			}

			return processFn(obj, opts).apply(this, arguments);
		};
	} else {
		ret = Object.create(Object.getPrototypeOf(obj));
	}

	for (const key in obj) { // eslint-disable-line guard-for-in
		const x = obj[key];
		ret[key] = typeof x === 'function' && filter(key) ? processFn(x, opts) : x;
	}

	return ret;
};

},{}],43:[function(require,module,exports){
'use strict';
const path = require('path');
const findUp = require('find-up');
const loadJsonFile = require('load-json-file');

const filepaths = new WeakMap();
const filepath = conf => filepaths.get(conf);
const findNextCwd = pkgPath => path.resolve(path.dirname(pkgPath), '..');

const addFp = (obj, fp) => {
	filepaths.set(obj, fp);
	return obj;
};

const pkgConf = (namespace, opts) => {
	if (!namespace) {
		return Promise.reject(new TypeError('Expected a namespace'));
	}

	opts = opts || {};

	return findUp('package.json', opts.cwd ? {cwd: opts.cwd} : {})
		.then(fp => {
			if (!fp) {
				return addFp(Object.assign({}, opts.defaults), fp);
			}

			return loadJsonFile(fp).then(pkg => {
				if (opts.skipOnFalse && pkg[namespace] === false) {
					const newOpts = Object.assign({}, opts, {cwd: findNextCwd(fp)});
					return pkgConf(namespace, newOpts);
				}

				return addFp(Object.assign({}, opts.defaults, pkg[namespace]), fp);
			});
		});
};

const sync = (namespace, opts) => {
	if (!namespace) {
		throw new TypeError('Expected a namespace');
	}

	opts = opts || {};

	const fp = findUp.sync('package.json', opts.cwd ? {cwd: opts.cwd} : {});

	if (!fp) {
		return addFp(Object.assign({}, opts.defaults), fp);
	}

	const pkg = loadJsonFile.sync(fp);

	if (opts.skipOnFalse && pkg[namespace] === false) {
		const newOpts = Object.assign({}, opts, {cwd: findNextCwd(fp)});
		return sync(namespace, newOpts);
	}

	return addFp(Object.assign({}, opts.defaults, pkg[namespace]), fp);
};

module.exports = pkgConf;
module.exports.filepath = filepath;
module.exports.sync = sync;

},{"find-up":23,"load-json-file":34,"path":40}],44:[function(require,module,exports){
(function (process){
'use strict';

if (!process.version ||
    process.version.indexOf('v0.') === 0 ||
    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
  module.exports = { nextTick: nextTick };
} else {
  module.exports = process
}

function nextTick(fn, arg1, arg2, arg3) {
  if (typeof fn !== 'function') {
    throw new TypeError('"callback" argument must be a function');
  }
  var len = arguments.length;
  var args, i;
  switch (len) {
  case 0:
  case 1:
    return process.nextTick(fn);
  case 2:
    return process.nextTick(function afterTickOne() {
      fn.call(null, arg1);
    });
  case 3:
    return process.nextTick(function afterTickTwo() {
      fn.call(null, arg1, arg2);
    });
  case 4:
    return process.nextTick(function afterTickThree() {
      fn.call(null, arg1, arg2, arg3);
    });
  default:
    args = new Array(len - 1);
    i = 0;
    while (i < args.length) {
      args[i++] = arguments[i];
    }
    return process.nextTick(function afterTick() {
      fn.apply(null, args);
    });
  }
}


}).call(this,require('_process'))

},{"_process":45}],45:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],46:[function(require,module,exports){
module.exports = require('./lib/_stream_duplex.js');

},{"./lib/_stream_duplex.js":47}],47:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    keys.push(key);
  }return keys;
};
/*</replacement>*/

module.exports = Duplex;

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var Readable = require('./_stream_readable');
var Writable = require('./_stream_writable');

util.inherits(Duplex, Readable);

{
  // avoid scope creep, the keys array can then be collected
  var keys = objectKeys(Writable.prototype);
  for (var v = 0; v < keys.length; v++) {
    var method = keys[v];
    if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
  }
}

function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false) this.readable = false;

  if (options && options.writable === false) this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

  this.once('end', onend);
}

Object.defineProperty(Duplex.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._writableState.highWaterMark;
  }
});

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended) return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  pna.nextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

Object.defineProperty(Duplex.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined || this._writableState === undefined) {
      return false;
    }
    return this._readableState.destroyed && this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (this._readableState === undefined || this._writableState === undefined) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
    this._writableState.destroyed = value;
  }
});

Duplex.prototype._destroy = function (err, cb) {
  this.push(null);
  this.end();

  pna.nextTick(cb, err);
};
},{"./_stream_readable":49,"./_stream_writable":51,"core-util-is":18,"inherits":29,"process-nextick-args":44}],48:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.

'use strict';

module.exports = PassThrough;

var Transform = require('./_stream_transform');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};
},{"./_stream_transform":50,"core-util-is":18,"inherits":29}],49:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

module.exports = Readable;

/*<replacement>*/
var isArray = require('isarray');
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Readable.ReadableState = ReadableState;

/*<replacement>*/
var EE = require('events').EventEmitter;

var EElistenerCount = function (emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/
var Stream = require('./internal/streams/stream');
/*</replacement>*/

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
var OurUint8Array = global.Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

/*</replacement>*/

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

/*<replacement>*/
var debugUtil = require('util');
var debug = void 0;
if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/

var BufferList = require('./internal/streams/BufferList');
var destroyImpl = require('./internal/streams/destroy');
var StringDecoder;

util.inherits(Readable, Stream);

var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];

function prependListener(emitter, event, fn) {
  // Sadly this is not cacheable as some libraries bundle their own
  // event emitter implementation with them.
  if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn);

  // This is a hack to make sure that our error handler is attached before any
  // userland ones.  NEVER DO THIS. This is here only because this code needs
  // to continue to work with older versions of Node.js that do not include
  // the prependListener() method. The goal is to eventually remove this hack.
  if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
}

function ReadableState(options, stream) {
  Duplex = Duplex || require('./_stream_duplex');

  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  var isDuplex = stream instanceof Duplex;

  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var readableHwm = options.readableHighWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (readableHwm || readableHwm === 0)) this.highWaterMark = readableHwm;else this.highWaterMark = defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // A linked list is used to store data chunks instead of an array because the
  // linked list can remove elements from the beginning faster than
  // array.shift()
  this.buffer = new BufferList();
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the event 'readable'/'data' is emitted
  // immediately, or on a later tick.  We set this to true at first, because
  // any actions that shouldn't happen until "later" should generally also
  // not happen before the first read call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;

  // has it been destroyed
  this.destroyed = false;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  Duplex = Duplex || require('./_stream_duplex');

  if (!(this instanceof Readable)) return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  if (options) {
    if (typeof options.read === 'function') this._read = options.read;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;
  }

  Stream.call(this);
}

Object.defineProperty(Readable.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined) {
      return false;
    }
    return this._readableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._readableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
  }
});

Readable.prototype.destroy = destroyImpl.destroy;
Readable.prototype._undestroy = destroyImpl.undestroy;
Readable.prototype._destroy = function (err, cb) {
  this.push(null);
  cb(err);
};

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;
  var skipChunkCheck;

  if (!state.objectMode) {
    if (typeof chunk === 'string') {
      encoding = encoding || state.defaultEncoding;
      if (encoding !== state.encoding) {
        chunk = Buffer.from(chunk, encoding);
        encoding = '';
      }
      skipChunkCheck = true;
    }
  } else {
    skipChunkCheck = true;
  }

  return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function (chunk) {
  return readableAddChunk(this, chunk, null, true, false);
};

function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
  var state = stream._readableState;
  if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else {
    var er;
    if (!skipChunkCheck) er = chunkInvalid(state, chunk);
    if (er) {
      stream.emit('error', er);
    } else if (state.objectMode || chunk && chunk.length > 0) {
      if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) {
        chunk = _uint8ArrayToBuffer(chunk);
      }

      if (addToFront) {
        if (state.endEmitted) stream.emit('error', new Error('stream.unshift() after end event'));else addChunk(stream, state, chunk, true);
      } else if (state.ended) {
        stream.emit('error', new Error('stream.push() after EOF'));
      } else {
        state.reading = false;
        if (state.decoder && !encoding) {
          chunk = state.decoder.write(chunk);
          if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);else maybeReadMore(stream, state);
        } else {
          addChunk(stream, state, chunk, false);
        }
      }
    } else if (!addToFront) {
      state.reading = false;
    }
  }

  return needMoreData(state);
}

function addChunk(stream, state, chunk, addToFront) {
  if (state.flowing && state.length === 0 && !state.sync) {
    stream.emit('data', chunk);
    stream.read(0);
  } else {
    // update the buffer info.
    state.length += state.objectMode ? 1 : chunk.length;
    if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

    if (state.needReadable) emitReadable(stream);
  }
  maybeReadMore(stream, state);
}

function chunkInvalid(state, chunk) {
  var er;
  if (!_isUint8Array(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}

// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
}

Readable.prototype.isPaused = function () {
  return this._readableState.flowing === false;
};

// backwards compatibility.
Readable.prototype.setEncoding = function (enc) {
  if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 8MB
var MAX_HWM = 0x800000;
function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2 to prevent increasing hwm excessively in
    // tiny amounts
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }
  return n;
}

// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function howMuchToRead(n, state) {
  if (n <= 0 || state.length === 0 && state.ended) return 0;
  if (state.objectMode) return 1;
  if (n !== n) {
    // Only flow one buffer at a time
    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
  }
  // If we're asking for more than the current hwm, then raise the hwm.
  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
  if (n <= state.length) return n;
  // Don't have enough
  if (!state.ended) {
    state.needReadable = true;
    return 0;
  }
  return state.length;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function (n) {
  debug('read', n);
  n = parseInt(n, 10);
  var state = this._readableState;
  var nOrig = n;

  if (n !== 0) state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  } else if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0) state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
    // If _read pushed data synchronously, then `reading` will be false,
    // and we need to re-evaluate how much data we can return to the user.
    if (!state.reading) n = howMuchToRead(nOrig, state);
  }

  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  } else {
    state.length -= n;
  }

  if (state.length === 0) {
    // If we have nothing in the buffer, then we want to know
    // as soon as we *do* get something into the buffer.
    if (!state.ended) state.needReadable = true;

    // If we tried to read() past the EOF, then emit end on the next tick.
    if (nOrig !== n && state.ended) endReadable(this);
  }

  if (ret !== null) this.emit('data', ret);

  return ret;
};

function onEofChunk(stream, state) {
  if (state.ended) return;
  if (state.decoder) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync) pna.nextTick(emitReadable_, stream);else emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}

// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    pna.nextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;else len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function (n) {
  this.emit('error', new Error('_read() is not implemented'));
};

Readable.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

  var endFn = doEnd ? onend : unpipe;
  if (state.endEmitted) pna.nextTick(endFn);else src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable, unpipeInfo) {
    debug('onunpipe');
    if (readable === src) {
      if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
        unpipeInfo.hasUnpiped = true;
        cleanup();
      }
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  var cleanedUp = false;
  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', unpipe);
    src.removeListener('data', ondata);

    cleanedUp = true;

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }

  // If the user pushes more data while we're writing to dest then we'll end up
  // in ondata again. However, we only want to increase awaitDrain once because
  // dest will only emit one 'drain' event for the multiple writes.
  // => Introduce a guard on increasing awaitDrain.
  var increasedAwaitDrain = false;
  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    increasedAwaitDrain = false;
    var ret = dest.write(chunk);
    if (false === ret && !increasedAwaitDrain) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      // => Check whether `dest` is still a piping destination.
      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
        debug('false write response, pause', src._readableState.awaitDrain);
        src._readableState.awaitDrain++;
        increasedAwaitDrain = true;
      }
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
  }

  // Make sure our error handler is attached before userland ones.
  prependListener(dest, 'error', onerror);

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function () {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;
    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}

Readable.prototype.unpipe = function (dest) {
  var state = this._readableState;
  var unpipeInfo = { hasUnpiped: false };

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0) return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;

    if (!dest) dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this, unpipeInfo);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++) {
      dests[i].emit('unpipe', this, unpipeInfo);
    }return this;
  }

  // try to find the right one.
  var index = indexOf(state.pipes, dest);
  if (index === -1) return this;

  state.pipes.splice(index, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];

  dest.emit('unpipe', this, unpipeInfo);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function (ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  if (ev === 'data') {
    // Start flowing on next tick if stream isn't explicitly paused
    if (this._readableState.flowing !== false) this.resume();
  } else if (ev === 'readable') {
    var state = this._readableState;
    if (!state.endEmitted && !state.readableListening) {
      state.readableListening = state.needReadable = true;
      state.emittedReadable = false;
      if (!state.reading) {
        pna.nextTick(nReadingNextTick, this);
      } else if (state.length) {
        emitReadable(this);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function () {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    pna.nextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  if (!state.reading) {
    debug('resume read 0');
    stream.read(0);
  }

  state.resumeScheduled = false;
  state.awaitDrain = 0;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}

Readable.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  while (state.flowing && stream.read() !== null) {}
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function (stream) {
  var _this = this;

  var state = this._readableState;
  var paused = false;

  stream.on('end', function () {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) _this.push(chunk);
    }

    _this.push(null);
  });

  stream.on('data', function (chunk) {
    debug('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk);

    // don't skip over falsy values in objectMode
    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    var ret = _this.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function (method) {
        return function () {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  }

  // proxy certain important events.
  for (var n = 0; n < kProxyEvents.length; n++) {
    stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
  }

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  this._read = function (n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return this;
};

Object.defineProperty(Readable.prototype, 'readableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._readableState.highWaterMark;
  }
});

// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromList(n, state) {
  // nothing buffered
  if (state.length === 0) return null;

  var ret;
  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
    // read it all, truncate the list
    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
    state.buffer.clear();
  } else {
    // read part of list
    ret = fromListPartial(n, state.buffer, state.decoder);
  }

  return ret;
}

// Extracts only enough buffered data to satisfy the amount requested.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromListPartial(n, list, hasStrings) {
  var ret;
  if (n < list.head.data.length) {
    // slice is the same for buffers and strings
    ret = list.head.data.slice(0, n);
    list.head.data = list.head.data.slice(n);
  } else if (n === list.head.data.length) {
    // first chunk is a perfect match
    ret = list.shift();
  } else {
    // result spans more than one buffer
    ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
  }
  return ret;
}

// Copies a specified amount of characters from the list of buffered data
// chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBufferString(n, list) {
  var p = list.head;
  var c = 1;
  var ret = p.data;
  n -= ret.length;
  while (p = p.next) {
    var str = p.data;
    var nb = n > str.length ? str.length : n;
    if (nb === str.length) ret += str;else ret += str.slice(0, n);
    n -= nb;
    if (n === 0) {
      if (nb === str.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = str.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

// Copies a specified amount of bytes from the list of buffered data chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBuffer(n, list) {
  var ret = Buffer.allocUnsafe(n);
  var p = list.head;
  var c = 1;
  p.data.copy(ret);
  n -= p.data.length;
  while (p = p.next) {
    var buf = p.data;
    var nb = n > buf.length ? buf.length : n;
    buf.copy(ret, ret.length - n, 0, nb);
    n -= nb;
    if (n === 0) {
      if (nb === buf.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = buf.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    pna.nextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  // Check that we didn't get one last unshift.
  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');
  }
}

function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./_stream_duplex":47,"./internal/streams/BufferList":52,"./internal/streams/destroy":53,"./internal/streams/stream":54,"_process":45,"core-util-is":18,"events":21,"inherits":29,"isarray":32,"process-nextick-args":44,"safe-buffer":59,"string_decoder/":61,"util":7}],50:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

'use strict';

module.exports = Transform;

var Duplex = require('./_stream_duplex');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(Transform, Duplex);

function afterTransform(er, data) {
  var ts = this._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb) {
    return this.emit('error', new Error('write callback called multiple times'));
  }

  ts.writechunk = null;
  ts.writecb = null;

  if (data != null) // single equals check for both `null` and `undefined`
    this.push(data);

  cb(er);

  var rs = this._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    this._read(rs.highWaterMark);
  }
}

function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);

  Duplex.call(this, options);

  this._transformState = {
    afterTransform: afterTransform.bind(this),
    needTransform: false,
    transforming: false,
    writecb: null,
    writechunk: null,
    writeencoding: null
  };

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;

    if (typeof options.flush === 'function') this._flush = options.flush;
  }

  // When the writable side finishes, then flush out anything remaining.
  this.on('prefinish', prefinish);
}

function prefinish() {
  var _this = this;

  if (typeof this._flush === 'function') {
    this._flush(function (er, data) {
      done(_this, er, data);
    });
  } else {
    done(this, null, null);
  }
}

Transform.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function (chunk, encoding, cb) {
  throw new Error('_transform() is not implemented');
};

Transform.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function (n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};

Transform.prototype._destroy = function (err, cb) {
  var _this2 = this;

  Duplex.prototype._destroy.call(this, err, function (err2) {
    cb(err2);
    _this2.emit('close');
  });
};

function done(stream, er, data) {
  if (er) return stream.emit('error', er);

  if (data != null) // single equals check for both `null` and `undefined`
    stream.push(data);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  if (stream._writableState.length) throw new Error('Calling transform done when ws.length != 0');

  if (stream._transformState.transforming) throw new Error('Calling transform done when still transforming');

  return stream.push(null);
}
},{"./_stream_duplex":47,"core-util-is":18,"inherits":29}],51:[function(require,module,exports){
(function (process,global,setImmediate){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.

'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

module.exports = Writable;

/* <replacement> */
function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
}

// It seems a linked list but it is not
// there will be only 2 of these for each stream
function CorkedRequest(state) {
  var _this = this;

  this.next = null;
  this.entry = null;
  this.finish = function () {
    onCorkedFinish(_this, state);
  };
}
/* </replacement> */

/*<replacement>*/
var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : pna.nextTick;
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Writable.WritableState = WritableState;

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

/*<replacement>*/
var internalUtil = {
  deprecate: require('util-deprecate')
};
/*</replacement>*/

/*<replacement>*/
var Stream = require('./internal/streams/stream');
/*</replacement>*/

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
var OurUint8Array = global.Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

/*</replacement>*/

var destroyImpl = require('./internal/streams/destroy');

util.inherits(Writable, Stream);

function nop() {}

function WritableState(options, stream) {
  Duplex = Duplex || require('./_stream_duplex');

  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  var isDuplex = stream instanceof Duplex;

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var writableHwm = options.writableHighWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (writableHwm || writableHwm === 0)) this.highWaterMark = writableHwm;else this.highWaterMark = defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // if _final has been called
  this.finalCalled = false;

  // drain event flag.
  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // has it been destroyed
  this.destroyed = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function (er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.bufferedRequest = null;
  this.lastBufferedRequest = null;

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;

  // count buffered requests
  this.bufferedRequestCount = 0;

  // allocate the first CorkedRequest, there is always
  // one allocated and free to use, and we maintain at most two
  this.corkedRequestsFree = new CorkedRequest(this);
}

WritableState.prototype.getBuffer = function getBuffer() {
  var current = this.bufferedRequest;
  var out = [];
  while (current) {
    out.push(current);
    current = current.next;
  }
  return out;
};

(function () {
  try {
    Object.defineProperty(WritableState.prototype, 'buffer', {
      get: internalUtil.deprecate(function () {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
    });
  } catch (_) {}
})();

// Test _writableState for inheritance to account for Duplex streams,
// whose prototype chain only points to Readable.
var realHasInstance;
if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
  realHasInstance = Function.prototype[Symbol.hasInstance];
  Object.defineProperty(Writable, Symbol.hasInstance, {
    value: function (object) {
      if (realHasInstance.call(this, object)) return true;
      if (this !== Writable) return false;

      return object && object._writableState instanceof WritableState;
    }
  });
} else {
  realHasInstance = function (object) {
    return object instanceof this;
  };
}

function Writable(options) {
  Duplex = Duplex || require('./_stream_duplex');

  // Writable ctor is applied to Duplexes, too.
  // `realHasInstance` is necessary because using plain `instanceof`
  // would return false, as no `_writableState` property is attached.

  // Trying to use the custom `instanceof` for Writable here will also break the
  // Node.js LazyTransform implementation, which has a non-trivial getter for
  // `_writableState` that would lead to infinite recursion.
  if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
    return new Writable(options);
  }

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;

    if (typeof options.writev === 'function') this._writev = options.writev;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;

    if (typeof options.final === 'function') this._final = options.final;
  }

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function () {
  this.emit('error', new Error('Cannot pipe, not readable'));
};

function writeAfterEnd(stream, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  pna.nextTick(cb, er);
}

// Checks that a user-supplied chunk is valid, especially for the particular
// mode the stream is in. Currently this means that `null` is never accepted
// and undefined/non-string values are only allowed in object mode.
function validChunk(stream, state, chunk, cb) {
  var valid = true;
  var er = false;

  if (chunk === null) {
    er = new TypeError('May not write null values to stream');
  } else if (typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  if (er) {
    stream.emit('error', er);
    pna.nextTick(cb, er);
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;
  var isBuf = !state.objectMode && _isUint8Array(chunk);

  if (isBuf && !Buffer.isBuffer(chunk)) {
    chunk = _uint8ArrayToBuffer(chunk);
  }

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

  if (typeof cb !== 'function') cb = nop;

  if (state.ended) writeAfterEnd(this, cb);else if (isBuf || validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function () {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
  this._writableState.defaultEncoding = encoding;
  return this;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = Buffer.from(chunk, encoding);
  }
  return chunk;
}

Object.defineProperty(Writable.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._writableState.highWaterMark;
  }
});

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
  if (!isBuf) {
    var newChunk = decodeChunk(state, chunk, encoding);
    if (chunk !== newChunk) {
      isBuf = true;
      encoding = 'buffer';
      chunk = newChunk;
    }
  }
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret) state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = {
      chunk: chunk,
      encoding: encoding,
      isBuf: isBuf,
      callback: cb,
      next: null
    };
    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }
    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;

  if (sync) {
    // defer the callback if we are being called synchronously
    // to avoid piling up things on the stack
    pna.nextTick(cb, er);
    // this can emit finish, and it will always happen
    // after error
    pna.nextTick(finishMaybe, stream, state);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
  } else {
    // the caller expect this to happen before if
    // it is async
    cb(er);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
    // this can emit finish, but finish must
    // always follow error
    finishMaybe(stream, state);
  }
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state);

    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      /*<replacement>*/
      asyncWrite(afterWrite, stream, state, finished, cb);
      /*</replacement>*/
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}

// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;

    var count = 0;
    var allBuffers = true;
    while (entry) {
      buffer[count] = entry;
      if (!entry.isBuf) allBuffers = false;
      entry = entry.next;
      count += 1;
    }
    buffer.allBuffers = allBuffers;

    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

    // doWrite is almost always async, defer these to save a bit of time
    // as the hot path ends with doWrite
    state.pendingcb++;
    state.lastBufferedRequest = null;
    if (holder.next) {
      state.corkedRequestsFree = holder.next;
      holder.next = null;
    } else {
      state.corkedRequestsFree = new CorkedRequest(state);
    }
    state.bufferedRequestCount = 0;
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      state.bufferedRequestCount--;
      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        break;
      }
    }

    if (entry === null) state.lastBufferedRequest = null;
  }

  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new Error('_write() is not implemented'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished) endWritable(this, state, cb);
};

function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}
function callFinal(stream, state) {
  stream._final(function (err) {
    state.pendingcb--;
    if (err) {
      stream.emit('error', err);
    }
    state.prefinished = true;
    stream.emit('prefinish');
    finishMaybe(stream, state);
  });
}
function prefinish(stream, state) {
  if (!state.prefinished && !state.finalCalled) {
    if (typeof stream._final === 'function') {
      state.pendingcb++;
      state.finalCalled = true;
      pna.nextTick(callFinal, stream, state);
    } else {
      state.prefinished = true;
      stream.emit('prefinish');
    }
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);
  if (need) {
    prefinish(stream, state);
    if (state.pendingcb === 0) {
      state.finished = true;
      stream.emit('finish');
    }
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished) pna.nextTick(cb);else stream.once('finish', cb);
  }
  state.ended = true;
  stream.writable = false;
}

function onCorkedFinish(corkReq, state, err) {
  var entry = corkReq.entry;
  corkReq.entry = null;
  while (entry) {
    var cb = entry.callback;
    state.pendingcb--;
    cb(err);
    entry = entry.next;
  }
  if (state.corkedRequestsFree) {
    state.corkedRequestsFree.next = corkReq;
  } else {
    state.corkedRequestsFree = corkReq;
  }
}

Object.defineProperty(Writable.prototype, 'destroyed', {
  get: function () {
    if (this._writableState === undefined) {
      return false;
    }
    return this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._writableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._writableState.destroyed = value;
  }
});

Writable.prototype.destroy = destroyImpl.destroy;
Writable.prototype._undestroy = destroyImpl.undestroy;
Writable.prototype._destroy = function (err, cb) {
  this.end();
  cb(err);
};
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("timers").setImmediate)

},{"./_stream_duplex":47,"./internal/streams/destroy":53,"./internal/streams/stream":54,"_process":45,"core-util-is":18,"inherits":29,"process-nextick-args":44,"safe-buffer":59,"timers":64,"util-deprecate":65}],52:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Buffer = require('safe-buffer').Buffer;
var util = require('util');

function copyBuffer(src, target, offset) {
  src.copy(target, offset);
}

module.exports = function () {
  function BufferList() {
    _classCallCheck(this, BufferList);

    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  BufferList.prototype.push = function push(v) {
    var entry = { data: v, next: null };
    if (this.length > 0) this.tail.next = entry;else this.head = entry;
    this.tail = entry;
    ++this.length;
  };

  BufferList.prototype.unshift = function unshift(v) {
    var entry = { data: v, next: this.head };
    if (this.length === 0) this.tail = entry;
    this.head = entry;
    ++this.length;
  };

  BufferList.prototype.shift = function shift() {
    if (this.length === 0) return;
    var ret = this.head.data;
    if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
    --this.length;
    return ret;
  };

  BufferList.prototype.clear = function clear() {
    this.head = this.tail = null;
    this.length = 0;
  };

  BufferList.prototype.join = function join(s) {
    if (this.length === 0) return '';
    var p = this.head;
    var ret = '' + p.data;
    while (p = p.next) {
      ret += s + p.data;
    }return ret;
  };

  BufferList.prototype.concat = function concat(n) {
    if (this.length === 0) return Buffer.alloc(0);
    if (this.length === 1) return this.head.data;
    var ret = Buffer.allocUnsafe(n >>> 0);
    var p = this.head;
    var i = 0;
    while (p) {
      copyBuffer(p.data, ret, i);
      i += p.data.length;
      p = p.next;
    }
    return ret;
  };

  return BufferList;
}();

if (util && util.inspect && util.inspect.custom) {
  module.exports.prototype[util.inspect.custom] = function () {
    var obj = util.inspect({ length: this.length });
    return this.constructor.name + ' ' + obj;
  };
}
},{"safe-buffer":59,"util":7}],53:[function(require,module,exports){
'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

// undocumented cb() API, needed for core, not for public API
function destroy(err, cb) {
  var _this = this;

  var readableDestroyed = this._readableState && this._readableState.destroyed;
  var writableDestroyed = this._writableState && this._writableState.destroyed;

  if (readableDestroyed || writableDestroyed) {
    if (cb) {
      cb(err);
    } else if (err && (!this._writableState || !this._writableState.errorEmitted)) {
      pna.nextTick(emitErrorNT, this, err);
    }
    return this;
  }

  // we set destroyed to true before firing error callbacks in order
  // to make it re-entrance safe in case destroy() is called within callbacks

  if (this._readableState) {
    this._readableState.destroyed = true;
  }

  // if this is a duplex stream mark the writable part as destroyed as well
  if (this._writableState) {
    this._writableState.destroyed = true;
  }

  this._destroy(err || null, function (err) {
    if (!cb && err) {
      pna.nextTick(emitErrorNT, _this, err);
      if (_this._writableState) {
        _this._writableState.errorEmitted = true;
      }
    } else if (cb) {
      cb(err);
    }
  });

  return this;
}

function undestroy() {
  if (this._readableState) {
    this._readableState.destroyed = false;
    this._readableState.reading = false;
    this._readableState.ended = false;
    this._readableState.endEmitted = false;
  }

  if (this._writableState) {
    this._writableState.destroyed = false;
    this._writableState.ended = false;
    this._writableState.ending = false;
    this._writableState.finished = false;
    this._writableState.errorEmitted = false;
  }
}

function emitErrorNT(self, err) {
  self.emit('error', err);
}

module.exports = {
  destroy: destroy,
  undestroy: undestroy
};
},{"process-nextick-args":44}],54:[function(require,module,exports){
module.exports = require('events').EventEmitter;

},{"events":21}],55:[function(require,module,exports){
module.exports = require('./readable').PassThrough

},{"./readable":56}],56:[function(require,module,exports){
exports = module.exports = require('./lib/_stream_readable.js');
exports.Stream = exports;
exports.Readable = exports;
exports.Writable = require('./lib/_stream_writable.js');
exports.Duplex = require('./lib/_stream_duplex.js');
exports.Transform = require('./lib/_stream_transform.js');
exports.PassThrough = require('./lib/_stream_passthrough.js');

},{"./lib/_stream_duplex.js":47,"./lib/_stream_passthrough.js":48,"./lib/_stream_readable.js":49,"./lib/_stream_transform.js":50,"./lib/_stream_writable.js":51}],57:[function(require,module,exports){
module.exports = require('./readable').Transform

},{"./readable":56}],58:[function(require,module,exports){
module.exports = require('./lib/_stream_writable.js');

},{"./lib/_stream_writable.js":51}],59:[function(require,module,exports){
/* eslint-disable node/no-deprecated-api */
var buffer = require('buffer')
var Buffer = buffer.Buffer

// alternative to using Object.keys for old browsers
function copyProps (src, dst) {
  for (var key in src) {
    dst[key] = src[key]
  }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer
} else {
  // Copy properties from require('buffer')
  copyProps(buffer, exports)
  exports.Buffer = SafeBuffer
}

function SafeBuffer (arg, encodingOrOffset, length) {
  return Buffer(arg, encodingOrOffset, length)
}

// Copy static methods from Buffer
copyProps(Buffer, SafeBuffer)

SafeBuffer.from = function (arg, encodingOrOffset, length) {
  if (typeof arg === 'number') {
    throw new TypeError('Argument must not be a number')
  }
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.alloc = function (size, fill, encoding) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  var buf = Buffer(size)
  if (fill !== undefined) {
    if (typeof encoding === 'string') {
      buf.fill(fill, encoding)
    } else {
      buf.fill(fill)
    }
  } else {
    buf.fill(0)
  }
  return buf
}

SafeBuffer.allocUnsafe = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return Buffer(size)
}

SafeBuffer.allocUnsafeSlow = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return buffer.SlowBuffer(size)
}

},{"buffer":9}],60:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Stream;

var EE = require('events').EventEmitter;
var inherits = require('inherits');

inherits(Stream, EE);
Stream.Readable = require('readable-stream/readable.js');
Stream.Writable = require('readable-stream/writable.js');
Stream.Duplex = require('readable-stream/duplex.js');
Stream.Transform = require('readable-stream/transform.js');
Stream.PassThrough = require('readable-stream/passthrough.js');

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;



// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EE.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

},{"events":21,"inherits":29,"readable-stream/duplex.js":46,"readable-stream/passthrough.js":55,"readable-stream/readable.js":56,"readable-stream/transform.js":57,"readable-stream/writable.js":58}],61:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
/*</replacement>*/

var isEncoding = Buffer.isEncoding || function (encoding) {
  encoding = '' + encoding;
  switch (encoding && encoding.toLowerCase()) {
    case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
      return true;
    default:
      return false;
  }
};

function _normalizeEncoding(enc) {
  if (!enc) return 'utf8';
  var retried;
  while (true) {
    switch (enc) {
      case 'utf8':
      case 'utf-8':
        return 'utf8';
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return 'utf16le';
      case 'latin1':
      case 'binary':
        return 'latin1';
      case 'base64':
      case 'ascii':
      case 'hex':
        return enc;
      default:
        if (retried) return; // undefined
        enc = ('' + enc).toLowerCase();
        retried = true;
    }
  }
};

// Do not cache `Buffer.isEncoding` when checking encoding names as some
// modules monkey-patch it to support additional encodings
function normalizeEncoding(enc) {
  var nenc = _normalizeEncoding(enc);
  if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
  return nenc || enc;
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters.
exports.StringDecoder = StringDecoder;
function StringDecoder(encoding) {
  this.encoding = normalizeEncoding(encoding);
  var nb;
  switch (this.encoding) {
    case 'utf16le':
      this.text = utf16Text;
      this.end = utf16End;
      nb = 4;
      break;
    case 'utf8':
      this.fillLast = utf8FillLast;
      nb = 4;
      break;
    case 'base64':
      this.text = base64Text;
      this.end = base64End;
      nb = 3;
      break;
    default:
      this.write = simpleWrite;
      this.end = simpleEnd;
      return;
  }
  this.lastNeed = 0;
  this.lastTotal = 0;
  this.lastChar = Buffer.allocUnsafe(nb);
}

StringDecoder.prototype.write = function (buf) {
  if (buf.length === 0) return '';
  var r;
  var i;
  if (this.lastNeed) {
    r = this.fillLast(buf);
    if (r === undefined) return '';
    i = this.lastNeed;
    this.lastNeed = 0;
  } else {
    i = 0;
  }
  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
  return r || '';
};

StringDecoder.prototype.end = utf8End;

// Returns only complete characters in a Buffer
StringDecoder.prototype.text = utf8Text;

// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
StringDecoder.prototype.fillLast = function (buf) {
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
  this.lastNeed -= buf.length;
};

// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
// continuation byte. If an invalid byte is detected, -2 is returned.
function utf8CheckByte(byte) {
  if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
  return byte >> 6 === 0x02 ? -1 : -2;
}

// Checks at most 3 bytes at the end of a Buffer in order to detect an
// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
// needed to complete the UTF-8 character (if applicable) are returned.
function utf8CheckIncomplete(self, buf, i) {
  var j = buf.length - 1;
  if (j < i) return 0;
  var nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 1;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 2;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) {
      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
    }
    return nb;
  }
  return 0;
}

// Validates as many continuation bytes for a multi-byte UTF-8 character as
// needed or are available. If we see a non-continuation byte where we expect
// one, we "replace" the validated continuation bytes we've seen so far with
// a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
// behavior. The continuation byte check is included three times in the case
// where all of the continuation bytes for a character exist in the same buffer.
// It is also done this way as a slight performance increase instead of using a
// loop.
function utf8CheckExtraBytes(self, buf, p) {
  if ((buf[0] & 0xC0) !== 0x80) {
    self.lastNeed = 0;
    return '\ufffd';
  }
  if (self.lastNeed > 1 && buf.length > 1) {
    if ((buf[1] & 0xC0) !== 0x80) {
      self.lastNeed = 1;
      return '\ufffd';
    }
    if (self.lastNeed > 2 && buf.length > 2) {
      if ((buf[2] & 0xC0) !== 0x80) {
        self.lastNeed = 2;
        return '\ufffd';
      }
    }
  }
}

// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
function utf8FillLast(buf) {
  var p = this.lastTotal - this.lastNeed;
  var r = utf8CheckExtraBytes(this, buf, p);
  if (r !== undefined) return r;
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, p, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, p, 0, buf.length);
  this.lastNeed -= buf.length;
}

// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
// partial character, the character's bytes are buffered until the required
// number of bytes are available.
function utf8Text(buf, i) {
  var total = utf8CheckIncomplete(this, buf, i);
  if (!this.lastNeed) return buf.toString('utf8', i);
  this.lastTotal = total;
  var end = buf.length - (total - this.lastNeed);
  buf.copy(this.lastChar, 0, end);
  return buf.toString('utf8', i, end);
}

// For UTF-8, a replacement character is added when ending on a partial
// character.
function utf8End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + '\ufffd';
  return r;
}

// UTF-16LE typically needs two bytes per character, but even if we have an even
// number of bytes available, we need to check if we end on a leading/high
// surrogate. In that case, we need to wait for the next two bytes in order to
// decode the last character properly.
function utf16Text(buf, i) {
  if ((buf.length - i) % 2 === 0) {
    var r = buf.toString('utf16le', i);
    if (r) {
      var c = r.charCodeAt(r.length - 1);
      if (c >= 0xD800 && c <= 0xDBFF) {
        this.lastNeed = 2;
        this.lastTotal = 4;
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
        return r.slice(0, -1);
      }
    }
    return r;
  }
  this.lastNeed = 1;
  this.lastTotal = 2;
  this.lastChar[0] = buf[buf.length - 1];
  return buf.toString('utf16le', i, buf.length - 1);
}

// For UTF-16LE we do not explicitly append special replacement characters if we
// end on a partial character, we simply let v8 handle that.
function utf16End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) {
    var end = this.lastTotal - this.lastNeed;
    return r + this.lastChar.toString('utf16le', 0, end);
  }
  return r;
}

function base64Text(buf, i) {
  var n = (buf.length - i) % 3;
  if (n === 0) return buf.toString('base64', i);
  this.lastNeed = 3 - n;
  this.lastTotal = 3;
  if (n === 1) {
    this.lastChar[0] = buf[buf.length - 1];
  } else {
    this.lastChar[0] = buf[buf.length - 2];
    this.lastChar[1] = buf[buf.length - 1];
  }
  return buf.toString('base64', i, buf.length - n);
}

function base64End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
  return r;
}

// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
function simpleWrite(buf) {
  return buf.toString(this.encoding);
}

function simpleEnd(buf) {
  return buf && buf.length ? this.write(buf) : '';
}
},{"safe-buffer":59}],62:[function(require,module,exports){
'use strict';
module.exports = x => {
	if (typeof x !== 'string') {
		throw new TypeError('Expected a string, got ' + typeof x);
	}

	// Catches EFBBBF (UTF-8 BOM) because the buffer-to-string
	// conversion translates it to FEFF (UTF-16 BOM)
	if (x.charCodeAt(0) === 0xFEFF) {
		return x.slice(1);
	}

	return x;
};

},{}],63:[function(require,module,exports){
'use strict';
module.exports = {
	stdout: false,
	stderr: false
};

},{}],64:[function(require,module,exports){
(function (setImmediate,clearImmediate){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this,require("timers").setImmediate,require("timers").clearImmediate)

},{"process/browser.js":45,"timers":64}],65:[function(require,module,exports){
(function (global){

/**
 * Module exports.
 */

module.exports = deprecate;

/**
 * Mark that a method should not be used.
 * Returns a modified function which warns once by default.
 *
 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
 *
 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
 * will throw an Error when invoked.
 *
 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
 * will invoke `console.trace()` instead of `console.error()`.
 *
 * @param {Function} fn - the function to deprecate
 * @param {String} msg - the string to print to the console when `fn` is invoked
 * @returns {Function} a new "deprecated" version of `fn`
 * @api public
 */

function deprecate (fn, msg) {
  if (config('noDeprecation')) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (config('throwDeprecation')) {
        throw new Error(msg);
      } else if (config('traceDeprecation')) {
        console.trace(msg);
      } else {
        console.warn(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}

/**
 * Checks `localStorage` for boolean values for the given `name`.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api private
 */

function config (name) {
  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
  try {
    if (!global.localStorage) return false;
  } catch (_) {
    return false;
  }
  var val = global.localStorage[name];
  if (null == val) return false;
  return String(val).toLowerCase() === 'true';
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],66:[function(require,module,exports){
arguments[4][4][0].apply(exports,arguments)
},{"dup":4}],67:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./support/isBuffer":66,"_process":45,"inherits":29}],68:[function(require,module,exports){
module.exports={
  "description": "👋 Hackable console logger for Node and Browser environments",
  "version": "1.2.1",
  "author": {
    "name": "Klaus Sinani",
    "email": "klauscfhq@protonmail.com",
    "url": "https://klauscfhq.github.io"
  },
  "contributors": [
    "Klaus Sinani <klauscfhq@protonmail.com> (https://klauscfhq.github.com/)",
    "Nick Baugh <niftylettuce@gmail.com> (https://niftylettuce.com/)"
  ],
  "browser": "dist/signale.js",
  "dependencies": {
    "ansi-html": "^0.0.7",
    "ansicolor": "^1.1.72",
    "chalk": "https://github.com/niftylettuce/chalk",
    "figures": "^2.0.0",
    "pkg-conf": "https://github.com/niftylettuce/pkg-conf"
  },
  "devDependencies": {
    "@babel/cli": "^7.0.0-beta.51",
    "@babel/core": "^7.0.0-beta.51",
    "@babel/preset-env": "^7.0.0-beta.51",
    "ava": "^1.0.0-beta.6",
    "babelify": "^9.0.0",
    "browserify": "https://github.com/niftylettuce/browserify",
    "caniuse-lite": "^1.0.30000856",
    "codecov": "^3.0.2",
    "cross-env": "^5.2.0",
    "eslint": "^4.19.1",
    "eslint-config-prettier": "^2.9.0",
    "eslint-plugin-compat": "^2.4.0",
    "eslint-plugin-prettier": "^2.6.0",
    "nyc": "^12.0.2",
    "prettier": "^1.13.5",
    "remark-cli": "^5.0.0",
    "remark-preset-github": "^0.0.8",
    "rimraf": "^2.6.2",
    "tinyify": "^2.4.3",
    "uglify-es": "^3.3.9",
    "xo": "^0.21.1"
  },
  "engines": {
    "node": ">=6.4"
  },
  "files": [
    "lib",
    "dist"
  ],
  "keywords": [
    "colorful",
    "console",
    "hackable",
    "logger"
  ],
  "license": "MIT",
  "main": "lib/index.js",
  "maintainers": [
    {
      "name": "Mario Sinani",
      "email": "mariosinani@protonmail.ch",
      "url": "https://mariocfhq.github.io"
    }
  ],
  "options": {
    "default": {
      "coloredInterpolation": false,
      "displayScope": true,
      "displayBadge": true,
      "displayDate": false,
      "displayFilename": false,
      "displayLabel": true,
      "displayTimestamp": false,
      "underlineLabel": true,
      "underlineMessage": false,
      "underlinePrefix": false,
      "underlineSuffix": false,
      "uppercaseLabel": false
    }
  },
  "remarkConfig": {
    "plugins": [
      "preset-github"
    ]
  },
  "repository": "klauscfhq/signale",
  "scripts": {
    "ava": "cross-env NODE_ENV=test ava",
    "browserify": "browserify src/index.js -o dist/signale.js -s Signale -d -t babelify",
    "build": "npm run build:clean && npm run build:lib && npm run build:dist",
    "build:clean": "rimraf lib dist",
    "build:dist": "npm run browserify && npm run minify",
    "build:lib": "babel src --out-dir lib",
    "coverage": "nyc report --reporter=text-lcov > coverage.lcov && codecov",
    "lint": "xo && remark . -qfo && eslint lib,dist",
    "minify": "browserify src/index.js -s Signale -d -t babelify -p tinyify | uglifyjs --source-map content=inline,includeSources,url=inline -cm -o dist/signale.min.js",
    "nyc": "cross-env NODE_ENV=test nyc ava",
    "precommit": "npm test",
    "test": "npm run build && npm run lint && npm run ava",
    "test-coverage": "npm run build && npm run lint && npm run nyc"
  },
  "unpkg": "dist/signale.min.js",
  "xo": {
    "extends": "prettier",
    "plugins": [
      "prettier"
    ],
    "parserOptions": {
      "sourceType": "script"
    },
    "env": [
      "node",
      "browser"
    ],
    "rules": {
      "prettier/prettier": [
        "error",
        {
          "singleQuote": true,
          "bracketSpacing": true,
          "trailingComma": "none"
        }
      ],
      "max-len": [
        "error",
        {
          "code": 80,
          "ignoreUrls": true
        }
      ],
      "capitalized-comments": "off",
      "camelcase": "off",
      "no-warning-comments": "off"
    },
    "space": true,
    "ignores": [
      "lib/**",
      "dist/**",
      "config.js"
    ]
  }
}

},{}],69:[function(require,module,exports){
(function (process){
"use strict";

function _toArray(arr) { return _arrayWithHoles(arr) || _iterableToArray(arr) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var util = require('util');

var path = require('path');

var chalk = require('chalk');

var figures = require('figures');

var pkgConf = require('pkg-conf');

var ansi = require('ansicolor');

var pkg = require('../package.json');

var defaultTypes = require('./types'); // determine if we're in a browser


var isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
var isPreviousLogInteractive = false;
var defaults = pkg.options.default;
var namespace = pkg.name;

var arrayify = function arrayify(x) {
  return Array.isArray(x) ? x : [x];
};

var now = function now() {
  return Date.now();
};

var timeSpan = function timeSpan(then) {
  return now() - then;
};

var Signale =
/*#__PURE__*/
function () {
  function Signale() {
    var _this = this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Signale);

    this._interactive = isBrowser ? false : options.interactive || false;
    this._config = Object.assign(this.packageConfiguration, options.config);
    this._customTypes = Object.assign({}, options.types);
    this._disabled = options.disabled || false;
    this._scopeName = options.scope || '';
    this._timers = options.timers || new Map();
    this._types = this._mergeTypes(defaultTypes, this._customTypes);
    this._stream = isBrowser ? {
      write: console.log
    } : options.stream || process.stdout;
    this._longestLabel = defaultTypes.start.label.length;
    Object.keys(this._types).forEach(function (type) {
      _this[type] = _this._logger.bind(_this, type);
    });

    for (var type in this._types) {
      if (this._types[type].label && this._types[type].label.length > this._longestLabel) {
        this._longestLabel = this._types[type].label.length;
      }
    }
  }

  _createClass(Signale, [{
    key: "_mergeTypes",
    value: function _mergeTypes(standard, custom) {
      var types = Object.assign({}, standard);
      Object.keys(custom).forEach(function (type) {
        types[type] = Object.assign({}, types[type], custom[type]);
      });
      return types;
    }
  }, {
    key: "_formatStream",
    value: function _formatStream(stream) {
      return arrayify(stream);
    }
  }, {
    key: "_formatDate",
    value: function _formatDate() {
      return `[${this.date}]`;
    }
  }, {
    key: "_formatFilename",
    value: function _formatFilename() {
      return `[${this.filename}]`;
    }
  }, {
    key: "_formatScopeName",
    value: function _formatScopeName() {
      if (Array.isArray(this._scopeName)) {
        var scopes = this._scopeName.filter(function (x) {
          return x.length !== 0;
        });

        return `${scopes.map(function (x) {
          return `[${x.trim()}]`;
        }).join(' ')}`;
      }

      return `[${this._scopeName}]`;
    }
  }, {
    key: "_formatTimestamp",
    value: function _formatTimestamp() {
      return `[${this.timestamp}]`;
    }
  }, {
    key: "_formatMessage",
    value: function _formatMessage(str, type) {
      str = arrayify(str);

      if (this._config.coloredInterpolation) {
        var _ = Object.assign({}, util.inspect.styles);

        Object.keys(util.inspect.styles).forEach(function (x) {
          util.inspect.styles[x] = type.color || _[x];
        });
        str = util.formatWithOptions.apply(util, [{
          colors: true
        }].concat(_toConsumableArray(str)));
        util.inspect.styles = Object.assign({}, _);
        return str;
      }

      return util.format.apply(util, _toConsumableArray(str));
    }
  }, {
    key: "_meta",
    value: function _meta() {
      var meta = [];

      if (this._config.displayDate) {
        meta.push(this._formatDate());
      }

      if (this._config.displayTimestamp) {
        meta.push(this._formatTimestamp());
      }

      if (this._config.displayFilename) {
        meta.push(this._formatFilename());
      }

      if (this._scopeName.length !== 0 && this._config.displayScope) {
        meta.push(this._formatScopeName());
      }

      if (meta.length !== 0) {
        meta.push(`${figures.pointerSmall}`);
        return meta.map(function (item) {
          return chalk.grey(item);
        });
      }

      return meta;
    }
  }, {
    key: "_hasAdditional",
    value: function _hasAdditional(_ref, args, type) {
      var suffix = _ref.suffix,
          prefix = _ref.prefix;
      return suffix || prefix ? '' : this._formatMessage(args, type);
    }
  }, {
    key: "_buildSignale",
    value: function _buildSignale(type) {
      var msg = {},
          additional = {};

      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
        if (args[0] instanceof Error) {
          msg = args[0];
        } else {
          var _args$ = args[0],
              prefix = _args$.prefix,
              message = _args$.message,
              suffix = _args$.suffix;
          additional = Object.assign({}, {
            suffix,
            prefix
          });
          msg = message ? this._formatMessage(message, type) : this._hasAdditional(additional, args, type);
        }
      } else {
        msg = this._formatMessage(args, type);
      }

      var signale = this._meta();

      if (additional.prefix) {
        if (this._config.underlinePrefix) {
          signale.push(chalk.underline(additional.prefix));
        } else {
          signale.push(additional.prefix);
        }
      }

      if (this._config.displayBadge && type.badge) {
        signale.push(chalk[type.color](type.badge.padEnd(type.badge.length + 1)));
      }

      if (this._config.displayLabel && type.label) {
        var label = this._config.uppercaseLabel ? type.label.toUpperCase() : type.label;

        if (this._config.underlineLabel) {
          signale.push(chalk[type.color].underline(label).padEnd(this._longestLabel + 20));
        } else {
          signale.push(chalk[type.color](label.padEnd(this._longestLabel + 1)));
        }
      }

      if (msg instanceof Error && msg.stack) {
        var _msg$stack$split = msg.stack.split('\n'),
            _msg$stack$split2 = _toArray(_msg$stack$split),
            name = _msg$stack$split2[0],
            rest = _msg$stack$split2.slice(1);

        if (this._config.underlineMessage) {
          signale.push(chalk.underline(name));
        } else {
          signale.push(name);
        }

        signale.push(chalk.grey(rest.map(function (l) {
          return l.replace(/^/, '\n');
        }).join('')));
        return signale.join(' ');
      }

      if (this._config.underlineMessage) {
        signale.push(chalk.underline(msg));
      } else {
        signale.push(msg);
      }

      if (additional.suffix) {
        if (this._config.underlineSuffix) {
          signale.push(chalk.underline(additional.suffix));
        } else {
          signale.push(additional.suffix);
        }
      }

      return signale.join(' ');
    }
  }, {
    key: "_write",
    value: function _write(stream, message) {
      if (isBrowser) {
        var parsed = ansi.parse(message);
        stream.write.apply(stream, _toConsumableArray(parsed.asChromeConsoleLogArguments));
        return;
      }

      if (this._interactive && isPreviousLogInteractive) {
        stream.moveCursor(0, -1);
        stream.clearLine();
        stream.cursorTo(0);
      }

      stream.write(message + '\n');
      isPreviousLogInteractive = this._interactive;
    }
  }, {
    key: "_log",
    value: function _log(message) {
      var _this2 = this;

      var streams = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this._stream;

      if (this.isEnabled) {
        this._formatStream(streams).forEach(function (stream) {
          _this2._write(stream, message);
        });
      }
    }
  }, {
    key: "_logger",
    value: function _logger(type) {
      for (var _len2 = arguments.length, messageObj = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        messageObj[_key2 - 1] = arguments[_key2];
      }

      this._log(this._buildSignale.apply(this, [this._types[type]].concat(messageObj)), this._types[type].stream);
    }
  }, {
    key: "config",
    value: function config(configObj) {
      this.configuration = configObj;
    }
  }, {
    key: "disable",
    value: function disable() {
      this._disabled = true;
    }
  }, {
    key: "enable",
    value: function enable() {
      this._disabled = false;
    }
  }, {
    key: "scope",
    value: function scope() {
      for (var _len3 = arguments.length, name = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        name[_key3] = arguments[_key3];
      }

      if (name.length === 0) {
        throw new Error('No scope name was defined.');
      }

      return new Signale(Object.assign(this.currentOptions, {
        scope: name
      }));
    }
  }, {
    key: "unscope",
    value: function unscope() {
      this._scopeName = '';
    }
  }, {
    key: "time",
    value: function time(label) {
      if (!label) {
        label = `timer_${this._timers.size}`;
      }

      this._timers.set(label, Date.now());

      var message = this._meta();

      var report = [chalk.green(this._types.start.badge.padEnd(2)), chalk.green.underline(label).padEnd(this._longestLabel + 20), 'Initialized timer...'];
      message.push.apply(message, report);

      this._log(message.join(' '));

      return label;
    }
  }, {
    key: "timeEnd",
    value: function timeEnd(label) {
      if (!label && this._timers.size) {
        var is = function is(x) {
          return x.includes('timer_');
        };

        label = _toConsumableArray(this._timers.keys()).reduceRight(function (x, y) {
          return is(x) ? x : is(y) ? y : null;
        });
      }

      if (this._timers.has(label)) {
        var span = timeSpan(this._timers.get(label));

        this._timers.delete(label);

        var message = this._meta();

        var report = [chalk.red(this._types.pause.badge.padEnd(2)), chalk.red.underline(label).padEnd(this._longestLabel + 20), 'Timer run for:', chalk.yellow(span < 1000 ? span + 'ms' : (span / 1000).toFixed(2) + 's')];
        message.push.apply(message, report);

        this._log(message.join(' '));

        return {
          label,
          span
        };
      }
    }
  }, {
    key: "scopeName",
    get: function get() {
      return this._scopeName;
    }
  }, {
    key: "currentOptions",
    get: function get() {
      return Object.assign({}, {
        config: this._config,
        disabled: this._disabled,
        types: this._customTypes,
        interactive: this._interactive,
        timers: this._timers,
        stream: this._stream
      });
    }
  }, {
    key: "isEnabled",
    get: function get() {
      return !this._disabled;
    }
  }, {
    key: "date",
    get: function get() {
      return new Date().toLocaleDateString();
    }
  }, {
    key: "timestamp",
    get: function get() {
      return new Date().toLocaleTimeString();
    }
  }, {
    key: "filename",
    get: function get() {
      var _ = Error.prepareStackTrace;

      Error.prepareStackTrace = function (error, stack) {
        return stack;
      };

      var _ref2 = new Error(),
          stack = _ref2.stack;

      Error.prepareStackTrace = _;
      var callers = stack.map(function (x) {
        return x.getFileName();
      });
      var firstExternalFilePath = callers.find(function (x) {
        return x !== callers[0];
      });
      return firstExternalFilePath ? path.basename(firstExternalFilePath) : 'anonymous';
    }
  }, {
    key: "packageConfiguration",
    get: function get() {
      return pkgConf.sync(namespace, {
        defaults
      });
    }
  }, {
    key: "configuration",
    set: function set(configObj) {
      this._config = Object.assign(this.packageConfiguration, configObj);
    }
  }]);

  return Signale;
}();

module.exports = Signale;

}).call(this,require('_process'))

},{"../package.json":68,"./types":70,"_process":45,"ansicolor":1,"chalk":10,"figures":22,"path":40,"pkg-conf":43,"util":67}],70:[function(require,module,exports){
"use strict";

var figures = require('figures');

module.exports = {
  error: {
    badge: figures.cross,
    color: 'red',
    label: 'error'
  },
  fatal: {
    badge: figures.cross,
    color: 'red',
    label: 'fatal'
  },
  fav: {
    badge: figures('❤'),
    color: 'magenta',
    label: 'favorite'
  },
  info: {
    badge: figures.info,
    color: 'blue',
    label: 'info'
  },
  star: {
    badge: figures.star,
    color: 'yellow',
    label: 'star'
  },
  success: {
    badge: figures.tick,
    color: 'green',
    label: 'success'
  },
  warn: {
    badge: figures.warning,
    color: 'yellow',
    label: 'warning'
  },
  complete: {
    badge: figures.checkboxOn,
    color: 'cyan',
    label: 'complete'
  },
  pending: {
    badge: figures.checkboxOff,
    color: 'magenta',
    label: 'pending'
  },
  note: {
    badge: figures.bullet,
    color: 'blue',
    label: 'note'
  },
  start: {
    badge: figures.play,
    color: 'green',
    label: 'start'
  },
  pause: {
    badge: figures.squareSmallFilled,
    color: 'yellow',
    label: 'pause'
  },
  debug: {
    badge: figures('⬤'),
    color: 'red',
    label: 'debug'
  },
  await: {
    badge: figures.ellipsis,
    color: 'blue',
    label: 'awaiting'
  },
  watch: {
    badge: figures.ellipsis,
    color: 'yellow',
    label: 'watching'
  },
  log: {
    badge: '',
    color: '',
    label: ''
  }
};

},{"figures":22}]},{},[69])(69)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYW5zaWNvbG9yL2Fuc2ljb2xvci5qcyIsIm5vZGVfbW9kdWxlcy9hc3NlcnQvYXNzZXJ0LmpzIiwibm9kZV9tb2R1bGVzL2Fzc2VydC9ub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9hc3NlcnQvbm9kZV9tb2R1bGVzL3V0aWwvc3VwcG9ydC9pc0J1ZmZlckJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvYXNzZXJ0L25vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiLCJub2RlX21vZHVsZXMvYmFzZTY0LWpzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXItcmVzb2x2ZS9lbXB0eS5qcyIsIm5vZGVfbW9kdWxlcy9idWZmZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvY2hhbGsvbGliL25vZGVfbW9kdWxlcy9jaGFsay9zcmMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvY2hhbGsvc3JjL3RlbXBsYXRlcy5qcyIsIm5vZGVfbW9kdWxlcy9jaGFsay9ub2RlX21vZHVsZXMvYW5zaS1zdHlsZXMvc3JjL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2NoYWxrL25vZGVfbW9kdWxlcy9jb2xvci1jb252ZXJ0L3NyYy9jb252ZXJzaW9ucy5qcyIsIm5vZGVfbW9kdWxlcy9jaGFsay9ub2RlX21vZHVsZXMvY29sb3ItY29udmVydC9zcmMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvY2hhbGsvbm9kZV9tb2R1bGVzL2NvbG9yLWNvbnZlcnQvc3JjL3JvdXRlLmpzIiwibm9kZV9tb2R1bGVzL2NoYWxrL25vZGVfbW9kdWxlcy9jb2xvci1uYW1lL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2NvbnN0YW50cy1icm93c2VyaWZ5L2NvbnN0YW50cy5qc29uIiwibm9kZV9tb2R1bGVzL2NvcmUtdXRpbC1pcy9saWIvdXRpbC5qcyIsIm5vZGVfbW9kdWxlcy9lcnJvci1leC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9lc2NhcGUtc3RyaW5nLXJlZ2V4cC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9ldmVudHMvZXZlbnRzLmpzIiwibm9kZV9tb2R1bGVzL2ZpZ3VyZXMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZmluZC11cC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9ncmFjZWZ1bC1mcy9mcy5qcyIsIm5vZGVfbW9kdWxlcy9ncmFjZWZ1bC1mcy9ncmFjZWZ1bC1mcy5qcyIsIm5vZGVfbW9kdWxlcy9ncmFjZWZ1bC1mcy9sZWdhY3ktc3RyZWFtcy5qcyIsIm5vZGVfbW9kdWxlcy9ncmFjZWZ1bC1mcy9wb2x5ZmlsbHMuanMiLCJub2RlX21vZHVsZXMvaWVlZTc1NC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9pcy1hcnJheWlzaC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9pcy1idWZmZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvaXNhcnJheS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9qc29uLXBhcnNlLWJldHRlci1lcnJvcnMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvbG9hZC1qc29uLWZpbGUvaW5kZXguanMiLCJub2RlX21vZHVsZXMvbG9jYXRlLXBhdGgvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcC1saW1pdC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9wLWxvY2F0ZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9wLXRyeS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9wYXJzZS1qc29uL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3BhdGgtYnJvd3NlcmlmeS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9wYXRoLWV4aXN0cy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9waWZ5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3BrZy1jb25mL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MtbmV4dGljay1hcmdzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9yZWFkYWJsZS1zdHJlYW0vZHVwbGV4LWJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvcmVhZGFibGUtc3RyZWFtL2xpYi9fc3RyZWFtX2R1cGxleC5qcyIsIm5vZGVfbW9kdWxlcy9yZWFkYWJsZS1zdHJlYW0vbGliL19zdHJlYW1fcGFzc3Rocm91Z2guanMiLCJub2RlX21vZHVsZXMvcmVhZGFibGUtc3RyZWFtL2xpYi9fc3RyZWFtX3JlYWRhYmxlLmpzIiwibm9kZV9tb2R1bGVzL3JlYWRhYmxlLXN0cmVhbS9saWIvX3N0cmVhbV90cmFuc2Zvcm0uanMiLCJub2RlX21vZHVsZXMvcmVhZGFibGUtc3RyZWFtL2xpYi9fc3RyZWFtX3dyaXRhYmxlLmpzIiwibm9kZV9tb2R1bGVzL3JlYWRhYmxlLXN0cmVhbS9saWIvaW50ZXJuYWwvc3RyZWFtcy9CdWZmZXJMaXN0LmpzIiwibm9kZV9tb2R1bGVzL3JlYWRhYmxlLXN0cmVhbS9saWIvaW50ZXJuYWwvc3RyZWFtcy9kZXN0cm95LmpzIiwibm9kZV9tb2R1bGVzL3JlYWRhYmxlLXN0cmVhbS9saWIvaW50ZXJuYWwvc3RyZWFtcy9zdHJlYW0tYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9yZWFkYWJsZS1zdHJlYW0vcGFzc3Rocm91Z2guanMiLCJub2RlX21vZHVsZXMvcmVhZGFibGUtc3RyZWFtL3JlYWRhYmxlLWJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvcmVhZGFibGUtc3RyZWFtL3RyYW5zZm9ybS5qcyIsIm5vZGVfbW9kdWxlcy9yZWFkYWJsZS1zdHJlYW0vd3JpdGFibGUtYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9zYWZlLWJ1ZmZlci9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9zdHJlYW0tYnJvd3NlcmlmeS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9zdHJpbmdfZGVjb2Rlci9saWIvc3RyaW5nX2RlY29kZXIuanMiLCJub2RlX21vZHVsZXMvc3RyaXAtYm9tL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3N1cHBvcnRzLWNvbG9yL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdGltZXJzLWJyb3dzZXJpZnkvbWFpbi5qcyIsIm5vZGVfbW9kdWxlcy91dGlsLWRlcHJlY2F0ZS9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3V0aWwvdXRpbC5qcyIsInBhY2thZ2UuanNvbiIsInNyYy9pbmRleC5qcyIsInNyYy90eXBlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOztBQUVBOzs7Ozs7QUFFQSxNQUFNLElBQUksTUFBVjs7QUFFQTs7O0FBR0EsTUFBTSxhQUFrQixDQUFJLE9BQUosRUFBa0IsS0FBbEIsRUFBOEIsT0FBOUIsRUFBNEMsUUFBNUMsRUFBMkQsTUFBM0QsRUFBd0UsU0FBeEUsRUFBd0YsTUFBeEYsRUFBZ0csV0FBaEcsRUFBNkcsRUFBN0csRUFBaUgsU0FBakgsQ0FBeEI7QUFBQSxNQUNNLGtCQUFrQixDQUFDLFVBQUQsRUFBYSxVQUFiLEVBQXlCLFlBQXpCLEVBQXVDLGFBQXZDLEVBQXNELFdBQXRELEVBQW1FLGNBQW5FLEVBQW1GLFdBQW5GLEVBQWdHLE9BQWhHLEVBQXlHLEVBQXpHLENBRHhCO0FBQUEsTUFHTSxhQUFhLENBQUMsRUFBRCxFQUFLLFFBQUwsRUFBZSxLQUFmLEVBQXNCLFFBQXRCLEVBQWdDLFdBQWhDLEVBQTZDLEVBQTdDLEVBQWlELEVBQWpELEVBQXFELFNBQXJELENBSG5CO0FBQUEsTUFLTSxXQUFXLEVBQUUsT0FBYSxVQUFmO0FBQ0UsYUFBYSxZQURmO0FBRUUsY0FBYSxhQUZmO0FBR0UsWUFBYSxXQUhmO0FBSUUsZUFBYSxjQUpmO0FBS0UsWUFBYSxXQUxmO0FBTUUsYUFBYSxVQU5mO0FBT0UsaUJBQWEsT0FQZixFQUxqQjtBQUFBLE1BY00sUUFBUSxFQUFFLEdBQUksT0FBTjtBQUNFLE9BQUksU0FETjtBQUVFLE9BQUksT0FGTjtBQUdFLE9BQUksWUFITjtBQUlFLE9BQUks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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzFlQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzFrQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SkE7Ozs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDak5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzNHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzNnQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNuSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDeFFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDdEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDMVVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNqaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TEE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzEvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3JOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM5cUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pFQTtBQUNBOztBQ0RBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBOztBQ0RBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7OztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDMWtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUMvSUEsSUFBTSxPQUFPLFFBQVEs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QU87QUFISCxHQTlDUztBQW1EZixTQUFPO0FBQ0wsV0FBTyxRQUFRLElBRFY7QUFFTCxXQUFPLE9BRkY7QUFHTCxXQUFPO0FBSEYsR0FuRFE7QUF3RGYsU0FBTztBQUNMLFdBQU8sUUFBUSxpQkFEVjtBQUVMLFdBQU8sUUFGRjtBQUdMLFdBQU87QUFIRixHQXhEUTtBQTZEZixTQUFPO0FBQ0wsV0FBTyxRQUFRLEdBQVIsQ0FERjtBQUVMLFdBQU8sS0FGRjtBQUdMLFdBQU87QUFIRixHQTdEUTtBQWtFZixTQUFPO0FBQ0wsV0FBTyxRQUFRLFFBRFY7QUFFTCxXQUFPLE1BRkY7QUFHTCxXQUFPO0FBSEYsR0FsRVE7QUF1RWYsU0FBTztBQUNMLFdBQU8sUUFBUSxRQURWO0FBRUwsV0FBTyxRQUZGO0FBR0wsV0FBTztBQUhGLEdBdkVRO0FBNEVmLE9BQUs7QUFDSCxXQUFPLEVBREo7QUFFSCxXQUFPLEVBRko7QUFHSCxXQUFPO0FBSEo7QUE1RVUsQ0FBakIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJcInVzZSBzdHJpY3RcIjtcblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5jb25zdCBPID0gT2JqZWN0XG5cbi8qICBTZWUgaHR0cHM6Ly9taXNjLmZsb2dpc29mdC5jb20vYmFzaC90aXBfY29sb3JzX2FuZF9mb3JtYXR0aW5nXG4gICAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbmNvbnN0IGNvbG9yQ29kZXMgICAgICA9IFsgICAnYmxhY2snLCAgICAgICdyZWQnLCAgICAgICdncmVlbicsICAgICAgJ3llbGxvdycsICAgICAgJ2JsdWUnLCAgICAgICdtYWdlbnRhJywgICAgICAnY3lhbicsICdsaWdodEdyYXknLCAnJywgJ2RlZmF1bHQnXVxuICAgICwgY29sb3JDb2Rlc0xpZ2h0ID0gWydkYXJrR3JheScsICdsaWdodFJlZCcsICdsaWdodEdyZWVuJywgJ2xpZ2h0WWVsbG93JywgJ2xpZ2h0Qmx1ZScsICdsaWdodE1hZ2VudGEnLCAnbGlnaHRDeWFuJywgJ3doaXRlJywgJyddXG4gICAgXG4gICAgLCBzdHlsZUNvZGVzID0gWycnLCAnYnJpZ2h0JywgJ2RpbScsICdpdGFsaWMnLCAndW5kZXJsaW5lJywgJycsICcnLCAnaW52ZXJzZSddXG5cbiAgICAsIGFzQnJpZ2h0ID0geyAncmVkJzogICAgICAgJ2xpZ2h0UmVkJyxcbiAgICAgICAgICAgICAgICAgICAnZ3JlZW4nOiAgICAgJ2xpZ2h0R3JlZW4nLFxuICAgICAgICAgICAgICAgICAgICd5ZWxsb3cnOiAgICAnbGlnaHRZZWxsb3cnLFxuICAgICAgICAgICAgICAgICAgICdibHVlJzogICAgICAnbGlnaHRCbHVlJyxcbiAgICAgICAgICAgICAgICAgICAnbWFnZW50YSc6ICAgJ2xpZ2h0TWFnZW50YScsXG4gICAgICAgICAgICAgICAgICAgJ2N5YW4nOiAgICAgICdsaWdodEN5YW4nLFxuICAgICAgICAgICAgICAgICAgICdibGFjayc6ICAgICAnZGFya0dyYXknLFxuICAgICAgICAgICAgICAgICAgICdsaWdodEdyYXknOiAnd2hpdGUnIH1cbiAgICBcbiAgICAsIHR5cGVzID0geyAwOiAgJ3N0eWxlJyxcbiAgICAgICAgICAgICAgICAyOiAgJ3Vuc3R5bGUnLFxuICAgICAgICAgICAgICAgIDM6ICAnY29sb3InLFxuICAgICAgICAgICAgICAgIDk6ICAnY29sb3JMaWdodCcsXG4gICAgICAgICAgICAgICAgNDogICdiZ0NvbG9yJyxcbiAgICAgICAgICAgICAgICAxMDogJ2JnQ29sb3JMaWdodCcgfVxuXG4gICAgLCBzdWJ0eXBlcyA9IHsgIGNvbG9yOiAgICAgICAgIGNvbG9yQ29kZXMsXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yTGlnaHQ6ICAgIGNvbG9yQ29kZXNMaWdodCxcbiAgICAgICAgICAgICAgICAgICAgYmdDb2xvcjogICAgICAgY29sb3JDb2RlcyxcbiAgICAgICAgICAgICAgICAgICAgYmdDb2xvckxpZ2h0OiAgY29sb3JDb2Rlc0xpZ2h0LFxuICAgICAgICAgICAgICAgICAgICBzdHlsZTogICAgICAgICBzdHlsZUNvZGVzLFxuICAgICAgICAgICAgICAgICAgICB1bnN0eWxlOiAgICAgICBzdHlsZUNvZGVzICAgIH1cblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5jb25zdCBjbGVhbiA9IG9iaiA9PiB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBrIGluIG9iaikgeyBpZiAoIW9ialtrXSkgeyBkZWxldGUgb2JqW2tdIH0gfVxuICAgICAgICAgICAgICAgIHJldHVybiAoTy5rZXlzIChvYmopLmxlbmd0aCA9PT0gMCkgPyB1bmRlZmluZWQgOiBvYmpcbiAgICAgICAgICAgIH1cblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5jbGFzcyBDb2xvciB7XG5cbiAgICBjb25zdHJ1Y3RvciAoYmFja2dyb3VuZCwgbmFtZSwgYnJpZ2h0bmVzcykge1xuXG4gICAgICAgIHRoaXMuYmFja2dyb3VuZCA9IGJhY2tncm91bmRcbiAgICAgICAgdGhpcy5uYW1lICAgICAgID0gbmFtZVxuICAgICAgICB0aGlzLmJyaWdodG5lc3MgPSBicmlnaHRuZXNzXG4gICAgfVxuXG4gICAgZ2V0IGludmVyc2UgKCkge1xuICAgICAgICByZXR1cm4gbmV3IENvbG9yICghdGhpcy5iYWNrZ3JvdW5kLCB0aGlzLm5hbWUgfHwgKHRoaXMuYmFja2dyb3VuZCA/ICdibGFjaycgOiAnd2hpdGUnKSwgdGhpcy5icmlnaHRuZXNzKVxuICAgIH1cblxuICAgIGdldCBjbGVhbiAoKSB7XG4gICAgICAgIHJldHVybiBjbGVhbiAoeyBuYW1lOiAgIHRoaXMubmFtZSA9PT0gJ2RlZmF1bHQnID8gJycgOiB0aGlzLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBicmlnaHQ6IHRoaXMuYnJpZ2h0bmVzcyA9PT0gQ29kZS5icmlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICBkaW06ICAgIHRoaXMuYnJpZ2h0bmVzcyA9PT0gQ29kZS5kaW0gfSlcbiAgICB9XG5cbiAgICBkZWZhdWx0QnJpZ2h0bmVzcyAodmFsdWUpIHtcblxuICAgICAgICByZXR1cm4gbmV3IENvbG9yICh0aGlzLmJhY2tncm91bmQsIHRoaXMubmFtZSwgdGhpcy5icmlnaHRuZXNzIHx8IHZhbHVlKVxuICAgIH1cblxuICAgIGNzcyAoaW52ZXJ0ZWQpIHtcblxuICAgICAgICBjb25zdCBjb2xvciA9IGludmVydGVkID8gdGhpcy5pbnZlcnNlIDogdGhpc1xuXG4gICAgICAgIGNvbnN0IHJnYk5hbWUgPSAoKGNvbG9yLmJyaWdodG5lc3MgPT09IENvZGUuYnJpZ2h0KSAmJiBhc0JyaWdodFtjb2xvci5uYW1lXSkgfHwgY29sb3IubmFtZVxuXG4gICAgICAgIGNvbnN0IHByb3AgPSAoY29sb3IuYmFja2dyb3VuZCA/ICdiYWNrZ3JvdW5kOicgOiAnY29sb3I6JylcbiAgICAgICAgICAgICwgcmdiICA9IENvbG9ycy5yZ2JbcmdiTmFtZV1cbiAgICAgICAgICAgICwgYWxwaGEgPSAodGhpcy5icmlnaHRuZXNzID09PSBDb2RlLmRpbSkgPyAwLjUgOiAxXG5cbiAgICAgICAgcmV0dXJuIHJnYlxuICAgICAgICAgICAgICAgID8gKHByb3AgKyAncmdiYSgnICsgWy4uLnJnYiwgYWxwaGFdLmpvaW4gKCcsJykgKyAnKTsnKVxuICAgICAgICAgICAgICAgIDogKCghY29sb3IuYmFja2dyb3VuZCAmJiAoYWxwaGEgPCAxKSkgPyAnY29sb3I6cmdiYSgwLDAsMCwwLjUpOycgOiAnJykgLy8gQ2hyb21lIGRvZXMgbm90IHN1cHBvcnQgJ29wYWNpdHknIHByb3BlcnR5Li4uXG4gICAgfVxufVxuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbmNsYXNzIENvZGUge1xuXG4gICAgY29uc3RydWN0b3IgKG4pIHtcbiAgICAgICAgaWYgKG4gIT09IHVuZGVmaW5lZCkgeyB0aGlzLnZhbHVlID0gTnVtYmVyIChuKSB9IH1cblxuICAgIGdldCB0eXBlICgpIHtcbiAgICAgICByZXR1cm4gdHlwZXNbTWF0aC5mbG9vciAodGhpcy52YWx1ZSAvIDEwKV0gfVxuXG4gICAgZ2V0IHN1YnR5cGUgKCkge1xuICAgICAgICByZXR1cm4gc3VidHlwZXNbdGhpcy50eXBlXVt0aGlzLnZhbHVlICUgMTBdIH1cblxuICAgIGdldCBzdHIgKCkge1xuICAgICAgICByZXR1cm4gKHRoaXMudmFsdWUgPyAoJ1xcdTAwMWJcXFsnICsgdGhpcy52YWx1ZSArICdtJykgOiAnJykgfVxuXG4gICAgc3RhdGljIHN0ciAoeCkge1xuICAgICAgICByZXR1cm4gbmV3IENvZGUgKHgpLnN0ciB9XG5cbiAgICBnZXQgaXNCcmlnaHRuZXNzICgpIHtcbiAgICAgICAgcmV0dXJuICh0aGlzLnZhbHVlID09PSBDb2RlLm5vQnJpZ2h0bmVzcykgfHwgKHRoaXMudmFsdWUgPT09IENvZGUuYnJpZ2h0KSB8fCAodGhpcy52YWx1ZSA9PT0gQ29kZS5kaW0pIH1cbn1cblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5PLmFzc2lnbiAoQ29kZSwge1xuXG4gICAgYnJpZ2h0OiAgICAgICAxLFxuICAgIGRpbTogICAgICAgICAgMixcbiAgICBpbnZlcnNlOiAgICAgIDcsXG4gICAgbm9CcmlnaHRuZXNzOiAyMixcbiAgICBub0l0YWxpYzogICAgIDIzLFxuICAgIG5vVW5kZXJsaW5lOiAgMjQsXG4gICAgbm9JbnZlcnNlOiAgICAyNyxcbiAgICBub0NvbG9yOiAgICAgIDM5LFxuICAgIG5vQmdDb2xvcjogICAgNDlcbn0pXG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuY29uc3QgcmVwbGFjZUFsbCA9IChzdHIsIGEsIGIpID0+IHN0ci5zcGxpdCAoYSkuam9pbiAoYilcblxuLyogIEFOU0kgYnJpZ2h0bmVzcyBjb2RlcyBkbyBub3Qgb3ZlcmxhcCwgZS5nLiBcInticmlnaHR9e2RpbX1mb29cIiB3aWxsIGJlIHJlbmRlcmVkIGJyaWdodCAobm90IGRpbSkuXG4gICAgU28gd2UgZml4IGl0IGJ5IGFkZGluZyBicmlnaHRuZXNzIGNhbmNlbGluZyBiZWZvcmUgZWFjaCBicmlnaHRuZXNzIGNvZGUsIHNvIHRoZSBmb3JtZXIgZXhhbXBsZSBnZXRzXG4gICAgY29udmVydGVkIHRvIFwie25vQnJpZ2h0bmVzc317YnJpZ2h0fXtub0JyaWdodG5lc3N9e2RpbX1mb29cIiDigJMgdGhpcyB3YXkgaXQgZ2V0cyByZW5kZXJlZCBhcyBleHBlY3RlZC5cbiAqL1xuXG5jb25zdCBkZW5vcm1hbGl6ZUJyaWdodG5lc3MgPSBzID0+IHMucmVwbGFjZSAoLyhcXHUwMDFiXFxbKDF8MiltKS9nLCAnXFx1MDAxYlsyMm0kMScpXG5jb25zdCBub3JtYWxpemVCcmlnaHRuZXNzID0gcyA9PiBzLnJlcGxhY2UgKC9cXHUwMDFiXFxbMjJtKFxcdTAwMWJcXFsoMXwyKW0pL2csICckMScpXG5cbmNvbnN0IHdyYXAgPSAoeCwgb3BlbkNvZGUsIGNsb3NlQ29kZSkgPT4ge1xuXG4gICAgY29uc3Qgb3BlbiAgPSBDb2RlLnN0ciAob3BlbkNvZGUpLFxuICAgICAgICAgIGNsb3NlID0gQ29kZS5zdHIgKGNsb3NlQ29kZSlcblxuICAgIHJldHVybiBTdHJpbmcgKHgpXG4gICAgICAgICAgICAgICAgLnNwbGl0ICgnXFxuJylcbiAgICAgICAgICAgICAgICAubWFwIChsaW5lID0+IGRlbm9ybWFsaXplQnJpZ2h0bmVzcyAob3BlbiArIHJlcGxhY2VBbGwgKG5vcm1hbGl6ZUJyaWdodG5lc3MgKGxpbmUpLCBjbG9zZSwgb3BlbikgKyBjbG9zZSkpXG4gICAgICAgICAgICAgICAgLmpvaW4gKCdcXG4nKVxufVxuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbmNvbnN0IGNhbWVsID0gKGEsIGIpID0+IGEgKyBiLmNoYXJBdCAoMCkudG9VcHBlckNhc2UgKCkgKyBiLnNsaWNlICgxKVxuXG5cbmNvbnN0IHN0cmluZ1dyYXBwaW5nTWV0aG9kcyA9ICgoKSA9PiBbXG5cbiAgICAgICAgLi4uY29sb3JDb2Rlcy5tYXAgKChrLCBpKSA9PiAhayA/IFtdIDogWyAvLyBjb2xvciBtZXRob2RzXG5cbiAgICAgICAgICAgIFtrLCAgICAgICAgICAgICAgIDMwICsgaSwgQ29kZS5ub0NvbG9yXSxcbiAgICAgICAgICAgIFtjYW1lbCAoJ2JnJywgayksIDQwICsgaSwgQ29kZS5ub0JnQ29sb3JdLFxuICAgICAgICBdKSxcblxuICAgICAgICAuLi5jb2xvckNvZGVzTGlnaHQubWFwICgoaywgaSkgPT4gIWsgPyBbXSA6IFsgLy8gbGlnaHQgY29sb3IgbWV0aG9kc1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBbaywgICAgICAgICAgICAgICAgOTAgKyBpLCBDb2RlLm5vQ29sb3JdLFxuICAgICAgICAgICAgW2NhbWVsICgnYmcnLCBrKSwgMTAwICsgaSwgQ29kZS5ub0JnQ29sb3JdLFxuICAgICAgICBdKSxcblxuICAgICAgICAvKiBUSElTIE9ORSBJUyBGT1IgQkFDS1dBUkRTIENPTVBBVElCSUxJVFkgV0lUSCBQUkVWSU9VUyBWRVJTSU9OUyAoaGFkICdicmlnaHQnIGluc3RlYWQgb2YgJ2xpZ2h0JyBmb3IgYmFja2dyb3VuZHMpXG4gICAgICAgICAqL1xuICAgICAgICAuLi5bJycsICdCcmlnaHRSZWQnLCAnQnJpZ2h0R3JlZW4nLCAnQnJpZ2h0WWVsbG93JywgJ0JyaWdodEJsdWUnLCAnQnJpZ2h0TWFnZW50YScsICdCcmlnaHRDeWFuJ10ubWFwICgoaywgaSkgPT4gIWsgPyBbXSA6IFtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgWydiZycgKyBrLCAxMDAgKyBpLCBDb2RlLm5vQmdDb2xvcl0sXG4gICAgICAgIF0pLFxuICAgICAgICBcbiAgICAgICAgLi4uc3R5bGVDb2Rlcy5tYXAgKChrLCBpKSA9PiAhayA/IFtdIDogWyAvLyBzdHlsZSBtZXRob2RzXG5cbiAgICAgICAgICAgIFtrLCBpLCAoKGsgPT09ICdicmlnaHQnKSB8fCAoayA9PT0gJ2RpbScpKSA/IENvZGUubm9CcmlnaHRuZXNzIDogKDIwICsgaSldXG4gICAgICAgIF0pXG4gICAgXVxuICAgIC5yZWR1Y2UgKChhLCBiKSA9PiBhLmNvbmNhdCAoYikpXG4gICAgXG4pICgpO1xuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbmNvbnN0IGFzc2lnblN0cmluZ1dyYXBwaW5nQVBJID0gKHRhcmdldCwgd3JhcEJlZm9yZSA9IHRhcmdldCkgPT5cblxuICAgIHN0cmluZ1dyYXBwaW5nTWV0aG9kcy5yZWR1Y2UgKChtZW1vLCBbaywgb3BlbiwgY2xvc2VdKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE8uZGVmaW5lUHJvcGVydHkgKG1lbW8sIGssIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0OiAoKSA9PiBhc3NpZ25TdHJpbmdXcmFwcGluZ0FQSSAoc3RyID0+IHdyYXBCZWZvcmUgKHdyYXAgKHN0ciwgb3BlbiwgY2xvc2UpKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSxcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldClcblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG4vKipcbiAqIFJlcHJlc2VudHMgYW4gQU5TSS1lc2NhcGVkIHN0cmluZy5cbiAqL1xuY2xhc3MgQ29sb3JzIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzIGEgc3RyaW5nIGNvbnRhaW5pbmcgQU5TSSBlc2NhcGUgY29kZXMuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IgKHMpIHtcblxuICAgICAgICBpZiAocykge1xuXG4gICAgICAgICAgICBjb25zdCByID0gL1xcdTAwMWJcXFsoXFxkKyltL2dcblxuICAgICAgICAgICAgY29uc3Qgc3BhbnMgPSBzLnNwbGl0ICgvXFx1MDAxYlxcW1xcZCttLylcbiAgICAgICAgICAgIGNvbnN0IGNvZGVzID0gW11cblxuICAgICAgICAgICAgZm9yIChsZXQgbWF0Y2g7IG1hdGNoID0gci5leGVjIChzKTspIGNvZGVzLnB1c2ggKG1hdGNoWzFdKVxuXG4gICAgICAgICAgICB0aGlzLnNwYW5zID0gc3BhbnMubWFwICgocywgaSkgPT4gKHsgdGV4dDogcywgY29kZTogbmV3IENvZGUgKGNvZGVzW2ldKSB9KSkgXG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc3BhbnMgPSBbXVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IHN0ciAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNwYW5zLnJlZHVjZSAoKHN0ciwgcCkgPT4gc3RyICsgcC50ZXh0ICsgcC5jb2RlLnN0ciwgJycpXG4gICAgfVxuXG4gICAgZ2V0IHBhcnNlZCAoKSB7XG5cbiAgICAgICAgdmFyIGNvbG9yICAgICAgPSBuZXcgQ29sb3IgKCksXG4gICAgICAgICAgICBiZ0NvbG9yICAgID0gbmV3IENvbG9yICh0cnVlIC8qIGJhY2tncm91bmQgKi8pLFxuICAgICAgICAgICAgYnJpZ2h0bmVzcyA9IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHN0eWxlcyAgICAgPSBuZXcgU2V0ICgpXG5cbiAgICAgICAgcmV0dXJuIE8uYXNzaWduIChuZXcgQ29sb3JzICgpLCB7XG5cbiAgICAgICAgICAgIHNwYW5zOiB0aGlzLnNwYW5zLm1hcCAoc3BhbiA9PiB7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBjID0gc3Bhbi5jb2RlXG5cbiAgICAgICAgICAgICAgICBjb25zdCBpbnZlcnRlZCAgPSBzdHlsZXMuaGFzICgnaW52ZXJzZScpLFxuICAgICAgICAgICAgICAgICAgICAgIHVuZGVybGluZSA9IHN0eWxlcy5oYXMgKCd1bmRlcmxpbmUnKSAgID8gJ3RleHQtZGVjb3JhdGlvbjogdW5kZXJsaW5lOycgOiAnJywgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgaXRhbGljICAgID0gc3R5bGVzLmhhcyAoJ2l0YWxpYycpICAgICAgPyAnZm9udC1zdHlsZTogaXRhbGljOycgOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgICBib2xkICAgICAgPSBicmlnaHRuZXNzID09PSBDb2RlLmJyaWdodCA/ICdmb250LXdlaWdodDogYm9sZDsnIDogJydcblxuICAgICAgICAgICAgICAgIGNvbnN0IGZvcmVDb2xvciA9IGNvbG9yLmRlZmF1bHRCcmlnaHRuZXNzIChicmlnaHRuZXNzKVxuXG4gICAgICAgICAgICAgICAgY29uc3Qgc3R5bGVkU3BhbiA9IE8uYXNzaWduIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGNzczogYm9sZCArIGl0YWxpYyArIHVuZGVybGluZSArIGZvcmVDb2xvci5jc3MgKGludmVydGVkKSArIGJnQ29sb3IuY3NzIChpbnZlcnRlZCkgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGVhbiAoeyBib2xkOiAhIWJvbGQsIGNvbG9yOiBmb3JlQ29sb3IuY2xlYW4sIGJnQ29sb3I6IGJnQ29sb3IuY2xlYW4gfSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3BhbilcblxuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgayBvZiBzdHlsZXMpIHsgc3R5bGVkU3BhbltrXSA9IHRydWUgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGMuaXNCcmlnaHRuZXNzKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgYnJpZ2h0bmVzcyA9IGMudmFsdWVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoc3Bhbi5jb2RlLnR5cGUpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnY29sb3InICAgICAgICA6XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdjb2xvckxpZ2h0JyAgIDogY29sb3IgICA9IG5ldyBDb2xvciAoZmFsc2UsIGMuc3VidHlwZSk7IGJyZWFrXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2JnQ29sb3InICAgICAgOlxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnYmdDb2xvckxpZ2h0JyA6IGJnQ29sb3IgPSBuZXcgQ29sb3IgKHRydWUsICBjLnN1YnR5cGUpOyBicmVha1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdzdHlsZScgIDogc3R5bGVzLmFkZCAgICAoYy5zdWJ0eXBlKTsgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3Vuc3R5bGUnOiBzdHlsZXMuZGVsZXRlIChjLnN1YnR5cGUpOyBicmVha1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0eWxlZFNwYW5cblxuICAgICAgICAgICAgfSkuZmlsdGVyIChzID0+IHMudGV4dC5sZW5ndGggPiAwKVxuICAgICAgICB9KVxuICAgIH1cblxuLyogIE91dHB1dHMgd2l0aCBDaHJvbWUgRGV2VG9vbHMtY29tcGF0aWJsZSBmb3JtYXQgICAgICovXG5cbiAgICBnZXQgYXNDaHJvbWVDb25zb2xlTG9nQXJndW1lbnRzICgpIHtcblxuICAgICAgICBjb25zdCBzcGFucyA9IHRoaXMucGFyc2VkLnNwYW5zXG5cbiAgICAgICAgcmV0dXJuIFtzcGFucy5tYXAgKHMgPT4gKCclYycgKyBzLnRleHQpKS5qb2luICgnJyksXG4gICAgICAgICAgICAgLi4uc3BhbnMubWFwIChzID0+IHMuY3NzKV1cbiAgICB9XG5cbiAgICBnZXQgYnJvd3NlckNvbnNvbGVBcmd1bWVudHMgKCkgLyogTEVHQUNZLCBERVBSRUNBVEVEICovIHsgcmV0dXJuIHRoaXMuYXNDaHJvbWVDb25zb2xlTG9nQXJndW1lbnRzIH1cblxuICAgIC8qKlxuICAgICAqIEBkZXNjIGluc3RhbGxzIFN0cmluZyBwcm90b3R5cGUgZXh0ZW5zaW9uc1xuICAgICAqIEBleGFtcGxlXG4gICAgICogcmVxdWlyZSAoJ2Fuc2ljb2xvcicpLm5pY2VcbiAgICAgKiBjb25zb2xlLmxvZyAoJ2ZvbycuYnJpZ2h0LnJlZClcbiAgICAgKi9cbiAgICBzdGF0aWMgZ2V0IG5pY2UgKCkge1xuXG4gICAgICAgIENvbG9ycy5uYW1lcy5mb3JFYWNoIChrID0+IHtcbiAgICAgICAgICAgIGlmICghKGsgaW4gU3RyaW5nLnByb3RvdHlwZSkpIHtcbiAgICAgICAgICAgICAgICBPLmRlZmluZVByb3BlcnR5IChTdHJpbmcucHJvdG90eXBlLCBrLCB7IGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gQ29sb3JzW2tdICh0aGlzKSB9IH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgcmV0dXJuIENvbG9yc1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBkZXNjIHBhcnNlcyBhIHN0cmluZyBjb250YWluaW5nIEFOU0kgZXNjYXBlIGNvZGVzXG4gICAgICogQHJldHVybiB7Q29sb3JzfSBwYXJzZWQgcmVwcmVzZW50YXRpb24uXG4gICAgICovXG4gICAgc3RhdGljIHBhcnNlIChzKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29sb3JzIChzKS5wYXJzZWRcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAZGVzYyBzdHJpcHMgQU5TSSBjb2RlcyBmcm9tIGEgc3RyaW5nXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHMgYSBzdHJpbmcgY29udGFpbmluZyBBTlNJIGVzY2FwZSBjb2Rlcy5cbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IGNsZWFuIHN0cmluZy5cbiAgICAgKi9cbiAgICBzdGF0aWMgc3RyaXAgKHMpIHtcbiAgICAgICAgcmV0dXJuIHMucmVwbGFjZSAoL1tcXHUwMDFiXFx1MDA5Yl1bWygpIzs/XSooPzpbMC05XXsxLDR9KD86O1swLTldezAsNH0pKik/WzAtOUEtUFJaY2YtbnFyeT0+PF0vZywgJycpIC8vIGhvcGUgVjggY2FjaGVzIHRoZSByZWdleHBcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGNvbnN0IHNwYW5zID0gWy4uLmFuc2kucGFyc2UgKCdcXHUwMDFiWzdtXFx1MDAxYls3bWZvb1xcdTAwMWJbN21iYXJcXHUwMDFiWzI3bScpXVxuICAgICAqL1xuICAgIFtTeW1ib2wuaXRlcmF0b3JdICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3BhbnNbU3ltYm9sLml0ZXJhdG9yXSAoKVxuICAgIH1cbn1cblxuLyogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5hc3NpZ25TdHJpbmdXcmFwcGluZ0FQSSAoQ29sb3JzLCBzdHIgPT4gc3RyKVxuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbkNvbG9ycy5uYW1lcyA9IHN0cmluZ1dyYXBwaW5nTWV0aG9kcy5tYXAgKChba10pID0+IGspXG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuQ29sb3JzLnJnYiA9IHtcblxuICAgIGJsYWNrOiAgICAgICAgWzAsICAgICAwLCAgIDBdLCAgICBcbiAgICBkYXJrR3JheTogICAgIFsxMDAsIDEwMCwgMTAwXSxcbiAgICBsaWdodEdyYXk6ICAgIFsyMDAsIDIwMCwgMjAwXSxcbiAgICB3aGl0ZTogICAgICAgIFsyNTUsIDI1NSwgMjU1XSxcblxuICAgIHJlZDogICAgICAgICAgWzIwNCwgICAwLCAgIDBdLFxuICAgIGxpZ2h0UmVkOiAgICAgWzI1NSwgIDUxLCAgIDBdLFxuICAgIFxuICAgIGdyZWVuOiAgICAgICAgWzAsICAgMjA0LCAgIDBdLFxuICAgIGxpZ2h0R3JlZW46ICAgWzUxLCAgMjA0LCAgNTFdLFxuICAgIFxuICAgIHllbGxvdzogICAgICAgWzIwNCwgMTAyLCAgIDBdLFxuICAgIGxpZ2h0WWVsbG93OiAgWzI1NSwgMTUzLCAgNTFdLFxuICAgIFxuICAgIGJsdWU6ICAgICAgICAgWzAsICAgICAwLCAyNTVdLFxuICAgIGxpZ2h0Qmx1ZTogICAgWzI2LCAgMTQwLCAyNTVdLFxuICAgIFxuICAgIG1hZ2VudGE6ICAgICAgWzIwNCwgICAwLCAyMDRdLFxuICAgIGxpZ2h0TWFnZW50YTogWzI1NSwgICAwLCAyNTVdLFxuICAgIFxuICAgIGN5YW46ICAgICAgICAgWzAsICAgMTUzLCAyNTVdLFxuICAgIGxpZ2h0Q3lhbjogICAgWzAsICAgMjA0LCAyNTVdLFxufVxuXG4vKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbm1vZHVsZS5leHBvcnRzID0gQ29sb3JzXG5cbi8qICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyBjb21wYXJlIGFuZCBpc0J1ZmZlciB0YWtlbiBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL2Jsb2IvNjgwZTllNWU0ODhmMjJhYWMyNzU5OWE1N2RjODQ0YTYzMTU5MjhkZC9pbmRleC5qc1xuLy8gb3JpZ2luYWwgbm90aWNlOlxuXG4vKiFcbiAqIFRoZSBidWZmZXIgbW9kdWxlIGZyb20gbm9kZS5qcywgZm9yIHRoZSBicm93c2VyLlxuICpcbiAqIEBhdXRob3IgICBGZXJvc3MgQWJvdWtoYWRpamVoIDxmZXJvc3NAZmVyb3NzLm9yZz4gPGh0dHA6Ly9mZXJvc3Mub3JnPlxuICogQGxpY2Vuc2UgIE1JVFxuICovXG5mdW5jdGlvbiBjb21wYXJlKGEsIGIpIHtcbiAgaWYgKGEgPT09IGIpIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIHZhciB4ID0gYS5sZW5ndGg7XG4gIHZhciB5ID0gYi5sZW5ndGg7XG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IE1hdGgubWluKHgsIHkpOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAoYVtpXSAhPT0gYltpXSkge1xuICAgICAgeCA9IGFbaV07XG4gICAgICB5ID0gYltpXTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGlmICh4IDwgeSkge1xuICAgIHJldHVybiAtMTtcbiAgfVxuICBpZiAoeSA8IHgpIHtcbiAgICByZXR1cm4gMTtcbiAgfVxuICByZXR1cm4gMDtcbn1cbmZ1bmN0aW9uIGlzQnVmZmVyKGIpIHtcbiAgaWYgKGdsb2JhbC5CdWZmZXIgJiYgdHlwZW9mIGdsb2JhbC5CdWZmZXIuaXNCdWZmZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZ2xvYmFsLkJ1ZmZlci5pc0J1ZmZlcihiKTtcbiAgfVxuICByZXR1cm4gISEoYiAhPSBudWxsICYmIGIuX2lzQnVmZmVyKTtcbn1cblxuLy8gYmFzZWQgb24gbm9kZSBhc3NlcnQsIG9yaWdpbmFsIG5vdGljZTpcblxuLy8gaHR0cDovL3dpa2kuY29tbW9uanMub3JnL3dpa2kvVW5pdF9UZXN0aW5nLzEuMFxuLy9cbi8vIFRISVMgSVMgTk9UIFRFU1RFRCBOT1IgTElLRUxZIFRPIFdPUksgT1VUU0lERSBWOCFcbi8vXG4vLyBPcmlnaW5hbGx5IGZyb20gbmFyd2hhbC5qcyAoaHR0cDovL25hcndoYWxqcy5vcmcpXG4vLyBDb3B5cmlnaHQgKGMpIDIwMDkgVGhvbWFzIFJvYmluc29uIDwyODBub3J0aC5jb20+XG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgJ1NvZnR3YXJlJyksIHRvXG4vLyBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZVxuLy8gcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yXG4vLyBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEICdBUyBJUycsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTlxuLy8gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTlxuLy8gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbC8nKTtcbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIHBTbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciBmdW5jdGlvbnNIYXZlTmFtZXMgPSAoZnVuY3Rpb24gKCkge1xuICByZXR1cm4gZnVuY3Rpb24gZm9vKCkge30ubmFtZSA9PT0gJ2Zvbyc7XG59KCkpO1xuZnVuY3Rpb24gcFRvU3RyaW5nIChvYmopIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopO1xufVxuZnVuY3Rpb24gaXNWaWV3KGFycmJ1Zikge1xuICBpZiAoaXNCdWZmZXIoYXJyYnVmKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAodHlwZW9mIGdsb2JhbC5BcnJheUJ1ZmZlciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAodHlwZW9mIEFycmF5QnVmZmVyLmlzVmlldyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBBcnJheUJ1ZmZlci5pc1ZpZXcoYXJyYnVmKTtcbiAgfVxuICBpZiAoIWFycmJ1Zikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoYXJyYnVmIGluc3RhbmNlb2YgRGF0YVZpZXcpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBpZiAoYXJyYnVmLmJ1ZmZlciAmJiBhcnJidWYuYnVmZmVyIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG4vLyAxLiBUaGUgYXNzZXJ0IG1vZHVsZSBwcm92aWRlcyBmdW5jdGlvbnMgdGhhdCB0aHJvd1xuLy8gQXNzZXJ0aW9uRXJyb3IncyB3aGVuIHBhcnRpY3VsYXIgY29uZGl0aW9ucyBhcmUgbm90IG1ldC4gVGhlXG4vLyBhc3NlcnQgbW9kdWxlIG11c3QgY29uZm9ybSB0byB0aGUgZm9sbG93aW5nIGludGVyZmFjZS5cblxudmFyIGFzc2VydCA9IG1vZHVsZS5leHBvcnRzID0gb2s7XG5cbi8vIDIuIFRoZSBBc3NlcnRpb25FcnJvciBpcyBkZWZpbmVkIGluIGFzc2VydC5cbi8vIG5ldyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3IoeyBtZXNzYWdlOiBtZXNzYWdlLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbDogYWN0dWFsLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBleHBlY3RlZCB9KVxuXG52YXIgcmVnZXggPSAvXFxzKmZ1bmN0aW9uXFxzKyhbXlxcKFxcc10qKVxccyovO1xuLy8gYmFzZWQgb24gaHR0cHM6Ly9naXRodWIuY29tL2xqaGFyYi9mdW5jdGlvbi5wcm90b3R5cGUubmFtZS9ibG9iL2FkZWVlZWM4YmZjYzYwNjhiMTg3ZDdkOWZiM2Q1YmIxZDNhMzA4OTkvaW1wbGVtZW50YXRpb24uanNcbmZ1bmN0aW9uIGdldE5hbWUoZnVuYykge1xuICBpZiAoIXV0aWwuaXNGdW5jdGlvbihmdW5jKSkge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoZnVuY3Rpb25zSGF2ZU5hbWVzKSB7XG4gICAgcmV0dXJuIGZ1bmMubmFtZTtcbiAgfVxuICB2YXIgc3RyID0gZnVuYy50b1N0cmluZygpO1xuICB2YXIgbWF0Y2ggPSBzdHIubWF0Y2gocmVnZXgpO1xuICByZXR1cm4gbWF0Y2ggJiYgbWF0Y2hbMV07XG59XG5hc3NlcnQuQXNzZXJ0aW9uRXJyb3IgPSBmdW5jdGlvbiBBc3NlcnRpb25FcnJvcihvcHRpb25zKSB7XG4gIHRoaXMubmFtZSA9ICdBc3NlcnRpb25FcnJvcic7XG4gIHRoaXMuYWN0dWFsID0gb3B0aW9ucy5hY3R1YWw7XG4gIHRoaXMuZXhwZWN0ZWQgPSBvcHRpb25zLmV4cGVjdGVkO1xuICB0aGlzLm9wZXJhdG9yID0gb3B0aW9ucy5vcGVyYXRvcjtcbiAgaWYgKG9wdGlvbnMubWVzc2FnZSkge1xuICAgIHRoaXMubWVzc2FnZSA9IG9wdGlvbnMubWVzc2FnZTtcbiAgICB0aGlzLmdlbmVyYXRlZE1lc3NhZ2UgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBnZXRNZXNzYWdlKHRoaXMpO1xuICAgIHRoaXMuZ2VuZXJhdGVkTWVzc2FnZSA9IHRydWU7XG4gIH1cbiAgdmFyIHN0YWNrU3RhcnRGdW5jdGlvbiA9IG9wdGlvbnMuc3RhY2tTdGFydEZ1bmN0aW9uIHx8IGZhaWw7XG4gIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHN0YWNrU3RhcnRGdW5jdGlvbik7XG4gIH0gZWxzZSB7XG4gICAgLy8gbm9uIHY4IGJyb3dzZXJzIHNvIHdlIGNhbiBoYXZlIGEgc3RhY2t0cmFjZVxuICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoKTtcbiAgICBpZiAoZXJyLnN0YWNrKSB7XG4gICAgICB2YXIgb3V0ID0gZXJyLnN0YWNrO1xuXG4gICAgICAvLyB0cnkgdG8gc3RyaXAgdXNlbGVzcyBmcmFtZXNcbiAgICAgIHZhciBmbl9uYW1lID0gZ2V0TmFtZShzdGFja1N0YXJ0RnVuY3Rpb24pO1xuICAgICAgdmFyIGlkeCA9IG91dC5pbmRleE9mKCdcXG4nICsgZm5fbmFtZSk7XG4gICAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgICAgLy8gb25jZSB3ZSBoYXZlIGxvY2F0ZWQgdGhlIGZ1bmN0aW9uIGZyYW1lXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gc3RyaXAgb3V0IGV2ZXJ5dGhpbmcgYmVmb3JlIGl0IChhbmQgaXRzIGxpbmUpXG4gICAgICAgIHZhciBuZXh0X2xpbmUgPSBvdXQuaW5kZXhPZignXFxuJywgaWR4ICsgMSk7XG4gICAgICAgIG91dCA9IG91dC5zdWJzdHJpbmcobmV4dF9saW5lICsgMSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc3RhY2sgPSBvdXQ7XG4gICAgfVxuICB9XG59O1xuXG4vLyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3IgaW5zdGFuY2VvZiBFcnJvclxudXRpbC5pbmhlcml0cyhhc3NlcnQuQXNzZXJ0aW9uRXJyb3IsIEVycm9yKTtcblxuZnVuY3Rpb24gdHJ1bmNhdGUocywgbikge1xuICBpZiAodHlwZW9mIHMgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHMubGVuZ3RoIDwgbiA/IHMgOiBzLnNsaWNlKDAsIG4pO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzO1xuICB9XG59XG5mdW5jdGlvbiBpbnNwZWN0KHNvbWV0aGluZykge1xuICBpZiAoZnVuY3Rpb25zSGF2ZU5hbWVzIHx8ICF1dGlsLmlzRnVuY3Rpb24oc29tZXRoaW5nKSkge1xuICAgIHJldHVybiB1dGlsLmluc3BlY3Qoc29tZXRoaW5nKTtcbiAgfVxuICB2YXIgcmF3bmFtZSA9IGdldE5hbWUoc29tZXRoaW5nKTtcbiAgdmFyIG5hbWUgPSByYXduYW1lID8gJzogJyArIHJhd25hbWUgOiAnJztcbiAgcmV0dXJuICdbRnVuY3Rpb24nICsgIG5hbWUgKyAnXSc7XG59XG5mdW5jdGlvbiBnZXRNZXNzYWdlKHNlbGYpIHtcbiAgcmV0dXJuIHRydW5jYXRlKGluc3BlY3Qoc2VsZi5hY3R1YWwpLCAxMjgpICsgJyAnICtcbiAgICAgICAgIHNlbGYub3BlcmF0b3IgKyAnICcgK1xuICAgICAgICAgdHJ1bmNhdGUoaW5zcGVjdChzZWxmLmV4cGVjdGVkKSwgMTI4KTtcbn1cblxuLy8gQXQgcHJlc2VudCBvbmx5IHRoZSB0aHJlZSBrZXlzIG1lbnRpb25lZCBhYm92ZSBhcmUgdXNlZCBhbmRcbi8vIHVuZGVyc3Rvb2QgYnkgdGhlIHNwZWMuIEltcGxlbWVudGF0aW9ucyBvciBzdWIgbW9kdWxlcyBjYW4gcGFzc1xuLy8gb3RoZXIga2V5cyB0byB0aGUgQXNzZXJ0aW9uRXJyb3IncyBjb25zdHJ1Y3RvciAtIHRoZXkgd2lsbCBiZVxuLy8gaWdub3JlZC5cblxuLy8gMy4gQWxsIG9mIHRoZSBmb2xsb3dpbmcgZnVuY3Rpb25zIG11c3QgdGhyb3cgYW4gQXNzZXJ0aW9uRXJyb3Jcbi8vIHdoZW4gYSBjb3JyZXNwb25kaW5nIGNvbmRpdGlvbiBpcyBub3QgbWV0LCB3aXRoIGEgbWVzc2FnZSB0aGF0XG4vLyBtYXkgYmUgdW5kZWZpbmVkIGlmIG5vdCBwcm92aWRlZC4gIEFsbCBhc3NlcnRpb24gbWV0aG9kcyBwcm92aWRlXG4vLyBib3RoIHRoZSBhY3R1YWwgYW5kIGV4cGVjdGVkIHZhbHVlcyB0byB0aGUgYXNzZXJ0aW9uIGVycm9yIGZvclxuLy8gZGlzcGxheSBwdXJwb3Nlcy5cblxuZnVuY3Rpb24gZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCBvcGVyYXRvciwgc3RhY2tTdGFydEZ1bmN0aW9uKSB7XG4gIHRocm93IG5ldyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3Ioe1xuICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgYWN0dWFsOiBhY3R1YWwsXG4gICAgZXhwZWN0ZWQ6IGV4cGVjdGVkLFxuICAgIG9wZXJhdG9yOiBvcGVyYXRvcixcbiAgICBzdGFja1N0YXJ0RnVuY3Rpb246IHN0YWNrU3RhcnRGdW5jdGlvblxuICB9KTtcbn1cblxuLy8gRVhURU5TSU9OISBhbGxvd3MgZm9yIHdlbGwgYmVoYXZlZCBlcnJvcnMgZGVmaW5lZCBlbHNld2hlcmUuXG5hc3NlcnQuZmFpbCA9IGZhaWw7XG5cbi8vIDQuIFB1cmUgYXNzZXJ0aW9uIHRlc3RzIHdoZXRoZXIgYSB2YWx1ZSBpcyB0cnV0aHksIGFzIGRldGVybWluZWRcbi8vIGJ5ICEhZ3VhcmQuXG4vLyBhc3NlcnQub2soZ3VhcmQsIG1lc3NhZ2Vfb3B0KTtcbi8vIFRoaXMgc3RhdGVtZW50IGlzIGVxdWl2YWxlbnQgdG8gYXNzZXJ0LmVxdWFsKHRydWUsICEhZ3VhcmQsXG4vLyBtZXNzYWdlX29wdCk7LiBUbyB0ZXN0IHN0cmljdGx5IGZvciB0aGUgdmFsdWUgdHJ1ZSwgdXNlXG4vLyBhc3NlcnQuc3RyaWN0RXF1YWwodHJ1ZSwgZ3VhcmQsIG1lc3NhZ2Vfb3B0KTsuXG5cbmZ1bmN0aW9uIG9rKHZhbHVlLCBtZXNzYWdlKSB7XG4gIGlmICghdmFsdWUpIGZhaWwodmFsdWUsIHRydWUsIG1lc3NhZ2UsICc9PScsIGFzc2VydC5vayk7XG59XG5hc3NlcnQub2sgPSBvaztcblxuLy8gNS4gVGhlIGVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBzaGFsbG93LCBjb2VyY2l2ZSBlcXVhbGl0eSB3aXRoXG4vLyA9PS5cbi8vIGFzc2VydC5lcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5lcXVhbCA9IGZ1bmN0aW9uIGVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPSBleHBlY3RlZCkgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnPT0nLCBhc3NlcnQuZXF1YWwpO1xufTtcblxuLy8gNi4gVGhlIG5vbi1lcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgZm9yIHdoZXRoZXIgdHdvIG9iamVjdHMgYXJlIG5vdCBlcXVhbFxuLy8gd2l0aCAhPSBhc3NlcnQubm90RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90RXF1YWwgPSBmdW5jdGlvbiBub3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgPT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICchPScsIGFzc2VydC5ub3RFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDcuIFRoZSBlcXVpdmFsZW5jZSBhc3NlcnRpb24gdGVzdHMgYSBkZWVwIGVxdWFsaXR5IHJlbGF0aW9uLlxuLy8gYXNzZXJ0LmRlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5kZWVwRXF1YWwgPSBmdW5jdGlvbiBkZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoIV9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgZmFsc2UpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnZGVlcEVxdWFsJywgYXNzZXJ0LmRlZXBFcXVhbCk7XG4gIH1cbn07XG5cbmFzc2VydC5kZWVwU3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBkZWVwU3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoIV9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgdHJ1ZSkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdkZWVwU3RyaWN0RXF1YWwnLCBhc3NlcnQuZGVlcFN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBzdHJpY3QsIG1lbW9zKSB7XG4gIC8vIDcuMS4gQWxsIGlkZW50aWNhbCB2YWx1ZXMgYXJlIGVxdWl2YWxlbnQsIGFzIGRldGVybWluZWQgYnkgPT09LlxuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYgKGlzQnVmZmVyKGFjdHVhbCkgJiYgaXNCdWZmZXIoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGNvbXBhcmUoYWN0dWFsLCBleHBlY3RlZCkgPT09IDA7XG5cbiAgLy8gNy4yLiBJZiB0aGUgZXhwZWN0ZWQgdmFsdWUgaXMgYSBEYXRlIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBEYXRlIG9iamVjdCB0aGF0IHJlZmVycyB0byB0aGUgc2FtZSB0aW1lLlxuICB9IGVsc2UgaWYgKHV0aWwuaXNEYXRlKGFjdHVhbCkgJiYgdXRpbC5pc0RhdGUoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5nZXRUaW1lKCkgPT09IGV4cGVjdGVkLmdldFRpbWUoKTtcblxuICAvLyA3LjMgSWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgUmVnRXhwIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBSZWdFeHAgb2JqZWN0IHdpdGggdGhlIHNhbWUgc291cmNlIGFuZFxuICAvLyBwcm9wZXJ0aWVzIChgZ2xvYmFsYCwgYG11bHRpbGluZWAsIGBsYXN0SW5kZXhgLCBgaWdub3JlQ2FzZWApLlxuICB9IGVsc2UgaWYgKHV0aWwuaXNSZWdFeHAoYWN0dWFsKSAmJiB1dGlsLmlzUmVnRXhwKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwuc291cmNlID09PSBleHBlY3RlZC5zb3VyY2UgJiZcbiAgICAgICAgICAgYWN0dWFsLmdsb2JhbCA9PT0gZXhwZWN0ZWQuZ2xvYmFsICYmXG4gICAgICAgICAgIGFjdHVhbC5tdWx0aWxpbmUgPT09IGV4cGVjdGVkLm11bHRpbGluZSAmJlxuICAgICAgICAgICBhY3R1YWwubGFzdEluZGV4ID09PSBleHBlY3RlZC5sYXN0SW5kZXggJiZcbiAgICAgICAgICAgYWN0dWFsLmlnbm9yZUNhc2UgPT09IGV4cGVjdGVkLmlnbm9yZUNhc2U7XG5cbiAgLy8gNy40LiBPdGhlciBwYWlycyB0aGF0IGRvIG5vdCBib3RoIHBhc3MgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnLFxuICAvLyBlcXVpdmFsZW5jZSBpcyBkZXRlcm1pbmVkIGJ5ID09LlxuICB9IGVsc2UgaWYgKChhY3R1YWwgPT09IG51bGwgfHwgdHlwZW9mIGFjdHVhbCAhPT0gJ29iamVjdCcpICYmXG4gICAgICAgICAgICAgKGV4cGVjdGVkID09PSBudWxsIHx8IHR5cGVvZiBleHBlY3RlZCAhPT0gJ29iamVjdCcpKSB7XG4gICAgcmV0dXJuIHN0cmljdCA/IGFjdHVhbCA9PT0gZXhwZWN0ZWQgOiBhY3R1YWwgPT0gZXhwZWN0ZWQ7XG5cbiAgLy8gSWYgYm90aCB2YWx1ZXMgYXJlIGluc3RhbmNlcyBvZiB0eXBlZCBhcnJheXMsIHdyYXAgdGhlaXIgdW5kZXJseWluZ1xuICAvLyBBcnJheUJ1ZmZlcnMgaW4gYSBCdWZmZXIgZWFjaCB0byBpbmNyZWFzZSBwZXJmb3JtYW5jZVxuICAvLyBUaGlzIG9wdGltaXphdGlvbiByZXF1aXJlcyB0aGUgYXJyYXlzIHRvIGhhdmUgdGhlIHNhbWUgdHlwZSBhcyBjaGVja2VkIGJ5XG4gIC8vIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcgKGFrYSBwVG9TdHJpbmcpLiBOZXZlciBwZXJmb3JtIGJpbmFyeVxuICAvLyBjb21wYXJpc29ucyBmb3IgRmxvYXQqQXJyYXlzLCB0aG91Z2gsIHNpbmNlIGUuZy4gKzAgPT09IC0wIGJ1dCB0aGVpclxuICAvLyBiaXQgcGF0dGVybnMgYXJlIG5vdCBpZGVudGljYWwuXG4gIH0gZWxzZSBpZiAoaXNWaWV3KGFjdHVhbCkgJiYgaXNWaWV3KGV4cGVjdGVkKSAmJlxuICAgICAgICAgICAgIHBUb1N0cmluZyhhY3R1YWwpID09PSBwVG9TdHJpbmcoZXhwZWN0ZWQpICYmXG4gICAgICAgICAgICAgIShhY3R1YWwgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkgfHxcbiAgICAgICAgICAgICAgIGFjdHVhbCBpbnN0YW5jZW9mIEZsb2F0NjRBcnJheSkpIHtcbiAgICByZXR1cm4gY29tcGFyZShuZXcgVWludDhBcnJheShhY3R1YWwuYnVmZmVyKSxcbiAgICAgICAgICAgICAgICAgICBuZXcgVWludDhBcnJheShleHBlY3RlZC5idWZmZXIpKSA9PT0gMDtcblxuICAvLyA3LjUgRm9yIGFsbCBvdGhlciBPYmplY3QgcGFpcnMsIGluY2x1ZGluZyBBcnJheSBvYmplY3RzLCBlcXVpdmFsZW5jZSBpc1xuICAvLyBkZXRlcm1pbmVkIGJ5IGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoYXMgdmVyaWZpZWRcbiAgLy8gd2l0aCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwpLCB0aGUgc2FtZSBzZXQgb2Yga2V5c1xuICAvLyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSwgZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5XG4gIC8vIGNvcnJlc3BvbmRpbmcga2V5LCBhbmQgYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LiBOb3RlOiB0aGlzXG4gIC8vIGFjY291bnRzIGZvciBib3RoIG5hbWVkIGFuZCBpbmRleGVkIHByb3BlcnRpZXMgb24gQXJyYXlzLlxuICB9IGVsc2UgaWYgKGlzQnVmZmVyKGFjdHVhbCkgIT09IGlzQnVmZmVyKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICBtZW1vcyA9IG1lbW9zIHx8IHthY3R1YWw6IFtdLCBleHBlY3RlZDogW119O1xuXG4gICAgdmFyIGFjdHVhbEluZGV4ID0gbWVtb3MuYWN0dWFsLmluZGV4T2YoYWN0dWFsKTtcbiAgICBpZiAoYWN0dWFsSW5kZXggIT09IC0xKSB7XG4gICAgICBpZiAoYWN0dWFsSW5kZXggPT09IG1lbW9zLmV4cGVjdGVkLmluZGV4T2YoZXhwZWN0ZWQpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIG1lbW9zLmFjdHVhbC5wdXNoKGFjdHVhbCk7XG4gICAgbWVtb3MuZXhwZWN0ZWQucHVzaChleHBlY3RlZCk7XG5cbiAgICByZXR1cm4gb2JqRXF1aXYoYWN0dWFsLCBleHBlY3RlZCwgc3RyaWN0LCBtZW1vcyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNBcmd1bWVudHMob2JqZWN0KSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0KSA9PSAnW29iamVjdCBBcmd1bWVudHNdJztcbn1cblxuZnVuY3Rpb24gb2JqRXF1aXYoYSwgYiwgc3RyaWN0LCBhY3R1YWxWaXNpdGVkT2JqZWN0cykge1xuICBpZiAoYSA9PT0gbnVsbCB8fCBhID09PSB1bmRlZmluZWQgfHwgYiA9PT0gbnVsbCB8fCBiID09PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvLyBpZiBvbmUgaXMgYSBwcmltaXRpdmUsIHRoZSBvdGhlciBtdXN0IGJlIHNhbWVcbiAgaWYgKHV0aWwuaXNQcmltaXRpdmUoYSkgfHwgdXRpbC5pc1ByaW1pdGl2ZShiKSlcbiAgICByZXR1cm4gYSA9PT0gYjtcbiAgaWYgKHN0cmljdCAmJiBPYmplY3QuZ2V0UHJvdG90eXBlT2YoYSkgIT09IE9iamVjdC5nZXRQcm90b3R5cGVPZihiKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIHZhciBhSXNBcmdzID0gaXNBcmd1bWVudHMoYSk7XG4gIHZhciBiSXNBcmdzID0gaXNBcmd1bWVudHMoYik7XG4gIGlmICgoYUlzQXJncyAmJiAhYklzQXJncykgfHwgKCFhSXNBcmdzICYmIGJJc0FyZ3MpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgaWYgKGFJc0FyZ3MpIHtcbiAgICBhID0gcFNsaWNlLmNhbGwoYSk7XG4gICAgYiA9IHBTbGljZS5jYWxsKGIpO1xuICAgIHJldHVybiBfZGVlcEVxdWFsKGEsIGIsIHN0cmljdCk7XG4gIH1cbiAgdmFyIGthID0gb2JqZWN0S2V5cyhhKTtcbiAgdmFyIGtiID0gb2JqZWN0S2V5cyhiKTtcbiAgdmFyIGtleSwgaTtcbiAgLy8gaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChrZXlzIGluY29ycG9yYXRlc1xuICAvLyBoYXNPd25Qcm9wZXJ0eSlcbiAgaWYgKGthLmxlbmd0aCAhPT0ga2IubGVuZ3RoKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy90aGUgc2FtZSBzZXQgb2Yga2V5cyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSxcbiAga2Euc29ydCgpO1xuICBrYi5zb3J0KCk7XG4gIC8vfn5+Y2hlYXAga2V5IHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBpZiAoa2FbaV0gIT09IGtiW2ldKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5IGNvcnJlc3BvbmRpbmcga2V5LCBhbmRcbiAgLy9+fn5wb3NzaWJseSBleHBlbnNpdmUgZGVlcCB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAga2V5ID0ga2FbaV07XG4gICAgaWYgKCFfZGVlcEVxdWFsKGFba2V5XSwgYltrZXldLCBzdHJpY3QsIGFjdHVhbFZpc2l0ZWRPYmplY3RzKSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLy8gOC4gVGhlIG5vbi1lcXVpdmFsZW5jZSBhc3NlcnRpb24gdGVzdHMgZm9yIGFueSBkZWVwIGluZXF1YWxpdHkuXG4vLyBhc3NlcnQubm90RGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdERlZXBFcXVhbCA9IGZ1bmN0aW9uIG5vdERlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIGZhbHNlKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ25vdERlZXBFcXVhbCcsIGFzc2VydC5ub3REZWVwRXF1YWwpO1xuICB9XG59O1xuXG5hc3NlcnQubm90RGVlcFN0cmljdEVxdWFsID0gbm90RGVlcFN0cmljdEVxdWFsO1xuZnVuY3Rpb24gbm90RGVlcFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgdHJ1ZSkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdub3REZWVwU3RyaWN0RXF1YWwnLCBub3REZWVwU3RyaWN0RXF1YWwpO1xuICB9XG59XG5cblxuLy8gOS4gVGhlIHN0cmljdCBlcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgc3RyaWN0IGVxdWFsaXR5LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbi8vIGFzc2VydC5zdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5zdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIHN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICc9PT0nLCBhc3NlcnQuc3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG4vLyAxMC4gVGhlIHN0cmljdCBub24tZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIGZvciBzdHJpY3QgaW5lcXVhbGl0eSwgYXNcbi8vIGRldGVybWluZWQgYnkgIT09LiAgYXNzZXJ0Lm5vdFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdFN0cmljdEVxdWFsID0gZnVuY3Rpb24gbm90U3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJyE9PScsIGFzc2VydC5ub3RTdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgaWYgKCFhY3R1YWwgfHwgIWV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChleHBlY3RlZCkgPT0gJ1tvYmplY3QgUmVnRXhwXScpIHtcbiAgICByZXR1cm4gZXhwZWN0ZWQudGVzdChhY3R1YWwpO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBpZiAoYWN0dWFsIGluc3RhbmNlb2YgZXhwZWN0ZWQpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIElnbm9yZS4gIFRoZSBpbnN0YW5jZW9mIGNoZWNrIGRvZXNuJ3Qgd29yayBmb3IgYXJyb3cgZnVuY3Rpb25zLlxuICB9XG5cbiAgaWYgKEVycm9yLmlzUHJvdG90eXBlT2YoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIGV4cGVjdGVkLmNhbGwoe30sIGFjdHVhbCkgPT09IHRydWU7XG59XG5cbmZ1bmN0aW9uIF90cnlCbG9jayhibG9jaykge1xuICB2YXIgZXJyb3I7XG4gIHRyeSB7XG4gICAgYmxvY2soKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGVycm9yID0gZTtcbiAgfVxuICByZXR1cm4gZXJyb3I7XG59XG5cbmZ1bmN0aW9uIF90aHJvd3Moc2hvdWxkVGhyb3csIGJsb2NrLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICB2YXIgYWN0dWFsO1xuXG4gIGlmICh0eXBlb2YgYmxvY2sgIT09ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImJsb2NrXCIgYXJndW1lbnQgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG4gIH1cblxuICBpZiAodHlwZW9mIGV4cGVjdGVkID09PSAnc3RyaW5nJykge1xuICAgIG1lc3NhZ2UgPSBleHBlY3RlZDtcbiAgICBleHBlY3RlZCA9IG51bGw7XG4gIH1cblxuICBhY3R1YWwgPSBfdHJ5QmxvY2soYmxvY2spO1xuXG4gIG1lc3NhZ2UgPSAoZXhwZWN0ZWQgJiYgZXhwZWN0ZWQubmFtZSA/ICcgKCcgKyBleHBlY3RlZC5uYW1lICsgJykuJyA6ICcuJykgK1xuICAgICAgICAgICAgKG1lc3NhZ2UgPyAnICcgKyBtZXNzYWdlIDogJy4nKTtcblxuICBpZiAoc2hvdWxkVGhyb3cgJiYgIWFjdHVhbCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgJ01pc3NpbmcgZXhwZWN0ZWQgZXhjZXB0aW9uJyArIG1lc3NhZ2UpO1xuICB9XG5cbiAgdmFyIHVzZXJQcm92aWRlZE1lc3NhZ2UgPSB0eXBlb2YgbWVzc2FnZSA9PT0gJ3N0cmluZyc7XG4gIHZhciBpc1Vud2FudGVkRXhjZXB0aW9uID0gIXNob3VsZFRocm93ICYmIHV0aWwuaXNFcnJvcihhY3R1YWwpO1xuICB2YXIgaXNVbmV4cGVjdGVkRXhjZXB0aW9uID0gIXNob3VsZFRocm93ICYmIGFjdHVhbCAmJiAhZXhwZWN0ZWQ7XG5cbiAgaWYgKChpc1Vud2FudGVkRXhjZXB0aW9uICYmXG4gICAgICB1c2VyUHJvdmlkZWRNZXNzYWdlICYmXG4gICAgICBleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkgfHxcbiAgICAgIGlzVW5leHBlY3RlZEV4Y2VwdGlvbikge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgJ0dvdCB1bndhbnRlZCBleGNlcHRpb24nICsgbWVzc2FnZSk7XG4gIH1cblxuICBpZiAoKHNob3VsZFRocm93ICYmIGFjdHVhbCAmJiBleHBlY3RlZCAmJlxuICAgICAgIWV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpKSB8fCAoIXNob3VsZFRocm93ICYmIGFjdHVhbCkpIHtcbiAgICB0aHJvdyBhY3R1YWw7XG4gIH1cbn1cblxuLy8gMTEuIEV4cGVjdGVkIHRvIHRocm93IGFuIGVycm9yOlxuLy8gYXNzZXJ0LnRocm93cyhibG9jaywgRXJyb3Jfb3B0LCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC50aHJvd3MgPSBmdW5jdGlvbihibG9jaywgLypvcHRpb25hbCovZXJyb3IsIC8qb3B0aW9uYWwqL21lc3NhZ2UpIHtcbiAgX3Rocm93cyh0cnVlLCBibG9jaywgZXJyb3IsIG1lc3NhZ2UpO1xufTtcblxuLy8gRVhURU5TSU9OISBUaGlzIGlzIGFubm95aW5nIHRvIHdyaXRlIG91dHNpZGUgdGhpcyBtb2R1bGUuXG5hc3NlcnQuZG9lc05vdFRocm93ID0gZnVuY3Rpb24oYmxvY2ssIC8qb3B0aW9uYWwqL2Vycm9yLCAvKm9wdGlvbmFsKi9tZXNzYWdlKSB7XG4gIF90aHJvd3MoZmFsc2UsIGJsb2NrLCBlcnJvciwgbWVzc2FnZSk7XG59O1xuXG5hc3NlcnQuaWZFcnJvciA9IGZ1bmN0aW9uKGVycikgeyBpZiAoZXJyKSB0aHJvdyBlcnI7IH07XG5cbnZhciBvYmplY3RLZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICB2YXIga2V5cyA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKGhhc093bi5jYWxsKG9iaiwga2V5KSkga2V5cy5wdXNoKGtleSk7XG4gIH1cbiAgcmV0dXJuIGtleXM7XG59O1xuIiwiaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQnVmZmVyKGFyZykge1xuICByZXR1cm4gYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnXG4gICAgJiYgdHlwZW9mIGFyZy5jb3B5ID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5maWxsID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5yZWFkVUludDggPT09ICdmdW5jdGlvbic7XG59IiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciBmb3JtYXRSZWdFeHAgPSAvJVtzZGolXS9nO1xuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbihmKSB7XG4gIGlmICghaXNTdHJpbmcoZikpIHtcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmplY3RzLnB1c2goaW5zcGVjdChhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdHMuam9pbignICcpO1xuICB9XG5cbiAgdmFyIGkgPSAxO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gU3RyaW5nKGYpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggPT09ICclJScpIHJldHVybiAnJSc7XG4gICAgaWYgKGkgPj0gbGVuKSByZXR1cm4geDtcbiAgICBzd2l0Y2ggKHgpIHtcbiAgICAgIGNhc2UgJyVzJzogcmV0dXJuIFN0cmluZyhhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWQnOiByZXR1cm4gTnVtYmVyKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclaic6XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3NbaSsrXSk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICByZXR1cm4gJ1tDaXJjdWxhcl0nO1xuICAgICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gIH0pO1xuICBmb3IgKHZhciB4ID0gYXJnc1tpXTsgaSA8IGxlbjsgeCA9IGFyZ3NbKytpXSkge1xuICAgIGlmIChpc051bGwoeCkgfHwgIWlzT2JqZWN0KHgpKSB7XG4gICAgICBzdHIgKz0gJyAnICsgeDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICcgJyArIGluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuXG5cbi8vIE1hcmsgdGhhdCBhIG1ldGhvZCBzaG91bGQgbm90IGJlIHVzZWQuXG4vLyBSZXR1cm5zIGEgbW9kaWZpZWQgZnVuY3Rpb24gd2hpY2ggd2FybnMgb25jZSBieSBkZWZhdWx0LlxuLy8gSWYgLS1uby1kZXByZWNhdGlvbiBpcyBzZXQsIHRoZW4gaXQgaXMgYSBuby1vcC5cbmV4cG9ydHMuZGVwcmVjYXRlID0gZnVuY3Rpb24oZm4sIG1zZykge1xuICAvLyBBbGxvdyBmb3IgZGVwcmVjYXRpbmcgdGhpbmdzIGluIHRoZSBwcm9jZXNzIG9mIHN0YXJ0aW5nIHVwLlxuICBpZiAoaXNVbmRlZmluZWQoZ2xvYmFsLnByb2Nlc3MpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGV4cG9ydHMuZGVwcmVjYXRlKGZuLCBtc2cpLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfVxuXG4gIGlmIChwcm9jZXNzLm5vRGVwcmVjYXRpb24gPT09IHRydWUpIHtcbiAgICByZXR1cm4gZm47XG4gIH1cblxuICB2YXIgd2FybmVkID0gZmFsc2U7XG4gIGZ1bmN0aW9uIGRlcHJlY2F0ZWQoKSB7XG4gICAgaWYgKCF3YXJuZWQpIHtcbiAgICAgIGlmIChwcm9jZXNzLnRocm93RGVwcmVjYXRpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgICB9IGVsc2UgaWYgKHByb2Nlc3MudHJhY2VEZXByZWNhdGlvbikge1xuICAgICAgICBjb25zb2xlLnRyYWNlKG1zZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgICB9XG4gICAgICB3YXJuZWQgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIHJldHVybiBkZXByZWNhdGVkO1xufTtcblxuXG52YXIgZGVidWdzID0ge307XG52YXIgZGVidWdFbnZpcm9uO1xuZXhwb3J0cy5kZWJ1Z2xvZyA9IGZ1bmN0aW9uKHNldCkge1xuICBpZiAoaXNVbmRlZmluZWQoZGVidWdFbnZpcm9uKSlcbiAgICBkZWJ1Z0Vudmlyb24gPSBwcm9jZXNzLmVudi5OT0RFX0RFQlVHIHx8ICcnO1xuICBzZXQgPSBzZXQudG9VcHBlckNhc2UoKTtcbiAgaWYgKCFkZWJ1Z3Nbc2V0XSkge1xuICAgIGlmIChuZXcgUmVnRXhwKCdcXFxcYicgKyBzZXQgKyAnXFxcXGInLCAnaScpLnRlc3QoZGVidWdFbnZpcm9uKSkge1xuICAgICAgdmFyIHBpZCA9IHByb2Nlc3MucGlkO1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1zZyA9IGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJyVzICVkOiAlcycsIHNldCwgcGlkLCBtc2cpO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHt9O1xuICAgIH1cbiAgfVxuICByZXR1cm4gZGVidWdzW3NldF07XG59O1xuXG5cbi8qKlxuICogRWNob3MgdGhlIHZhbHVlIG9mIGEgdmFsdWUuIFRyeXMgdG8gcHJpbnQgdGhlIHZhbHVlIG91dFxuICogaW4gdGhlIGJlc3Qgd2F5IHBvc3NpYmxlIGdpdmVuIHRoZSBkaWZmZXJlbnQgdHlwZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHByaW50IG91dC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIE9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0IHRoYXQgYWx0ZXJzIHRoZSBvdXRwdXQuXG4gKi9cbi8qIGxlZ2FjeTogb2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKi9cbmZ1bmN0aW9uIGluc3BlY3Qob2JqLCBvcHRzKSB7XG4gIC8vIGRlZmF1bHQgb3B0aW9uc1xuICB2YXIgY3R4ID0ge1xuICAgIHNlZW46IFtdLFxuICAgIHN0eWxpemU6IHN0eWxpemVOb0NvbG9yXG4gIH07XG4gIC8vIGxlZ2FjeS4uLlxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSBjdHguZGVwdGggPSBhcmd1bWVudHNbMl07XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDQpIGN0eC5jb2xvcnMgPSBhcmd1bWVudHNbM107XG4gIGlmIChpc0Jvb2xlYW4ob3B0cykpIHtcbiAgICAvLyBsZWdhY3kuLi5cbiAgICBjdHguc2hvd0hpZGRlbiA9IG9wdHM7XG4gIH0gZWxzZSBpZiAob3B0cykge1xuICAgIC8vIGdvdCBhbiBcIm9wdGlvbnNcIiBvYmplY3RcbiAgICBleHBvcnRzLl9leHRlbmQoY3R4LCBvcHRzKTtcbiAgfVxuICAvLyBzZXQgZGVmYXVsdCBvcHRpb25zXG4gIGlmIChpc1VuZGVmaW5lZChjdHguc2hvd0hpZGRlbikpIGN0eC5zaG93SGlkZGVuID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguZGVwdGgpKSBjdHguZGVwdGggPSAyO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmNvbG9ycykpIGN0eC5jb2xvcnMgPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jdXN0b21JbnNwZWN0KSkgY3R4LmN1c3RvbUluc3BlY3QgPSB0cnVlO1xuICBpZiAoY3R4LmNvbG9ycykgY3R4LnN0eWxpemUgPSBzdHlsaXplV2l0aENvbG9yO1xuICByZXR1cm4gZm9ybWF0VmFsdWUoY3R4LCBvYmosIGN0eC5kZXB0aCk7XG59XG5leHBvcnRzLmluc3BlY3QgPSBpbnNwZWN0O1xuXG5cbi8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSNncmFwaGljc1xuaW5zcGVjdC5jb2xvcnMgPSB7XG4gICdib2xkJyA6IFsxLCAyMl0sXG4gICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICdncmV5JyA6IFs5MCwgMzldLFxuICAnYmxhY2snIDogWzMwLCAzOV0sXG4gICdibHVlJyA6IFszNCwgMzldLFxuICAnY3lhbicgOiBbMzYsIDM5XSxcbiAgJ2dyZWVuJyA6IFszMiwgMzldLFxuICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgJ3JlZCcgOiBbMzEsIDM5XSxcbiAgJ3llbGxvdycgOiBbMzMsIDM5XVxufTtcblxuLy8gRG9uJ3QgdXNlICdibHVlJyBub3QgdmlzaWJsZSBvbiBjbWQuZXhlXG5pbnNwZWN0LnN0eWxlcyA9IHtcbiAgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICdudW1iZXInOiAneWVsbG93JyxcbiAgJ2Jvb2xlYW4nOiAneWVsbG93JyxcbiAgJ3VuZGVmaW5lZCc6ICdncmV5JyxcbiAgJ251bGwnOiAnYm9sZCcsXG4gICdzdHJpbmcnOiAnZ3JlZW4nLFxuICAnZGF0ZSc6ICdtYWdlbnRhJyxcbiAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgJ3JlZ2V4cCc6ICdyZWQnXG59O1xuXG5cbmZ1bmN0aW9uIHN0eWxpemVXaXRoQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgdmFyIHN0eWxlID0gaW5zcGVjdC5zdHlsZXNbc3R5bGVUeXBlXTtcblxuICBpZiAoc3R5bGUpIHtcbiAgICByZXR1cm4gJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVswXSArICdtJyArIHN0ciArXG4gICAgICAgICAgICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMV0gKyAnbSc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHN0eWxpemVOb0NvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHJldHVybiBzdHI7XG59XG5cblxuZnVuY3Rpb24gYXJyYXlUb0hhc2goYXJyYXkpIHtcbiAgdmFyIGhhc2ggPSB7fTtcblxuICBhcnJheS5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaWR4KSB7XG4gICAgaGFzaFt2YWxdID0gdHJ1ZTtcbiAgfSk7XG5cbiAgcmV0dXJuIGhhc2g7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0VmFsdWUoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gIC8vIFByb3ZpZGUgYSBob29rIGZvciB1c2VyLXNwZWNpZmllZCBpbnNwZWN0IGZ1bmN0aW9ucy5cbiAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCBhbiBpbnNwZWN0IGZ1bmN0aW9uIG9uIGl0XG4gIGlmIChjdHguY3VzdG9tSW5zcGVjdCAmJlxuICAgICAgdmFsdWUgJiZcbiAgICAgIGlzRnVuY3Rpb24odmFsdWUuaW5zcGVjdCkgJiZcbiAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgdmFsdWUuaW5zcGVjdCAhPT0gZXhwb3J0cy5pbnNwZWN0ICYmXG4gICAgICAvLyBBbHNvIGZpbHRlciBvdXQgYW55IHByb3RvdHlwZSBvYmplY3RzIHVzaW5nIHRoZSBjaXJjdWxhciBjaGVjay5cbiAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICB2YXIgcmV0ID0gdmFsdWUuaW5zcGVjdChyZWN1cnNlVGltZXMsIGN0eCk7XG4gICAgaWYgKCFpc1N0cmluZyhyZXQpKSB7XG4gICAgICByZXQgPSBmb3JtYXRWYWx1ZShjdHgsIHJldCwgcmVjdXJzZVRpbWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gIHZhciBwcmltaXRpdmUgPSBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSk7XG4gIGlmIChwcmltaXRpdmUpIHtcbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTtcbiAgdmFyIHZpc2libGVLZXlzID0gYXJyYXlUb0hhc2goa2V5cyk7XG5cbiAgaWYgKGN0eC5zaG93SGlkZGVuKSB7XG4gICAga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKTtcbiAgfVxuXG4gIC8vIElFIGRvZXNuJ3QgbWFrZSBlcnJvciBmaWVsZHMgbm9uLWVudW1lcmFibGVcbiAgLy8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2llL2R3dzUyc2J0KHY9dnMuOTQpLmFzcHhcbiAgaWYgKGlzRXJyb3IodmFsdWUpXG4gICAgICAmJiAoa2V5cy5pbmRleE9mKCdtZXNzYWdlJykgPj0gMCB8fCBrZXlzLmluZGV4T2YoJ2Rlc2NyaXB0aW9uJykgPj0gMCkpIHtcbiAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgLy8gU29tZSB0eXBlIG9mIG9iamVjdCB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkLlxuICBpZiAoa2V5cy5sZW5ndGggPT09IDApIHtcbiAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIHZhciBuYW1lID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tGdW5jdGlvbicgKyBuYW1lICsgJ10nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH1cbiAgICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAnZGF0ZScpO1xuICAgIH1cbiAgICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIGJhc2UgPSAnJywgYXJyYXkgPSBmYWxzZSwgYnJhY2VzID0gWyd7JywgJ30nXTtcblxuICAvLyBNYWtlIEFycmF5IHNheSB0aGF0IHRoZXkgYXJlIEFycmF5XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIGFycmF5ID0gdHJ1ZTtcbiAgICBicmFjZXMgPSBbJ1snLCAnXSddO1xuICB9XG5cbiAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgIHZhciBuID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgYmFzZSA9ICcgW0Z1bmN0aW9uJyArIG4gKyAnXSc7XG4gIH1cblxuICAvLyBNYWtlIFJlZ0V4cHMgc2F5IHRoYXQgdGhleSBhcmUgUmVnRXhwc1xuICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGRhdGVzIHdpdGggcHJvcGVydGllcyBmaXJzdCBzYXkgdGhlIGRhdGVcbiAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgRGF0ZS5wcm90b3R5cGUudG9VVENTdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGVycm9yIHdpdGggbWVzc2FnZSBmaXJzdCBzYXkgdGhlIGVycm9yXG4gIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICBpZiAoa2V5cy5sZW5ndGggPT09IDAgJiYgKCFhcnJheSB8fCB2YWx1ZS5sZW5ndGggPT0gMCkpIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArIGJyYWNlc1sxXTtcbiAgfVxuXG4gIGlmIChyZWN1cnNlVGltZXMgPCAwKSB7XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbT2JqZWN0XScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG5cbiAgY3R4LnNlZW4ucHVzaCh2YWx1ZSk7XG5cbiAgdmFyIG91dHB1dDtcbiAgaWYgKGFycmF5KSB7XG4gICAgb3V0cHV0ID0gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cyk7XG4gIH0gZWxzZSB7XG4gICAgb3V0cHV0ID0ga2V5cy5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBjdHguc2Vlbi5wb3AoKTtcblxuICByZXR1cm4gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKSB7XG4gIGlmIChpc1VuZGVmaW5lZCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCd1bmRlZmluZWQnLCAndW5kZWZpbmVkJyk7XG4gIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcbiAgICB2YXIgc2ltcGxlID0gJ1xcJycgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvXlwifFwiJC9nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoc2ltcGxlLCAnc3RyaW5nJyk7XG4gIH1cbiAgaWYgKGlzTnVtYmVyKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ251bWJlcicpO1xuICBpZiAoaXNCb29sZWFuKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ2Jvb2xlYW4nKTtcbiAgLy8gRm9yIHNvbWUgcmVhc29uIHR5cGVvZiBudWxsIGlzIFwib2JqZWN0XCIsIHNvIHNwZWNpYWwgY2FzZSBoZXJlLlxuICBpZiAoaXNOdWxsKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ251bGwnLCAnbnVsbCcpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEVycm9yKHZhbHVlKSB7XG4gIHJldHVybiAnWycgKyBFcnJvci5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgKyAnXSc7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cykge1xuICB2YXIgb3V0cHV0ID0gW107XG4gIGZvciAodmFyIGkgPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgaWYgKGhhc093blByb3BlcnR5KHZhbHVlLCBTdHJpbmcoaSkpKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIFN0cmluZyhpKSwgdHJ1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQucHVzaCgnJyk7XG4gICAgfVxuICB9XG4gIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoIWtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAga2V5LCB0cnVlKSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KSB7XG4gIHZhciBuYW1lLCBzdHIsIGRlc2M7XG4gIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHZhbHVlLCBrZXkpIHx8IHsgdmFsdWU6IHZhbHVlW2tleV0gfTtcbiAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoIWhhc093blByb3BlcnR5KHZpc2libGVLZXlzLCBrZXkpKSB7XG4gICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgfVxuICBpZiAoIXN0cikge1xuICAgIGlmIChjdHguc2Vlbi5pbmRleE9mKGRlc2MudmFsdWUpIDwgMCkge1xuICAgICAgaWYgKGlzTnVsbChyZWN1cnNlVGltZXMpKSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIHJlY3Vyc2VUaW1lcyAtIDEpO1xuICAgICAgfVxuICAgICAgaWYgKHN0ci5pbmRleE9mKCdcXG4nKSA+IC0xKSB7XG4gICAgICAgIGlmIChhcnJheSkge1xuICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKS5zdWJzdHIoMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyID0gJ1xcbicgKyBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzVW5kZWZpbmVkKG5hbWUpKSB7XG4gICAgaWYgKGFycmF5ICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xufVxuXG5cbmZ1bmN0aW9uIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKSB7XG4gIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gIHZhciBsZW5ndGggPSBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgIG51bUxpbmVzRXN0Kys7XG4gICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgIHJldHVybiBwcmV2ICsgY3VyLnJlcGxhY2UoL1xcdTAwMWJcXFtcXGRcXGQ/bS9nLCAnJykubGVuZ3RoICsgMTtcbiAgfSwgMCk7XG5cbiAgaWYgKGxlbmd0aCA+IDYwKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArXG4gICAgICAgICAgIChiYXNlID09PSAnJyA/ICcnIDogYmFzZSArICdcXG4gJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBicmFjZXNbMV07XG4gIH1cblxuICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArICcgJyArIG91dHB1dC5qb2luKCcsICcpICsgJyAnICsgYnJhY2VzWzFdO1xufVxuXG5cbi8vIE5PVEU6IFRoZXNlIHR5cGUgY2hlY2tpbmcgZnVuY3Rpb25zIGludGVudGlvbmFsbHkgZG9uJ3QgdXNlIGBpbnN0YW5jZW9mYFxuLy8gYmVjYXVzZSBpdCBpcyBmcmFnaWxlIGFuZCBjYW4gYmUgZWFzaWx5IGZha2VkIHdpdGggYE9iamVjdC5jcmVhdGUoKWAuXG5mdW5jdGlvbiBpc0FycmF5KGFyKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGFyKTtcbn1cbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJztcbn1cbmV4cG9ydHMuaXNCb29sZWFuID0gaXNCb29sZWFuO1xuXG5mdW5jdGlvbiBpc051bGwoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbCA9IGlzTnVsbDtcblxuZnVuY3Rpb24gaXNOdWxsT3JVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsT3JVbmRlZmluZWQgPSBpc051bGxPclVuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cbmV4cG9ydHMuaXNOdW1iZXIgPSBpc051bWJlcjtcblxuZnVuY3Rpb24gaXNTdHJpbmcoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3RyaW5nJztcbn1cbmV4cG9ydHMuaXNTdHJpbmcgPSBpc1N0cmluZztcblxuZnVuY3Rpb24gaXNTeW1ib2woYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3ltYm9sJztcbn1cbmV4cG9ydHMuaXNTeW1ib2wgPSBpc1N5bWJvbDtcblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbmV4cG9ydHMuaXNVbmRlZmluZWQgPSBpc1VuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KHJlKSAmJiBvYmplY3RUb1N0cmluZyhyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufVxuZXhwb3J0cy5pc1JlZ0V4cCA9IGlzUmVnRXhwO1xuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNPYmplY3QgPSBpc09iamVjdDtcblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGQpICYmIG9iamVjdFRvU3RyaW5nKGQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5leHBvcnRzLmlzRGF0ZSA9IGlzRGF0ZTtcblxuZnVuY3Rpb24gaXNFcnJvcihlKSB7XG4gIHJldHVybiBpc09iamVjdChlKSAmJlxuICAgICAgKG9iamVjdFRvU3RyaW5nKGUpID09PSAnW29iamVjdCBFcnJvcl0nIHx8IGUgaW5zdGFuY2VvZiBFcnJvcik7XG59XG5leHBvcnRzLmlzRXJyb3IgPSBpc0Vycm9yO1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnYm9vbGVhbicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdudW1iZXInIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3RyaW5nJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCcgfHwgIC8vIEVTNiBzeW1ib2xcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICd1bmRlZmluZWQnO1xufVxuZXhwb3J0cy5pc1ByaW1pdGl2ZSA9IGlzUHJpbWl0aXZlO1xuXG5leHBvcnRzLmlzQnVmZmVyID0gcmVxdWlyZSgnLi9zdXBwb3J0L2lzQnVmZmVyJyk7XG5cbmZ1bmN0aW9uIG9iamVjdFRvU3RyaW5nKG8pIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKTtcbn1cblxuXG5mdW5jdGlvbiBwYWQobikge1xuICByZXR1cm4gbiA8IDEwID8gJzAnICsgbi50b1N0cmluZygxMCkgOiBuLnRvU3RyaW5nKDEwKTtcbn1cblxuXG52YXIgbW9udGhzID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsXG4gICAgICAgICAgICAgICdPY3QnLCAnTm92JywgJ0RlYyddO1xuXG4vLyAyNiBGZWIgMTY6MTk6MzRcbmZ1bmN0aW9uIHRpbWVzdGFtcCgpIHtcbiAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICB2YXIgdGltZSA9IFtwYWQoZC5nZXRIb3VycygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0TWludXRlcygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0U2Vjb25kcygpKV0uam9pbignOicpO1xuICByZXR1cm4gW2QuZ2V0RGF0ZSgpLCBtb250aHNbZC5nZXRNb250aCgpXSwgdGltZV0uam9pbignICcpO1xufVxuXG5cbi8vIGxvZyBpcyBqdXN0IGEgdGhpbiB3cmFwcGVyIHRvIGNvbnNvbGUubG9nIHRoYXQgcHJlcGVuZHMgYSB0aW1lc3RhbXBcbmV4cG9ydHMubG9nID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKCclcyAtICVzJywgdGltZXN0YW1wKCksIGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cykpO1xufTtcblxuXG4vKipcbiAqIEluaGVyaXQgdGhlIHByb3RvdHlwZSBtZXRob2RzIGZyb20gb25lIGNvbnN0cnVjdG9yIGludG8gYW5vdGhlci5cbiAqXG4gKiBUaGUgRnVuY3Rpb24ucHJvdG90eXBlLmluaGVyaXRzIGZyb20gbGFuZy5qcyByZXdyaXR0ZW4gYXMgYSBzdGFuZGFsb25lXG4gKiBmdW5jdGlvbiAobm90IG9uIEZ1bmN0aW9uLnByb3RvdHlwZSkuIE5PVEU6IElmIHRoaXMgZmlsZSBpcyB0byBiZSBsb2FkZWRcbiAqIGR1cmluZyBib290c3RyYXBwaW5nIHRoaXMgZnVuY3Rpb24gbmVlZHMgdG8gYmUgcmV3cml0dGVuIHVzaW5nIHNvbWUgbmF0aXZlXG4gKiBmdW5jdGlvbnMgYXMgcHJvdG90eXBlIHNldHVwIHVzaW5nIG5vcm1hbCBKYXZhU2NyaXB0IGRvZXMgbm90IHdvcmsgYXNcbiAqIGV4cGVjdGVkIGR1cmluZyBib290c3RyYXBwaW5nIChzZWUgbWlycm9yLmpzIGluIHIxMTQ5MDMpLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gd2hpY2ggbmVlZHMgdG8gaW5oZXJpdCB0aGVcbiAqICAgICBwcm90b3R5cGUuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBzdXBlckN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gdG8gaW5oZXJpdCBwcm90b3R5cGUgZnJvbS5cbiAqL1xuZXhwb3J0cy5pbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJyk7XG5cbmV4cG9ydHMuX2V4dGVuZCA9IGZ1bmN0aW9uKG9yaWdpbiwgYWRkKSB7XG4gIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIGFkZCBpc24ndCBhbiBvYmplY3RcbiAgaWYgKCFhZGQgfHwgIWlzT2JqZWN0KGFkZCkpIHJldHVybiBvcmlnaW47XG5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhhZGQpO1xuICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgb3JpZ2luW2tleXNbaV1dID0gYWRkW2tleXNbaV1dO1xuICB9XG4gIHJldHVybiBvcmlnaW47XG59O1xuXG5mdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmV4cG9ydHMuYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGhcbmV4cG9ydHMudG9CeXRlQXJyYXkgPSB0b0J5dGVBcnJheVxuZXhwb3J0cy5mcm9tQnl0ZUFycmF5ID0gZnJvbUJ5dGVBcnJheVxuXG52YXIgbG9va3VwID0gW11cbnZhciByZXZMb29rdXAgPSBbXVxudmFyIEFyciA9IHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJyA/IFVpbnQ4QXJyYXkgOiBBcnJheVxuXG52YXIgY29kZSA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJ1xuZm9yICh2YXIgaSA9IDAsIGxlbiA9IGNvZGUubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgbG9va3VwW2ldID0gY29kZVtpXVxuICByZXZMb29rdXBbY29kZS5jaGFyQ29kZUF0KGkpXSA9IGlcbn1cblxuLy8gU3VwcG9ydCBkZWNvZGluZyBVUkwtc2FmZSBiYXNlNjQgc3RyaW5ncywgYXMgTm9kZS5qcyBkb2VzLlxuLy8gU2VlOiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9CYXNlNjQjVVJMX2FwcGxpY2F0aW9uc1xucmV2TG9va3VwWyctJy5jaGFyQ29kZUF0KDApXSA9IDYyXG5yZXZMb29rdXBbJ18nLmNoYXJDb2RlQXQoMCldID0gNjNcblxuZnVuY3Rpb24gZ2V0TGVucyAoYjY0KSB7XG4gIHZhciBsZW4gPSBiNjQubGVuZ3RoXG5cbiAgaWYgKGxlbiAlIDQgPiAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHN0cmluZy4gTGVuZ3RoIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA0JylcbiAgfVxuXG4gIC8vIFRyaW0gb2ZmIGV4dHJhIGJ5dGVzIGFmdGVyIHBsYWNlaG9sZGVyIGJ5dGVzIGFyZSBmb3VuZFxuICAvLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9iZWF0Z2FtbWl0L2Jhc2U2NC1qcy9pc3N1ZXMvNDJcbiAgdmFyIHZhbGlkTGVuID0gYjY0LmluZGV4T2YoJz0nKVxuICBpZiAodmFsaWRMZW4gPT09IC0xKSB2YWxpZExlbiA9IGxlblxuXG4gIHZhciBwbGFjZUhvbGRlcnNMZW4gPSB2YWxpZExlbiA9PT0gbGVuXG4gICAgPyAwXG4gICAgOiA0IC0gKHZhbGlkTGVuICUgNClcblxuICByZXR1cm4gW3ZhbGlkTGVuLCBwbGFjZUhvbGRlcnNMZW5dXG59XG5cbi8vIGJhc2U2NCBpcyA0LzMgKyB1cCB0byB0d28gY2hhcmFjdGVycyBvZiB0aGUgb3JpZ2luYWwgZGF0YVxuZnVuY3Rpb24gYnl0ZUxlbmd0aCAoYjY0KSB7XG4gIHZhciBsZW5zID0gZ2V0TGVucyhiNjQpXG4gIHZhciB2YWxpZExlbiA9IGxlbnNbMF1cbiAgdmFyIHBsYWNlSG9sZGVyc0xlbiA9IGxlbnNbMV1cbiAgcmV0dXJuICgodmFsaWRMZW4gKyBwbGFjZUhvbGRlcnNMZW4pICogMyAvIDQpIC0gcGxhY2VIb2xkZXJzTGVuXG59XG5cbmZ1bmN0aW9uIF9ieXRlTGVuZ3RoIChiNjQsIHZhbGlkTGVuLCBwbGFjZUhvbGRlcnNMZW4pIHtcbiAgcmV0dXJuICgodmFsaWRMZW4gKyBwbGFjZUhvbGRlcnNMZW4pICogMyAvIDQpIC0gcGxhY2VIb2xkZXJzTGVuXG59XG5cbmZ1bmN0aW9uIHRvQnl0ZUFycmF5IChiNjQpIHtcbiAgdmFyIHRtcFxuICB2YXIgbGVucyA9IGdldExlbnMoYjY0KVxuICB2YXIgdmFsaWRMZW4gPSBsZW5zWzBdXG4gIHZhciBwbGFjZUhvbGRlcnNMZW4gPSBsZW5zWzFdXG5cbiAgdmFyIGFyciA9IG5ldyBBcnIoX2J5dGVMZW5ndGgoYjY0LCB2YWxpZExlbiwgcGxhY2VIb2xkZXJzTGVuKSlcblxuICB2YXIgY3VyQnl0ZSA9IDBcblxuICAvLyBpZiB0aGVyZSBhcmUgcGxhY2Vob2xkZXJzLCBvbmx5IGdldCB1cCB0byB0aGUgbGFzdCBjb21wbGV0ZSA0IGNoYXJzXG4gIHZhciBsZW4gPSBwbGFjZUhvbGRlcnNMZW4gPiAwXG4gICAgPyB2YWxpZExlbiAtIDRcbiAgICA6IHZhbGlkTGVuXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gNCkge1xuICAgIHRtcCA9XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkpXSA8PCAxOCkgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMSldIDw8IDEyKSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAyKV0gPDwgNikgfFxuICAgICAgcmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAzKV1cbiAgICBhcnJbY3VyQnl0ZSsrXSA9ICh0bXAgPj4gMTYpICYgMHhGRlxuICAgIGFycltjdXJCeXRlKytdID0gKHRtcCA+PiA4KSAmIDB4RkZcbiAgICBhcnJbY3VyQnl0ZSsrXSA9IHRtcCAmIDB4RkZcbiAgfVxuXG4gIGlmIChwbGFjZUhvbGRlcnNMZW4gPT09IDIpIHtcbiAgICB0bXAgPVxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpKV0gPDwgMikgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMSldID4+IDQpXG4gICAgYXJyW2N1ckJ5dGUrK10gPSB0bXAgJiAweEZGXG4gIH1cblxuICBpZiAocGxhY2VIb2xkZXJzTGVuID09PSAxKSB7XG4gICAgdG1wID1cbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSldIDw8IDEwKSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAxKV0gPDwgNCkgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMildID4+IDIpXG4gICAgYXJyW2N1ckJ5dGUrK10gPSAodG1wID4+IDgpICYgMHhGRlxuICAgIGFycltjdXJCeXRlKytdID0gdG1wICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIGFyclxufVxuXG5mdW5jdGlvbiB0cmlwbGV0VG9CYXNlNjQgKG51bSkge1xuICByZXR1cm4gbG9va3VwW251bSA+PiAxOCAmIDB4M0ZdICtcbiAgICBsb29rdXBbbnVtID4+IDEyICYgMHgzRl0gK1xuICAgIGxvb2t1cFtudW0gPj4gNiAmIDB4M0ZdICtcbiAgICBsb29rdXBbbnVtICYgMHgzRl1cbn1cblxuZnVuY3Rpb24gZW5jb2RlQ2h1bmsgKHVpbnQ4LCBzdGFydCwgZW5kKSB7XG4gIHZhciB0bXBcbiAgdmFyIG91dHB1dCA9IFtdXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSArPSAzKSB7XG4gICAgdG1wID1cbiAgICAgICgodWludDhbaV0gPDwgMTYpICYgMHhGRjAwMDApICtcbiAgICAgICgodWludDhbaSArIDFdIDw8IDgpICYgMHhGRjAwKSArXG4gICAgICAodWludDhbaSArIDJdICYgMHhGRilcbiAgICBvdXRwdXQucHVzaCh0cmlwbGV0VG9CYXNlNjQodG1wKSlcbiAgfVxuICByZXR1cm4gb3V0cHV0LmpvaW4oJycpXG59XG5cbmZ1bmN0aW9uIGZyb21CeXRlQXJyYXkgKHVpbnQ4KSB7XG4gIHZhciB0bXBcbiAgdmFyIGxlbiA9IHVpbnQ4Lmxlbmd0aFxuICB2YXIgZXh0cmFCeXRlcyA9IGxlbiAlIDMgLy8gaWYgd2UgaGF2ZSAxIGJ5dGUgbGVmdCwgcGFkIDIgYnl0ZXNcbiAgdmFyIHBhcnRzID0gW11cbiAgdmFyIG1heENodW5rTGVuZ3RoID0gMTYzODMgLy8gbXVzdCBiZSBtdWx0aXBsZSBvZiAzXG5cbiAgLy8gZ28gdGhyb3VnaCB0aGUgYXJyYXkgZXZlcnkgdGhyZWUgYnl0ZXMsIHdlJ2xsIGRlYWwgd2l0aCB0cmFpbGluZyBzdHVmZiBsYXRlclxuICBmb3IgKHZhciBpID0gMCwgbGVuMiA9IGxlbiAtIGV4dHJhQnl0ZXM7IGkgPCBsZW4yOyBpICs9IG1heENodW5rTGVuZ3RoKSB7XG4gICAgcGFydHMucHVzaChlbmNvZGVDaHVuayhcbiAgICAgIHVpbnQ4LCBpLCAoaSArIG1heENodW5rTGVuZ3RoKSA+IGxlbjIgPyBsZW4yIDogKGkgKyBtYXhDaHVua0xlbmd0aClcbiAgICApKVxuICB9XG5cbiAgLy8gcGFkIHRoZSBlbmQgd2l0aCB6ZXJvcywgYnV0IG1ha2Ugc3VyZSB0byBub3QgZm9yZ2V0IHRoZSBleHRyYSBieXRlc1xuICBpZiAoZXh0cmFCeXRlcyA9PT0gMSkge1xuICAgIHRtcCA9IHVpbnQ4W2xlbiAtIDFdXG4gICAgcGFydHMucHVzaChcbiAgICAgIGxvb2t1cFt0bXAgPj4gMl0gK1xuICAgICAgbG9va3VwWyh0bXAgPDwgNCkgJiAweDNGXSArXG4gICAgICAnPT0nXG4gICAgKVxuICB9IGVsc2UgaWYgKGV4dHJhQnl0ZXMgPT09IDIpIHtcbiAgICB0bXAgPSAodWludDhbbGVuIC0gMl0gPDwgOCkgKyB1aW50OFtsZW4gLSAxXVxuICAgIHBhcnRzLnB1c2goXG4gICAgICBsb29rdXBbdG1wID4+IDEwXSArXG4gICAgICBsb29rdXBbKHRtcCA+PiA0KSAmIDB4M0ZdICtcbiAgICAgIGxvb2t1cFsodG1wIDw8IDIpICYgMHgzRl0gK1xuICAgICAgJz0nXG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIHBhcnRzLmpvaW4oJycpXG59XG4iLCIiLCIvKiFcbiAqIFRoZSBidWZmZXIgbW9kdWxlIGZyb20gbm9kZS5qcywgZm9yIHRoZSBicm93c2VyLlxuICpcbiAqIEBhdXRob3IgICBGZXJvc3MgQWJvdWtoYWRpamVoIDxodHRwczovL2Zlcm9zcy5vcmc+XG4gKiBAbGljZW5zZSAgTUlUXG4gKi9cbi8qIGVzbGludC1kaXNhYmxlIG5vLXByb3RvICovXG5cbid1c2Ugc3RyaWN0J1xuXG52YXIgYmFzZTY0ID0gcmVxdWlyZSgnYmFzZTY0LWpzJylcbnZhciBpZWVlNzU0ID0gcmVxdWlyZSgnaWVlZTc1NCcpXG5cbmV4cG9ydHMuQnVmZmVyID0gQnVmZmVyXG5leHBvcnRzLlNsb3dCdWZmZXIgPSBTbG93QnVmZmVyXG5leHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTID0gNTBcblxudmFyIEtfTUFYX0xFTkdUSCA9IDB4N2ZmZmZmZmZcbmV4cG9ydHMua01heExlbmd0aCA9IEtfTUFYX0xFTkdUSFxuXG4vKipcbiAqIElmIGBCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVGA6XG4gKiAgID09PSB0cnVlICAgIFVzZSBVaW50OEFycmF5IGltcGxlbWVudGF0aW9uIChmYXN0ZXN0KVxuICogICA9PT0gZmFsc2UgICBQcmludCB3YXJuaW5nIGFuZCByZWNvbW1lbmQgdXNpbmcgYGJ1ZmZlcmAgdjQueCB3aGljaCBoYXMgYW4gT2JqZWN0XG4gKiAgICAgICAgICAgICAgIGltcGxlbWVudGF0aW9uIChtb3N0IGNvbXBhdGlibGUsIGV2ZW4gSUU2KVxuICpcbiAqIEJyb3dzZXJzIHRoYXQgc3VwcG9ydCB0eXBlZCBhcnJheXMgYXJlIElFIDEwKywgRmlyZWZveCA0KywgQ2hyb21lIDcrLCBTYWZhcmkgNS4xKyxcbiAqIE9wZXJhIDExLjYrLCBpT1MgNC4yKy5cbiAqXG4gKiBXZSByZXBvcnQgdGhhdCB0aGUgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IHR5cGVkIGFycmF5cyBpZiB0aGUgYXJlIG5vdCBzdWJjbGFzc2FibGVcbiAqIHVzaW5nIF9fcHJvdG9fXy4gRmlyZWZveCA0LTI5IGxhY2tzIHN1cHBvcnQgZm9yIGFkZGluZyBuZXcgcHJvcGVydGllcyB0byBgVWludDhBcnJheWBcbiAqIChTZWU6IGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTY5NTQzOCkuIElFIDEwIGxhY2tzIHN1cHBvcnRcbiAqIGZvciBfX3Byb3RvX18gYW5kIGhhcyBhIGJ1Z2d5IHR5cGVkIGFycmF5IGltcGxlbWVudGF0aW9uLlxuICovXG5CdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCA9IHR5cGVkQXJyYXlTdXBwb3J0KClcblxuaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCAmJiB0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICB0eXBlb2YgY29uc29sZS5lcnJvciA9PT0gJ2Z1bmN0aW9uJykge1xuICBjb25zb2xlLmVycm9yKFxuICAgICdUaGlzIGJyb3dzZXIgbGFja3MgdHlwZWQgYXJyYXkgKFVpbnQ4QXJyYXkpIHN1cHBvcnQgd2hpY2ggaXMgcmVxdWlyZWQgYnkgJyArXG4gICAgJ2BidWZmZXJgIHY1LnguIFVzZSBgYnVmZmVyYCB2NC54IGlmIHlvdSByZXF1aXJlIG9sZCBicm93c2VyIHN1cHBvcnQuJ1xuICApXG59XG5cbmZ1bmN0aW9uIHR5cGVkQXJyYXlTdXBwb3J0ICgpIHtcbiAgLy8gQ2FuIHR5cGVkIGFycmF5IGluc3RhbmNlcyBjYW4gYmUgYXVnbWVudGVkP1xuICB0cnkge1xuICAgIHZhciBhcnIgPSBuZXcgVWludDhBcnJheSgxKVxuICAgIGFyci5fX3Byb3RvX18gPSB7X19wcm90b19fOiBVaW50OEFycmF5LnByb3RvdHlwZSwgZm9vOiBmdW5jdGlvbiAoKSB7IHJldHVybiA0MiB9fVxuICAgIHJldHVybiBhcnIuZm9vKCkgPT09IDQyXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoQnVmZmVyLnByb3RvdHlwZSwgJ3BhcmVudCcsIHtcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEJ1ZmZlcikpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuYnVmZmVyXG4gIH1cbn0pXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShCdWZmZXIucHJvdG90eXBlLCAnb2Zmc2V0Jywge1xuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQnVmZmVyKSkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5ieXRlT2Zmc2V0XG4gIH1cbn0pXG5cbmZ1bmN0aW9uIGNyZWF0ZUJ1ZmZlciAobGVuZ3RoKSB7XG4gIGlmIChsZW5ndGggPiBLX01BWF9MRU5HVEgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW52YWxpZCB0eXBlZCBhcnJheSBsZW5ndGgnKVxuICB9XG4gIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlXG4gIHZhciBidWYgPSBuZXcgVWludDhBcnJheShsZW5ndGgpXG4gIGJ1Zi5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIHJldHVybiBidWZcbn1cblxuLyoqXG4gKiBUaGUgQnVmZmVyIGNvbnN0cnVjdG9yIHJldHVybnMgaW5zdGFuY2VzIG9mIGBVaW50OEFycmF5YCB0aGF0IGhhdmUgdGhlaXJcbiAqIHByb3RvdHlwZSBjaGFuZ2VkIHRvIGBCdWZmZXIucHJvdG90eXBlYC4gRnVydGhlcm1vcmUsIGBCdWZmZXJgIGlzIGEgc3ViY2xhc3Mgb2ZcbiAqIGBVaW50OEFycmF5YCwgc28gdGhlIHJldHVybmVkIGluc3RhbmNlcyB3aWxsIGhhdmUgYWxsIHRoZSBub2RlIGBCdWZmZXJgIG1ldGhvZHNcbiAqIGFuZCB0aGUgYFVpbnQ4QXJyYXlgIG1ldGhvZHMuIFNxdWFyZSBicmFja2V0IG5vdGF0aW9uIHdvcmtzIGFzIGV4cGVjdGVkIC0tIGl0XG4gKiByZXR1cm5zIGEgc2luZ2xlIG9jdGV0LlxuICpcbiAqIFRoZSBgVWludDhBcnJheWAgcHJvdG90eXBlIHJlbWFpbnMgdW5tb2RpZmllZC5cbiAqL1xuXG5mdW5jdGlvbiBCdWZmZXIgKGFyZywgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gIC8vIENvbW1vbiBjYXNlLlxuICBpZiAodHlwZW9mIGFyZyA9PT0gJ251bWJlcicpIHtcbiAgICBpZiAodHlwZW9mIGVuY29kaW5nT3JPZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdJZiBlbmNvZGluZyBpcyBzcGVjaWZpZWQgdGhlbiB0aGUgZmlyc3QgYXJndW1lbnQgbXVzdCBiZSBhIHN0cmluZydcbiAgICAgIClcbiAgICB9XG4gICAgcmV0dXJuIGFsbG9jVW5zYWZlKGFyZylcbiAgfVxuICByZXR1cm4gZnJvbShhcmcsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbn1cblxuLy8gRml4IHN1YmFycmF5KCkgaW4gRVMyMDE2LiBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL3B1bGwvOTdcbmlmICh0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wuc3BlY2llcyAmJlxuICAgIEJ1ZmZlcltTeW1ib2wuc3BlY2llc10gPT09IEJ1ZmZlcikge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQnVmZmVyLCBTeW1ib2wuc3BlY2llcywge1xuICAgIHZhbHVlOiBudWxsLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICB3cml0YWJsZTogZmFsc2VcbiAgfSlcbn1cblxuQnVmZmVyLnBvb2xTaXplID0gODE5MiAvLyBub3QgdXNlZCBieSB0aGlzIGltcGxlbWVudGF0aW9uXG5cbmZ1bmN0aW9uIGZyb20gKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcInZhbHVlXCIgYXJndW1lbnQgbXVzdCBub3QgYmUgYSBudW1iZXInKVxuICB9XG5cbiAgaWYgKGlzQXJyYXlCdWZmZXIodmFsdWUpIHx8ICh2YWx1ZSAmJiBpc0FycmF5QnVmZmVyKHZhbHVlLmJ1ZmZlcikpKSB7XG4gICAgcmV0dXJuIGZyb21BcnJheUJ1ZmZlcih2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxuICB9XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gZnJvbVN0cmluZyh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldClcbiAgfVxuXG4gIHJldHVybiBmcm9tT2JqZWN0KHZhbHVlKVxufVxuXG4vKipcbiAqIEZ1bmN0aW9uYWxseSBlcXVpdmFsZW50IHRvIEJ1ZmZlcihhcmcsIGVuY29kaW5nKSBidXQgdGhyb3dzIGEgVHlwZUVycm9yXG4gKiBpZiB2YWx1ZSBpcyBhIG51bWJlci5cbiAqIEJ1ZmZlci5mcm9tKHN0clssIGVuY29kaW5nXSlcbiAqIEJ1ZmZlci5mcm9tKGFycmF5KVxuICogQnVmZmVyLmZyb20oYnVmZmVyKVxuICogQnVmZmVyLmZyb20oYXJyYXlCdWZmZXJbLCBieXRlT2Zmc2V0WywgbGVuZ3RoXV0pXG4gKiovXG5CdWZmZXIuZnJvbSA9IGZ1bmN0aW9uICh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBmcm9tKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG59XG5cbi8vIE5vdGU6IENoYW5nZSBwcm90b3R5cGUgKmFmdGVyKiBCdWZmZXIuZnJvbSBpcyBkZWZpbmVkIHRvIHdvcmthcm91bmQgQ2hyb21lIGJ1Zzpcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL3B1bGwvMTQ4XG5CdWZmZXIucHJvdG90eXBlLl9fcHJvdG9fXyA9IFVpbnQ4QXJyYXkucHJvdG90eXBlXG5CdWZmZXIuX19wcm90b19fID0gVWludDhBcnJheVxuXG5mdW5jdGlvbiBhc3NlcnRTaXplIChzaXplKSB7XG4gIGlmICh0eXBlb2Ygc2l6ZSAhPT0gJ251bWJlcicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcInNpemVcIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgbnVtYmVyJylcbiAgfSBlbHNlIGlmIChzaXplIDwgMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdcInNpemVcIiBhcmd1bWVudCBtdXN0IG5vdCBiZSBuZWdhdGl2ZScpXG4gIH1cbn1cblxuZnVuY3Rpb24gYWxsb2MgKHNpemUsIGZpbGwsIGVuY29kaW5nKSB7XG4gIGFzc2VydFNpemUoc2l6ZSlcbiAgaWYgKHNpemUgPD0gMCkge1xuICAgIHJldHVybiBjcmVhdGVCdWZmZXIoc2l6ZSlcbiAgfVxuICBpZiAoZmlsbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gT25seSBwYXkgYXR0ZW50aW9uIHRvIGVuY29kaW5nIGlmIGl0J3MgYSBzdHJpbmcuIFRoaXNcbiAgICAvLyBwcmV2ZW50cyBhY2NpZGVudGFsbHkgc2VuZGluZyBpbiBhIG51bWJlciB0aGF0IHdvdWxkXG4gICAgLy8gYmUgaW50ZXJwcmV0dGVkIGFzIGEgc3RhcnQgb2Zmc2V0LlxuICAgIHJldHVybiB0eXBlb2YgZW5jb2RpbmcgPT09ICdzdHJpbmcnXG4gICAgICA/IGNyZWF0ZUJ1ZmZlcihzaXplKS5maWxsKGZpbGwsIGVuY29kaW5nKVxuICAgICAgOiBjcmVhdGVCdWZmZXIoc2l6ZSkuZmlsbChmaWxsKVxuICB9XG4gIHJldHVybiBjcmVhdGVCdWZmZXIoc2l6ZSlcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGZpbGxlZCBCdWZmZXIgaW5zdGFuY2UuXG4gKiBhbGxvYyhzaXplWywgZmlsbFssIGVuY29kaW5nXV0pXG4gKiovXG5CdWZmZXIuYWxsb2MgPSBmdW5jdGlvbiAoc2l6ZSwgZmlsbCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIGFsbG9jKHNpemUsIGZpbGwsIGVuY29kaW5nKVxufVxuXG5mdW5jdGlvbiBhbGxvY1Vuc2FmZSAoc2l6ZSkge1xuICBhc3NlcnRTaXplKHNpemUpXG4gIHJldHVybiBjcmVhdGVCdWZmZXIoc2l6ZSA8IDAgPyAwIDogY2hlY2tlZChzaXplKSB8IDApXG59XG5cbi8qKlxuICogRXF1aXZhbGVudCB0byBCdWZmZXIobnVtKSwgYnkgZGVmYXVsdCBjcmVhdGVzIGEgbm9uLXplcm8tZmlsbGVkIEJ1ZmZlciBpbnN0YW5jZS5cbiAqICovXG5CdWZmZXIuYWxsb2NVbnNhZmUgPSBmdW5jdGlvbiAoc2l6ZSkge1xuICByZXR1cm4gYWxsb2NVbnNhZmUoc2l6ZSlcbn1cbi8qKlxuICogRXF1aXZhbGVudCB0byBTbG93QnVmZmVyKG51bSksIGJ5IGRlZmF1bHQgY3JlYXRlcyBhIG5vbi16ZXJvLWZpbGxlZCBCdWZmZXIgaW5zdGFuY2UuXG4gKi9cbkJ1ZmZlci5hbGxvY1Vuc2FmZVNsb3cgPSBmdW5jdGlvbiAoc2l6ZSkge1xuICByZXR1cm4gYWxsb2NVbnNhZmUoc2l6ZSlcbn1cblxuZnVuY3Rpb24gZnJvbVN0cmluZyAoc3RyaW5nLCBlbmNvZGluZykge1xuICBpZiAodHlwZW9mIGVuY29kaW5nICE9PSAnc3RyaW5nJyB8fCBlbmNvZGluZyA9PT0gJycpIHtcbiAgICBlbmNvZGluZyA9ICd1dGY4J1xuICB9XG5cbiAgaWYgKCFCdWZmZXIuaXNFbmNvZGluZyhlbmNvZGluZykpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gIH1cblxuICB2YXIgbGVuZ3RoID0gYnl0ZUxlbmd0aChzdHJpbmcsIGVuY29kaW5nKSB8IDBcbiAgdmFyIGJ1ZiA9IGNyZWF0ZUJ1ZmZlcihsZW5ndGgpXG5cbiAgdmFyIGFjdHVhbCA9IGJ1Zi53cml0ZShzdHJpbmcsIGVuY29kaW5nKVxuXG4gIGlmIChhY3R1YWwgIT09IGxlbmd0aCkge1xuICAgIC8vIFdyaXRpbmcgYSBoZXggc3RyaW5nLCBmb3IgZXhhbXBsZSwgdGhhdCBjb250YWlucyBpbnZhbGlkIGNoYXJhY3RlcnMgd2lsbFxuICAgIC8vIGNhdXNlIGV2ZXJ5dGhpbmcgYWZ0ZXIgdGhlIGZpcnN0IGludmFsaWQgY2hhcmFjdGVyIHRvIGJlIGlnbm9yZWQuIChlLmcuXG4gICAgLy8gJ2FieHhjZCcgd2lsbCBiZSB0cmVhdGVkIGFzICdhYicpXG4gICAgYnVmID0gYnVmLnNsaWNlKDAsIGFjdHVhbClcbiAgfVxuXG4gIHJldHVybiBidWZcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5TGlrZSAoYXJyYXkpIHtcbiAgdmFyIGxlbmd0aCA9IGFycmF5Lmxlbmd0aCA8IDAgPyAwIDogY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMFxuICB2YXIgYnVmID0gY3JlYXRlQnVmZmVyKGxlbmd0aClcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIGJ1ZltpXSA9IGFycmF5W2ldICYgMjU1XG4gIH1cbiAgcmV0dXJuIGJ1ZlxufVxuXG5mdW5jdGlvbiBmcm9tQXJyYXlCdWZmZXIgKGFycmF5LCBieXRlT2Zmc2V0LCBsZW5ndGgpIHtcbiAgaWYgKGJ5dGVPZmZzZXQgPCAwIHx8IGFycmF5LmJ5dGVMZW5ndGggPCBieXRlT2Zmc2V0KSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1wib2Zmc2V0XCIgaXMgb3V0c2lkZSBvZiBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIGlmIChhcnJheS5ieXRlTGVuZ3RoIDwgYnl0ZU9mZnNldCArIChsZW5ndGggfHwgMCkpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignXCJsZW5ndGhcIiBpcyBvdXRzaWRlIG9mIGJ1ZmZlciBib3VuZHMnKVxuICB9XG5cbiAgdmFyIGJ1ZlxuICBpZiAoYnl0ZU9mZnNldCA9PT0gdW5kZWZpbmVkICYmIGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgYnVmID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXkpXG4gIH0gZWxzZSBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICBidWYgPSBuZXcgVWludDhBcnJheShhcnJheSwgYnl0ZU9mZnNldClcbiAgfSBlbHNlIHtcbiAgICBidWYgPSBuZXcgVWludDhBcnJheShhcnJheSwgYnl0ZU9mZnNldCwgbGVuZ3RoKVxuICB9XG5cbiAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2VcbiAgYnVmLl9fcHJvdG9fXyA9IEJ1ZmZlci5wcm90b3R5cGVcbiAgcmV0dXJuIGJ1ZlxufVxuXG5mdW5jdGlvbiBmcm9tT2JqZWN0IChvYmopIHtcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihvYmopKSB7XG4gICAgdmFyIGxlbiA9IGNoZWNrZWQob2JqLmxlbmd0aCkgfCAwXG4gICAgdmFyIGJ1ZiA9IGNyZWF0ZUJ1ZmZlcihsZW4pXG5cbiAgICBpZiAoYnVmLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGJ1ZlxuICAgIH1cblxuICAgIG9iai5jb3B5KGJ1ZiwgMCwgMCwgbGVuKVxuICAgIHJldHVybiBidWZcbiAgfVxuXG4gIGlmIChvYmopIHtcbiAgICBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KG9iaikgfHwgJ2xlbmd0aCcgaW4gb2JqKSB7XG4gICAgICBpZiAodHlwZW9mIG9iai5sZW5ndGggIT09ICdudW1iZXInIHx8IG51bWJlcklzTmFOKG9iai5sZW5ndGgpKSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVCdWZmZXIoMClcbiAgICAgIH1cbiAgICAgIHJldHVybiBmcm9tQXJyYXlMaWtlKG9iailcbiAgICB9XG5cbiAgICBpZiAob2JqLnR5cGUgPT09ICdCdWZmZXInICYmIEFycmF5LmlzQXJyYXkob2JqLmRhdGEpKSB7XG4gICAgICByZXR1cm4gZnJvbUFycmF5TGlrZShvYmouZGF0YSlcbiAgICB9XG4gIH1cblxuICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgZmlyc3QgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBzdHJpbmcsIEJ1ZmZlciwgQXJyYXlCdWZmZXIsIEFycmF5LCBvciBBcnJheS1saWtlIE9iamVjdC4nKVxufVxuXG5mdW5jdGlvbiBjaGVja2VkIChsZW5ndGgpIHtcbiAgLy8gTm90ZTogY2Fubm90IHVzZSBgbGVuZ3RoIDwgS19NQVhfTEVOR1RIYCBoZXJlIGJlY2F1c2UgdGhhdCBmYWlscyB3aGVuXG4gIC8vIGxlbmd0aCBpcyBOYU4gKHdoaWNoIGlzIG90aGVyd2lzZSBjb2VyY2VkIHRvIHplcm8uKVxuICBpZiAobGVuZ3RoID49IEtfTUFYX0xFTkdUSCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdBdHRlbXB0IHRvIGFsbG9jYXRlIEJ1ZmZlciBsYXJnZXIgdGhhbiBtYXhpbXVtICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICdzaXplOiAweCcgKyBLX01BWF9MRU5HVEgudG9TdHJpbmcoMTYpICsgJyBieXRlcycpXG4gIH1cbiAgcmV0dXJuIGxlbmd0aCB8IDBcbn1cblxuZnVuY3Rpb24gU2xvd0J1ZmZlciAobGVuZ3RoKSB7XG4gIGlmICgrbGVuZ3RoICE9IGxlbmd0aCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGVxZXFlcVxuICAgIGxlbmd0aCA9IDBcbiAgfVxuICByZXR1cm4gQnVmZmVyLmFsbG9jKCtsZW5ndGgpXG59XG5cbkJ1ZmZlci5pc0J1ZmZlciA9IGZ1bmN0aW9uIGlzQnVmZmVyIChiKSB7XG4gIHJldHVybiBiICE9IG51bGwgJiYgYi5faXNCdWZmZXIgPT09IHRydWVcbn1cblxuQnVmZmVyLmNvbXBhcmUgPSBmdW5jdGlvbiBjb21wYXJlIChhLCBiKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGEpIHx8ICFCdWZmZXIuaXNCdWZmZXIoYikpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgbXVzdCBiZSBCdWZmZXJzJylcbiAgfVxuXG4gIGlmIChhID09PSBiKSByZXR1cm4gMFxuXG4gIHZhciB4ID0gYS5sZW5ndGhcbiAgdmFyIHkgPSBiLmxlbmd0aFxuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBNYXRoLm1pbih4LCB5KTsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKGFbaV0gIT09IGJbaV0pIHtcbiAgICAgIHggPSBhW2ldXG4gICAgICB5ID0gYltpXVxuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cblxuICBpZiAoeCA8IHkpIHJldHVybiAtMVxuICBpZiAoeSA8IHgpIHJldHVybiAxXG4gIHJldHVybiAwXG59XG5cbkJ1ZmZlci5pc0VuY29kaW5nID0gZnVuY3Rpb24gaXNFbmNvZGluZyAoZW5jb2RpbmcpIHtcbiAgc3dpdGNoIChTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKCkpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgY2FzZSAnbGF0aW4xJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldHVybiB0cnVlXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbkJ1ZmZlci5jb25jYXQgPSBmdW5jdGlvbiBjb25jYXQgKGxpc3QsIGxlbmd0aCkge1xuICBpZiAoIUFycmF5LmlzQXJyYXkobGlzdCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImxpc3RcIiBhcmd1bWVudCBtdXN0IGJlIGFuIEFycmF5IG9mIEJ1ZmZlcnMnKVxuICB9XG5cbiAgaWYgKGxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5hbGxvYygwKVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbGVuZ3RoID0gMFxuICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgKytpKSB7XG4gICAgICBsZW5ndGggKz0gbGlzdFtpXS5sZW5ndGhcbiAgICB9XG4gIH1cblxuICB2YXIgYnVmZmVyID0gQnVmZmVyLmFsbG9jVW5zYWZlKGxlbmd0aClcbiAgdmFyIHBvcyA9IDBcbiAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgYnVmID0gbGlzdFtpXVxuICAgIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcoYnVmKSkge1xuICAgICAgYnVmID0gQnVmZmVyLmZyb20oYnVmKVxuICAgIH1cbiAgICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihidWYpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImxpc3RcIiBhcmd1bWVudCBtdXN0IGJlIGFuIEFycmF5IG9mIEJ1ZmZlcnMnKVxuICAgIH1cbiAgICBidWYuY29weShidWZmZXIsIHBvcylcbiAgICBwb3MgKz0gYnVmLmxlbmd0aFxuICB9XG4gIHJldHVybiBidWZmZXJcbn1cblxuZnVuY3Rpb24gYnl0ZUxlbmd0aCAoc3RyaW5nLCBlbmNvZGluZykge1xuICBpZiAoQnVmZmVyLmlzQnVmZmVyKHN0cmluZykpIHtcbiAgICByZXR1cm4gc3RyaW5nLmxlbmd0aFxuICB9XG4gIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcoc3RyaW5nKSB8fCBpc0FycmF5QnVmZmVyKHN0cmluZykpIHtcbiAgICByZXR1cm4gc3RyaW5nLmJ5dGVMZW5ndGhcbiAgfVxuICBpZiAodHlwZW9mIHN0cmluZyAhPT0gJ3N0cmluZycpIHtcbiAgICBzdHJpbmcgPSAnJyArIHN0cmluZ1xuICB9XG5cbiAgdmFyIGxlbiA9IHN0cmluZy5sZW5ndGhcbiAgaWYgKGxlbiA9PT0gMCkgcmV0dXJuIDBcblxuICAvLyBVc2UgYSBmb3IgbG9vcCB0byBhdm9pZCByZWN1cnNpb25cbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcbiAgZm9yICg7Oykge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gbGVuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgIGNhc2UgdW5kZWZpbmVkOlxuICAgICAgICByZXR1cm4gdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGhcbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiBsZW4gKiAyXG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gbGVuID4+PiAxXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICByZXR1cm4gYmFzZTY0VG9CeXRlcyhzdHJpbmcpLmxlbmd0aFxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSByZXR1cm4gdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGggLy8gYXNzdW1lIHV0ZjhcbiAgICAgICAgZW5jb2RpbmcgPSAoJycgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cbkJ1ZmZlci5ieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aFxuXG5mdW5jdGlvbiBzbG93VG9TdHJpbmcgKGVuY29kaW5nLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG5cbiAgLy8gTm8gbmVlZCB0byB2ZXJpZnkgdGhhdCBcInRoaXMubGVuZ3RoIDw9IE1BWF9VSU5UMzJcIiBzaW5jZSBpdCdzIGEgcmVhZC1vbmx5XG4gIC8vIHByb3BlcnR5IG9mIGEgdHlwZWQgYXJyYXkuXG5cbiAgLy8gVGhpcyBiZWhhdmVzIG5laXRoZXIgbGlrZSBTdHJpbmcgbm9yIFVpbnQ4QXJyYXkgaW4gdGhhdCB3ZSBzZXQgc3RhcnQvZW5kXG4gIC8vIHRvIHRoZWlyIHVwcGVyL2xvd2VyIGJvdW5kcyBpZiB0aGUgdmFsdWUgcGFzc2VkIGlzIG91dCBvZiByYW5nZS5cbiAgLy8gdW5kZWZpbmVkIGlzIGhhbmRsZWQgc3BlY2lhbGx5IGFzIHBlciBFQ01BLTI2MiA2dGggRWRpdGlvbixcbiAgLy8gU2VjdGlvbiAxMy4zLjMuNyBSdW50aW1lIFNlbWFudGljczogS2V5ZWRCaW5kaW5nSW5pdGlhbGl6YXRpb24uXG4gIGlmIChzdGFydCA9PT0gdW5kZWZpbmVkIHx8IHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ID0gMFxuICB9XG4gIC8vIFJldHVybiBlYXJseSBpZiBzdGFydCA+IHRoaXMubGVuZ3RoLiBEb25lIGhlcmUgdG8gcHJldmVudCBwb3RlbnRpYWwgdWludDMyXG4gIC8vIGNvZXJjaW9uIGZhaWwgYmVsb3cuXG4gIGlmIChzdGFydCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgcmV0dXJuICcnXG4gIH1cblxuICBpZiAoZW5kID09PSB1bmRlZmluZWQgfHwgZW5kID4gdGhpcy5sZW5ndGgpIHtcbiAgICBlbmQgPSB0aGlzLmxlbmd0aFxuICB9XG5cbiAgaWYgKGVuZCA8PSAwKSB7XG4gICAgcmV0dXJuICcnXG4gIH1cblxuICAvLyBGb3JjZSBjb2Vyc2lvbiB0byB1aW50MzIuIFRoaXMgd2lsbCBhbHNvIGNvZXJjZSBmYWxzZXkvTmFOIHZhbHVlcyB0byAwLlxuICBlbmQgPj4+PSAwXG4gIHN0YXJ0ID4+Pj0gMFxuXG4gIGlmIChlbmQgPD0gc3RhcnQpIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgd2hpbGUgKHRydWUpIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gaGV4U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgICByZXR1cm4gYXNjaWlTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdsYXRpbjEnOlxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGxhdGluMVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIHJldHVybiBiYXNlNjRTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gdXRmMTZsZVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgICAgICBlbmNvZGluZyA9IChlbmNvZGluZyArICcnKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG4vLyBUaGlzIHByb3BlcnR5IGlzIHVzZWQgYnkgYEJ1ZmZlci5pc0J1ZmZlcmAgKGFuZCB0aGUgYGlzLWJ1ZmZlcmAgbnBtIHBhY2thZ2UpXG4vLyB0byBkZXRlY3QgYSBCdWZmZXIgaW5zdGFuY2UuIEl0J3Mgbm90IHBvc3NpYmxlIHRvIHVzZSBgaW5zdGFuY2VvZiBCdWZmZXJgXG4vLyByZWxpYWJseSBpbiBhIGJyb3dzZXJpZnkgY29udGV4dCBiZWNhdXNlIHRoZXJlIGNvdWxkIGJlIG11bHRpcGxlIGRpZmZlcmVudFxuLy8gY29waWVzIG9mIHRoZSAnYnVmZmVyJyBwYWNrYWdlIGluIHVzZS4gVGhpcyBtZXRob2Qgd29ya3MgZXZlbiBmb3IgQnVmZmVyXG4vLyBpbnN0YW5jZXMgdGhhdCB3ZXJlIGNyZWF0ZWQgZnJvbSBhbm90aGVyIGNvcHkgb2YgdGhlIGBidWZmZXJgIHBhY2thZ2UuXG4vLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL2lzc3Vlcy8xNTRcbkJ1ZmZlci5wcm90b3R5cGUuX2lzQnVmZmVyID0gdHJ1ZVxuXG5mdW5jdGlvbiBzd2FwIChiLCBuLCBtKSB7XG4gIHZhciBpID0gYltuXVxuICBiW25dID0gYlttXVxuICBiW21dID0gaVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnN3YXAxNiA9IGZ1bmN0aW9uIHN3YXAxNiAoKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuICUgMiAhPT0gMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdCdWZmZXIgc2l6ZSBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgMTYtYml0cycpXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gMikge1xuICAgIHN3YXAodGhpcywgaSwgaSArIDEpXG4gIH1cbiAgcmV0dXJuIHRoaXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zd2FwMzIgPSBmdW5jdGlvbiBzd2FwMzIgKCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbiAlIDQgIT09IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDMyLWJpdHMnKVxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpICs9IDQpIHtcbiAgICBzd2FwKHRoaXMsIGksIGkgKyAzKVxuICAgIHN3YXAodGhpcywgaSArIDEsIGkgKyAyKVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc3dhcDY0ID0gZnVuY3Rpb24gc3dhcDY0ICgpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW4gJSA4ICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0J1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA2NC1iaXRzJylcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSA4KSB7XG4gICAgc3dhcCh0aGlzLCBpLCBpICsgNylcbiAgICBzd2FwKHRoaXMsIGkgKyAxLCBpICsgNilcbiAgICBzd2FwKHRoaXMsIGkgKyAyLCBpICsgNSlcbiAgICBzd2FwKHRoaXMsIGkgKyAzLCBpICsgNClcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcgKCkge1xuICB2YXIgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbmd0aCA9PT0gMCkgcmV0dXJuICcnXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSByZXR1cm4gdXRmOFNsaWNlKHRoaXMsIDAsIGxlbmd0aClcbiAgcmV0dXJuIHNsb3dUb1N0cmluZy5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9Mb2NhbGVTdHJpbmcgPSBCdWZmZXIucHJvdG90eXBlLnRvU3RyaW5nXG5cbkJ1ZmZlci5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24gZXF1YWxzIChiKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGIpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudCBtdXN0IGJlIGEgQnVmZmVyJylcbiAgaWYgKHRoaXMgPT09IGIpIHJldHVybiB0cnVlXG4gIHJldHVybiBCdWZmZXIuY29tcGFyZSh0aGlzLCBiKSA9PT0gMFxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluc3BlY3QgPSBmdW5jdGlvbiBpbnNwZWN0ICgpIHtcbiAgdmFyIHN0ciA9ICcnXG4gIHZhciBtYXggPSBleHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTXG4gIGlmICh0aGlzLmxlbmd0aCA+IDApIHtcbiAgICBzdHIgPSB0aGlzLnRvU3RyaW5nKCdoZXgnLCAwLCBtYXgpLm1hdGNoKC8uezJ9L2cpLmpvaW4oJyAnKVxuICAgIGlmICh0aGlzLmxlbmd0aCA+IG1heCkgc3RyICs9ICcgLi4uICdcbiAgfVxuICByZXR1cm4gJzxCdWZmZXIgJyArIHN0ciArICc+J1xufVxuXG5CdWZmZXIucHJvdG90eXBlLmNvbXBhcmUgPSBmdW5jdGlvbiBjb21wYXJlICh0YXJnZXQsIHN0YXJ0LCBlbmQsIHRoaXNTdGFydCwgdGhpc0VuZCkge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcih0YXJnZXQpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIH1cblxuICBpZiAoc3RhcnQgPT09IHVuZGVmaW5lZCkge1xuICAgIHN0YXJ0ID0gMFxuICB9XG4gIGlmIChlbmQgPT09IHVuZGVmaW5lZCkge1xuICAgIGVuZCA9IHRhcmdldCA/IHRhcmdldC5sZW5ndGggOiAwXG4gIH1cbiAgaWYgKHRoaXNTdGFydCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhpc1N0YXJ0ID0gMFxuICB9XG4gIGlmICh0aGlzRW5kID09PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzRW5kID0gdGhpcy5sZW5ndGhcbiAgfVxuXG4gIGlmIChzdGFydCA8IDAgfHwgZW5kID4gdGFyZ2V0Lmxlbmd0aCB8fCB0aGlzU3RhcnQgPCAwIHx8IHRoaXNFbmQgPiB0aGlzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdvdXQgb2YgcmFuZ2UgaW5kZXgnKVxuICB9XG5cbiAgaWYgKHRoaXNTdGFydCA+PSB0aGlzRW5kICYmIHN0YXJ0ID49IGVuZCkge1xuICAgIHJldHVybiAwXG4gIH1cbiAgaWYgKHRoaXNTdGFydCA+PSB0aGlzRW5kKSB7XG4gICAgcmV0dXJuIC0xXG4gIH1cbiAgaWYgKHN0YXJ0ID49IGVuZCkge1xuICAgIHJldHVybiAxXG4gIH1cblxuICBzdGFydCA+Pj49IDBcbiAgZW5kID4+Pj0gMFxuICB0aGlzU3RhcnQgPj4+PSAwXG4gIHRoaXNFbmQgPj4+PSAwXG5cbiAgaWYgKHRoaXMgPT09IHRhcmdldCkgcmV0dXJuIDBcblxuICB2YXIgeCA9IHRoaXNFbmQgLSB0aGlzU3RhcnRcbiAgdmFyIHkgPSBlbmQgLSBzdGFydFxuICB2YXIgbGVuID0gTWF0aC5taW4oeCwgeSlcblxuICB2YXIgdGhpc0NvcHkgPSB0aGlzLnNsaWNlKHRoaXNTdGFydCwgdGhpc0VuZClcbiAgdmFyIHRhcmdldENvcHkgPSB0YXJnZXQuc2xpY2Uoc3RhcnQsIGVuZClcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKHRoaXNDb3B5W2ldICE9PSB0YXJnZXRDb3B5W2ldKSB7XG4gICAgICB4ID0gdGhpc0NvcHlbaV1cbiAgICAgIHkgPSB0YXJnZXRDb3B5W2ldXG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuXG4gIGlmICh4IDwgeSkgcmV0dXJuIC0xXG4gIGlmICh5IDwgeCkgcmV0dXJuIDFcbiAgcmV0dXJuIDBcbn1cblxuLy8gRmluZHMgZWl0aGVyIHRoZSBmaXJzdCBpbmRleCBvZiBgdmFsYCBpbiBgYnVmZmVyYCBhdCBvZmZzZXQgPj0gYGJ5dGVPZmZzZXRgLFxuLy8gT1IgdGhlIGxhc3QgaW5kZXggb2YgYHZhbGAgaW4gYGJ1ZmZlcmAgYXQgb2Zmc2V0IDw9IGBieXRlT2Zmc2V0YC5cbi8vXG4vLyBBcmd1bWVudHM6XG4vLyAtIGJ1ZmZlciAtIGEgQnVmZmVyIHRvIHNlYXJjaFxuLy8gLSB2YWwgLSBhIHN0cmluZywgQnVmZmVyLCBvciBudW1iZXJcbi8vIC0gYnl0ZU9mZnNldCAtIGFuIGluZGV4IGludG8gYGJ1ZmZlcmA7IHdpbGwgYmUgY2xhbXBlZCB0byBhbiBpbnQzMlxuLy8gLSBlbmNvZGluZyAtIGFuIG9wdGlvbmFsIGVuY29kaW5nLCByZWxldmFudCBpcyB2YWwgaXMgYSBzdHJpbmdcbi8vIC0gZGlyIC0gdHJ1ZSBmb3IgaW5kZXhPZiwgZmFsc2UgZm9yIGxhc3RJbmRleE9mXG5mdW5jdGlvbiBiaWRpcmVjdGlvbmFsSW5kZXhPZiAoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpIHtcbiAgLy8gRW1wdHkgYnVmZmVyIG1lYW5zIG5vIG1hdGNoXG4gIGlmIChidWZmZXIubGVuZ3RoID09PSAwKSByZXR1cm4gLTFcblxuICAvLyBOb3JtYWxpemUgYnl0ZU9mZnNldFxuICBpZiAodHlwZW9mIGJ5dGVPZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgZW5jb2RpbmcgPSBieXRlT2Zmc2V0XG4gICAgYnl0ZU9mZnNldCA9IDBcbiAgfSBlbHNlIGlmIChieXRlT2Zmc2V0ID4gMHg3ZmZmZmZmZikge1xuICAgIGJ5dGVPZmZzZXQgPSAweDdmZmZmZmZmXG4gIH0gZWxzZSBpZiAoYnl0ZU9mZnNldCA8IC0weDgwMDAwMDAwKSB7XG4gICAgYnl0ZU9mZnNldCA9IC0weDgwMDAwMDAwXG4gIH1cbiAgYnl0ZU9mZnNldCA9ICtieXRlT2Zmc2V0ICAvLyBDb2VyY2UgdG8gTnVtYmVyLlxuICBpZiAobnVtYmVySXNOYU4oYnl0ZU9mZnNldCkpIHtcbiAgICAvLyBieXRlT2Zmc2V0OiBpdCBpdCdzIHVuZGVmaW5lZCwgbnVsbCwgTmFOLCBcImZvb1wiLCBldGMsIHNlYXJjaCB3aG9sZSBidWZmZXJcbiAgICBieXRlT2Zmc2V0ID0gZGlyID8gMCA6IChidWZmZXIubGVuZ3RoIC0gMSlcbiAgfVxuXG4gIC8vIE5vcm1hbGl6ZSBieXRlT2Zmc2V0OiBuZWdhdGl2ZSBvZmZzZXRzIHN0YXJ0IGZyb20gdGhlIGVuZCBvZiB0aGUgYnVmZmVyXG4gIGlmIChieXRlT2Zmc2V0IDwgMCkgYnl0ZU9mZnNldCA9IGJ1ZmZlci5sZW5ndGggKyBieXRlT2Zmc2V0XG4gIGlmIChieXRlT2Zmc2V0ID49IGJ1ZmZlci5sZW5ndGgpIHtcbiAgICBpZiAoZGlyKSByZXR1cm4gLTFcbiAgICBlbHNlIGJ5dGVPZmZzZXQgPSBidWZmZXIubGVuZ3RoIC0gMVxuICB9IGVsc2UgaWYgKGJ5dGVPZmZzZXQgPCAwKSB7XG4gICAgaWYgKGRpcikgYnl0ZU9mZnNldCA9IDBcbiAgICBlbHNlIHJldHVybiAtMVxuICB9XG5cbiAgLy8gTm9ybWFsaXplIHZhbFxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcbiAgICB2YWwgPSBCdWZmZXIuZnJvbSh2YWwsIGVuY29kaW5nKVxuICB9XG5cbiAgLy8gRmluYWxseSwgc2VhcmNoIGVpdGhlciBpbmRleE9mIChpZiBkaXIgaXMgdHJ1ZSkgb3IgbGFzdEluZGV4T2ZcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcih2YWwpKSB7XG4gICAgLy8gU3BlY2lhbCBjYXNlOiBsb29raW5nIGZvciBlbXB0eSBzdHJpbmcvYnVmZmVyIGFsd2F5cyBmYWlsc1xuICAgIGlmICh2YWwubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gLTFcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5SW5kZXhPZihidWZmZXIsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcilcbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgIHZhbCA9IHZhbCAmIDB4RkYgLy8gU2VhcmNoIGZvciBhIGJ5dGUgdmFsdWUgWzAtMjU1XVxuICAgIGlmICh0eXBlb2YgVWludDhBcnJheS5wcm90b3R5cGUuaW5kZXhPZiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgaWYgKGRpcikge1xuICAgICAgICByZXR1cm4gVWludDhBcnJheS5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFVpbnQ4QXJyYXkucHJvdG90eXBlLmxhc3RJbmRleE9mLmNhbGwoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQpXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhcnJheUluZGV4T2YoYnVmZmVyLCBbIHZhbCBdLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZGlyKVxuICB9XG5cbiAgdGhyb3cgbmV3IFR5cGVFcnJvcigndmFsIG11c3QgYmUgc3RyaW5nLCBudW1iZXIgb3IgQnVmZmVyJylcbn1cblxuZnVuY3Rpb24gYXJyYXlJbmRleE9mIChhcnIsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcikge1xuICB2YXIgaW5kZXhTaXplID0gMVxuICB2YXIgYXJyTGVuZ3RoID0gYXJyLmxlbmd0aFxuICB2YXIgdmFsTGVuZ3RoID0gdmFsLmxlbmd0aFxuXG4gIGlmIChlbmNvZGluZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgZW5jb2RpbmcgPSBTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICBpZiAoZW5jb2RpbmcgPT09ICd1Y3MyJyB8fCBlbmNvZGluZyA9PT0gJ3Vjcy0yJyB8fFxuICAgICAgICBlbmNvZGluZyA9PT0gJ3V0ZjE2bGUnIHx8IGVuY29kaW5nID09PSAndXRmLTE2bGUnKSB7XG4gICAgICBpZiAoYXJyLmxlbmd0aCA8IDIgfHwgdmFsLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgcmV0dXJuIC0xXG4gICAgICB9XG4gICAgICBpbmRleFNpemUgPSAyXG4gICAgICBhcnJMZW5ndGggLz0gMlxuICAgICAgdmFsTGVuZ3RoIC89IDJcbiAgICAgIGJ5dGVPZmZzZXQgLz0gMlxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWQgKGJ1ZiwgaSkge1xuICAgIGlmIChpbmRleFNpemUgPT09IDEpIHtcbiAgICAgIHJldHVybiBidWZbaV1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGJ1Zi5yZWFkVUludDE2QkUoaSAqIGluZGV4U2l6ZSlcbiAgICB9XG4gIH1cblxuICB2YXIgaVxuICBpZiAoZGlyKSB7XG4gICAgdmFyIGZvdW5kSW5kZXggPSAtMVxuICAgIGZvciAoaSA9IGJ5dGVPZmZzZXQ7IGkgPCBhcnJMZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHJlYWQoYXJyLCBpKSA9PT0gcmVhZCh2YWwsIGZvdW5kSW5kZXggPT09IC0xID8gMCA6IGkgLSBmb3VuZEluZGV4KSkge1xuICAgICAgICBpZiAoZm91bmRJbmRleCA9PT0gLTEpIGZvdW5kSW5kZXggPSBpXG4gICAgICAgIGlmIChpIC0gZm91bmRJbmRleCArIDEgPT09IHZhbExlbmd0aCkgcmV0dXJuIGZvdW5kSW5kZXggKiBpbmRleFNpemVcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChmb3VuZEluZGV4ICE9PSAtMSkgaSAtPSBpIC0gZm91bmRJbmRleFxuICAgICAgICBmb3VuZEluZGV4ID0gLTFcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGJ5dGVPZmZzZXQgKyB2YWxMZW5ndGggPiBhcnJMZW5ndGgpIGJ5dGVPZmZzZXQgPSBhcnJMZW5ndGggLSB2YWxMZW5ndGhcbiAgICBmb3IgKGkgPSBieXRlT2Zmc2V0OyBpID49IDA7IGktLSkge1xuICAgICAgdmFyIGZvdW5kID0gdHJ1ZVxuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB2YWxMZW5ndGg7IGorKykge1xuICAgICAgICBpZiAocmVhZChhcnIsIGkgKyBqKSAhPT0gcmVhZCh2YWwsIGopKSB7XG4gICAgICAgICAgZm91bmQgPSBmYWxzZVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChmb3VuZCkgcmV0dXJuIGlcbiAgICB9XG4gIH1cblxuICByZXR1cm4gLTFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbmNsdWRlcyA9IGZ1bmN0aW9uIGluY2x1ZGVzICh2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSB7XG4gIHJldHVybiB0aGlzLmluZGV4T2YodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykgIT09IC0xXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5kZXhPZiA9IGZ1bmN0aW9uIGluZGV4T2YgKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIGJpZGlyZWN0aW9uYWxJbmRleE9mKHRoaXMsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIHRydWUpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUubGFzdEluZGV4T2YgPSBmdW5jdGlvbiBsYXN0SW5kZXhPZiAodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykge1xuICByZXR1cm4gYmlkaXJlY3Rpb25hbEluZGV4T2YodGhpcywgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZmFsc2UpXG59XG5cbmZ1bmN0aW9uIGhleFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgb2Zmc2V0ID0gTnVtYmVyKG9mZnNldCkgfHwgMFxuICB2YXIgcmVtYWluaW5nID0gYnVmLmxlbmd0aCAtIG9mZnNldFxuICBpZiAoIWxlbmd0aCkge1xuICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICB9IGVsc2Uge1xuICAgIGxlbmd0aCA9IE51bWJlcihsZW5ndGgpXG4gICAgaWYgKGxlbmd0aCA+IHJlbWFpbmluZykge1xuICAgICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gICAgfVxuICB9XG5cbiAgdmFyIHN0ckxlbiA9IHN0cmluZy5sZW5ndGhcblxuICBpZiAobGVuZ3RoID4gc3RyTGVuIC8gMikge1xuICAgIGxlbmd0aCA9IHN0ckxlbiAvIDJcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgdmFyIHBhcnNlZCA9IHBhcnNlSW50KHN0cmluZy5zdWJzdHIoaSAqIDIsIDIpLCAxNilcbiAgICBpZiAobnVtYmVySXNOYU4ocGFyc2VkKSkgcmV0dXJuIGlcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSBwYXJzZWRcbiAgfVxuICByZXR1cm4gaVxufVxuXG5mdW5jdGlvbiB1dGY4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcih1dGY4VG9CeXRlcyhzdHJpbmcsIGJ1Zi5sZW5ndGggLSBvZmZzZXQpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBhc2NpaVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIoYXNjaWlUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGxhdGluMVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGFzY2lpV3JpdGUoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBiYXNlNjRXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKGJhc2U2NFRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gdWNzMldyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIodXRmMTZsZVRvQnl0ZXMoc3RyaW5nLCBidWYubGVuZ3RoIC0gb2Zmc2V0KSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZSA9IGZ1bmN0aW9uIHdyaXRlIChzdHJpbmcsIG9mZnNldCwgbGVuZ3RoLCBlbmNvZGluZykge1xuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nKVxuICBpZiAob2Zmc2V0ID09PSB1bmRlZmluZWQpIHtcbiAgICBlbmNvZGluZyA9ICd1dGY4J1xuICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gICAgb2Zmc2V0ID0gMFxuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nLCBlbmNvZGluZylcbiAgfSBlbHNlIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygb2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgIGVuY29kaW5nID0gb2Zmc2V0XG4gICAgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgICBvZmZzZXQgPSAwXG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcsIG9mZnNldFssIGxlbmd0aF1bLCBlbmNvZGluZ10pXG4gIH0gZWxzZSBpZiAoaXNGaW5pdGUob2Zmc2V0KSkge1xuICAgIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICAgIGlmIChpc0Zpbml0ZShsZW5ndGgpKSB7XG4gICAgICBsZW5ndGggPSBsZW5ndGggPj4+IDBcbiAgICAgIGlmIChlbmNvZGluZyA9PT0gdW5kZWZpbmVkKSBlbmNvZGluZyA9ICd1dGY4J1xuICAgIH0gZWxzZSB7XG4gICAgICBlbmNvZGluZyA9IGxlbmd0aFxuICAgICAgbGVuZ3RoID0gdW5kZWZpbmVkXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICdCdWZmZXIud3JpdGUoc3RyaW5nLCBlbmNvZGluZywgb2Zmc2V0WywgbGVuZ3RoXSkgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZCdcbiAgICApXG4gIH1cblxuICB2YXIgcmVtYWluaW5nID0gdGhpcy5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkIHx8IGxlbmd0aCA+IHJlbWFpbmluZykgbGVuZ3RoID0gcmVtYWluaW5nXG5cbiAgaWYgKChzdHJpbmcubGVuZ3RoID4gMCAmJiAobGVuZ3RoIDwgMCB8fCBvZmZzZXQgPCAwKSkgfHwgb2Zmc2V0ID4gdGhpcy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQXR0ZW1wdCB0byB3cml0ZSBvdXRzaWRlIGJ1ZmZlciBib3VuZHMnKVxuICB9XG5cbiAgaWYgKCFlbmNvZGluZykgZW5jb2RpbmcgPSAndXRmOCdcblxuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuICBmb3IgKDs7KSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGhleFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgICAgcmV0dXJuIGFzY2lpV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnbGF0aW4xJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBsYXRpbjFXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICAvLyBXYXJuaW5nOiBtYXhMZW5ndGggbm90IHRha2VuIGludG8gYWNjb3VudCBpbiBiYXNlNjRXcml0ZVxuICAgICAgICByZXR1cm4gYmFzZTY0V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIHVjczJXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICAgICAgZW5jb2RpbmcgPSAoJycgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04gKCkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6ICdCdWZmZXInLFxuICAgIGRhdGE6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRoaXMuX2FyciB8fCB0aGlzLCAwKVxuICB9XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKHN0YXJ0ID09PSAwICYmIGVuZCA9PT0gYnVmLmxlbmd0aCkge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYpXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1Zi5zbGljZShzdGFydCwgZW5kKSlcbiAgfVxufVxuXG5mdW5jdGlvbiB1dGY4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG4gIHZhciByZXMgPSBbXVxuXG4gIHZhciBpID0gc3RhcnRcbiAgd2hpbGUgKGkgPCBlbmQpIHtcbiAgICB2YXIgZmlyc3RCeXRlID0gYnVmW2ldXG4gICAgdmFyIGNvZGVQb2ludCA9IG51bGxcbiAgICB2YXIgYnl0ZXNQZXJTZXF1ZW5jZSA9IChmaXJzdEJ5dGUgPiAweEVGKSA/IDRcbiAgICAgIDogKGZpcnN0Qnl0ZSA+IDB4REYpID8gM1xuICAgICAgOiAoZmlyc3RCeXRlID4gMHhCRikgPyAyXG4gICAgICA6IDFcblxuICAgIGlmIChpICsgYnl0ZXNQZXJTZXF1ZW5jZSA8PSBlbmQpIHtcbiAgICAgIHZhciBzZWNvbmRCeXRlLCB0aGlyZEJ5dGUsIGZvdXJ0aEJ5dGUsIHRlbXBDb2RlUG9pbnRcblxuICAgICAgc3dpdGNoIChieXRlc1BlclNlcXVlbmNlKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICBpZiAoZmlyc3RCeXRlIDwgMHg4MCkge1xuICAgICAgICAgICAgY29kZVBvaW50ID0gZmlyc3RCeXRlXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4MUYpIDw8IDB4NiB8IChzZWNvbmRCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHg3Rikge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl1cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAodGhpcmRCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHhGKSA8PCAweEMgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpIDw8IDB4NiB8ICh0aGlyZEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweDdGRiAmJiAodGVtcENvZGVQb2ludCA8IDB4RDgwMCB8fCB0ZW1wQ29kZVBvaW50ID4gMHhERkZGKSkge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl1cbiAgICAgICAgICBmb3VydGhCeXRlID0gYnVmW2kgKyAzXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwICYmICh0aGlyZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAoZm91cnRoQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4RikgPDwgMHgxMiB8IChzZWNvbmRCeXRlICYgMHgzRikgPDwgMHhDIHwgKHRoaXJkQnl0ZSAmIDB4M0YpIDw8IDB4NiB8IChmb3VydGhCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHhGRkZGICYmIHRlbXBDb2RlUG9pbnQgPCAweDExMDAwMCkge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjb2RlUG9pbnQgPT09IG51bGwpIHtcbiAgICAgIC8vIHdlIGRpZCBub3QgZ2VuZXJhdGUgYSB2YWxpZCBjb2RlUG9pbnQgc28gaW5zZXJ0IGFcbiAgICAgIC8vIHJlcGxhY2VtZW50IGNoYXIgKFUrRkZGRCkgYW5kIGFkdmFuY2Ugb25seSAxIGJ5dGVcbiAgICAgIGNvZGVQb2ludCA9IDB4RkZGRFxuICAgICAgYnl0ZXNQZXJTZXF1ZW5jZSA9IDFcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA+IDB4RkZGRikge1xuICAgICAgLy8gZW5jb2RlIHRvIHV0ZjE2IChzdXJyb2dhdGUgcGFpciBkYW5jZSlcbiAgICAgIGNvZGVQb2ludCAtPSAweDEwMDAwXG4gICAgICByZXMucHVzaChjb2RlUG9pbnQgPj4+IDEwICYgMHgzRkYgfCAweEQ4MDApXG4gICAgICBjb2RlUG9pbnQgPSAweERDMDAgfCBjb2RlUG9pbnQgJiAweDNGRlxuICAgIH1cblxuICAgIHJlcy5wdXNoKGNvZGVQb2ludClcbiAgICBpICs9IGJ5dGVzUGVyU2VxdWVuY2VcbiAgfVxuXG4gIHJldHVybiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkocmVzKVxufVxuXG4vLyBCYXNlZCBvbiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yMjc0NzI3Mi82ODA3NDIsIHRoZSBicm93c2VyIHdpdGhcbi8vIHRoZSBsb3dlc3QgbGltaXQgaXMgQ2hyb21lLCB3aXRoIDB4MTAwMDAgYXJncy5cbi8vIFdlIGdvIDEgbWFnbml0dWRlIGxlc3MsIGZvciBzYWZldHlcbnZhciBNQVhfQVJHVU1FTlRTX0xFTkdUSCA9IDB4MTAwMFxuXG5mdW5jdGlvbiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkgKGNvZGVQb2ludHMpIHtcbiAgdmFyIGxlbiA9IGNvZGVQb2ludHMubGVuZ3RoXG4gIGlmIChsZW4gPD0gTUFYX0FSR1VNRU5UU19MRU5HVEgpIHtcbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShTdHJpbmcsIGNvZGVQb2ludHMpIC8vIGF2b2lkIGV4dHJhIHNsaWNlKClcbiAgfVxuXG4gIC8vIERlY29kZSBpbiBjaHVua3MgdG8gYXZvaWQgXCJjYWxsIHN0YWNrIHNpemUgZXhjZWVkZWRcIi5cbiAgdmFyIHJlcyA9ICcnXG4gIHZhciBpID0gMFxuICB3aGlsZSAoaSA8IGxlbikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFxuICAgICAgU3RyaW5nLFxuICAgICAgY29kZVBvaW50cy5zbGljZShpLCBpICs9IE1BWF9BUkdVTUVOVFNfTEVOR1RIKVxuICAgIClcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbmZ1bmN0aW9uIGFzY2lpU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldICYgMHg3RilcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGxhdGluMVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGhleFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcblxuICBpZiAoIXN0YXJ0IHx8IHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIGlmICghZW5kIHx8IGVuZCA8IDAgfHwgZW5kID4gbGVuKSBlbmQgPSBsZW5cblxuICB2YXIgb3V0ID0gJydcbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICBvdXQgKz0gdG9IZXgoYnVmW2ldKVxuICB9XG4gIHJldHVybiBvdXRcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGJ5dGVzID0gYnVmLnNsaWNlKHN0YXJ0LCBlbmQpXG4gIHZhciByZXMgPSAnJ1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJ5dGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0gKyAoYnl0ZXNbaSArIDFdICogMjU2KSlcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc2xpY2UgPSBmdW5jdGlvbiBzbGljZSAoc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgc3RhcnQgPSB+fnN0YXJ0XG4gIGVuZCA9IGVuZCA9PT0gdW5kZWZpbmVkID8gbGVuIDogfn5lbmRcblxuICBpZiAoc3RhcnQgPCAwKSB7XG4gICAgc3RhcnQgKz0gbGVuXG4gICAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIH0gZWxzZSBpZiAoc3RhcnQgPiBsZW4pIHtcbiAgICBzdGFydCA9IGxlblxuICB9XG5cbiAgaWYgKGVuZCA8IDApIHtcbiAgICBlbmQgKz0gbGVuXG4gICAgaWYgKGVuZCA8IDApIGVuZCA9IDBcbiAgfSBlbHNlIGlmIChlbmQgPiBsZW4pIHtcbiAgICBlbmQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCBzdGFydCkgZW5kID0gc3RhcnRcblxuICB2YXIgbmV3QnVmID0gdGhpcy5zdWJhcnJheShzdGFydCwgZW5kKVxuICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZVxuICBuZXdCdWYuX19wcm90b19fID0gQnVmZmVyLnByb3RvdHlwZVxuICByZXR1cm4gbmV3QnVmXG59XG5cbi8qXG4gKiBOZWVkIHRvIG1ha2Ugc3VyZSB0aGF0IGJ1ZmZlciBpc24ndCB0cnlpbmcgdG8gd3JpdGUgb3V0IG9mIGJvdW5kcy5cbiAqL1xuZnVuY3Rpb24gY2hlY2tPZmZzZXQgKG9mZnNldCwgZXh0LCBsZW5ndGgpIHtcbiAgaWYgKChvZmZzZXQgJSAxKSAhPT0gMCB8fCBvZmZzZXQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignb2Zmc2V0IGlzIG5vdCB1aW50JylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RyeWluZyB0byBhY2Nlc3MgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50TEUgPSBmdW5jdGlvbiByZWFkVUludExFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF1cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgaV0gKiBtdWxcbiAgfVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludEJFID0gZnVuY3Rpb24gcmVhZFVJbnRCRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG4gIH1cblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdXG4gIHZhciBtdWwgPSAxXG4gIHdoaWxlIChieXRlTGVuZ3RoID4gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0tYnl0ZUxlbmd0aF0gKiBtdWxcbiAgfVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDggPSBmdW5jdGlvbiByZWFkVUludDggKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMSwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiB0aGlzW29mZnNldF1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2TEUgPSBmdW5jdGlvbiByZWFkVUludDE2TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRVSW50MTZCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgOCkgfCB0aGlzW29mZnNldCArIDFdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkxFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAoKHRoaXNbb2Zmc2V0XSkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgMTYpKSArXG4gICAgICAodGhpc1tvZmZzZXQgKyAzXSAqIDB4MTAwMDAwMClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyQkUgPSBmdW5jdGlvbiByZWFkVUludDMyQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0gKiAweDEwMDAwMDApICtcbiAgICAoKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgdGhpc1tvZmZzZXQgKyAzXSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50TEUgPSBmdW5jdGlvbiByZWFkSW50TEUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XVxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludEJFID0gZnVuY3Rpb24gcmVhZEludEJFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aFxuICB2YXIgbXVsID0gMVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWldXG4gIHdoaWxlIChpID4gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0taV0gKiBtdWxcbiAgfVxuICBtdWwgKj0gMHg4MFxuXG4gIGlmICh2YWwgPj0gbXVsKSB2YWwgLT0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQ4ID0gZnVuY3Rpb24gcmVhZEludDggKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMSwgdGhpcy5sZW5ndGgpXG4gIGlmICghKHRoaXNbb2Zmc2V0XSAmIDB4ODApKSByZXR1cm4gKHRoaXNbb2Zmc2V0XSlcbiAgcmV0dXJuICgoMHhmZiAtIHRoaXNbb2Zmc2V0XSArIDEpICogLTEpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2TEUgPSBmdW5jdGlvbiByZWFkSW50MTZMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XSB8ICh0aGlzW29mZnNldCArIDFdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRJbnQxNkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAxXSB8ICh0aGlzW29mZnNldF0gPDwgOClcbiAgcmV0dXJuICh2YWwgJiAweDgwMDApID8gdmFsIHwgMHhGRkZGMDAwMCA6IHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkxFID0gZnVuY3Rpb24gcmVhZEludDMyTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0pIHxcbiAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAzXSA8PCAyNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJCRSA9IGZ1bmN0aW9uIHJlYWRJbnQzMkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDI0KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0TEUgPSBmdW5jdGlvbiByZWFkRmxvYXRMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdEJFID0gZnVuY3Rpb24gcmVhZEZsb2F0QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUxFID0gZnVuY3Rpb24gcmVhZERvdWJsZUxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgNTIsIDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUJFID0gZnVuY3Rpb24gcmVhZERvdWJsZUJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDUyLCA4KVxufVxuXG5mdW5jdGlvbiBjaGVja0ludCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBleHQsIG1heCwgbWluKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGJ1ZikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wiYnVmZmVyXCIgYXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlciBpbnN0YW5jZScpXG4gIGlmICh2YWx1ZSA+IG1heCB8fCB2YWx1ZSA8IG1pbikgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1widmFsdWVcIiBhcmd1bWVudCBpcyBvdXQgb2YgYm91bmRzJylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGJ1Zi5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludExFID0gZnVuY3Rpb24gd3JpdGVVSW50TEUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIG1heEJ5dGVzID0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpIC0gMVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG1heEJ5dGVzLCAwKVxuICB9XG5cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAodmFsdWUgLyBtdWwpICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlVUludEJFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBtYXhCeXRlcyA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSAtIDFcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBtYXhCeXRlcywgMClcbiAgfVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aCAtIDFcbiAgdmFyIG11bCA9IDFcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50OCA9IGZ1bmN0aW9uIHdyaXRlVUludDggKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweGZmLCAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyTEUgPSBmdW5jdGlvbiB3cml0ZVVJbnQzMkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQzMkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiAyNClcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50TEUgPSBmdW5jdGlvbiB3cml0ZUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBsaW1pdCA9IE1hdGgucG93KDIsICg4ICogYnl0ZUxlbmd0aCkgLSAxKVxuXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbGltaXQgLSAxLCAtbGltaXQpXG4gIH1cblxuICB2YXIgaSA9IDBcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IDBcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgaWYgKHZhbHVlIDwgMCAmJiBzdWIgPT09IDAgJiYgdGhpc1tvZmZzZXQgKyBpIC0gMV0gIT09IDApIHtcbiAgICAgIHN1YiA9IDFcbiAgICB9XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICgodmFsdWUgLyBtdWwpID4+IDApIC0gc3ViICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludEJFID0gZnVuY3Rpb24gd3JpdGVJbnRCRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbGltaXQgPSBNYXRoLnBvdygyLCAoOCAqIGJ5dGVMZW5ndGgpIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gMFxuICB0aGlzW29mZnNldCArIGldID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgtLWkgPj0gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIGlmICh2YWx1ZSA8IDAgJiYgc3ViID09PSAwICYmIHRoaXNbb2Zmc2V0ICsgaSArIDFdICE9PSAwKSB7XG4gICAgICBzdWIgPSAxXG4gICAgfVxuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQ4ID0gZnVuY3Rpb24gd3JpdGVJbnQ4ICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMHg3ZiwgLTB4ODApXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZiArIHZhbHVlICsgMVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MTZMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4N2ZmZiwgLTB4ODAwMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2QkUgPSBmdW5jdGlvbiB3cml0ZUludDE2QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkxFID0gZnVuY3Rpb24gd3JpdGVJbnQzMkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlID4+PiAyNClcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZUludDMyQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmZmZmZmICsgdmFsdWUgKyAxXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuZnVuY3Rpb24gY2hlY2tJRUVFNzU0IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKG9mZnNldCArIGV4dCA+IGJ1Zi5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxuICBpZiAob2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRmxvYXQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrSUVFRTc1NChidWYsIHZhbHVlLCBvZmZzZXQsIDQsIDMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgsIC0zLjQwMjgyMzQ2NjM4NTI4ODZlKzM4KVxuICB9XG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDIzLCA0KVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRMRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdEJFID0gZnVuY3Rpb24gd3JpdGVGbG9hdEJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRG91YmxlIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA4LCAxLjc5NzY5MzEzNDg2MjMxNTdFKzMwOCwgLTEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4KVxuICB9XG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDUyLCA4KVxuICByZXR1cm4gb2Zmc2V0ICsgOFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlTEUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVCRSA9IGZ1bmN0aW9uIHdyaXRlRG91YmxlQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbi8vIGNvcHkodGFyZ2V0QnVmZmVyLCB0YXJnZXRTdGFydD0wLCBzb3VyY2VTdGFydD0wLCBzb3VyY2VFbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uIGNvcHkgKHRhcmdldCwgdGFyZ2V0U3RhcnQsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodGFyZ2V0KSkgdGhyb3cgbmV3IFR5cGVFcnJvcignYXJndW1lbnQgc2hvdWxkIGJlIGEgQnVmZmVyJylcbiAgaWYgKCFzdGFydCkgc3RhcnQgPSAwXG4gIGlmICghZW5kICYmIGVuZCAhPT0gMCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldFN0YXJ0ID49IHRhcmdldC5sZW5ndGgpIHRhcmdldFN0YXJ0ID0gdGFyZ2V0Lmxlbmd0aFxuICBpZiAoIXRhcmdldFN0YXJ0KSB0YXJnZXRTdGFydCA9IDBcbiAgaWYgKGVuZCA+IDAgJiYgZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgLy8gQ29weSAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm4gMFxuICBpZiAodGFyZ2V0Lmxlbmd0aCA9PT0gMCB8fCB0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDBcblxuICAvLyBGYXRhbCBlcnJvciBjb25kaXRpb25zXG4gIGlmICh0YXJnZXRTdGFydCA8IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcigndGFyZ2V0U3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIH1cbiAgaWYgKHN0YXJ0IDwgMCB8fCBzdGFydCA+PSB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG4gIGlmIChlbmQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignc291cmNlRW5kIG91dCBvZiBib3VuZHMnKVxuXG4gIC8vIEFyZSB3ZSBvb2I/XG4gIGlmIChlbmQgPiB0aGlzLmxlbmd0aCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldC5sZW5ndGggLSB0YXJnZXRTdGFydCA8IGVuZCAtIHN0YXJ0KSB7XG4gICAgZW5kID0gdGFyZ2V0Lmxlbmd0aCAtIHRhcmdldFN0YXJ0ICsgc3RhcnRcbiAgfVxuXG4gIHZhciBsZW4gPSBlbmQgLSBzdGFydFxuXG4gIGlmICh0aGlzID09PSB0YXJnZXQgJiYgdHlwZW9mIFVpbnQ4QXJyYXkucHJvdG90eXBlLmNvcHlXaXRoaW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyBVc2UgYnVpbHQtaW4gd2hlbiBhdmFpbGFibGUsIG1pc3NpbmcgZnJvbSBJRTExXG4gICAgdGhpcy5jb3B5V2l0aGluKHRhcmdldFN0YXJ0LCBzdGFydCwgZW5kKVxuICB9IGVsc2UgaWYgKHRoaXMgPT09IHRhcmdldCAmJiBzdGFydCA8IHRhcmdldFN0YXJ0ICYmIHRhcmdldFN0YXJ0IDwgZW5kKSB7XG4gICAgLy8gZGVzY2VuZGluZyBjb3B5IGZyb20gZW5kXG4gICAgZm9yICh2YXIgaSA9IGxlbiAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICB0YXJnZXRbaSArIHRhcmdldFN0YXJ0XSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBVaW50OEFycmF5LnByb3RvdHlwZS5zZXQuY2FsbChcbiAgICAgIHRhcmdldCxcbiAgICAgIHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZCksXG4gICAgICB0YXJnZXRTdGFydFxuICAgIClcbiAgfVxuXG4gIHJldHVybiBsZW5cbn1cblxuLy8gVXNhZ2U6XG4vLyAgICBidWZmZXIuZmlsbChudW1iZXJbLCBvZmZzZXRbLCBlbmRdXSlcbi8vICAgIGJ1ZmZlci5maWxsKGJ1ZmZlclssIG9mZnNldFssIGVuZF1dKVxuLy8gICAgYnVmZmVyLmZpbGwoc3RyaW5nWywgb2Zmc2V0WywgZW5kXV1bLCBlbmNvZGluZ10pXG5CdWZmZXIucHJvdG90eXBlLmZpbGwgPSBmdW5jdGlvbiBmaWxsICh2YWwsIHN0YXJ0LCBlbmQsIGVuY29kaW5nKSB7XG4gIC8vIEhhbmRsZSBzdHJpbmcgY2FzZXM6XG4gIGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xuICAgIGlmICh0eXBlb2Ygc3RhcnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBlbmNvZGluZyA9IHN0YXJ0XG4gICAgICBzdGFydCA9IDBcbiAgICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZW5kID09PSAnc3RyaW5nJykge1xuICAgICAgZW5jb2RpbmcgPSBlbmRcbiAgICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gICAgfVxuICAgIGlmIChlbmNvZGluZyAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBlbmNvZGluZyAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2VuY29kaW5nIG11c3QgYmUgYSBzdHJpbmcnKVxuICAgIH1cbiAgICBpZiAodHlwZW9mIGVuY29kaW5nID09PSAnc3RyaW5nJyAmJiAhQnVmZmVyLmlzRW5jb2RpbmcoZW5jb2RpbmcpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgfVxuICAgIGlmICh2YWwubGVuZ3RoID09PSAxKSB7XG4gICAgICB2YXIgY29kZSA9IHZhbC5jaGFyQ29kZUF0KDApXG4gICAgICBpZiAoKGVuY29kaW5nID09PSAndXRmOCcgJiYgY29kZSA8IDEyOCkgfHxcbiAgICAgICAgICBlbmNvZGluZyA9PT0gJ2xhdGluMScpIHtcbiAgICAgICAgLy8gRmFzdCBwYXRoOiBJZiBgdmFsYCBmaXRzIGludG8gYSBzaW5nbGUgYnl0ZSwgdXNlIHRoYXQgbnVtZXJpYyB2YWx1ZS5cbiAgICAgICAgdmFsID0gY29kZVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgIHZhbCA9IHZhbCAmIDI1NVxuICB9XG5cbiAgLy8gSW52YWxpZCByYW5nZXMgYXJlIG5vdCBzZXQgdG8gYSBkZWZhdWx0LCBzbyBjYW4gcmFuZ2UgY2hlY2sgZWFybHkuXG4gIGlmIChzdGFydCA8IDAgfHwgdGhpcy5sZW5ndGggPCBzdGFydCB8fCB0aGlzLmxlbmd0aCA8IGVuZCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdPdXQgb2YgcmFuZ2UgaW5kZXgnKVxuICB9XG5cbiAgaWYgKGVuZCA8PSBzdGFydCkge1xuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBzdGFydCA9IHN0YXJ0ID4+PiAwXG4gIGVuZCA9IGVuZCA9PT0gdW5kZWZpbmVkID8gdGhpcy5sZW5ndGggOiBlbmQgPj4+IDBcblxuICBpZiAoIXZhbCkgdmFsID0gMFxuXG4gIHZhciBpXG4gIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgIGZvciAoaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICAgIHRoaXNbaV0gPSB2YWxcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFyIGJ5dGVzID0gQnVmZmVyLmlzQnVmZmVyKHZhbClcbiAgICAgID8gdmFsXG4gICAgICA6IG5ldyBCdWZmZXIodmFsLCBlbmNvZGluZylcbiAgICB2YXIgbGVuID0gYnl0ZXMubGVuZ3RoXG4gICAgaWYgKGxlbiA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIHZhbHVlIFwiJyArIHZhbCArXG4gICAgICAgICdcIiBpcyBpbnZhbGlkIGZvciBhcmd1bWVudCBcInZhbHVlXCInKVxuICAgIH1cbiAgICBmb3IgKGkgPSAwOyBpIDwgZW5kIC0gc3RhcnQ7ICsraSkge1xuICAgICAgdGhpc1tpICsgc3RhcnRdID0gYnl0ZXNbaSAlIGxlbl1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpc1xufVxuXG4vLyBIRUxQRVIgRlVOQ1RJT05TXG4vLyA9PT09PT09PT09PT09PT09XG5cbnZhciBJTlZBTElEX0JBU0U2NF9SRSA9IC9bXisvMC05QS1aYS16LV9dL2dcblxuZnVuY3Rpb24gYmFzZTY0Y2xlYW4gKHN0cikge1xuICAvLyBOb2RlIHRha2VzIGVxdWFsIHNpZ25zIGFzIGVuZCBvZiB0aGUgQmFzZTY0IGVuY29kaW5nXG4gIHN0ciA9IHN0ci5zcGxpdCgnPScpWzBdXG4gIC8vIE5vZGUgc3RyaXBzIG91dCBpbnZhbGlkIGNoYXJhY3RlcnMgbGlrZSBcXG4gYW5kIFxcdCBmcm9tIHRoZSBzdHJpbmcsIGJhc2U2NC1qcyBkb2VzIG5vdFxuICBzdHIgPSBzdHIudHJpbSgpLnJlcGxhY2UoSU5WQUxJRF9CQVNFNjRfUkUsICcnKVxuICAvLyBOb2RlIGNvbnZlcnRzIHN0cmluZ3Mgd2l0aCBsZW5ndGggPCAyIHRvICcnXG4gIGlmIChzdHIubGVuZ3RoIDwgMikgcmV0dXJuICcnXG4gIC8vIE5vZGUgYWxsb3dzIGZvciBub24tcGFkZGVkIGJhc2U2NCBzdHJpbmdzIChtaXNzaW5nIHRyYWlsaW5nID09PSksIGJhc2U2NC1qcyBkb2VzIG5vdFxuICB3aGlsZSAoc3RyLmxlbmd0aCAlIDQgIT09IDApIHtcbiAgICBzdHIgPSBzdHIgKyAnPSdcbiAgfVxuICByZXR1cm4gc3RyXG59XG5cbmZ1bmN0aW9uIHRvSGV4IChuKSB7XG4gIGlmIChuIDwgMTYpIHJldHVybiAnMCcgKyBuLnRvU3RyaW5nKDE2KVxuICByZXR1cm4gbi50b1N0cmluZygxNilcbn1cblxuZnVuY3Rpb24gdXRmOFRvQnl0ZXMgKHN0cmluZywgdW5pdHMpIHtcbiAgdW5pdHMgPSB1bml0cyB8fCBJbmZpbml0eVxuICB2YXIgY29kZVBvaW50XG4gIHZhciBsZW5ndGggPSBzdHJpbmcubGVuZ3RoXG4gIHZhciBsZWFkU3Vycm9nYXRlID0gbnVsbFxuICB2YXIgYnl0ZXMgPSBbXVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICBjb2RlUG9pbnQgPSBzdHJpbmcuY2hhckNvZGVBdChpKVxuXG4gICAgLy8gaXMgc3Vycm9nYXRlIGNvbXBvbmVudFxuICAgIGlmIChjb2RlUG9pbnQgPiAweEQ3RkYgJiYgY29kZVBvaW50IDwgMHhFMDAwKSB7XG4gICAgICAvLyBsYXN0IGNoYXIgd2FzIGEgbGVhZFxuICAgICAgaWYgKCFsZWFkU3Vycm9nYXRlKSB7XG4gICAgICAgIC8vIG5vIGxlYWQgeWV0XG4gICAgICAgIGlmIChjb2RlUG9pbnQgPiAweERCRkYpIHtcbiAgICAgICAgICAvLyB1bmV4cGVjdGVkIHRyYWlsXG4gICAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfSBlbHNlIGlmIChpICsgMSA9PT0gbGVuZ3RoKSB7XG4gICAgICAgICAgLy8gdW5wYWlyZWQgbGVhZFxuICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cblxuICAgICAgICAvLyB2YWxpZCBsZWFkXG4gICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcblxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICAvLyAyIGxlYWRzIGluIGEgcm93XG4gICAgICBpZiAoY29kZVBvaW50IDwgMHhEQzAwKSB7XG4gICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICBsZWFkU3Vycm9nYXRlID0gY29kZVBvaW50XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vIHZhbGlkIHN1cnJvZ2F0ZSBwYWlyXG4gICAgICBjb2RlUG9pbnQgPSAobGVhZFN1cnJvZ2F0ZSAtIDB4RDgwMCA8PCAxMCB8IGNvZGVQb2ludCAtIDB4REMwMCkgKyAweDEwMDAwXG4gICAgfSBlbHNlIGlmIChsZWFkU3Vycm9nYXRlKSB7XG4gICAgICAvLyB2YWxpZCBibXAgY2hhciwgYnV0IGxhc3QgY2hhciB3YXMgYSBsZWFkXG4gICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICB9XG5cbiAgICBsZWFkU3Vycm9nYXRlID0gbnVsbFxuXG4gICAgLy8gZW5jb2RlIHV0ZjhcbiAgICBpZiAoY29kZVBvaW50IDwgMHg4MCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAxKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKGNvZGVQb2ludClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4ODAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDIpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgfCAweEMwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHgxMDAwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAzKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHhDIHwgMHhFMCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHgxMTAwMDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gNCkgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4MTIgfCAweEYwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHhDICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvZGUgcG9pbnQnKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBieXRlc1xufVxuXG5mdW5jdGlvbiBhc2NpaVRvQnl0ZXMgKHN0cikge1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyArK2kpIHtcbiAgICAvLyBOb2RlJ3MgY29kZSBzZWVtcyB0byBiZSBkb2luZyB0aGlzIGFuZCBub3QgJiAweDdGLi5cbiAgICBieXRlQXJyYXkucHVzaChzdHIuY2hhckNvZGVBdChpKSAmIDB4RkYpXG4gIH1cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiB1dGYxNmxlVG9CeXRlcyAoc3RyLCB1bml0cykge1xuICB2YXIgYywgaGksIGxvXG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7ICsraSkge1xuICAgIGlmICgodW5pdHMgLT0gMikgPCAwKSBicmVha1xuXG4gICAgYyA9IHN0ci5jaGFyQ29kZUF0KGkpXG4gICAgaGkgPSBjID4+IDhcbiAgICBsbyA9IGMgJSAyNTZcbiAgICBieXRlQXJyYXkucHVzaChsbylcbiAgICBieXRlQXJyYXkucHVzaChoaSlcbiAgfVxuXG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gYmFzZTY0VG9CeXRlcyAoc3RyKSB7XG4gIHJldHVybiBiYXNlNjQudG9CeXRlQXJyYXkoYmFzZTY0Y2xlYW4oc3RyKSlcbn1cblxuZnVuY3Rpb24gYmxpdEJ1ZmZlciAoc3JjLCBkc3QsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICBpZiAoKGkgKyBvZmZzZXQgPj0gZHN0Lmxlbmd0aCkgfHwgKGkgPj0gc3JjLmxlbmd0aCkpIGJyZWFrXG4gICAgZHN0W2kgKyBvZmZzZXRdID0gc3JjW2ldXG4gIH1cbiAgcmV0dXJuIGlcbn1cblxuLy8gQXJyYXlCdWZmZXJzIGZyb20gYW5vdGhlciBjb250ZXh0IChpLmUuIGFuIGlmcmFtZSkgZG8gbm90IHBhc3MgdGhlIGBpbnN0YW5jZW9mYCBjaGVja1xuLy8gYnV0IHRoZXkgc2hvdWxkIGJlIHRyZWF0ZWQgYXMgdmFsaWQuIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvaXNzdWVzLzE2NlxuZnVuY3Rpb24gaXNBcnJheUJ1ZmZlciAob2JqKSB7XG4gIHJldHVybiBvYmogaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciB8fFxuICAgIChvYmogIT0gbnVsbCAmJiBvYmouY29uc3RydWN0b3IgIT0gbnVsbCAmJiBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gJ0FycmF5QnVmZmVyJyAmJlxuICAgICAgdHlwZW9mIG9iai5ieXRlTGVuZ3RoID09PSAnbnVtYmVyJylcbn1cblxuZnVuY3Rpb24gbnVtYmVySXNOYU4gKG9iaikge1xuICByZXR1cm4gb2JqICE9PSBvYmogLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1zZWxmLWNvbXBhcmVcbn1cbiIsImNvbnN0IGVzY2FwZVN0cmluZ1JlZ2V4cCA9IHJlcXVpcmUoJ2VzY2FwZS1zdHJpbmctcmVnZXhwJyk7XG5jb25zdCBhbnNpU3R5bGVzID0gcmVxdWlyZSgnYW5zaS1zdHlsZXMnKTtcbmxldCBzdGRvdXRDb2xvciA9IHJlcXVpcmUoJ3N1cHBvcnRzLWNvbG9yJykuc3Rkb3V0O1xuXG4vLyBkZXRlcm1pbmUgaWYgd2UncmUgaW4gYSBicm93c2VyXG5jb25zdCBpc0Jyb3dzZXIgPVxuICB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2Ygd2luZG93LmRvY3VtZW50ICE9PSAndW5kZWZpbmVkJztcblxuLy8gaWYgd2UncmUgaW4gYSBicm93c2VyIHRoZW4gd2UgRE8gc3VwcG9ydCBjb2xvcnNcbi8vIGJ1dCB3ZSBuZWVkIHRvIG1ha2UgaXQgYXdhcmUgdG8gdXNlcnMgdGhhdCB0aGV5IG5lZWQgdG9cbi8vIHVzZSBhbnNpY29sb3IgPGh0dHBzOi8vZ2l0aHViLmNvbS94cGwvYW5zaWNvbG9yPlxuaWYgKGlzQnJvd3NlcilcbiAgc3Rkb3V0Q29sb3IgPSB7XG4gICAgbGV2ZWw6IDMsXG4gICAgaGFzQmFzaWM6IHRydWUsXG4gICAgaGFzMjU2OiB0cnVlLFxuICAgIGhhczE2bTogdHJ1ZVxuICB9O1xuXG5jb25zdCB0ZW1wbGF0ZSA9IHJlcXVpcmUoJy4vdGVtcGxhdGVzLmpzJyk7XG5cbmNvbnN0IGlzU2ltcGxlV2luZG93c1Rlcm0gPVxuICBwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInICYmXG4gICEocHJvY2Vzcy5lbnYuVEVSTSB8fCAnJykudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKCd4dGVybScpO1xuXG4vLyBgc3VwcG9ydHNDb2xvci5sZXZlbGAg4oaSIGBhbnNpU3R5bGVzLmNvbG9yW25hbWVdYCBtYXBwaW5nXG5jb25zdCBsZXZlbE1hcHBpbmcgPSBbJ2Fuc2knLCAnYW5zaScsICdhbnNpMjU2JywgJ2Fuc2kxNm0nXTtcblxuLy8gYGNvbG9yLWNvbnZlcnRgIG1vZGVscyB0byBleGNsdWRlIGZyb20gdGhlIENoYWxrIEFQSSBkdWUgdG8gY29uZmxpY3RzXG5jb25zdCBza2lwTW9kZWxzID0gbmV3IFNldChbJ2dyYXknXSk7XG5cbmNvbnN0IHN0eWxlcyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbmZ1bmN0aW9uIGFwcGx5T3B0aW9ucyhvYmosIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgLy8gRGV0ZWN0IGxldmVsIGlmIG5vdCBzZXQgbWFudWFsbHlcbiAgY29uc3Qgc2NMZXZlbCA9IHN0ZG91dENvbG9yID8gc3Rkb3V0Q29sb3IubGV2ZWwgOiAwO1xuICBvYmoubGV2ZWwgPSBvcHRpb25zLmxldmVsID09PSB1bmRlZmluZWQgPyBzY0xldmVsIDogb3B0aW9ucy5sZXZlbDtcbiAgb2JqLmVuYWJsZWQgPSAnZW5hYmxlZCcgaW4gb3B0aW9ucyA/IG9wdGlvbnMuZW5hYmxlZCA6IG9iai5sZXZlbCA+IDA7XG59XG5cbmZ1bmN0aW9uIENoYWxrKG9wdGlvbnMpIHtcbiAgLy8gV2UgY2hlY2sgZm9yIHRoaXMudGVtcGxhdGUgaGVyZSBzaW5jZSBjYWxsaW5nIGBjaGFsay5jb25zdHJ1Y3RvcigpYFxuICAvLyBieSBpdHNlbGYgd2lsbCBoYXZlIGEgYHRoaXNgIG9mIGEgcHJldmlvdXNseSBjb25zdHJ1Y3RlZCBjaGFsayBvYmplY3RcbiAgaWYgKCF0aGlzIHx8ICEodGhpcyBpbnN0YW5jZW9mIENoYWxrKSB8fCB0aGlzLnRlbXBsYXRlKSB7XG4gICAgY29uc3QgY2hhbGsgPSB7fTtcbiAgICBhcHBseU9wdGlvbnMoY2hhbGssIG9wdGlvbnMpO1xuXG4gICAgY2hhbGsudGVtcGxhdGUgPSBmdW5jdGlvbiguLi5hcmdzKSB7XG4gICAgICByZXR1cm4gY2hhbGtUYWcoLi4uW2NoYWxrLnRlbXBsYXRlXS5jb25jYXQoYXJncykpO1xuICAgIH07XG5cbiAgICBPYmplY3Quc2V0UHJvdG90eXBlT2YoY2hhbGssIENoYWxrLnByb3RvdHlwZSk7XG4gICAgT2JqZWN0LnNldFByb3RvdHlwZU9mKGNoYWxrLnRlbXBsYXRlLCBjaGFsayk7XG5cbiAgICBjaGFsay50ZW1wbGF0ZS5jb25zdHJ1Y3RvciA9IENoYWxrO1xuXG4gICAgcmV0dXJuIGNoYWxrLnRlbXBsYXRlO1xuICB9XG5cbiAgYXBwbHlPcHRpb25zKHRoaXMsIG9wdGlvbnMpO1xufVxuXG4vLyBVc2UgYnJpZ2h0IGJsdWUgb24gV2luZG93cyBhcyB0aGUgbm9ybWFsIGJsdWUgY29sb3IgaXMgaWxsZWdpYmxlXG5pZiAoaXNTaW1wbGVXaW5kb3dzVGVybSkge1xuICBhbnNpU3R5bGVzLmJsdWUub3BlbiA9ICdcXHUwMDFCWzk0bSc7XG59XG5cbmZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGFuc2lTdHlsZXMpKSB7XG4gIGFuc2lTdHlsZXNba2V5XS5jbG9zZVJlID0gbmV3IFJlZ0V4cChcbiAgICBlc2NhcGVTdHJpbmdSZWdleHAoYW5zaVN0eWxlc1trZXldLmNsb3NlKSxcbiAgICAnZydcbiAgKTtcblxuICBzdHlsZXNba2V5XSA9IHtcbiAgICBnZXQoKSB7XG4gICAgICBjb25zdCBjb2RlcyA9IGFuc2lTdHlsZXNba2V5XTtcbiAgICAgIHJldHVybiBidWlsZC5jYWxsKFxuICAgICAgICB0aGlzLFxuICAgICAgICB0aGlzLl9zdHlsZXMgPyB0aGlzLl9zdHlsZXMuY29uY2F0KGNvZGVzKSA6IFtjb2Rlc10sXG4gICAgICAgIHRoaXMuX2VtcHR5LFxuICAgICAgICBrZXlcbiAgICAgICk7XG4gICAgfVxuICB9O1xufVxuXG5zdHlsZXMudmlzaWJsZSA9IHtcbiAgZ2V0KCkge1xuICAgIHJldHVybiBidWlsZC5jYWxsKHRoaXMsIHRoaXMuX3N0eWxlcyB8fCBbXSwgdHJ1ZSwgJ3Zpc2libGUnKTtcbiAgfVxufTtcblxuYW5zaVN0eWxlcy5jb2xvci5jbG9zZVJlID0gbmV3IFJlZ0V4cChcbiAgZXNjYXBlU3RyaW5nUmVnZXhwKGFuc2lTdHlsZXMuY29sb3IuY2xvc2UpLFxuICAnZydcbik7XG5mb3IgKGNvbnN0IG1vZGVsIG9mIE9iamVjdC5rZXlzKGFuc2lTdHlsZXMuY29sb3IuYW5zaSkpIHtcbiAgaWYgKHNraXBNb2RlbHMuaGFzKG1vZGVsKSkge1xuICAgIGNvbnRpbnVlO1xuICB9XG5cbiAgc3R5bGVzW21vZGVsXSA9IHtcbiAgICBnZXQoKSB7XG4gICAgICBjb25zdCB7IGxldmVsIH0gPSB0aGlzO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKC4uLmFyZ3MpIHtcbiAgICAgICAgY29uc3Qgb3BlbiA9IGFuc2lTdHlsZXMuY29sb3JbbGV2ZWxNYXBwaW5nW2xldmVsXV1bbW9kZWxdLmFwcGx5KFxuICAgICAgICAgIG51bGwsXG4gICAgICAgICAgYXJnc1xuICAgICAgICApO1xuICAgICAgICBjb25zdCBjb2RlcyA9IHtcbiAgICAgICAgICBvcGVuLFxuICAgICAgICAgIGNsb3NlOiBhbnNpU3R5bGVzLmNvbG9yLmNsb3NlLFxuICAgICAgICAgIGNsb3NlUmU6IGFuc2lTdHlsZXMuY29sb3IuY2xvc2VSZVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gYnVpbGQuY2FsbChcbiAgICAgICAgICB0aGlzLFxuICAgICAgICAgIHRoaXMuX3N0eWxlcyA/IHRoaXMuX3N0eWxlcy5jb25jYXQoY29kZXMpIDogW2NvZGVzXSxcbiAgICAgICAgICB0aGlzLl9lbXB0eSxcbiAgICAgICAgICBtb2RlbFxuICAgICAgICApO1xuICAgICAgfTtcbiAgICB9XG4gIH07XG59XG5cbmFuc2lTdHlsZXMuYmdDb2xvci5jbG9zZVJlID0gbmV3IFJlZ0V4cChcbiAgZXNjYXBlU3RyaW5nUmVnZXhwKGFuc2lTdHlsZXMuYmdDb2xvci5jbG9zZSksXG4gICdnJ1xuKTtcbmZvciAoY29uc3QgbW9kZWwgb2YgT2JqZWN0LmtleXMoYW5zaVN0eWxlcy5iZ0NvbG9yLmFuc2kpKSB7XG4gIGlmIChza2lwTW9kZWxzLmhhcyhtb2RlbCkpIHtcbiAgICBjb250aW51ZTtcbiAgfVxuXG4gIGNvbnN0IGJnTW9kZWwgPSAnYmcnICsgbW9kZWxbMF0udG9VcHBlckNhc2UoKSArIG1vZGVsLnNsaWNlKDEpO1xuICBzdHlsZXNbYmdNb2RlbF0gPSB7XG4gICAgZ2V0KCkge1xuICAgICAgY29uc3QgeyBsZXZlbCB9ID0gdGhpcztcbiAgICAgIHJldHVybiBmdW5jdGlvbiguLi5hcmdzKSB7XG4gICAgICAgIGNvbnN0IG9wZW4gPSBhbnNpU3R5bGVzLmJnQ29sb3JbbGV2ZWxNYXBwaW5nW2xldmVsXV1bbW9kZWxdLmFwcGx5KFxuICAgICAgICAgIG51bGwsXG4gICAgICAgICAgYXJnc1xuICAgICAgICApO1xuICAgICAgICBjb25zdCBjb2RlcyA9IHtcbiAgICAgICAgICBvcGVuLFxuICAgICAgICAgIGNsb3NlOiBhbnNpU3R5bGVzLmJnQ29sb3IuY2xvc2UsXG4gICAgICAgICAgY2xvc2VSZTogYW5zaVN0eWxlcy5iZ0NvbG9yLmNsb3NlUmVcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGJ1aWxkLmNhbGwoXG4gICAgICAgICAgdGhpcyxcbiAgICAgICAgICB0aGlzLl9zdHlsZXMgPyB0aGlzLl9zdHlsZXMuY29uY2F0KGNvZGVzKSA6IFtjb2Rlc10sXG4gICAgICAgICAgdGhpcy5fZW1wdHksXG4gICAgICAgICAgbW9kZWxcbiAgICAgICAgKTtcbiAgICAgIH07XG4gICAgfVxuICB9O1xufVxuXG5jb25zdCBwcm90byA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKCgpID0+IHt9LCBzdHlsZXMpO1xuXG5mdW5jdGlvbiBidWlsZChfc3R5bGVzLCBfZW1wdHksIGtleSkge1xuICBjb25zdCBidWlsZGVyID0gZnVuY3Rpb24oLi4uYXJncykge1xuICAgIHJldHVybiBhcHBseVN0eWxlLmFwcGx5KGJ1aWxkZXIsIGFyZ3MpO1xuICB9O1xuXG4gIGJ1aWxkZXIuX3N0eWxlcyA9IF9zdHlsZXM7XG4gIGJ1aWxkZXIuX2VtcHR5ID0gX2VtcHR5O1xuXG4gIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShidWlsZGVyLCAnbGV2ZWwnLCB7XG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBnZXQoKSB7XG4gICAgICByZXR1cm4gc2VsZi5sZXZlbDtcbiAgICB9LFxuICAgIHNldChsZXZlbCkge1xuICAgICAgc2VsZi5sZXZlbCA9IGxldmVsO1xuICAgIH1cbiAgfSk7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGJ1aWxkZXIsICdlbmFibGVkJywge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgZ2V0KCkge1xuICAgICAgcmV0dXJuIHNlbGYuZW5hYmxlZDtcbiAgICB9LFxuICAgIHNldChlbmFibGVkKSB7XG4gICAgICBzZWxmLmVuYWJsZWQgPSBlbmFibGVkO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gU2VlIGJlbG93IGZvciBmaXggcmVnYXJkaW5nIGludmlzaWJsZSBncmV5L2RpbSBjb21iaW5hdGlvbiBvbiBXaW5kb3dzXG4gIGJ1aWxkZXIuaGFzR3JleSA9IHRoaXMuaGFzR3JleSB8fCBrZXkgPT09ICdncmF5JyB8fCBrZXkgPT09ICdncmV5JztcblxuICAvLyBgX19wcm90b19fYCBpcyB1c2VkIGJlY2F1c2Ugd2UgbXVzdCByZXR1cm4gYSBmdW5jdGlvbiwgYnV0IHRoZXJlIGlzXG4gIC8vIG5vIHdheSB0byBjcmVhdGUgYSBmdW5jdGlvbiB3aXRoIGEgZGlmZmVyZW50IHByb3RvdHlwZVxuICBidWlsZGVyLl9fcHJvdG9fXyA9IHByb3RvOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXByb3RvXG5cbiAgcmV0dXJuIGJ1aWxkZXI7XG59XG5cbmZ1bmN0aW9uIGFwcGx5U3R5bGUoLi4uYXJncykge1xuICAvLyBTdXBwb3J0IHZhcmFncywgYnV0IHNpbXBseSBjYXN0IHRvIHN0cmluZyBpbiBjYXNlIHRoZXJlJ3Mgb25seSBvbmUgYXJnXG4gIGNvbnN0IGFyZ3NMZW4gPSBhcmdzLmxlbmd0aDtcbiAgbGV0IHN0ciA9IFN0cmluZyhhcmdzWzBdKTtcblxuICBpZiAoYXJnc0xlbiA9PT0gMCkge1xuICAgIHJldHVybiAnJztcbiAgfVxuXG4gIGlmIChhcmdzTGVuID4gMSkge1xuICAgIC8vIERvbid0IHNsaWNlIGBhcmd1bWVudHNgLCBpdCBwcmV2ZW50cyBWOCBvcHRpbWl6YXRpb25zXG4gICAgZm9yIChsZXQgYSA9IDE7IGEgPCBhcmdzTGVuOyBhKyspIHtcbiAgICAgIHN0ciArPSAnICcgKyBhcmdzW2FdO1xuICAgIH1cbiAgfVxuXG4gIGlmICghdGhpcy5lbmFibGVkIHx8IHRoaXMubGV2ZWwgPD0gMCB8fCAhc3RyKSB7XG4gICAgcmV0dXJuIHRoaXMuX2VtcHR5ID8gJycgOiBzdHI7XG4gIH1cblxuICAvLyBUdXJucyBvdXQgdGhhdCBvbiBXaW5kb3dzIGRpbW1lZCBncmF5IHRleHQgYmVjb21lcyBpbnZpc2libGUgaW4gY21kLmV4ZSxcbiAgLy8gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9jaGFsay9jaGFsay9pc3N1ZXMvNThcbiAgLy8gSWYgd2UncmUgb24gV2luZG93cyBhbmQgd2UncmUgZGVhbGluZ1xuICAvLyB3aXRoIGEgZ3JheSBjb2xvciwgdGVtcG9yYXJpbHkgbWFrZSAnZGltJyBhIG5vb3AuXG4gIGNvbnN0IG9yaWdpbmFsRGltID0gYW5zaVN0eWxlcy5kaW0ub3BlbjtcbiAgaWYgKGlzU2ltcGxlV2luZG93c1Rlcm0gJiYgdGhpcy5oYXNHcmV5KSB7XG4gICAgYW5zaVN0eWxlcy5kaW0ub3BlbiA9ICcnO1xuICB9XG5cbiAgZm9yIChjb25zdCBjb2RlIG9mIHRoaXMuX3N0eWxlcy5zbGljZSgpLnJldmVyc2UoKSkge1xuICAgIC8vIFJlcGxhY2UgYW55IGluc3RhbmNlcyBhbHJlYWR5IHByZXNlbnQgd2l0aCBhIHJlLW9wZW5pbmcgY29kZVxuICAgIC8vIG90aGVyd2lzZSBvbmx5IHRoZSBwYXJ0IG9mIHRoZSBzdHJpbmcgdW50aWwgc2FpZCBjbG9zaW5nIGNvZGVcbiAgICAvLyB3aWxsIGJlIGNvbG9yZWQsIGFuZCB0aGUgcmVzdCB3aWxsIHNpbXBseSBiZSAncGxhaW4nLlxuICAgIHN0ciA9IGNvZGUub3BlbiArIHN0ci5yZXBsYWNlKGNvZGUuY2xvc2VSZSwgY29kZS5vcGVuKSArIGNvZGUuY2xvc2U7XG5cbiAgICAvLyBDbG9zZSB0aGUgc3R5bGluZyBiZWZvcmUgYSBsaW5lYnJlYWsgYW5kIHJlb3BlblxuICAgIC8vIGFmdGVyIG5leHQgbGluZSB0byBmaXggYSBibGVlZCBpc3N1ZSBvbiBtYWNPU1xuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9jaGFsay9jaGFsay9wdWxsLzkyXG4gICAgc3RyID0gc3RyLnJlcGxhY2UoL1xccj9cXG4vZywgYCR7Y29kZS5jbG9zZX0kJiR7Y29kZS5vcGVufWApO1xuICB9XG5cbiAgLy8gUmVzZXQgdGhlIG9yaWdpbmFsIGBkaW1gIGlmIHdlIGNoYW5nZWQgaXQgdG9cbiAgLy8gd29yayBhcm91bmQgdGhlIFdpbmRvd3MgZGltbWVkIGdyYXkgaXNzdWVcbiAgYW5zaVN0eWxlcy5kaW0ub3BlbiA9IG9yaWdpbmFsRGltO1xuXG4gIHJldHVybiBzdHI7XG59XG5cbmZ1bmN0aW9uIGNoYWxrVGFnKGNoYWxrLCBzdHJpbmdzKSB7XG4gIGlmICghQXJyYXkuaXNBcnJheShzdHJpbmdzKSkge1xuICAgIC8vIElmIGNoYWxrKCkgd2FzIGNhbGxlZCBieSBpdHNlbGYgb3Igd2l0aCBhIHN0cmluZyxcbiAgICAvLyByZXR1cm4gdGhlIHN0cmluZyBpdHNlbGYgYXMgYSBzdHJpbmcuXG4gICAgLy9cbiAgICAvLyBUT0RPOiBmaXggcmVzdCBwYXJhbXMgbGF0ZXJcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcHJlZmVyLXJlc3QtcGFyYW1zXG4gICAgcmV0dXJuIFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKS5qb2luKCcgJyk7XG4gIH1cblxuICAvLyBUT0RPOiBmaXggcmVzdCBwYXJhbXMgbGF0ZXJcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHByZWZlci1yZXN0LXBhcmFtc1xuICBjb25zdCBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICBjb25zdCBwYXJ0cyA9IFtzdHJpbmdzLnJhd1swXV07XG5cbiAgZm9yIChsZXQgaSA9IDE7IGkgPCBzdHJpbmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgcGFydHMucHVzaChTdHJpbmcoYXJnc1tpIC0gMV0pLnJlcGxhY2UoL1t7fVxcXFxdL2csICdcXFxcJCYnKSk7XG4gICAgcGFydHMucHVzaChTdHJpbmcoc3RyaW5ncy5yYXdbaV0pKTtcbiAgfVxuXG4gIHJldHVybiB0ZW1wbGF0ZShjaGFsaywgcGFydHMuam9pbignJykpO1xufVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydGllcyhDaGFsay5wcm90b3R5cGUsIHN0eWxlcyk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ2hhbGsoKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuZXctY2FwXG5tb2R1bGUuZXhwb3J0cy5zdXBwb3J0c0NvbG9yID0gc3Rkb3V0Q29sb3I7XG5tb2R1bGUuZXhwb3J0cy5kZWZhdWx0ID0gbW9kdWxlLmV4cG9ydHM7IC8vIEZvciBUeXBlU2NyaXB0XG4iLCIvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbWF4LWxlblxuY29uc3QgVEVNUExBVEVfUkVHRVggPSAvKD86XFxcXCh1W2EtZlxcZF17NH18eFthLWZcXGRdezJ9fC4pKXwoPzpcXHsofik/KFxcdysoPzpcXChbXildKlxcKSk/KD86XFwuXFx3Kyg/OlxcKFteKV0qXFwpKT8pKikoPzpbIFxcdF18KD89XFxyP1xcbikpKXwoXFx9KXwoKD86LnxbXFxyXFxuXFxmXSkrPykvZ2k7XG5jb25zdCBTVFlMRV9SRUdFWCA9IC8oPzpefFxcLikoXFx3KykoPzpcXCgoW14pXSopXFwpKT8vZztcbmNvbnN0IFNUUklOR19SRUdFWCA9IC9eKFsnXCJdKSgoPzpcXFxcLnwoPyFcXDEpW15cXFxcXSkqKVxcMSQvO1xuY29uc3QgRVNDQVBFX1JFR0VYID0gL1xcXFwodVthLWZcXGRdezR9fHhbYS1mXFxkXXsyfXwuKXwoW15cXFxcXSkvZ2k7XG5cbmNvbnN0IEVTQ0FQRVMgPSBuZXcgTWFwKFtcbiAgWyduJywgJ1xcbiddLFxuICBbJ3InLCAnXFxyJ10sXG4gIFsndCcsICdcXHQnXSxcbiAgWydiJywgJ1xcYiddLFxuICBbJ2YnLCAnXFxmJ10sXG4gIFsndicsICdcXHYnXSxcbiAgWycwJywgJ1xcMCddLFxuICBbJ1xcXFwnLCAnXFxcXCddLFxuICBbJ2UnLCAnXFx1MDAxQiddLFxuICBbJ2EnLCAnXFx1MDAwNyddXG5dKTtcblxuZnVuY3Rpb24gdW5lc2NhcGUoYykge1xuICBpZiAoKGNbMF0gPT09ICd1JyAmJiBjLmxlbmd0aCA9PT0gNSkgfHwgKGNbMF0gPT09ICd4JyAmJiBjLmxlbmd0aCA9PT0gMykpIHtcbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZShwYXJzZUludChjLnNsaWNlKDEpLCAxNikpO1xuICB9XG5cbiAgcmV0dXJuIEVTQ0FQRVMuZ2V0KGMpIHx8IGM7XG59XG5cbmZ1bmN0aW9uIHBhcnNlQXJndW1lbnRzKG5hbWUsIGFyZ3MpIHtcbiAgY29uc3QgcmVzdWx0cyA9IFtdO1xuICBjb25zdCBjaHVua3MgPSBhcmdzLnRyaW0oKS5zcGxpdCgvXFxzKixcXHMqL2cpO1xuICBsZXQgbWF0Y2hlcztcblxuICBmb3IgKGNvbnN0IGNodW5rIG9mIGNodW5rcykge1xuICAgIGlmICghaXNOYU4oY2h1bmspKSB7XG4gICAgICByZXN1bHRzLnB1c2goTnVtYmVyKGNodW5rKSk7XG4gICAgfSBlbHNlIGlmICgobWF0Y2hlcyA9IGNodW5rLm1hdGNoKFNUUklOR19SRUdFWCkpKSB7XG4gICAgICByZXN1bHRzLnB1c2goXG4gICAgICAgIG1hdGNoZXNbMl0ucmVwbGFjZShcbiAgICAgICAgICBFU0NBUEVfUkVHRVgsXG4gICAgICAgICAgKG0sIGVzY2FwZSwgY2hyKSA9PiAoZXNjYXBlID8gdW5lc2NhcGUoZXNjYXBlKSA6IGNocilcbiAgICAgICAgKVxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgSW52YWxpZCBDaGFsayB0ZW1wbGF0ZSBzdHlsZSBhcmd1bWVudDogJHtjaHVua30gKGluIHN0eWxlICcke25hbWV9JylgXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXN1bHRzO1xufVxuXG5mdW5jdGlvbiBwYXJzZVN0eWxlKHN0eWxlKSB7XG4gIFNUWUxFX1JFR0VYLmxhc3RJbmRleCA9IDA7XG5cbiAgY29uc3QgcmVzdWx0cyA9IFtdO1xuICBsZXQgbWF0Y2hlcztcblxuICB3aGlsZSAoKG1hdGNoZXMgPSBTVFlMRV9SRUdFWC5leGVjKHN0eWxlKSkgIT09IG51bGwpIHtcbiAgICBjb25zdCBuYW1lID0gbWF0Y2hlc1sxXTtcblxuICAgIGlmIChtYXRjaGVzWzJdKSB7XG4gICAgICBjb25zdCBhcmdzID0gcGFyc2VBcmd1bWVudHMobmFtZSwgbWF0Y2hlc1syXSk7XG4gICAgICByZXN1bHRzLnB1c2goW25hbWVdLmNvbmNhdChhcmdzKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdHMucHVzaChbbmFtZV0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXN1bHRzO1xufVxuXG5mdW5jdGlvbiBidWlsZFN0eWxlKGNoYWxrLCBzdHlsZXMpIHtcbiAgY29uc3QgZW5hYmxlZCA9IHt9O1xuXG4gIGZvciAoY29uc3QgbGF5ZXIgb2Ygc3R5bGVzKSB7XG4gICAgZm9yIChjb25zdCBzdHlsZSBvZiBsYXllci5zdHlsZXMpIHtcbiAgICAgIGVuYWJsZWRbc3R5bGVbMF1dID0gbGF5ZXIuaW52ZXJzZSA/IG51bGwgOiBzdHlsZS5zbGljZSgxKTtcbiAgICB9XG4gIH1cblxuICBsZXQgY3VycmVudCA9IGNoYWxrO1xuICBmb3IgKGNvbnN0IHN0eWxlTmFtZSBvZiBPYmplY3Qua2V5cyhlbmFibGVkKSkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGVuYWJsZWRbc3R5bGVOYW1lXSkpIHtcbiAgICAgIGlmICghKHN0eWxlTmFtZSBpbiBjdXJyZW50KSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gQ2hhbGsgc3R5bGU6ICR7c3R5bGVOYW1lfWApO1xuICAgICAgfVxuXG4gICAgICBpZiAoZW5hYmxlZFtzdHlsZU5hbWVdLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY3VycmVudCA9IGN1cnJlbnRbc3R5bGVOYW1lXSguLi5lbmFibGVkW3N0eWxlTmFtZV0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY3VycmVudCA9IGN1cnJlbnRbc3R5bGVOYW1lXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gY3VycmVudDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoY2hhbGssIHRtcCkgPT4ge1xuICBjb25zdCBzdHlsZXMgPSBbXTtcbiAgY29uc3QgY2h1bmtzID0gW107XG4gIGxldCBjaHVuayA9IFtdO1xuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBtYXgtcGFyYW1zXG4gIHRtcC5yZXBsYWNlKFRFTVBMQVRFX1JFR0VYLCAobSwgZXNjYXBlQ2hhciwgaW52ZXJzZSwgc3R5bGUsIGNsb3NlLCBjaHIpID0+IHtcbiAgICBpZiAoZXNjYXBlQ2hhcikge1xuICAgICAgY2h1bmsucHVzaCh1bmVzY2FwZShlc2NhcGVDaGFyKSk7XG4gICAgfSBlbHNlIGlmIChzdHlsZSkge1xuICAgICAgY29uc3Qgc3RyID0gY2h1bmsuam9pbignJyk7XG4gICAgICBjaHVuayA9IFtdO1xuICAgICAgY2h1bmtzLnB1c2goc3R5bGVzLmxlbmd0aCA9PT0gMCA/IHN0ciA6IGJ1aWxkU3R5bGUoY2hhbGssIHN0eWxlcykoc3RyKSk7XG4gICAgICBzdHlsZXMucHVzaCh7IGludmVyc2UsIHN0eWxlczogcGFyc2VTdHlsZShzdHlsZSkgfSk7XG4gICAgfSBlbHNlIGlmIChjbG9zZSkge1xuICAgICAgaWYgKHN0eWxlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGb3VuZCBleHRyYW5lb3VzIH0gaW4gQ2hhbGsgdGVtcGxhdGUgbGl0ZXJhbCcpO1xuICAgICAgfVxuXG4gICAgICBjaHVua3MucHVzaChidWlsZFN0eWxlKGNoYWxrLCBzdHlsZXMpKGNodW5rLmpvaW4oJycpKSk7XG4gICAgICBjaHVuayA9IFtdO1xuICAgICAgc3R5bGVzLnBvcCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjaHVuay5wdXNoKGNocik7XG4gICAgfVxuICB9KTtcblxuICBjaHVua3MucHVzaChjaHVuay5qb2luKCcnKSk7XG5cbiAgaWYgKHN0eWxlcy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgZXJyTXNnID0gYENoYWxrIHRlbXBsYXRlIGxpdGVyYWwgaXMgbWlzc2luZyAke1xuICAgICAgc3R5bGVzLmxlbmd0aFxuICAgIH0gY2xvc2luZyBicmFja2V0JHtzdHlsZXMubGVuZ3RoID09PSAxID8gJycgOiAncyd9IChcXGB9XFxgKWA7XG4gICAgdGhyb3cgbmV3IEVycm9yKGVyck1zZyk7XG4gIH1cblxuICByZXR1cm4gY2h1bmtzLmpvaW4oJycpO1xufTtcbiIsImNvbnN0IGNvbG9yQ29udmVydCA9IHJlcXVpcmUoJ2NvbG9yLWNvbnZlcnQnKTtcblxuY29uc3Qgd3JhcEFuc2kxNiA9IChmbiwgb2Zmc2V0KSA9PlxuICBmdW5jdGlvbiguLi5hcmdzKSB7XG4gICAgY29uc3QgY29kZSA9IGZuLmFwcGx5KGNvbG9yQ29udmVydCwgYXJncyk7XG4gICAgcmV0dXJuIGBcXHUwMDFCWyR7Y29kZSArIG9mZnNldH1tYDtcbiAgfTtcblxuY29uc3Qgd3JhcEFuc2kyNTYgPSAoZm4sIG9mZnNldCkgPT5cbiAgZnVuY3Rpb24oLi4uYXJncykge1xuICAgIGNvbnN0IGNvZGUgPSBmbi5hcHBseShjb2xvckNvbnZlcnQsIGFyZ3MpO1xuICAgIHJldHVybiBgXFx1MDAxQlskezM4ICsgb2Zmc2V0fTs1OyR7Y29kZX1tYDtcbiAgfTtcblxuY29uc3Qgd3JhcEFuc2kxNm0gPSAoZm4sIG9mZnNldCkgPT5cbiAgZnVuY3Rpb24oLi4uYXJncykge1xuICAgIGNvbnN0IHJnYiA9IGZuLmFwcGx5KGNvbG9yQ29udmVydCwgYXJncyk7XG4gICAgcmV0dXJuIGBcXHUwMDFCWyR7MzggKyBvZmZzZXR9OzI7JHtyZ2JbMF19OyR7cmdiWzFdfTske3JnYlsyXX1tYDtcbiAgfTtcblxuZnVuY3Rpb24gYXNzZW1ibGVTdHlsZXMoKSB7XG4gIGNvbnN0IGNvZGVzID0gbmV3IE1hcCgpO1xuICBjb25zdCBzdHlsZXMgPSB7XG4gICAgbW9kaWZpZXI6IHtcbiAgICAgIHJlc2V0OiBbMCwgMF0sXG4gICAgICAvLyAyMSBpc24ndCB3aWRlbHkgc3VwcG9ydGVkIGFuZCAyMiBkb2VzIHRoZSBzYW1lIHRoaW5nXG4gICAgICBib2xkOiBbMSwgMjJdLFxuICAgICAgZGltOiBbMiwgMjJdLFxuICAgICAgaXRhbGljOiBbMywgMjNdLFxuICAgICAgdW5kZXJsaW5lOiBbNCwgMjRdLFxuICAgICAgaW52ZXJzZTogWzcsIDI3XSxcbiAgICAgIGhpZGRlbjogWzgsIDI4XSxcbiAgICAgIHN0cmlrZXRocm91Z2g6IFs5LCAyOV1cbiAgICB9LFxuICAgIGNvbG9yOiB7XG4gICAgICBibGFjazogWzMwLCAzOV0sXG4gICAgICByZWQ6IFszMSwgMzldLFxuICAgICAgZ3JlZW46IFszMiwgMzldLFxuICAgICAgeWVsbG93OiBbMzMsIDM5XSxcbiAgICAgIGJsdWU6IFszNCwgMzldLFxuICAgICAgbWFnZW50YTogWzM1LCAzOV0sXG4gICAgICBjeWFuOiBbMzYsIDM5XSxcbiAgICAgIHdoaXRlOiBbMzcsIDM5XSxcbiAgICAgIGdyYXk6IFs5MCwgMzldLFxuXG4gICAgICAvLyBCcmlnaHQgY29sb3JcbiAgICAgIHJlZEJyaWdodDogWzkxLCAzOV0sXG4gICAgICBncmVlbkJyaWdodDogWzkyLCAzOV0sXG4gICAgICB5ZWxsb3dCcmlnaHQ6IFs5MywgMzldLFxuICAgICAgYmx1ZUJyaWdodDogWzk0LCAzOV0sXG4gICAgICBtYWdlbnRhQnJpZ2h0OiBbOTUsIDM5XSxcbiAgICAgIGN5YW5CcmlnaHQ6IFs5NiwgMzldLFxuICAgICAgd2hpdGVCcmlnaHQ6IFs5NywgMzldXG4gICAgfSxcbiAgICBiZ0NvbG9yOiB7XG4gICAgICBiZ0JsYWNrOiBbNDAsIDQ5XSxcbiAgICAgIGJnUmVkOiBbNDEsIDQ5XSxcbiAgICAgIGJnR3JlZW46IFs0MiwgNDldLFxuICAgICAgYmdZZWxsb3c6IFs0MywgNDldLFxuICAgICAgYmdCbHVlOiBbNDQsIDQ5XSxcbiAgICAgIGJnTWFnZW50YTogWzQ1LCA0OV0sXG4gICAgICBiZ0N5YW46IFs0NiwgNDldLFxuICAgICAgYmdXaGl0ZTogWzQ3LCA0OV0sXG5cbiAgICAgIC8vIEJyaWdodCBjb2xvclxuICAgICAgYmdCbGFja0JyaWdodDogWzEwMCwgNDldLFxuICAgICAgYmdSZWRCcmlnaHQ6IFsxMDEsIDQ5XSxcbiAgICAgIGJnR3JlZW5CcmlnaHQ6IFsxMDIsIDQ5XSxcbiAgICAgIGJnWWVsbG93QnJpZ2h0OiBbMTAzLCA0OV0sXG4gICAgICBiZ0JsdWVCcmlnaHQ6IFsxMDQsIDQ5XSxcbiAgICAgIGJnTWFnZW50YUJyaWdodDogWzEwNSwgNDldLFxuICAgICAgYmdDeWFuQnJpZ2h0OiBbMTA2LCA0OV0sXG4gICAgICBiZ1doaXRlQnJpZ2h0OiBbMTA3LCA0OV1cbiAgICB9XG4gIH07XG5cbiAgLy8gRml4IGh1bWFuc1xuICBzdHlsZXMuY29sb3IuZ3JleSA9IHN0eWxlcy5jb2xvci5ncmF5O1xuXG4gIGZvciAoY29uc3QgZ3JvdXBOYW1lIG9mIE9iamVjdC5rZXlzKHN0eWxlcykpIHtcbiAgICBjb25zdCBncm91cCA9IHN0eWxlc1tncm91cE5hbWVdO1xuXG4gICAgZm9yIChjb25zdCBzdHlsZU5hbWUgb2YgT2JqZWN0LmtleXMoZ3JvdXApKSB7XG4gICAgICBjb25zdCBzdHlsZSA9IGdyb3VwW3N0eWxlTmFtZV07XG5cbiAgICAgIHN0eWxlc1tzdHlsZU5hbWVdID0ge1xuICAgICAgICBvcGVuOiBgXFx1MDAxQlske3N0eWxlWzBdfW1gLFxuICAgICAgICBjbG9zZTogYFxcdTAwMUJbJHtzdHlsZVsxXX1tYFxuICAgICAgfTtcblxuICAgICAgZ3JvdXBbc3R5bGVOYW1lXSA9IHN0eWxlc1tzdHlsZU5hbWVdO1xuXG4gICAgICBjb2Rlcy5zZXQoc3R5bGVbMF0sIHN0eWxlWzFdKTtcbiAgICB9XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoc3R5bGVzLCBncm91cE5hbWUsIHtcbiAgICAgIHZhbHVlOiBncm91cCxcbiAgICAgIGVudW1lcmFibGU6IGZhbHNlXG4gICAgfSk7XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoc3R5bGVzLCAnY29kZXMnLCB7XG4gICAgICB2YWx1ZTogY29kZXMsXG4gICAgICBlbnVtZXJhYmxlOiBmYWxzZVxuICAgIH0pO1xuICB9XG5cbiAgY29uc3QgYW5zaTJhbnNpID0gbiA9PiBuO1xuICBjb25zdCByZ2IycmdiID0gKHIsIGcsIGIpID0+IFtyLCBnLCBiXTtcblxuICBzdHlsZXMuY29sb3IuY2xvc2UgPSAnXFx1MDAxQlszOW0nO1xuICBzdHlsZXMuYmdDb2xvci5jbG9zZSA9ICdcXHUwMDFCWzQ5bSc7XG5cbiAgc3R5bGVzLmNvbG9yLmFuc2kgPSB7XG4gICAgYW5zaTogd3JhcEFuc2kxNihhbnNpMmFuc2ksIDApXG4gIH07XG4gIHN0eWxlcy5jb2xvci5hbnNpMjU2ID0ge1xuICAgIGFuc2kyNTY6IHdyYXBBbnNpMjU2KGFuc2kyYW5zaSwgMClcbiAgfTtcbiAgc3R5bGVzLmNvbG9yLmFuc2kxNm0gPSB7XG4gICAgcmdiOiB3cmFwQW5zaTE2bShyZ2IycmdiLCAwKVxuICB9O1xuXG4gIHN0eWxlcy5iZ0NvbG9yLmFuc2kgPSB7XG4gICAgYW5zaTogd3JhcEFuc2kxNihhbnNpMmFuc2ksIDEwKVxuICB9O1xuICBzdHlsZXMuYmdDb2xvci5hbnNpMjU2ID0ge1xuICAgIGFuc2kyNTY6IHdyYXBBbnNpMjU2KGFuc2kyYW5zaSwgMTApXG4gIH07XG4gIHN0eWxlcy5iZ0NvbG9yLmFuc2kxNm0gPSB7XG4gICAgcmdiOiB3cmFwQW5zaTE2bShyZ2IycmdiLCAxMClcbiAgfTtcblxuICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMoY29sb3JDb252ZXJ0KSkge1xuICAgIGlmICh0eXBlb2YgY29sb3JDb252ZXJ0W2tleV0gIT09ICdvYmplY3QnKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBzdWl0ZSA9IGNvbG9yQ29udmVydFtrZXldO1xuXG4gICAgaWYgKGtleSA9PT0gJ2Fuc2kxNicpIHtcbiAgICAgIGtleSA9ICdhbnNpJztcbiAgICB9XG5cbiAgICBpZiAoJ2Fuc2kxNicgaW4gc3VpdGUpIHtcbiAgICAgIHN0eWxlcy5jb2xvci5hbnNpW2tleV0gPSB3cmFwQW5zaTE2KHN1aXRlLmFuc2kxNiwgMCk7XG4gICAgICBzdHlsZXMuYmdDb2xvci5hbnNpW2tleV0gPSB3cmFwQW5zaTE2KHN1aXRlLmFuc2kxNiwgMTApO1xuICAgIH1cblxuICAgIGlmICgnYW5zaTI1NicgaW4gc3VpdGUpIHtcbiAgICAgIHN0eWxlcy5jb2xvci5hbnNpMjU2W2tleV0gPSB3cmFwQW5zaTI1NihzdWl0ZS5hbnNpMjU2LCAwKTtcbiAgICAgIHN0eWxlcy5iZ0NvbG9yLmFuc2kyNTZba2V5XSA9IHdyYXBBbnNpMjU2KHN1aXRlLmFuc2kyNTYsIDEwKTtcbiAgICB9XG5cbiAgICBpZiAoJ3JnYicgaW4gc3VpdGUpIHtcbiAgICAgIHN0eWxlcy5jb2xvci5hbnNpMTZtW2tleV0gPSB3cmFwQW5zaTE2bShzdWl0ZS5yZ2IsIDApO1xuICAgICAgc3R5bGVzLmJnQ29sb3IuYW5zaTE2bVtrZXldID0gd3JhcEFuc2kxNm0oc3VpdGUucmdiLCAxMCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHN0eWxlcztcbn1cblxuLy8gTWFrZSB0aGUgZXhwb3J0IGltbXV0YWJsZVxuT2JqZWN0LmRlZmluZVByb3BlcnR5KG1vZHVsZSwgJ2V4cG9ydHMnLCB7XG4gIGVudW1lcmFibGU6IHRydWUsXG4gIGdldDogYXNzZW1ibGVTdHlsZXNcbn0pO1xuIiwiLyogTUlUIGxpY2Vuc2UgKi9cbmNvbnN0IGNzc0tleXdvcmRzID0gcmVxdWlyZSgnY29sb3ItbmFtZScpO1xuXG4vLyBOT1RFOiBjb252ZXJzaW9ucyBzaG91bGQgb25seSByZXR1cm4gcHJpbWl0aXZlIHZhbHVlcyAoaS5lLiBhcnJheXMsIG9yXG4vLyAgICAgICB2YWx1ZXMgdGhhdCBnaXZlIGNvcnJlY3QgYHR5cGVvZmAgcmVzdWx0cykuXG4vLyAgICAgICBkbyBub3QgdXNlIGJveCB2YWx1ZXMgdHlwZXMgKGkuZS4gTnVtYmVyKCksIFN0cmluZygpLCBldGMuKVxuXG5jb25zdCByZXZlcnNlS2V5d29yZHMgPSB7fTtcbmZvciAoY29uc3Qga2V5IGluIGNzc0tleXdvcmRzKSB7XG4gIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoY3NzS2V5d29yZHMsIGtleSkpIHtcbiAgICByZXZlcnNlS2V5d29yZHNbY3NzS2V5d29yZHNba2V5XV0gPSBrZXk7XG4gIH1cbn1cblxuY29uc3QgY29udmVyc2lvbnMgPSB7XG4gIHJnYjogeyBjaGFubmVsczogMywgbGFiZWxzOiAncmdiJyB9LFxuICBoc2w6IHsgY2hhbm5lbHM6IDMsIGxhYmVsczogJ2hzbCcgfSxcbiAgaHN2OiB7IGNoYW5uZWxzOiAzLCBsYWJlbHM6ICdoc3YnIH0sXG4gIGh3YjogeyBjaGFubmVsczogMywgbGFiZWxzOiAnaHdiJyB9LFxuICBjbXlrOiB7IGNoYW5uZWxzOiA0LCBsYWJlbHM6ICdjbXlrJyB9LFxuICB4eXo6IHsgY2hhbm5lbHM6IDMsIGxhYmVsczogJ3h5eicgfSxcbiAgbGFiOiB7IGNoYW5uZWxzOiAzLCBsYWJlbHM6ICdsYWInIH0sXG4gIGxjaDogeyBjaGFubmVsczogMywgbGFiZWxzOiAnbGNoJyB9LFxuICBoZXg6IHsgY2hhbm5lbHM6IDEsIGxhYmVsczogWydoZXgnXSB9LFxuICBrZXl3b3JkOiB7IGNoYW5uZWxzOiAxLCBsYWJlbHM6IFsna2V5d29yZCddIH0sXG4gIGFuc2kxNjogeyBjaGFubmVsczogMSwgbGFiZWxzOiBbJ2Fuc2kxNiddIH0sXG4gIGFuc2kyNTY6IHsgY2hhbm5lbHM6IDEsIGxhYmVsczogWydhbnNpMjU2J10gfSxcbiAgaGNnOiB7IGNoYW5uZWxzOiAzLCBsYWJlbHM6IFsnaCcsICdjJywgJ2cnXSB9LFxuICBhcHBsZTogeyBjaGFubmVsczogMywgbGFiZWxzOiBbJ3IxNicsICdnMTYnLCAnYjE2J10gfSxcbiAgZ3JheTogeyBjaGFubmVsczogMSwgbGFiZWxzOiBbJ2dyYXknXSB9XG59O1xuXG4vLyBoaWRlIC5jaGFubmVscyBhbmQgLmxhYmVscyBwcm9wZXJ0aWVzXG5mb3IgKGNvbnN0IG1vZGVsIGluIGNvbnZlcnNpb25zKSB7XG4gIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoY29udmVyc2lvbnMsIG1vZGVsKSkge1xuICAgIGlmICghKCdjaGFubmVscycgaW4gY29udmVyc2lvbnNbbW9kZWxdKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdtaXNzaW5nIGNoYW5uZWxzIHByb3BlcnR5OiAnICsgbW9kZWwpO1xuICAgIH1cblxuICAgIGlmICghKCdsYWJlbHMnIGluIGNvbnZlcnNpb25zW21vZGVsXSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignbWlzc2luZyBjaGFubmVsIGxhYmVscyBwcm9wZXJ0eTogJyArIG1vZGVsKTtcbiAgICB9XG5cbiAgICBpZiAoY29udmVyc2lvbnNbbW9kZWxdLmxhYmVscy5sZW5ndGggIT09IGNvbnZlcnNpb25zW21vZGVsXS5jaGFubmVscykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdjaGFubmVsIGFuZCBsYWJlbCBjb3VudHMgbWlzbWF0Y2g6ICcgKyBtb2RlbCk7XG4gICAgfVxuXG4gICAgY29uc3QgeyBjaGFubmVscywgbGFiZWxzIH0gPSBjb252ZXJzaW9uc1ttb2RlbF07XG4gICAgZGVsZXRlIGNvbnZlcnNpb25zW21vZGVsXS5jaGFubmVscztcbiAgICBkZWxldGUgY29udmVyc2lvbnNbbW9kZWxdLmxhYmVscztcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY29udmVyc2lvbnNbbW9kZWxdLCAnY2hhbm5lbHMnLCB7IHZhbHVlOiBjaGFubmVscyB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY29udmVyc2lvbnNbbW9kZWxdLCAnbGFiZWxzJywgeyB2YWx1ZTogbGFiZWxzIH0pO1xuICB9XG59XG5cbmNvbnZlcnNpb25zLnJnYi5oc2wgPSBmdW5jdGlvbihyZ2IpIHtcbiAgY29uc3QgciA9IHJnYlswXSAvIDI1NTtcbiAgY29uc3QgZyA9IHJnYlsxXSAvIDI1NTtcbiAgY29uc3QgYiA9IHJnYlsyXSAvIDI1NTtcbiAgY29uc3QgbWluID0gTWF0aC5taW4ociwgZywgYik7XG4gIGNvbnN0IG1heCA9IE1hdGgubWF4KHIsIGcsIGIpO1xuICBjb25zdCBkZWx0YSA9IG1heCAtIG1pbjtcbiAgbGV0IGg7XG4gIGxldCBzO1xuXG4gIGlmIChtYXggPT09IG1pbikge1xuICAgIGggPSAwO1xuICB9IGVsc2UgaWYgKHIgPT09IG1heCkge1xuICAgIGggPSAoZyAtIGIpIC8gZGVsdGE7XG4gIH0gZWxzZSBpZiAoZyA9PT0gbWF4KSB7XG4gICAgaCA9IDIgKyAoYiAtIHIpIC8gZGVsdGE7XG4gIH0gZWxzZSBpZiAoYiA9PT0gbWF4KSB7XG4gICAgaCA9IDQgKyAociAtIGcpIC8gZGVsdGE7XG4gIH1cblxuICBoID0gTWF0aC5taW4oaCAqIDYwLCAzNjApO1xuXG4gIGlmIChoIDwgMCkge1xuICAgIGggKz0gMzYwO1xuICB9XG5cbiAgY29uc3QgbCA9IChtaW4gKyBtYXgpIC8gMjtcblxuICBpZiAobWF4ID09PSBtaW4pIHtcbiAgICBzID0gMDtcbiAgfSBlbHNlIGlmIChsIDw9IDAuNSkge1xuICAgIHMgPSBkZWx0YSAvIChtYXggKyBtaW4pO1xuICB9IGVsc2Uge1xuICAgIHMgPSBkZWx0YSAvICgyIC0gbWF4IC0gbWluKTtcbiAgfVxuXG4gIHJldHVybiBbaCwgcyAqIDEwMCwgbCAqIDEwMF07XG59O1xuXG5jb252ZXJzaW9ucy5yZ2IuaHN2ID0gZnVuY3Rpb24ocmdiKSB7XG4gIGxldCByZGlmO1xuICBsZXQgZ2RpZjtcbiAgbGV0IGJkaWY7XG4gIGxldCBoO1xuICBsZXQgcztcblxuICBjb25zdCByID0gcmdiWzBdIC8gMjU1O1xuICBjb25zdCBnID0gcmdiWzFdIC8gMjU1O1xuICBjb25zdCBiID0gcmdiWzJdIC8gMjU1O1xuICBjb25zdCB2ID0gTWF0aC5tYXgociwgZywgYik7XG4gIGNvbnN0IGRpZmYgPSB2IC0gTWF0aC5taW4ociwgZywgYik7XG4gIGNvbnN0IGRpZmZjID0gZnVuY3Rpb24oYykge1xuICAgIHJldHVybiAodiAtIGMpIC8gNiAvIGRpZmYgKyAxIC8gMjtcbiAgfTtcblxuICBpZiAoZGlmZiA9PT0gMCkge1xuICAgIHMgPSAwO1xuICAgIGggPSBzO1xuICB9IGVsc2Uge1xuICAgIHMgPSBkaWZmIC8gdjtcbiAgICByZGlmID0gZGlmZmMocik7XG4gICAgZ2RpZiA9IGRpZmZjKGcpO1xuICAgIGJkaWYgPSBkaWZmYyhiKTtcblxuICAgIGlmIChyID09PSB2KSB7XG4gICAgICBoID0gYmRpZiAtIGdkaWY7XG4gICAgfSBlbHNlIGlmIChnID09PSB2KSB7XG4gICAgICBoID0gMSAvIDMgKyByZGlmIC0gYmRpZjtcbiAgICB9IGVsc2UgaWYgKGIgPT09IHYpIHtcbiAgICAgIGggPSAyIC8gMyArIGdkaWYgLSByZGlmO1xuICAgIH1cbiAgICBpZiAoaCA8IDApIHtcbiAgICAgIGggKz0gMTtcbiAgICB9IGVsc2UgaWYgKGggPiAxKSB7XG4gICAgICBoIC09IDE7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFtoICogMzYwLCBzICogMTAwLCB2ICogMTAwXTtcbn07XG5cbmNvbnZlcnNpb25zLnJnYi5od2IgPSBmdW5jdGlvbihyZ2IpIHtcbiAgY29uc3QgciA9IHJnYlswXTtcbiAgY29uc3QgZyA9IHJnYlsxXTtcbiAgbGV0IGIgPSByZ2JbMl07XG4gIGNvbnN0IGggPSBjb252ZXJzaW9ucy5yZ2IuaHNsKHJnYilbMF07XG4gIGNvbnN0IHcgPSAoMSAvIDI1NSkgKiBNYXRoLm1pbihyLCBNYXRoLm1pbihnLCBiKSk7XG5cbiAgYiA9IDEgLSAoMSAvIDI1NSkgKiBNYXRoLm1heChyLCBNYXRoLm1heChnLCBiKSk7XG5cbiAgcmV0dXJuIFtoLCB3ICogMTAwLCBiICogMTAwXTtcbn07XG5cbmNvbnZlcnNpb25zLnJnYi5jbXlrID0gZnVuY3Rpb24ocmdiKSB7XG4gIGNvbnN0IHIgPSByZ2JbMF0gLyAyNTU7XG4gIGNvbnN0IGcgPSByZ2JbMV0gLyAyNTU7XG4gIGNvbnN0IGIgPSByZ2JbMl0gLyAyNTU7XG4gIGNvbnN0IGsgPSBNYXRoLm1pbigxIC0gciwgMSAtIGcsIDEgLSBiKTtcbiAgY29uc3QgYyA9ICgxIC0gciAtIGspIC8gKDEgLSBrKSB8fCAwO1xuICBjb25zdCBtID0gKDEgLSBnIC0gaykgLyAoMSAtIGspIHx8IDA7XG4gIGNvbnN0IHkgPSAoMSAtIGIgLSBrKSAvICgxIC0gaykgfHwgMDtcblxuICByZXR1cm4gW2MgKiAxMDAsIG0gKiAxMDAsIHkgKiAxMDAsIGsgKiAxMDBdO1xufTtcblxuLy8gU2VlIGh0dHBzOi8vZW4ubS53aWtpcGVkaWEub3JnL3dpa2kvRXVjbGlkZWFuX2Rpc3RhbmNlI1NxdWFyZWRfRXVjbGlkZWFuX2Rpc3RhbmNlXG5mdW5jdGlvbiBjb21wYXJhdGl2ZURpc3RhbmNlKHgsIHkpIHtcbiAgcmV0dXJuIChcbiAgICBNYXRoLnBvdyh4WzBdIC0geVswXSwgMikgK1xuICAgIE1hdGgucG93KHhbMV0gLSB5WzFdLCAyKSArXG4gICAgTWF0aC5wb3coeFsyXSAtIHlbMl0sIDIpXG4gICk7XG59XG5cbmNvbnZlcnNpb25zLnJnYi5rZXl3b3JkID0gZnVuY3Rpb24ocmdiKSB7XG4gIGNvbnN0IHJldmVyc2VkID0gcmV2ZXJzZUtleXdvcmRzW3JnYl07XG4gIGlmIChyZXZlcnNlZCkge1xuICAgIHJldHVybiByZXZlcnNlZDtcbiAgfVxuXG4gIGxldCBjdXJyZW50Q2xvc2VzdERpc3RhbmNlID0gSW5maW5pdHk7XG4gIGxldCBjdXJyZW50Q2xvc2VzdEtleXdvcmQ7XG5cbiAgZm9yIChjb25zdCBrZXl3b3JkIGluIGNzc0tleXdvcmRzKSB7XG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChjc3NLZXl3b3Jkcywga2V5d29yZCkpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gY3NzS2V5d29yZHNba2V5d29yZF07XG5cbiAgICAgIC8vIENvbXB1dGUgY29tcGFyYXRpdmUgZGlzdGFuY2VcbiAgICAgIGNvbnN0IGRpc3RhbmNlID0gY29tcGFyYXRpdmVEaXN0YW5jZShyZ2IsIHZhbHVlKTtcblxuICAgICAgLy8gQ2hlY2sgaWYgaXRzIGxlc3MsIGlmIHNvIHNldCBhcyBjbG9zZXN0XG4gICAgICBpZiAoZGlzdGFuY2UgPCBjdXJyZW50Q2xvc2VzdERpc3RhbmNlKSB7XG4gICAgICAgIGN1cnJlbnRDbG9zZXN0RGlzdGFuY2UgPSBkaXN0YW5jZTtcbiAgICAgICAgY3VycmVudENsb3Nlc3RLZXl3b3JkID0ga2V5d29yZDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gY3VycmVudENsb3Nlc3RLZXl3b3JkO1xufTtcblxuY29udmVyc2lvbnMua2V5d29yZC5yZ2IgPSBmdW5jdGlvbihrZXl3b3JkKSB7XG4gIHJldHVybiBjc3NLZXl3b3Jkc1trZXl3b3JkXTtcbn07XG5cbmNvbnZlcnNpb25zLnJnYi54eXogPSBmdW5jdGlvbihyZ2IpIHtcbiAgbGV0IHIgPSByZ2JbMF0gLyAyNTU7XG4gIGxldCBnID0gcmdiWzFdIC8gMjU1O1xuICBsZXQgYiA9IHJnYlsyXSAvIDI1NTtcblxuICAvLyBhc3N1bWUgc1JHQlxuICByID0gciA+IDAuMDQwNDUgPyBNYXRoLnBvdygociArIDAuMDU1KSAvIDEuMDU1LCAyLjQpIDogciAvIDEyLjkyO1xuICBnID0gZyA+IDAuMDQwNDUgPyBNYXRoLnBvdygoZyArIDAuMDU1KSAvIDEuMDU1LCAyLjQpIDogZyAvIDEyLjkyO1xuICBiID0gYiA+IDAuMDQwNDUgPyBNYXRoLnBvdygoYiArIDAuMDU1KSAvIDEuMDU1LCAyLjQpIDogYiAvIDEyLjkyO1xuXG4gIGNvbnN0IHggPSByICogMC40MTI0ICsgZyAqIDAuMzU3NiArIGIgKiAwLjE4MDU7XG4gIGNvbnN0IHkgPSByICogMC4yMTI2ICsgZyAqIDAuNzE1MiArIGIgKiAwLjA3MjI7XG4gIGNvbnN0IHogPSByICogMC4wMTkzICsgZyAqIDAuMTE5MiArIGIgKiAwLjk1MDU7XG5cbiAgcmV0dXJuIFt4ICogMTAwLCB5ICogMTAwLCB6ICogMTAwXTtcbn07XG5cbmNvbnZlcnNpb25zLnJnYi5sYWIgPSBmdW5jdGlvbihyZ2IpIHtcbiAgY29uc3QgeHl6ID0gY29udmVyc2lvbnMucmdiLnh5eihyZ2IpO1xuICBsZXQgeCA9IHh5elswXTtcbiAgbGV0IHkgPSB4eXpbMV07XG4gIGxldCB6ID0geHl6WzJdO1xuXG4gIHggLz0gOTUuMDQ3O1xuICB5IC89IDEwMDtcbiAgeiAvPSAxMDguODgzO1xuXG4gIHggPSB4ID4gMC4wMDg4NTYgPyBNYXRoLnBvdyh4LCAxIC8gMykgOiA3Ljc4NyAqIHggKyAxNiAvIDExNjtcbiAgeSA9IHkgPiAwLjAwODg1NiA/IE1hdGgucG93KHksIDEgLyAzKSA6IDcuNzg3ICogeSArIDE2IC8gMTE2O1xuICB6ID0geiA+IDAuMDA4ODU2ID8gTWF0aC5wb3coeiwgMSAvIDMpIDogNy43ODcgKiB6ICsgMTYgLyAxMTY7XG5cbiAgY29uc3QgbCA9IDExNiAqIHkgLSAxNjtcbiAgY29uc3QgYSA9IDUwMCAqICh4IC0geSk7XG4gIGNvbnN0IGIgPSAyMDAgKiAoeSAtIHopO1xuXG4gIHJldHVybiBbbCwgYSwgYl07XG59O1xuXG5jb252ZXJzaW9ucy5oc2wucmdiID0gZnVuY3Rpb24oaHNsKSB7XG4gIGNvbnN0IGggPSBoc2xbMF0gLyAzNjA7XG4gIGNvbnN0IHMgPSBoc2xbMV0gLyAxMDA7XG4gIGNvbnN0IGwgPSBoc2xbMl0gLyAxMDA7XG4gIGxldCB0MjtcbiAgbGV0IHQzO1xuICBsZXQgdmFsO1xuXG4gIGlmIChzID09PSAwKSB7XG4gICAgdmFsID0gbCAqIDI1NTtcbiAgICByZXR1cm4gW3ZhbCwgdmFsLCB2YWxdO1xuICB9XG5cbiAgaWYgKGwgPCAwLjUpIHtcbiAgICB0MiA9IGwgKiAoMSArIHMpO1xuICB9IGVsc2Uge1xuICAgIHQyID0gbCArIHMgLSBsICogcztcbiAgfVxuXG4gIGNvbnN0IHQxID0gMiAqIGwgLSB0MjtcblxuICBjb25zdCByZ2IgPSBbMCwgMCwgMF07XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgdDMgPSBoICsgKDEgLyAzKSAqIC0oaSAtIDEpO1xuICAgIGlmICh0MyA8IDApIHtcbiAgICAgIHQzKys7XG4gICAgfVxuICAgIGlmICh0MyA+IDEpIHtcbiAgICAgIHQzLS07XG4gICAgfVxuXG4gICAgaWYgKDYgKiB0MyA8IDEpIHtcbiAgICAgIHZhbCA9IHQxICsgKHQyIC0gdDEpICogNiAqIHQzO1xuICAgIH0gZWxzZSBpZiAoMiAqIHQzIDwgMSkge1xuICAgICAgdmFsID0gdDI7XG4gICAgfSBlbHNlIGlmICgzICogdDMgPCAyKSB7XG4gICAgICB2YWwgPSB0MSArICh0MiAtIHQxKSAqICgyIC8gMyAtIHQzKSAqIDY7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbCA9IHQxO1xuICAgIH1cblxuICAgIHJnYltpXSA9IHZhbCAqIDI1NTtcbiAgfVxuXG4gIHJldHVybiByZ2I7XG59O1xuXG5jb252ZXJzaW9ucy5oc2wuaHN2ID0gZnVuY3Rpb24oaHNsKSB7XG4gIGNvbnN0IGggPSBoc2xbMF07XG4gIGxldCBzID0gaHNsWzFdIC8gMTAwO1xuICBsZXQgbCA9IGhzbFsyXSAvIDEwMDtcbiAgbGV0IHNtaW4gPSBzO1xuICBjb25zdCBsbWluID0gTWF0aC5tYXgobCwgMC4wMSk7XG5cbiAgbCAqPSAyO1xuICBzICo9IGwgPD0gMSA/IGwgOiAyIC0gbDtcbiAgc21pbiAqPSBsbWluIDw9IDEgPyBsbWluIDogMiAtIGxtaW47XG4gIGNvbnN0IHYgPSAobCArIHMpIC8gMjtcbiAgY29uc3Qgc3YgPSBsID09PSAwID8gKDIgKiBzbWluKSAvIChsbWluICsgc21pbikgOiAoMiAqIHMpIC8gKGwgKyBzKTtcblxuICByZXR1cm4gW2gsIHN2ICogMTAwLCB2ICogMTAwXTtcbn07XG5cbmNvbnZlcnNpb25zLmhzdi5yZ2IgPSBmdW5jdGlvbihoc3YpIHtcbiAgY29uc3QgaCA9IGhzdlswXSAvIDYwO1xuICBjb25zdCBzID0gaHN2WzFdIC8gMTAwO1xuICBsZXQgdiA9IGhzdlsyXSAvIDEwMDtcbiAgY29uc3QgaGkgPSBNYXRoLmZsb29yKGgpICUgNjtcblxuICBjb25zdCBmID0gaCAtIE1hdGguZmxvb3IoaCk7XG4gIGNvbnN0IHAgPSAyNTUgKiB2ICogKDEgLSBzKTtcbiAgY29uc3QgcSA9IDI1NSAqIHYgKiAoMSAtIHMgKiBmKTtcbiAgY29uc3QgdCA9IDI1NSAqIHYgKiAoMSAtIHMgKiAoMSAtIGYpKTtcbiAgdiAqPSAyNTU7XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGRlZmF1bHQtY2FzZVxuICBzd2l0Y2ggKGhpKSB7XG4gICAgY2FzZSAwOlxuICAgICAgcmV0dXJuIFt2LCB0LCBwXTtcbiAgICBjYXNlIDE6XG4gICAgICByZXR1cm4gW3EsIHYsIHBdO1xuICAgIGNhc2UgMjpcbiAgICAgIHJldHVybiBbcCwgdiwgdF07XG4gICAgY2FzZSAzOlxuICAgICAgcmV0dXJuIFtwLCBxLCB2XTtcbiAgICBjYXNlIDQ6XG4gICAgICByZXR1cm4gW3QsIHAsIHZdO1xuICAgIGNhc2UgNTpcbiAgICAgIHJldHVybiBbdiwgcCwgcV07XG4gIH1cbn07XG5cbmNvbnZlcnNpb25zLmhzdi5oc2wgPSBmdW5jdGlvbihoc3YpIHtcbiAgY29uc3QgaCA9IGhzdlswXTtcbiAgY29uc3QgcyA9IGhzdlsxXSAvIDEwMDtcbiAgY29uc3QgdiA9IGhzdlsyXSAvIDEwMDtcbiAgY29uc3Qgdm1pbiA9IE1hdGgubWF4KHYsIDAuMDEpO1xuICBsZXQgc2w7XG4gIGxldCBsO1xuXG4gIGwgPSAoMiAtIHMpICogdjtcbiAgY29uc3QgbG1pbiA9ICgyIC0gcykgKiB2bWluO1xuICBzbCA9IHMgKiB2bWluO1xuICBzbCAvPSBsbWluIDw9IDEgPyBsbWluIDogMiAtIGxtaW47XG4gIHNsID0gc2wgfHwgMDtcbiAgbCAvPSAyO1xuXG4gIHJldHVybiBbaCwgc2wgKiAxMDAsIGwgKiAxMDBdO1xufTtcblxuLy8gaHR0cDovL2Rldi53My5vcmcvY3Nzd2cvY3NzLWNvbG9yLyNod2ItdG8tcmdiXG5jb252ZXJzaW9ucy5od2IucmdiID0gZnVuY3Rpb24oaHdiKSB7XG4gIGNvbnN0IGggPSBod2JbMF0gLyAzNjA7XG4gIGxldCB3aCA9IGh3YlsxXSAvIDEwMDtcbiAgbGV0IGJsID0gaHdiWzJdIC8gMTAwO1xuICBjb25zdCByYXRpbyA9IHdoICsgYmw7XG5cbiAgLy8gd2ggKyBibCBjYW50IGJlID4gMVxuICBpZiAocmF0aW8gPiAxKSB7XG4gICAgd2ggLz0gcmF0aW87XG4gICAgYmwgLz0gcmF0aW87XG4gIH1cblxuICBjb25zdCBpID0gTWF0aC5mbG9vcig2ICogaCk7XG4gIGNvbnN0IHYgPSAxIC0gYmw7XG4gIGxldCBmID0gNiAqIGggLSBpO1xuXG4gIGlmICgoaSAmIDB4MDEpICE9PSAwKSB7XG4gICAgZiA9IDEgLSBmO1xuICB9XG5cbiAgY29uc3QgbiA9IHdoICsgZiAqICh2IC0gd2gpOyAvLyBsaW5lYXIgaW50ZXJwb2xhdGlvblxuXG4gIGxldCByO1xuICBsZXQgZztcbiAgbGV0IGI7XG4gIHN3aXRjaCAoaSkge1xuICAgIGRlZmF1bHQ6XG4gICAgY2FzZSA2OlxuICAgIGNhc2UgMDpcbiAgICAgIHIgPSB2O1xuICAgICAgZyA9IG47XG4gICAgICBiID0gd2g7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDE6XG4gICAgICByID0gbjtcbiAgICAgIGcgPSB2O1xuICAgICAgYiA9IHdoO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAyOlxuICAgICAgciA9IHdoO1xuICAgICAgZyA9IHY7XG4gICAgICBiID0gbjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgMzpcbiAgICAgIHIgPSB3aDtcbiAgICAgIGcgPSBuO1xuICAgICAgYiA9IHY7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDQ6XG4gICAgICByID0gbjtcbiAgICAgIGcgPSB3aDtcbiAgICAgIGIgPSB2O1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSA1OlxuICAgICAgciA9IHY7XG4gICAgICBnID0gd2g7XG4gICAgICBiID0gbjtcbiAgICAgIGJyZWFrO1xuICB9XG5cbiAgcmV0dXJuIFtyICogMjU1LCBnICogMjU1LCBiICogMjU1XTtcbn07XG5cbmNvbnZlcnNpb25zLmNteWsucmdiID0gZnVuY3Rpb24oY215aykge1xuICBjb25zdCBjID0gY215a1swXSAvIDEwMDtcbiAgY29uc3QgbSA9IGNteWtbMV0gLyAxMDA7XG4gIGNvbnN0IHkgPSBjbXlrWzJdIC8gMTAwO1xuICBjb25zdCBrID0gY215a1szXSAvIDEwMDtcblxuICBjb25zdCByID0gMSAtIE1hdGgubWluKDEsIGMgKiAoMSAtIGspICsgayk7XG4gIGNvbnN0IGcgPSAxIC0gTWF0aC5taW4oMSwgbSAqICgxIC0gaykgKyBrKTtcbiAgY29uc3QgYiA9IDEgLSBNYXRoLm1pbigxLCB5ICogKDEgLSBrKSArIGspO1xuXG4gIHJldHVybiBbciAqIDI1NSwgZyAqIDI1NSwgYiAqIDI1NV07XG59O1xuXG5jb252ZXJzaW9ucy54eXoucmdiID0gZnVuY3Rpb24oeHl6KSB7XG4gIGNvbnN0IHggPSB4eXpbMF0gLyAxMDA7XG4gIGNvbnN0IHkgPSB4eXpbMV0gLyAxMDA7XG4gIGNvbnN0IHogPSB4eXpbMl0gLyAxMDA7XG4gIGxldCByO1xuICBsZXQgZztcbiAgbGV0IGI7XG5cbiAgciA9IHggKiAzLjI0MDYgKyB5ICogLTEuNTM3MiArIHogKiAtMC40OTg2O1xuICBnID0geCAqIC0wLjk2ODkgKyB5ICogMS44NzU4ICsgeiAqIDAuMDQxNTtcbiAgYiA9IHggKiAwLjA1NTcgKyB5ICogLTAuMjA0ICsgeiAqIDEuMDU3O1xuXG4gIC8vIGFzc3VtZSBzUkdCXG4gIHIgPSByID4gMC4wMDMxMzA4ID8gMS4wNTUgKiBNYXRoLnBvdyhyLCAxLjAgLyAyLjQpIC0gMC4wNTUgOiByICogMTIuOTI7XG5cbiAgZyA9IGcgPiAwLjAwMzEzMDggPyAxLjA1NSAqIE1hdGgucG93KGcsIDEuMCAvIDIuNCkgLSAwLjA1NSA6IGcgKiAxMi45MjtcblxuICBiID0gYiA+IDAuMDAzMTMwOCA/IDEuMDU1ICogTWF0aC5wb3coYiwgMS4wIC8gMi40KSAtIDAuMDU1IDogYiAqIDEyLjkyO1xuXG4gIHIgPSBNYXRoLm1pbihNYXRoLm1heCgwLCByKSwgMSk7XG4gIGcgPSBNYXRoLm1pbihNYXRoLm1heCgwLCBnKSwgMSk7XG4gIGIgPSBNYXRoLm1pbihNYXRoLm1heCgwLCBiKSwgMSk7XG5cbiAgcmV0dXJuIFtyICogMjU1LCBnICogMjU1LCBiICogMjU1XTtcbn07XG5cbmNvbnZlcnNpb25zLnh5ei5sYWIgPSBmdW5jdGlvbih4eXopIHtcbiAgbGV0IHggPSB4eXpbMF07XG4gIGxldCB5ID0geHl6WzFdO1xuICBsZXQgeiA9IHh5elsyXTtcblxuICB4IC89IDk1LjA0NztcbiAgeSAvPSAxMDA7XG4gIHogLz0gMTA4Ljg4MztcblxuICB4ID0geCA+IDAuMDA4ODU2ID8gTWF0aC5wb3coeCwgMSAvIDMpIDogNy43ODcgKiB4ICsgMTYgLyAxMTY7XG4gIHkgPSB5ID4gMC4wMDg4NTYgPyBNYXRoLnBvdyh5LCAxIC8gMykgOiA3Ljc4NyAqIHkgKyAxNiAvIDExNjtcbiAgeiA9IHogPiAwLjAwODg1NiA/IE1hdGgucG93KHosIDEgLyAzKSA6IDcuNzg3ICogeiArIDE2IC8gMTE2O1xuXG4gIGNvbnN0IGwgPSAxMTYgKiB5IC0gMTY7XG4gIGNvbnN0IGEgPSA1MDAgKiAoeCAtIHkpO1xuICBjb25zdCBiID0gMjAwICogKHkgLSB6KTtcblxuICByZXR1cm4gW2wsIGEsIGJdO1xufTtcblxuY29udmVyc2lvbnMubGFiLnh5eiA9IGZ1bmN0aW9uKGxhYikge1xuICBjb25zdCBsID0gbGFiWzBdO1xuICBjb25zdCBhID0gbGFiWzFdO1xuICBjb25zdCBiID0gbGFiWzJdO1xuICBsZXQgeDtcbiAgbGV0IHk7XG4gIGxldCB6O1xuXG4gIHkgPSAobCArIDE2KSAvIDExNjtcbiAgeCA9IGEgLyA1MDAgKyB5O1xuICB6ID0geSAtIGIgLyAyMDA7XG5cbiAgY29uc3QgeTIgPSBNYXRoLnBvdyh5LCAzKTtcbiAgY29uc3QgeDIgPSBNYXRoLnBvdyh4LCAzKTtcbiAgY29uc3QgejIgPSBNYXRoLnBvdyh6LCAzKTtcbiAgeSA9IHkyID4gMC4wMDg4NTYgPyB5MiA6ICh5IC0gMTYgLyAxMTYpIC8gNy43ODc7XG4gIHggPSB4MiA+IDAuMDA4ODU2ID8geDIgOiAoeCAtIDE2IC8gMTE2KSAvIDcuNzg3O1xuICB6ID0gejIgPiAwLjAwODg1NiA/IHoyIDogKHogLSAxNiAvIDExNikgLyA3Ljc4NztcblxuICB4ICo9IDk1LjA0NztcbiAgeSAqPSAxMDA7XG4gIHogKj0gMTA4Ljg4MztcblxuICByZXR1cm4gW3gsIHksIHpdO1xufTtcblxuY29udmVyc2lvbnMubGFiLmxjaCA9IGZ1bmN0aW9uKGxhYikge1xuICBjb25zdCBsID0gbGFiWzBdO1xuICBjb25zdCBhID0gbGFiWzFdO1xuICBjb25zdCBiID0gbGFiWzJdO1xuICBsZXQgaDtcblxuICBjb25zdCBociA9IE1hdGguYXRhbjIoYiwgYSk7XG4gIGggPSAoaHIgKiAzNjApIC8gMiAvIE1hdGguUEk7XG5cbiAgaWYgKGggPCAwKSB7XG4gICAgaCArPSAzNjA7XG4gIH1cblxuICBjb25zdCBjID0gTWF0aC5zcXJ0KGEgKiBhICsgYiAqIGIpO1xuXG4gIHJldHVybiBbbCwgYywgaF07XG59O1xuXG5jb252ZXJzaW9ucy5sY2gubGFiID0gZnVuY3Rpb24obGNoKSB7XG4gIGNvbnN0IGwgPSBsY2hbMF07XG4gIGNvbnN0IGMgPSBsY2hbMV07XG4gIGNvbnN0IGggPSBsY2hbMl07XG5cbiAgY29uc3QgaHIgPSAoaCAvIDM2MCkgKiAyICogTWF0aC5QSTtcbiAgY29uc3QgYSA9IGMgKiBNYXRoLmNvcyhocik7XG4gIGNvbnN0IGIgPSBjICogTWF0aC5zaW4oaHIpO1xuXG4gIHJldHVybiBbbCwgYSwgYl07XG59O1xuXG5jb252ZXJzaW9ucy5yZ2IuYW5zaTE2ID0gZnVuY3Rpb24oYXJncykge1xuICBjb25zdCByID0gYXJnc1swXTtcbiAgY29uc3QgZyA9IGFyZ3NbMV07XG4gIGNvbnN0IGIgPSBhcmdzWzJdO1xuICAvLyBoc3YgLT4gYW5zaTE2IG9wdGltaXphdGlvblxuICBsZXQgdmFsdWUgPSAxIGluIGFyZ3VtZW50cyA/IGFyZ3VtZW50c1sxXSA6IGNvbnZlcnNpb25zLnJnYi5oc3YoYXJncylbMl07XG5cbiAgdmFsdWUgPSBNYXRoLnJvdW5kKHZhbHVlIC8gNTApO1xuXG4gIGlmICh2YWx1ZSA9PT0gMCkge1xuICAgIHJldHVybiAzMDtcbiAgfVxuXG4gIGxldCBhbnNpID1cbiAgICAzMCArXG4gICAgKChNYXRoLnJvdW5kKGIgLyAyNTUpIDw8IDIpIHxcbiAgICAgIChNYXRoLnJvdW5kKGcgLyAyNTUpIDw8IDEpIHxcbiAgICAgIE1hdGgucm91bmQociAvIDI1NSkpO1xuXG4gIGlmICh2YWx1ZSA9PT0gMikge1xuICAgIGFuc2kgKz0gNjA7XG4gIH1cblxuICByZXR1cm4gYW5zaTtcbn07XG5cbmNvbnZlcnNpb25zLmhzdi5hbnNpMTYgPSBmdW5jdGlvbihhcmdzKSB7XG4gIC8vIG9wdGltaXphdGlvbiBoZXJlOyB3ZSBhbHJlYWR5IGtub3cgdGhlIHZhbHVlIGFuZCBkb24ndCBuZWVkIHRvIGdldFxuICAvLyBpdCBjb252ZXJzaW9uc2VkIGZvciB1cy5cbiAgcmV0dXJuIGNvbnZlcnNpb25zLnJnYi5hbnNpMTYoY29udmVyc2lvbnMuaHN2LnJnYihhcmdzKSwgYXJnc1syXSk7XG59O1xuXG5jb252ZXJzaW9ucy5yZ2IuYW5zaTI1NiA9IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgY29uc3QgciA9IGFyZ3NbMF07XG4gIGNvbnN0IGcgPSBhcmdzWzFdO1xuICBjb25zdCBiID0gYXJnc1syXTtcblxuICAvLyB3ZSB1c2UgdGhlIGV4dGVuZGVkIGdyZXlzY2FsZSBwYWxldHRlIGhlcmUsIHdpdGggdGhlIGV4Y2VwdGlvbiBvZlxuICAvLyBibGFjayBhbmQgd2hpdGUuIG5vcm1hbCBwYWxldHRlIG9ubHkgaGFzIDQgZ3JleXNjYWxlIHNoYWRlcy5cbiAgaWYgKHIgPT09IGcgJiYgZyA9PT0gYikge1xuICAgIGlmIChyIDwgOCkge1xuICAgICAgcmV0dXJuIDE2O1xuICAgIH1cblxuICAgIGlmIChyID4gMjQ4KSB7XG4gICAgICByZXR1cm4gMjMxO1xuICAgIH1cblxuICAgIHJldHVybiBNYXRoLnJvdW5kKCgociAtIDgpIC8gMjQ3KSAqIDI0KSArIDIzMjtcbiAgfVxuXG4gIGNvbnN0IGFuc2kgPVxuICAgIDE2ICtcbiAgICAzNiAqIE1hdGgucm91bmQoKHIgLyAyNTUpICogNSkgK1xuICAgIDYgKiBNYXRoLnJvdW5kKChnIC8gMjU1KSAqIDUpICtcbiAgICBNYXRoLnJvdW5kKChiIC8gMjU1KSAqIDUpO1xuXG4gIHJldHVybiBhbnNpO1xufTtcblxuY29udmVyc2lvbnMuYW5zaTE2LnJnYiA9IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgbGV0IGNvbG9yID0gYXJncyAlIDEwO1xuXG4gIC8vIGhhbmRsZSBncmV5c2NhbGVcbiAgaWYgKGNvbG9yID09PSAwIHx8IGNvbG9yID09PSA3KSB7XG4gICAgaWYgKGFyZ3MgPiA1MCkge1xuICAgICAgY29sb3IgKz0gMy41O1xuICAgIH1cblxuICAgIGNvbG9yID0gKGNvbG9yIC8gMTAuNSkgKiAyNTU7XG5cbiAgICByZXR1cm4gW2NvbG9yLCBjb2xvciwgY29sb3JdO1xuICB9XG5cbiAgY29uc3QgbXVsdCA9ICh+fihhcmdzID4gNTApICsgMSkgKiAwLjU7XG4gIGNvbnN0IHIgPSAoY29sb3IgJiAxKSAqIG11bHQgKiAyNTU7XG4gIGNvbnN0IGcgPSAoKGNvbG9yID4+IDEpICYgMSkgKiBtdWx0ICogMjU1O1xuICBjb25zdCBiID0gKChjb2xvciA+PiAyKSAmIDEpICogbXVsdCAqIDI1NTtcblxuICByZXR1cm4gW3IsIGcsIGJdO1xufTtcblxuY29udmVyc2lvbnMuYW5zaTI1Ni5yZ2IgPSBmdW5jdGlvbihhcmdzKSB7XG4gIC8vIGhhbmRsZSBncmV5c2NhbGVcbiAgaWYgKGFyZ3MgPj0gMjMyKSB7XG4gICAgY29uc3QgYyA9IChhcmdzIC0gMjMyKSAqIDEwICsgODtcbiAgICByZXR1cm4gW2MsIGMsIGNdO1xuICB9XG5cbiAgYXJncyAtPSAxNjtcblxuICBsZXQgcmVtO1xuICBjb25zdCByID0gKE1hdGguZmxvb3IoYXJncyAvIDM2KSAvIDUpICogMjU1O1xuICBjb25zdCBnID0gKE1hdGguZmxvb3IoKHJlbSA9IGFyZ3MgJSAzNikgLyA2KSAvIDUpICogMjU1O1xuICBjb25zdCBiID0gKChyZW0gJSA2KSAvIDUpICogMjU1O1xuXG4gIHJldHVybiBbciwgZywgYl07XG59O1xuXG5jb252ZXJzaW9ucy5yZ2IuaGV4ID0gZnVuY3Rpb24oYXJncykge1xuICBjb25zdCBpbnRlZ2VyID1cbiAgICAoKE1hdGgucm91bmQoYXJnc1swXSkgJiAweGZmKSA8PCAxNikgK1xuICAgICgoTWF0aC5yb3VuZChhcmdzWzFdKSAmIDB4ZmYpIDw8IDgpICtcbiAgICBOdW1iZXIoTWF0aC5yb3VuZChhcmdzWzJdKSAmIDB4ZmYpO1xuICBjb25zdCBzdHJpbmcgPSBpbnRlZ2VyLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpO1xuICByZXR1cm4gJzAwMDAwMCcuc3Vic3RyaW5nKHN0cmluZy5sZW5ndGgpICsgc3RyaW5nO1xufTtcblxuY29udmVyc2lvbnMuaGV4LnJnYiA9IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgY29uc3QgbWF0Y2ggPSBhcmdzLnRvU3RyaW5nKDE2KS5tYXRjaCgvW2EtZjAtOV17Nn18W2EtZjAtOV17M30vaSk7XG4gIGlmICghbWF0Y2gpIHtcbiAgICByZXR1cm4gWzAsIDAsIDBdO1xuICB9XG5cbiAgbGV0IGNvbG9yU3RyaW5nID0gbWF0Y2hbMF07XG5cbiAgaWYgKG1hdGNoWzBdLmxlbmd0aCA9PT0gMykge1xuICAgIGNvbG9yU3RyaW5nID0gY29sb3JTdHJpbmdcbiAgICAgIC5zcGxpdCgnJylcbiAgICAgIC5tYXAoY2hhciA9PiB7XG4gICAgICAgIHJldHVybiBjaGFyICsgY2hhcjtcbiAgICAgIH0pXG4gICAgICAuam9pbignJyk7XG4gIH1cblxuICBjb25zdCBpbnRlZ2VyID0gcGFyc2VJbnQoY29sb3JTdHJpbmcsIDE2KTtcbiAgY29uc3QgciA9IChpbnRlZ2VyID4+IDE2KSAmIDB4ZmY7XG4gIGNvbnN0IGcgPSAoaW50ZWdlciA+PiA4KSAmIDB4ZmY7XG4gIGNvbnN0IGIgPSBpbnRlZ2VyICYgMHhmZjtcblxuICByZXR1cm4gW3IsIGcsIGJdO1xufTtcblxuY29udmVyc2lvbnMucmdiLmhjZyA9IGZ1bmN0aW9uKHJnYikge1xuICBjb25zdCByID0gcmdiWzBdIC8gMjU1O1xuICBjb25zdCBnID0gcmdiWzFdIC8gMjU1O1xuICBjb25zdCBiID0gcmdiWzJdIC8gMjU1O1xuICBjb25zdCBtYXggPSBNYXRoLm1heChNYXRoLm1heChyLCBnKSwgYik7XG4gIGNvbnN0IG1pbiA9IE1hdGgubWluKE1hdGgubWluKHIsIGcpLCBiKTtcbiAgY29uc3QgY2hyb21hID0gbWF4IC0gbWluO1xuICBsZXQgZ3JheXNjYWxlO1xuICBsZXQgaHVlO1xuXG4gIGlmIChjaHJvbWEgPCAxKSB7XG4gICAgZ3JheXNjYWxlID0gbWluIC8gKDEgLSBjaHJvbWEpO1xuICB9IGVsc2Uge1xuICAgIGdyYXlzY2FsZSA9IDA7XG4gIH1cblxuICBpZiAoY2hyb21hIDw9IDApIHtcbiAgICBodWUgPSAwO1xuICB9IGVsc2UgaWYgKG1heCA9PT0gcikge1xuICAgIGh1ZSA9ICgoZyAtIGIpIC8gY2hyb21hKSAlIDY7XG4gIH0gZWxzZSBpZiAobWF4ID09PSBnKSB7XG4gICAgaHVlID0gMiArIChiIC0gcikgLyBjaHJvbWE7XG4gIH0gZWxzZSB7XG4gICAgaHVlID0gNCArIChyIC0gZykgLyBjaHJvbWEgKyA0O1xuICB9XG5cbiAgaHVlIC89IDY7XG4gIGh1ZSAlPSAxO1xuXG4gIHJldHVybiBbaHVlICogMzYwLCBjaHJvbWEgKiAxMDAsIGdyYXlzY2FsZSAqIDEwMF07XG59O1xuXG5jb252ZXJzaW9ucy5oc2wuaGNnID0gZnVuY3Rpb24oaHNsKSB7XG4gIGNvbnN0IHMgPSBoc2xbMV0gLyAxMDA7XG4gIGNvbnN0IGwgPSBoc2xbMl0gLyAxMDA7XG4gIGxldCBjID0gMTtcbiAgbGV0IGYgPSAwO1xuXG4gIGlmIChsIDwgMC41KSB7XG4gICAgYyA9IDIuMCAqIHMgKiBsO1xuICB9IGVsc2Uge1xuICAgIGMgPSAyLjAgKiBzICogKDEuMCAtIGwpO1xuICB9XG5cbiAgaWYgKGMgPCAxLjApIHtcbiAgICBmID0gKGwgLSAwLjUgKiBjKSAvICgxLjAgLSBjKTtcbiAgfVxuXG4gIHJldHVybiBbaHNsWzBdLCBjICogMTAwLCBmICogMTAwXTtcbn07XG5cbmNvbnZlcnNpb25zLmhzdi5oY2cgPSBmdW5jdGlvbihoc3YpIHtcbiAgY29uc3QgcyA9IGhzdlsxXSAvIDEwMDtcbiAgY29uc3QgdiA9IGhzdlsyXSAvIDEwMDtcblxuICBjb25zdCBjID0gcyAqIHY7XG4gIGxldCBmID0gMDtcblxuICBpZiAoYyA8IDEuMCkge1xuICAgIGYgPSAodiAtIGMpIC8gKDEgLSBjKTtcbiAgfVxuXG4gIHJldHVybiBbaHN2WzBdLCBjICogMTAwLCBmICogMTAwXTtcbn07XG5cbmNvbnZlcnNpb25zLmhjZy5yZ2IgPSBmdW5jdGlvbihoY2cpIHtcbiAgY29uc3QgaCA9IGhjZ1swXSAvIDM2MDtcbiAgY29uc3QgYyA9IGhjZ1sxXSAvIDEwMDtcbiAgY29uc3QgZyA9IGhjZ1syXSAvIDEwMDtcblxuICBpZiAoYyA9PT0gMC4wKSB7XG4gICAgcmV0dXJuIFtnICogMjU1LCBnICogMjU1LCBnICogMjU1XTtcbiAgfVxuXG4gIGNvbnN0IHB1cmUgPSBbMCwgMCwgMF07XG4gIGNvbnN0IGhpID0gKGggJSAxKSAqIDY7XG4gIGNvbnN0IHYgPSBoaSAlIDE7XG4gIGNvbnN0IHcgPSAxIC0gdjtcbiAgbGV0IG1nID0gMDtcblxuICBzd2l0Y2ggKE1hdGguZmxvb3IoaGkpKSB7XG4gICAgY2FzZSAwOlxuICAgICAgcHVyZVswXSA9IDE7XG4gICAgICBwdXJlWzFdID0gdjtcbiAgICAgIHB1cmVbMl0gPSAwO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAxOlxuICAgICAgcHVyZVswXSA9IHc7XG4gICAgICBwdXJlWzFdID0gMTtcbiAgICAgIHB1cmVbMl0gPSAwO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAyOlxuICAgICAgcHVyZVswXSA9IDA7XG4gICAgICBwdXJlWzFdID0gMTtcbiAgICAgIHB1cmVbMl0gPSB2O1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAzOlxuICAgICAgcHVyZVswXSA9IDA7XG4gICAgICBwdXJlWzFdID0gdztcbiAgICAgIHB1cmVbMl0gPSAxO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSA0OlxuICAgICAgcHVyZVswXSA9IHY7XG4gICAgICBwdXJlWzFdID0gMDtcbiAgICAgIHB1cmVbMl0gPSAxO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIHB1cmVbMF0gPSAxO1xuICAgICAgcHVyZVsxXSA9IDA7XG4gICAgICBwdXJlWzJdID0gdztcbiAgfVxuXG4gIG1nID0gKDEuMCAtIGMpICogZztcblxuICByZXR1cm4gW1xuICAgIChjICogcHVyZVswXSArIG1nKSAqIDI1NSxcbiAgICAoYyAqIHB1cmVbMV0gKyBtZykgKiAyNTUsXG4gICAgKGMgKiBwdXJlWzJdICsgbWcpICogMjU1XG4gIF07XG59O1xuXG5jb252ZXJzaW9ucy5oY2cuaHN2ID0gZnVuY3Rpb24oaGNnKSB7XG4gIGNvbnN0IGMgPSBoY2dbMV0gLyAxMDA7XG4gIGNvbnN0IGcgPSBoY2dbMl0gLyAxMDA7XG5cbiAgY29uc3QgdiA9IGMgKyBnICogKDEuMCAtIGMpO1xuICBsZXQgZiA9IDA7XG5cbiAgaWYgKHYgPiAwLjApIHtcbiAgICBmID0gYyAvIHY7XG4gIH1cblxuICByZXR1cm4gW2hjZ1swXSwgZiAqIDEwMCwgdiAqIDEwMF07XG59O1xuXG5jb252ZXJzaW9ucy5oY2cuaHNsID0gZnVuY3Rpb24oaGNnKSB7XG4gIGNvbnN0IGMgPSBoY2dbMV0gLyAxMDA7XG4gIGNvbnN0IGcgPSBoY2dbMl0gLyAxMDA7XG5cbiAgY29uc3QgbCA9IGcgKiAoMS4wIC0gYykgKyAwLjUgKiBjO1xuICBsZXQgcyA9IDA7XG5cbiAgaWYgKGwgPiAwLjAgJiYgbCA8IDAuNSkge1xuICAgIHMgPSBjIC8gKDIgKiBsKTtcbiAgfSBlbHNlIGlmIChsID49IDAuNSAmJiBsIDwgMS4wKSB7XG4gICAgcyA9IGMgLyAoMiAqICgxIC0gbCkpO1xuICB9XG5cbiAgcmV0dXJuIFtoY2dbMF0sIHMgKiAxMDAsIGwgKiAxMDBdO1xufTtcblxuY29udmVyc2lvbnMuaGNnLmh3YiA9IGZ1bmN0aW9uKGhjZykge1xuICBjb25zdCBjID0gaGNnWzFdIC8gMTAwO1xuICBjb25zdCBnID0gaGNnWzJdIC8gMTAwO1xuICBjb25zdCB2ID0gYyArIGcgKiAoMS4wIC0gYyk7XG4gIHJldHVybiBbaGNnWzBdLCAodiAtIGMpICogMTAwLCAoMSAtIHYpICogMTAwXTtcbn07XG5cbmNvbnZlcnNpb25zLmh3Yi5oY2cgPSBmdW5jdGlvbihod2IpIHtcbiAgY29uc3QgdyA9IGh3YlsxXSAvIDEwMDtcbiAgY29uc3QgYiA9IGh3YlsyXSAvIDEwMDtcbiAgY29uc3QgdiA9IDEgLSBiO1xuICBjb25zdCBjID0gdiAtIHc7XG4gIGxldCBnID0gMDtcblxuICBpZiAoYyA8IDEpIHtcbiAgICBnID0gKHYgLSBjKSAvICgxIC0gYyk7XG4gIH1cblxuICByZXR1cm4gW2h3YlswXSwgYyAqIDEwMCwgZyAqIDEwMF07XG59O1xuXG5jb252ZXJzaW9ucy5hcHBsZS5yZ2IgPSBmdW5jdGlvbihhcHBsZSkge1xuICByZXR1cm4gW1xuICAgIChhcHBsZVswXSAvIDY1NTM1KSAqIDI1NSxcbiAgICAoYXBwbGVbMV0gLyA2NTUzNSkgKiAyNTUsXG4gICAgKGFwcGxlWzJdIC8gNjU1MzUpICogMjU1XG4gIF07XG59O1xuXG5jb252ZXJzaW9ucy5yZ2IuYXBwbGUgPSBmdW5jdGlvbihyZ2IpIHtcbiAgcmV0dXJuIFtcbiAgICAocmdiWzBdIC8gMjU1KSAqIDY1NTM1LFxuICAgIChyZ2JbMV0gLyAyNTUpICogNjU1MzUsXG4gICAgKHJnYlsyXSAvIDI1NSkgKiA2NTUzNVxuICBdO1xufTtcblxuY29udmVyc2lvbnMuZ3JheS5yZ2IgPSBmdW5jdGlvbihhcmdzKSB7XG4gIHJldHVybiBbKGFyZ3NbMF0gLyAxMDApICogMjU1LCAoYXJnc1swXSAvIDEwMCkgKiAyNTUsIChhcmdzWzBdIC8gMTAwKSAqIDI1NV07XG59O1xuXG5jb252ZXJzaW9ucy5ncmF5LmhzdiA9IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgcmV0dXJuIFswLCAwLCBhcmdzWzBdXTtcbn07XG5jb252ZXJzaW9ucy5ncmF5LmhzbCA9IGNvbnZlcnNpb25zLmdyYXkuaHN2O1xuXG5jb252ZXJzaW9ucy5ncmF5Lmh3YiA9IGZ1bmN0aW9uKGdyYXkpIHtcbiAgcmV0dXJuIFswLCAxMDAsIGdyYXlbMF1dO1xufTtcblxuY29udmVyc2lvbnMuZ3JheS5jbXlrID0gZnVuY3Rpb24oZ3JheSkge1xuICByZXR1cm4gWzAsIDAsIDAsIGdyYXlbMF1dO1xufTtcblxuY29udmVyc2lvbnMuZ3JheS5sYWIgPSBmdW5jdGlvbihncmF5KSB7XG4gIHJldHVybiBbZ3JheVswXSwgMCwgMF07XG59O1xuXG5jb252ZXJzaW9ucy5ncmF5LmhleCA9IGZ1bmN0aW9uKGdyYXkpIHtcbiAgY29uc3QgdmFsID0gTWF0aC5yb3VuZCgoZ3JheVswXSAvIDEwMCkgKiAyNTUpICYgMHhmZjtcbiAgY29uc3QgaW50ZWdlciA9ICh2YWwgPDwgMTYpICsgKHZhbCA8PCA4KSArIHZhbDtcblxuICBjb25zdCBzdHJpbmcgPSBpbnRlZ2VyLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpO1xuICByZXR1cm4gJzAwMDAwMCcuc3Vic3RyaW5nKHN0cmluZy5sZW5ndGgpICsgc3RyaW5nO1xufTtcblxuY29udmVyc2lvbnMucmdiLmdyYXkgPSBmdW5jdGlvbihyZ2IpIHtcbiAgY29uc3QgdmFsID0gKHJnYlswXSArIHJnYlsxXSArIHJnYlsyXSkgLyAzO1xuICByZXR1cm4gWyh2YWwgLyAyNTUpICogMTAwXTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gY29udmVyc2lvbnM7XG4iLCJjb25zdCBjb252ZXJzaW9ucyA9IHJlcXVpcmUoJy4vY29udmVyc2lvbnMnKTtcbmNvbnN0IHJvdXRlID0gcmVxdWlyZSgnLi9yb3V0ZScpO1xuXG5jb25zdCBjb252ZXJ0ID0ge307XG5cbmNvbnN0IG1vZGVscyA9IE9iamVjdC5rZXlzKGNvbnZlcnNpb25zKTtcblxuZnVuY3Rpb24gd3JhcFJhdyhmbikge1xuICBjb25zdCB3cmFwcGVkRm4gPSBmdW5jdGlvbihhcmdzKSB7XG4gICAgaWYgKGFyZ3MgPT09IHVuZGVmaW5lZCB8fCBhcmdzID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gYXJncztcbiAgICB9XG5cbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIHJldHVybiBmbihhcmdzKTtcbiAgfTtcblxuICAvLyBwcmVzZXJ2ZSAuY29udmVyc2lvbiBwcm9wZXJ0eSBpZiB0aGVyZSBpcyBvbmVcbiAgaWYgKCdjb252ZXJzaW9uJyBpbiBmbikge1xuICAgIHdyYXBwZWRGbi5jb252ZXJzaW9uID0gZm4uY29udmVyc2lvbjtcbiAgfVxuXG4gIHJldHVybiB3cmFwcGVkRm47XG59XG5cbmZ1bmN0aW9uIHdyYXBSb3VuZGVkKGZuKSB7XG4gIGNvbnN0IHdyYXBwZWRGbiA9IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICBpZiAoYXJncyA9PT0gdW5kZWZpbmVkIHx8IGFyZ3MgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBhcmdzO1xuICAgIH1cblxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0ID0gZm4oYXJncyk7XG5cbiAgICAvLyB3ZSdyZSBhc3N1bWluZyB0aGUgcmVzdWx0IGlzIGFuIGFycmF5IGhlcmUuXG4gICAgLy8gc2VlIG5vdGljZSBpbiBjb252ZXJzaW9ucy5qczsgZG9uJ3QgdXNlIGJveCB0eXBlc1xuICAgIC8vIGluIGNvbnZlcnNpb24gZnVuY3Rpb25zLlxuICAgIGlmICh0eXBlb2YgcmVzdWx0ID09PSAnb2JqZWN0Jykge1xuICAgICAgZm9yIChsZXQgbGVuID0gcmVzdWx0Lmxlbmd0aCwgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICByZXN1bHRbaV0gPSBNYXRoLnJvdW5kKHJlc3VsdFtpXSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBwcmVzZXJ2ZSAuY29udmVyc2lvbiBwcm9wZXJ0eSBpZiB0aGVyZSBpcyBvbmVcbiAgaWYgKCdjb252ZXJzaW9uJyBpbiBmbikge1xuICAgIHdyYXBwZWRGbi5jb252ZXJzaW9uID0gZm4uY29udmVyc2lvbjtcbiAgfVxuXG4gIHJldHVybiB3cmFwcGVkRm47XG59XG5cbm1vZGVscy5mb3JFYWNoKGZyb21Nb2RlbCA9PiB7XG4gIGNvbnZlcnRbZnJvbU1vZGVsXSA9IHt9O1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjb252ZXJ0W2Zyb21Nb2RlbF0sICdjaGFubmVscycsIHtcbiAgICB2YWx1ZTogY29udmVyc2lvbnNbZnJvbU1vZGVsXS5jaGFubmVsc1xuICB9KTtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNvbnZlcnRbZnJvbU1vZGVsXSwgJ2xhYmVscycsIHtcbiAgICB2YWx1ZTogY29udmVyc2lvbnNbZnJvbU1vZGVsXS5sYWJlbHNcbiAgfSk7XG5cbiAgY29uc3Qgcm91dGVzID0gcm91dGUoZnJvbU1vZGVsKTtcbiAgY29uc3Qgcm91dGVNb2RlbHMgPSBPYmplY3Qua2V5cyhyb3V0ZXMpO1xuXG4gIHJvdXRlTW9kZWxzLmZvckVhY2godG9Nb2RlbCA9PiB7XG4gICAgY29uc3QgZm4gPSByb3V0ZXNbdG9Nb2RlbF07XG5cbiAgICBjb252ZXJ0W2Zyb21Nb2RlbF1bdG9Nb2RlbF0gPSB3cmFwUm91bmRlZChmbik7XG4gICAgY29udmVydFtmcm9tTW9kZWxdW3RvTW9kZWxdLnJhdyA9IHdyYXBSYXcoZm4pO1xuICB9KTtcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNvbnZlcnQ7XG4iLCJjb25zdCBjb252ZXJzaW9ucyA9IHJlcXVpcmUoJy4vY29udmVyc2lvbnMnKTtcblxuLypcblx0dGhpcyBmdW5jdGlvbiByb3V0ZXMgYSBtb2RlbCB0byBhbGwgb3RoZXIgbW9kZWxzLlxuXG5cdGFsbCBmdW5jdGlvbnMgdGhhdCBhcmUgcm91dGVkIGhhdmUgYSBwcm9wZXJ0eSBgLmNvbnZlcnNpb25gIGF0dGFjaGVkXG5cdHRvIHRoZSByZXR1cm5lZCBzeW50aGV0aWMgZnVuY3Rpb24uIFRoaXMgcHJvcGVydHkgaXMgYW4gYXJyYXlcblx0b2Ygc3RyaW5ncywgZWFjaCB3aXRoIHRoZSBzdGVwcyBpbiBiZXR3ZWVuIHRoZSAnZnJvbScgYW5kICd0bydcblx0Y29sb3IgbW9kZWxzIChpbmNsdXNpdmUpLlxuXG5cdGNvbnZlcnNpb25zIHRoYXQgYXJlIG5vdCBwb3NzaWJsZSBzaW1wbHkgYXJlIG5vdCBpbmNsdWRlZC5cbiovXG5cbmZ1bmN0aW9uIGJ1aWxkR3JhcGgoKSB7XG4gIGNvbnN0IGdyYXBoID0ge307XG4gIC8vIGh0dHBzOi8vanNwZXJmLmNvbS9vYmplY3Qta2V5cy12cy1mb3ItaW4td2l0aC1jbG9zdXJlLzNcbiAgY29uc3QgbW9kZWxzID0gT2JqZWN0LmtleXMoY29udmVyc2lvbnMpO1xuXG4gIGZvciAobGV0IGxlbiA9IG1vZGVscy5sZW5ndGgsIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICBncmFwaFttb2RlbHNbaV1dID0ge1xuICAgICAgLy8gaHR0cDovL2pzcGVyZi5jb20vMS12cy1pbmZpbml0eVxuICAgICAgLy8gbWljcm8tb3B0LCBidXQgdGhpcyBpcyBzaW1wbGUuXG4gICAgICBkaXN0YW5jZTogLTEsXG4gICAgICBwYXJlbnQ6IG51bGxcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIGdyYXBoO1xufVxuXG4vLyBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9CcmVhZHRoLWZpcnN0X3NlYXJjaFxuZnVuY3Rpb24gZGVyaXZlQkZTKGZyb21Nb2RlbCkge1xuICBjb25zdCBncmFwaCA9IGJ1aWxkR3JhcGgoKTtcbiAgY29uc3QgcXVldWUgPSBbZnJvbU1vZGVsXTsgLy8gdW5zaGlmdCAtPiBxdWV1ZSAtPiBwb3BcblxuICBncmFwaFtmcm9tTW9kZWxdLmRpc3RhbmNlID0gMDtcblxuICB3aGlsZSAocXVldWUubGVuZ3RoKSB7XG4gICAgY29uc3QgY3VycmVudCA9IHF1ZXVlLnBvcCgpO1xuICAgIGNvbnN0IGFkamFjZW50cyA9IE9iamVjdC5rZXlzKGNvbnZlcnNpb25zW2N1cnJlbnRdKTtcblxuICAgIGZvciAobGV0IGxlbiA9IGFkamFjZW50cy5sZW5ndGgsIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGNvbnN0IGFkamFjZW50ID0gYWRqYWNlbnRzW2ldO1xuICAgICAgY29uc3Qgbm9kZSA9IGdyYXBoW2FkamFjZW50XTtcblxuICAgICAgaWYgKG5vZGUuZGlzdGFuY2UgPT09IC0xKSB7XG4gICAgICAgIG5vZGUuZGlzdGFuY2UgPSBncmFwaFtjdXJyZW50XS5kaXN0YW5jZSArIDE7XG4gICAgICAgIG5vZGUucGFyZW50ID0gY3VycmVudDtcbiAgICAgICAgcXVldWUudW5zaGlmdChhZGphY2VudCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGdyYXBoO1xufVxuXG5mdW5jdGlvbiBsaW5rKGZyb20sIHRvKSB7XG4gIHJldHVybiBmdW5jdGlvbihhcmdzKSB7XG4gICAgcmV0dXJuIHRvKGZyb20oYXJncykpO1xuICB9O1xufVxuXG5mdW5jdGlvbiB3cmFwQ29udmVyc2lvbih0b01vZGVsLCBncmFwaCkge1xuICBjb25zdCBwYXRoID0gW2dyYXBoW3RvTW9kZWxdLnBhcmVudCwgdG9Nb2RlbF07XG4gIGxldCBmbiA9IGNvbnZlcnNpb25zW2dyYXBoW3RvTW9kZWxdLnBhcmVudF1bdG9Nb2RlbF07XG5cbiAgbGV0IGN1ciA9IGdyYXBoW3RvTW9kZWxdLnBhcmVudDtcbiAgd2hpbGUgKGdyYXBoW2N1cl0ucGFyZW50KSB7XG4gICAgcGF0aC51bnNoaWZ0KGdyYXBoW2N1cl0ucGFyZW50KTtcbiAgICBmbiA9IGxpbmsoY29udmVyc2lvbnNbZ3JhcGhbY3VyXS5wYXJlbnRdW2N1cl0sIGZuKTtcbiAgICBjdXIgPSBncmFwaFtjdXJdLnBhcmVudDtcbiAgfVxuXG4gIGZuLmNvbnZlcnNpb24gPSBwYXRoO1xuICByZXR1cm4gZm47XG59XG5cbmZ1bmN0aW9uIHJvdXRlKGZyb21Nb2RlbCkge1xuICBjb25zdCBncmFwaCA9IGRlcml2ZUJGUyhmcm9tTW9kZWwpO1xuICBjb25zdCBjb252ZXJzaW9uID0ge307XG5cbiAgY29uc3QgbW9kZWxzID0gT2JqZWN0LmtleXMoZ3JhcGgpO1xuICBmb3IgKGxldCBsZW4gPSBtb2RlbHMubGVuZ3RoLCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgY29uc3QgdG9Nb2RlbCA9IG1vZGVsc1tpXTtcbiAgICBjb25zdCBub2RlID0gZ3JhcGhbdG9Nb2RlbF07XG5cbiAgICBpZiAobm9kZS5wYXJlbnQgPT09IG51bGwpIHtcbiAgICAgIC8vIG5vIHBvc3NpYmxlIGNvbnZlcnNpb24sIG9yIHRoaXMgbm9kZSBpcyB0aGUgc291cmNlIG1vZGVsLlxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29udmVyc2lvblt0b01vZGVsXSA9IHdyYXBDb252ZXJzaW9uKHRvTW9kZWwsIGdyYXBoKTtcbiAgfVxuXG4gIHJldHVybiBjb252ZXJzaW9uO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJvdXRlO1xuIiwiJ3VzZSBzdHJpY3QnXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHRcImFsaWNlYmx1ZVwiOiBbMjQwLCAyNDgsIDI1NV0sXHJcblx0XCJhbnRpcXVld2hpdGVcIjogWzI1MCwgMjM1LCAyMTVdLFxyXG5cdFwiYXF1YVwiOiBbMCwgMjU1LCAyNTVdLFxyXG5cdFwiYXF1YW1hcmluZVwiOiBbMTI3LCAyNTUsIDIxMl0sXHJcblx0XCJhenVyZVwiOiBbMjQwLCAyNTUsIDI1NV0sXHJcblx0XCJiZWlnZVwiOiBbMjQ1LCAyNDUsIDIyMF0sXHJcblx0XCJiaXNxdWVcIjogWzI1NSwgMjI4LCAxOTZdLFxyXG5cdFwiYmxhY2tcIjogWzAsIDAsIDBdLFxyXG5cdFwiYmxhbmNoZWRhbG1vbmRcIjogWzI1NSwgMjM1LCAyMDVdLFxyXG5cdFwiYmx1ZVwiOiBbMCwgMCwgMjU1XSxcclxuXHRcImJsdWV2aW9sZXRcIjogWzEzOCwgNDMsIDIyNl0sXHJcblx0XCJicm93blwiOiBbMTY1LCA0MiwgNDJdLFxyXG5cdFwiYnVybHl3b29kXCI6IFsyMjIsIDE4NCwgMTM1XSxcclxuXHRcImNhZGV0Ymx1ZVwiOiBbOTUsIDE1OCwgMTYwXSxcclxuXHRcImNoYXJ0cmV1c2VcIjogWzEyNywgMjU1LCAwXSxcclxuXHRcImNob2NvbGF0ZVwiOiBbMjEwLCAxMDUsIDMwXSxcclxuXHRcImNvcmFsXCI6IFsyNTUsIDEyNywgODBdLFxyXG5cdFwiY29ybmZsb3dlcmJsdWVcIjogWzEwMCwgMTQ5LCAyMzddLFxyXG5cdFwiY29ybnNpbGtcIjogWzI1NSwgMjQ4LCAyMjBdLFxyXG5cdFwiY3JpbXNvblwiOiBbMjIwLCAyMCwgNjBdLFxyXG5cdFwiY3lhblwiOiBbMCwgMjU1LCAyNTVdLFxyXG5cdFwiZGFya2JsdWVcIjogWzAsIDAsIDEzOV0sXHJcblx0XCJkYXJrY3lhblwiOiBbMCwgMTM5LCAxMzldLFxyXG5cdFwiZGFya2dvbGRlbnJvZFwiOiBbMTg0LCAxMzQsIDExXSxcclxuXHRcImRhcmtncmF5XCI6IFsxNjksIDE2OSwgMTY5XSxcclxuXHRcImRhcmtncmVlblwiOiBbMCwgMTAwLCAwXSxcclxuXHRcImRhcmtncmV5XCI6IFsxNjksIDE2OSwgMTY5XSxcclxuXHRcImRhcmtraGFraVwiOiBbMTg5LCAxODMsIDEwN10sXHJcblx0XCJkYXJrbWFnZW50YVwiOiBbMTM5LCAwLCAxMzldLFxyXG5cdFwiZGFya29saXZlZ3JlZW5cIjogWzg1LCAxMDcsIDQ3XSxcclxuXHRcImRhcmtvcmFuZ2VcIjogWzI1NSwgMTQwLCAwXSxcclxuXHRcImRhcmtvcmNoaWRcIjogWzE1MywgNTAsIDIwNF0sXHJcblx0XCJkYXJrcmVkXCI6IFsxMzksIDAsIDBdLFxyXG5cdFwiZGFya3NhbG1vblwiOiBbMjMzLCAxNTAsIDEyMl0sXHJcblx0XCJkYXJrc2VhZ3JlZW5cIjogWzE0MywgMTg4LCAxNDNdLFxyXG5cdFwiZGFya3NsYXRlYmx1ZVwiOiBbNzIsIDYxLCAxMzldLFxyXG5cdFwiZGFya3NsYXRlZ3JheVwiOiBbNDcsIDc5LCA3OV0sXHJcblx0XCJkYXJrc2xhdGVncmV5XCI6IFs0NywgNzksIDc5XSxcclxuXHRcImRhcmt0dXJxdW9pc2VcIjogWzAsIDIwNiwgMjA5XSxcclxuXHRcImRhcmt2aW9sZXRcIjogWzE0OCwgMCwgMjExXSxcclxuXHRcImRlZXBwaW5rXCI6IFsyNTUsIDIwLCAxNDddLFxyXG5cdFwiZGVlcHNreWJsdWVcIjogWzAsIDE5MSwgMjU1XSxcclxuXHRcImRpbWdyYXlcIjogWzEwNSwgMTA1LCAxMDVdLFxyXG5cdFwiZGltZ3JleVwiOiBbMTA1LCAxMDUsIDEwNV0sXHJcblx0XCJkb2RnZXJibHVlXCI6IFszMCwgMTQ0LCAyNTVdLFxyXG5cdFwiZmlyZWJyaWNrXCI6IFsxNzgsIDM0LCAzNF0sXHJcblx0XCJmbG9yYWx3aGl0ZVwiOiBbMjU1LCAyNTAsIDI0MF0sXHJcblx0XCJmb3Jlc3RncmVlblwiOiBbMzQsIDEzOSwgMzRdLFxyXG5cdFwiZnVjaHNpYVwiOiBbMjU1LCAwLCAyNTVdLFxyXG5cdFwiZ2FpbnNib3JvXCI6IFsyMjAsIDIyMCwgMjIwXSxcclxuXHRcImdob3N0d2hpdGVcIjogWzI0OCwgMjQ4LCAyNTVdLFxyXG5cdFwiZ29sZFwiOiBbMjU1LCAyMTUsIDBdLFxyXG5cdFwiZ29sZGVucm9kXCI6IFsyMTgsIDE2NSwgMzJdLFxyXG5cdFwiZ3JheVwiOiBbMTI4LCAxMjgsIDEyOF0sXHJcblx0XCJncmVlblwiOiBbMCwgMTI4LCAwXSxcclxuXHRcImdyZWVueWVsbG93XCI6IFsxNzMsIDI1NSwgNDddLFxyXG5cdFwiZ3JleVwiOiBbMTI4LCAxMjgsIDEyOF0sXHJcblx0XCJob25leWRld1wiOiBbMjQwLCAyNTUsIDI0MF0sXHJcblx0XCJob3RwaW5rXCI6IFsyNTUsIDEwNSwgMTgwXSxcclxuXHRcImluZGlhbnJlZFwiOiBbMjA1LCA5MiwgOTJdLFxyXG5cdFwiaW5kaWdvXCI6IFs3NSwgMCwgMTMwXSxcclxuXHRcIml2b3J5XCI6IFsyNTUsIDI1NSwgMjQwXSxcclxuXHRcImtoYWtpXCI6IFsyNDAsIDIzMCwgMTQwXSxcclxuXHRcImxhdmVuZGVyXCI6IFsyMzAsIDIzMCwgMjUwXSxcclxuXHRcImxhdmVuZGVyYmx1c2hcIjogWzI1NSwgMjQwLCAyNDVdLFxyXG5cdFwibGF3bmdyZWVuXCI6IFsxMjQsIDI1MiwgMF0sXHJcblx0XCJsZW1vbmNoaWZmb25cIjogWzI1NSwgMjUwLCAyMDVdLFxyXG5cdFwibGlnaHRibHVlXCI6IFsxNzMsIDIxNiwgMjMwXSxcclxuXHRcImxpZ2h0Y29yYWxcIjogWzI0MCwgMTI4LCAxMjhdLFxyXG5cdFwibGlnaHRjeWFuXCI6IFsyMjQsIDI1NSwgMjU1XSxcclxuXHRcImxpZ2h0Z29sZGVucm9keWVsbG93XCI6IFsyNTAsIDI1MCwgMjEwXSxcclxuXHRcImxpZ2h0Z3JheVwiOiBbMjExLCAyMTEsIDIxMV0sXHJcblx0XCJsaWdodGdyZWVuXCI6IFsxNDQsIDIzOCwgMTQ0XSxcclxuXHRcImxpZ2h0Z3JleVwiOiBbMjExLCAyMTEsIDIxMV0sXHJcblx0XCJsaWdodHBpbmtcIjogWzI1NSwgMTgyLCAxOTNdLFxyXG5cdFwibGlnaHRzYWxtb25cIjogWzI1NSwgMTYwLCAxMjJdLFxyXG5cdFwibGlnaHRzZWFncmVlblwiOiBbMzIsIDE3OCwgMTcwXSxcclxuXHRcImxpZ2h0c2t5Ymx1ZVwiOiBbMTM1LCAyMDYsIDI1MF0sXHJcblx0XCJsaWdodHNsYXRlZ3JheVwiOiBbMTE5LCAxMzYsIDE1M10sXHJcblx0XCJsaWdodHNsYXRlZ3JleVwiOiBbMTE5LCAxMzYsIDE1M10sXHJcblx0XCJsaWdodHN0ZWVsYmx1ZVwiOiBbMTc2LCAxOTYsIDIyMl0sXHJcblx0XCJsaWdodHllbGxvd1wiOiBbMjU1LCAyNTUsIDIyNF0sXHJcblx0XCJsaW1lXCI6IFswLCAyNTUsIDBdLFxyXG5cdFwibGltZWdyZWVuXCI6IFs1MCwgMjA1LCA1MF0sXHJcblx0XCJsaW5lblwiOiBbMjUwLCAyNDAsIDIzMF0sXHJcblx0XCJtYWdlbnRhXCI6IFsyNTUsIDAsIDI1NV0sXHJcblx0XCJtYXJvb25cIjogWzEyOCwgMCwgMF0sXHJcblx0XCJtZWRpdW1hcXVhbWFyaW5lXCI6IFsxMDIsIDIwNSwgMTcwXSxcclxuXHRcIm1lZGl1bWJsdWVcIjogWzAsIDAsIDIwNV0sXHJcblx0XCJtZWRpdW1vcmNoaWRcIjogWzE4NiwgODUsIDIxMV0sXHJcblx0XCJtZWRpdW1wdXJwbGVcIjogWzE0NywgMTEyLCAyMTldLFxyXG5cdFwibWVkaXVtc2VhZ3JlZW5cIjogWzYwLCAxNzksIDExM10sXHJcblx0XCJtZWRpdW1zbGF0ZWJsdWVcIjogWzEyMywgMTA0LCAyMzhdLFxyXG5cdFwibWVkaXVtc3ByaW5nZ3JlZW5cIjogWzAsIDI1MCwgMTU0XSxcclxuXHRcIm1lZGl1bXR1cnF1b2lzZVwiOiBbNzIsIDIwOSwgMjA0XSxcclxuXHRcIm1lZGl1bXZpb2xldHJlZFwiOiBbMTk5LCAyMSwgMTMzXSxcclxuXHRcIm1pZG5pZ2h0Ymx1ZVwiOiBbMjUsIDI1LCAxMTJdLFxyXG5cdFwibWludGNyZWFtXCI6IFsyNDUsIDI1NSwgMjUwXSxcclxuXHRcIm1pc3R5cm9zZVwiOiBbMjU1LCAyMjgsIDIyNV0sXHJcblx0XCJtb2NjYXNpblwiOiBbMjU1LCAyMjgsIDE4MV0sXHJcblx0XCJuYXZham93aGl0ZVwiOiBbMjU1LCAyMjIsIDE3M10sXHJcblx0XCJuYXZ5XCI6IFswLCAwLCAxMjhdLFxyXG5cdFwib2xkbGFjZVwiOiBbMjUzLCAyNDUsIDIzMF0sXHJcblx0XCJvbGl2ZVwiOiBbMTI4LCAxMjgsIDBdLFxyXG5cdFwib2xpdmVkcmFiXCI6IFsxMDcsIDE0MiwgMzVdLFxyXG5cdFwib3JhbmdlXCI6IFsyNTUsIDE2NSwgMF0sXHJcblx0XCJvcmFuZ2VyZWRcIjogWzI1NSwgNjksIDBdLFxyXG5cdFwib3JjaGlkXCI6IFsyMTgsIDExMiwgMjE0XSxcclxuXHRcInBhbGVnb2xkZW5yb2RcIjogWzIzOCwgMjMyLCAxNzBdLFxyXG5cdFwicGFsZWdyZWVuXCI6IFsxNTIsIDI1MSwgMTUyXSxcclxuXHRcInBhbGV0dXJxdW9pc2VcIjogWzE3NSwgMjM4LCAyMzhdLFxyXG5cdFwicGFsZXZpb2xldHJlZFwiOiBbMjE5LCAxMTIsIDE0N10sXHJcblx0XCJwYXBheWF3aGlwXCI6IFsyNTUsIDIzOSwgMjEzXSxcclxuXHRcInBlYWNocHVmZlwiOiBbMjU1LCAyMTgsIDE4NV0sXHJcblx0XCJwZXJ1XCI6IFsyMDUsIDEzMywgNjNdLFxyXG5cdFwicGlua1wiOiBbMjU1LCAxOTIsIDIwM10sXHJcblx0XCJwbHVtXCI6IFsyMjEsIDE2MCwgMjIxXSxcclxuXHRcInBvd2RlcmJsdWVcIjogWzE3NiwgMjI0LCAyMzBdLFxyXG5cdFwicHVycGxlXCI6IFsxMjgsIDAsIDEyOF0sXHJcblx0XCJyZWJlY2NhcHVycGxlXCI6IFsxMDIsIDUxLCAxNTNdLFxyXG5cdFwicmVkXCI6IFsyNTUsIDAsIDBdLFxyXG5cdFwicm9zeWJyb3duXCI6IFsxODgsIDE0MywgMTQzXSxcclxuXHRcInJveWFsYmx1ZVwiOiBbNjUsIDEwNSwgMjI1XSxcclxuXHRcInNhZGRsZWJyb3duXCI6IFsxMzksIDY5LCAxOV0sXHJcblx0XCJzYWxtb25cIjogWzI1MCwgMTI4LCAxMTRdLFxyXG5cdFwic2FuZHlicm93blwiOiBbMjQ0LCAxNjQsIDk2XSxcclxuXHRcInNlYWdyZWVuXCI6IFs0NiwgMTM5LCA4N10sXHJcblx0XCJzZWFzaGVsbFwiOiBbMjU1LCAyNDUsIDIzOF0sXHJcblx0XCJzaWVubmFcIjogWzE2MCwgODIsIDQ1XSxcclxuXHRcInNpbHZlclwiOiBbMTkyLCAxOTIsIDE5Ml0sXHJcblx0XCJza3libHVlXCI6IFsxMzUsIDIwNiwgMjM1XSxcclxuXHRcInNsYXRlYmx1ZVwiOiBbMTA2LCA5MCwgMjA1XSxcclxuXHRcInNsYXRlZ3JheVwiOiBbMTEyLCAxMjgsIDE0NF0sXHJcblx0XCJzbGF0ZWdyZXlcIjogWzExMiwgMTI4LCAxNDRdLFxyXG5cdFwic25vd1wiOiBbMjU1LCAyNTAsIDI1MF0sXHJcblx0XCJzcHJpbmdncmVlblwiOiBbMCwgMjU1LCAxMjddLFxyXG5cdFwic3RlZWxibHVlXCI6IFs3MCwgMTMwLCAxODBdLFxyXG5cdFwidGFuXCI6IFsyMTAsIDE4MCwgMTQwXSxcclxuXHRcInRlYWxcIjogWzAsIDEyOCwgMTI4XSxcclxuXHRcInRoaXN0bGVcIjogWzIxNiwgMTkxLCAyMTZdLFxyXG5cdFwidG9tYXRvXCI6IFsyNTUsIDk5LCA3MV0sXHJcblx0XCJ0dXJxdW9pc2VcIjogWzY0LCAyMjQsIDIwOF0sXHJcblx0XCJ2aW9sZXRcIjogWzIzOCwgMTMwLCAyMzhdLFxyXG5cdFwid2hlYXRcIjogWzI0NSwgMjIyLCAxNzldLFxyXG5cdFwid2hpdGVcIjogWzI1NSwgMjU1LCAyNTVdLFxyXG5cdFwid2hpdGVzbW9rZVwiOiBbMjQ1LCAyNDUsIDI0NV0sXHJcblx0XCJ5ZWxsb3dcIjogWzI1NSwgMjU1LCAwXSxcclxuXHRcInllbGxvd2dyZWVuXCI6IFsxNTQsIDIwNSwgNTBdXHJcbn07XHJcbiIsIm1vZHVsZS5leHBvcnRzPXtcbiAgXCJPX1JET05MWVwiOiAwLFxuICBcIk9fV1JPTkxZXCI6IDEsXG4gIFwiT19SRFdSXCI6IDIsXG4gIFwiU19JRk1UXCI6IDYxNDQwLFxuICBcIlNfSUZSRUdcIjogMzI3NjgsXG4gIFwiU19JRkRJUlwiOiAxNjM4NCxcbiAgXCJTX0lGQ0hSXCI6IDgxOTIsXG4gIFwiU19JRkJMS1wiOiAyNDU3NixcbiAgXCJTX0lGSUZPXCI6IDQwOTYsXG4gIFwiU19JRkxOS1wiOiA0MDk2MCxcbiAgXCJTX0lGU09DS1wiOiA0OTE1MixcbiAgXCJPX0NSRUFUXCI6IDUxMixcbiAgXCJPX0VYQ0xcIjogMjA0OCxcbiAgXCJPX05PQ1RUWVwiOiAxMzEwNzIsXG4gIFwiT19UUlVOQ1wiOiAxMDI0LFxuICBcIk9fQVBQRU5EXCI6IDgsXG4gIFwiT19ESVJFQ1RPUllcIjogMTA0ODU3NixcbiAgXCJPX05PRk9MTE9XXCI6IDI1NixcbiAgXCJPX1NZTkNcIjogMTI4LFxuICBcIk9fU1lNTElOS1wiOiAyMDk3MTUyLFxuICBcIk9fTk9OQkxPQ0tcIjogNCxcbiAgXCJTX0lSV1hVXCI6IDQ0OCxcbiAgXCJTX0lSVVNSXCI6IDI1NixcbiAgXCJTX0lXVVNSXCI6IDEyOCxcbiAgXCJTX0lYVVNSXCI6IDY0LFxuICBcIlNfSVJXWEdcIjogNTYsXG4gIFwiU19JUkdSUFwiOiAzMixcbiAgXCJTX0lXR1JQXCI6IDE2LFxuICBcIlNfSVhHUlBcIjogOCxcbiAgXCJTX0lSV1hPXCI6IDcsXG4gIFwiU19JUk9USFwiOiA0LFxuICBcIlNfSVdPVEhcIjogMixcbiAgXCJTX0lYT1RIXCI6IDEsXG4gIFwiRTJCSUdcIjogNyxcbiAgXCJFQUNDRVNcIjogMTMsXG4gIFwiRUFERFJJTlVTRVwiOiA0OCxcbiAgXCJFQUREUk5PVEFWQUlMXCI6IDQ5LFxuICBcIkVBRk5PU1VQUE9SVFwiOiA0NyxcbiAgXCJFQUdBSU5cIjogMzUsXG4gIFwiRUFMUkVBRFlcIjogMzcsXG4gIFwiRUJBREZcIjogOSxcbiAgXCJFQkFETVNHXCI6IDk0LFxuICBcIkVCVVNZXCI6IDE2LFxuICBcIkVDQU5DRUxFRFwiOiA4OSxcbiAgXCJFQ0hJTERcIjogMTAsXG4gIFwiRUNPTk5BQk9SVEVEXCI6IDUzLFxuICBcIkVDT05OUkVGVVNFRFwiOiA2MSxcbiAgXCJFQ09OTlJFU0VUXCI6IDU0LFxuICBcIkVERUFETEtcIjogMTEsXG4gIFwiRURFU1RBRERSUkVRXCI6IDM5LFxuICBcIkVET01cIjogMzMsXG4gIFwiRURRVU9UXCI6IDY5LFxuICBcIkVFWElTVFwiOiAxNyxcbiAgXCJFRkFVTFRcIjogMTQsXG4gIFwiRUZCSUdcIjogMjcsXG4gIFwiRUhPU1RVTlJFQUNIXCI6IDY1LFxuICBcIkVJRFJNXCI6IDkwLFxuICBcIkVJTFNFUVwiOiA5MixcbiAgXCJFSU5QUk9HUkVTU1wiOiAzNixcbiAgXCJFSU5UUlwiOiA0LFxuICBcIkVJTlZBTFwiOiAyMixcbiAgXCJFSU9cIjogNSxcbiAgXCJFSVNDT05OXCI6IDU2LFxuICBcIkVJU0RJUlwiOiAyMSxcbiAgXCJFTE9PUFwiOiA2MixcbiAgXCJFTUZJTEVcIjogMjQsXG4gIFwiRU1MSU5LXCI6IDMxLFxuICBcIkVNU0dTSVpFXCI6IDQwLFxuICBcIkVNVUxUSUhPUFwiOiA5NSxcbiAgXCJFTkFNRVRPT0xPTkdcIjogNjMsXG4gIFwiRU5FVERPV05cIjogNTAsXG4gIFwiRU5FVFJFU0VUXCI6IDUyLFxuICBcIkVORVRVTlJFQUNIXCI6IDUxLFxuICBcIkVORklMRVwiOiAyMyxcbiAgXCJFTk9CVUZTXCI6IDU1LFxuICBcIkVOT0RBVEFcIjogOTYsXG4gIFwiRU5PREVWXCI6IDE5LFxuICBcIkVOT0VOVFwiOiAyLFxuICBcIkVOT0VYRUNcIjogOCxcbiAgXCJFTk9MQ0tcIjogNzcsXG4gIFwiRU5PTElOS1wiOiA5NyxcbiAgXCJFTk9NRU1cIjogMTIsXG4gIFwiRU5PTVNHXCI6IDkxLFxuICBcIkVOT1BST1RPT1BUXCI6IDQyLFxuICBcIkVOT1NQQ1wiOiAyOCxcbiAgXCJFTk9TUlwiOiA5OCxcbiAgXCJFTk9TVFJcIjogOTksXG4gIFwiRU5PU1lTXCI6IDc4LFxuICBcIkVOT1RDT05OXCI6IDU3LFxuICBcIkVOT1RESVJcIjogMjAsXG4gIFwiRU5PVEVNUFRZXCI6IDY2LFxuICBcIkVOT1RTT0NLXCI6IDM4LFxuICBcIkVOT1RTVVBcIjogNDUsXG4gIFwiRU5PVFRZXCI6IDI1LFxuICBcIkVOWElPXCI6IDYsXG4gIFwiRU9QTk9UU1VQUFwiOiAxMDIsXG4gIFwiRU9WRVJGTE9XXCI6IDg0LFxuICBcIkVQRVJNXCI6IDEsXG4gIFwiRVBJUEVcIjogMzIsXG4gIFwiRVBST1RPXCI6IDEwMCxcbiAgXCJFUFJPVE9OT1NVUFBPUlRcIjogNDMsXG4gIFwiRVBST1RPVFlQRVwiOiA0MSxcbiAgXCJFUkFOR0VcIjogMzQsXG4gIFwiRVJPRlNcIjogMzAsXG4gIFwiRVNQSVBFXCI6IDI5LFxuICBcIkVTUkNIXCI6IDMsXG4gIFwiRVNUQUxFXCI6IDcwLFxuICBcIkVUSU1FXCI6IDEwMSxcbiAgXCJFVElNRURPVVRcIjogNjAsXG4gIFwiRVRYVEJTWVwiOiAyNixcbiAgXCJFV09VTERCTE9DS1wiOiAzNSxcbiAgXCJFWERFVlwiOiAxOCxcbiAgXCJTSUdIVVBcIjogMSxcbiAgXCJTSUdJTlRcIjogMixcbiAgXCJTSUdRVUlUXCI6IDMsXG4gIFwiU0lHSUxMXCI6IDQsXG4gIFwiU0lHVFJBUFwiOiA1LFxuICBcIlNJR0FCUlRcIjogNixcbiAgXCJTSUdJT1RcIjogNixcbiAgXCJTSUdCVVNcIjogMTAsXG4gIFwiU0lHRlBFXCI6IDgsXG4gIFwiU0lHS0lMTFwiOiA5LFxuICBcIlNJR1VTUjFcIjogMzAsXG4gIFwiU0lHU0VHVlwiOiAxMSxcbiAgXCJTSUdVU1IyXCI6IDMxLFxuICBcIlNJR1BJUEVcIjogMTMsXG4gIFwiU0lHQUxSTVwiOiAxNCxcbiAgXCJTSUdURVJNXCI6IDE1LFxuICBcIlNJR0NITERcIjogMjAsXG4gIFwiU0lHQ09OVFwiOiAxOSxcbiAgXCJTSUdTVE9QXCI6IDE3LFxuICBcIlNJR1RTVFBcIjogMTgsXG4gIFwiU0lHVFRJTlwiOiAyMSxcbiAgXCJTSUdUVE9VXCI6IDIyLFxuICBcIlNJR1VSR1wiOiAxNixcbiAgXCJTSUdYQ1BVXCI6IDI0LFxuICBcIlNJR1hGU1pcIjogMjUsXG4gIFwiU0lHVlRBTFJNXCI6IDI2LFxuICBcIlNJR1BST0ZcIjogMjcsXG4gIFwiU0lHV0lOQ0hcIjogMjgsXG4gIFwiU0lHSU9cIjogMjMsXG4gIFwiU0lHU1lTXCI6IDEyLFxuICBcIlNTTF9PUF9BTExcIjogMjE0NzQ4NjcxOSxcbiAgXCJTU0xfT1BfQUxMT1dfVU5TQUZFX0xFR0FDWV9SRU5FR09USUFUSU9OXCI6IDI2MjE0NCxcbiAgXCJTU0xfT1BfQ0lQSEVSX1NFUlZFUl9QUkVGRVJFTkNFXCI6IDQxOTQzMDQsXG4gIFwiU1NMX09QX0NJU0NPX0FOWUNPTk5FQ1RcIjogMzI3NjgsXG4gIFwiU1NMX09QX0NPT0tJRV9FWENIQU5HRVwiOiA4MTkyLFxuICBcIlNTTF9PUF9DUllQVE9QUk9fVExTRVhUX0JVR1wiOiAyMTQ3NDgzNjQ4LFxuICBcIlNTTF9PUF9ET05UX0lOU0VSVF9FTVBUWV9GUkFHTUVOVFNcIjogMjA0OCxcbiAgXCJTU0xfT1BfRVBIRU1FUkFMX1JTQVwiOiAwLFxuICBcIlNTTF9PUF9MRUdBQ1lfU0VSVkVSX0NPTk5FQ1RcIjogNCxcbiAgXCJTU0xfT1BfTUlDUk9TT0ZUX0JJR19TU0xWM19CVUZGRVJcIjogMzIsXG4gIFwiU1NMX09QX01JQ1JPU09GVF9TRVNTX0lEX0JVR1wiOiAxLFxuICBcIlNTTF9PUF9NU0lFX1NTTFYyX1JTQV9QQURESU5HXCI6IDAsXG4gIFwiU1NMX09QX05FVFNDQVBFX0NBX0ROX0JVR1wiOiA1MzY4NzA5MTIsXG4gIFwiU1NMX09QX05FVFNDQVBFX0NIQUxMRU5HRV9CVUdcIjogMixcbiAgXCJTU0xfT1BfTkVUU0NBUEVfREVNT19DSVBIRVJfQ0hBTkdFX0JVR1wiOiAxMDczNzQxODI0LFxuICBcIlNTTF9PUF9ORVRTQ0FQRV9SRVVTRV9DSVBIRVJfQ0hBTkdFX0JVR1wiOiA4LFxuICBcIlNTTF9PUF9OT19DT01QUkVTU0lPTlwiOiAxMzEwNzIsXG4gIFwiU1NMX09QX05PX1FVRVJZX01UVVwiOiA0MDk2LFxuICBcIlNTTF9PUF9OT19TRVNTSU9OX1JFU1VNUFRJT05fT05fUkVORUdPVElBVElPTlwiOiA2NTUzNixcbiAgXCJTU0xfT1BfTk9fU1NMdjJcIjogMTY3NzcyMTYsXG4gIFwiU1NMX09QX05PX1NTTHYzXCI6IDMzNTU0NDMyLFxuICBcIlNTTF9PUF9OT19USUNLRVRcIjogMTYzODQsXG4gIFwiU1NMX09QX05PX1RMU3YxXCI6IDY3MTA4ODY0LFxuICBcIlNTTF9PUF9OT19UTFN2MV8xXCI6IDI2ODQzNTQ1NixcbiAgXCJTU0xfT1BfTk9fVExTdjFfMlwiOiAxMzQyMTc3MjgsXG4gIFwiU1NMX09QX1BLQ1MxX0NIRUNLXzFcIjogMCxcbiAgXCJTU0xfT1BfUEtDUzFfQ0hFQ0tfMlwiOiAwLFxuICBcIlNTTF9PUF9TSU5HTEVfREhfVVNFXCI6IDEwNDg1NzYsXG4gIFwiU1NMX09QX1NJTkdMRV9FQ0RIX1VTRVwiOiA1MjQyODgsXG4gIFwiU1NMX09QX1NTTEVBWV8wODBfQ0xJRU5UX0RIX0JVR1wiOiAxMjgsXG4gIFwiU1NMX09QX1NTTFJFRjJfUkVVU0VfQ0VSVF9UWVBFX0JVR1wiOiAwLFxuICBcIlNTTF9PUF9UTFNfQkxPQ0tfUEFERElOR19CVUdcIjogNTEyLFxuICBcIlNTTF9PUF9UTFNfRDVfQlVHXCI6IDI1NixcbiAgXCJTU0xfT1BfVExTX1JPTExCQUNLX0JVR1wiOiA4Mzg4NjA4LFxuICBcIkVOR0lORV9NRVRIT0RfRFNBXCI6IDIsXG4gIFwiRU5HSU5FX01FVEhPRF9ESFwiOiA0LFxuICBcIkVOR0lORV9NRVRIT0RfUkFORFwiOiA4LFxuICBcIkVOR0lORV9NRVRIT0RfRUNESFwiOiAxNixcbiAgXCJFTkdJTkVfTUVUSE9EX0VDRFNBXCI6IDMyLFxuICBcIkVOR0lORV9NRVRIT0RfQ0lQSEVSU1wiOiA2NCxcbiAgXCJFTkdJTkVfTUVUSE9EX0RJR0VTVFNcIjogMTI4LFxuICBcIkVOR0lORV9NRVRIT0RfU1RPUkVcIjogMjU2LFxuICBcIkVOR0lORV9NRVRIT0RfUEtFWV9NRVRIU1wiOiA1MTIsXG4gIFwiRU5HSU5FX01FVEhPRF9QS0VZX0FTTjFfTUVUSFNcIjogMTAyNCxcbiAgXCJFTkdJTkVfTUVUSE9EX0FMTFwiOiA2NTUzNSxcbiAgXCJFTkdJTkVfTUVUSE9EX05PTkVcIjogMCxcbiAgXCJESF9DSEVDS19QX05PVF9TQUZFX1BSSU1FXCI6IDIsXG4gIFwiREhfQ0hFQ0tfUF9OT1RfUFJJTUVcIjogMSxcbiAgXCJESF9VTkFCTEVfVE9fQ0hFQ0tfR0VORVJBVE9SXCI6IDQsXG4gIFwiREhfTk9UX1NVSVRBQkxFX0dFTkVSQVRPUlwiOiA4LFxuICBcIk5QTl9FTkFCTEVEXCI6IDEsXG4gIFwiUlNBX1BLQ1MxX1BBRERJTkdcIjogMSxcbiAgXCJSU0FfU1NMVjIzX1BBRERJTkdcIjogMixcbiAgXCJSU0FfTk9fUEFERElOR1wiOiAzLFxuICBcIlJTQV9QS0NTMV9PQUVQX1BBRERJTkdcIjogNCxcbiAgXCJSU0FfWDkzMV9QQURESU5HXCI6IDUsXG4gIFwiUlNBX1BLQ1MxX1BTU19QQURESU5HXCI6IDYsXG4gIFwiUE9JTlRfQ09OVkVSU0lPTl9DT01QUkVTU0VEXCI6IDIsXG4gIFwiUE9JTlRfQ09OVkVSU0lPTl9VTkNPTVBSRVNTRURcIjogNCxcbiAgXCJQT0lOVF9DT05WRVJTSU9OX0hZQlJJRFwiOiA2LFxuICBcIkZfT0tcIjogMCxcbiAgXCJSX09LXCI6IDQsXG4gIFwiV19PS1wiOiAyLFxuICBcIlhfT0tcIjogMSxcbiAgXCJVVl9VRFBfUkVVU0VBRERSXCI6IDRcbn1cbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4vLyBOT1RFOiBUaGVzZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9ucyBpbnRlbnRpb25hbGx5IGRvbid0IHVzZSBgaW5zdGFuY2VvZmBcbi8vIGJlY2F1c2UgaXQgaXMgZnJhZ2lsZSBhbmQgY2FuIGJlIGVhc2lseSBmYWtlZCB3aXRoIGBPYmplY3QuY3JlYXRlKClgLlxuXG5mdW5jdGlvbiBpc0FycmF5KGFyZykge1xuICBpZiAoQXJyYXkuaXNBcnJheSkge1xuICAgIHJldHVybiBBcnJheS5pc0FycmF5KGFyZyk7XG4gIH1cbiAgcmV0dXJuIG9iamVjdFRvU3RyaW5nKGFyZykgPT09ICdbb2JqZWN0IEFycmF5XSc7XG59XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnYm9vbGVhbic7XG59XG5leHBvcnRzLmlzQm9vbGVhbiA9IGlzQm9vbGVhbjtcblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGwgPSBpc051bGw7XG5cbmZ1bmN0aW9uIGlzTnVsbE9yVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbE9yVW5kZWZpbmVkID0gaXNOdWxsT3JVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5leHBvcnRzLmlzTnVtYmVyID0gaXNOdW1iZXI7XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5leHBvcnRzLmlzU3RyaW5nID0gaXNTdHJpbmc7XG5cbmZ1bmN0aW9uIGlzU3ltYm9sKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCc7XG59XG5leHBvcnRzLmlzU3ltYm9sID0gaXNTeW1ib2w7XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG5leHBvcnRzLmlzVW5kZWZpbmVkID0gaXNVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBvYmplY3RUb1N0cmluZyhyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufVxuZXhwb3J0cy5pc1JlZ0V4cCA9IGlzUmVnRXhwO1xuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNPYmplY3QgPSBpc09iamVjdDtcblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgcmV0dXJuIG9iamVjdFRvU3RyaW5nKGQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5leHBvcnRzLmlzRGF0ZSA9IGlzRGF0ZTtcblxuZnVuY3Rpb24gaXNFcnJvcihlKSB7XG4gIHJldHVybiAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSBCdWZmZXIuaXNCdWZmZXI7XG5cbmZ1bmN0aW9uIG9iamVjdFRvU3RyaW5nKG8pIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKTtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgaXNBcnJheWlzaCA9IHJlcXVpcmUoJ2lzLWFycmF5aXNoJyk7XG5cbnZhciBlcnJvckV4ID0gZnVuY3Rpb24gZXJyb3JFeChuYW1lLCBwcm9wZXJ0aWVzKSB7XG5cdGlmICghbmFtZSB8fCBuYW1lLmNvbnN0cnVjdG9yICE9PSBTdHJpbmcpIHtcblx0XHRwcm9wZXJ0aWVzID0gbmFtZSB8fCB7fTtcblx0XHRuYW1lID0gRXJyb3IubmFtZTtcblx0fVxuXG5cdHZhciBlcnJvckV4RXJyb3IgPSBmdW5jdGlvbiBFcnJvckVYRXJyb3IobWVzc2FnZSkge1xuXHRcdGlmICghdGhpcykge1xuXHRcdFx0cmV0dXJuIG5ldyBFcnJvckVYRXJyb3IobWVzc2FnZSk7XG5cdFx0fVxuXG5cdFx0bWVzc2FnZSA9IG1lc3NhZ2UgaW5zdGFuY2VvZiBFcnJvclxuXHRcdFx0PyBtZXNzYWdlLm1lc3NhZ2Vcblx0XHRcdDogKG1lc3NhZ2UgfHwgdGhpcy5tZXNzYWdlKTtcblxuXHRcdEVycm9yLmNhbGwodGhpcywgbWVzc2FnZSk7XG5cdFx0RXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgZXJyb3JFeEVycm9yKTtcblxuXHRcdHRoaXMubmFtZSA9IG5hbWU7XG5cblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ21lc3NhZ2UnLCB7XG5cdFx0XHRjb25maWd1cmFibGU6IHRydWUsXG5cdFx0XHRlbnVtZXJhYmxlOiBmYWxzZSxcblx0XHRcdGdldDogZnVuY3Rpb24gKCkge1xuXHRcdFx0XHR2YXIgbmV3TWVzc2FnZSA9IG1lc3NhZ2Uuc3BsaXQoL1xccj9cXG4vZyk7XG5cblx0XHRcdFx0Zm9yICh2YXIga2V5IGluIHByb3BlcnRpZXMpIHtcblx0XHRcdFx0XHRpZiAoIXByb3BlcnRpZXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuXHRcdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0dmFyIG1vZGlmaWVyID0gcHJvcGVydGllc1trZXldO1xuXG5cdFx0XHRcdFx0aWYgKCdtZXNzYWdlJyBpbiBtb2RpZmllcikge1xuXHRcdFx0XHRcdFx0bmV3TWVzc2FnZSA9IG1vZGlmaWVyLm1lc3NhZ2UodGhpc1trZXldLCBuZXdNZXNzYWdlKSB8fCBuZXdNZXNzYWdlO1xuXHRcdFx0XHRcdFx0aWYgKCFpc0FycmF5aXNoKG5ld01lc3NhZ2UpKSB7XG5cdFx0XHRcdFx0XHRcdG5ld01lc3NhZ2UgPSBbbmV3TWVzc2FnZV07XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIG5ld01lc3NhZ2Uuam9pbignXFxuJyk7XG5cdFx0XHR9LFxuXHRcdFx0c2V0OiBmdW5jdGlvbiAodikge1xuXHRcdFx0XHRtZXNzYWdlID0gdjtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHZhciBvdmVyd3JpdHRlblN0YWNrID0gbnVsbDtcblxuXHRcdHZhciBzdGFja0Rlc2NyaXB0b3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRoaXMsICdzdGFjaycpO1xuXHRcdHZhciBzdGFja0dldHRlciA9IHN0YWNrRGVzY3JpcHRvci5nZXQ7XG5cdFx0dmFyIHN0YWNrVmFsdWUgPSBzdGFja0Rlc2NyaXB0b3IudmFsdWU7XG5cdFx0ZGVsZXRlIHN0YWNrRGVzY3JpcHRvci52YWx1ZTtcblx0XHRkZWxldGUgc3RhY2tEZXNjcmlwdG9yLndyaXRhYmxlO1xuXG5cdFx0c3RhY2tEZXNjcmlwdG9yLnNldCA9IGZ1bmN0aW9uIChuZXdzdGFjaykge1xuXHRcdFx0b3ZlcndyaXR0ZW5TdGFjayA9IG5ld3N0YWNrO1xuXHRcdH07XG5cblx0XHRzdGFja0Rlc2NyaXB0b3IuZ2V0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIHN0YWNrID0gKG92ZXJ3cml0dGVuU3RhY2sgfHwgKChzdGFja0dldHRlcilcblx0XHRcdFx0PyBzdGFja0dldHRlci5jYWxsKHRoaXMpXG5cdFx0XHRcdDogc3RhY2tWYWx1ZSkpLnNwbGl0KC9cXHI/XFxuKy9nKTtcblxuXHRcdFx0Ly8gc3RhcnRpbmcgaW4gTm9kZSA3LCB0aGUgc3RhY2sgYnVpbGRlciBjYWNoZXMgdGhlIG1lc3NhZ2UuXG5cdFx0XHQvLyBqdXN0IHJlcGxhY2UgaXQuXG5cdFx0XHRpZiAoIW92ZXJ3cml0dGVuU3RhY2spIHtcblx0XHRcdFx0c3RhY2tbMF0gPSB0aGlzLm5hbWUgKyAnOiAnICsgdGhpcy5tZXNzYWdlO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgbGluZUNvdW50ID0gMTtcblx0XHRcdGZvciAodmFyIGtleSBpbiBwcm9wZXJ0aWVzKSB7XG5cdFx0XHRcdGlmICghcHJvcGVydGllcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgbW9kaWZpZXIgPSBwcm9wZXJ0aWVzW2tleV07XG5cblx0XHRcdFx0aWYgKCdsaW5lJyBpbiBtb2RpZmllcikge1xuXHRcdFx0XHRcdHZhciBsaW5lID0gbW9kaWZpZXIubGluZSh0aGlzW2tleV0pO1xuXHRcdFx0XHRcdGlmIChsaW5lKSB7XG5cdFx0XHRcdFx0XHRzdGFjay5zcGxpY2UobGluZUNvdW50KyssIDAsICcgICAgJyArIGxpbmUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICgnc3RhY2snIGluIG1vZGlmaWVyKSB7XG5cdFx0XHRcdFx0bW9kaWZpZXIuc3RhY2sodGhpc1trZXldLCBzdGFjayk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHN0YWNrLmpvaW4oJ1xcbicpO1xuXHRcdH07XG5cblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ3N0YWNrJywgc3RhY2tEZXNjcmlwdG9yKTtcblx0fTtcblxuXHRpZiAoT2JqZWN0LnNldFByb3RvdHlwZU9mKSB7XG5cdFx0T2JqZWN0LnNldFByb3RvdHlwZU9mKGVycm9yRXhFcnJvci5wcm90b3R5cGUsIEVycm9yLnByb3RvdHlwZSk7XG5cdFx0T2JqZWN0LnNldFByb3RvdHlwZU9mKGVycm9yRXhFcnJvciwgRXJyb3IpO1xuXHR9IGVsc2Uge1xuXHRcdHV0aWwuaW5oZXJpdHMoZXJyb3JFeEVycm9yLCBFcnJvcik7XG5cdH1cblxuXHRyZXR1cm4gZXJyb3JFeEVycm9yO1xufTtcblxuZXJyb3JFeC5hcHBlbmQgPSBmdW5jdGlvbiAoc3RyLCBkZWYpIHtcblx0cmV0dXJuIHtcblx0XHRtZXNzYWdlOiBmdW5jdGlvbiAodiwgbWVzc2FnZSkge1xuXHRcdFx0diA9IHYgfHwgZGVmO1xuXG5cdFx0XHRpZiAodikge1xuXHRcdFx0XHRtZXNzYWdlWzBdICs9ICcgJyArIHN0ci5yZXBsYWNlKCclcycsIHYudG9TdHJpbmcoKSk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBtZXNzYWdlO1xuXHRcdH1cblx0fTtcbn07XG5cbmVycm9yRXgubGluZSA9IGZ1bmN0aW9uIChzdHIsIGRlZikge1xuXHRyZXR1cm4ge1xuXHRcdGxpbmU6IGZ1bmN0aW9uICh2KSB7XG5cdFx0XHR2ID0gdiB8fCBkZWY7XG5cblx0XHRcdGlmICh2KSB7XG5cdFx0XHRcdHJldHVybiBzdHIucmVwbGFjZSgnJXMnLCB2LnRvU3RyaW5nKCkpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9XG5cdH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGVycm9yRXg7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBtYXRjaE9wZXJhdG9yc1JlID0gL1t8XFxcXHt9KClbXFxdXiQrKj8uXS9nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChzdHIpIHtcblx0aWYgKHR5cGVvZiBzdHIgIT09ICdzdHJpbmcnKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgYSBzdHJpbmcnKTtcblx0fVxuXG5cdHJldHVybiBzdHIucmVwbGFjZShtYXRjaE9wZXJhdG9yc1JlLCAnXFxcXCQmJyk7XG59O1xuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciBvYmplY3RDcmVhdGUgPSBPYmplY3QuY3JlYXRlIHx8IG9iamVjdENyZWF0ZVBvbHlmaWxsXG52YXIgb2JqZWN0S2V5cyA9IE9iamVjdC5rZXlzIHx8IG9iamVjdEtleXNQb2x5ZmlsbFxudmFyIGJpbmQgPSBGdW5jdGlvbi5wcm90b3R5cGUuYmluZCB8fCBmdW5jdGlvbkJpbmRQb2x5ZmlsbFxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodGhpcywgJ19ldmVudHMnKSkge1xuICAgIHRoaXMuX2V2ZW50cyA9IG9iamVjdENyZWF0ZShudWxsKTtcbiAgICB0aGlzLl9ldmVudHNDb3VudCA9IDA7XG4gIH1cblxuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSB0aGlzLl9tYXhMaXN0ZW5lcnMgfHwgdW5kZWZpbmVkO1xufVxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuMTAueFxuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzID0gdW5kZWZpbmVkO1xuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVycyBhcmVcbi8vIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2ggaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG52YXIgZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuXG52YXIgaGFzRGVmaW5lUHJvcGVydHk7XG50cnkge1xuICB2YXIgbyA9IHt9O1xuICBpZiAoT2JqZWN0LmRlZmluZVByb3BlcnR5KSBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgJ3gnLCB7IHZhbHVlOiAwIH0pO1xuICBoYXNEZWZpbmVQcm9wZXJ0eSA9IG8ueCA9PT0gMDtcbn0gY2F0Y2ggKGVycikgeyBoYXNEZWZpbmVQcm9wZXJ0eSA9IGZhbHNlIH1cbmlmIChoYXNEZWZpbmVQcm9wZXJ0eSkge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRXZlbnRFbWl0dGVyLCAnZGVmYXVsdE1heExpc3RlbmVycycsIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24oYXJnKSB7XG4gICAgICAvLyBjaGVjayB3aGV0aGVyIHRoZSBpbnB1dCBpcyBhIHBvc2l0aXZlIG51bWJlciAod2hvc2UgdmFsdWUgaXMgemVybyBvclxuICAgICAgLy8gZ3JlYXRlciBhbmQgbm90IGEgTmFOKS5cbiAgICAgIGlmICh0eXBlb2YgYXJnICE9PSAnbnVtYmVyJyB8fCBhcmcgPCAwIHx8IGFyZyAhPT0gYXJnKVxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImRlZmF1bHRNYXhMaXN0ZW5lcnNcIiBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gICAgICBkZWZhdWx0TWF4TGlzdGVuZXJzID0gYXJnO1xuICAgIH1cbiAgfSk7XG59IGVsc2Uge1xuICBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycyA9IGRlZmF1bHRNYXhMaXN0ZW5lcnM7XG59XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uIHNldE1heExpc3RlbmVycyhuKSB7XG4gIGlmICh0eXBlb2YgbiAhPT0gJ251bWJlcicgfHwgbiA8IDAgfHwgaXNOYU4obikpXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJuXCIgYXJndW1lbnQgbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbmZ1bmN0aW9uICRnZXRNYXhMaXN0ZW5lcnModGhhdCkge1xuICBpZiAodGhhdC5fbWF4TGlzdGVuZXJzID09PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzO1xuICByZXR1cm4gdGhhdC5fbWF4TGlzdGVuZXJzO1xufVxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmdldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uIGdldE1heExpc3RlbmVycygpIHtcbiAgcmV0dXJuICRnZXRNYXhMaXN0ZW5lcnModGhpcyk7XG59O1xuXG4vLyBUaGVzZSBzdGFuZGFsb25lIGVtaXQqIGZ1bmN0aW9ucyBhcmUgdXNlZCB0byBvcHRpbWl6ZSBjYWxsaW5nIG9mIGV2ZW50XG4vLyBoYW5kbGVycyBmb3IgZmFzdCBjYXNlcyBiZWNhdXNlIGVtaXQoKSBpdHNlbGYgb2Z0ZW4gaGFzIGEgdmFyaWFibGUgbnVtYmVyIG9mXG4vLyBhcmd1bWVudHMgYW5kIGNhbiBiZSBkZW9wdGltaXplZCBiZWNhdXNlIG9mIHRoYXQuIFRoZXNlIGZ1bmN0aW9ucyBhbHdheXMgaGF2ZVxuLy8gdGhlIHNhbWUgbnVtYmVyIG9mIGFyZ3VtZW50cyBhbmQgdGh1cyBkbyBub3QgZ2V0IGRlb3B0aW1pemVkLCBzbyB0aGUgY29kZVxuLy8gaW5zaWRlIHRoZW0gY2FuIGV4ZWN1dGUgZmFzdGVyLlxuZnVuY3Rpb24gZW1pdE5vbmUoaGFuZGxlciwgaXNGbiwgc2VsZikge1xuICBpZiAoaXNGbilcbiAgICBoYW5kbGVyLmNhbGwoc2VsZik7XG4gIGVsc2Uge1xuICAgIHZhciBsZW4gPSBoYW5kbGVyLmxlbmd0aDtcbiAgICB2YXIgbGlzdGVuZXJzID0gYXJyYXlDbG9uZShoYW5kbGVyLCBsZW4pO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpXG4gICAgICBsaXN0ZW5lcnNbaV0uY2FsbChzZWxmKTtcbiAgfVxufVxuZnVuY3Rpb24gZW1pdE9uZShoYW5kbGVyLCBpc0ZuLCBzZWxmLCBhcmcxKSB7XG4gIGlmIChpc0ZuKVxuICAgIGhhbmRsZXIuY2FsbChzZWxmLCBhcmcxKTtcbiAgZWxzZSB7XG4gICAgdmFyIGxlbiA9IGhhbmRsZXIubGVuZ3RoO1xuICAgIHZhciBsaXN0ZW5lcnMgPSBhcnJheUNsb25lKGhhbmRsZXIsIGxlbik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSlcbiAgICAgIGxpc3RlbmVyc1tpXS5jYWxsKHNlbGYsIGFyZzEpO1xuICB9XG59XG5mdW5jdGlvbiBlbWl0VHdvKGhhbmRsZXIsIGlzRm4sIHNlbGYsIGFyZzEsIGFyZzIpIHtcbiAgaWYgKGlzRm4pXG4gICAgaGFuZGxlci5jYWxsKHNlbGYsIGFyZzEsIGFyZzIpO1xuICBlbHNlIHtcbiAgICB2YXIgbGVuID0gaGFuZGxlci5sZW5ndGg7XG4gICAgdmFyIGxpc3RlbmVycyA9IGFycmF5Q2xvbmUoaGFuZGxlciwgbGVuKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKVxuICAgICAgbGlzdGVuZXJzW2ldLmNhbGwoc2VsZiwgYXJnMSwgYXJnMik7XG4gIH1cbn1cbmZ1bmN0aW9uIGVtaXRUaHJlZShoYW5kbGVyLCBpc0ZuLCBzZWxmLCBhcmcxLCBhcmcyLCBhcmczKSB7XG4gIGlmIChpc0ZuKVxuICAgIGhhbmRsZXIuY2FsbChzZWxmLCBhcmcxLCBhcmcyLCBhcmczKTtcbiAgZWxzZSB7XG4gICAgdmFyIGxlbiA9IGhhbmRsZXIubGVuZ3RoO1xuICAgIHZhciBsaXN0ZW5lcnMgPSBhcnJheUNsb25lKGhhbmRsZXIsIGxlbik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSlcbiAgICAgIGxpc3RlbmVyc1tpXS5jYWxsKHNlbGYsIGFyZzEsIGFyZzIsIGFyZzMpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGVtaXRNYW55KGhhbmRsZXIsIGlzRm4sIHNlbGYsIGFyZ3MpIHtcbiAgaWYgKGlzRm4pXG4gICAgaGFuZGxlci5hcHBseShzZWxmLCBhcmdzKTtcbiAgZWxzZSB7XG4gICAgdmFyIGxlbiA9IGhhbmRsZXIubGVuZ3RoO1xuICAgIHZhciBsaXN0ZW5lcnMgPSBhcnJheUNsb25lKGhhbmRsZXIsIGxlbik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSlcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseShzZWxmLCBhcmdzKTtcbiAgfVxufVxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiBlbWl0KHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGV2ZW50cztcbiAgdmFyIGRvRXJyb3IgPSAodHlwZSA9PT0gJ2Vycm9yJyk7XG5cbiAgZXZlbnRzID0gdGhpcy5fZXZlbnRzO1xuICBpZiAoZXZlbnRzKVxuICAgIGRvRXJyb3IgPSAoZG9FcnJvciAmJiBldmVudHMuZXJyb3IgPT0gbnVsbCk7XG4gIGVsc2UgaWYgKCFkb0Vycm9yKVxuICAgIHJldHVybiBmYWxzZTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmIChkb0Vycm9yKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKVxuICAgICAgZXIgPSBhcmd1bWVudHNbMV07XG4gICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBBdCBsZWFzdCBnaXZlIHNvbWUga2luZCBvZiBjb250ZXh0IHRvIHRoZSB1c2VyXG4gICAgICB2YXIgZXJyID0gbmV3IEVycm9yKCdVbmhhbmRsZWQgXCJlcnJvclwiIGV2ZW50LiAoJyArIGVyICsgJyknKTtcbiAgICAgIGVyci5jb250ZXh0ID0gZXI7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGhhbmRsZXIgPSBldmVudHNbdHlwZV07XG5cbiAgaWYgKCFoYW5kbGVyKVxuICAgIHJldHVybiBmYWxzZTtcblxuICB2YXIgaXNGbiA9IHR5cGVvZiBoYW5kbGVyID09PSAnZnVuY3Rpb24nO1xuICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICBzd2l0Y2ggKGxlbikge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgIGNhc2UgMTpcbiAgICAgIGVtaXROb25lKGhhbmRsZXIsIGlzRm4sIHRoaXMpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAyOlxuICAgICAgZW1pdE9uZShoYW5kbGVyLCBpc0ZuLCB0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAzOlxuICAgICAgZW1pdFR3byhoYW5kbGVyLCBpc0ZuLCB0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDQ6XG4gICAgICBlbWl0VGhyZWUoaGFuZGxlciwgaXNGbiwgdGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0sIGFyZ3VtZW50c1szXSk7XG4gICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgIGRlZmF1bHQ6XG4gICAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgIGVtaXRNYW55KGhhbmRsZXIsIGlzRm4sIHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5mdW5jdGlvbiBfYWRkTGlzdGVuZXIodGFyZ2V0LCB0eXBlLCBsaXN0ZW5lciwgcHJlcGVuZCkge1xuICB2YXIgbTtcbiAgdmFyIGV2ZW50cztcbiAgdmFyIGV4aXN0aW5nO1xuXG4gIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0ZW5lclwiIGFyZ3VtZW50IG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGV2ZW50cyA9IHRhcmdldC5fZXZlbnRzO1xuICBpZiAoIWV2ZW50cykge1xuICAgIGV2ZW50cyA9IHRhcmdldC5fZXZlbnRzID0gb2JqZWN0Q3JlYXRlKG51bGwpO1xuICAgIHRhcmdldC5fZXZlbnRzQ291bnQgPSAwO1xuICB9IGVsc2Uge1xuICAgIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gICAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICAgIGlmIChldmVudHMubmV3TGlzdGVuZXIpIHtcbiAgICAgIHRhcmdldC5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsXG4gICAgICAgICAgbGlzdGVuZXIubGlzdGVuZXIgPyBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICAgICAgLy8gUmUtYXNzaWduIGBldmVudHNgIGJlY2F1c2UgYSBuZXdMaXN0ZW5lciBoYW5kbGVyIGNvdWxkIGhhdmUgY2F1c2VkIHRoZVxuICAgICAgLy8gdGhpcy5fZXZlbnRzIHRvIGJlIGFzc2lnbmVkIHRvIGEgbmV3IG9iamVjdFxuICAgICAgZXZlbnRzID0gdGFyZ2V0Ll9ldmVudHM7XG4gICAgfVxuICAgIGV4aXN0aW5nID0gZXZlbnRzW3R5cGVdO1xuICB9XG5cbiAgaWYgKCFleGlzdGluZykge1xuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIGV4aXN0aW5nID0gZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gICAgKyt0YXJnZXQuX2V2ZW50c0NvdW50O1xuICB9IGVsc2Uge1xuICAgIGlmICh0eXBlb2YgZXhpc3RpbmcgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgICAgZXhpc3RpbmcgPSBldmVudHNbdHlwZV0gPVxuICAgICAgICAgIHByZXBlbmQgPyBbbGlzdGVuZXIsIGV4aXN0aW5nXSA6IFtleGlzdGluZywgbGlzdGVuZXJdO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgICBpZiAocHJlcGVuZCkge1xuICAgICAgICBleGlzdGluZy51bnNoaWZ0KGxpc3RlbmVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGV4aXN0aW5nLnB1c2gobGlzdGVuZXIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gICAgaWYgKCFleGlzdGluZy53YXJuZWQpIHtcbiAgICAgIG0gPSAkZ2V0TWF4TGlzdGVuZXJzKHRhcmdldCk7XG4gICAgICBpZiAobSAmJiBtID4gMCAmJiBleGlzdGluZy5sZW5ndGggPiBtKSB7XG4gICAgICAgIGV4aXN0aW5nLndhcm5lZCA9IHRydWU7XG4gICAgICAgIHZhciB3ID0gbmV3IEVycm9yKCdQb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5IGxlYWsgZGV0ZWN0ZWQuICcgK1xuICAgICAgICAgICAgZXhpc3RpbmcubGVuZ3RoICsgJyBcIicgKyBTdHJpbmcodHlwZSkgKyAnXCIgbGlzdGVuZXJzICcgK1xuICAgICAgICAgICAgJ2FkZGVkLiBVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byAnICtcbiAgICAgICAgICAgICdpbmNyZWFzZSBsaW1pdC4nKTtcbiAgICAgICAgdy5uYW1lID0gJ01heExpc3RlbmVyc0V4Y2VlZGVkV2FybmluZyc7XG4gICAgICAgIHcuZW1pdHRlciA9IHRhcmdldDtcbiAgICAgICAgdy50eXBlID0gdHlwZTtcbiAgICAgICAgdy5jb3VudCA9IGV4aXN0aW5nLmxlbmd0aDtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25zb2xlID09PSAnb2JqZWN0JyAmJiBjb25zb2xlLndhcm4pIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oJyVzOiAlcycsIHcubmFtZSwgdy5tZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0YXJnZXQ7XG59XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbiBhZGRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcikge1xuICByZXR1cm4gX2FkZExpc3RlbmVyKHRoaXMsIHR5cGUsIGxpc3RlbmVyLCBmYWxzZSk7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5wcmVwZW5kTGlzdGVuZXIgPVxuICAgIGZ1bmN0aW9uIHByZXBlbmRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcikge1xuICAgICAgcmV0dXJuIF9hZGRMaXN0ZW5lcih0aGlzLCB0eXBlLCBsaXN0ZW5lciwgdHJ1ZSk7XG4gICAgfTtcblxuZnVuY3Rpb24gb25jZVdyYXBwZXIoKSB7XG4gIGlmICghdGhpcy5maXJlZCkge1xuICAgIHRoaXMudGFyZ2V0LnJlbW92ZUxpc3RlbmVyKHRoaXMudHlwZSwgdGhpcy53cmFwRm4pO1xuICAgIHRoaXMuZmlyZWQgPSB0cnVlO1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgY2FzZSAwOlxuICAgICAgICByZXR1cm4gdGhpcy5saXN0ZW5lci5jYWxsKHRoaXMudGFyZ2V0KTtcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgcmV0dXJuIHRoaXMubGlzdGVuZXIuY2FsbCh0aGlzLnRhcmdldCwgYXJndW1lbnRzWzBdKTtcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgcmV0dXJuIHRoaXMubGlzdGVuZXIuY2FsbCh0aGlzLnRhcmdldCwgYXJndW1lbnRzWzBdLCBhcmd1bWVudHNbMV0pO1xuICAgICAgY2FzZSAzOlxuICAgICAgICByZXR1cm4gdGhpcy5saXN0ZW5lci5jYWxsKHRoaXMudGFyZ2V0LCBhcmd1bWVudHNbMF0sIGFyZ3VtZW50c1sxXSxcbiAgICAgICAgICAgIGFyZ3VtZW50c1syXSk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgKytpKVxuICAgICAgICAgIGFyZ3NbaV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIHRoaXMubGlzdGVuZXIuYXBwbHkodGhpcy50YXJnZXQsIGFyZ3MpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBfb25jZVdyYXAodGFyZ2V0LCB0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgc3RhdGUgPSB7IGZpcmVkOiBmYWxzZSwgd3JhcEZuOiB1bmRlZmluZWQsIHRhcmdldDogdGFyZ2V0LCB0eXBlOiB0eXBlLCBsaXN0ZW5lcjogbGlzdGVuZXIgfTtcbiAgdmFyIHdyYXBwZWQgPSBiaW5kLmNhbGwob25jZVdyYXBwZXIsIHN0YXRlKTtcbiAgd3JhcHBlZC5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICBzdGF0ZS53cmFwRm4gPSB3cmFwcGVkO1xuICByZXR1cm4gd3JhcHBlZDtcbn1cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24gb25jZSh0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKVxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wibGlzdGVuZXJcIiBhcmd1bWVudCBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgdGhpcy5vbih0eXBlLCBfb25jZVdyYXAodGhpcywgdHlwZSwgbGlzdGVuZXIpKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnByZXBlbmRPbmNlTGlzdGVuZXIgPVxuICAgIGZ1bmN0aW9uIHByZXBlbmRPbmNlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXIpIHtcbiAgICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wibGlzdGVuZXJcIiBhcmd1bWVudCBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgICAgIHRoaXMucHJlcGVuZExpc3RlbmVyKHR5cGUsIF9vbmNlV3JhcCh0aGlzLCB0eXBlLCBsaXN0ZW5lcikpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuLy8gRW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmIGFuZCBvbmx5IGlmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPVxuICAgIGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyKSB7XG4gICAgICB2YXIgbGlzdCwgZXZlbnRzLCBwb3NpdGlvbiwgaSwgb3JpZ2luYWxMaXN0ZW5lcjtcblxuICAgICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0ZW5lclwiIGFyZ3VtZW50IG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gICAgICBldmVudHMgPSB0aGlzLl9ldmVudHM7XG4gICAgICBpZiAoIWV2ZW50cylcbiAgICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICAgIGxpc3QgPSBldmVudHNbdHlwZV07XG4gICAgICBpZiAoIWxpc3QpXG4gICAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHwgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKC0tdGhpcy5fZXZlbnRzQ291bnQgPT09IDApXG4gICAgICAgICAgdGhpcy5fZXZlbnRzID0gb2JqZWN0Q3JlYXRlKG51bGwpO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBkZWxldGUgZXZlbnRzW3R5cGVdO1xuICAgICAgICAgIGlmIChldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdC5saXN0ZW5lciB8fCBsaXN0ZW5lcik7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGxpc3QgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcG9zaXRpb24gPSAtMTtcblxuICAgICAgICBmb3IgKGkgPSBsaXN0Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8IGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSB7XG4gICAgICAgICAgICBvcmlnaW5hbExpc3RlbmVyID0gbGlzdFtpXS5saXN0ZW5lcjtcbiAgICAgICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICAgICAgaWYgKHBvc2l0aW9uID09PSAwKVxuICAgICAgICAgIGxpc3Quc2hpZnQoKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHNwbGljZU9uZShsaXN0LCBwb3NpdGlvbik7XG5cbiAgICAgICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKVxuICAgICAgICAgIGV2ZW50c1t0eXBlXSA9IGxpc3RbMF07XG5cbiAgICAgICAgaWYgKGV2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgb3JpZ2luYWxMaXN0ZW5lciB8fCBsaXN0ZW5lcik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID1cbiAgICBmdW5jdGlvbiByZW1vdmVBbGxMaXN0ZW5lcnModHlwZSkge1xuICAgICAgdmFyIGxpc3RlbmVycywgZXZlbnRzLCBpO1xuXG4gICAgICBldmVudHMgPSB0aGlzLl9ldmVudHM7XG4gICAgICBpZiAoIWV2ZW50cylcbiAgICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICAgIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgICAgIGlmICghZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgdGhpcy5fZXZlbnRzID0gb2JqZWN0Q3JlYXRlKG51bGwpO1xuICAgICAgICAgIHRoaXMuX2V2ZW50c0NvdW50ID0gMDtcbiAgICAgICAgfSBlbHNlIGlmIChldmVudHNbdHlwZV0pIHtcbiAgICAgICAgICBpZiAoLS10aGlzLl9ldmVudHNDb3VudCA9PT0gMClcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50cyA9IG9iamVjdENyZWF0ZShudWxsKTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBkZWxldGUgZXZlbnRzW3R5cGVdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuXG4gICAgICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHZhciBrZXlzID0gb2JqZWN0S2V5cyhldmVudHMpO1xuICAgICAgICB2YXIga2V5O1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgIGtleSA9IGtleXNbaV07XG4gICAgICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICAgICAgdGhpcy5fZXZlbnRzID0gb2JqZWN0Q3JlYXRlKG51bGwpO1xuICAgICAgICB0aGlzLl9ldmVudHNDb3VudCA9IDA7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuXG4gICAgICBsaXN0ZW5lcnMgPSBldmVudHNbdHlwZV07XG5cbiAgICAgIGlmICh0eXBlb2YgbGlzdGVuZXJzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgICAgIH0gZWxzZSBpZiAobGlzdGVuZXJzKSB7XG4gICAgICAgIC8vIExJRk8gb3JkZXJcbiAgICAgICAgZm9yIChpID0gbGlzdGVuZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbaV0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbmZ1bmN0aW9uIF9saXN0ZW5lcnModGFyZ2V0LCB0eXBlLCB1bndyYXApIHtcbiAgdmFyIGV2ZW50cyA9IHRhcmdldC5fZXZlbnRzO1xuXG4gIGlmICghZXZlbnRzKVxuICAgIHJldHVybiBbXTtcblxuICB2YXIgZXZsaXN0ZW5lciA9IGV2ZW50c1t0eXBlXTtcbiAgaWYgKCFldmxpc3RlbmVyKVxuICAgIHJldHVybiBbXTtcblxuICBpZiAodHlwZW9mIGV2bGlzdGVuZXIgPT09ICdmdW5jdGlvbicpXG4gICAgcmV0dXJuIHVud3JhcCA/IFtldmxpc3RlbmVyLmxpc3RlbmVyIHx8IGV2bGlzdGVuZXJdIDogW2V2bGlzdGVuZXJdO1xuXG4gIHJldHVybiB1bndyYXAgPyB1bndyYXBMaXN0ZW5lcnMoZXZsaXN0ZW5lcikgOiBhcnJheUNsb25lKGV2bGlzdGVuZXIsIGV2bGlzdGVuZXIubGVuZ3RoKTtcbn1cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbiBsaXN0ZW5lcnModHlwZSkge1xuICByZXR1cm4gX2xpc3RlbmVycyh0aGlzLCB0eXBlLCB0cnVlKTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmF3TGlzdGVuZXJzID0gZnVuY3Rpb24gcmF3TGlzdGVuZXJzKHR5cGUpIHtcbiAgcmV0dXJuIF9saXN0ZW5lcnModGhpcywgdHlwZSwgZmFsc2UpO1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIGlmICh0eXBlb2YgZW1pdHRlci5saXN0ZW5lckNvdW50ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGVtaXR0ZXIubGlzdGVuZXJDb3VudCh0eXBlKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbGlzdGVuZXJDb3VudC5jYWxsKGVtaXR0ZXIsIHR5cGUpO1xuICB9XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVyQ291bnQgPSBsaXN0ZW5lckNvdW50O1xuZnVuY3Rpb24gbGlzdGVuZXJDb3VudCh0eXBlKSB7XG4gIHZhciBldmVudHMgPSB0aGlzLl9ldmVudHM7XG5cbiAgaWYgKGV2ZW50cykge1xuICAgIHZhciBldmxpc3RlbmVyID0gZXZlbnRzW3R5cGVdO1xuXG4gICAgaWYgKHR5cGVvZiBldmxpc3RlbmVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gMTtcbiAgICB9IGVsc2UgaWYgKGV2bGlzdGVuZXIpIHtcbiAgICAgIHJldHVybiBldmxpc3RlbmVyLmxlbmd0aDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gMDtcbn1cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5ldmVudE5hbWVzID0gZnVuY3Rpb24gZXZlbnROYW1lcygpIHtcbiAgcmV0dXJuIHRoaXMuX2V2ZW50c0NvdW50ID4gMCA/IFJlZmxlY3Qub3duS2V5cyh0aGlzLl9ldmVudHMpIDogW107XG59O1xuXG4vLyBBYm91dCAxLjV4IGZhc3RlciB0aGFuIHRoZSB0d28tYXJnIHZlcnNpb24gb2YgQXJyYXkjc3BsaWNlKCkuXG5mdW5jdGlvbiBzcGxpY2VPbmUobGlzdCwgaW5kZXgpIHtcbiAgZm9yICh2YXIgaSA9IGluZGV4LCBrID0gaSArIDEsIG4gPSBsaXN0Lmxlbmd0aDsgayA8IG47IGkgKz0gMSwgayArPSAxKVxuICAgIGxpc3RbaV0gPSBsaXN0W2tdO1xuICBsaXN0LnBvcCgpO1xufVxuXG5mdW5jdGlvbiBhcnJheUNsb25lKGFyciwgbikge1xuICB2YXIgY29weSA9IG5ldyBBcnJheShuKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpXG4gICAgY29weVtpXSA9IGFycltpXTtcbiAgcmV0dXJuIGNvcHk7XG59XG5cbmZ1bmN0aW9uIHVud3JhcExpc3RlbmVycyhhcnIpIHtcbiAgdmFyIHJldCA9IG5ldyBBcnJheShhcnIubGVuZ3RoKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCByZXQubGVuZ3RoOyArK2kpIHtcbiAgICByZXRbaV0gPSBhcnJbaV0ubGlzdGVuZXIgfHwgYXJyW2ldO1xuICB9XG4gIHJldHVybiByZXQ7XG59XG5cbmZ1bmN0aW9uIG9iamVjdENyZWF0ZVBvbHlmaWxsKHByb3RvKSB7XG4gIHZhciBGID0gZnVuY3Rpb24oKSB7fTtcbiAgRi5wcm90b3R5cGUgPSBwcm90bztcbiAgcmV0dXJuIG5ldyBGO1xufVxuZnVuY3Rpb24gb2JqZWN0S2V5c1BvbHlmaWxsKG9iaikge1xuICB2YXIga2V5cyA9IFtdO1xuICBmb3IgKHZhciBrIGluIG9iaikgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGspKSB7XG4gICAga2V5cy5wdXNoKGspO1xuICB9XG4gIHJldHVybiBrO1xufVxuZnVuY3Rpb24gZnVuY3Rpb25CaW5kUG9seWZpbGwoY29udGV4dCkge1xuICB2YXIgZm4gPSB0aGlzO1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBmbi5hcHBseShjb250ZXh0LCBhcmd1bWVudHMpO1xuICB9O1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuY29uc3QgZXNjYXBlU3RyaW5nUmVnZXhwID0gcmVxdWlyZSgnZXNjYXBlLXN0cmluZy1yZWdleHAnKTtcblxuY29uc3QgcGxhdGZvcm0gPSBwcm9jZXNzLnBsYXRmb3JtO1xuXG5jb25zdCBtYWluID0ge1xuXHR0aWNrOiAn4pyUJyxcblx0Y3Jvc3M6ICfinJYnLFxuXHRzdGFyOiAn4piFJyxcblx0c3F1YXJlOiAn4paHJyxcblx0c3F1YXJlU21hbGw6ICfil7snLFxuXHRzcXVhcmVTbWFsbEZpbGxlZDogJ+KXvCcsXG5cdHBsYXk6ICfilrYnLFxuXHRjaXJjbGU6ICfil68nLFxuXHRjaXJjbGVGaWxsZWQ6ICfil4knLFxuXHRjaXJjbGVEb3R0ZWQ6ICfil4wnLFxuXHRjaXJjbGVEb3VibGU6ICfil44nLFxuXHRjaXJjbGVDaXJjbGU6ICfik54nLFxuXHRjaXJjbGVDcm9zczogJ+KTpycsXG5cdGNpcmNsZVBpcGU6ICfikr4nLFxuXHRjaXJjbGVRdWVzdGlvbk1hcms6ICc/4oOdJyxcblx0YnVsbGV0OiAn4pePJyxcblx0ZG90OiAn4oCkJyxcblx0bGluZTogJ+KUgCcsXG5cdGVsbGlwc2lzOiAn4oCmJyxcblx0cG9pbnRlcjogJ+KdrycsXG5cdHBvaW50ZXJTbWFsbDogJ+KAuicsXG5cdGluZm86ICfihLknLFxuXHR3YXJuaW5nOiAn4pqgJyxcblx0aGFtYnVyZ2VyOiAn4piwJyxcblx0c21pbGV5OiAn44uhJyxcblx0bXVzdGFjaGU6ICfgt7QnLFxuXHRoZWFydDogJ+KZpScsXG5cdGFycm93VXA6ICfihpEnLFxuXHRhcnJvd0Rvd246ICfihpMnLFxuXHRhcnJvd0xlZnQ6ICfihpAnLFxuXHRhcnJvd1JpZ2h0OiAn4oaSJyxcblx0cmFkaW9PbjogJ+KXiScsXG5cdHJhZGlvT2ZmOiAn4pevJyxcblx0Y2hlY2tib3hPbjogJ+KYkicsXG5cdGNoZWNrYm94T2ZmOiAn4piQJyxcblx0Y2hlY2tib3hDaXJjbGVPbjogJ+KTpycsXG5cdGNoZWNrYm94Q2lyY2xlT2ZmOiAn4pK+Jyxcblx0cXVlc3Rpb25NYXJrUHJlZml4OiAnP+KDnScsXG5cdG9uZUhhbGY6ICfCvScsXG5cdG9uZVRoaXJkOiAn4oWTJyxcblx0b25lUXVhcnRlcjogJ8K8Jyxcblx0b25lRmlmdGg6ICfihZUnLFxuXHRvbmVTaXh0aDogJ+KFmScsXG5cdG9uZVNldmVudGg6ICfihZAnLFxuXHRvbmVFaWdodGg6ICfihZsnLFxuXHRvbmVOaW50aDogJ+KFkScsXG5cdG9uZVRlbnRoOiAn4oWSJyxcblx0dHdvVGhpcmRzOiAn4oWUJyxcblx0dHdvRmlmdGhzOiAn4oWWJyxcblx0dGhyZWVRdWFydGVyczogJ8K+Jyxcblx0dGhyZWVGaWZ0aHM6ICfihZcnLFxuXHR0aHJlZUVpZ2h0aHM6ICfihZwnLFxuXHRmb3VyRmlmdGhzOiAn4oWYJyxcblx0Zml2ZVNpeHRoczogJ+KFmicsXG5cdGZpdmVFaWdodGhzOiAn4oWdJyxcblx0c2V2ZW5FaWdodGhzOiAn4oWeJ1xufTtcblxuY29uc3Qgd2luID0ge1xuXHR0aWNrOiAn4oiaJyxcblx0Y3Jvc3M6ICfDlycsXG5cdHN0YXI6ICcqJyxcblx0c3F1YXJlOiAn4paIJyxcblx0c3F1YXJlU21hbGw6ICdbIF0nLFxuXHRzcXVhcmVTbWFsbEZpbGxlZDogJ1vilohdJyxcblx0cGxheTogJ+KWuicsXG5cdGNpcmNsZTogJyggKScsXG5cdGNpcmNsZUZpbGxlZDogJygqKScsXG5cdGNpcmNsZURvdHRlZDogJyggKScsXG5cdGNpcmNsZURvdWJsZTogJyggKScsXG5cdGNpcmNsZUNpcmNsZTogJyjil4spJyxcblx0Y2lyY2xlQ3Jvc3M6ICcow5cpJyxcblx0Y2lyY2xlUGlwZTogJyjilIIpJyxcblx0Y2lyY2xlUXVlc3Rpb25NYXJrOiAnKD8pJyxcblx0YnVsbGV0OiAnKicsXG5cdGRvdDogJy4nLFxuXHRsaW5lOiAn4pSAJyxcblx0ZWxsaXBzaXM6ICcuLi4nLFxuXHRwb2ludGVyOiAnPicsXG5cdHBvaW50ZXJTbWFsbDogJ8K7Jyxcblx0aW5mbzogJ2knLFxuXHR3YXJuaW5nOiAn4oC8Jyxcblx0aGFtYnVyZ2VyOiAn4omhJyxcblx0c21pbGV5OiAn4pi6Jyxcblx0bXVzdGFjaGU6ICfilIzilIDilJAnLFxuXHRoZWFydDogbWFpbi5oZWFydCxcblx0YXJyb3dVcDogbWFpbi5hcnJvd1VwLFxuXHRhcnJvd0Rvd246IG1haW4uYXJyb3dEb3duLFxuXHRhcnJvd0xlZnQ6IG1haW4uYXJyb3dMZWZ0LFxuXHRhcnJvd1JpZ2h0OiBtYWluLmFycm93UmlnaHQsXG5cdHJhZGlvT246ICcoKiknLFxuXHRyYWRpb09mZjogJyggKScsXG5cdGNoZWNrYm94T246ICdbw5ddJyxcblx0Y2hlY2tib3hPZmY6ICdbIF0nLFxuXHRjaGVja2JveENpcmNsZU9uOiAnKMOXKScsXG5cdGNoZWNrYm94Q2lyY2xlT2ZmOiAnKCApJyxcblx0cXVlc3Rpb25NYXJrUHJlZml4OiAn77yfJyxcblx0b25lSGFsZjogJzEvMicsXG5cdG9uZVRoaXJkOiAnMS8zJyxcblx0b25lUXVhcnRlcjogJzEvNCcsXG5cdG9uZUZpZnRoOiAnMS81Jyxcblx0b25lU2l4dGg6ICcxLzYnLFxuXHRvbmVTZXZlbnRoOiAnMS83Jyxcblx0b25lRWlnaHRoOiAnMS84Jyxcblx0b25lTmludGg6ICcxLzknLFxuXHRvbmVUZW50aDogJzEvMTAnLFxuXHR0d29UaGlyZHM6ICcyLzMnLFxuXHR0d29GaWZ0aHM6ICcyLzUnLFxuXHR0aHJlZVF1YXJ0ZXJzOiAnMy80Jyxcblx0dGhyZWVGaWZ0aHM6ICczLzUnLFxuXHR0aHJlZUVpZ2h0aHM6ICczLzgnLFxuXHRmb3VyRmlmdGhzOiAnNC81Jyxcblx0Zml2ZVNpeHRoczogJzUvNicsXG5cdGZpdmVFaWdodGhzOiAnNS84Jyxcblx0c2V2ZW5FaWdodGhzOiAnNy84J1xufTtcblxuaWYgKHBsYXRmb3JtID09PSAnbGludXgnKSB7XG5cdC8vIHRoZSBtYWluIG9uZSBkb2Vzbid0IGxvb2sgdGhhdCBnb29kIG9uIFVidW50dVxuXHRtYWluLnF1ZXN0aW9uTWFya1ByZWZpeCA9ICc/Jztcbn1cblxuY29uc3QgZmlndXJlcyA9IHBsYXRmb3JtID09PSAnd2luMzInID8gd2luIDogbWFpbjtcblxuY29uc3QgZm4gPSBzdHIgPT4ge1xuXHRpZiAoZmlndXJlcyA9PT0gbWFpbikge1xuXHRcdHJldHVybiBzdHI7XG5cdH1cblxuXHRPYmplY3Qua2V5cyhtYWluKS5mb3JFYWNoKGtleSA9PiB7XG5cdFx0aWYgKG1haW5ba2V5XSA9PT0gZmlndXJlc1trZXldKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0c3RyID0gc3RyLnJlcGxhY2UobmV3IFJlZ0V4cChlc2NhcGVTdHJpbmdSZWdleHAobWFpbltrZXldKSwgJ2cnKSwgZmlndXJlc1trZXldKTtcblx0fSk7XG5cblx0cmV0dXJuIHN0cjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gT2JqZWN0LmFzc2lnbihmbiwgZmlndXJlcyk7XG4iLCIndXNlIHN0cmljdCc7XG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuY29uc3QgbG9jYXRlUGF0aCA9IHJlcXVpcmUoJ2xvY2F0ZS1wYXRoJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gKGZpbGVuYW1lLCBvcHRzKSA9PiB7XG5cdG9wdHMgPSBvcHRzIHx8IHt9O1xuXG5cdGNvbnN0IHN0YXJ0RGlyID0gcGF0aC5yZXNvbHZlKG9wdHMuY3dkIHx8ICcnKTtcblx0Y29uc3Qgcm9vdCA9IHBhdGgucGFyc2Uoc3RhcnREaXIpLnJvb3Q7XG5cblx0Y29uc3QgZmlsZW5hbWVzID0gW10uY29uY2F0KGZpbGVuYW1lKTtcblxuXHRyZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG5cdFx0KGZ1bmN0aW9uIGZpbmQoZGlyKSB7XG5cdFx0XHRsb2NhdGVQYXRoKGZpbGVuYW1lcywge2N3ZDogZGlyfSkudGhlbihmaWxlID0+IHtcblx0XHRcdFx0aWYgKGZpbGUpIHtcblx0XHRcdFx0XHRyZXNvbHZlKHBhdGguam9pbihkaXIsIGZpbGUpKTtcblx0XHRcdFx0fSBlbHNlIGlmIChkaXIgPT09IHJvb3QpIHtcblx0XHRcdFx0XHRyZXNvbHZlKG51bGwpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGZpbmQocGF0aC5kaXJuYW1lKGRpcikpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9KShzdGFydERpcik7XG5cdH0pO1xufTtcblxubW9kdWxlLmV4cG9ydHMuc3luYyA9IChmaWxlbmFtZSwgb3B0cykgPT4ge1xuXHRvcHRzID0gb3B0cyB8fCB7fTtcblxuXHRsZXQgZGlyID0gcGF0aC5yZXNvbHZlKG9wdHMuY3dkIHx8ICcnKTtcblx0Y29uc3Qgcm9vdCA9IHBhdGgucGFyc2UoZGlyKS5yb290O1xuXG5cdGNvbnN0IGZpbGVuYW1lcyA9IFtdLmNvbmNhdChmaWxlbmFtZSk7XG5cblx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnN0YW50LWNvbmRpdGlvblxuXHR3aGlsZSAodHJ1ZSkge1xuXHRcdGNvbnN0IGZpbGUgPSBsb2NhdGVQYXRoLnN5bmMoZmlsZW5hbWVzLCB7Y3dkOiBkaXJ9KTtcblxuXHRcdGlmIChmaWxlKSB7XG5cdFx0XHRyZXR1cm4gcGF0aC5qb2luKGRpciwgZmlsZSk7XG5cdFx0fSBlbHNlIGlmIChkaXIgPT09IHJvb3QpIHtcblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH1cblxuXHRcdGRpciA9IHBhdGguZGlybmFtZShkaXIpO1xuXHR9XG59O1xuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBmcyA9IHJlcXVpcmUoJ2ZzJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbG9uZShmcylcblxuZnVuY3Rpb24gY2xvbmUgKG9iaikge1xuICBpZiAob2JqID09PSBudWxsIHx8IHR5cGVvZiBvYmogIT09ICdvYmplY3QnKVxuICAgIHJldHVybiBvYmpcblxuICBpZiAob2JqIGluc3RhbmNlb2YgT2JqZWN0KVxuICAgIHZhciBjb3B5ID0geyBfX3Byb3RvX186IG9iai5fX3Byb3RvX18gfVxuICBlbHNlXG4gICAgdmFyIGNvcHkgPSBPYmplY3QuY3JlYXRlKG51bGwpXG5cbiAgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMob2JqKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY29weSwga2V5LCBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iaiwga2V5KSlcbiAgfSlcblxuICByZXR1cm4gY29weVxufVxuIiwidmFyIGZzID0gcmVxdWlyZSgnZnMnKVxudmFyIHBvbHlmaWxscyA9IHJlcXVpcmUoJy4vcG9seWZpbGxzLmpzJylcbnZhciBsZWdhY3kgPSByZXF1aXJlKCcuL2xlZ2FjeS1zdHJlYW1zLmpzJylcbnZhciBxdWV1ZSA9IFtdXG5cbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpXG5cbmZ1bmN0aW9uIG5vb3AgKCkge31cblxudmFyIGRlYnVnID0gbm9vcFxuaWYgKHV0aWwuZGVidWdsb2cpXG4gIGRlYnVnID0gdXRpbC5kZWJ1Z2xvZygnZ2ZzNCcpXG5lbHNlIGlmICgvXFxiZ2ZzNFxcYi9pLnRlc3QocHJvY2Vzcy5lbnYuTk9ERV9ERUJVRyB8fCAnJykpXG4gIGRlYnVnID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG0gPSB1dGlsLmZvcm1hdC5hcHBseSh1dGlsLCBhcmd1bWVudHMpXG4gICAgbSA9ICdHRlM0OiAnICsgbS5zcGxpdCgvXFxuLykuam9pbignXFxuR0ZTNDogJylcbiAgICBjb25zb2xlLmVycm9yKG0pXG4gIH1cblxuaWYgKC9cXGJnZnM0XFxiL2kudGVzdChwcm9jZXNzLmVudi5OT0RFX0RFQlVHIHx8ICcnKSkge1xuICBwcm9jZXNzLm9uKCdleGl0JywgZnVuY3Rpb24oKSB7XG4gICAgZGVidWcocXVldWUpXG4gICAgcmVxdWlyZSgnYXNzZXJ0JykuZXF1YWwocXVldWUubGVuZ3RoLCAwKVxuICB9KVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHBhdGNoKHJlcXVpcmUoJy4vZnMuanMnKSlcbmlmIChwcm9jZXNzLmVudi5URVNUX0dSQUNFRlVMX0ZTX0dMT0JBTF9QQVRDSCkge1xuICBtb2R1bGUuZXhwb3J0cyA9IHBhdGNoKGZzKVxufVxuXG4vLyBBbHdheXMgcGF0Y2ggZnMuY2xvc2UvY2xvc2VTeW5jLCBiZWNhdXNlIHdlIHdhbnQgdG9cbi8vIHJldHJ5KCkgd2hlbmV2ZXIgYSBjbG9zZSBoYXBwZW5zICphbnl3aGVyZSogaW4gdGhlIHByb2dyYW0uXG4vLyBUaGlzIGlzIGVzc2VudGlhbCB3aGVuIG11bHRpcGxlIGdyYWNlZnVsLWZzIGluc3RhbmNlcyBhcmVcbi8vIGluIHBsYXkgYXQgdGhlIHNhbWUgdGltZS5cbm1vZHVsZS5leHBvcnRzLmNsb3NlID1cbmZzLmNsb3NlID0gKGZ1bmN0aW9uIChmcyRjbG9zZSkgeyByZXR1cm4gZnVuY3Rpb24gKGZkLCBjYikge1xuICByZXR1cm4gZnMkY2xvc2UuY2FsbChmcywgZmQsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICBpZiAoIWVycilcbiAgICAgIHJldHJ5KClcblxuICAgIGlmICh0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpXG4gICAgICBjYi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gIH0pXG59fSkoZnMuY2xvc2UpXG5cbm1vZHVsZS5leHBvcnRzLmNsb3NlU3luYyA9XG5mcy5jbG9zZVN5bmMgPSAoZnVuY3Rpb24gKGZzJGNsb3NlU3luYykgeyByZXR1cm4gZnVuY3Rpb24gKGZkKSB7XG4gIC8vIE5vdGUgdGhhdCBncmFjZWZ1bC1mcyBhbHNvIHJldHJpZXMgd2hlbiBmcy5jbG9zZVN5bmMoKSBmYWlscy5cbiAgLy8gTG9va3MgbGlrZSBhIGJ1ZyB0byBtZSwgYWx0aG91Z2ggaXQncyBwcm9iYWJseSBhIGhhcm1sZXNzIG9uZS5cbiAgdmFyIHJ2YWwgPSBmcyRjbG9zZVN5bmMuYXBwbHkoZnMsIGFyZ3VtZW50cylcbiAgcmV0cnkoKVxuICByZXR1cm4gcnZhbFxufX0pKGZzLmNsb3NlU3luYylcblxuZnVuY3Rpb24gcGF0Y2ggKGZzKSB7XG4gIC8vIEV2ZXJ5dGhpbmcgdGhhdCByZWZlcmVuY2VzIHRoZSBvcGVuKCkgZnVuY3Rpb24gbmVlZHMgdG8gYmUgaW4gaGVyZVxuICBwb2x5ZmlsbHMoZnMpXG4gIGZzLmdyYWNlZnVsaWZ5ID0gcGF0Y2hcbiAgZnMuRmlsZVJlYWRTdHJlYW0gPSBSZWFkU3RyZWFtOyAgLy8gTGVnYWN5IG5hbWUuXG4gIGZzLkZpbGVXcml0ZVN0cmVhbSA9IFdyaXRlU3RyZWFtOyAgLy8gTGVnYWN5IG5hbWUuXG4gIGZzLlJlYWRTdHJlYW0gPSBSZWFkU3RyZWFtO1xuICBmcy5Xcml0ZVN0cmVhbSA9IFdyaXRlU3RyZWFtO1xuICBmcy5jcmVhdGVSZWFkU3RyZWFtID0gY3JlYXRlUmVhZFN0cmVhbVxuICBmcy5jcmVhdGVXcml0ZVN0cmVhbSA9IGNyZWF0ZVdyaXRlU3RyZWFtXG4gIHZhciBmcyRyZWFkRmlsZSA9IGZzLnJlYWRGaWxlXG4gIGZzLnJlYWRGaWxlID0gcmVhZEZpbGVcbiAgZnVuY3Rpb24gcmVhZEZpbGUgKHBhdGgsIG9wdGlvbnMsIGNiKSB7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnZnVuY3Rpb24nKVxuICAgICAgY2IgPSBvcHRpb25zLCBvcHRpb25zID0gbnVsbFxuXG4gICAgcmV0dXJuIGdvJHJlYWRGaWxlKHBhdGgsIG9wdGlvbnMsIGNiKVxuXG4gICAgZnVuY3Rpb24gZ28kcmVhZEZpbGUgKHBhdGgsIG9wdGlvbnMsIGNiKSB7XG4gICAgICByZXR1cm4gZnMkcmVhZEZpbGUocGF0aCwgb3B0aW9ucywgZnVuY3Rpb24gKGVycikge1xuICAgICAgICBpZiAoZXJyICYmIChlcnIuY29kZSA9PT0gJ0VNRklMRScgfHwgZXJyLmNvZGUgPT09ICdFTkZJTEUnKSlcbiAgICAgICAgICBlbnF1ZXVlKFtnbyRyZWFkRmlsZSwgW3BhdGgsIG9wdGlvbnMsIGNiXV0pXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGlmICh0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpXG4gICAgICAgICAgICBjYi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICAgICAgcmV0cnkoKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIHZhciBmcyR3cml0ZUZpbGUgPSBmcy53cml0ZUZpbGVcbiAgZnMud3JpdGVGaWxlID0gd3JpdGVGaWxlXG4gIGZ1bmN0aW9uIHdyaXRlRmlsZSAocGF0aCwgZGF0YSwgb3B0aW9ucywgY2IpIHtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicpXG4gICAgICBjYiA9IG9wdGlvbnMsIG9wdGlvbnMgPSBudWxsXG5cbiAgICByZXR1cm4gZ28kd3JpdGVGaWxlKHBhdGgsIGRhdGEsIG9wdGlvbnMsIGNiKVxuXG4gICAgZnVuY3Rpb24gZ28kd3JpdGVGaWxlIChwYXRoLCBkYXRhLCBvcHRpb25zLCBjYikge1xuICAgICAgcmV0dXJuIGZzJHdyaXRlRmlsZShwYXRoLCBkYXRhLCBvcHRpb25zLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIGlmIChlcnIgJiYgKGVyci5jb2RlID09PSAnRU1GSUxFJyB8fCBlcnIuY29kZSA9PT0gJ0VORklMRScpKVxuICAgICAgICAgIGVucXVldWUoW2dvJHdyaXRlRmlsZSwgW3BhdGgsIGRhdGEsIG9wdGlvbnMsIGNiXV0pXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGlmICh0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpXG4gICAgICAgICAgICBjYi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICAgICAgcmV0cnkoKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIHZhciBmcyRhcHBlbmRGaWxlID0gZnMuYXBwZW5kRmlsZVxuICBpZiAoZnMkYXBwZW5kRmlsZSlcbiAgICBmcy5hcHBlbmRGaWxlID0gYXBwZW5kRmlsZVxuICBmdW5jdGlvbiBhcHBlbmRGaWxlIChwYXRoLCBkYXRhLCBvcHRpb25zLCBjYikge1xuICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgIGNiID0gb3B0aW9ucywgb3B0aW9ucyA9IG51bGxcblxuICAgIHJldHVybiBnbyRhcHBlbmRGaWxlKHBhdGgsIGRhdGEsIG9wdGlvbnMsIGNiKVxuXG4gICAgZnVuY3Rpb24gZ28kYXBwZW5kRmlsZSAocGF0aCwgZGF0YSwgb3B0aW9ucywgY2IpIHtcbiAgICAgIHJldHVybiBmcyRhcHBlbmRGaWxlKHBhdGgsIGRhdGEsIG9wdGlvbnMsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgaWYgKGVyciAmJiAoZXJyLmNvZGUgPT09ICdFTUZJTEUnIHx8IGVyci5jb2RlID09PSAnRU5GSUxFJykpXG4gICAgICAgICAgZW5xdWV1ZShbZ28kYXBwZW5kRmlsZSwgW3BhdGgsIGRhdGEsIG9wdGlvbnMsIGNiXV0pXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGlmICh0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpXG4gICAgICAgICAgICBjYi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICAgICAgcmV0cnkoKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIHZhciBmcyRyZWFkZGlyID0gZnMucmVhZGRpclxuICBmcy5yZWFkZGlyID0gcmVhZGRpclxuICBmdW5jdGlvbiByZWFkZGlyIChwYXRoLCBvcHRpb25zLCBjYikge1xuICAgIHZhciBhcmdzID0gW3BhdGhdXG4gICAgaWYgKHR5cGVvZiBvcHRpb25zICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBhcmdzLnB1c2gob3B0aW9ucylcbiAgICB9IGVsc2Uge1xuICAgICAgY2IgPSBvcHRpb25zXG4gICAgfVxuICAgIGFyZ3MucHVzaChnbyRyZWFkZGlyJGNiKVxuXG4gICAgcmV0dXJuIGdvJHJlYWRkaXIoYXJncylcblxuICAgIGZ1bmN0aW9uIGdvJHJlYWRkaXIkY2IgKGVyciwgZmlsZXMpIHtcbiAgICAgIGlmIChmaWxlcyAmJiBmaWxlcy5zb3J0KVxuICAgICAgICBmaWxlcy5zb3J0KClcblxuICAgICAgaWYgKGVyciAmJiAoZXJyLmNvZGUgPT09ICdFTUZJTEUnIHx8IGVyci5jb2RlID09PSAnRU5GSUxFJykpXG4gICAgICAgIGVucXVldWUoW2dvJHJlYWRkaXIsIFthcmdzXV0pXG4gICAgICBlbHNlIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgICBjYi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICAgIHJldHJ5KClcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBnbyRyZWFkZGlyIChhcmdzKSB7XG4gICAgcmV0dXJuIGZzJHJlYWRkaXIuYXBwbHkoZnMsIGFyZ3MpXG4gIH1cblxuICBpZiAocHJvY2Vzcy52ZXJzaW9uLnN1YnN0cigwLCA0KSA9PT0gJ3YwLjgnKSB7XG4gICAgdmFyIGxlZ1N0cmVhbXMgPSBsZWdhY3koZnMpXG4gICAgUmVhZFN0cmVhbSA9IGxlZ1N0cmVhbXMuUmVhZFN0cmVhbVxuICAgIFdyaXRlU3RyZWFtID0gbGVnU3RyZWFtcy5Xcml0ZVN0cmVhbVxuICB9XG5cbiAgdmFyIGZzJFJlYWRTdHJlYW0gPSBmcy5SZWFkU3RyZWFtXG4gIFJlYWRTdHJlYW0ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShmcyRSZWFkU3RyZWFtLnByb3RvdHlwZSlcbiAgUmVhZFN0cmVhbS5wcm90b3R5cGUub3BlbiA9IFJlYWRTdHJlYW0kb3BlblxuXG4gIHZhciBmcyRXcml0ZVN0cmVhbSA9IGZzLldyaXRlU3RyZWFtXG4gIFdyaXRlU3RyZWFtLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoZnMkV3JpdGVTdHJlYW0ucHJvdG90eXBlKVxuICBXcml0ZVN0cmVhbS5wcm90b3R5cGUub3BlbiA9IFdyaXRlU3RyZWFtJG9wZW5cblxuICBmcy5SZWFkU3RyZWFtID0gUmVhZFN0cmVhbVxuICBmcy5Xcml0ZVN0cmVhbSA9IFdyaXRlU3RyZWFtXG5cbiAgZnVuY3Rpb24gUmVhZFN0cmVhbSAocGF0aCwgb3B0aW9ucykge1xuICAgIGlmICh0aGlzIGluc3RhbmNlb2YgUmVhZFN0cmVhbSlcbiAgICAgIHJldHVybiBmcyRSZWFkU3RyZWFtLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyksIHRoaXNcbiAgICBlbHNlXG4gICAgICByZXR1cm4gUmVhZFN0cmVhbS5hcHBseShPYmplY3QuY3JlYXRlKFJlYWRTdHJlYW0ucHJvdG90eXBlKSwgYXJndW1lbnRzKVxuICB9XG5cbiAgZnVuY3Rpb24gUmVhZFN0cmVhbSRvcGVuICgpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXNcbiAgICBvcGVuKHRoYXQucGF0aCwgdGhhdC5mbGFncywgdGhhdC5tb2RlLCBmdW5jdGlvbiAoZXJyLCBmZCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBpZiAodGhhdC5hdXRvQ2xvc2UpXG4gICAgICAgICAgdGhhdC5kZXN0cm95KClcblxuICAgICAgICB0aGF0LmVtaXQoJ2Vycm9yJywgZXJyKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhhdC5mZCA9IGZkXG4gICAgICAgIHRoYXQuZW1pdCgnb3BlbicsIGZkKVxuICAgICAgICB0aGF0LnJlYWQoKVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiBXcml0ZVN0cmVhbSAocGF0aCwgb3B0aW9ucykge1xuICAgIGlmICh0aGlzIGluc3RhbmNlb2YgV3JpdGVTdHJlYW0pXG4gICAgICByZXR1cm4gZnMkV3JpdGVTdHJlYW0uYXBwbHkodGhpcywgYXJndW1lbnRzKSwgdGhpc1xuICAgIGVsc2VcbiAgICAgIHJldHVybiBXcml0ZVN0cmVhbS5hcHBseShPYmplY3QuY3JlYXRlKFdyaXRlU3RyZWFtLnByb3RvdHlwZSksIGFyZ3VtZW50cylcbiAgfVxuXG4gIGZ1bmN0aW9uIFdyaXRlU3RyZWFtJG9wZW4gKCkge1xuICAgIHZhciB0aGF0ID0gdGhpc1xuICAgIG9wZW4odGhhdC5wYXRoLCB0aGF0LmZsYWdzLCB0aGF0Lm1vZGUsIGZ1bmN0aW9uIChlcnIsIGZkKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHRoYXQuZGVzdHJveSgpXG4gICAgICAgIHRoYXQuZW1pdCgnZXJyb3InLCBlcnIpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGF0LmZkID0gZmRcbiAgICAgICAgdGhhdC5lbWl0KCdvcGVuJywgZmQpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZVJlYWRTdHJlYW0gKHBhdGgsIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gbmV3IFJlYWRTdHJlYW0ocGF0aCwgb3B0aW9ucylcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZVdyaXRlU3RyZWFtIChwYXRoLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIG5ldyBXcml0ZVN0cmVhbShwYXRoLCBvcHRpb25zKVxuICB9XG5cbiAgdmFyIGZzJG9wZW4gPSBmcy5vcGVuXG4gIGZzLm9wZW4gPSBvcGVuXG4gIGZ1bmN0aW9uIG9wZW4gKHBhdGgsIGZsYWdzLCBtb2RlLCBjYikge1xuICAgIGlmICh0eXBlb2YgbW9kZSA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgIGNiID0gbW9kZSwgbW9kZSA9IG51bGxcblxuICAgIHJldHVybiBnbyRvcGVuKHBhdGgsIGZsYWdzLCBtb2RlLCBjYilcblxuICAgIGZ1bmN0aW9uIGdvJG9wZW4gKHBhdGgsIGZsYWdzLCBtb2RlLCBjYikge1xuICAgICAgcmV0dXJuIGZzJG9wZW4ocGF0aCwgZmxhZ3MsIG1vZGUsIGZ1bmN0aW9uIChlcnIsIGZkKSB7XG4gICAgICAgIGlmIChlcnIgJiYgKGVyci5jb2RlID09PSAnRU1GSUxFJyB8fCBlcnIuY29kZSA9PT0gJ0VORklMRScpKVxuICAgICAgICAgIGVucXVldWUoW2dvJG9wZW4sIFtwYXRoLCBmbGFncywgbW9kZSwgY2JdXSlcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgICAgIGNiLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICAgICAgICByZXRyeSgpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZzXG59XG5cbmZ1bmN0aW9uIGVucXVldWUgKGVsZW0pIHtcbiAgZGVidWcoJ0VOUVVFVUUnLCBlbGVtWzBdLm5hbWUsIGVsZW1bMV0pXG4gIHF1ZXVlLnB1c2goZWxlbSlcbn1cblxuZnVuY3Rpb24gcmV0cnkgKCkge1xuICB2YXIgZWxlbSA9IHF1ZXVlLnNoaWZ0KClcbiAgaWYgKGVsZW0pIHtcbiAgICBkZWJ1ZygnUkVUUlknLCBlbGVtWzBdLm5hbWUsIGVsZW1bMV0pXG4gICAgZWxlbVswXS5hcHBseShudWxsLCBlbGVtWzFdKVxuICB9XG59XG4iLCJ2YXIgU3RyZWFtID0gcmVxdWlyZSgnc3RyZWFtJykuU3RyZWFtXG5cbm1vZHVsZS5leHBvcnRzID0gbGVnYWN5XG5cbmZ1bmN0aW9uIGxlZ2FjeSAoZnMpIHtcbiAgcmV0dXJuIHtcbiAgICBSZWFkU3RyZWFtOiBSZWFkU3RyZWFtLFxuICAgIFdyaXRlU3RyZWFtOiBXcml0ZVN0cmVhbVxuICB9XG5cbiAgZnVuY3Rpb24gUmVhZFN0cmVhbSAocGF0aCwgb3B0aW9ucykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBSZWFkU3RyZWFtKSkgcmV0dXJuIG5ldyBSZWFkU3RyZWFtKHBhdGgsIG9wdGlvbnMpO1xuXG4gICAgU3RyZWFtLmNhbGwodGhpcyk7XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB0aGlzLnBhdGggPSBwYXRoO1xuICAgIHRoaXMuZmQgPSBudWxsO1xuICAgIHRoaXMucmVhZGFibGUgPSB0cnVlO1xuICAgIHRoaXMucGF1c2VkID0gZmFsc2U7XG5cbiAgICB0aGlzLmZsYWdzID0gJ3InO1xuICAgIHRoaXMubW9kZSA9IDQzODsgLyo9MDY2NiovXG4gICAgdGhpcy5idWZmZXJTaXplID0gNjQgKiAxMDI0O1xuXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAvLyBNaXhpbiBvcHRpb25zIGludG8gdGhpc1xuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMob3B0aW9ucyk7XG4gICAgZm9yICh2YXIgaW5kZXggPSAwLCBsZW5ndGggPSBrZXlzLmxlbmd0aDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHZhciBrZXkgPSBrZXlzW2luZGV4XTtcbiAgICAgIHRoaXNba2V5XSA9IG9wdGlvbnNba2V5XTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5lbmNvZGluZykgdGhpcy5zZXRFbmNvZGluZyh0aGlzLmVuY29kaW5nKTtcblxuICAgIGlmICh0aGlzLnN0YXJ0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICgnbnVtYmVyJyAhPT0gdHlwZW9mIHRoaXMuc3RhcnQpIHtcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdzdGFydCBtdXN0IGJlIGEgTnVtYmVyJyk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5lbmQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLmVuZCA9IEluZmluaXR5O1xuICAgICAgfSBlbHNlIGlmICgnbnVtYmVyJyAhPT0gdHlwZW9mIHRoaXMuZW5kKSB7XG4gICAgICAgIHRocm93IFR5cGVFcnJvcignZW5kIG11c3QgYmUgYSBOdW1iZXInKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuc3RhcnQgPiB0aGlzLmVuZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3N0YXJ0IG11c3QgYmUgPD0gZW5kJyk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMucG9zID0gdGhpcy5zdGFydDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5mZCAhPT0gbnVsbCkge1xuICAgICAgcHJvY2Vzcy5uZXh0VGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgc2VsZi5fcmVhZCgpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZnMub3Blbih0aGlzLnBhdGgsIHRoaXMuZmxhZ3MsIHRoaXMubW9kZSwgZnVuY3Rpb24gKGVyciwgZmQpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgc2VsZi5lbWl0KCdlcnJvcicsIGVycik7XG4gICAgICAgIHNlbGYucmVhZGFibGUgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBzZWxmLmZkID0gZmQ7XG4gICAgICBzZWxmLmVtaXQoJ29wZW4nLCBmZCk7XG4gICAgICBzZWxmLl9yZWFkKCk7XG4gICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIFdyaXRlU3RyZWFtIChwYXRoLCBvcHRpb25zKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFdyaXRlU3RyZWFtKSkgcmV0dXJuIG5ldyBXcml0ZVN0cmVhbShwYXRoLCBvcHRpb25zKTtcblxuICAgIFN0cmVhbS5jYWxsKHRoaXMpO1xuXG4gICAgdGhpcy5wYXRoID0gcGF0aDtcbiAgICB0aGlzLmZkID0gbnVsbDtcbiAgICB0aGlzLndyaXRhYmxlID0gdHJ1ZTtcblxuICAgIHRoaXMuZmxhZ3MgPSAndyc7XG4gICAgdGhpcy5lbmNvZGluZyA9ICdiaW5hcnknO1xuICAgIHRoaXMubW9kZSA9IDQzODsgLyo9MDY2NiovXG4gICAgdGhpcy5ieXRlc1dyaXR0ZW4gPSAwO1xuXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAvLyBNaXhpbiBvcHRpb25zIGludG8gdGhpc1xuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMob3B0aW9ucyk7XG4gICAgZm9yICh2YXIgaW5kZXggPSAwLCBsZW5ndGggPSBrZXlzLmxlbmd0aDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHZhciBrZXkgPSBrZXlzW2luZGV4XTtcbiAgICAgIHRoaXNba2V5XSA9IG9wdGlvbnNba2V5XTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zdGFydCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAoJ251bWJlcicgIT09IHR5cGVvZiB0aGlzLnN0YXJ0KSB7XG4gICAgICAgIHRocm93IFR5cGVFcnJvcignc3RhcnQgbXVzdCBiZSBhIE51bWJlcicpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuc3RhcnQgPCAwKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignc3RhcnQgbXVzdCBiZSA+PSB6ZXJvJyk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMucG9zID0gdGhpcy5zdGFydDtcbiAgICB9XG5cbiAgICB0aGlzLmJ1c3kgPSBmYWxzZTtcbiAgICB0aGlzLl9xdWV1ZSA9IFtdO1xuXG4gICAgaWYgKHRoaXMuZmQgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuX29wZW4gPSBmcy5vcGVuO1xuICAgICAgdGhpcy5fcXVldWUucHVzaChbdGhpcy5fb3BlbiwgdGhpcy5wYXRoLCB0aGlzLmZsYWdzLCB0aGlzLm1vZGUsIHVuZGVmaW5lZF0pO1xuICAgICAgdGhpcy5mbHVzaCgpO1xuICAgIH1cbiAgfVxufVxuIiwidmFyIGZzID0gcmVxdWlyZSgnLi9mcy5qcycpXG52YXIgY29uc3RhbnRzID0gcmVxdWlyZSgnY29uc3RhbnRzJylcblxudmFyIG9yaWdDd2QgPSBwcm9jZXNzLmN3ZFxudmFyIGN3ZCA9IG51bGxcblxudmFyIHBsYXRmb3JtID0gcHJvY2Vzcy5lbnYuR1JBQ0VGVUxfRlNfUExBVEZPUk0gfHwgcHJvY2Vzcy5wbGF0Zm9ybVxuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uKCkge1xuICBpZiAoIWN3ZClcbiAgICBjd2QgPSBvcmlnQ3dkLmNhbGwocHJvY2VzcylcbiAgcmV0dXJuIGN3ZFxufVxudHJ5IHtcbiAgcHJvY2Vzcy5jd2QoKVxufSBjYXRjaCAoZXIpIHt9XG5cbnZhciBjaGRpciA9IHByb2Nlc3MuY2hkaXJcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbihkKSB7XG4gIGN3ZCA9IG51bGxcbiAgY2hkaXIuY2FsbChwcm9jZXNzLCBkKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHBhdGNoXG5cbmZ1bmN0aW9uIHBhdGNoIChmcykge1xuICAvLyAocmUtKWltcGxlbWVudCBzb21lIHRoaW5ncyB0aGF0IGFyZSBrbm93biBidXN0ZWQgb3IgbWlzc2luZy5cblxuICAvLyBsY2htb2QsIGJyb2tlbiBwcmlvciB0byAwLjYuMlxuICAvLyBiYWNrLXBvcnQgdGhlIGZpeCBoZXJlLlxuICBpZiAoY29uc3RhbnRzLmhhc093blByb3BlcnR5KCdPX1NZTUxJTksnKSAmJlxuICAgICAgcHJvY2Vzcy52ZXJzaW9uLm1hdGNoKC9edjBcXC42XFwuWzAtMl18XnYwXFwuNVxcLi8pKSB7XG4gICAgcGF0Y2hMY2htb2QoZnMpXG4gIH1cblxuICAvLyBsdXRpbWVzIGltcGxlbWVudGF0aW9uLCBvciBuby1vcFxuICBpZiAoIWZzLmx1dGltZXMpIHtcbiAgICBwYXRjaEx1dGltZXMoZnMpXG4gIH1cblxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vaXNhYWNzL25vZGUtZ3JhY2VmdWwtZnMvaXNzdWVzLzRcbiAgLy8gQ2hvd24gc2hvdWxkIG5vdCBmYWlsIG9uIGVpbnZhbCBvciBlcGVybSBpZiBub24tcm9vdC5cbiAgLy8gSXQgc2hvdWxkIG5vdCBmYWlsIG9uIGVub3N5cyBldmVyLCBhcyB0aGlzIGp1c3QgaW5kaWNhdGVzXG4gIC8vIHRoYXQgYSBmcyBkb2Vzbid0IHN1cHBvcnQgdGhlIGludGVuZGVkIG9wZXJhdGlvbi5cblxuICBmcy5jaG93biA9IGNob3duRml4KGZzLmNob3duKVxuICBmcy5mY2hvd24gPSBjaG93bkZpeChmcy5mY2hvd24pXG4gIGZzLmxjaG93biA9IGNob3duRml4KGZzLmxjaG93bilcblxuICBmcy5jaG1vZCA9IGNobW9kRml4KGZzLmNobW9kKVxuICBmcy5mY2htb2QgPSBjaG1vZEZpeChmcy5mY2htb2QpXG4gIGZzLmxjaG1vZCA9IGNobW9kRml4KGZzLmxjaG1vZClcblxuICBmcy5jaG93blN5bmMgPSBjaG93bkZpeFN5bmMoZnMuY2hvd25TeW5jKVxuICBmcy5mY2hvd25TeW5jID0gY2hvd25GaXhTeW5jKGZzLmZjaG93blN5bmMpXG4gIGZzLmxjaG93blN5bmMgPSBjaG93bkZpeFN5bmMoZnMubGNob3duU3luYylcblxuICBmcy5jaG1vZFN5bmMgPSBjaG1vZEZpeFN5bmMoZnMuY2htb2RTeW5jKVxuICBmcy5mY2htb2RTeW5jID0gY2htb2RGaXhTeW5jKGZzLmZjaG1vZFN5bmMpXG4gIGZzLmxjaG1vZFN5bmMgPSBjaG1vZEZpeFN5bmMoZnMubGNobW9kU3luYylcblxuICBmcy5zdGF0ID0gc3RhdEZpeChmcy5zdGF0KVxuICBmcy5mc3RhdCA9IHN0YXRGaXgoZnMuZnN0YXQpXG4gIGZzLmxzdGF0ID0gc3RhdEZpeChmcy5sc3RhdClcblxuICBmcy5zdGF0U3luYyA9IHN0YXRGaXhTeW5jKGZzLnN0YXRTeW5jKVxuICBmcy5mc3RhdFN5bmMgPSBzdGF0Rml4U3luYyhmcy5mc3RhdFN5bmMpXG4gIGZzLmxzdGF0U3luYyA9IHN0YXRGaXhTeW5jKGZzLmxzdGF0U3luYylcblxuICAvLyBpZiBsY2htb2QvbGNob3duIGRvIG5vdCBleGlzdCwgdGhlbiBtYWtlIHRoZW0gbm8tb3BzXG4gIGlmICghZnMubGNobW9kKSB7XG4gICAgZnMubGNobW9kID0gZnVuY3Rpb24gKHBhdGgsIG1vZGUsIGNiKSB7XG4gICAgICBpZiAoY2IpIHByb2Nlc3MubmV4dFRpY2soY2IpXG4gICAgfVxuICAgIGZzLmxjaG1vZFN5bmMgPSBmdW5jdGlvbiAoKSB7fVxuICB9XG4gIGlmICghZnMubGNob3duKSB7XG4gICAgZnMubGNob3duID0gZnVuY3Rpb24gKHBhdGgsIHVpZCwgZ2lkLCBjYikge1xuICAgICAgaWYgKGNiKSBwcm9jZXNzLm5leHRUaWNrKGNiKVxuICAgIH1cbiAgICBmcy5sY2hvd25TeW5jID0gZnVuY3Rpb24gKCkge31cbiAgfVxuXG4gIC8vIG9uIFdpbmRvd3MsIEEvViBzb2Z0d2FyZSBjYW4gbG9jayB0aGUgZGlyZWN0b3J5LCBjYXVzaW5nIHRoaXNcbiAgLy8gdG8gZmFpbCB3aXRoIGFuIEVBQ0NFUyBvciBFUEVSTSBpZiB0aGUgZGlyZWN0b3J5IGNvbnRhaW5zIG5ld2x5XG4gIC8vIGNyZWF0ZWQgZmlsZXMuICBUcnkgYWdhaW4gb24gZmFpbHVyZSwgZm9yIHVwIHRvIDYwIHNlY29uZHMuXG5cbiAgLy8gU2V0IHRoZSB0aW1lb3V0IHRoaXMgbG9uZyBiZWNhdXNlIHNvbWUgV2luZG93cyBBbnRpLVZpcnVzLCBzdWNoIGFzIFBhcml0eVxuICAvLyBiaXQ5LCBtYXkgbG9jayBmaWxlcyBmb3IgdXAgdG8gYSBtaW51dGUsIGNhdXNpbmcgbnBtIHBhY2thZ2UgaW5zdGFsbFxuICAvLyBmYWlsdXJlcy4gQWxzbywgdGFrZSBjYXJlIHRvIHlpZWxkIHRoZSBzY2hlZHVsZXIuIFdpbmRvd3Mgc2NoZWR1bGluZyBnaXZlc1xuICAvLyBDUFUgdG8gYSBidXN5IGxvb3BpbmcgcHJvY2Vzcywgd2hpY2ggY2FuIGNhdXNlIHRoZSBwcm9ncmFtIGNhdXNpbmcgdGhlIGxvY2tcbiAgLy8gY29udGVudGlvbiB0byBiZSBzdGFydmVkIG9mIENQVSBieSBub2RlLCBzbyB0aGUgY29udGVudGlvbiBkb2Vzbid0IHJlc29sdmUuXG4gIGlmIChwbGF0Zm9ybSA9PT0gXCJ3aW4zMlwiKSB7XG4gICAgZnMucmVuYW1lID0gKGZ1bmN0aW9uIChmcyRyZW5hbWUpIHsgcmV0dXJuIGZ1bmN0aW9uIChmcm9tLCB0bywgY2IpIHtcbiAgICAgIHZhciBzdGFydCA9IERhdGUubm93KClcbiAgICAgIHZhciBiYWNrb2ZmID0gMDtcbiAgICAgIGZzJHJlbmFtZShmcm9tLCB0bywgZnVuY3Rpb24gQ0IgKGVyKSB7XG4gICAgICAgIGlmIChlclxuICAgICAgICAgICAgJiYgKGVyLmNvZGUgPT09IFwiRUFDQ0VTXCIgfHwgZXIuY29kZSA9PT0gXCJFUEVSTVwiKVxuICAgICAgICAgICAgJiYgRGF0ZS5ub3coKSAtIHN0YXJ0IDwgNjAwMDApIHtcbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZnMuc3RhdCh0bywgZnVuY3Rpb24gKHN0YXRlciwgc3QpIHtcbiAgICAgICAgICAgICAgaWYgKHN0YXRlciAmJiBzdGF0ZXIuY29kZSA9PT0gXCJFTk9FTlRcIilcbiAgICAgICAgICAgICAgICBmcyRyZW5hbWUoZnJvbSwgdG8sIENCKTtcbiAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGNiKGVyKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9LCBiYWNrb2ZmKVxuICAgICAgICAgIGlmIChiYWNrb2ZmIDwgMTAwKVxuICAgICAgICAgICAgYmFja29mZiArPSAxMDtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNiKSBjYihlcilcbiAgICAgIH0pXG4gICAgfX0pKGZzLnJlbmFtZSlcbiAgfVxuXG4gIC8vIGlmIHJlYWQoKSByZXR1cm5zIEVBR0FJTiwgdGhlbiBqdXN0IHRyeSBpdCBhZ2Fpbi5cbiAgZnMucmVhZCA9IChmdW5jdGlvbiAoZnMkcmVhZCkgeyByZXR1cm4gZnVuY3Rpb24gKGZkLCBidWZmZXIsIG9mZnNldCwgbGVuZ3RoLCBwb3NpdGlvbiwgY2FsbGJhY2tfKSB7XG4gICAgdmFyIGNhbGxiYWNrXG4gICAgaWYgKGNhbGxiYWNrXyAmJiB0eXBlb2YgY2FsbGJhY2tfID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB2YXIgZWFnQ291bnRlciA9IDBcbiAgICAgIGNhbGxiYWNrID0gZnVuY3Rpb24gKGVyLCBfLCBfXykge1xuICAgICAgICBpZiAoZXIgJiYgZXIuY29kZSA9PT0gJ0VBR0FJTicgJiYgZWFnQ291bnRlciA8IDEwKSB7XG4gICAgICAgICAgZWFnQ291bnRlciArK1xuICAgICAgICAgIHJldHVybiBmcyRyZWFkLmNhbGwoZnMsIGZkLCBidWZmZXIsIG9mZnNldCwgbGVuZ3RoLCBwb3NpdGlvbiwgY2FsbGJhY2spXG4gICAgICAgIH1cbiAgICAgICAgY2FsbGJhY2tfLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZzJHJlYWQuY2FsbChmcywgZmQsIGJ1ZmZlciwgb2Zmc2V0LCBsZW5ndGgsIHBvc2l0aW9uLCBjYWxsYmFjaylcbiAgfX0pKGZzLnJlYWQpXG5cbiAgZnMucmVhZFN5bmMgPSAoZnVuY3Rpb24gKGZzJHJlYWRTeW5jKSB7IHJldHVybiBmdW5jdGlvbiAoZmQsIGJ1ZmZlciwgb2Zmc2V0LCBsZW5ndGgsIHBvc2l0aW9uKSB7XG4gICAgdmFyIGVhZ0NvdW50ZXIgPSAwXG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBmcyRyZWFkU3luYy5jYWxsKGZzLCBmZCwgYnVmZmVyLCBvZmZzZXQsIGxlbmd0aCwgcG9zaXRpb24pXG4gICAgICB9IGNhdGNoIChlcikge1xuICAgICAgICBpZiAoZXIuY29kZSA9PT0gJ0VBR0FJTicgJiYgZWFnQ291bnRlciA8IDEwKSB7XG4gICAgICAgICAgZWFnQ291bnRlciArK1xuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgZXJcbiAgICAgIH1cbiAgICB9XG4gIH19KShmcy5yZWFkU3luYylcbn1cblxuZnVuY3Rpb24gcGF0Y2hMY2htb2QgKGZzKSB7XG4gIGZzLmxjaG1vZCA9IGZ1bmN0aW9uIChwYXRoLCBtb2RlLCBjYWxsYmFjaykge1xuICAgIGZzLm9wZW4oIHBhdGhcbiAgICAgICAgICAgLCBjb25zdGFudHMuT19XUk9OTFkgfCBjb25zdGFudHMuT19TWU1MSU5LXG4gICAgICAgICAgICwgbW9kZVxuICAgICAgICAgICAsIGZ1bmN0aW9uIChlcnIsIGZkKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soZXJyKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIC8vIHByZWZlciB0byByZXR1cm4gdGhlIGNobW9kIGVycm9yLCBpZiBvbmUgb2NjdXJzLFxuICAgICAgLy8gYnV0IHN0aWxsIHRyeSB0byBjbG9zZSwgYW5kIHJlcG9ydCBjbG9zaW5nIGVycm9ycyBpZiB0aGV5IG9jY3VyLlxuICAgICAgZnMuZmNobW9kKGZkLCBtb2RlLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIGZzLmNsb3NlKGZkLCBmdW5jdGlvbihlcnIyKSB7XG4gICAgICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjayhlcnIgfHwgZXJyMilcbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIGZzLmxjaG1vZFN5bmMgPSBmdW5jdGlvbiAocGF0aCwgbW9kZSkge1xuICAgIHZhciBmZCA9IGZzLm9wZW5TeW5jKHBhdGgsIGNvbnN0YW50cy5PX1dST05MWSB8IGNvbnN0YW50cy5PX1NZTUxJTkssIG1vZGUpXG5cbiAgICAvLyBwcmVmZXIgdG8gcmV0dXJuIHRoZSBjaG1vZCBlcnJvciwgaWYgb25lIG9jY3VycyxcbiAgICAvLyBidXQgc3RpbGwgdHJ5IHRvIGNsb3NlLCBhbmQgcmVwb3J0IGNsb3NpbmcgZXJyb3JzIGlmIHRoZXkgb2NjdXIuXG4gICAgdmFyIHRocmV3ID0gdHJ1ZVxuICAgIHZhciByZXRcbiAgICB0cnkge1xuICAgICAgcmV0ID0gZnMuZmNobW9kU3luYyhmZCwgbW9kZSlcbiAgICAgIHRocmV3ID0gZmFsc2VcbiAgICB9IGZpbmFsbHkge1xuICAgICAgaWYgKHRocmV3KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZnMuY2xvc2VTeW5jKGZkKVxuICAgICAgICB9IGNhdGNoIChlcikge31cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZzLmNsb3NlU3luYyhmZClcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJldFxuICB9XG59XG5cbmZ1bmN0aW9uIHBhdGNoTHV0aW1lcyAoZnMpIHtcbiAgaWYgKGNvbnN0YW50cy5oYXNPd25Qcm9wZXJ0eShcIk9fU1lNTElOS1wiKSkge1xuICAgIGZzLmx1dGltZXMgPSBmdW5jdGlvbiAocGF0aCwgYXQsIG10LCBjYikge1xuICAgICAgZnMub3BlbihwYXRoLCBjb25zdGFudHMuT19TWU1MSU5LLCBmdW5jdGlvbiAoZXIsIGZkKSB7XG4gICAgICAgIGlmIChlcikge1xuICAgICAgICAgIGlmIChjYikgY2IoZXIpXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgZnMuZnV0aW1lcyhmZCwgYXQsIG10LCBmdW5jdGlvbiAoZXIpIHtcbiAgICAgICAgICBmcy5jbG9zZShmZCwgZnVuY3Rpb24gKGVyMikge1xuICAgICAgICAgICAgaWYgKGNiKSBjYihlciB8fCBlcjIpXG4gICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgZnMubHV0aW1lc1N5bmMgPSBmdW5jdGlvbiAocGF0aCwgYXQsIG10KSB7XG4gICAgICB2YXIgZmQgPSBmcy5vcGVuU3luYyhwYXRoLCBjb25zdGFudHMuT19TWU1MSU5LKVxuICAgICAgdmFyIHJldFxuICAgICAgdmFyIHRocmV3ID0gdHJ1ZVxuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0ID0gZnMuZnV0aW1lc1N5bmMoZmQsIGF0LCBtdClcbiAgICAgICAgdGhyZXcgPSBmYWxzZVxuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgaWYgKHRocmV3KSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGZzLmNsb3NlU3luYyhmZClcbiAgICAgICAgICB9IGNhdGNoIChlcikge31cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmcy5jbG9zZVN5bmMoZmQpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiByZXRcbiAgICB9XG5cbiAgfSBlbHNlIHtcbiAgICBmcy5sdXRpbWVzID0gZnVuY3Rpb24gKF9hLCBfYiwgX2MsIGNiKSB7IGlmIChjYikgcHJvY2Vzcy5uZXh0VGljayhjYikgfVxuICAgIGZzLmx1dGltZXNTeW5jID0gZnVuY3Rpb24gKCkge31cbiAgfVxufVxuXG5mdW5jdGlvbiBjaG1vZEZpeCAob3JpZykge1xuICBpZiAoIW9yaWcpIHJldHVybiBvcmlnXG4gIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0LCBtb2RlLCBjYikge1xuICAgIHJldHVybiBvcmlnLmNhbGwoZnMsIHRhcmdldCwgbW9kZSwgZnVuY3Rpb24gKGVyKSB7XG4gICAgICBpZiAoY2hvd25Fck9rKGVyKSkgZXIgPSBudWxsXG4gICAgICBpZiAoY2IpIGNiLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICB9KVxuICB9XG59XG5cbmZ1bmN0aW9uIGNobW9kRml4U3luYyAob3JpZykge1xuICBpZiAoIW9yaWcpIHJldHVybiBvcmlnXG4gIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0LCBtb2RlKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBvcmlnLmNhbGwoZnMsIHRhcmdldCwgbW9kZSlcbiAgICB9IGNhdGNoIChlcikge1xuICAgICAgaWYgKCFjaG93bkVyT2soZXIpKSB0aHJvdyBlclxuICAgIH1cbiAgfVxufVxuXG5cbmZ1bmN0aW9uIGNob3duRml4IChvcmlnKSB7XG4gIGlmICghb3JpZykgcmV0dXJuIG9yaWdcbiAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQsIHVpZCwgZ2lkLCBjYikge1xuICAgIHJldHVybiBvcmlnLmNhbGwoZnMsIHRhcmdldCwgdWlkLCBnaWQsIGZ1bmN0aW9uIChlcikge1xuICAgICAgaWYgKGNob3duRXJPayhlcikpIGVyID0gbnVsbFxuICAgICAgaWYgKGNiKSBjYi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgfSlcbiAgfVxufVxuXG5mdW5jdGlvbiBjaG93bkZpeFN5bmMgKG9yaWcpIHtcbiAgaWYgKCFvcmlnKSByZXR1cm4gb3JpZ1xuICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwgdWlkLCBnaWQpIHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIG9yaWcuY2FsbChmcywgdGFyZ2V0LCB1aWQsIGdpZClcbiAgICB9IGNhdGNoIChlcikge1xuICAgICAgaWYgKCFjaG93bkVyT2soZXIpKSB0aHJvdyBlclxuICAgIH1cbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHN0YXRGaXggKG9yaWcpIHtcbiAgaWYgKCFvcmlnKSByZXR1cm4gb3JpZ1xuICAvLyBPbGRlciB2ZXJzaW9ucyBvZiBOb2RlIGVycm9uZW91c2x5IHJldHVybmVkIHNpZ25lZCBpbnRlZ2VycyBmb3JcbiAgLy8gdWlkICsgZ2lkLlxuICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwgY2IpIHtcbiAgICByZXR1cm4gb3JpZy5jYWxsKGZzLCB0YXJnZXQsIGZ1bmN0aW9uIChlciwgc3RhdHMpIHtcbiAgICAgIGlmICghc3RhdHMpIHJldHVybiBjYi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICBpZiAoc3RhdHMudWlkIDwgMCkgc3RhdHMudWlkICs9IDB4MTAwMDAwMDAwXG4gICAgICBpZiAoc3RhdHMuZ2lkIDwgMCkgc3RhdHMuZ2lkICs9IDB4MTAwMDAwMDAwXG4gICAgICBpZiAoY2IpIGNiLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICB9KVxuICB9XG59XG5cbmZ1bmN0aW9uIHN0YXRGaXhTeW5jIChvcmlnKSB7XG4gIGlmICghb3JpZykgcmV0dXJuIG9yaWdcbiAgLy8gT2xkZXIgdmVyc2lvbnMgb2YgTm9kZSBlcnJvbmVvdXNseSByZXR1cm5lZCBzaWduZWQgaW50ZWdlcnMgZm9yXG4gIC8vIHVpZCArIGdpZC5cbiAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQpIHtcbiAgICB2YXIgc3RhdHMgPSBvcmlnLmNhbGwoZnMsIHRhcmdldClcbiAgICBpZiAoc3RhdHMudWlkIDwgMCkgc3RhdHMudWlkICs9IDB4MTAwMDAwMDAwXG4gICAgaWYgKHN0YXRzLmdpZCA8IDApIHN0YXRzLmdpZCArPSAweDEwMDAwMDAwMFxuICAgIHJldHVybiBzdGF0cztcbiAgfVxufVxuXG4vLyBFTk9TWVMgbWVhbnMgdGhhdCB0aGUgZnMgZG9lc24ndCBzdXBwb3J0IHRoZSBvcC4gSnVzdCBpZ25vcmVcbi8vIHRoYXQsIGJlY2F1c2UgaXQgZG9lc24ndCBtYXR0ZXIuXG4vL1xuLy8gaWYgdGhlcmUncyBubyBnZXR1aWQsIG9yIGlmIGdldHVpZCgpIGlzIHNvbWV0aGluZyBvdGhlclxuLy8gdGhhbiAwLCBhbmQgdGhlIGVycm9yIGlzIEVJTlZBTCBvciBFUEVSTSwgdGhlbiBqdXN0IGlnbm9yZVxuLy8gaXQuXG4vL1xuLy8gVGhpcyBzcGVjaWZpYyBjYXNlIGlzIGEgc2lsZW50IGZhaWx1cmUgaW4gY3AsIGluc3RhbGwsIHRhcixcbi8vIGFuZCBtb3N0IG90aGVyIHVuaXggdG9vbHMgdGhhdCBtYW5hZ2UgcGVybWlzc2lvbnMuXG4vL1xuLy8gV2hlbiBydW5uaW5nIGFzIHJvb3QsIG9yIGlmIG90aGVyIHR5cGVzIG9mIGVycm9ycyBhcmVcbi8vIGVuY291bnRlcmVkLCB0aGVuIGl0J3Mgc3RyaWN0LlxuZnVuY3Rpb24gY2hvd25Fck9rIChlcikge1xuICBpZiAoIWVyKVxuICAgIHJldHVybiB0cnVlXG5cbiAgaWYgKGVyLmNvZGUgPT09IFwiRU5PU1lTXCIpXG4gICAgcmV0dXJuIHRydWVcblxuICB2YXIgbm9ucm9vdCA9ICFwcm9jZXNzLmdldHVpZCB8fCBwcm9jZXNzLmdldHVpZCgpICE9PSAwXG4gIGlmIChub25yb290KSB7XG4gICAgaWYgKGVyLmNvZGUgPT09IFwiRUlOVkFMXCIgfHwgZXIuY29kZSA9PT0gXCJFUEVSTVwiKVxuICAgICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIHJldHVybiBmYWxzZVxufVxuIiwiZXhwb3J0cy5yZWFkID0gZnVuY3Rpb24gKGJ1ZmZlciwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG1cbiAgdmFyIGVMZW4gPSAobkJ5dGVzICogOCkgLSBtTGVuIC0gMVxuICB2YXIgZU1heCA9ICgxIDw8IGVMZW4pIC0gMVxuICB2YXIgZUJpYXMgPSBlTWF4ID4+IDFcbiAgdmFyIG5CaXRzID0gLTdcbiAgdmFyIGkgPSBpc0xFID8gKG5CeXRlcyAtIDEpIDogMFxuICB2YXIgZCA9IGlzTEUgPyAtMSA6IDFcbiAgdmFyIHMgPSBidWZmZXJbb2Zmc2V0ICsgaV1cblxuICBpICs9IGRcblxuICBlID0gcyAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKVxuICBzID4+PSAoLW5CaXRzKVxuICBuQml0cyArPSBlTGVuXG4gIGZvciAoOyBuQml0cyA+IDA7IGUgPSAoZSAqIDI1NikgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCkge31cblxuICBtID0gZSAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKVxuICBlID4+PSAoLW5CaXRzKVxuICBuQml0cyArPSBtTGVuXG4gIGZvciAoOyBuQml0cyA+IDA7IG0gPSAobSAqIDI1NikgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCkge31cblxuICBpZiAoZSA9PT0gMCkge1xuICAgIGUgPSAxIC0gZUJpYXNcbiAgfSBlbHNlIGlmIChlID09PSBlTWF4KSB7XG4gICAgcmV0dXJuIG0gPyBOYU4gOiAoKHMgPyAtMSA6IDEpICogSW5maW5pdHkpXG4gIH0gZWxzZSB7XG4gICAgbSA9IG0gKyBNYXRoLnBvdygyLCBtTGVuKVxuICAgIGUgPSBlIC0gZUJpYXNcbiAgfVxuICByZXR1cm4gKHMgPyAtMSA6IDEpICogbSAqIE1hdGgucG93KDIsIGUgLSBtTGVuKVxufVxuXG5leHBvcnRzLndyaXRlID0gZnVuY3Rpb24gKGJ1ZmZlciwgdmFsdWUsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtLCBjXG4gIHZhciBlTGVuID0gKG5CeXRlcyAqIDgpIC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBydCA9IChtTGVuID09PSAyMyA/IE1hdGgucG93KDIsIC0yNCkgLSBNYXRoLnBvdygyLCAtNzcpIDogMClcbiAgdmFyIGkgPSBpc0xFID8gMCA6IChuQnl0ZXMgLSAxKVxuICB2YXIgZCA9IGlzTEUgPyAxIDogLTFcbiAgdmFyIHMgPSB2YWx1ZSA8IDAgfHwgKHZhbHVlID09PSAwICYmIDEgLyB2YWx1ZSA8IDApID8gMSA6IDBcblxuICB2YWx1ZSA9IE1hdGguYWJzKHZhbHVlKVxuXG4gIGlmIChpc05hTih2YWx1ZSkgfHwgdmFsdWUgPT09IEluZmluaXR5KSB7XG4gICAgbSA9IGlzTmFOKHZhbHVlKSA/IDEgOiAwXG4gICAgZSA9IGVNYXhcbiAgfSBlbHNlIHtcbiAgICBlID0gTWF0aC5mbG9vcihNYXRoLmxvZyh2YWx1ZSkgLyBNYXRoLkxOMilcbiAgICBpZiAodmFsdWUgKiAoYyA9IE1hdGgucG93KDIsIC1lKSkgPCAxKSB7XG4gICAgICBlLS1cbiAgICAgIGMgKj0gMlxuICAgIH1cbiAgICBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIHZhbHVlICs9IHJ0IC8gY1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSArPSBydCAqIE1hdGgucG93KDIsIDEgLSBlQmlhcylcbiAgICB9XG4gICAgaWYgKHZhbHVlICogYyA+PSAyKSB7XG4gICAgICBlKytcbiAgICAgIGMgLz0gMlxuICAgIH1cblxuICAgIGlmIChlICsgZUJpYXMgPj0gZU1heCkge1xuICAgICAgbSA9IDBcbiAgICAgIGUgPSBlTWF4XG4gICAgfSBlbHNlIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgbSA9ICgodmFsdWUgKiBjKSAtIDEpICogTWF0aC5wb3coMiwgbUxlbilcbiAgICAgIGUgPSBlICsgZUJpYXNcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IHZhbHVlICogTWF0aC5wb3coMiwgZUJpYXMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pXG4gICAgICBlID0gMFxuICAgIH1cbiAgfVxuXG4gIGZvciAoOyBtTGVuID49IDg7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IG0gJiAweGZmLCBpICs9IGQsIG0gLz0gMjU2LCBtTGVuIC09IDgpIHt9XG5cbiAgZSA9IChlIDw8IG1MZW4pIHwgbVxuICBlTGVuICs9IG1MZW5cbiAgZm9yICg7IGVMZW4gPiAwOyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBlICYgMHhmZiwgaSArPSBkLCBlIC89IDI1NiwgZUxlbiAtPSA4KSB7fVxuXG4gIGJ1ZmZlcltvZmZzZXQgKyBpIC0gZF0gfD0gcyAqIDEyOFxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQXJyYXlpc2gob2JqKSB7XG5cdGlmICghb2JqKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0cmV0dXJuIG9iaiBpbnN0YW5jZW9mIEFycmF5IHx8IEFycmF5LmlzQXJyYXkob2JqKSB8fFxuXHRcdChvYmoubGVuZ3RoID49IDAgJiYgb2JqLnNwbGljZSBpbnN0YW5jZW9mIEZ1bmN0aW9uKTtcbn07XG4iLCIvKiFcbiAqIERldGVybWluZSBpZiBhbiBvYmplY3QgaXMgYSBCdWZmZXJcbiAqXG4gKiBAYXV0aG9yICAgRmVyb3NzIEFib3VraGFkaWplaCA8aHR0cHM6Ly9mZXJvc3Mub3JnPlxuICogQGxpY2Vuc2UgIE1JVFxuICovXG5cbi8vIFRoZSBfaXNCdWZmZXIgY2hlY2sgaXMgZm9yIFNhZmFyaSA1LTcgc3VwcG9ydCwgYmVjYXVzZSBpdCdzIG1pc3Npbmdcbi8vIE9iamVjdC5wcm90b3R5cGUuY29uc3RydWN0b3IuIFJlbW92ZSB0aGlzIGV2ZW50dWFsbHlcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9iaikge1xuICByZXR1cm4gb2JqICE9IG51bGwgJiYgKGlzQnVmZmVyKG9iaikgfHwgaXNTbG93QnVmZmVyKG9iaikgfHwgISFvYmouX2lzQnVmZmVyKVxufVxuXG5mdW5jdGlvbiBpc0J1ZmZlciAob2JqKSB7XG4gIHJldHVybiAhIW9iai5jb25zdHJ1Y3RvciAmJiB0eXBlb2Ygb2JqLmNvbnN0cnVjdG9yLmlzQnVmZmVyID09PSAnZnVuY3Rpb24nICYmIG9iai5jb25zdHJ1Y3Rvci5pc0J1ZmZlcihvYmopXG59XG5cbi8vIEZvciBOb2RlIHYwLjEwIHN1cHBvcnQuIFJlbW92ZSB0aGlzIGV2ZW50dWFsbHkuXG5mdW5jdGlvbiBpc1Nsb3dCdWZmZXIgKG9iaikge1xuICByZXR1cm4gdHlwZW9mIG9iai5yZWFkRmxvYXRMRSA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2Ygb2JqLnNsaWNlID09PSAnZnVuY3Rpb24nICYmIGlzQnVmZmVyKG9iai5zbGljZSgwLCAwKSlcbn1cbiIsInZhciB0b1N0cmluZyA9IHt9LnRvU3RyaW5nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKGFycikge1xuICByZXR1cm4gdG9TdHJpbmcuY2FsbChhcnIpID09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuIiwiJ3VzZSBzdHJpY3QnXG5cbm1vZHVsZS5leHBvcnRzID0gcGFyc2VKc29uXG5mdW5jdGlvbiBwYXJzZUpzb24gKHR4dCwgcmV2aXZlciwgY29udGV4dCkge1xuICBjb250ZXh0ID0gY29udGV4dCB8fCAyMFxuICB0cnkge1xuICAgIHJldHVybiBKU09OLnBhcnNlKHR4dCwgcmV2aXZlcilcbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmICh0eXBlb2YgdHh0ICE9PSAnc3RyaW5nJykge1xuICAgICAgY29uc3QgaXNFbXB0eUFycmF5ID0gQXJyYXkuaXNBcnJheSh0eHQpICYmIHR4dC5sZW5ndGggPT09IDBcbiAgICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9ICdDYW5ub3QgcGFyc2UgJyArXG4gICAgICAoaXNFbXB0eUFycmF5ID8gJ2FuIGVtcHR5IGFycmF5JyA6IFN0cmluZyh0eHQpKVxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihlcnJvck1lc3NhZ2UpXG4gICAgfVxuICAgIGNvbnN0IHN5bnRheEVyciA9IGUubWVzc2FnZS5tYXRjaCgvXlVuZXhwZWN0ZWQgdG9rZW4uKnBvc2l0aW9uXFxzKyhcXGQrKS9pKVxuICAgIGNvbnN0IGVycklkeCA9IHN5bnRheEVyclxuICAgID8gK3N5bnRheEVyclsxXVxuICAgIDogZS5tZXNzYWdlLm1hdGNoKC9eVW5leHBlY3RlZCBlbmQgb2YgSlNPTi4qL2kpXG4gICAgPyB0eHQubGVuZ3RoIC0gMVxuICAgIDogbnVsbFxuICAgIGlmIChlcnJJZHggIT0gbnVsbCkge1xuICAgICAgY29uc3Qgc3RhcnQgPSBlcnJJZHggPD0gY29udGV4dFxuICAgICAgPyAwXG4gICAgICA6IGVycklkeCAtIGNvbnRleHRcbiAgICAgIGNvbnN0IGVuZCA9IGVycklkeCArIGNvbnRleHQgPj0gdHh0Lmxlbmd0aFxuICAgICAgPyB0eHQubGVuZ3RoXG4gICAgICA6IGVycklkeCArIGNvbnRleHRcbiAgICAgIGUubWVzc2FnZSArPSBgIHdoaWxlIHBhcnNpbmcgbmVhciAnJHtcbiAgICAgICAgc3RhcnQgPT09IDAgPyAnJyA6ICcuLi4nXG4gICAgICB9JHt0eHQuc2xpY2Uoc3RhcnQsIGVuZCl9JHtcbiAgICAgICAgZW5kID09PSB0eHQubGVuZ3RoID8gJycgOiAnLi4uJ1xuICAgICAgfSdgXG4gICAgfSBlbHNlIHtcbiAgICAgIGUubWVzc2FnZSArPSBgIHdoaWxlIHBhcnNpbmcgJyR7dHh0LnNsaWNlKDAsIGNvbnRleHQgKiAyKX0nYFxuICAgIH1cbiAgICB0aHJvdyBlXG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0JztcbmNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5jb25zdCBmcyA9IHJlcXVpcmUoJ2dyYWNlZnVsLWZzJyk7XG5jb25zdCBzdHJpcEJvbSA9IHJlcXVpcmUoJ3N0cmlwLWJvbScpO1xuY29uc3QgcGFyc2VKc29uID0gcmVxdWlyZSgncGFyc2UtanNvbicpO1xuY29uc3QgcGlmeSA9IHJlcXVpcmUoJ3BpZnknKTtcblxuY29uc3QgcGFyc2UgPSAoZGF0YSwgZmlsZVBhdGgsIG9wdGlvbnMgPSB7fSkgPT4ge1xuXHRkYXRhID0gc3RyaXBCb20oZGF0YSk7XG5cblx0aWYgKHR5cGVvZiBvcHRpb25zLmJlZm9yZVBhcnNlID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0ZGF0YSA9IG9wdGlvbnMuYmVmb3JlUGFyc2UoZGF0YSk7XG5cdH1cblxuXHRyZXR1cm4gcGFyc2VKc29uKGRhdGEsIG9wdGlvbnMucmV2aXZlciwgcGF0aC5yZWxhdGl2ZShwcm9jZXNzLmN3ZCgpLCBmaWxlUGF0aCkpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSAoZmlsZVBhdGgsIG9wdGlvbnMpID0+IHBpZnkoZnMucmVhZEZpbGUpKGZpbGVQYXRoLCAndXRmOCcpLnRoZW4oZGF0YSA9PiBwYXJzZShkYXRhLCBmaWxlUGF0aCwgb3B0aW9ucykpO1xubW9kdWxlLmV4cG9ydHMuc3luYyA9IChmaWxlUGF0aCwgb3B0aW9ucykgPT4gcGFyc2UoZnMucmVhZEZpbGVTeW5jKGZpbGVQYXRoLCAndXRmOCcpLCBmaWxlUGF0aCwgb3B0aW9ucyk7XG4iLCIndXNlIHN0cmljdCc7XG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuY29uc3QgcGF0aEV4aXN0cyA9IHJlcXVpcmUoJ3BhdGgtZXhpc3RzJyk7XG5jb25zdCBwTG9jYXRlID0gcmVxdWlyZSgncC1sb2NhdGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSAoaXRlcmFibGUsIG9wdHMpID0+IHtcblx0b3B0cyA9IE9iamVjdC5hc3NpZ24oe1xuXHRcdGN3ZDogcHJvY2Vzcy5jd2QoKVxuXHR9LCBvcHRzKTtcblxuXHRyZXR1cm4gcExvY2F0ZShpdGVyYWJsZSwgZWwgPT4gcGF0aEV4aXN0cyhwYXRoLnJlc29sdmUob3B0cy5jd2QsIGVsKSksIG9wdHMpO1xufTtcblxubW9kdWxlLmV4cG9ydHMuc3luYyA9IChpdGVyYWJsZSwgb3B0cykgPT4ge1xuXHRvcHRzID0gT2JqZWN0LmFzc2lnbih7XG5cdFx0Y3dkOiBwcm9jZXNzLmN3ZCgpXG5cdH0sIG9wdHMpO1xuXG5cdGZvciAoY29uc3QgZWwgb2YgaXRlcmFibGUpIHtcblx0XHRpZiAocGF0aEV4aXN0cy5zeW5jKHBhdGgucmVzb2x2ZShvcHRzLmN3ZCwgZWwpKSkge1xuXHRcdFx0cmV0dXJuIGVsO1xuXHRcdH1cblx0fVxufTtcbiIsIid1c2Ugc3RyaWN0JztcbmNvbnN0IHBUcnkgPSByZXF1aXJlKCdwLXRyeScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNvbmN1cnJlbmN5ID0+IHtcblx0aWYgKGNvbmN1cnJlbmN5IDwgMSkge1xuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIGBjb25jdXJyZW5jeWAgdG8gYmUgYSBudW1iZXIgZnJvbSAxIGFuZCB1cCcpO1xuXHR9XG5cblx0Y29uc3QgcXVldWUgPSBbXTtcblx0bGV0IGFjdGl2ZUNvdW50ID0gMDtcblxuXHRjb25zdCBuZXh0ID0gKCkgPT4ge1xuXHRcdGFjdGl2ZUNvdW50LS07XG5cblx0XHRpZiAocXVldWUubGVuZ3RoID4gMCkge1xuXHRcdFx0cXVldWUuc2hpZnQoKSgpO1xuXHRcdH1cblx0fTtcblxuXHRyZXR1cm4gZm4gPT4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdGNvbnN0IHJ1biA9ICgpID0+IHtcblx0XHRcdGFjdGl2ZUNvdW50Kys7XG5cblx0XHRcdHBUcnkoZm4pLnRoZW4oXG5cdFx0XHRcdHZhbCA9PiB7XG5cdFx0XHRcdFx0cmVzb2x2ZSh2YWwpO1xuXHRcdFx0XHRcdG5leHQoKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0ZXJyID0+IHtcblx0XHRcdFx0XHRyZWplY3QoZXJyKTtcblx0XHRcdFx0XHRuZXh0KCk7XG5cdFx0XHRcdH1cblx0XHRcdCk7XG5cdFx0fTtcblxuXHRcdGlmIChhY3RpdmVDb3VudCA8IGNvbmN1cnJlbmN5KSB7XG5cdFx0XHRydW4oKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cXVldWUucHVzaChydW4pO1xuXHRcdH1cblx0fSk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuY29uc3QgcExpbWl0ID0gcmVxdWlyZSgncC1saW1pdCcpO1xuXG5jbGFzcyBFbmRFcnJvciBleHRlbmRzIEVycm9yIHtcblx0Y29uc3RydWN0b3IodmFsdWUpIHtcblx0XHRzdXBlcigpO1xuXHRcdHRoaXMudmFsdWUgPSB2YWx1ZTtcblx0fVxufVxuXG4vLyB0aGUgaW5wdXQgY2FuIGFsc28gYmUgYSBwcm9taXNlLCBzbyB3ZSBgUHJvbWlzZS5hbGwoKWAgdGhlbSBib3RoXG5jb25zdCBmaW5kZXIgPSBlbCA9PiBQcm9taXNlLmFsbChlbCkudGhlbih2YWwgPT4gdmFsWzFdID09PSB0cnVlICYmIFByb21pc2UucmVqZWN0KG5ldyBFbmRFcnJvcih2YWxbMF0pKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gKGl0ZXJhYmxlLCB0ZXN0ZXIsIG9wdHMpID0+IHtcblx0b3B0cyA9IE9iamVjdC5hc3NpZ24oe1xuXHRcdGNvbmN1cnJlbmN5OiBJbmZpbml0eSxcblx0XHRwcmVzZXJ2ZU9yZGVyOiB0cnVlXG5cdH0sIG9wdHMpO1xuXG5cdGNvbnN0IGxpbWl0ID0gcExpbWl0KG9wdHMuY29uY3VycmVuY3kpO1xuXG5cdC8vIHN0YXJ0IGFsbCB0aGUgcHJvbWlzZXMgY29uY3VycmVudGx5IHdpdGggb3B0aW9uYWwgbGltaXRcblx0Y29uc3QgaXRlbXMgPSBBcnJheS5mcm9tKGl0ZXJhYmxlKS5tYXAoZWwgPT4gW2VsLCBsaW1pdCgoKSA9PiBQcm9taXNlLnJlc29sdmUoZWwpLnRoZW4odGVzdGVyKSldKTtcblxuXHQvLyBjaGVjayB0aGUgcHJvbWlzZXMgZWl0aGVyIHNlcmlhbGx5IG9yIGNvbmN1cnJlbnRseVxuXHRjb25zdCBjaGVja0xpbWl0ID0gcExpbWl0KG9wdHMucHJlc2VydmVPcmRlciA/IDEgOiBJbmZpbml0eSk7XG5cblx0cmV0dXJuIFByb21pc2UuYWxsKGl0ZW1zLm1hcChlbCA9PiBjaGVja0xpbWl0KCgpID0+IGZpbmRlcihlbCkpKSlcblx0XHQudGhlbigoKSA9PiB7fSlcblx0XHQuY2F0Y2goZXJyID0+IGVyciBpbnN0YW5jZW9mIEVuZEVycm9yID8gZXJyLnZhbHVlIDogUHJvbWlzZS5yZWplY3QoZXJyKSk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSBjYiA9PiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcblx0cmVzb2x2ZShjYigpKTtcbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuY29uc3QgZXJyb3JFeCA9IHJlcXVpcmUoJ2Vycm9yLWV4Jyk7XG5jb25zdCBmYWxsYmFjayA9IHJlcXVpcmUoJ2pzb24tcGFyc2UtYmV0dGVyLWVycm9ycycpO1xuXG5jb25zdCBKU09ORXJyb3IgPSBlcnJvckV4KCdKU09ORXJyb3InLCB7XG5cdGZpbGVOYW1lOiBlcnJvckV4LmFwcGVuZCgnaW4gJXMnKVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gKGlucHV0LCByZXZpdmVyLCBmaWxlbmFtZSkgPT4ge1xuXHRpZiAodHlwZW9mIHJldml2ZXIgPT09ICdzdHJpbmcnKSB7XG5cdFx0ZmlsZW5hbWUgPSByZXZpdmVyO1xuXHRcdHJldml2ZXIgPSBudWxsO1xuXHR9XG5cblx0dHJ5IHtcblx0XHR0cnkge1xuXHRcdFx0cmV0dXJuIEpTT04ucGFyc2UoaW5wdXQsIHJldml2ZXIpO1xuXHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0ZmFsbGJhY2soaW5wdXQsIHJldml2ZXIpO1xuXG5cdFx0XHR0aHJvdyBlcnI7XG5cdFx0fVxuXHR9IGNhdGNoIChlcnIpIHtcblx0XHRlcnIubWVzc2FnZSA9IGVyci5tZXNzYWdlLnJlcGxhY2UoL1xcbi9nLCAnJyk7XG5cblx0XHRjb25zdCBqc29uRXJyID0gbmV3IEpTT05FcnJvcihlcnIpO1xuXHRcdGlmIChmaWxlbmFtZSkge1xuXHRcdFx0anNvbkVyci5maWxlTmFtZSA9IGZpbGVuYW1lO1xuXHRcdH1cblxuXHRcdHRocm93IGpzb25FcnI7XG5cdH1cbn07XG4iLCIvLyAncGF0aCcgbW9kdWxlIGV4dHJhY3RlZCBmcm9tIE5vZGUuanMgdjguMTEuMSAob25seSB0aGUgcG9zaXggcGFydClcbi8vIHRyYW5zcGxpdGVkIHdpdGggQmFiZWxcblxuLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gYXNzZXJ0UGF0aChwYXRoKSB7XG4gIGlmICh0eXBlb2YgcGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdQYXRoIG11c3QgYmUgYSBzdHJpbmcuIFJlY2VpdmVkICcgKyBKU09OLnN0cmluZ2lmeShwYXRoKSk7XG4gIH1cbn1cblxuLy8gUmVzb2x2ZXMgLiBhbmQgLi4gZWxlbWVudHMgaW4gYSBwYXRoIHdpdGggZGlyZWN0b3J5IG5hbWVzXG5mdW5jdGlvbiBub3JtYWxpemVTdHJpbmdQb3NpeChwYXRoLCBhbGxvd0Fib3ZlUm9vdCkge1xuICB2YXIgcmVzID0gJyc7XG4gIHZhciBsYXN0U2VnbWVudExlbmd0aCA9IDA7XG4gIHZhciBsYXN0U2xhc2ggPSAtMTtcbiAgdmFyIGRvdHMgPSAwO1xuICB2YXIgY29kZTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPD0gcGF0aC5sZW5ndGg7ICsraSkge1xuICAgIGlmIChpIDwgcGF0aC5sZW5ndGgpXG4gICAgICBjb2RlID0gcGF0aC5jaGFyQ29kZUF0KGkpO1xuICAgIGVsc2UgaWYgKGNvZGUgPT09IDQ3IC8qLyovKVxuICAgICAgYnJlYWs7XG4gICAgZWxzZVxuICAgICAgY29kZSA9IDQ3IC8qLyovO1xuICAgIGlmIChjb2RlID09PSA0NyAvKi8qLykge1xuICAgICAgaWYgKGxhc3RTbGFzaCA9PT0gaSAtIDEgfHwgZG90cyA9PT0gMSkge1xuICAgICAgICAvLyBOT09QXG4gICAgICB9IGVsc2UgaWYgKGxhc3RTbGFzaCAhPT0gaSAtIDEgJiYgZG90cyA9PT0gMikge1xuICAgICAgICBpZiAocmVzLmxlbmd0aCA8IDIgfHwgbGFzdFNlZ21lbnRMZW5ndGggIT09IDIgfHwgcmVzLmNoYXJDb2RlQXQocmVzLmxlbmd0aCAtIDEpICE9PSA0NiAvKi4qLyB8fCByZXMuY2hhckNvZGVBdChyZXMubGVuZ3RoIC0gMikgIT09IDQ2IC8qLiovKSB7XG4gICAgICAgICAgaWYgKHJlcy5sZW5ndGggPiAyKSB7XG4gICAgICAgICAgICB2YXIgbGFzdFNsYXNoSW5kZXggPSByZXMubGFzdEluZGV4T2YoJy8nKTtcbiAgICAgICAgICAgIGlmIChsYXN0U2xhc2hJbmRleCAhPT0gcmVzLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgaWYgKGxhc3RTbGFzaEluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHJlcyA9ICcnO1xuICAgICAgICAgICAgICAgIGxhc3RTZWdtZW50TGVuZ3RoID0gMDtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXMgPSByZXMuc2xpY2UoMCwgbGFzdFNsYXNoSW5kZXgpO1xuICAgICAgICAgICAgICAgIGxhc3RTZWdtZW50TGVuZ3RoID0gcmVzLmxlbmd0aCAtIDEgLSByZXMubGFzdEluZGV4T2YoJy8nKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBsYXN0U2xhc2ggPSBpO1xuICAgICAgICAgICAgICBkb3RzID0gMDtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChyZXMubGVuZ3RoID09PSAyIHx8IHJlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIHJlcyA9ICcnO1xuICAgICAgICAgICAgbGFzdFNlZ21lbnRMZW5ndGggPSAwO1xuICAgICAgICAgICAgbGFzdFNsYXNoID0gaTtcbiAgICAgICAgICAgIGRvdHMgPSAwO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChhbGxvd0Fib3ZlUm9vdCkge1xuICAgICAgICAgIGlmIChyZXMubGVuZ3RoID4gMClcbiAgICAgICAgICAgIHJlcyArPSAnLy4uJztcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXMgPSAnLi4nO1xuICAgICAgICAgIGxhc3RTZWdtZW50TGVuZ3RoID0gMjtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHJlcy5sZW5ndGggPiAwKVxuICAgICAgICAgIHJlcyArPSAnLycgKyBwYXRoLnNsaWNlKGxhc3RTbGFzaCArIDEsIGkpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmVzID0gcGF0aC5zbGljZShsYXN0U2xhc2ggKyAxLCBpKTtcbiAgICAgICAgbGFzdFNlZ21lbnRMZW5ndGggPSBpIC0gbGFzdFNsYXNoIC0gMTtcbiAgICAgIH1cbiAgICAgIGxhc3RTbGFzaCA9IGk7XG4gICAgICBkb3RzID0gMDtcbiAgICB9IGVsc2UgaWYgKGNvZGUgPT09IDQ2IC8qLiovICYmIGRvdHMgIT09IC0xKSB7XG4gICAgICArK2RvdHM7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRvdHMgPSAtMTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlcztcbn1cblxuZnVuY3Rpb24gX2Zvcm1hdChzZXAsIHBhdGhPYmplY3QpIHtcbiAgdmFyIGRpciA9IHBhdGhPYmplY3QuZGlyIHx8IHBhdGhPYmplY3Qucm9vdDtcbiAgdmFyIGJhc2UgPSBwYXRoT2JqZWN0LmJhc2UgfHwgKHBhdGhPYmplY3QubmFtZSB8fCAnJykgKyAocGF0aE9iamVjdC5leHQgfHwgJycpO1xuICBpZiAoIWRpcikge1xuICAgIHJldHVybiBiYXNlO1xuICB9XG4gIGlmIChkaXIgPT09IHBhdGhPYmplY3Qucm9vdCkge1xuICAgIHJldHVybiBkaXIgKyBiYXNlO1xuICB9XG4gIHJldHVybiBkaXIgKyBzZXAgKyBiYXNlO1xufVxuXG52YXIgcG9zaXggPSB7XG4gIC8vIHBhdGgucmVzb2x2ZShbZnJvbSAuLi5dLCB0bylcbiAgcmVzb2x2ZTogZnVuY3Rpb24gcmVzb2x2ZSgpIHtcbiAgICB2YXIgcmVzb2x2ZWRQYXRoID0gJyc7XG4gICAgdmFyIHJlc29sdmVkQWJzb2x1dGUgPSBmYWxzZTtcbiAgICB2YXIgY3dkO1xuXG4gICAgZm9yICh2YXIgaSA9IGFyZ3VtZW50cy5sZW5ndGggLSAxOyBpID49IC0xICYmICFyZXNvbHZlZEFic29sdXRlOyBpLS0pIHtcbiAgICAgIHZhciBwYXRoO1xuICAgICAgaWYgKGkgPj0gMClcbiAgICAgICAgcGF0aCA9IGFyZ3VtZW50c1tpXTtcbiAgICAgIGVsc2Uge1xuICAgICAgICBpZiAoY3dkID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgY3dkID0gcHJvY2Vzcy5jd2QoKTtcbiAgICAgICAgcGF0aCA9IGN3ZDtcbiAgICAgIH1cblxuICAgICAgYXNzZXJ0UGF0aChwYXRoKTtcblxuICAgICAgLy8gU2tpcCBlbXB0eSBlbnRyaWVzXG4gICAgICBpZiAocGF0aC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIHJlc29sdmVkUGF0aCA9IHBhdGggKyAnLycgKyByZXNvbHZlZFBhdGg7XG4gICAgICByZXNvbHZlZEFic29sdXRlID0gcGF0aC5jaGFyQ29kZUF0KDApID09PSA0NyAvKi8qLztcbiAgICB9XG5cbiAgICAvLyBBdCB0aGlzIHBvaW50IHRoZSBwYXRoIHNob3VsZCBiZSByZXNvbHZlZCB0byBhIGZ1bGwgYWJzb2x1dGUgcGF0aCwgYnV0XG4gICAgLy8gaGFuZGxlIHJlbGF0aXZlIHBhdGhzIHRvIGJlIHNhZmUgKG1pZ2h0IGhhcHBlbiB3aGVuIHByb2Nlc3MuY3dkKCkgZmFpbHMpXG5cbiAgICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcbiAgICByZXNvbHZlZFBhdGggPSBub3JtYWxpemVTdHJpbmdQb3NpeChyZXNvbHZlZFBhdGgsICFyZXNvbHZlZEFic29sdXRlKTtcblxuICAgIGlmIChyZXNvbHZlZEFic29sdXRlKSB7XG4gICAgICBpZiAocmVzb2x2ZWRQYXRoLmxlbmd0aCA+IDApXG4gICAgICAgIHJldHVybiAnLycgKyByZXNvbHZlZFBhdGg7XG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiAnLyc7XG4gICAgfSBlbHNlIGlmIChyZXNvbHZlZFBhdGgubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuIHJlc29sdmVkUGF0aDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICcuJztcbiAgICB9XG4gIH0sXG5cbiAgbm9ybWFsaXplOiBmdW5jdGlvbiBub3JtYWxpemUocGF0aCkge1xuICAgIGFzc2VydFBhdGgocGF0aCk7XG5cbiAgICBpZiAocGF0aC5sZW5ndGggPT09IDApIHJldHVybiAnLic7XG5cbiAgICB2YXIgaXNBYnNvbHV0ZSA9IHBhdGguY2hhckNvZGVBdCgwKSA9PT0gNDcgLyovKi87XG4gICAgdmFyIHRyYWlsaW5nU2VwYXJhdG9yID0gcGF0aC5jaGFyQ29kZUF0KHBhdGgubGVuZ3RoIC0gMSkgPT09IDQ3IC8qLyovO1xuXG4gICAgLy8gTm9ybWFsaXplIHRoZSBwYXRoXG4gICAgcGF0aCA9IG5vcm1hbGl6ZVN0cmluZ1Bvc2l4KHBhdGgsICFpc0Fic29sdXRlKTtcblxuICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gMCAmJiAhaXNBYnNvbHV0ZSkgcGF0aCA9ICcuJztcbiAgICBpZiAocGF0aC5sZW5ndGggPiAwICYmIHRyYWlsaW5nU2VwYXJhdG9yKSBwYXRoICs9ICcvJztcblxuICAgIGlmIChpc0Fic29sdXRlKSByZXR1cm4gJy8nICsgcGF0aDtcbiAgICByZXR1cm4gcGF0aDtcbiAgfSxcblxuICBpc0Fic29sdXRlOiBmdW5jdGlvbiBpc0Fic29sdXRlKHBhdGgpIHtcbiAgICBhc3NlcnRQYXRoKHBhdGgpO1xuICAgIHJldHVybiBwYXRoLmxlbmd0aCA+IDAgJiYgcGF0aC5jaGFyQ29kZUF0KDApID09PSA0NyAvKi8qLztcbiAgfSxcblxuICBqb2luOiBmdW5jdGlvbiBqb2luKCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgcmV0dXJuICcuJztcbiAgICB2YXIgam9pbmVkO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgKytpKSB7XG4gICAgICB2YXIgYXJnID0gYXJndW1lbnRzW2ldO1xuICAgICAgYXNzZXJ0UGF0aChhcmcpO1xuICAgICAgaWYgKGFyZy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGlmIChqb2luZWQgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICBqb2luZWQgPSBhcmc7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBqb2luZWQgKz0gJy8nICsgYXJnO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoam9pbmVkID09PSB1bmRlZmluZWQpXG4gICAgICByZXR1cm4gJy4nO1xuICAgIHJldHVybiBwb3NpeC5ub3JtYWxpemUoam9pbmVkKTtcbiAgfSxcblxuICByZWxhdGl2ZTogZnVuY3Rpb24gcmVsYXRpdmUoZnJvbSwgdG8pIHtcbiAgICBhc3NlcnRQYXRoKGZyb20pO1xuICAgIGFzc2VydFBhdGgodG8pO1xuXG4gICAgaWYgKGZyb20gPT09IHRvKSByZXR1cm4gJyc7XG5cbiAgICBmcm9tID0gcG9zaXgucmVzb2x2ZShmcm9tKTtcbiAgICB0byA9IHBvc2l4LnJlc29sdmUodG8pO1xuXG4gICAgaWYgKGZyb20gPT09IHRvKSByZXR1cm4gJyc7XG5cbiAgICAvLyBUcmltIGFueSBsZWFkaW5nIGJhY2tzbGFzaGVzXG4gICAgdmFyIGZyb21TdGFydCA9IDE7XG4gICAgZm9yICg7IGZyb21TdGFydCA8IGZyb20ubGVuZ3RoOyArK2Zyb21TdGFydCkge1xuICAgICAgaWYgKGZyb20uY2hhckNvZGVBdChmcm9tU3RhcnQpICE9PSA0NyAvKi8qLylcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHZhciBmcm9tRW5kID0gZnJvbS5sZW5ndGg7XG4gICAgdmFyIGZyb21MZW4gPSBmcm9tRW5kIC0gZnJvbVN0YXJ0O1xuXG4gICAgLy8gVHJpbSBhbnkgbGVhZGluZyBiYWNrc2xhc2hlc1xuICAgIHZhciB0b1N0YXJ0ID0gMTtcbiAgICBmb3IgKDsgdG9TdGFydCA8IHRvLmxlbmd0aDsgKyt0b1N0YXJ0KSB7XG4gICAgICBpZiAodG8uY2hhckNvZGVBdCh0b1N0YXJ0KSAhPT0gNDcgLyovKi8pXG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICB2YXIgdG9FbmQgPSB0by5sZW5ndGg7XG4gICAgdmFyIHRvTGVuID0gdG9FbmQgLSB0b1N0YXJ0O1xuXG4gICAgLy8gQ29tcGFyZSBwYXRocyB0byBmaW5kIHRoZSBsb25nZXN0IGNvbW1vbiBwYXRoIGZyb20gcm9vdFxuICAgIHZhciBsZW5ndGggPSBmcm9tTGVuIDwgdG9MZW4gPyBmcm9tTGVuIDogdG9MZW47XG4gICAgdmFyIGxhc3RDb21tb25TZXAgPSAtMTtcbiAgICB2YXIgaSA9IDA7XG4gICAgZm9yICg7IGkgPD0gbGVuZ3RoOyArK2kpIHtcbiAgICAgIGlmIChpID09PSBsZW5ndGgpIHtcbiAgICAgICAgaWYgKHRvTGVuID4gbGVuZ3RoKSB7XG4gICAgICAgICAgaWYgKHRvLmNoYXJDb2RlQXQodG9TdGFydCArIGkpID09PSA0NyAvKi8qLykge1xuICAgICAgICAgICAgLy8gV2UgZ2V0IGhlcmUgaWYgYGZyb21gIGlzIHRoZSBleGFjdCBiYXNlIHBhdGggZm9yIGB0b2AuXG4gICAgICAgICAgICAvLyBGb3IgZXhhbXBsZTogZnJvbT0nL2Zvby9iYXInOyB0bz0nL2Zvby9iYXIvYmF6J1xuICAgICAgICAgICAgcmV0dXJuIHRvLnNsaWNlKHRvU3RhcnQgKyBpICsgMSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChpID09PSAwKSB7XG4gICAgICAgICAgICAvLyBXZSBnZXQgaGVyZSBpZiBgZnJvbWAgaXMgdGhlIHJvb3RcbiAgICAgICAgICAgIC8vIEZvciBleGFtcGxlOiBmcm9tPScvJzsgdG89Jy9mb28nXG4gICAgICAgICAgICByZXR1cm4gdG8uc2xpY2UodG9TdGFydCArIGkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChmcm9tTGVuID4gbGVuZ3RoKSB7XG4gICAgICAgICAgaWYgKGZyb20uY2hhckNvZGVBdChmcm9tU3RhcnQgKyBpKSA9PT0gNDcgLyovKi8pIHtcbiAgICAgICAgICAgIC8vIFdlIGdldCBoZXJlIGlmIGB0b2AgaXMgdGhlIGV4YWN0IGJhc2UgcGF0aCBmb3IgYGZyb21gLlxuICAgICAgICAgICAgLy8gRm9yIGV4YW1wbGU6IGZyb209Jy9mb28vYmFyL2Jheic7IHRvPScvZm9vL2JhcidcbiAgICAgICAgICAgIGxhc3RDb21tb25TZXAgPSBpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoaSA9PT0gMCkge1xuICAgICAgICAgICAgLy8gV2UgZ2V0IGhlcmUgaWYgYHRvYCBpcyB0aGUgcm9vdC5cbiAgICAgICAgICAgIC8vIEZvciBleGFtcGxlOiBmcm9tPScvZm9vJzsgdG89Jy8nXG4gICAgICAgICAgICBsYXN0Q29tbW9uU2VwID0gMDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICB2YXIgZnJvbUNvZGUgPSBmcm9tLmNoYXJDb2RlQXQoZnJvbVN0YXJ0ICsgaSk7XG4gICAgICB2YXIgdG9Db2RlID0gdG8uY2hhckNvZGVBdCh0b1N0YXJ0ICsgaSk7XG4gICAgICBpZiAoZnJvbUNvZGUgIT09IHRvQ29kZSlcbiAgICAgICAgYnJlYWs7XG4gICAgICBlbHNlIGlmIChmcm9tQ29kZSA9PT0gNDcgLyovKi8pXG4gICAgICAgIGxhc3RDb21tb25TZXAgPSBpO1xuICAgIH1cblxuICAgIHZhciBvdXQgPSAnJztcbiAgICAvLyBHZW5lcmF0ZSB0aGUgcmVsYXRpdmUgcGF0aCBiYXNlZCBvbiB0aGUgcGF0aCBkaWZmZXJlbmNlIGJldHdlZW4gYHRvYFxuICAgIC8vIGFuZCBgZnJvbWBcbiAgICBmb3IgKGkgPSBmcm9tU3RhcnQgKyBsYXN0Q29tbW9uU2VwICsgMTsgaSA8PSBmcm9tRW5kOyArK2kpIHtcbiAgICAgIGlmIChpID09PSBmcm9tRW5kIHx8IGZyb20uY2hhckNvZGVBdChpKSA9PT0gNDcgLyovKi8pIHtcbiAgICAgICAgaWYgKG91dC5sZW5ndGggPT09IDApXG4gICAgICAgICAgb3V0ICs9ICcuLic7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBvdXQgKz0gJy8uLic7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gTGFzdGx5LCBhcHBlbmQgdGhlIHJlc3Qgb2YgdGhlIGRlc3RpbmF0aW9uIChgdG9gKSBwYXRoIHRoYXQgY29tZXMgYWZ0ZXJcbiAgICAvLyB0aGUgY29tbW9uIHBhdGggcGFydHNcbiAgICBpZiAob3V0Lmxlbmd0aCA+IDApXG4gICAgICByZXR1cm4gb3V0ICsgdG8uc2xpY2UodG9TdGFydCArIGxhc3RDb21tb25TZXApO1xuICAgIGVsc2Uge1xuICAgICAgdG9TdGFydCArPSBsYXN0Q29tbW9uU2VwO1xuICAgICAgaWYgKHRvLmNoYXJDb2RlQXQodG9TdGFydCkgPT09IDQ3IC8qLyovKVxuICAgICAgICArK3RvU3RhcnQ7XG4gICAgICByZXR1cm4gdG8uc2xpY2UodG9TdGFydCk7XG4gICAgfVxuICB9LFxuXG4gIF9tYWtlTG9uZzogZnVuY3Rpb24gX21ha2VMb25nKHBhdGgpIHtcbiAgICByZXR1cm4gcGF0aDtcbiAgfSxcblxuICBkaXJuYW1lOiBmdW5jdGlvbiBkaXJuYW1lKHBhdGgpIHtcbiAgICBhc3NlcnRQYXRoKHBhdGgpO1xuICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gMCkgcmV0dXJuICcuJztcbiAgICB2YXIgY29kZSA9IHBhdGguY2hhckNvZGVBdCgwKTtcbiAgICB2YXIgaGFzUm9vdCA9IGNvZGUgPT09IDQ3IC8qLyovO1xuICAgIHZhciBlbmQgPSAtMTtcbiAgICB2YXIgbWF0Y2hlZFNsYXNoID0gdHJ1ZTtcbiAgICBmb3IgKHZhciBpID0gcGF0aC5sZW5ndGggLSAxOyBpID49IDE7IC0taSkge1xuICAgICAgY29kZSA9IHBhdGguY2hhckNvZGVBdChpKTtcbiAgICAgIGlmIChjb2RlID09PSA0NyAvKi8qLykge1xuICAgICAgICAgIGlmICghbWF0Y2hlZFNsYXNoKSB7XG4gICAgICAgICAgICBlbmQgPSBpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBXZSBzYXcgdGhlIGZpcnN0IG5vbi1wYXRoIHNlcGFyYXRvclxuICAgICAgICBtYXRjaGVkU2xhc2ggPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZW5kID09PSAtMSkgcmV0dXJuIGhhc1Jvb3QgPyAnLycgOiAnLic7XG4gICAgaWYgKGhhc1Jvb3QgJiYgZW5kID09PSAxKSByZXR1cm4gJy8vJztcbiAgICByZXR1cm4gcGF0aC5zbGljZSgwLCBlbmQpO1xuICB9LFxuXG4gIGJhc2VuYW1lOiBmdW5jdGlvbiBiYXNlbmFtZShwYXRoLCBleHQpIHtcbiAgICBpZiAoZXh0ICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIGV4dCAhPT0gJ3N0cmluZycpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wiZXh0XCIgYXJndW1lbnQgbXVzdCBiZSBhIHN0cmluZycpO1xuICAgIGFzc2VydFBhdGgocGF0aCk7XG5cbiAgICB2YXIgc3RhcnQgPSAwO1xuICAgIHZhciBlbmQgPSAtMTtcbiAgICB2YXIgbWF0Y2hlZFNsYXNoID0gdHJ1ZTtcbiAgICB2YXIgaTtcblxuICAgIGlmIChleHQgIT09IHVuZGVmaW5lZCAmJiBleHQubGVuZ3RoID4gMCAmJiBleHQubGVuZ3RoIDw9IHBhdGgubGVuZ3RoKSB7XG4gICAgICBpZiAoZXh0Lmxlbmd0aCA9PT0gcGF0aC5sZW5ndGggJiYgZXh0ID09PSBwYXRoKSByZXR1cm4gJyc7XG4gICAgICB2YXIgZXh0SWR4ID0gZXh0Lmxlbmd0aCAtIDE7XG4gICAgICB2YXIgZmlyc3ROb25TbGFzaEVuZCA9IC0xO1xuICAgICAgZm9yIChpID0gcGF0aC5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgICB2YXIgY29kZSA9IHBhdGguY2hhckNvZGVBdChpKTtcbiAgICAgICAgaWYgKGNvZGUgPT09IDQ3IC8qLyovKSB7XG4gICAgICAgICAgICAvLyBJZiB3ZSByZWFjaGVkIGEgcGF0aCBzZXBhcmF0b3IgdGhhdCB3YXMgbm90IHBhcnQgb2YgYSBzZXQgb2YgcGF0aFxuICAgICAgICAgICAgLy8gc2VwYXJhdG9ycyBhdCB0aGUgZW5kIG9mIHRoZSBzdHJpbmcsIHN0b3Agbm93XG4gICAgICAgICAgICBpZiAoIW1hdGNoZWRTbGFzaCkge1xuICAgICAgICAgICAgICBzdGFydCA9IGkgKyAxO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChmaXJzdE5vblNsYXNoRW5kID09PSAtMSkge1xuICAgICAgICAgICAgLy8gV2Ugc2F3IHRoZSBmaXJzdCBub24tcGF0aCBzZXBhcmF0b3IsIHJlbWVtYmVyIHRoaXMgaW5kZXggaW4gY2FzZVxuICAgICAgICAgICAgLy8gd2UgbmVlZCBpdCBpZiB0aGUgZXh0ZW5zaW9uIGVuZHMgdXAgbm90IG1hdGNoaW5nXG4gICAgICAgICAgICBtYXRjaGVkU2xhc2ggPSBmYWxzZTtcbiAgICAgICAgICAgIGZpcnN0Tm9uU2xhc2hFbmQgPSBpICsgMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGV4dElkeCA+PSAwKSB7XG4gICAgICAgICAgICAvLyBUcnkgdG8gbWF0Y2ggdGhlIGV4cGxpY2l0IGV4dGVuc2lvblxuICAgICAgICAgICAgaWYgKGNvZGUgPT09IGV4dC5jaGFyQ29kZUF0KGV4dElkeCkpIHtcbiAgICAgICAgICAgICAgaWYgKC0tZXh0SWR4ID09PSAtMSkge1xuICAgICAgICAgICAgICAgIC8vIFdlIG1hdGNoZWQgdGhlIGV4dGVuc2lvbiwgc28gbWFyayB0aGlzIGFzIHRoZSBlbmQgb2Ygb3VyIHBhdGhcbiAgICAgICAgICAgICAgICAvLyBjb21wb25lbnRcbiAgICAgICAgICAgICAgICBlbmQgPSBpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvLyBFeHRlbnNpb24gZG9lcyBub3QgbWF0Y2gsIHNvIG91ciByZXN1bHQgaXMgdGhlIGVudGlyZSBwYXRoXG4gICAgICAgICAgICAgIC8vIGNvbXBvbmVudFxuICAgICAgICAgICAgICBleHRJZHggPSAtMTtcbiAgICAgICAgICAgICAgZW5kID0gZmlyc3ROb25TbGFzaEVuZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHN0YXJ0ID09PSBlbmQpIGVuZCA9IGZpcnN0Tm9uU2xhc2hFbmQ7ZWxzZSBpZiAoZW5kID09PSAtMSkgZW5kID0gcGF0aC5sZW5ndGg7XG4gICAgICByZXR1cm4gcGF0aC5zbGljZShzdGFydCwgZW5kKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChpID0gcGF0aC5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgICBpZiAocGF0aC5jaGFyQ29kZUF0KGkpID09PSA0NyAvKi8qLykge1xuICAgICAgICAgICAgLy8gSWYgd2UgcmVhY2hlZCBhIHBhdGggc2VwYXJhdG9yIHRoYXQgd2FzIG5vdCBwYXJ0IG9mIGEgc2V0IG9mIHBhdGhcbiAgICAgICAgICAgIC8vIHNlcGFyYXRvcnMgYXQgdGhlIGVuZCBvZiB0aGUgc3RyaW5nLCBzdG9wIG5vd1xuICAgICAgICAgICAgaWYgKCFtYXRjaGVkU2xhc2gpIHtcbiAgICAgICAgICAgICAgc3RhcnQgPSBpICsgMTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChlbmQgPT09IC0xKSB7XG4gICAgICAgICAgLy8gV2Ugc2F3IHRoZSBmaXJzdCBub24tcGF0aCBzZXBhcmF0b3IsIG1hcmsgdGhpcyBhcyB0aGUgZW5kIG9mIG91clxuICAgICAgICAgIC8vIHBhdGggY29tcG9uZW50XG4gICAgICAgICAgbWF0Y2hlZFNsYXNoID0gZmFsc2U7XG4gICAgICAgICAgZW5kID0gaSArIDE7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGVuZCA9PT0gLTEpIHJldHVybiAnJztcbiAgICAgIHJldHVybiBwYXRoLnNsaWNlKHN0YXJ0LCBlbmQpO1xuICAgIH1cbiAgfSxcblxuICBleHRuYW1lOiBmdW5jdGlvbiBleHRuYW1lKHBhdGgpIHtcbiAgICBhc3NlcnRQYXRoKHBhdGgpO1xuICAgIHZhciBzdGFydERvdCA9IC0xO1xuICAgIHZhciBzdGFydFBhcnQgPSAwO1xuICAgIHZhciBlbmQgPSAtMTtcbiAgICB2YXIgbWF0Y2hlZFNsYXNoID0gdHJ1ZTtcbiAgICAvLyBUcmFjayB0aGUgc3RhdGUgb2YgY2hhcmFjdGVycyAoaWYgYW55KSB3ZSBzZWUgYmVmb3JlIG91ciBmaXJzdCBkb3QgYW5kXG4gICAgLy8gYWZ0ZXIgYW55IHBhdGggc2VwYXJhdG9yIHdlIGZpbmRcbiAgICB2YXIgcHJlRG90U3RhdGUgPSAwO1xuICAgIGZvciAodmFyIGkgPSBwYXRoLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICB2YXIgY29kZSA9IHBhdGguY2hhckNvZGVBdChpKTtcbiAgICAgIGlmIChjb2RlID09PSA0NyAvKi8qLykge1xuICAgICAgICAgIC8vIElmIHdlIHJlYWNoZWQgYSBwYXRoIHNlcGFyYXRvciB0aGF0IHdhcyBub3QgcGFydCBvZiBhIHNldCBvZiBwYXRoXG4gICAgICAgICAgLy8gc2VwYXJhdG9ycyBhdCB0aGUgZW5kIG9mIHRoZSBzdHJpbmcsIHN0b3Agbm93XG4gICAgICAgICAgaWYgKCFtYXRjaGVkU2xhc2gpIHtcbiAgICAgICAgICAgIHN0YXJ0UGFydCA9IGkgKyAxO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICBpZiAoZW5kID09PSAtMSkge1xuICAgICAgICAvLyBXZSBzYXcgdGhlIGZpcnN0IG5vbi1wYXRoIHNlcGFyYXRvciwgbWFyayB0aGlzIGFzIHRoZSBlbmQgb2Ygb3VyXG4gICAgICAgIC8vIGV4dGVuc2lvblxuICAgICAgICBtYXRjaGVkU2xhc2ggPSBmYWxzZTtcbiAgICAgICAgZW5kID0gaSArIDE7XG4gICAgICB9XG4gICAgICBpZiAoY29kZSA9PT0gNDYgLyouKi8pIHtcbiAgICAgICAgICAvLyBJZiB0aGlzIGlzIG91ciBmaXJzdCBkb3QsIG1hcmsgaXQgYXMgdGhlIHN0YXJ0IG9mIG91ciBleHRlbnNpb25cbiAgICAgICAgICBpZiAoc3RhcnREb3QgPT09IC0xKVxuICAgICAgICAgICAgc3RhcnREb3QgPSBpO1xuICAgICAgICAgIGVsc2UgaWYgKHByZURvdFN0YXRlICE9PSAxKVxuICAgICAgICAgICAgcHJlRG90U3RhdGUgPSAxO1xuICAgICAgfSBlbHNlIGlmIChzdGFydERvdCAhPT0gLTEpIHtcbiAgICAgICAgLy8gV2Ugc2F3IGEgbm9uLWRvdCBhbmQgbm9uLXBhdGggc2VwYXJhdG9yIGJlZm9yZSBvdXIgZG90LCBzbyB3ZSBzaG91bGRcbiAgICAgICAgLy8gaGF2ZSBhIGdvb2QgY2hhbmNlIGF0IGhhdmluZyBhIG5vbi1lbXB0eSBleHRlbnNpb25cbiAgICAgICAgcHJlRG90U3RhdGUgPSAtMTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoc3RhcnREb3QgPT09IC0xIHx8IGVuZCA9PT0gLTEgfHxcbiAgICAgICAgLy8gV2Ugc2F3IGEgbm9uLWRvdCBjaGFyYWN0ZXIgaW1tZWRpYXRlbHkgYmVmb3JlIHRoZSBkb3RcbiAgICAgICAgcHJlRG90U3RhdGUgPT09IDAgfHxcbiAgICAgICAgLy8gVGhlIChyaWdodC1tb3N0KSB0cmltbWVkIHBhdGggY29tcG9uZW50IGlzIGV4YWN0bHkgJy4uJ1xuICAgICAgICBwcmVEb3RTdGF0ZSA9PT0gMSAmJiBzdGFydERvdCA9PT0gZW5kIC0gMSAmJiBzdGFydERvdCA9PT0gc3RhcnRQYXJ0ICsgMSkge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgICByZXR1cm4gcGF0aC5zbGljZShzdGFydERvdCwgZW5kKTtcbiAgfSxcblxuICBmb3JtYXQ6IGZ1bmN0aW9uIGZvcm1hdChwYXRoT2JqZWN0KSB7XG4gICAgaWYgKHBhdGhPYmplY3QgPT09IG51bGwgfHwgdHlwZW9mIHBhdGhPYmplY3QgIT09ICdvYmplY3QnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgXCJwYXRoT2JqZWN0XCIgYXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIE9iamVjdC4gUmVjZWl2ZWQgdHlwZSAnICsgdHlwZW9mIHBhdGhPYmplY3QpO1xuICAgIH1cbiAgICByZXR1cm4gX2Zvcm1hdCgnLycsIHBhdGhPYmplY3QpO1xuICB9LFxuXG4gIHBhcnNlOiBmdW5jdGlvbiBwYXJzZShwYXRoKSB7XG4gICAgYXNzZXJ0UGF0aChwYXRoKTtcblxuICAgIHZhciByZXQgPSB7IHJvb3Q6ICcnLCBkaXI6ICcnLCBiYXNlOiAnJywgZXh0OiAnJywgbmFtZTogJycgfTtcbiAgICBpZiAocGF0aC5sZW5ndGggPT09IDApIHJldHVybiByZXQ7XG4gICAgdmFyIGNvZGUgPSBwYXRoLmNoYXJDb2RlQXQoMCk7XG4gICAgdmFyIGlzQWJzb2x1dGUgPSBjb2RlID09PSA0NyAvKi8qLztcbiAgICB2YXIgc3RhcnQ7XG4gICAgaWYgKGlzQWJzb2x1dGUpIHtcbiAgICAgIHJldC5yb290ID0gJy8nO1xuICAgICAgc3RhcnQgPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdGFydCA9IDA7XG4gICAgfVxuICAgIHZhciBzdGFydERvdCA9IC0xO1xuICAgIHZhciBzdGFydFBhcnQgPSAwO1xuICAgIHZhciBlbmQgPSAtMTtcbiAgICB2YXIgbWF0Y2hlZFNsYXNoID0gdHJ1ZTtcbiAgICB2YXIgaSA9IHBhdGgubGVuZ3RoIC0gMTtcblxuICAgIC8vIFRyYWNrIHRoZSBzdGF0ZSBvZiBjaGFyYWN0ZXJzIChpZiBhbnkpIHdlIHNlZSBiZWZvcmUgb3VyIGZpcnN0IGRvdCBhbmRcbiAgICAvLyBhZnRlciBhbnkgcGF0aCBzZXBhcmF0b3Igd2UgZmluZFxuICAgIHZhciBwcmVEb3RTdGF0ZSA9IDA7XG5cbiAgICAvLyBHZXQgbm9uLWRpciBpbmZvXG4gICAgZm9yICg7IGkgPj0gc3RhcnQ7IC0taSkge1xuICAgICAgY29kZSA9IHBhdGguY2hhckNvZGVBdChpKTtcbiAgICAgIGlmIChjb2RlID09PSA0NyAvKi8qLykge1xuICAgICAgICAgIC8vIElmIHdlIHJlYWNoZWQgYSBwYXRoIHNlcGFyYXRvciB0aGF0IHdhcyBub3QgcGFydCBvZiBhIHNldCBvZiBwYXRoXG4gICAgICAgICAgLy8gc2VwYXJhdG9ycyBhdCB0aGUgZW5kIG9mIHRoZSBzdHJpbmcsIHN0b3Agbm93XG4gICAgICAgICAgaWYgKCFtYXRjaGVkU2xhc2gpIHtcbiAgICAgICAgICAgIHN0YXJ0UGFydCA9IGkgKyAxO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICBpZiAoZW5kID09PSAtMSkge1xuICAgICAgICAvLyBXZSBzYXcgdGhlIGZpcnN0IG5vbi1wYXRoIHNlcGFyYXRvciwgbWFyayB0aGlzIGFzIHRoZSBlbmQgb2Ygb3VyXG4gICAgICAgIC8vIGV4dGVuc2lvblxuICAgICAgICBtYXRjaGVkU2xhc2ggPSBmYWxzZTtcbiAgICAgICAgZW5kID0gaSArIDE7XG4gICAgICB9XG4gICAgICBpZiAoY29kZSA9PT0gNDYgLyouKi8pIHtcbiAgICAgICAgICAvLyBJZiB0aGlzIGlzIG91ciBmaXJzdCBkb3QsIG1hcmsgaXQgYXMgdGhlIHN0YXJ0IG9mIG91ciBleHRlbnNpb25cbiAgICAgICAgICBpZiAoc3RhcnREb3QgPT09IC0xKSBzdGFydERvdCA9IGk7ZWxzZSBpZiAocHJlRG90U3RhdGUgIT09IDEpIHByZURvdFN0YXRlID0gMTtcbiAgICAgICAgfSBlbHNlIGlmIChzdGFydERvdCAhPT0gLTEpIHtcbiAgICAgICAgLy8gV2Ugc2F3IGEgbm9uLWRvdCBhbmQgbm9uLXBhdGggc2VwYXJhdG9yIGJlZm9yZSBvdXIgZG90LCBzbyB3ZSBzaG91bGRcbiAgICAgICAgLy8gaGF2ZSBhIGdvb2QgY2hhbmNlIGF0IGhhdmluZyBhIG5vbi1lbXB0eSBleHRlbnNpb25cbiAgICAgICAgcHJlRG90U3RhdGUgPSAtMTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoc3RhcnREb3QgPT09IC0xIHx8IGVuZCA9PT0gLTEgfHxcbiAgICAvLyBXZSBzYXcgYSBub24tZG90IGNoYXJhY3RlciBpbW1lZGlhdGVseSBiZWZvcmUgdGhlIGRvdFxuICAgIHByZURvdFN0YXRlID09PSAwIHx8XG4gICAgLy8gVGhlIChyaWdodC1tb3N0KSB0cmltbWVkIHBhdGggY29tcG9uZW50IGlzIGV4YWN0bHkgJy4uJ1xuICAgIHByZURvdFN0YXRlID09PSAxICYmIHN0YXJ0RG90ID09PSBlbmQgLSAxICYmIHN0YXJ0RG90ID09PSBzdGFydFBhcnQgKyAxKSB7XG4gICAgICBpZiAoZW5kICE9PSAtMSkge1xuICAgICAgICBpZiAoc3RhcnRQYXJ0ID09PSAwICYmIGlzQWJzb2x1dGUpIHJldC5iYXNlID0gcmV0Lm5hbWUgPSBwYXRoLnNsaWNlKDEsIGVuZCk7ZWxzZSByZXQuYmFzZSA9IHJldC5uYW1lID0gcGF0aC5zbGljZShzdGFydFBhcnQsIGVuZCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChzdGFydFBhcnQgPT09IDAgJiYgaXNBYnNvbHV0ZSkge1xuICAgICAgICByZXQubmFtZSA9IHBhdGguc2xpY2UoMSwgc3RhcnREb3QpO1xuICAgICAgICByZXQuYmFzZSA9IHBhdGguc2xpY2UoMSwgZW5kKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldC5uYW1lID0gcGF0aC5zbGljZShzdGFydFBhcnQsIHN0YXJ0RG90KTtcbiAgICAgICAgcmV0LmJhc2UgPSBwYXRoLnNsaWNlKHN0YXJ0UGFydCwgZW5kKTtcbiAgICAgIH1cbiAgICAgIHJldC5leHQgPSBwYXRoLnNsaWNlKHN0YXJ0RG90LCBlbmQpO1xuICAgIH1cblxuICAgIGlmIChzdGFydFBhcnQgPiAwKSByZXQuZGlyID0gcGF0aC5zbGljZSgwLCBzdGFydFBhcnQgLSAxKTtlbHNlIGlmIChpc0Fic29sdXRlKSByZXQuZGlyID0gJy8nO1xuXG4gICAgcmV0dXJuIHJldDtcbiAgfSxcblxuICBzZXA6ICcvJyxcbiAgZGVsaW1pdGVyOiAnOicsXG4gIHdpbjMyOiBudWxsLFxuICBwb3NpeDogbnVsbFxufTtcblxucG9zaXgucG9zaXggPSBwb3NpeDtcblxubW9kdWxlLmV4cG9ydHMgPSBwb3NpeDtcbiIsIid1c2Ugc3RyaWN0JztcbmNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmcCA9PiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcblx0ZnMuYWNjZXNzKGZwLCBlcnIgPT4ge1xuXHRcdHJlc29sdmUoIWVycik7XG5cdH0pO1xufSk7XG5cbm1vZHVsZS5leHBvcnRzLnN5bmMgPSBmcCA9PiB7XG5cdHRyeSB7XG5cdFx0ZnMuYWNjZXNzU3luYyhmcCk7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH0gY2F0Y2ggKGVycikge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuY29uc3QgcHJvY2Vzc0ZuID0gKGZuLCBvcHRzKSA9PiBmdW5jdGlvbiAoKSB7XG5cdGNvbnN0IFAgPSBvcHRzLnByb21pc2VNb2R1bGU7XG5cdGNvbnN0IGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCk7XG5cblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRhcmdzW2ldID0gYXJndW1lbnRzW2ldO1xuXHR9XG5cblx0cmV0dXJuIG5ldyBQKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRpZiAob3B0cy5lcnJvckZpcnN0KSB7XG5cdFx0XHRhcmdzLnB1c2goZnVuY3Rpb24gKGVyciwgcmVzdWx0KSB7XG5cdFx0XHRcdGlmIChvcHRzLm11bHRpQXJncykge1xuXHRcdFx0XHRcdGNvbnN0IHJlc3VsdHMgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuXG5cdFx0XHRcdFx0Zm9yIChsZXQgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRcdHJlc3VsdHNbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmIChlcnIpIHtcblx0XHRcdFx0XHRcdHJlc3VsdHMudW5zaGlmdChlcnIpO1xuXHRcdFx0XHRcdFx0cmVqZWN0KHJlc3VsdHMpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRyZXNvbHZlKHJlc3VsdHMpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIGlmIChlcnIpIHtcblx0XHRcdFx0XHRyZWplY3QoZXJyKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXNvbHZlKHJlc3VsdCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRhcmdzLnB1c2goZnVuY3Rpb24gKHJlc3VsdCkge1xuXHRcdFx0XHRpZiAob3B0cy5tdWx0aUFyZ3MpIHtcblx0XHRcdFx0XHRjb25zdCByZXN1bHRzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcblxuXHRcdFx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0XHRyZXN1bHRzW2ldID0gYXJndW1lbnRzW2ldO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJlc29sdmUocmVzdWx0cyk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmVzb2x2ZShyZXN1bHQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRmbi5hcHBseSh0aGlzLCBhcmdzKTtcblx0fSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IChvYmosIG9wdHMpID0+IHtcblx0b3B0cyA9IE9iamVjdC5hc3NpZ24oe1xuXHRcdGV4Y2x1ZGU6IFsvLisoU3luY3xTdHJlYW0pJC9dLFxuXHRcdGVycm9yRmlyc3Q6IHRydWUsXG5cdFx0cHJvbWlzZU1vZHVsZTogUHJvbWlzZVxuXHR9LCBvcHRzKTtcblxuXHRjb25zdCBmaWx0ZXIgPSBrZXkgPT4ge1xuXHRcdGNvbnN0IG1hdGNoID0gcGF0dGVybiA9PiB0eXBlb2YgcGF0dGVybiA9PT0gJ3N0cmluZycgPyBrZXkgPT09IHBhdHRlcm4gOiBwYXR0ZXJuLnRlc3Qoa2V5KTtcblx0XHRyZXR1cm4gb3B0cy5pbmNsdWRlID8gb3B0cy5pbmNsdWRlLnNvbWUobWF0Y2gpIDogIW9wdHMuZXhjbHVkZS5zb21lKG1hdGNoKTtcblx0fTtcblxuXHRsZXQgcmV0O1xuXHRpZiAodHlwZW9mIG9iaiA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdHJldCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmIChvcHRzLmV4Y2x1ZGVNYWluKSB7XG5cdFx0XHRcdHJldHVybiBvYmouYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHByb2Nlc3NGbihvYmosIG9wdHMpLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdFx0fTtcblx0fSBlbHNlIHtcblx0XHRyZXQgPSBPYmplY3QuY3JlYXRlKE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmopKTtcblx0fVxuXG5cdGZvciAoY29uc3Qga2V5IGluIG9iaikgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGd1YXJkLWZvci1pblxuXHRcdGNvbnN0IHggPSBvYmpba2V5XTtcblx0XHRyZXRba2V5XSA9IHR5cGVvZiB4ID09PSAnZnVuY3Rpb24nICYmIGZpbHRlcihrZXkpID8gcHJvY2Vzc0ZuKHgsIG9wdHMpIDogeDtcblx0fVxuXG5cdHJldHVybiByZXQ7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmNvbnN0IGZpbmRVcCA9IHJlcXVpcmUoJ2ZpbmQtdXAnKTtcbmNvbnN0IGxvYWRKc29uRmlsZSA9IHJlcXVpcmUoJ2xvYWQtanNvbi1maWxlJyk7XG5cbmNvbnN0IGZpbGVwYXRocyA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBmaWxlcGF0aCA9IGNvbmYgPT4gZmlsZXBhdGhzLmdldChjb25mKTtcbmNvbnN0IGZpbmROZXh0Q3dkID0gcGtnUGF0aCA9PiBwYXRoLnJlc29sdmUocGF0aC5kaXJuYW1lKHBrZ1BhdGgpLCAnLi4nKTtcblxuY29uc3QgYWRkRnAgPSAob2JqLCBmcCkgPT4ge1xuXHRmaWxlcGF0aHMuc2V0KG9iaiwgZnApO1xuXHRyZXR1cm4gb2JqO1xufTtcblxuY29uc3QgcGtnQ29uZiA9IChuYW1lc3BhY2UsIG9wdHMpID0+IHtcblx0aWYgKCFuYW1lc3BhY2UpIHtcblx0XHRyZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgYSBuYW1lc3BhY2UnKSk7XG5cdH1cblxuXHRvcHRzID0gb3B0cyB8fCB7fTtcblxuXHRyZXR1cm4gZmluZFVwKCdwYWNrYWdlLmpzb24nLCBvcHRzLmN3ZCA/IHtjd2Q6IG9wdHMuY3dkfSA6IHt9KVxuXHRcdC50aGVuKGZwID0+IHtcblx0XHRcdGlmICghZnApIHtcblx0XHRcdFx0cmV0dXJuIGFkZEZwKE9iamVjdC5hc3NpZ24oe30sIG9wdHMuZGVmYXVsdHMpLCBmcCk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBsb2FkSnNvbkZpbGUoZnApLnRoZW4ocGtnID0+IHtcblx0XHRcdFx0aWYgKG9wdHMuc2tpcE9uRmFsc2UgJiYgcGtnW25hbWVzcGFjZV0gPT09IGZhbHNlKSB7XG5cdFx0XHRcdFx0Y29uc3QgbmV3T3B0cyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdHMsIHtjd2Q6IGZpbmROZXh0Q3dkKGZwKX0pO1xuXHRcdFx0XHRcdHJldHVybiBwa2dDb25mKG5hbWVzcGFjZSwgbmV3T3B0cyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gYWRkRnAoT2JqZWN0LmFzc2lnbih7fSwgb3B0cy5kZWZhdWx0cywgcGtnW25hbWVzcGFjZV0pLCBmcCk7XG5cdFx0XHR9KTtcblx0XHR9KTtcbn07XG5cbmNvbnN0IHN5bmMgPSAobmFtZXNwYWNlLCBvcHRzKSA9PiB7XG5cdGlmICghbmFtZXNwYWNlKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgYSBuYW1lc3BhY2UnKTtcblx0fVxuXG5cdG9wdHMgPSBvcHRzIHx8IHt9O1xuXG5cdGNvbnN0IGZwID0gZmluZFVwLnN5bmMoJ3BhY2thZ2UuanNvbicsIG9wdHMuY3dkID8ge2N3ZDogb3B0cy5jd2R9IDoge30pO1xuXG5cdGlmICghZnApIHtcblx0XHRyZXR1cm4gYWRkRnAoT2JqZWN0LmFzc2lnbih7fSwgb3B0cy5kZWZhdWx0cyksIGZwKTtcblx0fVxuXG5cdGNvbnN0IHBrZyA9IGxvYWRKc29uRmlsZS5zeW5jKGZwKTtcblxuXHRpZiAob3B0cy5za2lwT25GYWxzZSAmJiBwa2dbbmFtZXNwYWNlXSA9PT0gZmFsc2UpIHtcblx0XHRjb25zdCBuZXdPcHRzID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0cywge2N3ZDogZmluZE5leHRDd2QoZnApfSk7XG5cdFx0cmV0dXJuIHN5bmMobmFtZXNwYWNlLCBuZXdPcHRzKTtcblx0fVxuXG5cdHJldHVybiBhZGRGcChPYmplY3QuYXNzaWduKHt9LCBvcHRzLmRlZmF1bHRzLCBwa2dbbmFtZXNwYWNlXSksIGZwKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcGtnQ29uZjtcbm1vZHVsZS5leHBvcnRzLmZpbGVwYXRoID0gZmlsZXBhdGg7XG5tb2R1bGUuZXhwb3J0cy5zeW5jID0gc3luYztcbiIsIid1c2Ugc3RyaWN0JztcblxuaWYgKCFwcm9jZXNzLnZlcnNpb24gfHxcbiAgICBwcm9jZXNzLnZlcnNpb24uaW5kZXhPZigndjAuJykgPT09IDAgfHxcbiAgICBwcm9jZXNzLnZlcnNpb24uaW5kZXhPZigndjEuJykgPT09IDAgJiYgcHJvY2Vzcy52ZXJzaW9uLmluZGV4T2YoJ3YxLjguJykgIT09IDApIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSB7IG5leHRUaWNrOiBuZXh0VGljayB9O1xufSBlbHNlIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBwcm9jZXNzXG59XG5cbmZ1bmN0aW9uIG5leHRUaWNrKGZuLCBhcmcxLCBhcmcyLCBhcmczKSB7XG4gIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImNhbGxiYWNrXCIgYXJndW1lbnQgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG4gIH1cbiAgdmFyIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gIHZhciBhcmdzLCBpO1xuICBzd2l0Y2ggKGxlbikge1xuICBjYXNlIDA6XG4gIGNhc2UgMTpcbiAgICByZXR1cm4gcHJvY2Vzcy5uZXh0VGljayhmbik7XG4gIGNhc2UgMjpcbiAgICByZXR1cm4gcHJvY2Vzcy5uZXh0VGljayhmdW5jdGlvbiBhZnRlclRpY2tPbmUoKSB7XG4gICAgICBmbi5jYWxsKG51bGwsIGFyZzEpO1xuICAgIH0pO1xuICBjYXNlIDM6XG4gICAgcmV0dXJuIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24gYWZ0ZXJUaWNrVHdvKCkge1xuICAgICAgZm4uY2FsbChudWxsLCBhcmcxLCBhcmcyKTtcbiAgICB9KTtcbiAgY2FzZSA0OlxuICAgIHJldHVybiBwcm9jZXNzLm5leHRUaWNrKGZ1bmN0aW9uIGFmdGVyVGlja1RocmVlKCkge1xuICAgICAgZm4uY2FsbChudWxsLCBhcmcxLCBhcmcyLCBhcmczKTtcbiAgICB9KTtcbiAgZGVmYXVsdDpcbiAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgIGkgPSAwO1xuICAgIHdoaWxlIChpIDwgYXJncy5sZW5ndGgpIHtcbiAgICAgIGFyZ3NbaSsrXSA9IGFyZ3VtZW50c1tpXTtcbiAgICB9XG4gICAgcmV0dXJuIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24gYWZ0ZXJUaWNrKCkge1xuICAgICAgZm4uYXBwbHkobnVsbCwgYXJncyk7XG4gICAgfSk7XG4gIH1cbn1cblxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGRlZmF1bHRTZXRUaW1vdXQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG5mdW5jdGlvbiBkZWZhdWx0Q2xlYXJUaW1lb3V0ICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHNldFRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGNsZWFyVGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICB9XG59ICgpKVxuZnVuY3Rpb24gcnVuVGltZW91dChmdW4pIHtcbiAgICBpZiAoY2FjaGVkU2V0VGltZW91dCA9PT0gc2V0VGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgLy8gaWYgc2V0VGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZFNldFRpbWVvdXQgPT09IGRlZmF1bHRTZXRUaW1vdXQgfHwgIWNhY2hlZFNldFRpbWVvdXQpICYmIHNldFRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0IHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKG51bGwsIGZ1biwgMCk7XG4gICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbCh0aGlzLCBmdW4sIDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbn1cbmZ1bmN0aW9uIHJ1bkNsZWFyVGltZW91dChtYXJrZXIpIHtcbiAgICBpZiAoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgLy8gaWYgY2xlYXJUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBkZWZhdWx0Q2xlYXJUaW1lb3V0IHx8ICFjYWNoZWRDbGVhclRpbWVvdXQpICYmIGNsZWFyVGltZW91dCkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgIHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwobnVsbCwgbWFya2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgSS5FLiBoYXZlIGRpZmZlcmVudCBydWxlcyBmb3IgY2xlYXJUaW1lb3V0IHZzIHNldFRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbCh0aGlzLCBtYXJrZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxufVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gcnVuVGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgcnVuQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgcnVuVGltZW91dChkcmFpblF1ZXVlKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kT25jZUxpc3RlbmVyID0gbm9vcDtcblxucHJvY2Vzcy5saXN0ZW5lcnMgPSBmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gW10gfVxuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9saWIvX3N0cmVhbV9kdXBsZXguanMnKTtcbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4vLyBhIGR1cGxleCBzdHJlYW0gaXMganVzdCBhIHN0cmVhbSB0aGF0IGlzIGJvdGggcmVhZGFibGUgYW5kIHdyaXRhYmxlLlxuLy8gU2luY2UgSlMgZG9lc24ndCBoYXZlIG11bHRpcGxlIHByb3RvdHlwYWwgaW5oZXJpdGFuY2UsIHRoaXMgY2xhc3Ncbi8vIHByb3RvdHlwYWxseSBpbmhlcml0cyBmcm9tIFJlYWRhYmxlLCBhbmQgdGhlbiBwYXJhc2l0aWNhbGx5IGZyb21cbi8vIFdyaXRhYmxlLlxuXG4ndXNlIHN0cmljdCc7XG5cbi8qPHJlcGxhY2VtZW50PiovXG5cbnZhciBwbmEgPSByZXF1aXJlKCdwcm9jZXNzLW5leHRpY2stYXJncycpO1xuLyo8L3JlcGxhY2VtZW50PiovXG5cbi8qPHJlcGxhY2VtZW50PiovXG52YXIgb2JqZWN0S2V5cyA9IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgdmFyIGtleXMgPSBbXTtcbiAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgIGtleXMucHVzaChrZXkpO1xuICB9cmV0dXJuIGtleXM7XG59O1xuLyo8L3JlcGxhY2VtZW50PiovXG5cbm1vZHVsZS5leHBvcnRzID0gRHVwbGV4O1xuXG4vKjxyZXBsYWNlbWVudD4qL1xudmFyIHV0aWwgPSByZXF1aXJlKCdjb3JlLXV0aWwtaXMnKTtcbnV0aWwuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuLyo8L3JlcGxhY2VtZW50PiovXG5cbnZhciBSZWFkYWJsZSA9IHJlcXVpcmUoJy4vX3N0cmVhbV9yZWFkYWJsZScpO1xudmFyIFdyaXRhYmxlID0gcmVxdWlyZSgnLi9fc3RyZWFtX3dyaXRhYmxlJyk7XG5cbnV0aWwuaW5oZXJpdHMoRHVwbGV4LCBSZWFkYWJsZSk7XG5cbntcbiAgLy8gYXZvaWQgc2NvcGUgY3JlZXAsIHRoZSBrZXlzIGFycmF5IGNhbiB0aGVuIGJlIGNvbGxlY3RlZFxuICB2YXIga2V5cyA9IG9iamVjdEtleXMoV3JpdGFibGUucHJvdG90eXBlKTtcbiAgZm9yICh2YXIgdiA9IDA7IHYgPCBrZXlzLmxlbmd0aDsgdisrKSB7XG4gICAgdmFyIG1ldGhvZCA9IGtleXNbdl07XG4gICAgaWYgKCFEdXBsZXgucHJvdG90eXBlW21ldGhvZF0pIER1cGxleC5wcm90b3R5cGVbbWV0aG9kXSA9IFdyaXRhYmxlLnByb3RvdHlwZVttZXRob2RdO1xuICB9XG59XG5cbmZ1bmN0aW9uIER1cGxleChvcHRpb25zKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBEdXBsZXgpKSByZXR1cm4gbmV3IER1cGxleChvcHRpb25zKTtcblxuICBSZWFkYWJsZS5jYWxsKHRoaXMsIG9wdGlvbnMpO1xuICBXcml0YWJsZS5jYWxsKHRoaXMsIG9wdGlvbnMpO1xuXG4gIGlmIChvcHRpb25zICYmIG9wdGlvbnMucmVhZGFibGUgPT09IGZhbHNlKSB0aGlzLnJlYWRhYmxlID0gZmFsc2U7XG5cbiAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy53cml0YWJsZSA9PT0gZmFsc2UpIHRoaXMud3JpdGFibGUgPSBmYWxzZTtcblxuICB0aGlzLmFsbG93SGFsZk9wZW4gPSB0cnVlO1xuICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLmFsbG93SGFsZk9wZW4gPT09IGZhbHNlKSB0aGlzLmFsbG93SGFsZk9wZW4gPSBmYWxzZTtcblxuICB0aGlzLm9uY2UoJ2VuZCcsIG9uZW5kKTtcbn1cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KER1cGxleC5wcm90b3R5cGUsICd3cml0YWJsZUhpZ2hXYXRlck1hcmsnLCB7XG4gIC8vIG1ha2luZyBpdCBleHBsaWNpdCB0aGlzIHByb3BlcnR5IGlzIG5vdCBlbnVtZXJhYmxlXG4gIC8vIGJlY2F1c2Ugb3RoZXJ3aXNlIHNvbWUgcHJvdG90eXBlIG1hbmlwdWxhdGlvbiBpblxuICAvLyB1c2VybGFuZCB3aWxsIGZhaWxcbiAgZW51bWVyYWJsZTogZmFsc2UsXG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl93cml0YWJsZVN0YXRlLmhpZ2hXYXRlck1hcms7XG4gIH1cbn0pO1xuXG4vLyB0aGUgbm8taGFsZi1vcGVuIGVuZm9yY2VyXG5mdW5jdGlvbiBvbmVuZCgpIHtcbiAgLy8gaWYgd2UgYWxsb3cgaGFsZi1vcGVuIHN0YXRlLCBvciBpZiB0aGUgd3JpdGFibGUgc2lkZSBlbmRlZCxcbiAgLy8gdGhlbiB3ZSdyZSBvay5cbiAgaWYgKHRoaXMuYWxsb3dIYWxmT3BlbiB8fCB0aGlzLl93cml0YWJsZVN0YXRlLmVuZGVkKSByZXR1cm47XG5cbiAgLy8gbm8gbW9yZSBkYXRhIGNhbiBiZSB3cml0dGVuLlxuICAvLyBCdXQgYWxsb3cgbW9yZSB3cml0ZXMgdG8gaGFwcGVuIGluIHRoaXMgdGljay5cbiAgcG5hLm5leHRUaWNrKG9uRW5kTlQsIHRoaXMpO1xufVxuXG5mdW5jdGlvbiBvbkVuZE5UKHNlbGYpIHtcbiAgc2VsZi5lbmQoKTtcbn1cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KER1cGxleC5wcm90b3R5cGUsICdkZXN0cm95ZWQnLCB7XG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLl9yZWFkYWJsZVN0YXRlID09PSB1bmRlZmluZWQgfHwgdGhpcy5fd3JpdGFibGVTdGF0ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9yZWFkYWJsZVN0YXRlLmRlc3Ryb3llZCAmJiB0aGlzLl93cml0YWJsZVN0YXRlLmRlc3Ryb3llZDtcbiAgfSxcbiAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAvLyB3ZSBpZ25vcmUgdGhlIHZhbHVlIGlmIHRoZSBzdHJlYW1cbiAgICAvLyBoYXMgbm90IGJlZW4gaW5pdGlhbGl6ZWQgeWV0XG4gICAgaWYgKHRoaXMuX3JlYWRhYmxlU3RhdGUgPT09IHVuZGVmaW5lZCB8fCB0aGlzLl93cml0YWJsZVN0YXRlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBiYWNrd2FyZCBjb21wYXRpYmlsaXR5LCB0aGUgdXNlciBpcyBleHBsaWNpdGx5XG4gICAgLy8gbWFuYWdpbmcgZGVzdHJveWVkXG4gICAgdGhpcy5fcmVhZGFibGVTdGF0ZS5kZXN0cm95ZWQgPSB2YWx1ZTtcbiAgICB0aGlzLl93cml0YWJsZVN0YXRlLmRlc3Ryb3llZCA9IHZhbHVlO1xuICB9XG59KTtcblxuRHVwbGV4LnByb3RvdHlwZS5fZGVzdHJveSA9IGZ1bmN0aW9uIChlcnIsIGNiKSB7XG4gIHRoaXMucHVzaChudWxsKTtcbiAgdGhpcy5lbmQoKTtcblxuICBwbmEubmV4dFRpY2soY2IsIGVycik7XG59OyIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4vLyBhIHBhc3N0aHJvdWdoIHN0cmVhbS5cbi8vIGJhc2ljYWxseSBqdXN0IHRoZSBtb3N0IG1pbmltYWwgc29ydCBvZiBUcmFuc2Zvcm0gc3RyZWFtLlxuLy8gRXZlcnkgd3JpdHRlbiBjaHVuayBnZXRzIG91dHB1dCBhcy1pcy5cblxuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBhc3NUaHJvdWdoO1xuXG52YXIgVHJhbnNmb3JtID0gcmVxdWlyZSgnLi9fc3RyZWFtX3RyYW5zZm9ybScpO1xuXG4vKjxyZXBsYWNlbWVudD4qL1xudmFyIHV0aWwgPSByZXF1aXJlKCdjb3JlLXV0aWwtaXMnKTtcbnV0aWwuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuLyo8L3JlcGxhY2VtZW50PiovXG5cbnV0aWwuaW5oZXJpdHMoUGFzc1Rocm91Z2gsIFRyYW5zZm9ybSk7XG5cbmZ1bmN0aW9uIFBhc3NUaHJvdWdoKG9wdGlvbnMpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFBhc3NUaHJvdWdoKSkgcmV0dXJuIG5ldyBQYXNzVGhyb3VnaChvcHRpb25zKTtcblxuICBUcmFuc2Zvcm0uY2FsbCh0aGlzLCBvcHRpb25zKTtcbn1cblxuUGFzc1Rocm91Z2gucHJvdG90eXBlLl90cmFuc2Zvcm0gPSBmdW5jdGlvbiAoY2h1bmssIGVuY29kaW5nLCBjYikge1xuICBjYihudWxsLCBjaHVuayk7XG59OyIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4ndXNlIHN0cmljdCc7XG5cbi8qPHJlcGxhY2VtZW50PiovXG5cbnZhciBwbmEgPSByZXF1aXJlKCdwcm9jZXNzLW5leHRpY2stYXJncycpO1xuLyo8L3JlcGxhY2VtZW50PiovXG5cbm1vZHVsZS5leHBvcnRzID0gUmVhZGFibGU7XG5cbi8qPHJlcGxhY2VtZW50PiovXG52YXIgaXNBcnJheSA9IHJlcXVpcmUoJ2lzYXJyYXknKTtcbi8qPC9yZXBsYWNlbWVudD4qL1xuXG4vKjxyZXBsYWNlbWVudD4qL1xudmFyIER1cGxleDtcbi8qPC9yZXBsYWNlbWVudD4qL1xuXG5SZWFkYWJsZS5SZWFkYWJsZVN0YXRlID0gUmVhZGFibGVTdGF0ZTtcblxuLyo8cmVwbGFjZW1lbnQ+Ki9cbnZhciBFRSA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcjtcblxudmFyIEVFbGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uIChlbWl0dGVyLCB0eXBlKSB7XG4gIHJldHVybiBlbWl0dGVyLmxpc3RlbmVycyh0eXBlKS5sZW5ndGg7XG59O1xuLyo8L3JlcGxhY2VtZW50PiovXG5cbi8qPHJlcGxhY2VtZW50PiovXG52YXIgU3RyZWFtID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9zdHJlYW1zL3N0cmVhbScpO1xuLyo8L3JlcGxhY2VtZW50PiovXG5cbi8qPHJlcGxhY2VtZW50PiovXG5cbnZhciBCdWZmZXIgPSByZXF1aXJlKCdzYWZlLWJ1ZmZlcicpLkJ1ZmZlcjtcbnZhciBPdXJVaW50OEFycmF5ID0gZ2xvYmFsLlVpbnQ4QXJyYXkgfHwgZnVuY3Rpb24gKCkge307XG5mdW5jdGlvbiBfdWludDhBcnJheVRvQnVmZmVyKGNodW5rKSB7XG4gIHJldHVybiBCdWZmZXIuZnJvbShjaHVuayk7XG59XG5mdW5jdGlvbiBfaXNVaW50OEFycmF5KG9iaikge1xuICByZXR1cm4gQnVmZmVyLmlzQnVmZmVyKG9iaikgfHwgb2JqIGluc3RhbmNlb2YgT3VyVWludDhBcnJheTtcbn1cblxuLyo8L3JlcGxhY2VtZW50PiovXG5cbi8qPHJlcGxhY2VtZW50PiovXG52YXIgdXRpbCA9IHJlcXVpcmUoJ2NvcmUtdXRpbC1pcycpO1xudXRpbC5pbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJyk7XG4vKjwvcmVwbGFjZW1lbnQ+Ki9cblxuLyo8cmVwbGFjZW1lbnQ+Ki9cbnZhciBkZWJ1Z1V0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgZGVidWcgPSB2b2lkIDA7XG5pZiAoZGVidWdVdGlsICYmIGRlYnVnVXRpbC5kZWJ1Z2xvZykge1xuICBkZWJ1ZyA9IGRlYnVnVXRpbC5kZWJ1Z2xvZygnc3RyZWFtJyk7XG59IGVsc2Uge1xuICBkZWJ1ZyA9IGZ1bmN0aW9uICgpIHt9O1xufVxuLyo8L3JlcGxhY2VtZW50PiovXG5cbnZhciBCdWZmZXJMaXN0ID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9zdHJlYW1zL0J1ZmZlckxpc3QnKTtcbnZhciBkZXN0cm95SW1wbCA9IHJlcXVpcmUoJy4vaW50ZXJuYWwvc3RyZWFtcy9kZXN0cm95Jyk7XG52YXIgU3RyaW5nRGVjb2RlcjtcblxudXRpbC5pbmhlcml0cyhSZWFkYWJsZSwgU3RyZWFtKTtcblxudmFyIGtQcm94eUV2ZW50cyA9IFsnZXJyb3InLCAnY2xvc2UnLCAnZGVzdHJveScsICdwYXVzZScsICdyZXN1bWUnXTtcblxuZnVuY3Rpb24gcHJlcGVuZExpc3RlbmVyKGVtaXR0ZXIsIGV2ZW50LCBmbikge1xuICAvLyBTYWRseSB0aGlzIGlzIG5vdCBjYWNoZWFibGUgYXMgc29tZSBsaWJyYXJpZXMgYnVuZGxlIHRoZWlyIG93blxuICAvLyBldmVudCBlbWl0dGVyIGltcGxlbWVudGF0aW9uIHdpdGggdGhlbS5cbiAgaWYgKHR5cGVvZiBlbWl0dGVyLnByZXBlbmRMaXN0ZW5lciA9PT0gJ2Z1bmN0aW9uJykgcmV0dXJuIGVtaXR0ZXIucHJlcGVuZExpc3RlbmVyKGV2ZW50LCBmbik7XG5cbiAgLy8gVGhpcyBpcyBhIGhhY2sgdG8gbWFrZSBzdXJlIHRoYXQgb3VyIGVycm9yIGhhbmRsZXIgaXMgYXR0YWNoZWQgYmVmb3JlIGFueVxuICAvLyB1c2VybGFuZCBvbmVzLiAgTkVWRVIgRE8gVEhJUy4gVGhpcyBpcyBoZXJlIG9ubHkgYmVjYXVzZSB0aGlzIGNvZGUgbmVlZHNcbiAgLy8gdG8gY29udGludWUgdG8gd29yayB3aXRoIG9sZGVyIHZlcnNpb25zIG9mIE5vZGUuanMgdGhhdCBkbyBub3QgaW5jbHVkZVxuICAvLyB0aGUgcHJlcGVuZExpc3RlbmVyKCkgbWV0aG9kLiBUaGUgZ29hbCBpcyB0byBldmVudHVhbGx5IHJlbW92ZSB0aGlzIGhhY2suXG4gIGlmICghZW1pdHRlci5fZXZlbnRzIHx8ICFlbWl0dGVyLl9ldmVudHNbZXZlbnRdKSBlbWl0dGVyLm9uKGV2ZW50LCBmbik7ZWxzZSBpZiAoaXNBcnJheShlbWl0dGVyLl9ldmVudHNbZXZlbnRdKSkgZW1pdHRlci5fZXZlbnRzW2V2ZW50XS51bnNoaWZ0KGZuKTtlbHNlIGVtaXR0ZXIuX2V2ZW50c1tldmVudF0gPSBbZm4sIGVtaXR0ZXIuX2V2ZW50c1tldmVudF1dO1xufVxuXG5mdW5jdGlvbiBSZWFkYWJsZVN0YXRlKG9wdGlvbnMsIHN0cmVhbSkge1xuICBEdXBsZXggPSBEdXBsZXggfHwgcmVxdWlyZSgnLi9fc3RyZWFtX2R1cGxleCcpO1xuXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIC8vIER1cGxleCBzdHJlYW1zIGFyZSBib3RoIHJlYWRhYmxlIGFuZCB3cml0YWJsZSwgYnV0IHNoYXJlXG4gIC8vIHRoZSBzYW1lIG9wdGlvbnMgb2JqZWN0LlxuICAvLyBIb3dldmVyLCBzb21lIGNhc2VzIHJlcXVpcmUgc2V0dGluZyBvcHRpb25zIHRvIGRpZmZlcmVudFxuICAvLyB2YWx1ZXMgZm9yIHRoZSByZWFkYWJsZSBhbmQgdGhlIHdyaXRhYmxlIHNpZGVzIG9mIHRoZSBkdXBsZXggc3RyZWFtLlxuICAvLyBUaGVzZSBvcHRpb25zIGNhbiBiZSBwcm92aWRlZCBzZXBhcmF0ZWx5IGFzIHJlYWRhYmxlWFhYIGFuZCB3cml0YWJsZVhYWC5cbiAgdmFyIGlzRHVwbGV4ID0gc3RyZWFtIGluc3RhbmNlb2YgRHVwbGV4O1xuXG4gIC8vIG9iamVjdCBzdHJlYW0gZmxhZy4gVXNlZCB0byBtYWtlIHJlYWQobikgaWdub3JlIG4gYW5kIHRvXG4gIC8vIG1ha2UgYWxsIHRoZSBidWZmZXIgbWVyZ2luZyBhbmQgbGVuZ3RoIGNoZWNrcyBnbyBhd2F5XG4gIHRoaXMub2JqZWN0TW9kZSA9ICEhb3B0aW9ucy5vYmplY3RNb2RlO1xuXG4gIGlmIChpc0R1cGxleCkgdGhpcy5vYmplY3RNb2RlID0gdGhpcy5vYmplY3RNb2RlIHx8ICEhb3B0aW9ucy5yZWFkYWJsZU9iamVjdE1vZGU7XG5cbiAgLy8gdGhlIHBvaW50IGF0IHdoaWNoIGl0IHN0b3BzIGNhbGxpbmcgX3JlYWQoKSB0byBmaWxsIHRoZSBidWZmZXJcbiAgLy8gTm90ZTogMCBpcyBhIHZhbGlkIHZhbHVlLCBtZWFucyBcImRvbid0IGNhbGwgX3JlYWQgcHJlZW1wdGl2ZWx5IGV2ZXJcIlxuICB2YXIgaHdtID0gb3B0aW9ucy5oaWdoV2F0ZXJNYXJrO1xuICB2YXIgcmVhZGFibGVId20gPSBvcHRpb25zLnJlYWRhYmxlSGlnaFdhdGVyTWFyaztcbiAgdmFyIGRlZmF1bHRId20gPSB0aGlzLm9iamVjdE1vZGUgPyAxNiA6IDE2ICogMTAyNDtcblxuICBpZiAoaHdtIHx8IGh3bSA9PT0gMCkgdGhpcy5oaWdoV2F0ZXJNYXJrID0gaHdtO2Vsc2UgaWYgKGlzRHVwbGV4ICYmIChyZWFkYWJsZUh3bSB8fCByZWFkYWJsZUh3bSA9PT0gMCkpIHRoaXMuaGlnaFdhdGVyTWFyayA9IHJlYWRhYmxlSHdtO2Vsc2UgdGhpcy5oaWdoV2F0ZXJNYXJrID0gZGVmYXVsdEh3bTtcblxuICAvLyBjYXN0IHRvIGludHMuXG4gIHRoaXMuaGlnaFdhdGVyTWFyayA9IE1hdGguZmxvb3IodGhpcy5oaWdoV2F0ZXJNYXJrKTtcblxuICAvLyBBIGxpbmtlZCBsaXN0IGlzIHVzZWQgdG8gc3RvcmUgZGF0YSBjaHVua3MgaW5zdGVhZCBvZiBhbiBhcnJheSBiZWNhdXNlIHRoZVxuICAvLyBsaW5rZWQgbGlzdCBjYW4gcmVtb3ZlIGVsZW1lbnRzIGZyb20gdGhlIGJlZ2lubmluZyBmYXN0ZXIgdGhhblxuICAvLyBhcnJheS5zaGlmdCgpXG4gIHRoaXMuYnVmZmVyID0gbmV3IEJ1ZmZlckxpc3QoKTtcbiAgdGhpcy5sZW5ndGggPSAwO1xuICB0aGlzLnBpcGVzID0gbnVsbDtcbiAgdGhpcy5waXBlc0NvdW50ID0gMDtcbiAgdGhpcy5mbG93aW5nID0gbnVsbDtcbiAgdGhpcy5lbmRlZCA9IGZhbHNlO1xuICB0aGlzLmVuZEVtaXR0ZWQgPSBmYWxzZTtcbiAgdGhpcy5yZWFkaW5nID0gZmFsc2U7XG5cbiAgLy8gYSBmbGFnIHRvIGJlIGFibGUgdG8gdGVsbCBpZiB0aGUgZXZlbnQgJ3JlYWRhYmxlJy8nZGF0YScgaXMgZW1pdHRlZFxuICAvLyBpbW1lZGlhdGVseSwgb3Igb24gYSBsYXRlciB0aWNrLiAgV2Ugc2V0IHRoaXMgdG8gdHJ1ZSBhdCBmaXJzdCwgYmVjYXVzZVxuICAvLyBhbnkgYWN0aW9ucyB0aGF0IHNob3VsZG4ndCBoYXBwZW4gdW50aWwgXCJsYXRlclwiIHNob3VsZCBnZW5lcmFsbHkgYWxzb1xuICAvLyBub3QgaGFwcGVuIGJlZm9yZSB0aGUgZmlyc3QgcmVhZCBjYWxsLlxuICB0aGlzLnN5bmMgPSB0cnVlO1xuXG4gIC8vIHdoZW5ldmVyIHdlIHJldHVybiBudWxsLCB0aGVuIHdlIHNldCBhIGZsYWcgdG8gc2F5XG4gIC8vIHRoYXQgd2UncmUgYXdhaXRpbmcgYSAncmVhZGFibGUnIGV2ZW50IGVtaXNzaW9uLlxuICB0aGlzLm5lZWRSZWFkYWJsZSA9IGZhbHNlO1xuICB0aGlzLmVtaXR0ZWRSZWFkYWJsZSA9IGZhbHNlO1xuICB0aGlzLnJlYWRhYmxlTGlzdGVuaW5nID0gZmFsc2U7XG4gIHRoaXMucmVzdW1lU2NoZWR1bGVkID0gZmFsc2U7XG5cbiAgLy8gaGFzIGl0IGJlZW4gZGVzdHJveWVkXG4gIHRoaXMuZGVzdHJveWVkID0gZmFsc2U7XG5cbiAgLy8gQ3J5cHRvIGlzIGtpbmQgb2Ygb2xkIGFuZCBjcnVzdHkuICBIaXN0b3JpY2FsbHksIGl0cyBkZWZhdWx0IHN0cmluZ1xuICAvLyBlbmNvZGluZyBpcyAnYmluYXJ5JyBzbyB3ZSBoYXZlIHRvIG1ha2UgdGhpcyBjb25maWd1cmFibGUuXG4gIC8vIEV2ZXJ5dGhpbmcgZWxzZSBpbiB0aGUgdW5pdmVyc2UgdXNlcyAndXRmOCcsIHRob3VnaC5cbiAgdGhpcy5kZWZhdWx0RW5jb2RpbmcgPSBvcHRpb25zLmRlZmF1bHRFbmNvZGluZyB8fCAndXRmOCc7XG5cbiAgLy8gdGhlIG51bWJlciBvZiB3cml0ZXJzIHRoYXQgYXJlIGF3YWl0aW5nIGEgZHJhaW4gZXZlbnQgaW4gLnBpcGUoKXNcbiAgdGhpcy5hd2FpdERyYWluID0gMDtcblxuICAvLyBpZiB0cnVlLCBhIG1heWJlUmVhZE1vcmUgaGFzIGJlZW4gc2NoZWR1bGVkXG4gIHRoaXMucmVhZGluZ01vcmUgPSBmYWxzZTtcblxuICB0aGlzLmRlY29kZXIgPSBudWxsO1xuICB0aGlzLmVuY29kaW5nID0gbnVsbDtcbiAgaWYgKG9wdGlvbnMuZW5jb2RpbmcpIHtcbiAgICBpZiAoIVN0cmluZ0RlY29kZXIpIFN0cmluZ0RlY29kZXIgPSByZXF1aXJlKCdzdHJpbmdfZGVjb2Rlci8nKS5TdHJpbmdEZWNvZGVyO1xuICAgIHRoaXMuZGVjb2RlciA9IG5ldyBTdHJpbmdEZWNvZGVyKG9wdGlvbnMuZW5jb2RpbmcpO1xuICAgIHRoaXMuZW5jb2RpbmcgPSBvcHRpb25zLmVuY29kaW5nO1xuICB9XG59XG5cbmZ1bmN0aW9uIFJlYWRhYmxlKG9wdGlvbnMpIHtcbiAgRHVwbGV4ID0gRHVwbGV4IHx8IHJlcXVpcmUoJy4vX3N0cmVhbV9kdXBsZXgnKTtcblxuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgUmVhZGFibGUpKSByZXR1cm4gbmV3IFJlYWRhYmxlKG9wdGlvbnMpO1xuXG4gIHRoaXMuX3JlYWRhYmxlU3RhdGUgPSBuZXcgUmVhZGFibGVTdGF0ZShvcHRpb25zLCB0aGlzKTtcblxuICAvLyBsZWdhY3lcbiAgdGhpcy5yZWFkYWJsZSA9IHRydWU7XG5cbiAgaWYgKG9wdGlvbnMpIHtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMucmVhZCA9PT0gJ2Z1bmN0aW9uJykgdGhpcy5fcmVhZCA9IG9wdGlvbnMucmVhZDtcblxuICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5kZXN0cm95ID09PSAnZnVuY3Rpb24nKSB0aGlzLl9kZXN0cm95ID0gb3B0aW9ucy5kZXN0cm95O1xuICB9XG5cbiAgU3RyZWFtLmNhbGwodGhpcyk7XG59XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShSZWFkYWJsZS5wcm90b3R5cGUsICdkZXN0cm95ZWQnLCB7XG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLl9yZWFkYWJsZVN0YXRlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX3JlYWRhYmxlU3RhdGUuZGVzdHJveWVkO1xuICB9LFxuICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIC8vIHdlIGlnbm9yZSB0aGUgdmFsdWUgaWYgdGhlIHN0cmVhbVxuICAgIC8vIGhhcyBub3QgYmVlbiBpbml0aWFsaXplZCB5ZXRcbiAgICBpZiAoIXRoaXMuX3JlYWRhYmxlU3RhdGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBiYWNrd2FyZCBjb21wYXRpYmlsaXR5LCB0aGUgdXNlciBpcyBleHBsaWNpdGx5XG4gICAgLy8gbWFuYWdpbmcgZGVzdHJveWVkXG4gICAgdGhpcy5fcmVhZGFibGVTdGF0ZS5kZXN0cm95ZWQgPSB2YWx1ZTtcbiAgfVxufSk7XG5cblJlYWRhYmxlLnByb3RvdHlwZS5kZXN0cm95ID0gZGVzdHJveUltcGwuZGVzdHJveTtcblJlYWRhYmxlLnByb3RvdHlwZS5fdW5kZXN0cm95ID0gZGVzdHJveUltcGwudW5kZXN0cm95O1xuUmVhZGFibGUucHJvdG90eXBlLl9kZXN0cm95ID0gZnVuY3Rpb24gKGVyciwgY2IpIHtcbiAgdGhpcy5wdXNoKG51bGwpO1xuICBjYihlcnIpO1xufTtcblxuLy8gTWFudWFsbHkgc2hvdmUgc29tZXRoaW5nIGludG8gdGhlIHJlYWQoKSBidWZmZXIuXG4vLyBUaGlzIHJldHVybnMgdHJ1ZSBpZiB0aGUgaGlnaFdhdGVyTWFyayBoYXMgbm90IGJlZW4gaGl0IHlldCxcbi8vIHNpbWlsYXIgdG8gaG93IFdyaXRhYmxlLndyaXRlKCkgcmV0dXJucyB0cnVlIGlmIHlvdSBzaG91bGRcbi8vIHdyaXRlKCkgc29tZSBtb3JlLlxuUmVhZGFibGUucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbiAoY2h1bmssIGVuY29kaW5nKSB7XG4gIHZhciBzdGF0ZSA9IHRoaXMuX3JlYWRhYmxlU3RhdGU7XG4gIHZhciBza2lwQ2h1bmtDaGVjaztcblxuICBpZiAoIXN0YXRlLm9iamVjdE1vZGUpIHtcbiAgICBpZiAodHlwZW9mIGNodW5rID09PSAnc3RyaW5nJykge1xuICAgICAgZW5jb2RpbmcgPSBlbmNvZGluZyB8fCBzdGF0ZS5kZWZhdWx0RW5jb2Rpbmc7XG4gICAgICBpZiAoZW5jb2RpbmcgIT09IHN0YXRlLmVuY29kaW5nKSB7XG4gICAgICAgIGNodW5rID0gQnVmZmVyLmZyb20oY2h1bmssIGVuY29kaW5nKTtcbiAgICAgICAgZW5jb2RpbmcgPSAnJztcbiAgICAgIH1cbiAgICAgIHNraXBDaHVua0NoZWNrID0gdHJ1ZTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgc2tpcENodW5rQ2hlY2sgPSB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIHJlYWRhYmxlQWRkQ2h1bmsodGhpcywgY2h1bmssIGVuY29kaW5nLCBmYWxzZSwgc2tpcENodW5rQ2hlY2spO1xufTtcblxuLy8gVW5zaGlmdCBzaG91bGQgKmFsd2F5cyogYmUgc29tZXRoaW5nIGRpcmVjdGx5IG91dCBvZiByZWFkKClcblJlYWRhYmxlLnByb3RvdHlwZS51bnNoaWZ0ID0gZnVuY3Rpb24gKGNodW5rKSB7XG4gIHJldHVybiByZWFkYWJsZUFkZENodW5rKHRoaXMsIGNodW5rLCBudWxsLCB0cnVlLCBmYWxzZSk7XG59O1xuXG5mdW5jdGlvbiByZWFkYWJsZUFkZENodW5rKHN0cmVhbSwgY2h1bmssIGVuY29kaW5nLCBhZGRUb0Zyb250LCBza2lwQ2h1bmtDaGVjaykge1xuICB2YXIgc3RhdGUgPSBzdHJlYW0uX3JlYWRhYmxlU3RhdGU7XG4gIGlmIChjaHVuayA9PT0gbnVsbCkge1xuICAgIHN0YXRlLnJlYWRpbmcgPSBmYWxzZTtcbiAgICBvbkVvZkNodW5rKHN0cmVhbSwgc3RhdGUpO1xuICB9IGVsc2Uge1xuICAgIHZhciBlcjtcbiAgICBpZiAoIXNraXBDaHVua0NoZWNrKSBlciA9IGNodW5rSW52YWxpZChzdGF0ZSwgY2h1bmspO1xuICAgIGlmIChlcikge1xuICAgICAgc3RyZWFtLmVtaXQoJ2Vycm9yJywgZXIpO1xuICAgIH0gZWxzZSBpZiAoc3RhdGUub2JqZWN0TW9kZSB8fCBjaHVuayAmJiBjaHVuay5sZW5ndGggPiAwKSB7XG4gICAgICBpZiAodHlwZW9mIGNodW5rICE9PSAnc3RyaW5nJyAmJiAhc3RhdGUub2JqZWN0TW9kZSAmJiBPYmplY3QuZ2V0UHJvdG90eXBlT2YoY2h1bmspICE9PSBCdWZmZXIucHJvdG90eXBlKSB7XG4gICAgICAgIGNodW5rID0gX3VpbnQ4QXJyYXlUb0J1ZmZlcihjaHVuayk7XG4gICAgICB9XG5cbiAgICAgIGlmIChhZGRUb0Zyb250KSB7XG4gICAgICAgIGlmIChzdGF0ZS5lbmRFbWl0dGVkKSBzdHJlYW0uZW1pdCgnZXJyb3InLCBuZXcgRXJyb3IoJ3N0cmVhbS51bnNoaWZ0KCkgYWZ0ZXIgZW5kIGV2ZW50JykpO2Vsc2UgYWRkQ2h1bmsoc3RyZWFtLCBzdGF0ZSwgY2h1bmssIHRydWUpO1xuICAgICAgfSBlbHNlIGlmIChzdGF0ZS5lbmRlZCkge1xuICAgICAgICBzdHJlYW0uZW1pdCgnZXJyb3InLCBuZXcgRXJyb3IoJ3N0cmVhbS5wdXNoKCkgYWZ0ZXIgRU9GJykpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RhdGUucmVhZGluZyA9IGZhbHNlO1xuICAgICAgICBpZiAoc3RhdGUuZGVjb2RlciAmJiAhZW5jb2RpbmcpIHtcbiAgICAgICAgICBjaHVuayA9IHN0YXRlLmRlY29kZXIud3JpdGUoY2h1bmspO1xuICAgICAgICAgIGlmIChzdGF0ZS5vYmplY3RNb2RlIHx8IGNodW5rLmxlbmd0aCAhPT0gMCkgYWRkQ2h1bmsoc3RyZWFtLCBzdGF0ZSwgY2h1bmssIGZhbHNlKTtlbHNlIG1heWJlUmVhZE1vcmUoc3RyZWFtLCBzdGF0ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYWRkQ2h1bmsoc3RyZWFtLCBzdGF0ZSwgY2h1bmssIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoIWFkZFRvRnJvbnQpIHtcbiAgICAgIHN0YXRlLnJlYWRpbmcgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmVlZE1vcmVEYXRhKHN0YXRlKTtcbn1cblxuZnVuY3Rpb24gYWRkQ2h1bmsoc3RyZWFtLCBzdGF0ZSwgY2h1bmssIGFkZFRvRnJvbnQpIHtcbiAgaWYgKHN0YXRlLmZsb3dpbmcgJiYgc3RhdGUubGVuZ3RoID09PSAwICYmICFzdGF0ZS5zeW5jKSB7XG4gICAgc3RyZWFtLmVtaXQoJ2RhdGEnLCBjaHVuayk7XG4gICAgc3RyZWFtLnJlYWQoMCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gdXBkYXRlIHRoZSBidWZmZXIgaW5mby5cbiAgICBzdGF0ZS5sZW5ndGggKz0gc3RhdGUub2JqZWN0TW9kZSA/IDEgOiBjaHVuay5sZW5ndGg7XG4gICAgaWYgKGFkZFRvRnJvbnQpIHN0YXRlLmJ1ZmZlci51bnNoaWZ0KGNodW5rKTtlbHNlIHN0YXRlLmJ1ZmZlci5wdXNoKGNodW5rKTtcblxuICAgIGlmIChzdGF0ZS5uZWVkUmVhZGFibGUpIGVtaXRSZWFkYWJsZShzdHJlYW0pO1xuICB9XG4gIG1heWJlUmVhZE1vcmUoc3RyZWFtLCBzdGF0ZSk7XG59XG5cbmZ1bmN0aW9uIGNodW5rSW52YWxpZChzdGF0ZSwgY2h1bmspIHtcbiAgdmFyIGVyO1xuICBpZiAoIV9pc1VpbnQ4QXJyYXkoY2h1bmspICYmIHR5cGVvZiBjaHVuayAhPT0gJ3N0cmluZycgJiYgY2h1bmsgIT09IHVuZGVmaW5lZCAmJiAhc3RhdGUub2JqZWN0TW9kZSkge1xuICAgIGVyID0gbmV3IFR5cGVFcnJvcignSW52YWxpZCBub24tc3RyaW5nL2J1ZmZlciBjaHVuaycpO1xuICB9XG4gIHJldHVybiBlcjtcbn1cblxuLy8gaWYgaXQncyBwYXN0IHRoZSBoaWdoIHdhdGVyIG1hcmssIHdlIGNhbiBwdXNoIGluIHNvbWUgbW9yZS5cbi8vIEFsc28sIGlmIHdlIGhhdmUgbm8gZGF0YSB5ZXQsIHdlIGNhbiBzdGFuZCBzb21lXG4vLyBtb3JlIGJ5dGVzLiAgVGhpcyBpcyB0byB3b3JrIGFyb3VuZCBjYXNlcyB3aGVyZSBod209MCxcbi8vIHN1Y2ggYXMgdGhlIHJlcGwuICBBbHNvLCBpZiB0aGUgcHVzaCgpIHRyaWdnZXJlZCBhXG4vLyByZWFkYWJsZSBldmVudCwgYW5kIHRoZSB1c2VyIGNhbGxlZCByZWFkKGxhcmdlTnVtYmVyKSBzdWNoIHRoYXRcbi8vIG5lZWRSZWFkYWJsZSB3YXMgc2V0LCB0aGVuIHdlIG91Z2h0IHRvIHB1c2ggbW9yZSwgc28gdGhhdCBhbm90aGVyXG4vLyAncmVhZGFibGUnIGV2ZW50IHdpbGwgYmUgdHJpZ2dlcmVkLlxuZnVuY3Rpb24gbmVlZE1vcmVEYXRhKHN0YXRlKSB7XG4gIHJldHVybiAhc3RhdGUuZW5kZWQgJiYgKHN0YXRlLm5lZWRSZWFkYWJsZSB8fCBzdGF0ZS5sZW5ndGggPCBzdGF0ZS5oaWdoV2F0ZXJNYXJrIHx8IHN0YXRlLmxlbmd0aCA9PT0gMCk7XG59XG5cblJlYWRhYmxlLnByb3RvdHlwZS5pc1BhdXNlZCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuX3JlYWRhYmxlU3RhdGUuZmxvd2luZyA9PT0gZmFsc2U7XG59O1xuXG4vLyBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eS5cblJlYWRhYmxlLnByb3RvdHlwZS5zZXRFbmNvZGluZyA9IGZ1bmN0aW9uIChlbmMpIHtcbiAgaWYgKCFTdHJpbmdEZWNvZGVyKSBTdHJpbmdEZWNvZGVyID0gcmVxdWlyZSgnc3RyaW5nX2RlY29kZXIvJykuU3RyaW5nRGVjb2RlcjtcbiAgdGhpcy5fcmVhZGFibGVTdGF0ZS5kZWNvZGVyID0gbmV3IFN0cmluZ0RlY29kZXIoZW5jKTtcbiAgdGhpcy5fcmVhZGFibGVTdGF0ZS5lbmNvZGluZyA9IGVuYztcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBEb24ndCByYWlzZSB0aGUgaHdtID4gOE1CXG52YXIgTUFYX0hXTSA9IDB4ODAwMDAwO1xuZnVuY3Rpb24gY29tcHV0ZU5ld0hpZ2hXYXRlck1hcmsobikge1xuICBpZiAobiA+PSBNQVhfSFdNKSB7XG4gICAgbiA9IE1BWF9IV007XG4gIH0gZWxzZSB7XG4gICAgLy8gR2V0IHRoZSBuZXh0IGhpZ2hlc3QgcG93ZXIgb2YgMiB0byBwcmV2ZW50IGluY3JlYXNpbmcgaHdtIGV4Y2Vzc2l2ZWx5IGluXG4gICAgLy8gdGlueSBhbW91bnRzXG4gICAgbi0tO1xuICAgIG4gfD0gbiA+Pj4gMTtcbiAgICBuIHw9IG4gPj4+IDI7XG4gICAgbiB8PSBuID4+PiA0O1xuICAgIG4gfD0gbiA+Pj4gODtcbiAgICBuIHw9IG4gPj4+IDE2O1xuICAgIG4rKztcbiAgfVxuICByZXR1cm4gbjtcbn1cblxuLy8gVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBiZSBpbmxpbmFibGUsIHNvIHBsZWFzZSB0YWtlIGNhcmUgd2hlbiBtYWtpbmdcbi8vIGNoYW5nZXMgdG8gdGhlIGZ1bmN0aW9uIGJvZHkuXG5mdW5jdGlvbiBob3dNdWNoVG9SZWFkKG4sIHN0YXRlKSB7XG4gIGlmIChuIDw9IDAgfHwgc3RhdGUubGVuZ3RoID09PSAwICYmIHN0YXRlLmVuZGVkKSByZXR1cm4gMDtcbiAgaWYgKHN0YXRlLm9iamVjdE1vZGUpIHJldHVybiAxO1xuICBpZiAobiAhPT0gbikge1xuICAgIC8vIE9ubHkgZmxvdyBvbmUgYnVmZmVyIGF0IGEgdGltZVxuICAgIGlmIChzdGF0ZS5mbG93aW5nICYmIHN0YXRlLmxlbmd0aCkgcmV0dXJuIHN0YXRlLmJ1ZmZlci5oZWFkLmRhdGEubGVuZ3RoO2Vsc2UgcmV0dXJuIHN0YXRlLmxlbmd0aDtcbiAgfVxuICAvLyBJZiB3ZSdyZSBhc2tpbmcgZm9yIG1vcmUgdGhhbiB0aGUgY3VycmVudCBod20sIHRoZW4gcmFpc2UgdGhlIGh3bS5cbiAgaWYgKG4gPiBzdGF0ZS5oaWdoV2F0ZXJNYXJrKSBzdGF0ZS5oaWdoV2F0ZXJNYXJrID0gY29tcHV0ZU5ld0hpZ2hXYXRlck1hcmsobik7XG4gIGlmIChuIDw9IHN0YXRlLmxlbmd0aCkgcmV0dXJuIG47XG4gIC8vIERvbid0IGhhdmUgZW5vdWdoXG4gIGlmICghc3RhdGUuZW5kZWQpIHtcbiAgICBzdGF0ZS5uZWVkUmVhZGFibGUgPSB0cnVlO1xuICAgIHJldHVybiAwO1xuICB9XG4gIHJldHVybiBzdGF0ZS5sZW5ndGg7XG59XG5cbi8vIHlvdSBjYW4gb3ZlcnJpZGUgZWl0aGVyIHRoaXMgbWV0aG9kLCBvciB0aGUgYXN5bmMgX3JlYWQobikgYmVsb3cuXG5SZWFkYWJsZS5wcm90b3R5cGUucmVhZCA9IGZ1bmN0aW9uIChuKSB7XG4gIGRlYnVnKCdyZWFkJywgbik7XG4gIG4gPSBwYXJzZUludChuLCAxMCk7XG4gIHZhciBzdGF0ZSA9IHRoaXMuX3JlYWRhYmxlU3RhdGU7XG4gIHZhciBuT3JpZyA9IG47XG5cbiAgaWYgKG4gIT09IDApIHN0YXRlLmVtaXR0ZWRSZWFkYWJsZSA9IGZhbHNlO1xuXG4gIC8vIGlmIHdlJ3JlIGRvaW5nIHJlYWQoMCkgdG8gdHJpZ2dlciBhIHJlYWRhYmxlIGV2ZW50LCBidXQgd2VcbiAgLy8gYWxyZWFkeSBoYXZlIGEgYnVuY2ggb2YgZGF0YSBpbiB0aGUgYnVmZmVyLCB0aGVuIGp1c3QgdHJpZ2dlclxuICAvLyB0aGUgJ3JlYWRhYmxlJyBldmVudCBhbmQgbW92ZSBvbi5cbiAgaWYgKG4gPT09IDAgJiYgc3RhdGUubmVlZFJlYWRhYmxlICYmIChzdGF0ZS5sZW5ndGggPj0gc3RhdGUuaGlnaFdhdGVyTWFyayB8fCBzdGF0ZS5lbmRlZCkpIHtcbiAgICBkZWJ1ZygncmVhZDogZW1pdFJlYWRhYmxlJywgc3RhdGUubGVuZ3RoLCBzdGF0ZS5lbmRlZCk7XG4gICAgaWYgKHN0YXRlLmxlbmd0aCA9PT0gMCAmJiBzdGF0ZS5lbmRlZCkgZW5kUmVhZGFibGUodGhpcyk7ZWxzZSBlbWl0UmVhZGFibGUodGhpcyk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBuID0gaG93TXVjaFRvUmVhZChuLCBzdGF0ZSk7XG5cbiAgLy8gaWYgd2UndmUgZW5kZWQsIGFuZCB3ZSdyZSBub3cgY2xlYXIsIHRoZW4gZmluaXNoIGl0IHVwLlxuICBpZiAobiA9PT0gMCAmJiBzdGF0ZS5lbmRlZCkge1xuICAgIGlmIChzdGF0ZS5sZW5ndGggPT09IDApIGVuZFJlYWRhYmxlKHRoaXMpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLy8gQWxsIHRoZSBhY3R1YWwgY2h1bmsgZ2VuZXJhdGlvbiBsb2dpYyBuZWVkcyB0byBiZVxuICAvLyAqYmVsb3cqIHRoZSBjYWxsIHRvIF9yZWFkLiAgVGhlIHJlYXNvbiBpcyB0aGF0IGluIGNlcnRhaW5cbiAgLy8gc3ludGhldGljIHN0cmVhbSBjYXNlcywgc3VjaCBhcyBwYXNzdGhyb3VnaCBzdHJlYW1zLCBfcmVhZFxuICAvLyBtYXkgYmUgYSBjb21wbGV0ZWx5IHN5bmNocm9ub3VzIG9wZXJhdGlvbiB3aGljaCBtYXkgY2hhbmdlXG4gIC8vIHRoZSBzdGF0ZSBvZiB0aGUgcmVhZCBidWZmZXIsIHByb3ZpZGluZyBlbm91Z2ggZGF0YSB3aGVuXG4gIC8vIGJlZm9yZSB0aGVyZSB3YXMgKm5vdCogZW5vdWdoLlxuICAvL1xuICAvLyBTbywgdGhlIHN0ZXBzIGFyZTpcbiAgLy8gMS4gRmlndXJlIG91dCB3aGF0IHRoZSBzdGF0ZSBvZiB0aGluZ3Mgd2lsbCBiZSBhZnRlciB3ZSBkb1xuICAvLyBhIHJlYWQgZnJvbSB0aGUgYnVmZmVyLlxuICAvL1xuICAvLyAyLiBJZiB0aGF0IHJlc3VsdGluZyBzdGF0ZSB3aWxsIHRyaWdnZXIgYSBfcmVhZCwgdGhlbiBjYWxsIF9yZWFkLlxuICAvLyBOb3RlIHRoYXQgdGhpcyBtYXkgYmUgYXN5bmNocm9ub3VzLCBvciBzeW5jaHJvbm91cy4gIFllcywgaXQgaXNcbiAgLy8gZGVlcGx5IHVnbHkgdG8gd3JpdGUgQVBJcyB0aGlzIHdheSwgYnV0IHRoYXQgc3RpbGwgZG9lc24ndCBtZWFuXG4gIC8vIHRoYXQgdGhlIFJlYWRhYmxlIGNsYXNzIHNob3VsZCBiZWhhdmUgaW1wcm9wZXJseSwgYXMgc3RyZWFtcyBhcmVcbiAgLy8gZGVzaWduZWQgdG8gYmUgc3luYy9hc3luYyBhZ25vc3RpYy5cbiAgLy8gVGFrZSBub3RlIGlmIHRoZSBfcmVhZCBjYWxsIGlzIHN5bmMgb3IgYXN5bmMgKGllLCBpZiB0aGUgcmVhZCBjYWxsXG4gIC8vIGhhcyByZXR1cm5lZCB5ZXQpLCBzbyB0aGF0IHdlIGtub3cgd2hldGhlciBvciBub3QgaXQncyBzYWZlIHRvIGVtaXRcbiAgLy8gJ3JlYWRhYmxlJyBldGMuXG4gIC8vXG4gIC8vIDMuIEFjdHVhbGx5IHB1bGwgdGhlIHJlcXVlc3RlZCBjaHVua3Mgb3V0IG9mIHRoZSBidWZmZXIgYW5kIHJldHVybi5cblxuICAvLyBpZiB3ZSBuZWVkIGEgcmVhZGFibGUgZXZlbnQsIHRoZW4gd2UgbmVlZCB0byBkbyBzb21lIHJlYWRpbmcuXG4gIHZhciBkb1JlYWQgPSBzdGF0ZS5uZWVkUmVhZGFibGU7XG4gIGRlYnVnKCduZWVkIHJlYWRhYmxlJywgZG9SZWFkKTtcblxuICAvLyBpZiB3ZSBjdXJyZW50bHkgaGF2ZSBsZXNzIHRoYW4gdGhlIGhpZ2hXYXRlck1hcmssIHRoZW4gYWxzbyByZWFkIHNvbWVcbiAgaWYgKHN0YXRlLmxlbmd0aCA9PT0gMCB8fCBzdGF0ZS5sZW5ndGggLSBuIDwgc3RhdGUuaGlnaFdhdGVyTWFyaykge1xuICAgIGRvUmVhZCA9IHRydWU7XG4gICAgZGVidWcoJ2xlbmd0aCBsZXNzIHRoYW4gd2F0ZXJtYXJrJywgZG9SZWFkKTtcbiAgfVxuXG4gIC8vIGhvd2V2ZXIsIGlmIHdlJ3ZlIGVuZGVkLCB0aGVuIHRoZXJlJ3Mgbm8gcG9pbnQsIGFuZCBpZiB3ZSdyZSBhbHJlYWR5XG4gIC8vIHJlYWRpbmcsIHRoZW4gaXQncyB1bm5lY2Vzc2FyeS5cbiAgaWYgKHN0YXRlLmVuZGVkIHx8IHN0YXRlLnJlYWRpbmcpIHtcbiAgICBkb1JlYWQgPSBmYWxzZTtcbiAgICBkZWJ1ZygncmVhZGluZyBvciBlbmRlZCcsIGRvUmVhZCk7XG4gIH0gZWxzZSBpZiAoZG9SZWFkKSB7XG4gICAgZGVidWcoJ2RvIHJlYWQnKTtcbiAgICBzdGF0ZS5yZWFkaW5nID0gdHJ1ZTtcbiAgICBzdGF0ZS5zeW5jID0gdHJ1ZTtcbiAgICAvLyBpZiB0aGUgbGVuZ3RoIGlzIGN1cnJlbnRseSB6ZXJvLCB0aGVuIHdlICpuZWVkKiBhIHJlYWRhYmxlIGV2ZW50LlxuICAgIGlmIChzdGF0ZS5sZW5ndGggPT09IDApIHN0YXRlLm5lZWRSZWFkYWJsZSA9IHRydWU7XG4gICAgLy8gY2FsbCBpbnRlcm5hbCByZWFkIG1ldGhvZFxuICAgIHRoaXMuX3JlYWQoc3RhdGUuaGlnaFdhdGVyTWFyayk7XG4gICAgc3RhdGUuc3luYyA9IGZhbHNlO1xuICAgIC8vIElmIF9yZWFkIHB1c2hlZCBkYXRhIHN5bmNocm9ub3VzbHksIHRoZW4gYHJlYWRpbmdgIHdpbGwgYmUgZmFsc2UsXG4gICAgLy8gYW5kIHdlIG5lZWQgdG8gcmUtZXZhbHVhdGUgaG93IG11Y2ggZGF0YSB3ZSBjYW4gcmV0dXJuIHRvIHRoZSB1c2VyLlxuICAgIGlmICghc3RhdGUucmVhZGluZykgbiA9IGhvd011Y2hUb1JlYWQobk9yaWcsIHN0YXRlKTtcbiAgfVxuXG4gIHZhciByZXQ7XG4gIGlmIChuID4gMCkgcmV0ID0gZnJvbUxpc3Qobiwgc3RhdGUpO2Vsc2UgcmV0ID0gbnVsbDtcblxuICBpZiAocmV0ID09PSBudWxsKSB7XG4gICAgc3RhdGUubmVlZFJlYWRhYmxlID0gdHJ1ZTtcbiAgICBuID0gMDtcbiAgfSBlbHNlIHtcbiAgICBzdGF0ZS5sZW5ndGggLT0gbjtcbiAgfVxuXG4gIGlmIChzdGF0ZS5sZW5ndGggPT09IDApIHtcbiAgICAvLyBJZiB3ZSBoYXZlIG5vdGhpbmcgaW4gdGhlIGJ1ZmZlciwgdGhlbiB3ZSB3YW50IHRvIGtub3dcbiAgICAvLyBhcyBzb29uIGFzIHdlICpkbyogZ2V0IHNvbWV0aGluZyBpbnRvIHRoZSBidWZmZXIuXG4gICAgaWYgKCFzdGF0ZS5lbmRlZCkgc3RhdGUubmVlZFJlYWRhYmxlID0gdHJ1ZTtcblxuICAgIC8vIElmIHdlIHRyaWVkIHRvIHJlYWQoKSBwYXN0IHRoZSBFT0YsIHRoZW4gZW1pdCBlbmQgb24gdGhlIG5leHQgdGljay5cbiAgICBpZiAobk9yaWcgIT09IG4gJiYgc3RhdGUuZW5kZWQpIGVuZFJlYWRhYmxlKHRoaXMpO1xuICB9XG5cbiAgaWYgKHJldCAhPT0gbnVsbCkgdGhpcy5lbWl0KCdkYXRhJywgcmV0KTtcblxuICByZXR1cm4gcmV0O1xufTtcblxuZnVuY3Rpb24gb25Fb2ZDaHVuayhzdHJlYW0sIHN0YXRlKSB7XG4gIGlmIChzdGF0ZS5lbmRlZCkgcmV0dXJuO1xuICBpZiAoc3RhdGUuZGVjb2Rlcikge1xuICAgIHZhciBjaHVuayA9IHN0YXRlLmRlY29kZXIuZW5kKCk7XG4gICAgaWYgKGNodW5rICYmIGNodW5rLmxlbmd0aCkge1xuICAgICAgc3RhdGUuYnVmZmVyLnB1c2goY2h1bmspO1xuICAgICAgc3RhdGUubGVuZ3RoICs9IHN0YXRlLm9iamVjdE1vZGUgPyAxIDogY2h1bmsubGVuZ3RoO1xuICAgIH1cbiAgfVxuICBzdGF0ZS5lbmRlZCA9IHRydWU7XG5cbiAgLy8gZW1pdCAncmVhZGFibGUnIG5vdyB0byBtYWtlIHN1cmUgaXQgZ2V0cyBwaWNrZWQgdXAuXG4gIGVtaXRSZWFkYWJsZShzdHJlYW0pO1xufVxuXG4vLyBEb24ndCBlbWl0IHJlYWRhYmxlIHJpZ2h0IGF3YXkgaW4gc3luYyBtb2RlLCBiZWNhdXNlIHRoaXMgY2FuIHRyaWdnZXJcbi8vIGFub3RoZXIgcmVhZCgpIGNhbGwgPT4gc3RhY2sgb3ZlcmZsb3cuICBUaGlzIHdheSwgaXQgbWlnaHQgdHJpZ2dlclxuLy8gYSBuZXh0VGljayByZWN1cnNpb24gd2FybmluZywgYnV0IHRoYXQncyBub3Qgc28gYmFkLlxuZnVuY3Rpb24gZW1pdFJlYWRhYmxlKHN0cmVhbSkge1xuICB2YXIgc3RhdGUgPSBzdHJlYW0uX3JlYWRhYmxlU3RhdGU7XG4gIHN0YXRlLm5lZWRSZWFkYWJsZSA9IGZhbHNlO1xuICBpZiAoIXN0YXRlLmVtaXR0ZWRSZWFkYWJsZSkge1xuICAgIGRlYnVnKCdlbWl0UmVhZGFibGUnLCBzdGF0ZS5mbG93aW5nKTtcbiAgICBzdGF0ZS5lbWl0dGVkUmVhZGFibGUgPSB0cnVlO1xuICAgIGlmIChzdGF0ZS5zeW5jKSBwbmEubmV4dFRpY2soZW1pdFJlYWRhYmxlXywgc3RyZWFtKTtlbHNlIGVtaXRSZWFkYWJsZV8oc3RyZWFtKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBlbWl0UmVhZGFibGVfKHN0cmVhbSkge1xuICBkZWJ1ZygnZW1pdCByZWFkYWJsZScpO1xuICBzdHJlYW0uZW1pdCgncmVhZGFibGUnKTtcbiAgZmxvdyhzdHJlYW0pO1xufVxuXG4vLyBhdCB0aGlzIHBvaW50LCB0aGUgdXNlciBoYXMgcHJlc3VtYWJseSBzZWVuIHRoZSAncmVhZGFibGUnIGV2ZW50LFxuLy8gYW5kIGNhbGxlZCByZWFkKCkgdG8gY29uc3VtZSBzb21lIGRhdGEuICB0aGF0IG1heSBoYXZlIHRyaWdnZXJlZFxuLy8gaW4gdHVybiBhbm90aGVyIF9yZWFkKG4pIGNhbGwsIGluIHdoaWNoIGNhc2UgcmVhZGluZyA9IHRydWUgaWZcbi8vIGl0J3MgaW4gcHJvZ3Jlc3MuXG4vLyBIb3dldmVyLCBpZiB3ZSdyZSBub3QgZW5kZWQsIG9yIHJlYWRpbmcsIGFuZCB0aGUgbGVuZ3RoIDwgaHdtLFxuLy8gdGhlbiBnbyBhaGVhZCBhbmQgdHJ5IHRvIHJlYWQgc29tZSBtb3JlIHByZWVtcHRpdmVseS5cbmZ1bmN0aW9uIG1heWJlUmVhZE1vcmUoc3RyZWFtLCBzdGF0ZSkge1xuICBpZiAoIXN0YXRlLnJlYWRpbmdNb3JlKSB7XG4gICAgc3RhdGUucmVhZGluZ01vcmUgPSB0cnVlO1xuICAgIHBuYS5uZXh0VGljayhtYXliZVJlYWRNb3JlXywgc3RyZWFtLCBzdGF0ZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbWF5YmVSZWFkTW9yZV8oc3RyZWFtLCBzdGF0ZSkge1xuICB2YXIgbGVuID0gc3RhdGUubGVuZ3RoO1xuICB3aGlsZSAoIXN0YXRlLnJlYWRpbmcgJiYgIXN0YXRlLmZsb3dpbmcgJiYgIXN0YXRlLmVuZGVkICYmIHN0YXRlLmxlbmd0aCA8IHN0YXRlLmhpZ2hXYXRlck1hcmspIHtcbiAgICBkZWJ1ZygnbWF5YmVSZWFkTW9yZSByZWFkIDAnKTtcbiAgICBzdHJlYW0ucmVhZCgwKTtcbiAgICBpZiAobGVuID09PSBzdGF0ZS5sZW5ndGgpXG4gICAgICAvLyBkaWRuJ3QgZ2V0IGFueSBkYXRhLCBzdG9wIHNwaW5uaW5nLlxuICAgICAgYnJlYWs7ZWxzZSBsZW4gPSBzdGF0ZS5sZW5ndGg7XG4gIH1cbiAgc3RhdGUucmVhZGluZ01vcmUgPSBmYWxzZTtcbn1cblxuLy8gYWJzdHJhY3QgbWV0aG9kLiAgdG8gYmUgb3ZlcnJpZGRlbiBpbiBzcGVjaWZpYyBpbXBsZW1lbnRhdGlvbiBjbGFzc2VzLlxuLy8gY2FsbCBjYihlciwgZGF0YSkgd2hlcmUgZGF0YSBpcyA8PSBuIGluIGxlbmd0aC5cbi8vIGZvciB2aXJ0dWFsIChub24tc3RyaW5nLCBub24tYnVmZmVyKSBzdHJlYW1zLCBcImxlbmd0aFwiIGlzIHNvbWV3aGF0XG4vLyBhcmJpdHJhcnksIGFuZCBwZXJoYXBzIG5vdCB2ZXJ5IG1lYW5pbmdmdWwuXG5SZWFkYWJsZS5wcm90b3R5cGUuX3JlYWQgPSBmdW5jdGlvbiAobikge1xuICB0aGlzLmVtaXQoJ2Vycm9yJywgbmV3IEVycm9yKCdfcmVhZCgpIGlzIG5vdCBpbXBsZW1lbnRlZCcpKTtcbn07XG5cblJlYWRhYmxlLnByb3RvdHlwZS5waXBlID0gZnVuY3Rpb24gKGRlc3QsIHBpcGVPcHRzKSB7XG4gIHZhciBzcmMgPSB0aGlzO1xuICB2YXIgc3RhdGUgPSB0aGlzLl9yZWFkYWJsZVN0YXRlO1xuXG4gIHN3aXRjaCAoc3RhdGUucGlwZXNDb3VudCkge1xuICAgIGNhc2UgMDpcbiAgICAgIHN0YXRlLnBpcGVzID0gZGVzdDtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgMTpcbiAgICAgIHN0YXRlLnBpcGVzID0gW3N0YXRlLnBpcGVzLCBkZXN0XTtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBzdGF0ZS5waXBlcy5wdXNoKGRlc3QpO1xuICAgICAgYnJlYWs7XG4gIH1cbiAgc3RhdGUucGlwZXNDb3VudCArPSAxO1xuICBkZWJ1ZygncGlwZSBjb3VudD0lZCBvcHRzPSVqJywgc3RhdGUucGlwZXNDb3VudCwgcGlwZU9wdHMpO1xuXG4gIHZhciBkb0VuZCA9ICghcGlwZU9wdHMgfHwgcGlwZU9wdHMuZW5kICE9PSBmYWxzZSkgJiYgZGVzdCAhPT0gcHJvY2Vzcy5zdGRvdXQgJiYgZGVzdCAhPT0gcHJvY2Vzcy5zdGRlcnI7XG5cbiAgdmFyIGVuZEZuID0gZG9FbmQgPyBvbmVuZCA6IHVucGlwZTtcbiAgaWYgKHN0YXRlLmVuZEVtaXR0ZWQpIHBuYS5uZXh0VGljayhlbmRGbik7ZWxzZSBzcmMub25jZSgnZW5kJywgZW5kRm4pO1xuXG4gIGRlc3Qub24oJ3VucGlwZScsIG9udW5waXBlKTtcbiAgZnVuY3Rpb24gb251bnBpcGUocmVhZGFibGUsIHVucGlwZUluZm8pIHtcbiAgICBkZWJ1Zygnb251bnBpcGUnKTtcbiAgICBpZiAocmVhZGFibGUgPT09IHNyYykge1xuICAgICAgaWYgKHVucGlwZUluZm8gJiYgdW5waXBlSW5mby5oYXNVbnBpcGVkID09PSBmYWxzZSkge1xuICAgICAgICB1bnBpcGVJbmZvLmhhc1VucGlwZWQgPSB0cnVlO1xuICAgICAgICBjbGVhbnVwKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gb25lbmQoKSB7XG4gICAgZGVidWcoJ29uZW5kJyk7XG4gICAgZGVzdC5lbmQoKTtcbiAgfVxuXG4gIC8vIHdoZW4gdGhlIGRlc3QgZHJhaW5zLCBpdCByZWR1Y2VzIHRoZSBhd2FpdERyYWluIGNvdW50ZXJcbiAgLy8gb24gdGhlIHNvdXJjZS4gIFRoaXMgd291bGQgYmUgbW9yZSBlbGVnYW50IHdpdGggYSAub25jZSgpXG4gIC8vIGhhbmRsZXIgaW4gZmxvdygpLCBidXQgYWRkaW5nIGFuZCByZW1vdmluZyByZXBlYXRlZGx5IGlzXG4gIC8vIHRvbyBzbG93LlxuICB2YXIgb25kcmFpbiA9IHBpcGVPbkRyYWluKHNyYyk7XG4gIGRlc3Qub24oJ2RyYWluJywgb25kcmFpbik7XG5cbiAgdmFyIGNsZWFuZWRVcCA9IGZhbHNlO1xuICBmdW5jdGlvbiBjbGVhbnVwKCkge1xuICAgIGRlYnVnKCdjbGVhbnVwJyk7XG4gICAgLy8gY2xlYW51cCBldmVudCBoYW5kbGVycyBvbmNlIHRoZSBwaXBlIGlzIGJyb2tlblxuICAgIGRlc3QucmVtb3ZlTGlzdGVuZXIoJ2Nsb3NlJywgb25jbG9zZSk7XG4gICAgZGVzdC5yZW1vdmVMaXN0ZW5lcignZmluaXNoJywgb25maW5pc2gpO1xuICAgIGRlc3QucmVtb3ZlTGlzdGVuZXIoJ2RyYWluJywgb25kcmFpbik7XG4gICAgZGVzdC5yZW1vdmVMaXN0ZW5lcignZXJyb3InLCBvbmVycm9yKTtcbiAgICBkZXN0LnJlbW92ZUxpc3RlbmVyKCd1bnBpcGUnLCBvbnVucGlwZSk7XG4gICAgc3JjLnJlbW92ZUxpc3RlbmVyKCdlbmQnLCBvbmVuZCk7XG4gICAgc3JjLnJlbW92ZUxpc3RlbmVyKCdlbmQnLCB1bnBpcGUpO1xuICAgIHNyYy5yZW1vdmVMaXN0ZW5lcignZGF0YScsIG9uZGF0YSk7XG5cbiAgICBjbGVhbmVkVXAgPSB0cnVlO1xuXG4gICAgLy8gaWYgdGhlIHJlYWRlciBpcyB3YWl0aW5nIGZvciBhIGRyYWluIGV2ZW50IGZyb20gdGhpc1xuICAgIC8vIHNwZWNpZmljIHdyaXRlciwgdGhlbiBpdCB3b3VsZCBjYXVzZSBpdCB0byBuZXZlciBzdGFydFxuICAgIC8vIGZsb3dpbmcgYWdhaW4uXG4gICAgLy8gU28sIGlmIHRoaXMgaXMgYXdhaXRpbmcgYSBkcmFpbiwgdGhlbiB3ZSBqdXN0IGNhbGwgaXQgbm93LlxuICAgIC8vIElmIHdlIGRvbid0IGtub3csIHRoZW4gYXNzdW1lIHRoYXQgd2UgYXJlIHdhaXRpbmcgZm9yIG9uZS5cbiAgICBpZiAoc3RhdGUuYXdhaXREcmFpbiAmJiAoIWRlc3QuX3dyaXRhYmxlU3RhdGUgfHwgZGVzdC5fd3JpdGFibGVTdGF0ZS5uZWVkRHJhaW4pKSBvbmRyYWluKCk7XG4gIH1cblxuICAvLyBJZiB0aGUgdXNlciBwdXNoZXMgbW9yZSBkYXRhIHdoaWxlIHdlJ3JlIHdyaXRpbmcgdG8gZGVzdCB0aGVuIHdlJ2xsIGVuZCB1cFxuICAvLyBpbiBvbmRhdGEgYWdhaW4uIEhvd2V2ZXIsIHdlIG9ubHkgd2FudCB0byBpbmNyZWFzZSBhd2FpdERyYWluIG9uY2UgYmVjYXVzZVxuICAvLyBkZXN0IHdpbGwgb25seSBlbWl0IG9uZSAnZHJhaW4nIGV2ZW50IGZvciB0aGUgbXVsdGlwbGUgd3JpdGVzLlxuICAvLyA9PiBJbnRyb2R1Y2UgYSBndWFyZCBvbiBpbmNyZWFzaW5nIGF3YWl0RHJhaW4uXG4gIHZhciBpbmNyZWFzZWRBd2FpdERyYWluID0gZmFsc2U7XG4gIHNyYy5vbignZGF0YScsIG9uZGF0YSk7XG4gIGZ1bmN0aW9uIG9uZGF0YShjaHVuaykge1xuICAgIGRlYnVnKCdvbmRhdGEnKTtcbiAgICBpbmNyZWFzZWRBd2FpdERyYWluID0gZmFsc2U7XG4gICAgdmFyIHJldCA9IGRlc3Qud3JpdGUoY2h1bmspO1xuICAgIGlmIChmYWxzZSA9PT0gcmV0ICYmICFpbmNyZWFzZWRBd2FpdERyYWluKSB7XG4gICAgICAvLyBJZiB0aGUgdXNlciB1bnBpcGVkIGR1cmluZyBgZGVzdC53cml0ZSgpYCwgaXQgaXMgcG9zc2libGVcbiAgICAgIC8vIHRvIGdldCBzdHVjayBpbiBhIHBlcm1hbmVudGx5IHBhdXNlZCBzdGF0ZSBpZiB0aGF0IHdyaXRlXG4gICAgICAvLyBhbHNvIHJldHVybmVkIGZhbHNlLlxuICAgICAgLy8gPT4gQ2hlY2sgd2hldGhlciBgZGVzdGAgaXMgc3RpbGwgYSBwaXBpbmcgZGVzdGluYXRpb24uXG4gICAgICBpZiAoKHN0YXRlLnBpcGVzQ291bnQgPT09IDEgJiYgc3RhdGUucGlwZXMgPT09IGRlc3QgfHwgc3RhdGUucGlwZXNDb3VudCA+IDEgJiYgaW5kZXhPZihzdGF0ZS5waXBlcywgZGVzdCkgIT09IC0xKSAmJiAhY2xlYW5lZFVwKSB7XG4gICAgICAgIGRlYnVnKCdmYWxzZSB3cml0ZSByZXNwb25zZSwgcGF1c2UnLCBzcmMuX3JlYWRhYmxlU3RhdGUuYXdhaXREcmFpbik7XG4gICAgICAgIHNyYy5fcmVhZGFibGVTdGF0ZS5hd2FpdERyYWluKys7XG4gICAgICAgIGluY3JlYXNlZEF3YWl0RHJhaW4gPSB0cnVlO1xuICAgICAgfVxuICAgICAgc3JjLnBhdXNlKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gaWYgdGhlIGRlc3QgaGFzIGFuIGVycm9yLCB0aGVuIHN0b3AgcGlwaW5nIGludG8gaXQuXG4gIC8vIGhvd2V2ZXIsIGRvbid0IHN1cHByZXNzIHRoZSB0aHJvd2luZyBiZWhhdmlvciBmb3IgdGhpcy5cbiAgZnVuY3Rpb24gb25lcnJvcihlcikge1xuICAgIGRlYnVnKCdvbmVycm9yJywgZXIpO1xuICAgIHVucGlwZSgpO1xuICAgIGRlc3QucmVtb3ZlTGlzdGVuZXIoJ2Vycm9yJywgb25lcnJvcik7XG4gICAgaWYgKEVFbGlzdGVuZXJDb3VudChkZXN0LCAnZXJyb3InKSA9PT0gMCkgZGVzdC5lbWl0KCdlcnJvcicsIGVyKTtcbiAgfVxuXG4gIC8vIE1ha2Ugc3VyZSBvdXIgZXJyb3IgaGFuZGxlciBpcyBhdHRhY2hlZCBiZWZvcmUgdXNlcmxhbmQgb25lcy5cbiAgcHJlcGVuZExpc3RlbmVyKGRlc3QsICdlcnJvcicsIG9uZXJyb3IpO1xuXG4gIC8vIEJvdGggY2xvc2UgYW5kIGZpbmlzaCBzaG91bGQgdHJpZ2dlciB1bnBpcGUsIGJ1dCBvbmx5IG9uY2UuXG4gIGZ1bmN0aW9uIG9uY2xvc2UoKSB7XG4gICAgZGVzdC5yZW1vdmVMaXN0ZW5lcignZmluaXNoJywgb25maW5pc2gpO1xuICAgIHVucGlwZSgpO1xuICB9XG4gIGRlc3Qub25jZSgnY2xvc2UnLCBvbmNsb3NlKTtcbiAgZnVuY3Rpb24gb25maW5pc2goKSB7XG4gICAgZGVidWcoJ29uZmluaXNoJyk7XG4gICAgZGVzdC5yZW1vdmVMaXN0ZW5lcignY2xvc2UnLCBvbmNsb3NlKTtcbiAgICB1bnBpcGUoKTtcbiAgfVxuICBkZXN0Lm9uY2UoJ2ZpbmlzaCcsIG9uZmluaXNoKTtcblxuICBmdW5jdGlvbiB1bnBpcGUoKSB7XG4gICAgZGVidWcoJ3VucGlwZScpO1xuICAgIHNyYy51bnBpcGUoZGVzdCk7XG4gIH1cblxuICAvLyB0ZWxsIHRoZSBkZXN0IHRoYXQgaXQncyBiZWluZyBwaXBlZCB0b1xuICBkZXN0LmVtaXQoJ3BpcGUnLCBzcmMpO1xuXG4gIC8vIHN0YXJ0IHRoZSBmbG93IGlmIGl0IGhhc24ndCBiZWVuIHN0YXJ0ZWQgYWxyZWFkeS5cbiAgaWYgKCFzdGF0ZS5mbG93aW5nKSB7XG4gICAgZGVidWcoJ3BpcGUgcmVzdW1lJyk7XG4gICAgc3JjLnJlc3VtZSgpO1xuICB9XG5cbiAgcmV0dXJuIGRlc3Q7XG59O1xuXG5mdW5jdGlvbiBwaXBlT25EcmFpbihzcmMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc3RhdGUgPSBzcmMuX3JlYWRhYmxlU3RhdGU7XG4gICAgZGVidWcoJ3BpcGVPbkRyYWluJywgc3RhdGUuYXdhaXREcmFpbik7XG4gICAgaWYgKHN0YXRlLmF3YWl0RHJhaW4pIHN0YXRlLmF3YWl0RHJhaW4tLTtcbiAgICBpZiAoc3RhdGUuYXdhaXREcmFpbiA9PT0gMCAmJiBFRWxpc3RlbmVyQ291bnQoc3JjLCAnZGF0YScpKSB7XG4gICAgICBzdGF0ZS5mbG93aW5nID0gdHJ1ZTtcbiAgICAgIGZsb3coc3JjKTtcbiAgICB9XG4gIH07XG59XG5cblJlYWRhYmxlLnByb3RvdHlwZS51bnBpcGUgPSBmdW5jdGlvbiAoZGVzdCkge1xuICB2YXIgc3RhdGUgPSB0aGlzLl9yZWFkYWJsZVN0YXRlO1xuICB2YXIgdW5waXBlSW5mbyA9IHsgaGFzVW5waXBlZDogZmFsc2UgfTtcblxuICAvLyBpZiB3ZSdyZSBub3QgcGlwaW5nIGFueXdoZXJlLCB0aGVuIGRvIG5vdGhpbmcuXG4gIGlmIChzdGF0ZS5waXBlc0NvdW50ID09PSAwKSByZXR1cm4gdGhpcztcblxuICAvLyBqdXN0IG9uZSBkZXN0aW5hdGlvbi4gIG1vc3QgY29tbW9uIGNhc2UuXG4gIGlmIChzdGF0ZS5waXBlc0NvdW50ID09PSAxKSB7XG4gICAgLy8gcGFzc2VkIGluIG9uZSwgYnV0IGl0J3Mgbm90IHRoZSByaWdodCBvbmUuXG4gICAgaWYgKGRlc3QgJiYgZGVzdCAhPT0gc3RhdGUucGlwZXMpIHJldHVybiB0aGlzO1xuXG4gICAgaWYgKCFkZXN0KSBkZXN0ID0gc3RhdGUucGlwZXM7XG5cbiAgICAvLyBnb3QgYSBtYXRjaC5cbiAgICBzdGF0ZS5waXBlcyA9IG51bGw7XG4gICAgc3RhdGUucGlwZXNDb3VudCA9IDA7XG4gICAgc3RhdGUuZmxvd2luZyA9IGZhbHNlO1xuICAgIGlmIChkZXN0KSBkZXN0LmVtaXQoJ3VucGlwZScsIHRoaXMsIHVucGlwZUluZm8pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gc2xvdyBjYXNlLiBtdWx0aXBsZSBwaXBlIGRlc3RpbmF0aW9ucy5cblxuICBpZiAoIWRlc3QpIHtcbiAgICAvLyByZW1vdmUgYWxsLlxuICAgIHZhciBkZXN0cyA9IHN0YXRlLnBpcGVzO1xuICAgIHZhciBsZW4gPSBzdGF0ZS5waXBlc0NvdW50O1xuICAgIHN0YXRlLnBpcGVzID0gbnVsbDtcbiAgICBzdGF0ZS5waXBlc0NvdW50ID0gMDtcbiAgICBzdGF0ZS5mbG93aW5nID0gZmFsc2U7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBkZXN0c1tpXS5lbWl0KCd1bnBpcGUnLCB0aGlzLCB1bnBpcGVJbmZvKTtcbiAgICB9cmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyB0cnkgdG8gZmluZCB0aGUgcmlnaHQgb25lLlxuICB2YXIgaW5kZXggPSBpbmRleE9mKHN0YXRlLnBpcGVzLCBkZXN0KTtcbiAgaWYgKGluZGV4ID09PSAtMSkgcmV0dXJuIHRoaXM7XG5cbiAgc3RhdGUucGlwZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgc3RhdGUucGlwZXNDb3VudCAtPSAxO1xuICBpZiAoc3RhdGUucGlwZXNDb3VudCA9PT0gMSkgc3RhdGUucGlwZXMgPSBzdGF0ZS5waXBlc1swXTtcblxuICBkZXN0LmVtaXQoJ3VucGlwZScsIHRoaXMsIHVucGlwZUluZm8pO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gc2V0IHVwIGRhdGEgZXZlbnRzIGlmIHRoZXkgYXJlIGFza2VkIGZvclxuLy8gRW5zdXJlIHJlYWRhYmxlIGxpc3RlbmVycyBldmVudHVhbGx5IGdldCBzb21ldGhpbmdcblJlYWRhYmxlLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIChldiwgZm4pIHtcbiAgdmFyIHJlcyA9IFN0cmVhbS5wcm90b3R5cGUub24uY2FsbCh0aGlzLCBldiwgZm4pO1xuXG4gIGlmIChldiA9PT0gJ2RhdGEnKSB7XG4gICAgLy8gU3RhcnQgZmxvd2luZyBvbiBuZXh0IHRpY2sgaWYgc3RyZWFtIGlzbid0IGV4cGxpY2l0bHkgcGF1c2VkXG4gICAgaWYgKHRoaXMuX3JlYWRhYmxlU3RhdGUuZmxvd2luZyAhPT0gZmFsc2UpIHRoaXMucmVzdW1lKCk7XG4gIH0gZWxzZSBpZiAoZXYgPT09ICdyZWFkYWJsZScpIHtcbiAgICB2YXIgc3RhdGUgPSB0aGlzLl9yZWFkYWJsZVN0YXRlO1xuICAgIGlmICghc3RhdGUuZW5kRW1pdHRlZCAmJiAhc3RhdGUucmVhZGFibGVMaXN0ZW5pbmcpIHtcbiAgICAgIHN0YXRlLnJlYWRhYmxlTGlzdGVuaW5nID0gc3RhdGUubmVlZFJlYWRhYmxlID0gdHJ1ZTtcbiAgICAgIHN0YXRlLmVtaXR0ZWRSZWFkYWJsZSA9IGZhbHNlO1xuICAgICAgaWYgKCFzdGF0ZS5yZWFkaW5nKSB7XG4gICAgICAgIHBuYS5uZXh0VGljayhuUmVhZGluZ05leHRUaWNrLCB0aGlzKTtcbiAgICAgIH0gZWxzZSBpZiAoc3RhdGUubGVuZ3RoKSB7XG4gICAgICAgIGVtaXRSZWFkYWJsZSh0aGlzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzO1xufTtcblJlYWRhYmxlLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IFJlYWRhYmxlLnByb3RvdHlwZS5vbjtcblxuZnVuY3Rpb24gblJlYWRpbmdOZXh0VGljayhzZWxmKSB7XG4gIGRlYnVnKCdyZWFkYWJsZSBuZXh0dGljayByZWFkIDAnKTtcbiAgc2VsZi5yZWFkKDApO1xufVxuXG4vLyBwYXVzZSgpIGFuZCByZXN1bWUoKSBhcmUgcmVtbmFudHMgb2YgdGhlIGxlZ2FjeSByZWFkYWJsZSBzdHJlYW0gQVBJXG4vLyBJZiB0aGUgdXNlciB1c2VzIHRoZW0sIHRoZW4gc3dpdGNoIGludG8gb2xkIG1vZGUuXG5SZWFkYWJsZS5wcm90b3R5cGUucmVzdW1lID0gZnVuY3Rpb24gKCkge1xuICB2YXIgc3RhdGUgPSB0aGlzLl9yZWFkYWJsZVN0YXRlO1xuICBpZiAoIXN0YXRlLmZsb3dpbmcpIHtcbiAgICBkZWJ1ZygncmVzdW1lJyk7XG4gICAgc3RhdGUuZmxvd2luZyA9IHRydWU7XG4gICAgcmVzdW1lKHRoaXMsIHN0YXRlKTtcbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5cbmZ1bmN0aW9uIHJlc3VtZShzdHJlYW0sIHN0YXRlKSB7XG4gIGlmICghc3RhdGUucmVzdW1lU2NoZWR1bGVkKSB7XG4gICAgc3RhdGUucmVzdW1lU2NoZWR1bGVkID0gdHJ1ZTtcbiAgICBwbmEubmV4dFRpY2socmVzdW1lXywgc3RyZWFtLCBzdGF0ZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVzdW1lXyhzdHJlYW0sIHN0YXRlKSB7XG4gIGlmICghc3RhdGUucmVhZGluZykge1xuICAgIGRlYnVnKCdyZXN1bWUgcmVhZCAwJyk7XG4gICAgc3RyZWFtLnJlYWQoMCk7XG4gIH1cblxuICBzdGF0ZS5yZXN1bWVTY2hlZHVsZWQgPSBmYWxzZTtcbiAgc3RhdGUuYXdhaXREcmFpbiA9IDA7XG4gIHN0cmVhbS5lbWl0KCdyZXN1bWUnKTtcbiAgZmxvdyhzdHJlYW0pO1xuICBpZiAoc3RhdGUuZmxvd2luZyAmJiAhc3RhdGUucmVhZGluZykgc3RyZWFtLnJlYWQoMCk7XG59XG5cblJlYWRhYmxlLnByb3RvdHlwZS5wYXVzZSA9IGZ1bmN0aW9uICgpIHtcbiAgZGVidWcoJ2NhbGwgcGF1c2UgZmxvd2luZz0laicsIHRoaXMuX3JlYWRhYmxlU3RhdGUuZmxvd2luZyk7XG4gIGlmIChmYWxzZSAhPT0gdGhpcy5fcmVhZGFibGVTdGF0ZS5mbG93aW5nKSB7XG4gICAgZGVidWcoJ3BhdXNlJyk7XG4gICAgdGhpcy5fcmVhZGFibGVTdGF0ZS5mbG93aW5nID0gZmFsc2U7XG4gICAgdGhpcy5lbWl0KCdwYXVzZScpO1xuICB9XG4gIHJldHVybiB0aGlzO1xufTtcblxuZnVuY3Rpb24gZmxvdyhzdHJlYW0pIHtcbiAgdmFyIHN0YXRlID0gc3RyZWFtLl9yZWFkYWJsZVN0YXRlO1xuICBkZWJ1ZygnZmxvdycsIHN0YXRlLmZsb3dpbmcpO1xuICB3aGlsZSAoc3RhdGUuZmxvd2luZyAmJiBzdHJlYW0ucmVhZCgpICE9PSBudWxsKSB7fVxufVxuXG4vLyB3cmFwIGFuIG9sZC1zdHlsZSBzdHJlYW0gYXMgdGhlIGFzeW5jIGRhdGEgc291cmNlLlxuLy8gVGhpcyBpcyAqbm90KiBwYXJ0IG9mIHRoZSByZWFkYWJsZSBzdHJlYW0gaW50ZXJmYWNlLlxuLy8gSXQgaXMgYW4gdWdseSB1bmZvcnR1bmF0ZSBtZXNzIG9mIGhpc3RvcnkuXG5SZWFkYWJsZS5wcm90b3R5cGUud3JhcCA9IGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgdmFyIF90aGlzID0gdGhpcztcblxuICB2YXIgc3RhdGUgPSB0aGlzLl9yZWFkYWJsZVN0YXRlO1xuICB2YXIgcGF1c2VkID0gZmFsc2U7XG5cbiAgc3RyZWFtLm9uKCdlbmQnLCBmdW5jdGlvbiAoKSB7XG4gICAgZGVidWcoJ3dyYXBwZWQgZW5kJyk7XG4gICAgaWYgKHN0YXRlLmRlY29kZXIgJiYgIXN0YXRlLmVuZGVkKSB7XG4gICAgICB2YXIgY2h1bmsgPSBzdGF0ZS5kZWNvZGVyLmVuZCgpO1xuICAgICAgaWYgKGNodW5rICYmIGNodW5rLmxlbmd0aCkgX3RoaXMucHVzaChjaHVuayk7XG4gICAgfVxuXG4gICAgX3RoaXMucHVzaChudWxsKTtcbiAgfSk7XG5cbiAgc3RyZWFtLm9uKCdkYXRhJywgZnVuY3Rpb24gKGNodW5rKSB7XG4gICAgZGVidWcoJ3dyYXBwZWQgZGF0YScpO1xuICAgIGlmIChzdGF0ZS5kZWNvZGVyKSBjaHVuayA9IHN0YXRlLmRlY29kZXIud3JpdGUoY2h1bmspO1xuXG4gICAgLy8gZG9uJ3Qgc2tpcCBvdmVyIGZhbHN5IHZhbHVlcyBpbiBvYmplY3RNb2RlXG4gICAgaWYgKHN0YXRlLm9iamVjdE1vZGUgJiYgKGNodW5rID09PSBudWxsIHx8IGNodW5rID09PSB1bmRlZmluZWQpKSByZXR1cm47ZWxzZSBpZiAoIXN0YXRlLm9iamVjdE1vZGUgJiYgKCFjaHVuayB8fCAhY2h1bmsubGVuZ3RoKSkgcmV0dXJuO1xuXG4gICAgdmFyIHJldCA9IF90aGlzLnB1c2goY2h1bmspO1xuICAgIGlmICghcmV0KSB7XG4gICAgICBwYXVzZWQgPSB0cnVlO1xuICAgICAgc3RyZWFtLnBhdXNlKCk7XG4gICAgfVxuICB9KTtcblxuICAvLyBwcm94eSBhbGwgdGhlIG90aGVyIG1ldGhvZHMuXG4gIC8vIGltcG9ydGFudCB3aGVuIHdyYXBwaW5nIGZpbHRlcnMgYW5kIGR1cGxleGVzLlxuICBmb3IgKHZhciBpIGluIHN0cmVhbSkge1xuICAgIGlmICh0aGlzW2ldID09PSB1bmRlZmluZWQgJiYgdHlwZW9mIHN0cmVhbVtpXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhpc1tpXSA9IGZ1bmN0aW9uIChtZXRob2QpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICByZXR1cm4gc3RyZWFtW21ldGhvZF0uYXBwbHkoc3RyZWFtLCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgICAgfShpKTtcbiAgICB9XG4gIH1cblxuICAvLyBwcm94eSBjZXJ0YWluIGltcG9ydGFudCBldmVudHMuXG4gIGZvciAodmFyIG4gPSAwOyBuIDwga1Byb3h5RXZlbnRzLmxlbmd0aDsgbisrKSB7XG4gICAgc3RyZWFtLm9uKGtQcm94eUV2ZW50c1tuXSwgdGhpcy5lbWl0LmJpbmQodGhpcywga1Byb3h5RXZlbnRzW25dKSk7XG4gIH1cblxuICAvLyB3aGVuIHdlIHRyeSB0byBjb25zdW1lIHNvbWUgbW9yZSBieXRlcywgc2ltcGx5IHVucGF1c2UgdGhlXG4gIC8vIHVuZGVybHlpbmcgc3RyZWFtLlxuICB0aGlzLl9yZWFkID0gZnVuY3Rpb24gKG4pIHtcbiAgICBkZWJ1Zygnd3JhcHBlZCBfcmVhZCcsIG4pO1xuICAgIGlmIChwYXVzZWQpIHtcbiAgICAgIHBhdXNlZCA9IGZhbHNlO1xuICAgICAgc3RyZWFtLnJlc3VtZSgpO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShSZWFkYWJsZS5wcm90b3R5cGUsICdyZWFkYWJsZUhpZ2hXYXRlck1hcmsnLCB7XG4gIC8vIG1ha2luZyBpdCBleHBsaWNpdCB0aGlzIHByb3BlcnR5IGlzIG5vdCBlbnVtZXJhYmxlXG4gIC8vIGJlY2F1c2Ugb3RoZXJ3aXNlIHNvbWUgcHJvdG90eXBlIG1hbmlwdWxhdGlvbiBpblxuICAvLyB1c2VybGFuZCB3aWxsIGZhaWxcbiAgZW51bWVyYWJsZTogZmFsc2UsXG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9yZWFkYWJsZVN0YXRlLmhpZ2hXYXRlck1hcms7XG4gIH1cbn0pO1xuXG4vLyBleHBvc2VkIGZvciB0ZXN0aW5nIHB1cnBvc2VzIG9ubHkuXG5SZWFkYWJsZS5fZnJvbUxpc3QgPSBmcm9tTGlzdDtcblxuLy8gUGx1Y2sgb2ZmIG4gYnl0ZXMgZnJvbSBhbiBhcnJheSBvZiBidWZmZXJzLlxuLy8gTGVuZ3RoIGlzIHRoZSBjb21iaW5lZCBsZW5ndGhzIG9mIGFsbCB0aGUgYnVmZmVycyBpbiB0aGUgbGlzdC5cbi8vIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gYmUgaW5saW5hYmxlLCBzbyBwbGVhc2UgdGFrZSBjYXJlIHdoZW4gbWFraW5nXG4vLyBjaGFuZ2VzIHRvIHRoZSBmdW5jdGlvbiBib2R5LlxuZnVuY3Rpb24gZnJvbUxpc3Qobiwgc3RhdGUpIHtcbiAgLy8gbm90aGluZyBidWZmZXJlZFxuICBpZiAoc3RhdGUubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcblxuICB2YXIgcmV0O1xuICBpZiAoc3RhdGUub2JqZWN0TW9kZSkgcmV0ID0gc3RhdGUuYnVmZmVyLnNoaWZ0KCk7ZWxzZSBpZiAoIW4gfHwgbiA+PSBzdGF0ZS5sZW5ndGgpIHtcbiAgICAvLyByZWFkIGl0IGFsbCwgdHJ1bmNhdGUgdGhlIGxpc3RcbiAgICBpZiAoc3RhdGUuZGVjb2RlcikgcmV0ID0gc3RhdGUuYnVmZmVyLmpvaW4oJycpO2Vsc2UgaWYgKHN0YXRlLmJ1ZmZlci5sZW5ndGggPT09IDEpIHJldCA9IHN0YXRlLmJ1ZmZlci5oZWFkLmRhdGE7ZWxzZSByZXQgPSBzdGF0ZS5idWZmZXIuY29uY2F0KHN0YXRlLmxlbmd0aCk7XG4gICAgc3RhdGUuYnVmZmVyLmNsZWFyKCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gcmVhZCBwYXJ0IG9mIGxpc3RcbiAgICByZXQgPSBmcm9tTGlzdFBhcnRpYWwobiwgc3RhdGUuYnVmZmVyLCBzdGF0ZS5kZWNvZGVyKTtcbiAgfVxuXG4gIHJldHVybiByZXQ7XG59XG5cbi8vIEV4dHJhY3RzIG9ubHkgZW5vdWdoIGJ1ZmZlcmVkIGRhdGEgdG8gc2F0aXNmeSB0aGUgYW1vdW50IHJlcXVlc3RlZC5cbi8vIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gYmUgaW5saW5hYmxlLCBzbyBwbGVhc2UgdGFrZSBjYXJlIHdoZW4gbWFraW5nXG4vLyBjaGFuZ2VzIHRvIHRoZSBmdW5jdGlvbiBib2R5LlxuZnVuY3Rpb24gZnJvbUxpc3RQYXJ0aWFsKG4sIGxpc3QsIGhhc1N0cmluZ3MpIHtcbiAgdmFyIHJldDtcbiAgaWYgKG4gPCBsaXN0LmhlYWQuZGF0YS5sZW5ndGgpIHtcbiAgICAvLyBzbGljZSBpcyB0aGUgc2FtZSBmb3IgYnVmZmVycyBhbmQgc3RyaW5nc1xuICAgIHJldCA9IGxpc3QuaGVhZC5kYXRhLnNsaWNlKDAsIG4pO1xuICAgIGxpc3QuaGVhZC5kYXRhID0gbGlzdC5oZWFkLmRhdGEuc2xpY2Uobik7XG4gIH0gZWxzZSBpZiAobiA9PT0gbGlzdC5oZWFkLmRhdGEubGVuZ3RoKSB7XG4gICAgLy8gZmlyc3QgY2h1bmsgaXMgYSBwZXJmZWN0IG1hdGNoXG4gICAgcmV0ID0gbGlzdC5zaGlmdCgpO1xuICB9IGVsc2Uge1xuICAgIC8vIHJlc3VsdCBzcGFucyBtb3JlIHRoYW4gb25lIGJ1ZmZlclxuICAgIHJldCA9IGhhc1N0cmluZ3MgPyBjb3B5RnJvbUJ1ZmZlclN0cmluZyhuLCBsaXN0KSA6IGNvcHlGcm9tQnVmZmVyKG4sIGxpc3QpO1xuICB9XG4gIHJldHVybiByZXQ7XG59XG5cbi8vIENvcGllcyBhIHNwZWNpZmllZCBhbW91bnQgb2YgY2hhcmFjdGVycyBmcm9tIHRoZSBsaXN0IG9mIGJ1ZmZlcmVkIGRhdGFcbi8vIGNodW5rcy5cbi8vIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gYmUgaW5saW5hYmxlLCBzbyBwbGVhc2UgdGFrZSBjYXJlIHdoZW4gbWFraW5nXG4vLyBjaGFuZ2VzIHRvIHRoZSBmdW5jdGlvbiBib2R5LlxuZnVuY3Rpb24gY29weUZyb21CdWZmZXJTdHJpbmcobiwgbGlzdCkge1xuICB2YXIgcCA9IGxpc3QuaGVhZDtcbiAgdmFyIGMgPSAxO1xuICB2YXIgcmV0ID0gcC5kYXRhO1xuICBuIC09IHJldC5sZW5ndGg7XG4gIHdoaWxlIChwID0gcC5uZXh0KSB7XG4gICAgdmFyIHN0ciA9IHAuZGF0YTtcbiAgICB2YXIgbmIgPSBuID4gc3RyLmxlbmd0aCA/IHN0ci5sZW5ndGggOiBuO1xuICAgIGlmIChuYiA9PT0gc3RyLmxlbmd0aCkgcmV0ICs9IHN0cjtlbHNlIHJldCArPSBzdHIuc2xpY2UoMCwgbik7XG4gICAgbiAtPSBuYjtcbiAgICBpZiAobiA9PT0gMCkge1xuICAgICAgaWYgKG5iID09PSBzdHIubGVuZ3RoKSB7XG4gICAgICAgICsrYztcbiAgICAgICAgaWYgKHAubmV4dCkgbGlzdC5oZWFkID0gcC5uZXh0O2Vsc2UgbGlzdC5oZWFkID0gbGlzdC50YWlsID0gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpc3QuaGVhZCA9IHA7XG4gICAgICAgIHAuZGF0YSA9IHN0ci5zbGljZShuYik7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgKytjO1xuICB9XG4gIGxpc3QubGVuZ3RoIC09IGM7XG4gIHJldHVybiByZXQ7XG59XG5cbi8vIENvcGllcyBhIHNwZWNpZmllZCBhbW91bnQgb2YgYnl0ZXMgZnJvbSB0aGUgbGlzdCBvZiBidWZmZXJlZCBkYXRhIGNodW5rcy5cbi8vIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gYmUgaW5saW5hYmxlLCBzbyBwbGVhc2UgdGFrZSBjYXJlIHdoZW4gbWFraW5nXG4vLyBjaGFuZ2VzIHRvIHRoZSBmdW5jdGlvbiBib2R5LlxuZnVuY3Rpb24gY29weUZyb21CdWZmZXIobiwgbGlzdCkge1xuICB2YXIgcmV0ID0gQnVmZmVyLmFsbG9jVW5zYWZlKG4pO1xuICB2YXIgcCA9IGxpc3QuaGVhZDtcbiAgdmFyIGMgPSAxO1xuICBwLmRhdGEuY29weShyZXQpO1xuICBuIC09IHAuZGF0YS5sZW5ndGg7XG4gIHdoaWxlIChwID0gcC5uZXh0KSB7XG4gICAgdmFyIGJ1ZiA9IHAuZGF0YTtcbiAgICB2YXIgbmIgPSBuID4gYnVmLmxlbmd0aCA/IGJ1Zi5sZW5ndGggOiBuO1xuICAgIGJ1Zi5jb3B5KHJldCwgcmV0Lmxlbmd0aCAtIG4sIDAsIG5iKTtcbiAgICBuIC09IG5iO1xuICAgIGlmIChuID09PSAwKSB7XG4gICAgICBpZiAobmIgPT09IGJ1Zi5sZW5ndGgpIHtcbiAgICAgICAgKytjO1xuICAgICAgICBpZiAocC5uZXh0KSBsaXN0LmhlYWQgPSBwLm5leHQ7ZWxzZSBsaXN0LmhlYWQgPSBsaXN0LnRhaWwgPSBudWxsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGlzdC5oZWFkID0gcDtcbiAgICAgICAgcC5kYXRhID0gYnVmLnNsaWNlKG5iKTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICArK2M7XG4gIH1cbiAgbGlzdC5sZW5ndGggLT0gYztcbiAgcmV0dXJuIHJldDtcbn1cblxuZnVuY3Rpb24gZW5kUmVhZGFibGUoc3RyZWFtKSB7XG4gIHZhciBzdGF0ZSA9IHN0cmVhbS5fcmVhZGFibGVTdGF0ZTtcblxuICAvLyBJZiB3ZSBnZXQgaGVyZSBiZWZvcmUgY29uc3VtaW5nIGFsbCB0aGUgYnl0ZXMsIHRoZW4gdGhhdCBpcyBhXG4gIC8vIGJ1ZyBpbiBub2RlLiAgU2hvdWxkIG5ldmVyIGhhcHBlbi5cbiAgaWYgKHN0YXRlLmxlbmd0aCA+IDApIHRocm93IG5ldyBFcnJvcignXCJlbmRSZWFkYWJsZSgpXCIgY2FsbGVkIG9uIG5vbi1lbXB0eSBzdHJlYW0nKTtcblxuICBpZiAoIXN0YXRlLmVuZEVtaXR0ZWQpIHtcbiAgICBzdGF0ZS5lbmRlZCA9IHRydWU7XG4gICAgcG5hLm5leHRUaWNrKGVuZFJlYWRhYmxlTlQsIHN0YXRlLCBzdHJlYW0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGVuZFJlYWRhYmxlTlQoc3RhdGUsIHN0cmVhbSkge1xuICAvLyBDaGVjayB0aGF0IHdlIGRpZG4ndCBnZXQgb25lIGxhc3QgdW5zaGlmdC5cbiAgaWYgKCFzdGF0ZS5lbmRFbWl0dGVkICYmIHN0YXRlLmxlbmd0aCA9PT0gMCkge1xuICAgIHN0YXRlLmVuZEVtaXR0ZWQgPSB0cnVlO1xuICAgIHN0cmVhbS5yZWFkYWJsZSA9IGZhbHNlO1xuICAgIHN0cmVhbS5lbWl0KCdlbmQnKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpbmRleE9mKHhzLCB4KSB7XG4gIGZvciAodmFyIGkgPSAwLCBsID0geHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgaWYgKHhzW2ldID09PSB4KSByZXR1cm4gaTtcbiAgfVxuICByZXR1cm4gLTE7XG59IiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbi8vIGEgdHJhbnNmb3JtIHN0cmVhbSBpcyBhIHJlYWRhYmxlL3dyaXRhYmxlIHN0cmVhbSB3aGVyZSB5b3UgZG9cbi8vIHNvbWV0aGluZyB3aXRoIHRoZSBkYXRhLiAgU29tZXRpbWVzIGl0J3MgY2FsbGVkIGEgXCJmaWx0ZXJcIixcbi8vIGJ1dCB0aGF0J3Mgbm90IGEgZ3JlYXQgbmFtZSBmb3IgaXQsIHNpbmNlIHRoYXQgaW1wbGllcyBhIHRoaW5nIHdoZXJlXG4vLyBzb21lIGJpdHMgcGFzcyB0aHJvdWdoLCBhbmQgb3RoZXJzIGFyZSBzaW1wbHkgaWdub3JlZC4gIChUaGF0IHdvdWxkXG4vLyBiZSBhIHZhbGlkIGV4YW1wbGUgb2YgYSB0cmFuc2Zvcm0sIG9mIGNvdXJzZS4pXG4vL1xuLy8gV2hpbGUgdGhlIG91dHB1dCBpcyBjYXVzYWxseSByZWxhdGVkIHRvIHRoZSBpbnB1dCwgaXQncyBub3QgYVxuLy8gbmVjZXNzYXJpbHkgc3ltbWV0cmljIG9yIHN5bmNocm9ub3VzIHRyYW5zZm9ybWF0aW9uLiAgRm9yIGV4YW1wbGUsXG4vLyBhIHpsaWIgc3RyZWFtIG1pZ2h0IHRha2UgbXVsdGlwbGUgcGxhaW4tdGV4dCB3cml0ZXMoKSwgYW5kIHRoZW5cbi8vIGVtaXQgYSBzaW5nbGUgY29tcHJlc3NlZCBjaHVuayBzb21lIHRpbWUgaW4gdGhlIGZ1dHVyZS5cbi8vXG4vLyBIZXJlJ3MgaG93IHRoaXMgd29ya3M6XG4vL1xuLy8gVGhlIFRyYW5zZm9ybSBzdHJlYW0gaGFzIGFsbCB0aGUgYXNwZWN0cyBvZiB0aGUgcmVhZGFibGUgYW5kIHdyaXRhYmxlXG4vLyBzdHJlYW0gY2xhc3Nlcy4gIFdoZW4geW91IHdyaXRlKGNodW5rKSwgdGhhdCBjYWxscyBfd3JpdGUoY2h1bmssY2IpXG4vLyBpbnRlcm5hbGx5LCBhbmQgcmV0dXJucyBmYWxzZSBpZiB0aGVyZSdzIGEgbG90IG9mIHBlbmRpbmcgd3JpdGVzXG4vLyBidWZmZXJlZCB1cC4gIFdoZW4geW91IGNhbGwgcmVhZCgpLCB0aGF0IGNhbGxzIF9yZWFkKG4pIHVudGlsXG4vLyB0aGVyZSdzIGVub3VnaCBwZW5kaW5nIHJlYWRhYmxlIGRhdGEgYnVmZmVyZWQgdXAuXG4vL1xuLy8gSW4gYSB0cmFuc2Zvcm0gc3RyZWFtLCB0aGUgd3JpdHRlbiBkYXRhIGlzIHBsYWNlZCBpbiBhIGJ1ZmZlci4gIFdoZW5cbi8vIF9yZWFkKG4pIGlzIGNhbGxlZCwgaXQgdHJhbnNmb3JtcyB0aGUgcXVldWVkIHVwIGRhdGEsIGNhbGxpbmcgdGhlXG4vLyBidWZmZXJlZCBfd3JpdGUgY2IncyBhcyBpdCBjb25zdW1lcyBjaHVua3MuICBJZiBjb25zdW1pbmcgYSBzaW5nbGVcbi8vIHdyaXR0ZW4gY2h1bmsgd291bGQgcmVzdWx0IGluIG11bHRpcGxlIG91dHB1dCBjaHVua3MsIHRoZW4gdGhlIGZpcnN0XG4vLyBvdXRwdXR0ZWQgYml0IGNhbGxzIHRoZSByZWFkY2IsIGFuZCBzdWJzZXF1ZW50IGNodW5rcyBqdXN0IGdvIGludG9cbi8vIHRoZSByZWFkIGJ1ZmZlciwgYW5kIHdpbGwgY2F1c2UgaXQgdG8gZW1pdCAncmVhZGFibGUnIGlmIG5lY2Vzc2FyeS5cbi8vXG4vLyBUaGlzIHdheSwgYmFjay1wcmVzc3VyZSBpcyBhY3R1YWxseSBkZXRlcm1pbmVkIGJ5IHRoZSByZWFkaW5nIHNpZGUsXG4vLyBzaW5jZSBfcmVhZCBoYXMgdG8gYmUgY2FsbGVkIHRvIHN0YXJ0IHByb2Nlc3NpbmcgYSBuZXcgY2h1bmsuICBIb3dldmVyLFxuLy8gYSBwYXRob2xvZ2ljYWwgaW5mbGF0ZSB0eXBlIG9mIHRyYW5zZm9ybSBjYW4gY2F1c2UgZXhjZXNzaXZlIGJ1ZmZlcmluZ1xuLy8gaGVyZS4gIEZvciBleGFtcGxlLCBpbWFnaW5lIGEgc3RyZWFtIHdoZXJlIGV2ZXJ5IGJ5dGUgb2YgaW5wdXQgaXNcbi8vIGludGVycHJldGVkIGFzIGFuIGludGVnZXIgZnJvbSAwLTI1NSwgYW5kIHRoZW4gcmVzdWx0cyBpbiB0aGF0IG1hbnlcbi8vIGJ5dGVzIG9mIG91dHB1dC4gIFdyaXRpbmcgdGhlIDQgYnl0ZXMge2ZmLGZmLGZmLGZmfSB3b3VsZCByZXN1bHQgaW5cbi8vIDFrYiBvZiBkYXRhIGJlaW5nIG91dHB1dC4gIEluIHRoaXMgY2FzZSwgeW91IGNvdWxkIHdyaXRlIGEgdmVyeSBzbWFsbFxuLy8gYW1vdW50IG9mIGlucHV0LCBhbmQgZW5kIHVwIHdpdGggYSB2ZXJ5IGxhcmdlIGFtb3VudCBvZiBvdXRwdXQuICBJblxuLy8gc3VjaCBhIHBhdGhvbG9naWNhbCBpbmZsYXRpbmcgbWVjaGFuaXNtLCB0aGVyZSdkIGJlIG5vIHdheSB0byB0ZWxsXG4vLyB0aGUgc3lzdGVtIHRvIHN0b3AgZG9pbmcgdGhlIHRyYW5zZm9ybS4gIEEgc2luZ2xlIDRNQiB3cml0ZSBjb3VsZFxuLy8gY2F1c2UgdGhlIHN5c3RlbSB0byBydW4gb3V0IG9mIG1lbW9yeS5cbi8vXG4vLyBIb3dldmVyLCBldmVuIGluIHN1Y2ggYSBwYXRob2xvZ2ljYWwgY2FzZSwgb25seSBhIHNpbmdsZSB3cml0dGVuIGNodW5rXG4vLyB3b3VsZCBiZSBjb25zdW1lZCwgYW5kIHRoZW4gdGhlIHJlc3Qgd291bGQgd2FpdCAodW4tdHJhbnNmb3JtZWQpIHVudGlsXG4vLyB0aGUgcmVzdWx0cyBvZiB0aGUgcHJldmlvdXMgdHJhbnNmb3JtZWQgY2h1bmsgd2VyZSBjb25zdW1lZC5cblxuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zZm9ybTtcblxudmFyIER1cGxleCA9IHJlcXVpcmUoJy4vX3N0cmVhbV9kdXBsZXgnKTtcblxuLyo8cmVwbGFjZW1lbnQ+Ki9cbnZhciB1dGlsID0gcmVxdWlyZSgnY29yZS11dGlsLWlzJyk7XG51dGlsLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcbi8qPC9yZXBsYWNlbWVudD4qL1xuXG51dGlsLmluaGVyaXRzKFRyYW5zZm9ybSwgRHVwbGV4KTtcblxuZnVuY3Rpb24gYWZ0ZXJUcmFuc2Zvcm0oZXIsIGRhdGEpIHtcbiAgdmFyIHRzID0gdGhpcy5fdHJhbnNmb3JtU3RhdGU7XG4gIHRzLnRyYW5zZm9ybWluZyA9IGZhbHNlO1xuXG4gIHZhciBjYiA9IHRzLndyaXRlY2I7XG5cbiAgaWYgKCFjYikge1xuICAgIHJldHVybiB0aGlzLmVtaXQoJ2Vycm9yJywgbmV3IEVycm9yKCd3cml0ZSBjYWxsYmFjayBjYWxsZWQgbXVsdGlwbGUgdGltZXMnKSk7XG4gIH1cblxuICB0cy53cml0ZWNodW5rID0gbnVsbDtcbiAgdHMud3JpdGVjYiA9IG51bGw7XG5cbiAgaWYgKGRhdGEgIT0gbnVsbCkgLy8gc2luZ2xlIGVxdWFscyBjaGVjayBmb3IgYm90aCBgbnVsbGAgYW5kIGB1bmRlZmluZWRgXG4gICAgdGhpcy5wdXNoKGRhdGEpO1xuXG4gIGNiKGVyKTtcblxuICB2YXIgcnMgPSB0aGlzLl9yZWFkYWJsZVN0YXRlO1xuICBycy5yZWFkaW5nID0gZmFsc2U7XG4gIGlmIChycy5uZWVkUmVhZGFibGUgfHwgcnMubGVuZ3RoIDwgcnMuaGlnaFdhdGVyTWFyaykge1xuICAgIHRoaXMuX3JlYWQocnMuaGlnaFdhdGVyTWFyayk7XG4gIH1cbn1cblxuZnVuY3Rpb24gVHJhbnNmb3JtKG9wdGlvbnMpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFRyYW5zZm9ybSkpIHJldHVybiBuZXcgVHJhbnNmb3JtKG9wdGlvbnMpO1xuXG4gIER1cGxleC5jYWxsKHRoaXMsIG9wdGlvbnMpO1xuXG4gIHRoaXMuX3RyYW5zZm9ybVN0YXRlID0ge1xuICAgIGFmdGVyVHJhbnNmb3JtOiBhZnRlclRyYW5zZm9ybS5iaW5kKHRoaXMpLFxuICAgIG5lZWRUcmFuc2Zvcm06IGZhbHNlLFxuICAgIHRyYW5zZm9ybWluZzogZmFsc2UsXG4gICAgd3JpdGVjYjogbnVsbCxcbiAgICB3cml0ZWNodW5rOiBudWxsLFxuICAgIHdyaXRlZW5jb2Rpbmc6IG51bGxcbiAgfTtcblxuICAvLyBzdGFydCBvdXQgYXNraW5nIGZvciBhIHJlYWRhYmxlIGV2ZW50IG9uY2UgZGF0YSBpcyB0cmFuc2Zvcm1lZC5cbiAgdGhpcy5fcmVhZGFibGVTdGF0ZS5uZWVkUmVhZGFibGUgPSB0cnVlO1xuXG4gIC8vIHdlIGhhdmUgaW1wbGVtZW50ZWQgdGhlIF9yZWFkIG1ldGhvZCwgYW5kIGRvbmUgdGhlIG90aGVyIHRoaW5nc1xuICAvLyB0aGF0IFJlYWRhYmxlIHdhbnRzIGJlZm9yZSB0aGUgZmlyc3QgX3JlYWQgY2FsbCwgc28gdW5zZXQgdGhlXG4gIC8vIHN5bmMgZ3VhcmQgZmxhZy5cbiAgdGhpcy5fcmVhZGFibGVTdGF0ZS5zeW5jID0gZmFsc2U7XG5cbiAgaWYgKG9wdGlvbnMpIHtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMudHJhbnNmb3JtID09PSAnZnVuY3Rpb24nKSB0aGlzLl90cmFuc2Zvcm0gPSBvcHRpb25zLnRyYW5zZm9ybTtcblxuICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5mbHVzaCA9PT0gJ2Z1bmN0aW9uJykgdGhpcy5fZmx1c2ggPSBvcHRpb25zLmZsdXNoO1xuICB9XG5cbiAgLy8gV2hlbiB0aGUgd3JpdGFibGUgc2lkZSBmaW5pc2hlcywgdGhlbiBmbHVzaCBvdXQgYW55dGhpbmcgcmVtYWluaW5nLlxuICB0aGlzLm9uKCdwcmVmaW5pc2gnLCBwcmVmaW5pc2gpO1xufVxuXG5mdW5jdGlvbiBwcmVmaW5pc2goKSB7XG4gIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgaWYgKHR5cGVvZiB0aGlzLl9mbHVzaCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHRoaXMuX2ZsdXNoKGZ1bmN0aW9uIChlciwgZGF0YSkge1xuICAgICAgZG9uZShfdGhpcywgZXIsIGRhdGEpO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIGRvbmUodGhpcywgbnVsbCwgbnVsbCk7XG4gIH1cbn1cblxuVHJhbnNmb3JtLnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24gKGNodW5rLCBlbmNvZGluZykge1xuICB0aGlzLl90cmFuc2Zvcm1TdGF0ZS5uZWVkVHJhbnNmb3JtID0gZmFsc2U7XG4gIHJldHVybiBEdXBsZXgucHJvdG90eXBlLnB1c2guY2FsbCh0aGlzLCBjaHVuaywgZW5jb2RpbmcpO1xufTtcblxuLy8gVGhpcyBpcyB0aGUgcGFydCB3aGVyZSB5b3UgZG8gc3R1ZmYhXG4vLyBvdmVycmlkZSB0aGlzIGZ1bmN0aW9uIGluIGltcGxlbWVudGF0aW9uIGNsYXNzZXMuXG4vLyAnY2h1bmsnIGlzIGFuIGlucHV0IGNodW5rLlxuLy9cbi8vIENhbGwgYHB1c2gobmV3Q2h1bmspYCB0byBwYXNzIGFsb25nIHRyYW5zZm9ybWVkIG91dHB1dFxuLy8gdG8gdGhlIHJlYWRhYmxlIHNpZGUuICBZb3UgbWF5IGNhbGwgJ3B1c2gnIHplcm8gb3IgbW9yZSB0aW1lcy5cbi8vXG4vLyBDYWxsIGBjYihlcnIpYCB3aGVuIHlvdSBhcmUgZG9uZSB3aXRoIHRoaXMgY2h1bmsuICBJZiB5b3UgcGFzc1xuLy8gYW4gZXJyb3IsIHRoZW4gdGhhdCdsbCBwdXQgdGhlIGh1cnQgb24gdGhlIHdob2xlIG9wZXJhdGlvbi4gIElmIHlvdVxuLy8gbmV2ZXIgY2FsbCBjYigpLCB0aGVuIHlvdSdsbCBuZXZlciBnZXQgYW5vdGhlciBjaHVuay5cblRyYW5zZm9ybS5wcm90b3R5cGUuX3RyYW5zZm9ybSA9IGZ1bmN0aW9uIChjaHVuaywgZW5jb2RpbmcsIGNiKSB7XG4gIHRocm93IG5ldyBFcnJvcignX3RyYW5zZm9ybSgpIGlzIG5vdCBpbXBsZW1lbnRlZCcpO1xufTtcblxuVHJhbnNmb3JtLnByb3RvdHlwZS5fd3JpdGUgPSBmdW5jdGlvbiAoY2h1bmssIGVuY29kaW5nLCBjYikge1xuICB2YXIgdHMgPSB0aGlzLl90cmFuc2Zvcm1TdGF0ZTtcbiAgdHMud3JpdGVjYiA9IGNiO1xuICB0cy53cml0ZWNodW5rID0gY2h1bms7XG4gIHRzLndyaXRlZW5jb2RpbmcgPSBlbmNvZGluZztcbiAgaWYgKCF0cy50cmFuc2Zvcm1pbmcpIHtcbiAgICB2YXIgcnMgPSB0aGlzLl9yZWFkYWJsZVN0YXRlO1xuICAgIGlmICh0cy5uZWVkVHJhbnNmb3JtIHx8IHJzLm5lZWRSZWFkYWJsZSB8fCBycy5sZW5ndGggPCBycy5oaWdoV2F0ZXJNYXJrKSB0aGlzLl9yZWFkKHJzLmhpZ2hXYXRlck1hcmspO1xuICB9XG59O1xuXG4vLyBEb2Vzbid0IG1hdHRlciB3aGF0IHRoZSBhcmdzIGFyZSBoZXJlLlxuLy8gX3RyYW5zZm9ybSBkb2VzIGFsbCB0aGUgd29yay5cbi8vIFRoYXQgd2UgZ290IGhlcmUgbWVhbnMgdGhhdCB0aGUgcmVhZGFibGUgc2lkZSB3YW50cyBtb3JlIGRhdGEuXG5UcmFuc2Zvcm0ucHJvdG90eXBlLl9yZWFkID0gZnVuY3Rpb24gKG4pIHtcbiAgdmFyIHRzID0gdGhpcy5fdHJhbnNmb3JtU3RhdGU7XG5cbiAgaWYgKHRzLndyaXRlY2h1bmsgIT09IG51bGwgJiYgdHMud3JpdGVjYiAmJiAhdHMudHJhbnNmb3JtaW5nKSB7XG4gICAgdHMudHJhbnNmb3JtaW5nID0gdHJ1ZTtcbiAgICB0aGlzLl90cmFuc2Zvcm0odHMud3JpdGVjaHVuaywgdHMud3JpdGVlbmNvZGluZywgdHMuYWZ0ZXJUcmFuc2Zvcm0pO1xuICB9IGVsc2Uge1xuICAgIC8vIG1hcmsgdGhhdCB3ZSBuZWVkIGEgdHJhbnNmb3JtLCBzbyB0aGF0IGFueSBkYXRhIHRoYXQgY29tZXMgaW5cbiAgICAvLyB3aWxsIGdldCBwcm9jZXNzZWQsIG5vdyB0aGF0IHdlJ3ZlIGFza2VkIGZvciBpdC5cbiAgICB0cy5uZWVkVHJhbnNmb3JtID0gdHJ1ZTtcbiAgfVxufTtcblxuVHJhbnNmb3JtLnByb3RvdHlwZS5fZGVzdHJveSA9IGZ1bmN0aW9uIChlcnIsIGNiKSB7XG4gIHZhciBfdGhpczIgPSB0aGlzO1xuXG4gIER1cGxleC5wcm90b3R5cGUuX2Rlc3Ryb3kuY2FsbCh0aGlzLCBlcnIsIGZ1bmN0aW9uIChlcnIyKSB7XG4gICAgY2IoZXJyMik7XG4gICAgX3RoaXMyLmVtaXQoJ2Nsb3NlJyk7XG4gIH0pO1xufTtcblxuZnVuY3Rpb24gZG9uZShzdHJlYW0sIGVyLCBkYXRhKSB7XG4gIGlmIChlcikgcmV0dXJuIHN0cmVhbS5lbWl0KCdlcnJvcicsIGVyKTtcblxuICBpZiAoZGF0YSAhPSBudWxsKSAvLyBzaW5nbGUgZXF1YWxzIGNoZWNrIGZvciBib3RoIGBudWxsYCBhbmQgYHVuZGVmaW5lZGBcbiAgICBzdHJlYW0ucHVzaChkYXRhKTtcblxuICAvLyBpZiB0aGVyZSdzIG5vdGhpbmcgaW4gdGhlIHdyaXRlIGJ1ZmZlciwgdGhlbiB0aGF0IG1lYW5zXG4gIC8vIHRoYXQgbm90aGluZyBtb3JlIHdpbGwgZXZlciBiZSBwcm92aWRlZFxuICBpZiAoc3RyZWFtLl93cml0YWJsZVN0YXRlLmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKCdDYWxsaW5nIHRyYW5zZm9ybSBkb25lIHdoZW4gd3MubGVuZ3RoICE9IDAnKTtcblxuICBpZiAoc3RyZWFtLl90cmFuc2Zvcm1TdGF0ZS50cmFuc2Zvcm1pbmcpIHRocm93IG5ldyBFcnJvcignQ2FsbGluZyB0cmFuc2Zvcm0gZG9uZSB3aGVuIHN0aWxsIHRyYW5zZm9ybWluZycpO1xuXG4gIHJldHVybiBzdHJlYW0ucHVzaChudWxsKTtcbn0iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuLy8gQSBiaXQgc2ltcGxlciB0aGFuIHJlYWRhYmxlIHN0cmVhbXMuXG4vLyBJbXBsZW1lbnQgYW4gYXN5bmMgLl93cml0ZShjaHVuaywgZW5jb2RpbmcsIGNiKSwgYW5kIGl0J2xsIGhhbmRsZSBhbGxcbi8vIHRoZSBkcmFpbiBldmVudCBlbWlzc2lvbiBhbmQgYnVmZmVyaW5nLlxuXG4ndXNlIHN0cmljdCc7XG5cbi8qPHJlcGxhY2VtZW50PiovXG5cbnZhciBwbmEgPSByZXF1aXJlKCdwcm9jZXNzLW5leHRpY2stYXJncycpO1xuLyo8L3JlcGxhY2VtZW50PiovXG5cbm1vZHVsZS5leHBvcnRzID0gV3JpdGFibGU7XG5cbi8qIDxyZXBsYWNlbWVudD4gKi9cbmZ1bmN0aW9uIFdyaXRlUmVxKGNodW5rLCBlbmNvZGluZywgY2IpIHtcbiAgdGhpcy5jaHVuayA9IGNodW5rO1xuICB0aGlzLmVuY29kaW5nID0gZW5jb2Rpbmc7XG4gIHRoaXMuY2FsbGJhY2sgPSBjYjtcbiAgdGhpcy5uZXh0ID0gbnVsbDtcbn1cblxuLy8gSXQgc2VlbXMgYSBsaW5rZWQgbGlzdCBidXQgaXQgaXMgbm90XG4vLyB0aGVyZSB3aWxsIGJlIG9ubHkgMiBvZiB0aGVzZSBmb3IgZWFjaCBzdHJlYW1cbmZ1bmN0aW9uIENvcmtlZFJlcXVlc3Qoc3RhdGUpIHtcbiAgdmFyIF90aGlzID0gdGhpcztcblxuICB0aGlzLm5leHQgPSBudWxsO1xuICB0aGlzLmVudHJ5ID0gbnVsbDtcbiAgdGhpcy5maW5pc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgb25Db3JrZWRGaW5pc2goX3RoaXMsIHN0YXRlKTtcbiAgfTtcbn1cbi8qIDwvcmVwbGFjZW1lbnQ+ICovXG5cbi8qPHJlcGxhY2VtZW50PiovXG52YXIgYXN5bmNXcml0ZSA9ICFwcm9jZXNzLmJyb3dzZXIgJiYgWyd2MC4xMCcsICd2MC45LiddLmluZGV4T2YocHJvY2Vzcy52ZXJzaW9uLnNsaWNlKDAsIDUpKSA+IC0xID8gc2V0SW1tZWRpYXRlIDogcG5hLm5leHRUaWNrO1xuLyo8L3JlcGxhY2VtZW50PiovXG5cbi8qPHJlcGxhY2VtZW50PiovXG52YXIgRHVwbGV4O1xuLyo8L3JlcGxhY2VtZW50PiovXG5cbldyaXRhYmxlLldyaXRhYmxlU3RhdGUgPSBXcml0YWJsZVN0YXRlO1xuXG4vKjxyZXBsYWNlbWVudD4qL1xudmFyIHV0aWwgPSByZXF1aXJlKCdjb3JlLXV0aWwtaXMnKTtcbnV0aWwuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuLyo8L3JlcGxhY2VtZW50PiovXG5cbi8qPHJlcGxhY2VtZW50PiovXG52YXIgaW50ZXJuYWxVdGlsID0ge1xuICBkZXByZWNhdGU6IHJlcXVpcmUoJ3V0aWwtZGVwcmVjYXRlJylcbn07XG4vKjwvcmVwbGFjZW1lbnQ+Ki9cblxuLyo8cmVwbGFjZW1lbnQ+Ki9cbnZhciBTdHJlYW0gPSByZXF1aXJlKCcuL2ludGVybmFsL3N0cmVhbXMvc3RyZWFtJyk7XG4vKjwvcmVwbGFjZW1lbnQ+Ki9cblxuLyo8cmVwbGFjZW1lbnQ+Ki9cblxudmFyIEJ1ZmZlciA9IHJlcXVpcmUoJ3NhZmUtYnVmZmVyJykuQnVmZmVyO1xudmFyIE91clVpbnQ4QXJyYXkgPSBnbG9iYWwuVWludDhBcnJheSB8fCBmdW5jdGlvbiAoKSB7fTtcbmZ1bmN0aW9uIF91aW50OEFycmF5VG9CdWZmZXIoY2h1bmspIHtcbiAgcmV0dXJuIEJ1ZmZlci5mcm9tKGNodW5rKTtcbn1cbmZ1bmN0aW9uIF9pc1VpbnQ4QXJyYXkob2JqKSB7XG4gIHJldHVybiBCdWZmZXIuaXNCdWZmZXIob2JqKSB8fCBvYmogaW5zdGFuY2VvZiBPdXJVaW50OEFycmF5O1xufVxuXG4vKjwvcmVwbGFjZW1lbnQ+Ki9cblxudmFyIGRlc3Ryb3lJbXBsID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9zdHJlYW1zL2Rlc3Ryb3knKTtcblxudXRpbC5pbmhlcml0cyhXcml0YWJsZSwgU3RyZWFtKTtcblxuZnVuY3Rpb24gbm9wKCkge31cblxuZnVuY3Rpb24gV3JpdGFibGVTdGF0ZShvcHRpb25zLCBzdHJlYW0pIHtcbiAgRHVwbGV4ID0gRHVwbGV4IHx8IHJlcXVpcmUoJy4vX3N0cmVhbV9kdXBsZXgnKTtcblxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAvLyBEdXBsZXggc3RyZWFtcyBhcmUgYm90aCByZWFkYWJsZSBhbmQgd3JpdGFibGUsIGJ1dCBzaGFyZVxuICAvLyB0aGUgc2FtZSBvcHRpb25zIG9iamVjdC5cbiAgLy8gSG93ZXZlciwgc29tZSBjYXNlcyByZXF1aXJlIHNldHRpbmcgb3B0aW9ucyB0byBkaWZmZXJlbnRcbiAgLy8gdmFsdWVzIGZvciB0aGUgcmVhZGFibGUgYW5kIHRoZSB3cml0YWJsZSBzaWRlcyBvZiB0aGUgZHVwbGV4IHN0cmVhbS5cbiAgLy8gVGhlc2Ugb3B0aW9ucyBjYW4gYmUgcHJvdmlkZWQgc2VwYXJhdGVseSBhcyByZWFkYWJsZVhYWCBhbmQgd3JpdGFibGVYWFguXG4gIHZhciBpc0R1cGxleCA9IHN0cmVhbSBpbnN0YW5jZW9mIER1cGxleDtcblxuICAvLyBvYmplY3Qgc3RyZWFtIGZsYWcgdG8gaW5kaWNhdGUgd2hldGhlciBvciBub3QgdGhpcyBzdHJlYW1cbiAgLy8gY29udGFpbnMgYnVmZmVycyBvciBvYmplY3RzLlxuICB0aGlzLm9iamVjdE1vZGUgPSAhIW9wdGlvbnMub2JqZWN0TW9kZTtcblxuICBpZiAoaXNEdXBsZXgpIHRoaXMub2JqZWN0TW9kZSA9IHRoaXMub2JqZWN0TW9kZSB8fCAhIW9wdGlvbnMud3JpdGFibGVPYmplY3RNb2RlO1xuXG4gIC8vIHRoZSBwb2ludCBhdCB3aGljaCB3cml0ZSgpIHN0YXJ0cyByZXR1cm5pbmcgZmFsc2VcbiAgLy8gTm90ZTogMCBpcyBhIHZhbGlkIHZhbHVlLCBtZWFucyB0aGF0IHdlIGFsd2F5cyByZXR1cm4gZmFsc2UgaWZcbiAgLy8gdGhlIGVudGlyZSBidWZmZXIgaXMgbm90IGZsdXNoZWQgaW1tZWRpYXRlbHkgb24gd3JpdGUoKVxuICB2YXIgaHdtID0gb3B0aW9ucy5oaWdoV2F0ZXJNYXJrO1xuICB2YXIgd3JpdGFibGVId20gPSBvcHRpb25zLndyaXRhYmxlSGlnaFdhdGVyTWFyaztcbiAgdmFyIGRlZmF1bHRId20gPSB0aGlzLm9iamVjdE1vZGUgPyAxNiA6IDE2ICogMTAyNDtcblxuICBpZiAoaHdtIHx8IGh3bSA9PT0gMCkgdGhpcy5oaWdoV2F0ZXJNYXJrID0gaHdtO2Vsc2UgaWYgKGlzRHVwbGV4ICYmICh3cml0YWJsZUh3bSB8fCB3cml0YWJsZUh3bSA9PT0gMCkpIHRoaXMuaGlnaFdhdGVyTWFyayA9IHdyaXRhYmxlSHdtO2Vsc2UgdGhpcy5oaWdoV2F0ZXJNYXJrID0gZGVmYXVsdEh3bTtcblxuICAvLyBjYXN0IHRvIGludHMuXG4gIHRoaXMuaGlnaFdhdGVyTWFyayA9IE1hdGguZmxvb3IodGhpcy5oaWdoV2F0ZXJNYXJrKTtcblxuICAvLyBpZiBfZmluYWwgaGFzIGJlZW4gY2FsbGVkXG4gIHRoaXMuZmluYWxDYWxsZWQgPSBmYWxzZTtcblxuICAvLyBkcmFpbiBldmVudCBmbGFnLlxuICB0aGlzLm5lZWREcmFpbiA9IGZhbHNlO1xuICAvLyBhdCB0aGUgc3RhcnQgb2YgY2FsbGluZyBlbmQoKVxuICB0aGlzLmVuZGluZyA9IGZhbHNlO1xuICAvLyB3aGVuIGVuZCgpIGhhcyBiZWVuIGNhbGxlZCwgYW5kIHJldHVybmVkXG4gIHRoaXMuZW5kZWQgPSBmYWxzZTtcbiAgLy8gd2hlbiAnZmluaXNoJyBpcyBlbWl0dGVkXG4gIHRoaXMuZmluaXNoZWQgPSBmYWxzZTtcblxuICAvLyBoYXMgaXQgYmVlbiBkZXN0cm95ZWRcbiAgdGhpcy5kZXN0cm95ZWQgPSBmYWxzZTtcblxuICAvLyBzaG91bGQgd2UgZGVjb2RlIHN0cmluZ3MgaW50byBidWZmZXJzIGJlZm9yZSBwYXNzaW5nIHRvIF93cml0ZT9cbiAgLy8gdGhpcyBpcyBoZXJlIHNvIHRoYXQgc29tZSBub2RlLWNvcmUgc3RyZWFtcyBjYW4gb3B0aW1pemUgc3RyaW5nXG4gIC8vIGhhbmRsaW5nIGF0IGEgbG93ZXIgbGV2ZWwuXG4gIHZhciBub0RlY29kZSA9IG9wdGlvbnMuZGVjb2RlU3RyaW5ncyA9PT0gZmFsc2U7XG4gIHRoaXMuZGVjb2RlU3RyaW5ncyA9ICFub0RlY29kZTtcblxuICAvLyBDcnlwdG8gaXMga2luZCBvZiBvbGQgYW5kIGNydXN0eS4gIEhpc3RvcmljYWxseSwgaXRzIGRlZmF1bHQgc3RyaW5nXG4gIC8vIGVuY29kaW5nIGlzICdiaW5hcnknIHNvIHdlIGhhdmUgdG8gbWFrZSB0aGlzIGNvbmZpZ3VyYWJsZS5cbiAgLy8gRXZlcnl0aGluZyBlbHNlIGluIHRoZSB1bml2ZXJzZSB1c2VzICd1dGY4JywgdGhvdWdoLlxuICB0aGlzLmRlZmF1bHRFbmNvZGluZyA9IG9wdGlvbnMuZGVmYXVsdEVuY29kaW5nIHx8ICd1dGY4JztcblxuICAvLyBub3QgYW4gYWN0dWFsIGJ1ZmZlciB3ZSBrZWVwIHRyYWNrIG9mLCBidXQgYSBtZWFzdXJlbWVudFxuICAvLyBvZiBob3cgbXVjaCB3ZSdyZSB3YWl0aW5nIHRvIGdldCBwdXNoZWQgdG8gc29tZSB1bmRlcmx5aW5nXG4gIC8vIHNvY2tldCBvciBmaWxlLlxuICB0aGlzLmxlbmd0aCA9IDA7XG5cbiAgLy8gYSBmbGFnIHRvIHNlZSB3aGVuIHdlJ3JlIGluIHRoZSBtaWRkbGUgb2YgYSB3cml0ZS5cbiAgdGhpcy53cml0aW5nID0gZmFsc2U7XG5cbiAgLy8gd2hlbiB0cnVlIGFsbCB3cml0ZXMgd2lsbCBiZSBidWZmZXJlZCB1bnRpbCAudW5jb3JrKCkgY2FsbFxuICB0aGlzLmNvcmtlZCA9IDA7XG5cbiAgLy8gYSBmbGFnIHRvIGJlIGFibGUgdG8gdGVsbCBpZiB0aGUgb253cml0ZSBjYiBpcyBjYWxsZWQgaW1tZWRpYXRlbHksXG4gIC8vIG9yIG9uIGEgbGF0ZXIgdGljay4gIFdlIHNldCB0aGlzIHRvIHRydWUgYXQgZmlyc3QsIGJlY2F1c2UgYW55XG4gIC8vIGFjdGlvbnMgdGhhdCBzaG91bGRuJ3QgaGFwcGVuIHVudGlsIFwibGF0ZXJcIiBzaG91bGQgZ2VuZXJhbGx5IGFsc29cbiAgLy8gbm90IGhhcHBlbiBiZWZvcmUgdGhlIGZpcnN0IHdyaXRlIGNhbGwuXG4gIHRoaXMuc3luYyA9IHRydWU7XG5cbiAgLy8gYSBmbGFnIHRvIGtub3cgaWYgd2UncmUgcHJvY2Vzc2luZyBwcmV2aW91c2x5IGJ1ZmZlcmVkIGl0ZW1zLCB3aGljaFxuICAvLyBtYXkgY2FsbCB0aGUgX3dyaXRlKCkgY2FsbGJhY2sgaW4gdGhlIHNhbWUgdGljaywgc28gdGhhdCB3ZSBkb24ndFxuICAvLyBlbmQgdXAgaW4gYW4gb3ZlcmxhcHBlZCBvbndyaXRlIHNpdHVhdGlvbi5cbiAgdGhpcy5idWZmZXJQcm9jZXNzaW5nID0gZmFsc2U7XG5cbiAgLy8gdGhlIGNhbGxiYWNrIHRoYXQncyBwYXNzZWQgdG8gX3dyaXRlKGNodW5rLGNiKVxuICB0aGlzLm9ud3JpdGUgPSBmdW5jdGlvbiAoZXIpIHtcbiAgICBvbndyaXRlKHN0cmVhbSwgZXIpO1xuICB9O1xuXG4gIC8vIHRoZSBjYWxsYmFjayB0aGF0IHRoZSB1c2VyIHN1cHBsaWVzIHRvIHdyaXRlKGNodW5rLGVuY29kaW5nLGNiKVxuICB0aGlzLndyaXRlY2IgPSBudWxsO1xuXG4gIC8vIHRoZSBhbW91bnQgdGhhdCBpcyBiZWluZyB3cml0dGVuIHdoZW4gX3dyaXRlIGlzIGNhbGxlZC5cbiAgdGhpcy53cml0ZWxlbiA9IDA7XG5cbiAgdGhpcy5idWZmZXJlZFJlcXVlc3QgPSBudWxsO1xuICB0aGlzLmxhc3RCdWZmZXJlZFJlcXVlc3QgPSBudWxsO1xuXG4gIC8vIG51bWJlciBvZiBwZW5kaW5nIHVzZXItc3VwcGxpZWQgd3JpdGUgY2FsbGJhY2tzXG4gIC8vIHRoaXMgbXVzdCBiZSAwIGJlZm9yZSAnZmluaXNoJyBjYW4gYmUgZW1pdHRlZFxuICB0aGlzLnBlbmRpbmdjYiA9IDA7XG5cbiAgLy8gZW1pdCBwcmVmaW5pc2ggaWYgdGhlIG9ubHkgdGhpbmcgd2UncmUgd2FpdGluZyBmb3IgaXMgX3dyaXRlIGNic1xuICAvLyBUaGlzIGlzIHJlbGV2YW50IGZvciBzeW5jaHJvbm91cyBUcmFuc2Zvcm0gc3RyZWFtc1xuICB0aGlzLnByZWZpbmlzaGVkID0gZmFsc2U7XG5cbiAgLy8gVHJ1ZSBpZiB0aGUgZXJyb3Igd2FzIGFscmVhZHkgZW1pdHRlZCBhbmQgc2hvdWxkIG5vdCBiZSB0aHJvd24gYWdhaW5cbiAgdGhpcy5lcnJvckVtaXR0ZWQgPSBmYWxzZTtcblxuICAvLyBjb3VudCBidWZmZXJlZCByZXF1ZXN0c1xuICB0aGlzLmJ1ZmZlcmVkUmVxdWVzdENvdW50ID0gMDtcblxuICAvLyBhbGxvY2F0ZSB0aGUgZmlyc3QgQ29ya2VkUmVxdWVzdCwgdGhlcmUgaXMgYWx3YXlzXG4gIC8vIG9uZSBhbGxvY2F0ZWQgYW5kIGZyZWUgdG8gdXNlLCBhbmQgd2UgbWFpbnRhaW4gYXQgbW9zdCB0d29cbiAgdGhpcy5jb3JrZWRSZXF1ZXN0c0ZyZWUgPSBuZXcgQ29ya2VkUmVxdWVzdCh0aGlzKTtcbn1cblxuV3JpdGFibGVTdGF0ZS5wcm90b3R5cGUuZ2V0QnVmZmVyID0gZnVuY3Rpb24gZ2V0QnVmZmVyKCkge1xuICB2YXIgY3VycmVudCA9IHRoaXMuYnVmZmVyZWRSZXF1ZXN0O1xuICB2YXIgb3V0ID0gW107XG4gIHdoaWxlIChjdXJyZW50KSB7XG4gICAgb3V0LnB1c2goY3VycmVudCk7XG4gICAgY3VycmVudCA9IGN1cnJlbnQubmV4dDtcbiAgfVxuICByZXR1cm4gb3V0O1xufTtcblxuKGZ1bmN0aW9uICgpIHtcbiAgdHJ5IHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoV3JpdGFibGVTdGF0ZS5wcm90b3R5cGUsICdidWZmZXInLCB7XG4gICAgICBnZXQ6IGludGVybmFsVXRpbC5kZXByZWNhdGUoZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRCdWZmZXIoKTtcbiAgICAgIH0sICdfd3JpdGFibGVTdGF0ZS5idWZmZXIgaXMgZGVwcmVjYXRlZC4gVXNlIF93cml0YWJsZVN0YXRlLmdldEJ1ZmZlciAnICsgJ2luc3RlYWQuJywgJ0RFUDAwMDMnKVxuICAgIH0pO1xuICB9IGNhdGNoIChfKSB7fVxufSkoKTtcblxuLy8gVGVzdCBfd3JpdGFibGVTdGF0ZSBmb3IgaW5oZXJpdGFuY2UgdG8gYWNjb3VudCBmb3IgRHVwbGV4IHN0cmVhbXMsXG4vLyB3aG9zZSBwcm90b3R5cGUgY2hhaW4gb25seSBwb2ludHMgdG8gUmVhZGFibGUuXG52YXIgcmVhbEhhc0luc3RhbmNlO1xuaWYgKHR5cGVvZiBTeW1ib2wgPT09ICdmdW5jdGlvbicgJiYgU3ltYm9sLmhhc0luc3RhbmNlICYmIHR5cGVvZiBGdW5jdGlvbi5wcm90b3R5cGVbU3ltYm9sLmhhc0luc3RhbmNlXSA9PT0gJ2Z1bmN0aW9uJykge1xuICByZWFsSGFzSW5zdGFuY2UgPSBGdW5jdGlvbi5wcm90b3R5cGVbU3ltYm9sLmhhc0luc3RhbmNlXTtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFdyaXRhYmxlLCBTeW1ib2wuaGFzSW5zdGFuY2UsIHtcbiAgICB2YWx1ZTogZnVuY3Rpb24gKG9iamVjdCkge1xuICAgICAgaWYgKHJlYWxIYXNJbnN0YW5jZS5jYWxsKHRoaXMsIG9iamVjdCkpIHJldHVybiB0cnVlO1xuICAgICAgaWYgKHRoaXMgIT09IFdyaXRhYmxlKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgIHJldHVybiBvYmplY3QgJiYgb2JqZWN0Ll93cml0YWJsZVN0YXRlIGluc3RhbmNlb2YgV3JpdGFibGVTdGF0ZTtcbiAgICB9XG4gIH0pO1xufSBlbHNlIHtcbiAgcmVhbEhhc0luc3RhbmNlID0gZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIHJldHVybiBvYmplY3QgaW5zdGFuY2VvZiB0aGlzO1xuICB9O1xufVxuXG5mdW5jdGlvbiBXcml0YWJsZShvcHRpb25zKSB7XG4gIER1cGxleCA9IER1cGxleCB8fCByZXF1aXJlKCcuL19zdHJlYW1fZHVwbGV4Jyk7XG5cbiAgLy8gV3JpdGFibGUgY3RvciBpcyBhcHBsaWVkIHRvIER1cGxleGVzLCB0b28uXG4gIC8vIGByZWFsSGFzSW5zdGFuY2VgIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIHVzaW5nIHBsYWluIGBpbnN0YW5jZW9mYFxuICAvLyB3b3VsZCByZXR1cm4gZmFsc2UsIGFzIG5vIGBfd3JpdGFibGVTdGF0ZWAgcHJvcGVydHkgaXMgYXR0YWNoZWQuXG5cbiAgLy8gVHJ5aW5nIHRvIHVzZSB0aGUgY3VzdG9tIGBpbnN0YW5jZW9mYCBmb3IgV3JpdGFibGUgaGVyZSB3aWxsIGFsc28gYnJlYWsgdGhlXG4gIC8vIE5vZGUuanMgTGF6eVRyYW5zZm9ybSBpbXBsZW1lbnRhdGlvbiwgd2hpY2ggaGFzIGEgbm9uLXRyaXZpYWwgZ2V0dGVyIGZvclxuICAvLyBgX3dyaXRhYmxlU3RhdGVgIHRoYXQgd291bGQgbGVhZCB0byBpbmZpbml0ZSByZWN1cnNpb24uXG4gIGlmICghcmVhbEhhc0luc3RhbmNlLmNhbGwoV3JpdGFibGUsIHRoaXMpICYmICEodGhpcyBpbnN0YW5jZW9mIER1cGxleCkpIHtcbiAgICByZXR1cm4gbmV3IFdyaXRhYmxlKG9wdGlvbnMpO1xuICB9XG5cbiAgdGhpcy5fd3JpdGFibGVTdGF0ZSA9IG5ldyBXcml0YWJsZVN0YXRlKG9wdGlvbnMsIHRoaXMpO1xuXG4gIC8vIGxlZ2FjeS5cbiAgdGhpcy53cml0YWJsZSA9IHRydWU7XG5cbiAgaWYgKG9wdGlvbnMpIHtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMud3JpdGUgPT09ICdmdW5jdGlvbicpIHRoaXMuX3dyaXRlID0gb3B0aW9ucy53cml0ZTtcblxuICAgIGlmICh0eXBlb2Ygb3B0aW9ucy53cml0ZXYgPT09ICdmdW5jdGlvbicpIHRoaXMuX3dyaXRldiA9IG9wdGlvbnMud3JpdGV2O1xuXG4gICAgaWYgKHR5cGVvZiBvcHRpb25zLmRlc3Ryb3kgPT09ICdmdW5jdGlvbicpIHRoaXMuX2Rlc3Ryb3kgPSBvcHRpb25zLmRlc3Ryb3k7XG5cbiAgICBpZiAodHlwZW9mIG9wdGlvbnMuZmluYWwgPT09ICdmdW5jdGlvbicpIHRoaXMuX2ZpbmFsID0gb3B0aW9ucy5maW5hbDtcbiAgfVxuXG4gIFN0cmVhbS5jYWxsKHRoaXMpO1xufVxuXG4vLyBPdGhlcndpc2UgcGVvcGxlIGNhbiBwaXBlIFdyaXRhYmxlIHN0cmVhbXMsIHdoaWNoIGlzIGp1c3Qgd3JvbmcuXG5Xcml0YWJsZS5wcm90b3R5cGUucGlwZSA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5lbWl0KCdlcnJvcicsIG5ldyBFcnJvcignQ2Fubm90IHBpcGUsIG5vdCByZWFkYWJsZScpKTtcbn07XG5cbmZ1bmN0aW9uIHdyaXRlQWZ0ZXJFbmQoc3RyZWFtLCBjYikge1xuICB2YXIgZXIgPSBuZXcgRXJyb3IoJ3dyaXRlIGFmdGVyIGVuZCcpO1xuICAvLyBUT0RPOiBkZWZlciBlcnJvciBldmVudHMgY29uc2lzdGVudGx5IGV2ZXJ5d2hlcmUsIG5vdCBqdXN0IHRoZSBjYlxuICBzdHJlYW0uZW1pdCgnZXJyb3InLCBlcik7XG4gIHBuYS5uZXh0VGljayhjYiwgZXIpO1xufVxuXG4vLyBDaGVja3MgdGhhdCBhIHVzZXItc3VwcGxpZWQgY2h1bmsgaXMgdmFsaWQsIGVzcGVjaWFsbHkgZm9yIHRoZSBwYXJ0aWN1bGFyXG4vLyBtb2RlIHRoZSBzdHJlYW0gaXMgaW4uIEN1cnJlbnRseSB0aGlzIG1lYW5zIHRoYXQgYG51bGxgIGlzIG5ldmVyIGFjY2VwdGVkXG4vLyBhbmQgdW5kZWZpbmVkL25vbi1zdHJpbmcgdmFsdWVzIGFyZSBvbmx5IGFsbG93ZWQgaW4gb2JqZWN0IG1vZGUuXG5mdW5jdGlvbiB2YWxpZENodW5rKHN0cmVhbSwgc3RhdGUsIGNodW5rLCBjYikge1xuICB2YXIgdmFsaWQgPSB0cnVlO1xuICB2YXIgZXIgPSBmYWxzZTtcblxuICBpZiAoY2h1bmsgPT09IG51bGwpIHtcbiAgICBlciA9IG5ldyBUeXBlRXJyb3IoJ01heSBub3Qgd3JpdGUgbnVsbCB2YWx1ZXMgdG8gc3RyZWFtJyk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGNodW5rICE9PSAnc3RyaW5nJyAmJiBjaHVuayAhPT0gdW5kZWZpbmVkICYmICFzdGF0ZS5vYmplY3RNb2RlKSB7XG4gICAgZXIgPSBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIG5vbi1zdHJpbmcvYnVmZmVyIGNodW5rJyk7XG4gIH1cbiAgaWYgKGVyKSB7XG4gICAgc3RyZWFtLmVtaXQoJ2Vycm9yJywgZXIpO1xuICAgIHBuYS5uZXh0VGljayhjYiwgZXIpO1xuICAgIHZhbGlkID0gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHZhbGlkO1xufVxuXG5Xcml0YWJsZS5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbiAoY2h1bmssIGVuY29kaW5nLCBjYikge1xuICB2YXIgc3RhdGUgPSB0aGlzLl93cml0YWJsZVN0YXRlO1xuICB2YXIgcmV0ID0gZmFsc2U7XG4gIHZhciBpc0J1ZiA9ICFzdGF0ZS5vYmplY3RNb2RlICYmIF9pc1VpbnQ4QXJyYXkoY2h1bmspO1xuXG4gIGlmIChpc0J1ZiAmJiAhQnVmZmVyLmlzQnVmZmVyKGNodW5rKSkge1xuICAgIGNodW5rID0gX3VpbnQ4QXJyYXlUb0J1ZmZlcihjaHVuayk7XG4gIH1cblxuICBpZiAodHlwZW9mIGVuY29kaW5nID09PSAnZnVuY3Rpb24nKSB7XG4gICAgY2IgPSBlbmNvZGluZztcbiAgICBlbmNvZGluZyA9IG51bGw7XG4gIH1cblxuICBpZiAoaXNCdWYpIGVuY29kaW5nID0gJ2J1ZmZlcic7ZWxzZSBpZiAoIWVuY29kaW5nKSBlbmNvZGluZyA9IHN0YXRlLmRlZmF1bHRFbmNvZGluZztcblxuICBpZiAodHlwZW9mIGNiICE9PSAnZnVuY3Rpb24nKSBjYiA9IG5vcDtcblxuICBpZiAoc3RhdGUuZW5kZWQpIHdyaXRlQWZ0ZXJFbmQodGhpcywgY2IpO2Vsc2UgaWYgKGlzQnVmIHx8IHZhbGlkQ2h1bmsodGhpcywgc3RhdGUsIGNodW5rLCBjYikpIHtcbiAgICBzdGF0ZS5wZW5kaW5nY2IrKztcbiAgICByZXQgPSB3cml0ZU9yQnVmZmVyKHRoaXMsIHN0YXRlLCBpc0J1ZiwgY2h1bmssIGVuY29kaW5nLCBjYik7XG4gIH1cblxuICByZXR1cm4gcmV0O1xufTtcblxuV3JpdGFibGUucHJvdG90eXBlLmNvcmsgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBzdGF0ZSA9IHRoaXMuX3dyaXRhYmxlU3RhdGU7XG5cbiAgc3RhdGUuY29ya2VkKys7XG59O1xuXG5Xcml0YWJsZS5wcm90b3R5cGUudW5jb3JrID0gZnVuY3Rpb24gKCkge1xuICB2YXIgc3RhdGUgPSB0aGlzLl93cml0YWJsZVN0YXRlO1xuXG4gIGlmIChzdGF0ZS5jb3JrZWQpIHtcbiAgICBzdGF0ZS5jb3JrZWQtLTtcblxuICAgIGlmICghc3RhdGUud3JpdGluZyAmJiAhc3RhdGUuY29ya2VkICYmICFzdGF0ZS5maW5pc2hlZCAmJiAhc3RhdGUuYnVmZmVyUHJvY2Vzc2luZyAmJiBzdGF0ZS5idWZmZXJlZFJlcXVlc3QpIGNsZWFyQnVmZmVyKHRoaXMsIHN0YXRlKTtcbiAgfVxufTtcblxuV3JpdGFibGUucHJvdG90eXBlLnNldERlZmF1bHRFbmNvZGluZyA9IGZ1bmN0aW9uIHNldERlZmF1bHRFbmNvZGluZyhlbmNvZGluZykge1xuICAvLyBub2RlOjpQYXJzZUVuY29kaW5nKCkgcmVxdWlyZXMgbG93ZXIgY2FzZS5cbiAgaWYgKHR5cGVvZiBlbmNvZGluZyA9PT0gJ3N0cmluZycpIGVuY29kaW5nID0gZW5jb2RpbmcudG9Mb3dlckNhc2UoKTtcbiAgaWYgKCEoWydoZXgnLCAndXRmOCcsICd1dGYtOCcsICdhc2NpaScsICdiaW5hcnknLCAnYmFzZTY0JywgJ3VjczInLCAndWNzLTInLCAndXRmMTZsZScsICd1dGYtMTZsZScsICdyYXcnXS5pbmRleE9mKChlbmNvZGluZyArICcnKS50b0xvd2VyQ2FzZSgpKSA+IC0xKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKTtcbiAgdGhpcy5fd3JpdGFibGVTdGF0ZS5kZWZhdWx0RW5jb2RpbmcgPSBlbmNvZGluZztcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5mdW5jdGlvbiBkZWNvZGVDaHVuayhzdGF0ZSwgY2h1bmssIGVuY29kaW5nKSB7XG4gIGlmICghc3RhdGUub2JqZWN0TW9kZSAmJiBzdGF0ZS5kZWNvZGVTdHJpbmdzICE9PSBmYWxzZSAmJiB0eXBlb2YgY2h1bmsgPT09ICdzdHJpbmcnKSB7XG4gICAgY2h1bmsgPSBCdWZmZXIuZnJvbShjaHVuaywgZW5jb2RpbmcpO1xuICB9XG4gIHJldHVybiBjaHVuaztcbn1cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KFdyaXRhYmxlLnByb3RvdHlwZSwgJ3dyaXRhYmxlSGlnaFdhdGVyTWFyaycsIHtcbiAgLy8gbWFraW5nIGl0IGV4cGxpY2l0IHRoaXMgcHJvcGVydHkgaXMgbm90IGVudW1lcmFibGVcbiAgLy8gYmVjYXVzZSBvdGhlcndpc2Ugc29tZSBwcm90b3R5cGUgbWFuaXB1bGF0aW9uIGluXG4gIC8vIHVzZXJsYW5kIHdpbGwgZmFpbFxuICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3dyaXRhYmxlU3RhdGUuaGlnaFdhdGVyTWFyaztcbiAgfVxufSk7XG5cbi8vIGlmIHdlJ3JlIGFscmVhZHkgd3JpdGluZyBzb21ldGhpbmcsIHRoZW4ganVzdCBwdXQgdGhpc1xuLy8gaW4gdGhlIHF1ZXVlLCBhbmQgd2FpdCBvdXIgdHVybi4gIE90aGVyd2lzZSwgY2FsbCBfd3JpdGVcbi8vIElmIHdlIHJldHVybiBmYWxzZSwgdGhlbiB3ZSBuZWVkIGEgZHJhaW4gZXZlbnQsIHNvIHNldCB0aGF0IGZsYWcuXG5mdW5jdGlvbiB3cml0ZU9yQnVmZmVyKHN0cmVhbSwgc3RhdGUsIGlzQnVmLCBjaHVuaywgZW5jb2RpbmcsIGNiKSB7XG4gIGlmICghaXNCdWYpIHtcbiAgICB2YXIgbmV3Q2h1bmsgPSBkZWNvZGVDaHVuayhzdGF0ZSwgY2h1bmssIGVuY29kaW5nKTtcbiAgICBpZiAoY2h1bmsgIT09IG5ld0NodW5rKSB7XG4gICAgICBpc0J1ZiA9IHRydWU7XG4gICAgICBlbmNvZGluZyA9ICdidWZmZXInO1xuICAgICAgY2h1bmsgPSBuZXdDaHVuaztcbiAgICB9XG4gIH1cbiAgdmFyIGxlbiA9IHN0YXRlLm9iamVjdE1vZGUgPyAxIDogY2h1bmsubGVuZ3RoO1xuXG4gIHN0YXRlLmxlbmd0aCArPSBsZW47XG5cbiAgdmFyIHJldCA9IHN0YXRlLmxlbmd0aCA8IHN0YXRlLmhpZ2hXYXRlck1hcms7XG4gIC8vIHdlIG11c3QgZW5zdXJlIHRoYXQgcHJldmlvdXMgbmVlZERyYWluIHdpbGwgbm90IGJlIHJlc2V0IHRvIGZhbHNlLlxuICBpZiAoIXJldCkgc3RhdGUubmVlZERyYWluID0gdHJ1ZTtcblxuICBpZiAoc3RhdGUud3JpdGluZyB8fCBzdGF0ZS5jb3JrZWQpIHtcbiAgICB2YXIgbGFzdCA9IHN0YXRlLmxhc3RCdWZmZXJlZFJlcXVlc3Q7XG4gICAgc3RhdGUubGFzdEJ1ZmZlcmVkUmVxdWVzdCA9IHtcbiAgICAgIGNodW5rOiBjaHVuayxcbiAgICAgIGVuY29kaW5nOiBlbmNvZGluZyxcbiAgICAgIGlzQnVmOiBpc0J1ZixcbiAgICAgIGNhbGxiYWNrOiBjYixcbiAgICAgIG5leHQ6IG51bGxcbiAgICB9O1xuICAgIGlmIChsYXN0KSB7XG4gICAgICBsYXN0Lm5leHQgPSBzdGF0ZS5sYXN0QnVmZmVyZWRSZXF1ZXN0O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdGF0ZS5idWZmZXJlZFJlcXVlc3QgPSBzdGF0ZS5sYXN0QnVmZmVyZWRSZXF1ZXN0O1xuICAgIH1cbiAgICBzdGF0ZS5idWZmZXJlZFJlcXVlc3RDb3VudCArPSAxO1xuICB9IGVsc2Uge1xuICAgIGRvV3JpdGUoc3RyZWFtLCBzdGF0ZSwgZmFsc2UsIGxlbiwgY2h1bmssIGVuY29kaW5nLCBjYik7XG4gIH1cblxuICByZXR1cm4gcmV0O1xufVxuXG5mdW5jdGlvbiBkb1dyaXRlKHN0cmVhbSwgc3RhdGUsIHdyaXRldiwgbGVuLCBjaHVuaywgZW5jb2RpbmcsIGNiKSB7XG4gIHN0YXRlLndyaXRlbGVuID0gbGVuO1xuICBzdGF0ZS53cml0ZWNiID0gY2I7XG4gIHN0YXRlLndyaXRpbmcgPSB0cnVlO1xuICBzdGF0ZS5zeW5jID0gdHJ1ZTtcbiAgaWYgKHdyaXRldikgc3RyZWFtLl93cml0ZXYoY2h1bmssIHN0YXRlLm9ud3JpdGUpO2Vsc2Ugc3RyZWFtLl93cml0ZShjaHVuaywgZW5jb2RpbmcsIHN0YXRlLm9ud3JpdGUpO1xuICBzdGF0ZS5zeW5jID0gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIG9ud3JpdGVFcnJvcihzdHJlYW0sIHN0YXRlLCBzeW5jLCBlciwgY2IpIHtcbiAgLS1zdGF0ZS5wZW5kaW5nY2I7XG5cbiAgaWYgKHN5bmMpIHtcbiAgICAvLyBkZWZlciB0aGUgY2FsbGJhY2sgaWYgd2UgYXJlIGJlaW5nIGNhbGxlZCBzeW5jaHJvbm91c2x5XG4gICAgLy8gdG8gYXZvaWQgcGlsaW5nIHVwIHRoaW5ncyBvbiB0aGUgc3RhY2tcbiAgICBwbmEubmV4dFRpY2soY2IsIGVyKTtcbiAgICAvLyB0aGlzIGNhbiBlbWl0IGZpbmlzaCwgYW5kIGl0IHdpbGwgYWx3YXlzIGhhcHBlblxuICAgIC8vIGFmdGVyIGVycm9yXG4gICAgcG5hLm5leHRUaWNrKGZpbmlzaE1heWJlLCBzdHJlYW0sIHN0YXRlKTtcbiAgICBzdHJlYW0uX3dyaXRhYmxlU3RhdGUuZXJyb3JFbWl0dGVkID0gdHJ1ZTtcbiAgICBzdHJlYW0uZW1pdCgnZXJyb3InLCBlcik7XG4gIH0gZWxzZSB7XG4gICAgLy8gdGhlIGNhbGxlciBleHBlY3QgdGhpcyB0byBoYXBwZW4gYmVmb3JlIGlmXG4gICAgLy8gaXQgaXMgYXN5bmNcbiAgICBjYihlcik7XG4gICAgc3RyZWFtLl93cml0YWJsZVN0YXRlLmVycm9yRW1pdHRlZCA9IHRydWU7XG4gICAgc3RyZWFtLmVtaXQoJ2Vycm9yJywgZXIpO1xuICAgIC8vIHRoaXMgY2FuIGVtaXQgZmluaXNoLCBidXQgZmluaXNoIG11c3RcbiAgICAvLyBhbHdheXMgZm9sbG93IGVycm9yXG4gICAgZmluaXNoTWF5YmUoc3RyZWFtLCBzdGF0ZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gb253cml0ZVN0YXRlVXBkYXRlKHN0YXRlKSB7XG4gIHN0YXRlLndyaXRpbmcgPSBmYWxzZTtcbiAgc3RhdGUud3JpdGVjYiA9IG51bGw7XG4gIHN0YXRlLmxlbmd0aCAtPSBzdGF0ZS53cml0ZWxlbjtcbiAgc3RhdGUud3JpdGVsZW4gPSAwO1xufVxuXG5mdW5jdGlvbiBvbndyaXRlKHN0cmVhbSwgZXIpIHtcbiAgdmFyIHN0YXRlID0gc3RyZWFtLl93cml0YWJsZVN0YXRlO1xuICB2YXIgc3luYyA9IHN0YXRlLnN5bmM7XG4gIHZhciBjYiA9IHN0YXRlLndyaXRlY2I7XG5cbiAgb253cml0ZVN0YXRlVXBkYXRlKHN0YXRlKTtcblxuICBpZiAoZXIpIG9ud3JpdGVFcnJvcihzdHJlYW0sIHN0YXRlLCBzeW5jLCBlciwgY2IpO2Vsc2Uge1xuICAgIC8vIENoZWNrIGlmIHdlJ3JlIGFjdHVhbGx5IHJlYWR5IHRvIGZpbmlzaCwgYnV0IGRvbid0IGVtaXQgeWV0XG4gICAgdmFyIGZpbmlzaGVkID0gbmVlZEZpbmlzaChzdGF0ZSk7XG5cbiAgICBpZiAoIWZpbmlzaGVkICYmICFzdGF0ZS5jb3JrZWQgJiYgIXN0YXRlLmJ1ZmZlclByb2Nlc3NpbmcgJiYgc3RhdGUuYnVmZmVyZWRSZXF1ZXN0KSB7XG4gICAgICBjbGVhckJ1ZmZlcihzdHJlYW0sIHN0YXRlKTtcbiAgICB9XG5cbiAgICBpZiAoc3luYykge1xuICAgICAgLyo8cmVwbGFjZW1lbnQ+Ki9cbiAgICAgIGFzeW5jV3JpdGUoYWZ0ZXJXcml0ZSwgc3RyZWFtLCBzdGF0ZSwgZmluaXNoZWQsIGNiKTtcbiAgICAgIC8qPC9yZXBsYWNlbWVudD4qL1xuICAgIH0gZWxzZSB7XG4gICAgICBhZnRlcldyaXRlKHN0cmVhbSwgc3RhdGUsIGZpbmlzaGVkLCBjYik7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGFmdGVyV3JpdGUoc3RyZWFtLCBzdGF0ZSwgZmluaXNoZWQsIGNiKSB7XG4gIGlmICghZmluaXNoZWQpIG9ud3JpdGVEcmFpbihzdHJlYW0sIHN0YXRlKTtcbiAgc3RhdGUucGVuZGluZ2NiLS07XG4gIGNiKCk7XG4gIGZpbmlzaE1heWJlKHN0cmVhbSwgc3RhdGUpO1xufVxuXG4vLyBNdXN0IGZvcmNlIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCBvbiBuZXh0VGljaywgc28gdGhhdCB3ZSBkb24ndFxuLy8gZW1pdCAnZHJhaW4nIGJlZm9yZSB0aGUgd3JpdGUoKSBjb25zdW1lciBnZXRzIHRoZSAnZmFsc2UnIHJldHVyblxuLy8gdmFsdWUsIGFuZCBoYXMgYSBjaGFuY2UgdG8gYXR0YWNoIGEgJ2RyYWluJyBsaXN0ZW5lci5cbmZ1bmN0aW9uIG9ud3JpdGVEcmFpbihzdHJlYW0sIHN0YXRlKSB7XG4gIGlmIChzdGF0ZS5sZW5ndGggPT09IDAgJiYgc3RhdGUubmVlZERyYWluKSB7XG4gICAgc3RhdGUubmVlZERyYWluID0gZmFsc2U7XG4gICAgc3RyZWFtLmVtaXQoJ2RyYWluJyk7XG4gIH1cbn1cblxuLy8gaWYgdGhlcmUncyBzb21ldGhpbmcgaW4gdGhlIGJ1ZmZlciB3YWl0aW5nLCB0aGVuIHByb2Nlc3MgaXRcbmZ1bmN0aW9uIGNsZWFyQnVmZmVyKHN0cmVhbSwgc3RhdGUpIHtcbiAgc3RhdGUuYnVmZmVyUHJvY2Vzc2luZyA9IHRydWU7XG4gIHZhciBlbnRyeSA9IHN0YXRlLmJ1ZmZlcmVkUmVxdWVzdDtcblxuICBpZiAoc3RyZWFtLl93cml0ZXYgJiYgZW50cnkgJiYgZW50cnkubmV4dCkge1xuICAgIC8vIEZhc3QgY2FzZSwgd3JpdGUgZXZlcnl0aGluZyB1c2luZyBfd3JpdGV2KClcbiAgICB2YXIgbCA9IHN0YXRlLmJ1ZmZlcmVkUmVxdWVzdENvdW50O1xuICAgIHZhciBidWZmZXIgPSBuZXcgQXJyYXkobCk7XG4gICAgdmFyIGhvbGRlciA9IHN0YXRlLmNvcmtlZFJlcXVlc3RzRnJlZTtcbiAgICBob2xkZXIuZW50cnkgPSBlbnRyeTtcblxuICAgIHZhciBjb3VudCA9IDA7XG4gICAgdmFyIGFsbEJ1ZmZlcnMgPSB0cnVlO1xuICAgIHdoaWxlIChlbnRyeSkge1xuICAgICAgYnVmZmVyW2NvdW50XSA9IGVudHJ5O1xuICAgICAgaWYgKCFlbnRyeS5pc0J1ZikgYWxsQnVmZmVycyA9IGZhbHNlO1xuICAgICAgZW50cnkgPSBlbnRyeS5uZXh0O1xuICAgICAgY291bnQgKz0gMTtcbiAgICB9XG4gICAgYnVmZmVyLmFsbEJ1ZmZlcnMgPSBhbGxCdWZmZXJzO1xuXG4gICAgZG9Xcml0ZShzdHJlYW0sIHN0YXRlLCB0cnVlLCBzdGF0ZS5sZW5ndGgsIGJ1ZmZlciwgJycsIGhvbGRlci5maW5pc2gpO1xuXG4gICAgLy8gZG9Xcml0ZSBpcyBhbG1vc3QgYWx3YXlzIGFzeW5jLCBkZWZlciB0aGVzZSB0byBzYXZlIGEgYml0IG9mIHRpbWVcbiAgICAvLyBhcyB0aGUgaG90IHBhdGggZW5kcyB3aXRoIGRvV3JpdGVcbiAgICBzdGF0ZS5wZW5kaW5nY2IrKztcbiAgICBzdGF0ZS5sYXN0QnVmZmVyZWRSZXF1ZXN0ID0gbnVsbDtcbiAgICBpZiAoaG9sZGVyLm5leHQpIHtcbiAgICAgIHN0YXRlLmNvcmtlZFJlcXVlc3RzRnJlZSA9IGhvbGRlci5uZXh0O1xuICAgICAgaG9sZGVyLm5leHQgPSBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdGF0ZS5jb3JrZWRSZXF1ZXN0c0ZyZWUgPSBuZXcgQ29ya2VkUmVxdWVzdChzdGF0ZSk7XG4gICAgfVxuICAgIHN0YXRlLmJ1ZmZlcmVkUmVxdWVzdENvdW50ID0gMDtcbiAgfSBlbHNlIHtcbiAgICAvLyBTbG93IGNhc2UsIHdyaXRlIGNodW5rcyBvbmUtYnktb25lXG4gICAgd2hpbGUgKGVudHJ5KSB7XG4gICAgICB2YXIgY2h1bmsgPSBlbnRyeS5jaHVuaztcbiAgICAgIHZhciBlbmNvZGluZyA9IGVudHJ5LmVuY29kaW5nO1xuICAgICAgdmFyIGNiID0gZW50cnkuY2FsbGJhY2s7XG4gICAgICB2YXIgbGVuID0gc3RhdGUub2JqZWN0TW9kZSA/IDEgOiBjaHVuay5sZW5ndGg7XG5cbiAgICAgIGRvV3JpdGUoc3RyZWFtLCBzdGF0ZSwgZmFsc2UsIGxlbiwgY2h1bmssIGVuY29kaW5nLCBjYik7XG4gICAgICBlbnRyeSA9IGVudHJ5Lm5leHQ7XG4gICAgICBzdGF0ZS5idWZmZXJlZFJlcXVlc3RDb3VudC0tO1xuICAgICAgLy8gaWYgd2UgZGlkbid0IGNhbGwgdGhlIG9ud3JpdGUgaW1tZWRpYXRlbHksIHRoZW5cbiAgICAgIC8vIGl0IG1lYW5zIHRoYXQgd2UgbmVlZCB0byB3YWl0IHVudGlsIGl0IGRvZXMuXG4gICAgICAvLyBhbHNvLCB0aGF0IG1lYW5zIHRoYXQgdGhlIGNodW5rIGFuZCBjYiBhcmUgY3VycmVudGx5XG4gICAgICAvLyBiZWluZyBwcm9jZXNzZWQsIHNvIG1vdmUgdGhlIGJ1ZmZlciBjb3VudGVyIHBhc3QgdGhlbS5cbiAgICAgIGlmIChzdGF0ZS53cml0aW5nKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChlbnRyeSA9PT0gbnVsbCkgc3RhdGUubGFzdEJ1ZmZlcmVkUmVxdWVzdCA9IG51bGw7XG4gIH1cblxuICBzdGF0ZS5idWZmZXJlZFJlcXVlc3QgPSBlbnRyeTtcbiAgc3RhdGUuYnVmZmVyUHJvY2Vzc2luZyA9IGZhbHNlO1xufVxuXG5Xcml0YWJsZS5wcm90b3R5cGUuX3dyaXRlID0gZnVuY3Rpb24gKGNodW5rLCBlbmNvZGluZywgY2IpIHtcbiAgY2IobmV3IEVycm9yKCdfd3JpdGUoKSBpcyBub3QgaW1wbGVtZW50ZWQnKSk7XG59O1xuXG5Xcml0YWJsZS5wcm90b3R5cGUuX3dyaXRldiA9IG51bGw7XG5cbldyaXRhYmxlLnByb3RvdHlwZS5lbmQgPSBmdW5jdGlvbiAoY2h1bmssIGVuY29kaW5nLCBjYikge1xuICB2YXIgc3RhdGUgPSB0aGlzLl93cml0YWJsZVN0YXRlO1xuXG4gIGlmICh0eXBlb2YgY2h1bmsgPT09ICdmdW5jdGlvbicpIHtcbiAgICBjYiA9IGNodW5rO1xuICAgIGNodW5rID0gbnVsbDtcbiAgICBlbmNvZGluZyA9IG51bGw7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGVuY29kaW5nID09PSAnZnVuY3Rpb24nKSB7XG4gICAgY2IgPSBlbmNvZGluZztcbiAgICBlbmNvZGluZyA9IG51bGw7XG4gIH1cblxuICBpZiAoY2h1bmsgIT09IG51bGwgJiYgY2h1bmsgIT09IHVuZGVmaW5lZCkgdGhpcy53cml0ZShjaHVuaywgZW5jb2RpbmcpO1xuXG4gIC8vIC5lbmQoKSBmdWxseSB1bmNvcmtzXG4gIGlmIChzdGF0ZS5jb3JrZWQpIHtcbiAgICBzdGF0ZS5jb3JrZWQgPSAxO1xuICAgIHRoaXMudW5jb3JrKCk7XG4gIH1cblxuICAvLyBpZ25vcmUgdW5uZWNlc3NhcnkgZW5kKCkgY2FsbHMuXG4gIGlmICghc3RhdGUuZW5kaW5nICYmICFzdGF0ZS5maW5pc2hlZCkgZW5kV3JpdGFibGUodGhpcywgc3RhdGUsIGNiKTtcbn07XG5cbmZ1bmN0aW9uIG5lZWRGaW5pc2goc3RhdGUpIHtcbiAgcmV0dXJuIHN0YXRlLmVuZGluZyAmJiBzdGF0ZS5sZW5ndGggPT09IDAgJiYgc3RhdGUuYnVmZmVyZWRSZXF1ZXN0ID09PSBudWxsICYmICFzdGF0ZS5maW5pc2hlZCAmJiAhc3RhdGUud3JpdGluZztcbn1cbmZ1bmN0aW9uIGNhbGxGaW5hbChzdHJlYW0sIHN0YXRlKSB7XG4gIHN0cmVhbS5fZmluYWwoZnVuY3Rpb24gKGVycikge1xuICAgIHN0YXRlLnBlbmRpbmdjYi0tO1xuICAgIGlmIChlcnIpIHtcbiAgICAgIHN0cmVhbS5lbWl0KCdlcnJvcicsIGVycik7XG4gICAgfVxuICAgIHN0YXRlLnByZWZpbmlzaGVkID0gdHJ1ZTtcbiAgICBzdHJlYW0uZW1pdCgncHJlZmluaXNoJyk7XG4gICAgZmluaXNoTWF5YmUoc3RyZWFtLCBzdGF0ZSk7XG4gIH0pO1xufVxuZnVuY3Rpb24gcHJlZmluaXNoKHN0cmVhbSwgc3RhdGUpIHtcbiAgaWYgKCFzdGF0ZS5wcmVmaW5pc2hlZCAmJiAhc3RhdGUuZmluYWxDYWxsZWQpIHtcbiAgICBpZiAodHlwZW9mIHN0cmVhbS5fZmluYWwgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHN0YXRlLnBlbmRpbmdjYisrO1xuICAgICAgc3RhdGUuZmluYWxDYWxsZWQgPSB0cnVlO1xuICAgICAgcG5hLm5leHRUaWNrKGNhbGxGaW5hbCwgc3RyZWFtLCBzdGF0ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0YXRlLnByZWZpbmlzaGVkID0gdHJ1ZTtcbiAgICAgIHN0cmVhbS5lbWl0KCdwcmVmaW5pc2gnKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZmluaXNoTWF5YmUoc3RyZWFtLCBzdGF0ZSkge1xuICB2YXIgbmVlZCA9IG5lZWRGaW5pc2goc3RhdGUpO1xuICBpZiAobmVlZCkge1xuICAgIHByZWZpbmlzaChzdHJlYW0sIHN0YXRlKTtcbiAgICBpZiAoc3RhdGUucGVuZGluZ2NiID09PSAwKSB7XG4gICAgICBzdGF0ZS5maW5pc2hlZCA9IHRydWU7XG4gICAgICBzdHJlYW0uZW1pdCgnZmluaXNoJyk7XG4gICAgfVxuICB9XG4gIHJldHVybiBuZWVkO1xufVxuXG5mdW5jdGlvbiBlbmRXcml0YWJsZShzdHJlYW0sIHN0YXRlLCBjYikge1xuICBzdGF0ZS5lbmRpbmcgPSB0cnVlO1xuICBmaW5pc2hNYXliZShzdHJlYW0sIHN0YXRlKTtcbiAgaWYgKGNiKSB7XG4gICAgaWYgKHN0YXRlLmZpbmlzaGVkKSBwbmEubmV4dFRpY2soY2IpO2Vsc2Ugc3RyZWFtLm9uY2UoJ2ZpbmlzaCcsIGNiKTtcbiAgfVxuICBzdGF0ZS5lbmRlZCA9IHRydWU7XG4gIHN0cmVhbS53cml0YWJsZSA9IGZhbHNlO1xufVxuXG5mdW5jdGlvbiBvbkNvcmtlZEZpbmlzaChjb3JrUmVxLCBzdGF0ZSwgZXJyKSB7XG4gIHZhciBlbnRyeSA9IGNvcmtSZXEuZW50cnk7XG4gIGNvcmtSZXEuZW50cnkgPSBudWxsO1xuICB3aGlsZSAoZW50cnkpIHtcbiAgICB2YXIgY2IgPSBlbnRyeS5jYWxsYmFjaztcbiAgICBzdGF0ZS5wZW5kaW5nY2ItLTtcbiAgICBjYihlcnIpO1xuICAgIGVudHJ5ID0gZW50cnkubmV4dDtcbiAgfVxuICBpZiAoc3RhdGUuY29ya2VkUmVxdWVzdHNGcmVlKSB7XG4gICAgc3RhdGUuY29ya2VkUmVxdWVzdHNGcmVlLm5leHQgPSBjb3JrUmVxO1xuICB9IGVsc2Uge1xuICAgIHN0YXRlLmNvcmtlZFJlcXVlc3RzRnJlZSA9IGNvcmtSZXE7XG4gIH1cbn1cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KFdyaXRhYmxlLnByb3RvdHlwZSwgJ2Rlc3Ryb3llZCcsIHtcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuX3dyaXRhYmxlU3RhdGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fd3JpdGFibGVTdGF0ZS5kZXN0cm95ZWQ7XG4gIH0sXG4gIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgLy8gd2UgaWdub3JlIHRoZSB2YWx1ZSBpZiB0aGUgc3RyZWFtXG4gICAgLy8gaGFzIG5vdCBiZWVuIGluaXRpYWxpemVkIHlldFxuICAgIGlmICghdGhpcy5fd3JpdGFibGVTdGF0ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGJhY2t3YXJkIGNvbXBhdGliaWxpdHksIHRoZSB1c2VyIGlzIGV4cGxpY2l0bHlcbiAgICAvLyBtYW5hZ2luZyBkZXN0cm95ZWRcbiAgICB0aGlzLl93cml0YWJsZVN0YXRlLmRlc3Ryb3llZCA9IHZhbHVlO1xuICB9XG59KTtcblxuV3JpdGFibGUucHJvdG90eXBlLmRlc3Ryb3kgPSBkZXN0cm95SW1wbC5kZXN0cm95O1xuV3JpdGFibGUucHJvdG90eXBlLl91bmRlc3Ryb3kgPSBkZXN0cm95SW1wbC51bmRlc3Ryb3k7XG5Xcml0YWJsZS5wcm90b3R5cGUuX2Rlc3Ryb3kgPSBmdW5jdGlvbiAoZXJyLCBjYikge1xuICB0aGlzLmVuZCgpO1xuICBjYihlcnIpO1xufTsiLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbnZhciBCdWZmZXIgPSByZXF1aXJlKCdzYWZlLWJ1ZmZlcicpLkJ1ZmZlcjtcbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xuXG5mdW5jdGlvbiBjb3B5QnVmZmVyKHNyYywgdGFyZ2V0LCBvZmZzZXQpIHtcbiAgc3JjLmNvcHkodGFyZ2V0LCBvZmZzZXQpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gQnVmZmVyTGlzdCgpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgQnVmZmVyTGlzdCk7XG5cbiAgICB0aGlzLmhlYWQgPSBudWxsO1xuICAgIHRoaXMudGFpbCA9IG51bGw7XG4gICAgdGhpcy5sZW5ndGggPSAwO1xuICB9XG5cbiAgQnVmZmVyTGlzdC5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uIHB1c2godikge1xuICAgIHZhciBlbnRyeSA9IHsgZGF0YTogdiwgbmV4dDogbnVsbCB9O1xuICAgIGlmICh0aGlzLmxlbmd0aCA+IDApIHRoaXMudGFpbC5uZXh0ID0gZW50cnk7ZWxzZSB0aGlzLmhlYWQgPSBlbnRyeTtcbiAgICB0aGlzLnRhaWwgPSBlbnRyeTtcbiAgICArK3RoaXMubGVuZ3RoO1xuICB9O1xuXG4gIEJ1ZmZlckxpc3QucHJvdG90eXBlLnVuc2hpZnQgPSBmdW5jdGlvbiB1bnNoaWZ0KHYpIHtcbiAgICB2YXIgZW50cnkgPSB7IGRhdGE6IHYsIG5leHQ6IHRoaXMuaGVhZCB9O1xuICAgIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkgdGhpcy50YWlsID0gZW50cnk7XG4gICAgdGhpcy5oZWFkID0gZW50cnk7XG4gICAgKyt0aGlzLmxlbmd0aDtcbiAgfTtcblxuICBCdWZmZXJMaXN0LnByb3RvdHlwZS5zaGlmdCA9IGZ1bmN0aW9uIHNoaWZ0KCkge1xuICAgIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuICAgIHZhciByZXQgPSB0aGlzLmhlYWQuZGF0YTtcbiAgICBpZiAodGhpcy5sZW5ndGggPT09IDEpIHRoaXMuaGVhZCA9IHRoaXMudGFpbCA9IG51bGw7ZWxzZSB0aGlzLmhlYWQgPSB0aGlzLmhlYWQubmV4dDtcbiAgICAtLXRoaXMubGVuZ3RoO1xuICAgIHJldHVybiByZXQ7XG4gIH07XG5cbiAgQnVmZmVyTGlzdC5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbiBjbGVhcigpIHtcbiAgICB0aGlzLmhlYWQgPSB0aGlzLnRhaWwgPSBudWxsO1xuICAgIHRoaXMubGVuZ3RoID0gMDtcbiAgfTtcblxuICBCdWZmZXJMaXN0LnByb3RvdHlwZS5qb2luID0gZnVuY3Rpb24gam9pbihzKSB7XG4gICAgaWYgKHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm4gJyc7XG4gICAgdmFyIHAgPSB0aGlzLmhlYWQ7XG4gICAgdmFyIHJldCA9ICcnICsgcC5kYXRhO1xuICAgIHdoaWxlIChwID0gcC5uZXh0KSB7XG4gICAgICByZXQgKz0gcyArIHAuZGF0YTtcbiAgICB9cmV0dXJuIHJldDtcbiAgfTtcblxuICBCdWZmZXJMaXN0LnByb3RvdHlwZS5jb25jYXQgPSBmdW5jdGlvbiBjb25jYXQobikge1xuICAgIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIEJ1ZmZlci5hbGxvYygwKTtcbiAgICBpZiAodGhpcy5sZW5ndGggPT09IDEpIHJldHVybiB0aGlzLmhlYWQuZGF0YTtcbiAgICB2YXIgcmV0ID0gQnVmZmVyLmFsbG9jVW5zYWZlKG4gPj4+IDApO1xuICAgIHZhciBwID0gdGhpcy5oZWFkO1xuICAgIHZhciBpID0gMDtcbiAgICB3aGlsZSAocCkge1xuICAgICAgY29weUJ1ZmZlcihwLmRhdGEsIHJldCwgaSk7XG4gICAgICBpICs9IHAuZGF0YS5sZW5ndGg7XG4gICAgICBwID0gcC5uZXh0O1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9O1xuXG4gIHJldHVybiBCdWZmZXJMaXN0O1xufSgpO1xuXG5pZiAodXRpbCAmJiB1dGlsLmluc3BlY3QgJiYgdXRpbC5pbnNwZWN0LmN1c3RvbSkge1xuICBtb2R1bGUuZXhwb3J0cy5wcm90b3R5cGVbdXRpbC5pbnNwZWN0LmN1c3RvbV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG9iaiA9IHV0aWwuaW5zcGVjdCh7IGxlbmd0aDogdGhpcy5sZW5ndGggfSk7XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IubmFtZSArICcgJyArIG9iajtcbiAgfTtcbn0iLCIndXNlIHN0cmljdCc7XG5cbi8qPHJlcGxhY2VtZW50PiovXG5cbnZhciBwbmEgPSByZXF1aXJlKCdwcm9jZXNzLW5leHRpY2stYXJncycpO1xuLyo8L3JlcGxhY2VtZW50PiovXG5cbi8vIHVuZG9jdW1lbnRlZCBjYigpIEFQSSwgbmVlZGVkIGZvciBjb3JlLCBub3QgZm9yIHB1YmxpYyBBUElcbmZ1bmN0aW9uIGRlc3Ryb3koZXJyLCBjYikge1xuICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gIHZhciByZWFkYWJsZURlc3Ryb3llZCA9IHRoaXMuX3JlYWRhYmxlU3RhdGUgJiYgdGhpcy5fcmVhZGFibGVTdGF0ZS5kZXN0cm95ZWQ7XG4gIHZhciB3cml0YWJsZURlc3Ryb3llZCA9IHRoaXMuX3dyaXRhYmxlU3RhdGUgJiYgdGhpcy5fd3JpdGFibGVTdGF0ZS5kZXN0cm95ZWQ7XG5cbiAgaWYgKHJlYWRhYmxlRGVzdHJveWVkIHx8IHdyaXRhYmxlRGVzdHJveWVkKSB7XG4gICAgaWYgKGNiKSB7XG4gICAgICBjYihlcnIpO1xuICAgIH0gZWxzZSBpZiAoZXJyICYmICghdGhpcy5fd3JpdGFibGVTdGF0ZSB8fCAhdGhpcy5fd3JpdGFibGVTdGF0ZS5lcnJvckVtaXR0ZWQpKSB7XG4gICAgICBwbmEubmV4dFRpY2soZW1pdEVycm9yTlQsIHRoaXMsIGVycik7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gd2Ugc2V0IGRlc3Ryb3llZCB0byB0cnVlIGJlZm9yZSBmaXJpbmcgZXJyb3IgY2FsbGJhY2tzIGluIG9yZGVyXG4gIC8vIHRvIG1ha2UgaXQgcmUtZW50cmFuY2Ugc2FmZSBpbiBjYXNlIGRlc3Ryb3koKSBpcyBjYWxsZWQgd2l0aGluIGNhbGxiYWNrc1xuXG4gIGlmICh0aGlzLl9yZWFkYWJsZVN0YXRlKSB7XG4gICAgdGhpcy5fcmVhZGFibGVTdGF0ZS5kZXN0cm95ZWQgPSB0cnVlO1xuICB9XG5cbiAgLy8gaWYgdGhpcyBpcyBhIGR1cGxleCBzdHJlYW0gbWFyayB0aGUgd3JpdGFibGUgcGFydCBhcyBkZXN0cm95ZWQgYXMgd2VsbFxuICBpZiAodGhpcy5fd3JpdGFibGVTdGF0ZSkge1xuICAgIHRoaXMuX3dyaXRhYmxlU3RhdGUuZGVzdHJveWVkID0gdHJ1ZTtcbiAgfVxuXG4gIHRoaXMuX2Rlc3Ryb3koZXJyIHx8IG51bGwsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICBpZiAoIWNiICYmIGVycikge1xuICAgICAgcG5hLm5leHRUaWNrKGVtaXRFcnJvck5ULCBfdGhpcywgZXJyKTtcbiAgICAgIGlmIChfdGhpcy5fd3JpdGFibGVTdGF0ZSkge1xuICAgICAgICBfdGhpcy5fd3JpdGFibGVTdGF0ZS5lcnJvckVtaXR0ZWQgPSB0cnVlO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoY2IpIHtcbiAgICAgIGNiKGVycik7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gdGhpcztcbn1cblxuZnVuY3Rpb24gdW5kZXN0cm95KCkge1xuICBpZiAodGhpcy5fcmVhZGFibGVTdGF0ZSkge1xuICAgIHRoaXMuX3JlYWRhYmxlU3RhdGUuZGVzdHJveWVkID0gZmFsc2U7XG4gICAgdGhpcy5fcmVhZGFibGVTdGF0ZS5yZWFkaW5nID0gZmFsc2U7XG4gICAgdGhpcy5fcmVhZGFibGVTdGF0ZS5lbmRlZCA9IGZhbHNlO1xuICAgIHRoaXMuX3JlYWRhYmxlU3RhdGUuZW5kRW1pdHRlZCA9IGZhbHNlO1xuICB9XG5cbiAgaWYgKHRoaXMuX3dyaXRhYmxlU3RhdGUpIHtcbiAgICB0aGlzLl93cml0YWJsZVN0YXRlLmRlc3Ryb3llZCA9IGZhbHNlO1xuICAgIHRoaXMuX3dyaXRhYmxlU3RhdGUuZW5kZWQgPSBmYWxzZTtcbiAgICB0aGlzLl93cml0YWJsZVN0YXRlLmVuZGluZyA9IGZhbHNlO1xuICAgIHRoaXMuX3dyaXRhYmxlU3RhdGUuZmluaXNoZWQgPSBmYWxzZTtcbiAgICB0aGlzLl93cml0YWJsZVN0YXRlLmVycm9yRW1pdHRlZCA9IGZhbHNlO1xuICB9XG59XG5cbmZ1bmN0aW9uIGVtaXRFcnJvck5UKHNlbGYsIGVycikge1xuICBzZWxmLmVtaXQoJ2Vycm9yJywgZXJyKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGRlc3Ryb3k6IGRlc3Ryb3ksXG4gIHVuZGVzdHJveTogdW5kZXN0cm95XG59OyIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyO1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3JlYWRhYmxlJykuUGFzc1Rocm91Z2hcbiIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vbGliL19zdHJlYW1fcmVhZGFibGUuanMnKTtcbmV4cG9ydHMuU3RyZWFtID0gZXhwb3J0cztcbmV4cG9ydHMuUmVhZGFibGUgPSBleHBvcnRzO1xuZXhwb3J0cy5Xcml0YWJsZSA9IHJlcXVpcmUoJy4vbGliL19zdHJlYW1fd3JpdGFibGUuanMnKTtcbmV4cG9ydHMuRHVwbGV4ID0gcmVxdWlyZSgnLi9saWIvX3N0cmVhbV9kdXBsZXguanMnKTtcbmV4cG9ydHMuVHJhbnNmb3JtID0gcmVxdWlyZSgnLi9saWIvX3N0cmVhbV90cmFuc2Zvcm0uanMnKTtcbmV4cG9ydHMuUGFzc1Rocm91Z2ggPSByZXF1aXJlKCcuL2xpYi9fc3RyZWFtX3Bhc3N0aHJvdWdoLmpzJyk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vcmVhZGFibGUnKS5UcmFuc2Zvcm1cbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9saWIvX3N0cmVhbV93cml0YWJsZS5qcycpO1xuIiwiLyogZXNsaW50LWRpc2FibGUgbm9kZS9uby1kZXByZWNhdGVkLWFwaSAqL1xudmFyIGJ1ZmZlciA9IHJlcXVpcmUoJ2J1ZmZlcicpXG52YXIgQnVmZmVyID0gYnVmZmVyLkJ1ZmZlclxuXG4vLyBhbHRlcm5hdGl2ZSB0byB1c2luZyBPYmplY3Qua2V5cyBmb3Igb2xkIGJyb3dzZXJzXG5mdW5jdGlvbiBjb3B5UHJvcHMgKHNyYywgZHN0KSB7XG4gIGZvciAodmFyIGtleSBpbiBzcmMpIHtcbiAgICBkc3Rba2V5XSA9IHNyY1trZXldXG4gIH1cbn1cbmlmIChCdWZmZXIuZnJvbSAmJiBCdWZmZXIuYWxsb2MgJiYgQnVmZmVyLmFsbG9jVW5zYWZlICYmIEJ1ZmZlci5hbGxvY1Vuc2FmZVNsb3cpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBidWZmZXJcbn0gZWxzZSB7XG4gIC8vIENvcHkgcHJvcGVydGllcyBmcm9tIHJlcXVpcmUoJ2J1ZmZlcicpXG4gIGNvcHlQcm9wcyhidWZmZXIsIGV4cG9ydHMpXG4gIGV4cG9ydHMuQnVmZmVyID0gU2FmZUJ1ZmZlclxufVxuXG5mdW5jdGlvbiBTYWZlQnVmZmVyIChhcmcsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gQnVmZmVyKGFyZywgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxufVxuXG4vLyBDb3B5IHN0YXRpYyBtZXRob2RzIGZyb20gQnVmZmVyXG5jb3B5UHJvcHMoQnVmZmVyLCBTYWZlQnVmZmVyKVxuXG5TYWZlQnVmZmVyLmZyb20gPSBmdW5jdGlvbiAoYXJnLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpIHtcbiAgaWYgKHR5cGVvZiBhcmcgPT09ICdudW1iZXInKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBub3QgYmUgYSBudW1iZXInKVxuICB9XG4gIHJldHVybiBCdWZmZXIoYXJnLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG59XG5cblNhZmVCdWZmZXIuYWxsb2MgPSBmdW5jdGlvbiAoc2l6ZSwgZmlsbCwgZW5jb2RpbmcpIHtcbiAgaWYgKHR5cGVvZiBzaXplICE9PSAnbnVtYmVyJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IG11c3QgYmUgYSBudW1iZXInKVxuICB9XG4gIHZhciBidWYgPSBCdWZmZXIoc2l6ZSlcbiAgaWYgKGZpbGwgIT09IHVuZGVmaW5lZCkge1xuICAgIGlmICh0eXBlb2YgZW5jb2RpbmcgPT09ICdzdHJpbmcnKSB7XG4gICAgICBidWYuZmlsbChmaWxsLCBlbmNvZGluZylcbiAgICB9IGVsc2Uge1xuICAgICAgYnVmLmZpbGwoZmlsbClcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgYnVmLmZpbGwoMClcbiAgfVxuICByZXR1cm4gYnVmXG59XG5cblNhZmVCdWZmZXIuYWxsb2NVbnNhZmUgPSBmdW5jdGlvbiAoc2l6ZSkge1xuICBpZiAodHlwZW9mIHNpemUgIT09ICdudW1iZXInKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIG51bWJlcicpXG4gIH1cbiAgcmV0dXJuIEJ1ZmZlcihzaXplKVxufVxuXG5TYWZlQnVmZmVyLmFsbG9jVW5zYWZlU2xvdyA9IGZ1bmN0aW9uIChzaXplKSB7XG4gIGlmICh0eXBlb2Ygc2l6ZSAhPT0gJ251bWJlcicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudCBtdXN0IGJlIGEgbnVtYmVyJylcbiAgfVxuICByZXR1cm4gYnVmZmVyLlNsb3dCdWZmZXIoc2l6ZSlcbn1cbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG5tb2R1bGUuZXhwb3J0cyA9IFN0cmVhbTtcblxudmFyIEVFID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyO1xudmFyIGluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuaW5oZXJpdHMoU3RyZWFtLCBFRSk7XG5TdHJlYW0uUmVhZGFibGUgPSByZXF1aXJlKCdyZWFkYWJsZS1zdHJlYW0vcmVhZGFibGUuanMnKTtcblN0cmVhbS5Xcml0YWJsZSA9IHJlcXVpcmUoJ3JlYWRhYmxlLXN0cmVhbS93cml0YWJsZS5qcycpO1xuU3RyZWFtLkR1cGxleCA9IHJlcXVpcmUoJ3JlYWRhYmxlLXN0cmVhbS9kdXBsZXguanMnKTtcblN0cmVhbS5UcmFuc2Zvcm0gPSByZXF1aXJlKCdyZWFkYWJsZS1zdHJlYW0vdHJhbnNmb3JtLmpzJyk7XG5TdHJlYW0uUGFzc1Rocm91Z2ggPSByZXF1aXJlKCdyZWFkYWJsZS1zdHJlYW0vcGFzc3Rocm91Z2guanMnKTtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC40LnhcblN0cmVhbS5TdHJlYW0gPSBTdHJlYW07XG5cblxuXG4vLyBvbGQtc3R5bGUgc3RyZWFtcy4gIE5vdGUgdGhhdCB0aGUgcGlwZSBtZXRob2QgKHRoZSBvbmx5IHJlbGV2YW50XG4vLyBwYXJ0IG9mIHRoaXMgY2xhc3MpIGlzIG92ZXJyaWRkZW4gaW4gdGhlIFJlYWRhYmxlIGNsYXNzLlxuXG5mdW5jdGlvbiBTdHJlYW0oKSB7XG4gIEVFLmNhbGwodGhpcyk7XG59XG5cblN0cmVhbS5wcm90b3R5cGUucGlwZSA9IGZ1bmN0aW9uKGRlc3QsIG9wdGlvbnMpIHtcbiAgdmFyIHNvdXJjZSA9IHRoaXM7XG5cbiAgZnVuY3Rpb24gb25kYXRhKGNodW5rKSB7XG4gICAgaWYgKGRlc3Qud3JpdGFibGUpIHtcbiAgICAgIGlmIChmYWxzZSA9PT0gZGVzdC53cml0ZShjaHVuaykgJiYgc291cmNlLnBhdXNlKSB7XG4gICAgICAgIHNvdXJjZS5wYXVzZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHNvdXJjZS5vbignZGF0YScsIG9uZGF0YSk7XG5cbiAgZnVuY3Rpb24gb25kcmFpbigpIHtcbiAgICBpZiAoc291cmNlLnJlYWRhYmxlICYmIHNvdXJjZS5yZXN1bWUpIHtcbiAgICAgIHNvdXJjZS5yZXN1bWUoKTtcbiAgICB9XG4gIH1cblxuICBkZXN0Lm9uKCdkcmFpbicsIG9uZHJhaW4pO1xuXG4gIC8vIElmIHRoZSAnZW5kJyBvcHRpb24gaXMgbm90IHN1cHBsaWVkLCBkZXN0LmVuZCgpIHdpbGwgYmUgY2FsbGVkIHdoZW5cbiAgLy8gc291cmNlIGdldHMgdGhlICdlbmQnIG9yICdjbG9zZScgZXZlbnRzLiAgT25seSBkZXN0LmVuZCgpIG9uY2UuXG4gIGlmICghZGVzdC5faXNTdGRpbyAmJiAoIW9wdGlvbnMgfHwgb3B0aW9ucy5lbmQgIT09IGZhbHNlKSkge1xuICAgIHNvdXJjZS5vbignZW5kJywgb25lbmQpO1xuICAgIHNvdXJjZS5vbignY2xvc2UnLCBvbmNsb3NlKTtcbiAgfVxuXG4gIHZhciBkaWRPbkVuZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBvbmVuZCgpIHtcbiAgICBpZiAoZGlkT25FbmQpIHJldHVybjtcbiAgICBkaWRPbkVuZCA9IHRydWU7XG5cbiAgICBkZXN0LmVuZCgpO1xuICB9XG5cblxuICBmdW5jdGlvbiBvbmNsb3NlKCkge1xuICAgIGlmIChkaWRPbkVuZCkgcmV0dXJuO1xuICAgIGRpZE9uRW5kID0gdHJ1ZTtcblxuICAgIGlmICh0eXBlb2YgZGVzdC5kZXN0cm95ID09PSAnZnVuY3Rpb24nKSBkZXN0LmRlc3Ryb3koKTtcbiAgfVxuXG4gIC8vIGRvbid0IGxlYXZlIGRhbmdsaW5nIHBpcGVzIHdoZW4gdGhlcmUgYXJlIGVycm9ycy5cbiAgZnVuY3Rpb24gb25lcnJvcihlcikge1xuICAgIGNsZWFudXAoKTtcbiAgICBpZiAoRUUubGlzdGVuZXJDb3VudCh0aGlzLCAnZXJyb3InKSA9PT0gMCkge1xuICAgICAgdGhyb3cgZXI7IC8vIFVuaGFuZGxlZCBzdHJlYW0gZXJyb3IgaW4gcGlwZS5cbiAgICB9XG4gIH1cblxuICBzb3VyY2Uub24oJ2Vycm9yJywgb25lcnJvcik7XG4gIGRlc3Qub24oJ2Vycm9yJywgb25lcnJvcik7XG5cbiAgLy8gcmVtb3ZlIGFsbCB0aGUgZXZlbnQgbGlzdGVuZXJzIHRoYXQgd2VyZSBhZGRlZC5cbiAgZnVuY3Rpb24gY2xlYW51cCgpIHtcbiAgICBzb3VyY2UucmVtb3ZlTGlzdGVuZXIoJ2RhdGEnLCBvbmRhdGEpO1xuICAgIGRlc3QucmVtb3ZlTGlzdGVuZXIoJ2RyYWluJywgb25kcmFpbik7XG5cbiAgICBzb3VyY2UucmVtb3ZlTGlzdGVuZXIoJ2VuZCcsIG9uZW5kKTtcbiAgICBzb3VyY2UucmVtb3ZlTGlzdGVuZXIoJ2Nsb3NlJywgb25jbG9zZSk7XG5cbiAgICBzb3VyY2UucmVtb3ZlTGlzdGVuZXIoJ2Vycm9yJywgb25lcnJvcik7XG4gICAgZGVzdC5yZW1vdmVMaXN0ZW5lcignZXJyb3InLCBvbmVycm9yKTtcblxuICAgIHNvdXJjZS5yZW1vdmVMaXN0ZW5lcignZW5kJywgY2xlYW51cCk7XG4gICAgc291cmNlLnJlbW92ZUxpc3RlbmVyKCdjbG9zZScsIGNsZWFudXApO1xuXG4gICAgZGVzdC5yZW1vdmVMaXN0ZW5lcignY2xvc2UnLCBjbGVhbnVwKTtcbiAgfVxuXG4gIHNvdXJjZS5vbignZW5kJywgY2xlYW51cCk7XG4gIHNvdXJjZS5vbignY2xvc2UnLCBjbGVhbnVwKTtcblxuICBkZXN0Lm9uKCdjbG9zZScsIGNsZWFudXApO1xuXG4gIGRlc3QuZW1pdCgncGlwZScsIHNvdXJjZSk7XG5cbiAgLy8gQWxsb3cgZm9yIHVuaXgtbGlrZSB1c2FnZTogQS5waXBlKEIpLnBpcGUoQylcbiAgcmV0dXJuIGRlc3Q7XG59O1xuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbid1c2Ugc3RyaWN0JztcblxuLyo8cmVwbGFjZW1lbnQ+Ki9cblxudmFyIEJ1ZmZlciA9IHJlcXVpcmUoJ3NhZmUtYnVmZmVyJykuQnVmZmVyO1xuLyo8L3JlcGxhY2VtZW50PiovXG5cbnZhciBpc0VuY29kaW5nID0gQnVmZmVyLmlzRW5jb2RpbmcgfHwgZnVuY3Rpb24gKGVuY29kaW5nKSB7XG4gIGVuY29kaW5nID0gJycgKyBlbmNvZGluZztcbiAgc3dpdGNoIChlbmNvZGluZyAmJiBlbmNvZGluZy50b0xvd2VyQ2FzZSgpKSB7XG4gICAgY2FzZSAnaGV4JzpjYXNlICd1dGY4JzpjYXNlICd1dGYtOCc6Y2FzZSAnYXNjaWknOmNhc2UgJ2JpbmFyeSc6Y2FzZSAnYmFzZTY0JzpjYXNlICd1Y3MyJzpjYXNlICd1Y3MtMic6Y2FzZSAndXRmMTZsZSc6Y2FzZSAndXRmLTE2bGUnOmNhc2UgJ3Jhdyc6XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG59O1xuXG5mdW5jdGlvbiBfbm9ybWFsaXplRW5jb2RpbmcoZW5jKSB7XG4gIGlmICghZW5jKSByZXR1cm4gJ3V0ZjgnO1xuICB2YXIgcmV0cmllZDtcbiAgd2hpbGUgKHRydWUpIHtcbiAgICBzd2l0Y2ggKGVuYykge1xuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiAndXRmOCc7XG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gJ3V0ZjE2bGUnO1xuICAgICAgY2FzZSAnbGF0aW4xJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiAnbGF0aW4xJztcbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gZW5jO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKHJldHJpZWQpIHJldHVybjsgLy8gdW5kZWZpbmVkXG4gICAgICAgIGVuYyA9ICgnJyArIGVuYykudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgcmV0cmllZCA9IHRydWU7XG4gICAgfVxuICB9XG59O1xuXG4vLyBEbyBub3QgY2FjaGUgYEJ1ZmZlci5pc0VuY29kaW5nYCB3aGVuIGNoZWNraW5nIGVuY29kaW5nIG5hbWVzIGFzIHNvbWVcbi8vIG1vZHVsZXMgbW9ua2V5LXBhdGNoIGl0IHRvIHN1cHBvcnQgYWRkaXRpb25hbCBlbmNvZGluZ3NcbmZ1bmN0aW9uIG5vcm1hbGl6ZUVuY29kaW5nKGVuYykge1xuICB2YXIgbmVuYyA9IF9ub3JtYWxpemVFbmNvZGluZyhlbmMpO1xuICBpZiAodHlwZW9mIG5lbmMgIT09ICdzdHJpbmcnICYmIChCdWZmZXIuaXNFbmNvZGluZyA9PT0gaXNFbmNvZGluZyB8fCAhaXNFbmNvZGluZyhlbmMpKSkgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jKTtcbiAgcmV0dXJuIG5lbmMgfHwgZW5jO1xufVxuXG4vLyBTdHJpbmdEZWNvZGVyIHByb3ZpZGVzIGFuIGludGVyZmFjZSBmb3IgZWZmaWNpZW50bHkgc3BsaXR0aW5nIGEgc2VyaWVzIG9mXG4vLyBidWZmZXJzIGludG8gYSBzZXJpZXMgb2YgSlMgc3RyaW5ncyB3aXRob3V0IGJyZWFraW5nIGFwYXJ0IG11bHRpLWJ5dGVcbi8vIGNoYXJhY3RlcnMuXG5leHBvcnRzLlN0cmluZ0RlY29kZXIgPSBTdHJpbmdEZWNvZGVyO1xuZnVuY3Rpb24gU3RyaW5nRGVjb2RlcihlbmNvZGluZykge1xuICB0aGlzLmVuY29kaW5nID0gbm9ybWFsaXplRW5jb2RpbmcoZW5jb2RpbmcpO1xuICB2YXIgbmI7XG4gIHN3aXRjaCAodGhpcy5lbmNvZGluZykge1xuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgdGhpcy50ZXh0ID0gdXRmMTZUZXh0O1xuICAgICAgdGhpcy5lbmQgPSB1dGYxNkVuZDtcbiAgICAgIG5iID0gNDtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgdGhpcy5maWxsTGFzdCA9IHV0ZjhGaWxsTGFzdDtcbiAgICAgIG5iID0gNDtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICB0aGlzLnRleHQgPSBiYXNlNjRUZXh0O1xuICAgICAgdGhpcy5lbmQgPSBiYXNlNjRFbmQ7XG4gICAgICBuYiA9IDM7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgdGhpcy53cml0ZSA9IHNpbXBsZVdyaXRlO1xuICAgICAgdGhpcy5lbmQgPSBzaW1wbGVFbmQ7XG4gICAgICByZXR1cm47XG4gIH1cbiAgdGhpcy5sYXN0TmVlZCA9IDA7XG4gIHRoaXMubGFzdFRvdGFsID0gMDtcbiAgdGhpcy5sYXN0Q2hhciA9IEJ1ZmZlci5hbGxvY1Vuc2FmZShuYik7XG59XG5cblN0cmluZ0RlY29kZXIucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24gKGJ1Zikge1xuICBpZiAoYnVmLmxlbmd0aCA9PT0gMCkgcmV0dXJuICcnO1xuICB2YXIgcjtcbiAgdmFyIGk7XG4gIGlmICh0aGlzLmxhc3ROZWVkKSB7XG4gICAgciA9IHRoaXMuZmlsbExhc3QoYnVmKTtcbiAgICBpZiAociA9PT0gdW5kZWZpbmVkKSByZXR1cm4gJyc7XG4gICAgaSA9IHRoaXMubGFzdE5lZWQ7XG4gICAgdGhpcy5sYXN0TmVlZCA9IDA7XG4gIH0gZWxzZSB7XG4gICAgaSA9IDA7XG4gIH1cbiAgaWYgKGkgPCBidWYubGVuZ3RoKSByZXR1cm4gciA/IHIgKyB0aGlzLnRleHQoYnVmLCBpKSA6IHRoaXMudGV4dChidWYsIGkpO1xuICByZXR1cm4gciB8fCAnJztcbn07XG5cblN0cmluZ0RlY29kZXIucHJvdG90eXBlLmVuZCA9IHV0ZjhFbmQ7XG5cbi8vIFJldHVybnMgb25seSBjb21wbGV0ZSBjaGFyYWN0ZXJzIGluIGEgQnVmZmVyXG5TdHJpbmdEZWNvZGVyLnByb3RvdHlwZS50ZXh0ID0gdXRmOFRleHQ7XG5cbi8vIEF0dGVtcHRzIHRvIGNvbXBsZXRlIGEgcGFydGlhbCBub24tVVRGLTggY2hhcmFjdGVyIHVzaW5nIGJ5dGVzIGZyb20gYSBCdWZmZXJcblN0cmluZ0RlY29kZXIucHJvdG90eXBlLmZpbGxMYXN0ID0gZnVuY3Rpb24gKGJ1Zikge1xuICBpZiAodGhpcy5sYXN0TmVlZCA8PSBidWYubGVuZ3RoKSB7XG4gICAgYnVmLmNvcHkodGhpcy5sYXN0Q2hhciwgdGhpcy5sYXN0VG90YWwgLSB0aGlzLmxhc3ROZWVkLCAwLCB0aGlzLmxhc3ROZWVkKTtcbiAgICByZXR1cm4gdGhpcy5sYXN0Q2hhci50b1N0cmluZyh0aGlzLmVuY29kaW5nLCAwLCB0aGlzLmxhc3RUb3RhbCk7XG4gIH1cbiAgYnVmLmNvcHkodGhpcy5sYXN0Q2hhciwgdGhpcy5sYXN0VG90YWwgLSB0aGlzLmxhc3ROZWVkLCAwLCBidWYubGVuZ3RoKTtcbiAgdGhpcy5sYXN0TmVlZCAtPSBidWYubGVuZ3RoO1xufTtcblxuLy8gQ2hlY2tzIHRoZSB0eXBlIG9mIGEgVVRGLTggYnl0ZSwgd2hldGhlciBpdCdzIEFTQ0lJLCBhIGxlYWRpbmcgYnl0ZSwgb3IgYVxuLy8gY29udGludWF0aW9uIGJ5dGUuIElmIGFuIGludmFsaWQgYnl0ZSBpcyBkZXRlY3RlZCwgLTIgaXMgcmV0dXJuZWQuXG5mdW5jdGlvbiB1dGY4Q2hlY2tCeXRlKGJ5dGUpIHtcbiAgaWYgKGJ5dGUgPD0gMHg3RikgcmV0dXJuIDA7ZWxzZSBpZiAoYnl0ZSA+PiA1ID09PSAweDA2KSByZXR1cm4gMjtlbHNlIGlmIChieXRlID4+IDQgPT09IDB4MEUpIHJldHVybiAzO2Vsc2UgaWYgKGJ5dGUgPj4gMyA9PT0gMHgxRSkgcmV0dXJuIDQ7XG4gIHJldHVybiBieXRlID4+IDYgPT09IDB4MDIgPyAtMSA6IC0yO1xufVxuXG4vLyBDaGVja3MgYXQgbW9zdCAzIGJ5dGVzIGF0IHRoZSBlbmQgb2YgYSBCdWZmZXIgaW4gb3JkZXIgdG8gZGV0ZWN0IGFuXG4vLyBpbmNvbXBsZXRlIG11bHRpLWJ5dGUgVVRGLTggY2hhcmFjdGVyLiBUaGUgdG90YWwgbnVtYmVyIG9mIGJ5dGVzICgyLCAzLCBvciA0KVxuLy8gbmVlZGVkIHRvIGNvbXBsZXRlIHRoZSBVVEYtOCBjaGFyYWN0ZXIgKGlmIGFwcGxpY2FibGUpIGFyZSByZXR1cm5lZC5cbmZ1bmN0aW9uIHV0ZjhDaGVja0luY29tcGxldGUoc2VsZiwgYnVmLCBpKSB7XG4gIHZhciBqID0gYnVmLmxlbmd0aCAtIDE7XG4gIGlmIChqIDwgaSkgcmV0dXJuIDA7XG4gIHZhciBuYiA9IHV0ZjhDaGVja0J5dGUoYnVmW2pdKTtcbiAgaWYgKG5iID49IDApIHtcbiAgICBpZiAobmIgPiAwKSBzZWxmLmxhc3ROZWVkID0gbmIgLSAxO1xuICAgIHJldHVybiBuYjtcbiAgfVxuICBpZiAoLS1qIDwgaSB8fCBuYiA9PT0gLTIpIHJldHVybiAwO1xuICBuYiA9IHV0ZjhDaGVja0J5dGUoYnVmW2pdKTtcbiAgaWYgKG5iID49IDApIHtcbiAgICBpZiAobmIgPiAwKSBzZWxmLmxhc3ROZWVkID0gbmIgLSAyO1xuICAgIHJldHVybiBuYjtcbiAgfVxuICBpZiAoLS1qIDwgaSB8fCBuYiA9PT0gLTIpIHJldHVybiAwO1xuICBuYiA9IHV0ZjhDaGVja0J5dGUoYnVmW2pdKTtcbiAgaWYgKG5iID49IDApIHtcbiAgICBpZiAobmIgPiAwKSB7XG4gICAgICBpZiAobmIgPT09IDIpIG5iID0gMDtlbHNlIHNlbGYubGFzdE5lZWQgPSBuYiAtIDM7XG4gICAgfVxuICAgIHJldHVybiBuYjtcbiAgfVxuICByZXR1cm4gMDtcbn1cblxuLy8gVmFsaWRhdGVzIGFzIG1hbnkgY29udGludWF0aW9uIGJ5dGVzIGZvciBhIG11bHRpLWJ5dGUgVVRGLTggY2hhcmFjdGVyIGFzXG4vLyBuZWVkZWQgb3IgYXJlIGF2YWlsYWJsZS4gSWYgd2Ugc2VlIGEgbm9uLWNvbnRpbnVhdGlvbiBieXRlIHdoZXJlIHdlIGV4cGVjdFxuLy8gb25lLCB3ZSBcInJlcGxhY2VcIiB0aGUgdmFsaWRhdGVkIGNvbnRpbnVhdGlvbiBieXRlcyB3ZSd2ZSBzZWVuIHNvIGZhciB3aXRoXG4vLyBhIHNpbmdsZSBVVEYtOCByZXBsYWNlbWVudCBjaGFyYWN0ZXIgKCdcXHVmZmZkJyksIHRvIG1hdGNoIHY4J3MgVVRGLTggZGVjb2Rpbmdcbi8vIGJlaGF2aW9yLiBUaGUgY29udGludWF0aW9uIGJ5dGUgY2hlY2sgaXMgaW5jbHVkZWQgdGhyZWUgdGltZXMgaW4gdGhlIGNhc2Vcbi8vIHdoZXJlIGFsbCBvZiB0aGUgY29udGludWF0aW9uIGJ5dGVzIGZvciBhIGNoYXJhY3RlciBleGlzdCBpbiB0aGUgc2FtZSBidWZmZXIuXG4vLyBJdCBpcyBhbHNvIGRvbmUgdGhpcyB3YXkgYXMgYSBzbGlnaHQgcGVyZm9ybWFuY2UgaW5jcmVhc2UgaW5zdGVhZCBvZiB1c2luZyBhXG4vLyBsb29wLlxuZnVuY3Rpb24gdXRmOENoZWNrRXh0cmFCeXRlcyhzZWxmLCBidWYsIHApIHtcbiAgaWYgKChidWZbMF0gJiAweEMwKSAhPT0gMHg4MCkge1xuICAgIHNlbGYubGFzdE5lZWQgPSAwO1xuICAgIHJldHVybiAnXFx1ZmZmZCc7XG4gIH1cbiAgaWYgKHNlbGYubGFzdE5lZWQgPiAxICYmIGJ1Zi5sZW5ndGggPiAxKSB7XG4gICAgaWYgKChidWZbMV0gJiAweEMwKSAhPT0gMHg4MCkge1xuICAgICAgc2VsZi5sYXN0TmVlZCA9IDE7XG4gICAgICByZXR1cm4gJ1xcdWZmZmQnO1xuICAgIH1cbiAgICBpZiAoc2VsZi5sYXN0TmVlZCA+IDIgJiYgYnVmLmxlbmd0aCA+IDIpIHtcbiAgICAgIGlmICgoYnVmWzJdICYgMHhDMCkgIT09IDB4ODApIHtcbiAgICAgICAgc2VsZi5sYXN0TmVlZCA9IDI7XG4gICAgICAgIHJldHVybiAnXFx1ZmZmZCc7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8vIEF0dGVtcHRzIHRvIGNvbXBsZXRlIGEgbXVsdGktYnl0ZSBVVEYtOCBjaGFyYWN0ZXIgdXNpbmcgYnl0ZXMgZnJvbSBhIEJ1ZmZlci5cbmZ1bmN0aW9uIHV0ZjhGaWxsTGFzdChidWYpIHtcbiAgdmFyIHAgPSB0aGlzLmxhc3RUb3RhbCAtIHRoaXMubGFzdE5lZWQ7XG4gIHZhciByID0gdXRmOENoZWNrRXh0cmFCeXRlcyh0aGlzLCBidWYsIHApO1xuICBpZiAociAhPT0gdW5kZWZpbmVkKSByZXR1cm4gcjtcbiAgaWYgKHRoaXMubGFzdE5lZWQgPD0gYnVmLmxlbmd0aCkge1xuICAgIGJ1Zi5jb3B5KHRoaXMubGFzdENoYXIsIHAsIDAsIHRoaXMubGFzdE5lZWQpO1xuICAgIHJldHVybiB0aGlzLmxhc3RDaGFyLnRvU3RyaW5nKHRoaXMuZW5jb2RpbmcsIDAsIHRoaXMubGFzdFRvdGFsKTtcbiAgfVxuICBidWYuY29weSh0aGlzLmxhc3RDaGFyLCBwLCAwLCBidWYubGVuZ3RoKTtcbiAgdGhpcy5sYXN0TmVlZCAtPSBidWYubGVuZ3RoO1xufVxuXG4vLyBSZXR1cm5zIGFsbCBjb21wbGV0ZSBVVEYtOCBjaGFyYWN0ZXJzIGluIGEgQnVmZmVyLiBJZiB0aGUgQnVmZmVyIGVuZGVkIG9uIGFcbi8vIHBhcnRpYWwgY2hhcmFjdGVyLCB0aGUgY2hhcmFjdGVyJ3MgYnl0ZXMgYXJlIGJ1ZmZlcmVkIHVudGlsIHRoZSByZXF1aXJlZFxuLy8gbnVtYmVyIG9mIGJ5dGVzIGFyZSBhdmFpbGFibGUuXG5mdW5jdGlvbiB1dGY4VGV4dChidWYsIGkpIHtcbiAgdmFyIHRvdGFsID0gdXRmOENoZWNrSW5jb21wbGV0ZSh0aGlzLCBidWYsIGkpO1xuICBpZiAoIXRoaXMubGFzdE5lZWQpIHJldHVybiBidWYudG9TdHJpbmcoJ3V0ZjgnLCBpKTtcbiAgdGhpcy5sYXN0VG90YWwgPSB0b3RhbDtcbiAgdmFyIGVuZCA9IGJ1Zi5sZW5ndGggLSAodG90YWwgLSB0aGlzLmxhc3ROZWVkKTtcbiAgYnVmLmNvcHkodGhpcy5sYXN0Q2hhciwgMCwgZW5kKTtcbiAgcmV0dXJuIGJ1Zi50b1N0cmluZygndXRmOCcsIGksIGVuZCk7XG59XG5cbi8vIEZvciBVVEYtOCwgYSByZXBsYWNlbWVudCBjaGFyYWN0ZXIgaXMgYWRkZWQgd2hlbiBlbmRpbmcgb24gYSBwYXJ0aWFsXG4vLyBjaGFyYWN0ZXIuXG5mdW5jdGlvbiB1dGY4RW5kKGJ1Zikge1xuICB2YXIgciA9IGJ1ZiAmJiBidWYubGVuZ3RoID8gdGhpcy53cml0ZShidWYpIDogJyc7XG4gIGlmICh0aGlzLmxhc3ROZWVkKSByZXR1cm4gciArICdcXHVmZmZkJztcbiAgcmV0dXJuIHI7XG59XG5cbi8vIFVURi0xNkxFIHR5cGljYWxseSBuZWVkcyB0d28gYnl0ZXMgcGVyIGNoYXJhY3RlciwgYnV0IGV2ZW4gaWYgd2UgaGF2ZSBhbiBldmVuXG4vLyBudW1iZXIgb2YgYnl0ZXMgYXZhaWxhYmxlLCB3ZSBuZWVkIHRvIGNoZWNrIGlmIHdlIGVuZCBvbiBhIGxlYWRpbmcvaGlnaFxuLy8gc3Vycm9nYXRlLiBJbiB0aGF0IGNhc2UsIHdlIG5lZWQgdG8gd2FpdCBmb3IgdGhlIG5leHQgdHdvIGJ5dGVzIGluIG9yZGVyIHRvXG4vLyBkZWNvZGUgdGhlIGxhc3QgY2hhcmFjdGVyIHByb3Blcmx5LlxuZnVuY3Rpb24gdXRmMTZUZXh0KGJ1ZiwgaSkge1xuICBpZiAoKGJ1Zi5sZW5ndGggLSBpKSAlIDIgPT09IDApIHtcbiAgICB2YXIgciA9IGJ1Zi50b1N0cmluZygndXRmMTZsZScsIGkpO1xuICAgIGlmIChyKSB7XG4gICAgICB2YXIgYyA9IHIuY2hhckNvZGVBdChyLmxlbmd0aCAtIDEpO1xuICAgICAgaWYgKGMgPj0gMHhEODAwICYmIGMgPD0gMHhEQkZGKSB7XG4gICAgICAgIHRoaXMubGFzdE5lZWQgPSAyO1xuICAgICAgICB0aGlzLmxhc3RUb3RhbCA9IDQ7XG4gICAgICAgIHRoaXMubGFzdENoYXJbMF0gPSBidWZbYnVmLmxlbmd0aCAtIDJdO1xuICAgICAgICB0aGlzLmxhc3RDaGFyWzFdID0gYnVmW2J1Zi5sZW5ndGggLSAxXTtcbiAgICAgICAgcmV0dXJuIHIuc2xpY2UoMCwgLTEpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcjtcbiAgfVxuICB0aGlzLmxhc3ROZWVkID0gMTtcbiAgdGhpcy5sYXN0VG90YWwgPSAyO1xuICB0aGlzLmxhc3RDaGFyWzBdID0gYnVmW2J1Zi5sZW5ndGggLSAxXTtcbiAgcmV0dXJuIGJ1Zi50b1N0cmluZygndXRmMTZsZScsIGksIGJ1Zi5sZW5ndGggLSAxKTtcbn1cblxuLy8gRm9yIFVURi0xNkxFIHdlIGRvIG5vdCBleHBsaWNpdGx5IGFwcGVuZCBzcGVjaWFsIHJlcGxhY2VtZW50IGNoYXJhY3RlcnMgaWYgd2Vcbi8vIGVuZCBvbiBhIHBhcnRpYWwgY2hhcmFjdGVyLCB3ZSBzaW1wbHkgbGV0IHY4IGhhbmRsZSB0aGF0LlxuZnVuY3Rpb24gdXRmMTZFbmQoYnVmKSB7XG4gIHZhciByID0gYnVmICYmIGJ1Zi5sZW5ndGggPyB0aGlzLndyaXRlKGJ1ZikgOiAnJztcbiAgaWYgKHRoaXMubGFzdE5lZWQpIHtcbiAgICB2YXIgZW5kID0gdGhpcy5sYXN0VG90YWwgLSB0aGlzLmxhc3ROZWVkO1xuICAgIHJldHVybiByICsgdGhpcy5sYXN0Q2hhci50b1N0cmluZygndXRmMTZsZScsIDAsIGVuZCk7XG4gIH1cbiAgcmV0dXJuIHI7XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFRleHQoYnVmLCBpKSB7XG4gIHZhciBuID0gKGJ1Zi5sZW5ndGggLSBpKSAlIDM7XG4gIGlmIChuID09PSAwKSByZXR1cm4gYnVmLnRvU3RyaW5nKCdiYXNlNjQnLCBpKTtcbiAgdGhpcy5sYXN0TmVlZCA9IDMgLSBuO1xuICB0aGlzLmxhc3RUb3RhbCA9IDM7XG4gIGlmIChuID09PSAxKSB7XG4gICAgdGhpcy5sYXN0Q2hhclswXSA9IGJ1ZltidWYubGVuZ3RoIC0gMV07XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5sYXN0Q2hhclswXSA9IGJ1ZltidWYubGVuZ3RoIC0gMl07XG4gICAgdGhpcy5sYXN0Q2hhclsxXSA9IGJ1ZltidWYubGVuZ3RoIC0gMV07XG4gIH1cbiAgcmV0dXJuIGJ1Zi50b1N0cmluZygnYmFzZTY0JywgaSwgYnVmLmxlbmd0aCAtIG4pO1xufVxuXG5mdW5jdGlvbiBiYXNlNjRFbmQoYnVmKSB7XG4gIHZhciByID0gYnVmICYmIGJ1Zi5sZW5ndGggPyB0aGlzLndyaXRlKGJ1ZikgOiAnJztcbiAgaWYgKHRoaXMubGFzdE5lZWQpIHJldHVybiByICsgdGhpcy5sYXN0Q2hhci50b1N0cmluZygnYmFzZTY0JywgMCwgMyAtIHRoaXMubGFzdE5lZWQpO1xuICByZXR1cm4gcjtcbn1cblxuLy8gUGFzcyBieXRlcyBvbiB0aHJvdWdoIGZvciBzaW5nbGUtYnl0ZSBlbmNvZGluZ3MgKGUuZy4gYXNjaWksIGxhdGluMSwgaGV4KVxuZnVuY3Rpb24gc2ltcGxlV3JpdGUoYnVmKSB7XG4gIHJldHVybiBidWYudG9TdHJpbmcodGhpcy5lbmNvZGluZyk7XG59XG5cbmZ1bmN0aW9uIHNpbXBsZUVuZChidWYpIHtcbiAgcmV0dXJuIGJ1ZiAmJiBidWYubGVuZ3RoID8gdGhpcy53cml0ZShidWYpIDogJyc7XG59IiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSB4ID0+IHtcblx0aWYgKHR5cGVvZiB4ICE9PSAnc3RyaW5nJykge1xuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIGEgc3RyaW5nLCBnb3QgJyArIHR5cGVvZiB4KTtcblx0fVxuXG5cdC8vIENhdGNoZXMgRUZCQkJGIChVVEYtOCBCT00pIGJlY2F1c2UgdGhlIGJ1ZmZlci10by1zdHJpbmdcblx0Ly8gY29udmVyc2lvbiB0cmFuc2xhdGVzIGl0IHRvIEZFRkYgKFVURi0xNiBCT00pXG5cdGlmICh4LmNoYXJDb2RlQXQoMCkgPT09IDB4RkVGRikge1xuXHRcdHJldHVybiB4LnNsaWNlKDEpO1xuXHR9XG5cblx0cmV0dXJuIHg7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSB7XG5cdHN0ZG91dDogZmFsc2UsXG5cdHN0ZGVycjogZmFsc2Vcbn07XG4iLCJ2YXIgbmV4dFRpY2sgPSByZXF1aXJlKCdwcm9jZXNzL2Jyb3dzZXIuanMnKS5uZXh0VGljaztcbnZhciBhcHBseSA9IEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseTtcbnZhciBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciBpbW1lZGlhdGVJZHMgPSB7fTtcbnZhciBuZXh0SW1tZWRpYXRlSWQgPSAwO1xuXG4vLyBET00gQVBJcywgZm9yIGNvbXBsZXRlbmVzc1xuXG5leHBvcnRzLnNldFRpbWVvdXQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBUaW1lb3V0KGFwcGx5LmNhbGwoc2V0VGltZW91dCwgd2luZG93LCBhcmd1bWVudHMpLCBjbGVhclRpbWVvdXQpO1xufTtcbmV4cG9ydHMuc2V0SW50ZXJ2YWwgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBUaW1lb3V0KGFwcGx5LmNhbGwoc2V0SW50ZXJ2YWwsIHdpbmRvdywgYXJndW1lbnRzKSwgY2xlYXJJbnRlcnZhbCk7XG59O1xuZXhwb3J0cy5jbGVhclRpbWVvdXQgPVxuZXhwb3J0cy5jbGVhckludGVydmFsID0gZnVuY3Rpb24odGltZW91dCkgeyB0aW1lb3V0LmNsb3NlKCk7IH07XG5cbmZ1bmN0aW9uIFRpbWVvdXQoaWQsIGNsZWFyRm4pIHtcbiAgdGhpcy5faWQgPSBpZDtcbiAgdGhpcy5fY2xlYXJGbiA9IGNsZWFyRm47XG59XG5UaW1lb3V0LnByb3RvdHlwZS51bnJlZiA9IFRpbWVvdXQucHJvdG90eXBlLnJlZiA9IGZ1bmN0aW9uKCkge307XG5UaW1lb3V0LnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9jbGVhckZuLmNhbGwod2luZG93LCB0aGlzLl9pZCk7XG59O1xuXG4vLyBEb2VzIG5vdCBzdGFydCB0aGUgdGltZSwganVzdCBzZXRzIHVwIHRoZSBtZW1iZXJzIG5lZWRlZC5cbmV4cG9ydHMuZW5yb2xsID0gZnVuY3Rpb24oaXRlbSwgbXNlY3MpIHtcbiAgY2xlYXJUaW1lb3V0KGl0ZW0uX2lkbGVUaW1lb3V0SWQpO1xuICBpdGVtLl9pZGxlVGltZW91dCA9IG1zZWNzO1xufTtcblxuZXhwb3J0cy51bmVucm9sbCA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgY2xlYXJUaW1lb3V0KGl0ZW0uX2lkbGVUaW1lb3V0SWQpO1xuICBpdGVtLl9pZGxlVGltZW91dCA9IC0xO1xufTtcblxuZXhwb3J0cy5fdW5yZWZBY3RpdmUgPSBleHBvcnRzLmFjdGl2ZSA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgY2xlYXJUaW1lb3V0KGl0ZW0uX2lkbGVUaW1lb3V0SWQpO1xuXG4gIHZhciBtc2VjcyA9IGl0ZW0uX2lkbGVUaW1lb3V0O1xuICBpZiAobXNlY3MgPj0gMCkge1xuICAgIGl0ZW0uX2lkbGVUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uIG9uVGltZW91dCgpIHtcbiAgICAgIGlmIChpdGVtLl9vblRpbWVvdXQpXG4gICAgICAgIGl0ZW0uX29uVGltZW91dCgpO1xuICAgIH0sIG1zZWNzKTtcbiAgfVxufTtcblxuLy8gVGhhdCdzIG5vdCBob3cgbm9kZS5qcyBpbXBsZW1lbnRzIGl0IGJ1dCB0aGUgZXhwb3NlZCBhcGkgaXMgdGhlIHNhbWUuXG5leHBvcnRzLnNldEltbWVkaWF0ZSA9IHR5cGVvZiBzZXRJbW1lZGlhdGUgPT09IFwiZnVuY3Rpb25cIiA/IHNldEltbWVkaWF0ZSA6IGZ1bmN0aW9uKGZuKSB7XG4gIHZhciBpZCA9IG5leHRJbW1lZGlhdGVJZCsrO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cy5sZW5ndGggPCAyID8gZmFsc2UgOiBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgaW1tZWRpYXRlSWRzW2lkXSA9IHRydWU7XG5cbiAgbmV4dFRpY2soZnVuY3Rpb24gb25OZXh0VGljaygpIHtcbiAgICBpZiAoaW1tZWRpYXRlSWRzW2lkXSkge1xuICAgICAgLy8gZm4uY2FsbCgpIGlzIGZhc3RlciBzbyB3ZSBvcHRpbWl6ZSBmb3IgdGhlIGNvbW1vbiB1c2UtY2FzZVxuICAgICAgLy8gQHNlZSBodHRwOi8vanNwZXJmLmNvbS9jYWxsLWFwcGx5LXNlZ3VcbiAgICAgIGlmIChhcmdzKSB7XG4gICAgICAgIGZuLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm4uY2FsbChudWxsKTtcbiAgICAgIH1cbiAgICAgIC8vIFByZXZlbnQgaWRzIGZyb20gbGVha2luZ1xuICAgICAgZXhwb3J0cy5jbGVhckltbWVkaWF0ZShpZCk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gaWQ7XG59O1xuXG5leHBvcnRzLmNsZWFySW1tZWRpYXRlID0gdHlwZW9mIGNsZWFySW1tZWRpYXRlID09PSBcImZ1bmN0aW9uXCIgPyBjbGVhckltbWVkaWF0ZSA6IGZ1bmN0aW9uKGlkKSB7XG4gIGRlbGV0ZSBpbW1lZGlhdGVJZHNbaWRdO1xufTsiLCJcbi8qKlxuICogTW9kdWxlIGV4cG9ydHMuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBkZXByZWNhdGU7XG5cbi8qKlxuICogTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbiAqIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4gKlxuICogSWYgYGxvY2FsU3RvcmFnZS5ub0RlcHJlY2F0aW9uID0gdHJ1ZWAgaXMgc2V0LCB0aGVuIGl0IGlzIGEgbm8tb3AuXG4gKlxuICogSWYgYGxvY2FsU3RvcmFnZS50aHJvd0RlcHJlY2F0aW9uID0gdHJ1ZWAgaXMgc2V0LCB0aGVuIGRlcHJlY2F0ZWQgZnVuY3Rpb25zXG4gKiB3aWxsIHRocm93IGFuIEVycm9yIHdoZW4gaW52b2tlZC5cbiAqXG4gKiBJZiBgbG9jYWxTdG9yYWdlLnRyYWNlRGVwcmVjYXRpb24gPSB0cnVlYCBpcyBzZXQsIHRoZW4gZGVwcmVjYXRlZCBmdW5jdGlvbnNcbiAqIHdpbGwgaW52b2tlIGBjb25zb2xlLnRyYWNlKClgIGluc3RlYWQgb2YgYGNvbnNvbGUuZXJyb3IoKWAuXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gLSB0aGUgZnVuY3Rpb24gdG8gZGVwcmVjYXRlXG4gKiBAcGFyYW0ge1N0cmluZ30gbXNnIC0gdGhlIHN0cmluZyB0byBwcmludCB0byB0aGUgY29uc29sZSB3aGVuIGBmbmAgaXMgaW52b2tlZFxuICogQHJldHVybnMge0Z1bmN0aW9ufSBhIG5ldyBcImRlcHJlY2F0ZWRcIiB2ZXJzaW9uIG9mIGBmbmBcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZGVwcmVjYXRlIChmbiwgbXNnKSB7XG4gIGlmIChjb25maWcoJ25vRGVwcmVjYXRpb24nKSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKGNvbmZpZygndGhyb3dEZXByZWNhdGlvbicpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgICAgfSBlbHNlIGlmIChjb25maWcoJ3RyYWNlRGVwcmVjYXRpb24nKSkge1xuICAgICAgICBjb25zb2xlLnRyYWNlKG1zZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLndhcm4obXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59XG5cbi8qKlxuICogQ2hlY2tzIGBsb2NhbFN0b3JhZ2VgIGZvciBib29sZWFuIHZhbHVlcyBmb3IgdGhlIGdpdmVuIGBuYW1lYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICogQHJldHVybnMge0Jvb2xlYW59XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBjb25maWcgKG5hbWUpIHtcbiAgLy8gYWNjZXNzaW5nIGdsb2JhbC5sb2NhbFN0b3JhZ2UgY2FuIHRyaWdnZXIgYSBET01FeGNlcHRpb24gaW4gc2FuZGJveGVkIGlmcmFtZXNcbiAgdHJ5IHtcbiAgICBpZiAoIWdsb2JhbC5sb2NhbFN0b3JhZ2UpIHJldHVybiBmYWxzZTtcbiAgfSBjYXRjaCAoXykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICB2YXIgdmFsID0gZ2xvYmFsLmxvY2FsU3RvcmFnZVtuYW1lXTtcbiAgaWYgKG51bGwgPT0gdmFsKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiBTdHJpbmcodmFsKS50b0xvd2VyQ2FzZSgpID09PSAndHJ1ZSc7XG59XG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG4iLCJtb2R1bGUuZXhwb3J0cz17XG4gIFwiZGVzY3JpcHRpb25cIjogXCLwn5GLIEhhY2thYmxlIGNvbnNvbGUgbG9nZ2VyIGZvciBOb2RlIGFuZCBCcm93c2VyIGVudmlyb25tZW50c1wiLFxuICBcInZlcnNpb25cIjogXCIxLjIuMVwiLFxuICBcImF1dGhvclwiOiB7XG4gICAgXCJuYW1lXCI6IFwiS2xhdXMgU2luYW5pXCIsXG4gICAgXCJlbWFpbFwiOiBcImtsYXVzY2ZocUBwcm90b25tYWlsLmNvbVwiLFxuICAgIFwidXJsXCI6IFwiaHR0cHM6Ly9rbGF1c2NmaHEuZ2l0aHViLmlvXCJcbiAgfSxcbiAgXCJjb250cmlidXRvcnNcIjogW1xuICAgIFwiS2xhdXMgU2luYW5pIDxrbGF1c2NmaHFAcHJvdG9ubWFpbC5jb20+IChodHRwczovL2tsYXVzY2ZocS5naXRodWIuY29tLylcIixcbiAgICBcIk5pY2sgQmF1Z2ggPG5pZnR5bGV0dHVjZUBnbWFpbC5jb20+IChodHRwczovL25pZnR5bGV0dHVjZS5jb20vKVwiXG4gIF0sXG4gIFwiYnJvd3NlclwiOiBcImRpc3Qvc2lnbmFsZS5qc1wiLFxuICBcImRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJhbnNpLWh0bWxcIjogXCJeMC4wLjdcIixcbiAgICBcImFuc2ljb2xvclwiOiBcIl4xLjEuNzJcIixcbiAgICBcImNoYWxrXCI6IFwiaHR0cHM6Ly9naXRodWIuY29tL25pZnR5bGV0dHVjZS9jaGFsa1wiLFxuICAgIFwiZmlndXJlc1wiOiBcIl4yLjAuMFwiLFxuICAgIFwicGtnLWNvbmZcIjogXCJodHRwczovL2dpdGh1Yi5jb20vbmlmdHlsZXR0dWNlL3BrZy1jb25mXCJcbiAgfSxcbiAgXCJkZXZEZXBlbmRlbmNpZXNcIjoge1xuICAgIFwiQGJhYmVsL2NsaVwiOiBcIl43LjAuMC1iZXRhLjUxXCIsXG4gICAgXCJAYmFiZWwvY29yZVwiOiBcIl43LjAuMC1iZXRhLjUxXCIsXG4gICAgXCJAYmFiZWwvcHJlc2V0LWVudlwiOiBcIl43LjAuMC1iZXRhLjUxXCIsXG4gICAgXCJhdmFcIjogXCJeMS4wLjAtYmV0YS42XCIsXG4gICAgXCJiYWJlbGlmeVwiOiBcIl45LjAuMFwiLFxuICAgIFwiYnJvd3NlcmlmeVwiOiBcImh0dHBzOi8vZ2l0aHViLmNvbS9uaWZ0eWxldHR1Y2UvYnJvd3NlcmlmeVwiLFxuICAgIFwiY2FuaXVzZS1saXRlXCI6IFwiXjEuMC4zMDAwMDg1NlwiLFxuICAgIFwiY29kZWNvdlwiOiBcIl4zLjAuMlwiLFxuICAgIFwiY3Jvc3MtZW52XCI6IFwiXjUuMi4wXCIsXG4gICAgXCJlc2xpbnRcIjogXCJeNC4xOS4xXCIsXG4gICAgXCJlc2xpbnQtY29uZmlnLXByZXR0aWVyXCI6IFwiXjIuOS4wXCIsXG4gICAgXCJlc2xpbnQtcGx1Z2luLWNvbXBhdFwiOiBcIl4yLjQuMFwiLFxuICAgIFwiZXNsaW50LXBsdWdpbi1wcmV0dGllclwiOiBcIl4yLjYuMFwiLFxuICAgIFwibnljXCI6IFwiXjEyLjAuMlwiLFxuICAgIFwicHJldHRpZXJcIjogXCJeMS4xMy41XCIsXG4gICAgXCJyZW1hcmstY2xpXCI6IFwiXjUuMC4wXCIsXG4gICAgXCJyZW1hcmstcHJlc2V0LWdpdGh1YlwiOiBcIl4wLjAuOFwiLFxuICAgIFwicmltcmFmXCI6IFwiXjIuNi4yXCIsXG4gICAgXCJ0aW55aWZ5XCI6IFwiXjIuNC4zXCIsXG4gICAgXCJ1Z2xpZnktZXNcIjogXCJeMy4zLjlcIixcbiAgICBcInhvXCI6IFwiXjAuMjEuMVwiXG4gIH0sXG4gIFwiZW5naW5lc1wiOiB7XG4gICAgXCJub2RlXCI6IFwiPj02LjRcIlxuICB9LFxuICBcImZpbGVzXCI6IFtcbiAgICBcImxpYlwiLFxuICAgIFwiZGlzdFwiXG4gIF0sXG4gIFwia2V5d29yZHNcIjogW1xuICAgIFwiY29sb3JmdWxcIixcbiAgICBcImNvbnNvbGVcIixcbiAgICBcImhhY2thYmxlXCIsXG4gICAgXCJsb2dnZXJcIlxuICBdLFxuICBcImxpY2Vuc2VcIjogXCJNSVRcIixcbiAgXCJtYWluXCI6IFwibGliL2luZGV4LmpzXCIsXG4gIFwibWFpbnRhaW5lcnNcIjogW1xuICAgIHtcbiAgICAgIFwibmFtZVwiOiBcIk1hcmlvIFNpbmFuaVwiLFxuICAgICAgXCJlbWFpbFwiOiBcIm1hcmlvc2luYW5pQHByb3Rvbm1haWwuY2hcIixcbiAgICAgIFwidXJsXCI6IFwiaHR0cHM6Ly9tYXJpb2NmaHEuZ2l0aHViLmlvXCJcbiAgICB9XG4gIF0sXG4gIFwib3B0aW9uc1wiOiB7XG4gICAgXCJkZWZhdWx0XCI6IHtcbiAgICAgIFwiY29sb3JlZEludGVycG9sYXRpb25cIjogZmFsc2UsXG4gICAgICBcImRpc3BsYXlTY29wZVwiOiB0cnVlLFxuICAgICAgXCJkaXNwbGF5QmFkZ2VcIjogdHJ1ZSxcbiAgICAgIFwiZGlzcGxheURhdGVcIjogZmFsc2UsXG4gICAgICBcImRpc3BsYXlGaWxlbmFtZVwiOiBmYWxzZSxcbiAgICAgIFwiZGlzcGxheUxhYmVsXCI6IHRydWUsXG4gICAgICBcImRpc3BsYXlUaW1lc3RhbXBcIjogZmFsc2UsXG4gICAgICBcInVuZGVybGluZUxhYmVsXCI6IHRydWUsXG4gICAgICBcInVuZGVybGluZU1lc3NhZ2VcIjogZmFsc2UsXG4gICAgICBcInVuZGVybGluZVByZWZpeFwiOiBmYWxzZSxcbiAgICAgIFwidW5kZXJsaW5lU3VmZml4XCI6IGZhbHNlLFxuICAgICAgXCJ1cHBlcmNhc2VMYWJlbFwiOiBmYWxzZVxuICAgIH1cbiAgfSxcbiAgXCJyZW1hcmtDb25maWdcIjoge1xuICAgIFwicGx1Z2luc1wiOiBbXG4gICAgICBcInByZXNldC1naXRodWJcIlxuICAgIF1cbiAgfSxcbiAgXCJyZXBvc2l0b3J5XCI6IFwia2xhdXNjZmhxL3NpZ25hbGVcIixcbiAgXCJzY3JpcHRzXCI6IHtcbiAgICBcImF2YVwiOiBcImNyb3NzLWVudiBOT0RFX0VOVj10ZXN0IGF2YVwiLFxuICAgIFwiYnJvd3NlcmlmeVwiOiBcImJyb3dzZXJpZnkgc3JjL2luZGV4LmpzIC1vIGRpc3Qvc2lnbmFsZS5qcyAtcyBTaWduYWxlIC1kIC10IGJhYmVsaWZ5XCIsXG4gICAgXCJidWlsZFwiOiBcIm5wbSBydW4gYnVpbGQ6Y2xlYW4gJiYgbnBtIHJ1biBidWlsZDpsaWIgJiYgbnBtIHJ1biBidWlsZDpkaXN0XCIsXG4gICAgXCJidWlsZDpjbGVhblwiOiBcInJpbXJhZiBsaWIgZGlzdFwiLFxuICAgIFwiYnVpbGQ6ZGlzdFwiOiBcIm5wbSBydW4gYnJvd3NlcmlmeSAmJiBucG0gcnVuIG1pbmlmeVwiLFxuICAgIFwiYnVpbGQ6bGliXCI6IFwiYmFiZWwgc3JjIC0tb3V0LWRpciBsaWJcIixcbiAgICBcImNvdmVyYWdlXCI6IFwibnljIHJlcG9ydCAtLXJlcG9ydGVyPXRleHQtbGNvdiA+IGNvdmVyYWdlLmxjb3YgJiYgY29kZWNvdlwiLFxuICAgIFwibGludFwiOiBcInhvICYmIHJlbWFyayAuIC1xZm8gJiYgZXNsaW50IGxpYixkaXN0XCIsXG4gICAgXCJtaW5pZnlcIjogXCJicm93c2VyaWZ5IHNyYy9pbmRleC5qcyAtcyBTaWduYWxlIC1kIC10IGJhYmVsaWZ5IC1wIHRpbnlpZnkgfCB1Z2xpZnlqcyAtLXNvdXJjZS1tYXAgY29udGVudD1pbmxpbmUsaW5jbHVkZVNvdXJjZXMsdXJsPWlubGluZSAtY20gLW8gZGlzdC9zaWduYWxlLm1pbi5qc1wiLFxuICAgIFwibnljXCI6IFwiY3Jvc3MtZW52IE5PREVfRU5WPXRlc3QgbnljIGF2YVwiLFxuICAgIFwicHJlY29tbWl0XCI6IFwibnBtIHRlc3RcIixcbiAgICBcInRlc3RcIjogXCJucG0gcnVuIGJ1aWxkICYmIG5wbSBydW4gbGludCAmJiBucG0gcnVuIGF2YVwiLFxuICAgIFwidGVzdC1jb3ZlcmFnZVwiOiBcIm5wbSBydW4gYnVpbGQgJiYgbnBtIHJ1biBsaW50ICYmIG5wbSBydW4gbnljXCJcbiAgfSxcbiAgXCJ1bnBrZ1wiOiBcImRpc3Qvc2lnbmFsZS5taW4uanNcIixcbiAgXCJ4b1wiOiB7XG4gICAgXCJleHRlbmRzXCI6IFwicHJldHRpZXJcIixcbiAgICBcInBsdWdpbnNcIjogW1xuICAgICAgXCJwcmV0dGllclwiXG4gICAgXSxcbiAgICBcInBhcnNlck9wdGlvbnNcIjoge1xuICAgICAgXCJzb3VyY2VUeXBlXCI6IFwic2NyaXB0XCJcbiAgICB9LFxuICAgIFwiZW52XCI6IFtcbiAgICAgIFwibm9kZVwiLFxuICAgICAgXCJicm93c2VyXCJcbiAgICBdLFxuICAgIFwicnVsZXNcIjoge1xuICAgICAgXCJwcmV0dGllci9wcmV0dGllclwiOiBbXG4gICAgICAgIFwiZXJyb3JcIixcbiAgICAgICAge1xuICAgICAgICAgIFwic2luZ2xlUXVvdGVcIjogdHJ1ZSxcbiAgICAgICAgICBcImJyYWNrZXRTcGFjaW5nXCI6IHRydWUsXG4gICAgICAgICAgXCJ0cmFpbGluZ0NvbW1hXCI6IFwibm9uZVwiXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBcIm1heC1sZW5cIjogW1xuICAgICAgICBcImVycm9yXCIsXG4gICAgICAgIHtcbiAgICAgICAgICBcImNvZGVcIjogODAsXG4gICAgICAgICAgXCJpZ25vcmVVcmxzXCI6IHRydWVcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIFwiY2FwaXRhbGl6ZWQtY29tbWVudHNcIjogXCJvZmZcIixcbiAgICAgIFwiY2FtZWxjYXNlXCI6IFwib2ZmXCIsXG4gICAgICBcIm5vLXdhcm5pbmctY29tbWVudHNcIjogXCJvZmZcIlxuICAgIH0sXG4gICAgXCJzcGFjZVwiOiB0cnVlLFxuICAgIFwiaWdub3Jlc1wiOiBbXG4gICAgICBcImxpYi8qKlwiLFxuICAgICAgXCJkaXN0LyoqXCIsXG4gICAgICBcImNvbmZpZy5qc1wiXG4gICAgXVxuICB9XG59XG4iLCJjb25zdCB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xuY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmNvbnN0IGNoYWxrID0gcmVxdWlyZSgnY2hhbGsnKTtcbmNvbnN0IGZpZ3VyZXMgPSByZXF1aXJlKCdmaWd1cmVzJyk7XG5jb25zdCBwa2dDb25mID0gcmVxdWlyZSgncGtnLWNvbmYnKTtcbmNvbnN0IGFuc2kgPSByZXF1aXJlKCdhbnNpY29sb3InKTtcblxuY29uc3QgcGtnID0gcmVxdWlyZSgnLi4vcGFja2FnZS5qc29uJyk7XG5jb25zdCBkZWZhdWx0VHlwZXMgPSByZXF1aXJlKCcuL3R5cGVzJyk7XG5cbi8vIGRldGVybWluZSBpZiB3ZSdyZSBpbiBhIGJyb3dzZXJcbmNvbnN0IGlzQnJvd3NlciA9XG4gIHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiB3aW5kb3cuZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnO1xuXG5sZXQgaXNQcmV2aW91c0xvZ0ludGVyYWN0aXZlID0gZmFsc2U7XG5jb25zdCBkZWZhdWx0cyA9IHBrZy5vcHRpb25zLmRlZmF1bHQ7XG5jb25zdCBuYW1lc3BhY2UgPSBwa2cubmFtZTtcblxuY29uc3QgYXJyYXlpZnkgPSB4ID0+IHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoeCkgPyB4IDogW3hdO1xufTtcbmNvbnN0IG5vdyA9ICgpID0+IERhdGUubm93KCk7XG5jb25zdCB0aW1lU3BhbiA9IHRoZW4gPT4ge1xuICByZXR1cm4gbm93KCkgLSB0aGVuO1xufTtcblxuY2xhc3MgU2lnbmFsZSB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgIHRoaXMuX2ludGVyYWN0aXZlID0gaXNCcm93c2VyID8gZmFsc2UgOiBvcHRpb25zLmludGVyYWN0aXZlIHx8IGZhbHNlO1xuICAgIHRoaXMuX2NvbmZpZyA9IE9iamVjdC5hc3NpZ24odGhpcy5wYWNrYWdlQ29uZmlndXJhdGlvbiwgb3B0aW9ucy5jb25maWcpO1xuICAgIHRoaXMuX2N1c3RvbVR5cGVzID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucy50eXBlcyk7XG4gICAgdGhpcy5fZGlzYWJsZWQgPSBvcHRpb25zLmRpc2FibGVkIHx8IGZhbHNlO1xuICAgIHRoaXMuX3Njb3BlTmFtZSA9IG9wdGlvbnMuc2NvcGUgfHwgJyc7XG4gICAgdGhpcy5fdGltZXJzID0gb3B0aW9ucy50aW1lcnMgfHwgbmV3IE1hcCgpO1xuICAgIHRoaXMuX3R5cGVzID0gdGhpcy5fbWVyZ2VUeXBlcyhkZWZhdWx0VHlwZXMsIHRoaXMuX2N1c3RvbVR5cGVzKTtcbiAgICB0aGlzLl9zdHJlYW0gPSBpc0Jyb3dzZXJcbiAgICAgID8geyB3cml0ZTogY29uc29sZS5sb2cgfVxuICAgICAgOiBvcHRpb25zLnN0cmVhbSB8fCBwcm9jZXNzLnN0ZG91dDtcbiAgICB0aGlzLl9sb25nZXN0TGFiZWwgPSBkZWZhdWx0VHlwZXMuc3RhcnQubGFiZWwubGVuZ3RoO1xuXG4gICAgT2JqZWN0LmtleXModGhpcy5fdHlwZXMpLmZvckVhY2godHlwZSA9PiB7XG4gICAgICB0aGlzW3R5cGVdID0gdGhpcy5fbG9nZ2VyLmJpbmQodGhpcywgdHlwZSk7XG4gICAgfSk7XG5cbiAgICBmb3IgKGNvbnN0IHR5cGUgaW4gdGhpcy5fdHlwZXMpIHtcbiAgICAgIGlmIChcbiAgICAgICAgdGhpcy5fdHlwZXNbdHlwZV0ubGFiZWwgJiZcbiAgICAgICAgdGhpcy5fdHlwZXNbdHlwZV0ubGFiZWwubGVuZ3RoID4gdGhpcy5fbG9uZ2VzdExhYmVsXG4gICAgICApIHtcbiAgICAgICAgdGhpcy5fbG9uZ2VzdExhYmVsID0gdGhpcy5fdHlwZXNbdHlwZV0ubGFiZWwubGVuZ3RoO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGdldCBzY29wZU5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3Njb3BlTmFtZTtcbiAgfVxuXG4gIGdldCBjdXJyZW50T3B0aW9ucygpIHtcbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihcbiAgICAgIHt9LFxuICAgICAge1xuICAgICAgICBjb25maWc6IHRoaXMuX2NvbmZpZyxcbiAgICAgICAgZGlzYWJsZWQ6IHRoaXMuX2Rpc2FibGVkLFxuICAgICAgICB0eXBlczogdGhpcy5fY3VzdG9tVHlwZXMsXG4gICAgICAgIGludGVyYWN0aXZlOiB0aGlzLl9pbnRlcmFjdGl2ZSxcbiAgICAgICAgdGltZXJzOiB0aGlzLl90aW1lcnMsXG4gICAgICAgIHN0cmVhbTogdGhpcy5fc3RyZWFtXG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIGdldCBpc0VuYWJsZWQoKSB7XG4gICAgcmV0dXJuICF0aGlzLl9kaXNhYmxlZDtcbiAgfVxuXG4gIGdldCBkYXRlKCkge1xuICAgIHJldHVybiBuZXcgRGF0ZSgpLnRvTG9jYWxlRGF0ZVN0cmluZygpO1xuICB9XG5cbiAgZ2V0IHRpbWVzdGFtcCgpIHtcbiAgICByZXR1cm4gbmV3IERhdGUoKS50b0xvY2FsZVRpbWVTdHJpbmcoKTtcbiAgfVxuXG4gIGdldCBmaWxlbmFtZSgpIHtcbiAgICBjb25zdCBfID0gRXJyb3IucHJlcGFyZVN0YWNrVHJhY2U7XG4gICAgRXJyb3IucHJlcGFyZVN0YWNrVHJhY2UgPSAoZXJyb3IsIHN0YWNrKSA9PiBzdGFjaztcbiAgICBjb25zdCB7IHN0YWNrIH0gPSBuZXcgRXJyb3IoKTtcbiAgICBFcnJvci5wcmVwYXJlU3RhY2tUcmFjZSA9IF87XG5cbiAgICBjb25zdCBjYWxsZXJzID0gc3RhY2subWFwKHggPT4geC5nZXRGaWxlTmFtZSgpKTtcblxuICAgIGNvbnN0IGZpcnN0RXh0ZXJuYWxGaWxlUGF0aCA9IGNhbGxlcnMuZmluZCh4ID0+IHtcbiAgICAgIHJldHVybiB4ICE9PSBjYWxsZXJzWzBdO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGZpcnN0RXh0ZXJuYWxGaWxlUGF0aFxuICAgICAgPyBwYXRoLmJhc2VuYW1lKGZpcnN0RXh0ZXJuYWxGaWxlUGF0aClcbiAgICAgIDogJ2Fub255bW91cyc7XG4gIH1cblxuICBnZXQgcGFja2FnZUNvbmZpZ3VyYXRpb24oKSB7XG4gICAgcmV0dXJuIHBrZ0NvbmYuc3luYyhuYW1lc3BhY2UsIHsgZGVmYXVsdHMgfSk7XG4gIH1cblxuICBzZXQgY29uZmlndXJhdGlvbihjb25maWdPYmopIHtcbiAgICB0aGlzLl9jb25maWcgPSBPYmplY3QuYXNzaWduKHRoaXMucGFja2FnZUNvbmZpZ3VyYXRpb24sIGNvbmZpZ09iaik7XG4gIH1cblxuICBfbWVyZ2VUeXBlcyhzdGFuZGFyZCwgY3VzdG9tKSB7XG4gICAgY29uc3QgdHlwZXMgPSBPYmplY3QuYXNzaWduKHt9LCBzdGFuZGFyZCk7XG5cbiAgICBPYmplY3Qua2V5cyhjdXN0b20pLmZvckVhY2godHlwZSA9PiB7XG4gICAgICB0eXBlc1t0eXBlXSA9IE9iamVjdC5hc3NpZ24oe30sIHR5cGVzW3R5cGVdLCBjdXN0b21bdHlwZV0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHR5cGVzO1xuICB9XG5cbiAgX2Zvcm1hdFN0cmVhbShzdHJlYW0pIHtcbiAgICByZXR1cm4gYXJyYXlpZnkoc3RyZWFtKTtcbiAgfVxuXG4gIF9mb3JtYXREYXRlKCkge1xuICAgIHJldHVybiBgWyR7dGhpcy5kYXRlfV1gO1xuICB9XG5cbiAgX2Zvcm1hdEZpbGVuYW1lKCkge1xuICAgIHJldHVybiBgWyR7dGhpcy5maWxlbmFtZX1dYDtcbiAgfVxuXG4gIF9mb3JtYXRTY29wZU5hbWUoKSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodGhpcy5fc2NvcGVOYW1lKSkge1xuICAgICAgY29uc3Qgc2NvcGVzID0gdGhpcy5fc2NvcGVOYW1lLmZpbHRlcih4ID0+IHgubGVuZ3RoICE9PSAwKTtcbiAgICAgIHJldHVybiBgJHtzY29wZXMubWFwKHggPT4gYFske3gudHJpbSgpfV1gKS5qb2luKCcgJyl9YDtcbiAgICB9XG4gICAgcmV0dXJuIGBbJHt0aGlzLl9zY29wZU5hbWV9XWA7XG4gIH1cblxuICBfZm9ybWF0VGltZXN0YW1wKCkge1xuICAgIHJldHVybiBgWyR7dGhpcy50aW1lc3RhbXB9XWA7XG4gIH1cblxuICBfZm9ybWF0TWVzc2FnZShzdHIsIHR5cGUpIHtcbiAgICBzdHIgPSBhcnJheWlmeShzdHIpO1xuXG4gICAgaWYgKHRoaXMuX2NvbmZpZy5jb2xvcmVkSW50ZXJwb2xhdGlvbikge1xuICAgICAgY29uc3QgXyA9IE9iamVjdC5hc3NpZ24oe30sIHV0aWwuaW5zcGVjdC5zdHlsZXMpO1xuXG4gICAgICBPYmplY3Qua2V5cyh1dGlsLmluc3BlY3Quc3R5bGVzKS5mb3JFYWNoKHggPT4ge1xuICAgICAgICB1dGlsLmluc3BlY3Quc3R5bGVzW3hdID0gdHlwZS5jb2xvciB8fCBfW3hdO1xuICAgICAgfSk7XG5cbiAgICAgIHN0ciA9IHV0aWwuZm9ybWF0V2l0aE9wdGlvbnMoeyBjb2xvcnM6IHRydWUgfSwgLi4uc3RyKTtcbiAgICAgIHV0aWwuaW5zcGVjdC5zdHlsZXMgPSBPYmplY3QuYXNzaWduKHt9LCBfKTtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuXG4gICAgcmV0dXJuIHV0aWwuZm9ybWF0KC4uLnN0cik7XG4gIH1cblxuICBfbWV0YSgpIHtcbiAgICBjb25zdCBtZXRhID0gW107XG4gICAgaWYgKHRoaXMuX2NvbmZpZy5kaXNwbGF5RGF0ZSkge1xuICAgICAgbWV0YS5wdXNoKHRoaXMuX2Zvcm1hdERhdGUoKSk7XG4gICAgfVxuICAgIGlmICh0aGlzLl9jb25maWcuZGlzcGxheVRpbWVzdGFtcCkge1xuICAgICAgbWV0YS5wdXNoKHRoaXMuX2Zvcm1hdFRpbWVzdGFtcCgpKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuX2NvbmZpZy5kaXNwbGF5RmlsZW5hbWUpIHtcbiAgICAgIG1ldGEucHVzaCh0aGlzLl9mb3JtYXRGaWxlbmFtZSgpKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3Njb3BlTmFtZS5sZW5ndGggIT09IDAgJiYgdGhpcy5fY29uZmlnLmRpc3BsYXlTY29wZSkge1xuICAgICAgbWV0YS5wdXNoKHRoaXMuX2Zvcm1hdFNjb3BlTmFtZSgpKTtcbiAgICB9XG4gICAgaWYgKG1ldGEubGVuZ3RoICE9PSAwKSB7XG4gICAgICBtZXRhLnB1c2goYCR7ZmlndXJlcy5wb2ludGVyU21hbGx9YCk7XG4gICAgICByZXR1cm4gbWV0YS5tYXAoaXRlbSA9PiBjaGFsay5ncmV5KGl0ZW0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG1ldGE7XG4gIH1cblxuICBfaGFzQWRkaXRpb25hbCh7IHN1ZmZpeCwgcHJlZml4IH0sIGFyZ3MsIHR5cGUpIHtcbiAgICByZXR1cm4gc3VmZml4IHx8IHByZWZpeCA/ICcnIDogdGhpcy5fZm9ybWF0TWVzc2FnZShhcmdzLCB0eXBlKTtcbiAgfVxuXG4gIF9idWlsZFNpZ25hbGUodHlwZSwgLi4uYXJncykge1xuICAgIGxldCBbbXNnLCBhZGRpdGlvbmFsXSA9IFt7fSwge31dO1xuXG4gICAgaWYgKGFyZ3MubGVuZ3RoID09PSAxICYmIHR5cGVvZiBhcmdzWzBdID09PSAnb2JqZWN0JyAmJiBhcmdzWzBdICE9PSBudWxsKSB7XG4gICAgICBpZiAoYXJnc1swXSBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIFttc2ddID0gYXJncztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IFt7IHByZWZpeCwgbWVzc2FnZSwgc3VmZml4IH1dID0gYXJncztcbiAgICAgICAgYWRkaXRpb25hbCA9IE9iamVjdC5hc3NpZ24oe30sIHsgc3VmZml4LCBwcmVmaXggfSk7XG4gICAgICAgIG1zZyA9IG1lc3NhZ2VcbiAgICAgICAgICA/IHRoaXMuX2Zvcm1hdE1lc3NhZ2UobWVzc2FnZSwgdHlwZSlcbiAgICAgICAgICA6IHRoaXMuX2hhc0FkZGl0aW9uYWwoYWRkaXRpb25hbCwgYXJncywgdHlwZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIG1zZyA9IHRoaXMuX2Zvcm1hdE1lc3NhZ2UoYXJncywgdHlwZSk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2lnbmFsZSA9IHRoaXMuX21ldGEoKTtcblxuICAgIGlmIChhZGRpdGlvbmFsLnByZWZpeCkge1xuICAgICAgaWYgKHRoaXMuX2NvbmZpZy51bmRlcmxpbmVQcmVmaXgpIHtcbiAgICAgICAgc2lnbmFsZS5wdXNoKGNoYWxrLnVuZGVybGluZShhZGRpdGlvbmFsLnByZWZpeCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2lnbmFsZS5wdXNoKGFkZGl0aW9uYWwucHJlZml4KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5fY29uZmlnLmRpc3BsYXlCYWRnZSAmJiB0eXBlLmJhZGdlKSB7XG4gICAgICBzaWduYWxlLnB1c2goY2hhbGtbdHlwZS5jb2xvcl0odHlwZS5iYWRnZS5wYWRFbmQodHlwZS5iYWRnZS5sZW5ndGggKyAxKSkpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9jb25maWcuZGlzcGxheUxhYmVsICYmIHR5cGUubGFiZWwpIHtcbiAgICAgIGNvbnN0IGxhYmVsID0gdGhpcy5fY29uZmlnLnVwcGVyY2FzZUxhYmVsXG4gICAgICAgID8gdHlwZS5sYWJlbC50b1VwcGVyQ2FzZSgpXG4gICAgICAgIDogdHlwZS5sYWJlbDtcbiAgICAgIGlmICh0aGlzLl9jb25maWcudW5kZXJsaW5lTGFiZWwpIHtcbiAgICAgICAgc2lnbmFsZS5wdXNoKFxuICAgICAgICAgIGNoYWxrW3R5cGUuY29sb3JdLnVuZGVybGluZShsYWJlbCkucGFkRW5kKHRoaXMuX2xvbmdlc3RMYWJlbCArIDIwKVxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2lnbmFsZS5wdXNoKGNoYWxrW3R5cGUuY29sb3JdKGxhYmVsLnBhZEVuZCh0aGlzLl9sb25nZXN0TGFiZWwgKyAxKSkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChtc2cgaW5zdGFuY2VvZiBFcnJvciAmJiBtc2cuc3RhY2spIHtcbiAgICAgIGNvbnN0IFtuYW1lLCAuLi5yZXN0XSA9IG1zZy5zdGFjay5zcGxpdCgnXFxuJyk7XG4gICAgICBpZiAodGhpcy5fY29uZmlnLnVuZGVybGluZU1lc3NhZ2UpIHtcbiAgICAgICAgc2lnbmFsZS5wdXNoKGNoYWxrLnVuZGVybGluZShuYW1lKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzaWduYWxlLnB1c2gobmFtZSk7XG4gICAgICB9XG4gICAgICBzaWduYWxlLnB1c2goY2hhbGsuZ3JleShyZXN0Lm1hcChsID0+IGwucmVwbGFjZSgvXi8sICdcXG4nKSkuam9pbignJykpKTtcbiAgICAgIHJldHVybiBzaWduYWxlLmpvaW4oJyAnKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fY29uZmlnLnVuZGVybGluZU1lc3NhZ2UpIHtcbiAgICAgIHNpZ25hbGUucHVzaChjaGFsay51bmRlcmxpbmUobXNnKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNpZ25hbGUucHVzaChtc2cpO1xuICAgIH1cblxuICAgIGlmIChhZGRpdGlvbmFsLnN1ZmZpeCkge1xuICAgICAgaWYgKHRoaXMuX2NvbmZpZy51bmRlcmxpbmVTdWZmaXgpIHtcbiAgICAgICAgc2lnbmFsZS5wdXNoKGNoYWxrLnVuZGVybGluZShhZGRpdGlvbmFsLnN1ZmZpeCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2lnbmFsZS5wdXNoKGFkZGl0aW9uYWwuc3VmZml4KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc2lnbmFsZS5qb2luKCcgJyk7XG4gIH1cblxuICBfd3JpdGUoc3RyZWFtLCBtZXNzYWdlKSB7XG4gICAgaWYgKGlzQnJvd3Nlcikge1xuICAgICAgY29uc3QgcGFyc2VkID0gYW5zaS5wYXJzZShtZXNzYWdlKTtcbiAgICAgIHN0cmVhbS53cml0ZSguLi5wYXJzZWQuYXNDaHJvbWVDb25zb2xlTG9nQXJndW1lbnRzKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMuX2ludGVyYWN0aXZlICYmIGlzUHJldmlvdXNMb2dJbnRlcmFjdGl2ZSkge1xuICAgICAgc3RyZWFtLm1vdmVDdXJzb3IoMCwgLTEpO1xuICAgICAgc3RyZWFtLmNsZWFyTGluZSgpO1xuICAgICAgc3RyZWFtLmN1cnNvclRvKDApO1xuICAgIH1cbiAgICBzdHJlYW0ud3JpdGUobWVzc2FnZSArICdcXG4nKTtcbiAgICBpc1ByZXZpb3VzTG9nSW50ZXJhY3RpdmUgPSB0aGlzLl9pbnRlcmFjdGl2ZTtcbiAgfVxuXG4gIF9sb2cobWVzc2FnZSwgc3RyZWFtcyA9IHRoaXMuX3N0cmVhbSkge1xuICAgIGlmICh0aGlzLmlzRW5hYmxlZCkge1xuICAgICAgdGhpcy5fZm9ybWF0U3RyZWFtKHN0cmVhbXMpLmZvckVhY2goc3RyZWFtID0+IHtcbiAgICAgICAgdGhpcy5fd3JpdGUoc3RyZWFtLCBtZXNzYWdlKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIF9sb2dnZXIodHlwZSwgLi4ubWVzc2FnZU9iaikge1xuICAgIHRoaXMuX2xvZyhcbiAgICAgIHRoaXMuX2J1aWxkU2lnbmFsZSh0aGlzLl90eXBlc1t0eXBlXSwgLi4ubWVzc2FnZU9iaiksXG4gICAgICB0aGlzLl90eXBlc1t0eXBlXS5zdHJlYW1cbiAgICApO1xuICB9XG5cbiAgY29uZmlnKGNvbmZpZ09iaikge1xuICAgIHRoaXMuY29uZmlndXJhdGlvbiA9IGNvbmZpZ09iajtcbiAgfVxuXG4gIGRpc2FibGUoKSB7XG4gICAgdGhpcy5fZGlzYWJsZWQgPSB0cnVlO1xuICB9XG5cbiAgZW5hYmxlKCkge1xuICAgIHRoaXMuX2Rpc2FibGVkID0gZmFsc2U7XG4gIH1cblxuICBzY29wZSguLi5uYW1lKSB7XG4gICAgaWYgKG5hbWUubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHNjb3BlIG5hbWUgd2FzIGRlZmluZWQuJyk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgU2lnbmFsZShPYmplY3QuYXNzaWduKHRoaXMuY3VycmVudE9wdGlvbnMsIHsgc2NvcGU6IG5hbWUgfSkpO1xuICB9XG5cbiAgdW5zY29wZSgpIHtcbiAgICB0aGlzLl9zY29wZU5hbWUgPSAnJztcbiAgfVxuXG4gIHRpbWUobGFiZWwpIHtcbiAgICBpZiAoIWxhYmVsKSB7XG4gICAgICBsYWJlbCA9IGB0aW1lcl8ke3RoaXMuX3RpbWVycy5zaXplfWA7XG4gICAgfVxuXG4gICAgdGhpcy5fdGltZXJzLnNldChsYWJlbCwgRGF0ZS5ub3coKSk7XG4gICAgY29uc3QgbWVzc2FnZSA9IHRoaXMuX21ldGEoKTtcblxuICAgIGNvbnN0IHJlcG9ydCA9IFtcbiAgICAgIGNoYWxrLmdyZWVuKHRoaXMuX3R5cGVzLnN0YXJ0LmJhZGdlLnBhZEVuZCgyKSksXG4gICAgICBjaGFsay5ncmVlbi51bmRlcmxpbmUobGFiZWwpLnBhZEVuZCh0aGlzLl9sb25nZXN0TGFiZWwgKyAyMCksXG4gICAgICAnSW5pdGlhbGl6ZWQgdGltZXIuLi4nXG4gICAgXTtcblxuICAgIG1lc3NhZ2UucHVzaCguLi5yZXBvcnQpO1xuICAgIHRoaXMuX2xvZyhtZXNzYWdlLmpvaW4oJyAnKSk7XG4gICAgcmV0dXJuIGxhYmVsO1xuICB9XG5cbiAgdGltZUVuZChsYWJlbCkge1xuICAgIGlmICghbGFiZWwgJiYgdGhpcy5fdGltZXJzLnNpemUpIHtcbiAgICAgIGNvbnN0IGlzID0geCA9PiB4LmluY2x1ZGVzKCd0aW1lcl8nKTtcbiAgICAgIGxhYmVsID0gWy4uLnRoaXMuX3RpbWVycy5rZXlzKCldLnJlZHVjZVJpZ2h0KCh4LCB5KSA9PiB7XG4gICAgICAgIHJldHVybiBpcyh4KSA/IHggOiBpcyh5KSA/IHkgOiBudWxsO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGlmICh0aGlzLl90aW1lcnMuaGFzKGxhYmVsKSkge1xuICAgICAgY29uc3Qgc3BhbiA9IHRpbWVTcGFuKHRoaXMuX3RpbWVycy5nZXQobGFiZWwpKTtcbiAgICAgIHRoaXMuX3RpbWVycy5kZWxldGUobGFiZWwpO1xuXG4gICAgICBjb25zdCBtZXNzYWdlID0gdGhpcy5fbWV0YSgpO1xuICAgICAgY29uc3QgcmVwb3J0ID0gW1xuICAgICAgICBjaGFsay5yZWQodGhpcy5fdHlwZXMucGF1c2UuYmFkZ2UucGFkRW5kKDIpKSxcbiAgICAgICAgY2hhbGsucmVkLnVuZGVybGluZShsYWJlbCkucGFkRW5kKHRoaXMuX2xvbmdlc3RMYWJlbCArIDIwKSxcbiAgICAgICAgJ1RpbWVyIHJ1biBmb3I6JyxcbiAgICAgICAgY2hhbGsueWVsbG93KHNwYW4gPCAxMDAwID8gc3BhbiArICdtcycgOiAoc3BhbiAvIDEwMDApLnRvRml4ZWQoMikgKyAncycpXG4gICAgICBdO1xuXG4gICAgICBtZXNzYWdlLnB1c2goLi4ucmVwb3J0KTtcblxuICAgICAgdGhpcy5fbG9nKG1lc3NhZ2Uuam9pbignICcpKTtcbiAgICAgIHJldHVybiB7IGxhYmVsLCBzcGFuIH07XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU2lnbmFsZTtcbiIsImNvbnN0IGZpZ3VyZXMgPSByZXF1aXJlKCdmaWd1cmVzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBlcnJvcjoge1xuICAgIGJhZGdlOiBmaWd1cmVzLmNyb3NzLFxuICAgIGNvbG9yOiAncmVkJyxcbiAgICBsYWJlbDogJ2Vycm9yJ1xuICB9LFxuICBmYXRhbDoge1xuICAgIGJhZGdlOiBmaWd1cmVzLmNyb3NzLFxuICAgIGNvbG9yOiAncmVkJyxcbiAgICBsYWJlbDogJ2ZhdGFsJ1xuICB9LFxuICBmYXY6IHtcbiAgICBiYWRnZTogZmlndXJlcygn4p2kJyksXG4gICAgY29sb3I6ICdtYWdlbnRhJyxcbiAgICBsYWJlbDogJ2Zhdm9yaXRlJ1xuICB9LFxuICBpbmZvOiB7XG4gICAgYmFkZ2U6IGZpZ3VyZXMuaW5mbyxcbiAgICBjb2xvcjogJ2JsdWUnLFxuICAgIGxhYmVsOiAnaW5mbydcbiAgfSxcbiAgc3Rhcjoge1xuICAgIGJhZGdlOiBmaWd1cmVzLnN0YXIsXG4gICAgY29sb3I6ICd5ZWxsb3cnLFxuICAgIGxhYmVsOiAnc3RhcidcbiAgfSxcbiAgc3VjY2Vzczoge1xuICAgIGJhZGdlOiBmaWd1cmVzLnRpY2ssXG4gICAgY29sb3I6ICdncmVlbicsXG4gICAgbGFiZWw6ICdzdWNjZXNzJ1xuICB9LFxuICB3YXJuOiB7XG4gICAgYmFkZ2U6IGZpZ3VyZXMud2FybmluZyxcbiAgICBjb2xvcjogJ3llbGxvdycsXG4gICAgbGFiZWw6ICd3YXJuaW5nJ1xuICB9LFxuICBjb21wbGV0ZToge1xuICAgIGJhZGdlOiBmaWd1cmVzLmNoZWNrYm94T24sXG4gICAgY29sb3I6ICdjeWFuJyxcbiAgICBsYWJlbDogJ2NvbXBsZXRlJ1xuICB9LFxuICBwZW5kaW5nOiB7XG4gICAgYmFkZ2U6IGZpZ3VyZXMuY2hlY2tib3hPZmYsXG4gICAgY29sb3I6ICdtYWdlbnRhJyxcbiAgICBsYWJlbDogJ3BlbmRpbmcnXG4gIH0sXG4gIG5vdGU6IHtcbiAgICBiYWRnZTogZmlndXJlcy5idWxsZXQsXG4gICAgY29sb3I6ICdibHVlJyxcbiAgICBsYWJlbDogJ25vdGUnXG4gIH0sXG4gIHN0YXJ0OiB7XG4gICAgYmFkZ2U6IGZpZ3VyZXMucGxheSxcbiAgICBjb2xvcjogJ2dyZWVuJyxcbiAgICBsYWJlbDogJ3N0YXJ0J1xuICB9LFxuICBwYXVzZToge1xuICAgIGJhZGdlOiBmaWd1cmVzLnNxdWFyZVNtYWxsRmlsbGVkLFxuICAgIGNvbG9yOiAneWVsbG93JyxcbiAgICBsYWJlbDogJ3BhdXNlJ1xuICB9LFxuICBkZWJ1Zzoge1xuICAgIGJhZGdlOiBmaWd1cmVzKCfirKQnKSxcbiAgICBjb2xvcjogJ3JlZCcsXG4gICAgbGFiZWw6ICdkZWJ1ZydcbiAgfSxcbiAgYXdhaXQ6IHtcbiAgICBiYWRnZTogZmlndXJlcy5lbGxpcHNpcyxcbiAgICBjb2xvcjogJ2JsdWUnLFxuICAgIGxhYmVsOiAnYXdhaXRpbmcnXG4gIH0sXG4gIHdhdGNoOiB7XG4gICAgYmFkZ2U6IGZpZ3VyZXMuZWxsaXBzaXMsXG4gICAgY29sb3I6ICd5ZWxsb3cnLFxuICAgIGxhYmVsOiAnd2F0Y2hpbmcnXG4gIH0sXG4gIGxvZzoge1xuICAgIGJhZGdlOiAnJyxcbiAgICBjb2xvcjogJycsXG4gICAgbGFiZWw6ICcnXG4gIH1cbn07XG4iXX0=
