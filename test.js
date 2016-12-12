"use strict";

var Core = require(".");
var Under = require("underscore");


module.exports.Base_clone = function (test) {
    test.expect(9);

    test.ok(Core.Base.id === "Base", "Base.id === 'Base'");
    test.throws(function () { Core.Base.clone(); });
    test.throws(function () { Core.Base.clone({}); });
    test.throws(function () { Core.Base.clone({ name: "blah", }); });
    test.throws(function () { Core.Base.clone({ id: undefined, }); });
    test.throws(function () { Core.Base.clone({ id: 4, }); });
    test.throws(function () { Core.Base.clone({ id: null, }); });
    test.throws(function () { Core.Base.clone({ id: [], }); });
    test.throws(function () { Core.Base.clone({ id: {}, }); });

    test.done();
};

module.exports.Base_rest = function (test) {
    var a = Core.Base.clone({
        id: "a",
        name: "Dicky",
        type: "Person",
    });
    var b;

    test.expect(14);

    a.define("speak", function () {
        return "Hello " + this.getName();
    });
    a.define("getName", function () {
        return this.name;
    });

    b = a.clone({
        id: "b",
        name: "Suzie",
    });
    b.override("speak", function () {
        return a.speak.call(this) + ", et Bonjour";
    });

    test.ok(a.id === "a", "a.id === 'a'");
    test.ok(a.toString() === "/Base/a", "a.toString() === '/Base/a'");
    // test.ok(a.path() === "a", "a.path()     ===  'a'");
    // test.ok(a.descent() === "/Base/a", "a.descent()  === '/Base/a'");
    test.ok(a.getName() === "Dicky", "a.getName() works");
    test.ok(a.speak() === "Hello Dicky", "a remains unchanged");
    test.ok(b.toString() === "/Base/a/b", "b.toString() === '/Base/a/b'");
    // test.ok(b.path() === "b", "b.path()     ===    'b'");
    // test.ok(b.descent() === "/Base/a/b", "b.descent()  === '/Base/a/b'");
    test.ok(b.getName() === "Suzie", "b.getName() works");
    test.ok(b.speak() === "Hello Suzie, et Bonjour", "b inherits a functionality");

    try {
        a.define("sex", "F");
        test.ok(true, "define() succeeds with new property");
        b.override("sex", "M");
        test.ok(true, "override() succeeds with property defined on parent");
        b.reassign("sex", "F");
        test.ok(true, "reassign() succeeds with property defined on parent");
    } catch (e) {
        test.ok(false, e.toString());
    }

    try {
        a.define("sex", "M");
        test.ok(false, "define() should fail on existing property");
    } catch (e) {
        test.ok(true, "define() threw error on existing property");
    }

    try {
        b.define("type", "Animal");
        test.ok(false, "define() should fail on existing property");
    } catch (e) {
        test.ok(true, "define() threw error on existing property");
    }

    try {
        a.override("height", 30);
        test.ok(false, "override() should fail on new property");
    } catch (e) {
        test.ok(true, "override() threw error on new property");
    }

    try {
        b.reassign("type", "Animal");
        test.ok(false, "reassign() should fail on inherited property");
    } catch (e) {
        test.ok(true, "reassign() threw error on inherited property");
    }

    test.done();
};


module.exports.Log_fatal = function (test) {
    var a = Core.Base.clone({
        id: "a",
        name: "Dicky",
        type: "Person",
    });
    var last_log_msg;
    test.expect(50);

    a.override("output", function (str) {
        last_log_msg = str;
    });

    a.setLogLevel(a.log_levels.trace);
    a.fatal("a"); test.ok(last_log_msg === "FATAL: a", "trace / fatal");
    a.error("b"); test.ok(last_log_msg === "ERROR: b", "trace / error");
    a.warn("c"); test.ok(last_log_msg === "WARN : c", "trace / warn");
    a.info("d"); test.ok(last_log_msg === "INFO : d", "trace / info");
    a.debug("e"); test.ok(last_log_msg === "DEBUG: e", "trace / debug");
    a.trace("f"); test.ok(last_log_msg === "TRACE: f", "trace / trace");

    a.setLogLevel(a.log_levels.debug);
    a.fatal("a"); test.ok(last_log_msg === "FATAL: a", "debug / fatal");
    a.error("b"); test.ok(last_log_msg === "ERROR: b", "debug / error");
    a.warn("c"); test.ok(last_log_msg === "WARN : c", "debug / warn");
    a.info("d"); test.ok(last_log_msg === "INFO : d", "debug / info");
    a.debug("e"); test.ok(last_log_msg === "DEBUG: e", "debug / debug");
    a.trace("f"); test.ok(last_log_msg === "DEBUG: e", "debug / trace");

    a.setLogLevel(a.log_levels.info);
    a.fatal("a"); test.ok(last_log_msg === "FATAL: a", "info  / fatal");
    a.error("b"); test.ok(last_log_msg === "ERROR: b", "info  / error");
    a.warn("c"); test.ok(last_log_msg === "WARN : c", "info  / warn");
    a.info("d"); test.ok(last_log_msg === "INFO : d", "info  / info");
    a.debug("e"); test.ok(last_log_msg === "INFO : d", "info  / debug");
    a.trace("f"); test.ok(last_log_msg === "INFO : d", "info  / trace");

    a.setLogLevel(a.log_levels.warn);
    a.fatal("a"); test.ok(last_log_msg === "FATAL: a", "warn  / fatal");
    a.error("b"); test.ok(last_log_msg === "ERROR: b", "warn  / error");
    a.warn("c"); test.ok(last_log_msg === "WARN : c", "warn  / warn");
    a.info("d"); test.ok(last_log_msg === "WARN : c", "warn  / info");
    a.debug("e"); test.ok(last_log_msg === "WARN : c", "warn  / debug");
    a.trace("f"); test.ok(last_log_msg === "WARN : c", "warn  / trace");

    a.setLogLevel(a.log_levels.error);
    a.fatal("a"); test.ok(last_log_msg === "FATAL: a", "error / fatal");
    a.error("b"); test.ok(last_log_msg === "ERROR: b", "error / error");
    a.warn("c"); test.ok(last_log_msg === "ERROR: b", "error / warn");
    a.info("d"); test.ok(last_log_msg === "ERROR: b", "error / info");
    a.debug("e"); test.ok(last_log_msg === "ERROR: b", "error / debug");
    a.trace("f"); test.ok(last_log_msg === "ERROR: b", "error / trace");

    a.setLogLevel(a.log_levels.fatal);
    a.fatal("a"); test.ok(last_log_msg === "FATAL: a", "fatal / fatal");
    a.error("b"); test.ok(last_log_msg === "FATAL: a", "fatal / error");
    a.warn("c"); test.ok(last_log_msg === "FATAL: a", "fatal / warn");
    a.info("d"); test.ok(last_log_msg === "FATAL: a", "fatal / info");
    a.debug("e"); test.ok(last_log_msg === "FATAL: a", "fatal / debug");
    a.trace("f"); test.ok(last_log_msg === "FATAL: a", "fatal / trace");

    a.fatal("a");
    a.fatal("a");
    a.fatal("a");
    a.fatal("a");
    a.fatal("a");

    a.error("b");
    a.error("b");
    a.error("b");
    a.error("b");

    a.warn("c");
    a.warn("c");
    a.warn("c");

    a.info("d");
    a.info("d");

    a.debug("e");

    test.ok(a.log_counters[a.log_levels.fatal] === 11, "11 fatals");
    test.ok(a.log_counters[a.log_levels.error] === 10, "10 errors");
    test.ok(a.log_counters[a.log_levels.warn] === 9, "9 warns");
    test.ok(a.log_counters[a.log_levels.info] === 8, "8 infos");
    test.ok(a.log_counters[a.log_levels.debug] === 7, "7 debugs");
    test.ok(a.log_counters[a.log_levels.trace] === 6, "6 traces");

    a.printLogCounters();
    test.ok(last_log_msg === "TRACE: 6, DEBUG: 7, INFO : 8, WARN : 9, ERROR: 10, FATAL: 11", "report 1: " + last_log_msg);

    a.resetLogCounters();

    test.ok(a.log_counters[a.log_levels.fatal] === 0, "0 fatals");
    test.ok(a.log_counters[a.log_levels.error] === 0, "0 errors");
    test.ok(a.log_counters[a.log_levels.warn] === 0, "0 warns");
    test.ok(a.log_counters[a.log_levels.info] === 0, "0 infos");
    test.ok(a.log_counters[a.log_levels.debug] === 0, "0 debugs");
    test.ok(a.log_counters[a.log_levels.trace] === 0, "0 traces");

    a.printLogCounters();
    test.ok(last_log_msg === "TRACE: 0, DEBUG: 0, INFO : 0, WARN : 0, ERROR: 0, FATAL: 0", "report 2: " + last_log_msg);

    test.done();
};

