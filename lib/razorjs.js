var opts = {
  parser: require('./parser/razorjs'),
  i18n: function(str) {
    return str
  },
  attr: function(name, value) {
    return '"' + name + '=\\"" + ' + value + ' + "\\""'
  },
  inline: function(js) {
    return js
  }
}

Object.keys(opts).forEach(function(key) {
  Object.defineProperty(exports, key, {
    get: function() {
      return opts[key]
    },
    set: function(val) {
      opts[key] = val
    }
  })
})

exports.compile = function(str) {
  var compiled = opts.parser.parse(str)
  for (var i = 0; i < compiled.length; ++i) {
    if (typeof compiled[i] !== 'object') continue
    if ('inline' in compiled[i])
      compiled[i] = '_b.push(' + opts.inline(compiled[i].inline) + ');'
    else if ('attr' in compiled[i])
      compiled[i] = '_b.push(' + opts.attr(compiled[i].attr.name, compiled[i].attr.value) + ');'
    else if ('i18n' in compiled[i])
      compiled[i] = '_b.push("' + opts.i18n(compiled[i].i18n) + '");'
  }
  return new Function('_s', compiled.join(''));
}

/**
 * the following code uses parts of Jolowaychuk's consolidate
 *
 * consolidate
 * Copyright(c) 2012 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

var fs = require('fs')
  , readCache = {}
  , cacheStore = {}


/**
 * Clear the cache.
 *
 * @api public
 */
exports.clearCache = function(){
  cacheStore = {}
}

function cache(options, compiled) {
  if (compiled && options.filename && options.cache) {
    delete readCache[options.filename] //don't need to cache in both locations
    cacheStore[options.filename] = compiled
  } else if (options.filename && options.cache) {
    return cacheStore[options.filename]
  }
  return compiled
}

/**
 * Read `path` with `options` with
 * callback `(err, str)`. When `options.cache`
 * is true the template string will be cached.
 *
 * @param {String} options
 * @param {Function} fn
 * @api private
 */

function read(path, options, fn) {
  var str = readCache[path]

  // cached (only if cached is a string and not a compiled template function)
  if (options.cache && str && typeof str === 'string') return fn(null, str)

  // read
  fs.readFile(path, 'utf8', function(err, str) {
    if (err) return fn(err)
    if (options.cache) readCache[path] = str
    fn(null, str)
  })
}

/**
 * fromStringRenderer
 */

function fromStringRenderer(name) {
  return function(path, options, fn){
    options.filename = path
    if (cache(options)) {
      exports[name].render('', options, fn) //string doesn't matter if it's in the cache.
    } else {
      read(path, options, function(err, str){
        if (err) return fn(err)
        exports[name].render(str, options, fn)
      })
    }
  }
}

exports.express = fromStringRenderer('express')
exports.express.render = function(str, options, fn) {
  var engine = exports
  try {
    var tmpl = cache(options) || cache(options, engine.compile(str))
    fn(null, tmpl(options))
  } catch (err) {
    fn(err)
  }
}