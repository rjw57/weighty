'use strict';

angular.module('webappApp')
  // A service for retrieving, verifying and modifying datasets
  .service('dataset', function ($log, $q, gapi) {
    // Return a promise which is resolved with an object of the following form:
    //
    // {
    //   datasets: [],    // array of Dataset resources
    // }
    //
    // Each Dataset resource is an object of the following form:
    //
    // {
    //   kind: 'weighty#Dataset',
    //   id: <string>,          // opaque dataset id
    //   title: <string>,       // human-friendly name for dataset
    //   createdDate: <Date>    // date on which dataset was created
    //   modifiedDate: <Date>   // date on which dataset was last modified
    //   metadata: {
    //     version: 1,          // version of weighty metadata
    //     height: <number>,    // user's height in metres (optional)
    //   },
    // }
    this.list = function() {
      // how to find weighty files
      var searchQuery =
          'not trashed and properties has ' +
            '{ key = \'weightyVersion\' and value = \'2\' and visibility=\'PUBLIC\'}';
      return gapi.load('drive', 'v2').then(function(drive) {
        return drive.files.list({ q: searchQuery }).then(function(data) {
          if(data.kind !== 'drive#fileList') { return; }
          var datasets = [];
          angular.forEach(data.items, function(driveFile) {
            datasets.push(datasetResourceFromDriveFile(driveFile));
          });
          return datasets;
        });
      });
    };

    // Given a dataset id verify the dataset a) exists and b) has our required
    // metadata. This is done through both the drive and fusiontables API. Use
    // this method to verify an untrusted dataset id from user input or URL
    // parameters. Returns a promise which is resolved if the validation
    // succeeds with a Dataset resource. (See dataset.list().)
    //
    // verifiedId: the verified dataset id
    // driveFile: the File resource returned by the drive API
    // fusiontablesTable: the Table resource returned by the fusiontables API
    this.verifyDatasetId = function(untrustedId) {
      return $q.all({
        driveFile: verifyViaDriveApi(untrustedId),
        fusiontablesTable: verifyViaFusionTablesApi(untrustedId)
      }).then(function(resources) {
        if(!resources.driveFile) {
          return $q.reject('Dataset id does not validate via the drive API');
        } else if(!resources.fusiontablesTable) {
          return $q.reject('Dataset id does not validate via the fusiontables API');
        } else if(resources.driveFile.id !== resources.fusiontablesTable.tableId) {
          // This almost certainly shouldn't happen but check anyway.
          return $q.reject('Dataset id is different between drive and fusiontables API');
        }

        // OK, id checked out
        return datasetResourceFromDriveFile(resources.driveFile);
      });
    };

    // Given a (verified) dataset id, return a promise which is resolved with
    // an array of { weight, timestamp, date } objects loaded from the dataset.
    // The promise is rejected if there is an error retrieving the data.
    //
    // IMPORTANT: The id from this is *directly* pasted into a fusiontables SQL
    // call. DO NOT pass an id to this function which has not been verified
    // first via verifyDatasetId.
    this.get = function(verifiedDatasetId) {
      if(!verifiedDatasetId) {
        return $q.reject('passed an invalid or null dataset id');
      }

      return gapi.load('fusiontables', 'v1').then(function(fusiontables) {
        // We directly paste the dataset id into the SQL statement here which is
        // a somewhat dangerous procedure. Hence the need for verification.
        return fusiontables.query.sqlGet({
          sql: 'SELECT Timestamp, Weight FROM ' + verifiedDatasetId + ' ORDER BY Timestamp',
        }).then(function(resp) {
          // And finally we can update the records
          var weights = [];
          angular.forEach(resp.rows, function(row) {
            weights.push({
              timestamp: row[0],
              weight: row[1],
              date: new Date(row[0]),
            });
          });
          return weights;
        });
      });
    };

    // INTERNAL FUNCTIONS

    var datasetResourceFromDriveFile = function(driveFile) {
      var metadata = {};
      angular.forEach(driveFile.properties, function(property) {
        if(property.key === 'weightyMetadata') {
          metadata = JSON.parse(property.value);
        }
      });

      return {
        title: driveFile.title,
        id: driveFile.id,
        createdDate: Date.parse(driveFile.createdDate),
        modifiedDate: Date.parse(driveFile.modifiedDate),
        metadata: metadata,
      };
    };

    var verifyViaDriveApi = function(id) {
      // Use the drive Api to verify that the tableId matches a file with the
      // right properties. Return a promise which is fulfilled by a verification
      // and is passed the id.
      var deferred = $q.defer();
      $log.info('verifying against drive API');

      gapi.load('drive', 'v2').then(function(drive) {
        drive.files.get({ fileId: id }).then(function(file) {
          var isValid = false;

          // check the properties
          angular.forEach(file.properties, function(property) {
            if(property.key !== 'weightyVersion' || property.value !== '2') { return; }
            isValid = true;
          });

          if(isValid) {
            // success!
            deferred.resolve(file);
            return;
          }

          // failure :(
          $log.error('Drive file did not have expected property');
          deferred.reject(file.properties);
        }, function(err) {
          $log.error('Error verifying table via drive Api:', err);
          deferred.reject(err);
        });
      });

      return deferred.promise;
    };

    var verifyViaFusionTablesApi = function(id) {
      // Perform an initial "get" of the table to verify the tableId which has
      // been pulled straight from the URL. If we succeed in getting the table,
      // check that there is are "Timestamp" and "Weight" columns.
      var deferred = $q.defer();
      $log.info('verifying againset fusiontables API');

      gapi.load('fusiontables', 'v1').then(function(fusiontables) {
        fusiontables.table.get({ tableId: id }).then(function(table) {
          var hasWeight = false, hasTimestamp = false;
          angular.forEach(table.columns, function(column) {
            if(column.name === 'Weight' && column.type === 'NUMBER') {
              hasWeight = true;
            } else if(column.name === 'Timestamp' && column.type === 'NUMBER') {
              hasTimestamp = true;
            }
          });

          if(hasWeight && hasTimestamp) {
            deferred.resolve(table);
          } else {
            $log.error('Error verifying table via fusiontables API; incorrect columns');
            deferred.reject(table.columns);
          }
        }, function(err) {
          $log.error('Error verifying table via fusiontables Api:', err);
          deferred.reject(err);
        });
      });

      return deferred.promise;
    };
  });
