// imports
const shell = require("shelljs");
const path = require("path");
const fileSystem = require("fs-extra");
const colors = require("ansi-colors");
const SpellingAssistant = require("../../components/SpellingAssistant");
const OptionsManager = require("../../components/OptionsManager");
const FileSystemHelper = require("../../components/FileSystemHelper");

describe("Tests the SpellingAssistant for proper functionality.", () => {
  let misspelledSentence = "Thiss is a sentence with mispellings.";
  let words = misspelledSentence.split(/(\b[^\s]+\b)/);

  test("Tests getting the regular word regex.", () => {
    expect(SpellingAssistant.regularWordRegex instanceof RegExp).toBe(true);
  });

  test("Tests getting the dictionary entry regex.", () => {
    expect(SpellingAssistant.dictionaryEntryRegex instanceof RegExp).toBe(true);
  });

  test("Tests getting the maximum spelling correction character length.", () => {
    expect(typeof SpellingAssistant.maxSpellingCorrectionCharLength).toBe("number");
  });

  test("Tests getting misspelled words from a list of words.", () => {
    let mispelledWordsMap =
        new SpellingAssistant(__dirname, OptionsManager.extraDictWordsFilename).getMisspelledWords(words);
    expect(mispelledWordsMap.size).toBe(2);
  });

  test("Tests getting the suggested words for a misspelling.", () => {
    let suggestedWords =
        new SpellingAssistant(__dirname, OptionsManager.extraDictWordsFilename).suggestCorrect("Thiss");
    expect(suggestedWords.length).toBe(3);
    expect(suggestedWords[0]).toBe("This");
  });

  test("Tests highlighting misspelled words.", () => {
    let spellingAssistant = new SpellingAssistant(__dirname, OptionsManager.extraDictWordsFilename);
    let mispelledWordsMap = spellingAssistant.getMisspelledWords(words);
    let sentenceWithHighlights = spellingAssistant.highlightMisspellings(words, mispelledWordsMap);
    expect(sentenceWithHighlights).toBe(colors.red("Thiss") + " is a sentence with " + colors.red("mispellings") +
        ".");
  });

  test("Tests highlighting corrected words.", () => {
    let spellingAssistant = new SpellingAssistant(__dirname, OptionsManager.extraDictWordsFilename);
    let correctedWordsMap = new Map();
    correctedWordsMap.set(1, "This");
    correctedWordsMap.set(11, "misspellings");
    let sentenceWithHighlights = spellingAssistant.highlightCorrections(words, correctedWordsMap);
    expect(sentenceWithHighlights).toBe(colors.blue("This") + " is a sentence with " + colors.blue("misspellings") +
      ".");
  });

  test("Tests adding and getting words from dictionary.", () => {
    shell.cd("/");
    let randomNumber = Math.floor((Math.random() * 10000) + 1);
    shell.mkdir("-p", "/tmp/temp-" + randomNumber.toString());
    shell.cd(path.join("/tmp", "/temp-" + randomNumber.toString()));
    shell.exec("touch extra-words.txt", { silent: false });
    let spellingAssistant = new SpellingAssistant(__dirname, OptionsManager.extraDictWordsFilename);
    spellingAssistant.addWordToDictionary("/tmp/temp-" + randomNumber.toString(), "extra-words.txt", "talll");
    spellingAssistant.addWordToDictionary("/tmp/temp-" + randomNumber.toString(), "extra-words.txt", "bigg");
    expect(new FileSystemHelper().readAsString("/tmp/temp-" + randomNumber.toString(), "extra-words.txt"))
        .toBe("talll\nbigg\n");
    expect(spellingAssistant.getExtraDictionaryWords("/tmp/temp-" + randomNumber.toString(), "extra-words.txt")[0])
        .toBe("talll");
    expect(spellingAssistant.getExtraDictionaryWords("/tmp/temp-" + randomNumber.toString(), "extra-words.txt")[1])
        .toBe("bigg");
    spellingAssistant.addWordToDictionary("/tmp/temp-" + randomNumber.toString(), "extra-words2.txt", "bigg");
    expect(spellingAssistant.getExtraDictionaryWords("/tmp/temp-" + randomNumber.toString(), "extra-words2.txt")[0])
        .toBe("bigg");
    shell.cd("..");
    fileSystem.removeSync(path.join("/tmp", "/temp-" + randomNumber.toString()));
  });
});
