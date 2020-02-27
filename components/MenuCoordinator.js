/* eslint no-restricted-syntax: [0, "ForOfStatement"] */
/* eslint-disable no-await-in-loop */

// imports
const path = require("path");
const colors = require("ansi-colors");
const inquirer = require("inquirer");
const FileSystemHelper = require("../components/FileSystemHelper");
const GitRunner = require("../components/GitRunner");
const Logger = require("../components/Logger");
const SpellingAssistant = require("../components/SpellingAssistant");
const VersioningAgent = require("../components/VersioningAgent");
const OptionsManager = require("../components/OptionsManager");
const IllegalArgumentException = require("../exceptions/IllegalArgumentException");

// non-changing variables used by class
const NOT_LISTED_SPELLING_CHOICE = colors.yellow("not listed (manually enter)");
const SKIP_SPELLING_CORRECTION_CHOICE = colors.yellowBright("skip (use original spelling)");
const COMMIT_TYPE_QUESTION = {
  type: "list",
  name: "commitType",
  message: "Select the type of commit you wish to make (ensure files are added first via git add)",
  choices: [
    colors.yellow(GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.BUG_FIX) + ":") +
    "             Squashes a bug",
    colors.yellow(GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.CHANGELOG) + ":") +
    "           Updates the changelog",
    colors.yellow(GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.CHORE) + ":") +
    "               Changes the build process, updates the config on complementary tool, etc.",
    colors.yellow(GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.DEPENDENCY) + ":") +
    "          Updates necessary dependencies",
    colors.yellow(GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.DOC) + ":") +
    "                 Changes the documentation",
    colors.yellow(GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.FEATURE) + ":") +
    "             Adds a new feature",
    colors.yellow(GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.PERF) + ":") +
    "                Improves performance",
    colors.yellow(GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.REFACTOR) + ":") +
    "            Cleans up the code but doesn't fix a bug or add a feature",
    colors.yellow(GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.STYLING) + ":") +
    "             Changes the white space, new lines, formatting, etc. that doesn't affect code significance",
    colors.yellow(GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.TEST) + ":") +
    "                Tests something (e.g. unit tests, integration tests, etc.)",
    colors.yellow(GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.VERSION_CHANGE) + ":") +
    "      Changes the version of the application"
  ]
};
const IS_BREAKING_CHANGE_QUESTION = {
  type: "confirm",
  name: "isBreakingChange",
  message: "Is this a breaking change?",
  default: false
};
const IS_INITIAL_COMMIT_QUESTION = {
  type: "confirm",
  name: "isInitialCommit",
  message: "Is this for an initial commit?",
  default: false
};
const INSERT_CI_SKIP_TAG_QUESTION = {
  type: "confirm",
  name: "isCiSkipTagInserted",
  message: "Would you like to insert the " + GitRunner.ciSkipTag + " tag?",
  default: false
};
const SHORT_COMMIT_MSG_QUESTION = {
  type: "input",
  name: "shortCommitMsg",
  message: "Short Commit Message (" + GitRunner.maxShortCommitMsgCharLength + " chars max):",
  validate: function validate(input) {
    let isValid = true;
    let errorMessage = "";

    if (input.length > GitRunner.maxShortCommitMsgCharLength) {
      isValid = false;
      errorMessage = Logger.wordWrap("The short commit message contains too many characters. Please try again.",
          Logger.maxCharsPerLine);
    } else if (input.length === 0) {
      isValid = false;
      errorMessage = Logger.wordWrap("The short commit message cannot be empty. Please try again.",
          Logger.maxCharsPerLine);
    } else if (input && input.trim().length === 0) {
      isValid = false;
      errorMessage = Logger.wordWrap("The specified short commit message must be more than just spaces. " +
        "Please try again.", Logger.maxCharsPerLine);
    }

    return (isValid) ? true : errorMessage;
  }
};
const ARE_MORE_DETAILS_REQUIRED_QUESTION = {
  type: "confirm",
  name: "areMoreDetailsRequired",
  message: "Would you like to add more details to the commit message?",
  default: false
};
const LONG_COMMIT_MSG_QUESTION = {
  type: "input",
  name: "longCommitMsg",
  message: "Long Commit Message (" + GitRunner.maxLongCommitMsgLength + " chars max):",
  validate: function validate(input) {
    let isValid = true;
    let errorMessage = "";

    if (input.length > GitRunner.maxLongCommitMsgLength) {
      isValid = false;
      errorMessage = Logger.wordWrap("The long commit message contains too many characters. Please try again.",
          Logger.maxCharsPerLine);
    } else if (input.length === 0) {
      isValid = false;
      errorMessage = Logger.wordWrap("The long commit message cannot be empty. Please try again.",
          Logger.maxCharsPerLine);
    } else if (input && input.trim().length === 0) {
      isValid = false;
      errorMessage = Logger.wordWrap("The specified long commit message must be more than just spaces. " +
          "Please try again.", Logger.maxCharsPerLine);
    }

    return (isValid) ? true : errorMessage;
  }
};
const SHORT_COMMIT_MISSPELLING_QUESTION = {
  type: "confirm",
  name: "fixShortCommitMisspellings",
  message: "Misspellings were detected in the short commit message. Would you like to fix them?",
  default: true
};
const LONG_COMMIT_MISSPELLING_QUESTION = {
  type: "confirm",
  name: "fixLongCommitMisspellings",
  message: "Misspellings were detected in the long commit message. Would you like to fix them?",
  default: true
};
const CUSTOM_SPELLING_QUESTION = {
  type: "input",
  name: "customSpelling",
  message: "Please enter the word you'd like to use (" + SpellingAssistant.maxSpellingCorrectionCharLength + " chars max):",
  validate: function validate(input) {
    let errorMessage = "";

    if (input.length === 0) {
      errorMessage = Logger.wordWrap("The name of the word cannot be empty. Please try again.",
          Logger.maxCharsPerLine);
    } else if (Array.from(input).length > SpellingAssistant.maxSpellingCorrectionCharLength) {
      errorMessage = Logger.wordWrap("The name of the word is too long. Please try again.",
          Logger.maxCharsPerLine);
    } else if (input.indexOf(" ") >= 0) {
      errorMessage = "The specified word cannot contain spaces. Please try again.";
    }

    return (errorMessage === "") ? true : errorMessage;
  }
};
const RETRY_COMMIT_QUESTION = {
  type: "confirm",
  name: "retryCommit",
  message: "Would you like to retry the commit?",
  default: false
};
const PRODUCTION_BRANCH_NAME_QUESTION = {
  type: "input",
  name: "productionBranchName",
  message: "Production Branch Name (" + GitRunner.maxBranchNameCharLength + " chars max):",
  default: GitRunner.defaultProductionBranchName,
  validate: function validate(input) {
    let errorMessage = "";

    if (input.length === 0) {
      errorMessage = Logger.wordWrap("The production branch name cannot be empty. Please try again.",
          Logger.maxCharsPerLine);
    } else if (Array.from(input).length > GitRunner.maxBranchNameCharLength) {
      errorMessage = Logger.wordWrap("The specified production branch name is too long. Please try again.",
          Logger.maxCharsPerLine);
    } else if (input.trim().length === 0) {
      errorMessage = "The specified production branch name must be more than just spaces. Please try again.";
    } else if (input.indexOf(" ") >= 0) {
      errorMessage = "The specified production branch name cannot contain spaces. Please try again.";
    } else if (new GitRunner(Logger.OutputType.INQUIRER).checkReference(input) === false) {
      errorMessage = Logger.wordWrap("The specified production branch name " +
          colors.yellow(input) + " isn't valid. Please see https://git-scm.com/docs/git-check-ref-format " +
          "for more details and try again.", Logger.maxCharsPerLine);
    }

    return (errorMessage === "") ? true : errorMessage;
  }
};
const VERSION_CHANGE_STRATEGY_TYPE_QUESTION = {
  type: "list",
  name: "versioningStrategyType",
  message: "Select the type of versioning strategy used for calculating the version:",
  choices: [
    VersioningAgent.StrategyType.getName(VersioningAgent.StrategyType.SEQUENTIAL).toLowerCase(),
    VersioningAgent.StrategyType.getName(VersioningAgent.StrategyType.COLLECTIVE).toLowerCase()
  ]
};
const DEV_VERSION_APPENDAGE_TYPE_QUESTION = {
  type: "list",
  name: "devVersionAppendageType",
  message: "Select the type of appendage (e.g. 0.1.0-APPENDAGE_TYPE) used for calculating the development version:",
  choices: [
    VersioningAgent.DevVersionAppendageType.getName(VersioningAgent.DevVersionAppendageType.BRANCH_NAME).toLowerCase(),
    VersioningAgent.DevVersionAppendageType.getName(VersioningAgent.DevVersionAppendageType.SNAPSHOT).toLowerCase()
  ]
};
const VERSION_CHANGE_QUESTION = {
  type: "input",
  name: "appliedVersion",
  message: "Version: ",
  validate: function validate(input) {
    let errorMessage = "";


    if (input.length === 0) {
      errorMessage = Logger.wordWrap("The version cannot be empty. Please try again.", Logger.maxCharsPerLine);
    } else if (input.indexOf(" ") >= 0) {
      errorMessage = Logger.wordWrap("The specified version cannot contain spaces.", Logger.maxCharsPerLine);
    } else if (VersioningAgent.anyVersionRegex.test(input) === false) {
      errorMessage = Logger.wordWrap("The specified version " + colors.yellow(input) + " does not meet semantic " +
          "version formatting standards (see https://semver.org for more details). However, it is possible that an " +
          "initial development version (e.g. 0.1.0-latest) was specified without a development version appendage " +
          "(e.g. 0.1.0-APPENDAGE_TYPE), a standard specifically enforced by this tool. Please try again.",
          Logger.maxCharsPerLine);
    }

    return (errorMessage === "") ? true : errorMessage;
  }
};

/**
 * Provides functionality for creating interactive menus for users to provide input.
 */
class MenuCoordinator {
  /**
   * Constructor to create local class variables.
   */
  constructor() {
    try {
      this.spellingAssistant = new SpellingAssistant(path.join(FileSystemHelper.userHomeDirectory,
          OptionsManager.settingsFolderName), OptionsManager.extraDictWordsFilename);
      this.prompt = inquirer.createPromptModule();
    } catch (error) {
      Logger.publish({
        loggingLevelTarget: Logger.Level.ERROR,
        message: error.message,
        isLabelIncluded: true,
        outputType: Logger.OutputType.INQUIRER
      });
      process.exit(1);
    }
  }

  /**
   * Gets the not listed spelling choice.
   * @returns {string} The not listed spelling choice.
   */
  static get notListedSpellingChoice() {
    return NOT_LISTED_SPELLING_CHOICE;
  }

  /**
   * Gets the skip spelling correction choice.
   * @returns {string} The skip spelling correction choice.
   */
  static get skipSpellingCorrectionChoice() {
    return SKIP_SPELLING_CORRECTION_CHOICE;
  }

  /**
   * Gets the commit type question.
   * @returns {{name: string, type: string, message: string, choices: Array|Function}} The commit type question.
   */
  static get commitTypeQuestion() {
    return COMMIT_TYPE_QUESTION;
  }

  /**
   * Gets the is breaking change question.
   * @returns {{default: boolean, name: string, type: string, message: string}} The is breaking change question.
   */
  static get isBreakingChangeQuestion() {
    return IS_BREAKING_CHANGE_QUESTION;
  }

  /**
   * Gets the is initial commit question.
   * @returns {{default: boolean, name: string, type: string, message: string}} The is initial commit question.
   */
  static get isInitialCommitQuestion() {
    return IS_INITIAL_COMMIT_QUESTION;
  }

  /**
   * Gets the insert CI skip tag question.
   * @returns {{default: boolean, name: string, type: string, message: string}} The insert CI skip tag question.
   */
  static get insertCiSkipTagQuestion() {
    return INSERT_CI_SKIP_TAG_QUESTION;
  }

  /**
   * Gets the short commit message question.
   * @returns {{name: string, type: string, message: string, validate: (function(*): *)}} The short commit message
   *                                                                                      question.
   */
  static get shortCommitMsgQuestion() {
    return SHORT_COMMIT_MSG_QUESTION;
  }

  /**
   * Gets the are more details required question.
   * @returns {{default: boolean, name: string, type: string, message: string}} The are more details required question.
   */
  static get areMoreDetailsRequiredQuestion() {
    return ARE_MORE_DETAILS_REQUIRED_QUESTION;
  }

  /**
   * Gets the long commit message question.
   * @returns {{name: string, type: string, message: string, validate: (function(*): *)}} The long commit message
   *                                                                                      question.
   */
  static get longCommitMsgQuestion() {
    return LONG_COMMIT_MSG_QUESTION;
  }

  /**
   * Gets the short commit misspelling question.
   * @returns {{default: boolean, name: string, type: string, message: string}} The short commit misspelling question.
   */
  static get shortCommitMisspellingQuestion() {
    return SHORT_COMMIT_MISSPELLING_QUESTION;
  }

  /**
   * Gets the long commit misspelling question.
   * @returns {{default: boolean, name: string, type: string, message: string}} The long commit misspelling question.
   */
  static get longCommitMisspellingQuestion() {
    return LONG_COMMIT_MISSPELLING_QUESTION;
  }

  /**
   * Gets the custom spelling question.
   * @returns {{name: string, type: string, message: string, validate: (function(*=): *)}} The custom spelling question.
   */
  static get customSpellingQuestion() {
    return CUSTOM_SPELLING_QUESTION;
  }

  /**
   * Gets the retry commit question.
   * @returns {{default: boolean, name: string, type: string, message: string}} The retry commit question.
   */
  static get retryCommitQuestion() {
    return RETRY_COMMIT_QUESTION;
  }

  /**
   * Gets the production branch name question.
   * @returns {{default: string, name: string, type: string, message: string, validate: (function(*=): *)}} The production
   *                                                                                                        branch name
   *                                                                                                        question.
   */
  static get productionBranchNameQuestion() {
    return PRODUCTION_BRANCH_NAME_QUESTION;
  }

  /**
   * Gets the version change strategy type question.
   * @returns {{name: string, type: string, message: string, choices: Array|Function}} The version change strategy type
   *                                                                                   question.
   */
  static get versionChangeStrategyTypeQuestion() {
    return VERSION_CHANGE_STRATEGY_TYPE_QUESTION;
  }

  /**
   * Gets the dev version appendage type question.
   * @returns {{name: string, type: string, message: string, choices: Array|Function}} The dev version appendage type
   *                                                                                                             question.
   */
  static get devVersionAppendageTypeQuestion() {
    return DEV_VERSION_APPENDAGE_TYPE_QUESTION;
  }

  /**
   * Gets the version change question.
   * @returns {{name: string, type: string, message: string, validate: (function(*=): *)}} The version change question.
   */
  static get versionChangeQuestion() {
    return VERSION_CHANGE_QUESTION;
  }

  /**
   * Creates questions for specified misspelled words.
   * @param {Map<number, string>} misspelledWords The misspelled words map.
   * @returns {Array} Array of question objects.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  createMisspelledWordQuestions(misspelledWords) {
    let misspelledWordQuestions = [];

    if (misspelledWords instanceof Map && misspelledWords.size > 0) {
      Array.from(misspelledWords.keys()).forEach((item) => {
        misspelledWordQuestions.push({
          type: "list",
          name: item.toString(),
          message: "Please choose a spelling recommendation for the word " +
            colors.red(misspelledWords.get(item)) + ":",
          choices: this.spellingAssistant.suggestCorrect(misspelledWords.get(item)).concat(
            [MenuCoordinator.notListedSpellingChoice, MenuCoordinator.skipSpellingCorrectionChoice]
          )
        });
      });
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the MenuCoordinator createMisspelledWordQuestions " +
        "function.");
    }

    return misspelledWordQuestions;
  }

  /**
   * Creates the prompts for misspelled words.
   * @param {Array} originalWords The original words array.
   * @param {Map<number, string>} misspelledWords The misspelled words map.
   * @returns {Map<number, string>} Map of corrected words.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  async createMisspellingPrompts(originalWords, misspelledWords) {
    let misspellingCorrections = new Map();

    if (Array.isArray(originalWords) && misspelledWords instanceof Map && misspelledWords.size > 0) {
      // show the user the typed in sentence with misspellings highlighted in red
      Logger.publish({
        loggingLevelTarget: Logger.Level.INFO,
        message: this.spellingAssistant.highlightMisspellings(originalWords, misspelledWords),
        isLabelIncluded: false,
        outputType: Logger.OutputType.INQUIRER
      });

      let misspelledWordQuestions = this.createMisspelledWordQuestions(misspelledWords);

      try {
        for (let i = 0; i < misspelledWordQuestions.length; i++) {
          let result = await this.prompt(misspelledWordQuestions[i]);

          for (let [key, value] of Object.entries(result)) {
            if (`${value}` === MenuCoordinator.notListedSpellingChoice) {
              let additionalResult = await this.prompt([MenuCoordinator.customSpellingQuestion]);
              misspellingCorrections.set(parseInt(key, 10), additionalResult.customSpelling);
              this.spellingAssistant.addWordToDictionary(path.join(FileSystemHelper.userHomeDirectory,
                  OptionsManager.settingsFolderName), OptionsManager.extraDictWordsFilename,
                  additionalResult.customSpelling);
            } else if (`${value}` === MenuCoordinator.skipSpellingCorrectionChoice) {
              misspellingCorrections.set(parseInt(key, 10), originalWords[key]);
              this.spellingAssistant.addWordToDictionary(path.join(FileSystemHelper.userHomeDirectory,
                  OptionsManager.settingsFolderName), OptionsManager.extraDictWordsFilename,
                  originalWords[key]);
            } else {
              misspellingCorrections.set(parseInt(key, 10), value);
            }
          }
        }
      } catch (error) {
        Logger.publish({
          loggingLevelTarget: Logger.Level.ERROR,
          message: error.message,
          isLabelIncluded: true,
          outputType: Logger.OutputType.INQUIRER
        });
      }

      // show the user the typed in sentence with corrections highlighted in blue
      Logger.publish({
        loggingLevelTarget: Logger.Level.INFO,
        message: this.spellingAssistant.highlightCorrections(originalWords, misspellingCorrections),
        isLabelIncluded: false,
        outputType: Logger.OutputType.INQUIRER
      });
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the MenuCoordinator createMisspellingPrompts " +
          "function.");
    }

    return misspellingCorrections;
  }

  /**
   * Creates the commit prompts to perform the commit.
   */
  async createCommitPrompts() {
    let gitRunner = new GitRunner(Logger.OutputType.INQUIRER);

    try {
      let commitTypeResult = await this.prompt([MenuCoordinator.commitTypeQuestion]);
      let shortCommitMessage = "";
      let longCommitMessage = "";
      let versionChangeResult;
      let isInitialCommit = false;

      if (commitTypeResult.commitType
          && commitTypeResult.commitType.includes(GitRunner.ChangeType.getName(GitRunner.ChangeType.VERSION_CHANGE))) {
        let versioningAgent = new VersioningAgent();
        let productionBranchNameResult = await this.prompt([MenuCoordinator.productionBranchNameQuestion]);
        let isInitialCommitResult = await this.prompt([MenuCoordinator.isInitialCommitQuestion]);
        isInitialCommit = (typeof isInitialCommitResult.isInitialCommit === "boolean")
            ? isInitialCommitResult.isInitialCommit : false;
        let versioningStrategyTypeResult = (isInitialCommit === false)
            ? await this.prompt([MenuCoordinator.versionChangeStrategyTypeQuestion]) : undefined;
        let currentBranchName = gitRunner.getCurrentBranchName();
        let devVersionAppendageTypeResult =
            (currentBranchName !== productionBranchNameResult.productionBranchName)
                ? await this.prompt([MenuCoordinator.devVersionAppendageTypeQuestion]) : "";
        let devVersionAppendageType = (devVersionAppendageTypeResult.devVersionAppendageType)
            ? VersioningAgent.DevVersionAppendageType.getSymbol(devVersionAppendageTypeResult.devVersionAppendageType)
            : VersioningAgent.DevVersionAppendageType.BRANCH_NAME;
        let lastProdVersionMap = (isInitialCommit === false) ? gitRunner.getLastProdVersionMap() : new Map();
        let calculatedVersion = "";

        if (isInitialCommit && gitRunner.getTotalBranchCommitCount() === 0) {
          Logger.publish({
            loggingLevelTarget: Logger.Level.VERBOSE,
            message: "The option for an Initial Commit is valid since no commits exist on the current branch.",
            isLabelIncluded: true,
            outputType: Logger.OutputType.SHELL
          });

          if (currentBranchName === productionBranchNameResult.productionBranchName) {
            calculatedVersion = VersioningAgent.startingProdVersion;
          } else {
            calculatedVersion = VersioningAgent.startingInitialDevVersion;
            calculatedVersion = versioningAgent.applyDevVersionAppendage(calculatedVersion, currentBranchName,
                devVersionAppendageType);
          }
        } else if (isInitialCommit === false) {
          calculatedVersion = versioningAgent.determine(
              lastProdVersionMap,
              VersioningAgent.StrategyType.getSymbol(versioningStrategyTypeResult.versioningStrategyType),
              devVersionAppendageType,
              productionBranchNameResult.productionBranchName
          );
        } else {
          Logger.publish({
            loggingLevelTarget: Logger.Level.ERROR,
            message: "The current branch " + colors.yellow(currentBranchName) + " already has commits. In order to make " +
                "an Initial Commit, the current branch must be empty.",
            isLabelIncluded: true,
            outputType: Logger.OutputType.INQUIRER
          });
          process.exit(1);
        }

        MenuCoordinator.versionChangeQuestion.default = calculatedVersion;
        versionChangeResult = await this.prompt([MenuCoordinator.versionChangeQuestion]);
        let lastProdVersion = (lastProdVersionMap.size > 0) ? lastProdVersionMap.values().next().value : "";
        let isProposedVersionValid = versioningAgent.isValid(lastProdVersion, versionChangeResult.appliedVersion,
            calculatedVersion, currentBranchName, productionBranchNameResult.productionBranchName,
            Logger.OutputType.INQUIRER);

        if (isProposedVersionValid) {
            Logger.publish({
              loggingLevelTarget: Logger.Level.VERBOSE,
              message: "The specified version " + colors.yellow(versionChangeResult.appliedVersion) + " passed all " +
                  "applicable validation checks.",
              isLabelIncluded: true,
              outputType: Logger.OutputType.INQUIRER
            });
        } else {
          process.exit(1);
        }
      } else {
        MenuCoordinator.shortCommitMsgQuestion.default =
            (commitTypeResult.commitType.includes(GitRunner.ChangeType.getName(GitRunner.ChangeType.CHANGELOG)))
                ? "Updated the Changelog" : undefined;
        let shortCommitMsgQuestionResult = await this.prompt([MenuCoordinator.shortCommitMsgQuestion]);
        let shortCommitMsgWords = (shortCommitMsgQuestionResult)
            ? shortCommitMsgQuestionResult.shortCommitMsg.split(/(\b[^\s]+\b)/) : [];
        shortCommitMessage = (shortCommitMsgQuestionResult) ? shortCommitMsgWords.join("") : "";
        let shortCommitMsgMisspellings = (shortCommitMsgQuestionResult)
            ? this.spellingAssistant.getMisspelledWords(shortCommitMsgWords) : new Map();
        let shortCommitSpellingCorrections = new Map();

        if (shortCommitMsgMisspellings.size > 0) {
          let shouldFixMisspellingsResult = await this.prompt([MenuCoordinator.shortCommitMisspellingQuestion]);

          if (shouldFixMisspellingsResult.fixShortCommitMisspellings) {
            shortCommitSpellingCorrections = await this.createMisspellingPrompts(shortCommitMsgWords,
                shortCommitMsgMisspellings);
          } else {
            Logger.publish({
              loggingLevelTarget: Logger.Level.INFO,
              message: "Skipped fixing short commit message spelling errors.",
              isLabelIncluded: false,
              outputType: Logger.OutputType.INQUIRER
            });
          }
        } else if (shortCommitMsgQuestionResult) {
          Logger.publish({
            loggingLevelTarget: Logger.Level.VERBOSE,
            message: "No short commit message spelling errors detected.",
            isLabelIncluded: false,
            outputType: Logger.OutputType.INQUIRER
          });
        }

        let areMoreDetailsRequiredResult = (shortCommitMsgQuestionResult)
            ? await this.prompt([MenuCoordinator.areMoreDetailsRequiredQuestion]) : "";
        let longCommitMsgWords = [];
        let longCommitMsgResult = "";

        if (areMoreDetailsRequiredResult.areMoreDetailsRequired) {
          longCommitMsgResult = await this.prompt([MenuCoordinator.longCommitMsgQuestion]);
          longCommitMsgWords = (longCommitMsgResult.longCommitMsg)
              ? longCommitMsgResult.longCommitMsg.split(/(\b[^\s]+\b)/) : [];
          longCommitMessage = (longCommitMsgWords) ? longCommitMsgWords.join("") : "";
        } else if (shortCommitMsgQuestionResult) {
          Logger.publish({
            loggingLevelTarget: Logger.Level.INFO,
            message: "Skipped entering additional commit message.",
            isLabelIncluded: false,
            outputType: Logger.OutputType.INQUIRER
          });
        }

        let longCommitMsgMisspellings = (longCommitMsgResult)
            ? this.spellingAssistant.getMisspelledWords(longCommitMsgWords) : new Map();
        let longCommitSpellingCorrections = new Map();

        if (longCommitMsgMisspellings.size > 0) {
          let shouldFixMisspellingsResult = await this.prompt([MenuCoordinator.longCommitMisspellingQuestion]);

          if (shouldFixMisspellingsResult.fixLongCommitMisspellings) {
            longCommitSpellingCorrections = await this.createMisspellingPrompts(longCommitMsgWords,
                longCommitMsgMisspellings);
          } else {
            Logger.publish({
              loggingLevelTarget: Logger.Level.INFO,
              message: "Skipped fixing long commit message spelling errors.",
              isLabelIncluded: false,
              outputType: Logger.OutputType.INQUIRER
            });
          }
        } else if (longCommitMsgResult) {
          Logger.publish({
            loggingLevelTarget: Logger.Level.VERBOSE,
            message: "No long commit message spelling errors detected.",
            isLabelIncluded: false,
            outputType: Logger.OutputType.INQUIRER
          });
        }

        // update short commit message words with spelling corrections
        for (let i = 0; i < shortCommitSpellingCorrections.size; i++) {
          let key = shortCommitSpellingCorrections.keys().next().value;
          shortCommitMsgWords[key] = shortCommitSpellingCorrections.get(key);
        }

        // update long commit message words with spelling corrections
        for (let i = 0; i < longCommitSpellingCorrections.size; i++) {
          let key = longCommitSpellingCorrections.keys().next().value;
          longCommitMsgWords[key] = longCommitSpellingCorrections.get(key);
        }

        shortCommitMessage = (shortCommitMsgWords) ? shortCommitMsgWords.join("") : "";
        let isShortCommitMessageTruncated = false;

        if (shortCommitMessage.length > GitRunner.maxShortCommitMsgCharLength && shortCommitSpellingCorrections) {
          shortCommitMessage = shortCommitMessage.substring(0, GitRunner.maxShortCommitMsgCharLength);
          isShortCommitMessageTruncated = true;
        }

        longCommitMessage = (longCommitMsgWords) ? longCommitMsgWords.join("") : "";
        let isLongCommitMessageTruncated = false;

        if (longCommitMessage.length > GitRunner.maxLongCommitMsgLength && longCommitSpellingCorrections) {
          longCommitMessage = longCommitMessage.substring(0, GitRunner.maxLongCommitMsgLength);
          isLongCommitMessageTruncated = true;
        }

        if (isShortCommitMessageTruncated && isLongCommitMessageTruncated) {
          Logger.publish({
            loggingLevelTarget: Logger.Level.INFO,
            message: "Both the short and long commit messages are too long due to recent spelling corrections. They " +
                "have been truncated to fit within the character length requirements.",
            isLabelIncluded: false,
            outputType: Logger.OutputType.INQUIRER
          });
        } else if (isShortCommitMessageTruncated) {
          Logger.publish({
            loggingLevelTarget: Logger.Level.INFO,
            message: "The short commit message is too long due to recent spelling corrections. It has been truncated " +
                "to fit within the character length requirements.",
            isLabelIncluded: false,
            outputType: Logger.OutputType.INQUIRER
          });
        } else if (isLongCommitMessageTruncated) {
          Logger.publish({
            loggingLevelTarget: Logger.Level.INFO,
            message: "The long commit message is too long due to recent spelling corrections. It has been truncated " +
                "to fit within the character length requirements.",
            isLabelIncluded: false,
            outputType: Logger.OutputType.INQUIRER
          });
        }
      }

      let isBreakingChangeResult = await this.prompt([MenuCoordinator.isBreakingChangeQuestion]);
      let isBreakingChange = (typeof isBreakingChangeResult.isBreakingChange === "boolean")
          ? isBreakingChangeResult.isBreakingChange : false;
      let isCiSkipTagInsertedResult = await this.prompt([MenuCoordinator.insertCiSkipTagQuestion]);
      let isCiSkipTagInserted = (typeof isCiSkipTagInsertedResult.isCiSkipTagInserted === "boolean")
          ? isCiSkipTagInsertedResult.isCiSkipTagInserted : false;

      if (commitTypeResult.commitType
          && commitTypeResult.commitType.includes(GitRunner.ChangeType.getName(GitRunner.ChangeType.BUG_FIX))) {
        gitRunner.createCommit(GitRunner.ChangeType.BUG_FIX, shortCommitMessage, longCommitMessage, isBreakingChange,
            isInitialCommit, isCiSkipTagInserted);
      } else if (commitTypeResult.commitType
          && commitTypeResult.commitType.includes(GitRunner.ChangeType.getName(GitRunner.ChangeType.CHANGELOG))) {
        gitRunner.createCommit(GitRunner.ChangeType.CHANGELOG, shortCommitMessage, longCommitMessage, isBreakingChange,
            isInitialCommit, isCiSkipTagInserted);
      } else if (commitTypeResult.commitType
          && commitTypeResult.commitType.includes(GitRunner.ChangeType.getName(GitRunner.ChangeType.CHORE))) {
        gitRunner.createCommit(GitRunner.ChangeType.CHORE, shortCommitMessage, longCommitMessage, isBreakingChange,
            isInitialCommit, isCiSkipTagInserted);
      } else if (commitTypeResult.commitType
          && commitTypeResult.commitType.includes(GitRunner.ChangeType.getName(GitRunner.ChangeType.DEPENDENCY))) {
        gitRunner.createCommit(GitRunner.ChangeType.DEPENDENCY, shortCommitMessage, longCommitMessage, isBreakingChange,
            isInitialCommit, isCiSkipTagInserted);
      } else if (commitTypeResult.commitType
          && commitTypeResult.commitType.includes(GitRunner.ChangeType.getName(GitRunner.ChangeType.DOC))) {
        gitRunner.createCommit(GitRunner.ChangeType.DOC, shortCommitMessage, longCommitMessage, isBreakingChange,
            isInitialCommit, isCiSkipTagInserted);
      } else if (commitTypeResult.commitType
          && commitTypeResult.commitType.includes(GitRunner.ChangeType.getName(GitRunner.ChangeType.FEATURE))) {
        gitRunner.createCommit(GitRunner.ChangeType.FEATURE, shortCommitMessage, longCommitMessage, isBreakingChange,
            isInitialCommit, isCiSkipTagInserted);
      } else if (commitTypeResult.commitType
          && commitTypeResult.commitType.includes(GitRunner.ChangeType.getName(GitRunner.ChangeType.PERF))) {
        gitRunner.createCommit(GitRunner.ChangeType.PERF, shortCommitMessage, longCommitMessage, isBreakingChange,
            isInitialCommit, isCiSkipTagInserted);
      } else if (commitTypeResult.commitType
          && commitTypeResult.commitType.includes(GitRunner.ChangeType.getName(GitRunner.ChangeType.REFACTOR))) {
        gitRunner.createCommit(GitRunner.ChangeType.REFACTOR, shortCommitMessage, longCommitMessage, isBreakingChange,
            isInitialCommit, isCiSkipTagInserted);
      } else if (commitTypeResult.commitType
          && commitTypeResult.commitType.includes(GitRunner.ChangeType.getName(GitRunner.ChangeType.STYLING))) {
        gitRunner.createCommit(GitRunner.ChangeType.STYLING, shortCommitMessage, longCommitMessage, isBreakingChange,
            isInitialCommit, isCiSkipTagInserted);
      } else if (commitTypeResult.commitType
          && commitTypeResult.commitType.includes(GitRunner.ChangeType.getName(GitRunner.ChangeType.TEST))) {
        gitRunner.createCommit(GitRunner.ChangeType.TEST, shortCommitMessage, longCommitMessage, isBreakingChange,
            isInitialCommit, isCiSkipTagInserted);
      } else if (commitTypeResult.commitType
          && commitTypeResult.commitType.includes(GitRunner.ChangeType.getName(GitRunner.ChangeType.VERSION_CHANGE))) {
        gitRunner.createCommit(GitRunner.ChangeType.VERSION_CHANGE, versionChangeResult.appliedVersion, "",
            isBreakingChange, isInitialCommit, isCiSkipTagInserted);
      } else {
        Logger.publish({
          loggingLevelTarget: Logger.Level.ERROR,
          message: "Did not process commit since invalid change type has been detected.",
          isLabelIncluded: true,
          outputType: Logger.OutputType.INQUIRER
        });
      }
    } catch (error) {
      if (error.name === "ShellCmdFailureException") {
        Logger.publish({
          loggingLevelTarget: Logger.Level.ERROR,
          message: error.message,
          isLabelIncluded: true,
          outputType: Logger.OutputType.INQUIRER
        });
        let retryCommitResult = await this.prompt([MenuCoordinator.retryCommitQuestion]);

        while (retryCommitResult.retryCommit) {
          retryCommitResult = (gitRunner.retryFailedCommit() === 0)
              ? false : await this.prompt([MenuCoordinator.retryCommitQuestion]);
        }

        if (retryCommitResult.retryCommit === false) {
          process.exit(1);
        } else {
          process.exit(0);
        }
      } else {
        Logger.publish({
          loggingLevelTarget: Logger.Level.ERROR,
          message: error.message,
          isLabelIncluded: true,
          outputType: Logger.OutputType.INQUIRER
        });
      }
    }
  }
}

module.exports = MenuCoordinator;
