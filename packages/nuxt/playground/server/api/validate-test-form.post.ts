import { defineFormkitEventHandler, readBody } from '#imports'

export default defineFormkitEventHandler(async (event) => {
  const { data } = await readBody(event)
  return { ...data, validated: true }
}, 'test-form')
