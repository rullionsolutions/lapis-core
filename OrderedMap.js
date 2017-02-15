"use strict";

var Core = require("lapis-core/index.js");

/**
* A map of string keys to objects that is also a positional array of those objects
*/
module.exports = Core.Base.clone({
    id: "OrderedMap",
    obj_map: {},
    obj_arr: [],
});


module.exports.register("add");         // adding one item
module.exports.register("remove");      // removing one item (NOT called on clear)
module.exports.register("clear");       // removing all items


/**
* Called automatically during clone(), this clones each object in the parent OrderedMap and adds
* it to this OrderedMap
*/
module.exports.defbind("cloneItems", "clone", function () {
    var n;
    var e;

    this.obj_map = {};
    this.obj_arr = [];
    for (n = 0; n < this.parent.obj_arr.length; n += 1) {
        e = this.parent.obj_arr[n].clone({
            id: this.parent.obj_arr[n].id,
            owner: this,
            instance: this.instance,
        });
        this.obj_arr[n] = e;
        this.obj_map[e.id] = e;
    }
});


/**
* Adds the given object to the OrderedMap, at the next array position; object must contain an 'id'
* property which is used as its map key; the id value must not be already in use; object must
* support a 'clone' function, and should normally be a descendent of x.Base
* @param Object to be added to this OrderedMap, having an 'id' property whose value is unique to
* this map, and supporting a 'clone' function
* @return The argument object (to allow cascading)
*/
module.exports.define("add", function (obj) {
    if (!obj.id || typeof obj.id !== "string") {
        this.throwError("id must be nonblank string");
    }
    if (this.obj_map[obj.id]) {
        this.throwError("id already exists: " + obj.id);
    }
    if (typeof obj !== "object" || typeof obj.clone !== "function") {
        this.throwError("argument must be object having clone method");
    }
    obj.owner = this;
    this.obj_map[obj.id] = obj;
    this.obj_arr.push(obj);
    this.happen("add", obj);
    return obj;
});


/**
* Calls 'add' for each object in the argument array, so each element of the array should conform
* to the rules described above
* @param Array contains objects to be added to this OrderedMap
*/
module.exports.define("addAll", function (arr) {
    var i;

    if (!arr || typeof arr.length !== "number") {
        this.throwError("argument must be array");
    }
    for (i = 0; i < arr.length; i += 1) {
        this.add(arr[i]);
    }
});


/**
* To retrieve an object from this OrderedMap, using either its string key, or its integer array
* index
* @param Either a string key, or an integer array index; throws an invalid_argument exception if
* the argument is neither a string nor a number
* @return The found object, or undefined
*/
module.exports.define("get", function (id) {
    if (typeof id === "string") {
        return this.obj_map[id];
    }
    if (typeof id === "number") {
        return this.obj_arr[id];
    }
    this.throwError("invalid argument: " + id);
    return "";      // never reached
});


/**
* To retrieve the array index number of an object in this OrderedMap, using its string key or the
* object itself
* @param A string key or the object itself; throws an invalid_argument exception if the argument
* is not a string
* @return The integer index number (from 0), or -1 if the string key does not exist in the map
*/
module.exports.define("indexOf", function (id) {
    if (typeof id === "string") {
        return this.obj_arr.indexOf(this.obj_map[id]);
    }
    if (typeof id === "object") {
        return this.obj_arr.indexOf(id);
    }
    this.throwError("invalid argument");
    return "";      // never reached
});


/**
* To remove an object from this OrderedMap, using either its string key, or its integer array index
* @param Either a string key, or an integer array index; throws an invalid_argument exception if
* the argument is neither a string nor a number; throws a 'Not found' exception if the
* string/number does not reference an existing object to begin with
*/
module.exports.override("remove", function (id) {
    var obj;

    if (typeof id === "string") {
        obj = this.obj_map[id];
        if (!obj) {
            this.throwError("not found: " + id);
        }
        this.obj_arr.splice(this.obj_arr.indexOf(obj), 1);
        delete this.obj_map[id];
    } else if (typeof id === "number") {
        if (id < 0 || id >= this.obj_arr.length) {
            this.throwError("index out of range: " + id);
        }
        obj = this.obj_arr[id];
        this.obj_arr.splice(id, 1);
        delete this.obj_map[obj.id];
    } else {
        this.throwError("invalid argument: " + id);
    }
    this.happen("remove", obj);
});


/**
* To return the number of objects in the OrderedMap
* @return Number of objects
*/
module.exports.define("length", function () {
    return this.obj_arr.length;
});


/**
* To move an object in the OrderedMap from one position to another
* @param id (either a string key, or an integer array index), position to move it to (starting
* from 0); throws an invalid_argument exception if the argument is neither a string nor a number;
* throws a 'Not found' exception if the string/number does not reference an existing object to
* begin with; throws an 'Invalid position' exception if the position index is outside the expected
* number range
* @return The object moved (to allow cascading)
*/
module.exports.define("moveTo", function (id, position) {
    var id_num = id;
    if (typeof position !== "number" || position < 0 || position > this.obj_arr.length) {
        this.throwError("invalid position: " + position);
    }
    if (typeof id === "string") {
        id_num = this.obj_arr.indexOf(this.obj_map[id]);
        if (id_num === -1) {
            this.throwError("not found: " + id);
        }
    } else if (typeof id !== "number") {
        this.throwError("invalid argument");
    }
    this.obj_arr.splice(position, 0, this.obj_arr.splice(id_num, 1)[0]);
});


/**
* To remove all the objects from the OrderedMap
*/
module.exports.define("clear", function () {
    this.obj_map = {};
    this.obj_arr = [];
    this.happen("clear");
});


/**
* Call the callback function for each object in this OrderedMap, looping in index order
* @param Callback function, which is called with each successive object as its argument
*/
module.exports.define("each", function (funct) {
    var i;
    for (i = 0; i < this.obj_arr.length; i += 1) {
        funct(this.obj_arr[i]);
    }
});


module.exports.define("sort", function (prop) {
    if (this.obj_arr.length > 0 && typeof this.obj_arr[0][prop] !== "string") {
        this.throwError("sort property is not string");
    }
    this.obj_arr.sort(function (a, b) {
        return a[prop].localeCompare(b[prop]);
    });
});


module.exports.define("copyFrom", function (source_orderedmap) {
    var that = this;
    source_orderedmap.each(function (source_item) {
        that.add(source_item);
    });
});
