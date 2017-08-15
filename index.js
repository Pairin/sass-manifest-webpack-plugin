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
            assetForest.push(path.relative(process.cwd() + '/src', module.userRequest));
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

        var filename = this.options.filename || './sass-manifest.json';
        fs.readFile('/tmp/sass_manifest', 'utf8', function(err, data) {
            if (err && err.code !== 'ENOENT') {
                throw err;
            }

            if (err && err.code === 'ENOENT') {
                data = '';
            } else {
                fs.unlink('/tmp/sass_manifest', function() {
                    console.log("Temporary Sass Manifest deleted")
                });
            }

            data = data.split('\n').concat(assetForest);

            data = data.filter(function(v, i, self) {
                return v && self.indexOf(v) === i
            })

            fs.writeFile(filename, JSON.stringify(data));

            callback();
        })
    })
}

module.exports = SassManifest;
