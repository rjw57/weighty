'use strict';

describe('Service: dataset', function () {

  // load the service's module
  beforeEach(module('weightyApp'));

  // instantiate service
  var dataset, validId = 'validId', invalidId = 'invalidId',
    $rootScope;
  beforeEach(inject(function (_dataset_, _$rootScope_) {
      dataset = _dataset_;
      $rootScope = _$rootScope_;
  }));

  it('should be something', function () {
    expect(!!dataset).toBe(true);
  });

  it('should return a promise', function () {
    expect(dataset(validId).then).toBeDefined();
    expect(dataset(invalidId).then).toBeDefined();
  });

  it('should return a promise which is rejected on an invalid id', function () {
    var errorObj = undefined, datasetObj = undefined;
    var wasResolved = false, wasRejected = false;

    dataset(invalidId).then(function(obj) {
      wasResolved = true;
      datasetObj = obj;
    }, function(err) {
      wasRejected = true;
      errorObj = err;
    });

    $rootScope.$apply();

    expect(wasRejected).toBe(true);
    expect(wasResolved).toBe(false);

    expect(errorObj).not.toBeUndefined();
    expect(errorObj.error).not.toBeUndefined();
  });

  it('should return a promise which is resolved on a valid id', function () {
    var errorObj = undefined, datasetObj = undefined;
    var wasResolved = false, wasRejected = false;

    dataset(validId).then(function(obj) {
      wasResolved = true;
      datasetObj = obj;
    }, function(err) {
      wasRejected = true;
      errorObj = err;
    });

    $rootScope.$apply();

    expect(wasRejected).toBe(false);
    expect(wasResolved).toBe(true);

    expect(datasetObj).not.toBeUndefined();
  });
});
