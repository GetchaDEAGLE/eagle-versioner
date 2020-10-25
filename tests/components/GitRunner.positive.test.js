// imports
const AdmZip = require("adm-zip");
const fileSystem = require("fs-extra");
const shell = require("shelljs");
const path = require("path");
const GitRunner = require("../../components/GitRunner");
const Logger = require("../../components/Logger");
const ShellCmdFailureException = require("../../exceptions/ShellCmdFailureException");

describe("Tests the GitRunner for proper functionality.", () => {
  let testRepoZip = new AdmZip(path.join(__dirname, "/assets/test-repo.zip"));

  test("Tests getting the max short commit message length.", () => {
    expect(typeof GitRunner.maxShortCommitMsgCharLength).toBe("number");
  });

  test("Tests getting the commit SHA regex.", () => {
    expect(GitRunner.commitShaRegex instanceof RegExp).toBe(true);
  });

  test("Tests getting the max long commit message length.", () => {
    expect(typeof GitRunner.maxLongCommitMsgLength).toBe("number");
  });

  test("Tests getting the commit message end tag.", () => {
    expect(typeof GitRunner.commitMsgEndTag).toBe("string");
  });

  test("Tests getting the current branch name.", () => {
    let randomNumber = Math.floor((Math.random() * 10000) + 1);
    testRepoZip.extractAllTo(path.join("/tmp", "/temp-" + randomNumber.toString()), false);
    shell.cd(path.join("/tmp", "/temp-" + randomNumber.toString()));
    shell.exec("git checkout latest", { silent: false });
    let branchName = new GitRunner(Logger.OutputType.SHELL).getCurrentBranchName();
    expect(branchName).toBe("latest");
    shell.cd("..");
    fileSystem.removeSync(path.join("/tmp", "/temp-" + randomNumber.toString()));
  });

  test("Tests getting the commit message history without a SHA.", () => {
    let randomNumber = Math.floor((Math.random() * 10000) + 1);
    testRepoZip.extractAllTo(path.join("/tmp", "/temp-" + randomNumber.toString()), false);
    shell.cd(path.join("/tmp", "/temp-" + randomNumber.toString()));
    shell.exec("git checkout latest", { silent: false });
    let commitMsgHistory = new GitRunner(Logger.OutputType.SHELL).getCommitMsgHistory();
    expect(commitMsgHistory.length).toBe(42);
    expect(commitMsgHistory[0]).toBe("test");
    shell.cd("..");

    fileSystem.removeSync(path.join("/tmp", "/temp-" + randomNumber.toString()));
  });

  test("Tests getting the commit message history with a SHA.", () => {
    let randomNumber = Math.floor((Math.random() * 10000) + 1);
    testRepoZip.extractAllTo(path.join("/tmp", "/temp-" + randomNumber.toString()), false);
    shell.cd(path.join("/tmp", "/temp-" + randomNumber.toString()));
    let gitRunner = new GitRunner(Logger.OutputType.SHELL);
    shell.exec("git checkout latest", { silent: false });
    let versionCommitSha = gitRunner.getVersionCommitSha("2.3.7");
    let commitMsgHistory = gitRunner.getCommitMsgHistory(versionCommitSha);
    expect(commitMsgHistory.length).toBe(6);
    shell.cd("..");
    fileSystem.removeSync(path.join("/tmp", "/temp-" + randomNumber.toString()));
  });

  test("Tests getting the last production version map and version from available commit history.", () => {
    let randomNumber = Math.floor((Math.random() * 10000) + 1);
    testRepoZip.extractAllTo(path.join("/tmp", "/temp-" + randomNumber.toString()), false);
    shell.cd(path.join("/tmp", "/temp-" + randomNumber.toString()));
    shell.exec("git checkout master", { silent: false });
    let gitRunner = new GitRunner(Logger.OutputType.SHELL);
    let lastProdVersionMap = gitRunner.getLastProdVersionMap();
    let lastProdVersion = (lastProdVersionMap.size > 0) ? lastProdVersionMap.values().next().value : "";
    expect(lastProdVersionMap.get("8c7c2ad71ca6879d60d46ab960d0a32b9900df31")).toBe("3.0.1");
    expect(lastProdVersion).toBe("3.0.1");
    shell.cd("..");
    fileSystem.removeSync(path.join("/tmp", "/temp-" + randomNumber.toString()));
  });

  test("Tests if the branch name is in a valid format.", () => {
    expect(new GitRunner(Logger.OutputType.CONSOLE).checkReference("master")).toBe(true);
  });

  test("Tests retrying a failed commit.", () => {
    let randomNumber = Math.floor((Math.random() * 10000) + 1);
    testRepoZip.extractAllTo(path.join("/tmp", "/temp-" + randomNumber.toString()), false);
    shell.cd(path.join("/tmp", "/temp-" + randomNumber.toString()));
    shell.exec("git checkout latest", { silent: false });
    shell.exec("touch temp-file", { silent: false });
    let gitRunner = new GitRunner(Logger.OutputType.SHELL);

    try {
      gitRunner.createCommit(GitRunner.ChangeType.FEATURE, "Added new feature", "It's really cool.",
          false, false, false);
    } catch (error) {
      shell.exec("git add temp-file", { silent: false });
      gitRunner.retryFailedCommit();
    }

    expect(gitRunner.getCommitMsgHistory().pop()).toBe("[FEATURE] Added new feature\n" +
        "\n" +
        "It's really cool.");
    shell.cd("..");
    fileSystem.removeSync(path.join("/tmp", "/temp-" + randomNumber.toString()));
  });

  test("Tests getting the contiguous WIP commits from available commit history.", () => {
    let randomNumber = Math.floor((Math.random() * 10000) + 1);
    testRepoZip.extractAllTo(path.join("/tmp", "/temp-" + randomNumber.toString()), false);
    shell.cd(path.join("/tmp", "/temp-" + randomNumber.toString()));
    shell.exec("git checkout master", { silent: false });
    let gitRunner = new GitRunner(Logger.OutputType.SHELL);
    expect(gitRunner.getContiguousWipCommitCount()).toBe(0);
    shell.exec("touch 20982 && git add 20982", { silent: false });
    gitRunner.createCommit(GitRunner.ChangeType.WIP, "Added X", "",
        false, false, false);
    shell.exec("touch 20983 && git add 20983", { silent: false });
    gitRunner.createCommit(GitRunner.ChangeType.WIP, "Added Y", "",
        false, false, false);
    expect(gitRunner.getContiguousWipCommitCount()).toBe(2);
    shell.cd("..");
    fileSystem.removeSync(path.join("/tmp", "/temp-" + randomNumber.toString()));
  });

  test("Tests removing commits and staging the files.", () => {
    let randomNumber = Math.floor((Math.random() * 10000) + 1);
    testRepoZip.extractAllTo(path.join("/tmp", "/temp-" + randomNumber.toString()), false);
    shell.cd(path.join("/tmp", "/temp-" + randomNumber.toString()));
    shell.exec("git checkout master", { silent: false });

    const testRemovingCommitsAndStaging = () => {
      new GitRunner(Logger.OutputType.SHELL).removeCommitsAndStage(2);
    };

    expect(testRemovingCommitsAndStaging).not.toThrow(ShellCmdFailureException);
    shell.cd("..");
    fileSystem.removeSync(path.join("/tmp", "/temp-" + randomNumber.toString()));
  });

  test("Tests if the branch name is in a valid format.", () => {
    expect(new GitRunner(Logger.OutputType.CONSOLE).checkReference("master")).toBe(true);
  });
});
