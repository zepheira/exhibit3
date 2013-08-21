/**
 * @fileOverview Database item type definition.
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define(function() {
/**
 * Represents an item type.
 *
 * @public
 * @constructor
 * @class
 * @param {String} id Item type identifier.
 */
var Type = function(id) {
    this._id = id;
    this._custom = {};
};

/**
 * Returns the item type identifier.
 *
 * @returns {String} The item type identifier.
 */
Type.prototype.getID = function() {
    return this._id;
};

/**
 * Returns the item type URI.
 *
 * @returns {String} The item type URI.
 */
Type.prototype.getURI = function() {
    return this._custom.uri;
};

/**
 * Returns the item type user-friendly label.
 *
 * @returns {String} The item type label.
 */
Type.prototype.getLabel = function() {
    return this._custom.label;
};

/**
 * Returns the item type origin.
 *
 * @returns {String} The item type origin.
 */
Type.prototype.getOrigin = function() {
    return this._custom.origin;
};

/**
 * Returns a custom defined item type attribute's value.
 *
 * @param {String} p The property name.
 * @returns {String} The item type attribute's value.
 */
Type.prototype.getProperty = function(p) {
    return this._custom[p];
};

    // end define
    return Type;
});
