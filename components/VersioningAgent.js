// imports
const colors = require("ansi-colors");
const Enum = require("../data-structures/Enum");
const Logger = require("./Logger");
const GitRunner = require("./GitRunner");
const IllegalArgumentException = require("../exceptions/IllegalArgumentException");
const VersionFormattingException = require("../exceptions/VersionFormattingException");
const InvalidGitDataException = require("../exceptions/InvalidGitDataException");

// non-changing variables used by class
const STRATEGY_TYPE = new Enum("SEQUENTIAL", "COLLECTIVE");
const SEM_VER_COMPONENT = new Enum("MAJOR", "MINOR", "PATCH");
const DEV_VERSION_APPENDAGE_TYPE = new Enum("BRANCH_NAME", "SNAPSHOT");
const STARTING_INITIAL_DEV_VERSION = "0.1.0";
const STARTING_PROD_VERSION = "1.0.0";
const INITIAL_DEV_VERSION_REGEX = new RegExp(/^[0][.][1-9]\d*[.][0][-]\w+$/);
const DEV_VERSION_REGEX = new RegExp(/^[1-9]\d*[.]([0]|[1-9]+|([1-9]\d+))[.]([0]|[1-9]+|([1-9]\d+))[-]\w+$/);
const PROD_VERSION_REGEX = new RegExp(/^([1-9]\d*[.]([0]|[1-9]+|([1-9]\d+))[.]([0]|[1-9]+|([1-9]\d+)))$/);
const ANY_VERSION_REGEX = new RegExp(/^([0][.][1-9]\d*[.][0][-]\w+)|/.source +
    /([1-9]\d*[.]([0]|[1-9]+|([1-9]\d+))[.]([0]|[1-9]+|([1-9]\d+))[-]\w+)|/.source +
    /([1-9]\d*[.]([0]|[1-9]+|([1-9]\d+))[.]([0]|[1-9]+|([1-9]\d+)))$/.source);

/**
 * Provides functionality for calculating the version.
 */
class VersioningAgent {
  /**
   * Gets the starting initial development version.
   * @returns {string} The starting initial development version.
   */
  static get startingInitialDevVersion() {
    return STARTING_INITIAL_DEV_VERSION;
  }

  /**
   * Gets the starting production version.
   * @returns {string} The starting production version.
   */
  static get startingProdVersion() {
    return STARTING_PROD_VERSION;
  }

  /**
   * Gets the Strategy Type enum.
   * @returns {Enum} The Strategy Type enum.
   */
  static get StrategyType() {
    return STRATEGY_TYPE;
  }

  /**
   * Gets the Semantic Version Component enum.
   * @returns {Enum} The Semantic Version Component enum.
   */
  static get SemVerComponent() {
    return SEM_VER_COMPONENT;
  }

  /**
   * Gets the Dev Version Appendage Type enum.
   * @returns {Enum} The Dev Version Appendage Type enum.
   */
  static get DevVersionAppendageType() {
    return DEV_VERSION_APPENDAGE_TYPE;
  }

  /**
   * Gets the initial dev version regex.
   * @returns {RegExp} The initial dev version regex.
   */
  static get initialDevVersionRegex() {
    return INITIAL_DEV_VERSION_REGEX;
  }

  /**
   * Gets the dev version regex.
   * @returns {RegExp} The dev version regex.
   */
  static get devVersionRegex() {
    return DEV_VERSION_REGEX;
  }

  /**
   * Gets the prod version regex.
   * @returns {RegExp} The prod version regex.
   */
  static get prodVersionRegex() {
    return PROD_VERSION_REGEX;
  }

  /**
   * Gets the any version regex.
   * @returns {RegExp} The any version regex.
   */
  static get anyVersionRegex() {
    return ANY_VERSION_REGEX;
  }

  /**
   * Extracts the version from a commit message if it exists and is in the correct format.
   * @param {string} commitMessage The commit message.
   * @returns {string} The extracted version.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  extractVersion(commitMessage) {
    let extractedVersion = "";

    if (typeof commitMessage === "string" && commitMessage) {
      extractedVersion = (commitMessage.indexOf(GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.VERSION_CHANGE)) >= 0)
          ? commitMessage.substring(
              commitMessage.indexOf(GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.VERSION_CHANGE)) +
          GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.VERSION_CHANGE).length + 1
          ) : "";
      extractedVersion = (VersioningAgent.anyVersionRegex.test(extractedVersion)) ? extractedVersion : "";
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the VersioningAgent extractVersion function.");
    }

    return extractedVersion;
  }

  /**
   * Extracts the components from the specified version.
   * @param {string} version The version to get the components from.
   * @returns {Array} List of version components (e.g. major, minor, patch, dev appendage.).
   * @throws IllegalArgumentException when an invalid argument is passed.
   * @throws VersionFormattingException when the specified version isn't in the correct format.
   */
  extractVersionComponents(version) {
    let versionComponents = [];

    if (typeof version === "string" && version) {
      if (VersioningAgent.anyVersionRegex.test(version)) {
        versionComponents = version.split(".");

        if (versionComponents[versionComponents.length - 1].indexOf("-") >= 0) {
          let additionalVersionComponents = versionComponents[versionComponents.length - 1].split("-");
          versionComponents[versionComponents.length - 1] = additionalVersionComponents[0];
          versionComponents.push("-" + additionalVersionComponents[1]);
        }
      } else {
        throw new VersionFormattingException("The specified version " + colors.yellow(version) + " does not meet " +
            "semantic version formatting standards (see https://semver.org for more details).");
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the VersioningAgent extractVersionComponents " +
        "function.");
    }

    return versionComponents;
  }

  /**
   * Determines if the version A is greater than version B.
   * @param {string} versionA The first version to check.
   * @param {string} versionB The second version to check.
   * @returns {boolean} True if the first version is greater than the second and false if not.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  isGreater(versionA, versionB) {
    let isGreater = false;

    if (typeof versionA === "string" && versionA && typeof versionB === "string" && versionB) {
      let firstVersionComponents = this.extractVersionComponents(versionA);
      let secondVersionComponents = this.extractVersionComponents(versionB);
      isGreater = ((parseInt(firstVersionComponents[0], 10) > parseInt(secondVersionComponents[0], 10))
          || (parseInt(firstVersionComponents[0], 10) === parseInt(secondVersionComponents[0], 10)
              && parseInt(firstVersionComponents[1], 10) > parseInt(secondVersionComponents[1], 10))
          || (parseInt(firstVersionComponents[0], 10) === parseInt(secondVersionComponents[0], 10)
              && parseInt(firstVersionComponents[1], 10) === parseInt(secondVersionComponents[1], 10)
              && parseInt(firstVersionComponents[2], 10) > parseInt(secondVersionComponents[2], 10))
          || (parseInt(firstVersionComponents[0], 10) === parseInt(secondVersionComponents[0], 10)
              && parseInt(firstVersionComponents[1], 10) === parseInt(secondVersionComponents[1], 10)
              && parseInt(firstVersionComponents[2], 10) === parseInt(secondVersionComponents[2], 10)
              && firstVersionComponents.length === 3
              && secondVersionComponents.length === 4));
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the VersioningAgent isGreater function.");
    }

    return isGreater;
  }

  /**
   * Validates that the proposed version is valid (must be newer than the last production version).
   * @param {string} lastProdVersion The last production version.
   * @param {string} proposedVersion The proposed (new) version.
   * @param {string} calculatedVersion The calculated version.
   * @param {string} currentBranchName The current branch name.
   * @param {string} productionBranchName The production branch name.
   * @param {Symbol} logOutputType The output type to use when logging messages.
   * @returns {boolean} True if the proposed version is valid and false if not.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  isValid(lastProdVersion, proposedVersion, calculatedVersion, currentBranchName,
          productionBranchName, logOutputType) {
    let isValid = true;

    if (typeof lastProdVersion === "string" && ((lastProdVersion && VersioningAgent.prodVersionRegex.test(lastProdVersion))
        || lastProdVersion === "") && typeof proposedVersion === "string"
        && VersioningAgent.anyVersionRegex.test(proposedVersion) && typeof calculatedVersion === "string"
        && VersioningAgent.anyVersionRegex.test(calculatedVersion) && typeof currentBranchName === "string"
        && Logger.OutputType.getName(logOutputType) && new GitRunner(logOutputType).checkReference(currentBranchName)
        && typeof productionBranchName === "string" && new GitRunner(logOutputType).checkReference(productionBranchName)
        && typeof logOutputType === "symbol") {
      if (lastProdVersion === proposedVersion) {
        isValid = false;
        Logger.publish({
          loggingLevelTarget: Logger.Level.ERROR,
          message: "The specified version " + colors.yellow(proposedVersion) + " is the same as the last recorded " +
              "production version.",
          isLabelIncluded: true,
          outputType: logOutputType
        });
      } else if (lastProdVersion
          && this.isGreater(proposedVersion, lastProdVersion) === false) {
        isValid = false;
        Logger.publish({
          loggingLevelTarget: Logger.Level.ERROR,
          message: "The specified version " + colors.yellow(proposedVersion) + " is lower than " +
              colors.yellow(lastProdVersion) + ", the last recorded production version.",
          isLabelIncluded: true,
          outputType: logOutputType
        });
      } else if (lastProdVersion && currentBranchName === productionBranchName
          && VersioningAgent.prodVersionRegex.test(proposedVersion) === false) {
        isValid = false;
        Logger.publish({
          loggingLevelTarget: Logger.Level.ERROR,
          message: "The specified version " + colors.yellow(proposedVersion) + " is not in a valid format for a " +
              "production branch.",
          isLabelIncluded: true,
          outputType: logOutputType
        });
      } else if (lastProdVersion && currentBranchName !== productionBranchName
          && VersioningAgent.prodVersionRegex.test(proposedVersion)) {
        isValid = false;
        Logger.publish({
          loggingLevelTarget: Logger.Level.ERROR,
          message: "The specified version " + colors.yellow(proposedVersion) + " is not in a valid format for a " +
              "development branch.",
          isLabelIncluded: true,
          outputType: logOutputType
        });
      } else if (lastProdVersion === "") {
        Logger.publish({
          loggingLevelTarget: Logger.Level.WARNING,
          message: "There is no production version change commit found in this branch to compare against " +
              colors.yellow(proposedVersion) + ", the specified version. Therefore, version validation has been " +
              "degraded.",
          isLabelIncluded: true,
          outputType: logOutputType
        });
      }

      if (isValid && proposedVersion === calculatedVersion) {
        Logger.publish({
          loggingLevelTarget: Logger.Level.VERBOSE,
          message: "The specified version " + colors.yellow(proposedVersion) + " is the same as the calculated version.",
          isLabelIncluded: true,
          outputType: logOutputType
        });
      } else if (isValid) {
        Logger.publish({
          loggingLevelTarget: Logger.Level.INFO,
          message: "The specified version " + colors.yellow(proposedVersion) + " doesn't match " +
              colors.yellow(calculatedVersion) + ", the calculated version. Please use caution as this could cause " +
              "undesired results.",
          isLabelIncluded: false,
          outputType: logOutputType
        });
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the VersioningAgent isValid function.");
    }

    return isValid;
  }

  /**
   * Determines if specified commit history contains commits that can be used to calculate the version.
   * @param {Array} commitMessageHistory List of commit messages.
   * @returns {boolean} True if it contains versionable commits and false if not.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  containsVersionableCommits(commitMessageHistory) {
    let isVersionable = false;

    if (Array.isArray(commitMessageHistory)) {
      for (let i = 0; i < commitMessageHistory.length; i++) {
        if (isVersionable) {
          break;
        } else {
          isVersionable =
              (commitMessageHistory[i].includes(GitRunner.breakingChangeTag)
                  || commitMessageHistory[i].includes(GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.FEATURE))
                  || commitMessageHistory[i].includes(GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.BUG_FIX))
                  || commitMessageHistory[i].includes(GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.DEPENDENCY))
                  || commitMessageHistory[i].includes(GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.PERF)));
        }
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the VersioningAgent containsVersionableCommits " +
        "function.");
    }

    return isVersionable;
  }

  /**
   * Calculates the initial development version of the application.
   * @param {string} initialDevVerChangeCommitShas The commit SHAs containing initial development version change commits.
   * @param {Array} commitMessageHistory The commit messages since last initial development version update.
   * @returns {string} The calculated initial development version.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  calculateInitialDev(initialDevVerChangeCommitShas, commitMessageHistory) {
    let minorVersion = 0;

    if (Array.isArray(initialDevVerChangeCommitShas) && Array.isArray(commitMessageHistory)) {
      minorVersion = (initialDevVerChangeCommitShas.length > 0) ? initialDevVerChangeCommitShas.length : 0;
      minorVersion += (this.containsVersionableCommits(commitMessageHistory)) ? 1 : 0;
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the VersioningAgent calculateInitialDev " +
          "function.");
    }

    return (minorVersion > 0) ? "0." + parseInt(minorVersion, 10) + ".0" : VersioningAgent.startingInitialDevVersion;
  }

  /**
   * Calculates the regular version of the application.
   * @param {Symbol} strategyType The type of versioning strategy to use.
   * @param {Array} commitMessageHistory The commit messages since last production version change commit.
   * @param {string} lastProdVersion The last calculated production version.
   * @returns {string} The calculated regular version.
   * @throws IllegalArgumentException when an invalid argument is passed.
   * @throws VersionFormattingException when an last version isn't in the correct format.
   */
  calculateRegular(strategyType, commitMessageHistory, lastProdVersion) {
    let calculatedVersion = "";

    if (typeof strategyType === "symbol"
        && VersioningAgent.StrategyType.getName(strategyType) && Array.isArray(commitMessageHistory)
        && typeof lastProdVersion === "string" && lastProdVersion) {
      calculatedVersion = lastProdVersion.valueOf();
      let versionComponents = [];

      if (VersioningAgent.prodVersionRegex.test(lastProdVersion)) {
        versionComponents = calculatedVersion.split(".");
      } else {
        throw new VersionFormattingException("The specified production version " + colors.yellow(lastProdVersion) +
            " does not meet semantic version formatting standards (see https://semver.org for more details). Please " +
            "note that this error will require manually modifying the last version commit message in order to properly " +
            "calculate the most recent version in the future.");
      }

      Logger.publish({
        loggingLevelTarget: Logger.Level.VERBOSE,
        message: "Using the " + colors.yellow(VersioningAgent.StrategyType.getName(strategyType).toLowerCase()) +
            " strategy type for version calculation.",
        isLabelIncluded: true,
        outputType: Logger.OutputType.SHELL
      });

      if (strategyType === VersioningAgent.StrategyType.SEQUENTIAL) {
        for (let i = 0; i < commitMessageHistory.length; i++) {
          if (commitMessageHistory[i].includes(GitRunner.breakingChangeTag)) {
            versionComponents[0] = String(parseInt(versionComponents[0], 10) + 1);
            versionComponents[1] = "0";
            versionComponents[2] = "0";
          } else if (commitMessageHistory[i].includes(GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.FEATURE))) {
            versionComponents[1] = String(parseInt(versionComponents[1], 10) + 1);
            versionComponents[2] = "0";
          } else if (commitMessageHistory[i].includes(GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.BUG_FIX))
              || commitMessageHistory[i].includes(GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.DEPENDENCY))
              || commitMessageHistory[i].includes(GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.PERF))) {
            versionComponents[2] = String(parseInt(versionComponents[2], 10) + 1);
          }
        }
      } else if (strategyType === VersioningAgent.StrategyType.COLLECTIVE) {
        let filteredCommitMsgHistory = [];

        for (let i = 0; i < commitMessageHistory.length; i++) {
          if (this.containsVersionableCommits([commitMessageHistory[i]])) {
            filteredCommitMsgHistory.push(commitMessageHistory[i]);
          }
        }

        let currentChangeTag = "";

        for (let i = 0; i < filteredCommitMsgHistory.length; i++) {
          if (filteredCommitMsgHistory[i].includes(GitRunner.breakingChangeTag)) {
            currentChangeTag = GitRunner.breakingChangeTag;
          } else if (filteredCommitMsgHistory[i].includes(GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.FEATURE))) {
            currentChangeTag = GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.FEATURE);
          } else if (filteredCommitMsgHistory[i].includes(GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.BUG_FIX))) {
            currentChangeTag = GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.BUG_FIX);
          } else if (filteredCommitMsgHistory[i].includes(GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.DEPENDENCY))) {
            currentChangeTag = GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.DEPENDENCY);
          } else if (filteredCommitMsgHistory[i].includes(GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.PERF))) {
            currentChangeTag = GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.PERF);
          }

          if (currentChangeTag === GitRunner.breakingChangeTag) {
            versionComponents[0] = String(parseInt(versionComponents[0], 10) + 1);
            versionComponents[1] = "0";
            versionComponents[2] = "0";
          } else if (currentChangeTag === GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.FEATURE)
              && ((i + 1 <= filteredCommitMsgHistory.length - 1
                  && filteredCommitMsgHistory[i + 1].includes(GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.FEATURE))
                  === false) || i === filteredCommitMsgHistory.length - 1)) {
            versionComponents[1] = String(parseInt(versionComponents[1], 10) + 1);
            versionComponents[2] = "0";
          } else if ((currentChangeTag === GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.BUG_FIX)
              || currentChangeTag === GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.DEPENDENCY)
              || currentChangeTag === GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.PERF))
              && ((i + 1 <= filteredCommitMsgHistory.length - 1
                  && (filteredCommitMsgHistory[i + 1].includes(GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.BUG_FIX))
                      === false && filteredCommitMsgHistory[i + 1].includes(
                          GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.DEPENDENCY)
                      ) === false && filteredCommitMsgHistory[i + 1].includes(
                          GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.PERF)
                      ) === false)) || i === filteredCommitMsgHistory.length - 1)) {
            versionComponents[2] = String(parseInt(versionComponents[2], 10) + 1);
          }
        }
      }

      calculatedVersion = versionComponents[0] + "." + versionComponents[1] + "." + versionComponents[2];
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the VersioningAgent calculateRegular function.");
    }

    return calculatedVersion;
  }

  /**
   * Applies the development version appendage to the specified version.
   * @param {string} version The version to apply the development version appendage.
   * @param {string} currentBranchName The name of the current branch.
   * @param {Symbol} devVersionAppendageType The type of dev version appendage to add after semantic version.
   * @returns {string} The updated version with the development version appendage applied.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  applyDevVersionAppendage(version, currentBranchName, devVersionAppendageType) {
    let updatedVersion = "";

    if (typeof version === "string" && version && typeof currentBranchName === "string" && currentBranchName
        && typeof devVersionAppendageType === "symbol"
        && VersioningAgent.DevVersionAppendageType.getName(devVersionAppendageType)) {
      updatedVersion = version.valueOf();

      if (devVersionAppendageType === VersioningAgent.DevVersionAppendageType.BRANCH_NAME) {
        updatedVersion += "-" + currentBranchName;
      } else if (devVersionAppendageType === VersioningAgent.DevVersionAppendageType.SNAPSHOT) {
        updatedVersion += "-" + VersioningAgent.DevVersionAppendageType.getName(devVersionAppendageType);
      }

      Logger.publish({
        loggingLevelTarget: Logger.Level.VERBOSE,
        message: "Applied the development version appendage " +
            colors.yellow(VersioningAgent.DevVersionAppendageType.getName(devVersionAppendageType).toLowerCase()) +
            ".",
        isLabelIncluded: true,
        outputType: Logger.OutputType.SHELL
      });
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the VersioningAgent applyDevVersionAppendage " +
          "function.");
    }

    return updatedVersion;
  }

  /**
   * Determines the version based on the current branch name and commit message history.
   * @param {Map} lastProdVersionMap The last production version map.
   * @param {Symbol} strategyType The type of versioning strategy to use.
   * @param {Symbol} devVersionAppendageType The type of dev version appendage to add after semantic version.
   * @param {string} productionBranchName The name of the production branch.
   * @throws IllegalArgumentException when an invalid argument is passed.
   * @throws VersionFormattingException when the version found in the Initial Commit isn't valid.
   * @throws InvalidGitDataException when missing the necessary commits needed to determine the version.
   */
  determine(lastProdVersionMap, strategyType, devVersionAppendageType,
            productionBranchName = GitRunner.defaultProductionBranchName) {
    let determinedVersion = "";

    if (lastProdVersionMap instanceof Map && typeof strategyType === "symbol"
        && typeof devVersionAppendageType === "symbol"
        && VersioningAgent.DevVersionAppendageType.getName(devVersionAppendageType)
        && typeof productionBranchName === "string" && productionBranchName) {
      let currentBranchName = "";
      let lastProdVersion = "";
      let gitRunner = new GitRunner(Logger.OutputType.SHELL);
      currentBranchName = gitRunner.getCurrentBranchName();
      let lastProdVersionCommitSha = (lastProdVersionMap.size > 0) ? lastProdVersionMap.keys().next().value : "";
      lastProdVersion = (lastProdVersionMap.size > 0) ? lastProdVersionMap.get(lastProdVersionCommitSha) : "";
      let commitMessageHistory = gitRunner.getCommitMsgHistory(lastProdVersionCommitSha);

      if (this.containsVersionableCommits(commitMessageHistory)) {
        if (lastProdVersion) {
          determinedVersion = this.calculateRegular(strategyType, commitMessageHistory, lastProdVersion);
        } else if (currentBranchName === productionBranchName) {
          determinedVersion = VersioningAgent.startingProdVersion;
        } else {
          let initialDevVersionChangeCommitShas = gitRunner.getInitialDevVerChangeCommitShas();
          commitMessageHistory = (initialDevVersionChangeCommitShas.length > 0)
              ? gitRunner.getCommitMsgHistory(initialDevVersionChangeCommitShas[0]) : [];
          determinedVersion = this.calculateInitialDev(initialDevVersionChangeCommitShas, commitMessageHistory);
        }
      } else if (lastProdVersion) {
        determinedVersion = lastProdVersion;
      } else {
        for (let i = commitMessageHistory.length - 1; i >= 0; i--) {
          if (commitMessageHistory[i].includes(GitRunner.initialCommitTag)) {
            determinedVersion = this.extractVersion(commitMessageHistory[i]);

            if (determinedVersion) {
              if (lastProdVersion === "" && currentBranchName === productionBranchName) {
                determinedVersion = VersioningAgent.startingProdVersion;
              } else {
                Logger.publish({
                  loggingLevelTarget: Logger.Level.VERBOSE,
                  message: "Using the version found in the last recorded Initial Commit since no other applicable " +
                      "commits exist to determine the version.",
                  isLabelIncluded: true,
                  outputType: Logger.OutputType.SHELL
                });
              }

              break;
            } else {
              throw new VersionFormattingException("It has been detected that the version found in the Initial Commit " +
                  "does not meet semantic version formatting standards (see https://semver.org for more details). " +
                  "Perhaps it was added manually or changed using Git rebase. Please fix this commit and try again.");
            }
          }
        }
      }

      if (determinedVersion && determinedVersion === lastProdVersion && currentBranchName !== productionBranchName) {
        Logger.publish({
          loggingLevelTarget: Logger.Level.VERBOSE,
          message: "The calculated version " + colors.yellow(determinedVersion) + " is the same as the last production " +
              "version. Therefore, skipped applying the development version appendage.",
          isLabelIncluded: true,
          outputType: Logger.OutputType.SHELL
        });
      } else if (determinedVersion && currentBranchName !== productionBranchName) {
        determinedVersion = (VersioningAgent.initialDevVersionRegex.test(determinedVersion)
            || VersioningAgent.devVersionRegex.test(determinedVersion))
            ? determinedVersion
            : this.applyDevVersionAppendage(determinedVersion, currentBranchName, devVersionAppendageType);
      } else if (determinedVersion && determinedVersion === lastProdVersion) {
        Logger.publish({
          loggingLevelTarget: Logger.Level.VERBOSE,
          message: "The calculated version " + colors.yellow(determinedVersion) + " is the same as the last production " +
              "version.",
          isLabelIncluded: true,
          outputType: Logger.OutputType.SHELL
        });
      } else if (determinedVersion && currentBranchName === productionBranchName) {
        Logger.publish({
          loggingLevelTarget: Logger.Level.VERBOSE,
          message: "Skipped applying development version appendage " +
              colors.yellow(VersioningAgent.DevVersionAppendageType.getName(devVersionAppendageType).toLowerCase()) +
              " since the detected branch is for production.",
          isLabelIncluded: true,
          outputType: Logger.OutputType.SHELL
        });
      } else {
        throw new InvalidGitDataException("Missing applicable commits used to determine the version.");
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the VersioningAgent determine function.");
    }

    return determinedVersion;
  }
}

module.exports = VersioningAgent;
