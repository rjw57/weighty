"use strict";angular.module("webappApp",["ngCookies","ngResource","ngSanitize","ngRoute","gapi.client","highcharts-ng","xeditable","ui.bootstrap"]).run(["editableOptions","editableThemes",function(a,b){b.bs3.inputClass="input-sm",b.bs3.buttonsClass="btn-sm",a.theme="bs3"}]).config(["$routeProvider",function(a){a.when("/",{templateUrl:"views/root.html"}).when("/dataset/:sheetId",{templateUrl:"views/dataset.html",controller:"DatasetCtrl"}).when("/datasets",{templateUrl:"views/datasetlist.html",controller:"DatasetListCtrl",active:"datasets"}).otherwise({redirectTo:"/"});var b=document.URL.split("#")[0];"/"===b[b.length-1]&&(b=b.substr(0,b.length-1))}]),angular.module("webappApp").controller("DatasetCtrl",["$scope","$routeParams","$log","$filter","dataset","Analysis",function(a,b,c,d,e,f){var g=864e5,h=22,i="#428bca";if(b.sheetId){a.target={},a.sexes=[{value:"male",text:"Male"},{value:"female",text:"Female"}],a.nameSex=function(b){var c=d("filter")(a.sexes,{value:b});return b&&c.length?c[0].text:null},a.weightChartConfig={options:{chart:{zoomType:"x",spacing:[5,0,10,0]},title:{text:null},exporting:{buttons:{contextButton:{enabled:!1}}},xAxis:{type:"datetime",endOnTick:!1,minPadding:0,maxPadding:0,minRange:12096e5},yAxis:{title:{text:null},startOnTick:!1,endOnTick:!0,minPadding:0,maxPadding:0,gridLineColor:"#DDD",labels:{formatter:function(){return Highcharts.numberFormat(this.value,0)+'&nbsp;<span class="unit">kg</span>'},useHTML:!0}},tooltip:{valueDecimals:1,valueSuffix:"kg"}},series:[{name:"Weight",id:"weight",data:[],zIndex:4,color:i,marker:{enabled:!1}},{name:"Trend",id:"trend",data:[],zIndex:1,dashStyle:"Dash",color:i,lineWidth:1,marker:{enabled:!1}},{name:"Trend Range",id:"trend-range",data:[],type:"arearange",zIndex:0,color:i,lineWidth:0,fillOpacity:.3,linkedTo:"trend"}]},a.stats={},a.open=function(b,c){b.preventDefault(),b.stopPropagation(),a[c]=!0},a.submitNewMeasurement=function(b){a.dataset.id&&(c.info("got new measurement:",b.weight),e.addRow({id:a.dataset.id,timestamp:Date.now(),weight:b.weight}).then(function(){c.info("new measurement added"),a.$emit("alertMessage",{type:"success",message:"Successfully added measurement."}),k()},function(b){a.$emit("alertMessage",{type:"danger",message:"Error adding measurement."}),c.error("error adding new measurement",b)}))},a.$watch("isSignedIn",function(){return a.isSignedIn?void e.verifyDatasetId(b.sheetId).then(function(b){c.info("dataset id "+b.id+" has been verified"),a.dataset=b},function(a){c.error("Dataset failed verification:",a)}):void(a.dataset=void 0)}),a.$watch("dataset.id",function(){k()}),a.$watch("{ weightData: weightData, target: target }",function(b){var c,d,e,h,i,j,k,l,m,n,o,p=b.weightData,q=b.target;if(a.trend={},p&&!(p.length<1)&&q&&(e=p[0].date.getTime(),h=p[p.length-1].date.getTime(),d=[],angular.forEach(p,function(a){d.push({x:a.date.getTime(),y:Math.log(a.weight),w:Math.exp(-Math.max(0,a.date.getTime()-e)/(14*g))})}),a.trend.startValue=Math.exp(f.evaluateRegression(f.regress(d),e)),d=[],angular.forEach(p,function(a){d.push({x:a.date.getTime(),y:Math.log(a.weight),w:Math.exp(-Math.max(0,h-a.date.getTime())/(14*g))})}),i=f.regress(d),j=f.regressBootstrap(d),a.trend.endValue=Math.exp(f.evaluateRegression(f.regress(d),h)),i.m)){a.trend.data=[];var r=h+31*g;for(q.weight&&(r=(Math.log(q.weight)-i.c)/i.m,a.trend.finishDate=new Date(Math.max(r,h)),r=Math.max(r,h+31*g),r=Math.min(r,h+186*g)),q.date&&(r=q.date.getTime()),c=Math.max(e,h-7*g);r>=c;c+=Math.min(g,(r-e)/100))k=Math.exp(f.evaluateRegression(i,c)),l=f.evaluateBootstrapRegression(j,c),m=Math.exp(l.mu-3*l.sigma),n=Math.exp(l.mu+3*l.sigma),o={timestamp:c,min:m,max:n,value:k},a.trend.data.push(o);a.trend.nowValue=Math.exp(f.evaluateRegression(i,Date.now()))}},!0),a.$watch("{ target: target, trend: trend }",function(b){var c=b.trend,d=b.target;return c&&d?void(a.stats.progress=1-(c.endValue-d.weight)/(c.startValue-d.weight)):void(a.stats.progress=void 0)},!0),a.$watch("{ height: dataset.metadata.height, weight: trend.nowValue }",function(b){return b.height&&b.weight?(a.stats.bmi=j(b.weight,b.height),a.stats.idealWeight=h*b.height*b.height,void(a.target.weight=a.stats.idealWeight)):void(a.stats.bmi=void 0)},!0),a.$watch("{ metadata: dataset.metadata, weight: trend.nowValue }",function(b){var c;return b.metadata&&b.weight&&b.metadata.height&&b.metadata.sex&&b.metadata.birthDate?(c=10*b.weight+625*b.metadata.height-5*(Date.now()-Date.parse(b.metadata.birthDate))/(365.25*g),"male"===b.metadata.sex?c+=5:"female"===b.metadata.sex&&(c-=161),void(a.stats.bmr=c)):void(a.stats.bmr=void 0)},!0),a.$watch("{ weight: weightData, trend: trend, target: target }",function(b){angular.forEach(a.weightChartConfig.series,function(a){"weight"===a.id?(a.data=[],angular.forEach(b.weight,function(b){a.data.push([b.date.getTime(),b.weight])})):"trend"===a.id?(a.data=[],angular.forEach(b.trend.data,function(c){c.value>=b.target.weight&&a.data.push([c.timestamp,c.value])})):"trend-range"===a.id&&(a.data=[],angular.forEach(b.trend.data,function(c){(c.min>=b.target.weight||c.max>=b.target.weight)&&a.data.push([c.timestamp,Math.max(b.target.weight,c.min),Math.max(b.target.weight,c.max)])}))})},!0),a.$watch("dataset.metadata",function(b,c){b&&c&&e.patch(a.dataset.id,{metadata:b}).then(function(){a.$emit("alertMessage",{type:"success",message:"Updated personal data"})})},!0);var j=function(a,b){var c,d=a/(b*b);return c=15>d?"very severely underweight":16>d?"severely underweight":18.5>d?"underweight":25>d?"normal":30>d?"overweight":35>d?"moderately obese":40>d?"severely obese":"vary severely obese",{value:d,description:c}},k=function(){a.weightData=void 0,a.dataset&&(c.info("(Re-)loading dataset",a.dataset.id),e.getData(a.dataset.id).then(function(b){a.weightData=b},function(a){c.error("Could not get dataset:",a)}))}}}]),angular.module("webappApp").controller("DatasetListCtrl",["$scope","$log","$location","$window","gapi","dataset",function(a,b,c,d,e,f){a.$watch("isSignedIn",function(){a.isSignedIn?a.refreshList():a.datasets=[]}),a.refreshList=function(){b.info("refeshing dataset list"),f.list().then(function(b){a.datasets=b},function(a){b.error("could not get dataset list:",a)})},a.submitNewDataset=function(){a.create(a.newDataset.name),a.newDataset.name=null},a.create=function(c){c&&""!==c&&f.insert({title:c}).then(function(c){b.info("new dataset created"),a.datasets.push(c)},function(a){b.error("error creating dataset:",a)})}}]),angular.module("webappApp").run(["$window","$log","$rootScope","gapi",function(a,b,c,d){a.gapiLoaded?(b.info("gapi was already loaded by module initialisation"),d.ready()):(b.info("gapi not yet loaded, setting event handler"),a.handleGapiLoad=function(){b.info("gapi loaded"),d.ready()})}]).controller("GoogleAccountCtrl",["$scope","$window","gapi",function(a,b,c){a.accessToken=null,a.accessTokenExpiry=null,a.isSignedIn=!1;var d={client_id:"266506267940-nk8rt8rdrpb8l5j098ugl2v04m6evujn.apps.googleusercontent.com",scope:["https://www.googleapis.com/auth/plus.me","https://www.googleapis.com/auth/drive","https://www.googleapis.com/auth/fusiontables"]};a.doLogin=function(e){e=angular.extend(e||{},d),c.auth.authorize(e).then(function(c){console.log("Authorization token obtained:",c),a.accessToken=b.gapi.auth.getToken(),a.accessTokenExpiry=new Date(Date.now()+1e3*c.expires_in),a.isSignedIn=!0},function(){console.log("Obtaining authorisation failed"),a.accessToken=null,a.accessTokenExpiry=null,a.isSignedIn=!1})},a.doLogout=function(){a.accessToken=null,a.accessTokenExpiry=null,a.isSignedIn=!1,b.gapi.auth.setToken(null),a.$emit("alertMessage",{type:"success",heading:"Sign out successful.",message:"You are now signed out from Google."})},c.ready(function(){console.log("Perfoming initial immediate-mode login attempt"),a.doLogin({immediate:!0})}),c.load("plus","v1").then(function(b){a.$watch("isSignedIn",function(){return console.log("Signed in state changed:",a.isSignedIn),a.isSignedIn?(console.log('Asking for "me"'),void b.people.get({userId:"me"}).then(function(b){console.log('Response from asking for "me"',b),a.me=b.kind&&"plus#person"===b.kind?b:null})):void(a.me=null)})})}]),angular.module("webappApp").directive("waNav",function(){return{templateUrl:"wanav.html",restrict:"E"}}),angular.module("webappApp").directive("waProgressBar",function(){return{restrict:"EAC",templateUrl:"waprogressbar.html",scope:{min:"@",max:"@",value:"@"}}}),angular.module("webappApp").directive("waSidebar",function(){return{templateUrl:"partials/sidebar.html",restrict:"E"}}),angular.module("webappApp").directive("waWeightGraph",function(){var a="#428bca",b="#5cb85c",c="#93BCE0",d="#93BCE0";return{template:"",restrict:"E",scope:{weights:"=",goal:"=",trend:"=",trendMin:"=",trendMax:"="},link:function(e,f){var g=nv.models.lineChart().margin({left:50}).useInteractiveGuideline(!0).transitionDuration(350).showXAxis(!0).showYAxis(!0);g.xAxis.axisLabel("Date").showMaxMin(!1).tickFormat(function(a){return d3.time.format("%e %b %Y")(new Date(a))}),g.yAxis.axisLabel("Weight / kg").tickFormat(function(a){return d3.format(".0f")(a)+" kg"});var h=d3.select(f[0]).append("svg");nv.utils.windowResize(function(){g.update()});var i=function(){var f,i,j,k=[];if(f=[],e.goal)for(j in e.goal)i=e.goal[j],f.push({x:i.date,y:i.weight});if(k.push({values:f,key:"goal",color:b}),f=[],e.trend)for(j in e.trend)i=e.trend[j],f.push({x:i.date,y:i.weight});if(k.push({values:f,key:"trend",color:c}),f=[],e.trendMin)for(j in e.trendMin)i=e.trendMin[j],f.push({x:i.date,y:i.weight});if(k.push({values:f,key:"trend minimum",color:d}),f=[],e.trendMax)for(j in e.trendMax)i=e.trendMax[j],f.push({x:i.date,y:i.weight});if(k.push({values:f,key:"trend maximum",color:d}),f=[],e.weights)for(j in e.weights)i=e.weights[j],f.push({x:i.date,y:i.weight});k.push({values:f,key:"weight",color:a}),h.datum(k).call(g)};e.$watch("weights",i),e.$watch("goal",i)}}}),angular.module("webappApp").filter("weight",function(){return function(a){return a+"kg"}}),angular.module("webappApp").service("dataset",["$log","$q","$window","gapi",function(a,b,c,d){this.insert=function(c){return c&&c.title?d.load("fusiontables","v1").then(function(b){return a.info('creating new fusiontable "'+c.title+'"...'),b.table.insert({resource:{name:c.title,columns:[{columnId:0,name:"Timestamp",type:"NUMBER"},{columnId:1,name:"Weight",type:"NUMBER"}],isExportable:!0,description:"weighty record"}}).then(function(b){return a.info('setting drive properties on "'+c.title+'"'),d.load("drive","v2").then(function(a){return a.files.update({fileId:b.tableId,resource:{properties:[{key:"weightyVersion",value:2,visibility:"PUBLIC"},{key:"weightyMetadata",value:JSON.stringify(c.metadata||{}),visibility:"PUBLIC"}]}}).then(function(a){return e(a)})})})}):b.reject("passed null parameters or a falsy title")},this.patch=function(b,c){a.info("patching drive properties on "+b);var f={};return c.title&&(f.tile=c.title),c.metadata&&(f.properties=[{key:"weightyMetadata",value:JSON.stringify(c.metadata||{}),visibility:"PUBLIC"}]),d.load("drive","v2").then(function(a){return a.files.patch({fileId:b,resource:f}).then(function(a){return e(a)})})},this.addRow=function(a){var d=a.timestamp+","+a.weight;return b.when(c.gapi.client.request({path:"upload/fusiontables/v1/tables/"+a.id+"/import",method:"POST",params:{uploadType:"media",delimiter:","},headers:{"Content-Type":"application/octet-stream"},body:d}))},this.list=function(){var a="not trashed and properties has { key = 'weightyVersion' and value = '2' and visibility='PUBLIC'}";return d.load("drive","v2").then(function(b){return b.files.list({q:a}).then(function(a){if("drive#fileList"===a.kind){var b=[];return angular.forEach(a.items,function(a){b.push(e(a))}),b}})})},this.verifyDatasetId=function(a){return b.all({driveFile:f(a),fusiontablesTable:g(a)}).then(function(a){return a.driveFile?a.fusiontablesTable?a.driveFile.id!==a.fusiontablesTable.tableId?b.reject("Dataset id is different between drive and fusiontables API"):e(a.driveFile):b.reject("Dataset id does not validate via the fusiontables API"):b.reject("Dataset id does not validate via the drive API")})},this.getData=function(a){return a?d.load("fusiontables","v1").then(function(b){return b.query.sqlGet({sql:"SELECT Timestamp, Weight FROM "+a+" ORDER BY Timestamp"}).then(function(a){var b=[];return angular.forEach(a.rows,function(a){b.push({timestamp:a[0],weight:a[1],date:new Date(a[0])})}),b})}):b.reject("passed an invalid or null dataset id")};var e=function(b){var c={};return angular.forEach(b.properties,function(b){if("weightyMetadata"===b.key)try{c=JSON.parse(b.value)}catch(d){a.warn("ignoring invalid JSON in weighty metadata",d),a.warn('metadata was "'+b.value+'"')}}),{title:b.title,id:b.id,createdDate:Date.parse(b.createdDate),modifiedDate:Date.parse(b.modifiedDate),metadata:c}},f=function(c){var e=b.defer();return a.info("verifying against drive API"),d.load("drive","v2").then(function(b){b.files.get({fileId:c}).then(function(b){var c=!1;return angular.forEach(b.properties,function(a){"weightyVersion"===a.key&&"2"===a.value&&(c=!0)}),c?void e.resolve(b):(a.error("Drive file did not have expected property"),void e.reject(b.properties))},function(b){a.error("Error verifying table via drive Api:",b),e.reject(b)})}),e.promise},g=function(c){var e=b.defer();return a.info("verifying againset fusiontables API"),d.load("fusiontables","v1").then(function(b){b.table.get({tableId:c}).then(function(b){var c=!1,d=!1;angular.forEach(b.columns,function(a){"Weight"===a.name&&"NUMBER"===a.type?c=!0:"Timestamp"===a.name&&"NUMBER"===a.type&&(d=!0)}),c&&d?e.resolve(b):(a.error("Error verifying table via fusiontables API; incorrect columns"),e.reject(b.columns))},function(b){a.error("Error verifying table via fusiontables Api:",b),e.reject(b)})}),e.promise}}]),angular.module("webappApp").directive("globalAlert",["$rootScope","$log",function(a,b){return{templateUrl:"partials/globalalert.html",restrict:"EAC",link:function(c){var d=[];c.dismiss=function(){c.alert=d.shift()},a.$on("alertMessage",function(a,e){b.info("Alert message received:",e),d.push(e),c.alert||(c.alert=d.shift())}),c.alert=null}}}]),angular.module("webappApp").service("Analysis",function(){var a=function(a){var b,c=[];for(b=0;b<a.length;b+=1)c.push(a[Math.floor(Math.random()*a.length)]);return c};this.regress=function(a){if(!a||!a.length||a.length<2)return{m:null,c:null};var b,c,d,e,f=[],g=[];return angular.forEach(a,function(a){e=void 0!==a.w&&null!==a.w?a.w:1,f.push(e*a.y),g.push([e*a.x,e])}),b=numeric.dot(numeric.transpose(g),g),c=numeric.dot(numeric.transpose(g),f),d=numeric.solve(b,c),{m:d[0],c:d[1]}},this.evaluateRegression=function(a,b){return a.m*b+a.c},this.regressBootstrap=function(b,c){var d,e=[];for(c=angular.extend({bootstrapSamples:100},c),d=0;d<c.bootstrapSamples;d+=1)e.push(this.regress(a(b)));return e},this.evaluateBootstrapRegression=function(a,b){var c,d,e,f,g=0,h=0;for(d=0;d<a.length;d+=1)c=this.evaluateRegression(a[d],b),g+=c*c,h+=c;return f=h/a.length,e=Math.max(0,g/a.length-f*f),{mu:f,sigma:Math.sqrt(e)}}});