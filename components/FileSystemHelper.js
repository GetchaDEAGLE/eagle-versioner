// imports
const fileSystem = require("fs-extra");
const path = require("path");
const os = require("os");
const Logger = require("./Logger");
const IllegalArgumentException = require("../exceptions/IllegalArgumentException");

// non-changing variables used by class
const MAX_FILE_PATH_AND_FILENAME_CHAR_LENGTH = 255;

/**
 * Provides functionality to work with the file system to get directory listing, detect if a file is valid, etc.
 */
class FileSystemHelper {
  /**
   * Returns the maximum aggregated file path and file name character length.
   * @returns {number} The the maximum aggregated file path and file name character length.
   */
  static get maxFilePathAndFileNameCharLength() {
    return MAX_FILE_PATH_AND_FILENAME_CHAR_LENGTH;
  }

  /**
   * Gets the user's home directory.
   * @returns {string} The user's home directory.
   */
  static get userHomeDirectory() {
    return os.homedir();
  }

  /**
   * Gets the current working directory.
   * @returns {string} The current working directory.
   */
  getCurrentWorkingDirectory() {
    return process.cwd();
  }

  /**
   * Determines if a file exists.
   * @param {string} fileDirectory The directory that will contain the file.
   * @param {string} fileName Name of the file used for analysis.
   * @returns {boolean} True if file exists and false if not.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  getDoesFileExist(fileDirectory, fileName) {
    let isValidFile = false;

    if (typeof fileDirectory === "string" && fileDirectory && typeof fileName === "string" && fileName) {
      isValidFile = fileSystem.existsSync(path.join(fileDirectory, fileName));
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the FileSystemHelper getDoesFileExist function.");
    }

    return isValidFile;
  }

  /**
   * Checks if the file name is valid and doesn't contain invalid characters.
   * @param {string} fileName Name of the file used for analysis.
   * @returns {boolean} True if the file name is valid and false if not.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  getIsValidFileName(fileName) {
    let cleanedFileName;

    if (typeof fileName === "string" && fileName) {
      // remove invalid characters from file name used for comparison below
      cleanedFileName = fileName.replace(/[`~!@#$%^&*()|+=?;:'",<>{}[\]\\/]/gi, "");
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the FileSystemHelper getIsValidFileName function.");
    }

    return fileName === cleanedFileName;
  }

  /**
   * Checks if the combined file path and name character length is valid and not too long.
   * @param {string} fileDirectory The directory that will contain the file.
   * @param {string} fileName Name of the file used for analysis.
   * @returns {boolean} True if the combined file and path name length is valid and false if not.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  getIsValidFilePathAndNameCharLength(fileDirectory, fileName) {
    let isFilePathAndNameTooLong = false;

    if (typeof fileDirectory === "string" && fileDirectory && typeof fileName === "string" && fileName) {
      isFilePathAndNameTooLong =
          fileDirectory.length + fileName.length <= FileSystemHelper.maxFilePathAndFileNameCharLength;
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the FileSystemHelper " +
          "getIsValidFilePathAndNameCharLength function.");
    }

    return isFilePathAndNameTooLong;
  }

  /**
   * Reads the specified file as a buffer.
   * @param {string} fileDirectory The directory that will contain the file.
   * @param {string} fileName The name of the file to read.
   * @returns {Buffer} The file contents as a buffer.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  readAsBuffer(fileDirectory, fileName) {
    let fileContents;

    if (typeof fileDirectory === "string" && fileDirectory && typeof fileName === "string" && fileName) {
      fileContents = fileSystem.readFileSync(path.join(fileDirectory, "/", fileName));
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the FileSystemHelper readAsBuffer function.");
    }

    return fileContents;
  }

  /**
   * Reads the specified file as a string.
   * @param {string} fileDirectory The directory that will contain the file.
   * @param {string} fileName The name of the file to read.
   * @returns {string} The file contents as a string.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  readAsString(fileDirectory, fileName) {
    let fileContents = "";

    if (typeof fileDirectory === "string" && fileDirectory && typeof fileName === "string" && fileName) {
      fileContents = fileSystem.readFileSync(path.join(fileDirectory, "/", fileName), "utf8");
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the FileSystemHelper readAsString function.");
    }

    return fileContents;
  }

  /**
   * Writes a file to the file system as a string.
   * @param {string} fileDirectory The directory that will contain the file.
   * @param {string} fileName The name of the file to write. Will overwrite existing files.
   * @param {string} fileContents The contents of the file to write.
   * @throws IllegalArgumentException when an invalid argument is passed.
   */
  writeAsString(fileDirectory, fileName, fileContents = "") {
    if (typeof fileDirectory === "string" && fileDirectory && typeof fileName === "string" && fileName
        && typeof fileContents === "string") {
      fileSystem.ensureFileSync(path.join(fileDirectory, "/", fileName));
      fileSystem.writeFileSync(path.join(fileDirectory, "/", fileName), fileContents);
    } else {
      throw new IllegalArgumentException("Invalid argument passed to the FileSystemHelper writeAsString function.");
    }
  }
}

module.exports = FileSystemHelper;
