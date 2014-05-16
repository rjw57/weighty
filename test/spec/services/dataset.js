'use strict';

describe('Service: dataset', function () {

  // load the service's module
  beforeEach(module('weightyApp'));

  // instantiate service
  var $rootScope, dataset, validId = 'validId', invalidId = 'invalidId';
  beforeEach(inject(function (_dataset_, _$rootScope_, gapi) {
      dataset = _dataset_;
      $rootScope = _$rootScope_;

      gapi._injectFileResource({
        id: validId,
        title: 'my dataset',
        properties: [{
          key: 'weightyVersion',
          value: '2',
        }],
        createdDate: new Date(1400254308997).toString(),
        modifiedDate: new Date(1400254308997).toString(),
      });

      gapi._injectTableResource({
        tableId: validId,
        title: 'my dataset',
        columns: [{
          name: 'Weight',
          type: 'NUMBER',
        }, {
          name: 'Timestamp',
          type: 'NUMBER',
        }],
      });
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

  describe('getting a valid dataset', function() {
    var validDataset;

    beforeEach(function() {
      dataset(validId).then(function(obj) {
        validDataset = obj;
      });
      $rootScope.$apply();
    });

    it('should be something', function () {
      expect(!!validDataset).toBe(true);
    });

    it('should have a title', function () {
      expect(!!validDataset.title).toBe(true);
    });

    it('should have a metadata object', function () {
      expect(!!validDataset.metadata).toBe(true);
    });
  });
});
