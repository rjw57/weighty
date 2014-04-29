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
          q: 'not trashed and properties has { key = \'isWeightySheet\' and value=\'true\' and visibility=\'PUBLIC\'}',
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

      // Try to create the new spreadsheet. Must be done through the raw request API.
      $window.gapi.client.request({
        path: 'drive/v2/files',
        method: 'POST',
        body: {
          'mimeType': 'application/vnd.google-apps.spreadsheet',
          'title': newName,
          'properties': [
            { key: 'isWeightySheet', value: true, visibility: 'PUBLIC' },
          ],
        },
        callback: function(response) {
          if(!response.kind || response.kind !== 'drive#file') { return; }
          console.log('dataset "' + newName + '" created...');
          $scope.$apply(function() { $scope.refreshList(); });
        }
      });
    };
  });
