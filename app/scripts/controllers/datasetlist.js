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

      dataset.insert({ title: newName }).then(function(newDataset) {
        $log.info('new dataset created');
        $scope.datasets.push(newDataset);
      }, function(err) {
        $log.error('error creating dataset:', err);
      });
    };
  });
