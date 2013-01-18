/**
 * @fileOverview General class for data exporter.
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define(["lib/jquery", "util/persistence"], function($, Persistence) {
/**
 * @class
 * @constructor
 * @param {String} mimeType
 * @param {String} label
 * @param {Function} wrap Function taking at minimum a string and a database,
 *    returning a string.
 * @param {Function} wrapOne Function taking at minimum a string, a boolean
 *    for first, and a boolean for last, returning a string.
 * @param {Function} exportOne Function taking at minimum an item identifier,
 *    the item itself, and a hash of properties, returning a string.
 * @param {Function} [exportMany] Function taking a set and a database,
 *    returning a string, which overrides the default exportMany that uses
 *    the other three functions in conjunction.
 */
var Exporter = function(mimeType, label, wrap, wrapOne, exportOne, exportMany) {
    this._mimeType = mimeType;
    this._label = label;
    this._wrap = wrap;
    this._wrapOne = wrapOne;
    this._exportOne = exportOne;
    this._exportMany = exportMany;
    this._registered = this.register();
};

/**
 * @private
 * @constant
 */
Exporter._registryKey = "exporter";

/**
 * @private
 */
Exporter._registry = null;

/**
 * @static
 * @param {Exhibit._Impl} ex
 */
Exporter._registerComponent = function(evt, reg) {
    Exporter._registry = reg;
    if (!reg.hasRegistry(Exporter._registryKey)) {
        reg.createRegistry(Exporter._registryKey);
        $(document).trigger("registerExporters.exhibit");
    }
};

/**
 * @returns {Boolean}
 */
Exporter.prototype.register = function() {
    var reg = Exporter._registry;
    if (!reg.isRegistered(
        Exporter._registryKey,
        this._mimeType
    )) {
        reg.register(
            Exporter._registryKey,
            this._mimeType,
            this
        );
        return true;
    } else {
        return false;
    }
};

/**
 *
 */
Exporter.prototype.dispose = function() {
    Exporter._registry.unregister(
        Exporter._registryKey,
        this._mimeType
    );
};

/**
 * @returns {Boolean}
 */
Exporter.prototype.isRegistered = function() {
    return this._registered;
};

/**
 * @returns {String}
 */
Exporter.prototype.getLabel = function() {
    return this._label;
};

/**
 * @param {String} itemID
 * @param {Exhibit.Database} database
 * @returns {Object}
 */
Exporter.prototype.exportOneFromDatabase = function(itemID, database) {
    var allProperties, fn, i, propertyID, property, values, valueType, item;

    fn = function(vt, s) {
        if (vt === "item") {
            return function(value) {
                s.push(database.getObject(value, "label"));
            };
        } else if (vt === "url") {
            return function(value) {
                s.push(Persistence.resolveURL(value));
            };
        }
    };

    allProperties = database.getAllProperties();
    item = {};

    for (i = 0; i < allProperties.length; i++) {
        propertyID = allProperties[i];
        property = database.getProperty(propertyID);
        values = database.getObjects(itemID, propertyID);
        valueType = property.getValueType();

        if (values.size() > 0) {
            if (valueType === "item" || valueType === "url") {
                strings = [];
                values.visit(fn(valueType, strings));
            } else {
                strings = values.toArray();
            }
            item[propertyID] = strings;
        }
    }

    return item;
};

/**
 * @param {String} itemID
 * @param {Exhibit.Database} database
 * @returns {String}
 */
Exporter.prototype.exportOne = function(itemID, database) {
    return this._wrap(
        this._exportOne(
            itemID,
            this.exportOneFromDatabase(itemID, database),
            Exporter._getPropertiesWithValueTypes(database)
        ),
        database
    );
};

/**
 * @param {Exhibit.Set} set
 * @param {Exhibit.Database} database
 * @returns {String}
 */
Exporter.prototype.exportMany = function(set, database) {
    if (typeof this._exportMany !== "undefined" && typeof this._exportMany === "function") {
        this.exportMany = this._exportMany;
        return this._exportMany(set, database);
    }

    var s = "", self = this, count = 0, size = set.size(), props;

    props = Exporter._getPropertiesWithValueTypes(database);
    set.visit(function(itemID) {
        s += self._wrapOne(
            self._exportOne(
                itemID,
                self.exportOneFromDatabase(itemID, database),
                props)
            ,
            count === 0,
            count++ === size - 1
        );
    });
    return this._wrap(s, database);
};

/**
 * @private
 * @static
 * @param {Exhibit.Database} database
 */
Exporter._getPropertiesWithValueTypes = function(database) {
    var properties, i, propertyID, property, valueType, map;
    map = {};
    properties = database.getAllProperties();
    for (i = 0; i < properties.length; i++) {
        propertyID = properties[i];
        property = database.getProperty(propertyID);
        valueType = property.getValueType();
        map[propertyID] = { "valueType": valueType,
                            "uri": property.getURI() };
    }
    return map;
};

$(document).one(
    "registerStaticComponents.exhibit",
    Exporter._registerComponent
);

    // end define
    return Exporter;
});
