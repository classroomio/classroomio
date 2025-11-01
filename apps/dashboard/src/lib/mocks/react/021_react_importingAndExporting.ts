import { QuestionTypes } from '../utils';

import type { ExerciseTemplate } from '$lib/utils/types';

const template: ExerciseTemplate = {
  title: 'React Component Import and Export Practical Quiz',
  description: 'Test your practical knowledge of React component import and export.',
  questionnaire: {
    questions: [
      {
        title: 'Import the "Button" component from a file named "Button.js".',
        name: 'importButton',
        points: 1,
        order: 0,
        question_type: QuestionTypes[0],
        options: [
          {
            label: "import Button from './Button';",
            is_correct: true
          },
          {
            label: "import { Button } from './Button';",
            is_correct: false
          },
          {
            label: "import * as Button from './Button';",
            is_correct: false
          }
        ]
      },
      {
        title: 'How do you export a component as the default export in a file named "Component.js"?',
        name: 'exportDefaultComponent',
        points: 1,
        order: 1,
        question_type: QuestionTypes[0],
        options: [
          {
            label: 'export default Component;',
            is_correct: true
          },
          {
            label: "export { Component } from './Component';",
            is_correct: false
          },
          {
            label: "export { default as Component } from './Component';",
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of the default export in React?',
        name: 'defaultExportPurpose',
        points: 1,
        order: 2,
        question_type: QuestionTypes[2],
        options: [
          {
            label: 'To export a component that can be easily imported without curly braces.',
            is_correct: true
          },
          {
            label: 'To export multiple components from a file.',
            is_correct: false
          },
          {
            label: 'To prevent a component from being used in other files.',
            is_correct: false
          }
        ]
      },
      {
        title: 'How would you import and use a default export named "Header" from a file named "Header.js"?',
        name: 'importAndUseDefaultExport',
        points: 1,
        order: 3,
        question_type: QuestionTypes[0],
        options: [
          {
            label: "import Header from './Header';\n\n// Usage: <Header />",
            is_correct: true
          },
          {
            label: "import { Header } from './Header';\n\n// Usage: <Header />",
            is_correct: false
          },
          {
            label: "import * as Header from './Header';\n\n// Usage: <Header.Header />",
            is_correct: false
          }
        ]
      },
      {
        title: 'How can you export multiple components from a file named "Utils.js"?',
        name: 'exportMultipleComponents',
        points: 1,
        order: 4,
        question_type: QuestionTypes[1],
        options: [
          {
            label: "export { Component1, Component2 } from './Utils';",
            is_correct: true
          },
          {
            label: 'export default { Component1, Component2 };',
            is_correct: false
          },
          {
            label: "export { Component1, Component2 } as default from './Utils';",
            is_correct: false
          }
        ]
      },
      {
        title: 'What is the purpose of named exports in React?',
        name: 'namedExportsPurpose',
        points: 1,
        order: 5,
        question_type: QuestionTypes[2],
        options: [
          {
            label: 'To export multiple values from a module.',
            is_correct: true
          },
          {
            label: 'To specify the default export of a module.',
            is_correct: false
          },
          {
            label: 'To prevent certain values from being imported in other files.',
            is_correct: false
          }
        ]
      },
      {
        title:
          'How would you export a function named "calculateSum" as a named export from a file named "MathUtils.js"?',
        name: 'exportNamedFunction',
        points: 1,
        order: 6,
        question_type: QuestionTypes[0],
        options: [
          {
            label: "export { calculateSum } from './MathUtils';",
            is_correct: true
          },
          {
            label: "export calculateSum from './MathUtils';",
            is_correct: false
          },
          {
            label: "export default calculateSum from './MathUtils';",
            is_correct: false
          }
        ]
      },
      {
        title: 'Which file extension is commonly used for React component files?',
        name: 'fileExtension',
        points: 1,
        order: 7,
        question_type: QuestionTypes[0],
        options: [
          {
            label: '.js',
            is_correct: true
          },
          {
            label: '.jsx',
            is_correct: false
          },
          {
            label: '.ts',
            is_correct: false
          }
        ]
      },
      {
        title:
          'How do you import a named export "Button" from a file named "UIComponents.js" and alias it as "UIButton"?',
        name: 'importAndAliasNamedExport',
        points: 1,
        order: 8,
        question_type: QuestionTypes[1],
        options: [
          {
            label: "import { Button as UIButton } from './UIComponents';",
            is_correct: true
          },
          {
            label: "import * as { Button as UIButton } from './UIComponents';",
            is_correct: false
          },
          {
            label: "import { UIButton } from './UIComponents';",
            is_correct: false
          }
        ]
      },
      {
        title: 'Explain briefly why you might use named exports instead of a default export for multiple values.',
        name: 'namedExportsAdvantage',
        points: 5,
        order: 9,
        question_type: QuestionTypes[2],
        options: []
      }
    ]
  }
};

export default template;
