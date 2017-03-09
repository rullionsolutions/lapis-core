"use strict";

var Core = require("lapis-core/index.js");


module.exports = Core.Base.clone({
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


module.exports.define("parseStrictNumber", function (str) {
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


module.exports.define("toNameCase", module.exports.toTitleCase);


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
        this.throwError("length must be a number");
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


module.exports.define("getDBDateFormat", function (format) {
    return format
        .replace("HH", "%H")
        .replace("mm", "%i")
        .replace("ss", "%s")
        .replace("dd", "%z")      // %z - not used by MySQL - holding char
        .replace("MM", "%m")
        .replace("yyyy", "%Y")
        .replace("d", "%e")
        .replace("M", "%c")
        .replace("yy", "%y")
        .replace("%z", "%d");
});


/**
* To attempt to parse a given date (or date/time) string, using given in/out formats if supplied,
* and applying any 'adjusters'
* @param A date string, with optional 'adjusters', separated by '+' chars, e.g. 'week-start',
* 'month-end', '2months', '-3minutes', numbers interpreted as days; 2nd arg is optional string
* input format, 3rd arg is optional string out format
* @return Converted date string (if conversion could be performed), otherwise returns the input
* string
*/
module.exports.define("parseDateExpressionToDate", function (str, in_format) {
    var datetime;
    if (typeof str !== "string" || !str) {
        return null;
    }

    function doDateInitializer(part) {
        if (part.toLowerCase() === "today") {
            datetime = new Date();
            datetime.clearTime();
        } else if (part.toLowerCase() === "now") {
            datetime = new Date();
        } else {
            datetime = Date.parseString(part, in_format);
        }
    }

    function doDateAmender(part) {
        if (part === "day-start") {
            datetime.clearTime();
        } else if (part === "day-end") {
            datetime.setHours(23);
            datetime.setMinutes(59);
            datetime.setSeconds(59);
            datetime.setMilliseconds(999);
        } else if (part === "week-start") {
            datetime.add("d", -(datetime.getDay() % 7));            // getDay() returns 0 for Sun to 6 for Sat
        } else if (part === "week-end") {
            datetime.add("d", 6 - (datetime.getDay() % 7));
        } else if (part === "month-start") {
            datetime.setDate(1);
        } else if (part === "month-end") {
            datetime.add("M", 1);
            datetime.setDate(1);
            datetime.add("d", -1);
        } else if (part.indexOf("minutes") > -1) {
            datetime.add("m", parseInt(part, 10));
        } else if (part.indexOf("hours") > -1) {
            datetime.add("h", parseInt(part, 10));
        } else if (part.indexOf("days") > -1) {
            datetime.add("d", parseInt(part, 10));
        } else if (part.indexOf("weeks") > -1) {
            datetime.add("d", parseInt(part, 10) * 7);
        } else if (part.indexOf("months") > -1) {
            datetime.add("M", parseInt(part, 10));
        } else if (part.indexOf("years") > -1) {
            datetime.add("y", parseInt(part, 10));
        } else if (parseInt(part, 10).toFixed(0) === part) {
            datetime.add("d", parseInt(part, 10));
        } else {
            this.throwError("date/time amended before being initialized: " + str);
        }
    }

    str.split("+").forEach(function (part) {
        if (datetime) {
            doDateAmender(part);
        } else {
            doDateInitializer(part);
        }
    });

    if (!datetime) {
        this.throwError("not a valid date/time expression: " + str);
    }
    return datetime;
});


module.exports.define("parseDateExpression", function (str, in_format, out_format) {
    var datetime = this.parseDateExpressionToDate(str, in_format);
    if (datetime) {
        str = datetime.format(out_format || "yyyy-MM-dd");
    }
    return str;
});


module.exports.define("parseStrictDate", function (str, format) {
    format = format || this.date_format;
});


// module.exports.define("fitStringToFormat", function (str, format) {
//     var match = format.match(/(\w){1,2}\W((\w){1,2}\W?(\w){1,2}\W?(\w){1,2}\W?(\w){1,2}\W?)


// For use making snippets of HTML documents.
module.exports.define("snippetHTML", function (text, limit) {
    var stripped;
    var offset;

    if (typeof text !== "string") {
        text = String(text);
    }

    stripped = text.replace(/<\/?[a-zA-Z]+\s?[^>]*>/gi, "");
    // Offset = length of tags in stripped version - accounted for in limit calculation
    offset = text.length - stripped.length;

    // replace with simple html tags (no attributes)
    text = text.replace(/(<\/?[a-zA-Z]+)\s?[^>]*>/gi, "$1>").replace(/<\/?meta>/gi, "");
    if (stripped.length > limit) {
        text = text.substring(0, offset + limit);
        text = this.fixHTML(text);
    }
    return text;
});

// Finds unclosed HTML tags and appends closing tags.
// Should return well-structured HTML
module.exports.define("fixHTML", function (text) {
    var text2 = text;  // save for result
    var tags = "";
    // Outer match first, so construct closing tags in reverse order.
    var patt = /<([a-z]+)\b[^>/]*>(?!.*?<\/\1>).*$/i;
    var test = text.match(patt); // Format [ matched_span, (1) ]
    while (test) { // while there are still incomplete tags
        tags = "</" + test[1] + ">" + tags;
        // This one should no longer match, will find the next shortest.
        text = text2 + tags;
        test = text.match(patt);
    }
    // Append tags to saved original text
    text2 += tags;
    return text2;
});
