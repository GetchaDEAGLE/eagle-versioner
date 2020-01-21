// imports
const VersioningAgent = require("../../components/VersioningAgent");
const IllegalArgumentException = require("../../exceptions/IllegalArgumentException");
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
});
