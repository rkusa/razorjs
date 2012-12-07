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
  = razor
  / b:(!"@" c:. { return c; })+
    {
      return '_b.push("' + b.join('').replace(/\s*[\n\r]\s*/g, '').replace(/"/g, '\\"') + '");'
    }

body
  = razor
  / b:(!"@" c:[^\{\}] { return c; })+
    {
      return '_b.push("' + b.join('').replace(/\s*[\n\r]\s*/g, '').replace(/"/g, '\\"') + '");'
    }
 
razor
  = "@" + js:javascript
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
  / fn:function _             { return fn }
  / _ [,] _                   { return ','}
  / _ a:[^,\(\)]+ _           { return a.join('').replace(/[\r\n]/g, '') }

function
  = "function" _ "(" _ a:arguments _ ")" _ "{" _ b:block _ "}"
    {
      return ['function('].concat(a, ') {',
              'var _b = [];',
              'with(_s) {',
              b,
              '}',
              'return _b.join("");', '}')
    }

_ "whitespace"
  = w:[ \t]*[\n\r]*