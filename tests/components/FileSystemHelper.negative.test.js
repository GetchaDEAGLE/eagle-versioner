// imports
const FileSystemHelper = require("../../components/FileSystemHelper");
const IllegalArgumentException = require("../../exceptions/IllegalArgumentException");

describe("Tests the FileSystemHelper for proper functionality.", () => {
  test("Tests if the specified file exists using an invalid argument.", () => {
    let fileSystemHelper = new FileSystemHelper();
    expect(() => {
      fileSystemHelper.getDoesFileExist("", "CHANGELOG-PROD.md");
    }).toThrow(IllegalArgumentException);
  });

  test("Tests if the specified file name is valid using an invalid argument.", () => {
    expect(() => {
      new FileSystemHelper().getIsValidFileName("");
    }).toThrow(IllegalArgumentException);
  });

  test("Tests if the combined file directory and file name are a valid length using an invalid argument.", () => {
    expect(() => {
      new FileSystemHelper().getIsValidFilePathAndNameCharLength("", "CHANGELOG-PROD.md");
    }).toThrow(IllegalArgumentException);
  });

  test("Tests if the file read as a string contains the proper contents using an invalid argument.", () => {
    expect(() => {
      new FileSystemHelper().readAsString("", "CHANGELOG-DEV.md");
    }).toThrow(IllegalArgumentException);
  });

  test("Tests the writing of a file to the file system using an invalid argument.", () => {
    expect(() => {
      new FileSystemHelper().writeAsString("", "test1.txt");
    }).toThrow(IllegalArgumentException);
  });
});
