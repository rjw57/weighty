'use strict';

angular.module('webappApp')
  .directive('waWeightGraph', function () {
    var weightColor = '#428bca', goalColor = '#5cb85c', trendColor = '#93BCE0',
      trendBoundColor = '#93BCE0';

    return {
      template: '',
      restrict: 'E',
      scope: {
        weights: '=',
        goal: '=',
        trend: '=',
        trendMin: '=',
        trendMax: '=',
      },
      link: function postLink(scope, element) {
        var chart = nv.models.lineChart()
          .margin({ left: 50 })
          .useInteractiveGuideline(true)
          .transitionDuration(350)
          .showXAxis(true)
          .showYAxis(true);

        chart.xAxis
          .axisLabel('Date')
          .showMaxMin(false)
          .tickFormat(function(d) {
            return d3.time.format('%e %b %Y')(new Date(d));
          });

        chart.yAxis
          .axisLabel('Weight / kg')
          .tickFormat(function(d) { return d3.format('.0f')(d) + ' kg'; });

        var svg = d3.select(element[0]).append('svg');

        // Update the chart when window resizes.
        nv.utils.windowResize(function() { chart.update(); });

        // Update weights
        var updateData = function() {
          console.log(scope);
          var vs, r, idx, datum = [];

          vs = [];
          if(scope.goal) {
            for(idx in scope.goal) {
              r = scope.goal[idx];
              vs.push({ x: r.date, y: r.weight });
            }
          }
          datum.push({ values: vs, key: 'goal', color: goalColor });

          vs = [];
          if(scope.trend) {
            for(idx in scope.trend) {
              r = scope.trend[idx];
              vs.push({ x: r.date, y: r.weight });
            }
          }
          datum.push({ values: vs, key: 'trend', color: trendColor });

          vs = [];
          if(scope.trendMin) {
            for(idx in scope.trendMin) {
              r = scope.trendMin[idx];
              vs.push({ x: r.date, y: r.weight });
            }
          }
          datum.push({ values: vs, key: 'trend minimum', color: trendBoundColor });

          vs = [];
          if(scope.trendMax) {
            for(idx in scope.trendMax) {
              r = scope.trendMax[idx];
              vs.push({ x: r.date, y: r.weight });
            }
          }
          datum.push({ values: vs, key: 'trend maximum', color: trendBoundColor });

          vs = [];
          if(scope.weights) {
            for(idx in scope.weights) {
              r = scope.weights[idx];
              vs.push({ x: r.date, y: r.weight });
            }
          }
          datum.push({ values: vs, key: 'weight', color: weightColor });

          svg.datum(datum).call(chart);
        };

        scope.$watch('weights', updateData);
        scope.$watch('goal', updateData);
      }
    };
  });
