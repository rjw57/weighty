'use strict';

angular.module('webappApp')
  .controller('DatasetCtrl', function ($scope, $routeParams, $log, dataset) {
    // useful constants
    var DAYS = 1000*60*60*24;

    // True iff we're currently loading a dataset
    $scope.loading = false;

    // We need a sheet id to continue
    if(!$routeParams.sheetId) {
      return;
    }

    // Wait for login before verifying
    $scope.$watch('isSignedIn', function() {
      if(!$scope.isSignedIn) {
        $scope.verifiedDatasetId = null;
        return;
      }

      // Verify dataset
      $scope.loading = true;
      dataset.verifyDatasetId($routeParams.sheetId).then(function(resources) {
        $log.info('dataset id ' + resources.verifiedId + ' has been verified');
        $scope.verifiedDatasetId = resources.verifiedId;
        $scope.name = resources.driveFile.title;
      }, function(err) {
        $log.error('Dataset failed verification:', err);
        $scope.loading = false;
      });
    });

    // When we have a verified dataset id, (re-)load it
    $scope.$watch('verifiedDatasetId', function() {
      $scope.reloadDataset();
    });

    // Load a dataset into the $scope.weights
    $scope.reloadDataset = function() {
      console.log('(Re-)loading dataset', $scope.verifiedDatasetId);

      if(!$scope.verifiedDatasetId) {
        $scope.weights = [];
        return;
      }

      $scope.loading = true;
      dataset.get($scope.verifiedDatasetId).then(function(weights) {
        $scope.weights = weights;
        $scope.loading = false;
      }, function(err) {
        $log.error('Could not get dataset:', err);
      });
    };

    // Watch for new weights and re-compute derived metrics
    $scope.$watch('weights', function() {
      $log.info('new weights available:', $scope.weights);
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
