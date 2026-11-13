import { describe, expect, it } from 'vitest';

import { normaliseMathAnswer, scoreMathExpression } from '../src/math-grading';
import { readMathExpressionSettings, type MathGradeReason } from '../src/math-settings';

type Fixture = [student: string, accepted: string | string[], expected: MathGradeReason];

function grade(student: string, accepted: string | string[], settings: Record<string, unknown> = {}) {
  const acceptedAnswers = Array.isArray(accepted) ? accepted : [accepted];
  return scoreMathExpression(readMathExpressionSettings({ acceptedAnswers, ...settings }), student);
}

function runFixtures(fixtures: Fixture[], settings: Record<string, unknown> = {}) {
  it.each(fixtures)('%s vs %s -> %s', (student, accepted, expected) => {
    expect(grade(student, accepted, settings).reason).toBe(expected);
  });
}

describe('equivalent: algebra', () => {
  runFixtures([
    ['2x+2', '2(x+1)', 'equivalent'],
    ['2(x+1)', '2x+2', 'equivalent'],
    ['2+2x', '2x+2', 'equivalent'],
    ['2 x + 2', '2x+2', 'equivalent'],
    ['x\\cdot 2+2', '2x+2', 'equivalent'],
    ['2\\times x+2', '2x+2', 'equivalent'],
    ['x^2+2x+1', '(x+1)^2', 'equivalent'],
    ['(x+1)(x+1)', '(x+1)^2', 'equivalent'],
    ['(x-2)(x-3)', 'x^2-5x+6', 'equivalent'],
    ['(x-3)(x-2)', 'x^2-5x+6', 'equivalent'],
    ['x^2-9', '(x-3)(x+3)', 'equivalent'],
    ['(a+b)^2', 'a^2+2ab+b^2', 'equivalent'],
    ['(a-b)(a+b)', 'a^2-b^2', 'equivalent'],
    ['a(b+c)', 'ab+ac', 'equivalent'],
    ['xy', 'yx', 'equivalent'],
    ['x+x', '2x', 'equivalent'],
    ['3x-x', '2x', 'equivalent'],
    ['x\\cdot x', 'x^2', 'equivalent'],
    ['x^3\\cdot x^2', 'x^5', 'equivalent'],
    ['\\frac{x^6}{x^2}', 'x^4', 'equivalent'],
    ['(x^2)^3', 'x^6', 'equivalent'],
    ['x^{-1}', '\\frac{1}{x}', 'equivalent'],
    ['x^{\\frac{1}{2}}', '\\sqrt{x}', 'equivalent'],
    ['\\frac{x}{2}', '0.5x', 'equivalent'],
    ['\\frac{1}{2}x', '\\frac{x}{2}', 'equivalent'],
    ['\\frac{2x+4}{2}', 'x+2', 'equivalent'],
    ['\\frac{x^2-1}{x-1}', 'x+1', 'equivalent'],
    ['\\frac{x^2+2x+1}{x+1}', 'x+1', 'equivalent'],
    ['\\frac{1}{x}+\\frac{1}{y}', '\\frac{x+y}{xy}', 'equivalent'],
    ['\\frac{a}{b}\\cdot\\frac{c}{d}', '\\frac{ac}{bd}', 'equivalent'],
    ['\\frac{a}{b}\\div\\frac{c}{d}', '\\frac{ad}{bc}', 'equivalent'],
    ['-(x-1)', '1-x', 'equivalent'],
    ['-x+1', '1-x', 'equivalent'],
    ['3(2x-1)-2(x+4)', '4x-11', 'equivalent'],
    ['(2x+1)(x-3)', '2x^2-5x-3', 'equivalent'],
    ['(x+2)^3', 'x^3+6x^2+12x+8', 'equivalent'],
    ['x(x+1)(x+2)', 'x^3+3x^2+2x', 'equivalent'],
    ['\\left(x+1\\right)^2', 'x^2+2x+1', 'equivalent'],
    ['2^{x+1}', '2\\cdot 2^x', 'equivalent'],
    ['e^{x}e^{y}', 'e^{x+y}', 'equivalent'],
    ['e^{\\ln x}', 'x', 'equivalent'],
    ['\\ln(e^x)', 'x', 'equivalent'],
    ['\\log_2 8', '3', 'equivalent'],
    ['\\sin^2x+\\cos^2x', '1', 'equivalent'],
    ['2\\sin x\\cos x', '\\sin(2x)', 'equivalent'],
    ['\\tan x', '\\frac{\\sin x}{\\cos x}', 'equivalent'],
    ['\\cos^2x-\\sin^2x', '\\cos(2x)', 'equivalent'],
    ['\\frac{d}{dx}x^2', '2x', 'equivalent'],
    ['|x|', '\\sqrt{x^2}', 'equivalent'],
    ['\\pi r^2', 'r^2\\pi', 'equivalent'],
    ['2\\pi r', '\\pi\\cdot 2r', 'equivalent'],
    ['\\frac{4}{3}\\pi r^3', '\\frac{4\\pi r^3}{3}', 'equivalent'],
    ['\\frac{1}{2}bh', '\\frac{bh}{2}', 'equivalent'],
    ['mc^2', 'm c^2', 'equivalent'],
    ['\\alpha+\\beta', '\\beta+\\alpha', 'equivalent'],
    ['\\theta^2', '\\theta\\cdot\\theta', 'equivalent'],
    ['$2x+2$', '2x+2', 'equivalent'],
    ['\\(2x+2\\)', '2(x+1)', 'equivalent'],
    ['y=2x+2', '2x+2', 'equivalent'],
    ['x=4', '4', 'equivalent'],
    ['4', 'x=4', 'equivalent']
  ]);
});

describe('wrong: algebra false-positive traps', () => {
  runFixtures([
    ['2x+1', '2x+2', 'wrong'],
    ['x+2', '2x+2', 'wrong'],
    ['2x', '2x+2', 'wrong'],
    ['x^2+1', '(x+1)^2', 'wrong'],
    ['x^2+x+1', '(x+1)^2', 'wrong'],
    ['(x+2)(x-3)', 'x^2-5x+6', 'wrong'],
    ['(x+2)(x+3)', 'x^2-5x+6', 'wrong'],
    ['x^2-5x-6', 'x^2-5x+6', 'wrong'],
    ['a^2+b^2', '(a+b)^2', 'wrong'],
    ['ab+c', 'a(b+c)', 'wrong'],
    ['x^5', 'x^6', 'wrong'],
    ['x^6', 'x^3\\cdot x^2', 'wrong'],
    ['x^3', '\\frac{x^6}{x^2}', 'wrong'],
    ['x^5', '(x^2)^3', 'wrong'],
    ['\\frac{1}{x}', '\\frac{1}{x+1}', 'wrong'],
    ['\\frac{x}{y}', '\\frac{y}{x}', 'wrong'],
    ['\\frac{1}{x}+\\frac{1}{y}', '\\frac{1}{x+y}', 'wrong'],
    ['x-1', '1-x', 'wrong'],
    ['-x-1', '1-x', 'wrong'],
    ['2x-11', '4x-11', 'wrong'],
    ['x+1.0000001', 'x+1', 'wrong'],
    ['1.0001x', 'x', 'wrong'],
    ['\\sin x', '\\cos x', 'wrong'],
    ['\\sin(2x)', '2\\sin x', 'wrong'],
    ['\\ln(a+b)', '\\ln a+\\ln b', 'wrong'],
    ['e^{x}+e^{y}', 'e^{x+y}', 'wrong'],
    ['2^{x+1}', '2^x+1', 'wrong'],
    ['x^{2}', '2x', 'wrong'],
    ['x', 'y', 'wrong'],
    ['xy', 'x+y', 'wrong'],
    ['\\frac{x}{2}', '2x', 'wrong'],
    ['\\pi r^2', '2\\pi r', 'wrong'],
    ['x^2', 'x^2+10^{-6}', 'wrong'],
    ['\\frac{x^2-1}{x-1}', 'x-1', 'wrong'],
    ['0', 'x-x+1', 'wrong'],
    ['\\sin^2x+\\cos^2x', '2', 'wrong'],
    ['x=5', '4', 'wrong'],
    ['5', 'x=4', 'wrong'],
    ['x<4', 'x=4', 'wrong'],
    ['x=4', 'x<4', 'wrong']
  ]);
});

describe('domain traps', () => {
  runFixtures([
    ['x', '\\sqrt{x^2}', 'wrong'],
    ['\\sqrt{x^2}', 'x', 'wrong'],
    ['\\sqrt{x^2}', '|x|', 'equivalent'],
    ['-x', '\\sqrt{x^2}', 'wrong'],
    ['\\frac{x}{x}', '1', 'equivalent'],
    ['\\frac{x^2}{x}', 'x', 'equivalent'],
    ['(\\sqrt{x})^2', 'x', 'equivalent'],
    ['\\ln(x^2)', '2\\ln x', 'needs_review'],
    ['\\ln(ab)', '\\ln a+\\ln b', 'needs_review'],
    ['\\sqrt{ab}', '\\sqrt{a}\\sqrt{b}', 'wrong'],
    ['\\frac{|x|}{x}', '1', 'wrong'],
    ['x^0', '1', 'equivalent']
  ]);
});

describe('numbers, fractions and constants', () => {
  runFixtures([
    ['\\frac{3}{4}', '0.75', 'equivalent'],
    ['0.75', '\\frac{3}{4}', 'equivalent'],
    ['\\frac{6}{8}', '\\frac{3}{4}', 'equivalent'],
    ['3/4', '\\frac{3}{4}', 'equivalent'],
    ['1\\frac{1}{2}', '\\frac{3}{2}', 'equivalent'],
    ['1 1/2', '1.5', 'equivalent'],
    ['-1 1/2', '-1.5', 'equivalent'],
    ['\\frac{-1}{2}', '-\\frac{1}{2}', 'equivalent'],
    ['\\frac{1}{-2}', '-0.5', 'equivalent'],
    ['0.\\overline{3}', '\\frac{1}{3}', 'equivalent'],
    ['\\frac{1}{3}', '0.333', 'wrong'],
    ['0.33', '\\frac{1}{3}', 'wrong'],
    ['\\frac{2}{3}', '\\frac{3}{2}', 'wrong'],
    ['\\frac{3}{4}', '\\frac{4}{3}', 'wrong'],
    ['\\frac{1}{\\sqrt{2}}', '\\frac{\\sqrt{2}}{2}', 'equivalent'],
    ['\\sqrt{8}', '2\\sqrt{2}', 'equivalent'],
    ['\\sqrt{12}', '2\\sqrt{3}', 'equivalent'],
    ['\\sqrt{18}', '2\\sqrt{3}', 'wrong'],
    ['\\sqrt[3]{8}', '2', 'equivalent'],
    ['\\sqrt{2}', '1.414', 'wrong'],
    ['\\pi', '3.14159', 'wrong'],
    ['\\pi', '\\frac{22}{7}', 'wrong'],
    ['2\\pi', '\\pi+\\pi', 'equivalent'],
    ['\\frac{\\pi}{2}', '90^\\circ', 'equivalent'],
    ['e', '\\exponentialE', 'equivalent'],
    ['e^2', 'e\\cdot e', 'equivalent'],
    ['i^2', '-1', 'equivalent'],
    ['(1+i)(1-i)', '2', 'equivalent'],
    ['3.2\\times10^{4}', '32000', 'equivalent'],
    ['3.2e4', '32000', 'equivalent'],
    ['1.2\\times10^{-3}', '0.0012', 'equivalent'],
    ['12\\%', '0.12', 'equivalent'],
    ['2+3', '5', 'equivalent'],
    ['2\\cdot 3', '6', 'equivalent'],
    ['2^{10}', '1024', 'equivalent'],
    ['10!', '3628800', 'equivalent'],
    ['\\binom{5}{2}', '10', 'equivalent'],
    ['-0', '0', 'equivalent'],
    ['5', '-5', 'wrong'],
    ['0.5', '\\frac{1}{3}', 'wrong'],
    ['100', '1000', 'wrong'],
    ['1{,}000', '1000', 'equivalent']
  ]);
});

describe('equations', () => {
  runFixtures([
    ['y=2x+1', 'y=2x+1', 'equivalent'],
    ['y=1+2x', 'y=2x+1', 'equivalent'],
    ['2x+1=y', 'y=2x+1', 'equivalent'],
    ['y-2x=1', 'y=2x+1', 'equivalent'],
    ['2y=4x+2', 'y=2x+1', 'equivalent'],
    ['-y=-2x-1', 'y=2x+1', 'equivalent'],
    ['\\frac{y}{2}=x+\\frac{1}{2}', 'y=2x+1', 'equivalent'],
    ['y=2x-1', 'y=2x+1', 'wrong'],
    ['y=x+1', 'y=2x+1', 'wrong'],
    ['x^2-5x+6=0', '(x-2)(x-3)=0', 'equivalent'],
    ['x^2+6=5x', 'x^2-5x+6=0', 'equivalent'],
    ['2x^2-10x+12=0', 'x^2-5x+6=0', 'equivalent'],
    ['x^2-5x-6=0', 'x^2-5x+6=0', 'wrong'],
    ['x^2+y^2=25', 'y^2+x^2=25', 'equivalent'],
    ['x^2+y^2=5', 'x^2+y^2=25', 'wrong'],
    ['3x+2y=6', 'y=3-\\frac{3}{2}x', 'equivalent'],
    ['3x+2y=6', 'y=3-\\frac{2}{3}x', 'wrong'],
    ['E=mc^2', 'E=mc^2', 'equivalent'],
    ['m=\\frac{E}{c^2}', 'E=mc^2', 'equivalent'],
    ['c^2=\\frac{E}{m}', 'E=mc^2', 'equivalent'],
    ['m=Ec^2', 'E=mc^2', 'wrong'],
    ['t=\\frac{v-u}{a}', 'v=u+at', 'equivalent'],
    ['t=\\frac{v+u}{a}', 'v=u+at', 'wrong'],
    ['x=3', 'x=3', 'equivalent'],
    ['3=x', 'x=3', 'equivalent'],
    ['x=-3', 'x=3', 'wrong'],
    ['2x=6', 'x=3', 'equivalent'],
    ['x-3=0', 'x=3', 'equivalent'],
    ['x+3=0', 'x=3', 'wrong'],
    ['y=\\frac{1}{2}x', '2y=x', 'equivalent'],
    ['a=b', 'b=a', 'equivalent'],
    ['a=b', 'a=-b', 'wrong']
  ]);
});

describe('inequalities', () => {
  runFixtures([
    ['x<3', 'x<3', 'equivalent'],
    ['3>x', 'x<3', 'equivalent'],
    ['x\\lt 3', 'x<3', 'equivalent'],
    ['x\\le 3', 'x<3', 'wrong'],
    ['x>3', 'x<3', 'wrong'],
    ['x<-3', 'x<3', 'wrong'],
    ['2x<6', 'x<3', 'equivalent'],
    ['-2x>-6', 'x<3', 'equivalent'],
    ['-x<-3', 'x<3', 'wrong'],
    ['-x>-3', 'x<3', 'equivalent'],
    ['x\\geq -1', '-1\\leq x', 'equivalent'],
    ['x\\ge -1', 'x\\geq -1', 'equivalent'],
    ['x>-1', 'x\\geq -1', 'wrong'],
    ['1<x<3', '1<x<3', 'equivalent'],
    ['3>x>1', '1<x<3', 'equivalent'],
    ['1\\le x<3', '1<x<3', 'wrong'],
    ['1<x\\le 3', '1<x\\le 3', 'equivalent'],
    ['x<3', '1<x<3', 'wrong'],
    ['x\\ne 3', 'x\\neq 3', 'equivalent'],
    ['x\\ne 3', 'x=3', 'wrong'],
    ['x<3', '[-\\infty,3)', 'wrong'],
    ['x<3', '(-\\infty,3)', 'equivalent'],
    ['x\\ge 2', '[2,\\infty)', 'equivalent'],
    ['x>2', '[2,\\infty)', 'wrong'],
    ['-1\\le x\\le 1', '[-1,1]', 'equivalent'],
    ['-1<x\\le 1', '(-1,1]', 'equivalent'],
    ['-1<x<1', '[-1,1]', 'wrong']
  ]);
});

describe('sets and intervals (set mode)', () => {
  runFixtures(
    [
      ['\\{2,3\\}', '\\{3,2\\}', 'equivalent'],
      ['\\{2,3\\}', '\\{2,3\\}', 'equivalent'],
      ['\\{2,3\\}', '\\{2,4\\}', 'wrong'],
      ['\\{2,3\\}', '\\{2,3,4\\}', 'wrong'],
      ['\\{2\\}', '\\{2,3\\}', 'wrong'],
      ['2,3', '\\{2,3\\}', 'equivalent'],
      ['3,2', '\\{2,3\\}', 'equivalent'],
      ['x=2, x=3', '\\{2,3\\}', 'equivalent'],
      ['x=2 \\text{ or } x=3', '\\{2,3\\}', 'equivalent'],
      ['x=3 \\text{ or } x=2', '2,3', 'equivalent'],
      ['x=\\pm 2', '\\{2,-2\\}', 'equivalent'],
      ['\\pm 2', '\\{-2,2\\}', 'equivalent'],
      ['x=\\pm 3', '\\{2,-2\\}', 'wrong'],
      ['\\{\\frac{1}{2},-3\\}', '\\{-3,0.5\\}', 'equivalent'],
      ['\\{\\sqrt{4},1\\}', '\\{1,2\\}', 'equivalent'],
      ['(1,2)', '(1,2)', 'equivalent'],
      ['[1,2)', '[1,2)', 'equivalent'],
      ['[1,2)', '(1,2]', 'wrong'],
      ['[1,2]', '[1,2)', 'wrong'],
      ['[0.5,2)', '[\\frac{1}{2},2)', 'equivalent'],
      ['(-\\infty,2)\\cup(3,\\infty)', '(3,\\infty)\\cup(-\\infty,2)', 'equivalent'],
      ['(-\\infty,2)\\cup(3,\\infty)', '(-\\infty,2]\\cup(3,\\infty)', 'wrong'],
      ['x<2 \\lor x>3', '(-\\infty,2)\\cup(3,\\infty)', 'equivalent'],
      ['x\\in[1,2)', '[1,2)', 'equivalent'],
      ['1\\le x<2', '[1,2)', 'equivalent'],
      ['\\{1,2,3\\}', '\\{3,1,2\\}', 'equivalent'],
      ['\\{1,1,2\\}', '\\{1,2\\}', 'equivalent'],
      ['\\{x+1, x\\}', '\\{x, 1+x\\}', 'equivalent'],
      ['4', '\\{4\\}', 'equivalent'],
      ['x=4', '\\{4\\}', 'equivalent'],
      ['x=5', '\\{4\\}', 'wrong']
    ],
    { compare: { mode: 'set' } }
  );
});

describe('ordered lists outside set mode', () => {
  runFixtures([
    ['(2,3)', '(2,3)', 'equivalent'],
    ['(3,2)', '(2,3)', 'wrong'],
    ['(1,-2)', '(1,-2)', 'equivalent'],
    ['(\\frac{1}{2},4)', '(0.5,4)', 'equivalent'],
    ['\\{2,3\\}', '\\{3,2\\}', 'equivalent']
  ]);
});

describe('exact form: expanded', () => {
  runFixtures(
    [
      ['2x+2', '2(x+1)', 'equivalent'],
      ['2+2x', '2x+2', 'equivalent'],
      ['2(x+1)', '2x+2', 'wrong_form'],
      ['(x+1)2', '2x+2', 'wrong_form'],
      ['x^2+2x+1', '(x+1)^2', 'equivalent'],
      ['(x+1)^2', 'x^2+2x+1', 'wrong_form'],
      ['(x+1)(x+1)', 'x^2+2x+1', 'wrong_form'],
      ['x^2-5x+6', '(x-2)(x-3)', 'equivalent'],
      ['-(x-1)', '1-x', 'wrong_form'],
      ['2x+1', '2(x+1)', 'wrong'],
      ['x^3+3x^2+2x', 'x(x+1)(x+2)', 'equivalent'],
      ['x(x^2+3x+2)', 'x^3+3x^2+2x', 'wrong_form']
    ],
    { compare: { mode: 'exact_form', form: 'expanded' } }
  );
});

describe('exact form: factored', () => {
  runFixtures(
    [
      ['(x-2)(x-3)', 'x^2-5x+6', 'equivalent'],
      ['(x-3)(x-2)', 'x^2-5x+6', 'equivalent'],
      ['x^2-5x+6', '(x-2)(x-3)', 'wrong_form'],
      ['2(x+2)', '2x+4', 'equivalent'],
      ['2x+4', '2(x+2)', 'wrong_form'],
      ['(x+1)^2', 'x^2+2x+1', 'equivalent'],
      ['x(x-1)(x+1)', 'x^3-x', 'equivalent'],
      ['x(x^2-1)', 'x^3-x', 'wrong_form'],
      ['(x-1)(x+1)', 'x^2-1', 'equivalent'],
      ['x^2+1', 'x^2+1', 'equivalent'],
      ['(x+2)(x+3)', 'x^2-5x+6', 'wrong'],
      ['(x-2)(x-3)=0', 'x^2-5x+6=0', 'equivalent'],
      ['x^2-5x+6=0', '(x-2)(x-3)=0', 'wrong_form']
    ],
    { compare: { mode: 'exact_form', form: 'factored' } }
  );
});

describe('exact form: simplified', () => {
  runFixtures(
    [
      ['\\frac{1}{2}', '\\frac{2}{4}', 'equivalent'],
      ['\\frac{2}{4}', '\\frac{1}{2}', 'not_simplified'],
      ['\\frac{6}{3}', '2', 'not_simplified'],
      ['\\frac{3}{1}', '3', 'not_simplified'],
      ['2+3', '5', 'not_simplified'],
      ['5', '2+3', 'equivalent'],
      ['2x', 'x+x', 'equivalent'],
      ['x+x', '2x', 'not_simplified'],
      ['3x-x', '2x', 'not_simplified'],
      ['x+0', 'x', 'not_simplified'],
      ['1x', 'x', 'not_simplified'],
      ['x^1', 'x', 'not_simplified'],
      ['x^2', 'x\\cdot x', 'equivalent'],
      ['x\\cdot x', 'x^2', 'not_simplified'],
      ['2\\cdot 3x', '6x', 'not_simplified'],
      ['6x', '6x', 'equivalent'],
      ['2\\sqrt{2}', '\\sqrt{8}', 'equivalent'],
      ['\\sqrt{8}', '2\\sqrt{2}', 'not_simplified'],
      ['\\sqrt{12}', '2\\sqrt{3}', 'not_simplified'],
      ['3\\sqrt{2}', '\\sqrt{18}', 'equivalent'],
      ['x+1', '\\frac{x^2-1}{x-1}', 'equivalent'],
      ['\\frac{x^2-1}{x-1}', 'x+1', 'not_simplified'],
      ['\\frac{2x+4}{2}', 'x+2', 'not_simplified'],
      ['\\frac{x}{2}', '\\frac{x}{2}', 'equivalent'],
      ['\\frac{1}{x+1}', '\\frac{1}{x+1}', 'equivalent'],
      ['2^3', '8', 'not_simplified'],
      ['x^2+2x+1', 'x^2+2x+1', 'equivalent'],
      ['(x+1)^2', 'x^2+2x+1', 'equivalent'],
      ['1\\frac{1}{2}', '\\frac{3}{2}', 'equivalent'],
      ['\\frac{\\frac{1}{2}}{3}', '\\frac{1}{6}', 'not_simplified'],
      ['\\frac{1}{3}', '\\frac{1}{2}', 'wrong']
    ],
    { compare: { mode: 'exact_form', form: 'simplified' } }
  );
});

describe('exact form: lowest terms', () => {
  runFixtures(
    [
      ['\\frac{3}{4}', '\\frac{6}{8}', 'equivalent'],
      ['\\frac{6}{8}', '\\frac{3}{4}', 'not_simplified'],
      ['\\frac{-3}{4}', '-\\frac{3}{4}', 'equivalent'],
      ['\\frac{3}{-4}', '-\\frac{3}{4}', 'not_simplified'],
      ['\\frac{10}{5}', '2', 'not_simplified'],
      ['0.75', '\\frac{3}{4}', 'equivalent'],
      ['\\frac{x}{2x}', '\\frac{1}{2}', 'not_simplified'],
      ['\\frac{x+1}{x^2-1}', '\\frac{1}{x-1}', 'not_simplified'],
      ['\\frac{1}{x-1}', '\\frac{x+1}{x^2-1}', 'equivalent'],
      ['\\frac{5}{7}', '\\frac{5}{7}', 'equivalent'],
      ['\\frac{5}{7}', '\\frac{7}{5}', 'wrong']
    ],
    { compare: { mode: 'exact_form', form: 'lowest_terms' } }
  );
});

describe('exact form: rationalised denominator', () => {
  runFixtures(
    [
      ['\\frac{\\sqrt{2}}{2}', '\\frac{1}{\\sqrt{2}}', 'equivalent'],
      ['\\frac{1}{\\sqrt{2}}', '\\frac{\\sqrt{2}}{2}', 'not_simplified'],
      ['\\frac{\\sqrt{3}}{3}', '\\frac{1}{\\sqrt{3}}', 'equivalent'],
      ['\\frac{3}{\\sqrt{3}}', '\\sqrt{3}', 'not_simplified'],
      ['\\sqrt{3}', '\\frac{3}{\\sqrt{3}}', 'equivalent'],
      ['\\frac{1}{2+\\sqrt{3}}', '2-\\sqrt{3}', 'not_simplified'],
      ['2-\\sqrt{3}', '\\frac{1}{2+\\sqrt{3}}', 'equivalent'],
      ['\\frac{2}{\\sqrt[3]{2}}', '\\sqrt[3]{4}', 'not_simplified'],
      ['\\frac{\\sqrt{2}}{3}', '\\frac{2}{3\\sqrt{2}}', 'equivalent'],
      ['\\frac{\\sqrt{2}}{3}', '\\frac{\\sqrt{3}}{3}', 'wrong']
    ],
    { compare: { mode: 'exact_form', form: 'rationalised_denominator' } }
  );
});

describe('numeric mode', () => {
  runFixtures(
    [
      ['3.14', '\\pi', 'equivalent'],
      ['3.15', '\\pi', 'wrong'],
      ['3.1416', '\\pi', 'equivalent'],
      ['\\frac{22}{7}', '\\pi', 'equivalent'],
      ['1.41', '\\sqrt{2}', 'equivalent'],
      ['1.42', '\\sqrt{2}', 'wrong']
    ],
    { compare: { mode: 'numeric', absoluteTolerance: 0.005 } }
  );

  runFixtures(
    [
      ['101', '100', 'equivalent'],
      ['99', '100', 'equivalent'],
      ['102', '100', 'wrong'],
      ['0.0101', '0.01', 'equivalent'],
      ['0.0102', '0.01', 'wrong']
    ],
    { compare: { mode: 'numeric', relativeTolerance: 0.01 } }
  );

  runFixtures(
    [
      ['3.14', '\\pi', 'equivalent'],
      ['3.142', '\\pi', 'wrong'],
      ['3.1', '\\pi', 'wrong'],
      ['1.41', '\\sqrt{2}', 'equivalent'],
      ['0.333', '\\frac{1}{3}', 'equivalent'],
      ['0.33', '\\frac{1}{3}', 'wrong'],
      ['12300', '12345', 'equivalent'],
      ['1.23\\times10^{4}', '12345', 'equivalent'],
      ['12345', '12345', 'wrong']
    ],
    { compare: { mode: 'numeric', significantFigures: 3 } }
  );

  runFixtures(
    [
      ['0.75', '\\frac{3}{4}', 'equivalent'],
      ['0.7500000001', '\\frac{3}{4}', 'equivalent'],
      ['0.751', '\\frac{3}{4}', 'wrong'],
      ['x+1', 'x+1', 'equivalent'],
      ['x+1.001', 'x+1', 'wrong']
    ],
    { compare: { mode: 'numeric' } }
  );
});

describe('units', () => {
  const metres = { units: { unit: 'm', allowConversion: true } };
  runFixtures(
    [
      ['2\\,\\mathrm{m}', '2\\,\\mathrm{m}', 'equivalent'],
      ['200\\,\\mathrm{cm}', '2\\,\\mathrm{m}', 'equivalent'],
      ['2000\\,\\mathrm{mm}', '2\\,\\mathrm{m}', 'equivalent'],
      ['0.002\\,\\mathrm{km}', '2\\,\\mathrm{m}', 'equivalent'],
      ['2\\text{ m}', '2\\,\\mathrm{m}', 'equivalent'],
      ['2\\,\\mathrm{cm}', '2\\,\\mathrm{m}', 'wrong'],
      ['3\\,\\mathrm{m}', '2\\,\\mathrm{m}', 'wrong'],
      ['2\\,\\mathrm{kg}', '2\\,\\mathrm{m}', 'wrong_units'],
      ['2', '2\\,\\mathrm{m}', 'wrong_units'],
      ['2', '2', 'wrong_units'],
      ['200\\,\\mathrm{cm}', '2', 'equivalent']
    ],
    metres
  );

  runFixtures(
    [
      ['2\\,\\mathrm{m}', '2\\,\\mathrm{m}', 'equivalent'],
      ['200\\,\\mathrm{cm}', '2\\,\\mathrm{m}', 'wrong_units'],
      ['2\\,\\mathrm{kg}', '2\\,\\mathrm{m}', 'wrong_units']
    ],
    { units: { unit: 'm', allowConversion: false } }
  );

  runFixtures(
    [
      ['5\\,\\mathrm{m/s}', '5\\,\\mathrm{m/s}', 'equivalent'],
      ['18\\,\\mathrm{km/h}', '5\\,\\mathrm{m/s}', 'equivalent'],
      ['5\\,\\mathrm{km/h}', '5\\,\\mathrm{m/s}', 'wrong'],
      ['5\\,\\mathrm{m}', '5\\,\\mathrm{m/s}', 'wrong_units']
    ],
    { units: { unit: 'm/s', allowConversion: true } }
  );

  runFixtures(
    [
      ['1.5\\,\\mathrm{kg}', '1500\\,\\mathrm{g}', 'equivalent'],
      ['1500\\,\\mathrm{g}', '1.5\\,\\mathrm{kg}', 'equivalent'],
      ['1.5\\,\\mathrm{g}', '1.5\\,\\mathrm{kg}', 'wrong']
    ],
    { units: { unit: '\\mathrm{kg}', allowConversion: true } }
  );
});

describe('variables and constants', () => {
  it('reads e and i as constants by default', () => {
    expect(grade('e^{i\\pi}', '-1').reason).toBe('equivalent');
    expect(grade('2e', 'e+e').reason).toBe('equivalent');
    expect(grade('e', '2.718281828459045').reason).toBe('equivalent');
  });

  it('reads e and i as variables when the question declares them', () => {
    const settings = { variables: ['e', 'i'] };
    expect(grade('e+i', 'i+e', settings).reason).toBe('equivalent');
    expect(grade('e', '2.718281828459045', settings).reason).toBe('wrong');
    expect(grade('i^2', '-1', settings).reason).toBe('wrong');
    expect(grade('2e', 'e+e', settings).reason).toBe('equivalent');
  });

  it('reads \\pi as a variable when declared', () => {
    expect(grade('\\pi', '3.141592653589793', { variables: ['\\pi'] }).reason).toBe('wrong');
  });
});

describe('invalid answers and accepted answers', () => {
  it.each(['', '   ', 'x+', '\\frac{1}{', '2x+)', '=='])('marks %j invalid', (latex) => {
    expect(grade(latex, '2x+2').reason).toBe('invalid');
  });

  it('skips an invalid accepted answer and matches the next one', () => {
    expect(grade('2x+2', ['x+', '2(x+1)'])).toMatchObject({ reason: 'equivalent', matchedAnswer: '2(x+1)' });
  });

  it('returns wrong when no accepted answer is set', () => {
    expect(grade('2x+2', []).reason).toBe('wrong');
  });

  it('prefers a full match over a form mismatch across accepted answers', () => {
    const result = grade('2(x+1)', ['2x+2', '2(x+1)'], { compare: { mode: 'exact_form', form: 'factored' } });
    expect(result.reason).toBe('equivalent');
  });

  it('reports the required form when the form is wrong', () => {
    const result = grade('2(x+1)', '2x+2', { compare: { mode: 'exact_form', form: 'expanded' } });
    expect(result).toMatchObject({ reason: 'wrong_form', requiredForm: 'expanded', matchedAnswer: '2x+2' });
  });

  it('accepts math wrapped in $ delimiters', () => {
    expect(grade('$x^2$', '$$x\\cdot x$$').reason).toBe('equivalent');
  });
});

describe('wrong answer feedback', () => {
  const settings = {
    wrongAnswerFeedback: [
      { answer: '2x+1', feedback: 'Multiply the 1 by 2 as well.' },
      { answer: 'x>3', feedback: 'You forgot to flip the inequality.' }
    ]
  };

  it('returns the feedback of a matching known wrong answer', () => {
    expect(grade('2x+1', '2x+2', settings)).toEqual({ reason: 'wrong', feedback: 'Multiply the 1 by 2 as well.' });
  });

  it('matches feedback by equivalence, not spelling', () => {
    expect(grade('1+2x', '2x+2', settings).feedback).toBe('Multiply the 1 by 2 as well.');
    expect(grade('3<x', 'x<3', settings).feedback).toBe('You forgot to flip the inequality.');
  });

  it('returns no feedback for an unknown wrong answer', () => {
    expect(grade('x+2', '2x+2', settings)).toEqual({ reason: 'wrong' });
  });

  it('returns no feedback for a correct answer', () => {
    expect(grade('2(x+1)', '2x+2', settings).feedback).toBeUndefined();
  });
});

describe('normaliseMathAnswer', () => {
  it.each([
    ['2x+2', '2+2x'],
    ['2x+2', '2 x + 2'],
    ['2x+2', 'x\\cdot 2+2'],
    ['\\frac{1}{2}', '\\frac{2}{4}'],
    ['x=-3', 'x = -3'],
    ['\\{2,3\\}', '\\{3,2\\}'],
    ['$x^2$', 'x^2']
  ])('groups %s with %s', (left, right) => {
    expect(normaliseMathAnswer(left)).toBe(normaliseMathAnswer(right));
  });

  it.each([
    ['x=-3', 'x=3'],
    ['2x+2', '2x+1'],
    ['(2,3)', '(3,2)']
  ])('keeps %s apart from %s', (left, right) => {
    expect(normaliseMathAnswer(left)).not.toBe(normaliseMathAnswer(right));
  });

  it('returns a MathJSON string', () => {
    expect(JSON.parse(normaliseMathAnswer('x+1')!)).toEqual(['Add', 'x', 1]);
  });

  it('returns null for invalid math', () => {
    expect(normaliseMathAnswer('x+')).toBeNull();
    expect(normaliseMathAnswer('')).toBeNull();
  });
});
