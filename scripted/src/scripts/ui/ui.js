/**
 * @fileOverview
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "lib/jquery",
    "util/localizer",
    "exhibit",
    "util/debug",
    "util/settings",
    "ui/ui-context",
    "ui/lens",
    "ui/coordinator",
    "ui/control-panel",
    "ui/views/view-panel",
    "ui/widgets/logo",
    "ui/views/tile-view",
    "ui/facets/list-facet",
    "ui/coders/color-coder",
    "lib/jquery.simile.dom",
    "lib/jquery.simile.bubble"
], function($, _, Exhibit, Debug, SettingUtilities, UIContext, Lens, Coordinator, ControlPanel, ViewPanel, Logo, TileView, ListFacet, ColorCoder) {
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

    if (typeof configuration["role"] !== "undefined") {
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
    var viewClass = typeof configuration["viewClass"] !== "undefined" ?
        configuration.viewClass :
        TileView;
    if (typeof viewClass === "string") {
        viewClass = UI.viewClassNameToViewClass(viewClass);
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
    var viewClass = UI.viewClassNameToViewClass(Exhibit.getAttribute(elmt, "viewClass"));
    return viewClass.createFromDOM(elmt, container, uiContext);
};

/**
 * @param {String} name
 * @returns {Object}
 */
UI.viewClassNameToViewClass = function(name) {
    if (typeof name !== "undefined" && name !== null && name.length > 0) {
        try {
            return UI._stringToObject(name, "View");
        } catch (e) {
            Debug.warn(_("%general.error.unknownViewClass", name));
        }
    }
    return TileView;
};

/**
 * @param {Object} configuration
 * @param {Element} elmt
 * @param {Exhibit.UIContext} uiContext
 * @returns {Object}
 */
UI.createFacet = function(configuration, elmt, uiContext) {
    var facetClass = typeof configuration["facetClass"] !== "undefined" ?
        configuration.facetClass :
        ListFacet;
    if (typeof facetClass === "string") {
        facetClass = UI.facetClassNameToFacetClass(facetClass);
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
    var facetClass = UI.facetClassNameToFacetClass(Exhibit.getAttribute(elmt, "facetClass"));
    return facetClass.createFromDOM(elmt, container, uiContext);
};

/**
 * @param {String} name
 * @returns {Object}
 */
UI.facetClassNameToFacetClass = function(name) {
    if (typeof name !== "undefined" && name !== null && name.length > 0) {
        try {
            return UI._stringToObject(name, "Facet");
        } catch (e) {
            Debug.warn(_("%general.error.unknownFacetClass", name));
        }
    }
    return ListFacet;
};

/**
 * @param {Object} configuration
 * @param {Exhibit.UIContext} uiContext
 * @returns {Object}
 */
UI.createCoder = function(configuration, uiContext) {
    var coderClass = typeof configuration["coderClass"] !== "undefined" ?
        configuration.coderClass :
        ColorCoder;
    if (typeof coderClass === "string") {
        coderClass = UI.coderClassNameToCoderClass(coderClass);
    }
    return coderClass.create(configuration, uiContext);
};

/**
 * @param {Element} elmt
 * @param {Exhibit.UIContext} uiContext
 * @returns {Object}
 */
UI.createCoderFromDOM = function(elmt, uiContext) {
    var coderClass = UI.coderClassNameToCoderClass(Exhibit.getAttribute(elmt, "coderClass"));
    return coderClass.createFromDOM(elmt, uiContext);
};

/**
 * @param {String} name
 * @returns {Object}
 */
UI.coderClassNameToCoderClass = function(name) {
    if (typeof name !== "undefined" && name !== null && name.length > 0) {
        try {
            return UI._stringToObject(name, "Coder");
        } catch (e) {
            Debug.warn(_("%general.error.unknownCoderClass", name));
        }
    }
    return ColorCoder;
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

/**
 * @private
 * @param {String} name
 * @param {String} suffix
 * @returns {Object}
 * @throws {Error}
 */
UI._stringToObject = function(name, suffix) {
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
    target = (target) ? target : "_blank";
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

/**
 * @static
 * @param {Element} element
 * @returns {Object}
 */
UI.createPopupMenuDom = function(element) {
    var div, dom;

    div = $("<div>").
        addClass("exhibit-menu-popup").
        addClass("exhibit-ui-protection");
    
    /**
     * @ignore
     */
    dom = {
        elmt: div,
        open: function(evt) {
            var self, docWidth, docHeight, coords;
            self = this;
            // @@@ exhibit-dialog needs to be set
            if (typeof evt !== "undefined") {
                if ($(evt.target).parent(".exhibit-dialog").length > 0) {
                    dom._dialogParent = $(evt.target).parent(".exhibit-dialog:eq(0)").get(0);
                }
                evt.preventDefault();
            }
                
            docWidth = $(document.body).width();
            docHeight = $(document.body).height();
        
            coords = $(element).offset();
            this.elmt.css("top", (coords.top + element.scrollHeight) + "px");
            this.elmt.css("right", (docWidth - (coords.left + element.scrollWidth)) + "px");

            $(document.body).append(this.elmt);
            this.elmt.trigger("modelessOpened.exhibit");
            evt.stopPropagation();
        },
        appendMenuItem: function(label, icon, onClick) {
            var self, a, container;
            self = this;
            a = $("<a>").
                attr("href", "#").
                addClass("exhibit-menu-item").
                bind("click", function(evt) {
                    onClick(evt); // elmt, evt, target:being passed a jqevent
                    dom.close();
                    evt.preventDefault();
                    evt.stopPropagation();
                });

            container = $("<div>");
            a.append(container);
    
            container.append($.simileBubble("createTranslucentImage",
                (typeof icon !== "undefined" && icon !== null) ?
                    icon :
                    (Exhibit.urlPrefix + "images/blank-16x16.png")));
                
            container.append(document.createTextNode(label));
            
            this.elmt.append(a);
        },
        appendSeparator: function() {
            this.elmt.append("<hr/>");
        }
    };
    UI.setupDialog(dom, false);
    return dom;
};

/**
 * @static
 * @param {String} itemID
 * @param {Exhibit} exhibit
 * @param {Object} configuration
 * @returns {Object}
 */
UI.createFocusDialogBox = function(itemID, exhibit, configuration) {
    var template, dom;
    template = {
        tag:        "div",
        className:  "exhibit-focusDialog exhibit-ui-protection",
        children: [
            {   tag:        "div",
                className:  "exhibit-focusDialog-viewContainer",
                field:      "viewContainer"
            },
            {   tag:        "div",
                className:  "exhibit-focusDialog-controls",
                children: [
                    {   tag:        "button",
                        field:      "closeButton",
                        children:   [ _("%general.focusDialogBoxCloseButtonLabel") ]
                    }
                ]
            }
        ]
    };

    /**
     * @ignore
     */
    dom = $.simileDOM("template", template);

    UI.setupDialog(dom, true);

    /**
     * @ignore Can't get JSDocTK to ignore this one method for some reason.
     */
    dom.open = function() {
        var lens;
        $(document).trigger("modalSuperseded.exhibit");
        lens = new Lens(itemID, dom.viewContainer, exhibit, configuration);
        
        $(dom.elmt).css("top", (document.body.scrollTop + 100) + "px");
        $(document.body).append(dom.elmt);
        
        $(dom.closeButton).bind("click", function(evt) {
            dom.close();
            evt.preventDefault();
            evt.stopPropagation();
        });
        $(dom.elmt).trigger("modalOpened.exhibit");
    };
    
    return dom;
};

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Element} elmt
 * @returns {Boolean}
 */
UI._clickInElement = function(x, y, elmt) {
    var offset = $(elmt).offset();
    var dims = { "w": $(elmt).outerWidth(),
                 "h": $(elmt).outerHeight() };
    return (x < offset.left &&
            x > offset.left + dims.w &&
            y < offset.top &&
            y > offset.top + dims.h);
};

/**
 * Add the close property to dom, a function taking a jQuery event that
 * simulates the UI for closing a dialog.  THe dialog can either be modal
 * (takes over the window focus) or modeless (will be closed if something
 * other than it is focused).
 *
 * This scheme assumes a modeless dialog will never produce a modal dialog
 * without also closing down.
 * 
 * @param {Object} dom An object with pointers into the DOM.
 * @param {Boolean} modal Whether the dialog is modal or not.
 * @param {Element} [dialogParent] The element containing the parent dialog.
 */
UI.setupDialog = function(dom, modal, dialogParent) {
    var clickHandler, cancelHandler, cancelAllHandler, createdHandler, i, trap;

    if (typeof parentDialog !== "undefined" && parentDialog !== null) {
        dom._dialogParent = dialogParent;
    }

    if (!modal) {
        dom._dialogDescendants = [];
        
        clickHandler = function(evt) {
            if (!UI._clickInElement(evt.pageX, evt.pageY, dom.elmt)) {
                trap = false;
                for (i = 0; i < dom._dialogDescendants; i++) {
                    trap = trap || UI._clickInElement(evt.pageX, evt.pageY, dom._dialogDescendants[i]);
                    if (trap) {
                        break;
                    }
                }
                if (!trap) {
                    dom.close(evt);
                }
            }
        };

        cancelAllHandler = function(evt) {
            dom.close(evt);
        };

        cancelHandler = function(evt) {
            dom.close(evt);
        };

        createdHandler = function(evt) {
            var descendant = evt.target;
            dom._dialogDescendants.push(descendant);
            $(descendant).bind("cancelModeless.exhibit", function(evt) {
                dom._dialogDescendants.splice(dom._dialogDescendants.indexOf(descendant), 1);
                $(descendant).unbind(evt);
            });
        };

        dom.close = function(evt) {
            if (typeof evt !== "undefined") {
                if (evt.type !== "cancelAllModeless") {
                    $(dom.elmt).trigger("cancelModeless.exhibit");
                }
            } else {
                $(dom.elmt).trigger("cancelModeless.exhibit");
            }
            $(document.body).unbind("click", clickHandler);
            $(dom._dialogParent).unbind("cancelModeless.exhibit", cancelHandler);
            $(document).unbind("cancelAllModeless.exhibit", cancelAllHandler);
            $(dom.elmt).trigger("closed.exhibit");
            $(dom.elmt).remove();
        };

        $(dom.elmt).bind("modelessOpened.exhibit", createdHandler);
        $(dom.elmt).one("modelessOpened.exhibit", function(evt) {
            $(document.body).bind("click", clickHandler);
            $(dom._dialogParent).bind("cancelModeless.exhibit", cancelHandler);
            $(document).bind("cancellAllModeless.exhibit", cancelAllHandler);
        });
    } else {
        dom._superseded = 0;

        clickHandler = function(evt) {
            if (dom._superseded === 0 &&
                !UI._clickInElement(evt.pageX, evt.pageY, dom.elmt)) {
                evt.preventDefault();
                evt.stopImmediatePropagation();
            }
        };

        closedHandler = function(evt) {
            dom._superseded--;
        };
        
        supersededHandler = function(evt) {
            dom._superseded++;
            // Will be unbound when element issuing this signal removes
            // itself.
            $(evt.target).bind("cancelModal.exhibit", closedHandler);
        };

        // Some UI element or keystroke should bind dom.close now that
        // it's been setup.
        dom.close = function(evt) {
            $(dom.elmt).trigger("cancelModal.exhibit");
            $(document).trigger("cancelAllModeless.exhibit");
            $(dom.elmt).remove();
            $(document.body).unbind("click", clickHandler);
            $(document).unbind("modalSuperseded.exhibit", supersededHandler);
        };

        $(dom.elmt).one("modalOpened.exhibit", function() {
            $(document.body).bind("click", clickHandler);
            $(document).bind("modalSuperseded.exhibit", supersededHandler);
        });
    }
};

    // end define
    return UI;
});
