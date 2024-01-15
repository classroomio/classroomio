import { ARIARoleDefinitionKey } from 'aria-query';
import Attribute from '../nodes/Attribute';
export declare function is_non_interactive_roles(role: ARIARoleDefinitionKey): boolean;
export declare function is_interactive_roles(role: ARIARoleDefinitionKey): boolean;
export declare function is_abstract_role(role: ARIARoleDefinitionKey): boolean;
export declare function is_presentation_role(role: ARIARoleDefinitionKey): boolean;
export declare function is_hidden_from_screen_reader(tag_name: string, attribute_map: Map<string, Attribute>): boolean;
export declare function has_disabled_attribute(attribute_map: Map<string, Attribute>): boolean;
export declare enum ElementInteractivity {
    Interactive = "interactive",
    NonInteractive = "non-interactive",
    Static = "static"
}
export declare function element_interactivity(tag_name: string, attribute_map: Map<string, Attribute>): ElementInteractivity;
export declare function is_interactive_element(tag_name: string, attribute_map: Map<string, Attribute>): boolean;
export declare function is_non_interactive_element(tag_name: string, attribute_map: Map<string, Attribute>): boolean;
export declare function is_static_element(tag_name: string, attribute_map: Map<string, Attribute>): boolean;
export declare function is_semantic_role_element(role: ARIARoleDefinitionKey, tag_name: string, attribute_map: Map<string, Attribute>): boolean;
export declare function is_valid_autocomplete(autocomplete: null | true | string): boolean;
