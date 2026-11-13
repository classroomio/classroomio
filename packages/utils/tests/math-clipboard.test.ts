import { describe, expect, it } from 'vitest';

import { isDisplayMathml, isDisplayOmml, mathmlToLatex, ommlToLatex, splitMathText } from '../src/math';

const wordRun = (text: string) => `<i><span style='font-family:"Cambria Math",serif'><m:r>${text}</m:r></span></i>`;

describe('splitMathText with brackets', () => {
  it('reads \\(…\\) as inline math and \\[…\\] as display math', () => {
    expect(splitMathText('Solve \\(x^2=4\\) then \\[\\frac{1}{2}\\]', { brackets: true })).toEqual([
      { type: 'text', text: 'Solve ' },
      { type: 'math', latex: 'x^2=4', display: false },
      { type: 'text', text: ' then ' },
      { type: 'math', latex: '\\frac{1}{2}', display: true }
    ]);
  });

  it('leaves bracket delimiters as text without the option', () => {
    expect(splitMathText('\\(x\\)')).toEqual([{ type: 'text', text: '\\(x\\)' }]);
  });

  it('keeps an unclosed bracket as text', () => {
    expect(splitMathText('a \\(b', { brackets: true })).toEqual([{ type: 'text', text: 'a \\(b' }]);
  });

  it('still treats prices as text', () => {
    expect(splitMathText('It costs $5 and $10', { brackets: true })).toEqual([
      { type: 'text', text: 'It costs $5 and $10' }
    ]);
  });
});

describe('ommlToLatex', () => {
  it('converts the quadratic formula copied from Word', () => {
    const omml =
      '<m:oMathPara><m:oMath>' +
      wordRun('x') +
      '<m:r>=</m:r><m:f><m:fPr><m:ctrlPr></m:ctrlPr></m:fPr><m:num>' +
      wordRun('−b±') +
      '<m:rad><m:radPr><m:degHide m:val="1"/></m:radPr><m:deg/><m:e><m:sSup><m:e>' +
      wordRun('b') +
      '</m:e><m:sup><m:r>2</m:r></m:sup></m:sSup><m:r>−4ac</m:r></m:e></m:rad></m:num><m:den><m:r>2a</m:r></m:den></m:f>' +
      '</m:oMath></m:oMathPara>';

    expect(ommlToLatex(omml)).toBe('x=\\frac{-b\\pm \\sqrt{b^{2}-4ac}}{2a}');
    expect(isDisplayOmml(omml)).toBe(true);
  });

  it('reads runs written with m:t, as in .docx files', () => {
    expect(
      ommlToLatex('<m:oMath><m:r><m:rPr><m:sty m:val="p"/></m:rPr><m:t>2</m:t></m:r><m:r><m:t>x</m:t></m:r></m:oMath>')
    ).toBe('2x');
  });

  it('converts subscripts, nth roots and linear fractions', () => {
    const omml =
      '<m:oMath><m:sSubSup><m:e><m:r>a</m:r></m:e><m:sub><m:r>n</m:r></m:sub><m:sup><m:r>2</m:r></m:sup></m:sSubSup>' +
      '<m:rad><m:deg><m:r>3</m:r></m:deg><m:e><m:r>x</m:r></m:e></m:rad>' +
      '<m:f><m:fPr><m:type m:val="lin"/></m:fPr><m:num><m:r>1</m:r></m:num><m:den><m:r>2</m:r></m:den></m:f></m:oMath>';

    expect(ommlToLatex(omml)).toBe('a_{n}^{2}\\sqrt[3]{x}1/2');
    expect(isDisplayOmml(omml)).toBe(false);
  });

  it('converts sums and integrals with limits', () => {
    const sum =
      '<m:oMath><m:nary><m:naryPr><m:chr m:val="∑"/></m:naryPr><m:sub><m:r>i=1</m:r></m:sub><m:sup><m:r>n</m:r></m:sup><m:e><m:r>i</m:r></m:e></m:nary></m:oMath>';
    const integral =
      '<m:oMath><m:nary><m:naryPr><m:ctrlPr/></m:naryPr><m:sub><m:r>0</m:r></m:sub><m:sup><m:r>1</m:r></m:sup><m:e><m:r>x dx</m:r></m:e></m:nary></m:oMath>';

    expect(ommlToLatex(sum)).toBe('\\sum_{i=1}^{n} i');
    expect(ommlToLatex(integral)).toBe('\\int_{0}^{1} x dx');
  });

  it('converts delimiters, matrices and piecewise functions', () => {
    const matrix =
      '<m:oMath><m:d><m:e><m:m><m:mr><m:e><m:r>1</m:r></m:e><m:e><m:r>2</m:r></m:e></m:mr><m:mr><m:e><m:r>3</m:r></m:e><m:e><m:r>4</m:r></m:e></m:mr></m:m></m:e></m:d></m:oMath>';
    const piecewise =
      '<m:oMath><m:d><m:dPr><m:begChr m:val="{"/><m:endChr m:val=""/></m:dPr><m:e><m:eqArr><m:e><m:r>x&amp;x≥0</m:r></m:e><m:e><m:r>−x&amp;x&lt;0</m:r></m:e></m:eqArr></m:e></m:d></m:oMath>';

    expect(ommlToLatex(matrix)).toBe('\\left(\\begin{matrix}1 & 2 \\\\ 3 & 4\\end{matrix}\\right)');
    expect(ommlToLatex(piecewise)).toBe('\\left\\{\\begin{aligned}x&x\\ge 0 \\\\ -x&x<0\\end{aligned}\\right.');
  });

  it('converts functions, limits, accents and Greek letters', () => {
    const omml =
      '<m:oMath><m:func><m:fName><m:limLow><m:e><m:r>lim</m:r></m:e><m:lim><m:r>x→∞</m:r></m:lim></m:limLow></m:fName><m:e><m:r>f</m:r></m:e></m:func>' +
      '<m:func><m:fName><m:r>sin</m:r></m:fName><m:e><m:r>θ</m:r></m:e></m:func>' +
      '<m:acc><m:accPr><m:chr m:val="⃗"/></m:accPr><m:e><m:r>v</m:r></m:e></m:acc></m:oMath>';

    expect(ommlToLatex(omml)).toBe('\\lim_{x\\to \\infty} f\\sin \\theta\\vec{v}');
  });

  it('accepts unquoted attribute values from Word HTML', () => {
    expect(
      ommlToLatex('<m:oMath><m:nary><m:naryPr><m:chr m:val=∏ /></m:naryPr><m:e><m:r>k</m:r></m:e></m:nary></m:oMath>')
    ).toBe('\\prod k');
  });

  it('returns an empty string when there is no math', () => {
    expect(ommlToLatex('<p>No math</p>')).toBe('');
  });
});

describe('mathmlToLatex', () => {
  it('prefers the TeX annotation that KaTeX and MathJax emit', () => {
    const mathml =
      '<math><semantics><mrow><mi>x</mi></mrow><annotation encoding="application/x-tex">x &lt; \\frac{1}{2}</annotation></semantics></math>';

    expect(mathmlToLatex(mathml)).toBe('x < \\frac{1}{2}');
  });

  it('unwraps the \\displaystyle wrapper Wikipedia adds to its annotation', () => {
    const mathml =
      '<math display="block"><semantics><mi>x</mi><annotation encoding="application/x-tex">{\\displaystyle x^{2}}</annotation></semantics></math>';

    expect(mathmlToLatex(mathml)).toBe('x^{2}');
  });

  it('converts presentation MathML', () => {
    expect(
      mathmlToLatex(
        '<math xmlns="http://www.w3.org/1998/Math/MathML"><mfrac><mn>1</mn><mn>2</mn></mfrac><mo>+</mo><msqrt><mi>x</mi></msqrt></math>'
      )
    ).toBe('\\frac{1}{2} + \\sqrt{x}');
  });

  it('accepts HTML entities such as &nbsp;', () => {
    expect(mathmlToLatex('<math><mi>x</mi><mo>&nbsp;</mo><mo>&lt;</mo><mn>2</mn></math>')).toBe('x < 2');
  });

  it('detects display MathML', () => {
    expect(isDisplayMathml('<math display="block"><mi>x</mi></math>')).toBe(true);
    expect(isDisplayMathml('<math><mi>x</mi></math>')).toBe(false);
  });
});
