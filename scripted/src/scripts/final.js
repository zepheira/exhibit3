/**
 * @fileOverview Initiate system startup processes.
 */

define([
    "lib/jquery",
    "auto-create",

], function($, Exhibit, Registry, Util, Coders, Debug, DateTime, Entities, FacetUtilities, Set, Bookmark, EHistory, SettingsUtilities, AccessorsUtilities, Persistence, NativeDateUnit, ViewUtilities, _, DatabaseUtilities, UIUtilities, FromString, Backwards, Attributes, Collection, Database, LocalImpl, Type, Property, RangeIndex, Importer, BabelBased, JSONP, GoogleSpreadsheet, ExhibitJSONImporter, Exporter, ExhibitJSONExporter, TSV, SemanticWikiText, RDFXML, BibTex, ExpressionParser, ExpressionScanner, Expression, ExpressionCollection, Path, Operator, FunctionCall, ControlCall, Constant, Controls, FunctionUtilities, Functions, UI, UIContext, Lens, LensRegistry, ControlPanel, Formatter, FormatParser, FormatScanner, Coordinator, Coder, ColorCoder, DefaultColorCoder, OrderedColorCoder, SizeCoder, ColorGradientCoder, SizeGradientCoder, IconCoder, Facet, ListFacet, TextSearchFacet, AlphaRangeFacet, NumericRangeFacet, HierarchicalFacet, CloudFacet, View, ViewPanel, OrderedViewFrame, TileView, ThumbnailView, TabularView, ToolboxWidget, ResizableDivWidget, ResetHistoryWidget, OptionWidget, Logo, LegendWidget, LegendGradientWidget, BookmarkWidget, CollectionSummaryWidget) {
    Exhibit.Backwards = Backwards;
    Exhibit.Backwards.Attributes = Attributes;
    Exhibit._ = _;
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
