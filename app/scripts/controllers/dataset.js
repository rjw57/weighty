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

    // Add a new measurement
    $scope.submitNewMeasurement = function(measurement) {
      if(!$scope.verifiedDatasetId) { return; }
      $log.info('got new measurement:', measurement.weight);

      dataset.addRow({
        id: $scope.verifiedDatasetId,
        timestamp: Date.now(),
        weight: measurement.weight
      }).then(function() {
        $log.info('new measurement added');
        $scope.reloadDataset();
      }, function(err) {
        $log.error('error adding new measurement', err);
      });
    };

    // Load a dataset into the $scope.weights
    $scope.reloadDataset = function() {
      $log.info('(Re-)loading dataset', $scope.verifiedDatasetId);

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

    // Wait for login before verifying
    $scope.$watch('isSignedIn', function() {
      if(!$scope.isSignedIn) {
        $scope.verifiedDatasetId = null;
        return;
      }

      // Verify dataset
      $scope.loading = true;
      dataset.verifyDatasetId($routeParams.sheetId).then(function(dataset) {
        $log.info('dataset id ' + dataset.id + ' has been verified');
        $scope.verifiedDatasetId = dataset.id;
        $scope.name = dataset.title;
      }, function(err) {
        $log.error('Dataset failed verification:', err);
        $scope.loading = false;
      });
    });

    // When we have a verified dataset id, (re-)load it
    $scope.$watch('verifiedDatasetId', function() {
      $scope.reloadDataset();
    });

    // Watch for new weights and re-compute derived metrics
    $scope.$watch('weights', function() {
      $log.info('new weights available');
      $scope.goal = [];

      // Update cached start and current weights
      if(!$scope.weights || $scope.weights.length === 0) {
        return;
      }

      // HACK
      $scope.targetDate = new Date(Date.parse('Oct 01, 2014'));
      $scope.targetWeight = 77;
      $log.info('target date: ' + $scope.targetDate);
      $log.info('target weight: ' + $scope.targetWeight);

      $scope.startWeight = $scope.weights[0].weight;
      $scope.currentWeight = $scope.weights[$scope.weights.length-1].weight;
      $scope.progress = 1 -
        ($scope.currentWeight-$scope.targetWeight) / ($scope.startWeight-$scope.targetWeight);

      var currentDate = Date.now() + 31*DAYS;
      var startDate = $scope.weights[0].date.getTime(),
        endDate = $scope.weights[$scope.weights.length - 1].date.getTime(),
        targetDate = $scope.targetDate.getTime(),
        startLogWeight = Math.log($scope.startWeight),
        targetLogWeight = Math.log($scope.targetWeight);

      var lastPlotDate = Math.max(currentDate, targetDate);
      // var lastPlotDate = Math.min(currentDate, targetDate);

      var t, lambda;

      // Get list of weights where date is less than 10 days in the past and
      // form matrices X and y where y is a list of log weights and rows of X are
      // [date 1]. This is in preparation for least squares optimisation.
      var y = [], X = [], XtX, Xty, b, fitWeight;
      angular.forEach($scope.weights, function(w) {
        fitWeight = Math.exp(-Math.max(0, endDate - w.date.getTime()) / (14*DAYS));
        y.push(fitWeight * Math.log(w.weight));
        X.push([fitWeight * w.date.getTime(), fitWeight]);
      });

      $scope.trend = null;
      if(y.length > 6) {
        // Least squares solution is b where (X' X) b = X' y
        XtX = numeric.dot(numeric.transpose(X), X);
        Xty = numeric.dot(numeric.transpose(X), y);
        b = numeric.solve(XtX, Xty);

        // Update trend
        $scope.trend = [];
        for(t = Math.max(startDate, endDate-14*DAYS); t <= lastPlotDate; t += Math.min(DAYS, (targetDate-startDate) / 100)) {
          $scope.trend.push({
            date: new Date(t),
            weight: Math.exp(b[0]*t + b[1]),
          });
          if($scope.trend[$scope.trend.length - 1].weight < $scope.targetWeight) { break; }
        }
      }

      // Update goal
      for(t = startDate; t <= lastPlotDate; t += Math.min(DAYS, (targetDate-startDate) / 100)) {
        lambda = (t - startDate) / (targetDate - startDate);
        $scope.goal.push({
          date: new Date(t),
          weight: Math.exp(lambda * targetLogWeight + (1-lambda) * startLogWeight),
        });
      }
    });
  });
