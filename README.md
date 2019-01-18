# Adding attributes to (specific) HTML elements
(node) Script to add attributes to specific elements in html-files, either on the fly (during i.e. build) or by running the script manually. This script can be used for instance to add masking attribute (i.e. pii-mask).

# Installation
- Copy this folder to the root of your project
- Merge files like package.json etc.
- Run 'npm i' to install all dependencies / packages
- Change the settings ('config/settings.json') accordingly
- open the terminal window
- run: './bin/process-html.js' (for scanning only)
- or run: './bin/process-html.js -f' (for both scanning and adding)

preferably you can add the commands to your build-script as well to run this script automatically when building your project.

# Settings
