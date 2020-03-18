#!/usr/bin/env node
/* eslint-disable no-console */

// imports
const colors = require("ansi-colors");
const program = require("commander");
const ChangelogCreator = require("../components/ChangelogCreator");
const GitRunner = require("../components/GitRunner");
const Logger = require("../components/Logger");
const MenuCoordinator = require("../components/MenuCoordinator");
const packageJson = require("../package.json");
const VersioningAgent = require("../components/VersioningAgent");
const OptionsManager = require("../components/OptionsManager");
const IOException = require("../exceptions/IOException");
const InvalidCliCmdParamsException = require("../exceptions/InvalidCliCmdParamsException");

/**
 * The main command that is the entry-point into the program.
 * @throws IOException when the version could not be found in this program's package.json file.
 * @throws IOException when the description could not be found in this program's package.json file.
 */
(function mainCommand() {
  let programVersion = "";
  let programDescription = "";

  if (packageJson.version) {
    programVersion = packageJson.version;
  } else {
    throw new IOException("The version could not be found in this program's package.json file.");
  }

  if (packageJson.description) {
    programDescription = packageJson.description;
  } else {
    throw new IOException("The description could not be found in this program's package.json file.");
  }

  program
      .version(programVersion, "-v, --version")
      .description(programDescription)
      .on("command:*", () => {
        console.error("Invalid command: %s\nSee --help for a list of available sub-commands.", program.args.join(" "));
        process.exit(1);
      });

  program
      .command("calculate")
      .description("Calculates the version based on the information provided by Git.")
      .option("--dev-appendage <appendageType>", "the type of dev version appendage (default: " +
          VersioningAgent.DevVersionAppendageType.getName(VersioningAgent.DevVersionAppendageType.BRANCH_NAME)
              .toLowerCase() + ")")
      .option("--prod-branch <branchName>", "the name of the production branch (default: " +
          GitRunner.defaultProductionBranchName + ")")
      .option("--strategy <strategyType>", "the type of versioning strategy (default: " +
          VersioningAgent.StrategyType.getName(VersioningAgent.StrategyType.SEQUENTIAL).toLowerCase() + ")")
      .option("--logging-level <loggingLevelTarget>", "the logging level target (default: " +
          Logger.Level.getName(Logger.Level.INFO).toLowerCase() + ")")
      .action((options) => {
        try {
          if (typeof options === "object") {
            let appliedOptions = new OptionsManager().set({
              loggingLevel: colors.unstyle(options.loggingLevel),
              prodBranch: colors.unstyle(options.prodBranch),
              strategy: colors.unstyle(options.strategy),
              devAppendage: colors.unstyle(options.devAppendage)
            });

            Logger.publish({
              loggingLevelTarget: Logger.Level.INFO,
              message: new VersioningAgent().determine(
                  new GitRunner(Logger.OutputType.SHELL).getLastProdVersionMap(),
                  VersioningAgent.StrategyType.getSymbol(appliedOptions.strategy),
                  VersioningAgent.DevVersionAppendageType.getSymbol(appliedOptions.devAppendage),
                  appliedOptions.prodBranch
              ),
              isLabelIncluded: false,
              outputType: Logger.OutputType.SHELL
            });
          } else {
            throw new InvalidCliCmdParamsException("There was an error parsing the command options. Be sure to use " +
                "quotes around arguments with multiple words separated by spaces (e.g. ev commit --manual --change-type " +
                "bug_fix --short-msg \"Fixed a session timeout bug\").");
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
      });

  program
      .command("commit")
      .description("Creates a special commit later used when calculating the version.")
      .option("--manual", "option to skip interactive commit menu and specify options manually [disables " +
          "spell checker]")
      .option("--change-type <changeType>", "the type of change")
      .option("--short-msg <shortMsg>", "the required short message belonging to the commit [ignored for the " +
          GitRunner.ChangeType.getName(GitRunner.ChangeType.VERSION_CHANGE).toLowerCase() +
          " type] (" + GitRunner.maxShortCommitMsgCharLength + " chars max)")
      .option("--long-msg <longMsg>", "the optional long message belonging to the commit [ignored for the " +
          GitRunner.ChangeType.getName(GitRunner.ChangeType.VERSION_CHANGE).toLowerCase() + " type] ("
          + GitRunner.maxLongCommitMsgLength + " chars max)")
      .option("--is-breaking", "indicates if the commit is a breaking change (default: false)")
      .option("--is-initial-commit", "indicates if the change is for an initial commit [required for the " +
          GitRunner.ChangeType.getName(GitRunner.ChangeType.VERSION_CHANGE).toLowerCase() + " type] (default: false)")
      .option("--insert-skip-ci-tag", "inserts the [ci-skip] tag in the commit message (default: false)")
      .option("--new-version <newVersion>", "the new version [required for the " +
          GitRunner.ChangeType.getName(GitRunner.ChangeType.VERSION_CHANGE).toLowerCase() + " type]")
      .option("--prod-branch <branchName>", "the name of the production branch (default: " +
          GitRunner.defaultProductionBranchName + ")")
      .option("--dev-appendage <appendageType>", "the type of dev version appendage [required for the " +
          GitRunner.ChangeType.getName(GitRunner.ChangeType.VERSION_CHANGE).toLowerCase() + " type] (default: " +
          VersioningAgent.DevVersionAppendageType.getName(VersioningAgent.DevVersionAppendageType.BRANCH_NAME)
              .toLowerCase() + ")")
      .option("--strategy <strategyType>", "the type of versioning strategy [required for the " +
          GitRunner.ChangeType.getName(GitRunner.ChangeType.VERSION_CHANGE).toLowerCase() + " type] (default: " +
          VersioningAgent.StrategyType.getName(VersioningAgent.StrategyType.SEQUENTIAL).toLowerCase() + ")")
      .option("--logging-level <loggingLevelTarget>", "the logging level target (default: " +
          Logger.Level.getName(Logger.Level.INFO).toLowerCase() + ")")
      .action(async (options) => {
        try {
          if (typeof options === "object") {
            let appliedOptions = new OptionsManager().set({
              loggingLevel: colors.unstyle(options.loggingLevel),
              isBreaking: options.isBreaking,
              isInitialCommit: options.isInitialCommit,
              insertSkipCiTag: options.insertSkipCiTag,
              manual: options.manual,
              changeType: colors.unstyle(options.changeType),
              newVersion: colors.unstyle(options.newVersion),
              prodBranch: colors.unstyle(options.prodBranch),
              strategy: colors.unstyle(options.strategy),
              devAppendage: colors.unstyle(options.devAppendage),
              shortMsg: colors.unstyle(options.shortMsg),
              longMsg: colors.unstyle(options.longMsg)
            });

            let gitRunner = new GitRunner(Logger.OutputType.SHELL);

            if (appliedOptions.manual) {
              if (appliedOptions.changeType) {
                if (GitRunner.ChangeType.getSymbol(appliedOptions.changeType) === GitRunner.ChangeType.VERSION_CHANGE) {
                  if (appliedOptions.newVersion) {
                    gitRunner.createCommit(GitRunner.ChangeType.getSymbol(appliedOptions.changeType),
                        appliedOptions.newVersion, "", appliedOptions.isBreaking,
                        appliedOptions.isInitialCommit, appliedOptions.insertSkipCiTag);
                  } else {
                    throw new InvalidCliCmdParamsException("The version is required for the version change type.");
                  }
                } else if (appliedOptions.shortMsg) {
                  gitRunner.createCommit(GitRunner.ChangeType.getSymbol(appliedOptions.changeType),
                      appliedOptions.shortMsg, appliedOptions.longMsg, appliedOptions.isBreaking,
                      appliedOptions.isInitialCommit, appliedOptions.insertSkipCiTag);
                } else {
                  throw new InvalidCliCmdParamsException("The short commit message is required for the " +
                      colors.yellow(appliedOptions.changeType) + " change type.");
                }
              } else {
                throw new InvalidCliCmdParamsException("The change type is required in order to use the manual " +
                    "(non-interactive mode).");
              }
            } else {
              if (options.newVersion || options.changeType || options.devAppendage || options.insertSkipCiTag
                  || options.isBreaking || options.prodBranch || options.shortMsg || options.longMsg) {
                Logger.publish({
                  loggingLevelTarget: Logger.Level.VERBOSE,
                  message: "Ignoring specified options only applicable to manual (non-interactive) mode.",
                  isLabelIncluded: true,
                  outputType: Logger.OutputType.SHELL
                });
              } else {
                Logger.publish({
                  loggingLevelTarget: Logger.Level.VERBOSE,
                  message: "There weren't any specified options only applicable to the manual (non-interactive) mode " +
                      "to ignore.",
                  isLabelIncluded: true,
                  outputType: Logger.OutputType.SHELL
                });
              }

              new MenuCoordinator().createCommitPrompts().then(() => {
                process.exit(0);
              });
            }
          } else {
            throw new InvalidCliCmdParamsException("There was an error parsing the command options. Be sure to use " +
                "quotes around arguments with multiple words separated by spaces (e.g. ev commit --manual --change-type " +
                "bug_fix --short-msg \"Fixed a session timeout bug\").");
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
      });

  program
      .command("changelog")
      .description("Creates the changelog file from versionable commits.")
      .option("--directory <dir>", "the name of the changelog directory (default: current working " +
          "directory)")
      .option("--filename <fileName>", "the name of the changelog file (default: " +
          ChangelogCreator.defaultChangelogFileName + ")")
      .option("--prod-branch <branchName>", "the name of the production branch (default: " +
          GitRunner.defaultProductionBranchName + ")")
      .option("--logging-level <loggingLevelTarget>", "the logging level target (default: " +
          Logger.Level.getName(Logger.Level.INFO).toLowerCase() + ")")
      .action((options) => {
        try {
          if (typeof options === "object") {
            let appliedOptions = new OptionsManager().set({
              loggingLevel: colors.unstyle(options.loggingLevel),
              prodBranch: colors.unstyle(options.prodBranch),
              changelogDirectory: colors.unstyle(options.directory),
              changelogFilename: colors.unstyle(options.filename)
            });

            new ChangelogCreator().generate(appliedOptions.changelogDirectory, appliedOptions.changelogFilename,
                appliedOptions.prodBranch);
          } else {
            throw new InvalidCliCmdParamsException("There was an error parsing the command options. Be sure to use " +
                "quotes around arguments with multiple words separated by spaces (e.g. ev commit --manual --change-type " +
                "bug_fix --short-msg \"Fixed a session timeout bug\").");
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
      });

  program.parse(process.argv);

  if (!process.argv.slice(2).length) {
    program.outputHelp();
    process.exit(0);
  }
}());
