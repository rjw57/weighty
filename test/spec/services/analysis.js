'use strict';

describe('Service: Analysis', function () {

  // load the service's module
  beforeEach(module('webappApp'));

  // instantiate service
  var Analysis;
  beforeEach(inject(function (_Analysis_) {
    Analysis = _Analysis_;
  }));

  it('should do something', function () {
    expect(!!Analysis).toBe(true);
  });

});
