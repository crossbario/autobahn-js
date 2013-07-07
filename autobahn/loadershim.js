// needed to load when.js in legacy environments
// https://github.com/cujojs/when
if (!window.define) {
   window.define = function (factory) {
      try {
         delete window.define;
      }
      catch (e) {
         window.define = void 0;
      } // IE
      window.when = factory();
   };
   window.define.amd = {};
}
