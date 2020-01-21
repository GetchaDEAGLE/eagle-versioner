// imports
const ChangelogCreator = require("../../components/ChangelogCreator");
const IllegalArgumentException = require("../../exceptions/IllegalArgumentException");
const IOException = require("../../exceptions/IOException");

describe("Tests the ChangelogCreator for proper functionality.", () => {
  test("Tests the reading of a changelog file using an invalid argument.", () => {
    expect(() => {
      new ChangelogCreator().read("", "CHANGELOG-PROD.md");
    }).toThrow(IllegalArgumentException);
  });

  test("Tests the reading of a changelog file using an argument with invalid characters.", () => {
    expect(() => {
      new ChangelogCreator().read(__dirname, "CHANGELOG-PROD$|.md");
    }).toThrow(IOException);
  });

  test("Tests the reading of a changelog file using an argument with too many characters.", () => {
    expect(() => {
      new ChangelogCreator().read(__dirname, "This is a sentence that contains too many characters. " +
          "This is a sentence that contains too many characters. This is a sentence that contains too many characters. " +
          "This is a sentence that contains too many characters. This is a sentence that contains too many characters. " +
          "This is a sentence that contains too many characters. This is a sentence that contains too many characters.");
    }).toThrow(IOException);
  });

  test("Tests assembling additions to the changelog while in production branch and latest version is for production " +
      "using an invalid argument.", () => {
    expect(() => {
      new ChangelogCreator().assembleAdditions("invalid", "master", "master");
    }).toThrow(IllegalArgumentException);
  });

  test("Tests getting the last version found in the changelog using an invalid argument.", () => {
    expect(() => {
      new ChangelogCreator().getLastVersion("");
    }).toThrow(IllegalArgumentException);
  });

  test("Tests the creation of the changelog using an invalid argument.", () => {
    expect(() => {
      new ChangelogCreator().generate("", "changelog.md");
    }).toThrow(IllegalArgumentException);
  });
});
