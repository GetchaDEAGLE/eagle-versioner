// imports
const AdmZip = require("adm-zip");
const fileSystem = require("fs-extra");
const path = require("path");
const shell = require("shelljs");
const Logger = require("../../components/Logger");
const GitRunner = require("../../components/GitRunner");
const VersioningAgent = require("../../components/VersioningAgent");

describe("Tests the VersioningAgent for proper functionality.", () => {
  let versioningAgent = new VersioningAgent();
  let gitRunner = new GitRunner(Logger.OutputType.CONSOLE);
  let testRepoZip = new AdmZip(path.join(__dirname, "/assets/test-repo.zip"));

  test("Tests extracting the version from a version change commit message with a commit containing the [ci-skip] tag.",
      () => {
    let extractedVersion = new VersioningAgent().extractVersion(GitRunner.ciSkipTag + " " +
        GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.VERSION_CHANGE) + " 4.4.4");
    expect(extractedVersion).toBe("4.4.4");
  });

  test("Tests extracting the version from a version change commit message without a commit containing the [ci-skip] tag.",
      () => {
    let extractedVersion =
        new VersioningAgent().extractVersion(GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.VERSION_CHANGE) +
        " 4.4.4");
    expect(extractedVersion).toBe("4.4.4");
  });

  test("Tests extracting version components from the specified production version.", () => {
    let versionComponents = new VersioningAgent().extractVersionComponents("4.4.4");
    expect(versionComponents.length).toBe(3);
  });

  test("Tests extracting version components from the specified development version.", () => {
    let versionComponents = new VersioningAgent().extractVersionComponents("4.4.4-latest");
    expect(versionComponents.length).toBe(4);
  });

  test("Tests if version a is greater than version b.", () => {
    expect(new VersioningAgent().isGreater("4.4.4", "4.4.4-latest")).toBe(true);
  });

  test("Tests if a list of commit messages has contents that are versionable.", () => {
    expect(new VersioningAgent().containsVersionableCommits(
        [GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.BUG_FIX) + " fixed a bug"]
    )).toBe(true);
  });

  test("Tests the calculation of the initial dev version.", () => {
    let randomNumber = Math.floor((Math.random() * 10000) + 1);
    testRepoZip.extractAllTo(path.join("/tmp", "/temp-" + randomNumber.toString()), false);
    shell.cd(path.join("/tmp", "/temp-" + randomNumber.toString()));
    shell.exec("git checkout latest", { silent: false });
    let initialDevVerChangeCommitShas = gitRunner.getInitialDevVerChangeCommitShas();
    let commitMessageHistory = gitRunner.getCommitMsgHistory("", true);

    // The expected version doesn't include the branch name since that is done in the VersioningAgent's determine method.
    // In addition, the branch containing the commits used for this test only has two initial development versions
    // recorded. The other version types are ignored by design which means the correct answer is given here regardless of
    // whether it contains non-initial development version change commits.
    expect(new VersioningAgent().calculateInitialDev(initialDevVerChangeCommitShas, commitMessageHistory)).toBe("0.3.0");

    shell.cd("..");
    fileSystem.removeSync(path.join("/tmp", "/temp-" + randomNumber.toString()));
  });

  test("Tests the calculation of the version with a commit containing a breaking change.", () => {
    let commitMessageHistory = [GitRunner.breakingChangeTag + " " +
      GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.FEATURE) + "Added a cool feature",
      GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.BUG_FIX) + " Fixed a bug"];
    expect(new VersioningAgent().calculateRegular(VersioningAgent.StrategyType.SEQUENTIAL, commitMessageHistory,
        "1.0.0")).toBe("2.0.1");
  });

  test("Tests the calculation of the version in the development branch using the sequential and collective strategies.",
      () => {
    let randomNumber = Math.floor((Math.random() * 10000) + 1);
        testRepoZip.extractAllTo(path.join("/tmp", "/temp-" + randomNumber.toString()), false);
        shell.cd(path.join("/tmp", "/temp-" + randomNumber.toString()));
    shell.exec("git checkout latest", { silent: false });
    let calculatedVersion = versioningAgent.determine(gitRunner.getLastProdVersionMap(),
        VersioningAgent.StrategyType.SEQUENTIAL, VersioningAgent.DevVersionAppendageType.SNAPSHOT);
    expect(calculatedVersion).toBe("4.0.0-SNAPSHOT");
    shell.exec("touch test33.txt", { silent: false });
    shell.exec("git add .", { silent: false });
    shell.exec("git commit -m \"" + GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.BUG_FIX) + " fixed a bug\"",
        { silent: false });
    shell.exec("touch test34.txt", { silent: false });
    shell.exec("git add .", { silent: false });
    shell.exec("git commit -m \"" + GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.BUG_FIX) + " fixed a bug\"",
        { silent: false });
    shell.exec("touch test35.txt", { silent: false });
    shell.exec("git add .", { silent: false });
    shell.exec("git commit -m \"" + GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.PERF) + " increased performance\"",
        { silent: false });
    calculatedVersion = versioningAgent.determine(gitRunner.getLastProdVersionMap(),
        VersioningAgent.StrategyType.COLLECTIVE, VersioningAgent.DevVersionAppendageType.BRANCH_NAME);
    expect(calculatedVersion).toBe("4.0.1-latest");
    calculatedVersion = versioningAgent.determine(gitRunner.getLastProdVersionMap(),
        VersioningAgent.StrategyType.SEQUENTIAL, VersioningAgent.DevVersionAppendageType.BRANCH_NAME);
    expect(calculatedVersion).toBe("4.0.3-latest");
    shell.cd("..");
    fileSystem.removeSync(path.join("/tmp", "/temp-" + randomNumber.toString()));
  });

  test("Tests the calculation of the version in the production branch using the sequential and collective strategies.",
      () => {
    let randomNumber = Math.floor((Math.random() * 10000) + 1);
        testRepoZip.extractAllTo(path.join("/tmp", "/temp-" + randomNumber.toString()), false);
        shell.cd(path.join("/tmp", "/temp-" + randomNumber.toString()));
    shell.exec("git checkout master", { silent: false });
    let calculatedVersion = versioningAgent.determine(gitRunner.getLastProdVersionMap(),
        VersioningAgent.StrategyType.SEQUENTIAL, VersioningAgent.DevVersionAppendageType.BRANCH_NAME);
    expect(calculatedVersion).toBe("3.0.1");
    shell.exec("touch test34.txt", { silent: false });
    shell.exec("git add .", { silent: false });
    shell.exec("git commit -m \"" + GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.BUG_FIX) + " fixed a bug\"",
        { silent: false });
    shell.exec("touch test34.txt", { silent: false });
    shell.exec("git add .", { silent: false });
    shell.exec("git commit -m \"" + GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.BUG_FIX) + " fixed a bug\"",
        { silent: false });
    shell.exec("touch test35.txt", { silent: false });
    shell.exec("git add .", { silent: false });
    shell.exec("git commit -m \"" + GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.PERF) + " increased performance\"",
        { silent: false });
    calculatedVersion = versioningAgent.determine(gitRunner.getLastProdVersionMap(),
        VersioningAgent.StrategyType.COLLECTIVE, VersioningAgent.DevVersionAppendageType.BRANCH_NAME);
    expect(calculatedVersion).toBe("3.0.2");
    calculatedVersion = versioningAgent.determine(gitRunner.getLastProdVersionMap(),
        VersioningAgent.StrategyType.SEQUENTIAL, VersioningAgent.DevVersionAppendageType.BRANCH_NAME);
    expect(calculatedVersion).toBe("3.0.3");
    shell.exec("touch test36.txt", { silent: false });
    shell.exec("git add .", { silent: false });
    shell.exec("git commit -m \"" + GitRunner.breakingChangeTag + " " +
        GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.PERF) + " increased performance\"", { silent: false });
    calculatedVersion = versioningAgent.determine(gitRunner.getLastProdVersionMap(),
        VersioningAgent.StrategyType.COLLECTIVE, VersioningAgent.DevVersionAppendageType.BRANCH_NAME);
    expect(calculatedVersion).toBe("4.0.0");
    shell.exec("touch test37.txt", { silent: false });
    shell.exec("git add .", { silent: false });
    shell.exec("git commit -m \"" + GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.FEATURE) + " added new feature\"",
        { silent: false });
    calculatedVersion = versioningAgent.determine(gitRunner.getLastProdVersionMap(),
        VersioningAgent.StrategyType.SEQUENTIAL, VersioningAgent.DevVersionAppendageType.BRANCH_NAME);
    expect(calculatedVersion).toBe("4.1.0");
    shell.exec("touch test38.txt", { silent: false });
    shell.exec("git add .", { silent: false });
    shell.exec("git commit -m \"" + GitRunner.getChangeTypeAsTag(GitRunner.ChangeType.FEATURE) + " added new feature\"",
        { silent: false });
    calculatedVersion = versioningAgent.determine(gitRunner.getLastProdVersionMap(),
        VersioningAgent.StrategyType.COLLECTIVE, VersioningAgent.DevVersionAppendageType.BRANCH_NAME);
    expect(calculatedVersion).toBe("4.1.0");
    shell.cd("..");
    fileSystem.removeSync(path.join("/tmp", "/temp-" + randomNumber.toString()));
  });

  test("Tests getting the starting initial development version.", () => {
    expect(VersioningAgent.initialDevVersionRegex.test(VersioningAgent.startingInitialDevVersion + "-latest")).toBe(true);
  });

  test("Tests getting the starting production version.", () => {
    expect(VersioningAgent.prodVersionRegex.test(VersioningAgent.startingProdVersion)).toBe(true);
  });

  test("Tests getting and testing the dev version REGEX.", () => {
    expect(VersioningAgent.devVersionRegex.test("1.1.2-latest")).toBe(true);
  });

  test("Tests if the specified versions are greater than the other versions.", () => {
    expect(new VersioningAgent().isGreater("4.0.0", "4.0.0-latest")).toBe(true);
    expect(new VersioningAgent().isGreater("4.1.0-latest", "4.0.1")).toBe(true);
    expect(new VersioningAgent().isGreater("4.1.1", "4.1.0")).toBe(true);
    expect(new VersioningAgent().isGreater("4.1.0", "4.0.1")).toBe(true);
    expect(new VersioningAgent().isGreater("4.0.1", "4.0.0")).toBe(true);
    expect(new VersioningAgent().isGreater("4.0.2", "4.0.1")).toBe(true);
    expect(new VersioningAgent().isGreater("1.10.0-SNAPSHOT", "1.9.0")).toBe(true);
    expect(new VersioningAgent().isGreater("4.0.5", "4.0.0-latest")).toBe(true);
  });

  test("Tests if the proposed version is valid.", () => {
    expect(new VersioningAgent().isValid("1.0.0", "1.0.0", "1.0.1",
        "master", "master", Logger.OutputType.CONSOLE)).toBe(false);
    expect(new VersioningAgent().isValid("1.0.5", "1.0.0", "1.0.1",
        "master", "master", Logger.OutputType.CONSOLE)).toBe(false);
    expect(new VersioningAgent().isValid("1.0.5", "1.0.6-latest", "1.0.1",
        "master", "master", Logger.OutputType.CONSOLE)).toBe(false);
    expect(new VersioningAgent().isValid("1.0.5", "1.0.6", "1.0.1-latest",
        "latest", "master", Logger.OutputType.CONSOLE)).toBe(false);
  });
});
