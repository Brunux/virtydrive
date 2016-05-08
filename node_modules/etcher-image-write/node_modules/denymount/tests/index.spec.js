var chai = require('chai');
var sinon = require('sinon');
chai.use(require('sinon-chai'));
var child_process = require('child_process');
var os = require('os');
var denymount = require('../lib/index');

describe('Denymount', function() {

  describe('given a non darwin platform', function() {

    beforeEach(function() {
      this.platformStub = sinon.stub(os, 'platform');
      this.platformStub.returns('linux');
    });

    afterEach(function() {
      this.platformStub.restore();
    });

    it('should call the handler, but not execute the child process', function(done) {
      sinon.spy(child_process, 'execFile');

      denymount('/dev/disk2', function(callback) {
        return callback(null, 'foo');
      }, function(error, result) {
        chai.expect(error).to.not.exist;
        chai.expect(result).to.equal('foo');
        chai.expect(child_process.execFile).to.not.have.been.called;
        child_process.execFile.restore();
        done();
      });
    });

  });

  describe('given the darwin platform', function() {

    beforeEach(function() {
      this.platformStub = sinon.stub(os, 'platform');
      this.platformStub.returns('darwin');

      try {
        var macmount = require('macmount');
        this.macmountStub = sinon.stub(macmount, 'mount');
        this.macmountStub.yields(null);
      } catch (error) {}
    });

    afterEach(function() {
      this.platformStub.restore();

      if (this.macmountStub) {
        this.macmountStub.restore();
      }
    });

    describe('given executing the cli tool throws an error', function() {

      beforeEach(function() {
        this.error = new Error('An error happened!');
        this.execFileStub = sinon.stub(child_process, 'execFile');
        this.execFileStub.yields(this.error);
      });

      afterEach(function() {
        this.execFileStub.restore();
      });

      it('should yield the error to the callback', function(done) {
        denymount('/dev/disk2', function() {}, function(error, result) {
          chai.expect(error).to.be.an.instanceof(Error);
          chai.expect(error.message).to.equal('An error happened!');
          chai.expect(result).to.be.undefined;
          done();
        });
      });

      it('should not call the handler at all', function(done) {
        var spy = sinon.spy();
        denymount('/dev/disk2', spy, function() {
          chai.expect(spy).to.not.have.been.called;
          done();
        });
      });

      it('should not call macmount even if autoMountOnSuccess is true', function(done) {
        var self = this;
        denymount('/dev/disk2', function() {}, {
          autoMountOnSuccess: true
        }, function() {
          chai.expect(self.macmountStub).to.not.have.been.called;
          done();
        });
      });

    });

    // We simulate this condition by simply running the real cli tool
    describe('given the cli is killed with SIGTERM upon handler completion', function() {

      it('should not yield a "Command failed" error', function(done) {
        denymount('/dev/disk99', function(callback) {
          return callback(null, 'foo');
        }, function(error, result) {
          chai.expect(error).to.not.exist;
          chai.expect(result).to.equal('foo');
          done();
        });
      });

      it('should not call macmount if autoMountOnSuccess is false', function(done) {
        var self = this;
        denymount('/dev/disk99', function(callback) {
          return callback(null, 'foo');
        }, {
          autoMountOnSuccess: false
        }, function() {
          chai.expect(self.macmountStub).to.not.have.been.called;
          done();
        });
      });

      it('should call macmount if autoMountOnSuccess is true', function(done) {
        var self = this;
        denymount('/dev/disk99', function(callback) {
          return callback(null, 'foo');
        }, {
          autoMountOnSuccess: true
        }, function() {
          chai.expect(self.macmountStub).to.have.been.calledOnce;
          done();
        });
      });

    });

  });

});
