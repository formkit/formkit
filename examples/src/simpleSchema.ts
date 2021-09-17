export default [
  {
    $el: 'h1',
    attrs: {
      'data-location': '$location.planet',
    },
    children: ['I am on ', '$location.planet'],
  },
]
