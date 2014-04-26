'use strict';

angular.module('webappApp')
  .directive('waWeightGraph', function () {
    var margin = {top: 20, right: 20, bottom: 30, left: 50},
        width = 700 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    return {
      template: '<div></div>',
      restrict: 'E',
      scope: {
        data: '=records',
      },
      link: function postLink(scope, element, attrs) {
        var chart = nv.models.lineChart()
          .margin({ left: 100, right: 100 })
          .useInteractiveGuideline(true)
          .transitionDuration(350)
          .showXAxis(true)
          .showYAxis(true);

        chart.xAxis
          .axisLabel('Date')
          .tickFormat(function(d) {
            return d3.time.format('%x')(new Date(d));
          });

        chart.yAxis
          .axisLabel('Weight [kg]')
          .tickFormat(function(d) {
            return d3.format('i')(d) + 'kg';
          });

        var svg = d3.select(element[0]).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        // Update the chart when window resizes.
        nv.utils.windowResize(function() { chart.update() });

        // Update data
        var updateData = function() {
          var v = [];
          for(var idx in scope.data) {
            var r = scope.data[idx];
            v.push({ x: r.date, y: r.weight });
          }
          svg.datum([{ values: v, key: 'weight' }]).call(chart);
        };

        scope.$watch('data', updateData);
      }
    };
  });
