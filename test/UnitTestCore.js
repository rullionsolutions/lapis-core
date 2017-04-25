/* global module, require */

"use strict";

var Test = require("lazuli-test/UnitTests.js");
var Core = require("lapis-core/index.js");

module.exports = Test.clone({
    id: "UnitTestCore",
});

module.exports.override("test", function () {
    var a;
    var b;
    var c;

    a = Core.Base.clone({
        id: "a",
        name: "Dicky",
    });
    a.init = function () {
        this.a_init_called = true;
    };
    a.speak = function () {
        return "Hello " + this.getName();
    };
    a.getName = function () {
        return this.name;
    };
    b = a.clone({
        id: "b",
        name: "Suzie",
    });
    b.init = function () {
        this.b_init_called = true;
    };
    b.speak = function () {
        return a.speak.call(this) + ", et Bonjour";
    };

    this.assert(a.toString() === "/Base/a", "a.toString() === /Base/a");
    this.assert(a.speak() === "Hello Dicky", "a remains unchanged");
    this.assert(b.toString() === "/Base/a/b", "b.toString() === /Base/a/b");
    this.assert(b.speak() === "Hello Suzie, et Bonjour", "b inherits a functionality");
    this.assert(b.a_init_called, "b.a.init() called");
    this.assert(!b.b_init_called, "b.b.init() not called");

    b.children = Core.OrderedMap.clone({
        id: "children",
    });
    b.children.add(Core.Base.clone({
        id: "jen",
        name: "Jennifer",
    }));
    b.children.add(Core.Base.clone({
        id: "mark",
        name: "Mark",
    }));


    this.assert(b.children.toString() === "/Base/OrderedMap/children", "b.children.toString() === /Base/OrderedMap/children");
    this.assert(b.children.get(0).toString() === "/Base/jen", "b.children.get(0).toString() === /Base/jen");
    this.assert(b.children.get(0) === b.children.get("jen"), "Child Jen at index 0");
    this.assert(b.children.length() === 2, "Two children added");
    this.assert(b.children.get(1).name === "Mark", "Child 1 name is Mark");

    b.clone = function (spec) {
        var obj = Core.Base.clone.call(this, spec);
        obj.children = this.children.clone({
            id: "children",
        });
        return obj;
    };

    c = b.clone({
        id: "c",
    });
    this.assert(c.toString() === "/Base/a/b/c", "c.toString() === /Base/a/b/c");
    this.assert(c.children.toString() === "/Base/OrderedMap/children/children", "c.children.toString() === /Base/OrderedMap/children/children");
    this.assert(c.children.get(0).toString() === "/Base/jen/jen", "c.children.get(0).toString() === /Base/jen/jen");
    c.children.get(0).age = 16;
    this.assert(c.children.get(0) === c.children.get("jen"), "c's Child Jen at index 0");
    this.assert(c.children.get(0) !== b.children.get(0), "c's Child at index 0 is not b's");
    this.assert(c.children.length() === 2, "Two children added");
    this.assert(c.children.get(0).age === 16, "c's Child 0 age is 16");
    this.assert(typeof b.children.get(0).age === "undefined", "b's Child 0 has no age");
});
