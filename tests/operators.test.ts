import { parseTex, evaluateTex, Scope } from '../src/index';
import { matrix, deepEqual } from 'mathjs';

function evaluate(texStr: string, scope?: Scope) {
  return evaluateTex(texStr).evaluated;
}

test('evaluates addition', () => {
  expect(evaluate('1 + 2')).toStrictEqual(3);
});

test('evaluates subtraction', () => {
  expect(evaluate('1 - 2')).toStrictEqual(-1);
});

test('evaluates multiplication', () => {
  expect(evaluate('2 * 3')).toStrictEqual(6);
  expect(evaluate('2 \\cdot 3')).toStrictEqual(6);
});

test('evaluates exponentiation', () => {
  expect(evaluate('2 ^ 3')).toStrictEqual(8);
  // try also with different groupings
  expect(evaluate('2^(3)')).toStrictEqual(8);
  expect(evaluate('2^{3}')).toStrictEqual(8);
})

test('evaluates division', () => {
  expect(evaluate('8 / 2')).toStrictEqual(4);
  expect(evaluate('3 / 2')).toStrictEqual(1.5);
});

test('evaluates absolute value', () => {
  expect(evaluate('\\left| 6 \\right|')).toStrictEqual(6);
  expect(evaluate('\\left| -6 \\right|')).toStrictEqual(6);
  // NOTE: this should not work, absolute value requires \left and \right
  // expect(evaluate('| -6 |')).toStrictEqual(6);
});

test('evaluates cross product', () => {
  const expected = matrix([-3, 6, -3]);
  const actual = evaluate(String.raw`
    \begin{bmatrix}1\\2\\3\end{bmatrix}
    \times
    \begin{bmatrix}4\\5\\6\end{bmatrix}`
  );

  expect(deepEqual(expected, actual)).toBe(true);
});