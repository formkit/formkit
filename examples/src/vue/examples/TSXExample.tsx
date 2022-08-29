import { defineComponent } from "vue";
import { FormKit } from '@formkit/vue'

export default defineComponent({
  setup () {
    return () =>
    <FormKit
      label="123"
      config={{}}
      delay={200}
      errors={['This is an error']}
      help="Let me help you"
      id="special"
      ignore={true}
      name="bond"
      preserve={true}
      sections-schema={{ label: { $el: 'h1' }}}
      type="text"
      validation={[['required']]}
      multiple
      min={10}
      max={15}
      on-color={123}
    />
  }
})
