<script>
export default {
  data() {
    return {
      validation: 'required',
    }
  },
}
</script>

<template>
  <div>
    <FormKit type="select" :validation="validation" />
  </div>
</template>
