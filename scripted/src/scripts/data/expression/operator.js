/**
 * @fileOverview
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "./collection"
], function(ExpressionCollection) {
/**
 * @class
 * @constructor
 * @public
 * @param {String} operator
 * @param {Array} args
 */
var Operator = function(operator, args) {
    this._operator = operator;
    this._args = args;
};

/**
 * @param {Object} roots
 * @param {Object} rootValueTypes
 * @param {String} defaultRootName
 * @param {Exhibit.Database} database
 * @returns {Exhibit.Expression._Collection}
 */
Operator.prototype.evaluate = function(
    roots, 
    rootValueTypes, 
    defaultRootName, 
    database
) {
    var values = [], args = [], i, operator, f;
    
    for (i = 0; i < this._args.length; i++) {
        args.push(this._args[i].evaluate(roots, rootValueTypes, defaultRootName, database));
    }
    
    operator = Operator._operators[this._operator];
    f = operator.f;
    if (operator.argumentType === "number") {
        args[0].forEachValue(function(v1) {
            if (typeof v1 !== "number") {
                v1 = parseFloat(v1);
            }
        
            args[1].forEachValue(function(v2) {
                if (typeof v2 !== "number") {
                    v2 = parseFloat(v2);
                }
                
                values.push(f(v1, v2));
            });
        });
    } else {
        args[0].forEachValue(function(v1) {
            args[1].forEachValue(function(v2) {
                values.push(f(v1, v2));
            });
        });
    }
    
    return new ExpressionCollection(values, operator.valueType);
};

/**
 * @private
 */
Operator._operators = {
    "+" : {
        argumentType: "number",
        valueType: "number",
        /** @ignore */
        f: function(a, b) { return a + b; }
    },
    "-" : {
        argumentType: "number",
        valueType: "number",
        /** @ignore */
        f: function(a, b) { return a - b; }
    },
    "*" : {
        argumentType: "number",
        valueType: "number",
        /** @ignore */
        f: function(a, b) { return a * b; }
    },
    "/" : {
        argumentType: "number",
        valueType: "number",
        /** @ignore */
        f: function(a, b) { return a / b; }
    },
    "=" : {
        valueType: "boolean",
        /** @ignore */
        f: function(a, b) { return a === b; }
    },
    "<>" : {
        valueType: "boolean",
        /** @ignore */
        f: function(a, b) { return a !== b; }
    },
    "><" : {
        valueType: "boolean",
        /** @ignore */
        f: function(a, b) { return a !== b; }
    },
    "<" : {
        argumentType: "number",
        valueType: "boolean",
        /** @ignore */
        f: function(a, b) { return a < b; }
    },
    ">" : {
        argumentType: "number",
        valueType: "boolean",
        /** @ignore */
        f: function(a, b) { return a > b; }
    },
    "<=" : {
        argumentType: "number",
        valueType: "boolean",
        /** @ignore */
        f: function(a, b) { return a <= b; }
    },
    ">=" : {
        argumentType: "number",
        valueType: "boolean",
        /** @ignore */
        f: function(a, b) { return a >= b; }
    }
};

    // end define
    return Operator;
});
