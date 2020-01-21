// imports
const path = require("path");
const colors = require("ansi-colors");
const nSpell = require("nspell");
const FileSystemHelper = require("../components/FileSystemHelper");
const Logger = require("../components/Logger");
const IllegalArgumentException = require("../exceptions/IllegalArgumentException");

// non-changing variables used by class
const REGULAR_WORD_REGEX = new RegExp(/\b[A-Za-z-']+\b/);
const MAX_SPELLING_CORRECTION_CHAR_LENGTH = 255;

/**
 * Provides spelling-related functionality (e.g. spell checking, word suggestions, etc.).
 */
class SpellingAssistant {
  /**
   * Constructor to create local class variables.
   */
  constructor() {
    let fileSystemHelper = new FileSystemHelper();
    let dictionary = {};
    let affName = "aff";
    let dicName = "dic";
    dictionary[affName] = fileSystemHelper.readAsBuffer(path.dirname(require.resolve("dictionary-en-us")),
        "index." + affName);
    dictionary[dicName] = fileSystemHelper.readAsBuffer(path.dirname(require.resolve("dictionary-en-us")),
        "index." + dicName);
    this.spellChecker = nSpell(dictionary);
    this.spellChecker.personal(["changelog", "change-log", "config"].join("\n"));
  }

  /**
   * Gets the regular word regex.
   * @returns {RegExp} The regular word regex.
   */
  static get regularWordRegex() {
    return REGULAR_WORD_REGEX;
  }

  /**
   * Gets the maximum spelling correction character length.
   * @returns {number} The maximum spelling correction character length.
   */
  static get maxSpellingCorrectionCharLength() {
    return MAX_SPELLING_CORRECTION_CHAR_LENGTH;
  }

  /**
   * Gets the misspelled words from the specified words.
   * @param {Array} words The words to check for misspellings.
   * @returns {Map<number, string>} Map of spelling corrections.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  getMisspelledWords(words) {
    let misspelledWords = new Map();

    if (Array.isArray(words)) {
      for (let i = 0; i < words.length; i++) {
        if (SpellingAssistant.regularWordRegex.test(words[i])) {
          if (this.spellChecker.correct(words[i]) === false) {
            Logger.publish({
              loggingLevelTarget: Logger.Level.VERBOSE,
              message: "The word " + colors.yellow("\"" + words[i] + "\"") + " is not correct.",
              isLabelIncluded: true,
              outputType: Logger.OutputType.INQUIRER
            });
            misspelledWords.set(i, words[i]);
          } else {
            Logger.publish({
              loggingLevelTarget: Logger.Level.VERBOSE,
              message: "The word " + colors.yellow("\"" + words[i] + "\"") + " is correct.",
              isLabelIncluded: true,
              outputType: Logger.OutputType.INQUIRER
            });
          }
        } else if (words[i]) {
          Logger.publish({
            loggingLevelTarget: Logger.Level.VERBOSE,
            message: "Skipped the analysis of " + colors.yellow("\"" + words[i] + "\"") + " since it contains a " +
                "non-word character.",
            isLabelIncluded: true,
            outputType: Logger.OutputType.INQUIRER
          });
        }
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the SpellingAssistant getMisspelledWords function.");
    }

    return misspelledWords;
  }

  /**
   * Highlights the misspellings in the supplied words.
   * @param {Array} originalWords The original words array.
   * @param {Map<number, string>} misspelledWords The misspelled words map.
   * @returns {string} The string with misspellings highlighted.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  highlightMisspellings(originalWords, misspelledWords) {
    let msgWithHighlights = "";

    if (Array.isArray(originalWords) && misspelledWords instanceof Map && misspelledWords.size > 0) {
      for (let i = 0; i < originalWords.length; i++) {
        if (misspelledWords.get(i)) {
          msgWithHighlights += colors.red(originalWords[i]);
        } else {
          msgWithHighlights += originalWords[i];
        }
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the SpellingAssistant highlightMisspellings function.");
    }

    return msgWithHighlights;
  }

  /**
   * Gets spelling suggestions for the supplied word.
   * @param {string} word The word to get spelling suggestions for.
   * @returns {Array} Array of suggested words.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  suggestCorrect(word) {
    let suggestedWords = [];

    if (typeof word === "string" && word) {
      suggestedWords = this.spellChecker.suggest(word);
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the SpellingAssistant suggestCorrect function.");
    }

    return suggestedWords;
  }

  /**
   * Highlights the corrections in the supplied words.
   * @param {Array} originalWords The original words array.
   * @param {Map<number, string>} correctedWords The corrected words map.
   * @returns {string} The string with corrections highlighted.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  highlightCorrections(originalWords, correctedWords) {
    let msgWithHighlights = "";

    if (Array.isArray(originalWords) && correctedWords instanceof Map && correctedWords.size > 0) {
      for (let i = 0; i < originalWords.length; i++) {
        if (correctedWords.get(i)) {
          msgWithHighlights += colors.blue(correctedWords.get(i));
        } else {
          msgWithHighlights += originalWords[i];
        }
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the SpellingAssistant highlightCorrections function.");
    }

    return msgWithHighlights;
  }
}

module.exports = SpellingAssistant;
