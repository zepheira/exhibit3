/**
 * @fileOverview Color coder to use when none is provided but one is needed.
 *     Does NOT extend Exhibit.Coder as it cannot be configured and has no
 *     need to inherit any of the structure used by other user-configured
 *     coders.
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "lib/jquery",
    "../../exhibit-core",
    "../../util/localizer",
    "../../util/coders"
], function($, Exhibit, _, Coders) {
/**
 * @class
 * @constructor
 * @param {Exhibit.UIContext} uiContext
 */
var DefaultColorCoder = function(uiContext) {
};

/**
 * @constant
 */
DefaultColorCoder.colors = [
    "#FF9000",
    "#5D7CBA",
    "#A97838",
    "#8B9BBA",
    "#FFC77F",
    "#003EBA",
    "#29447B",
    "#543C1C"
];

/**
 * @private
 */
DefaultColorCoder._map = {};

/**
 * @private
 */
DefaultColorCoder._nextColor = 0;

    /**
     * Given the final set of keys, return the key (used for translating to
     * color).  Will never return "others", this coder always supplies a color.
     * @param {Exhibit.Set} keys
     * @returns {Object|String} May be either the key or an object with
     *     property "flag", which is one of "missing" or "mixed".
     */
    DefaultColorCoder.prototype.chooseKey = function(keys) {
        var key, keysArr;
        if (keys.size === 0) {
            key = { "flag": "missing" };
        }

        keysArr = keys.toArray();
        if (keysArr.length > 1) {
            key = { "flag": "mixed" };
        } else {
            key = keysArr[0];
        }
        return key;
    };

    /**
     * Given a set of flags and keys that were already determined,
     * translate to the appropriate color.
     * @param {String} key
     * @param {Object} flags
     * @param {Boolean} flags.missing
     * @param {Boolean} flags.others
     * @param {Boolean} flags.mixed
     */
    DefaultColorCoder.prototype.translateFinal = function(key, flags) {
        if (flags.missing) {
            return this.getMissingColor();
        } else if (flags.mixed) {
            return this.getMixedColor();
        } else {
            return DefaultColorCoder._map[key];
        }
    };

/**
 * @param {String} key
 * @param {Object} flags
 * @param {Boolean} flags.missing
 * @param {Exhibit.Set} flags.keys
 * @returns {String}
 * @depends Exhibit.Coders
 */
DefaultColorCoder.prototype.translate = function(key, flags) {
    if (typeof key === "undefined" || key === null) {
        if (typeof flags !== "undefined" && flags !== null) {
            flags.missing = true;
        }
        return Coders.missingCaseColor;
    } else {
        if (typeof flags !== "undefined" && flags !== null) {
            flags.keys.add(key);
        }
        if (typeof DefaultColorCoder._map[key] !== "undefined") {
            return DefaultColorCoder._map[key];
        } else {
            var color = DefaultColorCoder.colors[DefaultColorCoder._nextColor];
            DefaultColorCoder._nextColor = 
                (DefaultColorCoder._nextColor + 1) % DefaultColorCoder.colors.length;
                
            DefaultColorCoder._map[key] = color;
            return color;
        }
    }
};

/**
 * @param {Exhibit.Set} keys
 * @param {Object} flags
 * @param {Boolean} flags.missing
 * @param {Boolean} flags.mixed
 * @returns {String}
 */
DefaultColorCoder.prototype.translateSet = function(keys, flags) {
    var color, self;
    color = null;
    self = this;
    keys.visit(function(key) {
        var color2 = self.translate(key, flags);
        if (color === null) {
            color = color2;
        } else if (color !== color2) {
            color = Coders.mixedCaseColor;
            flags.mixed = true;
            return true; // exit visitation
        }
        return false;
    });
    
    if (color !== null) {
        return color;
    } else {
        flags.missing = true;
        return Coders.missingCaseColor;
    }
};

/**
 * @returns {String}
 */
DefaultColorCoder.prototype.getOthersLabel = function() {
    return _("%coders.othersCaseLabel");
};

/**
 * @returns {String}
 */
DefaultColorCoder.prototype.getOthersColor = function() {
    return Coders.othersCaseColor;
};

/**
 * @returns {String}
 */
DefaultColorCoder.prototype.getMissingLabel = function() {
    return _("%coders.missingCaseLabel");
};

/**
 * @returns {String}
 */
DefaultColorCoder.prototype.getMissingColor = function() {
    return Coders.missingCaseColor;
};

/**
 * @returns {String}
 */
DefaultColorCoder.prototype.getMixedLabel = function() {
    return _("%coders.mixedCaseLabel");
};

/**
 * @returns {String}
 */
DefaultColorCoder.prototype.getMixedColor = function() {
    return Coders.mixedCaseColor;
};

    // end define
    return DefaultColorCoder;
});
