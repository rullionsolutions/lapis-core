/* global console, print */

"use strict";

// var Under = require("underscore");
// var Q = require("q");

/**
* Top-level Archetype object, from which all others should be cloned
*/
module.exports = {
    id: "Base",
};


// sanity check method - ensures key doesn't already exist anywhere in prototype chain
module.exports.define = function (key, value) {
    if (this[key] !== undefined) {
        this.throwError("key already exists in prototype chain: " + key);
    }
    this[key] = value;
    if (typeof value === "function") {
        value.displayName = key;
    }
    return value;
};


// sanity check method - ensures key doesn't already exist in this object
module.exports.override = function (key, value) {
    if (Object.hasOwnProperty.call(this, key)) {
        this.throwError("key already exists in object: " + key);
    }
    if (this[key] === undefined) {
        this.throwError("key does not exist in prototype chain: " + key);
    }
    if (typeof this[key] !== typeof value) {
        this.throwError("value's typeof is not the same as original value's: " + key);
    }
    this[key] = value;
    if (typeof value === "function") {
        value.displayName = key;
    }
    return value;
};


// sanity check method - reassign key if it already exist in this object
module.exports.reassign = function (key, value) {
    if (!Object.hasOwnProperty.call(this, key)) {
        this.throwError("key does not exist in object: " + key);
    }
    if (typeof this[key] !== typeof value) {
        this.throwError("value's typeof is not the same as original value's: " + key);
    }
    this[key] = value;
    if (typeof value === "function") {
        value.displayName = key;
    }
    return value;
};


/**
* Create a new object inherited from this one
* @param spec: object map of properties to be set in the new object
* @return Newly cloned object
*/
module.exports.define("clone", function (spec) {
    var obj;
    if (typeof spec !== "object") {
        this.throwError("clone requires spec object");
    }
    if (typeof spec.id !== "string" || spec.id === "") {
        this.throwError("clone requires id");
    }
    if (this.instance) {
        this.throwError("cannot clone instance");
    }
    obj = Object.create(this);
    obj.parent = this;
    if (typeof obj.addProperties !== "function") {
        this.throwError("suspect new keyword used");
    }
    if (spec) {
        obj.addProperties(spec);
    }
    if (obj.instance) {
        obj.afterCloneInstance();
    } else {
        obj.afterCloneType();
    }
    return obj;
});


// hooks for Happen...
module.exports.define("afterCloneInstance", function () { return undefined; });
module.exports.define("afterCloneType", function () { return undefined; });


/**
* Remove this object from its owning OrderedMap (if there is one), as identified by the
* 'owner' property
*/
module.exports.define("remove", function () {
    if (!this.owner || typeof this.owner.remove !== "function") {
        this.throwError("no owner with a remove() function");
    }
    this.owner.remove(this.id);
});


/**
* Output a string representation of the object, including all its ancesters,
* delimited by '/'s
* @return String representation of the object
*/
module.exports.override("toString", function () {
    var out = "";
    var level = this;

    while (level) {
        out = "/" + level.id + out;
        level = level.parent;
    }
    return out;
});


/**
* Add the given properties to this object
* @param spec: object map of properties to add
*/
module.exports.define("addProperties", function (spec) {
    // Under.extend(this, spec);
    var that = this;
    // Under.each(spec, function (value, key) {
    Object.keys(spec).forEach(function (key) {
        that[key] = spec[key];
    });
    return this;
});


/**
* Return string argument with tokens (delimited by braces) replaced by property values
* @param str: string argument, possibly including tokens surrounded by braces
* @return String argument, with tokens replaced by property values
*/
module.exports.define("detokenize", function (str, replaceToken, replaceNonToken) {
    var out = "";
    var buffer = "";
    var inside_braces = false;
    var i;

    if (typeof str !== "string") {
        this.throwError("invalid argument");
    }
    replaceToken = replaceToken || this.replaceToken;
    replaceNonToken = replaceNonToken || function (str2) { return str2; };

    for (i = 0; i < str.length; i += 1) {
        if (str[i] === "}" && inside_braces && buffer && i > 0 && str[i - 1] !== "\\") {
            out += replaceToken.call(this, buffer, out);
            buffer = "";
            inside_braces = false;
        } else if (str[i] === "{" && !inside_braces && (i === 0 || str[i - 1] !== "\\")) {
            out += replaceNonToken.call(this, buffer, out);
            buffer = "";
            inside_braces = true;
        } else {
            buffer += str[i];
        }
    }
    return out + replaceNonToken.call(this, buffer, out);
});


module.exports.define("replaceToken", function (token) {
    return (typeof this[token] === "string" ? this[token] : "{unknown: " + token + "}");
});


/**
* Return a string representation of this object's properties, by calling toString() on each
* @return String representation of this object's properties
*/
module.exports.define("view", function (format) {
    var str = (format === "block" ? "" : "{");
    var delim = "";
    var that = this;

    Object.keys(this).forEach(function (key) {
        if (typeof that[key] !== "function") {
            str += delim + key + "=" + that[key];
            delim = (format === "block" ? "\n" : ", ");
        }
    });
    return str + (format === "block" ? "" : "}");
});


module.exports.define("output", function (str) {
    if (typeof console !== "undefined") {
        console.log(str);
    } else if (typeof print === "function") {
        print(str);
    }
});


// overcome issues with strack traces
module.exports.define("throwError", function (str_or_spec) {
    var str = (typeof str_or_spec === "string") ? str_or_spec : (str_or_spec.text || str_or_spec.id);
    // var new_exc = new Error(str);
    // the above DOESN'T produce stack trace in Rhino...
    var new_exc;
    try {
        this.callFunctionWithNameThatDoesntExist();
    } catch (e) {
        new_exc = e;
        new_exc.name = "LapisError";
        new_exc.message = str;
    }
    new_exc.object = this;
    if (typeof str_or_spec !== "string") {
        this.addProperties.call(new_exc, str_or_spec);
    }
    throw new_exc;
});


/**
* To check if an Object is a descendant of another, through its parent property
* @param Object
* @return Boolean true if descendant false otherwise
*/
module.exports.define("isDescendantOf", function (obj) {
    return !!this.parent && (this.parent === obj || this.parent.isDescendantOf(obj));
});


module.exports.define("isOrIsDescendant", function (a, b) {
    if (!a || !b || typeof a.isDescendantOf !== "function") {
        return false;
    }
    if (a === b) {
        return true;
    }
    return a.isDescendantOf(b);
});


// deprecated - prefer use of Q.fcall directly...
/*
module.exports.define("getNullPromise", function (resolve_arg) {
    return Q.fcall(function () {
        return resolve_arg;
    });
});


module.exports.define("getReadableStreamToStringPromise", function (reader, encoding) {
    return Q.Promise(function (resolve, reject) {
        var raw_data = "";
        response.on("data", function (chunk) {
            raw_data += chunk;
        });
        response.on("end", function () {
            resolve(raw_data);
        });
        response.on("error", function (error) {
            reject(error);
        });
    });
});
*/
