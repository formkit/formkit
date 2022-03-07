// eslint-disable-next-line @typescript-eslint/no-var-requires
const FormKitTailwind = require('@formkit/tailwindcss');

module.exports = {
  content: ['./packages/tailwindcss/playground/src/**/*.{html,js,vue}'],
  theme: {
    extend: {},
  },
  plugins: [
    FormKitTailwind.default
  ],
}
