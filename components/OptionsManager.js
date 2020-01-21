// imports
const colors = require("ansi-colors");
const ChangelogCreator = require("../components/ChangelogCreator");
const GitRunner = require("../components/GitRunner");
const FileSystemHelper = require("../components/FileSystemHelper");
const Logger = require("../components/Logger");
const VersioningAgent = require("../components/VersioningAgent");
const ToolsValidator = require("../components/ToolsValidator");
const IllegalArgumentException = require("../exceptions/IllegalArgumentException");

/**
 * Provides functionality for setting and validating options.
 */
class OptionsManager {
  /**
   * Constructor to create local class variables.
   */
  constructor() {
    this.gitRunner = new GitRunner(Logger.OutputType.SHELL);
  }

  /**
   * Applies the specified logging level target.
   * @param {string} loggingLevel The desired logging level target.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  applyLoggingLevelTarget(loggingLevel) {
    if (typeof loggingLevel === "string" && loggingLevel) {
      if (loggingLevel.trim().length === 0) {
        Logger.publish({
          loggingLevelTarget: Logger.Level.ERROR,
          message: "The specified logging level must be more than just spaces.",
          isLabelIncluded: true,
          outputType: Logger.OutputType.SHELL
        });
        process.exit(1);
      } else if (loggingLevel.indexOf(" ") >= 0) {
        Logger.publish({
          loggingLevelTarget: Logger.Level.ERROR,
          message: "The specified logging level cannot contain spaces.",
          isLabelIncluded: true,
          outputType: Logger.OutputType.SHELL
        });
        process.exit(1);
      } else if (Logger.Level.isEntry(loggingLevel) === false) {
        Logger.publish({
          loggingLevelTarget: Logger.Level.ERROR,
          message: "The specified logging level " + colors.yellow(loggingLevel.toLowerCase()) + " isn't valid. " +
              "Available options are " + Logger.Level.toString().toLowerCase() + ".",
          isLabelIncluded: true,
          outputType: Logger.OutputType.SHELL
        });
        process.exit(1);
      } else {
        Logger.currentLoggingLevel = Logger.Level.getSymbol(loggingLevel);
        Logger.publish({
          loggingLevelTarget: Logger.Level.VERBOSE,
          message: "The specified logging level " + colors.yellow(loggingLevel.toLowerCase()) + " is valid.",
          isLabelIncluded: true,
          outputType: Logger.OutputType.SHELL
        });
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the OptionsManager applyLoggingLevelTarget function.");
    }
  }

  /**
   * Checks if the specified production branch name is valid.
   * @param {string} productionBranchName The name of the production branch.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  validateProdBranchName(productionBranchName) {
    if (typeof productionBranchName === "string" && productionBranchName) {
      try {
        if (productionBranchName.trim().length === 0) {
          Logger.publish({
            loggingLevelTarget: Logger.Level.ERROR,
            message: "The specified production branch name must be more than just spaces.",
            isLabelIncluded: true,
            outputType: Logger.OutputType.SHELL
          });
          process.exit(1);
        } else if (productionBranchName.indexOf(" ") >= 0) {
          Logger.publish({
            loggingLevelTarget: Logger.Level.ERROR,
            message: "The specified production branch name cannot contain spaces.",
            isLabelIncluded: true,
            outputType: Logger.OutputType.SHELL
          });
          process.exit(1);
        } else if (this.gitRunner.checkReference(productionBranchName) === false) {
          Logger.publish({
            loggingLevelTarget: Logger.Level.ERROR,
            message: "The specified production branch name " + colors.yellow(productionBranchName) + " isn't valid. " +
                "Please see https://git-scm.com/docs/git-check-ref-format for more details.",
            isLabelIncluded: true,
            outputType: Logger.OutputType.SHELL
          });
          process.exit(1);
        } else if (Array.from(productionBranchName).length > GitRunner.maxBranchNameCharLength) {
          Logger.publish({
            loggingLevelTarget: Logger.Level.ERROR,
            message: "The specified production branch name is too long.",
            isLabelIncluded: true,
            outputType: Logger.OutputType.SHELL
          });
          process.exit(1);
        } else {
          Logger.publish({
            loggingLevelTarget: Logger.Level.VERBOSE,
            message: "The specified production branch name " + colors.yellow(productionBranchName) + " is valid.",
            isLabelIncluded: true,
            outputType: Logger.OutputType.SHELL
          });
        }
      } catch (error) {
        Logger.publish({
          loggingLevelTarget: Logger.Level.ERROR,
          message: error.message,
          isLabelIncluded: true,
          outputType: Logger.OutputType.SHELL
        });
        process.exit(1);
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the OptionsManager validateProdBranchName function.");
    }
  }

  /**
   * Validates the specified strategy type.
   * @param {string} strategyType The specified strategy type.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  validateStrategyType(strategyType) {
    if (typeof strategyType === "string" && strategyType) {
      if (strategyType.trim().length === 0) {
        Logger.publish({
          loggingLevelTarget: Logger.Level.ERROR,
          message: "The specified strategy type must be more than just spaces.",
          isLabelIncluded: true,
          outputType: Logger.OutputType.SHELL
        });
        process.exit(1);
      } else if (strategyType.indexOf(" ") >= 0) {
        Logger.publish({
          loggingLevelTarget: Logger.Level.ERROR,
          message: "The specified strategy type cannot contain spaces.",
          isLabelIncluded: true,
          outputType: Logger.OutputType.SHELL
        });
        process.exit(1);
      } else if (VersioningAgent.StrategyType.isEntry(strategyType) === false) {
        Logger.publish({
          loggingLevelTarget: Logger.Level.ERROR,
          message: "The specified strategy type " + colors.yellow(strategyType) + " isn't valid. Available options are " +
              VersioningAgent.StrategyType.toString().toLowerCase() + ".",
          isLabelIncluded: true,
          outputType: Logger.OutputType.SHELL
        });
        process.exit(1);
      } else {
        Logger.publish({
          loggingLevelTarget: Logger.Level.VERBOSE,
          message: "The specified strategy type " + colors.yellow(strategyType.toLowerCase()) + " is valid.",
          isLabelIncluded: true,
          outputType: Logger.OutputType.SHELL
        });
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the OptionsManager validateStrategyType function.");
    }
  }

  /**
   * Validates the specified development version appendage type.
   * @param {string} devVersionAppendageType The specified development version appendage type.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  validateDevVersionAppendageType(devVersionAppendageType) {
    if (typeof devVersionAppendageType === "string" && devVersionAppendageType) {
      if (devVersionAppendageType.trim().length === 0) {
        Logger.publish({
          loggingLevelTarget: Logger.Level.ERROR,
          message: "The specified dev appendage type must be more than just spaces.",
          isLabelIncluded: true,
          outputType: Logger.OutputType.SHELL
        });
        process.exit(1);
      } else if (devVersionAppendageType.indexOf(" ") >= 0) {
        Logger.publish({
          loggingLevelTarget: Logger.Level.ERROR,
          message: "The specified dev appendage type cannot contain spaces.",
          isLabelIncluded: true,
          outputType: Logger.OutputType.SHELL
        });
        process.exit(1);
      } else if (VersioningAgent.DevVersionAppendageType.isEntry(devVersionAppendageType) === false) {
        Logger.publish({
          loggingLevelTarget: Logger.Level.ERROR,
          message: "The specified dev appendage type " + colors.yellow(devVersionAppendageType) + " isn't valid. " +
              "Available options are " + VersioningAgent.DevVersionAppendageType.toString().toLowerCase() + ".",
          isLabelIncluded: true,
          outputType: Logger.OutputType.SHELL
        });
        process.exit(1);
      } else {
        Logger.publish({
          loggingLevelTarget: Logger.Level.VERBOSE,
          message: "The specified development version appendage " + colors.yellow(devVersionAppendageType.toLowerCase()) +
              " is valid.",
          isLabelIncluded: true,
          outputType: Logger.OutputType.SHELL
        });
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the OptionsManager validateDevVersionAppendageType " +
          "function.");
    }
  }

  /**
   * Validates the specified change type.
   * @param {string} changeType The specified change type.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  validateChangeType(changeType) {
    if (typeof changeType === "string" && changeType) {
      if (changeType.trim().length === 0) {
        Logger.publish({
          loggingLevelTarget: Logger.Level.ERROR,
          message: "The specified change type must be more than just spaces.",
          isLabelIncluded: true,
          outputType: Logger.OutputType.SHELL
        });
        process.exit(1);
      } else if (changeType.indexOf(" ") >= 0) {
        Logger.publish({
          loggingLevelTarget: Logger.Level.ERROR,
          message: "The specified change type cannot contain spaces.",
          isLabelIncluded: true,
          outputType: Logger.OutputType.SHELL
        });
        process.exit(1);
      } else if (GitRunner.ChangeType.isEntry(changeType) === false) {
        Logger.publish({
          loggingLevelTarget: Logger.Level.ERROR,
          message: "The specified change type " + colors.yellow(changeType) + " isn't valid. Available options are " +
              GitRunner.ChangeType.toString().toLowerCase() + ".",
          isLabelIncluded: true,
          outputType: Logger.OutputType.SHELL
        });
        process.exit(1);
      } else {
        Logger.publish({
          loggingLevelTarget: Logger.Level.VERBOSE,
          message: "The specified change type " + colors.yellow(changeType.toLowerCase()) + " is valid.",
          isLabelIncluded: true,
          outputType: Logger.OutputType.SHELL
        });
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the OptionsManager validateChangeType function.");
    }
  }

  /**
   * Checks if the proposed version is valid based on the applicable options.
   * @param {object} options The options needed for proposed version validation.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  validateProposedVersion(options) {
    if (typeof options === "object" && options) {
      if (VersioningAgent.anyVersionRegex.test(options.newVersion)) {
        let versioningAgent = new VersioningAgent();
        let lastProdVersionMap = (options.isInitialCommit === false) ? this.gitRunner.getLastProdVersionMap() : new Map();
        let lastProdVersion = (lastProdVersionMap.size > 0) ? lastProdVersionMap.values().next().value : "";
        let currentBranchName = this.gitRunner.getCurrentBranchName();
        let calculatedVersion = "";

        if (options.isInitialCommit === false) {
          calculatedVersion = versioningAgent.determine(
              lastProdVersionMap,
              VersioningAgent.StrategyType.getSymbol(options.strategy),
              VersioningAgent.DevVersionAppendageType.getSymbol(options.devAppendage),
              options.prodBranch
          );
        } else if (currentBranchName === options.prodBranch) {
          calculatedVersion = VersioningAgent.startingProdVersion;
        } else {
          calculatedVersion = VersioningAgent.startingInitialDevVersion;
          calculatedVersion = versioningAgent.applyDevVersionAppendage(calculatedVersion, currentBranchName,
              VersioningAgent.DevVersionAppendageType.getSymbol(options.devAppendage));
        }

        if (VersioningAgent.StrategyType.isEntry(options.strategy)
            && VersioningAgent.DevVersionAppendageType.isEntry(options.devAppendage)
            && versioningAgent.isValid(lastProdVersion, options.newVersion, calculatedVersion, currentBranchName,
                options.prodBranch, Logger.OutputType.SHELL)) {
          Logger.publish({
            loggingLevelTarget: Logger.Level.VERBOSE,
            message: "The specified version " + colors.yellow(options.newVersion) + " passed all " +
                "applicable validation checks.",
            isLabelIncluded: true,
            outputType: Logger.OutputType.SHELL
          });
        } else {
          process.exit(1);
        }
      } else if (options.newVersion && options.newVersion.trim().length === 0) {
        Logger.publish({
          loggingLevelTarget: Logger.Level.ERROR,
          message: "The specified version must be more than just spaces.",
          isLabelIncluded: true,
          outputType: Logger.OutputType.SHELL
        });
        process.exit(1);
      } else if (options.newVersion && options.newVersion.indexOf(" ") >= 0) {
        Logger.publish({
          loggingLevelTarget: Logger.Level.ERROR,
          message: "The specified version cannot contain spaces.",
          isLabelIncluded: true,
          outputType: Logger.OutputType.SHELL
        });
        process.exit(1);
      } else {
        Logger.publish({
          loggingLevelTarget: Logger.Level.ERROR,
          message: "The specified version " + colors.yellow(options.newVersion) + " does not meet " +
              "semantic version formatting standards (see https://semver.org for more details). However, " +
              "it is possible that an initial development version (e.g. 0.1.0-latest) was specified " +
              "without a development version appendage (e.g. 0.1.0-APPENDAGE_TYPE), a standard " +
              "specifically enforced by this tool.",
          isLabelIncluded: true,
          outputType: Logger.OutputType.SHELL
        });
        process.exit(1);
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the OptionsManager validateProposedVersion function.");
    }
  }

  /**
   * Checks to ensure the specified commit messages are valid.
   * @param {string} shortCommitMsg The short commit message to check for validity.
   * @param {string} longCommitMsg The short commit message to check for validity.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  validateCommitMessages(shortCommitMsg, longCommitMsg = "") {
    if (typeof shortCommitMsg === "string" && typeof longCommitMsg === "string") {
      if (shortCommitMsg.length > GitRunner.maxShortCommitMsgCharLength
          && longCommitMsg.length > GitRunner.maxLongCommitMsgLength) {
        Logger.publish({
          loggingLevelTarget: Logger.Level.INFO,
          message: "Both the short and long commit messages are too long. They have been truncated to " +
              "fit within the character length requirements.",
          isLabelIncluded: false,
          outputType: Logger.OutputType.SHELL
        });
      } else if (shortCommitMsg.length > GitRunner.maxShortCommitMsgCharLength) {
        Logger.publish({
          loggingLevelTarget: Logger.Level.INFO,
          message: "The short commit message is too long. It has been truncated to fit within the character " +
              "length requirements.",
          isLabelIncluded: false,
          outputType: Logger.OutputType.SHELL
        });
      } else if (longCommitMsg.length > GitRunner.maxLongCommitMsgLength) {
        Logger.publish({
          loggingLevelTarget: Logger.Level.INFO,
          message: "The long commit message is too long. It has been truncated to fit within the character " +
              "length requirements.",
          isLabelIncluded: false,
          outputType: Logger.OutputType.SHELL
        });
      } else if (shortCommitMsg.trim().length === 0) {
        Logger.publish({
          loggingLevelTarget: Logger.Level.ERROR,
          message: "The specified short commit message must be more than just spaces.",
          isLabelIncluded: true,
          outputType: Logger.OutputType.SHELL
        });
        process.exit(1);
      } else if (longCommitMsg && longCommitMsg.trim().length === 0) {
        Logger.publish({
          loggingLevelTarget: Logger.Level.ERROR,
          message: "The specified long commit message must be more than just spaces.",
          isLabelIncluded: true,
          outputType: Logger.OutputType.SHELL
        });
        process.exit(1);
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the OptionsManager validateShortCommitMsg function.");
    }
  }

  /**
   * Validates that the state of the branch will work for an Initial Commit.
   * @param {string} currentBranchName The name of the current branch.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  validateInitialCommit(currentBranchName) {
    if (typeof currentBranchName === "string" && currentBranchName) {
      if (this.gitRunner.getTotalBranchCommitCount() === 0) {
        Logger.publish({
          loggingLevelTarget: Logger.Level.VERBOSE,
          message: "The option for an Initial Commit is valid since no commits exist on the current branch.",
          isLabelIncluded: true,
          outputType: Logger.OutputType.SHELL
        });
      } else {
        Logger.publish({
          loggingLevelTarget: Logger.Level.ERROR,
          message: "The current branch " + colors.yellow(currentBranchName) + " already has commits. In order to make " +
              "an Initial Commit, the current branch must be empty.",
          isLabelIncluded: true,
          outputType: Logger.OutputType.SHELL
        });
        process.exit(1);
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the OptionsManager validateInitialCommit function.");
    }
  }

  /**
   * Sets the desired program options.
   * @param {{}} options The desired program objects.
   * @returns {{}} The applied options.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  set(options) {
    let appliedOptions = {};

    if (typeof options === "object") {
      try {
        if (typeof options.loggingLevel === "string" && options.loggingLevel) {
          appliedOptions.loggingLevel = options.loggingLevel.toLowerCase();
        } else {
          appliedOptions.loggingLevel = Logger.Level.getName(Logger.defaultLoggingLevel).toLowerCase();
        }

        this.applyLoggingLevelTarget(appliedOptions.loggingLevel);

        try {
          new ToolsValidator().invoke(Logger.OutputType.SHELL);
        } catch (error) {
          Logger.publish({
            loggingLevelTarget: Logger.Level.ERROR,
            message: error.message,
            isLabelIncluded: true,
            outputType: Logger.OutputType.SHELL
          });
          process.exit(1);
        }

        if (typeof options.manual === "boolean") {
          appliedOptions.manual = options.manual;
        } else {
          appliedOptions.manual = false;
        }

        if (appliedOptions.manual && typeof options.changeType === "string" && options.changeType) {
          appliedOptions.changeType = options.changeType.toLowerCase();
          this.validateChangeType(appliedOptions.changeType);
        } else {
          appliedOptions.changeType = "";
        }

        if (appliedOptions.manual && typeof options.isBreaking === "boolean") {
          appliedOptions.isBreaking = options.isBreaking;
        } else {
          appliedOptions.isBreaking = false;
        }

        if (appliedOptions.manual && typeof options.isInitialCommit === "boolean" && options.isInitialCommit) {
          appliedOptions.isInitialCommit = true;
          this.validateInitialCommit(this.gitRunner.getCurrentBranchName());
        } else {
          appliedOptions.isInitialCommit = false;
        }

        if (appliedOptions.manual && typeof options.insertSkipCiTag === "boolean") {
          appliedOptions.insertSkipCiTag = options.insertSkipCiTag;
        } else {
          appliedOptions.insertSkipCiTag = false;
        }

        if (typeof options.prodBranch === "string" && options.prodBranch) {
          appliedOptions.prodBranch = options.prodBranch;
          this.validateProdBranchName(appliedOptions.prodBranch);
        } else {
          appliedOptions.prodBranch = GitRunner.defaultProductionBranchName;
        }

        if (typeof options.strategy === "string" && options.strategy) {
          appliedOptions.strategy = options.strategy.toLowerCase();
          this.validateStrategyType(appliedOptions.strategy);
        } else {
          appliedOptions.strategy =
              VersioningAgent.StrategyType.getName(VersioningAgent.StrategyType.SEQUENTIAL).toLowerCase();
        }

        if (typeof options.devAppendage === "string" && options.devAppendage) {
          appliedOptions.devAppendage = options.devAppendage.toLowerCase();
          this.validateDevVersionAppendageType(appliedOptions.devAppendage);
        } else {
          appliedOptions.devAppendage =
              VersioningAgent.DevVersionAppendageType.getName(VersioningAgent.DevVersionAppendageType.BRANCH_NAME)
                  .toLowerCase();
        }

        if (appliedOptions.manual
            && appliedOptions.changeType !== GitRunner.ChangeType.getName(GitRunner.ChangeType.VERSION_CHANGE).toLowerCase()
            && typeof options.shortMsg === "string" && options.shortMsg) {
          appliedOptions.longMsg = (typeof options.longMsg === "string" && options.longMsg) ? options.longMsg : "";
          this.validateCommitMessages(options.shortMsg, appliedOptions.longMsg);
          appliedOptions.shortMsg = options.shortMsg.substring(0, GitRunner.maxShortCommitMsgCharLength);
          appliedOptions.longMsg = appliedOptions.longMsg.substring(0, GitRunner.maxLongCommitMsgLength);
        } else {
          appliedOptions.shortMsg = "";
        }

        appliedOptions.changelogDirectory = (typeof options.changelogDirectory === "string" && options.changelogDirectory)
            ? options.changelogDirectory : new FileSystemHelper().getCurrentWorkingDirectory();

        appliedOptions.changelogFilename = (typeof options.changelogFilename === "string" && options.changelogFilename)
            ? options.changelogFilename : ChangelogCreator.defaultChangelogFileName;

        if (appliedOptions.manual
            && ((appliedOptions.changeType
                !== GitRunner.ChangeType.getName(GitRunner.ChangeType.VERSION_CHANGE).toLowerCase()
                && (options.newVersion || options.strategy || options.devAppendage || options.prodBranch
                    || options.isInitialCommit)) || (appliedOptions.changeType
                === GitRunner.ChangeType.getName(GitRunner.ChangeType.VERSION_CHANGE).toLowerCase()
                && (options.shortMsg || options.longMsg)))) {
          Logger.publish({
            loggingLevelTarget: Logger.Level.VERBOSE,
            message: "Options not applicable to the " + colors.yellow(appliedOptions.changeType) + " change type have " +
                "been ignored.",
            isLabelIncluded: true,
            outputType: Logger.OutputType.SHELL
          });
        } else if (appliedOptions.manual) {
          Logger.publish({
            loggingLevelTarget: Logger.Level.VERBOSE,
            message: "There wasn't any options not applicable to the " + colors.yellow(appliedOptions.changeType) +
                " change type to ignore.",
            isLabelIncluded: true,
            outputType: Logger.OutputType.SHELL
          });
        }

        if (appliedOptions.manual
            && appliedOptions.changeType === GitRunner.ChangeType.getName(GitRunner.ChangeType.VERSION_CHANGE).toLowerCase()
            && typeof options.newVersion === "string" && options.newVersion) {
          appliedOptions.newVersion = options.newVersion;

          // this is called as late as possible so the appliedOptions have a chance to be populated
          this.validateProposedVersion(appliedOptions);
        } else {
          appliedOptions.newVersion = "";
        }
      } catch (error) {
        Logger.publish({
          loggingLevelTarget: Logger.Level.ERROR,
          message: error.message,
          isLabelIncluded: true,
          outputType: Logger.OutputType.SHELL
        });
        process.exit(1);
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the OptionsManager set function.");
    }

    return appliedOptions;
  }
}

module.exports = OptionsManager;
