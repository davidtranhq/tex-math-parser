import { evaluateTex, Scope } from '../src/index';
import { number } from 'mathjs';

function evaluate(texStr: string, scope?: Scope) {
  return number(evaluateTex(texStr, scope).evaluated);
}

describe('evaluates with symbol (single char)', () => {
  test('symbols: a, b, c', () => {
    const a = evaluate('a', {a: 1})
    const b = evaluate('b', {b: 1})
    const c = evaluate('c', {c: 1})

    expect(a).toStrictEqual(1)
    expect(b).toStrictEqual(1)
    expect(c).toStrictEqual(1)
  })

  test('addition with symbols: a, b', () => {
    expect(evaluate('a + b', {a: 1, b: 2})).toStrictEqual(3);
  });

  test('subtraction with symbols: a, b', () => {
    expect(evaluate('a - b', {a: 1, b: 2})).toStrictEqual(-1);
  });


  test('multiplication with symbols a, b', () => {
    expect(evaluate('a * b', {a: 2, b: 3})).toStrictEqual(6);
    expect(evaluate('a \\cdot b', {a: 2, b: 3})).toStrictEqual(6);
  });

  test('exponentiation with symbols a, b', () => {
    expect(evaluate('a ^ b', {a: 2, b: 3})).toStrictEqual(8);
    // try also with different groupings
    expect(evaluate('a^(b)', {a: 2, b: 3})).toStrictEqual(8);
    expect(evaluate('a^{b}', {a: 2, b: 3})).toStrictEqual(8);
  })
})

describe('evaluates with symbol (multiple chars)', () => {
  test('aa, bbb, abcd', () => {
    const aa = evaluate('aa', {aa: 1})
    const bbb = evaluate('bbb', {bbb: 1})
    const abcd = evaluate('abcd', {abcd: 1})

    expect(aa).toStrictEqual(1)
    expect(bbb).toStrictEqual(1)
    expect(abcd).toStrictEqual(1)
  })

  test('addition with symbols: aa, bbb', () => {
    expect(evaluate('aa + bbb', {aa: 1, bbb: 2})).toStrictEqual(3);
  });
})
