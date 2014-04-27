'use strict';

angular.module('webappApp')
  .directive('waWeightGraph', function () {
    var weightColor = '#428bca', goalColor = '#5cb85c';

    return {
      template: '',
      restrict: 'E',
      scope: {
        weights: '=weights',
        goal: '=goal',
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
          var w = [], g = [], r, idx;
          for(idx in scope.weights) {
            r = scope.weights[idx];
            w.push({ x: r.date, y: r.weight });
          }
          for(idx in scope.goal) {
            r = scope.goal[idx];
            g.push({ x: r.date, y: r.weight });
          }

          svg.datum([
            { values: g, key: 'goal', color: goalColor },
            { values: w, key: 'weight', color: weightColor },
          ]).call(chart);
        };

        scope.$watch('weights', updateData);
        scope.$watch('goal', updateData);
      }
    };
  });
