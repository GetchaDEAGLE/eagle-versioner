/* eslint-disable no-console */

// imports
const ansiRegex = require("ansi-regex");
const colors = require("ansi-colors");
const colorSupport = require("color-support");
const inquirer = require("inquirer");
const shell = require("shelljs");
const Moment = require("moment");
const Enum = require("../data-structures/Enum");
const IllegalArgumentException = require("../exceptions/IllegalArgumentException");

// non-changing variables used by class
const MAX_CHARS_PER_LINE = 80; // must be larger than zero
const MAX_LINE_NUM_INDENT_CHARS = 0; // the maximum number of characters (including the line numbers) used for line
                                     // number indents
const MAX_MESSAGE_CHAR_LENGTH = 4096;
const LEVEL = new Enum("INFO", "DEBUG", "WARNING", "ERROR", "VERBOSE", "SILENT");
const DEFAULT_LOGGING_LEVEL = LEVEL.getSymbol("info");
const OUTPUT_TYPE = new Enum("SHELL", "CONSOLE", "INQUIRER");

// hidden variables internally accessible via closure or externally via getter/setter functions
let currentLoggingLevel = DEFAULT_LOGGING_LEVEL;
let currentLineCount = 0;
let inquirerBottomBar;

/**
 * Provides logging functionality to output messages to standard out, append to file, etc.
 */
class Logger {
  /**
   * Gets the available logging levels as an Enum.
   * @returns {Enum} Logging levels as an Enum.
   */
  static get Level() {
    return LEVEL;
  }

  /**
   * Gets the available output types as an Enum.
   * @returns {Enum} Output types as an Enum.
   */
  static get OutputType() {
    return OUTPUT_TYPE;
  }

  /**
   * Returns the maximum amount of characters that can belong to a line.
   * @returns {number} The maximum characters allowed per line.
   */
  static get maxCharsPerLine() {
    return MAX_CHARS_PER_LINE;
  }

  /**
   * Gets the maximum number of characters (including the line numbers) used for line number indents.
   * @returns {number} The max number of chars for line number indents.
   */
  static get maxLineNumIndentChars() {
    return MAX_LINE_NUM_INDENT_CHARS;
  }

  /**
   * Gets the current line count of the message.
   * @returns {number} The number of lines belonging to the message.
   */
  static get currentLineCount() {
    return currentLineCount;
  }

  /**
   * Sets the current line count of the message.
   * @param {number} lineCount The number of lines belonging to the message.
   * @throws IllegalArgumentException on passing of illegal argument.
   */
  static set currentLineCount(lineCount) {
    if (typeof lineCount === "number") {
      currentLineCount = lineCount;
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the Logger currentLineCount setter function.");
    }
  }

  /**
   * Returns the maximum amount of characters that can be allowed in a given message.
   * @returns {number} The maximum amount of characters allowed per message.
   */
  static get maxMessageCharLength() {
    return MAX_MESSAGE_CHAR_LENGTH;
  }

  /**
   * Gets the current logging level.
   * @returns {Symbol} The current logging level as a symbol.
   */
  static get currentLoggingLevel() {
    return currentLoggingLevel;
  }

  /**
   * Sets the initial logging level which will depend on what types of messages are displayed.
   * @param {Symbol} loggingLevelTarget The type of logging level to use specified as a symbol.
   * @throws IllegalArgumentException on passing of illegal argument.
   */
  static set currentLoggingLevel(loggingLevelTarget) {
    if (typeof loggingLevelTarget === "symbol" && this.Level.getName(loggingLevelTarget)) {
      currentLoggingLevel = loggingLevelTarget;
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the Logger currentLoggingLevel setter function.");
    }
  }

  /**
   * Gets the default logging level.
   * @returns {Symbol} The default logging level as a symbol.
   */
  static get defaultLoggingLevel() {
    return DEFAULT_LOGGING_LEVEL;
  }

  /**
   * Gets the Inquirer bottom bar instance.
   * @returns {*} The Inquirer bottom bar instance.
   */
  static get inquirerBottomBar() {
    return inquirerBottomBar;
  }

  /**
   * Sets the Inqurier bottom bar instance.
   * @param {*} bottomBarInstance The Inquirer bottom bar instance.
   * @throws IllegalArgumentException on passing of illegal argument.
   */
  static set inquirerBottomBar(bottomBarInstance) {
    if (typeof bottomBarInstance === "object") {
      inquirerBottomBar = bottomBarInstance;
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the Logger inquirerBottomBar setter function.");
    }
  }

  /**
   * Checks if the logging level passed as a string is a valid option.
   * @param {string} loggingLevel The logging level to check if valid.
   * @returns {boolean} True if the logging level is valid and false if not.
   * @throws IllegalArgumentException on passing of illegal argument.
   */
  static isValidLoggingLevel(loggingLevel) {
    let isValidLoggingLevel = false;

    if (typeof loggingLevel === "string" && loggingLevel) {
      isValidLoggingLevel = this.Level.isEntry(loggingLevel);
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the Logger isValidLoggingLevel function.");
    }

    return isValidLoggingLevel;
  }

  /**
   * Replaces the encoded ANSI color sequences found in the message with those that are decoded.
   * @param {string} message The message that should be processed.
   * @param {Map} ansiClrSeqPairs Map of ANSI color sequence pairs with the key as the decoded sequence and the value
   *                              as the encoded sequence.
   * @returns {string} The updated message with decoded ANSI color sequences if they exist, otherwise the original message.
   * @throws IllegalArgumentException on passing of illegal argument.
   */
  static decodeAnsiColorSequences(message, ansiClrSeqPairs) {
    let updatedMessage = "";

    if (typeof message === "string" && ansiClrSeqPairs instanceof Map) {
      updatedMessage = message.valueOf();
      let ansiClrSeqPairKeys = Array.from(ansiClrSeqPairs.keys());

      for (let i = 0; i < ansiClrSeqPairKeys.length; i++) {
        while (updatedMessage.indexOf(ansiClrSeqPairs.get(ansiClrSeqPairKeys[i])) >= 0) {
          updatedMessage = updatedMessage.replace(ansiClrSeqPairs.get(ansiClrSeqPairKeys[i]), ansiClrSeqPairKeys[i]);
        }
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the Logger decodeAnsiColorSequences function.");
    }

    return updatedMessage;
  }

  /**
   * Gets the encoded/decoded ANSI color sequence pairs belonging to the specified message.
   * @param {string} message The message to process.
   * @returns {Map<string, string>} Map of ANSI color sequence pairs with the key as the decoded sequence and value as
   *                                the encoded sequence.
   * @throws IllegalArgumentException on passing of illegal argument.
   */
  static getAnsiColorSeqPairs(message) {
    let ansiColorSequencePairs = new Map();

    if (typeof message === "string") {
      let ansiColorSequences = message.match(ansiRegex());

      if (ansiColorSequences) {
        for (let i = 0; i < ansiColorSequences.length; i++) {
          ansiColorSequencePairs.set(ansiColorSequences[i], encodeURI(ansiColorSequences[i]));
        }
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the Logger getAnsiColorSeqPairs function.");
    }

    return ansiColorSequencePairs;
  }

  /**
   * Gets the encoded ANSI color sequence indices found in the provided message.
   * @param {string} message The message to process.
   * @param {Array} encodedAnsiColorSequences List of encoded ANSI color sequences found in the message.
   * @returns {Map<string, Array>} Map of encoded ANSI color sequence indices with the key as the encoded sequence and
   *                            value as an array of objects containing the start/end indices.
   * @throws IllegalArgumentException on passing of illegal argument.
   */
  static getEncodedAnsiClrSeqIndices(message, encodedAnsiColorSequences) {
    let encodedAnsiClrSeqIndices = new Map();

    if (typeof message === "string" && Array.isArray(encodedAnsiColorSequences)) {
      for (let i = 0; i < encodedAnsiColorSequences.length; i++) {
        let foundIndices = [];
        let startIndex = 0;

        while (startIndex >= 0) {
          let foundIndex = message.indexOf(encodedAnsiColorSequences[i], startIndex);
          let endIndex = foundIndex + encodedAnsiColorSequences[i].length - 1;

          if (foundIndex >= 0) {
            foundIndices.push({
              beginIndex: foundIndex,
              endIndex: endIndex
            });
            startIndex = endIndex + 1;
          } else {
            startIndex = -1;
          }
        }

        if (foundIndices.length > 0) {
          encodedAnsiClrSeqIndices.set(encodedAnsiColorSequences[i], foundIndices);
        }
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the Logger getEncodedAnsiClrSeqIndices function.");
    }

    return encodedAnsiClrSeqIndices;
  }

  /**
   * Adds line numbers to a message.
   * @param {string} message The message to add line numbers to.
   * @returns {string} The updated message with line numbers.
   * @throws IllegalArgumentException on passing of illegal argument.
   */
  static addLineNumbers(message) {
    let updatedMessage = "";

    if (typeof message === "string") {
      let messageChars = Array.from(message);
      let onlyLineBreaks = false;

      for (let i = 0; i < messageChars.length; i++) {
        if (message.charAt(i) === "\n" || message.charAt(i) === "\r") {
          onlyLineBreaks = true;
        } else {
          onlyLineBreaks = false;
          break;
        }
      }

      if (onlyLineBreaks) {
        for (let i = 0; i < messageChars.length; i++) {
          this.currentLineCount++;

          if (this.currentLineCount.toString().length < this.maxLineNumIndentChars) {
            // prepend whitespace along with the line number before each message line
            updatedMessage += " ".repeat(this.maxLineNumIndentChars - this.currentLineCount.toString().length)
              + this.currentLineCount.toString() + ": \n";
          }
          // otherwise do not prepend whitespace and only prepend the line number
          else {
            updatedMessage += this.currentLineCount.toString() + ": \n";
          }
        }
      }
      // otherwise split the message using the line break characters
      else {
        let messageLines = message.split(/\r?\n/);
        let messageLinesLength = messageLines.length;

        // if the message has at least one line
        if (messageLinesLength > 0) {
          // loop through message lines and prepend the line number
          for (let i = 0; i < messageLinesLength; i++) {
            this.currentLineCount++;

            // if the number of digits in the current line count is less than the max line number indent characters
            if (this.currentLineCount.toString().length < this.maxLineNumIndentChars) {
              // prepend whitespace along with the line number before each message line
              updatedMessage += " ".repeat(this.maxLineNumIndentChars - this.currentLineCount.toString().length)
                  + this.currentLineCount.toString() + ": " + messageLines[i];
            }
            // otherwise do not prepend whitespace and only prepend the line number
            else {
              updatedMessage += this.currentLineCount.toString() + ": " + messageLines[i];
            }

            // add new line characters back
            updatedMessage += (i + 1 < messageLinesLength) ? "\n" : "";
          }
        }
        // otherwise just return the message
        else {
          return message;
        }
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the Logger addLineNumbers function.");
    }

    return updatedMessage;
  }

  /**
   * Divides the specified message from spaces. Creates an element for contiguous non-whitespace and whitespace chars.
   * @param {string} message The message to process.
   * @returns {Array} List of message elements.
   * @throws IllegalArgumentException on passing of illegal argument.
   */
  static divideMsgFromSpaces(message) {
    let messageElements = [];

    if (typeof message === "string") {
      let messageElementChars = Array.from(message);
      let prevChar = "";
      let wordChars = [];

      for (let i = 0; i < messageElementChars.length; i++) {
        prevChar = (i > 0) ? messageElementChars[i - 1] : "";
        wordChars.push(messageElementChars[i]);
        let messageElement = "";

        if ((messageElementChars[i] === " " && prevChar !== " ") || (messageElementChars[i] !== " " && prevChar === " ")) {
          messageElement = wordChars.slice(0, wordChars.length - 1).join("");
          messageElements.push(messageElement);
          wordChars = wordChars.slice(wordChars.length - 1);
        }

        if (i === messageElementChars.length - 1) {
          messageElement = wordChars.join("");
          messageElements.push(messageElement);
        }
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the Logger divideMsgFromSpaces function.");
    }

    return messageElements;
  }

  /**
   * Divides the message from any encoded ANSI color sequences. Keeps the encoded ANSI color sequences as separate elements.
   * @param {string} message The message to process.
   * @param {Array} encodedAnsiColorSequences The encoded ANSI color sequences belonging to the message.
   * @returns {Array} The message elements resulting from the division.
   * @throws IllegalArgumentException on passing of illegal argument.
   */
  static divideMsgFromEncAnsiClrSeqs(message, encodedAnsiColorSequences) {
    let messageElements = [];

    if (typeof message === "string" && Array.isArray(encodedAnsiColorSequences)) {
      let encodedAnsiClrSeqIndicesMap = this.getEncodedAnsiClrSeqIndices(message, encodedAnsiColorSequences);
      let encodedAnsiClrSeqIndices = [];
      let indicesToSplitOn = [];
      let encodedAnsiClrSeqIndiceValues = Array.from(encodedAnsiClrSeqIndicesMap.values());

      for (let i = 0; i < encodedAnsiClrSeqIndiceValues.length; i++) {
        for (let j = 0; j < encodedAnsiClrSeqIndiceValues[i].length; j++) {
          encodedAnsiClrSeqIndices.push({
            beginIndex: encodedAnsiClrSeqIndiceValues[i][j].beginIndex,
            endIndex: encodedAnsiClrSeqIndiceValues[i][j].endIndex
          });
        }
      }

      // sort from lowest to highest
      encodedAnsiClrSeqIndices.sort((a, b) => {
        return a.endIndex - b.beginIndex;
      });

      for (let i = 0; i < encodedAnsiClrSeqIndices.length; i++) {
        if (i === 0 && encodedAnsiClrSeqIndices[i].beginIndex > 0) {
          indicesToSplitOn.push({
            beginIndex: 0,
            endIndex: encodedAnsiClrSeqIndices[i].beginIndex - 1
          });
          indicesToSplitOn.push({
            beginIndex: encodedAnsiClrSeqIndices[i].beginIndex,
            endIndex: encodedAnsiClrSeqIndices[i].endIndex
          });
        } else if (i > 0 && encodedAnsiClrSeqIndices[i].beginIndex > encodedAnsiClrSeqIndices[i - 1].endIndex + 1) {
          indicesToSplitOn.push({
            beginIndex: encodedAnsiClrSeqIndices[i - 1].endIndex + 1,
            endIndex: encodedAnsiClrSeqIndices[i].beginIndex - 1
          });
          indicesToSplitOn.push({
            beginIndex: encodedAnsiClrSeqIndices[i].beginIndex,
            endIndex: encodedAnsiClrSeqIndices[i].endIndex
          });
        } else if (i === encodedAnsiClrSeqIndices.length - 1 && encodedAnsiClrSeqIndices[i].endIndex < message.length - 1) {
          indicesToSplitOn.push({
            beginIndex: encodedAnsiClrSeqIndices[i].beginIndex,
            endIndex: encodedAnsiClrSeqIndices[i].endIndex
          });
          indicesToSplitOn.push({
            beginIndex: encodedAnsiClrSeqIndices[i].endIndex + 1,
            endIndex: message.length - 1
          });
        } else {
          indicesToSplitOn.push({
            beginIndex: encodedAnsiClrSeqIndices[i].beginIndex,
            endIndex: encodedAnsiClrSeqIndices[i].endIndex
          });
        }

        if (i === encodedAnsiClrSeqIndices.length - 1
            && indicesToSplitOn[indicesToSplitOn.length - 1].endIndex !== message.length - 1
            && i === encodedAnsiClrSeqIndices.length - 1 && encodedAnsiClrSeqIndices[i].endIndex < message.length - 1) {
          indicesToSplitOn.push({
            beginIndex: encodedAnsiClrSeqIndices[i].endIndex + 1,
            endIndex: message.length - 1
          });
        }
      }

      for (let i = 0; i < indicesToSplitOn.length; i++) {
        messageElements.push(message.substring(indicesToSplitOn[i].beginIndex, indicesToSplitOn[i].endIndex + 1));
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the Logger divideMsgFromEncAnsiClrSeqs function.");
    }

    return messageElements;
  }

  /**
   * Trims the message elements causing the message go over the character limit. Will not trim encoded ANSI color
   * sequence elements and only elements with regular characters. For example, if the last element contains 3 characters
   * but the message is only 2 characters over the limit, the entire element will be trimmed.
   * @param {Array} messageElements The message elements used for the trimming process.
   * @param {Array} encodedAnsiClrSeqs Array of encoded ANSI color sequences belonging to the message.
   * @param {number} msgCharLimit The maximum amount of characters allowed in a message (doesn't count ANSI color
   *                              sequences).
   * @returns {Array} The list of updated message elements.
   * @throws IllegalArgumentException on passing of illegal argument.
   */
  static trimMsgElements(messageElements, encodedAnsiClrSeqs, msgCharLimit = this.maxMessageCharLength) {
    let updatedMessageElements = [];

    if (Array.isArray(messageElements) && Array.isArray(encodedAnsiClrSeqs) && typeof msgCharLimit === "number"
        && msgCharLimit) {
      updatedMessageElements = Array.from(messageElements);
      let msgElemsWoEncodedAnsiClrSeqs = [];

      for (let i = 0; i < messageElements.length; i++) {
        if (encodedAnsiClrSeqs.indexOf(messageElements[i]) === -1) {
          msgElemsWoEncodedAnsiClrSeqs.push(messageElements[i]);
        }
      }

      let totalCharLength = Array.from(msgElemsWoEncodedAnsiClrSeqs.join("")).length;
      let lastIndex = 0;

      if (totalCharLength > msgCharLimit) {
        for (let i = messageElements.length - 1; i >= 0; i--) {
          totalCharLength = (encodedAnsiClrSeqs.indexOf(messageElements[i]) === -1)
              ? totalCharLength - Array.from(messageElements[i]).length : totalCharLength;

          if (totalCharLength <= msgCharLimit) {
            updatedMessageElements = messageElements.slice(0, i);
            lastIndex = i;
            break;
          }
        }

        // add any encoded ANSI color sequence elements lost after the result of the array slice
        for (let i = lastIndex; i < messageElements.length; i++) {
          if (encodedAnsiClrSeqs.indexOf(messageElements[i]) >= 0) {
            updatedMessageElements.push(messageElements[i]);
          }
        }
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the Logger trimMsgElements function.");
    }

    return updatedMessageElements;
  }

  /**
   * Creates elements from the specified message. It will create an element for contiguous
   * non-whitespace characters, contiguous white-space characters, new-line characters, and encoded ANSI color sequences.
   * @param {string} message The message to process.
   * @param {Array} encodedAnsiClrSeqs Array of encoded ANSI color sequences belonging to the message.
   * @returns {Array} Array of message elements.
   * @throws IllegalArgumentException on passing of illegal argument.
   */
  static createMsgElements(message, encodedAnsiClrSeqs = []) {
    let messageElements = [];

    if (typeof message === "string" && Array.isArray(encodedAnsiClrSeqs)) {
      if (encodedAnsiClrSeqs.length > 0) {
        let msgElemsWithAnsiClrSeqs = this.divideMsgFromEncAnsiClrSeqs(message, encodedAnsiClrSeqs);

        for (let i = 0; i < msgElemsWithAnsiClrSeqs.length; i++) {
          if (encodedAnsiClrSeqs.indexOf(msgElemsWithAnsiClrSeqs[i]) >= 0) {
            messageElements.push(msgElemsWithAnsiClrSeqs[i]);
          } else {
            messageElements = messageElements.concat(this.divideMsgFromSpaces(msgElemsWithAnsiClrSeqs[i]));
          }
        }
      } else {
        messageElements = this.divideMsgFromSpaces(message);
      }

      let updatedMessageElements = [];

      // further divide message by any new line characters that are found
      for (let i = 0; i < messageElements.length; i++) {
        let msgSubElements = messageElements[i].split("\n");

        if (msgSubElements.length > 1) {
          for (let j = 0; j < msgSubElements.length; j++) {
            if (j < msgSubElements.length - 1) {
              updatedMessageElements.push(msgSubElements[j]);
              updatedMessageElements.push("\n");
            } else {
              updatedMessageElements.push(msgSubElements[j]);
            }
          }
        } else {
          updatedMessageElements.push(messageElements[i]);
        }
      }

      messageElements = (updatedMessageElements.length > messageElements.length)
          ? updatedMessageElements : messageElements;
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the Logger createMsgElements function.");
    }

    return messageElements;
  }

  /**
   * Inserts new lines into the message element.
   * @param {Array} messageElementChars List of message element characters.
   * @param {number} currentLineCharLength The length of the current line.
   * @param {number} lineCharLimit The maximum number of characters per line.
   * @returns {Array} Message element characters with new lines added where applicable.
   * @throws IllegalArgumentException on passing of illegal argument.
   */
  static insertNewLinesIntoMsgElem(messageElementChars, currentLineCharLength, lineCharLimit) {
    let updatedMsgElementChars = [];

    if (Array.isArray(messageElementChars) && typeof currentLineCharLength === "number"
        && typeof lineCharLimit === "number") {
      let updatedLineCharLength = parseInt(currentLineCharLength, 10);

      for (let k = 0; k < messageElementChars.length; k++) {
        updatedLineCharLength++;

        if (updatedLineCharLength <= lineCharLimit) {
          updatedMsgElementChars.push(messageElementChars[k]);
        } else {
          updatedMsgElementChars.push("\n");
          updatedMsgElementChars.push(messageElementChars[k]);
          updatedLineCharLength = 1;
        }
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the Logger insertNewLinesIntoMsgElem function.");
    }

    return updatedMsgElementChars;
  }

  /**
   * Arranges words in a line based on the line character limit. Remaining words will wrap onto the next line. Will break
   * lines between words rather than within words when possible. Also, will truncate the message if it exceeds the max
   * character length.
   * @param {string} message The message to word wrap.
   * @param {number} lineCharLimit The maximum number of characters allowed in a given line.
   * @returns {string} The word wrapped message with applicable new lines added.
   * @throws IllegalArgumentException on passing of illegal argument.
   */
  static wordWrap(message, lineCharLimit = this.maxCharsPerLine) {
    let wordWrappedMessage = "";

    if (typeof message === "string" && typeof lineCharLimit === "number" && lineCharLimit > 0) {
      let cleansedMessage = message.replace(/\r/gi, "\n");
      let ansiColorSequencePairs = this.getAnsiColorSeqPairs(cleansedMessage);
      let ansiClrSeqPairKeys = Array.from(ansiColorSequencePairs.keys());

      for (let i = 0; i < ansiClrSeqPairKeys.length; i++) {
        while (cleansedMessage.indexOf(ansiClrSeqPairKeys[i]) >= 0) {
          cleansedMessage = cleansedMessage.replace(ansiClrSeqPairKeys[i],
            ansiColorSequencePairs.get(ansiClrSeqPairKeys[i]));
        }
      }

      let currentLineCharLength = 0;
      let encodedAnsiColorSequences = Array.from(ansiColorSequencePairs.values());
      let messageElements = this.createMsgElements(cleansedMessage, encodedAnsiColorSequences);
      messageElements = this.trimMsgElements(messageElements, encodedAnsiColorSequences, this.maxMessageCharLength);
      let wordWrappedElements = [];

      for (let i = 0; i < messageElements.length; i++) {
        if (encodedAnsiColorSequences.indexOf(messageElements[i]) >= 0) {
          wordWrappedElements.push(messageElements[i]);
        } else {
          let messageElementChars = Array.from(messageElements[i]);
          currentLineCharLength = (messageElements[i] === "\n")
              ? currentLineCharLength : currentLineCharLength + messageElementChars.length;

          if (messageElements[i] === "\n") {
            wordWrappedElements.push(messageElements[i]);
            currentLineCharLength = 0;
          } else if (currentLineCharLength <= lineCharLimit) {
            if (i > 0 && wordWrappedElements[i - 1] === "\n" && messageElements[i] === " ") {
              wordWrappedElements.push("");
            } else {
              wordWrappedElements.push(messageElements[i]);
            }
          } else {
            currentLineCharLength -= messageElementChars.length;

            if (messageElementChars.length > lineCharLimit) {
              messageElementChars = this.insertNewLinesIntoMsgElem(messageElementChars, currentLineCharLength,
                  lineCharLimit);
              let lastNewLineIndex = messageElementChars.lastIndexOf("\n");
              currentLineCharLength = (lastNewLineIndex >= 0)
                  ? (messageElementChars.length - 1) - lastNewLineIndex : currentLineCharLength;
              wordWrappedElements = wordWrappedElements.concat(messageElementChars);
            } else {
              // add a new line character to the previous element but don't do on first element
              wordWrappedElements[wordWrappedElements.length - 1] = (i > 0)
                  ? wordWrappedElements[wordWrappedElements.length - 1].concat("\n")
                  : wordWrappedElements[wordWrappedElements.length - 1];

              // if new line begins with a single white space, remove it
              if (messageElements[i] === " ") {
                currentLineCharLength = 0;
                wordWrappedElements.push("");
              } else {
                currentLineCharLength = messageElementChars.length;
                wordWrappedElements.push(messageElements[i]);
              }
            }
          }
        }
      }

      wordWrappedMessage = this.decodeAnsiColorSequences(wordWrappedElements.join(""), ansiColorSequencePairs);
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the Logger wordWrap function.");
    }

    return wordWrappedMessage;
  }

  /**
   * Creates a label for the message.
   * @param {Symbol} loggingLevelTarget The type of logging level to use specified as a symbol.
   * @returns {string} The created label.
   * @throws IllegalArgumentException on passing of illegal argument.
   */
  static createLabel(loggingLevelTarget) {
    let label = "";

    if (typeof loggingLevelTarget === "symbol" && this.Level.getName(loggingLevelTarget)) {
      if (loggingLevelTarget === this.Level.DEBUG) {
        label = colors.blue(this.Level.getName(this.Level.DEBUG) + ": ");
      } else if (loggingLevelTarget === this.Level.INFO) {
        label = colors.white(this.Level.getName(this.Level.INFO) + ": ");
      } else if (loggingLevelTarget === this.Level.WARNING) {
        label = colors.yellow(this.Level.getName(this.Level.WARNING) + ": ");
      } else if (loggingLevelTarget === this.Level.ERROR) {
        label = colors.bold.red(this.Level.getName(this.Level.ERROR) + ": ");
      } else if (loggingLevelTarget === this.Level.VERBOSE) {
        label = colors.white(this.Level.getName(this.Level.VERBOSE) + ": ");
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the Logger createLabel function.");
    }

    return label;
  }

  /**
   * Echos a message to the terminal.
   * @param {string} message The message to echo.
   * @param {Symbol} outputType The type of output to echo the message to.
   * @param {Symbol} loggingLevelTarget The logging level target which will determine if the message is displayed.
   * @throws IllegalArgumentException on passing of illegal argument.
   */
  static echo(message, outputType, loggingLevelTarget = this.Level.INFO) {
    // enable colors if the terminal supports it
    colors.enabled = colorSupport.hasBasic;

    if (typeof message === "string" && typeof outputType === "symbol"
        && this.OutputType.getName(outputType) && typeof loggingLevelTarget === "symbol"
        && this.Level.getName(loggingLevelTarget)) {
      if (this.currentLoggingLevel !== this.Level.SILENT && (this.currentLoggingLevel === this.Level.VERBOSE
          || (this.currentLoggingLevel === this.Level.ERROR && loggingLevelTarget === this.Level.ERROR)
          || (this.currentLoggingLevel === this.Level.WARNING && loggingLevelTarget === this.Level.WARNING)
          || (this.currentLoggingLevel === this.Level.INFO && (loggingLevelTarget === this.Level.INFO
              || loggingLevelTarget === this.Level.ERROR))
          || (this.currentLoggingLevel === this.Level.DEBUG && (loggingLevelTarget === this.Level.DEBUG
              || loggingLevelTarget === this.Level.INFO || loggingLevelTarget === this.Level.ERROR
              || loggingLevelTarget === this.Level.WARNING)))) {
        if (outputType === this.OutputType.SHELL) {
          shell.echo(message);
        } else if (outputType === this.OutputType.CONSOLE) {
          console.log(message);
        } else if (outputType === this.OutputType.INQUIRER) {
          if (Logger.inquirerBottomBar) {
            Logger.inquirerBottomBar.log.write(message);
          } else {
            Logger.inquirerBottomBar = new inquirer.ui.BottomBar();
            Logger.inquirerBottomBar.log.write(message);
          }
        }
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the Logger echo function.");
    }
  }

  /**
   * Publishes messages to the desired output type based on the logging level target.
   * @param {object} logEntry Object containing log data (e.g. logging level target specified as a symbol (enum entry,
   *                          property of enum class) and message).
   * @throws IllegalArgumentException on passing of illegal argument.
   */
  static publish(logEntry) {
    if (typeof logEntry === "object" && typeof logEntry.loggingLevelTarget === "symbol") {
      let moment = new Moment();
      let time = colors.bgWhite.black;
      let message = (typeof logEntry.message === "string" && logEntry.message) ? logEntry.message : "";
      message = (logEntry.isLabelIncluded)
        ? this.createLabel(logEntry.loggingLevelTarget) + message : message;
      message = this.wordWrap(message);
      message = (logEntry.areLineNumbersIncluded) ? this.addLineNumbers(message) : message;
      message = (logEntry.isTimestampIncluded) ? time(moment.toString()) + "\n" + message : message;

      let outputType = (typeof logEntry.outputType === "symbol")
          ? logEntry.outputType : this.OutputType.CONSOLE;
      let loggingLevelTarget = (typeof logEntry.loggingLevelTarget === "symbol")
          ? logEntry.loggingLevelTarget : this.Level.INFO;
      this.echo(message, outputType, loggingLevelTarget);
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the Logger publish function.");
    }
  }
}

module.exports = Logger;
