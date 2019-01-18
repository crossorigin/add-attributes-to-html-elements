"use strict";

// Required modules
const { readFile, readFileSync } = require("fs-extra");
const { extname } = require("path");
const { walk } = require("walk");

// Get all relevant settings
const config = require('../config/settings.json');
const rootfolder = config.settings.root_folder; 
const elements = config.settings.elements_to_alter;
const exceptions = config.settings.elements_to_ignore;
const ignoreFolders = config.settings.folders_to_ignore;

// Regular expression
const modifiers = "gim";
const regexp = new RegExp("<(?:" + elements.join("|") + ")(?![^>]+" + exceptions.join("(\\s|/|>))(?![^>]+") + "(\\s|/|>))", modifiers);

let filesToFix = [];
let nrOfMatches = 0;

// Walker options
var walker = walk(rootfolder, {
  followLinks: false,
  filters: ignoreFolders
});

console.log("\nSearching files\n");

walker.on("file", function(root, stat, next) {
  let ext = extname(stat.name).toLowerCase();
  readFile(root + "/" + stat.name, "utf-8", function(err, contents) {
    if (ext === ".html" || ext === ".shtml") {
      if (containsPii(contents)) {
        filesToFix.push(root + "/" + stat.name);
        console.error(
          "\x1b[31m" + root + "/" + stat.name + " | found: " + count(contents) + " matches\x1b[37m"
        );
        nrOfMatches = nrOfMatches + count(contents);
      }
    }
  });

  next();
});

walker.on("end", function() {
  // TODO: delete timeout
  setTimeout(function(){ 
    if (filesToFix.lenght != 0) {
      console.log("\n\x1b[0mNumber of files to fix: ", filesToFix.length);
      console.log("Number of matches in total: ", nrOfMatches + "\n");
      console.log("Search complete.");
    } else {
      console.log(
        "\n\x1b[0mSearch complete.\n\nCongratulations! No unmarked pii-sensitive data is found!"
      );
    }
   }, 300);
  
  // Check first if the -f arg is present, if not, don't execute add-pii-mask
  if (process.argv[2] === "-f") {
    // Process the array containing the files that need fixing
    filesToFix.forEach((file, index) => {
      addPiiMask(file); // comment this out to only use the scan-part
      if (index + 1 === filesToFix.length) {
        console.log("\n\x1b[32m" + "Adding pii-mask completed.\n");
        console.log(
          "\x1b[37m[data-pii-mask]-attribute added to \x1b[36m" +
            nrOfMatches +
            "\x1b[37m elements in \x1b[36m" +
            filesToFix.length +
            "\x1b[37m files."
        );
        console.log(
          "All matches should now have the 'data-pii-mask' attribute.\n\nrun \x1b[36m'node ./bin/process-pii.js' \x1b[37magain to confirm.."
        );
      }
    });
  }
});

// Count the number of matches in the tested file
const count = str => {
  var match = ((str || "").match(regexp) || []).length;
  if (match != 0 && match != undefined) {
    return match;
  }
};

/**
 * Search for Personal Identifiable Information in the sourcecode.
 * And check of it is marked as pii.
 * @param {string} src - the sourcecode of the file
 * @return {bool} does the file contain Pii?
 */
function containsPii(src) {
  const patterns = [regexp];

  // Test the sourcecode against our patterns
  var failed = patterns.every(function(pattern) {
    if (count(src) != 0) {
      return pattern.test(src);
    }
  });

  // If none pattern failed, we're done.
  if (!failed) return false;

  // else return failed state
  return true;
}

/**
 * Loop through all elements defined in the elements-array and parse the file content to a string
 * if the elementname contains ' ^' (used in the findPii-regex) then remove it.
 * Create the temporary regex used to find each element to which we add the data-pii-mask
 * add the data-pii-mask attribute to the given element and write the new html to the file
 * @param {string} filepath - The file to which the pii-mask will be added
 */
function addPiiMask(filepath) {
  let src = readFileSync(filepath).toString();
  elements.forEach(function(element) {
    element = element.replace(/\ $/g, "-");
    const tempRegexp = new RegExp(
      "<(?:" +
        element +
        ")(?![^>]+" +
        exceptions.join("(\\s|/|>))(?![^>]+") +
        "(\\s|/|>))",
      modifiers
    );
    let matches = src.match(tempRegexp);
    if (matches) {
      matches.forEach(match => {
        src = src.replace(tempRegexp, "<" + element + " data-pii-mask ");
      });
    }
  });
  // fs.writeFileSync(filepath, src);
  console.log("\x1b[37m" + filepath, "\x1b[32mfixed.");
}
