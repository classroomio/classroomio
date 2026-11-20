import { skillRowsToCsv } from './skill-csv';

type StarterRow = { code: string; name: string; description?: string; parent_code?: string };

export type SkillStarterSet = {
  id: 'common-core' | 'waec-neco' | 'uk-national-curriculum';
  framework: string;
  fileName: string;
  csv: string;
};

const COMMON_CORE_FRAMEWORK = 'Common Core (sample subset)';
const WAEC_NECO_FRAMEWORK = 'WAEC/NECO Mathematics (sample strands)';
const UK_FRAMEWORK = 'UK National Curriculum (sample strands)';

const commonCoreRows: StarterRow[] = [
  { code: 'CCSS.MATH', name: 'Common Core State Standards for Mathematics' },
  { code: 'CCSS.MATH.6', name: 'Grade 6', parent_code: 'CCSS.MATH' },
  { code: 'CCSS.MATH.6.RP', name: 'Ratios and Proportional Relationships', parent_code: 'CCSS.MATH.6' },
  {
    code: 'CCSS.MATH.6.RP.A.3',
    name: 'Ratio and rate reasoning',
    description: 'Use ratio and rate reasoning to solve real-world and mathematical problems.',
    parent_code: 'CCSS.MATH.6.RP'
  },
  { code: 'CCSS.MATH.6.NS', name: 'The Number System', parent_code: 'CCSS.MATH.6' },
  {
    code: 'CCSS.MATH.6.NS.A.1',
    name: 'Divide fractions by fractions',
    description: 'Interpret and compute quotients of fractions, and solve word problems involving division of fractions.',
    parent_code: 'CCSS.MATH.6.NS'
  },
  {
    code: 'CCSS.MATH.6.NS.C.5',
    name: 'Positive and negative numbers',
    description: 'Understand that positive and negative numbers are used together to describe quantities having opposite directions or values.',
    parent_code: 'CCSS.MATH.6.NS'
  },
  { code: 'CCSS.MATH.6.EE', name: 'Expressions and Equations', parent_code: 'CCSS.MATH.6' },
  {
    code: 'CCSS.MATH.6.EE.A.1',
    name: 'Whole-number exponents',
    description: 'Write and evaluate numerical expressions involving whole-number exponents.',
    parent_code: 'CCSS.MATH.6.EE'
  },
  {
    code: 'CCSS.MATH.6.EE.A.2',
    name: 'Expressions with letters',
    description: 'Write, read, and evaluate expressions in which letters stand for numbers.',
    parent_code: 'CCSS.MATH.6.EE'
  },
  {
    code: 'CCSS.MATH.6.EE.A.3',
    name: 'Equivalent expressions',
    description: 'Apply the properties of operations to generate equivalent expressions.',
    parent_code: 'CCSS.MATH.6.EE'
  },
  {
    code: 'CCSS.MATH.6.EE.B.7',
    name: 'One-step equations',
    description: 'Solve real-world and mathematical problems by writing and solving equations of the form x + p = q and px = q.',
    parent_code: 'CCSS.MATH.6.EE'
  },
  { code: 'CCSS.MATH.7', name: 'Grade 7', parent_code: 'CCSS.MATH' },
  { code: 'CCSS.MATH.7.EE', name: 'Expressions and Equations', parent_code: 'CCSS.MATH.7' },
  {
    code: 'CCSS.MATH.7.EE.B.4',
    name: 'Equations and inequalities from word problems',
    description: 'Use variables to represent quantities in a real-world or mathematical problem, and construct simple equations and inequalities.',
    parent_code: 'CCSS.MATH.7.EE'
  },
  { code: 'CCSS.MATH.8', name: 'Grade 8', parent_code: 'CCSS.MATH' },
  { code: 'CCSS.MATH.8.EE', name: 'Expressions and Equations', parent_code: 'CCSS.MATH.8' },
  {
    code: 'CCSS.MATH.8.EE.C.7',
    name: 'Linear equations in one variable',
    description: 'Solve linear equations in one variable.',
    parent_code: 'CCSS.MATH.8.EE'
  },
  { code: 'CCSS.MATH.8.F', name: 'Functions', parent_code: 'CCSS.MATH.8' },
  {
    code: 'CCSS.MATH.8.F.A.1',
    name: 'Functions as rules',
    description: 'Understand that a function is a rule that assigns to each input exactly one output.',
    parent_code: 'CCSS.MATH.8.F'
  },
  { code: 'CCSS.MATH.HSA', name: 'High school: Algebra', parent_code: 'CCSS.MATH' },
  {
    code: 'CCSS.MATH.HSA.REI.B.3',
    name: 'Linear equations and inequalities',
    description: 'Solve linear equations and inequalities in one variable, including equations with coefficients represented by letters.',
    parent_code: 'CCSS.MATH.HSA'
  }
];

const waecNecoRows: StarterRow[] = [
  { code: 'WAEC.MATH.NUM', name: 'Number and numeration', description: 'Number bases, fractions, indices, logarithms, surds and sequences.' },
  { code: 'WAEC.MATH.ALG', name: 'Algebraic processes', description: 'Expressions, equations, inequalities, variation and functions.' },
  { code: 'WAEC.MATH.MEN', name: 'Mensuration', description: 'Lengths, areas, volumes and surface areas of plane and solid shapes.' },
  { code: 'WAEC.MATH.GEO', name: 'Plane geometry', description: 'Angles, polygons, circles, construction and loci.' },
  { code: 'WAEC.MATH.TRG', name: 'Trigonometry', description: 'Ratios, bearings, angles of elevation and depression, sine and cosine rules.' },
  { code: 'WAEC.MATH.STA', name: 'Statistics and probability', description: 'Data presentation, measures of location and spread, and probability.' },
  { code: 'WAEC.MATH.VTR', name: 'Vectors and transformation', description: 'Vectors in two dimensions and geometric transformations.' },
  { code: 'WAEC.MATH.CAL', name: 'Calculus', description: 'Differentiation and integration of simple functions.' }
];

const ukRows: StarterRow[] = [
  { code: 'UKNC.MATH.NUM', name: 'Number', description: 'Place value, the four operations, fractions, decimals and percentages.' },
  { code: 'UKNC.MATH.ALG', name: 'Algebra', description: 'Notation, expressions, equations, formulae and sequences.' },
  { code: 'UKNC.MATH.RPR', name: 'Ratio, proportion and rates of change', description: 'Ratio, scale, proportion, rates and percentage change.' },
  { code: 'UKNC.MATH.GEO', name: 'Geometry and measures', description: 'Shape, angles, measurement, transformations and trigonometry.' },
  { code: 'UKNC.MATH.PRO', name: 'Probability', description: 'Chance, sample spaces and relative frequency.' },
  { code: 'UKNC.MATH.STA', name: 'Statistics', description: 'Collecting, representing and interpreting data.' }
];

function withFramework(rows: StarterRow[], framework: string) {
  return rows.map((row) => ({ ...row, framework }));
}

export const SKILL_STARTER_SETS: readonly SkillStarterSet[] = [
  {
    id: 'common-core',
    framework: COMMON_CORE_FRAMEWORK,
    fileName: 'skills-common-core-sample.csv',
    csv: skillRowsToCsv(withFramework(commonCoreRows, COMMON_CORE_FRAMEWORK))
  },
  {
    id: 'waec-neco',
    framework: WAEC_NECO_FRAMEWORK,
    fileName: 'skills-waec-neco-sample.csv',
    csv: skillRowsToCsv(withFramework(waecNecoRows, WAEC_NECO_FRAMEWORK))
  },
  {
    id: 'uk-national-curriculum',
    framework: UK_FRAMEWORK,
    fileName: 'skills-uk-national-curriculum-sample.csv',
    csv: skillRowsToCsv(withFramework(ukRows, UK_FRAMEWORK))
  }
];
