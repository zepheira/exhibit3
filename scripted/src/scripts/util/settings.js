/**
 * @fileOverview Utilities for various parts of Exhibit to collect
 *    their settings.
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "../exhibit-core",
    "./localizer",
    "./debug",
    "./date-time",
    "./persistence"
], function(Exhibit, _, Debug, DateTime, Persistence) {
/**
 * @namespace
 */
var SettingsUtilities = {};

/**
 * @param {Object} config
 * @param {Object} specs
 * @param {Object} settings
 */
SettingsUtilities.collectSettings = function(config, specs, settings) {
    SettingsUtilities._internalCollectSettings(
        function(field) { return config[field]; },
        specs,
        settings
    );
};

/**
 * @param {Element} configElmt
 * @param {Object} specs
 * @param {Object} settings
 */
SettingsUtilities.collectSettingsFromDOM = function(configElmt, specs, settings) {
    SettingsUtilities._internalCollectSettings(
        function(field) { return Exhibit.getAttribute(configElmt, field); },
        specs,
        settings
    );
};

/**
 * @param {Function} f
 * @param {Object} specs
 * @param {Object} settings
 */
SettingsUtilities._internalCollectSettings = function(f, specs, settings) {
    var field, spec, name, value, type, dimensions, separator, a, i;

    for (field in specs) {
        if (specs.hasOwnProperty(field)) {
            spec = specs[field];
            name = field;
            if (typeof spec.name !== "undefined") {
                name = spec.name;
            }
            if (typeof settings[name] === "undefined" &&
                typeof spec.defaultValue !== "undefined") {
                settings[name] = spec.defaultValue;
            }
        
            value = f(field);
            if (typeof value !== "undefined" && value !== null) {
                if (typeof value === "string") {
                    value = value.trim();
                }
            }

            if (typeof value !== "undefined" && value !== null && ((typeof value === "string" && value.length > 0) || typeof value !== "string")) {
                type = "text";
                if (typeof spec.type !== "undefined") {
                    type = spec.type;
                }
                
                dimensions = 1;
                if (typeof spec.dimensions !== "undefined") {
                    dimensions = spec.dimensions;
                }
                
                try {
                    if (dimensions > 1) {
                        separator = ",";
                        if (typeof spec.separator !== "undefined") {
                            separator = spec.separator;
                        }

                        a = value.split(separator);
                        if (a.length !== dimensions) {
                            throw new Error(_("%settings.error.inconsistentDimensions", dimensions, separator, value));
                        } else {
                            for (i = 0; i < a.length; i++) {
                                a[i] = SettingsUtilities._parseSetting(a[i].trim(), type, spec);
                            }
                            settings[name] = a;
                        }
                    } else {
                        settings[name] = SettingsUtilities._parseSetting(value, type, spec);
                    }
                } catch (e) {
                    Debug.exception(e);
                }
            }
        }
    }
};

/**
 * @param {String|Number|Boolean|Function} s
 * @param {String} type
 * @param {Object} spec
 * @param {Array} spec.choices
 * @throws Error
 */
SettingsUtilities._parseSetting = function(s, type, spec) {
    var sType, f, n, choices, i;
    sType = typeof s;
    if (type === "text") {
        return s;
    } else if (type === "float") {
        if (sType === "number") {
            return s;
        } else if (sType === "string") {
            f = parseFloat(s);
            if (!isNaN(f)) {
                return f;
            }
        }
        throw new Error(_("%settings.error.notFloatingPoint", s));
    } else if (type === "int") {
        if (sType === "number") {
            return Math.round(s);
        } else if (sType === "string") {
            n = parseInt(s, 10);
            if (!isNaN(n)) {
                return n;
            }
        }
        throw new Error(_("%settings.error.notInteger", s));
    } else if (type === "boolean") {
        if (sType === "boolean") {
            return s;
        } else if (sType === "string") {
            s = s.toLowerCase();
            if (s === "true") {
                return true;
            } else if (s === "false") {
                return false;
            }
        }
        throw new Error(_("%settings.error.notBoolean", s));
    } else if (type === "function") {
        if (sType === "function") {
            return s;
        } else if (sType === "string") {
            try {
                f = eval(s);
                if (typeof f === "function") {
                    return f;
                }
            } catch (e) {
                // silent
            }
        }
        throw new Error(_("%settings.error.notFunction", s));
    } else if (type === "enum") {
        choices = spec.choices;
        for (i = 0; i < choices.length; i++) {
            if (choices[i] === s) {
                return s;
            }
        }
        throw new Error(_("%settings.error.notEnumerated", choices.join(", "), s));
    } else {
        throw new Error(_("%settings.error.unknownSetting", type));
    }
};

/**
 * @param {String} type
 * @returns {Function}
 * @throws Error
 */
SettingsUtilities._typeToParser = function(type) {
    switch (type) {
    case "text":    return SettingsUtilities._textParser;
    case "url":     return SettingsUtilities._urlParser;
    case "float":   return SettingsUtilities._floatParser;
    case "int":     return SettingsUtilities._intParser;
    case "date":    return SettingsUtilities._dateParser;
    case "boolean": return SettingsUtilities._booleanParser;
    default:
        throw new Error(_("%settings.error.unknownSetting", type));

    }
};

/**
 * @param {String} v
 * @param {Function} f
 */
SettingsUtilities._textParser = function(v, f) {
    return f(v);
};

/**
 * @param {String} v
 * @param {Function} f
 */
SettingsUtilities._floatParser = function(v, f) {
    var n = parseFloat(v);
    if (!isNaN(n)) {
        return f(n);
    }
    return false;
};

/**
 * @param {String} v
 * @param {Function} f
 */
SettingsUtilities._intParser = function(v, f) {
    var n = parseInt(v, 10);
    if (!isNaN(n)) {
        return f(n);
    }
    return false;
};

/**
 * @param {String} v
 * @param {Function} f
 */
SettingsUtilities._dateParser = function(v, f) {
    var d;
    if (v instanceof Date) {
        return f(v);
    } else if (typeof v === "number") {
        d = new Date(0);
        d.setUTCFullYear(v);
        return f(d);
    } else {
        d = DateTime.parseIso8601DateTime(v.toString());
        if (d !== null) {
            return f(d);
        }
    }
    return false;
};

/**
 * @param {String} v
 * @param {Function} f
 */
SettingsUtilities._booleanParser = function(v, f) {
    v = v.toString().toLowerCase();
    if (v === "true") {
        return f(true);
    } else if (v === "false") {
        return f(false);
    }
    return false;
};

/**
 * @param {String} v
 * @param {Function} f
 */
SettingsUtilities._urlParser = function(v, f) {
    return f(Persistence.resolveURL(v.toString()));
};

/**
 * @param {String} value
 * @param {Exhibit.Database} database
 * @param {Function} visitor
 * @param {Array} bindings
 */
SettingsUtilities._evaluateBindings = function(value, database, visitor, bindings) {
    var f, maxIndex;
    maxIndex = bindings.length - 1;
    f = function(tuple, index) {
        var binding, visited, recurse, bindingName;
        binding = bindings[index];
        visited = false;
        recurse = (index === maxIndex) ?
            function() { visitor(tuple); } :
            function() { f(tuple, index + 1); };
        if (binding.isTuple) {
            /*
                The tuple accessor will copy existing fields out of "tuple" into a new
                object and then injects new fields into it before calling the visitor.
                This is so that the same tuple object is not reused for different
                tuple values, which would cause old tuples to be overwritten by new ones.
             */
            binding.accessor(
                value, 
                database, 
                function(tuple2) { visited = true; tuple = tuple2; recurse(); }, 
                tuple
            );
        } else {
            bindingName = binding.bindingName;
            binding.accessor(
                value, 
                database, 
                function(v) { visited = true; tuple[bindingName] = v; recurse(); }
            );
        }
        
        if (!visited) { recurse(); }
    };
    f({}, 0);
};

    // end define
    return SettingsUtilities;
});
