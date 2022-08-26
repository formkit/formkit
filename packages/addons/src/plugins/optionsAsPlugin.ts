import { FormKitNode, FormKitPlugin, FormKitProps } from '@formkit/core';
import { FormKitOptionsList } from '@formkit/inputs';

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
const mapOptions = (mappingOptions: Partial<FormKitProps>, options: string[] | FormKitOptionsList) => {
  return options.map((option) => {
    if (typeof option === 'string' || typeof option === 'number') return option;

    return {
      ...option,
      label: mappingOptions.labelAs ? option[mappingOptions.labelAs] : undefined,
      value: mappingOptions.valueAs ? option[mappingOptions.valueAs] : undefined
    };
  });
};

/**
 * Adds labelAs and valueAs to be mapped for inputs with options
 * @param options - A MappingOptions interface
 * @public
 */
export const optionsAsPlugin = (options?: MappingOptions): FormKitPlugin => (node: FormKitNode) => {
  if (!node.props.options || !Array.isArray(node.props.options)) return;

  node.addProps(['labelAs', 'valueAs', 'stopOptionMap']);

  if (node.props.stopOptionMap) return;

  if (!node.props.labelAs) node.props.labelAs = options?.labelAs;
  if (!node.props.valueAs) node.props.valueAs = options?.valueAs;

  if (!(node.props.labelAs || node.props.valueAs)) return;

  node.props.options = mapOptions(node.props, node.props.options);

  node.hook.prop((prop, next) => {
    if (prop.prop === 'options') {
      prop.value = mapOptions(node.props, prop.value);
    }

    return next(prop);
  });
};
