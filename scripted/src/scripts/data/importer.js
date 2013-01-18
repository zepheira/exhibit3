/**
 * @fileOverview General class for data importer.
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "lib/jquery",
    "exhibit"
], function($, Exhibit) {
/**
 * @class
 * @constructor
 * @param {String|Array} mimeType
 * @param {String} loadType
 * @param {String} label
 * @param {Function} parse
 */
var Importer = function(mimeType, loadType, parse) {
    if (typeof mimeType === "string") {
        this._mimeTypes = [mimeType];
    } else {
        this._mimeTypes = mimeType;
    }
    this._loadType = loadType;
    this._parse = parse;
    this._registered = this.register();
};

/**
 * @private
 * @constant
 */
Importer._registryKey = "importer";

/**
 * @private
 */
Importer._registry = null;

/**
 * @static
 * @param {Exhibit._Impl} ex
 */
Importer._registerComponent = function(evt, reg) {
    Importer._registry = reg;
    if (!reg.hasRegistry(Importer._registryKey)) {
        reg.createRegistry(Importer._registryKey);
        $(document).trigger("registerImporters.exhibit", reg);
    }
};

/**
 * @static
 * @param {String} mimeType
 * @returns {Exhibit.Importer}
 */
Importer.getImporter = function(mimeType) {
    return Importer._registry.get(
        Importer._registryKey,
        mimeType
    );
};

/**
 * @static
 * @string {String} url
 * @returns {Boolean}
 */
Importer.checkFileURL = function(url) {
    return url.startsWith("file:");
};

/**
 * @returns {Boolean}
 */
Importer.prototype.register = function() {
    var reg, i, registered;
    reg = Importer._registry;
    registered = false;
    for (i = 0; i < this._mimeTypes.length; i++) {
        if (!reg.isRegistered(
            Importer._registryKey,
            this._mimeTypes[i]
        )) {
            reg.register(
                Importer._registryKey,
                this._mimeTypes[i],
                this
            );
            registered = registered || true;
        } else {
            registered = registered || false;
        }
    }
    return registered;
};

/**
 *
 */
Importer.prototype.dispose = function() {
    var i;
    for (i = 0; i < this._mimeTypes.length; i++) {
        Importer._registry.unregister(
            Importer._registryKey,
            this._mimeTypes[i]
        );
    }
};

/**
 * @returns {Boolean}
 */
Importer.prototype.isRegistered = function() {
    return this._registered;
};

$(document).one(
    "registerStaticComponents.exhibit",
    Importer._registerComponent
);

    // end define
    return Importer;
});
