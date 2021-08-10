export const enum TokenType {
  Number,
  Variable,
  Equals,
  Plus,
  Minus,
  Star,
  Slash,
  Caret,
  Lbrace,
  Rbrace,
  Lparen,
  Rparen,
  Bar,
  Amp,
  Dblbackslash,
  Sqrt,
  Frac,
  Sin,
  Cos,
  Tan,
  Csc,
  Sec,
  Cot,
  Arcsin,
  Arccos,
  Arctan,
  Log,
  Ln,
  Pi,
  E,
  Begin,
  End,
  Matrix,
  Left,
  Right,
  Eof,
  T,
  Det,
  Opname,
  Eigenvalues,
  Eigenvectors,
  Cross,
}

export const lexemeToType: { [key: string]: TokenType } = {
  '=': TokenType.Equals,
  '+': TokenType.Plus,
  '-': TokenType.Minus,
  '*': TokenType.Star,
  '\\cdot': TokenType.Star,
  '^': TokenType.Caret,
  '/': TokenType.Slash,
  '{': TokenType.Lbrace,
  '}': TokenType.Rbrace,
  '(': TokenType.Lparen,
  ')': TokenType.Rparen,
  '|': TokenType.Bar,
  '&': TokenType.Amp,
  bmatrix: TokenType.Matrix,
  '\\\\': TokenType.Dblbackslash,
  '\\sqrt': TokenType.Sqrt,
  '\\frac': TokenType.Frac,
  '\\sin': TokenType.Sin,
  '\\cos': TokenType.Cos,
  '\\tan': TokenType.Tan,
  '\\csc': TokenType.Csc,
  '\\sec': TokenType.Sec,
  '\\cot': TokenType.Cot,
  '\\arcsin': TokenType.Arcsin,
  '\\arccos': TokenType.Arccos,
  '\\arctan': TokenType.Arctan,
  '\\log': TokenType.Log,
  '\\ln': TokenType.Ln,
  '\\pi': TokenType.Pi,
  e: TokenType.E,
  '\\begin': TokenType.Begin,
  '\\end': TokenType.End,
  '\\left': TokenType.Left,
  '\\right': TokenType.Right,
  T: TokenType.T,
  '\\det': TokenType.Det,
  '\\operatorname': TokenType.Opname,
  eigenvectors: TokenType.Eigenvectors,
  eigenvalues: TokenType.Eigenvalues,
  cross: TokenType.Cross,
};

/**
 * A mapping from a token type to the operation it represents.
 * The operation is the name of a function in the mathjs namespace,
 * or of a function to be defined in scope (i.e. in the argument to math.evaluate())
 */
export const typeToOperation: { [key in TokenType]?: string } = {
  [TokenType.Plus]: 'add',
  [TokenType.Minus]: 'subtract',
  [TokenType.Star]: 'multiply',
  [TokenType.Caret]: 'pow',
  [TokenType.Slash]: 'divide',
  [TokenType.Frac]: 'divide',
  [TokenType.Bar]: 'abs',
  [TokenType.Sqrt]: 'sqrt',
  [TokenType.Sin]: 'sin',
  [TokenType.Cos]: 'cos',
  [TokenType.Tan]: 'tan',
  [TokenType.Csc]: 'csc',
  [TokenType.Sec]: 'sec',
  [TokenType.Cot]: 'cot',
  [TokenType.Arcsin]: 'asin',
  [TokenType.Arccos]: 'acos',
  [TokenType.Arctan]: 'atan',
  [TokenType.Log]: 'log10',
  [TokenType.Ln]: 'log',
  [TokenType.Det]: 'det',
  [TokenType.Eigenvectors]: 'eigenvectors',
  [TokenType.Eigenvalues]: 'eigenvalues',
  [TokenType.Cross]: 'cross',
};

interface Token {
  lexeme: string;
  type: TokenType;
  pos: number;
}

class Token {
  /**
     * A token in a TeX string.
     * @param {string} lexeme string literal of the token
     * @param {TokenType} type type of the token
     * @param {Number} pos position of the token in the input string
     *
     * @constructor Token
     */
  constructor(lexeme: string, type: TokenType, pos: number) {
    this.lexeme = lexeme;
    this.type = type;
    this.pos = pos;
  }
}

export default Token;
