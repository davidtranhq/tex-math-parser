import { create, all, MathJsStatic } from 'mathjs';

// use BigNumber to reduce floating-point rounding errors
const math = create(all, {
  number: 'BigNumber',
  precision: 12,
}) as MathJsStatic;

// Additional functions to be passed to the scope of math.evaluate(scope)
// (not defined in mathjs)
const mathImport = {
  lastFn: '',
  lastArgs: [],
  eigenvalues: (matrix: any) => math.eigs(matrix).values,
  eigenvectors: (matrix: any) => math.eigs(matrix).vectors,
};

math.import(mathImport, {
  override: true,
});

// hacky way to disable unit parsing
// https://github.com/josdejong/mathjs/issues/1220
const units = (math as any).Unit.UNITS;
Object.keys(units).forEach((unit) => { delete units[unit]; });

export default math;
