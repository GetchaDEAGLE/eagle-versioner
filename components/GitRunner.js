// imports
const colors = require("ansi-colors");
const shell = require("shelljs");
const Enum = require("../data-structures/Enum");
const Logger = require("./Logger");
const IllegalArgumentException = require("../exceptions/IllegalArgumentException");
const InvalidGitDataException = require("../exceptions/InvalidGitDataException");
const ShellCmdFailureException = require("../exceptions/ShellCmdFailureException");

// immutable variables used by class
const PROD_VERSION_CHANGE_REGEX =
    new RegExp(/\[VERSION_CHANGE][ ][1-9]\d*[.]([0]|[1-9]+|([1-9]\d+))[.]([0]|[1-9]+|([1-9]\d+))$/);
const INITIAL_DEV_VERSION_CHANGE_REGEX = new RegExp(/\[VERSION_CHANGE][ ][0][.][1-9]\d*[.][0][-]\w+$/);
const COMMIT_SHA_REGEX = new RegExp(/\b[0-9a-f]{40}\b/); // matches 40 character commit SHA only'
const DEFAULT_PRODUCTION_BRANCH_NAME = "master";
const COMMIT_MSG_END_TAG = "[msg-end]"; // tag inserted at end of commit messages so they can be easily split into a list
const CI_SKIP_TAG = "[ci-skip]"; // indicates commit shouldn't trigger CICD pipeline if contained in commit message
const MINIMUM_REQ_GIT_VER = "2.22.0";
const CHANGE_TYPE = new Enum("BUG_FIX", "CHANGELOG", "CHORE", "DEPENDENCY", "DOC", "FEATURE", "PERF", "REFACTOR",
    "STYLING", "TEST", "VERSION_CHANGE", "WIP");
const BREAKING_CHANGE_TAG = "[BREAKING]";
const INITIAL_COMMIT_TAG = "[INITIAL_COMMIT]";
const MAX_SHORT_COMMIT_MSG_CHAR_LENGTH = 60;
const MAX_LONG_COMMIT_MSG_CHAR_LENGTH = 512;
const MAX_BRANCH_NAME_CHAR_LENGTH = 255;

/**
 * Provides Git functionality for creating commits, retrieving data, etc.
 */
class GitRunner {
  /**
   * Constructor to create local class variables.
   * @param {Symbol} logOutputType The output type to use when logging messages.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  constructor(logOutputType) {
    if (typeof logOutputType === "symbol" && Logger.OutputType.getName(logOutputType)) {
      this.logOutputType = logOutputType;
      this.failedCommitData = {
        changeTypeTarget: "",
        shortCommitMessage: "",
        longCommitMessage: "",
        isBreaking: false,
        isInitialCommit: false,
        isCiSkipTagInserted: false
      };
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the GitRunner constructor.");
    }
  }

  /**
   * Gets the available change types as an Enum.
   * @returns {Enum} Change Types as an Enum.
   */
  static get ChangeType() {
    return CHANGE_TYPE;
  }

  /**
   * Get the maximum short commit message character length.
   * @returns {number} Max number of short commit message characters.
   */
  static get maxShortCommitMsgCharLength() {
    return MAX_SHORT_COMMIT_MSG_CHAR_LENGTH;
  }

  /**
   * Gets the production version change regex.
   * @returns {RegExp} The production version change regex.
   */
  static get prodVersionChangeRegex() {
    return PROD_VERSION_CHANGE_REGEX;
  }

  /**
   * Gets the initial development version change regex.
   * @returns {RegExp} The initial development version change regex.
   */
  static get initialDevVersionChangeRegex() {
    return INITIAL_DEV_VERSION_CHANGE_REGEX;
  }

  /**
   * Gets the commit SHA regex.
   * @returns {RegExp} The commit SHA regex.
   */
  static get commitShaRegex() {
    return COMMIT_SHA_REGEX;
  }

  /**
   * Gets the default production branch name.
   * @returns {string} The default production branch name.
   */
  static get defaultProductionBranchName() {
    return DEFAULT_PRODUCTION_BRANCH_NAME;
  }

  /**
   * Get the maximum long commit message character length.
   * @returns {number} Max number of long commit message characters.
   */
  static get maxLongCommitMsgLength() {
    return MAX_LONG_COMMIT_MSG_CHAR_LENGTH;
  }

  /**
   * Gets the maximum branch name character length.
   * @returns {number} The maximum branch name character length.
   */
  static get maxBranchNameCharLength() {
    return MAX_BRANCH_NAME_CHAR_LENGTH;
  }

  /**
   * Gets the breaking change tag.
   * @returns {string} The breaking change tag.
   */
  static get breakingChangeTag() {
    return BREAKING_CHANGE_TAG;
  }

  /**
   * Gets the initial commit tag.
   * @returns {string} The initial commit tag.
   */
  static get initialCommitTag() {
    return INITIAL_COMMIT_TAG;
  }

  /**
   * Gets the commit message end tag.
   * @returns {string} The commit message end tag.
   */
  static get commitMsgEndTag() {
    return COMMIT_MSG_END_TAG;
  }

  /**
   * Gets the CI skip tag.
   * @returns {string} The CI skip tag.
   */
  static get ciSkipTag() {
    return CI_SKIP_TAG;
  }

  /**
   * Gets the minimum required Git version.
   * @returns {string} The minimum required Git version.
   */
  static get minimumRequiredGitVersion() {
    return MINIMUM_REQ_GIT_VER;
  }

  /**
   * Gets the change type as a tag.
   * @param {Symbol} changeType The change type as an Enum entry.
   * @returns {string} The change type tag.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  static getChangeTypeAsTag(changeType) {
    let retrievedTag = "";

    if (typeof changeType === "symbol" && this.ChangeType.getName(changeType)) {
      retrievedTag = "[" + this.ChangeType.getName(changeType) + "]";
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the GitRunner getChangeTypeAsTag function.");
    }

    return retrievedTag;
  }

  /**
   * Checks if a Git repository exists.
   * @returns {boolean} True if a Git repository exists and false if not.
   */
  isRepository() {
    let output = shell.exec("git rev-parse --is-inside-work-tree", { silent: true });
    return (output.code === 0);
  }

  /**
   * Checks if the specified reference (e.g. branch name) is a valid format.
   * @param {string} reference The reference to check.
   * @returns {boolean} True if a valid reference and false if not.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  checkReference(reference) {
    let isValidReference = false;

    if (typeof reference === "string" && reference) {
      let output = shell.exec("git check-ref-format --branch " + reference + "", { silent: true });
      isValidReference = (output.code === 0);
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the GitRunner checkReference function.");
    }

    return isValidReference;
  }

  /**
   * Gets the current branch name.
   * @returns {string} The name of the current branch.
   * @throws ShellCmdFailureException when the Git command to retrieve the current branch name fails.
   * @throws InvalidGitDataException when the Git command to retrieve the current branch name returns an empty result.
   */
  getCurrentBranchName() {
    let currentBranchName = "";
    let output = shell.exec("git branch --show-current", { silent: true });
    let cleansedOutput = output.stdout.trim();

    if (output && typeof output.code === "number" && output.code === 0 && typeof cleansedOutput === "string"
        && cleansedOutput) {
      currentBranchName = cleansedOutput;
      Logger.publish({
        loggingLevelTarget: Logger.Level.VERBOSE,
        message: "The current branch is " + colors.yellow(currentBranchName) + ".",
        isLabelIncluded: true,
        outputType: this.logOutputType
      });
    } else if (output.stderr.trim()) {
      throw new ShellCmdFailureException("The command to retrieve the current branch name failed with the following " +
          "message:\n\n" + colors.bgRed(output.stderr.trim()) + "\n\nIf you wish to fix this problem, please move to " +
          "the applicable branch.");
    } else {
      throw new InvalidGitDataException("The command to retrieve the current branch name returned an empty result. " +
          "Be sure a valid branch is checked out and not a commit SHA or tag.");
    }

    return currentBranchName;
  }

  /**
   * Gets the total commit count for the current branch.
   * @returns {number} The total commit count for the current branch.
   */
  getTotalBranchCommitCount() {
    let output = shell.exec("git rev-list --count HEAD", { silent: true });
    return (output.code === 0) ? parseInt(output.trim(), 10) : 0;
  }

  /**
   * Gets the commit message using the specified commit SHA.
   * @param {string} commitSha The commit SHA used to get the commit message from.
   * @returns {String} The commit message.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  getCommitMessage(commitSha) {
    let commitMessage = "";

    if (commitSha) {
      let output = shell.exec("git log --format=%B -n 1 " + commitSha, { silent: true });
      commitMessage = (output.stdout) ? output.stdout.trim() : "";
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the GitRunner getCommitMessage function.");
    }

    return commitMessage;
  }

  /**
   * Gets the commit messages for the current branch from oldest to newest.
   * @param {string} commitSha The commit SHA used as a starting point to get commit messages after.
   * @param {boolean} reverse The option to return the commit messages from newest to oldest.
   * @returns {Array} List of commit messages.
   * @throws IllegalArgumentException when an invalid argument is passed.
   * @throws ShellCmdFailureException when the Git command to get the commit messages fails.
   * @throws InvalidGitDataException when the current branch doesn't contain any commits.
   */
  getCommitMessages(commitSha = "", reverse = false) {
    let trimmedCommitMsgHistory = [];

    if (typeof commitSha === "string" && typeof reverse === "boolean") {
      if (this.getTotalBranchCommitCount() > 0) {
        let output = "";

        if (commitSha) {
          // get commit history after the specified Git SHA
          output = shell.exec("git log --oneline --date-order --reverse --format=%B" + GitRunner.commitMsgEndTag + " " +
              commitSha + "..HEAD", { silent: true });
        }
        // otherwise, get the entire commit history
        else {
          output = shell.exec("git log --oneline --date-order --reverse --format=%B" + GitRunner.commitMsgEndTag,
              { silent: true });
        }

        if (output && typeof output.code === "number" && output.code === 0) {
          let commitMsgHistory = output.trim().split(GitRunner.commitMsgEndTag).filter((i) => { return i; });

          for (let i = 0; i < commitMsgHistory.length; i++) {
            trimmedCommitMsgHistory.push(commitMsgHistory[i].trim());
          }

          if (commitSha) {
            Logger.publish({
              loggingLevelTarget: Logger.Level.VERBOSE,
              message: "Retrieved commit history with " + colors.yellow(commitMsgHistory.length) + " records after last " +
                  "specified commit SHA " + colors.yellow(commitSha) + ".",
              isLabelIncluded: true,
              outputType: this.logOutputType
            });
          } else {
            Logger.publish({
              loggingLevelTarget: Logger.Level.VERBOSE,
              message: "Retrieved commit history with " + colors.yellow(commitMsgHistory.length) + " records.",
              isLabelIncluded: true,
              outputType: this.logOutputType
            });
          }
        } else {
          throw new ShellCmdFailureException("The command to retrieve the commit history failed with the following " +
              "message:\n\n" + colors.bgRed(output.stderr.trim()));
        }

        if (reverse) {
          trimmedCommitMsgHistory.reverse();
        }
      } else {
        throw new InvalidGitDataException("The current branch " + colors.yellow(this.getCurrentBranchName()) +
            " doesn't contain any commits.");
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the GitRunner getCommitMessages function.");
    }

    return trimmedCommitMsgHistory;
  }

  /**
   * Gets the commit SHA for the specified version.
   * @param {string} version The version to get the commit SHA for.
   * @returns {string} The commit SHA.
   * @throws IllegalArgumentException when an invalid argument is passed.
   * @throws InvalidGitDataException when invalid commit SHA is returned.
   */
  getVersionCommitSha(version) {
    let versionCommitSha = "";

    if (typeof version === "string" && version) {
      // get the full SHA of the last commit matching the change version tag plus version
      let output = shell.exec("git log -n 1 --oneline --date-order --format=%H --grep=\"\\" +
          GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.VERSION_CHANGE) + " " + version + "\"", { silent: true });

      versionCommitSha = (output.stdout) ? output.stdout.trim() : "";

      if (versionCommitSha) {
        if (GitRunner.commitShaRegex.test(versionCommitSha)) {
          Logger.publish({
            loggingLevelTarget: Logger.Level.VERBOSE,
            message: "The specified version " + colors.yellow(version) + " commit SHA is " +
                colors.yellow(versionCommitSha) + ".",
            isLabelIncluded: true,
            outputType: this.logOutputType
          });
        } else {
          throw new InvalidGitDataException("The specified version " + colors.yellow(version) + " has a commit SHA " +
              "that doesn't match the 40 character SHA-1 format.");
        }
      } else {
        Logger.publish({
          loggingLevelTarget: Logger.Level.VERBOSE,
          message: "The specified version " + colors.yellow(version) + " commit SHA was not found.",
          isLabelIncluded: true,
          outputType: this.logOutputType
        });
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the GitRunner getVersionCommitSha function.");
    }

    return versionCommitSha;
  }

  /**
   * Gets all initial development version change commit SHAs.
   * @returns {Array} List of all initial development version commit SHAs.
   */
  getInitialDevVerChangeCommitShas() {
    let initialDevVersionChangeRegexString = GitRunner.initialDevVersionChangeRegex.toString();

    // get the full SHA of all commits matching the change version tag with an initial development version
    let output = shell.exec("git log --oneline --date-order --format=%H --grep=\"" +
        initialDevVersionChangeRegexString.substring(1, initialDevVersionChangeRegexString.length - 1) + "\" -E",
        { silent: true });

    return (output.stdout) ? output.stdout.trim().split("\n") : [];
  }

  /**
   * Gets the last production version commit SHA with the associated version as a map.
   * @returns {Map<string, string>} The SHA as the key and version as the value.
   * @throws InvalidGitDataException when invalid commit SHA is returned.
   * @throws InvalidGitDataException when invalid commit message is returned.
   */
  getLastProdVersionMap() {
    let lastProdVersionMap = new Map();
    let prodVersionChangeRegexString = GitRunner.prodVersionChangeRegex.toString();

    // get the full SHA of the last commit matching the change version tag with a production version
    let output = shell.exec("git log -n 1 --oneline --date-order --format=%H --grep=\"" +
        prodVersionChangeRegexString.substring(1, prodVersionChangeRegexString.length - 1) + "\" -E", { silent: true });

    let lastProdVersionCommitSha = (output.stdout) ? output.stdout.trim() : "";
    let lastProdVersionCommitMessage = "";

    if (lastProdVersionCommitSha) {
      if (GitRunner.commitShaRegex.test(lastProdVersionCommitSha)) {
        output = shell.exec("git log --format=%B -n 1 " + lastProdVersionCommitSha, { silent: true });
        lastProdVersionCommitMessage = (output.stdout) ? output.stdout.trim() : "";
        Logger.publish({
          loggingLevelTarget: Logger.Level.VERBOSE,
          message: "The last recorded production version commit SHA is " + colors.yellow(lastProdVersionCommitSha) + ".",
          isLabelIncluded: true,
          outputType: this.logOutputType
        });
      } else {
        throw new InvalidGitDataException("The last recorded production version commit SHA doesn't match the 40 " +
            "character SHA-1 format.");
      }
    } else {
      Logger.publish({
        loggingLevelTarget: Logger.Level.VERBOSE,
        message: "The last recorded production version commit SHA was not found.",
        isLabelIncluded: true,
        outputType: this.logOutputType
      });
    }

    if (lastProdVersionCommitMessage) {
      if (GitRunner.prodVersionChangeRegex.test(lastProdVersionCommitMessage)) {
        let discoveredProdVersion = lastProdVersionCommitMessage.substring(
            lastProdVersionCommitMessage.indexOf(GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.VERSION_CHANGE)) +
            GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.VERSION_CHANGE).length + 1
        );
        lastProdVersionMap.set(lastProdVersionCommitSha, discoveredProdVersion);
        Logger.publish({
          loggingLevelTarget: Logger.Level.VERBOSE,
          message: "The last recorded production version found is " +
              colors.yellow(lastProdVersionMap.get(lastProdVersionCommitSha)) + ".",
          isLabelIncluded: true,
          outputType: this.logOutputType
        });
      } else {
        throw new InvalidGitDataException("The last recorded production version commit message did not match the " +
            "correct format. Please amend the commit message and try again.");
      }
    } else {
      Logger.publish({
        loggingLevelTarget: Logger.Level.VERBOSE,
        message: "The last recorded production version commit message was not found.",
        isLabelIncluded: true,
        outputType: this.logOutputType
      });
    }

    if (this.getCurrentBranchName() !== GitRunner.defaultProductionBranchName
        && (lastProdVersionCommitSha === "" || lastProdVersionCommitMessage === "")) {
      Logger.publish({
        loggingLevelTarget: Logger.Level.VERBOSE,
        message: "Since no previous production version data could be detected, the calculated version will be " +
            "formatted as an initial development version (e.g. 0.1.0-latest).",
        isLabelIncluded: true,
        outputType: this.logOutputType
      });
    } else if (lastProdVersionCommitSha) {
      Logger.publish({
        loggingLevelTarget: Logger.Level.VERBOSE,
        message: "Using the last production version commit with SHA " + colors.yellow(lastProdVersionCommitSha) +
            " and version " + colors.yellow(lastProdVersionMap.get(lastProdVersionCommitSha)) + " for internal " +
            "calculations.",
        isLabelIncluded: true,
        outputType: this.logOutputType
      });
    } else {
      Logger.publish({
        loggingLevelTarget: Logger.Level.WARNING,
        message: "Internal calculations aren't using the last production version commit SHA since it doesn't exist. " +
            "Therefore, depending on the size of the repository, this tool's performance may be reduced.",
        isLabelIncluded: true,
        outputType: this.logOutputType
      });
    }

    return lastProdVersionMap;
  }

  /**
   * Retries a previously failed commit.
   * @returns {number} The exit code of the Git command.
   * @throws InvalidGitDataException when no record of a previously failed commit exists.
   */
  retryFailedCommit() {
    let exitCode = 1;

    if (this.failedCommitData && typeof this.failedCommitData.changeTypeTarget === "symbol"
        && GitRunner.ChangeType.getName(this.failedCommitData.changeTypeTarget)
        && typeof this.failedCommitData.shortCommitMessage === "string" && this.failedCommitData.shortCommitMessage
        && typeof this.failedCommitData.longCommitMessage === "string"
        && typeof this.failedCommitData.isBreaking === "boolean"
        && typeof this.failedCommitData.isInitialCommit === "boolean"
        && typeof this.failedCommitData.isCiSkipTagInserted === "boolean") {
      try {
        exitCode = this.createCommit(
            this.failedCommitData.changeTypeTarget,
            this.failedCommitData.shortCommitMessage,
            this.failedCommitData.longCommitMessage,
            this.failedCommitData.isBreaking,
            this.failedCommitData.isInitialCommit,
            this.failedCommitData.isCiSkipTagInserted
        );
      } catch (error) {
        Logger.publish({
          loggingLevelTarget: Logger.Level.ERROR,
          message: error.message,
          isLabelIncluded: true,
          outputType: Logger.OutputType.INQUIRER
        });
      }
    } else {
      throw new InvalidGitDataException("There is no record of a previously failed commit.");
    }

    return exitCode;
  }

  /**
   * Creates a commit with the designed tags based on the change type and whether a breaking change has occurred.
   * @param {Symbol} changeType The type of change being introduced.
   * @param {string} shortCommitMsg The short commit message summarizing the change.
   * @param {string} longCommitMsg The long commit message describing the change in greater detail.
   * @param {boolean} isBreaking True if is a breaking change and false if not.
   * @param {boolean} isInitialCommit True if initial commit and false if not.
   * @param {boolean} isCiSkipTagInserted True if is CI skip tag is to be inserted and false if not.
   * @returns {number} The exit code of the Git command.
   * @throws IllegalArgumentException when an invalid argument is passed.
   * @throws ShellCmdFailureException when the Git command to create the commit fails.
   */
  createCommit(changeType, shortCommitMsg, longCommitMsg, isBreaking, isInitialCommit,
               isCiSkipTagInserted) {
    let exitCode = 1;

    if (typeof changeType === "symbol" && GitRunner.ChangeType.getName(changeType)
        && typeof shortCommitMsg === "string" && shortCommitMsg.length > 0
        && shortCommitMsg.length <= GitRunner.maxShortCommitMsgCharLength && typeof longCommitMsg === "string"
        && longCommitMsg.length <= GitRunner.maxLongCommitMsgLength && typeof isBreaking === "boolean"
        && typeof isInitialCommit === "boolean" && typeof isCiSkipTagInserted === "boolean") {
      let shortCommitMsgWithTags = "";
      shortCommitMsgWithTags += (isInitialCommit) ? GitRunner.initialCommitTag + " " : "";
      shortCommitMsgWithTags += (isBreaking) ? GitRunner.breakingChangeTag + " " : "";
      shortCommitMsgWithTags += (isCiSkipTagInserted) ? GitRunner.ciSkipTag + " " : "";
      shortCommitMsgWithTags += GitRunner.getChangeTypeAsTag(changeType) + " " + shortCommitMsg;
      let output = "";

      if (longCommitMsg.length > 0) {
        output = shell.exec("git commit -m \"" + shortCommitMsgWithTags + "\" -m \"" + longCommitMsg + "\"",
            { silent: true });
      } else {
        output = shell.exec("git commit -m \"" + shortCommitMsgWithTags + "\"",
            { silent: true });
      }

      exitCode = output.code;

      if (output && typeof output.code === "number" && output.code === 0) {
        Logger.publish({
          loggingLevelTarget: Logger.Level.INFO,
          message: "Successfully created commit.",
          isLabelIncluded: false,
          outputType: this.logOutputType
        });
      } else {
        this.failedCommitData.changeTypeTarget = changeType;
        this.failedCommitData.shortCommitMessage = shortCommitMsg;
        this.failedCommitData.longCommitMessage = longCommitMsg;
        this.failedCommitData.isBreaking = isBreaking;
        this.failedCommitData.isInitialCommit = isInitialCommit;
        this.failedCommitData.isCiSkipTagInserted = isCiSkipTagInserted;
        let errorMessage = (output.stdout) ? output.stdout : output.stderr;
        throw new ShellCmdFailureException("The command to create the commit failed with the following message:\n\n" +
            colors.bgRed(errorMessage.trim()) + "\n\nIf using interactive mode, please open another terminal session " +
            "to fix any Git errors before retrying.");
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the GitRunner createCommit function.");
    }

    return exitCode;
  }

  /**
   * Gets the count of contiguous WIP commits.
   * @param {string} lastProdVersionCommitSha
   * @returns {number} The number of contiguous WIP commits.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  getContiguousWipCommitCount(lastProdVersionCommitSha = "") {
    let contiguousWipCommitCount = 0;

    if (typeof lastProdVersionCommitSha === "string") {
      let commitMessageHistory = this.getCommitMessages(lastProdVersionCommitSha, true);

      for (let i = 0; i < commitMessageHistory.length; i++) {
        if (commitMessageHistory[i].includes(GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.WIP))) {
          contiguousWipCommitCount++;
        } else {
          break;
        }
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the GitRunner getContiguousWipCommitCount function.");
    }

    return contiguousWipCommitCount;
  }

  /**
   * Removes the specified number of commits and stages all files belonging to them.
   * @param {number} commitCount The number of commits to remove.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  removeCommitsAndStage(commitCount) {
    if (typeof commitCount === "number" && commitCount > 0) {
      let output = shell.exec("git reset --soft HEAD~" + commitCount.toString(), { silent: true });

      if (output && typeof output.code === "number" && output.code === 0) {
        Logger.publish({
          loggingLevelTarget: Logger.Level.INFO,
          message: "Successfully removed " + commitCount.toString() + " commits and staged the files.",
          isLabelIncluded: false,
          outputType: this.logOutputType
        });
      } else {
        let errorMessage = (output.stdout) ? output.stdout : output.stderr;
        throw new ShellCmdFailureException("The command to remove the commits and stage the files failed with the " +
            "following message:\n\n" + colors.bgRed(errorMessage.trim()));
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the GitRunner removeCommitsAndStage function.");
    }
  }
}

module.exports = GitRunner;
