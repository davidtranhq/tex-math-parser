import { create, all, MathJsInstance } from 'mathjs';

// use BigNumber to reduce floating-point rounding errors
const math = create(all, {
  number: 'BigNumber',
  precision: 64,
}) as MathJsInstance;

// for more conversions, visit https://github.com/josdejong/mathjs/blob/master/src/core/function/typed.js#L167
(math.typed as any).clearConversions();
(math.typed as any).addConversions([
  {
    from: 'number',
    to: 'BigNumber',
    convert: function (x: number) {
      return math.bignumber(x);
    },
  },
  {
    from: 'string',
    to: 'BigNumber',
    convert: function (x: number) {
      try {
        return math.bignumber(x);
      } catch (err) {
        throw new Error('Cannot convert "' + x + '" to BigNumber');
      }
    },
  },
]);

// Additional functions to be passed to the scope of math.evaluate(scope)
// (not defined in mathjs)
const mathImport = {
  lastFn: '',
  lastArgs: [],
  eigenvalues: (matrix: math.MathCollection) => math.eigs(matrix).values,
  eigenvectors: (matrix: math.MathCollection) => math.eigs(matrix).eigenvectors,
  comp: (
    a: math.MathCollection,
    b: math.MathCollection,
  ) => math.divide(math.dot(a, b), math.norm(a)), // component of b along a
  proj: (
    a: math.MathCollection,
    b: math.MathCollection,
  ) => math.multiply(
    math.divide(a, math.norm(a)),
    math.divide(math.dot(a, b), math.norm(a)),
  ), // projection of b along a
};

math.import(mathImport, {
  override: true,
});

// hacky way to disable unit parsing
// https://github.com/josdejong/mathjs/issues/1220
const units = (math as any).Unit.UNITS;
Object.keys(units).forEach((unit) => { delete units[unit]; });

export default math;
