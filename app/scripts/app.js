'use strict';

angular
  .module('webappApp', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngRoute',
    'mobile-angular-ui',
    'mobile-angular-ui.touch',
    'mobile-angular-ui.scrollable',
    'gapi.client'
  ])
  .config(function ($routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/root.html',
      })
      // Show a given dataset keyed by id
      .when('/dataset/:sheetId', {
        templateUrl: 'views/dataset.html',
        controller: 'DatasetCtrl'
      })
      .when('/datasets', {
        templateUrl: 'views/datasetlist.html',
        controller: 'DatasetListCtrl',
        active: 'datasets'
      })
      /*
      .when('/login', {
        templateUrl: 'views/login.html',
        controller: 'LoginCtrl',
        active: 'login'
      })
      .when('/logout', {
        templateUrl: 'views/logout.html',
        controller: 'LogoutCtrl'
      })
      */
      .otherwise({
        redirectTo: '/',
      });

    // HACK to get base URL of web app. I'm sure there should be
    // some better way to do this.
    var baseUrl = document.URL.split('#')[0];
    if(baseUrl[baseUrl.length-1] === '/') {
      baseUrl = baseUrl.substr(0, baseUrl.length-1);
    }
  });
