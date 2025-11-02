export class ApiResponseError<TRawErrorResponse = unknown> extends Error {
  public data: TRawErrorResponse;

  public httpStatusCode: number;

  public constructor(httpStatusCode: number, data: TRawErrorResponse, message?: string) {
    super(message);
    this.name = `ApiResponseError: http status code ${httpStatusCode}`;
    this.data = data;
    this.httpStatusCode = httpStatusCode;
  }
}
