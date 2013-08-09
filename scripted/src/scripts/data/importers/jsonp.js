/**
 * @fileOverview Handle generic JSONP importing.
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define(["lib/jquery", "../importer"], function($, Importer) {
    var JSONP;

/**
 * @namespace
 */
JSONP = {
    _importer: null,
    _registryKey: "jsonpImporter"
};

/**
 * @param {String} url
 * @param {Object} s
 * @param {Function} callback
 */
JSONP.parse = function(url, s, callback) {
    if (typeof callback === "function") {
        callback(s);
    }
};

/**
 * A generic JSONP feed converter to Exhibit JSON.
 * Does 90% of the feed conversion for 90% of all (well designed) JSONP feeds.
 * Pass the raw json object, an optional index to drill into to get at the
 * array of items ("feed.entry", in the case of Google Spreadsheets -- pass
 * null, if the array is already the top container, as in a Del.icio.us feed),
 * an object mapping the wanted item property name to the properties to pick
 * them up from, and an optional similar mapping with conversion callbacks to
 * perform on the data value before storing it in the item property. These
 * callback functions are invoked with the value, the object it was picked up
 * from, its index in the items array, the items array and the feed as a whole
 * (for the cases where you need to look up properties from the surroundings).
 * Returning the undefined value your converter means the property is not set.
 *
 * @param {Object} json Result of JSONP call
 * @param {String} index
 * @param {Object} mapping
 * @param {Object} converters
 * @returns {Object}
 */
JSONP.transformJSON = function(json, index, mapping, converters) {
    var objects, items, i, object, item, name, index, property;
    objects = json;
    items = [];
    if (typeof index !== "undefined" && index !== null) {
        index = index.split(".");
        while (index.length > 0) {
            objects = objects[index.shift()];
        }
    }
    for (i = 0, object = objects[i]; i < objects.length; i++) {
        item = {};
        for (name in mapping) {
            if (mapping.hasOwnProperty(name)) {
                index = mapping[name];
                // gracefully handle poisoned Object.prototype
                if (!mapping.hasOwnProperty(name) ||
                    !object.hasOwnProperty(index)) {
                    continue;
                }

                property = object[index];
                if (typeof converters !== "undefined"
                    && converters !== null
                    && converters.hasOwnProperty(name)) {
                    property = converters[name](property, object, i, objects, json);
                }
                if (typeof property !== "undefined") {
                    item[name] = property;
                }
            }
        }
        items.push(item);
    }
    return items;    
};

/**
 * @private
 * @static
 * @param {jQuery.Event} evt
 * @param {Exhibit.Registry} reg
 */
JSONP._register = function(evt, reg) {
    JSONP._importer = new Importer(
        "application/jsonp",
        "jsonp",
        JSONP.parse
    );
    if (!reg.hasRegistry(JSONP._registryKey)) {
        reg.createRegistry(JSONP._registryKey);
        $(document).trigger(
            "registerJSONPImporters.exhibit",
            reg
        );
    }
};

$(document).one(
    "registerImporters.exhibit",
    JSONP._register
);

    // end define
    return JSONP;
});
