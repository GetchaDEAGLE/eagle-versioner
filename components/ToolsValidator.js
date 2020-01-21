// imports
const colors = require("ansi-colors");
const shell = require("shelljs");
const Logger = require("../components/Logger");
const GitRunner = require("../components/GitRunner");
const IncompatibleToolException = require("../exceptions/IncompatibleToolException");
const InvalidGitDataException = require("../exceptions/InvalidGitDataException");
const MissingToolException = require("../exceptions/MissingToolException");
const IllegalArgumentException = require("../exceptions/IllegalArgumentException");

/**
 * Provides functionality for validating the correct tools are installed.
 * @param {Symbol} logOutputType The output type to use when logging messages.
 * @throws IllegalArgumentException when an invalid argument is passed.
 * @throws IncompatibleToolException if incompatible version of Git is installed.
 * @throws InvalidGitDataException if the version of Git returned cannot be parsed.
 * @throws InvalidGitDataException if the current folder doesn't contain a valid Git repository.
 * @throws MissingToolException if Git isn't installed.
 */
class ToolsValidator {
  /**
   * Validates that the correct tools are installed.
   */
  invoke(logOutputType) {
    if (typeof logOutputType === "symbol" && Logger.OutputType.getName(logOutputType)) {
      if (shell.which("git")) {
        let output = shell.exec("git --version", { silent: true });
        let currentGitVersion = output.match(/\d+[.]\d+[.]\d+/g).pop();
        let currentGitVersionComponents = (typeof currentGitVersion === "string") ? currentGitVersion.split(".") : [];
        let requiredGitVersionComponents = GitRunner.minimumRequiredGitVersion.split(".");

        if (currentGitVersionComponents.length === 3) {
          if ((currentGitVersionComponents[0] === requiredGitVersionComponents[0]
              && currentGitVersionComponents[1] === requiredGitVersionComponents[1]
              && currentGitVersionComponents[2] === requiredGitVersionComponents[2])
              || (currentGitVersionComponents[0] > requiredGitVersionComponents[0])
              || (currentGitVersionComponents[0] === requiredGitVersionComponents[0]
                  && currentGitVersionComponents[1] > requiredGitVersionComponents[1])
              || (currentGitVersionComponents[0] === requiredGitVersionComponents[0]
                  && currentGitVersionComponents[1] === requiredGitVersionComponents[1]
                  && currentGitVersionComponents[2] > requiredGitVersionComponents[2])) {
            Logger.publish({
              loggingLevelTarget: Logger.Level.VERBOSE,
              message: "The detected Git version " + colors.yellow(currentGitVersion) + " is compatible with the " +
                  "minimum requirement of " + colors.yellow(GitRunner.minimumRequiredGitVersion) + " or later.",
              isLabelIncluded: true,
              outputType: logOutputType
            });

            if (new GitRunner(Logger.OutputType.SHELL).isRepository()) {
              Logger.publish({
                loggingLevelTarget: Logger.Level.VERBOSE,
                message: "Valid Git repository detected.",
                isLabelIncluded: true,
                outputType: logOutputType
              });
            } else {
              throw new InvalidGitDataException("Cannot continue as the current folder doesn't contain a valid Git " +
                  "repository.");
            }
          } else {
            throw new IncompatibleToolException("Incompatible Git version " + colors.yellow(currentGitVersion) +
                " detected. Please upgrade Git to version " + GitRunner.minimumRequiredGitVersion + " or later.");
          }
        } else {
          throw new InvalidGitDataException("Git returned version " + colors.yellow(output) + " which couldn't be " +
              "parsed to determine compatibility.");
        }
      } else {
        throw new MissingToolException("Git is required to use this tool. Please install version " +
            colors.yellow(GitRunner.minimumRequiredGitVersion) + " or later.");
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the ToolsValidator invoke function.");
    }
  }
}

module.exports = ToolsValidator;
