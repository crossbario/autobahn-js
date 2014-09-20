///////////////////////////////////////////////////////////////////////////////
//
//  AutobahnJS - http://autobahn.ws, http://wamp.ws
//
//  A JavaScript library for WAMP ("The Web Application Messaging Protocol").
//
//  Copyright (C) 2014 Tavendo GmbH, http://tavendo.com
//
//  Licensed under the MIT License.
//  http://www.opensource.org/licenses/mit-license.php
//
///////////////////////////////////////////////////////////////////////////////

//
// running in browser
//
if ('window' in global) {
   // support versions of Windows Internet Explorer prior to Internet Explorer 7
   //
   if (typeof XMLHttpRequest === "undefined") {
      //var ids = ["Msxml2.XMLHTTP", "Microsoft.XMLHTTP", "Msxml2.XMLHTTP.4.0"];
      var ids = ["MSXML2.XMLHTTP.3.0"];
      for (var i = 0; i < ids.length; i++) {
         try {
            new ActiveXObject(ids[i]);
            window.XMLHttpRequest = function() {
               return new ActiveXObject(ids[i]);
            };
            break;
         } catch (e) {         
         }
      }
   }
}
