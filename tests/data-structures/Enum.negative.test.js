/* eslint-disable no-new */

// imports
const Enum = require("../../data-structures/Enum");
const FrozenObjectException = require("../../exceptions/FrozenObjectException");
const IllegalArgumentException = require("../../exceptions/IllegalArgumentException");
const IOException = require("../../exceptions/IOException");

describe("Tests the Enum data structure for proper functionality.", () => {
  test("Tests creating an enum with an invalid argument.", () => {
    expect(() => {
      new Enum();
    }).toThrow(IllegalArgumentException);
  });

  test("Tests creating an enum with a non-string argument.", () => {
    expect(() => {
      new Enum(10, "20", "30");
    }).toThrow(IOException);
  });

  test("Tests creating symbols with an invalid argument.", () => {
    expect(() => {
      new Enum("10").createSymbols(false);
    }).toThrow(IllegalArgumentException);
  });

  test("Tests getting the name of an enum entry with an invalid argument.", () => {
    expect(() => {
      new Enum("10").getName("10");
    }).toThrow(IllegalArgumentException);
  });

  test("Tests getting the symbol of an enum entry with an invalid argument.", () => {
    expect(() => {
      new Enum("10").getSymbol([]);
    }).toThrow(IllegalArgumentException);
  });

  test("Tests if item is enum entry with an invalid argument.", () => {
    expect(() => {
      new Enum("10").isEntry(10);
    }).toThrow(IllegalArgumentException);
  });

  test("Tests adding to an enum after it has been created.", () => {
    expect(() => {
      new Enum("10").createSymbols(["20"]);
    }).toThrow(FrozenObjectException);
  });
});
