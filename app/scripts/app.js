'use strict';

angular
  .module('webappApp', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngRoute',
    'googleOauth'
  ])
  .config(function ($routeProvider, $locationProvider, TokenProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/datasetlist.html',
        controller: 'DatasetListCtrl'
      })
      .when('/main', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/login', {
        templateUrl: 'views/login.html',
        controller: 'LoginCtrl'
      })
      .otherwise({
        templateUrl: '404.html',
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
      ],
    });
  });
