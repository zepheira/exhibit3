/**
 * @fileOverview Codes values with colors.
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "lib/jquery",
    "../../exhibit-core",
    "../../util/localizer",
    "../../util/debug",
    "../../util/settings",
    "../../util/coders",
    "../ui-context",
    "./coder"
], function($, Exhibit, _, Debug, SettingsUtilities, Coders, UIContext, Coder) {
/**
 * @constructor
 * @class
 * @param {Element|jQuery} containerElmt 
 * @param {Exhibit.UIContext} uiContext
 */
var ColorCoder = function(containerElmt, uiContext) {
    $.extend(this, new Coder(
        "color",
        containerElmt,
        uiContext
    ));
    this.addSettingSpecs(ColorCoder._settingSpecs);

    this._map = {};

    this._mixedCase = { 
        "label": _("%coders.mixedCaseLabel"),
        "color": Coders.mixedCaseColor
    };
    this._missingCase = { 
        "label": _("%coders.missingCaseLabel"),
        "color": Coders.missingCaseColor 
    };
    this._othersCase = { 
        "label": _("%coders.othersCaseLabel"),
        "color": Coders.othersCaseColor 
    };

    this.register();
};

/**
 * @constant
 */
ColorCoder._settingSpecs = {
};

/**
 * @param {Object} configuration
 * @param {Exhibit.UIContext} uiContext
 * @returns {Exhibit.ColorCoder}
 */
ColorCoder.create = function(configuration, uiContext) {
    var coder, div;
    div = $("<div>")
        .hide()
        .appendTo("body");
    coder = new ColorCoder(div, UIContext.create(configuration, uiContext));
    
    ColorCoder._configure(coder, configuration);
    return coder;
};

/**
 * @param {Element} configElmt
 * @param {Exhibit.UIContext} uiContext
 * @returns {Exhibit.ColorCoder}
 */
ColorCoder.createFromDOM = function(configElmt, uiContext) {
    var configuration, coder;

    $(configElmt).hide();

    configuration = Exhibit.getConfigurationFromDOM(configElmt);
    coder = new ColorCoder(
        configElmt,
        UIContext.create(configuration, uiContext)
    );
    
    SettingsUtilities.collectSettingsFromDOM(
        configElmt,
        coder.getSettingSpecs(),
        coder._settings
    );
    
    try {
        $(configElmt).children().each(function(index, elmt) {
            coder._addEntry(
                Exhibit.getAttribute(this,  "case"),
                $(this).text().trim(),
                Exhibit.getAttribute(this, "color")
            );
        });
    } catch (e) {
        Debug.exception(e, "ColorCoder: Error processing configuration of coder");
    }
    
    ColorCoder._configure(coder, configuration);
    return coder;
};

/**
 * @param {Exhibit.ColorCoder} coder
 * @param {Object} configuration
 */
ColorCoder._configure = function(coder, configuration) {
    var entries, i;

    SettingsUtilities.collectSettings(
        configuration,
        coder.getSettingSpecs(),
        coder._settings
    );
    
    if (typeof configuration["entries"] !== "undefined") {
        entries = configuration.entries;
        for (i = 0; i < entries.length; i++) {
            coder._addEntry(entries[i].kase, entries[i].key, entries[i].color);
        }
    }
};

/**
 *
 */
ColorCoder.prototype.dispose = function() {
    this._map = null;
    this._dispose();
};

/**
 * @constant
 */
ColorCoder._colorTable = {
    "red" :     "#ff0000",
    "green" :   "#00ff00",
    "blue" :    "#0000ff",
    "white" :   "#ffffff",
    "black" :   "#000000",
    "gray" :    "#888888"
};

/**
 * @param {String} kase
 * @param {String} key
 * @param {String} color
 */
ColorCoder.prototype._addEntry = function(kase, key, color) {
    if (typeof ColorCoder._colorTable[color] !== "undefined") {
        color = ColorCoder._colorTable[color];
    }
    
    var entry = null;
    switch (kase) {
    case "others":  entry = this._othersCase; break;
    case "mixed":   entry = this._mixedCase; break;
    case "missing": entry = this._missingCase; break;
    }
    if (entry !== null) {
        entry.label = key;
        entry.color = color;
    } else {
        this._map[key] = { color: color };
    }
};

/**
 * @param {String} key
 * @param {Object} flags
 * @param {Boolean} flags.missing
 * @param {Boolean} flags.others
 * @param {Exhibit.Set} flags.keys
 */
ColorCoder.prototype.translate = function(key, flags) {
    if (typeof this._map[key] !== "undefined") {
        if (flags) {
            flags.keys.add(key);
        }
        return this._map[key].color;
    } else if (typeof key === "undefined" || key === null) {
        if (flags) {
            flags.missing = true;
        }
        return this._missingCase.color;
    } else {
        if (flags) {
            flags.others = true;
        }
        return this._othersCase.color;
    }
};

/**
 * @param {Exhibit.Set} keys
 * @param {Object} flags
 * @param {Boolean} flags.missing
 * @param {Boolean} flags.mixed
 * @returns {String}
 */
ColorCoder.prototype.translateSet = function(keys, flags) {
    var color, self;
    color = null;
    self = this;
    keys.visit(function(key) {
        var color2 = self.translate(key, flags);
        if (color === null) {
            color = color2;
        } else if (color !== color2) {
            if (typeof flags !== "undefined" && flags !== null) {
                flags.mixed = true;
            }
            color = self._mixedCase.color;
            return true;
        }
        return false;
    });
    
    if (color !== null) {
        return color;
    } else {
        if (typeof flags !== "undefined" && flags !== null) {
            flags.missing = true;
        }
        return this._missingCase.color;
    }
};

/**
 * @returns {String}
 */
ColorCoder.prototype.getOthersLabel = function() {
    return this._othersCase.label;
};

/**
 * @returns {String}
 */
ColorCoder.prototype.getOthersColor = function() {
    return this._othersCase.color;
};

/**
 * @returns {String}
 */
ColorCoder.prototype.getMissingLabel = function() {
    return this._missingCase.label;
};

/**
 * @returns {String}
 */
ColorCoder.prototype.getMissingColor = function() {
    return this._missingCase.color;
};

/**
 * @returns {String}
 */
ColorCoder.prototype.getMixedLabel = function() {
    return this._mixedCase.label;
};

/**
 * @returns {String}
 */
ColorCoder.prototype.getMixedColor = function() {
    return this._mixedCase.color;
};

    // end define
    return ColorCoder;
});
