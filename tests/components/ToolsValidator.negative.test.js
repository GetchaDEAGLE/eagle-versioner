// imports
const shell = require("shelljs");
const ToolsValidator = require("../../components/ToolsValidator");
const Logger = require("../../components/Logger");
const IllegalArgumentException = require("../../exceptions/IllegalArgumentException");
const InvalidGitDataException = require("../../exceptions/InvalidGitDataException");

describe("Tests the ToolsValidator for proper functionality.", () => {
  test("Tests invoking the tools validator with an invalid argument.", () => {
    expect(() => {
      new ToolsValidator().invoke();
    }).toThrow(IllegalArgumentException);
  });

  test("Tests invoking the tools validator without being in a Git repo.", () => {
    shell.cd("/");

    expect(() => {
      new ToolsValidator().invoke(Logger.OutputType.CONSOLE);
    }).toThrow(InvalidGitDataException);
  });
});
