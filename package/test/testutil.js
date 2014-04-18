///////////////////////////////////////////////////////////////////////////////
//
//  AutobahnJS - http://autobahn.ws, http://wamp.ws
//
//  A JavaScript library for WAMP ("The Web Application Messaging Protocol").
//
//  Copyright (C) 2011-2014 Tavendo GmbH, http://tavendo.com
//
//  Licensed under the MIT License.
//  http://www.opensource.org/licenses/mit-license.php
//
///////////////////////////////////////////////////////////////////////////////

var fs = require("fs");


var Testlog = function (filename) {

   var self = this;

   self._filename = filename;
   self._log = [];
};


Testlog.prototype.log = function () {

   var self = this;

   console.log.apply(this, arguments);
   self._log.push(arguments);
};


Testlog.prototype.stringify = function () {

   var self = this;

   var s = '';
   for (var i = 0; i < self._log.length; ++i) {
      s += i;
      args = self._log[i];
      for (arg in args) {
         s += ' ' + JSON.stringify(args[arg]);
      }
      s += "\n";
   }
   return s;
};


Testlog.prototype.check = function () {

   var self = this;
   var slog = self.stringify();

   if (fs.existsSync(self._filename)) {
      var slog_baseline = fs.readFileSync(self._filename);
      if (slog != slog_baseline) {
         return "\nExpected:\n\n" + slog_baseline + "\n\n\nGot:\n\n" + slog + "\n\n";
      } else {
         return null;
      }
   } else {
      fs.writeFileSync(self._filename, slog);
      console.log("Know-good log file created", self._filename, slog.length);
      return null;
   }
};


exports.Testlog = Testlog;
