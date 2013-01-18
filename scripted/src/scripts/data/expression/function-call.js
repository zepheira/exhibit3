/**
 * @fileOverview
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "util/localizer",
    "data/expression/functions"
], function(_, Functions) {
/**
 * @class
 * @constructor
 * @public
 * @param {String} name
 * @param {Array} args
 */
var FunctionCall = function(name, args) {
    this._name = name;
    this._args = args;
};

/**
 * @param {Object} roots
 * @param {Object} rootValueTypes
 * @param {String} defaultRootName
 * @param {Exhibit.Database} database
 * @returns {Exhibit.Expression._Collection}
 * @throws Error
 */
FunctionCall.prototype.evaluate = function(
    roots, 
    rootValueTypes, 
    defaultRootName, 
    database
) {
    var args = [], i;
    for (i = 0; i < this._args.length; i++) {
        args.push(this._args[i].evaluate(roots, rootValueTypes, defaultRootName, database));
    }
    
    if (typeof Functions[this._name] !== "undefined") {
        return Functions[this._name].f(args);
    } else {
        throw new Error(_("%expression.noSuchFunction", this._name));
    }
};

    // end define
    return FunctionCall;
});
