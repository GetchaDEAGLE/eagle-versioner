// imports
const shell = require("shelljs");
const fileSystem = require("fs-extra");
const path = require("path");
const VersioningAgent = require("../../components/VersioningAgent");
const Logger = require("../../components/Logger");
const GitRunner = require("../../components/GitRunner");
const IllegalArgumentException = require("../../exceptions/IllegalArgumentException");
const InvalidGitDataException = require("../../exceptions/InvalidGitDataException");
const VersionFormattingException = require("../../exceptions/VersionFormattingException");

describe("Tests the VersioningAgent for proper functionality.", () => {
  test("Tests extracting a version with an invalid argument.", () => {
    expect(() => {
      new VersioningAgent().extractVersion(10);
    }).toThrow(IllegalArgumentException);
  });

  test("Tests extracting version components with an invalid argument.", () => {
    expect(() => {
      new VersioningAgent().extractVersionComponents(10);
    }).toThrow(IllegalArgumentException);
  });

  test("Tests extracting version components with an invalid version.", () => {
    expect(() => {
      new VersioningAgent().extractVersionComponents("1.0.0.0");
    }).toThrow(VersionFormattingException);
  });

  test("Tests checking if the version is greater using an invalid argument.", () => {
    expect(() => {
      new VersioningAgent().isGreater(10, []);
    }).toThrow(IllegalArgumentException);
  });

  test("Tests checking if versionable commits exist with an invalid argument.", () => {
    expect(() => {
      new VersioningAgent().containsVersionableCommits(new Map());
    }).toThrow(IllegalArgumentException);
  });

  test("Tests calculating the initial development version with an invalid argument.", () => {
    expect(() => {
      new VersioningAgent().calculateInitialDev(10, new Map());
    }).toThrow(IllegalArgumentException);
  });

  test("Tests calculating the regular version with an invalid argument.", () => {
    expect(() => {
      new VersioningAgent().calculateRegular(false, 10, []);
    }).toThrow(IllegalArgumentException);
  });

  test("Tests calculating the regular version with an invalid production version.", () => {
    expect(() => {
      new VersioningAgent().calculateRegular(VersioningAgent.StrategyType.COLLECTIVE, [], "1.0.0.0");
    }).toThrow(VersionFormattingException);
  });

  test("Tests determining the version with an invalid argument.", () => {
    expect(() => {
      new VersioningAgent().determine("invalid", false, 10, []);
    }).toThrow(IllegalArgumentException);
  });

  test("Tests validating the version with an invalid argument.", () => {
    expect(() => {
      new VersioningAgent().isValid(10, 10, [], 10, 10, false);
    }).toThrow(IllegalArgumentException);
  });

  test("Tests filtering commit messages with an invalid argument.", () => {
    expect(() => {
      new VersioningAgent().filterCommitMessages(10);
    }).toThrow(IllegalArgumentException);
  });

  test("Tests applying the dev version appendage with an invalid argument.", () => {
    expect(() => {
      new VersioningAgent().applyDevVersionAppendage(10, [], "");
    }).toThrow(IllegalArgumentException);
  });

  test("Tests calculating the version without any applicable commits.", () => {
    let randomNumber = Math.floor((Math.random() * 10000) + 1);
    shell.mkdir("-p", path.join("/tmp", "/temp-" + randomNumber.toString()));
    shell.cd(path.join("/tmp", "/temp-" + randomNumber.toString()));
    shell.exec("git init", { silent: false });
    shell.exec("touch test1.txt", { silent: false });
    shell.exec("git add test1.txt", { silent: false });
    shell.exec("git commit -m \"" + GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.CHORE) + " did a chore\"",
        { silent: false });

    expect(() => {
      new VersioningAgent().determine(new GitRunner(Logger.OutputType.CONSOLE).getLastProdVersionMap(),
          VersioningAgent.StrategyType.SEQUENTIAL, VersioningAgent.DevVersionAppendageType.SNAPSHOT);
    }).toThrow(InvalidGitDataException);

    shell.cd("..");
    fileSystem.removeSync(path.join("/tmp", "/temp-" + randomNumber.toString()));
  });

  test("Tests calculating the version with an invalid initial commit.", () => {
    let randomNumber = Math.floor((Math.random() * 10000) + 1);
    shell.mkdir("-p", path.join("/tmp", "/temp-" + randomNumber.toString()));
    shell.cd(path.join("/tmp", "/temp-" + randomNumber.toString()));
    shell.exec("git init && git checkout -b master", { silent: false });
    shell.exec("touch 05.txt && git add 05.txt", { silent: false });
    shell.exec("git commit -m \"[INITIAL_COMMIT] [VERSION_CHANGE] 0.1.0.1\"");

    expect(() => {
      new VersioningAgent().determine(new GitRunner(Logger.OutputType.CONSOLE).getLastProdVersionMap(),
          VersioningAgent.StrategyType.SEQUENTIAL, VersioningAgent.DevVersionAppendageType.SNAPSHOT);
    }).toThrow(VersionFormattingException);

    shell.cd("..");
    fileSystem.removeSync(path.join("/tmp", "/temp-" + randomNumber.toString()));
  });
});
