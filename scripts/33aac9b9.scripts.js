"use strict";angular.module("webappApp",["ngCookies","ngResource","ngSanitize","ngRoute","googleOauth"]).config(["$routeProvider","$locationProvider","TokenProvider",function(a,b,c){a.when("/",{templateUrl:"views/datasetlist.html",controller:"DatasetListCtrl"}).when("/main",{templateUrl:"views/main.html",controller:"MainCtrl"}).when("/login",{templateUrl:"views/login.html",controller:"LoginCtrl"}).otherwise({templateUrl:"404.html"});var d=document.URL.split("#")[0];"/"===d[d.length-1]&&(d=d.substr(0,d.length-1)),c.extendConfig({clientId:"266506267940-nk8rt8rdrpb8l5j098ugl2v04m6evujn.apps.googleusercontent.com",redirectUri:d+"/oauth2callback.html",scopes:["https://www.googleapis.com/auth/plus.me","https://www.googleapis.com/auth/drive.file"]})}]),angular.module("webappApp").controller("MainCtrl",["$scope","$location","GoogleApi",function(a,b,c){a.$watch("accessToken",function(){return a.accessToken?void c.get("https://www.googleapis.com/drive/v2/files").success(function(a){console.log(a)}):(b.path("/login"),void b.replace())});var d=864e5;a.awesomeThings=["HTML5 Boilerplate","AngularJS","Karma"],a.targetWeight=100,a.targetDate=new Date,a.weights=[],d3.tsv("data/mockdata.tsv").row(function(a){return{date:d3.time.format("%d/%m/%Y").parse(a.date),weight:+a.weight}}).get(function(b,c){a.$apply(function(){a.weights=c,a.targetDate=new Date(a.weights[0].date.getTime()+100*d)})}),a.$watch("weights",function(){if(a.goal=[],a.weights&&0!==a.weights.length){a.startWeight=a.weights[0].weight,a.currentWeight=a.weights[a.weights.length-1].weight,a.progress=1-(a.currentWeight-a.targetWeight)/(a.startWeight-a.targetWeight);for(var b=a.weights[0].date.getTime(),c=a.targetDate.getTime(),e=Math.log(a.startWeight),f=Math.log(a.targetWeight),g=b;c>=g;g+=Math.min(d,(c-b)/100)){var h=(g-b)/(c-b);a.goal.push({date:new Date(g),weight:Math.exp(h*f+(1-h)*e)})}}})}]),angular.module("webappApp").controller("NavCtrl",["$scope","GoogleApi",function(a,b){a.login=b.login,a.logout=b.logout,a.me=null,a.$watch("accessToken",function(){return a.accessToken?void b.get("https://www.googleapis.com/plus/v1/people/me").success(function(b){a.me=b}):void(a.me=null)})}]),angular.module("webappApp").filter("weight",function(){return function(a){return a+"kg"}}),angular.module("webappApp").directive("waWeightGraph",function(){var a="#428bca",b="#5cb85c";return{template:"",restrict:"E",scope:{weights:"=weights",goal:"=goal"},link:function(c,d){var e=nv.models.lineChart().margin({left:50}).useInteractiveGuideline(!0).transitionDuration(350).showXAxis(!0).showYAxis(!0);e.xAxis.axisLabel("Date").showMaxMin(!1).tickFormat(function(a){return d3.time.format("%e %b %Y")(new Date(a))}),e.yAxis.axisLabel("Weight / kg").tickFormat(function(a){return d3.format(".0f")(a)+" kg"});var f=d3.select(d[0]).append("svg");nv.utils.windowResize(function(){e.update()});var g=function(){var d,g,h=[],i=[];for(g in c.weights)d=c.weights[g],h.push({x:d.date,y:d.weight});for(g in c.goal)d=c.goal[g],i.push({x:d.date,y:d.weight});f.datum([{values:i,key:"goal",color:b},{values:h,key:"weight",color:a}]).call(e)};c.$watch("weights",g),c.$watch("goal",g)}}}),angular.module("webappApp").directive("waProgressBar",function(){return{restrict:"E",templateUrl:"waprogressbar.html",scope:{min:"@",max:"@",value:"@"}}}),angular.module("webappApp").directive("waNav",function(){return{templateUrl:"wanav.html",restrict:"E"}}),angular.module("webappApp").service("GoogleApi",["$rootScope","$http","Token",function(a,b,c){var d=function(){a.accessToken=c.get()};return d.prototype.login=function(){c.getTokenByPopup().then(function(b){c.verifyAsync(b.access_token).then(function(){a.$apply(function(){a.accessToken=b.access_token,a.expiresIn=b.expires_in,c.set(b.access_token)})},function(){alert("Failed to verify token.")})},function(){alert("Failed to get token from popup.")})},d.prototype.logout=function(){a.accessToken=null,c.clear()},d.prototype.http=function(c){var d=angular.extend({headers:{}},c);return a.accessToken&&(d.headers.Authorization="Bearer "+a.accessToken),b(d)},d.prototype.get=function(a,b){return this.http(angular.extend({method:"GET",url:a},b))},d.prototype.post=function(a,b,c){return this.http(angular.extend({method:"POST",url:a,data:b},c))},new d}]),angular.module("webappApp").controller("LoginCtrl",["$scope","$location","GoogleApi",function(a,b,c){a.$watch("accessToken",function(){a.accessToken&&b.path("/")}),a.doLogin=c.login}]),angular.module("webappApp").controller("DatasetListCtrl",["$scope","$location","GoogleApi",function(a,b,c){a.items=[],a.$watch("accessToken",function(){return a.accessToken?void a.refreshList():(b.path("/login"),void b.replace())}),a.refreshList=function(){c.get("https://www.googleapis.com/drive/v2/files",{params:{q:"not trashed and properties has { key = 'isWeightySheet' and value='true' and visibility='PUBLIC'}"}}).success(function(b){a.items=[],angular.forEach(b.items,function(b){console.log(b),a.items.push({title:b.title,id:b.id,createdDate:Date.parse(b.createdDate),modifiedDate:Date.parse(b.modifiedDate)})})})},a.create=function(){a.accessToken&&a.datasetName&&""!==a.datasetName&&(c.post("https://www.googleapis.com/drive/v2/files",{mimeType:"application/vnd.google-apps.spreadsheet",title:a.datasetName,properties:[{key:"isWeightySheet",value:!0,visibility:"PUBLIC"}]}).success(function(){a.refreshList()}),a.datasetName="")}}]);