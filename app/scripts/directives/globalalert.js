'use strict';

angular.module('webappApp')
  // A directive which listens for alertMessage events. The first argument of
  // the event should be an object with the following form:
  //
  // {
  //   type: 'success' | 'info' | 'warning' | 'danger',
  //   message: <human readable message>,
  //   heading: <optional short message to display in boldface>,
  // }
  .directive('globalAlert', function ($rootScope, $log) {
    return {
      templateUrl: 'partials/globalalert.html',
      restrict: 'EAC',
      link: function postLink(scope/* , element, attrs */) {
        var alerts = [];

        scope.dismiss = function() {
          scope.alert = alerts.shift();
        };

        $rootScope.$on('alertMessage', function(event, alert) {
          $log.info('Alert message received:', alert);

          // Add this alert to the list of pending alerts
          alerts.push(alert);

          // Do we have an alert at the moment?
          if(!scope.alert) {
            scope.alert = alerts.shift();
          }
        });

        scope.alert = null;
      }
    };
  });
