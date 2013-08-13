/**
 * @fileOverview Methods for handling older Exhibit attribute styles. Only
 *     load if the page-based config seems to contain a namespace / attributes
 *     that reflect the old style (e.g., ex:role) instead of the new style.
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define(["lib/jquery", "../exhibit-base", "./bc"], function($, Exhibit, Backwards) {
    var Attributes;

    /**
     * @namespace
     */
    Attributes = {
        "prefix": "ex:"
    };

    /**
     * Call to switch Exhibit into backwards compatibility mode for Exhibit
     * attributes.
     * @static
     */
    Attributes.enable = function() {
        Backwards.enabled.Attributes = true;
        Exhibit.getAttribute = Attributes.getAttribute;
        Exhibit.extractOptionsFromElement = Attributes.extractOptionsFromElement;
        Exhibit.isExhibitAttribute = Attributes.isExhibitAttribute;
        Exhibit.makeExhibitAttribute = Attributes.makeExhibitAttribute;
        Exhibit.extractAttributeName = Attributes.extractAttributeName;
    };

    /**
     * A backwards compatible mechanism for retrieving an Exhibit attribute
     * value.
     * @static
     * @param {jQuery|Element} elmt
     * @param {String} name
     * @param {String} splitOn
     * @returns {String|Array}
     */
    Attributes.getAttribute = function(elmt, name, splitOn) {
        var value, i, values;

        try {
            value = $(elmt).attr(name);
            if (typeof value === "undefined" || value === null || value.length === 0) {
                value = $(elmt).attr(Attributes.prefix+name);
                if (typeof value === "undefined" || value === null || value.length === 0) {
                    return null;
                }
            }
            if (typeof splitOn === "undefined" || splitOn === null) {
                return value;
            }
            values = value.split(splitOn);
            for (i = 0; i < values.length; i++) {
                values[i] = values[i].trim();
            }
            return values;
        } catch(e) {
            return null;
        }
    };

    /**
     * A backwards compatible mechanism for retrieving all Exhibit attributes
     * on an element.
     * @static
     * @param {Element} elmt
     * @returns {Object}
     */
    Attributes.extractOptionsFromElement = function(elmt) {
        var opts, attrs, i, name, value;
        opts = {};
        attrs = elmt.attributes;
        for (i in attrs) {
            if (attrs.hasOwnProperty(i)) {
                name = attrs[i].nodeName;
                value = attrs[i].nodeValue;
                if (name.indexOf(Attributes.prefix) === 0) {
                    name = name.substring(Attributes.prefix.length);
                }
                opts[name] = value;
            }
        }
        return opts;
    };

    /**
     * @static
     * @param {String} name
     * @returns {Boolean}
     */
    Attributes.isExhibitAttribute = function(name) {
        var prefix = Attributes.prefix;
        return name.length > prefix.length
            && name.startsWith(prefix);
    };

    /**
     * @static
     * @param {String} name
     */
    Attributes.extractAttributeName = function(name) {
        return name.substr(Attributes.prefix.length);
    };

    /**
     * @static
     * @param {String} name
     * @returns {String}
     */
    Attributes.makeExhibitAttribute = function(name) {
        return Attributes.prefix + name;
    };
    
    // end define
    return Attributes;
});
