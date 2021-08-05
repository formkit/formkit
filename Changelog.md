# Temporary changelog

A short list of notable breaking changes between Vue Formulate and FormKit. This
is not necessarily comprehensive and only intended to inform the documentation
process.

## Validation Rules

- The context object now includes the core `node` being operated on instead of get form values so all paths are relative
- `between` rule now only applies to numeric values, adds length and `date_between` rules
- `between` rule is now inclusive (ex: 8-64 includes 8 and 64)
- Confirm rule now uses node address syntax, and has a strict or loose comparison argument (loose by default)
- The date rule is now the date_format rule
- The `in` rule has been renamed `is`
- The `min` rule now only works on arrays and numbers. use `length_min`
- The `max` rule now only works on arrays and numbers. use `length_max`
- The `url` rule now uses the JavaScript native URL for parsing

## Validation rules TODO:

- Add `date_between` rule
- Add `mime` type once we determine how file uploads will work
- Add `length` rule
- Add `length_min`
- Add `length_max`
