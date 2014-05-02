'use strict';

// This is a horrible hack. A cleaner way of calling into the angular
// module would be nice.
window.onGapiLoad = function() {
  window.gapiLoaded = true;
  if(window.handleGapiLoad) {
    window.handleGapiLoad();
  }
};

angular.module('webappApp')
  .run(function($window, $log, $rootScope, gapi) {
    // was gapi already loaded?
    if($window.gapiLoaded) {
      // Signal to gapi that everything is ready
      $log.info('gapi was already loaded by module initialisation');
      gapi.ready();
    } else {
      // otherwise, replace the onload function
      $log.info('gapi not yet loaded, setting event handler');
      $window.handleGapiLoad = function() {
        $log.info('gapi loaded');
        gapi.ready();
      };
    }
  })
  .controller('GoogleAccountCtrl', function ($scope, $window, gapi) {
    // jshint camelcase: false

    // defaults
    $scope.accessToken = null;
    $scope.accessTokenExpiry = null;
    $scope.isSignedIn = false;

    var authParams = {
      client_id: '266506267940-nk8rt8rdrpb8l5j098ugl2v04m6evujn.apps.googleusercontent.com',
      scope: [
        'https://www.googleapis.com/auth/plus.me', // access basic user info
        //'https://www.googleapis.com/auth/drive.file', // create and access files we create
        'https://www.googleapis.com/auth/drive', // create and access *all* files in drive
        'https://www.googleapis.com/auth/fusiontables', // fusiontables
      ],
    };

    $scope.doLogin = function(options) {
      options = angular.extend(options || {}, authParams);
      gapi.auth.authorize(options)
        .then(function(params) {
          // success
          console.log('Authorization token obtained:', params);
          $scope.accessToken = $window.gapi.auth.getToken();
          $scope.accessTokenExpiry = new Date(Date.now() + (params.expires_in * 1000));
          $scope.isSignedIn = true;
        }, function() {
          // For some reason auth failed
          console.log('Obtaining authorisation failed');
          $scope.accessToken = null;
          $scope.accessTokenExpiry = null;
          $scope.isSignedIn = false;
        });
    };

    $scope.doLogout = function() {
      $scope.accessToken = null;
      $scope.accessTokenExpiry = null;
      $scope.isSignedIn = false;
      $window.gapi.auth.setToken(null);
    };

    // Attempt an immediate mode login when the gapi provider is ready
    gapi.ready(function() {
      console.log('Perfoming initial immediate-mode login attempt');
      $scope.doLogin({ immediate: true });
    });

    // Ask for the Google Plus API
    gapi.load('plus', 'v1').then(function(plus) {
      // Watch the isSignedIn field to retrieve user info when appropriate
      $scope.$watch('isSignedIn', function() {
        console.log('Signed in state changed:', $scope.isSignedIn);

        // If not signed in, clear user data and exit
        if(!$scope.isSignedIn) { $scope.me = null; return; }

        // Otherwise try to get "me"
        console.log('Asking for "me"');
        plus.people.get({ userId: 'me' }).then(function(resp) {
          console.log('Response from asking for "me"', resp);
          if(!resp.kind || resp.kind !== 'plus#person') {
            $scope.me = null;
          } else {
            $scope.me = resp;
          }
        });
      });
    });
  });
