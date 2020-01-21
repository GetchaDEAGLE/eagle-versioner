// imports
const fileSystem = require("fs-extra");
const path = require("path");
const shell = require("shelljs");
const FileSystemHelper = require("../../components/FileSystemHelper");

describe("Tests the FileSystemHelper for proper functionality.", () => {
  test("Tests if the specified file exists.", () => {
    let fileSystemHelper = new FileSystemHelper();
    expect(fileSystemHelper.getDoesFileExist(path.join(__dirname, "/assets"), "CHANGELOG-PROD.md")).toBe(true);
  });

  test("Tests if the specified file name is valid.", () => {
    expect(new FileSystemHelper().getIsValidFileName("CHANGELOG-PROD.md")).toBe(true);
  });

  test("Tests if the combined file directory and file name are a valid length.", () => {
    let isValidLength = new FileSystemHelper().getIsValidFilePathAndNameCharLength(path.join(__dirname, "/assets"),
      "CHANGELOG-PROD.md");
    expect(isValidLength).toBe(true);
  });

  test("Tests if the file read as a string contains the proper contents.", () => {
    let fileContents = new FileSystemHelper().readAsString(path.join(__dirname, "/assets"), "CHANGELOG-DEV.md");
    expect(fileContents).toBe("# Changelog\n" +
        "\n" +
        "## Non-Versioned Changes\n" +
        "\n" +
        "* [BUG_FIX] fixed a bug\n" +
        "* [BREAKING] [BUG_FIX] fixed a bug\n" +
        "* [BUG_FIX] fixed a bug\n" +
        "\n" +
        "## 2.3.0-latest\n" +
        "\n" +
        "* [FEATURE] added new feature\n" +
        "\n" +
        "## 2.2.6\n" +
        "\n" +
        "* [BUG_FIX] emergency bug fix\n" +
        "\n" +
        "## 2.2.5\n" +
        "\n" +
        "* [PERF] Increased speed\n" +
        "* [BUG_FIX] fixed a bug\n" +
        "* [FEATURE] Added test feature\n" +
        "\n" +
        "## 2.1.3\n" +
        "\n" +
        "* [BUG_FIX] Fixed some problem\n" +
        "\n" +
        "## 2.1.2\n" +
        "\n" +
        "* [FEATURE] Added new feature\n" +
        "* [PERF] Increased query performance\n" +
        "* [BUG_FIX] test bug fix\n" +
        "* [BREAKING] [FEATURE] New feature added\n" +
        "\n" +
        "## 1.0.0\n" +
        "\n" +
        "* [BREAKING] [PERF] Increased performance\n" +
        "* [BUG_FIX] Fixed bug\n" +
        "* [FEATURE] Added test feature.\n");
  });

  test("Tests the writing of a file to the file system.", () => {
    let fileContents = "This is a test.";
    let fileSystemHelper = new FileSystemHelper();
    let randomNumber = Math.floor((Math.random() * 10000) + 1);
    fileSystemHelper.writeAsString(path.join("/tmp", "/temp-" + parseInt(randomNumber, 10)), "test1.txt",
        fileContents);
    expect(fileSystemHelper.readAsString(path.join("/tmp", "/temp-" + parseInt(randomNumber, 10)),
        "test1.txt")).toBe(fileContents);
    fileSystemHelper.writeAsString(path.join("/tmp", "/temp-" + parseInt(randomNumber, 10)), "test2.txt");
    expect(fileSystemHelper.readAsString(path.join("/tmp", "/temp-" + parseInt(randomNumber, 10)),
        "test2.txt")).toBe("");
    fileSystem.removeSync(path.join("/tmp", "/temp-" + parseInt(randomNumber, 10)));
  });

  test("Tests getting the current working directory.", () => {
    shell.cd(path.join(__dirname, "/assets"));
    expect(new FileSystemHelper().getCurrentWorkingDirectory()).toBe(path.join(__dirname, "/assets"));
  });
});
