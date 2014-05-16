'use strict';

angular.module('weightyApp')
  .factory('dataset', function ($q) {
    return function(datasetId) {
      var deferred = $q.defer();

      // HACK: testing
      if(datasetId === 'validId') {
        deferred.resolve({
          name: 'test dataset',
        });
      } else {
        deferred.reject({
          error: { message: 'not implemented' },
        });
      }

      return deferred.promise;
    };
  });
