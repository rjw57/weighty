'use strict';

angular.module('webappApp')
  .controller('DatasetCtrl', function ($scope, $routeParams, $log, $filter, dataset, Analysis) {
    // useful constants
    var DAYS = 1000*60*60*24;
    // var IDEAL_BMI = 22;
    var WEIGHT_COLOR = '#428bca'/*, GOAL_COLOR = '#5cb85c'*/;

    // We need a sheet id to continue
    if(!$routeParams.sheetId) {
      return;
    }

    //// SCOPE VALUES

    // HACK: hardcoded
    $scope.target = {
      date: new Date(Date.parse('Oct 01, 2014')),
      weight: 75,
    };

    // Metabolic genders
    $scope.sexes = [
      { value: 'male', text: 'Male' },
      { value: 'female', text: 'Female' },
    ];

    $scope.nameSex = function(sex) {
      var selected = $filter('filter')($scope.sexes, { value: sex });
      return (sex && selected.length) ? selected[0].text : null;
    };

    // Config for the weight chart
    $scope.weightChartConfig = {
      options: {
        chart: {
          zoomType: 'x',
          spacing: [5, 0, 10, 0],
        },
        title: {
          text: null,
        },
        exporting: {
          buttons: {
            contextButton: { enabled: false },
          },
        },
        xAxis: {
          type: 'datetime',
          endOnTick: false,
          minPadding: 0,
          maxPadding: 0,
          minRange: 14 * 24 * 3600000, // fortnight
        },
        yAxis : {
          title: {
            text: null,
          },
          startOnTick: false,
          endOnTick: true,
          minPadding: 0,
          maxPadding: 0,
          gridLineColor: '#DDD',
          labels: {
            formatter: function() {
              return Highcharts.numberFormat(this.value, 0) +
                '&nbsp;<span class="unit">kg</span>';
            },
            useHTML: true,
          },
        },
        tooltip: {
          valueDecimals: 1,
          valueSuffix: 'kg',
        },
      },

      series: [{
        name: 'Weight',
        id: 'weight',
        data: [],
        zIndex: 4,
        color: WEIGHT_COLOR,
        marker: { enabled: false },
      }, {
        name: 'Trend',
        id: 'trend',
        data: [],
        zIndex: 1,
        dashStyle: 'Dash',
        color: WEIGHT_COLOR,
        lineWidth: 1,
        marker: { enabled: false },
      }, {
        name: 'Trend Range',
        id: 'trend-range',
        data: [],
        type: 'arearange',
        zIndex: 0,
        color: WEIGHT_COLOR,
        lineWidth: 0,
        fillOpacity: 0.3,
        linkedTo: 'trend',
      }],
    };

    // Derived statistics from data and metadata (personal details)
    $scope.stats = { };

    //// SCOPE ACTIONS

    $scope.open = function($event,opened) {
      $event.preventDefault();
      $event.stopPropagation();
      $scope[opened] = true;
    };

    // Add a new measurement
    $scope.submitNewMeasurement = function(measurement) {
      if(!$scope.dataset.id) { return; }
      $log.info('got new measurement:', measurement.weight);

      dataset.addRow({
        id: $scope.dataset.id,
        timestamp: Date.now(),
        weight: measurement.weight
      }).then(function() {
        $log.info('new measurement added');
        $scope.$emit('alertMessage', {
          type: 'success',
          message: 'Successfully added measurement.'
        });
        reloadDataset();
      }, function(err) {
        $scope.$emit('alertMessage', {
          type: 'danger',
          message: 'Error adding measurement.',
        });
        $log.error('error adding new measurement', err);
      });
    };

    //// WATCH FUNCTIONS

    // Wait for login before verifying
    $scope.$watch('isSignedIn', function() {
      // If not signed in, remove current dataset
      if(!$scope.isSignedIn) {
        $scope.dataset = undefined;
        return;
      }

      // Otherwise, verify dataset
      dataset.verifyDatasetId($routeParams.sheetId).then(function(dataset) {
        $log.info('dataset id ' + dataset.id + ' has been verified');
        $scope.dataset = dataset;
      }, function(err) {
        $log.error('Dataset failed verification:', err);
      });
    });

    // When dataset *id* changes, reload weight data
    $scope.$watch('dataset.id', function() {
      reloadDataset();
    });

    // watch for new weights and update trend data
    $scope.$watch(
      '{ weightData: weightData, target: target }',
      function(newVal) {
        var t, regressPoints, startDate, endDate, regression, bootstrapRegression;
        var trendWeight, trendBootstrapWeight, trendMin, trendMax, trendDatum;
        var weightData = newVal.weightData, target = newVal.target;

        $scope.trend = { };

        if(!weightData || (weightData.length < 1) || !target ) { return; }

        startDate = weightData[0].date.getTime();
        endDate = weightData[weightData.length - 1].date.getTime();

        // Regress weights weighted to start of data
        regressPoints = [];
        angular.forEach(weightData, function(datum) {
          regressPoints.push({
            x: datum.date.getTime(),
            y: Math.log(datum.weight),
            w: Math.exp(-Math.max(0, datum.date.getTime() - startDate) / (14*DAYS)),
          });
        });

        $scope.trend.startValue = Math.exp(Analysis.evaluateRegression(
            Analysis.regress(regressPoints), startDate));

        // Regress weights weighted to end of data
        regressPoints = [];
        angular.forEach(weightData, function(datum) {
          regressPoints.push({
            x: datum.date.getTime(),
            y: Math.log(datum.weight),
            w: Math.exp(-Math.max(0, endDate - datum.date.getTime()) / (14*DAYS)),
          });
        });
        regression = Analysis.regress(regressPoints);
        bootstrapRegression = Analysis.regressBootstrap(regressPoints);

        $scope.trend.endValue = Math.exp(Analysis.evaluateRegression(
            Analysis.regress(regressPoints), endDate));

        // Abort if regression failed
        if(!regression.m) { return; }

        // Record trend data
        $scope.trend.data = [];
        for(t = Math.max(startDate, endDate-7*DAYS); t <= target.date.getTime();
            t += Math.min(DAYS, (target.date.getTime()-startDate) / 100))
        {
          trendWeight = Math.exp(Analysis.evaluateRegression(regression, t));
          trendBootstrapWeight = Analysis.evaluateBootstrapRegression(bootstrapRegression, t);
          trendMin = Math.exp(trendBootstrapWeight.mu - 3*trendBootstrapWeight.sigma);
          trendMax = Math.exp(trendBootstrapWeight.mu + 3*trendBootstrapWeight.sigma);

          trendDatum = {
            timestamp: t,
            min: trendMin,
            max: trendMax,
            value: trendWeight,
          };

          $scope.trend.data.push(trendDatum);
        }

        // Record trend value for "now"
        $scope.trend.nowValue = Math.exp(Analysis.evaluateRegression(regression, Date.now()));
      },
      true
    );

    // update progress given trend and target
    $scope.$watch('{ target: target, trend: trend }', function(newVal) {
      var trend = newVal.trend, target = newVal.target;

      if(!trend || !target) {
        $scope.stats.progress = undefined;
        return;
      }

      $scope.stats.progress = 1 - (trend.endValue-target.weight) / (trend.startValue-target.weight);
    }, true);

    // update derived statistics when metadata and/or data change
    $scope.$watch(
      '{ height: dataset.metadata.height, weight: trend.nowValue }',
      function(newVal) {
        // Do nothing if we don't have the basic data
        if(!newVal.height || !newVal.weight) {
          $scope.stats.bmi = undefined;
          return;
        }

        // BMI requires height
        $scope.stats.bmi = calculateBMI(newVal.weight, newVal.height);
      },
      true // <- do deep compare of watch expression
    );

    $scope.$watch(
      '{ metadata: dataset.metadata, weight: trend.nowValue }',
      function(newVal) {
        var bmr;

        // Do nothing if we don't have the basic data
        if(!newVal.metadata || !newVal.weight || !newVal.metadata.height ||
            !newVal.metadata.sex || !newVal.metadata.birthDate) {
          $scope.stats.bmr = undefined;
          return;
        }

        // The Mifflin St Jeor Equation
        bmr = (10 * newVal.weight) + (6.25 * 100 * newVal.metadata.height) -
          (5 * (Date.now() - Date.parse(newVal.metadata.birthDate))/(365.25 * DAYS));

        if(newVal.metadata.sex === 'male') {
          bmr += 5;
        } else if(newVal.metadata.sex === 'female') {
          bmr -= 161;
        }

        $scope.stats.bmr = bmr;
      },
      true // <- do deep compare of watch expression
    );

    // watch for new series data and update graph
    $scope.$watch('{ weight: weightData, trend: trend, target: target }', function(newVal) {
      angular.forEach($scope.weightChartConfig.series, function(series) {
        if(series.id === 'weight') {
          series.data = [];
          angular.forEach(newVal.weight, function(datum) {
            series.data.push([datum.date.getTime(), datum.weight]);
          });
        } else if(series.id === 'trend') {
          series.data = [];
          angular.forEach(newVal.trend.data, function(datum) {
            if(datum.value >= newVal.target.weight) {
              series.data.push([datum.timestamp, datum.value]);
            }
          });
        } else if(series.id === 'trend-range') {
          series.data = [];
          angular.forEach(newVal.trend.data, function(datum) {
            if((datum.min >= newVal.target.weight) || (datum.max >= newVal.target.weight)) {
              series.data.push([
                datum.timestamp,
                Math.max(newVal.target.weight, datum.min),
                Math.max(newVal.target.weight, datum.max),
              ]);
            }
          });
        }
      });
    }, true);

    // patch dataset if metadata changes
    $scope.$watch('dataset.metadata', function(newVal, oldVal) {
      // Don't do anything if metadata is unset or there was no previous value
      if(!newVal || !oldVal) { return; }

      dataset.patch($scope.dataset.id, {
        metadata: newVal,
      }).then(function() {
        $scope.$emit('alertMessage', { type: 'success', message: 'Updated personal data' });
      });
    }, true);

    //// UTILITY FUNCTIONS

    var calculateBMI = function(weight, height) {
      var bmi = weight / (height * height), bmiCategory;

      if(bmi < 15) {
        bmiCategory = 'very severely underweight';
      } else if(bmi < 16) {
        bmiCategory = 'severely underweight';
      } else if(bmi < 18.5) {
        bmiCategory = 'underweight';
      } else if(bmi < 25) {
        bmiCategory = 'normal';
      } else if(bmi < 30) {
        bmiCategory = 'overweight';
      } else if(bmi < 35) {
        bmiCategory = 'moderately obese';
      } else if(bmi < 40) {
        bmiCategory = 'severely obese';
      } else {
        bmiCategory = 'vary severely obese';
      }

      return { value: bmi, description: bmiCategory };
    };

    // Load a dataset into the $scope.weightData
    var reloadDataset = function() {
      $scope.weightData = undefined;
      if(!$scope.dataset) { return; }

      $log.info('(Re-)loading dataset', $scope.dataset.id);

      dataset.getData($scope.dataset.id).then(function(resp) {
        $scope.weightData = resp;
      }, function(err) {
        $log.error('Could not get dataset:', err);
      });
    };
  });
