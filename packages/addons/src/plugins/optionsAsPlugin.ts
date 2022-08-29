import { FormKitNode, FormKitPlugin } from '@formkit/core';
import { FormKitOptionsList } from '@formkit/inputs';

declare module '@formkit/inputs' {
  interface FormKitOptionsPropExtensions {
    mappingOptions: Record<string, any>[];
  }
};

/**
 * Types for OptionsAsPlugin options
 * @public
 */
export interface MappingOptions {
  labelAs?: string;
  valueAs?: string;
};

/**
 * Map values based on node options
 * @internal
 */
const mapOptions = (node: FormKitNode, options?: MappingOptions) => {
  const mappingOptions = {
    labelAs: (node.props.labelAs || options?.labelAs) || 'label',
    valueAs: (node.props.valueAs || options?.valueAs) || 'value'
  };

  return (node.props.options as FormKitOptionsList).map(option => {
    if (typeof option === 'string' || typeof option === 'number') return option;

    return {
      ...option,
      label: option[mappingOptions.labelAs] || option.label,
      value: option[mappingOptions.valueAs] || option.value,
    }
  });
};

/**
 * Adds labelAs and valueAs to be mapped for inputs with options
 * @param options - A MappingOptions interface
 * @public
 */
export const optionsAsPlugin = (options?: MappingOptions): FormKitPlugin => (node: FormKitNode) => {
  if (!node.props.options || !Array.isArray(node.props.options)) return;

  node.addProps(['labelAs', 'valueAs']);

  node.props.options = mapOptions(node, options);

  node.hook.prop((prop, next) => {
    if (prop.prop === 'options') {
      prop.value = mapOptions(node, options);
    }

    return next(prop);
  });
};
