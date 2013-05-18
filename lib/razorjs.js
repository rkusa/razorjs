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
  var compiled = opts.parser.parse(str)
  
  !function resolve(compiled) {
    for (var i = 0; i < compiled.length; ++i) {
      if (typeof compiled[i] !== 'object') continue
      switch (compiled[i].type) {
      case 'inline':
        compiled[i] = '_b.push(' + opts.inline(compiled[i].content) + ');'
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
        opts.section(compiled[i].name, resolve(compiled[i].content).join('\n'))
        compiled.splice(i, 1)
        break
      case 'function':
        compiled[i] = exports.wrap(compiled[i].args, resolve(compiled[i].fn))
        break
      }
    }
    return compiled
  }(compiled)
  
  compiled = 'var _b = [];\n'
           + 'with(_s) {\n'
           + opts.section('main', compiled.join('\n')) + '\n'
           + '}\n'
           + 'return _b.join("");'
  return new Function('_s', compiled);
}

exports.resolve = function(compiled) {
  return compiled
}

exports.wrap = function(args, content) {
  // args = args.filter(function(a) {
  //   return a !== ','
  // })
  // console.log(content)
  return 'function(' + args.join(', ') + ') {\n'
       + 'var _d = typeof _b === "undefined";\n'
       + 'return (function inner(_b, _d) {\n'
       + 'Object.keys(inner.caller).forEach(function(key) { inner[key] = inner.caller[key]; });\n'
       + 'with(this) {\n'
       + (Array.isArray(content) ? content.join('\n') : content) + '\n'
       + '}\n'
       + 'if (!_d) return "";\n'
       + 'return _b.join("");\n'
       + '}).call(this, _d ? [] : _b, _d)\n'
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
    var tmpl = cache(options) || cache(options, engine.compile(str))
    fn(null, tmpl(options))
  } catch (err) {
    fn(err)
  }
}