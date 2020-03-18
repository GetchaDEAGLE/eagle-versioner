// imports
const path = require("path");
const colors = require("ansi-colors");
const nSpell = require("nspell");
const FileSystemHelper = require("../components/FileSystemHelper");
const Logger = require("../components/Logger");
const IllegalArgumentException = require("../exceptions/IllegalArgumentException");
const IOException = require("../exceptions/IOException");

// non-changing variables used by class
const REGULAR_WORD_REGEX = new RegExp(/\b[A-Za-z-']+\b/);
const DICTIONARY_ENTRY_REGEX = new RegExp(/^[A-Za-z-']+$/);
const MAX_SPELLING_CORRECTION_CHAR_LENGTH = 255;
const DEFAULT_EXTRA_DICT_WORDS = ["changelog", "change-log", "config"];

/**
 * Provides spelling-related functionality (e.g. spell checking, word suggestions, etc.).
 */
class SpellingAssistant {
  /**
   * Constructor to create local class variables.
   * @param {string} extraDictWordsDir The directory containing the extra dictionary words.
   * @param {string} extraDictWordsFileName The name of the extra dictionary words file.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  constructor(extraDictWordsDir, extraDictWordsFileName) {
    if (typeof extraDictWordsDir === "string" && extraDictWordsDir && typeof extraDictWordsFileName === "string"
        && extraDictWordsFileName) {
      let fileSystemHelper = new FileSystemHelper();
      let dictionary = {};
      let affName = "aff";
      let dicName = "dic";
      dictionary[affName] = fileSystemHelper.readAsBuffer(path.dirname(require.resolve("dictionary-en-us")),
          "index." + affName);
      dictionary[dicName] = fileSystemHelper.readAsBuffer(path.dirname(require.resolve("dictionary-en-us")),
          "index." + dicName);
      this.spellChecker = nSpell(dictionary);
      this.spellChecker.personal(SpellingAssistant.defaultExtraDictWords.join("\n"));
      this.spellChecker.personal(this.getExtraDictionaryWords(extraDictWordsDir, extraDictWordsFileName).join("\n"));
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the SpellingAssistant constructor.");
    }
  }

  /**
   * Gets the regular word regex.
   * @returns {RegExp} The regular word regex.
   */
  static get regularWordRegex() {
    return REGULAR_WORD_REGEX;
  }

  /**
   * Gets the dictionary word regex.
   * @returns {RegExp} The dictionary word regex.
   */
  static get dictionaryEntryRegex() {
    return DICTIONARY_ENTRY_REGEX;
  }

  /**
   * Gets the maximum spelling correction character length.
   * @returns {number} The maximum spelling correction character length.
   */
  static get maxSpellingCorrectionCharLength() {
    return MAX_SPELLING_CORRECTION_CHAR_LENGTH;
  }

  /**
   * Gets the default extra dictionary words.
   * @returns {Array} The extra dictionary words.
   */
  static get defaultExtraDictWords() {
    return DEFAULT_EXTRA_DICT_WORDS;
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

  /**
   * Gets the extra dictionary words from the applicable file on disk.
   * @param {string} extraDictWordsDir The directory containing the extra dictionary words.
   * @param {string} extraDictWordsFileName The name of the extra dictionary words file.
   * @returns {[]} The extra dictionary words to add to the dictionary.
   * @throws IllegalArgumentException when an invalid argument is passed.
   * @throws IOException when the combined directory and extra dictionary words file name contain too many characters.
   * @throws IOException when extra dictionary words file name contains invalid characters.
   */
  getExtraDictionaryWords(extraDictWordsDir, extraDictWordsFileName) {
    let fileSystemHelper = new FileSystemHelper();
    let extraDictionaryWords = [];

    if (typeof extraDictWordsDir === "string" && extraDictWordsDir && typeof extraDictWordsFileName === "string"
        && extraDictWordsFileName) {
      if (fileSystemHelper.getIsValidFileName(extraDictWordsFileName)) {
        if (fileSystemHelper.getIsValidFilePathAndNameCharLength(extraDictWordsDir, extraDictWordsFileName)) {
          if (fileSystemHelper.getDoesFileExist(extraDictWordsDir, extraDictWordsFileName)) {
            let fileContents = fileSystemHelper.readAsString(extraDictWordsDir, extraDictWordsFileName);
            fileContents.replace(/[\r]/g, "\n");
            let additionalWords = fileContents.split("\n").filter((value) => {
              // removes all empty values from array
              return value;
            });
            let updatedAddlWords = [];
            let containsInvalidWords = false;

            // loop through words and remove invalid entries
            for (let i = 0; i < additionalWords.length; i++) {
              if (SpellingAssistant.dictionaryEntryRegex.test(additionalWords[i])) {
                updatedAddlWords.push(additionalWords[i]);
              } else {
                containsInvalidWords = true;

                Logger.publish({
                  loggingLevelTarget: Logger.Level.WARNING,
                  message: "Removed the word " + colors.yellow(additionalWords[i]) + " from the extra words dictionary " +
                      "file as it contains an invalid character. It was likely modified on disk by another mechanism.",
                  isLabelIncluded: true,
                  outputType: Logger.OutputType.INQUIRER
                });
              }
            }

            if (containsInvalidWords) {
              fileSystemHelper.writeAsString(extraDictWordsDir, extraDictWordsFileName, updatedAddlWords.join("\n"));
            } else {
              Logger.publish({
                loggingLevelTarget: Logger.Level.VERBOSE,
                message: "No invalid words detected in the extra words dictionary file.",
                isLabelIncluded: true,
                outputType: Logger.OutputType.INQUIRER
              });
            }

            extraDictionaryWords = Array.from(updatedAddlWords);
            this.spellChecker.personal(extraDictionaryWords.join("\n"));
          } else {
            Logger.publish({
              loggingLevelTarget: Logger.Level.VERBOSE,
              message: "The extra words dictionary file doesn't exist. If necessary, it will be created.",
              isLabelIncluded: true,
              outputType: Logger.OutputType.INQUIRER
            });
          }
        } else {
          throw new IOException("The combined directory " + extraDictWordsDir + " and extra dictionary words filename " +
              extraDictWordsFileName + " contain too many characters.");
        }
      } else {
        throw new IOException("The specified extra dictionary words filename " + extraDictWordsFileName + " contains " +
            "invalid characters.");
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the SpellingAssistant getExtraDictionaryWords " +
          "function.");
    }

    return extraDictionaryWords;
  }

  /**
   * Adds a word to the dictionary. Saves the added words to a file on the user's home directory.
   * @param {string} extraDictWordsDir The directory containing the extra dictionary words.
   * @param {string} extraDictWordsFileName The name of the extra dictionary words file.
   * @param {string} word The word to add to the dictionary.
   * @throws IllegalArgumentException when an invalid argument is passed.
   * @throws IOException when the combined directory and extra dictionary words file name contain too many characters.
   * @throws IOException when extra dictionary words file name contains invalid characters.
   */
  addWordToDictionary(extraDictWordsDir, extraDictWordsFileName, word) {
    if (typeof extraDictWordsDir === "string" && extraDictWordsDir && typeof extraDictWordsFileName === "string"
        && extraDictWordsFileName && typeof word === "string" && word) {
      let fileSystemHelper = new FileSystemHelper();

      if (fileSystemHelper.getIsValidFileName(extraDictWordsFileName)) {
        if (fileSystemHelper.getIsValidFilePathAndNameCharLength(extraDictWordsDir, extraDictWordsFileName)) {
          if (fileSystemHelper.getDoesFileExist(extraDictWordsDir, extraDictWordsFileName)) {
            let additionalWords = this.getExtraDictionaryWords(extraDictWordsDir, extraDictWordsFileName);
            let fileContents = "";

            for (let i = 0; i < additionalWords.length; i++) {
              fileContents = fileContents.concat(additionalWords[i] + "\n");
            }

            fileContents = fileContents.concat(word + "\n");
            fileSystemHelper.writeAsString(extraDictWordsDir, extraDictWordsFileName, fileContents);
          } else {
            fileSystemHelper.writeAsString(extraDictWordsDir, extraDictWordsFileName, word + "\n");
          }
        } else {
          throw new IOException("The combined directory " + extraDictWordsDir + " and extra dictionary words filename " +
              extraDictWordsFileName + " contain too many characters.");
        }
      } else {
        throw new IOException("The specified extra dictionary words filename " + extraDictWordsFileName + " contains " +
            "invalid characters.");
      }

      this.spellChecker.personal([word].join("\n"));
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the SpellingAssistant addWordToDictionary function.");
    }
  }
}

module.exports = SpellingAssistant;
