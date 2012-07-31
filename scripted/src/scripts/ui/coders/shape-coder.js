/**
 * @fileOverview Code values with shapes.
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

/**
 * @constructor
 * @class
 * @param {Element|jQuery} containerElmt
 * @param {Exhibit.UIContext} uiContext
 */
Exhibit.ShapeCoder = function(containerElmt, uiContext) {
    $.extend(this, new Exhibit.Coder(
        "shape",
        containerElmt,
        uiContext
    ));
    this.addSettingSpecs(Exhibit.ShapeCoder._settingSpecs);
    
    this._map = {};
    this._mixedCase = {
        "label": Exhibit._("%coders.mixedCaseLabel"),
        "shape": null
    };
    this._missingCase = {
        "label": Exhibit._("%coders.missingCaseLabel"),
        "shape": null
    };
    this._othersCase = {
        "label": Exhibit._("%coders.othersCaseLabel"),
        "shape": null
    };

    this.register();
};

/**
 * @constant
 */
Exhibit.ShapeCoder._settingSpecs = {
};

/**
 * @constant
 */
Exhibit.ShapeCoder._shapeTable = {
    // add built-in shapes?
};

/**
 * @param {Object} configuration
 * @param {Exhibit.UIContext} uiContext
 * @returns {Exhibit.ShapeCoder}
 */
Exhibit.ShapeCoder.create = function(configuration, uiContext) {
    var coder, div;
    div = $("<div>")
        .hide()
        .appendTo("body");
    coder = new Exhibit.ShapeCoder(
        div,
        Exhibit.UIContext.create(configuration, uiContext)
    );
    
    Exhibit.ShapeCoder._configure(coder, configuration);
    return coder;
};

/**
 * @param {Element} configElmt
 * @param {Exhibit.UIContext} uiContext
 * @returns {Exhibit.ShapeCoder}
 */
Exhibit.ShapeCoder.createFromDOM = function(configElmt, uiContext) {
    var configuration, coder;

    $(configElmt).hide();
    
    configuration = Exhibit.getConfigurationFromDOM(configElmt);
    coder = new Exhibit.ShapeCoder(
        configElmt,
        Exhibit.UIContext.create(configuration, uiContext)
    );
    
    Exhibit.SettingsUtilities.collectSettingsFromDOM(
        configElmt,
        coder.getSettingSpecs(),
        coder._settings
    );
    
    try {
        $(configElmt).children().each(function(index, elmt) {
            coder._addEntry(
                Exhibit.getAttribute(this,  "case"),
                $(this).text().trim(),
                Exhibit.getAttribute(this, "shape")
            );
        });
    } catch (e) {
        Exhibit.Debug.exception(e, Exhibit._("%coders.error.configuration", "ShapeCoder"));
    }
    
    Exhibit.ShapeCoder._configure(coder, configuration);
    return coder;
};

/**
 * @param {Exhibit.ShapeCoder} coder
 * @param {Object} configuration
 */ 
Exhibit.ShapeCoder._configure = function(coder, configuration) {
    var entries, i;

    Exhibit.SettingsUtilities.collectSettings(
        configuration,
        coder.getSettingSpecs(),
        coder._settings
    );
    
    if (typeof configuration.entries !== "undefined") {
        entries = configuration.entries;
        for (i = 0; i < entries.length; i++) {
            coder._addEntry(entries[i].kase, entries[i].key, entries[i].shape);
        }
    }
};

/**
 *
 */
Exhibit.ShapeCoder.prototype.dispose = function() {
    this._map = null;
    this._dispose();
};

/**
 * @param {String} kase
 * @param {String} key
 * @param {String} shape
 */
Exhibit.ShapeCoder.prototype._addEntry = function(kase, key, shape) {
    var entry;

    // used if there are built-in shapes
    if (typeof Exhibit.ShapeCoder._shapeTable[shape] !== "undefined") {
        shape = Exhibit.ShapeCoder._shapeTable[shape];
    }
    
    entry = null;
    switch (kase) {
    case "others":  entry = this._othersCase; break;
    case "mixed":   entry = this._mixedCase; break;
    case "missing": entry = this._missingCase; break;
    }
    if (entry !== null) {
        entry.label = key;
        entry.shape = shape;
    } else {
        this._map[key] = { shape: shape };
    }
};

/**
 * @param {String} key
 * @param {Object} flags
 * @returns {String}
 */
Exhibit.ShapeCoder.prototype.translate = function(key, flags) {
    if (typeof this._map[key] !== "undefined") {
        if (typeof flags !== "undefined" && flags !== null) {
            flags.keys.add(key);
        }
        return this._map[key].shape;
    } else if (typeof key === "undefined" || key === null) {
        if (typeof flags !== "undefined" && flags !== null) {
            flags.missing = true;
        }
        return this._missingCase.shape;
    } else {
        if (typeof flags !== "undefined" && flags !== null) {
            flags.others = true;
        }
        return this._othersCase.shape;
    }
};

/**
 * @param {Exhibit.Set} keys
 * @param {Object} flags
 * @returns {String}
 */
Exhibit.ShapeCoder.prototype.translateSet = function(keys, flags) {
    var shape, self;
    shape = null;
    self = this;
    keys.visit(function(key) {
        var shape2 = self.translate(key, flags);
        if (shape === null) {
            shape = shape2;
        } else if (shape !== shape2) {
            if (typeof flags !== "undefined" && flags !== null) {
                flags.mixed = true;
            }
            shape = self._mixedCase.shape;
            return true;
        }
        return false;
    });
    
    if (shape !== null) {
        return shape;
    } else {
        if (typeof flags !== "undefined" && flags !== null) {
            flags.missing = true;
        }
        return this._missingCase.shape;
    }
};

/**
 * @returns {String}
 */
Exhibit.ShapeCoder.prototype.getOthersLabel = function() {
    return this._othersCase.label;
};

/**
 * @returns {String}
 */
Exhibit.ShapeCoder.prototype.getOthersShape = function() {
    return this._othersCase.shape;
};

/**
 * @returns {String}
 */
Exhibit.ShapeCoder.prototype.getMissingLabel = function() {
    return this._missingCase.label;
};

/**
 * @returns {String}
 */
Exhibit.ShapeCoder.prototype.getMissingShape = function() {
    return this._missingCase.shape;
};

/**
 * @returns {String}
 */
Exhibit.ShapeCoder.prototype.getMixedLabel = function() {
    return this._mixedCase.label;
};

/**
 * @returns {String}
 */
Exhibit.ShapeCoder.prototype.getMixedShape = function() {
    return this._mixedCase.shape;
};
