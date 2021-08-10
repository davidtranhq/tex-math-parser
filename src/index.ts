import math from './customMath';
import tokenizeTex from './tokenizeTex';
import parseTokens from './parseTokens';

// scope used by evaluateTex to resolve identifiers
type Scope = { [key: string]: any };

/**
 * Parse a TeX math string into a MathJS expression tree.
 * @returns Returns the root node of a MathJS expression tree.
 */
function parseTex(texStr: string): math.MathNode {
  return parseTokens(tokenizeTex(texStr));
}

/**
 * Evaluate a TeX math string, returning the result as a MathJS MathType.
 */
function evaluateTex(texStr: string, scope: Scope = {}) {
  const modifiedScope = scope;
  const evaluated = parseTex(texStr).evaluate(modifiedScope);
  return {
    evaluated,
    scope: modifiedScope,
  };
}

/**
 * Evaluate a TeX math string, returning the result as a JavaScript object.
 * Identifiers are resolved with the passed JavaScript object `scope`.
 * @returns Returns an object containing the evaluated TeX string, type, and the modified scope.
 */
function evaluateTexToJS(texStr: string, scope: Scope = {}) {
  // add additional functions not defined in mathjs
  const modifiedScope = scope;
  // math.MathNode.evaluate() modifies the `modifiedScope` argument
  const evaluated = parseTex(texStr).evaluate(modifiedScope);
  function fixRoundingError(val: any) {
    if (math.typeOf(val) === 'Matrix') {
      return val.map(fixRoundingError);
    }
    return math.abs(val) < Number.EPSILON ? 0 : val;
  }
  const formatted = math.format(fixRoundingError(evaluated), { precision: 12 });
  const type: string = typeof evaluated.type === 'string' ? evaluated.type : '';
  return {
    evaluated: formatted,
    scope: modifiedScope,
    type: math.typeOf(evaluated),
  };
}

/**
 * Evaluate a TeX math string, returning the result as a TeX string.
 * Identifiers are resolved with the passed JavaScript object `scope`.
 * @returns Returns the evaluated TeX string as a TeX string, the modified scope, and type.
 */
function evaluateTexToTex(texStr: string, scope?: Scope) {
  const { evaluated, scope: modifiedScope, type } = evaluateTexToJS(texStr, scope);
  return {
    evaluated: math.parse(evaluated).toTex(),
    scope: modifiedScope,
    type,
  };
}

/**
 * Evaluate a TeX math string, returning the result as both a TeX string and a JavaScript object.
 * Identifiers are resolved with the passed JavaScript object `scope`.
 * @returns Object containing a TeX string and a JavaScript object,
 *          both representing the evaluated TeX string.
 */
function evaluateTex2(texStr: string, scope?: Scope) {
  const { evaluated: evaluatedJSON, scope: modifiedScope, type } = evaluateTexToJS(texStr, scope);
  const evaluatedTex = math.parse(evaluatedJSON).toTex();
  return {
    tex: evaluatedTex,
    js: JSON.parse(evaluatedJSON),
    scope: modifiedScope,
    type,
  };
}

export {
  parseTex,
  evaluateTex,
};
