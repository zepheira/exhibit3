/**
 * @fileOverview
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "lib/jquery",
    "../util/localizer",
    "../exhibit-core",
    "../util/debug",
    "../util/settings",
    "../util/from-string",
    "./ui-context",
    "./lens",
    "./coordinator",
    "./control-panel",
    "./views/view-panel",
    "./widgets/logo",
    "lib/jquery.simile.dom",
    "lib/jquery.simile.bubble"
], function($, _, Exhibit, Debug, SettingsUtilities, FromString, UIContext, Lens, Coordinator, ControlPanel, ViewPanel, Logo) {
/**
 * @namespace
 */
var UI = {
    /**
     * Map of components used for instantiating new UI objects.
     */
    componentMap: {}
};

/**
 * Augment with Exhibit.Registry?
 * @param {String} name
 * @param {String} comp
 */
UI.registerComponent = function(name, comp) {
    var msg = _("%general.error.cannotRegister", name);
    if (typeof UI.componentMap[name] !== "undefined") {
        Debug.warn(_("%general.error.componentNameTaken", msg));
    } else if (typeof comp === "undefined" || comp === null) {
        Debug.warn(_("%general.error.noComponentObject", msg));
    } else if (typeof comp.create === "undefined") {
        Debug.warn(_("%general.error.missingCreateFunction", msg));
    } else if (typeof comp.createFromDOM === "undefined") {
        Debug.warn(_("%general.error.missingDOMCreateFunction", msg));
    } else {
        UI.componentMap[name] = comp;
    }
};

/**
 * @param {Object} configuration
 * @param {Element} elmt
 * @param {Exhibit.UIContext} uiContext
 * @returns {Object}
 */
UI.create = function(configuration, elmt, uiContext) {
    var role, createFunc;

    if (typeof configuration.role !== "undefined") {
        role = configuration.role;
        if (typeof role !== "undefined" && role !== null && role.startsWith("exhibit-")) {
            role = role.substr("exhibit-".length);
        }
        
        if (typeof UI.componentMap[role] !== "undefined") {
            createFunc = UI.componentMap[role].create;
            return createFunc(configuration, elmt, uiContext);
        }
        
        switch (role) {
        case "lens":
        case "edit-lens":
            UIContext.registerLens(configuration, uiContext.getLensRegistry());
            return null;
        case "view":
            return UI.createView(configuration, elmt, uiContext);
        case "facet":
            return UI.createFacet(configuration, elmt, uiContext);
        case "coordinator":
            return UI.createCoordinator(configuration, uiContext);
        case "coder":
            return UI.createCoder(configuration, uiContext);
        case "viewPanel":
            return ViewPanel.create(configuration, elmt, uiContext);
        case "logo":
            return Logo.create(configuration, elmt, uiContext);
        case "controlPanel":
            return ControlPanel.create(configuration, elmt, uiContext);
        case "hiddenContent":
            $(elmt).hide();
            return null;
        }
    }
    return null;
};

/**
 * @param {Element} elmt
 * @param {Exhibit.UIContext} uiContext
 * returns {Object}
 */
UI.createFromDOM = function(elmt, uiContext) {
    var role, createFromDOMFunc;

    role = Exhibit.getRoleAttribute(elmt);
    
    if (typeof UI.componentMap[role] !== "undefined") {
        createFromDOMFunc = UI.componentMap[role].createFromDOM;
        return createFromDOMFunc(elmt, uiContext);
    }
    
    switch (role) {
    case "lens":
    case "edit-lens":
        UIContext.registerLensFromDOM(elmt, uiContext.getLensRegistry());
        return null;
    case "view":
        return UI.createViewFromDOM(elmt, null, uiContext);
    case "facet":
        return UI.createFacetFromDOM(elmt, null, uiContext);
    case "coordinator":
        return UI.createCoordinatorFromDOM(elmt, uiContext);
    case "coder":
        return UI.createCoderFromDOM(elmt, uiContext);
    case "viewPanel":
        return ViewPanel.createFromDOM(elmt, uiContext);
    case "controlPanel":
        return ControlPanel.createFromDOM(elmt, null, uiContext);
    case "logo":
        return Logo.createFromDOM(elmt, uiContext);
    case "hiddenContent":
        $(elmt).hide();
        return null;
    }
    return null;
};

/**
 * @param {Object} constructor
 * @returns {Object}
 */
UI.generateCreationMethods = function(constructor) {
    constructor.create = function(configuration, elmt, uiContext) {
        var newContext, settings;
        newContext = UIContext.create(configuration, uiContext);
        settings = {};
        
        SettingsUtilities.collectSettings(
            configuration, 
            constructor._settingSpecs || {}, 
            settings);
            
        return new constructor(elmt, newContext, settings);
    };
    constructor.createFromDOM = function(elmt, uiContext) {
        var newContext, settings;
        newContext = UIContext.createFromDOM(elmt, uiContext);
        settings = {};
        
        SettingsUtilities.collectSettingsFromDOM(
            elmt, 
            constructor._settingSpecs || {},
            settings);
        
        return new constructor(elmt, newContext, settings);
    };
};

/**
 * @param {Object} configuration
 * @param {Element} elmt
 * @param {Exhibit.UIContext} uiContext
 * @returns {Object}
 */
UI.createView = function(configuration, elmt, uiContext) {
    var viewClass = typeof configuration.viewClass !== "undefined" ?
        configuration.viewClass :
        "TileView";
    if (typeof viewClass === "string") {
        viewClass = FromString.viewClassNameToViewClass(viewClass);
    }
    return viewClass.create(configuration, elmt, uiContext);
};

/**
 * @param {Element} elmt
 * @param {Element} container
 * @param {Exhibit.UIContext} uiContext
 * @returns {Object}
 */
UI.createViewFromDOM = function(elmt, container, uiContext) {
    var viewClass = FromString.viewClassNameToViewClass(Exhibit.getAttribute(elmt, "viewClass"));
    return viewClass.createFromDOM(elmt, container, uiContext);
};

/**
 * @param {Object} configuration
 * @param {Element} elmt
 * @param {Exhibit.UIContext} uiContext
 * @returns {Object}
 */
UI.createFacet = function(configuration, elmt, uiContext) {
    var facetClass = typeof configuration.facetClass !== "undefined" ?
        configuration.facetClass :
        "ListFacet";
    if (typeof facetClass === "string") {
        facetClass = FromString.facetClassNameToFacetClass(facetClass);
    }
    return facetClass.create(configuration, elmt, uiContext);
};

/**
 * @param {Element} elmt
 * @param {Element} container
 * @param {Exhibit.UIContext} uiContext
 * @returns {Object}
 */
UI.createFacetFromDOM = function(elmt, container, uiContext) {
    var facetClass = FromString.facetClassNameToFacetClass(Exhibit.getAttribute(elmt, "facetClass"));
    return facetClass.createFromDOM(elmt, container, uiContext);
};

/**
 * @param {Object} configuration
 * @param {Exhibit.UIContext} uiContext
 * @returns {Object}
 */
UI.createCoder = function(configuration, uiContext) {
    var coderClass = typeof configuration.coderClass !== "undefined" ?
        configuration.coderClass :
        "ColorCoder";
    if (typeof coderClass === "string") {
        coderClass = FromString.coderClassNameToCoderClass(coderClass);
    }
    return coderClass.create(configuration, uiContext);
};

/**
 * @param {Element} elmt
 * @param {Exhibit.UIContext} uiContext
 * @returns {Object}
 */
UI.createCoderFromDOM = function(elmt, uiContext) {
    var coderClass = FromString.coderClassNameToCoderClass(Exhibit.getAttribute(elmt, "coderClass"));
    return coderClass.createFromDOM(elmt, uiContext);
};

/**
 * @param {Object} configuration
 * @param {Exhibit.UIContext} uiContext
 * @returns {Exhibit.Coordinator}
 */
UI.createCoordinator = function(configuration, uiContext) {
    return Coordinator.create(configuration, uiContext);
};

/**
 * @param {Element} elmt
 * @param {Exhibit.UIContext} uiContext
 * @returns {Exhibit.Coordinator}
 */
UI.createCoordinatorFromDOM = function(elmt, uiContext) {
    return Coordinator.createFromDOM(elmt, uiContext);
};

/*----------------------------------------------------------------------
 *  Help and Debugging
 *----------------------------------------------------------------------
 */

/**
 * @static
 * @param {String} message
 * @param {String} url
 * @param {String} target
 */
UI.showHelp = function(message, url, target) {
    target = target || "_blank";
    if (typeof url !== "undefined" && url !== null) {
        if (window.confirm(_("%general.showDocumentationMessage", message))) {
            window.open(url, target);
        }
    } else {
        window.alert(message);
    }
};

/*----------------------------------------------------------------------
 *  Common UI Generation
 *----------------------------------------------------------------------
 */

/**
 * @static
 * @param {Element|jQuery} elmt
 */
UI.protectUI = function(elmt) {
    $(elmt).addClass("exhibit-ui-protection");
};

/**
 * @static
 * @param {String} name
 * @param {Function} handler
 * @param {String} className
 * @returns {Element}
 */
UI.createButton = function(name, handler, className) {
    var button = $("<button>").
        html(name).
        addClass((className || "exhibit-button")).
        addClass("screen");
    button.bind("click", handler);
    return button;
};

    // end define
    return UI;
});
