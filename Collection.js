"use strict";

var Core = require("lapis-core/index.js");


module.exports = Core.Base.clone({
    id: "Collection",
    label_prop: "title",
    collections: {},
});


module.exports.defbind("addToList", "cloneType", function () {
    module.exports.collections[this.id] = this;
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
    return this.item_type;
});


module.exports.define("get", function (id) {
    return this[id];
});


module.exports.define("getThrowIfUnrecognized", function (id) {
    var obj = this[id];
    if (!obj) {
        this.throwError("not recognized: " + id);
    }
    return obj;
});


module.exports.define("isAllowedMember", function (obj) {
    var item_type = this.getItemTypeObject();
    return obj && ((obj === item_type) || (typeof obj.isDescendantOf === "function" && obj.isDescendantOf(item_type)));
});


module.exports.define("add", function (obj) {
    if (!this.isAllowedMember(obj)) {
        this.throwError(obj + " is not item_type " + this.item_type + " or a descendant of it");
    }
    if (this[obj.id] === obj) {
        return;         // silently ignore the add of an object already here...
    }
    if (this[obj.id]) {
        this.throwError("object with this id already present: " + obj.id);
    }
    this[obj.id] = obj;
});


// for using a descendant of Base as a Collection - ignore the 'id' property
// funct arg can be a function or a string - prop name for function to use
// 'each' is preferred, forOwn is deprecated
module.exports.define("each", function (funct) {
    var that = this;
    if (typeof funct !== "function") {
        funct = this[funct];
    }
    Object.keys(this).forEach(function (prop) {
        if (prop !== "item_type" && that.isAllowedMember(that[prop])) {
            funct(that[prop]);
        }
    });
});


module.exports.define("forOwn", function (funct) {
    var that = this;
    if (typeof funct !== "function") {
        funct = this[funct];
    }
    Object.keys(this).forEach(function (prop) {
        if (prop !== "item_type" && that.isAllowedMember(that[prop])) {
            funct(prop, that[prop]);
        }
    });
});


module.exports.define("getCollection", function (id) {
    return module.exports.collections[id];
});


module.exports.define("getCollectionThrowIfUnrecognized", function (id) {
    var obj = this.getCollection(id);
    if (!obj) {
        this.throwError("not recognized: " + id);
    }
    return obj;
});


module.exports.define("getLabel", function (id) {
    return this.get(id)[this.label_prop];
});


module.exports.define("getLabelThrowIfUnrecognized", function (id) {
    return this.getThrowIfUnrecognized(id)[this.label_prop];
});


module.exports.define("populateLoV", function (lov) {
    var that = this;
    this.each(function (source_item) {
        var label = source_item[that.label_prop];
        var active = !that.active_prop || source_item[that.active_prop];
        if (label) {
            lov.addItem(source_item.id, label, active);
        } else {
            that.warn("ignoring item with blank label: " + source_item.id);
        }
    });
});
