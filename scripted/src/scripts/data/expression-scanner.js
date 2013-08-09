define(["../util/localizer"], function(_) {

/**
 * @class 
 * @constructor
 * @param {String} text
 * @param {Number} startIndex
 */
var ExpressionScanner = function(text, startIndex) {
    this._text = text + " "; // make it easier to parse
    this._maxIndex = text.length;
    this._index = startIndex;
    this.next();
};

/** @constant */
ExpressionScanner.DELIMITER     = 0;
/** @constant */
ExpressionScanner.NUMBER        = 1;
/** @constant */
ExpressionScanner.STRING        = 2;
/** @constant */
ExpressionScanner.IDENTIFIER    = 3;
/** @constant */
ExpressionScanner.OPERATOR      = 4;
/** @constant */
ExpressionScanner.PATH_OPERATOR = 5;

/**
 * @returns {Object}
 */
ExpressionScanner.prototype.token = function() {
    return this._token;
};

/**
 * @returns {Number}
 */
ExpressionScanner.prototype.index = function() {
    return this._index;
};

/**
 * @throws Error
 */
ExpressionScanner.prototype.next = function() {
    var c1, c2, i, c;
    this._token = null;
    
    while (this._index < this._maxIndex &&
        " \t\r\n".indexOf(this._text.charAt(this._index)) >= 0) {
        this._index++;
    }
    
    if (this._index < this._maxIndex) {
        c1 = this._text.charAt(this._index);
        c2 = this._text.charAt(this._index + 1);
        
        if (".!".indexOf(c1) >= 0) {
            if (c2 === "@") {
                this._token = {
                    type:   ExpressionScanner.PATH_OPERATOR,
                    value:  c1 + c2,
                    start:  this._index,
                    end:    this._index + 2
                };
                this._index += 2;
            } else {
                this._token = {
                    type:   ExpressionScanner.PATH_OPERATOR,
                    value:  c1,
                    start:  this._index,
                    end:    this._index + 1
                };
                this._index++;
            }
        } else if ("<>".indexOf(c1) >= 0) {
            if ((c2 === "=") || ("<>".indexOf(c2) >= 0 && c1 !== c2)) {
                this._token = {
                    type:   ExpressionScanner.OPERATOR,
                    value:  c1 + c2,
                    start:  this._index,
                    end:    this._index + 2
                };
                this._index += 2;
            } else {
                this._token = {
                    type:   ExpressionScanner.OPERATOR,
                    value:  c1,
                    start:  this._index,
                    end:    this._index + 1
                };
                this._index++;
            }
        } else if ("+-*/=".indexOf(c1) >= 0) {
            this._token = {
                type:   ExpressionScanner.OPERATOR,
                value:  c1,
                start:  this._index,
                end:    this._index + 1
            };
            this._index++;
        } else if ("(),".indexOf(c1) >= 0) {
            this._token = {
                type:   ExpressionScanner.DELIMITER,
                value:  c1,
                start:  this._index,
                end:    this._index + 1
            };
            this._index++;
        } else if ("\"'".indexOf(c1) >= 0) { // quoted strings
            i = this._index + 1;
            while (i < this._maxIndex) {
                if (this._text.charAt(i) === c1 && this._text.charAt(i - 1) !== "\\") {
                    break;
                }
                i++;
            }
            
            if (i < this._maxIndex) {
                this._token = {
                    type:   ExpressionScanner.STRING,
                    value:  this._text.substring(this._index + 1, i).replace(/\\'/g, "'").replace(/\\"/g, '"'),
                    start:  this._index,
                    end:    i + 1
                };
                this._index = i + 1;
            } else {
                throw new Error(_("%expression.error.unterminatedString", + this._index));
            }
        } else if (this._isDigit(c1)) { // number
            i = this._index;
            while (i < this._maxIndex && this._isDigit(this._text.charAt(i))) {
                i++;
            }
            
            if (i < this._maxIndex && this._text.charAt(i) === ".") {
                i++;
                while (i < this._maxIndex && this._isDigit(this._text.charAt(i))) {
                    i++;
                }
            }
            
            this._token = {
                type:   ExpressionScanner.NUMBER,
                value:  parseFloat(this._text.substring(this._index, i)),
                start:  this._index,
                end:    i
            };
            this._index = i;
        } else { // identifier
            i = this._index;
            while (i < this._maxIndex) {
                c = this._text.charAt(i);
                if ("(),.!@ \t".indexOf(c) < 0) {
                    i++;
                } else {
                    break;
                }
            }
            this._token = {
                type:   ExpressionScanner.IDENTIFIER,
                value:  this._text.substring(this._index, i),
                start:  this._index,
                end:    i
            };
            this._index = i;
        }
    }
};

/**
 * @private
 * @static
 * @param {String} c
 * @returns {Boolean}
 */
ExpressionScanner.prototype._isDigit = function(c) {
    return "0123456789".indexOf(c) >= 0;
};

    // end define
    return ExpressionScanner;
});
