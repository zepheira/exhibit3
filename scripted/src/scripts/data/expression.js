/**
 * @fileOverview Base class for database query language.
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define(["./expression/path"], function(Path) {
/**
 * @class
 * @constructor
 * @public
 * @param {Exhibit.Expression.Path} rootNode
 */
var Expression = function(rootNode) {
    this._rootNode = rootNode;
};

/**
 * @param {Object} roots
 * @param {Object} rootValueTypes
 * @param {String} defaultRootName
 * @param {Exhibit.Database} database
 * @returns {Object}
 */
Expression.prototype.evaluate = function(
    roots, 
    rootValueTypes, 
    defaultRootName, 
    database
) {
    var collection = this._rootNode.evaluate(roots, rootValueTypes, defaultRootName, database);
    return {
        values:     collection.getSet(),
        valueType:  collection.valueType,
        size:       collection.size
    };
};

/**
 * @param {String} itemID
 * @param {Exhibit.Database} database
 * @returns {Object}
 */
Expression.prototype.evaluateOnItem = function(itemID, database) {
    return this.evaluate(
        { "value" : itemID }, 
        { "value" : "item" }, 
        "value",
        database
    );
};

/**
 * @param {Object} roots
 * @param {Object} rootValueTypes
 * @param {String} defaultRootName
 * @param {Exhibit.Database} database
 * @returns {Object}
 */
Expression.prototype.evaluateSingle = function(
    roots, 
    rootValueTypes, 
    defaultRootName, 
    database
) {
    var collection, result;
    collection = this._rootNode.evaluate(roots, rootValueTypes, defaultRootName, database);
    result = { value: null,
               valueType: collection.valueType };
    collection.forEachValue(function(v) {
        result.value = v;
        return true;
    });
    
    return result;
};

/**
 * @param {String} itemID
 * @param {Exhibit.Database} database
 * @returns {Object}
 */
Expression.prototype.evaluateSingleOnItem = function(itemID, database) {
    return this.evaluateSingle(
        { "value" : itemID }, 
        { "value" : "item" }, 
        "value",
        database
    );
};

/**
 * @param {Object} roots
 * @param {Object} rootValueTypes
 * @param {String} defaultRootName
 * @param {Exhibit.Database} database
 * @returns {Boolean}
 */
Expression.prototype.testExists = function(
    roots, 
    rootValueTypes, 
    defaultRootName, 
    database
) {
    return this.isPath() ?
        this._rootNode.testExists(roots, rootValueTypes, defaultRootName, database) :
        this.evaluate(roots, rootValueTypes, defaultRootName, database).values.size() > 0;
};

/**
 * @returns {Boolean}
 */
Expression.prototype.isPath = function() {
    return this._rootNode instanceof Path;
};

/**
 * @returns {Expression.Path}
 */
Expression.prototype.getPath = function() {
    return this.isPath() ?
        this._rootNode :
        null;
};

    // end define
    return Expression;
});
