define([
    "lib/jquery",
    "../exhibit-core",
    "./util",
    "./localizer",
    "./debug",
    "./persistence",
    "lib/jquery.simile.bubble"
], function($, Exhibit, Util, _, Debug, Persistence) {
var UIUtilities = {
    /*----------------------------------------------------------------------
     *  Status Indication and Feedback
     *----------------------------------------------------------------------
     */
    "_busyIndicator": null,
    "_busyIndicatorCount": 0,

    /**
     * Link to JSON validating service.
     */
    "validator": (typeof Exhibit.babelPrefix !== "undefined") ?
        Exhibit.babelPrefix + "validator?url=" :
        Exhibit.validateJSON
};

/**
 * @static
 * @param {String} message
 * @param {String} url
 */
UIUtilities.showJsonFileValidation = function(message, url) {
    var target = "_blank";
    if (typeof Exhibit.babelPrefix !== "undefined" && url.indexOf("file:") === 0) {
        if (window.confirm(_("%general.showJsonValidationFormMessage", message))) {
            window.open(UIUtilities.validator, target);
        }
    } else {
        if (window.confirm(_("%general.showJsonValidationMessage", message))) {
            window.open(UIUtilities.validator + url, target);
        }
    }
};

/**
 * @static
 */
UIUtilities.showBusyIndicator = function() {
    var scrollTop, height, top;

    UIUtilities._busyIndicatorCount++;
    if (UIUtilities._busyIndicatorCount > 1) {
        return;
    }
    
    if (UIUtilities._busyIndicator === null) {
        UIUtilities._busyIndicator = UIUtilities.createBusyIndicator();
    }
    
    // @@@ jQuery simplification?
    scrollTop = typeof document.body.scrollTop !== "undefined" ?
        document.body.scrollTop :
        document.body.parentNode.scrollTop;
    height = typeof window.innerHeight !== "undefined" ?
        window.innerHeight :
        (typeof document.body.clientHeight !== "undefined" ?
            document.body.clientHeight :
            document.body.parentNode.clientHeight);
        
    top = Math.floor(scrollTop + height / 3);
    
    $(UIUtilities._busyIndicator).css("top", top + "px");
    $(document.body).append(UIUtilities._busyIndicator);
};

/**
 * @static
 */
UIUtilities.hideBusyIndicator = function() {
    UIUtilities._busyIndicatorCount--;
    if (UIUtilities._busyIndicatorCount > 0) {
        return;
    }
    
    try {
        UIUtilities._busyIndicator.remove();
    } catch(e) {
        // silent
    }
};

/**
 * @static
 * @returns {Element}
 */
UIUtilities.createBusyIndicator = function() {
    var urlPrefix, containerDiv, topDiv, topRightDiv, middleDiv, middleRightDiv, contentDiv, bottomDiv, bottomRightDiv, img;
    urlPrefix = Exhibit.urlPrefix + "images/";
    containerDiv = $("<div>");
    if ($.simileBubble("pngIsTranslucent")) {
        topDiv = $("<div>").css({
            "height": "33px",
            "padding-left": "44px",
            "background": "url(" + urlPrefix + "message-bubble/message-top-left.png) top left no-repeat"
        });
        containerDiv.append(topDiv);
        
        topRightDiv = $("<div>").css({
            "height": "33px",
            "background": "url(" + urlPrefix + "message-bubble/message-top-right.png) top right no-repeat"
        });
        topDiv.append(topRightDiv);
        
        middleDiv = $("<div>").css({
            "padding-left": "44px",
            "background": "url(" + urlPrefix + "message-bubble/message-left.png) top left repeat-y"
        });
        containerDiv.append(middleDiv);
        
        middleRightDiv = $("<div>").css({
            "padding-right": "44px",
            "background": "url(" + urlPrefix + "message-bubble/message-right.png) top right repeat-y"
        });
        middleDiv.append(middleRightDiv);
        
        contentDiv = $("<div>");
        middleRightDiv.append(contentDiv);
        
        bottomDiv = $("<div>").css({
            "height": "55px",
            "padding-left": "44px",
            "background": "url(" + urlPrefix + "message-bubble/message-bottom-left.png) bottom left no-repeat"
        });
        containerDiv.append(bottomDiv);
        
        bottomRightDiv = $("<div>").css({
            "height": "55px",
            "background": "url(" + urlPrefix + "message-bubble/message-bottom-right.png) bottom right no-repeat"
        });
        bottomDiv.append(bottomRightDiv);
    } else {
        containerDiv.css({
            "border": "2px solid #7777AA",
            "padding": "20px",
            "background": "white",
            "opacity": 0.9
        });
        
        contentDiv = $("<div>");
        containerDiv.append(contentDiv);
    }

    // This is redundant to the stylesheet, but the stylesheet
    // may not be rendered in time for the often briefly displayed
    // loader to catch the proper, intended styling.  The images
    // may not even load in time.  Not much to be done about that
    // in the present implementation.
    containerDiv.css({
        "position": "absolute",
        "top": "30%",
        "left": "35%",
        "right": "35%",
        "zIndex": 1000
    });
    contentDiv.css({
        "font-size": "120%",
        "font-weight": "bold"
    });

    containerDiv.addClass("exhibit-busyIndicator");
    contentDiv.addClass("exhibit-busyIndicator-content");

    img = $("<img />").attr("src", urlPrefix + "progress-running.gif").css({
        "vertical-align": "middle"
    });
    contentDiv.append(img);
    contentDiv.append(document.createTextNode(_("%general.busyIndicatorMessage")));
    
    return containerDiv;
};

/**
 * @static
 * @param {String} label
 * @param {String} valueType
 * @returns {jQuery}
 */
UIUtilities.makeValueSpan = function(label, valueType) {
    var span, url;

    span = $("<span>").addClass("exhibit-value");
    if (valueType === "url") {
        url = label;
        if (Exhibit.params.safe && url.trim().startsWith("javascript:")) {
            span.text(url);
        } else {
            span.html("<a href=\"" + url + "\" target=\"_blank\">" +
                      (label.length > 50 ? 
                       label.substr(0, 20) + " ... " + label.substr(label.length - 20) :
                       label) +
                      "</a>");
        }
    } else {
        if (Exhibit.params.safe) {
            label = Util.encodeAngleBrackets(label);
        }
        span.html(label);
    }
    return span.get(0);
};

/**
 * @static
 * @param {String} itemID
 * @param {String} label
 * @param {Exhibit.UIContext} uiContext
 * @returns {jQuery}
 */
UIUtilities.makeItemSpan = function(itemID, label, uiContext) {
    var database, a, handler;

    database = uiContext.getDatabase();

    if (typeof label === "undefined" || label === null) {
        label = database.getObject(itemID, "label");
        if (typeof label === "undefined" || label === null) {
            label = itemID;
        }
    }
    
    a = $("<a>" + label + "</a>").
        attr("href", Persistence.getItemLink(itemID)).
        addClass("exhibit-item");
        
    handler = function(evt) {
        UIUtilities.showItemInPopup(itemID, this, uiContext);
        evt.preventDefault();
        evt.stopPropagation();
    };

    a.bind("click", handler);

    return a.get(0);
};

/**
 * @static
 * @param {Element} elmt
 */
UIUtilities.calculatePopupPosition = function(elmt) {
    var coords = $(elmt).offset();
    return {
        x: coords.left + Math.round($(elmt).outerWidth() / 2),
        y: coords.top + Math.round($(elmt).outerHeight() / 2)
    };
};

/**
 * @static
 * @param {String} itemID
 * @param {Element} elmt
 * @param {Exhibit.UIContext} uiContext
 * @param {Object} opts
 */
UIUtilities.showItemInPopup = function(itemID, elmt, uiContext, opts) {
    var itemLensDiv, lensOpts;

    $(document).trigger("closeAllModeless.exhibit");

    opts = opts || {};
    opts.coords = opts.coords || UIUtilities.calculatePopupPosition(elmt);
    
    itemLensDiv = $("<div>");

    lensOpts = {
        inPopup: true,
        coords: opts.coords
    };

    if (opts.lensType === "normal") {
        lensOpts.lensTemplate = uiContext.getLensRegistry().getNormalLens(itemID, uiContext);
    } else if (opts.lensType === "edit") {
        lensOpts.lensTemplate = uiContext.getLensRegistry().getEditLens(itemID, uiContext);
    } else if (opts.lensType) {
        Debug.warn(_("%general.error.unknownLensType", opts.lensType));
    }

    uiContext.getLensRegistry().createLens(itemID, itemLensDiv, uiContext, lensOpts);
    
    $.simileBubble("createBubbleForContentAndPoint",
        itemLensDiv, 
        opts.coords.x,
        opts.coords.y, 
        uiContext.getSetting("bubbleWidth")
    );
};

/**
 * @static
 * @param {String} relativeUrl
 * @param {String} verticalAlign
 * @returns {Element}
 */
UIUtilities.createTranslucentImage = function(relativeUrl, verticalAlign) {
    return $.simileBubble("createTranslucentImage", Exhibit.urlPrefix + relativeUrl, verticalAlign);
};

/**
 * @static
 * @param {String} relativeUrl
 * @param {String} verticalAlign
 * @returns {Element}
 */
UIUtilities.createTranslucentImageHTML = function(relativeUrl, verticalAlign) {
    return $.simileBubble("createTranslucentImageHTML", Exhibit.urlPrefix + relativeUrl, verticalAlign);
};

/**
 * @static
 * @param {String} text
 * @param {Function} handler
 * @returns {jQuery}
 */
UIUtilities.makeActionLink = function(text, handler) {
    var a, handler2;

    a = $("<a>" + text + "</a>").
        attr("href", "#").
        addClass("exhibit-action");
    
    handler2 = function(evt) {
        if (typeof $(this).attr("disabled") === "undefined") {
            evt.preventDefault();
            handler(evt);
        }
    };

    $(a).bind("click", handler2);
    
    return a;
};

/**
 * @static
 * @param {Element} a
 * @param {Boolean} enabled
 */
UIUtilities.enableActionLink = function(a, enabled) {
    if (enabled) {
        $(a).removeAttr("disabled");
        $(a).addClass("exhibit-action").removeClass("exhibit-action-disabled");
    } else {
        $(a).attr("disabled", true);
        $(a).removeClass("exhibit-action").addClass("exhibit-action-disabled");
    }
};

/**
 * @static
 * @param {String} itemID
 * @param {Exhibit} exhibit
 * @param {Object} configuration
 * @returns {Object}
 */
UIUtilities.createFocusDialogBox = function(itemID, exhibit, configuration) {
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

    UIUtilities.setupDialog(dom, true);

    /**
     * @ignore Can't get JSDocTK to ignore this one method for some reason.
     */
    dom.open = function() {
        $(document).trigger("modalSuperseded.exhibit");
        
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
 * @static
 * @param {Element} element
 * @returns {Object}
 */
UIUtilities.createPopupMenuDom = function(element) {
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
    UIUtilities.setupDialog(dom, false);
    return dom;
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
UIUtilities.setupDialog = function(dom, modal, dialogParent) {
    var clickHandler, cancelHandler, cancelAllHandler, createdHandler, i, trap, closedHandler, supersededHandler;

    if (typeof dialogParent !== "undefined" && dialogParent !== null) {
        dom._dialogParent = dialogParent;
    }

    if (!modal) {
        dom._dialogDescendants = [];
        
        clickHandler = function(evt) {
            if (!UIUtilities._clickInElement(evt.pageX, evt.pageY, dom.elmt)) {
                trap = false;
                for (i = 0; i < dom._dialogDescendants; i++) {
                    trap = trap || UIUtilities._clickInElement(evt.pageX, evt.pageY, dom._dialogDescendants[i]);
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
                !UIUtilities._clickInElement(evt.pageX, evt.pageY, dom.elmt)) {
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

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Element} elmt
 * @returns {Boolean}
 */
UIUtilities._clickInElement = function(x, y, elmt) {
    var offset, dims;
    offset = $(elmt).offset();
    dims = { "w": $(elmt).outerWidth(),
             "h": $(elmt).outerHeight() };
    return (x < offset.left &&
            x > offset.left + dims.w &&
            y < offset.top &&
            y > offset.top + dims.h);
};

    return UIUtilities;
});
