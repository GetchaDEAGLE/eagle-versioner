/**
 * Invalid version exception used in methods where version isn't valid based on empirical version data.
 * See <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#Custom_Error_Types">this</a>
 * for more details.
 */
class InvalidVersionException extends Error {
  /**
   * Constructor to perform important class inheritance operations.
   * @param {string} message The message assigned to the exception.
   */
  constructor(message = "Version is not valid based on empirical version data.") {
    // call parent constructor
    super();

    // maintains the proper stack trace for where the error was thrown (only available on V8)
    Error.captureStackTrace(this, this.constructor);

    // assign values to inherited local class variables
    this.name = "InvalidVersionException";
    this.message = message;
  }
}

module.exports = InvalidVersionException;
