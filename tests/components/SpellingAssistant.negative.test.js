// imports
const SpellingAssistant = require("../../components/SpellingAssistant");
const OptionsManager = require("../../components/OptionsManager");
const IllegalArgumentException = require("../../exceptions/IllegalArgumentException");

describe("Tests the SpellingAssistant for proper functionality.", () => {
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
});
