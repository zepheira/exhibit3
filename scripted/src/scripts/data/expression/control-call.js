/**
 * @fileOverview
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "./controls"
], function(Controls) {
/**
 * @class
 * @constructor
 * @public
 * @param {String} name
 * @param {Array} args
 */
var ControlCall = function(name, args) {
    this._name = name;
    this._args = args;
};

/**
 * @param {Object} roots
 * @param {Object} rootValueTypes
 * @param {String} defaultRootName
 * @param {Exhibit.Database} database
 * @returns {Exhibit.Expression._Collection}
 */
ControlCall.prototype.evaluate = function(
    roots, 
    rootValueTypes, 
    defaultRootName, 
    database
) {
    return Controls[this._name].f(this._args, roots, rootValueTypes, defaultRootName, database);
};

    // end define
    return ControlCall;
});
