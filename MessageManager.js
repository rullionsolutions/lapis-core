"use strict";

var Base = require("./Base.js");
var Under = require("underscore");


module.exports = Base.clone({
    id: "MessageManager",
    prefix: "",
});


/**
* Initializes the main properties of this object
*/
module.exports.defbind("initialize", "cloneInstance", function () {
    this.messages = [];
    this.error_recorded = false;
});


/**
* To log a message to report to the user and/or visit history
* @param Message object containing at least 'text' property (a string), can also contain 'type'
* ('E', 'W' or 'I'), 'report', 'record', 'high_priority'
*/
module.exports.define("add", function (spec) {
    if (!spec.text) {
        this.throwError("Message must include a text property");
    }
    this.messages.push(spec);
    if (!spec.type) {
        spec.type = "E";
    }
    if (spec.type === "E") {
        this.error_recorded = true;
    }
});


/**
* To log a message corresponding to an exception
* @param Exception object (usually resulting from a caught throw)
*/
module.exports.override("report", function (exception) {
    var spec = {
        type: "E",
        text: exception.toString(),
    };
// next line causes: Java class "[Lorg.mozilla.javascript.ScriptStackElement;" has no public
// instance field or method named "toJSON".
//    Parent.addProperties.call(spec, exception);
    this.add(spec);
    return spec;
});


/**
* Returns the input prefix concatenated with the this.prefix string
* @param prefix string
* @return new prefix string
*/
module.exports.define("updatePrefix", function (prefix) {
    if (typeof prefix === "string") {
        if (prefix && this.prefix) {
            prefix += ", ";
        }
        if (this.prefix) {
            prefix += this.prefix;
        }
    } else {
        prefix = "";
    }
    return prefix;
});


/**
* creates an object starting from the messages array adding on each message the prefix passed as
* input
* @param message object
* @return The same object passed as input or a new one if undefined
*/
module.exports.define("getStringArray", function (type_filter) {
    return this.messages.map(function (msg) {
        return "[" + this.type + "] " + this.prefix + " " + this.text;
    });
});


/**
* To get a string of the messages in this MessageManager, added by calls to add()
* @param tag: string (to control message removal); separator: string to separate each message,
* defaults to newline
* @return message string
*/
module.exports.define("getString", function (separator, type_filter) {
    return this.getStringArray(type_filter).join(separator || "\n");
});


/**
* Copies each message object (selected by tag and type) of the this.messages array in the container
* input array with the message.text prefixed
* @param container array, tag string, prefix string, message type string
*/
module.exports.define("addJSON", function (container, prefix, type) {
    var i;
    var msg;
    var msg_out;

    prefix = this.updatePrefix(prefix);
    function addProp(val, prop) {
        msg_out[prop] = val;
    }

    for (i = 0; i < this.messages.length; i += 1) {
        msg = this.messages[i];
        if (!type || (type === msg.type)) {
            msg_out = {};
            Under.each(msg, addProp);
//            msg_out.type = msg.type;
            msg_out.text = (prefix ? prefix + ": " : "") + msg.text;
            container.push(msg_out);
        }
    }
});


/**
* Removes each message tagged with same tag as passed as input
* @param tag: string (to control message removal)
*/
module.exports.define("clear", function () {
    this.messages = [];
    this.error_recorded = false;
});


/**
* Checks if there are warning messagges with the warn flag to false. if yes it returns true
* @return boolean out
*/
module.exports.define("firstWarnings", function () {
    var msg;
    var i;
    var out = false;

    for (i = 0; i < this.messages.length; i += 1) {
        msg = this.messages[i];
        if (msg.type === "W" && msg.warned !== true) {
            msg.warned = true;
            out = true;
        }
    }
    this.chain(function (msg_mgr) {
        out = msg_mgr.firstWarnings() || out;
    });
    return out;
});
