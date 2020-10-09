/* eslint-disable no-new */

// imports
const fileSystem = require("fs-extra");
const path = require("path");
const shell = require("shelljs");
const GitRunner = require("../../components/GitRunner");
const Logger = require("../../components/Logger");
const IllegalArgumentException = require("../../exceptions/IllegalArgumentException");
const InvalidGitDataException = require("../../exceptions/InvalidGitDataException");
const ShellCmdFailureException = require("../../exceptions/ShellCmdFailureException");

describe("Tests the GitRunner for proper functionality.", () => {
  test("Tests creating an instance of GitRunner with an invalid argument.", () => {
    expect(() => {
      new GitRunner();
    }).toThrow(IllegalArgumentException);
  });

  test("Tests getting the change type as a tag with an invalid argument.", () => {
    expect(() => {
      GitRunner.getChangeTypeAsTag();
    }).toThrow(IllegalArgumentException);
  });

  test("Tests getting the current branch name while not in a repository.", () => {
    shell.cd("/");
    let randomNumber = Math.floor((Math.random() * 10000) + 1);
    shell.exec("mkdir -p tmp/temp-" + parseInt(randomNumber, 10));
    shell.cd(path.join("/tmp", "/temp-" + parseInt(randomNumber, 10)));

    expect(() => {
      new GitRunner(Logger.OutputType.CONSOLE).getCurrentBranchName();
    }).toThrow(ShellCmdFailureException);

    shell.cd("..");
    fileSystem.removeSync(path.join("/tmp", "/temp-" + parseInt(randomNumber, 10)));
  });

  test("Tests getting the commit message history with an invalid argument.", () => {
    expect(() => {
      new GitRunner(Logger.OutputType.CONSOLE).getCommitMsgHistory(10, 20);
    }).toThrow(IllegalArgumentException);
  });

  test("Tests getting the commit message history while not in a repository.", () => {
    shell.cd("/");
    let randomNumber = Math.floor((Math.random() * 10000) + 1);
    shell.exec("mkdir -p tmp/temp-" + parseInt(randomNumber, 10));
    shell.cd(path.join("/tmp", "/temp-" + parseInt(randomNumber, 10)));

    expect(() => {
      new GitRunner(Logger.OutputType.CONSOLE).getCommitMsgHistory();
    }).toThrow(ShellCmdFailureException);

    shell.cd("..");
    fileSystem.removeSync(path.join("/tmp", "/temp-" + parseInt(randomNumber, 10)));
  });

  test("Tests getting the version commit SHA with an invalid argument.", () => {
    expect(() => {
      new GitRunner(Logger.OutputType.CONSOLE).getVersionCommitSha();
    }).toThrow(IllegalArgumentException);
  });

  test("Tests retrying a failed commit without a record of the failed commit.", () => {
    expect(() => {
      new GitRunner(Logger.OutputType.CONSOLE).retryFailedCommit();
    }).toThrow(InvalidGitDataException);
  });

  test("Tests creating a commit with an invalid argument.", () => {
    expect(() => {
      new GitRunner(Logger.OutputType.CONSOLE).createCommit();
    }).toThrow(IllegalArgumentException);
  });

  test("Tests creating a commit while not in a repository.", () => {
    shell.cd("/");
    let randomNumber = Math.floor((Math.random() * 10000) + 1);
    shell.exec("mkdir -p tmp/temp-" + parseInt(randomNumber, 10));
    shell.cd(path.join("/tmp", "/temp-" + parseInt(randomNumber, 10)));

    expect(() => {
      new GitRunner(Logger.OutputType.CONSOLE).createCommit(GitRunner.ChangeType.BUG_FIX, "Let's fix this bug",
          "", false, false, false);
    }).toThrow(ShellCmdFailureException);

    shell.cd("..");
    fileSystem.removeSync(path.join("/tmp", "/temp-" + parseInt(randomNumber, 10)));
  });

  test("Tests checking a reference with an invalid argument.", () => {
    expect(() => {
      new GitRunner(Logger.OutputType.CONSOLE).checkReference([]);
    }).toThrow(IllegalArgumentException);
  });

  test("Tests getting contiguous WIP commits with an invalid argument.", () => {
    expect(() => {
      new GitRunner(Logger.OutputType.CONSOLE).getContiguousWipCommitCount([]);
    }).toThrow(IllegalArgumentException);
  });

  test("Tests removing commits and staging the files with an invalid argument.", () => {
    expect(() => {
      new GitRunner(Logger.OutputType.CONSOLE).removeCommitsAndStage([]);
    }).toThrow(IllegalArgumentException);
  });
});
