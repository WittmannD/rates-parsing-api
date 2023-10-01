export class InvalidInputError extends Error {
  constructor(msg: string) {
    super(msg);

    Object.setPrototypeOf(this, InvalidInputError.prototype);
  }
}