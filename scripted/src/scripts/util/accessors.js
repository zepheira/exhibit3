define([
    "../exhibit-core",
    "./debug",
    "./settings",
    "../data/expression-parser"
], function(Exhibit, Debug, SettingsUtilities, ExpressionParser) {
var AccessorsUtilities = {};

/**
 * @param {Object} config
 * @param {Object} specs
 * @param {Object} accessors
 */
AccessorsUtilities.createAccessors = function(config, specs, accessors) {
    AccessorsUtilities._internalCreateAccessors(
        function(field) { return config[field]; },
        specs,
        accessors
    );
};

/**
 * @param {Element} configElmt
 * @param {Object} specs
 * @param {Object} accessors
 */
AccessorsUtilities.createAccessorsFromDOM = function(configElmt, specs, accessors) {
    AccessorsUtilities._internalCreateAccessors(
        function(field) { return Exhibit.getAttribute(configElmt, field); },
        specs,
        accessors
    );
};

/**
 * @param {Function} f
 * @param {Object} specs
 * @param {Object} accessors
 */ 
AccessorsUtilities._internalCreateAccessors = function(f, specs, accessors) {
    var field, spec, accessorName, accessor, isTuple, createOneAccessor, alternatives, i, noop;

    noop = function(value, database, visitor) {};

    createOneAccessor = function(spec2) {
        isTuple = false;
        if (typeof spec2.bindings !== "undefined") {
            return AccessorsUtilities._createBindingsAccessor(f, spec2.bindings);
        } else if (typeof spec2.bindingNames !== "undefined") {
            isTuple = true;
            return AccessorsUtilities._createTupleAccessor(f, spec2);
        } else {
            return AccessorsUtilities._createElementalAccessor(f, spec2);
        }
    };

    for (field in specs) {
        if (specs.hasOwnProperty(field)) {
            spec = specs[field];
            accessorName = spec.accessorName;
            accessor = null;
            isTuple = false;

            if (typeof spec.alternatives !== "undefined") {
                alternatives = spec.alternatives;
                for (i = 0; i < alternatives.length; i++) {
                    accessor = createOneAccessor(alternatives[i]);
                    if (accessor !== null) {
                        break;
                    }
                }
            } else {
                accessor = createOneAccessor(spec);
            }
        
            if (accessor !== null) {
                accessors[accessorName] = accessor;
            } else if (typeof accessors[accessorName] === "undefined") {
                accessors[accessorName] = noop;
            }
        }
    }
};

/**
 * @param {Function} f
 * @param {Array} bindingSpecs
 * @returns {Function}
 */
AccessorsUtilities._createBindingsAccessor = function(f, bindingSpecs) {
    var bindings, i, bindingSpec, accessor, isTuple;
    bindings = [];
    for (i = 0; i < bindingSpecs.length; i++) {
        bindingSpec = bindingSpecs[i];
        accessor = null;
        isTuple = false;
        
        if (typeof bindingSpec.bindingNames !== "undefined") {
            isTuple = true;
            accessor = AccessorsUtilities._createTupleAccessor(f, bindingSpec);
        } else {
            accessor = AccessorsUtilities._createElementalAccessor(f, bindingSpec);
        }
        
        if (typeof accessor === "undefined" || accessor === null) {
            if (typeof bindingSpec.optional === "undefined" || !bindingSpec.optional) {
                return null;
            }
        } else {
            bindings.push({
                bindingName:    bindingSpec.bindingName, 
                accessor:       accessor, 
                isTuple:        isTuple
            });
        }
    }
    
    return function(value, database, visitor) {
        SettingsUtilities._evaluateBindings(value, database, visitor, bindings);
    };
};

/**
 * @param {Function} f
 * @param {Object} spec
 * @returns {Function}
 */
AccessorsUtilities._createTupleAccessor = function(f, spec) {
    var value, expression, parsers, bindingTypes, bindingNames, separator, i;
    value = f(spec.attributeName);

    if (typeof value === "undefined" || value === null) {
        return null;
    }
    
    if (typeof value === "string") {
        value = value.trim();
        if (value.length === 0) {
            return null;
        }
    }
    
    try {
        expression = ExpressionParser.parse(value);
        
        parsers = [];
        bindingTypes = spec.types;
        for (i = 0; i < bindingTypes.length; i++) {
            parsers.push(SettingsUtilities._typeToParser(bindingTypes[i]));
        }
        
        bindingNames = spec.bindingNames;
        separator = ",";

        if (typeof spec.separator !== "undefined") {
            separator = spec.separator;
        }
        
        return function(itemID, database, visitor, tuple) {
            expression.evaluateOnItem(itemID, database).values.visit(
                function(v) {
                    var a, tuple2, n, j;
                    a = v.split(separator);
                    if (a.length === parsers.length) {
                        tuple2 = {};
                        if (tuple) {
                            for (n in tuple) {
                                if (tuple.hasOwnProperty(n)) {
                                    tuple2[n] = tuple[n];
                                }
                            }
                        }

                        for (j = 0; j < bindingNames.length; j++) {
                            tuple2[bindingNames[j]] = null;
                            parsers[j](a[j], function(v) { tuple2[bindingNames[j]] = v; });
                        }
                        visitor(tuple2);
                    }
                }
            );
        };

    } catch (e) {
        Debug.exception(e);
        return null;
    }
};

/**
 * @param {Function} f
 * @param {Object} spec
 * @param {String} spec.attributeName
 * @returns {Function}
 */
AccessorsUtilities._createElementalAccessor = function(f, spec) {
    var value, bindingType, expression, parser;

    value = f(spec.attributeName);

    if (typeof value === "undefined" || value === null) {
        return null;
    }
    
    if (typeof value === "string") {
        value = value.trim();
        if (value.length === 0) {
            return null;
        }
    }
    
    bindingType = "text";

    if (typeof spec.type !== "undefined") {
        bindingType = spec.type;
    }

    try {
        expression = ExpressionParser.parse(value);
        parser = SettingsUtilities._typeToParser(bindingType);
        return function(itemID, database, visitor) {
            expression.evaluateOnItem(itemID, database).values.visit(
                function(v) { return parser(v, visitor); }
            );
        };
    } catch (e) {
        Debug.exception(e);
        return null;
    }
};

    // end define
    return AccessorsUtilities;
});
