"use strict";

var Base = require("./Base.js");


module.exports = Base.clone({
    id: "Format",
    decimal_digits: 0,
    total_width: 10,
});


module.exports.define("round", function (number, decimals) {
    if (!decimals) {
        decimals = 0;
    }
    return Math.floor((number * Math.pow(10, decimals)) + 0.5) / Math.pow(10, decimals);
});


module.exports.define("isStrictNumber", function (str) {
    return !!(str && str.match(/^-?[0-9]*$|^-?[0-9]*\.[0-9]*$/));
});


module.exports.define("parseStrict", function (str) {
    if (!this.isStrictNumber(str)) {
        this.throwError(str + " is not a number");
    }
    return parseFloat(str, 10);
});


module.exports.define("repeat", function (str, num) {
    return new Array(num + 1).join(str);
});


module.exports.define("leftJustify", function (arg, total_width, decimal_digits) {
    total_width = total_width || this.total_width;
    decimal_digits = decimal_digits || this.decimal_digits;
    if (typeof arg === "number") {
        arg = arg.toFixed(decimal_digits);
    }
    return arg.toString() + this.repeat(" ", Math.max(total_width - arg.length, 0));
});


module.exports.define("rightJustify", function (arg, total_width, decimal_digits) {
    total_width = total_width || this.total_width;
    decimal_digits = decimal_digits || this.decimal_digits;
    if (typeof arg === "number") {
        arg = arg.toFixed(decimal_digits);
    }
    return this.repeat(" ", Math.max(total_width - arg.length, 0)) + arg.toString();
});


module.exports.define("trim", function (str) {
    if (!str) {
        return str;
    }
    return (String(str)).replace(/(^\s*)|(\s*$)/g, "");
});


module.exports.define("toTitleCase", function (str) {
    var i;
    var out = "";
    var first_letter = true;

    for (i = 0; i < str.length; i += 1) {
        if ((str.charCodeAt(i) >= 65 && str.charCodeAt(i) <= 90) ||
            (str.charCodeAt(i) >= 97 && str.charCodeAt(i) <= 122)) {
            if (first_letter) {
                out += str.charAt(i).toUpperCase();
                first_letter = false;
            } else {
                out += str.charAt(i).toLowerCase();
            }
        } else {
            out += str.charAt(i);
            first_letter = true;
        }
    }
    return out;
});


module.exports.define("convertNameFirstSpaceLast", function (name) {
    var index = name.indexOf(",");
    if (index > -1) {            // only attempt to convert if comma is present
        name = this.trim(name.substr(index + 1)) + " " + this.trim(name.substr(0, index));
    }
    return name;
});


module.exports.define("convertNameLastCommaFirst", function (name) {
    var index = name.indexOf(",");
    if (index === -1) {                         // only attempt to convert if comma is NOT present
        index = name.indexOf(" ");              // assume last name part is before FIRST space
        if (index > -1) {
            name = this.trim(name.substr(index + 1)) + ", " + this.trim(name.substr(0, index));
        }
    }
    return name;
});


module.exports.define("convertNameFirstOnly", function (name) {
    var index = name.indexOf(",");
    if (index > -1) {            // only attempt to convert if comma is present
        name = this.trim(name.substr(index + 1));
    }
    return name;
});


module.exports.define("convertNameLastOnly", function (name) {
    var index = name.indexOf(",");
    if (index > -1) {            // only attempt to convert if comma is present
        name = this.trim(name.substr(0, index));
    }
    return name;
});


module.exports.define("getRandomNumber", function (to, from, decimal_digits) {
    if (typeof to !== "number") {
        this.throwError("'to' argument must be a number");
    }
    if (typeof from !== "number") {
        from = 0;
    }
    if (to <= from) {
        this.throwError("'to' argument must be greater than 'from'");
    }
    decimal_digits = decimal_digits || this.decimal_digits;
    return ((Math.floor(Math.random() * (to - from) * Math.pow(10, decimal_digits))
                / Math.pow(10, decimal_digits)) + from);
});


module.exports.define("getRandomStringArray", function (options) {
    var array = [];

    function addRange(from, to) {
        var i;
        for (i = from; i <= to; i += 1) {
            array.push(String.fromCharCode(i));
        }
    }
    if (options && options.space) {
        addRange(32, 32);
        addRange(32, 32);
        addRange(32, 32);
        addRange(32, 32);
        addRange(32, 32);
    }
    if (options && options.digits) {
        addRange(48, 57);
    }
    if (!options || options.uppercase || typeof options.uppercase !== "boolean") {
        addRange(65, 90);
    }
    if (!options || options.lowercase || typeof options.lowercase !== "boolean") {
        addRange(97, 122);
    }
    return array;
});


module.exports.define("getRandomString", function (length, array) {
    var i;
    var val = "";

    if (typeof length !== "number") {
        this.throwError("Lib.getRandomString() length must be a number");
    }
    if (typeof array === "string") {
        for (i = 0; i < length; i += 1) {
            val += array.substr(Math.floor(Math.random() * array.length), 1);
        }
        return val;
    }
    if (typeof array === "object" || !array) {
        array = this.getRandomStringArray(array);
    }
    for (i = 0; i < length; i += 1) {
        val += array[Math.floor(Math.random() * array.length)];
    }
    return val;
});

