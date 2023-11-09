import { createTheme } from '@formkit/theme-creator'

export default createTheme({
  meta: {
    name: 'simple',
    description: 'A super simple theme',
    supportedInputs: ['text', 'select'],
    darkMode: false,
    formKitVersion: '^1.2.0',
  },
  variables: {
    radius: 'rounded-md',
    border: 'border-2',
    spacing: {
      editor: 'spacing',
      min: '2',
      max: '80',
      value: '64',
    },
    borderStrength: {
      editor: 'buttons',
      value: '100',
      scale: ['50', '100', '200', '300'],
    },
  },
  inputs: {
    __globals: {
      outer:
        'mb-$spacing mt-$spacing(-100) ml-$spacing(100) mr-$spacing(20, 0, 10) border-green-$borderStrength(3)',
    },
    'family:text': {
      outer: 'text-green-300',
    },
    text: {
      input: '$border $radius p-2 border-slate-$borderStrength(-1)',
    },
    select: {
      inner: '$border $radius p-4',
      outer: 'mb-$spacing(-2)',
    },
  },
})
