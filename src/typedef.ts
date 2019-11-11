export type native_t = string | number | boolean;
export interface object_t {
    type: string,
}
export interface var_t extends object_t {
    type: 'var',
    name: string
}
