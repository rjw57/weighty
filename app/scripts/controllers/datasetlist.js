'use strict';

angular.module('webappApp')
  .controller('DatasetListCtrl', function ($scope, $location, GoogleApi) {
    $scope.items = [];

    // Redirect to login if not logged in
    $scope.$watch('accessToken', function() {
      if(!$scope.accessToken) {
        $location.path('/login');
        $location.replace();
        return;
      }

      // Refresh the list of spreadsheets
      $scope.refreshList();
    });

    $scope.refreshList = function() {
      if(!$scope.accessToken) { return; }

      // Only look for weightly sheets
      GoogleApi.get('https://www.googleapis.com/drive/v2/files', {
          params: {
            q: 'not trashed and properties has { key = \'isWeightySheet\' and value=\'true\' and visibility=\'PUBLIC\'}',
          },
        }).success(function(data) {
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
    };

    $scope.create = function() {
      // Must be logged in
      if(!$scope.accessToken) { return; }

      // Must have entered a name
      if(!$scope.datasetName || $scope.datasetName === '') { return; }

      // Try to create the new spreadsheet
      GoogleApi.post('https://www.googleapis.com/drive/v2/files', {
        'mimeType': 'application/vnd.google-apps.spreadsheet',
        'title': $scope.datasetName,
        'properties': [
          { key: 'isWeightySheet', value: true, visibility: 'PUBLIC' },
        ],
      })
      .success(function() {
        $scope.refreshList();
      });

      // Reset name
      $scope.datasetName = '';
    };
  });
