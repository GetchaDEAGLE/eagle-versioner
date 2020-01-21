/**
 * Incompatible tool exception used in methods when an incompatible tool (e.g. wrong version) is encountered.
 * See <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#Custom_Error_Types">this</a>
 * for more details.
 */
class IncompatibleToolException extends Error {
  /**
   * Constructor to perform important class inheritance operations.
   * @param {string} message The message assigned to the exception.
   */
  constructor(message = "Incompatible tool has been discovered.") {
    // call parent constructor
    super();

    // maintains the proper stack trace for where the error was thrown (only available on V8)
    Error.captureStackTrace(this, this.constructor);

    // assign values to inherited local class variables
    this.name = "IncompatibleToolException";
    this.message = message;
  }
}

module.exports = IncompatibleToolException;
