import { evaluateTex, Scope } from '../src/index';
import { number, matrix, deepEqual } from 'mathjs';

function evaluate(texStr: string, scope?: Scope) {
  return number(evaluateTex(texStr, scope).evaluated);
}

// this is the example shown in the README
test('evaluates full expression', () => {
  const expected = matrix([-22.812481734548864, -33.89173627896382]);
  const actual = evaluate(String.raw`
    \begin{bmatrix}
      1&3\\
      2&4
    \end{bmatrix}
    \begin{bmatrix}
      -5\\-6
    \end{bmatrix}
    +
    \left|
      \sqrt{7}-\sqrt{8}
    \right|^{\frac{9}{10}}
    \begin{bmatrix}
      \cos\left(\frac{\pi}{6}\right)\\
      \sin\left(\frac{\pi}{6}\right)
    \end{bmatrix}`);

  expect(deepEqual(actual, expected)).toBe(true);
});
