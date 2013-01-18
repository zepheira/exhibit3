/**
 * @fileOverview
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define(["util/set"], function(Set) {
/**
 * @class
 * @constructor
 * @param {Array|Exhibit.Set} values
 * @param {String} valueType
 */
var ExpressionCollection = function(values, valueType) {
    this._values = values;
    this.valueType = valueType;
    
    if (values instanceof Array) {
        this.forEachValue = ExpressionCollection._forEachValueInArray;
        this.getSet = ExpressionCollection._getSetFromArray;
        this.contains = ExpressionCollection._containsInArray;
        this.size = values.length;
    } else {
        this.forEachValue = ExpressionCollection._forEachValueInSet;
        this.getSet = ExpressionCollection._getSetFromSet;
        this.contains = ExpressionCollection._containsInSet;
        this.size = values.size();
    }
};

/**
 * @param {Function} f
 */
ExpressionCollection._forEachValueInSet = function(f) {
    this._values.visit(f);
};

/**
 * @param {Function} f
 */
ExpressionCollection._forEachValueInArray = function(f) {
    var a, i;
    a = this._values;
    for (i = 0; i < a.length; i++) {
        if (f(a[i])) {
            break;
        }
    }
};

/**
 * @returns {Exhibit.Set}
 */
ExpressionCollection._getSetFromSet = function() {
    return this._values;
};

/**
 * @returns {Exhibit.Set}
 */
ExpressionCollection._getSetFromArray = function() {
    return new Set(this._values);
};

/**
 * @param {String|Number} v
 * @returns {Boolean}
 */
ExpressionCollection._containsInSet = function(v) {
    return this._values.contains(v);
};

/**
 * @param {String|Number} v
 * @returns {Boolean}
 */
ExpressionCollection._containsInArray = function(v) {
    var a, i;
    a = this._values;
    for (i = 0; i < a.length; i++) {
        if (a[i] === v) {
            return true;
        }
    }
    return false;
};

    // end define
    return ExpressionCollection;
});
