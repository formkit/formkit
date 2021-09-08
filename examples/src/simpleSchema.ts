export default Array(1000)
  .fill(0)
  .map(() => ({
    $el: 'fieldset',
    children: '$value',
  }))
