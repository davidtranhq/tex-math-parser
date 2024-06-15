import math from './customMath';
import ParseError from './ParseError';
import Token, { TokenType, typeToOperation, lexemeToType, lexemeToSymbol } from './Token';

/**
 * Create the corresponding MathJS node of a Token and its children.
 * @returns A newly constructed MathJS node.
 */
function createMathJSNode(token: Token, children: math.MathNode[] = []): math.MathNode {
  let fn = typeToOperation[token.type];
  switch (token.type) {
    case TokenType.Equals:
      return new (math as any).OperatorNode('==', fn, children)
    case TokenType.Times:
      return new (math as any).FunctionNode('cross', children);
    case TokenType.Minus:
      // mathjs differentiates between subtraction and the unary minus
      fn = children.length === 1 ? 'unaryMinus' : fn;
      // falls through
    case TokenType.Plus:
    case TokenType.Star:
    case TokenType.Frac:
    case TokenType.Slash:
    case TokenType.Notequals:
    case TokenType.Less:
    case TokenType.Lessequal:
    case TokenType.Greater:
    case TokenType.Greaterequal:
      return new (math as any).OperatorNode(lexemeToSymbol[token.lexeme] ?? token.lexeme, fn, children);
    case TokenType.Caret:
      if (children.length < 2) {
        throw new ParseError('Expected two children for ^ operator', token);
      }
      // manually check for ^T as the transpose operation
      if (children[1].isSymbolNode && children[1].name === 'T') {
        return new (math as any).FunctionNode('transpose', [children[0]]);
      }
      return new (math as any).OperatorNode(token.lexeme, fn, children);
    case TokenType.Underscore:
      return new (math as any).AccessorNode(children[0], new (math as any).IndexNode(children.slice(1)))
    // mathjs built-in functions
    case TokenType.Bar:
    case TokenType.Sqrt:
    case TokenType.Sin:
    case TokenType.Cos:
    case TokenType.Tan:
    case TokenType.Csc:
    case TokenType.Sec:
    case TokenType.Cot:
    case TokenType.Sinh:
    case TokenType.Cosh:
    case TokenType.Tanh:
    case TokenType.Arcsin:
    case TokenType.Arccos:
    case TokenType.Arctan:
    case TokenType.Log:
    case TokenType.Ln:
    case TokenType.Eigenvalues:
    case TokenType.Eigenvectors:
    case TokenType.Det:
    case TokenType.Cross:
    case TokenType.Proj:
    case TokenType.Comp:
    case TokenType.Norm:
    case TokenType.Inv:
      return new (math as any).FunctionNode(fn, children);
    case TokenType.Opname:
      return new (math as any).FunctionNode(children[0], children.slice(1));
    case TokenType.Colon:
      return new (math as any).AssignmentNode(children[0], children[1]);
    case TokenType.Variable:
      return new (math as any).SymbolNode(token.lexeme);
    case TokenType.Number: {
      // convert string lexeme to number if posssible
      const constant = Number.isNaN(Number(token.lexeme)) ? token.lexeme : +token.lexeme;
      return new (math as any).ConstantNode(constant);
    }
    case TokenType.Symbol:
      return new (math as any).SymbolNode(lexemeToSymbol[token.lexeme]);
    case TokenType.E:
      return new (math as any).SymbolNode('e');
    case TokenType.True:
      return new (math as any).SymbolNode('true');
    case TokenType.False:
      return new (math as any).SymbolNode('false');
    case TokenType.Undefined:
      return new (math as any).SymbolNode('undefined');
    case TokenType.Matrix:
      return new (math as any).ArrayNode(children);
    case TokenType.T:
      return new (math as any).SymbolNode('T');
    default:
      throw new ParseError('unknown token type', token);
  }
}

function createMathJSString(tokens: Token[]): math.MathNode {
  return new (math as any).SymbolNode(tokens.map(token => {
    switch (token.type) {
      case TokenType.Variable:
      case TokenType.Number:
      case TokenType.E:
      case TokenType.T:
      case TokenType.Eigenvalues:
      case TokenType.Eigenvectors:
      case TokenType.Cross:
      case TokenType.Proj:
      case TokenType.Norm:
      case TokenType.Inv:
        return token.lexeme
      case TokenType.Symbol:
        return lexemeToSymbol[token.lexeme]
      default:
        throw new ParseError('unknown token type', token);
    }
  }).join(""))
}

// Maps each left grouping token to its corresponding right grouping token
const rightGrouping: { [key in TokenType]?: TokenType } = {
  [TokenType.Lparen]: TokenType.Rparen,
  [TokenType.Lbrace]: TokenType.Rbrace,
  [TokenType.Left]: TokenType.Right,
  [TokenType.Bar]: TokenType.Bar,
};

// Token types that are primaries or denote the start of a primary
const primaryTypes = [
  TokenType.Left,
  TokenType.Lparen,
  TokenType.Lbrace,
  TokenType.Bar,
  TokenType.Number,
  TokenType.Variable,
  TokenType.Symbol,
  TokenType.Frac,
  TokenType.Sqrt,
  TokenType.Sin,
  TokenType.Cos,
  TokenType.Tan,
  TokenType.Csc,
  TokenType.Sec,
  TokenType.Cot,
  TokenType.Arcsin,
  TokenType.Arccos,
  TokenType.Arctan,
  TokenType.Sinh,
  TokenType.Cosh,
  TokenType.Tanh,
  TokenType.Log,
  TokenType.Ln,
  TokenType.Det,
  TokenType.Mathrm,
  TokenType.Mathbf,
  TokenType.E,
  TokenType.Begin,
  TokenType.T, // e.g. [[1,2],[3,4]]^T
  TokenType.Opname,
];

class Parser {
  tokens: Token[];

  pos: number;

  /**
     * A recursive descent parser for TeX math. The following context-free grammar is used:
     *
     * comp => expr ((EQUALS | NOTEQUALS | LESS | LESSEQUAL | GREATER | GREATEREQUAL) expr)*
     *       | VARIABLE EQUALS EQUALS comp
     *
     * expr = term ((PLUS | MINUS) term)*
     *
     * term = factor ((STAR factor | primary))* //primary and factor must both not be numbers
     *
     * factor = MINUS? power
     *
     * power = primary (CARET primary)*
     *
     * primary = grouping
     *         | environnment
     *         | frac
     *         | function
     *         | NUMBER
     *         | VARIABLE
     *
     * grouping = LEFT LPAREN comp RIGHT RPAREN
     *          | LPAREN comp RPAREN
     *          | LBRACE comp RBRACE
     *          | LEFT BAR comp RIGHT BAR
     *          | BAR comp BAR
     *
     * environnment = matrix
     *
     * frac = FRAC LBRACE comp RBRACE LBRACE comp RBRACE
     *
     * matrix = BEGIN LBRACE MATRIX RBRACE ((comp)(AMP | DBLBACKSLASH))* END LBRACE MATRIX RBRACE
     *
     * function = (SQRT | SIN | COS | TAN | ...) argument
     *          | OPNAME LBRACE customfunc RBRACE argument
     *
     * argument = grouping
     *          | comp
     *
     * In general, each production is represented by one method (e.g. nextFactor(), nextPower()...)
     *
     * @param tokens A list of Tokens to be parsed.
     */
  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.pos = 0;
  }

  /**
     * Get the type that the current token matches.
     * @param types A variable number of token types to match the current token
     *              with.
     * @returns Returns the matched token type if there is a match.
     *          Otherwise returns undefined.
     */
  match(...types: TokenType[]): TokenType | undefined {
    const { type } = this.tokens[this.pos];
    return (types.indexOf(type) !== -1) ? type : undefined;
  }

  /**
     * Get the next token and advance the position in the token stream.
     * @returns Returns the next token in the token stream.
     */
  nextToken(): Token {
    return this.tokens[this.pos++];
  }

  /**
     * Get the current token in the token stream without consuming it.
     * @returns Returns the current token in the token stream.
     */
  currentToken(): Token {
    return this.tokens[this.pos];
  }

  /**
     * Get the previous token in the token stream. Returns undefined
     * if the position is at the beginning of the stream.
     * @returns Returns the previous token in the token stream.
     */
  previousToken(): Token {
    return this.tokens[this.pos - 1];
  }

  /**
     * Consume the next expression in the token stream according to the following production:
     *
     * comp => expr ((EQUALS | NOTEQUALS | LESS | LESSEQUAL | GREATER | GREATEREQUAL) expr)*
     *       | VARIABLE EQUALS EQUALS comp
     * @returns Returns the root node of an expression tree.
     */
  nextComparison(): math.MathNode {
    let leftExpr = this.nextExpression()
    // VARIABLE EQUALS comp
    if (this.match(TokenType.Colon)) {
      if (!leftExpr.isSymbolNode) {
        throw new ParseError('expected variable (SymbolNode) on left hand of assignment',
          this.previousToken());
      }
      const colon = this.nextToken();
      this.tryConsume("Expected '=' after ':'", TokenType.Equals);
      const rightComp = this.nextComparison();
      return createMathJSNode(colon, [leftExpr, rightComp]);
    }

    // expr ((EQUALS | NOTEQUALS | LESS | LESSEQUAL | GREATER | GREATEREQUAL) expr)*

    if (this.match(TokenType.Equals, TokenType.Notequals, TokenType.Less,
                      TokenType.Lessequal, TokenType.Greater, TokenType.Greaterequal)) {
      // TODO: Convert this to allow chained comparisons (can't be directly done with while loop)
      const operator = this.nextToken();
      const rightExpr = this.nextExpression();
      leftExpr = createMathJSNode(operator, [leftExpr, rightExpr]);
    }
    return leftExpr
  }

  /**
     * Consume the next expression in the token stream according to the following production:
     *
     * expr => term ((PLUS | MINUS) term)*
     * @returns Returns the root node of an expression tree.
     */
  nextExpression(): math.MathNode {
    let leftTerm = this.nextTerm();
    // term ((PLUS | MINUS) term)*

    while (this.match(TokenType.Plus, TokenType.Minus)) {
      // build the tree with left-associativity
      const operator = this.nextToken();
      const rightTerm = this.nextTerm();
      leftTerm = createMathJSNode(operator, [leftTerm, rightTerm]);
    }
    return leftTerm;
  }

  /**
     * Consume the next term according to the following production:
     *
     * term => factor (((STAR | TIMES) factor) | power)*
     * @returns Returns the root node of an expression tree.
     */
  nextTerm(): math.MathNode {
    function isNumberNode(node: math.MathNode) {
      return node.isConstantNode && !Number.isNaN(Number(node));
    }
    let leftFactor = this.nextFactor();
    let implicitMult = false;
    // since bmatrix is the only environnment supported, it suffices to only have
    // one token lookahead and assume that \begin is the start of a matrix.
    // However, if more environnment support is added, it would be necessary to
    // have more lookahead and ensure that the matrix begins with BEGIN LBRACE MATRIX.
    for (;;) {
      const lookaheadType = this.match(
        TokenType.Star,
        TokenType.Times,
        TokenType.Slash,
        ...primaryTypes,
      );
      if (lookaheadType === undefined) {
        break;
      }
      let operator;
      let rightFactor;
      // multiplication between two adjacent factors is implicit as long as
      // they are not both numbers
      if (isNumberNode(leftFactor) && lookaheadType === TokenType.Number) {
        throw new ParseError('multiplication is not implicit between two different'
                    + 'numbers: expected * or \\cdot', this.currentToken());
      } else if (this.match(TokenType.Star, TokenType.Times, TokenType.Slash)) {
        operator = this.nextToken();
        rightFactor = this.nextFactor();
      } else {
        const starPos = this.pos;
        // implicit multiplication is only vaild if the right factor is not negated
        // (2x != 2-x), so we parse a power instead of a factor
        rightFactor = this.nextPower();
        // multiplication is implicit: a multiplication (star) token needs to be created
        operator = new Token('*', TokenType.Star, starPos);
        implicitMult = true;
      }
      leftFactor = createMathJSNode(operator, [leftFactor, rightFactor]);
      (leftFactor as any).implicit = implicitMult;
    }
    return leftFactor;
  }

  /**
     * Consume the next factor according to the following production:
     *
     * factor => MINUS? power
     * @returns The root node of an expression tree.
     */
  nextFactor(): math.MathNode {
    // match for optional factor negation
    if (this.match(TokenType.Minus)) {
      const negate = this.nextToken();
      const primary = this.nextPower();
      return createMathJSNode(negate, [primary]);
    }
    return this.nextPower();
  }

  /**
     * Consume the next power according to the following production:
     *
     * power => subscript (CARET primary)*
     * @returns The root node of an expression tree.
     */
  nextPower(): math.MathNode {
    let base = this.nextSubscript();
    while (this.match(TokenType.Caret)) {
      const caret = this.nextToken();
      const exponent = this.nextPrimary();
      base = createMathJSNode(caret, [base, exponent]);
    }
    return base;
  }

  /**
     * Consume the next subscript according to the following production:
     *
     * subscript => primary (_ primary)*
     * @returns The root node of an expression tree.
     */
  nextSubscript(): math.MathNode {
    let base = this.nextPrimary();
    while (this.match(TokenType.Underscore)) {
      const underscore = this.nextToken();
      let subscript;
      if (this.match(TokenType.Left, TokenType.Lparen, TokenType.Lbrace, TokenType.Bar)) {
        subscript = this.nextGrouping();
      } else {
        subscript = [this.nextPrimary()];
      }
      base = createMathJSNode(underscore, [base, ...subscript]);
    }
    return base;
  }

  /**
     * Try to consume a token of the given type. If the next token does not match,
     * an error is thrown.
     * @param errMsg Error message associated with the error if the match fails.
     * @param tokenTypes A variable amount of token types to match.
     * @returns Returns the consumed token on successful match.
     */
  tryConsume(errMsg: string, ...tokenTypes: TokenType[]): Token {
    const lookaheadType = this.match(...tokenTypes);
    if (lookaheadType === undefined) {
      throw new ParseError(errMsg, this.currentToken());
    }
    return this.nextToken();
  }

  /**
     * Consume the next primary according to the following production:
     *
     * primary => grouping
     *          | environnment
     *          | frac
     *          | function
     *          | NUMBER
     *          | VARIABLE
     *
     * @returns The root node of an expression tree.
     */
  nextPrimary(): math.MathNode {
    const lookaheadType = this.match(...primaryTypes);
    if (lookaheadType === undefined) {
      throw new ParseError('expected primary', this.currentToken());
    }
    let primary;
    switch (lookaheadType) {
      case TokenType.Left:
      case TokenType.Lparen:
      case TokenType.Lbrace:
      case TokenType.Bar:
        // nextGrouping can return an array of children
        // (if the grouping contains comma-seperated values, e.g. for a multi-value function),
        // so for a primary, we only take the first value (or if there is just one, the only value)
        [primary] = this.nextGrouping();
        break;
      case TokenType.Number:
      case TokenType.Variable:
      case TokenType.Symbol:
      case TokenType.E:
      case TokenType.T:
        primary = createMathJSNode(this.nextToken());
        break;
      case TokenType.Sqrt:
      case TokenType.Sin:
      case TokenType.Cos:
      case TokenType.Tan:
      case TokenType.Csc:
      case TokenType.Sec:
      case TokenType.Cot:
      case TokenType.Arcsin:
      case TokenType.Arccos:
      case TokenType.Arctan:
      case TokenType.Sinh:
      case TokenType.Cosh:
      case TokenType.Tanh:
      case TokenType.Log:
      case TokenType.Ln:
      case TokenType.Det:
        primary = this.nextUnaryFunc();
        break;
      case TokenType.Opname:
        primary = this.nextCustomFunc();
        break;
      case TokenType.Frac:
        primary = this.nextFrac();
        break;
      case TokenType.Mathrm:
        // booleans are the only currently supported mathrm tag
        primary = this.nextBoolean();
        break;
      case TokenType.Mathbf:
        // Undefined is the only currently supported mathbf tag
        primary = this.nextUndefined();
        break;
      case TokenType.Begin:
        // matrix is the only currently supported environnment: if more are added, another
        // token of lookahead would be required to know which environnment to parse
        primary = this.nextMatrix();
        break;
      default:
        throw new ParseError('unknown token encountered during parsing', this.nextToken());
    }
    return primary;
  }

  /**
     * Consume the next grouping according to the following production:
     *
     * grouping = LEFT LPAREN comp RIGHT RPAREN
     *          | LPAREN comp RPAREN
     *          | LBRACE comp RBRACE
     *          | LEFT BAR comp RIGHT BAR
     *          | BAR comp BAR
     *          | comp
     *
     * @returns The root node of an expression tree.
     */
  nextGrouping(): math.MathNode[] {
    // token indicating start of grouping
    let leftRight = false; // flag indicating if grouping tokens are marked with \left and \right
    if (this.match(TokenType.Left)) {
      leftRight = true;
      this.nextToken(); // consume \left
    }
    const leftGrouping = this.tryConsume("expected '(', '|', '{'",
      TokenType.Lparen,
      TokenType.Bar,
      TokenType.Lbrace);
    let grouping = this.nextExpression();

    if (leftGrouping.type === TokenType.Bar) {
      // grouping with bars |x| also applies a function, so we create the corresponding function
      // here
      grouping = createMathJSNode(leftGrouping, [grouping]);
    }
    // a grouping can contain multiple children if the
    // grouping is parenthetical and the values are comma-seperated
    const children: math.MathNode[] = [grouping];
    if (leftGrouping.type === TokenType.Lparen || leftGrouping.type === TokenType.Lbrace) {
      while (this.match(TokenType.Comma)) {
        this.nextToken(); // consume comma
        children.push(this.nextComparison());
      }
    }
    if (leftRight) {
      this.tryConsume('expected \\right to match corresponding \\left after expression',
        TokenType.Right);
    }
    // look for corresponding right grouping
    this.tryConsumeRightGrouping(leftGrouping);
    return children;
  }

  /**
     * Consume the next token corresponding to a built-in MathJS function.
     *
     * @returns The root node of an expression tree.
     */
  nextUnaryFunc(): math.MathNode {
    const func = this.nextToken();
    const argument = this.nextArgument();
    return createMathJSNode(func, argument);
  }

  /**
     * Consume the next token corresponding to a user-defined function.
     *
     * customFn => OPNAME LBRACE identifier RBRACE grouping
     * @returns The root node of an expression tree.
     */
  nextCustomFunc(): math.MathNode {
    const opname = this.nextToken(); // consume \\operatorname
    this.tryConsume("expected '{' after \\operatorname", TokenType.Lbrace);
    const customFunc = this.nextString();
    this.tryConsume("expected '}' after operator name", TokenType.Rbrace);
    const argument = this.nextArgument();
    return createMathJSNode(opname, [customFunc, ...argument]);
  }

  nextString() {
    const string = [this.tryConsume(
      "expected a letter after \\operatorname{",
      TokenType.Variable, TokenType.Symbol, TokenType.E, TokenType.T,
      TokenType.Eigenvalues, TokenType.Eigenvectors, TokenType.Cross, TokenType.Proj, TokenType.Norm, TokenType.Inv
    )];
    while (this.match(
      TokenType.Variable, TokenType.Symbol, TokenType.Number, TokenType.E, TokenType.T,
      TokenType.Eigenvalues, TokenType.Eigenvectors, TokenType.Cross, TokenType.Proj, TokenType.Norm, TokenType.Inv
    )) {
      string.push(this.nextToken());
    }
    return createMathJSString(string)
  }

  /**
     * Consume the next group of arguments according to the following production:
     *
     * argument => grouping
     *           | comp
     *
     * @returns The root node of an expression tree.
     */
  nextArgument(): math.MathNode[] {
    let argument;
    // try to match grouping e.g. (), {}, ||
    if (this.match(TokenType.Left,
      TokenType.Lparen,
      TokenType.Lbrace,
      TokenType.Bar)) {
      // grouping around argument e.g. \sin (x)
      argument = this.nextGrouping();
    } else {
      // no grouping e.g. \sin x; consume the next token as the argument
      argument = [this.nextPrimary()];
    }
    return argument;
  }

  /**
     * Consume the next fraction according to the following production:
     *
     * frac => FRAC LBRACE comp RBRACE LBRACE comp RBRACE
     *
     * @returns The root node of an expression tree.
     */
  nextFrac(): math.MathNode {
    const frac = this.nextToken();
    this.tryConsume("expected '{' for the numerator in \\frac", TokenType.Lbrace);
    const numerator = this.nextComparison();
    this.tryConsume("expected '}' for the numerator in \\frac", TokenType.Rbrace);
    let denominator;
    // {} is optional for the denominator of \frac
    if (this.match(TokenType.Lbrace)) {
      this.nextToken();
      denominator = this.nextComparison();
      this.tryConsume("expected '}' for the denominator in \\frac", TokenType.Rbrace);
    } else {
      denominator = this.nextComparison();
    }
    return createMathJSNode(frac, [numerator, denominator]);
  }

  /**
     * Consume the next boolean according to the following production:
     *
     * boolean => MATHRM LBRACE (TRUE | FALSE) RBRACE
     *
     * @returns The root node of an expression tree.
     */
  nextBoolean(): math.MathNode {
    this.nextToken(); // consume \mathrm
    this.tryConsume("expected '{' after \\mathrm", TokenType.Lbrace);
    const stateToken = this.tryConsume("expected 'True' or 'False' after '\\mathrm{' "
                                            + '(no other expressions'
                                            + 'are supported yet)', TokenType.True, TokenType.False);
    this.tryConsume("expected '}' after \\mathrm{" + stateToken.lexeme, TokenType.Rbrace);
    return createMathJSNode(stateToken);
  }

  /**
     * Consume the next undefined according to the following production:
     *
     * undefined => MATHBB LBRACE UNDEFINED RBRACE
     *
     * @returns The root node of an expression tree.
     */
  nextUndefined(): math.MathNode {
    this.nextToken(); // consume \mathrm
    this.tryConsume("expected '{' after \\mathbf", TokenType.Lbrace);
    const stateToken = this.tryConsume("expected '?' after '\\mathbf{' "
                                            + '(no other expressions'
                                            + 'are supported yet)', TokenType.Undefined);
    this.tryConsume("expected '}' after \\mathbf{undefined", TokenType.Rbrace);
    return createMathJSNode(stateToken);
  }

  /**
     * Consume the next matrix environnment according to the following production:
     *
     * matrix => BEGIN LBRACE MATRIX RBRACE ((comp)(AMP | DBLBACKSLASH))* END LBRACE MATRIX RBRACE
     *
     * @returns The root node of an expression tree.
     */
  nextMatrix(): math.MathNode {
    this.nextToken(); // consume \begin
    this.tryConsume("expected '{' after \\begin", TokenType.Lbrace);
    const matrixToken = this.tryConsume("expected 'matrix' after '\\begin{' "
                                            + '(no other environnments'
                                            + 'are supported yet)', TokenType.Matrix);
    this.tryConsume("expected '}' after \\begin{matrix", TokenType.Rbrace);
    let row = [];
    const rows = [];
    // parse matrix elements
    for (;;) {
      const element = this.nextComparison();
      // '&' delimits columns; append 1 element to this row
      if (this.match(TokenType.Amp)) {
        this.nextToken();
        row.push(element);
      } else if (this.match(TokenType.Dblbackslash, TokenType.End) !== undefined) {
        // '\\' delimits rows; add a new row
        const delimiter = this.nextToken();
        row.push(element);
        if (row.length === 1) {
          rows.push(element);
        } else {
          rows.push(createMathJSNode(matrixToken, row));
        }
        row = [];
        if (delimiter.type === TokenType.End) {
          break;
        }
      } else if (this.match(TokenType.Eof)) {
        throw new ParseError('unexpected EOF encountered while parsing matrix',
          this.currentToken());
      } else {
        throw new ParseError('unexpected delimiter while parsing matrix',
          this.currentToken());
      }
    }
    this.tryConsume("expected '{' after \\end", TokenType.Lbrace);
    this.tryConsume("expected 'matrix' after '\\end{' (no other environnments"
                        + 'are supported yet)', TokenType.Matrix);
    this.tryConsume("expected '}' after \\end{matrix", TokenType.Rbrace);
    return createMathJSNode(matrixToken, rows);
  }

  /**
     * Try to consume the right grouping token corresponding to the given left grouping token.
     * e.g. '(' => ')', '{' => '}'. If the token doesn't match, an error is thrown.
     *
     * @param leftGroupingToken A left grouping token.
     *
     */
  // Try to consume a right grouping character given the corresponding left grouping token
  // e.g. RPAREN for LPAREN, BAR for BAR
  tryConsumeRightGrouping(leftGroupingToken: Token) {
    const rightGroupingType = rightGrouping[leftGroupingToken.type];
    // get any tokens that match with the required token type
    const expectedLexemes = Object.keys(lexemeToType)
      .filter((key) => lexemeToType[key] === rightGroupingType)
      // insert quotes (e.g. { => '{')
      .map((lexeme) => `'${lexeme}'`);
    const errMsg = `expected ${
      expectedLexemes.join(' or ')
    } to match corresponding '${
      leftGroupingToken.lexeme}'`;
    this.tryConsume(errMsg, rightGrouping[leftGroupingToken.type]!);
  }
}

/**
 * Parse an array of TeX math tokens as a MathJS expression tree.
 *
 * @param tokens An array of tokens to parse.
 *
 * @returns The root node of a MathJS expression tree.
 */
export default function parseTokens(tokens: Token[]): math.MathNode {
  return (new Parser(tokens)).nextComparison();
}
