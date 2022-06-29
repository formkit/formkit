// eslint-disable-next-line @typescript-eslint/no-var-requires
const formKitTailwind = require('@formkit/themes/tailwindcss');

module.exports = {
  content: ['./packages/tailwindcss/playground/src/**/*.{html,js,vue}'],
  theme: {
    extend: {},
  },
  plugins: [formKitTailwind],
}
