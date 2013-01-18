define([
    "lib/jquery",
    "exhibit",
    "util/util",
    "util/localizer",
    "util/debug",
    "util/persistence",
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
            window.open(UIUtilites.validator, target);
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
    scrollTop = typeof document.body["scrollTop"] !== "undefined" ?
        document.body.scrollTop :
        document.body.parentNode.scrollTop;
    height = typeof window["innerHeight"] !== "undefined" ?
        window.innerHeight :
        (typeof document.body["clientHeight"] !== "undefined" ?
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

    containerDiv.addClass("exhibit-busyIndicator");
    contentDiv.addClass("exhibit-busyIndicator-content");
    
    img = $("<img />").attr("src", urlPrefix + "progress-running.gif");
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

    return UIUtilities;
});
