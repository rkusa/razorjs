var fs      = require('fs')
  , should  = require('should')
  , razorjs = require('../lib/razorjs')

describe('Templates', function() {
  var files = fs.readdirSync(__dirname)
  files
  .filter (function(file) { return file.substr(-5) == '.html' })
  .forEach(function(file) {
    it(file, function() {
      var contents = fs.readFileSync(__dirname + '/' + file, 'utf-8')

      var template = contents.substr(0, contents.indexOf('<code>')).replace(/[\n]*$/, '')
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
      
      var compiled = razorjs.compile(template).toString()
      // console.log(compiled)
      compiled = compiled.split('\n')
      
      for (var i = 0; i < expected.length; ++i)
        expected[i].should.equal(typeof compiled[i] === 'string' ? compiled[i] : JSON.stringify(compiled[i]))
      expected.should.have.lengthOf(compiled.length)
    })
  })
})
