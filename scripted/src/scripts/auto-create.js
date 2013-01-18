define([
    "lib/jquery",
    "exhibit",
    "registry",
    "util/localizer",
    "util/debug",
    "util/database",
    "bc/bc",
    "data/collection",
    "ui/ui",
    "ui/ui-context",
    "ui/control-panel"
], function($, Exhibit, Registry, _, Debug, DatabaseUtilities, Backwards, Collection, UI, UIContext, ControlPanel) {
    /**
     * Code to automatically create the database, load the data links in
     * <head>, and then to create an exhibit if there's no Exhibit ondataload 
     * attribute on the body element.
     *
     * You can avoid running this code by adding the URL parameter
     * autoCreate=false when you include exhibit-api.js.
     * @public
     * @see Exhibit.Database._LocalImpl.prototype._loadLinks
     */
    Exhibit.autoCreate = function() {
        var s, f, fDone;

        fDone = function() {
            window.exhibit = Exhibit.create();
            window.exhibit.configureFromDOM();
            // The semantics of dataload indicate it should wholly replace the
            // Exhibit initialization steps above; but if autoCreate is true,
            // perhaps it should run in parallel with them or be fired after
            // them.  It's unclear how widespread this is and how useful one
            // alternative is over the other.  If in the future the below block
            // is eliminated as it should be, wholesale replacement of this fDone
            // would currently not be possible.
        };
        
        try {
            // Using functions embedded in elements is bad practice and support for
            // it may disappear in the future.  Convert instances of this usage to
            // attach to the dataload.exhibit event triggered on your own, as this
            // now does (see line below this try-catch block).
            s = Exhibit.getAttribute(document.body, "ondataload");
            if (s !== null && typeof s === "string" && s.length > 0) {
                // eval is evil, which is why this is going to disappear.
                f = eval(s);
                if (typeof f === "function") {
                    fDone = f;
                }
            }
        } catch (e) {
            Debug.warn(_("%general.error.dataloadExecution"));
            Debug.warn(e);
        }
        
        $(document.body).one("dataload.exhibit", fDone);

        window.database = DatabaseUtilities.create();
        window.database.loadLinks();
    };


    /**
     * Check for instances of ex:role and throw into backwards compatibility
     * mode if any are found.  Authors are responsible for converting or using
     * the HTML5 attributes correctly; backwards compatibility is only applicable
     * when used with unconverted Exhibits.
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

/**
 * @public
 * @class
 * @constructor
 * @param {Exhibit.Database} database
 */
Exhibit._Impl = function(database) {
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
Exhibit._Impl.prototype.dispose = function() {
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
Exhibit._Impl.prototype.getDatabase = function() {
    return this._database;
};

/**
 * @returns {Exhibit.Registry}
 */
Exhibit._Impl.prototype.getRegistry = function() {
    return this._registry;
};

/**
 * @returns {Exhibit.UIContext}
 */
Exhibit._Impl.prototype.getUIContext = function() {
    return this._uiContext;
};

/**
 * @param {String} id
 * @returns {Exhibit.Collection}
 */
Exhibit._Impl.prototype.getCollection = function(id) {
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
Exhibit._Impl.prototype.getDefaultCollection = function() {
    return this.getCollection("default");
};

/**
 * @param {String} id
 * @param {Exhibit.Collection} c
 */
Exhibit._Impl.prototype.setCollection = function(id, c) {
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
Exhibit._Impl.prototype.setDefaultCollection = function(c) {
    this.setCollection("default", c);
};

/**
 * @param {String} id
 * @returns {Object}
 */
Exhibit._Impl.prototype.getComponent = function(id) {
    return this.getRegistry().getID(id);
};

/**
 * @param {Object} configuration
 */
Exhibit._Impl.prototype.configure = function(configuration) {
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
Exhibit._Impl.prototype.configureFromDOM = function(root) {
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
Exhibit._Impl.prototype._showFocusDialogOnItem = function(itemID) {
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
    UI.setupDialog(dom, true);
    
    itemLens = this._uiContext.getLensRegistry().createLens(itemID, dom.lensContainer, this._uiContext);
    
    $(dom.elmt).css("top", (document.body.scrollTop + 100) + "px");
    $(document.body).append($(dom.elmt));
    $(document).trigger("modalSuperseded.exhibit");

    $(dom.closeButton).bind("click", function(evt) {
        dom.close();
    });
};

/**
 * @static
 * @param {Exhibit.Database} database
 * @returns {Exhibit._Impl}
 */
Exhibit.create = function(database) {
    return new Exhibit._Impl(database);
};

    return Exhibit;
});
