// imports
const shell = require("shelljs");
const path = require("path");
const fileSystem = require("fs-extra");
const SpellingAssistant = require("../../components/SpellingAssistant");
const OptionsManager = require("../../components/OptionsManager");
const FileSystemHelper = require("../../components/FileSystemHelper");
const IllegalArgumentException = require("../../exceptions/IllegalArgumentException");
const IOException = require("../../exceptions/IOException");

describe("Tests the SpellingAssistant for proper functionality.", () => {
  let directory = "/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp" +
      "/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp" +
      "/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp" +
      "/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp/tmp";
  let fileName = "fileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileName" +
      "fileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileName" +
      "fileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileName" +
      "fileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileName" +
      "fileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileName" +
      "fileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileName" +
      "fileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileName" +
      "fileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileName" +
      "fileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileName" +
      "fileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileName" +
      "fileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileName" +
      "fileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileNamefileName";

  test("Tests invoking the SpellingAssistant constructor an invalid argument.", () => {
    expect(() => {
      new SpellingAssistant().addWordToDictionary("");
    }).toThrow(IllegalArgumentException);
  });

  test("Tests getting misspelled words with an invalid argument.", () => {
    expect(() => {
      new SpellingAssistant(__dirname, OptionsManager.extraDictWordsFilename).getMisspelledWords(10);
    }).toThrow(IllegalArgumentException);
  });

  test("Tests highlighting misspelled words with an invalid argument.", () => {
    expect(() => {
      new SpellingAssistant(__dirname, OptionsManager.extraDictWordsFilename).highlightMisspellings(10, []);
    }).toThrow(IllegalArgumentException);
  });

  test("Tests suggesting correct words for a misspelled word with an invalid argument.", () => {
    expect(() => {
      new SpellingAssistant(__dirname, OptionsManager.extraDictWordsFilename).suggestCorrect(10);
    }).toThrow(IllegalArgumentException);
  });

  test("Tests highlighting corrected words with an invalid argument.", () => {
    expect(() => {
      new SpellingAssistant(__dirname, OptionsManager.extraDictWordsFilename).highlightCorrections(10, []);
    }).toThrow(IllegalArgumentException);
  });

  test("Tests adding and getting invalid word from dictionary.", () => {
    shell.cd("/");
    let randomNumber = Math.floor((Math.random() * 10000) + 1);
    shell.mkdir("-p", "/tmp/temp-" + randomNumber.toString());
    shell.cd(path.join("/tmp", "/temp-" + randomNumber.toString()));
    shell.exec("touch extra-words.txt", { silent: false });
    let spellingAssistant = new SpellingAssistant(__dirname, OptionsManager.extraDictWordsFilename);

    expect(() => {
      spellingAssistant.addWordToDictionary("/tmp/temp-" + randomNumber.toString(), "extra-words.txt", "bigg#!");
    }).toThrow(IllegalArgumentException);

    new FileSystemHelper().writeAsString(path.join("/tmp", "/temp-" + randomNumber.toString()), "extra-words.txt", "bigg#1");

    expect(spellingAssistant.getExtraDictionaryWords("/tmp/temp-" + randomNumber.toString(), "extra-words.txt").length)
        .toBe(0);
    shell.cd("..");
    fileSystem.removeSync(path.join("/tmp", "/temp-" + randomNumber.toString()));
  });

  test("Tests getting extra dictionary words with an invalid argument.", () => {
    expect(() => {
      new SpellingAssistant(__dirname, OptionsManager.extraDictWordsFilename).getExtraDictionaryWords(directory, fileName);
    }).toThrow(IOException);

    expect(() => {
      new SpellingAssistant(__dirname, OptionsManager.extraDictWordsFilename)
          .getExtraDictionaryWords("/tmp", "words#@1.txt");
    }).toThrow(IOException);

    expect(() => {
      new SpellingAssistant(__dirname, OptionsManager.extraDictWordsFilename).getExtraDictionaryWords();
    }).toThrow(IllegalArgumentException);
  });

  test("Tests adding extra word to dictionary with an invalid argument.", () => {
    expect(() => {
      new SpellingAssistant(__dirname, OptionsManager.extraDictWordsFilename).addWordToDictionary();
    }).toThrow(IllegalArgumentException);

    expect(() => {
      new SpellingAssistant(__dirname, OptionsManager.extraDictWordsFilename)
          .addWordToDictionary(directory, fileName, "word");
    }).toThrow(IOException);

    expect(() => {
      new SpellingAssistant(__dirname, OptionsManager.extraDictWordsFilename)
          .addWordToDictionary("/tmp", "words#@1.txt", "word");
    }).toThrow(IOException);
  });
});
