import type { NotFoundError, ParseError, ValidationError } from "elysia";
import type { ElysiaCustomStatusResponse } from "elysia/error";
export function handleNotFoundError(error: Readonly<NotFoundError>) {
	return { message: error.message || "Not Found :(" };
}

export function handleInternalServerError(error: Readonly<Error>) {
	return { message: error.message || "Internal Server Error :(" };
}

export function handleValidation(error: Readonly<ValidationError>) {
	return { message: error.message || "Validation Error :(" };
}

export function handleParseError(error: Readonly<ParseError>) {
	return { message: error.message || "Parse Error :(" };
}

export function handleUnknownError(error: Readonly<Error>) {
	return { message: error.message || "Unknown Error :(" };
}

export function handleInvalidCookieSignature(
	error: Readonly<ElysiaCustomStatusResponse<number, number, number>>,
) {
	return { message: error.response || "Invalid Cookie Signature :(" };
}

export function handleInvalidFileType(
	error: Readonly<ElysiaCustomStatusResponse<number, number, number>>,
) {
	return { message: error.response || "Invalid File Type :(" };
}

export function ErrorMessages(
	code:
		| "NOT_FOUND"
		| "INTERNAL_SERVER_ERROR"
		| "VALIDATION"
		| "PARSE"
		| "UNKNOWN"
		| "INVALID_COOKIE_SIGNATURE"
		| "INVALID_FILE_TYPE"
		| number,
	error:
		| Readonly<Error>
		| Readonly<ValidationError>
		| Readonly<NotFoundError>
		| Readonly<ParseError>
		| Readonly<ElysiaCustomStatusResponse<number, number, number>>,
) {
	switch (code) {
		case "NOT_FOUND":
			return handleNotFoundError(error as Readonly<NotFoundError>);
		case "INTERNAL_SERVER_ERROR":
			return handleInternalServerError(error as Readonly<Error>);
		case "VALIDATION":
			return handleValidation(error as Readonly<ValidationError>);
		case "PARSE":
			return handleParseError(error as Readonly<ParseError>);
		case "INVALID_COOKIE_SIGNATURE":
			return handleInvalidCookieSignature(
				error as Readonly<
					ElysiaCustomStatusResponse<number, number, number>
				>,
			);
		case "INVALID_FILE_TYPE":
			return handleInvalidFileType(
				error as Readonly<
					ElysiaCustomStatusResponse<number, number, number>
				>,
			);
		default:
			return handleUnknownError(error as Readonly<Error>);
	}
}
