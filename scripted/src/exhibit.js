define([
    "module",
    "lib/domReady",
    "lib/jquery",
    "exhibit",
    "exhibit-impl",
    "registry",
    "util/util",
    "util/coders",
    "util/debug",
    "util/date-time",
    "util/entities",
    "util/facets",
    "util/set",
    "util/bookmark",
    "util/history-init",
    "util/settings",
    "util/accessors",
    "util/persistence",
    "util/units",
    "util/views",
    "util/localizer",
    "util/database",
    "util/ui",
    "util/from-string",
    "bc/bc",
    "bc/attributes",
    "data/collection",
    "data/database",
    "data/database/local",
    "data/database/type",
    "data/database/property",
    "data/database/range-index",
    "data/importer",
    "data/importers/babel-based",
    "data/importers/jsonp",
    "data/importers/google-spreadsheet",
    "data/importers/json",
    "data/exporter",
    "data/exporters/json",
    "data/exporters/tsv",
    "data/exporters/semantic-wikitext",
    "data/exporters/rdf-xml",
    "data/exporters/bibtex",
    "data/expression-parser",
    "data/expression-scanner",
    "data/expression",
    "data/expression/collection",
    "data/expression/path",
    "data/expression/operator",
    "data/expression/function-call",
    "data/expression/control-call",
    "data/expression/constant",
    "data/expression/controls",
    "data/expression/function-utilities",
    "data/expression/functions",
    "ui/ui",
    "ui/ui-context",
    "ui/lens",
    "ui/lens-registry",
    "ui/control-panel",
    "ui/formatter",
    "ui/format-parser",
    "ui/format-scanner",
    "ui/coordinator",
    "ui/coders/coder",
    "ui/coders/color-coder",
    "ui/coders/default-color-coder",
    "ui/coders/ordered-color-coder",
    "ui/coders/color-gradient-coder",
    "ui/coders/size-coder",
    "ui/coders/size-gradient-coder",
    "ui/coders/icon-coder",
    "ui/facets/facet",
    "ui/facets/list-facet",
    "ui/facets/text-search-facet",
    "ui/facets/alpha-range-facet",
    "ui/facets/numeric-range-facet",
    "ui/facets/hierarchical-facet",
    "ui/facets/cloud-facet",
    "ui/views/view",
    "ui/views/view-panel",
    "ui/views/ordered-view-frame",
    "ui/views/tile-view",
    "ui/views/thumbnail-view",
    "ui/views/tabular-view",
    "ui/widgets/toolbox-widget",
    "ui/widgets/resizable-div-widget",
    "ui/widgets/reset-history-widget",
    "ui/widgets/option-widget",
    "ui/widgets/logo",
    "ui/widgets/legend-widget",
    "ui/widgets/legend-gradient-widget",
    "ui/widgets/bookmark-widget",
    "ui/widgets/collection-summary-widget"
], function(module, domReady, $, Exhibit, Impl, Registry, Util, Coders, Debug, DateTime, Entities, FacetUtilities, Set, Bookmark, EHistory, SettingsUtilities, AccessorsUtilities, Persistence, NativeDateUnit, ViewUtilities, _, DatabaseUtilities, UIUtilities, FromString, Backwards, Attributes, Collection, Database, LocalImpl, Type, Property, RangeIndex, Importer, BabelBased, JSONP, GoogleSpreadsheet, ExhibitJSONImporter, Exporter, ExhibitJSONExporter, TSV, SemanticWikiText, RDFXML, BibTex, ExpressionParser, ExpressionScanner, Expression, ExpressionCollection, Path, Operator, FunctionCall, ControlCall, Constant, Controls, FunctionUtilities, Functions, UI, UIContext, Lens, LensRegistry, ControlPanel, Formatter, FormatParser, FormatScanner, Coordinator, Coder, ColorCoder, DefaultColorCoder, OrderedColorCoder, SizeCoder, ColorGradientCoder, SizeGradientCoder, IconCoder, Facet, ListFacet, TextSearchFacet, AlphaRangeFacet, NumericRangeFacet, HierarchicalFacet, CloudFacet, View, ViewPanel, OrderedViewFrame, TileView, ThumbnailView, TabularView, ToolboxWidget, ResizableDivWidget, ResetHistoryWidget, OptionWidget, Logo, LegendWidget, LegendGradientWidget, BookmarkWidget, CollectionSummaryWidget) {
    Exhibit.Backwards = Backwards;
    Exhibit.Backwards.Attributes = Attributes;
    Exhibit._ = _;
    Exhibit._Impl = Impl;
    Exhibit.DatabaseUtilities = DatabaseUtilities;
    Exhibit.UIUtilities = UIUtilities;
    Exhibit.FromString = FromString;
    Exhibit.Util = Util;
    Exhibit.Coders = Coders;
    Exhibit.Util.HTML = Entities;
    Exhibit.FacetUtilities = FacetUtilities;
    Exhibit.Set = Set;
    Exhibit.Bookmark = Bookmark;
    Exhibit.Debug = Debug;
    Exhibit.History = EHistory;
    Exhibit.SettingsUtilities = SettingsUtilities;
    Exhibit.AccessorsUtilities = AccessorsUtilities;
    Exhibit.Persistence = Persistence;
    Exhibit.NativeDateUnit = NativeDateUnit;
    Exhibit.ViewUtilities = ViewUtilities;
    Exhibit.Registry = Registry;
    Exhibit.Collection = Collection;
    Exhibit.Database = Database;
    Exhibit.Database._LocalImpl = LocalImpl;
    Exhibit.Database.Type = Type;
    Exhibit.Database.Property = Property;
    Exhibit.Database.RangeIndex = RangeIndex;
    Exhibit.Importer = Importer;
    Exhibit.Importer.BabelBased = BabelBased;
    Exhibit.Importer.JSONP = JSONP;
    Exhibit.Importer.JSONP.GoogleSpreadsheet = GoogleSpreadsheet;
    Exhibit.Importer.ExhibitJSON = ExhibitJSONImporter;
    Exhibit.Exporter = Exporter;
    Exhibit.Exporter.ExhibitJSON = ExhibitJSONExporter;
    Exhibit.Exporter.TSV = TSV;
    Exhibit.Exporter.SemanticWikiText = SemanticWikiText;
    Exhibit.Exporter.RDFXML = RDFXML;
    Exhibit.Exporter.BibTex = BibTex;
    Exhibit.ExpressionParser = ExpressionParser;
    Exhibit.ExpressionScanner = ExpressionScanner;
    Exhibit.Expression = {};
    Exhibit.Expression._Impl = Expression;
    Exhibit.Expression._Collection = ExpressionCollection;
    Exhibit.Expression.Path = Path;
    Exhibit.Expression._Operator = Operator;
    Exhibit.Expression._operators = Operator._operators;
    Exhibit.Expression._FunctionCall = FunctionCall;
    Exhibit.Expression._ControlCall = ControlCall;
    Exhibit.Expression._Constant = Constant;
    Exhibit.Controls = Controls;
    Exhibit.FunctionUtilities = FunctionUtilities;
    Exhibit.Functions = Functions;
    Exhibit.UI = UI;
    Exhibit.UIContext = UIContext;
    Exhibit.Lens = Lens;
    Exhibit.LensRegistry = LensRegistry;
    Exhibit.ControlPanel = ControlPanel;
    Exhibit.Formatter = Formatter;
    Exhibit.FormatParser = FormatParser;
    Exhibit.FormatScanner = FormatScanner;
    Exhibit.Coordinator = Coordinator;
    Exhibit.Coder = Coder;
    Exhibit.ColorCoder = ColorCoder;
    Exhibit.DefaultColorCoder = DefaultColorCoder;
    Exhibit.OrderedColorCoder = OrderedColorCoder;
    Exhibit.ColorGradientCoder = ColorGradientCoder;
    Exhibit.SizeCoder = SizeCoder;
    Exhibit.SizeGradientCoder = SizeGradientCoder;
    Exhibit.IconCoder = IconCoder;
    Exhibit.Facet = Facet;
    Exhibit.ListFacet = ListFacet;
    Exhibit.TextSearchFacet = TextSearchFacet;
    Exhibit.AlphaRangeFacet = AlphaRangeFacet;
    Exhibit.NumericRangeFacet = NumericRangeFacet;
    Exhibit.HierarchicalFacet = HierarchicalFacet;
    Exhibit.CloudFacet = CloudFacet;
    Exhibit.View = View;
    Exhibit.ViewPanel = ViewPanel;
    Exhibit.OrderedViewFrame = OrderedViewFrame;
    Exhibit.TileView = TileView;
    Exhibit.ThumbnailView = ThumbnailView;
    Exhibit.TabularView = TabularView;
    Exhibit.ToolboxWidget = ToolboxWidget;
    Exhibit.ResizableDivWidget = ResizableDivWidget;
    Exhibit.ResetHistoryWidget = ResetHistoryWidget;
    Exhibit.OptionWidget = OptionWidget;
    Exhibit.Logo = Logo;
    Exhibit.LegendWidget = LegendWidget;
    Exhibit.LegendGradientWidget = LegendGradientWidget;
    Exhibit.BookmarkWidget = BookmarkWidget;
    Exhibit.CollectionSummaryWidget = CollectionSummaryWidget;

    /**
     * @static
     * @param {String} url
     * @param {Object} to
     * @param {Object} types
     * @returns {Object}
     */
    Exhibit.parseURLParameters = function(url, to, types) {
        var q, param, parsed, params, decode, i, eq, name, old, replacement, type, data;
        to = to || {};
        types = types || {};
        
        if (typeof url === "undefined") {
            url = document.location.href;
        }

        q = url.indexOf("?");
        if (q < 0) {
            return to;
        }

        url = (url+"#").slice(q+1, url.indexOf("#")); // remove URL fragment
        params = url.split("&");
        parsed = {};
        decode = window.decodeURIComponent || unescape;
        for (i = 0; i < params.length; i++) {
            param = params[i];
            eq = param.indexOf("=");
            name = decode(param.slice(0, eq));
            old = parsed[name];
            replacement = decode(param.slice(eq+1));
            
            if (typeof old === "undefined") {
                old = [];
            } else if (!(old instanceof Array)) {
                old = [old];
            }
            parsed[name] = old.concat(replacement);
        }

        for (i in parsed) {
            if (parsed.hasOwnProperty(i)) {
                type = types[i] || String;
                data = parsed[i];
                if (!(data instanceof Array)) {
                    data = [data];
                }
                if (type === Boolean && data[0] === "false") {
                    to[i] = false;
                } else {
                    to[i] = type.apply(this, data);
                }
            }
        }
        
        return to;
    };

    /**
     * Locate the script tag that called for a component and return its src.
     *
     * @param {Document} doc
     * @param {String} frag
     * @returns {String}
     */
    Exhibit.findScript = function(doc, frag) {
        var script, scripts, i, url;
        scripts = doc.getElementsByTagName("script");
        for (i = 0; i < scripts.length; i++) {
            script = scripts[i];
            url = script.getAttribute("src");
            if (url !== null) {
                if (url.indexOf(frag) >= 0) {
                    return url;
                }
            }
        }
        return null;
    };
    
    /**
     * Append into urls each string in suffixes after prefixing it with
     * urlPrefix.
     * @static
     * @deprecated
     * @param {Array} urls
     * @param {String} urlPrefix
     * @param {Array} suffixes
     */
    Exhibit.prefixURLs = function(urls, urlPrefix, suffixes) {
        // no op
    };

    /**
     * @static
     * @param {Document} doc
     * @param {String} url
     */
    Exhibit.includeCssFile = function(doc, url) {
        var link;
        if (doc.body === null) {
            try {
                doc.write('<link rel="stylesheet" href="' + url + '" type="text/css"/>');
                return;
            } catch (e) {
                // fall through
            }
        }
        
        link = doc.createElement("link");
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("type", "text/css");
        link.setAttribute("href", url);
        doc.getElementsByTagName("head")[0].appendChild(link);
    };
    
    /**
     * @static
     * @param {Document} doc
     * @param {String} urlPrefix Path prefix to add to the list of filenames;
     *     use null or an empty string if no prefix is needed.
     * @param {Array} filenames
     */
    Exhibit.includeCssFiles = function(doc, urlPrefix, filenames) {
        var i;
        for (i = 0; i < filenames.length; i++) {
            if (urlPrefix !== null && urlPrefix !== "") {
                Exhibit.includeCssFile(doc, urlPrefix + filenames[i]);
            } else {
                Exhibit.includeCssFile(doc, filenames[i]);
            }
        }
    };
    
    /**
     * @static
     * @deprecated
     * @param {String} urlPrefix Path prefix to add to the list of filenames;
     *     use null or an empty string if no prefix is needed.
     * @param {Array} filenames
     * @param {Boolean} [serial]
     */
    Exhibit.includeJavascriptFiles = function(urlPrefix, filenames, serial) {
        // no op
    };
    
    /**
     * @static
     * @deprecated
     * @param {String} urlPrefix Path prefix to add to the list of filenames;
     *     use null or an empty string if no prefix is needed.
     * @param {String} filename The remainder of the script URL following the
     *     urlPrefix; a script to add to Exhibit's ordered loading.
     * @param {Boolean} [serial] Whether to wait for a script to load before
     *      loading the next in line.  True by default.
     */
    Exhibit.includeJavascriptFile = function(urlPrefix, filename, serial) {
        // no op
    };
    
    /**
     * @static
     * @param {Exhibit.Database} database
     * @returns {Exhibit._Impl}
     */
    Exhibit.create = function(database) {
        return new Impl(database);
    };
    
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

    Exhibit.initializeEvents = function() {
        $(document).ready(function() {
            $(document).bind("error.exhibit", function(evt, e, msg) {
                UIUtilities.hideBusyIndicator();
                Debug.exception(e, msg);
                alert(msg);
            });

            $(document).one("scriptsLoaded.exhibit", function(evt) {
                $(document).trigger("registerStaticComponents.exhibit", Exhibit.staticRegistry);
                $(document).trigger("staticComponentsRegistered.exhibit");
            });

            if (Exhibit.params.autoCreate) {
                $(document).one("staticComponentsRegistered.exhibit", function(evt) {
                    Exhibit.autoCreate();
                });
            }

            $(document).one("exhibitConfigured.exhibit", function(evt, ex) {
                Bookmark.init();
                EHistory.init(ex, Exhibit.params.persist);
            });
            
            // Signal recording
            $(document).one("exhibitConfigured.exhibit", function(evt) {
                Exhibit.signals["exhibitConfigured.exhibit"] = true;
            });
            
            Exhibit.checkBackwardsCompatibility();
            Exhibit.staticRegistry = new Registry(true);
        });
    };

    /**
     * Called automatically to do set up material regardless of whether
     * the user has set autoCreate or not.
     */
    Exhibit.setup = function() {
        // @@@ better resolve precedence of global script vars, Require conf,
        //     and URL parameters - which one wins?
        var conf, prefix, params, url, targets, target, links, link, i;
        conf = module.config();
        params = conf;
        if (Object.prototype.hasOwnProperty.call(window, "Exhibit_parameters")) {
            params = Exhibit.parseURLParameters(Exhibit_parameters, Exhibit.params, Exhibit.paramTypes);
            Exhibit.params = params;
        }

        if (conf.hasOwnProperty("bundle")) {
            Exhibit.params.bundle = conf.bundle;
        }
        if (conf.hasOwnProperty("autoCreate")) {
            Exhibit.params.autoCreate = conf.autoCreate;
        }

        if (typeof Exhibit_urlPrefix === "string") {
            prefix = Exhibit_urlPrefix;
        } else if (conf.hasOwnProperty("prefix")) {
            prefix = conf.prefix;
        } else {
            url = null;
            targets = ["exhibit-api.js", "exhibit-bundle.js"];
            for (i = 0; i < targets.length; i++) {
                target = targets[i];
                url = Exhibit.findScript(document, target);
                if (url !== null) {
                    prefix = url.substr(0, url.indexOf(target));
                    break;
                }
            }

            if (url !== null) {
                params = Exhibit.parseURLParameters(url, Exhibit.params, Exhibit.paramTypes);
                Exhibit.params = params;
            }
        }

        Exhibit.urlPrefix = prefix;
        Exhibit.params.prefix = Exhibit.urlPrefix;
        if (typeof Exhibit.params.babel !== "undefined") {
            Exhibit.babelPrefix = Exhibit.params.babel;
        }

        links = document.getElementsByTagName("link");
        for (i = 0; i < links.length; i++) {
            link = links[i];
            if (link.rel.search(/\b(exhibit\/babel-translator|exhibit-babel)\b/) > 0) {
                Exhibit.babelPrefix = link.href.replace(/\/translator\/$/, "");
            } else if (link.rel.search(/\b(exhibit-extension)\b/) > 0) {
                // @@@ ditch this? or figure out how to accommodate it?
                // ExhibitLoader.extensions.push(link.href);
            }
        }
        
        // @@@ note that this should be ditched and subbed with a more
        //     RequireJS-friendly approach
        if (typeof Exhibit.params.backstage !== "undefined") {
            // Exhibit.params.autoCreate = false;
            // require(Exhibit.params.backstage)
        }

        if (Exhibit.params.bundle) {
            Exhibit.includeCssFile(document, Exhibit.bundledStyle);
        } else {
            Exhibit.includeCssFiles(document, Exhibit.urlPrefix, Exhibit.styles);
        }
        Exhibit.initializeEvents();
    };

    domReady(Exhibit.setup);

    return Exhibit;
});
