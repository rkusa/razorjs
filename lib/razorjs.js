var opts = {
  parser: require('./parser/razorjs'),
  i18n: function(str) {
    return str
  },
  attr: function(name, value) {
    return '"' + name + '=\\"" + _e(' + value + ') + "\\""'
  },
  inline: function(js) {
    return '_e(' + js + ')'
  },
  binding: function(js) {
    return js
  },
  section: function(name, section) {
    return section
  },
  helper: function(name, args, fn) {
    return 'this.' + name + ' = ' + exports.wrap(args, fn)
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
  var compiled

  try {
    compiled = opts.parser.parse(str)
  } catch(e) {
    if (!(e instanceof opts.parser.SyntaxError)) throw e
    var lines = str.split('\n'), err = 'Syntax error on line ' + e.line
    for (var i = e.line - 3, len = e.line + 1; i < len; ++i) {
      if (!lines[i]) continue
      err += '\n' + (i + 1) + ' ' + lines[i]
    }
    throw new Error(err + '\n')
  }

  return compiled
}

exports.resolve = function(compiled) {
  !function resolve(compiled) {
    for (var i = 0; i < compiled.length; ++i) {
      if (typeof compiled[i] !== 'object') continue
      switch (compiled[i].type) {
      case 'inline':
        compiled[i] = '_b.push(' + opts.inline(compiled[i].content) + ');'
        break
      case 'binding':
        compiled[i] = opts.binding(resolve(compiled[i].content).join(''))
        break
      case 'attr':
        compiled[i] = '_b.push(' + opts.attr(compiled[i].name, compiled[i].value) + ');'
        break
      case 'i18n':
        compiled[i] = '_b.push("' + opts.i18n(compiled[i].content) + '");'
        break
      case 'helper':
        compiled[i] = opts.helper(compiled[i].name, compiled[i].args, resolve(compiled[i].fn).join('\n'))
        break
      case 'section':
        compiled[i] = opts.section(compiled[i].name, resolve(compiled[i].content).join('\n'))
        break
      case 'function':
        compiled[i] = exports.wrap(compiled[i].args, resolve(compiled[i].fn))
        break
      }
    }
    return compiled
  }(compiled)

  compiled = 'var _b = [];\n'
           + 'var _e = function(v) { return v.replace(/&/g, \'&amp;\').replace(/"/g, \'&quot;\').replace(/</g, \'&lt;\').replace(/>/g, \'&gt;\') };\n'
           + 'with(_s) {\n'
           + opts.section('main', compiled.join('\n')) + '\n'
           + '}\n'
           + 'return _b.join("");'

  return new Function('_s', compiled);
}

exports.wrap = function(args, content) {
  return 'function(' + args.join(', ') + ') {\n'
       + (Array.isArray(content) ? content.join('\n') : content) + '\n'
       + '}'
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
    var tmpl = engine.resolve((cache(options) || cache(options, engine.compile(str))).slice())
    fn(null, tmpl(options))
  } catch (err) {
    fn(err)
  }
}