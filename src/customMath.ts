import { create, all, MathJsStatic } from 'mathjs';

const math = create(all, {
  number: 'BigNumber',
  precision: 32,
}) as MathJsStatic;

const originalDet = math.det;

const customFns = {
  eigenvalues: (matrix: math.Matrix) => {
    const result = math.eigs(matrix).values as any;
    result.subtype = 'Eigenvalues';
    result.previous = matrix;
    return result;
  },
  eigenvectors: (matrix: math.Matrix) => {
    const result = math.eigs(matrix).vectors as any;
    result.subtype = 'Eigenvectors';
    result.previous = matrix;
    return result;
  },
  det: (matrix: math.Matrix) => {
    const result = originalDet(matrix) as any;
    result.subtype = 'Determinant';
    result.previous = matrix;
    return result;
  },
};

const importOptions = {
  override: true,
  silent: false,
  wrap: false,
};

math.import(customFns, importOptions);

// hacky way to disable unit parsing
// https://github.com/josdejong/mathjs/issues/1220
const units = (math as any).Unit.UNITS;
Object.keys(units).forEach((unit) => { delete units[unit]; });

export default math;
