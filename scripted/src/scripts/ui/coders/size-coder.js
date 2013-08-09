/**
 * @fileOverview Code values with size.
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "lib/jquery",
    "../../exhibit-core",
    "../../util/localizer",
    "../../util/debug",
    "../../util/settings",
    "../ui-context",
    "./coder"
], function($, Exhibit, _, Debug, SettingsUtilities, UIContext, Coder) {
/**
 * @class
 * @constructor
 * @param {Element|jQuery} containerElmt
 * @param {Exhibit.UIContext} uiContext
 */
var SizeCoder = function(containerElmt, uiContext) {
    $.extend(this, new Coder(
        "size",
        containerElmt,
        uiContext
    ));
    this.addSettingSpecs(SizeCoder._settingSpecs);
    
    this._map = {};
    this._mixedCase = {
        "label": _("%coders.mixedCaseLabel"),
        "size": 10
    };
    this._missingCase = {
        "label": _("%coders.missingCaseLabel"),
        "size": 10
    };
    this._othersCase = {
        "label": _("%coders.othersCaseLabel"),
        "size": 10
    };

    this.register();
};

/**
 * @constant
 */
SizeCoder._settingSpecs = {
};

/**
 * @param {Object} configuration
 * @param {Exhibit.UIContext} uiContext
 * @returns {Exhibit.SizeCoder}
 */
SizeCoder.create = function(configuration, uiContext) {
    var coder, div;
    div = $("<div>")
        .hide()
        .appendTo("body");
    coder = new SizeCoder(
        div,
        UIContext.create(configuration, uiContext)
    );
    
    SizeCoder._configure(coder, configuration);
    return coder;
};

/**
 * @param {Element} configElmt
 * @param {Exhibit.UIContext} uiContext
 * @returns {Exhibit.SizeCoder}
 */
SizeCoder.createFromDOM = function(configElmt, uiContext) {
    var configuration, coder;

    $(configElmt).hide();
    
    configuration = Exhibit.getConfigurationFromDOM(configElmt);
    coder = new SizeCoder(
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
                Exhibit.getAttribute(this, "size")
            );
        });
    } catch (e) {
        Debug.exception(e, _("%coders.error.configuration", "SizeCoder"));
    }
    
    SizeCoder._configure(coder, configuration);
    return coder;
};

/**
 * @param {Exhibit.SizeCoder} coder
 * @param {Object} configuration
 */
SizeCoder._configure = function(coder, configuration) {
    var entries, i;

    SettingsUtilities.collectSettings(
        configuration,
        coder.getSettingSpecs(),
        coder._settings
    );
    
    if (typeof configuration.entries !== "undefined") {
        entries = configuration.entries;
        for (i = 0; i < entries.length; i++) {
            coder._addEntry(entries[i].kase, entries[i].key, entries[i].size);
        }
    }
};

/**
 *
 */
SizeCoder.prototype.dispose = function() {
    this._map = null;
    this._dispose();
};

/**
 * @param {String} kase
 * @param {String} key
 * @param {Number} size
 */
SizeCoder.prototype._addEntry = function(kase, key, size) {  
    var entry = null;
    switch (kase) {
    case "others":  entry = this._othersCase; break;
    case "mixed":   entry = this._mixedCase; break;
    case "missing": entry = this._missingCase; break;
    }
    if (entry !== null) {
        entry.label = key;
        entry.size = size;
    } else {
        this._map[key] = { size: size };
    }
};

/**
 * @param {String} key
 * @param {Object} flags
 * @returns {Number}
 */
SizeCoder.prototype.translate = function(key, flags) {
    if (typeof this._map[key] !== "undefined") {
        if (typeof flags !== "undefined" && flags !== null) {
            flags.keys.add(key);
        }
        return this._map[key].size;
    } else if (typeof key === "undefined" || key === null) {
        if (typeof flags !== "undefined" && flags !== null) {
            flags.missing = true;
        }
        return this._missingCase.size;
    } else {
        if (typeof flags !== "undefined" && flags !== null) {
            flags.others = true;
        }
        return this._othersCase.size;
    }
};

/**
 * @param {Exhibit.Set} keys
 * @param {Object} flags
 * @returns {Number}
 */
SizeCoder.prototype.translateSet = function(keys, flags) {
    var size, self;
    size = null;
    self = this;
    keys.visit(function(key) {
        var size2 = self.translate(key, flags);
        if (size === null) {
            size = size2;
        } else if (size !== size2) {
            if (typeof flags !== "undefined" && flags !== null) {
                flags.mixed = true;
            }
            size = self._mixedCase.size;
            return true;
        }
        return false;
    });
    
    if (size !== null) {
        return size;
    } else {
        if (typeof flags !== "undefined" && flags !== null) {
            flags.missing = true;
        }
        return this._missingCase.size;
    }
};

/**
 * @returns {String}
 */
SizeCoder.prototype.getOthersLabel = function() {
    return this._othersCase.label;
};

/**
 * @returns {Number}
 */
SizeCoder.prototype.getOthersSize = function() {
    return this._othersCase.size;
};

/**
 * @returns {String}
 */
SizeCoder.prototype.getMissingLabel = function() {
    return this._missingCase.label;
};

/**
 * @returns {Number}
 */
SizeCoder.prototype.getMissingSize = function() {
    return this._missingCase.size;
};

/**
 * @returns {String}
 */
SizeCoder.prototype.getMixedLabel = function() {
    return this._mixedCase.label;
};

/**
 * @returns {Number}
 */
SizeCoder.prototype.getMixedSize = function() {
    return this._mixedCase.size;
};

    // end define
    return SizeCoder;
});
