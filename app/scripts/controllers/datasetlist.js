'use strict';

angular.module('webappApp')
  .controller('DatasetListCtrl', function ($scope, $location, $window, gapi) {
    $scope.items = [];

    // Redirect to login if not logged in
    $scope.$watch('isSignedIn', function() {
      // Refresh the list of spreadsheets
      $scope.refreshList();
    });

    $scope.refreshList = function() {
      $scope.items = [];

      // Only look for weighty sheets
      console.log('Searching for weighty files...');

      gapi.load('drive', 'v2').then(function(drive) {
        drive.files.list({
          q: 'not trashed and properties has { key = \'weightyVersion\' and value=\'2\' and visibility=\'PUBLIC\'}',
        }).then(function(data) {
          if(data.kind !== 'drive#fileList') { return; }
          console.log('dataset list', data);
          $scope.items = [];
          angular.forEach(data.items, function(item) {
            $scope.items.push({
              title: item.title,
              id: item.id,
              createdDate: Date.parse(item.createdDate),
              modifiedDate: Date.parse(item.modifiedDate),
            });
          });
        });
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
                type: 'DATETIME',
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

      // Try to create the new fusiontable.
      /*
      gapi.load('drive', 'v2').then(function(drive) {
        drive.files.insert({
          resource: {
            'mimeType': 'application/vnd.google-apps.fusiontable',
            'title': newName,
            'properties': [
            ],
          },
        }).then(function(response) {
          if(!response.kind || response.kind !== 'drive#file') { return; }
          console.log('dataset "' + newName + '" created...');
          $scope.refreshList();
        }, function(err) {
          console.log('error creating new dataset:', err);
        });
      });
      */
    };
  });
