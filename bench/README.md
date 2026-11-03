# Benchmarks

Mount-time benchmarks for `@formkit/vue` in a real (headless) Chromium, used
to measure performance changes (see #1314).

```bash
pnpm build          # the bench uses packages/*/dist
pnpm bench          # time: native,flat,validated,rows × 450 inputs, 7 runs
pnpm bench profile flat 450 1   # CPU profile + top self-time functions
```

`node bench/run.mjs <time|profile> [scenarios] [inputs] [runs]`

Each run is a fresh page load; the first run is a discarded warm-up and the
median is reported. Time is measured from `app.mount()` until the form has
settled and two animation frames have painted.

| scenario    | what it mounts                                         |
| ----------- | ------------------------------------------------------ |
| `native`    | plain `<input>`s with v-model-style bindings (floor)   |
| `flat`      | one form with N text inputs                            |
| `validated` | `flat` + `validation="required|length:2"` on each      |
| `rows`      | form › list › N/10 groups › 10 text inputs (tables)    |

Compare against a baseline by running the bench on both branches with the
same machine and Node version; numbers are only comparable relative to each
other.
