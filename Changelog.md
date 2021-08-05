# Temporary changelog

A short list of notable breaking changes between Vue Formulate and FormKit. This
is not necessarily comprehensive and only intended to inform the documentation
process.

## Validation Rules

- The context object now includes the core `node` being operated on instead of get form values so all paths are relative
- Between rule now only applies to numeric values, adds length and date_between rules
- Between rule is now inclusive (ex: 8-64 includes 8 and 64)
- Confirm rule now uses node address syntax, and has a strict or loose comparison argument (loose by default)


