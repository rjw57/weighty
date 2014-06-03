'use strict';

angular.module('webappApp')
  .controller('DatasetCtrl', function ($scope, $routeParams, $log, $filter, dataset, Analysis) {
    // useful constants
    var DAYS = 1000*60*60*24;
    var IDEAL_BMI = 22;
    var WEIGHT_COLOR = '#428bca', GOAL_COLOR = '#5cb85c';

    // We need a sheet id to continue
    if(!$routeParams.sheetId) {
      return;
    }

    //// SCOPE VALUES

    $scope.target = { };
    $scope.netCalories = 200; // kcal/day

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
          spacing: [10, 0, 10, 0],
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
        name: 'Goal',
        id: 'goal',
        data: [],
        zIndex: 3,
        color: GOAL_COLOR,
        dashStyle: 'Dash',
        lineWidth: 2,
        marker: { enabled: false },
      }, {
        name: 'Trend',
        id: 'trend',
        data: [],
        zIndex: 1,
        dashStyle: 'Dash',
        color: WEIGHT_COLOR,
        lineWidth: 2,
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
        var lastPlotDate = endDate + 31*DAYS;

        if(target.weight) {
          lastPlotDate = (Math.log(target.weight) - regression.c) / regression.m;
          $scope.trend.finishDate = new Date(Math.max(lastPlotDate, endDate));

          // No less than a month from end measurement
          lastPlotDate = Math.max(lastPlotDate, endDate + 31*DAYS);

          // No more than six months from end measurement
          lastPlotDate = Math.min(lastPlotDate, endDate + 6*31*DAYS);
        }

        if(target.date) {
          lastPlotDate = target.date.getTime();
        }

        for(t = Math.max(startDate, endDate-7*DAYS); t <= lastPlotDate;
            t += Math.min(DAYS, (lastPlotDate-startDate) / 100))
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
          $scope.stats.bmiBoundaries = undefined;
          return;
        }

        // BMI requires height
        $scope.stats.bmi = calculateBMI(newVal.weight, newVal.height);

        // Compute ideal weight from BMI
        $scope.stats.idealWeight = IDEAL_BMI * (newVal.height * newVal.height);

        // Compute boundaries for BMI
        $scope.stats.bmiBoundaries = [
          18.5 * newVal.height * newVal.height, // underweight -> healthy
          25 * newVal.height * newVal.height, // healthy -> overweight
          30 * newVal.height * newVal.height, // overweight -> obese
        ];

        // HACK
        $scope.target.weight = $scope.stats.idealWeight;
      },
      true // <- do deep compare of watch expression
    );

    $scope.$watch('stats.bmiBoundaries', function(boundaries) {
      var underweightColor = '#fffff0',
        healthyColor = '#f0fff0',
        overweightColor = '#fffff0',
        obeseColor = '#fff0f0';

      if(!boundaries || (boundaries.length < 3)) {
        if($scope.weightChartConfig.yAxis) {
          $scope.weightChartConfig.yAxis.plotBands = null;
        }
        return;
      }

      $scope.weightChartConfig.yAxis.plotBands = [{
        color: underweightColor,
        from: -Infinity,
        to: boundaries[0],
        label: {
          text: 'underweight',
          style: {
            opacity: 0.33,
          },
        },
      }, {
        color: healthyColor,
        from: boundaries[0],
        to: boundaries[1],
        label: {
          text: 'healthy',
          style: {
            opacity: 0.33,
          },
        },
      }, {
        color: overweightColor,
        from: boundaries[1],
        to: boundaries[2],
        label: {
          text: 'overweight',
          style: {
            opacity: 0.33,
          },
        },
      }, {
        color: obeseColor,
        from: boundaries[2],
        to: Infinity,
        label: {
          text: 'obese',
          style: {
            opacity: 0.33,
          },
        },
      }];

      $log.info('options', $scope.weightChartConfig);
    }, true);

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

    // The goal is based on a net input kilocalories per day figure stored in
    // $scope.netCalories. Call this value P_n when rescaled to be kcal/second.
    // Time is measured in seconds since start, weight in kilogrammes and
    // height in metres.
    //
    // The Mifflin St Jeor Equation gives Basal Metabolic Rate, P_m as
    //
    // P_m = k_1 m(t) + k_2 h - k_3 (t-t_0) + k_4) [ kcal/sec ]
    //
    // where m(t) is body mass at time t, h is height and t_0 is birth time.
    // (Not that t_0 will be -ve.) The overall power input (-ve being deficit) is
    //
    // P = P_n - P_m [kcal/sec]
    //
    // Let D be the energy density of body fat (~6600 kcal/kg). The change in
    // body mass is therefore
    //
    // m'(t) = P/D = - a_1 m(t) - a_2 t + K [kg/sec]
    //
    // where a_1 = k_1/D, a_2 = k_3/D, K = (P_n - k_2 h - k_3 t_0 - k_4)/D.
    //
    // So (thanks to Wolfram Alpha),
    //
    // m(t) = C \exp(- a_1 t) - (a_2/a_1) t + K/a_1 + a_2/(a_1 * a_1)
    //
    // where C is some constant
    $scope.$watch(
      '{ netCalories: netCalories, metadata: dataset.metadata, weight: trend.startValue, weightData: weightData }',
      function(newVal) {
        // jshint camelcase: false

        // Do nothing if we don't have the basic data
        if(!newVal.metadata || !newVal.weight || !newVal.metadata.height ||
            !newVal.metadata.sex || !newVal.metadata.birthDate || !newVal.netCalories ||
            !newVal.weightData) {
          $scope.goalParams = undefined;
          return;
        }

        // Compute inputs to equation above
        var SECS_IN_DAY = 60 * 60 * 24;
        var DAYS_IN_YEAR = 365.25;
        var startDate = newVal.weightData[0].date.getTime();
        var t_0 = (Date.parse(newVal.metadata.birthDate) - startDate) / (1000 * SECS_IN_DAY),
            h = newVal.metadata.height,
            D = 6600,
            P_n = newVal.netCalories,
            k_1 = 10,
            k_2 = 6.45 * 100, // height in metres -> centimetres
            k_3 = 5 / DAYS_IN_YEAR, // age in days -> years
            k_4 = ((newVal.metadata.sex === 'male') ? 5 : -161);
        var a_1 = k_1/D, a_2 = k_3/D, K = (P_n - k_2 * h - k_3 * t_0 - k_4)/D;

        // Fit start value (t=0) to obtain C
        var C = newVal.weight - (a_2 / (a_1*a_1)) - (K/a_1);

        // Record goal parameters
        $scope.goalParams = {
          expCoeff: C,
          expRate: -a_1,
          timeCoeff: -(a_2/a_1),
          timeOffset: startDate/(1000 * SECS_IN_DAY),
          constant: K/a_1 + a_2/(a_1*a_1),
        };

        $log.info('new goal params', $scope.goalParams);
        $log.info('goal now:', evaluateGoal($scope.goalParams, Date.now()));
        $log.info('goal start:', evaluateGoal($scope.goalParams, startDate));
      },
      true
    );

    // watch for new goal and update series
    $scope.$watch(
      '{ params: goalParams, weightData: weightData, trend: trend, target: target }',
      function(newVal) {
        if(!newVal || !newVal.params || !newVal.weightData ||
            !newVal.trend || !newVal.trend.data)
        {
          $scope.goalData = [];
          return;
        }

        var startDate = newVal.weightData[0].date.getTime(),
          endDate = newVal.trend.data[newVal.trend.data.length-1].timestamp,
          t;

        $scope.goalData = [];
        for(t = startDate; t <= endDate; t += Math.max(DAYS, (endDate-startDate)/100)) {
          var w = evaluateGoal(newVal.params, t);
          if(w < newVal.target.weight) {
            continue;
          }
          $scope.goalData.push({ timestamp: t, weight: w });
        }
      },
      true
    );

    // watch for new series data and update graph
    $scope.$watch('{ weight: weightData, goal: goalData, trend: trend, target: target }', function(newVal) {
      angular.forEach($scope.weightChartConfig.series, function(series) {
        if(series.id === 'weight') {
          series.data = [];
          angular.forEach(newVal.weight, function(datum) {
            series.data.push([datum.date.getTime(), datum.weight]);
          });
        } else if(series.id === 'goal') {
          series.data = [];
          angular.forEach(newVal.goal, function(datum) {
            series.data.push([datum.timestamp, datum.weight]);
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

    // Evaluate the goal at the given time. (Milliseconds since 1/Jan/1970)
    var evaluateGoal = function(params, t) {
      // Re-scale and offset t into seconds since start
      t = (t / (1000*60*60*24)) - params.timeOffset;

      // Evaluate
      return params.expCoeff * Math.exp(params.expRate * t) -
        params.timeCoeff * t + params.constant;
    };

    var calculateBMI = function(weight, height) {
      var bmi = weight / (height * height), bmiCategory;

      if(bmi < 15) {
        bmiCategory = 'very severely underweight';
      } else if(bmi < 16) {
        bmiCategory = 'severely underweight';
      } else if(bmi < 18.5) {
        bmiCategory = 'underweight';
      } else if(bmi < 25) {
        bmiCategory = 'healthy';
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
