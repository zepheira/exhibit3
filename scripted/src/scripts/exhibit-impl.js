define([
    "lib/jquery",
    "./exhibit-core",
    "./registry",
    "./util/localizer",
    "./util/debug",
    "./util/database",
    "./util/ui",
    "./data/collection",
    "./ui/ui",
    "./ui/ui-context",
    "./ui/control-panel"
], function($, Exhibit, Registry, _, Debug, DatabaseUtilities, UIUtilities, Collection, UI, UIContext, ControlPanel) {
    var ExhibitImpl = {};

/**
 * @public
 * @class
 * @constructor
 * @param {Exhibit.Database} database
 */
ExhibitImpl = function(database) {
    this._database = (database !== null && typeof database !== "undefined") ? 
        database : 
        (typeof window.database !== "undefined" ?
            window.database :
            DatabaseUtilities.create());
            
    this._uiContext = UIContext.createRootContext({}, this);
    this._registry = new Registry();
    $(document).trigger("registerComponents.exhibit", this._registry);
    this._collectionMap = {};
};

/**
 * 
 */
ExhibitImpl.prototype.dispose = function() {
    var id;

    for (id in this._collectionMap) {
        if (this._collectionMap.hasOwnProperty(id)) {
            try {
                this._collectionMap[id].dispose();
            } catch(ex2) {
                Debug.exception(ex2, _("%general.error.disposeCollection"));
            }
        }
    }
    
    this._uiContext.dispose();
    
    this._collectionMap = null;
    this._uiContext = null;
    this._database = null;
    this._registry.dispose();
    this._registry = null;
};

/**
 * @returns {Exhibit.Database}
 */
ExhibitImpl.prototype.getDatabase = function() {
    return this._database;
};

/**
 * @returns {Exhibit.Registry}
 */
ExhibitImpl.prototype.getRegistry = function() {
    return this._registry;
};

/**
 * @returns {Exhibit.UIContext}
 */
ExhibitImpl.prototype.getUIContext = function() {
    return this._uiContext;
};

/**
 * @param {String} id
 * @returns {Exhibit.Collection}
 */
ExhibitImpl.prototype.getCollection = function(id) {
    var collection = this._collectionMap[id];
    if ((typeof collection === "undefined" || collection === null) && id === "default") {
        collection = Collection.createAllItemsCollection(id, this._database);
        this.setDefaultCollection(collection);
    }
    return collection;
};

/**
 * @returns {Exhibit.Collection}
 */
ExhibitImpl.prototype.getDefaultCollection = function() {
    return this.getCollection("default");
};

/**
 * @param {String} id
 * @param {Exhibit.Collection} c
 */
ExhibitImpl.prototype.setCollection = function(id, c) {
    if (typeof this._collectionMap[id] !== "undefined") {
        try {
            this._collectionMap[id].dispose();
        } catch(e) {
            Debug.exception(e);
        }
    }
    this._collectionMap[id] = c;
};

/**
 * @param {Exhibit.Collection} c
 */
ExhibitImpl.prototype.setDefaultCollection = function(c) {
    this.setCollection("default", c);
};

/**
 * @param {String} id
 * @returns {Object}
 */
ExhibitImpl.prototype.getComponent = function(id) {
    return this.getRegistry().getID(id);
};

/**
 * @param {Object} configuration
 */
ExhibitImpl.prototype.configure = function(configuration) {
    var i, config, id, component;
    if (typeof configuration.collections !== "undefined") {
        for (i = 0; i < configuration.collections.length; i++) {
            config = configuration.collections[i];
            id = config.id;
            if (typeof id === "undefined" || id === null || id.length === 0) {
                id = "default";
            }
            this.setCollection(id, Collection.create2(id, config, this._uiContext));
        }
    }
    if (typeof configuration.components !== "undefined") {
        for (i = 0; i < configuration.components.length; i++) {
            config = configuration.components[i];
            component = UI.create(config, config.elmt, this._uiContext);
        }
    }
};

/**
 * Set up this Exhibit's view from its DOM configuration.
 * @param {Node} [root] optional root node, below which configuration gets read
 *                      (defaults to document.body, when none provided)
 */
ExhibitImpl.prototype.configureFromDOM = function(root) {
    var controlPanelElmts, collectionElmts, coderElmts, coordinatorElmts, lensElmts, facetElmts, otherElmts, f, uiContext, i, elmt, id, self, processElmts, panel, exporters, expr, exporter, hash, itemID;

    collectionElmts = [];
    coderElmts = [];
    coordinatorElmts = [];
    lensElmts = [];
    facetElmts = [];
    controlPanelElmts = [];
    otherElmts = [];

    f = function(elmt) {
        var role, node;
        role = Exhibit.getRoleAttribute(elmt);
        if (role.length > 0) {
            switch (role) {
            case "collection":  collectionElmts.push(elmt); break;
            case "coder":       coderElmts.push(elmt); break;
            case "coordinator": coordinatorElmts.push(elmt); break;
            case "lens":
            case "submission-lens":
            case "edit-lens":   lensElmts.push(elmt); break;
            case "facet":       facetElmts.push(elmt); break;
            case "controlPanel": controlPanelElmts.push(elmt); break;
            default: 
                otherElmts.push(elmt);
            }
        } else {
            node = elmt.firstChild;
            while (typeof node !== "undefined" && node !== null) {
                if (node.nodeType === 1) {
                    f(node);
                }
                node = node.nextSibling;
            }
        }
    };
    f(root || document.body);
    
    uiContext = this._uiContext;
    for (i = 0; i < collectionElmts.length; i++) {
        elmt = collectionElmts[i];
        id = elmt.id;
        if (typeof id === "undefined" || id === null || id.length === 0) {
            id = "default";
        }
        this.setCollection(id, Collection.createFromDOM2(id, elmt, uiContext));
    }
    
    self = this;
    processElmts = function(elmts) {
        var i, elmt;
        for (i = 0; i < elmts.length; i++) {
            elmt = elmts[i];
            try {
                UI.createFromDOM(elmt, uiContext);
            } catch (ex1) {
                Debug.exception(ex1);
            }
        }
    };

    processElmts(coordinatorElmts);
    processElmts(coderElmts);
    processElmts(lensElmts);
    processElmts(facetElmts);

    if (controlPanelElmts.length === 0) {
        panel = ControlPanel.createFromDOM(
            $("<div>").prependTo(document.body),
            null,
            uiContext
        );
        panel.setCreatedAsDefault();
    } else {
        processElmts(controlPanelElmts);
    }

    processElmts(otherElmts);
    
    exporters = Exhibit.getAttribute(document.body, "exporters");
    if (typeof exporters !== "undefined" && exporters !== null) {
        exporters = exporters.split(";");
        for (i = 0; i < exporters.length; i++) {
            expr = exporters[i];
            exporter = null;
            
            try {
                exporter = eval(expr);
            } catch (ex2) {}
            
            if (exporter === null) {
                try { exporter = eval(expr + "Exporter"); } catch (ex3) {}
            }
            
            if (exporter === null) {
                try { exporter = eval("Exhibit." + expr + "Exporter"); } catch (ex4) {}
            }
            
            if (typeof exporter === "object") {
                Exhibit.addExporter(exporter);
            }
        }
    }
    
    hash = document.location.hash;
    if (hash.length > 1) {
        itemID = decodeURIComponent(hash.substr(1));
        if (this._database.containsItem(itemID)) {
            this._showFocusDialogOnItem(itemID);
        }
    }
    $(document).trigger("exhibitConfigured.exhibit", this);
};

/**
 * @private
 * @param {String} itemID
 */
ExhibitImpl.prototype._showFocusDialogOnItem = function(itemID) {
    var dom, itemLens;
    dom = $.simileDOM("string",
        "div",
        "<div class='exhibit-focusDialog-viewContainer' id='lensContainer'>" +
        "</div>" +
        "<div class='exhibit-focusDialog-controls'>" +
            "<button id='closeButton'>" + 
                      _("%export.focusDialogBoxCloseButtonLabel") + 
            "</button>" +
        "</div>"
    );
    $(dom.elmt).attr("class", "exhibit-focusDialog exhibit-ui-protection");
    UIUtilities.setupDialog(dom, true);
    
    itemLens = this._uiContext.getLensRegistry().createLens(itemID, dom.lensContainer, this._uiContext);
    
    $(dom.elmt).css("top", (document.body.scrollTop + 100) + "px");
    $(document.body).append($(dom.elmt));
    $(document).trigger("modalSuperseded.exhibit");

    $(dom.closeButton).bind("click", function(evt) {
        dom.close();
    });
};

    return ExhibitImpl;
});
