'use strict';

angular.module('weightyApp')
  .factory('dataset', function ($q, $log, gapi) {

    // The actual factory function which loads a dataset from
    // a dataset id and resolves a promise with the dataset object
    var loadDataset = function(datasetId) {
      return $q.all({
        driveFile: verifyViaDriveApi(datasetId),
        fusiontablesTable: verifyViaFusionTablesApi(datasetId)
      }).then(function(resources) {
        if(!resources.driveFile) {
          return $q.reject({
            error: { message: 'Dataset id does not validate via the drive API' },
          });
        } else if(!resources.fusiontablesTable) {
          return $q.reject({
            error: { message: 'Dataset id does not validate via the fusiontables API' },
          });
        } else if(resources.driveFile.id !== resources.fusiontablesTable.tableId) {
          // This almost certainly shouldn't happen but check anyway.
          return $q.reject({
            error: { message: 'Dataset id is different between drive and fusiontables API' },
          });
        }

        // OK, id checked out
        return datasetResourceFromDriveFile(resources.driveFile);
      });
    };

    // INTERNAL FUNCTIONS //

    var datasetResourceFromDriveFile = function(driveFile) {
      var metadata = {};
      angular.forEach(driveFile.properties, function(property) {
        if(property.key === 'weightyMetadata') {
          try {
            metadata = JSON.parse(property.value);
          } catch(err) {
            $log.warn('ignoring invalid JSON in weighty metadata', err);
            $log.warn('metadata was "' + property.value + '"');
          }
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

    return loadDataset;
  });
