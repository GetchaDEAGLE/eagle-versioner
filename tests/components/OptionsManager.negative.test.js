// imports
const AdmZip = require("adm-zip");
const fileSystem = require("fs-extra");
const shell = require("shelljs");
const path = require("path");
const OptionsManager = require("../../components/OptionsManager");
const InvalidGitDataException = require("../../exceptions/InvalidGitDataException");
const InvalidOptionException = require("../../exceptions/InvalidOptionException");
const IllegalArgumentException = require("../../exceptions/IllegalArgumentException");
const VersionFormattingException = require("../../exceptions/VersionFormattingException");

describe("Tests the OptionsManager for proper functionality.", () => {
  test("Tests applying the logging level target with an invalid argument.", () => {
    expect(() => {
      new OptionsManager().applyLoggingLevelTarget(10);
    }).toThrow(IllegalArgumentException);

    expect(() => {
      new OptionsManager().applyLoggingLevelTarget("invalid");
    }).toThrow(InvalidOptionException);
    expect(() => {
      new OptionsManager().applyLoggingLevelTarget(" ");
    }).toThrow(InvalidOptionException);
    expect(() => {
      new OptionsManager().applyLoggingLevelTarget("Invalid Level");
    }).toThrow(InvalidOptionException);
  });

  test("Tests validating the prod branch with an invalid argument.", () => {
    expect(() => {
      new OptionsManager().validateProdBranchName(10);
    }).toThrow(IllegalArgumentException);
    expect(() => {
      new OptionsManager().validateProdBranchName(" ");
    }).toThrow(InvalidGitDataException);
    expect(() => {
      new OptionsManager().validateProdBranchName("Invalid Branch");
    }).toThrow(InvalidGitDataException);
    expect(() => {
      new OptionsManager().validateProdBranchName("Invalid Branch$#$@$)(@*!");
    }).toThrow(InvalidGitDataException);
    expect(() => {
      new OptionsManager().validateProdBranchName("Way Too Long Way Too Long " +
        "Way Too Long Way Too Long Way Too Long Way Too Long Way Too Long Way Too Long Way Too Long");
    }).toThrow(InvalidGitDataException);
  });

  test("Tests validating the strategy type with an invalid argument.", () => {
    expect(() => {
      new OptionsManager().validateStrategyType(10);
    }).toThrow(IllegalArgumentException);
    expect(() => {
      new OptionsManager().validateStrategyType(" ");
    }).toThrow(InvalidOptionException);
    expect(() => {
      new OptionsManager().validateStrategyType("Invalid Strategy");
    }).toThrow(InvalidOptionException);
    expect(() => {
      new OptionsManager().validateStrategyType("invalid");
    }).toThrow(InvalidOptionException);
  });

  test("Tests validating the dev version appendage type with an invalid argument.", () => {
    expect(() => {
      new OptionsManager().validateDevVersionAppendageType(10);
    }).toThrow(IllegalArgumentException);
    expect(() => {
      new OptionsManager().validateDevVersionAppendageType(" ");
    }).toThrow(InvalidOptionException);
    expect(() => {
      new OptionsManager().validateDevVersionAppendageType("Invalid Appendage");
    }).toThrow(InvalidOptionException);
    expect(() => {
      new OptionsManager().validateDevVersionAppendageType("invalid");
    }).toThrow(InvalidOptionException);
  });

  test("Tests validating the change type with an invalid argument.", () => {
    expect(() => {
      new OptionsManager().validateChangeType(10);
    }).toThrow(IllegalArgumentException);
    expect(() => {
      new OptionsManager().validateChangeType(" ");
    }).toThrow(InvalidOptionException);
    expect(() => {
      new OptionsManager().validateChangeType("Invalid Change");
    }).toThrow(InvalidOptionException);
    expect(() => {
      new OptionsManager().validateChangeType("invalid");
    }).toThrow(InvalidOptionException);
  });

  test("Tests validating the proposed version with an invalid argument.", () => {
    let testRepoZip = new AdmZip(path.join(__dirname, "/assets/test-repo.zip"));
    let randomNumber = Math.floor((Math.random() * 10000) + 1);
    testRepoZip.extractAllTo(path.join("/tmp", "/temp-" + randomNumber.toString()), false);
    shell.cd(path.join("/tmp", "/temp-" + randomNumber.toString()));
    shell.exec("git checkout master", { silent: false });

    expect(() => {
      new OptionsManager().validateProposedVersion(10);
    }).toThrow(IllegalArgumentException);

    expect(() => {
      new OptionsManager().validateProposedVersion("test");
    }).toThrow(IllegalArgumentException);

    expect(() => {
      new OptionsManager()
          .validateProposedVersion({ strategy: "sequential", devAppendage: "snapshot", newVersion: "1.1.1.1" });
    }).toThrow(IllegalArgumentException);

    expect(() => {
      new OptionsManager()
          .validateProposedVersion({ strategy: "sequential", devAppendage: "snapshot", newVersion: " " });
    }).toThrow(VersionFormattingException);

    expect(() => {
      new OptionsManager()
          .validateProposedVersion({ strategy: "sequential", devAppendage: "snapshot", newVersion: "1 1" });
    }).toThrow(VersionFormattingException);

    shell.cd("..");
    fileSystem.removeSync(path.join("/tmp", "/temp-" + randomNumber.toString()));
  });

  test("Tests validating the commit messages with an invalid argument.", () => {
    expect(() => {
      new OptionsManager().validateCommitMessages(10, 20);
    }).toThrow(IllegalArgumentException);
    expect(() => {
      new OptionsManager().validateCommitMessages(" ", " ");
    }).toThrow(InvalidGitDataException);
    expect(() => {
      new OptionsManager().validateCommitMessages("This is a test", " ");
    }).toThrow(InvalidGitDataException);
  });

  test("Tests validating the that the state of the branch will work for an initial commit with an invalid argument.", () => {
    expect(() => {
      new OptionsManager().validateInitialCommit();
    }).toThrow(IllegalArgumentException);
  });

  test("Tests setting options using an invalid argument.", () => {
    expect(() => {
      new OptionsManager().set("test");
    }).toThrow(IllegalArgumentException);
  });
});
