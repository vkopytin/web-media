const pegjs = require('pegjs');
const loaderUtils = require('loader-utils');

function getExports(source) {
  var matches = source.match(/@exports:[\s]+([^\n]+)/);
  if (matches && matches[1]) {
    return matches[1].replace(/^\s+|\s$/).split(/,\s+/);
  }
  return [];
}

module.exports = function loader(source) {
  if (this.cacheable) {
    this.cacheable();
  }

  const query = loaderUtils.parseQuery(this.query);
  const cacheParserResults = !!query.cache;
  const optimizeParser = query.optimize || 'speed';
  const trace = !!query.trace;
  const dependencies = JSON.parse(query.dependencies || '{}');

  let allowedStartRules;
  if (typeof query.allowedStartRules === 'string') {
    allowedStartRules = [ query.allowedStartRules ];
  } else if (Array.isArray(query.allowedStartRules)) {
    allowedStartRules = query.allowedStartRules;
  } else {
    allowedStartRules = [];
  }

  try {
    allowedStartRules = allowedStartRules.concat(getExports(source).filter(function (el) {
      return allowedStartRules.indexOf(el) === -1;
    }));
  } catch (ex) {
    console.log(ex);
  }  

  // Description of PEG.js options: https://github.com/pegjs/pegjs#javascript-api
  const pegOptions = {
    cache: cacheParserResults,
    dependencies: dependencies,
    format: 'commonjs',
    optimize: optimizeParser,
    output: 'source',
    trace: trace,
  };
  if (allowedStartRules.length > 0) {
    pegOptions.allowedStartRules = allowedStartRules;
  }

  const methodName = (typeof pegjs.generate === 'function') ? 'generate' : 'buildParser';
  return "module.exports = " + pegjs[methodName](source, pegOptions);
}