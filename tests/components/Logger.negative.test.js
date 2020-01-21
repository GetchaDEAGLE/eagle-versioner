// imports
const Logger = require("../../components/Logger");
const IllegalArgumentException = require("../../exceptions/IllegalArgumentException");

describe("Tests the Logger for proper functionality.", () => {
  test("Tests setting the current line count with an invalid argument.", () => {
    expect(() => {
      Logger.currentLineCount = "invalid";
    }).toThrow(IllegalArgumentException);
  });

  test("Tests setting the current logging level with an invalid argument.", () => {
    expect(() => {
      Logger.currentLoggingLevel = "invalid";
    }).toThrow(IllegalArgumentException);
  });

  test("Tests checking the logging level with an invalid argument.", () => {
    expect(() => {
      Logger.isValidLoggingLevel(10);
    }).toThrow(IllegalArgumentException);
  });

  test("Tests decoding ANSI color sequences with an invalid argument.", () => {
    expect(() => {
      Logger.decodeAnsiColorSequences(10, []);
    }).toThrow(IllegalArgumentException);
  });

  test("Tests getting ANSI color sequence pairs with an invalid argument.", () => {
    expect(() => {
      Logger.getAnsiColorSeqPairs(10);
    }).toThrow(IllegalArgumentException);
  });

  test("Tests getting encoded ANSI color sequence indices with an invalid argument.", () => {
    expect(() => {
      Logger.getEncodedAnsiClrSeqIndices(10, "invalid");
    }).toThrow(IllegalArgumentException);
  });

  test("Tests adding line numbers with an invalid argument.", () => {
    expect(() => {
      Logger.addLineNumbers(10);
    }).toThrow(IllegalArgumentException);
  });

  test("Tests dividing message from spaces with an invalid argument.", () => {
    expect(() => {
      Logger.divideMsgFromSpaces(10);
    }).toThrow(IllegalArgumentException);
  });

  test("Tests dividing message from encoded ANSI color sequences with an invalid argument.", () => {
    expect(() => {
      Logger.divideMsgFromEncAnsiClrSeqs(10, new Map());
    }).toThrow(IllegalArgumentException);
  });

  test("Tests trimming message elements with an invalid argument.", () => {
    expect(() => {
      Logger.trimMsgElements("invalid", 10, false);
    }).toThrow(IllegalArgumentException);
  });

  test("Tests creating message elements with an invalid argument.", () => {
    expect(() => {
      Logger.createMsgElements(10, new Map());
    }).toThrow(IllegalArgumentException);
  });

  test("Tests inserting new lines into message element with an invalid argument.", () => {
    expect(() => {
      Logger.insertNewLinesIntoMsgElem(10, [], false);
    }).toThrow(IllegalArgumentException);
  });

  test("Tests word wrapping with an invalid argument.", () => {
    expect(() => {
      Logger.wordWrap(10, false);
    }).toThrow(IllegalArgumentException);
  });

  test("Tests creating a label with an invalid argument.", () => {
    expect(() => {
      Logger.createLabel(false);
    }).toThrow(IllegalArgumentException);
  });

  test("Tests an echo with an invalid argument.", () => {
    expect(() => {
      Logger.echo(10, false, 10);
    }).toThrow(IllegalArgumentException);
  });

  test("Tests publishing with an invalid argument.", () => {
    expect(() => {
      Logger.publish([]);
    }).toThrow(IllegalArgumentException);
  });
});
