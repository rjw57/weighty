'use strict';

angular.module('webappApp')
  .controller('DatasetListCtrl', function ($scope, $location, $window) {
    $scope.items = [];

    // Redirect to login if not logged in
    $scope.$watch('isSignedIn', function() {
      // Refresh the list of spreadsheets
      $scope.refreshList();
    });

    $scope.refreshList = function() {
      $scope.items = [];

      // Only look for weightly sheets
      $window.gapi.client.request({
        path: 'drive/v2/files',
        params: {
          q: 'not trashed and properties has { key = \'isWeightySheet\' and value=\'true\' and visibility=\'PUBLIC\'}',
        },
        callback: function(data) {
          if(data.kind !== 'drive#fileList') { return; }
          console.log('dataset list', data);
          $scope.$apply(function() {
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
        },
      });
    };

    $scope.create = function() {
      // Must have entered a name
      if(!$scope.datasetName || $scope.datasetName === '') { return; }

      // Try to create the new spreadsheet
      $window.gapi.client.request({
        path: 'drive/v2/files',
        method: 'POST',
        body: {
          'mimeType': 'application/vnd.google-apps.spreadsheet',
          'title': $scope.datasetName,
          'properties': [
            { key: 'isWeightySheet', value: true, visibility: 'PUBLIC' },
          ],
        },
        callback: function(data) {
          console.log('create', data);
          $scope.refreshList();
        }
      });

      // Reset name
      $scope.datasetName = '';
    };
  });
