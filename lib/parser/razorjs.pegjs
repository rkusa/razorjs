start
  = src:block
    {
      return Array.prototype.concat.apply([], src)
    }

block
  = b:body*
    {
      return Array.prototype.concat.apply([], b)
    }

body
  = comment
  / r:razor
  / "{" b:block "}"
    {
      return ['_b.push("{");'].concat(b, '_b.push("}");')
    }
  / b:(!("@" / "<!--") c:[^\{\}] { return c; })+
    {
      return ['_b.push("' + b.join('').replace(/[\n][\r]?/g, '\\n').replace(/\s*[\n\r]\s*/g, '').replace(/"/g, '\\"') + '");']
    }

razor
  = binding
  / inline
  / helper
  / attr
  / i18n
  / "@" js:javascript
    {
      return Array.isArray(js) ? Array.prototype.concat.apply([], js) : js
    }

comment
  = "<!--" c:(!"-->" .)* "-->"
    {
      // return nothing = remove comment
    }

i18n
  = "@\"" s:[^\"]+ "\""
    {
      return { type: 'i18n', content: s.join('') }
    }

binding
  = "@{" js:javascript "}"
    {
      return {
        type: 'binding',
        content: Array.isArray(js) ? Array.prototype.concat.apply([], js) : js
      }
    }

inline
  = "@{" s:[^\}]+ "}"
    {
      return { type: 'inline', content: s.join('') }
    }

helper
  = "@section " _ l:literal _ "{" _ b:block _ "}"
    {
      return { type: 'section', name: l.join(''), content: b }
    }
  / "@helper" _ l:literal _ "(" _ a:arguments _ ")" _ "{" _ b:block _ "}"
    {
      return { type: 'helper', name: l.join(''), args: a[0] ? a[0].split(',') : [], fn: b }
    }

attr
  = "@" f:[a-zA-Z] b:[a-zA-Z\-_]* "=\"" v:[^\"]+ "\""
    {
      return { type: 'attr', name:  f + b.join(''), value: v.join('') }
    }

javascript
  = "(" _ a:arguments _ ")"
    {
      return '_b.push(_e(' + a.join('') + '));'
    }
  / t1:token _ "{" _ b:block _ "}" _ t2:token _ "(" _ a:arguments _ ")"
    {
      return [t1 + '{'].concat(b, '}', t2, '(', a, ')')
    }
  / &(token _ [\(\{]) s:statement*
    {
      return Array.prototype.concat.apply([], s)
    }
  / l:literal _ "(" _ a:arguments _ ")" _ "{" _ b:block _ "}"
    {
      return [l.join('') + '('].concat(a, ') {', b, '}')
    }
  / g:get
    {
      g[0] = '_b.push(' + g[0]
      g[g.length - 1] = g[g.length - 1] + ');'
      return g
    }

get
  = l:literal _ "(" _ a:arguments _ ")." g:get
    {
      return [l.join('') + '('].concat(a, ').', g)
    }
  / l:literal _ "(" _ a:arguments _ ")"
    {
      return [l.join('') + '('].concat(a, ')')
    }
  / l:literal
    {
      return ['_e(' + l.join('') + ')']
    }

statement
  = t:token _ "{" _ b:block _ "}" _
    {
      return [t].concat('{', b, '}')
    }
  / t:token _ "(" _ a:arguments _ ")" _ "{" _ b:block _ "}" _
    {
      return [t + '('].concat(a, ') {', b, '}')
    }

token
  = "if"
  / "else" _ "if"             { return "else if" }
  / "else"
  / "for"
  / "while"
  / "do"
  / "with"

literal
  = [^ \(\)<>"/']+

arguments
  = a:argument*
    {
      var arr = Array.prototype.concat.apply([], a)
        , result = [], last
      for (var i = 0, len = arr.length; i < len; ++i) {
        if (typeof arr[i] === 'string' && typeof result[result.length - 1] === 'string')
          result[result.length - 1] += arr[i]
        else
          result.push(arr[i])
        last = arr[i]
      }
      return result
    }

argument
  = "(" _ a:arguments _ ")"   { return ['('].concat(a, ')') }
  / _ fn:function _           { return fn }
  / _ c:[,:] _                { return c }
  / _ a:[^,:\(\)]+ _          { return a.join('').replace(/[\r\n]/g, '') }

function
  = "function" _ "(" _ a:arguments _ ")" _ "{" _ "return " _ b:([^\}]+) _ "}"
    {
      return {
        type: 'function',
        args: a[0] ? a[0].split(',') : [],
        fn: ['return ' + b.join('')]
      }
    }
  / "function" _ "(" _ a:arguments _ ")" _ "{" _ b:block _ "}"
    {
      return {
        type: 'function',
        args: a[0] ? a[0].split(',') : [],
        fn: b
      }
    }

_ "whitespace"
  = w:[ \t\n\r]*