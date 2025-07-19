# TeX Math Parser

TeX Math Parser parses TeX math into [a MathJS expression tree](https://mathjs.org/docs/expressions/expression_trees.html) which can then be further manipulated and evaluated by [MathJS](https://mathjs.org/). The library also provides convenience functions for directly evaluating TeX math with MathJS.

This library works well as a bridge between [MathQuill](http://mathquill.com/) and MathJS. Use this library to parse the TeX formatted output from MathQuill into a format that can be manipulated by MathJS.

## TeX Features

* Common operators available in TeX math mode: `+`, `-`, `*`, `^`, `/`, `\cdot`, `||` (absolute value), `\times` (cross product)
* Comparison operators: `=`, `\ne`/`\neq`, `<`, `>`, `\le`/`\leq`, `\ge`/`\geq`
* Assignment operator: `:=`
* Basic functions: `\sqrt`, `\frac`, `\sin`, `\cos`, `\tan`, `\csc`, `\sec`, `\cot`, `\arcsin`, `\arccos`, `\arctan`, `\log`, `\ln`, `\det`
* Functions with custom bases: `\sqrt[n]`, `\log_n`
* Custom functions implemented with MathJS: `eigenvectors`, `eigenvalues`, `cross`, `proj`, `comp`, `norm`, `inv`, ...
  * Since these are custom functions, they should be formatted as `\operatorname{function}` in TeX.
* Constants: `\pi`, `e`, `\i`, `{True}`, `{False}`, `{?}` (undefined), `\infty`
* Environments: `matrix`
* Variables (including greek symbols): `x`, `y`, `a`, `\alpha`, `\theta`, ...
  * `^T` is interpreted as the transpose operation
  * Non-latin symbols are converted to their English spellings (`\alpha` in TeX becomes the MathJS symbol `alpha`)
* Variable subscripts: `a_b`, `c_{max}`

## Browser Support

Any browser with ES6 support.

## Installation

Install with NPM:

```bash
npm install tex-math-parser 
```

or link to it from a CDN:

```html
<script src=https://cdn.jsdelivr.net/npm/tex-math-parser></script>
```

## Usage

Given the following TeX source string:

![Example TeX](docs/imgs/example_tex.png)

```latex
\begin{bmatrix}1&3\\2&4\end{bmatrix}\begin{bmatrix}-5\\-6\end{bmatrix}+\left|\sqrt{7}-\sqrt{8}\right|^{\frac{9}{10}}\begin{bmatrix}\cos\left(\frac{\pi}{6}\right)\\\sin\left(\frac{\pi}{6}\right)\end{bmatrix}
```

Load the package and escape the string:

```javascript
import { parseTex, evaluateTex } from 'tex-math-parser' // ES6 module

// Make sure to escape the string!
const escapedTex = String.raw`\begin{bmatrix}1&3\\2&4\end{bmatrix}\begin{bmatrix}-5\\-6\end{bmatrix}+\left|\sqrt{7}-\sqrt{8}\right|^{\frac{9}{10}}\begin{bmatrix}\cos\left(\frac{\pi}{6}\right)\\\sin\left(\frac{\pi}{6}\right)\end{bmatrix}`; // ES6 raw template string
```

Evaluate the string and get an answer in TeX:

```javascript
const texAnswer = evaluateTex(escapedTex); 
console.log(texAnswer); 
// \begin{bmatrix}-22.812481734548864\\-33.89173627896382\\\end{bmatrix}
```

Parse the string and get [a MathJS expression tree](https://mathjs.org/docs/expressions/expression_trees.html):

```javascript
const mathJSTree = parseTex(escapedTex);
```

### Variables

If the TeX string contains variables, the value of the variables must be supplied when evaluating.

![Example TeX with variables](docs/imgs/example_tex_variables.png)

```javascript
const texStr = String.raw`\frac{x}{4}+\frac{y}{2}`;
const answer = evaluateTex(texStr, {x: 2, y: 1});
console.log(answer); // 1
```

## API

`evaluateTex(texStr: string, scope?: Object)`

Evaluate a TeX string, replacing any variable occurrences with their values in `scope`. The answer is returned as a TeX string.

`parseTex(texStr: string)`

Convert a TeX string into [a MathJS expression tree](https://mathjs.org/docs/expressions/expression_trees.html). The function returns the root node of the tree.

## Contributing

Please feel free to make a PR and add any features, add unit tests, or refactor any of the code. Both `tokenizeTex` and the `Parser` are quite messy and could really use a clean-up (maybe someday I'll get around to it...).

Run `pnpm test` to run some unit tests and make sure they're passing!

Adding support for new TeX functions is relatively simple (see [this commit](https://github.com/davidtranhq/tex-math-parser/commit/037f27650b8b44ac45497f4e49a77c2195282a05) for an example)

TODO: include better documentation on how to do this

## Details

`parseTex` first lexes the TeX string into tokens, which are then passed to the parser to create the expression tree. A context-free grammar for the simplified version of TeX math used by the parser is as follows:

```text
comp => expr ((EQUALS | NOTEQUALS | LESS | LESSEQUAL | GREATER | GREATEREQUAL) expr)*
      | VARIABLE EQUALS EQUALS comp

expr => term ((PLUS | MINUS) term)*

term => factor ((STAR factor | primary))*  // primary and factor must both not be numbers

factor => MINUS? power

power => primary (CARET primary)*

primary => grouping
         | environnment
         | frac
         | sqrt
         | log
         | function
         | NUMBER
         | VARIABLE

grouping => LEFT LPAREN comp RIGHT RPAREN
          | LPAREN comp RPAREN
          | LBRACE comp RBRACE
          | LEFT BAR comp RIGHT BAR
          | BAR comp BAR

environnment => matrix

frac => FRAC LBRACE comp RBRACE LBRACE comp RBRACE

matrix => BEGIN LBRACE MATRIX RBRACE ((comp)(AMP | DBLBACKSLASH))* END LBRACE MATRIX RBRACE

sqrt => SQRT (LBRACKET comp RBRACKET)? argument

log => LOG (UNDERSCORE (primary))? argument

function => (SIN | COS | TAN | ...) argument
          | OPNAME LBRACE customfunc RBRACE argument

argument => grouping
          | primary
```

As the grammar is not left-recursive, the parser was implemented as a recursive descent parser with each production being represented by a separate function. This keeps the parser easily extensible.
