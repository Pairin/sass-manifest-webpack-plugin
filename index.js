var fs = require('fs');
var path = require('path');

var assetForest = [];

function SassManifest(options) {
    this.options = options;
}

function isSassOrCss(filename) {
    return /\.(s?css)$/.test(filename)
}

function alreadyInForest(filename) {
    return assetForest.indexOf(filename) > -1;
}

function parseModule(module, level) {
    const children = [];
    const nextLevel = level + 1;
    if (Array.isArray(module.dependencies)) {
        module.dependencies.forEach((m) => {
            children.push(parseModule(m, nextLevel));
        })
    }
    if (isSassOrCss(module.rawRequest) && !alreadyInForest(module.rawRequest)) {
        if (path.basename(module.rawRequest) !== 'variables.scss') {
            assetForest.push(module.rawRequest);
        }
    }
    return
}

SassManifest.prototype.apply = function(compiler) {
    compiler.plugin('emit', function(compilation, callback) {
        assetForest = [];
        compilation.modules.forEach(function(m) {
            parseModule(m, 0);
        });

        fs.writeFileSync(this.options.filename || './sass-manifest.json', JSON.stringify(assetForest));

        callback();
    })
}

module.exports = SassManifest;
