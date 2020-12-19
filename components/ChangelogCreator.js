// imports
const FileSystemHelper = require("./FileSystemHelper");
const Logger = require("./Logger");
const VersioningAgent = require("./VersioningAgent");
const GitRunner = require("./GitRunner");
const IllegalArgumentException = require("../exceptions/IllegalArgumentException");
const InvalidGitDataException = require("../exceptions/InvalidGitDataException");
const IOException = require("../exceptions/IOException");

// non-changing variables used by class
const DEFAULT_CHANGELOG_FILENAME = "CHANGELOG.md";
const CHANGELOG_HEADING = "# Changelog\n\n";

/**
 * Provides functionality to create a changelog.
 */
class ChangelogCreator {
  /**
   * Gets the default changelog file name.
   * @returns {string} The default changelog filename.
   */
  static get defaultChangelogFileName() {
    return DEFAULT_CHANGELOG_FILENAME;
  }

  /**
   * Gets the heading for the changelog file.
   * @returns {string} The heading for the changelog file.
   */
  static get changelogHeading() {
    return CHANGELOG_HEADING;
  }

  /**
   * Reads the changelog file into memory.
   * @param {string} changelogDirectory The changelog directory.
   * @param {string} changelogFileName The changelog file name.
   * @returns {string} The contents of the changelog.
   * @throws IllegalArgumentException when an invalid argument is passed.
   * @throws IOException when the combined current working directory and changelog file name contain too many characters.
   * @throws IOException when changelog file name contains invalid characters.
   */
  read(changelogDirectory, changelogFileName = ChangelogCreator.defaultChangelogFileName) {
    let changeLog = "";

    if (typeof changelogDirectory === "string" && changelogDirectory && typeof changelogFileName === "string"
        && changelogFileName) {
      let fileSystemHelper = new FileSystemHelper();

      if (fileSystemHelper.getIsValidFileName(changelogFileName)) {
        if (fileSystemHelper.getIsValidFilePathAndNameCharLength(changelogDirectory, changelogFileName)) {
          changeLog = (fileSystemHelper.getDoesFileExist(changelogDirectory, changelogFileName))
              ? fileSystemHelper.readAsString(changelogDirectory, changelogFileName) : "";
        } else {
          throw new IOException("The combined directory " + changelogDirectory + " and changelog filename " +
              changelogFileName + " contain too many characters.");
        }
      } else {
        throw new IOException("The specified changelog filename " + changelogFileName + " contains invalid characters.");
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the ChangelogCreator read function.");
    }

    return changeLog;
  }

  /**
   * Assembles the additional items that will be added to the changelog.
   * @param {Array} commitMessageHistory List of commit messages newest to oldest since last applicable version.
   * @param {string} currentBranchName The name of the current branch.
   * @param {string} productionBranchName The name of the production branch.
   * @returns {string} The assembled changelog additions.
   * @throws IllegalArgumentException when an invalid argument is passed.
   * @throws InvalidGitDataException when a version change commit does not contain a valid format.
   */
  assembleAdditions(commitMessageHistory, currentBranchName,
                    productionBranchName = GitRunner.defaultProductionBranchName) {
    let changeLogAdditions = [];

    if (Array.isArray(commitMessageHistory) && typeof currentBranchName === "string" && currentBranchName
        && typeof productionBranchName === "string" && productionBranchName) {
      let versioningAgent = new VersioningAgent();
      let versionsToSkip = [];
      let lastFoundProductionVersion = "";
      let commitMessagesSinceLastVersion = [];
      let initialCommitVersion = "";

      // generate list of commits that contain version change and versionable commits
      let filteredCommitMessageHistory = versioningAgent.filterCommitMessages(commitMessageHistory);

      // search for and record important information needed later when assembling the additions
      for (let i = 0; i < filteredCommitMessageHistory.length; i++) {
        if (filteredCommitMessageHistory[i].indexOf(GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.VERSION_CHANGE))
            >= 0) {
          let foundVersion = versioningAgent.extractVersion(filteredCommitMessageHistory[i]);
          initialCommitVersion = (filteredCommitMessageHistory[i].includes(GitRunner.initialCommitTag))
              ? foundVersion.valueOf() : "";
          lastFoundProductionVersion = (VersioningAgent.prodVersionRegex.test(foundVersion))
              ? foundVersion : lastFoundProductionVersion;

          if (commitMessagesSinceLastVersion.length === 0
              && ((currentBranchName === productionBranchName && foundVersion === lastFoundProductionVersion)
                  || currentBranchName !== productionBranchName)) {
            commitMessagesSinceLastVersion = Array.from(filteredCommitMessageHistory).splice(0, i);
          }

          if (foundVersion && ((currentBranchName === productionBranchName && foundVersion !== lastFoundProductionVersion)
              || (lastFoundProductionVersion && foundVersion !== lastFoundProductionVersion
                  && versioningAgent.isGreater(lastFoundProductionVersion, foundVersion)))) {
            versionsToSkip.push(foundVersion);
          }
        }
      }

      // assemble the additions
      for (let i = 0; i < filteredCommitMessageHistory.length; i++) {
        let commitMessageLines = filteredCommitMessageHistory[i].split("\n");

        if (filteredCommitMessageHistory[i].indexOf(GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.VERSION_CHANGE))
            >= 0) {
          let currentVersion = versioningAgent.extractVersion(filteredCommitMessageHistory[i]);

          if (currentVersion) {
            if (versionsToSkip.indexOf(currentVersion) === -1 && i < filteredCommitMessageHistory.length - 1
                && filteredCommitMessageHistory[i + 1].indexOf(
                    GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.VERSION_CHANGE)
                ) === -1) {
              if (changeLogAdditions.length > 0) {
                let versionMatches =
                    changeLogAdditions[changeLogAdditions.length - 1].match(VersioningAgent.anyVersionRegex);

                if (Array.isArray(versionMatches) === false) {
                  changeLogAdditions[changeLogAdditions.length - 1] += "\n";
                }
              }

              changeLogAdditions.push("## " + currentVersion + "\n\n");

              if (initialCommitVersion === currentVersion) {
                changeLogAdditions.push("* Initial Commit\n");
              }
            }
          } else {
            throw new InvalidGitDataException("It has been detected that a version change commit does not meet semantic " +
                "version formatting standards (see https://semver.org for more details). Perhaps it was added manually " +
                "or changed using Git rebase. Please fix this commit and try again.\n\nAffected Commit Message:\n\n" +
                filteredCommitMessageHistory[i]);
          }
        } else {
          commitMessagesSinceLastVersion = (commitMessagesSinceLastVersion.length === 0)
              ? filteredCommitMessageHistory : commitMessagesSinceLastVersion;

          if ((i === 0 || changeLogAdditions.length === 0) && (commitMessagesSinceLastVersion.length > 0
              && versioningAgent.containsVersionableCommits(commitMessagesSinceLastVersion))) {
            changeLogAdditions.push("## Non-Versioned Changes\n\n");
          }

          if (commitMessageLines.length > 0
              && versioningAgent.containsVersionableCommits([commitMessageLines[0]])) {
            changeLogAdditions.push("* " + commitMessageLines[0] + "\n");
          }
        }
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the ChangelogCreator assembleAdditions function.");
    }

    return changeLogAdditions.join("");
  }

  /**
   * Gets the last application version from the changelog based on the current branch name.
   * @param {string} changelog The changelog.
   * @param {string} currentBranchName The name of the current branch.
   * @param {string} productionBranchName The name of the production branch.
   * @returns {string} The last version applicable to the current branch.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  getLastVersion(changelog, currentBranchName, productionBranchName = GitRunner.defaultProductionBranchName) {
    let lastVersion = "";

    if (typeof changelog === "string" && typeof currentBranchName === "string" && currentBranchName) {
      let changelogPieces = changelog.split(" ");

      for (let i = 0; i < changelogPieces.length; i++) {
        let changelogComponent = changelogPieces[i].substring(0, changelogPieces[i].indexOf("\n"));

        if ((currentBranchName === productionBranchName && VersioningAgent.prodVersionRegex.test(changelogComponent))
            || (currentBranchName !== productionBranchName && VersioningAgent.anyVersionRegex.test(changelogComponent))) {
          lastVersion = changelogComponent;
          break;
        }
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the ChangelogCreator getLastVersion function.");
    }

    return lastVersion;
  }

  /**
   * Generates the changelog and saves it to the file system.
   * @param {string} changelogDirectory The changelog directory.
   * @param {string} changelogFilename The changelog file name.
   * @param {string} productionBranchName The name of the production branch.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  generate(changelogDirectory, changelogFilename = ChangelogCreator.defaultChangelogFileName,
           productionBranchName = GitRunner.defaultProductionBranchName) {
    if (typeof changelogDirectory === "string" && changelogDirectory && typeof changelogFilename === "string"
        && changelogFilename && typeof productionBranchName === "string" && productionBranchName) {
      let fileSystemHelper = new FileSystemHelper();
      let gitRunner = new GitRunner(Logger.OutputType.SHELL);
      let currentBranchName = gitRunner.getCurrentBranchName();
      let changelog = this.read(changelogDirectory, changelogFilename);
      let changelogAdditions = "";

      let lastVersion = this.getLastVersion(changelog, currentBranchName, productionBranchName);
      let lastVersionCommitSha = (lastVersion)
          ? gitRunner.getVersionCommitSha(lastVersion) : "";

      if (lastVersionCommitSha) {
        changelogAdditions = this.assembleAdditions(gitRunner.getCommitMsgHistory(lastVersionCommitSha, true),
            currentBranchName, productionBranchName);
      } else {
        changelogAdditions = this.assembleAdditions(gitRunner.getCommitMsgHistory("", true),
            currentBranchName, productionBranchName);
      }

      // if the changelog additions don't already exist at position 13 then the additions aren't redundant
      if (changelogAdditions && changelog.indexOf(changelogAdditions) !== 13) {
        let lastVersionIndex = (lastVersion) ? changelog.indexOf("## " + lastVersion) : -1;
        changelog = (lastVersionIndex >= 0) ? changelog.substring(lastVersionIndex) : "";
        let finalChangeLog = (changelog) ? ChangelogCreator.changelogHeading + changelogAdditions + "\n" + changelog
            : ChangelogCreator.changelogHeading + changelogAdditions;
        fileSystemHelper.writeAsString(changelogDirectory, changelogFilename, finalChangeLog);
        Logger.publish({
          loggingLevelTarget: Logger.Level.INFO,
          message: "Created/updated the changelog.",
          isLabelIncluded: false,
          outputType: Logger.OutputType.SHELL
        });
      } else {
        Logger.publish({
          loggingLevelTarget: Logger.Level.INFO,
          message: "There wasn't anything to add to the changelog.",
          isLabelIncluded: false,
          outputType: Logger.OutputType.SHELL
        });
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the ChangelogCreator generate function.");
    }
  }
}

module.exports = ChangelogCreator;
