// imports
const AdmZip = require("adm-zip");
const fileSystem = require("fs-extra");
const shell = require("shelljs");
const path = require("path");
const ChangelogCreator = require("../../components/ChangelogCreator");
const GitRunner = require("../../components/GitRunner");
const Logger = require("../../components/Logger");

describe("Tests the ChangelogCreator for proper functionality.", () => {
  let testRepoZip = new AdmZip(path.join(__dirname, "/assets/test-repo.zip"));

  test("Tests the reading of a changelog file.", () => {
    let changelog = new ChangelogCreator().read(path.join(__dirname, "/assets"), "CHANGELOG-PROD.md");
    expect(changelog).toBe("# Changelog\n" +
        "\n" +
        "## Non-Versioned Changes\n" +
        "\n" +
        "* [BUG_FIX] fixed a bug\n" +
        "* [BREAKING] [BUG_FIX] fixed a bug\n" +
        "* [BUG_FIX] fixed a bug\n" +
        "\n" +
        "## 2.3.6\n" +
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

  test("Tests assembling additions to the changelog while in production branch and latest version is for production.",
      () => {
    let mockCommitMsgHistory = ["[VERSION_CHANGE] 3.0.1", "[BUG_FIX] fixed a bug", "[BREAKING] [BUG_FIX] fixed a bug",
      "[BUG_FIX] fixed a bug"];
    let changelogAdditions = new ChangelogCreator().assembleAdditions(mockCommitMsgHistory,
      "master", "master");
    expect(changelogAdditions).toBe("## 3.0.1\n" +
        "\n" +
        "* [BUG_FIX] fixed a bug\n" +
        "* [BREAKING] [BUG_FIX] fixed a bug\n" +
        "* [BUG_FIX] fixed a bug\n");
  });

  test("Tests assembling additions to the changelog while in production branch and latest version is for development.",
      () => {
    let mockCommitMsgHistory = ["[VERSION_CHANGE] 3.0.1-latest", "[BUG_FIX] fixed a bug", "[BREAKING] [BUG_FIX] fixed " +
      "a bug", "[BUG_FIX] fixed a bug"];
    let changelogAdditions = new ChangelogCreator().assembleAdditions(mockCommitMsgHistory,
      "master", "master");
    expect(changelogAdditions).toBe("## Non-Versioned Changes\n" +
        "\n" +
        "* [BUG_FIX] fixed a bug\n" +
        "* [BREAKING] [BUG_FIX] fixed a bug\n" +
        "* [BUG_FIX] fixed a bug\n");
  });

  test("Tests assembling additions to the changelog while in development branch and latest version is for production.",
      () => {
    let mockCommitMsgHistory = ["[BUG_FIX] fixed a bug", "[VERSION_CHANGE] 3.0.1", "[BUG_FIX] fixed a bug",
      "[BREAKING] [BUG_FIX] fixed a bug", "[BUG_FIX] fixed a bug"];
    let changelogAdditions = new ChangelogCreator().assembleAdditions(mockCommitMsgHistory,
      "latest", "master");
    expect(changelogAdditions).toBe("## Non-Versioned Changes\n" +
        "\n" +
        "* [BUG_FIX] fixed a bug\n" +
        "\n" +
        "## 3.0.1\n" +
        "\n" +
        "* [BUG_FIX] fixed a bug\n" +
        "* [BREAKING] [BUG_FIX] fixed a bug\n" +
        "* [BUG_FIX] fixed a bug\n");
  });

  test("Tests assembling additions to the changelog while in development branch and latest version is for development.",
      () => {
    let mockCommitMsgHistory = ["[BUG_FIX] fixed a bug", "[VERSION_CHANGE] 3.0.1-latest", "[BUG_FIX] fixed a bug",
      "[BREAKING] [BUG_FIX] fixed a bug", "[BUG_FIX] fixed a bug"];
    let changelogAdditions = new ChangelogCreator().assembleAdditions(mockCommitMsgHistory,
      "latest", "master");
    expect(changelogAdditions).toBe("## Non-Versioned Changes\n" +
        "\n" +
        "* [BUG_FIX] fixed a bug\n" +
        "\n" +
        "## 3.0.1-latest\n" +
        "\n" +
        "* [BUG_FIX] fixed a bug\n" +
        "* [BREAKING] [BUG_FIX] fixed a bug\n" +
        "* [BUG_FIX] fixed a bug\n");
  });

  test("Tests getting the last version found in a production changelog file applicable to a production branch.", () => {
    let changelogCreator = new ChangelogCreator();
    let changelog = changelogCreator.read(path.join(__dirname, "/assets"), "CHANGELOG-PROD.md");
    let lastVersion = changelogCreator.getLastVersion(changelog, "master", "master");
    expect(lastVersion).toBe("2.3.6");
  });

  test("Tests getting the last version found in a development changelog file applicable to a development branch.", () => {
    let changelogCreator = new ChangelogCreator();
    let changelog = changelogCreator.read(path.join(__dirname, "/assets"), "CHANGELOG-DEV.md");
    let lastVersion = changelogCreator.getLastVersion(changelog, "latest", "master");
    expect(lastVersion).toBe("2.3.0-latest");
  });

  test("Tests getting the last version found in a development changelog file applicable to a production branch.", () => {
    let changelogCreator = new ChangelogCreator();
    let changelog = changelogCreator.read(path.join(__dirname, "/assets"), "CHANGELOG-DEV.md");
    let lastVersion = changelogCreator.getLastVersion(changelog, "master", "master");
    expect(lastVersion).toBe("2.2.6");
  });

  test("Tests the creation of the changelog from the production branch.", () => {
    let changelogCreator = new ChangelogCreator();
    let randomNumber = Math.floor((Math.random() * 10000) + 1);
    testRepoZip.extractAllTo(path.join("/tmp", "/temp-" + randomNumber.toString()), false);
    shell.cd(path.join("/tmp", "/temp-" + randomNumber.toString()));
    shell.exec("git checkout master", { silent: false });
    shell.exec("touch test19.txt", { silent: false });
    shell.exec("git add .", { silent: false });
    new GitRunner(Logger.OutputType.SHELL).createCommit(GitRunner.ChangeType.BUG_FIX, "fixed a bug", "",
        false, false, false);
    shell.exec("echo \"3.0.2\" > version.txt", { silent: false });
    shell.exec("git add .", { silent: false });
    new GitRunner(Logger.OutputType.SHELL).createCommit(GitRunner.ChangeType.VERSION_CHANGE, "3.0.2", "",
        false, false, true);
    changelogCreator.generate(path.join("/tmp", "/temp-" + randomNumber.toString()), "changelog.md");
    let changelog = changelogCreator.read(path.join("/tmp", "/temp-" + randomNumber.toString()), "changelog.md");
    expect(changelog).toBe("# Changelog\n" +
        "\n" +
        "## 3.0.2\n" +
        "\n" +
        "* [BUG_FIX] fixed a bug\n" +
        "\n" +
        "## 3.0.1\n" +
        "\n" +
        "* [BUG_FIX] fixed a bug\n" +
        "* [BREAKING] [BUG_FIX] fixed a bug\n" +
        "\n" +
        "## 2.3.7\n" +
        "\n" +
        "* [BUG_FIX] fixed a bug\n" +
        "\n" +
        "## 2.3.6\n" +
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
    shell.cd("/tmp");

    fileSystem.removeSync(path.join("/tmp", "/temp-" + randomNumber.toString()));
  });

  test("Tests the creation of the changelog from the production branch without any applicable changes.", () => {
    let changelogCreator = new ChangelogCreator();
    let randomNumber = Math.floor((Math.random() * 10000) + 1);
    testRepoZip.extractAllTo(path.join("/tmp", "/temp-" + randomNumber.toString()), false);
    shell.cd(path.join("/tmp", "/temp-" + randomNumber.toString()));
    shell.exec("git checkout master", { silent: false });
    changelogCreator.generate(path.join("/tmp", "/temp-" + randomNumber.toString()), "changelog.md");
    let changelog = changelogCreator.read(path.join("/tmp", "/temp-" + randomNumber.toString()), "changelog.md");
    expect(changelog).toBe("# Changelog\n" +
        "\n" +
        "## 3.0.1\n" +
        "\n" +
        "* [BUG_FIX] fixed a bug\n" +
        "* [BREAKING] [BUG_FIX] fixed a bug\n" +
        "\n" +
        "## 2.3.7\n" +
        "\n" +
        "* [BUG_FIX] fixed a bug\n" +
        "\n" +
        "## 2.3.6\n" +
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
    shell.cd("/tmp");
    fileSystem.removeSync(path.join("/tmp", "/temp-" + randomNumber.toString()));
  });

  test("Tests the creation of the changelog from the development branch with non-versioned changes.", () => {
    let changelogCreator = new ChangelogCreator();
    let randomNumber = Math.floor((Math.random() * 10000) + 1);
    testRepoZip.extractAllTo(path.join("/tmp", "/temp-" + randomNumber.toString()), false);
    shell.cd(path.join("/tmp", "/temp-" + randomNumber.toString()));
    shell.exec("git checkout latest", { silent: false });
    shell.exec("touch test19.txt", { silent: false });
    shell.exec("git add .", { silent: false });
    new GitRunner(Logger.OutputType.SHELL).createCommit(GitRunner.ChangeType.BUG_FIX, "fixed a bug", "",
        false, false, false);
    changelogCreator.generate(path.join("/tmp", "/temp-" + randomNumber.toString()), "changelog.md");
    let changelog = changelogCreator.read(path.join("/tmp", "/temp-" + randomNumber.toString()), "changelog.md");
    expect(changelog).toBe("# Changelog\n" +
        "\n" +
        "## Non-Versioned Changes\n" +
        "\n" +
        "* [BUG_FIX] fixed a bug\n" +
        "\n" +
        "## 4.0.0-latest\n" +
        "\n" +
        "* [BREAKING] [FEATURE] Added test feature\n" +
        "\n" +
        "## 3.0.1-latest\n" +
        "\n" +
        "* [BUG_FIX] fixed a bug\n" +
        "* [BREAKING] [BUG_FIX] fixed a bug\n" +
        "\n" +
        "## 2.3.7\n" +
        "\n" +
        "* [BUG_FIX] fixed a bug\n" +
        "\n" +
        "## 2.3.6\n" +
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
    shell.cd("/tmp");
    fileSystem.removeSync(path.join("/tmp", "/temp-" + randomNumber.toString()));
  });
});
