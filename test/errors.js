var should  = require('should')
  , razorjs = require('../lib/razorjs')


describe('Errors', function() {
  describe('Syntax Errors', function() {
    it('should throw', function() {
      (function() {
        razorjs.compile('<div>@(import</div>')
      }).should.throw(/^Syntax error on line 1/)
    })
  })
})