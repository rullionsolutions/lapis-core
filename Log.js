"use strict";

var Base = require("./Base.js");


Base.define("log_levels", {
    trace: 0,
    into: 1,
    debug: 2,
    info: 4,
    warn: 6,
    error: 8,
    fatal: 10,
});

Base.define("log_level", 0);

Base.define("log_levels_text", [
    "TRACE", "INTO",
    "DEBUG", null,
    "INFO ", null,
    "WARN ", null,
    "ERROR", null,
    "FATAL", null,
]);

Base.define("log_counters", {});

// moving from arguments (str) to (this, str)...
Base.define("trace", function (str) {
    this.doLog(this.log_levels.trace, str);
});


Base.define("debug", function (str) {
    this.doLog(this.log_levels.debug, str);
});


Base.define("info", function (str) {
    this.doLog(this.log_levels.info, str);
});


Base.define("warn", function (str) {
    this.doLog(this.log_levels.warn, str);
});


Base.define("error", function (str) {
    this.doLog(this.log_levels.error, str);
});


Base.define("fatal", function (str) {
    this.doLog(this.log_levels.fatal, str);
    // var email = Entity.getEntity("ac_email").create({
    //     to_addr: "rsl.support@rullion.co.uk",
    //     subject: "URGENT - Fatal Error on " + App.id,
    //     body: ((a ? a.toString() + ": " : "") + (b ? b.toString() : ""))
    // });
    // email.send();                        // send email w/o page success
});


Base.define("report", function (e, log_level) {
    this.doLog(log_level || this.log_levels.error, e.toString());
    this.output(e.stack);
});


Base.define("doLog", function (log_level, str) {
    this.log_counters[log_level] = (this.log_counters[log_level] || 0) + 1;
    if (this.checkLogLevel(log_level)) {
        this.printLogLine(this.log_levels_text[log_level] + ": " + str);
    }
});


Base.define("setLogLevel", function (new_log_level) {
    if (new_log_level !== this.log_level) {
        this.log_level = new_log_level;
        this.output("switched to log level: " + this.log_levels_text[this.log_level]);
    }
});


Base.define("checkLogLevel", function (log_level) {
    return (log_level >= this.log_level);
});


Base.define("reportException", function (e, log_level) {
    log_level = log_level || this.log_levels.error;
    this.doLog(e.toString() + (e.hasOwnProperty ? ", " + this.view.call(e) : " [Java Object]"), log_level);
});


Base.define("printLogLine", function (str) {
    if (this.line_prefix === "time") {
        str = (new Date()).format("HH:mm:ss.SSS") + " " + str;
    } else if (this.line_prefix === "datetime") {
        str = (new Date()).format("yyyy-MM-dd HH:mm:ss.SSS") + " " + str;
    }
    this.output(str);
});


Base.define("resetLogCounters", function () {
    this.log_counters = {};
});


Base.define("printLogCounters", function () {
    var str = "";
    var delim = "";
    var log_level;

    for (log_level = 0; log_level <= 10; log_level += 2) {
        str += delim + this.log_levels_text[log_level] + ": " + (this.log_counters[log_level] || 0);
        delim = ", ";
    }
    this.printLine(str);
});

