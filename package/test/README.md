# Tests for AutobahnJS functionality

Tests run using NodeJS and the nodeunit package.

First, ensure that a Crossbar instance is running with the default configuration (use `crossbar init` if needed).

Then, open a terminal and run `npm test` in the `package` directory.

## First run

* You need to have NodeJS installed.
* Run `npm install` in the `package directory`

If all assertions fail, this may be because of different line ending formats for the created test_*.txt files.   
In this case you need to remove the files and create a known good set of files on your system!
