'use strict';

angular.module('webappApp')
  .controller('DatasetCtrl', function ($scope, $routeParams, $http, $document, $q, gapi) {
    // useful constants
    var DAYS = 1000*60*60*24;

    $scope.loaded = false;
    $scope.loading = false;

    // We need a sheet id to continue
    if(!$routeParams.sheetId) {
      return;
    }

    var verifyViaDriveApi = function(id) {
      // Use the drive Api to verify that the tableId matches a file with the
      // right properties. Return a promise which is fulfilled by a verification
      // and is passed the id.
      var deferred = $q.defer();
      console.log('verifying against drive API');

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
          console.log('Drive file did not have expected property');
          deferred.reject(file.properties);
        }, function(err) {
          console.log('Error verifying table via drive Api:', err);
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
      console.log('verifying againset fusiontables API');

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
            console.log('Error verifying table via fusiontables API; incorrect columns');
            deferred.reject(table.columns);
          }
        }, function(err) {
          console.log('Error verifying table via fusiontables Api:', err);
          deferred.reject(err);
        });
      });

      return deferred.promise;
    };

    // Wait for login before verifying
    $scope.$watch('isSignedIn', function() {
      $scope.datasetId = null;

      if(!$scope.isSignedIn) { return; }

      // We need both drive and fusiontable verification to pass
      var id = $routeParams.sheetId;
      $q.all({
        drive: verifyViaDriveApi(id),
        fusiontables: verifyViaFusionTablesApi(id)
      }).then(function(ids) {
        if(!ids.drive || !ids.fusiontables || ids.drive.id !== ids.fusiontables.tableId) {
          console.log('dataset id failed verification');
          return;
        }

        console.log('dataset id is verified');
        $scope.datasetId = ids.drive.id;
        $scope.name = ids.drive.title;
      }, function(err) {
        console.log('dataset id failed verification:', err);
      });
    });

    $scope.$watch('datasetId', function() {
      $scope.refresh();
    });

    $scope.refresh = function() {
      console.log('Refreshing dataset', $scope.datasetId);

      if(!$scope.datasetId) { return; }

      gapi.load('fusiontables', 'v1').then(function(fusiontables) {
        // We directly paste the datasetId into the SQL statement here which is
        // a somewhat dangerous procedure. Hence the rather elaborate verification of
        // the id we got from the URL.
        fusiontables.query.sqlGet({
          sql: 'SELECT Timestamp, Weight FROM ' + $scope.datasetId + ' ORDER BY Timestamp',
        }).then(function(resp) {
          // And finally we can update the records
          $scope.weights = [];
          angular.forEach(resp.rows, function(row) {
            $scope.weights.push({
              timestamp: row[0],
              weight: row[1],
              date: new Date(row[0]),
            });
          });
          $scope.loaded = true;
        }, function(err) {
          console.log('Dataset fetch failed:', err);
        });
      });
    };

    $scope.$watch('weights', function() {
      $scope.goal = [];

      // Update cached start and current weights
      if(!$scope.weights || $scope.weights.length === 0) {
        return;
      }

      // HACK
      $scope.targetDate = new Date($scope.weights[0].date.getTime() + 100*DAYS);
      $scope.targetWeight = 100;

      $scope.startWeight = $scope.weights[0].weight;
      $scope.currentWeight = $scope.weights[$scope.weights.length-1].weight;
      $scope.progress = 1 -
        ($scope.currentWeight-$scope.targetWeight) / ($scope.startWeight-$scope.targetWeight);

      var startDate = $scope.weights[0].date.getTime(),
        targetDate = $scope.targetDate.getTime(),
        startLogWeight = Math.log($scope.startWeight),
        targetLogWeight = Math.log($scope.targetWeight);

      // Update goal
      for(var t = startDate; t <= targetDate; t += Math.min(DAYS, (targetDate-startDate) / 100)) {
        var lambda = (t - startDate) / (targetDate - startDate);
        $scope.goal.push({
          date: new Date(t),
          weight: Math.exp(lambda * targetLogWeight + (1-lambda) * startLogWeight),
        });
      }
    });
  });
