// imports
const FrozenObjectException = require("../../exceptions/FrozenObjectException");
const IllegalArgumentException = require("../../exceptions/IllegalArgumentException");
const IncompatibleToolException = require("../../exceptions/IncompatibleToolException");
const InvalidGitDataException = require("../../exceptions/InvalidGitDataException");
const IOException = require("../../exceptions/IOException");
const MissingToolException = require("../../exceptions/MissingToolException");
const ShellCmdFailureException = require("../../exceptions/ShellCmdFailureException");
const VersionFormattingException = require("../../exceptions/VersionFormattingException");

describe("Tests all custom exceptions for proper functionality.", () => {
  test("Tests throwing a FrozenObjectException.", () => {
    const customError = () => {
      throw new FrozenObjectException("This object cannot be modified as it is frozen.");
    };

    expect(customError).toThrow(FrozenObjectException);
  });

  test("Tests throwing a IllegalArgumentException.", () => {
    const customError = () => {
      throw new IllegalArgumentException("An illegal argument was passed.");
    };

    expect(customError).toThrow(IllegalArgumentException);
  });

  test("Tests throwing a IncompatibleToolException.", () => {
    const customError = () => {
      throw new IncompatibleToolException("An incompatible tool was detected.");
    };

    expect(customError).toThrow(IncompatibleToolException);
  });

  test("Tests throwing a InvalidGitDataException.", () => {
    const customError = () => {
      throw new InvalidGitDataException("The data obtained from Git is invalid for the current situation.");
    };

    expect(customError).toThrow(InvalidGitDataException);
  });

  test("Tests throwing a IOException.", () => {
    const customError = () => {
      throw new IOException("Unable to access the specified file as it may already be in use.");
    };

    expect(customError).toThrow(IOException);
  });

  test("Tests throwing a MissingToolException.", () => {
    const customError = () => {
      throw new MissingToolException("Git was not found. Please check your PATH and try again.");
    };

    expect(customError).toThrow(MissingToolException);
  });

  test("Tests throwing a ShellCmdFailureException.", () => {
    const customError = () => {
      throw new ShellCmdFailureException("The specified shell command produced a failure with exit code 1.");
    };

    expect(customError).toThrow(ShellCmdFailureException);
  });

  test("Tests throwing a VersionFormattingException.", () => {
    const customError = () => {
      throw new VersionFormattingException("The specified version isn't in semantic form.");
    };

    expect(customError).toThrow(VersionFormattingException);
  });
});
