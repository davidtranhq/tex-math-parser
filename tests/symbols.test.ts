import { SymbolNode, IndexNode, AccessorNode } from 'mathjs';
import { parseTex, evaluateTex, Scope } from '../src/index';

test('parses symbols', () => {
  expect(parseTex('a')).toEqual(new SymbolNode('a'));
});

test('parses symbols with subscripts', () => {
  expect(parseTex('a_b')).toEqual(new AccessorNode(new SymbolNode('a'), new IndexNode([new SymbolNode('b')])));
});

test('parses greek symbols', () => {
  expect(parseTex('\\alpha')).toEqual(new SymbolNode('alpha'));
});
