export default [
  {
    $el: 'h1',
    children: {
      $if: '$input > 100',
      $then: [
        {
          $el: 'em',
          children: 'You’re rich',
        },
        {
          $el: 'strong',
          children: [' ($', '$input', ')'],
        },
      ],
      $else: {
        $if: '$input > 50',
        $then: 'You’re medium',
        $else: 'You’re really poor',
      },
    },
  },
]
