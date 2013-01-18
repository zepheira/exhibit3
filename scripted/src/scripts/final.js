/**
 * @fileOverview Initiate system startup processes.
 */

define([
    "lib/jquery",
    "auto-create",
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
], function($, Exhibit, Registry, Util, Coders, Debug, DateTime, Entities, FacetUtilities, Set, Bookmark, EHistory, SettingsUtilities, AccessorsUtilities, Persistence, NativeDateUnit, ViewUtilities, _, DatabaseUtilities, UIUtilities, Backwards, Attributes, Collection, Database, LocalImpl, Type, Property, RangeIndex, Importer, BabelBased, JSONP, GoogleSpreadsheet, ExhibitJSONImporter, Exporter, ExhibitJSONExporter, TSV, SemanticWikiText, RDFXML, BibTex, ExpressionParser, ExpressionScanner, Expression, ExpressionCollection, Path, Operator, FunctionCall, ControlCall, Constant, Controls, FunctionUtilities, Functions, UI, UIContext, Lens, LensRegistry, ControlPanel, Formatter, FormatParser, FormatScanner, Coordinator, Coder, ColorCoder, DefaultColorCoder, OrderedColorCoder, SizeCoder, ColorGradientCoder, SizeGradientCoder, IconCoder, Facet, ListFacet, TextSearchFacet, AlphaRangeFacet, NumericRangeFacet, HierarchicalFacet, CloudFacet, View, ViewPanel, OrderedViewFrame, TileView, ThumbnailView, TabularView, ToolboxWidget, ResizableDivWidget, ResetHistoryWidget, OptionWidget, Logo, LegendWidget, LegendGradientWidget, BookmarkWidget, CollectionSummaryWidget) {
    Exhibit.Backwards = Backwards;
    Exhibit.Backwards.Attributes = Attributes;
    Exhibit._ = _;
    Exhibit.DatabaseUtilities = DatabaseUtilities;
    Exhibit.UIUtilities = UIUtilities;
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

    // end define
    return Exhibit;
});
