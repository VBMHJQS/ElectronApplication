var app = angular.module('iquant', ['ngGrid', 'ngDialog']);
var dataUrl = __dirname + '/data/data.json';

app.controller('TradeFormulaCtrl', ['$scope', '$rootScope', '$http', 'ngDialog', function($scope, $rootScope, $http, ngDialog) {
    // ng-grid 选中事件即选中后返回的数组
    $scope.mySelections = [];

    $scope.filterOptions = {
        filterText: "",
        useExternalFilter: true
    };
    $scope.totalServerItems = 0;
    $scope.pagingOptions = {
        pageSizes: [10, 20, 50],
        pageSize: 10,
        currentPage: 1
    };
    $scope.setPagingData = function(data, page, pageSize) {
        var pagedData = data.slice((page - 1) * pageSize, page * pageSize);
        $scope.myData = pagedData;
        $scope.totalServerItems = data.length;
        if (!$scope.$$phase) {
            $scope.$apply();
        }
    };
    $scope.getPagedDataAsync = function(pageSize, page, searchText) {
        setTimeout(function() {
            var data;
            if (searchText) {
                var ft = searchText.toLowerCase();
                $http.get(dataUrl).success(function(largeLoad) {
                    data = largeLoad.filter(function(item) {
                        return JSON.stringify(item).toLowerCase().indexOf(ft) != -1;
                    });
                    $scope.setPagingData(data, page, pageSize);
                });
            } else {
                $http.get(dataUrl).success(function(largeLoad) {
                    $scope.setPagingData(largeLoad, page, pageSize);
                });
            }
        }, 100);
    };

    $scope.getPagedDataAsync($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);

    $scope.$watch('pagingOptions', function(newVal, oldVal) {
        if (newVal !== oldVal && newVal.currentPage !== oldVal.currentPage) {
            $scope.getPagedDataAsync($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage, $scope.filterOptions.filterText);
        }
    }, true);
    $scope.$watch('filterOptions', function(newVal, oldVal) {
        if (newVal !== oldVal) {
            $scope.getPagedDataAsync($scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage, $scope.filterOptions.filterText);
        }
    }, true);

    $scope.gridOptions = {
        data: 'myData',
        enablePaging: true,
        showFooter: true,
        totalServerItems: 'totalServerItems',
        pagingOptions: $scope.pagingOptions,
        filterOptions: $scope.filterOptions,
        selectedItems: $scope.mySelections
    };

    // 删除
    $scope.del = function() {
            console.log('del');
            console.log($scope.mySelections);
            if ($scope.mySelections.length <= 0) {
                alert('请选择目标行');
                return;
            }
        }
        // 编辑
    $scope.edit = function() {
        console.log('edit');
        var array = $scope.mySelections;
        console.log(array.length);
        if ( array <= 0) {
            alert('请选择目标行');
            return;
        }
        console.log(array[array.length-1]);//默认最后一行为要编辑的行
    }
}]);
