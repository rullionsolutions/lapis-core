"use strict";

var Core = require("lapis-core/index.js");
// var Under = require("underscore");


module.exports = Core.Base.clone({
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


module.exports.define("addMessagesToArray", function (array, type_filter) {
    this.messages.forEach(function (msg) {
        if (!type_filter || (type_filter === msg.type)) {
            array.push(msg);
        }
    });
    this.chain(function (msg_mgr) {
        msg_mgr.addMessagesToArray(array, type_filter);
    });
});

/**
* creates an object starting from the messages array adding on each message the prefix passed as
* input
* @param message object
* @return The same object passed as input or a new one if undefined
*/
module.exports.define("addMessagesToStringArray", function (array, type_filter, parent_prefix, include_type) {
    var that = this;
    var new_prefix = this.getNewPrefix(parent_prefix);
    this.messages.forEach(function (msg) {
        if (!type_filter || (type_filter === msg.type)) {
            array.push(that.getMessageAsString(msg, new_prefix, include_type));
        }
    });
    this.chain(function (msg_mgr) {
        msg_mgr.addMessagesToStringArray(array, type_filter, new_prefix, include_type);
    });
});


module.exports.define("getMessageAsString", function (msg, prefix, include_type) {
    var out = "";
    if (include_type) {
        out = "[" + msg.type + "] ";
    }
    if (prefix) {
        out += prefix;
    }
    return out + msg.text;
});


module.exports.define("getNewPrefix", function (parent_prefix) {
    var out = parent_prefix || "";
    var local_prefix = this.getPrefix();
    if (typeof parent_prefix === "string") {
        if (parent_prefix && parent_prefix.substr(-2) !== ", ") {
            out += ", ";
        }
        out += local_prefix;
    }
    return out;
});


/**
* Returns the input prefix concatenated with the this.prefix string
* @param prefix string
* @return new prefix string
*/
module.exports.define("getPrefix", function () {
    return this.prefix;
});


/**
* To get a string of the messages in this MessageManager, added by calls to add()
* @param tag: string (to control message removal); separator: string to separate each message,
* defaults to newline
* @return message string
*/
module.exports.define("getString", function (separator, type_filter) {
    var array = [];
    this.addMessagesToStringArray(array, type_filter);
    return array.join(separator || "\n");
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
    // function addProp(val, prop) {
    //     msg_out[prop] = val;
    // }

    for (i = 0; i < this.messages.length; i += 1) {
        msg = this.messages[i];
        if (!type || (type === msg.type)) {
            msg_out = {};
            Core.Base.addProperties.call(msg_out, msg);
            // Under.each(msg, addProp);
//            msg_out.type = msg.type;
            msg_out.text = (prefix ? prefix + ": " : "") + msg.text;
            container.push(msg_out);
        }
    }
});


module.exports.define("count", function () {
    return this.messages.length;
});


module.exports.define("chain", function (msg_mgr) {
});


/**
* Removes each message tagged with same tag as passed as input
* @param tag: string (to control message removal)
*/
module.exports.define("clear", function (filter_tag, filter_type) {
    var n = 0;
    var msg;

    this.error_recorded = false;
    while (n < this.messages.length) {
        msg = this.messages[n];
        if (!msg.fixed && (!filter_type || filter_type === msg.type)) {
            if (filter_tag) {
                msg[filter_tag] = false;
            } else {
                msg.report = false;
                msg.record = false;
            }
        }
        if (msg.report === false && msg.record === false) {
            this.messages.splice(n, 1);
            this.number -= 1;
        } else {
            if (msg.type === "E") {
                this.error_recorded = true;
            }
            n += 1;
        }
    }
    // clear() doesn't chain down to every level - from Session to Trans and from Trans to Record
    // but NOT from Record to Field
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
