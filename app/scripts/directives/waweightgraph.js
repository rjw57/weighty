'use strict';

angular.module('webappApp')
  .directive('waWeightGraph', function () {
    var margin = {top: 20, right: 20, bottom: 30, left: 50},
        width = 700 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    var weightColor = '#428bca', goalColor = '#5cb85c';

    return {
      template: '',
      restrict: 'E',
      scope: {
        weights: '=weights',
        goal: '=goal',
      },
      link: function postLink(scope, element, attrs) {
        var chart = nv.models.lineChart()
          .margin({ left: 15 + 40 })
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
          .axisLabelDistance(40)
          .tickFormat(d3.format('.0f'));

        var svg = d3.select(element[0]).append("svg")

        // Update the chart when window resizes.
        nv.utils.windowResize(function() { chart.update() });

        // Update weights
        var updateData = function() {
          var w = [], g = [], r, idx;
          for(var idx in scope.weights) {
            r = scope.weights[idx];
            w.push({ x: r.date, y: r.weight });
          }
          for(var idx in scope.goal) {
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
