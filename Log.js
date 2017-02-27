"use strict";

var Core = require("lapis-core/index.js");


Core.Base.define("log_levels", {
    trace: 0,
    into: 1,
    debug: 2,
    info: 4,
    warn: 6,
    error: 8,
    fatal: 10,
});

Core.Base.define("log_level", 4);        // INFO level by default

Core.Base.define("log_show_caller", true);        // output calling object

Core.Base.define("log_levels_text", [
    "TRACE", "INTO",
    "DEBUG", null,
    "INFO ", null,
    "WARN ", null,
    "ERROR", null,
    "FATAL", null,
]);

Core.Base.define("log_counters", {});

// moving from arguments (str) to (this, str)...
Core.Base.define("trace", function (str) {
    this.doLog(this.log_levels.trace, str);
});


Core.Base.define("debug", function (str) {
    this.doLog(this.log_levels.debug, str);
});


Core.Base.define("info", function (str) {
    this.doLog(this.log_levels.info, str);
});


Core.Base.define("warn", function (str) {
    this.doLog(this.log_levels.warn, str);
});


Core.Base.define("error", function (str) {
    this.doLog(this.log_levels.error, str);
});


Core.Base.define("fatal", function (str) {
    this.doLog(this.log_levels.fatal, str);
    // var email = Entity.getEntity("ac_email").create({
    //     to_addr: "rsl.support@rullion.co.uk",
    //     subject: "URGENT - Fatal Error on " + App.id,
    //     body: ((a ? a.toString() + ": " : "") + (b ? b.toString() : ""))
    // });
    // email.send();                        // send email w/o page success
});


Core.Base.define("report", function (e, log_level) {
    this.doLog(log_level || this.log_levels.error, e.toString() + " thrown from " + e.object);
    this.output(e.stack || "[no stack trace]");
});


// Deprecated version of above
Core.Base.define("reportException", function (e, log_level) {
    this.report(e, log_level);
});


Core.Base.define("doLog", function (log_level, str) {
    this.log_counters[log_level] = (this.log_counters[log_level] || 0) + 1;
    if (this.checkLogLevel(log_level)) {
        this.printLogLine(str, log_level);
    }
});


Core.Base.define("setLogLevel", function (new_log_level) {
    if (new_log_level !== this.log_level) {
        if (!this.log_levels_text[new_log_level]) {
            this.throwError("unrecognized log level: " + new_log_level);
        }
        this.log_level = new_log_level;
        this.output("switched to log level: " + this.log_levels_text[this.log_level]);
    }
});


Core.Base.define("checkLogLevel", function (log_level) {
    return (log_level >= this.log_level);
});


Core.Base.define("printLogLine", function (str, log_level) {
    str = ": " + str;
    if (this.log_show_caller) {
        str = "  " + this.toString() + str;
    }
    str = this.log_levels_text[log_level] + str;
    if (this.line_prefix === "time") {
        str = (new Date()).format("HH:mm:ss.SSS") + " " + str;
    } else if (this.line_prefix === "datetime") {
        str = (new Date()).format("yyyy-MM-dd HH:mm:ss.SSS") + " " + str;
    }
    this.output(str);
});


Core.Base.define("openLogFile", function (log_file) {
    Core.Base.log_file = log_file;
    Core.Base.line_prefix = "time";
    Core.Base.reassign("output", function (str) {
        if (typeof str === "string") {
            this.log_file.println(str);
            this.log_file.flush();
        }
    });
});


Core.Base.define("closeLogFile", function () {
    if (this.log_file) {
        this.log_file.close();
    }
});


Core.Base.define("resetLogCounters", function () {
    var log_level;
    for (log_level = 0; log_level <= 10; log_level += 2) {
        this.log_counters[log_level] = 0;
    }
});


Core.Base.define("printLogCounters", function () {
    var str = "";
    var delim = "";
    var log_level;

    for (log_level = 0; log_level <= 10; log_level += 2) {
        str += delim + this.log_levels_text[log_level] + ": " + (this.log_counters[log_level] || 0);
        delim = ", ";
    }
    this.output(str);
});

