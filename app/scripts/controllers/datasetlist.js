'use strict';

angular.module('webappApp')
  .controller('DatasetListCtrl', function ($scope, $log, $location, $window, gapi, dataset) {
    // Redirect to login if not logged in
    $scope.$watch('isSignedIn', function() {
      if($scope.isSignedIn) {
        // Refresh the list of spreadsheets
        $scope.refreshList();
      } else {
        $scope.datasets = [];
      }
    });

    $scope.refreshList = function() {
      $log.info('refeshing dataset list');
      dataset.list().then(function(datasets) {
        $scope.datasets = datasets;
      }, function(err) {
        $log.error('could not get dataset list:', err);
      });
    };

    $scope.submitNewDataset = function() {
      $scope.create($scope.newDataset.name);
      $scope.newDataset.name = null;
    };

    $scope.create = function(newName) {
      // Must have entered a name
      if(!newName || newName === '') { return; }

      gapi.load('fusiontables', 'v1').then(function(fusiontables) {
        fusiontables.table.insert({
          resource: {
            name: newName,
            columns: [
              {
                columnId: 0,
                name: 'Timestamp',
                type: 'NUMBER',
              },
              {
                columnId: 1,
                name: 'Weight',
                type: 'NUMBER',
              },
            ],
            isExportable: true,
            description: 'weighty record',
          },
        }).then(function(resp) {
          console.log('New dataset created', resp);
          console.log('Setting properties...');
          gapi.load('drive', 'v2').then(function(drive) {
            drive.files.update({
              fileId: resp.tableId,
              resource: {
                properties: [
                  { key: 'weightyVersion', value: 2, visibility: 'PUBLIC' },
                ],
              },
            }).then(function(resp) {
              console.log('Set properties on new dataset', resp);
              $scope.refreshList();
            }, function(err) {
              console.log('Error setting properties on new dataset', err);
            });
          });
        }, function(err) {
          console.log('Error creating table', err);
        });
      });
    };
  });
