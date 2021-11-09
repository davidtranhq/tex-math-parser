import Token from './Token';

export default class ParseError extends Error {
  constructor(message = '', token: Token, ...args: any[]) {
    super(...args);
    this.name = 'ParseError';
    this.message = `${token.lexeme} at ${token.pos}: ${message}`;
  }
}
