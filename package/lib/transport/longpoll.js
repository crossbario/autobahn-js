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

var when = require('when');
var util = require('../util.js');



function Factory(options) {
    this.options = options;
    util.assert(this.options.url!==undefined, "options.url missing");
    util.assert(typeof this.options.url === "string" || (typeof this.options.url === "object" && typeof this.options.url.base === "string"), "options.url must be a string or an object with options.url.base");
}

Factory.type = "longpoll";

Factory.prototype.create = function() {
    var longpoll = new LongPollSocket(this.options);
    longpoll._connect();
    return longpoll;

};

function LongPollSocket(longpoll_options) {
    this.name = "longpoll";

    this._transport = null;
    this._requests = {};
    this._receive_timeout = false;
    this._init_transaction_ids();


    this._options = util.merge_options(LongPollSocket.default_options, longpoll_options);
    this._options.url = this._get_url_options(this._options.url);

    util.assert(this._options.url.base, "No base url provided");
    util.assert(this._options.url.send, "No send url provided");
    util.assert(this._options.url.receive, "No receive url provided");
    util.assert(this._options.url.open, "No open url provided");
    util.assert(this._options.url.close, "No close url provided");

    this._cors_needed  = this._determine_if_cors_is_needed();
    this._options.protocols = this._options.protocols || ["wamp.2.json"];
    this.protocol = undefined;
    this._send_buffer = [];
    this._sender = null;
    this._is_closing = false;
    this._retry = true;
    this._connected = false;
    this._connecting = false;
    this.readyState = LongPollSocket.CLOSED;

}
LongPollSocket.prototype._init_transaction_ids = function() {
    this._transaction_ids  = {"receive":0, "send":0};
};
LongPollSocket.prototype._create_transaction_url = function(type, url, additional_params) {
    if(this._cors_needed) {
        if(additional_params) {
            return url+"?"+additional_params;
        } else {
            return url;
        }

    } else {
        this._transaction_ids[type]++;
        if(additional_params) {
            return url+'?x=' + this._transaction_ids[type]+'&'+additional_params;
        } else {
            return url+'?x=' + this._transaction_ids[type];
        }

    }
};

LongPollSocket.prototype._determine_if_cors_is_needed = function() {
    var longpoll_uri = util.parseUri(this._options.url.base);
    return longpoll_uri.authority!=window.location.host;

};
LongPollSocket.prototype._get_url_options = function(url) {
    var uri;
    var url_object = {};
    if(typeof url === "object") {
        url_object = url;

    } else if (typeof url === "string") {
        uri = util.parseUri(url);
        if(uri.protocol == "ws") {
            // we got the default url from the connection config
            url = "http://"+uri.authority+"/longpoll";
        } else if(uri.protocol == "wss") {
            // we got the default url from the connection config
            url = "https://"+uri.authority+"/longpoll";
        }
        url_object.base = url;
        url_object = util.merge_options(LongPollSocket.default_options.url, url_object);


    }
    return url_object;

};
LongPollSocket.default_options={
    transport: LongPollSocket,
    send_interval: 500,
    open_timeout: 30,
    send_timeout: 30,
    close_timeout: 10,
    receive_timeout: -1, // no timeout
    url: { base: null, send: "/send", open: "/open", receive: "/receive", close: "/close" }
};
LongPollSocket.CONNECTING = 0;

LongPollSocket.OPEN = 1;

LongPollSocket.CLOSING = 2;

LongPollSocket.CLOSED = 3;
LongPollSocket.prototype.send = function (payload) {
    if (!this._connected && !this._connecting) {
        console.warn("Socket not connected, buffering...");
    }

    this._send_buffer.push(payload);


};
LongPollSocket.prototype._destruct = function() {
    this._terminate_sockets();

};

LongPollSocket.prototype._on_receive_success = function (req, res) {
    console.debug("receive ok", res);
    if(typeof res[0] === "number") {
        res=[res];
    }
    for (var i = 0; i < res.length; i++) {
        this.onmessage(res[i], true);
    }

    if (!self._is_closing) {
        this.receive();
    }
};
LongPollSocket.prototype._on_receive_failure = function (req, code) {
    if(this._receive_timeout) {
        this._receive_timeout = false;
        return;
    }
    console.error("receive failed", code, req.responseText);


    if (code === 0 || (code >= 400 && code<=999)) {
        // We lost our session??
        this._connected && this.onclose({"code":code,"reason":req.responseText,"wasClean": false});
    } else if(code>=1000) {
        this._connected && this.onclose({"code":code,"reason":req.responseText,"wasClean": false});
    } else if (!self._is_closing) {
        this.receive();
    }
};
LongPollSocket.prototype.receive = function () {
    if (this._is_closing) return;

    this._request("receive", this._create_transaction_url("receive", this._options.url.base + '/' + this._transport + this._options.url.receive),
        undefined, {timeout:this._options.receive_timeout, ontimeout: this._init_receiver.bind(this)}).then(
        this._on_receive_success.bind(this, this._requests["receive"]),
        this._on_receive_failure.bind(this, this._requests["receive"])
    );
};
LongPollSocket.prototype._on_close_success = function (req, code, reason, res) {

    this.readyState = LongPollSocket.CLOSED;
    console.debug("closed successfully");
    return this._close(code, reason);
};
LongPollSocket.prototype._on_close_failure = function (req, code, reason) {

    this.readyState = LongPollSocket.CLOSED;
    console.error("closed with error", req);


};
LongPollSocket.prototype._on_open_success = function (req, res) {

    this.readyState = LongPollSocket.OPEN;
    console.debug("ok", res);
    console.debug(res.transport);
    this._transport = res.transport;
    this.name = "longpoll(#"+this._transport+')'
    this.protocol = res.protocol;
    this._send_buffer = [];
    this._transaction_ids  = {"receive":0, "send":0};
    this._init_sender();
    this._init_receiver();
    this.onopen(self);
    this._connected = true;
};
LongPollSocket.prototype._on_open_failure = function (req, code) {
    console.error("failed", code, req.responseText);
    this.readyState = LongPollSocket.CLOSED;

    this.onerror(code, "open call failed", req);
    this.onclose({wasClean:false,code:code,msg:req.responseText});

};
LongPollSocket.prototype._connect = function () {
    if (this._connecting) {
        console.warn("Already connecting");
        return;
    } else if (this._connected) {
        console.warn("Already connected");
        return;
    }
    this.readyState = LongPollSocket.CONNECTING;
    this._connecting = true;
    this._request("open", this._create_transaction_url("send", this._options.url.base + this._options.url.open), JSON.stringify(this._options),
        {"timeout":this._options.open_timeout, ontimeout:this._close_timeout.bind(this, false)}).then(
        this._on_open_success.bind(this, this._requests["open"]), this._on_open_failure.bind(this, this._requests["open"]));
};
LongPollSocket.prototype.close = function (code, reason) {
    if(this._connected) {
        this._is_closing = true;
        try {
           this._request("close", this._create_transaction_url("send", this._options.url.base + this._options.url.close, 'session='+this._transport), undefined,
            {timeout:this._options.close_timeout, ontimeout:this._close_timeout.bind(this, false)}, false);
            return this._on_close_success(this._requests["close"],code,reason);
        }  catch (exc) {
            return this._on_close_failure(this._requests["close"],code,reason);
        }



    }

};
LongPollSocket.prototype._close_timeout = function(trigger_error) {
    this._terminate_sockets();
    this._connected = false;
    this._connecting = false;
    this.readyState = LongPollSocket.CLOSED;
    trigger_error = trigger_error===undefined?true: trigger_error;
    if(trigger_error) {
        this.onerror(-1, "Timeout", {});
    }

};
LongPollSocket.prototype._close = function(code, reason) {
    this._terminate_sockets();
    this._connected = false;
    this._connecting = false;
    this.readyState = LongPollSocket.CLOSED;
     if(this.onerror) {
        var msg="Socket was closed";
        if(code===1000) {
            msg+=" cleanly";
        } else {
            msg+=" uncleanly";
        }
        this.onerror(code, reason,msg);
    }

    return this._send_buffer;
};

LongPollSocket.prototype.onmessage = function () {

};
LongPollSocket.prototype.onopen = function () {

};
LongPollSocket.prototype.onclose = function () {

};
LongPollSocket.prototype.onerror = function () {

};


LongPollSocket.prototype._terminate_sockets = function () {

    for (var k in this._requests) {
        this._requests[k].onreadystatechange = null;
        this._requests[k].abort();
        this._requests[k] = null;
        delete this._requests[k];

    }
};

LongPollSocket.prototype._on_send_success = function (req, res) {
    console.debug("send result:", res, req);

    clearTimeout(this._sender);
    this._sender = null;
    this._init_sender();
};
LongPollSocket.prototype._on_send_failure = function (req, code) {
    console.error("failed", code, req.responseText, req);
    if (code === 0 || code >= 400) {
        // We lost our session??
        this._sender = null;
        this._connected && this.onclose({"code":code,"reason":req.responseText,"wasClean": false});
    } else {
        clearTimeout(this._sender);
        this._sender = null;
        this._init_sender();
        this.onerror(code, msg, resp);
    }

};
LongPollSocket.prototype._send_data = function () {

            if (this._send_buffer.length) {

                var send_buffer = this._send_buffer.join('\x00');
                this._send_buffer = [];
                // send send_buffer ..

                this._request("send", this._create_transaction_url("send", this._options.url.base + '/' + this._transport + this._options.url.send) , send_buffer,
                    {timeout:this._options.send_timeout, ontimeout:this._close_timeout.bind(this)}).then(
                    this._on_send_success.bind(this, this._requests["send"]),
                    this._on_send_failure.bind(this, this._requests["send"])
                );

            } else {
                this._sender = null;
                this._init_sender();
            }
        };
LongPollSocket.prototype._init_sender = function () {
    if (this._sender === null) {
        this._sender = setTimeout(this._send_data.bind(this), this._options.send_interval);
    }
};
LongPollSocket.prototype._init_receiver = function () {
    this._receive_timeout = true;
    setTimeout(this.receive.bind(this), 100);
};

LongPollSocket.prototype._onreadystatechange = function (id, d, evt) {

    if (this._requests[id].readyState === 4) {


        if (this._requests[id].status === 200) {
            var txt=this._requests[id].responseText;
            try {
               var msg = JSON.parse(txt);
                d.resolve(msg);
            } catch(Exc) {
                // empty receive with status 200 => timeout of session, failing,
                d.reject(this._requests[id].status, this._requests[id].responseText, this._requests[id]);
            }


        } else if (this._requests[id].status === 204 || this._requests[id].status === 1223) {
            d.resolve();

        } else {
            d.reject(this._requests[id].status, this._requests[id].responseText, this._requests[id]);
            //cors_preflight(url,d, data);
        }

    }
};
LongPollSocket.prototype._close_socket_if_still_not_connected = function(req) {
    if(req.readyState===1 || (req.readyState === 4 && req.status === 0)) {
        this._close_timeout();
    }
};
LongPollSocket.prototype._request = function (id, url, data, options, async) {
    options = options || {};
    async = async === undefined? true:async;

    var d = when.defer();
    if (!this._requests[id]) {

        this._requests[id] = new XMLHttpRequest();


    } else if(this._requests[id].readyState === 1 && async) {
        d.reject("Could not load resource");
        if (d.promise.then) {
            // whenjs has the actual user promise in an attribute
            return d.promise;
        } else {
            return d;
        }
    }
    if(async) {
       this._requests[id].onreadystatechange = this._onreadystatechange.bind(this, id, d);
    } else {
        this._requests[id].onreadystatechange = null;
    }

    try {

        this._requests[id].open("POST", url, async);

        if(options.timeout>0 && options.timeout!=this._requests[id].timeout) {
           this._requests[id].timeout = options.timeout*1000;
             if(options.ontimeout) {
                this._requests[id].ontimeout=options.ontimeout;
             } else {
                 this._requests[id].ontimeout = null;
             }

        } else if(options.timeout<1) {
            this._requests[id].ontimeout = null;
            this._requests[id].timeout = null;
        }
        this._requests[id].setRequestHeader("Content-type", "application/json; charset=utf-8");


    } catch (exc) {
        console.error(exc);
            if(async) {
            d.reject(exc);
            if (d.promise.then) {
                // whenjs has the actual user promise in an attribute
                return d.promise;
            } else {
                return d;
            }
        //cors_preflight(url,d, data);
        } else {
            throw exc;
        }

    }

    try {
         if (data !== undefined) {

            this._requests[id].send(data);


        } else {
            this._requests[id].send();
        }
    } catch(exc2) {
        if(async) {
           d.reject(exc2);
        } else {
            throw exc2;
        }

    }

    if(!async) {
        if (this._requests[id].status === 200) {


            return JSON.parse(this._requests[id].responseText);

        } else if (this._requests[id].status === 204 || this._requests[id].status === 1223) {
            d.resolve();
            return;

        } else {

            //cors_preflight(url,d, data);
            throw {"status":this._requests[id].status, "responseText": this._requests[id].responseText, "request": this._requests[id]};
        }
    }

    if (d.promise.then) {
        // whenjs has the actual user promise in an attribute
        return d.promise;
    } else {
        return d;
    }

};

exports.Factory = Factory;

