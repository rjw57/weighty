'use strict';

angular
  .module('webappApp', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngRoute',
    'googleOauth',
    'mobile-angular-ui',
    'mobile-angular-ui.touch',
    'mobile-angular-ui.scrollable',
    'dinoboff.gapi'
  ])
  .config(function ($routeProvider, $locationProvider, TokenProvider) {
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

    TokenProvider.extendConfig({
      clientId: '266506267940-nk8rt8rdrpb8l5j098ugl2v04m6evujn.apps.googleusercontent.com',
      redirectUri: baseUrl + '/oauth2callback.html',
      scopes: [
        'https://www.googleapis.com/auth/plus.me', // access basic user info
        'https://www.googleapis.com/auth/drive.file', // create and access files we create
        'https://spreadsheets.google.com/feeds', // spreadsheets API
      ],
    });
  });
