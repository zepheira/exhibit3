define([
    "module",
    "lib/jquery",
    "./scripts/exhibit-core",
    "./scripts/exhibit-impl",
    "./scripts/registry",
    "./scripts/util/util",
    "./scripts/util/coders",
    "./scripts/util/debug",
    "./scripts/util/date-time",
    "./scripts/util/entities",
    "./scripts/util/facets",
    "./scripts/util/set",
    "./scripts/util/bookmark",
    "./scripts/util/history-init",
    "./scripts/util/settings",
    "./scripts/util/accessors",
    "./scripts/util/persistence",
    "./scripts/util/units",
    "./scripts/util/views",
    "./scripts/util/localizer",
    "./scripts/util/database",
    "./scripts/util/ui",
    "./scripts/util/from-string",
    "./scripts/bc/bc",
    "./scripts/bc/attributes",
    "./scripts/data/collection",
    "./scripts/data/database",
    "./scripts/data/database/local",
    "./scripts/data/database/type",
    "./scripts/data/database/property",
    "./scripts/data/database/range-index",
    "./scripts/data/importer",
    "./scripts/data/importers/babel-based",
    "./scripts/data/importers/jsonp",
    "./scripts/data/importers/google-spreadsheet",
    "./scripts/data/importers/json",
    "./scripts/data/exporter",
    "./scripts/data/exporters/json",
    "./scripts/data/exporters/tsv",
    "./scripts/data/exporters/semantic-wikitext",
    "./scripts/data/exporters/rdf-xml",
    "./scripts/data/exporters/bibtex",
    "./scripts/data/expression-parser",
    "./scripts/data/expression-scanner",
    "./scripts/data/expression",
    "./scripts/data/expression/collection",
    "./scripts/data/expression/path",
    "./scripts/data/expression/operator",
    "./scripts/data/expression/function-call",
    "./scripts/data/expression/control-call",
    "./scripts/data/expression/constant",
    "./scripts/data/expression/controls",
    "./scripts/data/expression/function-utilities",
    "./scripts/data/expression/functions",
    "./scripts/ui/ui",
    "./scripts/ui/ui-context",
    "./scripts/ui/lens",
    "./scripts/ui/lens-registry",
    "./scripts/ui/control-panel",
    "./scripts/ui/formatter",
    "./scripts/ui/format-parser",
    "./scripts/ui/format-scanner",
    "./scripts/ui/coordinator",
    "./scripts/ui/coders/coder",
    "./scripts/ui/coders/color-coder",
    "./scripts/ui/coders/default-color-coder",
    "./scripts/ui/coders/ordered-color-coder",
    "./scripts/ui/coders/color-gradient-coder",
    "./scripts/ui/coders/size-coder",
    "./scripts/ui/coders/size-gradient-coder",
    "./scripts/ui/coders/icon-coder",
    "./scripts/ui/facets/facet",
    "./scripts/ui/facets/list-facet",
    "./scripts/ui/facets/text-search-facet",
    "./scripts/ui/facets/alpha-range-facet",
    "./scripts/ui/facets/numeric-range-facet",
    "./scripts/ui/facets/hierarchical-facet",
    "./scripts/ui/facets/cloud-facet",
    "./scripts/ui/views/view",
    "./scripts/ui/views/view-panel",
    "./scripts/ui/views/ordered-view-frame",
    "./scripts/ui/views/tile-view",
    "./scripts/ui/views/thumbnail-view",
    "./scripts/ui/views/tabular-view",
    "./scripts/ui/widgets/toolbox-widget",
    "./scripts/ui/widgets/resizable-div-widget",
    "./scripts/ui/widgets/reset-history-widget",
    "./scripts/ui/widgets/option-widget",
    "./scripts/ui/widgets/logo",
    "./scripts/ui/widgets/legend-widget",
    "./scripts/ui/widgets/legend-gradient-widget",
    "./scripts/ui/widgets/bookmark-widget",
    "./scripts/ui/widgets/collection-summary-widget"
], function(module, $, Exhibit, Impl, Registry, Util, Coders, Debug, DateTime, Entities, FacetUtilities, Set, Bookmark, EHistory, SettingsUtilities, AccessorsUtilities, Persistence, NativeDateUnit, ViewUtilities, _, DatabaseUtilities, UIUtilities, FromString, Backwards, Attributes, Collection, Database, LocalImpl, Type, Property, RangeIndex, Importer, BabelBased, JSONP, GoogleSpreadsheet, ExhibitJSONImporter, Exporter, ExhibitJSONExporter, TSV, SemanticWikiText, RDFXML, BibTex, ExpressionParser, ExpressionScanner, Expression, ExpressionCollection, Path, Operator, FunctionCall, ControlCall, Constant, Controls, FunctionUtilities, Functions, UI, UIContext, Lens, LensRegistry, ControlPanel, Formatter, FormatParser, FormatScanner, Coordinator, Coder, ColorCoder, DefaultColorCoder, OrderedColorCoder, SizeCoder, ColorGradientCoder, SizeGradientCoder, IconCoder, Facet, ListFacet, TextSearchFacet, AlphaRangeFacet, NumericRangeFacet, HierarchicalFacet, CloudFacet, View, ViewPanel, OrderedViewFrame, TileView, ThumbnailView, TabularView, ToolboxWidget, ResizableDivWidget, ResetHistoryWidget, OptionWidget, Logo, LegendWidget, LegendGradientWidget, BookmarkWidget, CollectionSummaryWidget) {
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
            // is eliminated as it should be, wholesale replacement of this
            // fDone would currently not be possible.
        };
        
        // 

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
        if (Exhibit.signals["scriptsLoaded.exhibit"]) {
            $(document).trigger("scriptsLoaded.exhibit");
        }
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
        OptionWidget.config(Exhibit.urlPrefix);
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
            Exhibit.includeCssFile(document, Exhibit.urlPrefix + Exhibit.bundledStyle);
        } else {
            Exhibit.includeCssFiles(document, Exhibit.urlPrefix, Exhibit.styles);
        }
        Exhibit.initializeEvents();
    };

    $(document).one("scriptsLoaded.exhibit", function(evt) {
        // If this event gets triggered before setup runs, no good.  Catch
        // it ASAP and register it for later replay.
        Exhibit.signals["scriptsLoaded.exhibit"] = true;
    });

    $(document).ready(Exhibit.setup);

    return Exhibit;
});
