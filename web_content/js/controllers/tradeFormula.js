
app.controller('TradeFormCtrl',['$scope','$http',function($scope, $http){
  $scope.tradeFormula = {
      stradegyid:1,
      quant:1,
      tradeSymbol:'IF',
      formula:'TB_G_YANG_Y000_10MIN_V1_1'
  };


  $scope.saveFormula = function(){
    // var para = parseParam($scope.tradeFormula);
    //
    // $http(
    //   {
    //   url:'http://localhost:8080/sim/client/mapper/insert',
    //   method:'POST',
    //   headers:{
    //     'Content-Type':'application/x-www-form-urlencoded'
    //   },
    //   data:para
    // }).success(function(){
    //         console.log("success!");
    //     }).error(function(){
    //         console.log("error");
    //     })
testfs();
  }

  var parseParam = function(obj) {
    var query = '', name, value, fullSubName, subName, subValue, innerObj, i;

    for(name in obj) {
      value = obj[name];

      if(value instanceof Array) {
        for(i=0; i<value.length; ++i) {
          subValue = value[i];
          fullSubName = name + '[' + i + ']';
          innerObj = {};
          innerObj[fullSubName] = subValue;
          query += param(innerObj) + '&';
        }
      }
      else if(value instanceof Object) {
        for(subName in value) {
          subValue = value[subName];
          fullSubName = name + '[' + subName + ']';
          innerObj = {};
          innerObj[fullSubName] = subValue;
          query += param(innerObj) + '&';
        }
      }
      else if(value !== undefined && value !== null)
        query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
    }

    return query.length ? query.substr(0, query.length - 1) : query;
  };

}])

function testfs(){
  fs.readFile('input.txt',function(err,data){
    if(err){
      return console.error(err);
    }else {
      console.log(data.toString());
    }
  });
}
