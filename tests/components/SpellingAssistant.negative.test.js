// imports
const SpellingAssistant = require("../../components/SpellingAssistant");
const IllegalArgumentException = require("../../exceptions/IllegalArgumentException");

describe("Tests the SpellingAssistant for proper functionality.", () => {
  test("Tests getting misspelled words with an invalid argument.", () => {
    expect(() => {
      new SpellingAssistant().getMisspelledWords(10);
    }).toThrow(IllegalArgumentException);
  });

  test("Tests highlighting misspelled words with an invalid argument.", () => {
    expect(() => {
      new SpellingAssistant().highlightMisspellings(10, []);
    }).toThrow(IllegalArgumentException);
  });

  test("Tests suggesting correct words for a misspelled word with an invalid argument.", () => {
    expect(() => {
      new SpellingAssistant().suggestCorrect(10);
    }).toThrow(IllegalArgumentException);
  });

  test("Tests highlighting corrected words with an invalid argument.", () => {
    expect(() => {
      new SpellingAssistant().highlightCorrections(10, []);
    }).toThrow(IllegalArgumentException);
  });
});
