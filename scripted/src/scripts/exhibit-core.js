/**
 * @fileOverview
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define(["lib/jquery", "./exhibit-base", "./bc/bc", "./bc/attributes"], function($, Exhibit, Backwards) {
/**
 * Retrieve an Exhibit-specific attribute from an element.
 *
 * @static
 * @param {jQuery|Element} elmt
 * @param {String} name Full attribute name or Exhibit attribute (without any
 *    prefix), e.g., "id" or "itemTypes".  "item-types" or "data-ex-item-types"
 *    are equivalent to "itemTypes", but "itemTypes" is the preferred form.
 * @param {String} splitOn Separator character to split a string
 *    representation into several values.  Returns an array if used.
 * @returns {String|Array}
 */
Exhibit.getAttribute = function(elmt, name, splitOn) {
    var value, i, values;

    try {
        value = $(elmt).attr(name);
        if (typeof value === "undefined" || value === null || value.length === 0) {
            value = $(elmt).data("ex-"+name);
            if (typeof value === "undefined" || value === null || value.length === 0) {
                return null;
            }
        }
        if (typeof value.toString !== "undefined") {
            value = value.toString();
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
 * @static
 * @param {Element} elmt
 * @returns {String}
 */
Exhibit.getRoleAttribute = function(elmt) {
    var role = Exhibit.getAttribute(elmt, "role") || "";
    if (typeof role === "object") {
        role = role[0];
    }
    role = role.replace(/^exhibit-/, "");
    return role;
};

/**
 * Process a DOM element's attribute name to see if it is an Exhibit
 * attribute.
 * @static
 * @param {String} name
 * @returns {Boolean}
 */
Exhibit.isExhibitAttribute = function(name) {
    return name.length > "data-ex-".length
        && name.startsWith("data-ex-");
};

/**
 * Process a DOM element's attribute and convert it into the name Exhibit
 * uses internally.
 * @static
 * @param {String} name
 * @returns {String}
 */
Exhibit.extractAttributeName = function(name) {
    return name.substr("data-ex-".length);
};

/**
 * Turn an internal attribute name into something that can be inserted into
 * the DOM and correctly re-extracted later as an Exhibit attribute.
 * @static
 * @param {String} name
 */
Exhibit.makeExhibitAttribute = function(name) {
    var exname;
    switch (name) {
        case "itemID":
            exname = "itemid";
            break;
        default:
            exname = "data-ex-" + name.replace(/([A-Z])/g, "-$1").toLowerCase();
            break;
    }
    return exname;
};

/**
 * @static
 * @param {Element} elmt
 * @returns {Object}
 */
Exhibit.getConfigurationFromDOM = function(elmt) {
    var c, o;
    c = Exhibit.getAttribute(elmt, "configuration");
    if (typeof c !== "undefined" && c !== null && c.length > 0) {
        try{
            o = eval(c);
            if (typeof o === "object") {
                return o;
            }
        } catch (e) {}
    }
    return {};
};

/**
 * This method is not commonly used.  Consider using Exhibit.SettingsUtilties.
 * @deprecated
 * @static
 * @param {Element} elmt
 * @returns {Object}
 */
Exhibit.extractOptionsFromElement = function(elmt) {
    var opts, dataset, i;
    opts = {};
    dataset = $(elmt).data();
    for (i in dataset) {
        if (dataset.hasOwnProperty(i)) {
            if (i.startsWith("ex")) {
                opts[i.substring(2)] = dataset[i];
            } else {
                opts[i] = dataset[i];
            }
        }
    }
    return opts;
};

// @@@ deprecate
/**
 * @static
 * @returns {String}
 */
Exhibit.generateDelayID = function() {
    return "delay" + Math.round(Math.random()*100000);
};

    /**
     * Check for instances of ex:role and throw into backwards compatibility
     * mode if any are found.  Authors are responsible for converting or using
     * the HTML5 attributes correctly; backwards compatibility is only
     * applicable when used with unconverted Exhibits.
     * @static
     * @see Exhibit.Backwards
     */
    Exhibit.checkBackwardsCompatibility = function() {
        var exroles;
        exroles = $("*").filter(function() {
            return typeof $(this).attr("ex:role") !== "undefined";
        });
        if (exroles.length > 0) {
            Backwards.enable("Attributes");
        }
    };

    // end define
    return Exhibit;
});
