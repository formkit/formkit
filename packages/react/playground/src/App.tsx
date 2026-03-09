import { useEffect, useMemo, useState } from 'react'
import {
  FormKit,
  FormKitProvider,
  FormKitSchema,
  defaultConfig,
  useFormKitContextById,
} from '@formkit/react'
import type { FormKitSchemaNode } from '@formkit/core'
import formkitConfig from '../formkit.config'

type ThemeMode = 'system' | 'light' | 'dark'

function getInitialThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system'
  const saved = window.localStorage.getItem('formkit-react-playground-theme')
  return saved === 'light' || saved === 'dark' || saved === 'system'
    ? saved
    : 'system'
}

function applyThemeMode(mode: ThemeMode) {
  if (typeof window === 'undefined') return
  const root = document.documentElement
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const useDark = mode === 'dark' || (mode === 'system' && prefersDark)
  root.classList.toggle('dark', useDark)
}

function LiveFormValue() {
  const formContext = useFormKitContextById<Record<string, unknown>>('react-source-form')
  return (
    <pre className="json-output">
      {JSON.stringify((formContext?.value as Record<string, unknown>) || {}, null, 2)}
    </pre>
  )
}

function ConditionalFields() {
  const formContext = useFormKitContextById<Record<string, unknown>>('react-source-form')
  const formValue = (formContext?.value as Record<string, unknown>) || {}
  const showConditional = formValue.show_conditional_fields === true

  if (!showConditional) {
    return null
  }

  return (
    <section className="rounded-lg border border-emerald-300/60 bg-emerald-50/70 p-4 dark:border-emerald-500/40 dark:bg-emerald-900/20">
      <p className="mb-3 text-sm font-medium text-emerald-900 dark:text-emerald-200">
        Conditional fields are mounted. Uncheck the toggle to remove these nodes.
      </p>
      <FormKit
        type="text"
        name="conditional_text"
        label="Conditional Text"
        help="Should disappear from form value when unmounted."
      />
      <FormKit
        type="select"
        name="conditional_plan"
        label="Conditional Plan"
        options={[
          { label: 'Starter', value: 'starter' },
          { label: 'Growth', value: 'growth' },
          { label: 'Enterprise', value: 'enterprise' },
        ]}
        defaultValue="growth"
      />
      <FormKit type="group" name="conditional_group" label="Conditional Group">
        <FormKit type="text" name="city" label="City" />
        <FormKit type="text" name="region" label="Region / State" />
      </FormKit>
    </section>
  )
}

export function App() {
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getInitialThemeMode())
  const config = useMemo(() => defaultConfig(formkitConfig), [])
  const checkboxGroupDefault = useMemo(() => ['a'], [])
  const groupDefault = useMemo(
    () => ({ first_name: 'Ada', last_name: 'Lovelace' }),
    []
  )
  const metaDefault = useMemo(
    () => ({ playground: 'react', theme: 'regenesis' }),
    []
  )
  const fns = useMemo(
    () => ({
      hasText: (value: unknown) => String(value ?? '').trim().length > 0,
    }),
    []
  )

  const schemaData = useMemo(
    () => ({
      prompt: 'Schema rendering from @formkit/react source',
      fns,
    }),
    [fns]
  )

  const schema = useMemo<FormKitSchemaNode[]>(
    () => [
      {
        $el: 'div',
        attrs: { class: 'schema-box' },
        children: [
          { $el: 'h2', children: 'Schema (React renderer)' },
          { $el: 'p', if: '$fns.hasText($prompt)', children: '$prompt' },
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

  useEffect(() => {
    applyThemeMode(themeMode)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('formkit-react-playground-theme', themeMode)
      if (themeMode === 'system') {
        const media = window.matchMedia('(prefers-color-scheme: dark)')
        const onChange = () => applyThemeMode('system')
        media.addEventListener('change', onChange)
        return () => media.removeEventListener('change', onChange)
      }
    }
    return
  }, [themeMode])

  const themeOptions: ThemeMode[] = ['system', 'light', 'dark']

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 text-slate-900 dark:text-slate-100">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-semibold tracking-tight">FormKit React Source Playground</h1>
        <div className="inline-flex rounded-lg border border-slate-300 bg-white p-1 dark:border-slate-600 dark:bg-slate-900">
          {themeOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setThemeMode(option)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition ${
                themeMode === option
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <p className="mb-8 text-slate-600 dark:text-slate-300">
        Tailwind v4 + regenesis theme, running directly from{' '}
        <code className="rounded bg-slate-200 px-1 py-0.5 text-xs dark:bg-slate-800">
          packages/react/src
        </code>
        .
      </p>
      <FormKitProvider config={config}>
        <FormKit
          type="form"
          id="react-source-form"
          submitLabel="Submit"
          onSubmit={(data) => setSubmitted(data as Record<string, unknown>)}
        >
          <div className="mb-6 border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Text Family Inputs
          </div>
          <FormKit type="text" name="text_value" label="Text" defaultValue="Hello FormKit" />
          <FormKit
            type="email"
            name="email_value"
            label="Email"
            defaultValue="hello@formkit.com"
          />
          <FormKit
            type="password"
            name="password_value"
            label="Password"
            defaultValue="hunter2"
          />
          <FormKit
            type="search"
            name="search_value"
            label="Search"
            defaultValue="FormKit React"
          />
          <FormKit
            type="tel"
            name="tel_value"
            label="Telephone"
            defaultValue="+1 (555) 555-0100"
          />
          <FormKit type="url" name="url_value" label="URL" defaultValue="https://formkit.com" />
          <FormKit type="number" name="number_value" label="Number" defaultValue={42} />
          <FormKit
            type="range"
            name="range_value"
            label="Range"
            defaultValue={30}
            min="0"
            max="100"
          />
          <FormKit type="color" name="color_value" label="Color" defaultValue="#2563eb" />
          <FormKit type="date" name="date_value" label="Date" defaultValue="2026-03-03" />
          <FormKit
            type="datetime-local"
            name="datetime_value"
            label="Datetime Local"
            defaultValue="2026-03-03T09:30"
          />
          <FormKit type="month" name="month_value" label="Month" defaultValue="2026-03" />
          <FormKit type="time" name="time_value" label="Time" defaultValue="09:30" />
          <FormKit type="week" name="week_value" label="Week" defaultValue="2026-W10" />
          <FormKit
            type="textarea"
            name="textarea_value"
            label="Textarea"
            defaultValue="This playground now includes one of each core input type."
          />

          <div className="mb-6 mt-8 border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Choice Inputs
          </div>
          <FormKit
            type="checkbox"
            name="updates"
            label="Email me updates"
            defaultValue={true}
          />
          <FormKit
            type="checkbox"
            name="show_conditional_fields"
            label="Show conditional fields"
            help="Toggle to mount/unmount extra fields and observe node removal."
            defaultValue={true}
          />
          <ConditionalFields />
          <FormKit
            type="checkbox"
            name="checkbox_group_value"
            label="Checkbox Group"
            defaultValue={checkboxGroupDefault}
            options={[
              { label: 'Option A', value: 'a' },
              { label: 'Option B', value: 'b' },
              { label: 'Option C', value: 'c' },
            ]}
          />
          <FormKit
            type="radio"
            name="radio_value"
            label="Radio"
            defaultValue="pro"
            options={[
              { label: 'Starter', value: 'starter' },
              { label: 'Pro', value: 'pro' },
              { label: 'Enterprise', value: 'enterprise' },
            ]}
          />
          <FormKit
            type="select"
            name="country"
            label="Country"
            defaultValue="CA"
            options={[
              { label: 'United States', value: 'US' },
              { label: 'Canada', value: 'CA' },
              { label: 'United Kingdom', value: 'UK' },
            ]}
          />
          <FormKit type="file" name="file_value" label="File" help="Optional file upload" />

          <div className="mb-6 mt-8 border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Structural Inputs
          </div>
          <FormKit type="hidden" name="hidden_value" defaultValue="hidden-data" />
          <FormKit
            type="group"
            name="group_value"
            label="Group"
            help="Nested object"
            defaultValue={groupDefault}
          >
            <FormKit type="text" name="first_name" label="First Name" />
            <FormKit type="text" name="last_name" label="Last Name" />
          </FormKit>
          <FormKit type="list" name="list_value" label="List">
            <FormKit type="text" defaultValue="List item 1" />
            <FormKit type="text" defaultValue="List item 2" />
          </FormKit>
          <FormKit type="meta" name="meta_value" defaultValue={metaDefault} />
          <FormKit type="button" label="Button Input" help="Non-submit button input type." />

          <FormKitSchema schema={schema} data={schemaData} />
        </FormKit>
      </FormKitProvider>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-2 text-lg font-semibold">Live form value</h2>
          <LiveFormValue />
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-2 text-lg font-semibold">Last submit payload</h2>
          <pre className="json-output">
            {submitted ? JSON.stringify(submitted, null, 2) : 'Submit the form.'}
          </pre>
        </article>
      </section>
    </main>
  )
}
