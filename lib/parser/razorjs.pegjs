start
  = src:template
    {
      return Array.prototype.concat.apply(
        ['var _b = [];',
         'with(_s) {'], src)
        .concat(
         '}',
         'return _b.join("");')
    }

template
  = part*

block
  = body*

part
  = i18n
  / razor
  / b:(!"@" c:. { return c; })+
    {
      return '_b.push("' + b.join('').replace(/\s*[\n\r]\s*/g, '').replace(/"/g, '\\"') + '");'
    }

body
  = i18n
  / razor
  / b:(!"@" c:[^\{\}] { return c; })+
    {
      return '_b.push("' + b.join('').replace(/\s*[\n\r]\s*/g, '').replace(/"/g, '\\"') + '");'
    }

i18n
  = "@\"" s:[^\"]+ "\""
    {
      return { i18n: s.join('') }
    }

razor
  = "@" js:javascript
    {
      return Array.isArray(js) ? Array.prototype.concat.apply([], js) : js
    }

javascript
  = "(" _ e:arguments _ ")"
    {
      return '_b.push(' + e.join('') + ');'
    }
  / l:literal _ "(" _ a:arguments _ ")" _ "{" _ b:block _ "}"
    {
      return [l.join('') + '('].concat(a, ') {', b, '}')
    }
  / l:literal _ "(" _ a:arguments _ ")"
    {
      return ['_b.push(' + l.join('') + '('].concat(a, '));')
    }
  / l:literal
    {
      return '_b.push(' + l.join('') + ');'
    }

literal
  = [^ \(\)<>"/']+

arguments
  = a:argument*               { return Array.prototype.concat.apply([], a) }

argument
  = "(" _ a:arguments _ ")"   { return '(' + a.join('') + ')' }
  / _ fn:function _             { return fn }
  / _ [,] _                   { return ','}
  / _ a:[^,\(\)]+ _           { return a.join('').replace(/[\r\n]/g, '') }

function
  = "function" _ "(" _ a:arguments _ ")" _ "{" _ b:block _ "}"
    {
      return ['function('].concat(a, ') {',
              'var _d = typeof _b === "undefined";',
              'return (function inner(_b, _d) {',
        'Object.keys(inner.caller).forEach(function(key) { inner[key] = inner.caller[key]; });',
              'with(this) {',
              b,
              '}',
              'if (!_d) return "";',
              'return _b.join("");',
              '}).call(this, _d ? [] : _b, _d)',
              '}')
    }

_ "whitespace"
  = w:[ \t]*[\n\r]*