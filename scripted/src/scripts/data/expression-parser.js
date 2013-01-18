/**
 * @fileOverview All classes and support methods for parsing queries.
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "exhibit",
    "util/localizer",
    "data/expression",
    "data/expression-scanner",
    "data/expression/path",
    "data/expression/controls",
    "data/expression/operator",
    "data/expression/constant",
    "data/expression/function-call",
    "data/expression/control-call",
    "data/expression/functions"
], function(Exhibit, _, Expression, ExpressionScanner, Path, Controls, Operator, Constant, FunctionCall, ControlCall) {
/**
 * @namespace
 */
var ExpressionParser = {};

/**
 * @static
 * @param {String} s
 * @param {Number} startIndex
 * @param {Object} results
 * @returns {Exhibit.Expression._Impl}
 */
ExpressionParser.parse = function(s, startIndex, results) {
    startIndex = startIndex || 0;
    results = results || {};
    
    var scanner = new ExpressionScanner(s, startIndex);
    try {
        return ExpressionParser._internalParse(scanner, false);
    } finally {
        results.index = scanner.token() !== null ? scanner.token().start : scanner.index();
    }
};

/**
 * @static
 * @param {String} s
 * @param {Number} startIndex
 * @param {Object} results
 * @returns {Array}
 */
ExpressionParser.parseSeveral = function(s, startIndex, results) {
    startIndex = startIndex || 0;
    results = results || {};
    
    var scanner = new ExpressionScanner(s, startIndex);
    try {
        return ExpressionParser._internalParse(scanner, true);
    } finally {
        results.index = scanner.token() !== null ? scanner.token().start : scanner.index();
    }
};

/**
 * @static
 * @param {Exhibit.ExpressionScanner} scanner
 * @param {Boolean} several
 * @returns {Exhibit.Expression._Impl|Array}
 */
ExpressionParser._internalParse = function(scanner, several) {
    var Scanner, token, next, makePosition, parsePath, parseFactor, parseTerm, parseSubExpression, parseExpression, parseExpressionList, roots, expressions, r;
    Scanner = ExpressionScanner;
    token = scanner.token();
    next = function() { scanner.next(); token = scanner.token(); };
    makePosition = function() { return token !== null ? token.start : scanner.index(); };
    
    parsePath = function() {
        var path = new Path(), hopOperator;
        while (token !== null && token.type === Scanner.PATH_OPERATOR) {
            hopOperator = token.value;
            next();
            
            if (token !== null && token.type === Scanner.IDENTIFIER) {
                path.appendSegment(token.value, hopOperator);
                next();

            } else {
                throw new Error(_("%expression.error.missingPropertyID", makePosition()));
            }
        }
        return path;
    };
    parseFactor = function() {
        var result = null, identifier, args;
        if (typeof token === "undefined" || token === null) {
            throw new Error(_("%expression.error.missingFactor"));
        }
        
        switch (token.type) {
        case Scanner.NUMBER:
            result = new Constant(token.value, "number");
            next();
            break;
        case Scanner.STRING:
            result = new Constant(token.value, "text");
            next();
            break;
        case Scanner.PATH_OPERATOR:
            result = parsePath();
            break;
        case Scanner.IDENTIFIER:
            identifier = token.value;
            next();
            
            if (typeof Controls[identifier] !== "undefined") {
                if (token !== null && token.type === Scanner.DELIMITER && token.value === "(") {
                    next();
                    
                    args = (token !== null && token.type === Scanner.DELIMITER && token.value === ")") ? 
                        [] :
                        parseExpressionList();
                        
                    result = new ControlCall(identifier, args);
                    
                    if (token !== null && token.type === Scanner.DELIMITER && token.value === ")") {
                        next();
                    } else {
                        throw new Error(_("%expression.error.missingParenEnd", identifier, makePosition()));
                    }
                } else {
                    throw new Error(_("%expression.error.missingParenStart", identifier, makePosition()));
                }
            } else {
                if (token !== null && token.type === Scanner.DELIMITER && token.value === "(") {
                    next();
                    
                    args = (token !== null && token.type === Scanner.DELIMITER && token.value === ")") ? 
                        [] :
                        parseExpressionList();
                        
                    result = new FunctionCall(identifier, args);
                    
                    if (token !== null && token.type === Scanner.DELIMITER && token.value === ")") {
                        next();
                    } else {
                        throw new Error(_("%expression.error.missingParenFunction", identifier, makePosition()));
                    }
                } else {
                    result = parsePath();
                    result.setRootName(identifier);
                }
            }
            break;
        case Scanner.DELIMITER:
            if (token.value === "(") {
                next();
                
                result = parseExpression();
                if (token !== null && token.type === Scanner.DELIMITER && token.value === ")") {
                    next();
                    break;
                } else {
                    throw new Error(_("%expression.error.missingParen", + makePosition()));
                }
            } else {
                throw new Error(_("%expression.error.unexpectedSyntax", token.value, makePosition()));
            }
        default:
            throw new Error(_("%expression.error.unexpectedSyntax", token.value, makePosition()));
        }
        
        return result;
    };
    parseTerm = function() {
        var term = parseFactor(), operator;
        while (token !== null && token.type === Scanner.OPERATOR && 
            (token.value === "*" || token.value === "/")) {
            operator = token.value;
            next();
            
            term = new Operator(operator, [ term, parseFactor() ]);
        }
        return term;
    };
    parseSubExpression = function() {
        var subExpression = parseTerm(), operator;
        while (token !== null && token.type === Scanner.OPERATOR && 
            (token.value === "+" || token.value === "-")) {
            
            operator = token.value;
            next();
            
            subExpression = new Operator(operator, [ subExpression, parseTerm() ]);
        }
        return subExpression;
    };
    parseExpression = function() {
        var expression = parseSubExpression(), operator;
        while (token !== null && token.type === Scanner.OPERATOR && 
            (token.value === "=" || token.value === "<>" || 
             token.value === "<" || token.value === "<=" || 
             token.value === ">" || token.value === ">=")) {
            
            operator = token.value;
            next();
            
            expression = new Operator(operator, [ expression, parseSubExpression() ]);
        }
        return expression;
    };
    parseExpressionList = function() {
        var expressions = [ parseExpression() ];
        while (token !== null && token.type === Scanner.DELIMITER && token.value === ",") {
            next();
            expressions.push(parseExpression());
        }
        return expressions;
    };
    
    if (several) {
        roots = parseExpressionList();
        expressions = [];
        for (r = 0; r < roots.length; r++) {
            expressions.push(new Expression(roots[r]));
        }
        return expressions;
    } else {
        return new Expression(parseExpression());
    }
};

    // end define
    return ExpressionParser;
});
