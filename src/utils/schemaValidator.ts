import Ajv, { type ErrorObject } from 'ajv';

export type SchemaValidationResult = {
    valid: boolean;
    errors: ErrorObject[];
    errorText: string;
};

/**
 * Validates arbitrary JSON data against a JSON schema and returns
 * a test-friendly result payload.
 */
export function validateSchema(schema: object, data: unknown): SchemaValidationResult {
    const ajv = new Ajv({ allErrors: true, strict: false });
    const validate = ajv.compile(schema);
    const valid = validate(data) as boolean;
    const errors = (validate.errors ?? []) as ErrorObject[];

    return {
        valid,
        errors,
        errorText: errors.length > 0 ? ajv.errorsText(errors, { separator: '\n' }) : '',
    };
}