/**
 * Illegal argument exception used in methods when argument issues occur.
 * See <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#Custom_Error_Types">this</a>
 * for more details.
 */
class InvalidArgumentException extends Error {
  /**
   * Constructor to perform important class inheritance operations.
   * @param {string} message The message assigned to the exception.
   */
  constructor(message = "Invalid argument passed to function.") {
    // call parent constructor
    super();

    // maintains the proper stack trace for where the error was thrown (only available on V8)
    Error.captureStackTrace(this, this.constructor);

    // assign values to inherited local class variables
    this.name = "IllegalArgumentException";
    this.message = message;
  }
}

module.exports = InvalidArgumentException;
