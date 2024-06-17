import Token, { TokenType, lexemeToType, lexemeToSymbol } from './Token';

function isWhitespace(c: string) {
  return c.trim() === '';
}

function isAlpha(c: string) {
  return /^[A-Za-z]{1,1}$/.test(c);
}

function isControl(c: string) {
  return /[^ -~]/.test(c);
}

function isDigit(c: string) {
  return c >= '0' && c <= '9';
}

// Returns the next word starting at pos in the string.
// If the string begins with non-alphabetic characters at pos, returns an empty string.
function scanWord(str: string, pos: number) {
  if (!isAlpha(str[pos])) {
    return '';
  }
  let end = pos;
  // consume characters until a non-alphabetic character is encountered
  while (isAlpha(str[end])) {
    end += 1;
  }
  return str.slice(pos, end);
}

// Returns the next number starting at pos in the string.
// If the string begins with a non-digit at pos, returns an empty string.
function scanNumber(str: string, pos: number) {
  if (!isDigit(str[pos])) {
    return '';
  }
  let end = pos + 1;
  // consume characters until a non-digit is found
  while (isDigit(str[end])) {
    end += 1;
  }
  if (str[end] === '.') {
    end += 1;
    // decimal number
    while (isDigit(str[end])) {
      end += 1;
    }
  }
  return str.slice(pos, end);
}

class LexError extends Error {
  constructor(message = '', pos: number, ...args: any) {
    super(...args);
    this.name = 'LexError';
    this.message = `at ${pos}: ${message}`;
  }
}

// Convert a TeX string to an array of tokens
export default function tokenizeTex(texStr: string) {
  let i = 0;
  const { length } = texStr;
  const tokens = [];
  while (i < length) {
    // skip leading whitespace
    while (isWhitespace(texStr[i])) {
      i += 1;
    }
    let lexeme = '';
    let type = TokenType.Eof;
    const c = texStr[i];
    // don't accept control characters
    if (isControl(c)) {
      throw new LexError('invalid control sequence encountered '
                + '(forgot to escape backslashes (\\begin => \\\\begin)?)', i);
    }
    // scan for single-char non-alphabetical lexemes
    if (!isAlpha(c) && c in lexemeToType) {
      type = lexemeToType[c];
      lexeme = c;
    } else if (c === '\\') {
      // scan for multi-char lexemes starting with \
      const nextChar = texStr[i + 1];
      if (nextChar === '\\') {
        // double backslash
        type = TokenType.Dblbackslash;
        lexeme = '\\\\';
      } else if (nextChar === ' ') {
        // space character: ignore
        type = TokenType.Space;
        lexeme = '\\ ';
      } else {
        // TeX command
        const command = scanWord(texStr, i + 1);
        if (command === undefined) {
          // an alpha char must immediately follow the backslash
          // or the command is malformed
          throw new LexError('expected command '
                        + '(a non-alphabetic character was encountered)', i);
        } else {
          lexeme = `\\${command}`;
          type = lexemeToType[lexeme];
          if (type === undefined && lexeme in lexemeToSymbol) {
            type = TokenType.Symbol;
          }
          if (type === undefined) {
            throw new LexError(`unknown command "${lexeme}"`, i);
          }
        }
      }
    } else if (isDigit(c)) {
      // scan for numbers
      // the position i passed to scanNumber includes the current digit character
      // because the first character is part of the number
      lexeme = scanNumber(texStr, i);
      type = TokenType.Number;
    } else if (isAlpha(c)) {
      // scan for identifiers
      const identifier = scanWord(texStr, i);
      if (identifier in lexemeToType) {
        // identifier is a "keyword" (e.g. matrix)
        lexeme = identifier;
        type = lexemeToType[identifier];
      } else {
        // identifier has no meaning; interpret as a sequence of single-char lexemes
        const ch = identifier[0];
        if (ch in lexemeToType) {
          // single-char alphabetical lexeme
          lexeme = ch;
          type = lexemeToType[ch];
        } else {
          // unrecognized alphabetical lexeme: treat as variable
          lexeme = ch;
          type = TokenType.Variable;
        }
      }
    } else {
      throw new LexError(`unrecognized character "${c}"`, i);
    }
    // ignore space characters
    if (type !== TokenType.Space) {
      tokens.push(new Token(lexeme, type, i));
    }
    i += lexeme.length;
  }
  tokens.push(new Token('EOF', TokenType.Eof, i));
  return tokens;
}
