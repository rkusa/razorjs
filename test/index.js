var fs = require('fs')
  , should = require('should')
  , pegjs = require('pegjs')
  , parser = pegjs.buildParser(fs.readFileSync(__dirname + '/../lib/parser/razorjs.pegjs', 'utf-8'))

describe('RazorJs', function() {
  var files = fs.readdirSync(__dirname)
  files
  .filter (function(file) { return file.substr(-5) == '.html' })
  .forEach(function(file) {
    it(file, function() {
      var contents = fs.readFileSync(__dirname + '/' + file, 'utf-8')

      var template = contents.substr(0, contents.indexOf('<code>'))
      // console.log(template)
      
      var pos = contents.indexOf('<pre>') + 5
      var expected = contents.substr(
        pos,
        contents.indexOf('</pre>') - pos
      ).replace(/&lt;/g, '<').replace(/&gt;/g, '>').split('\n')
      for (var i = 0; i < expected.length; ++i) {
        expected[i] = expected[i].replace(/^[ \t]*/, '')
      }
      if (expected[0] === '') expected.shift()
      if (expected[expected.length - 1] === '') expected.pop()
      
      // console.log(expected)
      
      var parsed = parser.parse(template)
      
      // console.log(parsed)
      
      for (var i = 0; i < expected.length; ++i)
        expected[i].should.equal(parsed[i])
      expected.should.have.lengthOf(parsed.length)
    })
  })
})
