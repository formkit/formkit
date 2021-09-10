export default [
  {
    $el: 'h1',
    children: [
      {
        $el: 'em',
        children: '$input',
        $if: '$input == "bob" || $input == "justin"',
      },
    ],
  },
]
