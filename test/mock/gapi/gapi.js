// MOCK GAPI client
angular.module('gapi.client', []).service('gapi', function($q) {
  var client = this;

  client.isAuthorised = true;

  var mockFiles = { }, mockTables = { };

  client._injectFileResource = function(fileResource) {
    mockFiles[fileResource.id] = fileResource;
  };

  client._injectTableResource = function(tableResource, data) {
    mockTables[tableResource.tableId] = tableResource;
  };

  var mockDriveApi = {
    files: {
      get: function(opts) {
        if(!client.isAuthorised) {
          return $q.reject({
            error: { message: 'unauthorized' },
          });
        }

        if(!mockFiles[opts.fileId]) {
          return $q.reject({
            error: { message: 'no such ID' },
          });
        }

        var deferred = $q.defer();
        deferred.resolve(mockFiles[opts.fileId]);
        return deferred.promise;
      },
    },
  };

  var mockFustiontablesApi = {
    table: {
      get: function(opts) {
        if(!client.isAuthorised) {
          return $q.reject({
            error: { message: 'unauthorized' },
          });
        }

        if(!mockTables[opts.tableId]) {
          return $q.reject({
            error: { message: 'no such ID' },
          });
        }

        var deferred = $q.defer();
        deferred.resolve(mockTables[opts.tableId]);
        return deferred.promise;
      },
    },
  };

  client.load = function(name, version) {
    var deferred = $q.defer();

    if((name === 'fusiontables') && (version === 'v1')) {
      deferred.resolve(mockFustiontablesApi);
    } else if((name === 'drive') && (version === 'v2')) {
      deferred.resolve(mockDriveApi);
    } else {
      deferred.reject({
        error: { message: 'not implemented' },
      });
    }

    return deferred.promise;
  };
});
