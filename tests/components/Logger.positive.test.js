// imports
const colors = require("ansi-colors");
const Logger = require("../../components/Logger");

describe("Tests the Logger for proper functionality.", () => {
  test("Tests if the specified logging level is valid.", () => {
    expect(Logger.isValidLoggingLevel("ERROR")).toBe(true);
  });

  test("Tests decoding ANSI color sequences.", () => {
    let message = colors.red("This") + " is a test.";
    let ansiClrSeqPairs = Logger.getAnsiColorSeqPairs(message);
    let decodedMessage = Logger.decodeAnsiColorSequences(message, ansiClrSeqPairs);
    expect(decodedMessage).toBe("[31mThis[39m is a test.");
  });

  test("Tests getting ANSI color sequence pairs.", () => {
    let message = colors.red("This") + " is a test.";
    let ansiClrSeqPairs = Logger.getAnsiColorSeqPairs(message);
    let iterator = ansiClrSeqPairs.values();
    expect(iterator.next().value).toBe("%1B%5B31m");
    expect(iterator.next().value).toBe("%1B%5B39m");
  });

  test("Tests getting encoded ANSI color sequence indices.", () => {
    let message = colors.red("This") + " is a test.";
    let ansiClrSeqPairs = Logger.getAnsiColorSeqPairs(message);
    message = encodeURI(message);
    let encodedAnsiClrSeqIndices = Logger.getEncodedAnsiClrSeqIndices(message, Array.from(ansiClrSeqPairs.values()));
    let iterator = encodedAnsiClrSeqIndices.values();
    let firstItem = iterator.next().value[0];
    let secondItem = iterator.next().value[0];
    expect(firstItem.beginIndex).toBe(0);
    expect(firstItem.endIndex).toBe(8);
    expect(secondItem.beginIndex).toBe(13);
    expect(secondItem.endIndex).toBe(21);
  });

  test("Tests the adding of line numbers.", () => {
    let message = "This is a test.";
    message = Logger.addLineNumbers(message);
    expect(message).toBe("1: This is a test.");
  });

  test("Tests the division of a message from spaces.", () => {
    let message = "This is a test.";
    let messageElements = Logger.divideMsgFromSpaces(message);
    expect(messageElements.length).toBe(7);
  });

  test("Tests the creation of message elements.", () => {
    let originalMessage = colors.red("This") + " is a " + colors.blue("blue") + " test" + colors.green(".");
    let message = "%1B%5B31mThis%1B%5B39m is a %1B%5B34mblue%1B%5B39m test%1B%5B32m.%1B%5B39m";
    let encodedAnsiClrSeqs = Array.from(Logger.getAnsiColorSeqPairs(originalMessage).values());
    let messageElements = Logger.createMsgElements(message, encodedAnsiClrSeqs);
    expect(messageElements.length).toBe(18);
    expect(messageElements[17]).toBe("%1B%5B39m");
  });

  test("Tests the insertion of new lines into a message fragment.", () => {
    let message = "This is a test.";
    let messageElements = Logger.createMsgElements(message, []);
    let messageElementChars = Array.from(messageElements[0]);
    let currentLineCharLength = messageElementChars.length;
    message = Logger.insertNewLinesIntoMsgElem(messageElements, currentLineCharLength, 5).join("");
    expect(message).toBe("This\n" +
        " is a \n" +
        "test.");
  });

  test("Tests word wrapping a message with existing new line characters.", () => {
    let message = "This is a \ntest. This\n is another test.";
    message = Logger.wordWrap(message, 5);
    expect(message).toBe("This \n" +
        "is a \n" +
        "test.\n" +
        "This\n" +
        " is a\n" +
        "nothe\n" +
        "r \n" +
        "test.");
  });

  test("Tests word wrapping a message without colors.", () => {
    let message = "This is a test. This is another test.";
    message = Logger.wordWrap(message, 5);
    expect(message).toBe("This \n" +
        "is a \n" +
        "test.\n" +
        "This \n" +
        "is an\n" +
        "other\n" +
        "test.");
  });

  test("Tests word wrapping a message with colors.", () => {
    let message = colors.red("This is a test.") + " This is another test.";
    message = Logger.wordWrap(message, 8);
    expect(message).toBe("[31mThis is \n" +
        "a test.[39m \n" +
        "This is \n" +
        "another \n" +
        "test.");
  });

  test("Tests word wrapping a message with colors and existing new line characters.", () => {
    let message = colors.red("This is\n a test.") + " This \nis another test.";
    message = Logger.wordWrap(message, 8);
    expect(message).toBe("[31mThis is[39m\n" +
        "[31m a test.[39m\n" +
        "This \n" +
        "is \n" +
        "another \n" +
        "test.");
  });

  test("Tests the creation of labels.", () => {
    expect(Logger.createLabel(Logger.Level.DEBUG)).toBe(colors.blue(Logger.Level.getName(Logger.Level.DEBUG) + ": "));
    expect(Logger.createLabel(Logger.Level.INFO)).toBe(colors.white(Logger.Level.getName(Logger.Level.INFO) + ": "));
    expect(Logger.createLabel(Logger.Level.WARNING)).toBe(colors.yellow(Logger.Level.getName(Logger.Level.WARNING) + ": "));
    expect(Logger.createLabel(Logger.Level.ERROR)).toBe(colors.bold.red(Logger.Level.getName(Logger.Level.ERROR) + ": "));
    expect(Logger.createLabel(Logger.Level.VERBOSE)).toBe(colors.white(Logger.Level.getName(Logger.Level.VERBOSE) + ": "));
  });

  test("Tests the truncation of the word wrapped message.", () => {
    let largeMessage = `This is a test message. This is a test message. This is a test message. This is a test message.
    This is a test message. This is a test message. This is a test message. This is a test message. This is a test
    message. This is a test message. This is a test message. This is a test message. This is a test message. This is
    a test message. This is a test message. This is a test message. This is a test message. This is a test message.
    This is a test message. This is a test message. This is a test message. This is a test message. This is a test
    message. This is a test message. This is a test message. This is a test message. This is a test message. This is
    a test message. This is a test message. This is a test message. This is a test message. This is a test message.
    This is a test message. This is a test message. This is a test message. This is a test message. This is a test
    message. This is a test message. This is a test message. This is a test message. This is a test message. This is
    a test message. This is a test message. This is a test message. This is a test message. This is a test message.
    This is a test message. This is a test message. This is a test message. This is a test message. This is a test
    message. This is a test message. This is a test message. This is a test message. This is a test message. This is
    a test message. This is a test message. This is a test message. This is a test message. This is a test message.
    This is a test message. This is a test message. This is a test message. This is a test message. This is a test
    message. This is a test message. This is a test message. This is a test message. This is a test message. This is
    a test message. This is a test message. This is a test message. This is a test message. This is a test message.
    This is a test message. This is a test message. This is a test message. This is a test message. This is a test
    message. This is a test message. This is a test message. This is a test message. This is a test message. This is
    a test message. This is a test message. This is a test message. This is a test message. This is a test message.
    This is a test message. This is a test message. This is a test message. This is a test message. This is a test
    message. This is a test message. This is a test message. This is a test message. This is a test message. This is
    a test message. This is a test message. This is a test message. This is a test message. This is a test message.
    This is a test message. This is a test message. This is a test message. This is a test message. This is a test
    message. This is a test message. This is a test message. This is a test message. This is a test message. This is
    a test message. This is a test message. This is a test message. This is a test message. This is a test message.
    This is a test message. This is a test message. This is a test message. This is a test message. This is a test
    message. This is a test message. This is a test message. This is a test message. This is a test message. This is
    a test message. This is a test message. This is a test message. This is a test message. This is a test message.
    This is a test message. This is a test message. This is a test message. This is a test message. This is a test
    message. This is a test message. This is a test message. This is a test message. This is a test message. This is
    a test message. This is a test message. This is a test message. This is a test message. This is a test message.
    This is a test message. This is a test message. This is a test message. This is a test message. This is a test
    message. This is a test message. This is a test message. This is a test message. This is a test message. This is
    a test message. This is a test message. This is a test message. This is a test message. This is a test message.
    This is a test message. This is a test message. This is a test message. This is a test message. This is a test
    message. This is a test message. This is a test message. This is a test message. This is a test message. This is
    a test message. This is a test message. This is a test message.`;

    largeMessage = largeMessage.concat(" " + colors.red("This") + " " + colors.blue("is") + " a test " +
        colors.yellow("message") + ".");
    largeMessage = largeMessage.replace(/\n/g, "");
    largeMessage = largeMessage.replace(/\s+/g, " ");
    let wordWrappedMsg = Logger.wordWrap(largeMessage, 80);
    expect(wordWrappedMsg).toBe("This is a test message. This is a test message. This is a test message. This is \n" +
        "a test message. This is a test message. This is a test message. This is a test \n" +
        "message. This is a test message. This is a test message. This is a test message.\n" +
        "This is a test message. This is a test message. This is a test message. This is \n" +
        "a test message. This is a test message. This is a test message. This is a test \n" +
        "message. This is a test message. This is a test message. This is a test message.\n" +
        "This is a test message. This is a test message. This is a test message. This is \n" +
        "a test message. This is a test message. This is a test message. This is a test \n" +
        "message. This is a test message. This is a test message. This is a test message.\n" +
        "This is a test message. This is a test message. This is a test message. This is \n" +
        "a test message. This is a test message. This is a test message. This is a test \n" +
        "message. This is a test message. This is a test message. This is a test message.\n" +
        "This is a test message. This is a test message. This is a test message. This is \n" +
        "a test message. This is a test message. This is a test message. This is a test \n" +
        "message. This is a test message. This is a test message. This is a test message.\n" +
        "This is a test message. This is a test message. This is a test message. This is \n" +
        "a test message. This is a test message. This is a test message. This is a test \n" +
        "message. This is a test message. This is a test message. This is a test message.\n" +
        "This is a test message. This is a test message. This is a test message. This is \n" +
        "a test message. This is a test message. This is a test message. This is a test \n" +
        "message. This is a test message. This is a test message. This is a test message.\n" +
        "This is a test message. This is a test message. This is a test message. This is \n" +
        "a test message. This is a test message. This is a test message. This is a test \n" +
        "message. This is a test message. This is a test message. This is a test message.\n" +
        "This is a test message. This is a test message. This is a test message. This is \n" +
        "a test message. This is a test message. This is a test message. This is a test \n" +
        "message. This is a test message. This is a test message. This is a test message.\n" +
        "This is a test message. This is a test message. This is a test message. This is \n" +
        "a test message. This is a test message. This is a test message. This is a test \n" +
        "message. This is a test message. This is a test message. This is a test message.\n" +
        "This is a test message. This is a test message. This is a test message. This is \n" +
        "a test message. This is a test message. This is a test message. This is a test \n" +
        "message. This is a test message. This is a test message. This is a test message.\n" +
        "This is a test message. This is a test message. This is a test message. This is \n" +
        "a test message. This is a test message. This is a test message. This is a test \n" +
        "message. This is a test message. This is a test message. This is a test message.\n" +
        "This is a test message. This is a test message. This is a test message. This is \n" +
        "a test message. This is a test message. This is a test message. This is a test \n" +
        "message. This is a test message. This is a test message. This is a test message.\n" +
        "This is a test message. This is a test message. This is a test message. This is \n" +
        "a test message. This is a test message. This is a test message. This is a test \n" +
        "message. This is a test message. This is a test message. This is a test message.\n" +
        "This is a test message. This is a test message. This is a test message. This is \n" +
        "a test message. This is a test message. This is a test message. This is a test \n" +
        "message. This is a test message. This is a test message. This is a test message.\n" +
        "This is a test message. This is a test message. This is a test message. This is \n" +
        "a test message. This is a test message. This is a test message. This is a test \n" +
        "message. This is a test message. This is a test message. This is a test message.\n" +
        "This is a test message. This is a test message. This is a test message. This is \n" +
        "a test message. This is a test message. This is a test message. This is a test \n" +
        "message. This is a test message. This is a test message. This is a test message.\n" +
        "[31mThis[39m [34mis[39m a test [33m[39m");
  });
});
