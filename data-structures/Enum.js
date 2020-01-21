// imports
const colors = require("ansi-colors");
const FrozenObjectException = require("../exceptions/FrozenObjectException");
const IllegalArgumentException = require("../exceptions/IllegalArgumentException");
const IOException = require("../exceptions/IOException");

/**
 * Emulates an enumeration data type used to hold constant values.
 */
class Enum {
  /**
   * Constructor creates the enum entries as properties on the instance of this class.
   * @param {Array} enumArgs One or more enum entries represented as strings (duplicates are filtered out).
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  constructor(...enumArgs) {
    this.symbolMap = new Map();

    if (Array.isArray(enumArgs) && enumArgs.length > 0) {
      // create unique symbols from the enum arguments
      this.createSymbols(enumArgs);

      // freeze the class instance so nothing else can be added or changed
      Object.freeze(this);
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the Enum constructor.");
    }
  }

  /**
   * Creates unique symbols from the passed in enum arguments and stores them as properties on the instantiated class.
   * Duplicates are filtered out even though the constructor of this class allows them.
   * @param {Array} enumArgs Array of enum arguments as strings used to create the enum.
   * @throws FrozenObjectException When the enum has already been frozen.
   * @throws IllegalArgumentException when an invalid argument is passed.
   * @throws IOException when not using a string for creating enum entries.
   */
  createSymbols(enumArgs) {
    if (Array.isArray(enumArgs) && enumArgs.length > 0) {
      if (Object.isFrozen(this)) {
        throw new FrozenObjectException("The enum has already been frozen and cannot be modified.");
      } else {
        // create the unique symbols
        for (let i = 0; i < enumArgs.length; i++) {
          // ensure the passed in arguments are strings
          if (typeof enumArgs[i] === "string") {
            const enumSymbol = Symbol(enumArgs[i].toUpperCase());

            // if property doesn't already exist
            if (typeof this[enumArgs[i].toUpperCase()] === "undefined") {
              // create property (on this class instance) of unique symbol using the enum string (converted to uppercase)
              Object.defineProperty(this, enumArgs[i].toUpperCase(), {
                configurable: false,
                enumerable: true,
                value: enumSymbol,
                writable: false
              });

              this.symbolMap.set(enumSymbol, enumArgs[i].toUpperCase());
            }
          } else {
            throw new IOException("Only strings are allowed for enum entries.");
          }
        }
      }
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the Enum createSymbols function.");
    }
  }

  /**
   * Gets the size of the enumerator and returns it.
   */
  get size() {
    return this.symbolMap.size;
  }

  /**
   * Converts the enum to a printable string.
   */
  toString() {
    let enumString = "";
    const lastEntry = this.size - 1;
    let currentEntry = 0;

    this.symbolMap.forEach((value) => {
      if (currentEntry === lastEntry) {
        enumString = (this.symbolMap.size === 2)
            ? enumString.concat(" and " + colors.yellow(value)) : enumString.concat("and " + colors.yellow(value));
      } else if (this.symbolMap.size > 2) {
        enumString = enumString.concat(colors.yellow(value) + ", ");
      } else {
        enumString = enumString.concat(colors.yellow(value));
      }

      currentEntry++;
    });

    return enumString;
  }

  /**
   * Gets the name of the enum entry based on its symbol.
   * @param {Symbol} enumEntrySymbol The enum symbol used to derive its name.
   * @returns {string} String of the enum entry or null if symbol isn't an enum entry.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  getName(enumEntrySymbol) {
    let name = "";

    if (typeof enumEntrySymbol === "symbol") {
      name = this.symbolMap.get(enumEntrySymbol);
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the Enum getName function.");
    }

    return name;
  }

  /**
   * Gets the enum entry as a symbol based on the specified string.
   * @param {string} enumEntry The name of the enum entry to retrieve.
   * @returns {Symbol} The enum entry as a symbol.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  getSymbol(enumEntry) {
    let symbol;

    if (typeof enumEntry === "string" && enumEntry) {
      symbol = this[enumEntry.toUpperCase()];
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the Enum getSymbol function.");
    }

    return symbol;
  }

  /**
   * Determines if the passed in string value is in the enum.
   * @param {string} possibleEnumEntry String of the possible enum entry to use for comparison.
   * @returns {boolean} True if the string is an enum entry and false if not.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  isEntry(possibleEnumEntry) {
    let isEntry = false;

    if (typeof possibleEnumEntry === "string" && possibleEnumEntry) {
      const values = Array.from(this.symbolMap.values());
      isEntry = (values.indexOf(possibleEnumEntry.toUpperCase()) >= 0);
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the Enum isEntry function.");
    }

    return isEntry;
  }
}

module.exports = Enum;
