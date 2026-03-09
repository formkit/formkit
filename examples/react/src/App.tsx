import { useMemo, useState } from 'react'
import {
  FormKit,
  FormKitProvider,
  FormKitSchema,
  defaultConfig,
} from '@formkit/react'
import type { FormKitSchemaNode } from '@formkit/core'

export function App() {
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null)
  const config = useMemo(() => defaultConfig(), [])

  const schema = useMemo<FormKitSchemaNode[]>(
    () => [
      {
        $el: 'div',
        attrs: { class: 'schema-box' },
        children: [
          { $el: 'h2', children: 'Schema (React renderer)' },
          {
            $formkit: 'text',
            name: 'schema_message',
            label: 'Schema Input',
            help: 'Rendered by FormKitSchema in React',
          },
        ],
      },
    ],
    []
  )

  return (
    <main className="page">
      <h1>FormKit React Dev Server</h1>
      <p>Interactive playground for @formkit/react.</p>

      <FormKitProvider config={config}>
        <FormKit
          type="form"
          id="react-playground-form"
          submitLabel="Submit"
          onSubmit={(data) => setSubmitted(data as Record<string, unknown>)}
        >
          <FormKit type="text" name="email" label="Email" validation="required|email" />
          <FormKit type="checkbox" name="updates" label="Email me updates" />
          <FormKit
            type="select"
            name="country"
            label="Country"
            options={[
              { label: 'United States', value: 'US' },
              { label: 'Canada', value: 'CA' },
            ]}
          />
          <FormKitSchema schema={schema} />
        </FormKit>
      </FormKitProvider>

      <section className="output">
        <h2>Submitted value</h2>
        <pre>{submitted ? JSON.stringify(submitted, null, 2) : 'Submit the form.'}</pre>
      </section>
    </main>
  )
}
