"use strict";

var Core = require("lapis-core/index.js");


module.exports = Core.Base.clone({
    id: "Collection",
});

/*
module.exports.defbind("validate", "clone", function () {
    if (typeof this.item_type.isDescendantOf !== "function"
            || !this.item_type.isDescendantOf(Core.Base)) {
        this.throwError("'item_type' property must be a descendant of Core.Base");
    }
});
*/

module.exports.define("getItemTypeObject", function () {
    if (typeof this.item_type === "string") {       // R6 shim...
        return this.getObject(this.item_type);
    }
    return this.item_type;
});


module.exports.define("get", function (id) {
    try {
        return this.getThrowIfUnrecognized(id);
    } catch (e) {
        return null;
    }
});


module.exports.define("isAllowedMember", function (obj) {
    var item_type = this.getItemTypeObject();
    return obj && ((obj === item_type) || (typeof obj.isDescendantOf === "function" && obj.isDescendantOf(item_type)));
});


module.exports.define("add", function (obj) {
    if (!this.isAllowedMember(obj)) {
        this.throwError(obj + " is not item_type " + this.item_type + " or a descendant of it");
    }
    if (this[obj.id]) {
        this.throwError("object with this id already present: " + obj.id);
    }
    this[obj.id] = obj;
});


module.exports.define("getThrowIfUnrecognized", function (id) {
    var obj = this[id];
    if (!obj) {
        this.throwError("not recognized: " + id);
    }
    return obj;
});

// for using a descendant of Base as a Collection - ignore the 'id' property
module.exports.define("forOwn", function (funct) {
    var that = this;
// if (!this.item_type || typeof this.item_type.isDescendantOf !== "function"
//           || !this.item_type.isDescendantOf(x.base.Base)) {
//     this.throwError("collection must have an item_type property which is a descendant of /Base");
// }
    if (typeof funct !== "function") {
        funct = this[funct];
    }
    Object.keys(this).forEach(function (prop) {
        if (prop !== "item_type" && that.isAllowedMember(that[prop])) {
            funct(prop, that[prop]);
        }
    });
});
