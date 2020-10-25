// imports
const AdmZip = require("adm-zip");
const fileSystem = require("fs-extra");
const shell = require("shelljs");
const path = require("path");
const OptionsManager = require("../../components/OptionsManager");
const VersioningAgent = require("../../components/VersioningAgent");
const GitRunner = require("../../components/GitRunner");
const Logger = require("../../components/Logger");
const InvalidGitDataException = require("../../exceptions/InvalidGitDataException");
const InvalidOptionException = require("../../exceptions/InvalidOptionException");
const InvalidVersionException = require("../../exceptions/InvalidVersionException");

describe("Tests the OptionsManager for proper functionality.", () => {
  let testRepoZip = new AdmZip(path.join(__dirname, "/assets/test-repo.zip"));

  test("Tests getting the settings folder name.", () => {
    expect(OptionsManager.settingsFolderName).toBe(".ev");
  });

  test("Tests setting the logging level.", () => {
    new OptionsManager().applyLoggingLevelTarget(Logger.Level.getName(Logger.Level.VERBOSE));
    expect(Logger.currentLoggingLevel).toBe(Logger.Level.VERBOSE);
  });

  test("Tests validating the production branch name.", () => {
    const validateProdBranchName = () => {
      new OptionsManager().validateProdBranchName("master");
    };

    expect(validateProdBranchName).not.toThrow(InvalidGitDataException);
  });

  test("Tests validating the strategy type.", () => {
    const validateStrategyType = () => {
      new OptionsManager()
          .validateStrategyType(VersioningAgent.StrategyType.getName(VersioningAgent.StrategyType.SEQUENTIAL));
    };

    expect(validateStrategyType).not.toThrow(InvalidOptionException);
  });

  test("Tests validating the dev version appendage type.", () => {
    const validateDevVersionAppendageType = () => {
      new OptionsManager().validateDevVersionAppendageType(
          VersioningAgent.DevVersionAppendageType.getName(VersioningAgent.DevVersionAppendageType.SNAPSHOT)
      );
    };

    expect(validateDevVersionAppendageType).not.toThrow(InvalidOptionException);
  });

  test("Tests validating the change type.", () => {
    const validateChangeType = () => {
      new OptionsManager().validateChangeType(
          GitRunner.ChangeType.getName(GitRunner.ChangeType.VERSION_CHANGE)
      );
    };

    expect(validateChangeType).not.toThrow(InvalidOptionException);
  });

  test("Tests validating the proposed version.", () => {
    let randomNumber = Math.floor((Math.random() * 10000) + 1);
    testRepoZip.extractAllTo(path.join("/tmp", "/temp-" + randomNumber.toString()), false);
    shell.cd(path.join("/tmp", "/temp-" + randomNumber.toString()));
    shell.exec("git checkout master", { silent: false });

    let options = {};

    const validateProposedVersion = () => {
      new OptionsManager().validateProposedVersion(options);
    };

    options = {
      newVersion: "3.0.2",
      isInitialCommit: false,
      strategy: "sequential",
      devAppendage: "snapshot",
      prodBranch: "master"
    };

    expect(validateProposedVersion).not.toThrow(InvalidVersionException);

    options = {
      newVersion: "1.0.2",
      isInitialCommit: true,
      strategy: "sequential",
      devAppendage: "snapshot",
      prodBranch: "master"
    };

    expect(validateProposedVersion).not.toThrow(InvalidVersionException);

    shell.exec("git checkout latest", { silent: false });

    expect(validateProposedVersion).not.toThrow(InvalidVersionException);

    shell.cd("..");
    fileSystem.removeSync(path.join("/tmp", "/temp-" + randomNumber.toString()));
  });

  test("Tests validating commit messages.", () => {
    let shortCommitMsg = "[BUG_FIX] Fixed a Horrible Bug";
    let longCommitMsg = "This bug fix prevented the disruption of the space-time continuum.";

    const validateCommitMessages = () => {
      new OptionsManager().validateCommitMessages(shortCommitMsg, longCommitMsg);
    };

    expect(validateCommitMessages).not.toThrow(InvalidGitDataException);

    shortCommitMsg = "This is a test. This is a test. This is a test. This is a test. This is a test. " +
        "This is a test. This is a test. This is a test. This is a test. This is a test. This is a test.";

    expect(validateCommitMessages).not.toThrow(InvalidGitDataException);

    longCommitMsg = "This is a test. This is a test. This is a test. This is a test. This is a test. " +
        "This is a test. This is a test. This is a test. This is a test. This is a test. This is a test." +
        "This is a test. This is a test. This is a test. This is a test. This is a test. This is a test." +
        "This is a test. This is a test. This is a test. This is a test. This is a test. This is a test." +
        "This is a test. This is a test. This is a test. This is a test. This is a test. This is a test." +
        "This is a test. This is a test. This is a test. This is a test. This is a test. This is a test." +
        "This is a test. This is a test. This is a test. This is a test. This is a test. This is a test." +
        "This is a test. This is a test. This is a test. This is a test. This is a test. This is a test." +
        "This is a test. This is a test. This is a test. This is a test. This is a test. This is a test." +
        "This is a test. This is a test. This is a test. This is a test. This is a test. This is a test.";

    expect(validateCommitMessages).not.toThrow(InvalidGitDataException);
  });

  test("Tests validating the state of branch will work for an initial commit.", () => {
    const validateInitialCommit = () => {
      new OptionsManager().validateInitialCommit(new GitRunner(Logger.OutputType.SHELL).getCurrentBranchName());
    };

    let randomNumber = Math.floor((Math.random() * 10000) + 1);
    shell.exec("mkdir " + path.join("/tmp", "/temp-" + randomNumber.toString()), { silent: false });
    shell.cd(path.join("/tmp", "/temp-" + randomNumber.toString()));
    shell.exec("git init", { silent: false });
    shell.exec("git checkout -b master", { silent: false });

    expect(validateInitialCommit).not.toThrow(InvalidGitDataException);

    shell.cd("..");
    fileSystem.removeSync(path.join("/tmp", "/temp-" + randomNumber.toString()));
  });

  test("Tests setting options.", () => {
    let randomNumber = Math.floor((Math.random() * 10000) + 1);
    testRepoZip.extractAllTo(path.join("/tmp", "/temp-" + randomNumber.toString()), false);
    shell.cd(path.join("/tmp", "/temp-" + randomNumber.toString()));
    shell.exec("git checkout master", { silent: false });

    let options = {
      loggingLevel: "verbose",
      prodBranch: "master",
      strategy: "sequential",
      devAppendage: "snapshot"
    };

    const setOptions = () => {
      new OptionsManager().set(options);
    };

    expect(setOptions).not.toThrow(InvalidOptionException);

    options = {
      prodBranch: "master",
      strategy: "sequential",
      devAppendage: "snapshot"
    };

    expect(setOptions).not.toThrow(InvalidOptionException);

    options = {
      prodBranch: "master",
      strategy: "sequential",
      devAppendage: "snapshot",
      manual: true,
      isBreaking: true,
      insertSkipCiTag: true
    };

    expect(setOptions).not.toThrow(InvalidOptionException);

    options = {
      prodBranch: "master",
      devAppendage: "snapshot",
      manual: true,
      isBreaking: true,
      insertSkipCiTag: true,
      isInitialCommit: true
    };

    expect(setOptions).not.toThrow(InvalidOptionException);

    options = {
      devAppendage: "snapshot",
      manual: true,
      changeType: "bug_fix",
      isBreaking: true,
      insertSkipCiTag: true,
      isInitialCommit: true,
      shortMsg: "This is a test",
      longMsg: "This is a test. This is a test. This is a test"
    };

    expect(setOptions).not.toThrow(InvalidOptionException);

    options = {
      changelogDirectory: "/tmp",
      changelogFilename: "CHANGELOG.md"
    };

    expect(setOptions).not.toThrow(InvalidOptionException);

    options = {
      manual: true,
      newVersion: "3.3.3",
      changeType: "version_change"
    };

    expect(setOptions).not.toThrow(InvalidOptionException);

    options = {
      manual: true,
      changeType: "bug_fix",
      shortMsg: "This is a test",
      longMsg: "This is a test. This is a test. This is a test"
    };

    expect(setOptions).not.toThrow(InvalidOptionException);

    shell.cd("..");
    fileSystem.removeSync(path.join("/tmp", "/temp-" + randomNumber.toString()));
  });
});
