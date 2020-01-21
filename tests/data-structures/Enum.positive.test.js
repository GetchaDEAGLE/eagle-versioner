// imports
const Enum = require("../../data-structures/Enum");

describe("Tests the Enum data structure for proper functionality.", () => {
  test("Tests getting the size of an enum.", () => {
    const TestEnum = new Enum("red", "white", "blue");
    expect(TestEnum.size).toBe(3);
  });

  test("Tests converting an enum into a string.", () => {
    const TestEnum = new Enum("red", "white", "blue");
    const testEnumString = TestEnum.toString().toLowerCase();
    expect(testEnumString).toBe("[33mred[39m, [33mwhite[39m, and [33mblue[39m");
  });

  test("Tests getting the name of an enum entry as a string.", () => {
    const TestEnum = new Enum("red", "white", "blue");
    const enumEntryName = TestEnum.getName(TestEnum.RED);
    expect(enumEntryName).toBe("RED");
  });

  test("Tests getting the enum entry as a symbol.", () => {
    const TestEnum = new Enum("red", "white", "blue");
    const enumEntrySymbol = TestEnum.getSymbol("red");
    expect(enumEntrySymbol).toBe(TestEnum.RED);
  });

  test("Tests if the specified string is an enum entry.", () => {
    const TestEnum = new Enum("red", "white", "blue");
    expect(TestEnum.isEntry("red")).toBe(true);
  });
});
