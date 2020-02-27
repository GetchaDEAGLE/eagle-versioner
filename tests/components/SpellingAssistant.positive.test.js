// imports
const colors = require("ansi-colors");
const SpellingAssistant = require("../../components/SpellingAssistant");
const OptionsManager = require("../../components/OptionsManager");

describe("Tests the SpellingAssistant for proper functionality.", () => {
  let misspelledSentence = "Thiss is a sentence with mispellings.";
  let words = misspelledSentence.split(/(\b[^\s]+\b)/);

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
});
