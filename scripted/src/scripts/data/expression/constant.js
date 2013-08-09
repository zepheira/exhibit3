/**
 * @fileOverview
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define(["./collection"], function(ExpressionCollection) {
/**
 * @class
 * @constructor
 * @public
 * @param {String|Number} value
 * @param {String} valueType
 */
var Constant = function(value, valueType) {
    this._value = value;
    this._valueType = valueType;
};

/**
 * @param {Object} roots
 * @param {Object} rootValueTypes
 * @param {String} defaultRootName
 * @param {Exhibit.Database} database
 * @returns {Exhibit.Expression._Collection}
 */
Constant.prototype.evaluate = function(
    roots, 
    rootValueTypes, 
    defaultRootName, 
    database
) {
    return new ExpressionCollection([ this._value ], this._valueType);
};

    // end define
    return Constant;
});
