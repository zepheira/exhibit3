/** 
 * @fileOverview
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "lib/jquery",
    "../exhibit-core",
    "../util/localizer",
    "../util/debug",
    "../util/settings",
    "./lens-registry",
    "./format-parser",
    "./formatter"
], function($, Exhibit, _, Debug, SettingsUtilities, LensRegistry, FormatParser, Formatter) {
/**
 * @class
 * @constructor
 */
var UIContext = function() {
    this._parent = null;
    
    this._exhibit = null;
    this._collection = null;
    this._lensRegistry = new LensRegistry();
    this._settings = {};
    
    this._formatters = {};
    this._listFormatter = null;
    
    this._editModeRegistry = {};
    
    this._popupFunc = null;
};

/**
 * @constant
 */
UIContext._settingSpecs = {
    "bubbleWidth": { "type": "int", "defaultValue": 400 },
    "bubbleHeight": { "type": "int", "defaultValue": 300 }
};

/**
 * @param {Object} configuration
 * @param {Exhibit} exhibit
 * @returns {Exhibit.UIContext}
 */
UIContext.createRootContext = function(configuration, exhibit) {
    var context, settings, n, formats;

    context = new UIContext();
    context._exhibit = exhibit;
    
    settings = UIContext.initialSettings;

    for (n in settings) {
        if (settings.hasOwnProperty(n)) {
            context._settings[n] = settings[n];
        }
    }
    
    formats = Exhibit.getAttribute(document.body, "formats");
    if (typeof formats !== "undefined" && formats !== null && formats.length > 0) {
        FormatParser.parseSeveral(context, formats, 0, {});
    }
    
    SettingsUtilities.collectSettingsFromDOM(
        document.body, UIContext._settingSpecs, context._settings);
        
    UIContext._configure(context, configuration);
    
    return context;
};

/**
 * @param {Object} configuration
 * @param {Exhibit.UIContext} parentUIContext
 * @param {Boolean} ignoreLenses
 * @returns {Exhibit.UIContext}
 */
UIContext.create = function(configuration, parentUIContext, ignoreLenses) {
    var context = UIContext._createWithParent(parentUIContext);
    UIContext._configure(context, configuration, ignoreLenses);
    
    return context;
};

/**
 * @param {Element} configElmt
 * @param {Exhibit.UIContext} parentUIContext
 * @param {Boolean} ignoreLenses
 * @returns {Exhibit.UIContext}
 */
UIContext.createFromDOM = function(configElmt, parentUIContext, ignoreLenses) {
    var context, id, formats;

    context = UIContext._createWithParent(parentUIContext);
    
    if (!(ignoreLenses)) {
        UIContext.registerLensesFromDOM(configElmt, context.getLensRegistry());
    }
    
    id = Exhibit.getAttribute(configElmt, "collectionID");
    if (typeof id !== "undefined" && id !== null && id.length > 0) {
        context._collection = context._exhibit.getCollection(id);
    }
    
    formats = Exhibit.getAttribute(configElmt, "formats");
    if (typeof formats !== "undefined" && formats !== null && formats.length > 0) {
        FormatParser.parseSeveral(context, formats, 0, {});
    }
    
    SettingsUtilities.collectSettingsFromDOM(
        configElmt, UIContext._settingSpecs, context._settings);
        
    UIContext._configure(context, Exhibit.getConfigurationFromDOM(configElmt), ignoreLenses);
    
    return context;
};

/**
 *
 */
UIContext.prototype.dispose = function() {
};

/**
 * @returns {Exhibit.UIContext}
 */
UIContext.prototype.getParentUIContext = function() {
    return this._parent;
};

/**
 * @returns {Exhibit}
 */
UIContext.prototype.getMain = function() {
    return this._exhibit;
};

/**
 * @returns {Exhibit.Database}
 */
UIContext.prototype.getDatabase = function() {
    return this.getMain().getDatabase();
};

/**
 * @returns {Exhibit.Collection}
 */
UIContext.prototype.getCollection = function() {
    if (this._collection === null) {
        if (this._parent !== null) {
            this._collection = this._parent.getCollection();
        } else {
            this._collection = this._exhibit.getDefaultCollection();
        }
    }
    return this._collection;
};

/**
 * @returns {Exhibit.LensRegistry}
 */
UIContext.prototype.getLensRegistry = function() {
    return this._lensRegistry;
};

/**
 * @param {String} name
 * @returns {String|Number|Boolean|Object}
 */
UIContext.prototype.getSetting = function(name) {
    return typeof this._settings[name] !== "undefined" ? 
        this._settings[name] : 
        (this._parent !== null ? this._parent.getSetting(name) : undefined);
};

/**
 * @param {String} name
 * @param {Boolean} defaultValue
 * @returns {Boolean}
 */
UIContext.prototype.getBooleanSetting = function(name, defaultValue) {
    var v = this.getSetting(name);
    return v === undefined || v === null ? defaultValue : v;
};

/**
 * @param {String} name 
 * @param {String|Number|Boolean|Object} value
 */
UIContext.prototype.putSetting = function(name, value) {
    this._settings[name] = value;
};

/**
 * @param {String|Number|Boolean|Object} value
 * @param {String} valueType
 * @param {Function} appender
 */
UIContext.prototype.format = function(value, valueType, appender) {
    var f;
    if (typeof this._formatters[valueType] !== "undefined") {
        f = this._formatters[valueType];
    } else {
        f = this._formatters[valueType] = 
            new Formatter._constructors[valueType](this);
    }
    f.format(value, appender);
};

/**
 * @param {Exhibit.Set} iterator
 * @param {Number} count
 * @param {String} valueType
 * @param {Function} appender
 */
UIContext.prototype.formatList = function(iterator, count, valueType, appender) {
    if (this._listFormatter === null) {
        this._listFormatter = new Formatter._ListFormatter(this);
    }
    this._listFormatter.formatList(iterator, count, valueType, appender);
};

/**
 * @param {String} itemID
 * @param {Boolean} val
 */
UIContext.prototype.setEditMode = function(itemID, val) {
    if (val) {
        this._editModeRegistry[itemID] = true;
    } else {
        this._editModeRegistry[itemID] = false;
    }
};

/**
 * @param {String} itemID
 * @returns {Boolean}
 */
UIContext.prototype.isBeingEdited = function(itemID) {
    return !!this._editModeRegistry[itemID];
};

/**
 * @static
 * @private
 * @returns {Exhibit.UIContext}
 */
UIContext.prototype.asParent = function() {
    var context = new UIContext();
    
    context._parent = this;
    context._exhibit = this._exhibit;
    context._lensRegistry = new LensRegistry(this.getLensRegistry());
    context._editModeRegistry = this._editModeRegistry;
    
    return context;
};

/**
 * @param {Object} configuration
 * @param {Exhibit.UIContext} parentUIContext
 * @param {Boolean} ignoreLenses
 * @returns {Exhibit.UIContext}
 */
UIContext.prototype.asParentFromConfig = function(configuration, ignoreLenses) {
    var context = this.asParent();
    UIContext._configure(context, configuration, ignoreLenses);
    
    return context;
};

/**
 * @param {Element} configElmt
 * @param {Exhibit.UIContext} parentUIContext
 * @param {Boolean} ignoreLenses
 * @returns {Exhibit.UIContext}
 */
UIContext.prototype.asParentFromDOM = function(configElmt, ignoreLenses) {
    var context, id, formats;

    context = this.asParent();
    
    if (!(ignoreLenses)) {
        UIContext.registerLensesFromDOM(configElmt, context.getLensRegistry());
    }
    
    id = Exhibit.getAttribute(configElmt, "collectionID");
    if (typeof id !== "undefined" && id !== null && id.length > 0) {
        context._collection = context._exhibit.getCollection(id);
    }
    
    formats = Exhibit.getAttribute(configElmt, "formats");
    if (typeof formats !== "undefined" && formats !== null && formats.length > 0) {
        FormatParser.parseSeveral(context, formats, 0, {});
    }
    
    SettingsUtilities.collectSettingsFromDOM(
        configElmt, UIContext._settingSpecs, context._settings);
        
    UIContext._configure(context, Exhibit.getConfigurationFromDOM(configElmt), ignoreLenses);
    
    return context;
};

/*----------------------------------------------------------------------
 *  Internal implementation
 *----------------------------------------------------------------------
 */

/**
 * @static
 * @private
 * @param {Exhibit.UIContext} parent
 * @returns {Exhibit.UIContext}
 */
UIContext._createWithParent = function(parent) {
    var context = new UIContext();
    
    context._parent = parent;
    context._exhibit = parent._exhibit;
    context._lensRegistry = new LensRegistry(parent.getLensRegistry());
    context._editModeRegistry = parent._editModeRegistry;
    
    return context;
};

/**
 * @private
 * @static
 * @param {Exhbit.UIContext} context
 * @param {Object} configuration
 * @param {Boolean} ignoreLenses
 */
UIContext._configure = function(context, configuration, ignoreLenses) {
    UIContext.registerLenses(configuration, context.getLensRegistry());
    
    if (typeof configuration.collectionID !== "undefined") {
        context._collection = context._exhibit.getCollection(configuration.collectionID);
    }
    
    if (typeof configuration.formats !== "undefined") {
        FormatParser.parseSeveral(context, configuration.formats, 0, {});
    }
    
    if (!(ignoreLenses)) {
        SettingsUtilities.collectSettings(
            configuration, UIContext._settingSpecs, context._settings);
    }
};

/*----------------------------------------------------------------------
 *  Lens utility functions for internal use
 *----------------------------------------------------------------------
 */

/**
 * @static
 * @param {Object} configuration
 * @param {Exhibit.LensRegistry} lensRegistry
 */
UIContext.registerLens = function(configuration, lensRegistry) {
    var template, i;
    template = configuration.templateFile;
    if (typeof template !== "undefined" && template !== null) {
        if (typeof configuration.itemTypes !== "undefined") {
            for (i = 0; i < configuration.itemTypes.length; i++) {
                lensRegistry.registerLensForType(template, configuration.itemTypes[i]);
            }
        } else {
            lensRegistry.registerDefaultLens(template);
        }
    }
};

/**
 * @param {Element} elmt
 * @param {Exhibit.LensRegistry} lensRegistry
 */
UIContext.registerLensFromDOM = function(elmt, lensRegistry) {
    var itemTypes, template, url, id, elmt2, i;

    $(elmt).hide();
    
    itemTypes = Exhibit.getAttribute(elmt, "itemTypes", ",");
    template = null;
    
    url = Exhibit.getAttribute(elmt, "templateFile");
    if (typeof url !== "undefined" && url !== null && url.length > 0) {
        template = url;
    } else {
        id = Exhibit.getAttribute(elmt, "template");
        elmt2 = id && document.getElementById(id);
        if (typeof elmt2 !== "undefined" && elmt2 !== null) {
            template = elmt2;
        } else {
            template = elmt;
        }
    }
    
    if (typeof template !== "undefined" && template !== null) {
        if (typeof itemTypes === "undefined" || itemTypes === null || itemTypes.length === 0 || (itemTypes.length === 1 && itemTypes[0] === "")) {
            lensRegistry.registerDefaultLens(template);
        } else {
            for (i = 0; i < itemTypes.length; i++) {
                lensRegistry.registerLensForType(template, itemTypes[i]);
            }
        }
    }
};

/**
 * @param {Object} configuration
 * @param {Exhibit.LensRegistry} lensRegistry
 */
UIContext.registerLenses = function(configuration, lensRegistry) {
    var i, lensSelector;
    if (typeof configuration.lenses !== "undefined") {
        for (i = 0; i < configuration.lenses.length; i++) {
            UIContext.registerLens(configuration.lenses[i], lensRegistry);
        }
    }
    if (typeof configuration.lensSelector !== "undefined") {
        lensSelector = configuration.lensSelector;
        if (typeof lensSelector === "function") {
            lensRegistry.addLensSelector(lensSelector);
        } else {
            Debug.log(_("%general.error.lensSelectorNotFunction"));
        }
    }
};

/**
 * @param {Element} parentNode
 * @param {Exhibit.LensRegistry} lensRegistry
 */
UIContext.registerLensesFromDOM = function(parentNode, lensRegistry) {
    var node, role, lensSelectorString, lensSelector;

    node = $(parentNode).children().get(0);
    while (typeof node !== "undefined" && node !== null) {
        if (node.nodeType === 1) {
            role = Exhibit.getRoleAttribute(node);
            if (role === "lens" || role === "edit-lens") {
                UIContext.registerLensFromDOM(node, lensRegistry);
            }
        }
        node = node.nextSibling;
    }
    
    lensSelectorString = Exhibit.getAttribute(parentNode, "lensSelector");
    if (typeof lensSelectorString !== "undefined" && lensSelectorString !== null && lensSelectorString.length > 0) {
        try {
            lensSelector = eval(lensSelectorString);
            if (typeof lensSelector === "function") {
                lensRegistry.addLensSelector(lensSelector);
            } else {
                Debug.log(_("%general.error.lensSelectorExpressionNotFunction", lensSelectorString));
            }
        } catch (e) {
            Debug.exception(e, _("%general.error.badLensSelectorExpression", lensSelectorString));
        }
    }
};

/**
 * @param {Object} configuration
 * @param {Exhibit.LensRegistry} parentLensRegistry
 * @returns {Exhibit.LensRegistry}
 */
UIContext.createLensRegistry = function(configuration, parentLensRegistry) {
    var lensRegistry = new LensRegistry(parentLensRegistry);
    UIContext.registerLenses(configuration, lensRegistry);
    
    return lensRegistry;
};

/**
 * @param {Element} parentNode
 * @param {Object} configuration
 * @param {Exhibit.LensRegistry} parentLensRegistry
 * @returns {Exhibit.LensRegistry}
 */
UIContext.createLensRegistryFromDOM = function(parentNode, configuration, parentLensRegistry) {
    var lensRegistry = new LensRegistry(parentLensRegistry);
    UIContext.registerLensesFromDOM(parentNode, lensRegistry);
    UIContext.registerLenses(configuration, lensRegistry);
    
    return lensRegistry;
};

    // end define
    return UIContext;
});
