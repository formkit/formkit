;<template>
  <FormKit
    v-model="values"
    type="form"
  >
    <FormKit
      type="file"
      name="files"
      label="Your files"
      help="You can select as many files as you want"
      multiple
      :value="[{ name: 'foobar.jpg' }, { name: 'potato.png' }]"
    />

    <FormKit
      type="file"
      name="single_file"
      label="Single file"
      help="You can only select one file"
    />
    <FormKit
      type="file"
      name="another_file"
      label="Another file"
      help="You can only select one file"
    />
  </FormKit>
  <pre>{{ values }}</pre>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const values = ref({
  another_file: [ { name: 'pizza.jpg' } ]
})
</script>
