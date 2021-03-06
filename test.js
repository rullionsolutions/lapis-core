"use strict";

var Core = require(".");
var Q = require("q");
// var Under = require("underscore");
var last_begin = 0;
var last_end = 0;


module.exports.Base_clone = function (test) {
    test.expect(9);

    test.equals(Core.Base.id, "Base", "Base.id === 'Base'");
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

    test.equals(a.id, "a", "a.id === 'a'");
    test.equals(a.toString(), "/Base/a", "a.toString() === '/Base/a'");
    // test.equals(a.path(), "a", "a.path()     ===  'a'");
    // test.equals(a.descent(), "/Base/a", "a.descent()  === '/Base/a'");
    test.equals(a.getName(), "Dicky", "a.getName() works");
    test.equals(a.speak(), "Hello Dicky", "a remains unchanged");
    test.equals(b.toString(), "/Base/a/b", "b.toString() === '/Base/a/b'");
    // test.equals(b.path(), "b", "b.path()     ===    'b'");
    // test.equals(b.descent(), "/Base/a/b", "b.descent()  === '/Base/a/b'");
    test.equals(b.getName(), "Suzie", "b.getName() works");
    test.equals(b.speak(), "Hello Suzie, et Bonjour", "b inherits a functionality");

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


function waiter(test, num) {
    var def = Q.defer();
    Core.Base.debug("Beginning " + num);
    test.equal(num, last_begin + 1, "Beginning " + num);
    last_begin = num;
    setTimeout(function () {
        Core.Base.debug("   Ending " + num);
        test.equal(num, last_end + 1, "   Ending " + num);
        last_end = num;
        def.resolve(num);
    }, Math.floor(Math.random() * 200));
    return def.promise;
}


module.exports.setUp = function (callback) {
//    last_call  = 0;
    last_begin = 0;
    last_end = 0;
    callback();
};


module.exports.Happen_manual = function (test) {
    test.expect(18);

    waiter(test, 1).then(function () {
        return waiter(test, 2).then(function () {
            return waiter(test, 3).then(function () {
                if (Math.random() > 0.5) {
                    return waiter(test, 4, "a");
                }
                return waiter(test, 4, "b");
            }).then(function () {
                return waiter(test, 5);
            });
        }).then(function () {
            return waiter(test, 6);
        }).then(function () {
            Core.Base.debug("    Doing 6b");
        });
    })
    .then(function () {
        return waiter(test, 7).then(function () {
            return waiter(test, 8);
        });
    })
    .then(function () {
        return waiter(test, 9);
    })
    .then(function () {
        test.done();
    })
    .fail(function (reason) {
        Core.Base.error(reason);
        test.done();
    });
};


module.exports.Happen_main = function (test) {
    var Controller;
    test.expect(12);

    Controller = Core.Base.clone({ id: "Controller", });
    Controller.register("someHappenstance");

    Controller.define("method1", function () {
        Core.Base.trace("method1");
        return waiter(test, 1);
    });
    Controller.bind("method1", "someHappenstance");


    Controller.define("method2", function () {
        Core.Base.trace("method2");
        return waiter(test, 2);
    });

    Controller.define("method3", function () {
        Core.Base.trace("method3");
        return this.method2().then(function () {
            return waiter(test, 3);
        });
    });

    Controller.define("method4", function () {
        Core.Base.trace("method4");
        return this.method3().then(function () {
            return waiter(test, 4);
        });
    });

    Controller.bind("method4", "someHappenstance");


    Controller.define("method5", function () {
        var that = this;
        Core.Base.trace("method5");
        return waiter(test, 5).then(function () {
            return that.method6();
        });
    });

    Controller.bind("method5", "someHappenstance");

    Controller.define("method6", function () {
        Core.Base.trace("method6");
        return waiter(test, 6);
    });

    Controller.happenAsync("someHappenstance", Q.fcall(function () { return true; })).then(
        function () {
            Core.Base.trace("at end");
            test.done();
        });
};


module.exports.Log_fatal = function (test) {
    var a = Core.Base.clone({
        id: "a",
        name: "Dicky",
        type: "Person",
        log_show_caller: false,
    });
    var last_log_msg;
    test.expect(50);
    Core.Base.resetLogCounters();

    a.override("output", function (str) {
        last_log_msg = str;
    });

    a.setLogLevel(a.log_levels.trace);
    a.fatal("a"); test.equals(last_log_msg, "FATAL: a", "trace / fatal");
    a.error("b"); test.equals(last_log_msg, "ERROR: b", "trace / error");
    a.warn("c"); test.equals(last_log_msg, "WARN : c", "trace / warn");
    a.info("d"); test.equals(last_log_msg, "INFO : d", "trace / info");
    a.debug("e"); test.equals(last_log_msg, "DEBUG: e", "trace / debug");
    a.trace("f"); test.equals(last_log_msg, "TRACE: f", "trace / trace");

    a.setLogLevel(a.log_levels.debug);
    a.fatal("a"); test.equals(last_log_msg, "FATAL: a", "debug / fatal");
    a.error("b"); test.equals(last_log_msg, "ERROR: b", "debug / error");
    a.warn("c"); test.equals(last_log_msg, "WARN : c", "debug / warn");
    a.info("d"); test.equals(last_log_msg, "INFO : d", "debug / info");
    a.debug("e"); test.equals(last_log_msg, "DEBUG: e", "debug / debug");
    a.trace("f"); test.equals(last_log_msg, "DEBUG: e", "debug / trace");

    a.setLogLevel(a.log_levels.info);
    a.fatal("a"); test.equals(last_log_msg, "FATAL: a", "info  / fatal");
    a.error("b"); test.equals(last_log_msg, "ERROR: b", "info  / error");
    a.warn("c"); test.equals(last_log_msg, "WARN : c", "info  / warn");
    a.info("d"); test.equals(last_log_msg, "INFO : d", "info  / info");
    a.debug("e"); test.equals(last_log_msg, "INFO : d", "info  / debug");
    a.trace("f"); test.equals(last_log_msg, "INFO : d", "info  / trace");

    a.setLogLevel(a.log_levels.warn);
    a.fatal("a"); test.equals(last_log_msg, "FATAL: a", "warn  / fatal");
    a.error("b"); test.equals(last_log_msg, "ERROR: b", "warn  / error");
    a.warn("c"); test.equals(last_log_msg, "WARN : c", "warn  / warn");
    a.info("d"); test.equals(last_log_msg, "WARN : c", "warn  / info");
    a.debug("e"); test.equals(last_log_msg, "WARN : c", "warn  / debug");
    a.trace("f"); test.equals(last_log_msg, "WARN : c", "warn  / trace");

    a.setLogLevel(a.log_levels.error);
    a.fatal("a"); test.equals(last_log_msg, "FATAL: a", "error / fatal");
    a.error("b"); test.equals(last_log_msg, "ERROR: b", "error / error");
    a.warn("c"); test.equals(last_log_msg, "ERROR: b", "error / warn");
    a.info("d"); test.equals(last_log_msg, "ERROR: b", "error / info");
    a.debug("e"); test.equals(last_log_msg, "ERROR: b", "error / debug");
    a.trace("f"); test.equals(last_log_msg, "ERROR: b", "error / trace");

    a.setLogLevel(a.log_levels.fatal);
    a.fatal("a"); test.equals(last_log_msg, "FATAL: a", "fatal / fatal");
    a.error("b"); test.equals(last_log_msg, "FATAL: a", "fatal / error");
    a.warn("c"); test.equals(last_log_msg, "FATAL: a", "fatal / warn");
    a.info("d"); test.equals(last_log_msg, "FATAL: a", "fatal / info");
    a.debug("e"); test.equals(last_log_msg, "FATAL: a", "fatal / debug");
    a.trace("f"); test.equals(last_log_msg, "FATAL: a", "fatal / trace");

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

    test.equals(a.log_counters[a.log_levels.fatal], 11, "11 fatals");
    test.equals(a.log_counters[a.log_levels.error], 10, "10 errors");
    test.equals(a.log_counters[a.log_levels.warn], 9, "9 warns");
    test.equals(a.log_counters[a.log_levels.info], 8, "8 infos");
    test.equals(a.log_counters[a.log_levels.debug], 7, "7 debugs");
    test.equals(a.log_counters[a.log_levels.trace], 6, "6 traces");

    a.printLogCounters();
    test.equals(last_log_msg, "TRACE: 6, DEBUG: 7, INFO : 8, WARN : 9, ERROR: 10, FATAL: 11", "report 1: " + last_log_msg);

    a.resetLogCounters();

    test.equals(a.log_counters[a.log_levels.fatal], 0, "0 fatals");
    test.equals(a.log_counters[a.log_levels.error], 0, "0 errors");
    test.equals(a.log_counters[a.log_levels.warn], 0, "0 warns");
    test.equals(a.log_counters[a.log_levels.info], 0, "0 infos");
    test.equals(a.log_counters[a.log_levels.debug], 0, "0 debugs");
    test.equals(a.log_counters[a.log_levels.trace], 0, "0 traces");

    a.printLogCounters();
    test.equals(last_log_msg, "TRACE: 0, DEBUG: 0, INFO : 0, WARN : 0, ERROR: 0, FATAL: 0", "report 2: " + last_log_msg);

    test.done();
};

