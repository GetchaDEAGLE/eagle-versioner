/**
 * Invalid option exception used in methods where invalid options are encountered.
 * See <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#Custom_Error_Types">this</a>
 * for more details.
 */
class InvalidOptionException extends Error {
  /**
   * Constructor to perform important class inheritance operations.
   * @param {string} message The message assigned to the exception.
   */
  constructor(message = "Invalid option has been encountered.") {
    // call parent constructor
    super();

    // maintains the proper stack trace for where the error was thrown (only available on V8)
    Error.captureStackTrace(this, this.constructor);

    // assign values to inherited local class variables
    this.name = "InvalidOptionException";
    this.message = message;
  }
}

module.exports = InvalidOptionException;
