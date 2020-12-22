/* eslint-disable no-new */

// imports
const AdmZip = require("adm-zip");
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
    shell.exec("mkdir -p tmp/temp-" + randomNumber.toString());
    shell.cd(path.join("/tmp", "/temp-" + randomNumber.toString()));

    expect(() => {
      new GitRunner(Logger.OutputType.CONSOLE).getCurrentBranchName();
    }).toThrow(ShellCmdFailureException);

    shell.cd("..");
    fileSystem.removeSync(path.join("/tmp", "/temp-" + randomNumber.toString()));
  });

  test("Tests getting the current branch name using a checked out commit SHA.", () => {
    let randomNumber = Math.floor((Math.random() * 10000) + 1);
    let testRepoZip = new AdmZip(path.join(__dirname, "/assets/test-repo.zip"));
    testRepoZip.extractAllTo(path.join("/tmp", "/temp-" + randomNumber.toString()), false);
    shell.cd(path.join("/tmp", "/temp-" + randomNumber.toString()));
    shell.exec("git checkout latest && git checkout 8c1db3d167bc650ce08da6cd438cc1748cf15705", { silent: false });

    expect(() => {
      new GitRunner(Logger.OutputType.CONSOLE).getCurrentBranchName();
    }).toThrow(InvalidGitDataException);

    shell.cd("..");
    fileSystem.removeSync(path.join("/tmp", "/temp-" + randomNumber.toString()));
  });

  test("Tests getting a commit message with an invalid argument.", () => {
    expect(() => {
      new GitRunner(Logger.OutputType.CONSOLE).getCommitMessage(101);
    }).toThrow(IllegalArgumentException);
  });

  test("Tests getting the commit messages with an invalid argument.", () => {
    expect(() => {
      new GitRunner(Logger.OutputType.CONSOLE).getCommitMessages(10, 20);
    }).toThrow(IllegalArgumentException);
  });

  test("Tests getting the commit message history while not in a repository.", () => {
    shell.cd("/");
    let randomNumber = Math.floor((Math.random() * 10000) + 1);
    shell.exec("mkdir -p tmp/temp-" + randomNumber.toString());
    shell.cd(path.join("/tmp", "/temp-" + randomNumber.toString()));

    expect(() => {
      new GitRunner(Logger.OutputType.CONSOLE).getCommitMessages();
    }).toThrow(ShellCmdFailureException);

    shell.cd("..");
    fileSystem.removeSync(path.join("/tmp", "/temp-" + randomNumber.toString()));
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
    shell.exec("mkdir -p tmp/temp-" + randomNumber.toString());
    shell.cd(path.join("/tmp", "/temp-" + randomNumber.toString()));

    expect(() => {
      new GitRunner(Logger.OutputType.CONSOLE).createCommit(GitRunner.ChangeType.BUG_FIX, "Let's fix this bug",
          "", false, false, false);
    }).toThrow(ShellCmdFailureException);

    shell.cd("..");
    fileSystem.removeSync(path.join("/tmp", "/temp-" + randomNumber.toString()));
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
