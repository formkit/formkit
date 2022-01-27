import { defineComponent } from "vue";
import { FormKit } from '@formkit/vue'


// declare module '@formkit/vue' {
//   type FormKit = typeof FormKit
// }

export default defineComponent({
  setup () {
    return () => <FormKit min="10" />
  }
})
