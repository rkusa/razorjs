start
  = src:template
    {
      return Array.prototype.concat.apply(
        ['function() {',
           '_buf = [];',
           'with(this) {'], src)
        .concat(
           '}',
           'return _buf.join("");',
         '}')
    }

template
  = part*

block
  = body*

part
  = razor
  / b:(!"@" c:. { return c; })+
    {
      return '_buf.push("' + b.join('').replace(/\s*[\n\r]\s*/g, '').replace(/"/g, '\\"') + '");'
    }

body
  = razor
  / b:(!"@" c:[^\{\}] { return c; })+
    {
      return '_buf.push("' + b.join('').replace(/\s*[\n\r]\s*/g, '').replace(/"/g, '\\"') + '");'
    }
 
razor
  = "@" + js:javascript
    {
      return js
    }

javascript
  = "(" _ e:expression _ ")"
    {
      return 'buf.push(' + e.join('') + ');'
    }
  / l:literal _ "(" _ a:arguments _ ")" _ "{" _ b:block _ "}"
    {
      return [l.join('') + '('].concat(a, ') {', b, '}')
    }
  / l:literal _ "(" _ a:arguments _ ")"
    {
      return ['buf.push(' + l.join('') + '('].concat(a, '))')
    }
  / l:literal
    {
      return '_buf.push(' + l.join('') + ');'
    }

literal
  = [^ \(\)<>"']+

expression
  = "(" _ expression _ ")"
  / c:[^\(\)]*

arguments
  = a:argument*               { return Array.prototype.concat.apply([], a) }

argument
  = "(" _ a:arguments _ ")"   { return '(' + a.join('') + ')' }
  / fn:function _             { return fn }
  / _ a:[^\(\)]+ _            { return a.join('').replace(/[\r\n]/g, '') }

function
  = "function" _ "(" _ a:arguments _ ")" _ "{" _ b:block _ "}"
    {
      return ['function('].concat(a, ') {',
              '_buf = [];',
              'with(this) {',
              b,
              '}',
              'return _buf.join("");', '}')
    }

_ "whitespace"
  = w:[ \t]*[\n\r]*