/**
 * @fileOverview Utilities for converting strings to classes.
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "util/localizer",
    "util/debug",
    "exhibit"
], function(_, Debug, Exhibit) {
    var FromString = {};

    /**
     * @private
     * @param {String} name
     * @param {String} suffix
     * @returns {Object}
     * @throws {Error}
     */
    FromString._stringToObject = function(name, suffix) {
        // @@@ This needs to possibly be rewritten with requirejs changes in naming
        if (!name.startsWith("Exhibit.")) {
            if (!name.endsWith(suffix)) {
                try {
                    return eval("Exhibit." + name + suffix);
                } catch (ex1) {
                    // ignore
                }
            }
            
            try {
                return eval("Exhibit." + name);
            } catch (ex2) {
                // ignore
            }
        }
    
        if (!name.endsWith(suffix)) {
            try {
                return eval(name + suffix);
            } catch (ex3) {
                // ignore
            }
        }
    
        try {
            return eval(name);
        } catch (ex4) {
            // ignore
        }
    
        throw new Error(_("%general.error.unknownClass", name));
    };

    /**
     * @param {String} name
     * @returns {Object}
     */
    FromString.viewClassNameToViewClass = function(name) {
        if (typeof name !== "undefined" && name !== null && name.length > 0) {
            try {
                return FromString._stringToObject(name, "View");
            } catch (e) {
                Debug.warn(_("%general.error.unknownViewClass", name));
            }
        }
        return FromString._stringToObject("Exhibit.TileView", "View");
    };

    /**
     * @param {String} name
     * @returns {Object}
     */
    FromString.facetClassNameToFacetClass = function(name) {
        if (typeof name !== "undefined" && name !== null && name.length > 0) {
            try {
                return FromString._stringToObject(name, "Facet");
            } catch (e) {
                Debug.warn(_("%general.error.unknownFacetClass", name));
            }
        }
        return FromString._stringToObject("ListFacet", "Facet");
    };
    
    /**
     * @param {String} name
     * @returns {Object}
     */
    FromString.coderClassNameToCoderClass = function(name) {
        if (typeof name !== "undefined" && name !== null && name.length > 0) {
            try {
                return FromString._stringToObject(name, "Coder");
            } catch (e) {
                Debug.warn(_("%general.error.unknownCoderClass", name));
            }
        }
        return FromString._stringToObject("ColorCoder", "Coder");
    };

    // end define
    return FromString;
});
