/**
 * @fileOverview Implementation of query language function features.
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "../../util/set",
    "./collection",
    "./functions"
], function(Set, ExpressionCollection, Functions) {
/**
 * @namespace
 */
var FunctionUtilities = {};

/**
 * @static
 * @param {String} name
 * @param {Function} f
 * @param {String} valueType
 */
FunctionUtilities.registerSimpleMappingFunction = function(name, f, valueType) {
    Functions[name] = {
        f: function(args) {
            var set = new Set(), i, fn;
            fn = function() {
                return function(v) {
                    var v2 = f(v);
                    if (typeof v2 !== "undefined") {
                        set.add(v2);
                    }
                };
            };
            for (i = 0; i < args.length; i++) {
                args[i].forEachValue(fn());
            }
            return new ExpressionCollection(set, valueType);
        }
    };
};

    // end define
    return FunctionUtilities;
});
