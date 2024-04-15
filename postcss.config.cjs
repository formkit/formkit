const autoprefixer = require('autoprefixer')
const nesting = require('postcss-nesting')

module.exports = {
  plugins: [nesting(), autoprefixer()],
}
