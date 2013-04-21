/**
 * AutobahnExtJS - Autobahn/WAMP proxy and support code for ExtJS.
 *
 * AutobahnExtJS is dual-licensed and may be used under the terms of
 * the "GPLv3" or the "Sencha Model Extension License v1.0".
 *
 * http://opensource.org/licenses/GPL-3.0
 * https://market.sencha.com/licenses/77
 */

"use strict";

Ext.define('Ext.data.proxy.WampProxy', {
   extend: 'Ext.data.proxy.Proxy',
   alias : 'proxy.wamp',

   batchActions: false,

   constructor: function (config) {
      var me = this;
      config = config || {};

      me.addEvents(
         /**
          * @event exception
          * Fires when the WAMP server returns an exception in response to a RPC
          * @param {Ext.data.proxy.Proxy} this
          * @param {Object} error The WAMP error object returned for the RPC
          * @param {Ext.data.Operation} operation The operation that triggered request
          */
         'exception',

         /**
          * @event oncreate
          * Fires when an object was (remotely) created
          * @param {Ext.data.proxy.Proxy} this
          * @param {Object} id The object created
          */
         'oncreate',

         /**
          * @event onupdate
          * Fires when an object was (remotely) update
          * @param {Ext.data.proxy.Proxy} this
          * @param {Object} id The object delta for the update (plus the object ID)
          */
         'onupdate',

         /**
          * @event ondestroy
          * Fires when an object was (remotely) deleted
          * @param {Ext.data.proxy.Proxy} this
          * @param {Object} id The ID of the object deleted
          */
         'ondestroy'
      );

      // http://www.sencha.com/forum/showthread.php?229600-Illegal-access-to-a-strict-mode-caller-function
      // me.callParent([config]);
      me.superclass.constructor.apply(me, arguments)

      me.api = Ext.apply({}, config.api || me.api);

      if (me.api.oncreate) {
         me.session.subscribe(me.api.oncreate, function (topic, event) {
            if (me.debug) {
               console.log("Ext.data.proxy.WampProxy.oncreate", event);
            }
            var obj = event;
            me.fireEvent('oncreate', me, obj);
         });
      }

      if (me.api.onupdate) {
         me.session.subscribe(me.api.onupdate, function (topic, event) {
            if (me.debug) {
               console.log("Ext.data.proxy.WampProxy.onupdate", event);
            }
            var obj = event;
            me.fireEvent('onupdate', me, obj);
         });
      }

      if (me.api.ondestroy) {
         me.session.subscribe(me.api.ondestroy, function (topic, event) {
            if (me.debug) {
               console.log("Ext.data.proxy.WampProxy.ondestroy", event);
            }
            var id = event;
            me.fireEvent('ondestroy', me, id);
         });
      }
   },

   create: function (operation, callback, scope) {

      var me = this;

      if (me.debug) {
         console.log("Ext.data.proxy.WampProxy.create", operation);
      }

      // FIXME?
      if (operation.records.length > 1) {
         throw "WAMP proxy cannot process multiple CREATEs at once";
      }

      var record = operation.records[0];

      operation.setStarted();

      // issue WAMP RPC
      this.session.call(this.api.create, record.data).then(

         // process WAMP RPC success result
         function (res) {
            record.phantom = false;
            record.setId(res.id);
            record.commit();

            operation.setCompleted();
            operation.setSuccessful();

            if (typeof callback === 'function') {
               callback.call(scope || me, operation);
            }
         },

         // process WAMP RPC error result
         function (err) {

            if (me.debug) {
               console.log("WAMP RPC error", err);
            }

            operation.setException(err.desc);
            me.fireEvent('exception', me, err, operation);

            if (typeof callback === 'function') {
               callback.call(scope || me, operation);
            }
         }
      );
   },

   update: function (operation, callback, scope) {

      var me = this;

      if (me.debug) {
         console.log("Ext.data.proxy.WampProxy.update", operation);
      }

      // FIXME?
      if (operation.records.length > 1) {
         throw "WAMP proxy cannot process multiple UPDATEs at once";
      }

      var record = operation.records[0];

      operation.setStarted();

      // issue WAMP RPC
      this.session.call(this.api.update, record.data).then(

         // process WAMP RPC success result
         function (res) {
            // FIXME: update record fields ..
            record.commit();

            operation.setCompleted();
            operation.setSuccessful();

            if (typeof callback === 'function') {
               callback.call(scope || me, operation);
            }
         },

         // process WAMP RPC error result
         function (err) {
            if (me.debug) {
               console.log("WAMP RPC error", err);
            }

            operation.setException(err.desc);
            me.fireEvent('exception', me, err, operation);

            if (typeof callback === 'function') {
               callback.call(scope || me, operation);
            }
         }
      );
   },

   destroy: function (operation, callback, scope) {

      var me = this;

      if (me.debug) {
         console.log("Ext.data.proxy.WampProxy.destroy", operation);
      }

      // FIXME?
      if (operation.records.length > 1) {
         throw "WAMP proxy cannot process multiple DESTROYs at once";
      }

      operation.setStarted();

      var id = operation.records[0].getId();

      // issue WAMP RPC
      this.session.call(this.api.destroy, id).then(

         // process WAMP RPC success result
         function () {
            operation.setCompleted();
            operation.setSuccessful();

            if (typeof callback === 'function') {
               callback.call(scope || me, operation);
            }
         },

         // process WAMP RPC error result
         function (err) {
            if (me.debug) {
               console.log("WAMP RPC error", err);
            }

            operation.setException(err.desc);
            me.fireEvent('exception', me, err, operation);

            if (typeof callback === 'function') {
               callback.call(scope || me, operation);
            }
         }
      );
   },

   read: function (operation, callback, scope) {

      var me = this;
      var i;

      if (me.debug) {
         console.log("Ext.data.proxy.WampProxy.read", operation);
      }

      // this object will get the single RPC argument ..
      var params = Ext.applyIf(operation.params || {}, me.extraParams || {});

      // paging parameters
      if (operation.start !== undefined) {
         params.start = operation.start;
      }
      if (operation.limit !== undefined) {
         params.limit = operation.limit;
      }

      // sorting parameters
      if (operation.sorters && operation.sorters.length > 0) {
         params.sorters = [];
         for (i = 0; i < operation.sorters.length; ++i) {
            params.sorters.push({property: operation.sorters[i].property,
                                 direction: operation.sorters[i].direction});
         }
      }

      // filtering parameters
      if (operation.filters && operation.filters.length > 0) {
         params.filters = [];
         for (i = 0; i < operation.filters.length; ++i) {
            params.filters.push({property: operation.filters[i].property,
                                 value: operation.filters[i].value});
         }
      }

      // grouping parameters
      if (operation.groupers && operation.groupers.length > 0) {
         params.groupers = [];
         for (i = 0; i < operation.groupers.length; ++i) {
            params.groupers.push({property: operation.groupers[i].property,
                                  direction: operation.groupers[i].direction || 'ASC'});
         }
      }

      // issue WAMP RPC
      this.session.call(this.api.read, params).then(

         // process WAMP RPC success result
         function (res) {
            var reader = me.getReader();
            reader.applyDefaults = true;
            operation.resultSet = reader.read(res);

            operation.setCompleted();
            operation.setSuccessful();

            if (typeof callback === 'function') {
               callback.call(scope || me, operation);
            }
         },

         // process WAMP RPC error result
         function (err) {
            operation.setException(err.desc);
            me.fireEvent('exception', me, err, operation);

            if (typeof callback === 'function') {
               callback.call(scope || me, operation);
            }
         }
      );
   }
}, function () {
});


Ext.define('Ext.form.action.WampSubmit', {
   extend: 'Ext.form.action.Submit',
   requires: ['Ext.direct.Manager'],
   alternateClassName: 'Ext.form.Action.WampSubmit',
   alias: 'formaction.wampsubmit',

   type: 'wampsubmit',

   doSubmit: function () {

      var me = this;
      var params = me.getParams();

      if (me.api.debug) {
         console.log("Ext.form.action.WampSubmit.doSubmit", me.api, params);
      }

      if (!(me.api.session && me.api.session._websocket_connected && me.api.submit)) {

         me.failureType = Ext.form.action.Action.CONNECT_FAILURE;
         me.form.afterAction(me, false);

      } else {

         me.api.session.call(me.api.submit, params).then(
            function (res) {
               if (me.api.debug) {
                  console.log('Form Submit Success', res);
               }
               me.result = res;
               me.form.afterAction(me, true);
            },
            function (err) {
               if (me.api.debug) {
                  console.log('Form Submit Error', err);
               }
               //if (err.details) {
                  // FIXME
                  // form.markInvalid(..);
               //}
               me.failureType = Ext.form.action.Action.SERVER_INVALID;
               me.result = err;
               me.form.afterAction(me, false);
            }
         );
      }
   }
});


Ext.define('Ext.form.action.WampLoad', {
   extend: 'Ext.form.action.Load',
   requires: ['Ext.direct.Manager'],
   alternateClassName: 'Ext.form.Action.WampLoad',
   alias: 'formaction.wampload',

   type: 'wampload',

   run: function () {

      var me = this;
      var params = me.getParams();

      if (me.api.debug) {
         console.log("Ext.form.action.WampLoad.run", me.api, params);
      }

      if (!(me.api.session && me.api.session._websocket_connected && me.api.load)) {

         me.failureType = Ext.form.action.Action.CONNECT_FAILURE;
         me.form.afterAction(me, false);

      } else {

         me.api.session.call(me.api.load, params).then(
            function (res) {
               if (me.api.debug) {
                  console.log('Form Load Success', res);
               }
               me.form.clearInvalid();
               me.form.setValues(res);
               me.form.afterAction(me, true);
            },
            function (err) {
               if (me.api.debug) {
                  console.log('Form Load Error', err);
               }
               me.failureType = Ext.form.action.Action.LOAD_FAILURE;
               me.form.afterAction(me, false);
            }
         );
      }
   }
});


Ext.override(Ext.form.Basic, {

   submit: function (options) {
      if (this.api && this.api.type === 'wamp') {
         return this.doAction('wampsubmit', options);
      } else {
         return this.doAction(this.standardSubmit ? 'standardsubmit' : this.api ? 'directsubmit' : 'submit', options);
      }
   },

   load: function (options) {
      if (this.api && this.api.type === 'wamp') {
         return this.doAction('wampload', options);
      } else {
         return this.doAction(this.api ? 'directload' : 'load', options);
      }
   },

   doAction: function (action, options) {
      if (Ext.isString(action)) {
         var config = {form: this};
         if (this.api && this.api.type === 'wamp') {
            config.api = this.api;
         }
         action = Ext.ClassManager.instantiateByAlias('formaction.' + action, Ext.apply({}, options, config));
      }
      if (this.fireEvent('beforeaction', this, action) !== false) {
         this.beforeAction(action);
         //Ext.defer(action.run, 100, action); // FIXME / Why defer by 100ms?
         action.run();
      }
      return this;
   }
});


Ext.define('Ext.data.WampStore', {
   extend: 'Ext.data.Store',

   // model: has to be specified in the subclass

   // This should be false to prevent the store from reacting on
   // WAMP events by issuing a RPC call.
   autoSync: false,

   constructor: function () {
      var me = this;

        me.addEvents(
        /**
         * @event afterWampWrite
         * Fires when remotely triggered write operation (insert, update, delete) on the store was completed.
         * Fires on update WAMP event only when the record to be updated is in the store.
         * @param {Ext.data.WampStore} this
         * @param {Object} obj The payload of the wamp event.
         */
        'afterWampWrite');

      //me.callParent(arguments);
      Ext.data.WampStore.superclass.constructor.apply(me, arguments);

      me.model.proxy.on('oncreate', function (proxy, obj) {
         var record = me.getById(obj[me.model.prototype.idProperty]);
         if (record) { // then update the existing
            var fields  = me.model.prototype.fields.items;
            for (var i = 0; i < fields.length; ++i) {
               if (obj[fields[i].name] !== undefined) {
                  record.set(fields[i].name, obj[fields[i].name]);
               }
            }
            record.dirty = false;
         } else {
            var records = [new me.model(obj)];
            var options = {
               addRecords: true,
               start: 0
            };
            me.loadRecords(records, options);
         }
         // apply configured sort of the store
         me.sort();
         me.fireEvent('afterWampWrite', me, obj);
      });

      me.model.proxy.on('onupdate', function (proxy, obj) {
         var record = me.getById(obj[me.model.prototype.idProperty]);
         if (record) {
            var fields  = me.model.prototype.fields.items;
            for (var i = 0; i < fields.length; ++i) {
               if (obj[fields[i].name] !== undefined) {
                  record.set(fields[i].name, obj[fields[i].name]);
               }
            }
            record.dirty = false;
             // apply configured sort of the store
             me.sort();
             me.fireEvent('afterWampWrite', me, obj);
         }
      });

      me.model.proxy.on('ondestroy', function (proxy, obj) {
         var record = me.getById(obj[me.model.prototype.idProperty]);
         // record.phantom = true;
         me.remove(record);
         me.fireEvent('afterWampWrite', me, obj);
      });
   }
});


Ext.define('Ext.data.WampTreeStore', {
   extend: 'Ext.data.TreeStore',
   // model: has to be specified in the subclass

   // This should be false to prevent the store from reacting on
   // WAMP events by issuing a RPC call.
   autoSync: false,

   constructor: function () {
      var me = this;

     me.addEvents(
     /**
      * @event afterWampWrite
      * Fires when remotely triggered write operation (insert, update, delete) on the store was completed.
      * Fires on update WAMP event only when the record to be updated is in the store.
      * @param {Ext.data.WampTreeStore} this
      * @param {Object} obj The payload of the wamp event.
      */
     'afterWampWrite');

      // me.callParent(arguments);
      Ext.data.WampTreeStore.superclass.constructor.apply(me, arguments);

      me.model.proxy.on('oncreate', function (proxy, obj) {

         if (obj[me.model.prototype.nodeParam] === "") {
            me.getRootNode().insertChild(0, obj);
         }
         else
         {
            var node = me.getRootNode().findChild(me.model.prototype.nodeParam, obj[me.model.prototype.nodeParam]);
            if (node.isExpanded()) {
               // if the tree is currently expanded, we need to
               // explicitly insert the child
               node.insertChild(0, obj);
            } else {
               // if the tree is collapsed, we expand it, which
               // then implicitly loads the new child
               node.expand();
            }
         }

            // apply sort
            me.sort();
            me.fireEvent('afterWampWrite', me, obj);
      });

      me.model.proxy.on('onupdate', function (proxy, obj) {
         // do a remove and a create. This presumes all properties of the record in the payload.

         // deep search for node
         var node = me.getRootNode().findChild(me.model.prototype.idProperty, obj[me.model.prototype.idProperty], true);
         node.remove();

         // now create
         if (obj[me.model.prototype.nodeParam] === "") {
            me.getRootNode().insertChild(0, obj);
         }
         else
         {
            me.getRootNode().findChild(me.model.prototype.nodeParam, obj[me.model.prototype.nodeParam]).insertChild(0, obj);
         }

            // apply sort
            me.sort();
            me.fireEvent('afterWampWrite', me, obj);
      });

      me.model.proxy.on('ondestroy', function (proxy, obj) {
         // deep search for node
         var node = me.getRootNode().findChild(me.model.prototype.idProperty, obj[me.model.prototype.idProperty], true);
         node.remove();
         me.fireEvent('afterWampWrite', me, obj);
      });
   }
});
