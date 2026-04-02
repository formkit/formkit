# @formkit/react

React integration layer for FormKit. Provides components, hooks, and configuration providers that connect FormKit core nodes to React rendering.

## Architecture

```
src/
├── FormKit.ts            # Main <FormKit> component
├── FormKitSchema.ts      # Schema renderer - compiles JSON schema to React nodes
├── FormKitProvider.ts    # Config provider components (FormKitProvider, FormKitLazyProvider)
├── FormKitMessages.ts    # Standalone message rendering component
├── FormKitSummary.ts     # Form error summary component
├── FormKitIcon.ts        # Icon rendering component
├── FormKitRoot.ts        # ShadowRoot/Document context provider
├── FormKitKitchenSink.ts # Dev helper component
├── plugin.ts             # React plugin factory + contexts
├── bindings.ts           # Core plugin that creates FormKit framework context on nodes
├── reactiveStore.ts      # React subscription store for mutable contexts
├── defaultConfig.ts      # Default config factory (validation, i18n, inputs, themes)
├── index.ts              # Public exports
├── context.ts            # Internal React contexts for node/root wiring
├── composables/
│   ├── useInput.ts
│   ├── createInput.ts
│   ├── useContext.ts
│   ├── defineFormKitConfig.ts
│   └── onSSRComplete.ts
└── utilities/
    └── resetCount.ts
```

## Key Notes

- `bindings.ts` mutates `node.context` and notifies React subscribers via `reactiveStore.ts`.
- `FormKitSchema.ts` ports the schema compiler/runtime used in Vue, but renders via React `createElement`.
- `useInput.ts` creates and syncs FormKit nodes from React props.
- `FormKitProvider` is the primary configuration entrypoint in React.
