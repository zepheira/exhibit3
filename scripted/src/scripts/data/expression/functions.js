/**
 * @fileOverview Implementation of query language function features.
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "../../util/util",
    "../../util/set",
    "../../util/settings",
    "../../util/date-time",
    "./collection"
], function(Util, Set, SettingsUtilities, DateTime, ExpressionCollection) {
/**
 * @namespace
 */
var Functions = {};

Functions.union = {
    f: function(args) {
        var set, valueType, i, arg;
        set = new Set();
        valueType = null;
        
        if (args.length > 0) {
            valueType = args[0].valueType;
            for (i = 0; i < args.length; i++) {
                arg = args[i];
                if (arg.size > 0) {
                    if (typeof valueType === "undefined" || valueType === null) {
                        valueType = arg.valueType;
                    }
                    set.addSet(arg.getSet());
                }
            }
        }
        return new ExpressionCollection(set, (typeof valueType !== "undefined" && valueType !== null) ? valueType : "text");
    }
};

Functions.contains = {
    f: function(args) {
        var result, set;
        result = args[0].size > 0;
        set = args[0].getSet();
        
        args[1].forEachValue(function(v) {
            if (!set.contains(v)) {
                result = false;
                return true;
            }
        });
        
        return new ExpressionCollection([ result ], "boolean");
    }
};

Functions.exists = {
    f: function(args) {
        return new ExpressionCollection([ args[0].size > 0 ], "boolean");
    }
};

Functions.count = {
    f: function(args) {
        return new ExpressionCollection([ args[0].size ], "number");
    }
};

Functions.not = {
    f: function(args) {
        return new ExpressionCollection([ !args[0].contains(true) ], "boolean");
    }
};

Functions.and = {
    f: function(args) {
        var r = true, i;
        for (i = 0; r && i < args.length; i++) {
            r = r && args[i].contains(true);
        }
        return new ExpressionCollection([ r ], "boolean");
    }
};

Functions.or = {
    f: function(args) {
        var r = false, i;
        for (i = 0; !r && i < args.length; i++) {
            r = r || args[i].contains(true);
        }
        return new ExpressionCollection([ r ], "boolean");
    }
};

Functions.add = {
    f: function(args) {
        var total, i, fn;
        total = 0;
        fn = function() {
            return function(v) {
                if (typeof v !== "undefined" && v !== null) {
                    if (typeof v === "number") {
                        total += v;
                    } else {
                        var n = parseFloat(v);
                        if (!isNaN(n)) {
                            total += n;
                        }
                    }
                }
            };
        };
        for (i = 0; i < args.length; i++) {
            args[i].forEachValue(fn());
        }
        
        return new ExpressionCollection([ total ], "number");
    }
};

// Note: arguments expanding to multiple items get concatenated in random order
Functions.concat = {
    f: function(args) {
        var result = [], i, fn;
        fn = function() {
            return function(v) {
                if (typeof v !== "undefined" && v !== null) {
                    result.push(v);
                }
            };
        };
        for (i = 0; i < args.length; i++) {
            args[i].forEachValue(fn());
        }

        return new ExpressionCollection([ result.join('') ], "text");
    }
};

Functions.multiply = {
    f: function(args) {
        var product = 1, i, fn;
        fn = function() {
            return function(v) {
                var n;
                if (typeof v !== "undefined" && v !== null) {
                    if (typeof v === "number") {
                        product *= v;
                    } else {
                        n = parseFloat(v);
                        if (!isNaN(n)) {
                            product *= n;
                        }
                    }
                }
            };
        };
        for (i = 0; i < args.length; i++) {
            args[i].forEachValue(fn());
        }
        
        return new ExpressionCollection([ product ], "number");
    }
};

Functions["date-range"] = {
    _parseDate: function (v) {
        if (typeof v === "undefined" || v === null) {
            return Number.NEGATIVE_INFINITY;
        } else if (v instanceof Date) {
            return v.getTime();
        } else {
            try {
                return DateTime.parseIso8601DateTime(v).getTime();
            } catch (e) {
                return Number.NEGATIVE_INFINITY;
            }
        }
    },
    _computeRange: function(from, to, interval) {
        var range = to - from;
        if (isFinite(range)) {
            if (typeof DateTime[interval.toUpperCase()] !== "undefined") {
                range = Math.round(range / DateTime.gregorianUnitLengths[DateTime[interval.toUpperCase()]]);
            }
            return range;
        }
        return null;
    },
    f: function(args) {
        var self = this, from, to, interval, range;
        
        from = Number.POSITIVE_INFINITY;
        args[0].forEachValue(function(v) {
            from = Math.min(from, self._parseDate(v));
        });
        
        to = Number.NEGATIVE_INFINITY;
        args[1].forEachValue(function(v) {
            to = Math.max(to, self._parseDate(v));
        });
        
        interval = "day";
        args[2].forEachValue(function(v) {
            interval = v;
        });
            
        range = this._computeRange(from, to, interval);
        return new ExpressionCollection((typeof range !== "undefined" && range !== null) ? [ range ] : [], "number");
    }
};

// @@@ This is dependent on Google Maps v2; excise it
Functions.distance = {
    _units: {
        km:         1e3,
        mile:       1609.344
    },
    _computeDistance: function(from, to, unit, roundTo) {
        var range = from.distanceFrom(to);
        if (!roundTo) {
            roundTo = 1;
        }
        if (isFinite(range)) {
            if (typeof this._units[unit] !== "undefined") {
                range = range / this._units[unit];
            }
            return Util.round(range, roundTo);
        }
        return null;
    },
    f: function(args) {
        var self = this, data, name, n, i, latlng, from, to, range, fn;
        data = {};
        name = ["origo", "lat", "lng", "unit", "round"];
        fn = function(nm) {
            return function(v) {
                data[nm] = v;
            };
        };
        for (i = 0; i < name.length; i++) {
            n = name[i];
            args[i].forEachValue(fn(n));
        }

        latlng = data.origo.split(",");
        from = new NOSUCHGLatLng( latlng[0], latlng[1] );
        to = new NOSUCHGLatLng( data.lat, data.lng );
        
        range = this._computeDistance(from, to, data.unit, data.round);
        return new ExpressionCollection((typeof range !== "undefined" && range !== null) ? [ range ] : [], "number");
    }
};

Functions.min = {
    f: function(args) {
        /** @ignore */
        var returnMe = function (val) { return val; }, min, valueType, i, arg, currentValueType, parser, fn;
        min = Number.POSITIVE_INFINITY;
        valueType = null;
        fn = function(p, c) {
            return function(v) {
                var parsedV = p(v, returnMe);
                if (parsedV < min || min === Number.POSITIVE_INFINITY) {
                    min = parsedV;
                    valueType = (valueType === null) ? c : 
                        (valueType === c ? valueType : "text") ;
                }
            };
        };
        for (i = 0; i < args.length; i++) {
            arg = args[i];
            currentValueType = arg.valueType || 'text';
            parser = SettingsUtilities._typeToParser(currentValueType);
                
            arg.forEachValue(fn(parser, currentValueType));
        }
        
        return new ExpressionCollection([ min ], (typeof valueType !== "undefined" && valueType !== null) ? valueType : "text");
    }
};

Functions.max = {
    f: function(args) {
        var returnMe, max, valueType, i, arg, currentValueType, parser, fn;
        returnMe = function(val) {
            return val;
        };
        max = Number.NEGATIVE_INFINITY;
        valueType = null;
        fn = function(p, c) {
            return function(v) {
                var parsedV = p(v, returnMe);
                if (parsedV > max || max === Number.NEGATIVE_INFINITY) {
                    max = parsedV;
                    valueType = (valueType === null) ? c : 
                        (valueType === c ? valueType : "text") ;
                }
            };
        };
        
        for (i = 0; i < args.length; i++) {
            arg = args[i];
            currentValueType = arg.valueType || 'text';
            parser = SettingsUtilities._typeToParser(currentValueType);
            
            arg.forEachValue(fn(parser, currentValueType));
        }
        return new ExpressionCollection([ max ], (typeof valueType !== "undefined" && valueType !== null) ? valueType : "text");
    }
};

Functions.remove = {
    f: function(args) {
        var set, valueType, i, arg;
        set = args[0].getSet();
        valueType = args[0].valueType;
        for (i = 1; i < args.length; i++) {
            arg = args[i];
            if (arg.size > 0) {
                set.removeSet(arg.getSet());
            }
        }
        return new ExpressionCollection(set, valueType);
    }
};

Functions.now = {
    f: function(args) {
        return new ExpressionCollection([ new Date() ], "date");
    }
};

    // end define
    return Functions;
});
