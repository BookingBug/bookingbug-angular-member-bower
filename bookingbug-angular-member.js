(function() {
  'use strict';
  angular.module('BBMember', ['BB', 'BBMember.Directives', 'BBMember.Services', 'BBMember.Filters', 'BBMember.Controllers', 'BBMember.Models', 'trNgGrid', 'pascalprecht.translate']);

  angular.module('BBMember').config(function($logProvider) {
    return $logProvider.debugEnabled(true);
  });

  angular.module('BBMember').run(function() {
    return TrNgGrid.defaultColumnOptions.enableFiltering = false;
  });

  angular.module('BBMember.Directives', []);

  angular.module('BBMember.Filters', []);

  angular.module('BBMember.Services', ['ngResource', 'ngSanitize', 'ngLocalData']);

  angular.module('BBMember.Controllers', ['ngLocalData', 'ngSanitize']);

  angular.module('BBMember.Models', []);

  angular.module('BBMemberMockE2E', ['BBMember', 'BBAdminMockE2E']);

}).call(this);

(function() {
  angular.module('BBMember').controller('MemberBookings', function($scope, $modal, $log, MemberBookingService, $q, ModalForm, MemberPrePaidBookingService, $rootScope) {
    var getBookings, updateBookings;
    $scope.loading = true;
    $scope.getUpcomingBookings = function() {
      var defer, params;
      defer = $q.defer();
      params = {
        start_date: moment().format('YYYY-MM-DD')
      };
      getBookings(params).then(function(upcoming_bookings) {
        $scope.upcoming_bookings = upcoming_bookings;
        return defer.resolve(upcoming_bookings);
      }, function(err) {
        return defer.reject([]);
      });
      return defer.promise;
    };
    $scope.getPastBookings = function(num, type) {
      var date, defer, params;
      defer = $q.defer();
      if (num && type) {
        date = moment().subtract(num, type);
      } else {
        date = moment().subtract(1, 'year');
      }
      params = {
        start_date: date.format('YYYY-MM-DD'),
        end_date: moment().add(1, 'day').format('YYYY-MM-DD')
      };
      getBookings(params).then(function(past_bookings) {
        $scope.past_bookings = _.chain(past_bookings).filter(function(b) {
          return b.datetime.isBefore(moment());
        }).sortBy(function(b) {
          return -b.datetime.unix();
        }).value();
        return defer.resolve(past_bookings);
      }, function(err) {
        return defer.reject([]);
      });
      return defer.promise;
    };
    $scope.flushBookings = function() {
      var params;
      params = {
        start_date: moment().format('YYYY-MM-DD')
      };
      return MemberBookingService.flush($scope.member, params);
    };
    $scope.edit = function(booking) {
      return booking.getAnswersPromise().then(function(answers) {
        var answer, i, len, ref;
        ref = answers.answers;
        for (i = 0, len = ref.length; i < len; i++) {
          answer = ref[i];
          booking["question" + answer.question_id] = answer.value;
        }
        return ModalForm.edit({
          model: booking,
          title: 'Booking Details',
          templateUrl: 'edit_booking_modal_form.html',
          windowClass: 'member_edit_booking_form',
          success: updateBookings
        });
      });
    };
    updateBookings = function() {
      return $scope.getUpcomingBookings();
    };
    $scope.cancel = function(booking) {
      var modalInstance;
      modalInstance = $modal.open({
        templateUrl: "member_booking_delete_modal.html",
        windowClass: "bbug",
        controller: function($scope, $rootScope, $modalInstance, booking) {
          $scope.controller = "ModalDelete";
          $scope.booking = booking;
          $scope.confirm_delete = function() {
            return $modalInstance.close(booking);
          };
          return $scope.cancel = function() {
            return $modalInstance.dismiss("cancel");
          };
        },
        resolve: {
          booking: function() {
            return booking;
          }
        }
      });
      return modalInstance.result.then(function(booking) {
        return $scope.cancelBooking(booking);
      });
    };
    getBookings = function(params) {
      var defer;
      $scope.loading = true;
      defer = $q.defer();
      MemberBookingService.query($scope.member, params).then(function(bookings) {
        $scope.loading = false;
        return defer.resolve(bookings);
      }, function(err) {
        $log.error(err.data);
        return $scope.loading = false;
      });
      return defer.promise;
    };
    $scope.cancelBooking = function(booking) {
      $scope.loading = true;
      return MemberBookingService.cancel($scope.member, booking).then(function() {
        var removeBooking;
        $rootScope.$broadcast("booking:cancelled");
        removeBooking = function(booking, bookings) {
          return bookings.filter(function(b) {
            return b.id !== booking.id;
          });
        };
        if ($scope.past_bookings) {
          $scope.past_bookings = removeBooking(booking, $scope.past_bookings);
        }
        if ($scope.upcoming_bookings) {
          $scope.upcoming_bookings = removeBooking(booking, $scope.upcoming_bookings);
        }
        if ($scope.removeBooking) {
          $scope.removeBooking(booking);
        }
        return $scope.loading = false;
      });
    };
    return $scope.getPrePaidBookings = function(params) {
      var defer;
      $scope.loading = true;
      defer = $q.defer();
      MemberPrePaidBookingService.query($scope.member, params).then(function(bookings) {
        $scope.loading = false;
        $scope.pre_paid_bookings = bookings;
        return defer.resolve(bookings);
      }, function(err) {
        defer.reject([]);
        $log.error(err.data);
        return $scope.loading = false;
      });
      return defer.promise;
    };
  });

}).call(this);

(function() {
  angular.module("BBMember").controller("MemberPurchases", function($scope, $q, MemberPurchaseService, $log) {
    return $scope.getPurchases = function() {
      var defer;
      $scope.notLoaded($scope);
      defer = $q.defer();
      MemberPurchaseService.query($scope.member, {}).then(function(purchases) {
        $scope.purchases = purchases;
        $scope.setLoaded($scope);
        return defer.resolve(purchases);
      }, function(err) {
        $log.error(err.data);
        $scope.setLoaded($scope);
        return defer.reject([]);
      });
      return defer.promise;
    };
  });

}).call(this);

(function() {
  angular.module("BBMember").controller("Wallet", function($scope, $q, WalletService, $log, $modal, $rootScope, AlertService) {
    var updateClient;
    $scope.getWalletForMember = function(member, params) {
      var defer;
      defer = $q.defer();
      $scope.notLoaded($scope);
      WalletService.getWalletForMember(member, params).then(function(wallet) {
        $scope.setLoaded($scope);
        $scope.wallet = wallet;
        updateClient(wallet);
        return defer.resolve(wallet);
      }, function(err) {
        $scope.setLoaded($scope);
        return defer.reject();
      });
      return defer.promise;
    };
    $scope.getWalletLogs = function() {
      var defer;
      defer = $q.defer();
      $scope.notLoaded($scope);
      WalletService.getWalletLogs($scope.wallet).then(function(logs) {
        logs = _.sortBy(logs, function(log) {
          return -moment(log.created_at).unix();
        });
        $scope.setLoaded($scope);
        $scope.logs = logs;
        return defer.resolve(logs);
      }, function(err) {
        $scope.setLoaded($scope);
        $log.error(err.data);
        return defer.reject([]);
      });
      return defer.promise;
    };
    $scope.getWalletPurchaseBandsForWallet = function(wallet) {
      var defer;
      defer = $q.defer();
      $scope.notLoaded($scope);
      WalletService.getWalletPurchaseBandsForWallet(wallet).then(function(bands) {
        $scope.bands = bands;
        $scope.setLoaded($scope);
        return defer.resolve(bands);
      }, function(err) {
        $scope.setLoaded($scope);
        $log.error(err.data);
        return defer.resolve([]);
      });
      return defer.promise;
    };
    $scope.createWalletForMember = function(member) {
      $scope.notLoaded($scope);
      return WalletService.createWalletForMember(member).then(function(wallet) {
        $scope.setLoaded($scope);
        return $scope.wallet = wallet;
      }, function(err) {
        $scope.setLoaded($scope);
        return $log.error(err.data);
      });
    };
    $scope.updateWallet = function(member, amount, band) {
      var params;
      if (band == null) {
        band = null;
      }
      $scope.notLoaded($scope);
      if (member) {
        params = {};
        if (amount > 0) {
          params.amount = amount;
        }
        if ($scope.wallet) {
          params.wallet_id = $scope.wallet.id;
        }
        if ($scope.total) {
          params.total_id = $scope.total.id;
        }
        if ($scope.deposit) {
          params.deposit = $scope.deposit;
        }
        if ($scope.basket) {
          params.basket_total_price = $scope.basket.total_price;
        }
        if (band) {
          params.band_id = band.id;
        }
        return WalletService.updateWalletForMember(member, params).then(function(wallet) {
          $scope.setLoaded($scope);
          $scope.wallet = wallet;
          return $rootScope.$broadcast("wallet:updated", wallet, band);
        }, function(err) {
          $scope.setLoaded($scope);
          return $log.error(err.data);
        });
      }
    };
    $scope.activateWallet = function(member) {
      var params;
      $scope.notLoaded($scope);
      if (member) {
        params = {
          status: 1
        };
        if ($scope.wallet) {
          params.wallet_id = $scope.wallet.id;
        }
        return WalletService.updateWalletForMember(member, params).then(function(wallet) {
          $scope.setLoaded($scope);
          return $scope.wallet = wallet;
        }, function(err) {
          $scope.setLoaded($scope);
          return $log.error(err.date);
        });
      }
    };
    $scope.deactivateWallet = function(member) {
      var params;
      $scope.notLoaded($scope);
      if (member) {
        params = {
          status: 0
        };
        if ($scope.wallet) {
          params.wallet_id = $scope.wallet.id;
        }
        return WalletService.updateWalletForMember(member, params).then(function(wallet) {
          $scope.setLoaded($scope);
          return $scope.wallet = wallet;
        }, function(err) {
          $scope.setLoaded($scope);
          return $log.error(err.date);
        });
      }
    };
    $scope.purchaseBand = function(band) {
      $scope.selected_band = band;
      return $scope.updateWallet($scope.member, band.wallet_amount, band);
    };
    $scope.walletPaymentDone = function() {
      return $scope.getWalletForMember($scope.member).then(function(wallet) {
        AlertService.raise('TOPUP_SUCCESS');
        $rootScope.$broadcast("wallet:topped_up", wallet);
        return $scope.wallet_topped_up = true;
      });
    };
    $scope.basketWalletPaymentDone = function() {
      $scope.callSetLoaded();
      return $scope.decideNextPage('checkout');
    };
    $scope.error = function(message) {
      return AlertService.warning('TOPUP_FAILED');
    };
    $scope.add = function(value) {
      value = value || $scope.amount_increment;
      return $scope.amount += value;
    };
    $scope.subtract = function(value) {
      value = value || $scope.amount_increment;
      return $scope.add(-value);
    };
    $scope.isSubtractValid = function(value) {
      var new_amount;
      if (!$scope.wallet) {
        return false;
      }
      value = value || $scope.amount_increment;
      new_amount = $scope.amount - value;
      return new_amount >= $scope.wallet.min_amount;
    };
    return updateClient = function(wallet) {
      if ($scope.member.self === $scope.client.self) {
        return $scope.client.wallet_amount = wallet.amount;
      }
    };
  });

}).call(this);

(function() {
  angular.module('BBMember').directive('memberBookings', function($rootScope) {
    return {
      templateUrl: 'member_bookings_tabs.html',
      scope: {
        member: '='
      },
      link: function(scope, element, attrs) {}
    };
  });

}).call(this);

(function() {
  angular.module('BBMember').directive('memberBookingsTable', function($modal, $log, $rootScope, MemberLoginService, MemberBookingService, $compile, $templateCache, ModalForm, BBModel, Dialog) {
    var controller;
    controller = function($scope, $modal) {
      var getBookings;
      $scope.loading = true;
      $scope.fields || ($scope.fields = ['datetime', 'details']);
      $scope.$watch('member', function(member) {
        if (member != null) {
          return getBookings($scope, member);
        }
      });
      $scope.edit = function(id) {
        var booking;
        booking = _.find($scope.booking_models, function(b) {
          return b.id === id;
        });
        return booking.getAnswersPromise().then(function(answers) {
          var answer, j, len, ref;
          ref = answers.answers;
          for (j = 0, len = ref.length; j < len; j++) {
            answer = ref[j];
            booking["question" + answer.question_id] = answer.value;
          }
          return ModalForm.edit({
            model: booking,
            title: 'Booking Details',
            templateUrl: 'edit_booking_modal_form.html',
            success: function(b) {
              var i;
              b = new BBModel.Member.Booking(b);
              i = _.indexOf($scope.booking_models, function(b) {
                return b.id === id;
              });
              $scope.booking_models[i] = b;
              return $scope.setRows();
            }
          });
        });
      };
      $scope.cancel = function(id) {
        var booking, modalInstance;
        booking = _.find($scope.booking_models, function(b) {
          return b.id === id;
        });
        modalInstance = $modal.open({
          templateUrl: 'member_bookings_table_cancel_booking.html',
          controller: function($scope, $modalInstance, booking) {
            $scope.booking = booking;
            $scope.booking.notify = true;
            $scope.ok = function() {
              return $modalInstance.close($scope.booking);
            };
            return $scope.close = function() {
              return $modalInstance.dismiss();
            };
          },
          scope: $scope,
          resolve: {
            booking: function() {
              return booking;
            }
          }
        });
        return modalInstance.result.then(function(booking) {
          var params;
          $scope.loading = true;
          params = {
            notify: booking.notify
          };
          return booking.$post('cancel', params).then(function() {
            var i;
            i = _.findIndex($scope.booking_models, function(b) {
              console.log(b);
              return b.id === booking.id;
            });
            $scope.booking_models.splice(i, 1);
            $scope.setRows();
            return $scope.loading = false;
          });
        });
      };
      $scope.setRows = function() {
        return $scope.bookings = _.map($scope.booking_models, function(booking) {
          return {
            id: booking.id,
            date: moment(booking.datetime).format('YYYY-MM-DD'),
            datetime: moment(booking.datetime).format('ddd DD MMM YY HH:mm'),
            details: booking.full_describe
          };
        });
      };
      getBookings = function($scope, member) {
        var params;
        params = {
          start_date: $scope.startDate.format('YYYY-MM-DD'),
          end_date: $scope.endDate ? $scope.endDate.format('YYYY-MM-DD') : void 0
        };
        return MemberBookingService.query(member, params).then(function(bookings) {
          $scope.booking_models = bookings;
          $scope.setRows();
          return $scope.loading = false;
        }, function(err) {
          $log.error(err.data);
          return $scope.loading = false;
        });
      };
      $scope.startDate || ($scope.startDate = moment());
      $scope.orderBy || ($scope.orderBy = 'datetime');
      $scope.now = moment().format('YYYY-MM-DD');
      if ($scope.member) {
        return getBookings($scope, $scope.member);
      }
    };
    return {
      controller: controller,
      templateUrl: 'member_bookings_table.html',
      scope: {
        apiUrl: '@',
        fields: '=?',
        member: '=',
        startDate: '=?',
        endDate: '=?'
      }
    };
  });

}).call(this);


/*
* @ngdoc directive
* @name BBMember.directive:memberForm
* @scope
* @restrict E
*
* @description
* Member form, validates & submits a form that represents a member/client
*
* @param {string}    apiUrl              Expexts to be bled through the scope (MUST FIX)
* @param {object}    member              Member object
* @param {function}  onSuccessSave       On save success callback
* @param {function}  onFailSave          On save fail callback
* @param {function}  onValidationError   On validation fail callback
*
 */

(function() {
  angular.module('BBMember').directive('memberForm', function($modal, $log, $rootScope, MemberLoginService, MemberBookingService, AlertService) {
    return {
      template: "<form sf-schema=\"schema\" name=\"memberForm\" sf-form=\"form\" sf-model=\"member\"\n  ng-submit=\"submit(memberForm, member)\" ng-hide=\"loading\"></form>",
      scope: {
        apiUrl: '@',
        member: '=',
        onSuccessSave: '=',
        onFailSave: '=',
        onValidationError: '='
      },
      link: function(scope, element, attrs) {
        var base, base1;
        $rootScope.bb || ($rootScope.bb = {});
        (base = $rootScope.bb).api_url || (base.api_url = attrs.apiUrl);
        return (base1 = $rootScope.bb).api_url || (base1.api_url = "http://www.bookingbug.com");
      },
      controller: function($scope) {
        $scope.loading = true;
        $scope.$watch('member', function(member) {
          if (member != null) {
            if (member.$has('edit_member')) {
              return member.$get('edit_member').then(function(member_schema) {
                $scope.form = member_schema.form;
                $scope.schema = member_schema.schema;
                return $scope.loading = false;
              });
            } else if (member.$has('edit')) {
              return member.$get('edit').then(function(member_schema) {
                $scope.form = member_schema.form;
                $scope.schema = member_schema.schema;
                return $scope.loading = false;
              });
            }
          }
        });
        return $scope.submit = function(form, data) {
          $scope.$broadcast('schemaFormValidate');
          if (form.$valid) {
            $scope.loading = true;
            return $scope.member.$put('self', {}, data).then(function(member) {
              $scope.loading = false;
              AlertService.raise('UPDATE_SUCCESS');
              if (typeof $scope.onSuccessSave === 'function') {
                return $scope.onSuccessSave();
              }
            }, function(err) {
              $scope.loading = false;
              AlertService.raise('UPDATE_FAILED');
              if (typeof $scope.onFailSave === 'function') {
                return $scope.onFailSave();
              }
            });
          } else {
            if (typeof $scope.onValidationError === 'function') {
              return $scope.onValidationError();
            }
          }
        };
      }
    };
  });

}).call(this);

(function() {
  angular.module('BBMember').directive('loginMember', function($modal, $log, $rootScope, MemberLoginService, $templateCache, $q, $sessionStorage, halClient) {
    var link, loginMemberController, pickCompanyController;
    loginMemberController = function($scope, $modalInstance, company_id) {
      $scope.title = 'Login';
      $scope.schema = {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            title: 'Email'
          },
          password: {
            type: 'string',
            title: 'Password'
          }
        }
      };
      $scope.form = [
        {
          key: 'email',
          type: 'email',
          feedback: false,
          autofocus: true
        }, {
          key: 'password',
          type: 'password',
          feedback: false
        }
      ];
      $scope.login_form = {};
      $scope.submit = function(form) {
        var options;
        options = {
          company_id: company_id
        };
        return MemberLoginService.login(form, options).then(function(member) {
          member.email = form.email;
          member.password = form.password;
          return $modalInstance.close(member);
        }, function(err) {
          return $modalInstance.dismiss(err);
        });
      };
      return $scope.cancel = function() {
        return $modalInstance.dismiss('cancel');
      };
    };
    pickCompanyController = function($scope, $modalInstance, companies) {
      var c;
      $scope.title = 'Pick Company';
      $scope.schema = {
        type: 'object',
        properties: {
          company_id: {
            type: 'integer',
            title: 'Company'
          }
        }
      };
      $scope.schema.properties.company_id["enum"] = (function() {
        var i, len, results;
        results = [];
        for (i = 0, len = companies.length; i < len; i++) {
          c = companies[i];
          results.push(c.id);
        }
        return results;
      })();
      $scope.form = [
        {
          key: 'company_id',
          type: 'select',
          titleMap: (function() {
            var i, len, results;
            results = [];
            for (i = 0, len = companies.length; i < len; i++) {
              c = companies[i];
              results.push({
                value: c.id,
                name: c.name
              });
            }
            return results;
          })(),
          autofocus: true
        }
      ];
      $scope.pick_company_form = {};
      $scope.submit = function(form) {
        return $modalInstance.close(form.company_id);
      };
      return $scope.cancel = function() {
        return $modalInstance.dismiss('cancel');
      };
    };
    link = function(scope, element, attrs) {
      var base, base1, loginModal, pickCompanyModal, session_member, tryLogin;
      $rootScope.bb || ($rootScope.bb = {});
      (base = $rootScope.bb).api_url || (base.api_url = scope.apiUrl);
      (base1 = $rootScope.bb).api_url || (base1.api_url = "http://www.bookingbug.com");
      loginModal = function() {
        var modalInstance;
        modalInstance = $modal.open({
          templateUrl: 'login_modal_form.html',
          controller: loginMemberController,
          resolve: {
            company_id: function() {
              return scope.companyId;
            }
          }
        });
        return modalInstance.result.then(function(result) {
          scope.memberEmail = result.email;
          scope.memberPassword = result.password;
          if (result.$has('members')) {
            return result.$get('members').then(function(members) {
              var m;
              scope.members = members;
              return $q.all((function() {
                var i, len, results;
                results = [];
                for (i = 0, len = members.length; i < len; i++) {
                  m = members[i];
                  results.push(m.$get('company'));
                }
                return results;
              })()).then(function(companies) {
                return pickCompanyModal(companies);
              });
            });
          } else {
            return scope.member = result;
          }
        }, function() {
          return loginModal();
        });
      };
      pickCompanyModal = function(companies) {
        var modalInstance;
        modalInstance = $modal.open({
          templateUrl: 'pick_company_modal_form.html',
          controller: pickCompanyController,
          resolve: {
            companies: function() {
              return companies;
            }
          }
        });
        return modalInstance.result.then(function(company_id) {
          scope.companyId = company_id;
          return tryLogin();
        }, function() {
          return pickCompanyModal();
        });
      };
      tryLogin = function() {
        var login_form, options;
        login_form = {
          email: scope.memberEmail,
          password: scope.memberPassword
        };
        options = {
          company_id: scope.companyId
        };
        return MemberLoginService.login(login_form, options).then(function(result) {
          if (result.$has('members')) {
            return result.$get('members').then(function(members) {
              var m;
              scope.members = members;
              return $q.all((function() {
                var i, len, results;
                results = [];
                for (i = 0, len = members.length; i < len; i++) {
                  m = members[i];
                  results.push(m.$get('company'));
                }
                return results;
              })()).then(function(companies) {
                return pickCompanyModal(companies);
              });
            });
          } else {
            return scope.member = result;
          }
        }, function(err) {
          return loginModal();
        });
      };
      if (scope.memberEmail && scope.memberPassword) {
        return tryLogin();
      } else if ($sessionStorage.getItem("login")) {
        session_member = $sessionStorage.getItem("login");
        session_member = halClient.createResource(session_member);
        return scope.member = session_member;
      } else {
        return loginModal();
      }
    };
    return {
      link: link,
      scope: {
        memberEmail: '@',
        memberPassword: '@',
        companyId: '@',
        apiUrl: '@',
        member: '='
      },
      transclude: true,
      template: "<div ng-show='member' ng-transclude></div>"
    };
  });

}).call(this);

(function() {
  angular.module('BBMember').directive('bbMemberPastBookings', function($rootScope, PaginationService) {
    return {
      templateUrl: 'member_past_bookings.html',
      scope: {
        member: '='
      },
      controller: 'MemberBookings',
      link: function(scope, element, attrs) {
        var getBookings;
        scope.pagination = PaginationService.initialise({
          page_size: 10,
          max_size: 5
        });
        getBookings = function() {
          return scope.getPastBookings().then(function(past_bookings) {
            return PaginationService.update(scope.pagination, past_bookings.length);
          });
        };
        scope.$watch('member', function() {
          if (!scope.past_bookings) {
            return getBookings();
          }
        });
        return $rootScope.connection_started.then(function() {
          return getBookings();
        });
      }
    };
  });

}).call(this);

(function() {
  angular.module('BBMember').directive('bbMemberPrePaidBookings', function($rootScope, PaginationService) {
    return {
      templateUrl: 'member_pre_paid_bookings.html',
      scope: {
        member: '='
      },
      controller: 'MemberBookings',
      link: function(scope, element, attrs) {
        var getBookings;
        scope.pagination = PaginationService.initialise({
          page_size: 10,
          max_size: 5
        });
        getBookings = function() {
          return scope.getPrePaidBookings({}).then(function(pre_paid_bookings) {
            return PaginationService.update(scope.pagination, pre_paid_bookings.length);
          });
        };
        scope.$watch('member', function() {
          if (!scope.pre_paid_bookings) {
            return getBookings();
          }
        });
        return $rootScope.connection_started.then(function() {
          return getBookings();
        });
      }
    };
  });

}).call(this);

(function() {
  angular.module('BBMember').directive('bbMemberPurchases', function($rootScope, PaginationService) {
    return {
      templateUrl: 'member_purchases.html',
      scope: true,
      controller: 'MemberPurchases',
      link: function(scope, element, attrs) {
        scope.member = scope.$eval(attrs.member);
        if ($rootScope.member) {
          scope.member || (scope.member = $rootScope.member);
        }
        scope.pagination = PaginationService.initialise({
          page_size: 10,
          max_size: 5
        });
        return $rootScope.connection_started.then(function() {
          if (scope.member) {
            return scope.getPurchases().then(function(purchases) {
              return PaginationService.update(scope.pagination, purchases.length);
            });
          }
        });
      }
    };
  });

}).call(this);

(function() {
  angular.module('BBMember').directive('memberSsoLogin', function($rootScope, LoginService, $sniffer, $timeout, QueryStringService) {
    return {
      scope: {
        token: '@memberSsoLogin',
        company_id: '@companyId'
      },
      transclude: true,
      template: "<div ng-if='member' ng-transclude></div>",
      link: function(scope, element, attrs) {
        var data, options;
        options = {
          root: $rootScope.bb.api_url,
          company_id: scope.company_id
        };
        data = {};
        if (scope.token) {
          data.token = scope.token;
        }
        data.token || (data.token = QueryStringService('sso_token'));
        if ($sniffer.msie && $sniffer.msie < 10 && $rootScope.iframe_proxy_ready === false) {
          return $timeout(function() {
            return LoginService.ssoLogin(options, data).then(function(member) {
              return scope.member = member;
            });
          }, 2000);
        } else {
          return LoginService.ssoLogin(options, data).then(function(member) {
            return scope.member = member;
          });
        }
      }
    };
  });

}).call(this);

(function() {
  angular.module('BBMember').directive('bbMemberUpcomingBookings', function($rootScope, PaginationService) {
    return {
      templateUrl: 'member_upcoming_bookings.html',
      scope: {
        member: '='
      },
      controller: 'MemberBookings',
      link: function(scope, element, attrs) {
        var getBookings;
        scope.pagination = PaginationService.initialise({
          page_size: 10,
          max_size: 5
        });
        getBookings = function() {
          return scope.getUpcomingBookings().then(function(upcoming_bookings) {
            return PaginationService.update(scope.pagination, upcoming_bookings.length);
          });
        };
        scope.$on('updateBookings', function() {
          scope.flushBookings();
          return getBookings();
        });
        scope.$watch('member', function() {
          if (!scope.upcoming_bookings) {
            return getBookings();
          }
        });
        return $rootScope.connection_started.then(function() {
          return getBookings();
        });
      }
    };
  });

}).call(this);

(function() {
  angular.module('BBMember').directive('bbWallet', function($rootScope) {
    return {
      scope: true,
      controller: 'Wallet',
      templateUrl: 'wallet.html',
      link: function(scope, element, attrs) {
        scope.member = scope.$eval(attrs.member);
        if ($rootScope.member) {
          scope.member || (scope.member = $rootScope.member);
        }
        scope.show_wallet_logs = true;
        scope.show_topup_box = false;
        $rootScope.connection_started.then(function() {
          if (scope.member) {
            return scope.getWalletForMember(scope.member);
          }
        });
        scope.$on('wallet:topped_up', function(event, wallet) {
          scope.wallet = wallet;
          scope.show_topup_box = false;
          return scope.show_wallet_logs = true;
        });
        return scope.$on("booking:cancelled", function(event) {
          if (scope.member) {
            return scope.getWalletForMember(scope.member);
          }
        });
      }
    };
  });

}).call(this);

(function() {
  angular.module('BBMember').directive('bbWalletLogs', function($rootScope, PaginationService) {
    return {
      templateUrl: 'wallet_logs.html',
      scope: true,
      controller: 'Wallet',
      require: '^?bbWallet',
      link: function(scope, element, attrs, ctrl) {
        var getWalletLogs;
        scope.member = scope.$eval(attrs.member);
        if ($rootScope.member) {
          scope.member || (scope.member = $rootScope.member);
        }
        scope.pagination = PaginationService.initialise({
          page_size: 10,
          max_size: 5
        });
        getWalletLogs = function() {
          return scope.getWalletLogs().then(function(logs) {
            return PaginationService.update(scope.pagination, logs.length);
          });
        };
        scope.$on('wallet:topped_up', function(event) {
          return getWalletLogs();
        });
        return $rootScope.connection_started.then(function() {
          var deregisterWatch;
          if (ctrl) {
            return deregisterWatch = scope.$watch('wallet', function() {
              if (scope.wallet) {
                getWalletLogs();
                return deregisterWatch();
              }
            });
          } else {
            return scope.getWalletForMember(scope.member).then(function() {
              return getWalletLogs();
            });
          }
        });
      }
    };
  });

}).call(this);

(function() {
  angular.module("BB.Directives").directive("bbWalletPayment", function($sce, $rootScope, $window, $location, SettingsService, AlertService) {
    return {
      restrict: 'A',
      controller: 'Wallet',
      scope: true,
      replace: true,
      require: '^?bbWallet',
      link: function(scope, element, attrs, ctrl) {
        var calculateAmount, getHost, one_pound, sendLoadEvent;
        one_pound = 100;
        scope.wallet_payment_options = scope.$eval(attrs.bbWalletPayment) || {};
        scope.member = scope.$eval(attrs.member);
        if ($rootScope.member) {
          scope.member || (scope.member = $rootScope.member);
        }
        if (scope.wallet_payment_options.member) {
          scope.member || (scope.member = scope.wallet_payment_options.member);
        }
        scope.amount_increment = scope.wallet_payment_options.amount_increment || one_pound;
        getHost = function(url) {
          var a;
          a = document.createElement('a');
          a.href = url;
          return a['protocol'] + '//' + a['host'];
        };
        sendLoadEvent = function(element, origin, scope) {
          var custom_partial_url, custom_stylesheet, payload, referrer;
          referrer = $location.protocol() + "://" + $location.host();
          if ($location.port()) {
            referrer += ":" + $location.port();
          }
          custom_stylesheet = scope.wallet_payment_options.custom_stylesheet ? scope.wallet_payment_options.custom_stylesheet : null;
          custom_partial_url = scope.bb && scope.bb.custom_partial_url ? scope.bb.custom_partial_url : null;
          payload = JSON.stringify({
            'type': 'load',
            'message': referrer,
            'custom_partial_url': custom_partial_url,
            'custom_stylesheet': custom_stylesheet,
            'scroll_offset': SettingsService.getScrollOffset()
          });
          return element.find('iframe')[0].contentWindow.postMessage(payload, origin);
        };
        calculateAmount = function() {
          var amount_due;
          if (scope.wallet_payment_options.basket_topup) {
            amount_due = scope.bb.basket.dueTotal() - scope.wallet.amount;
            if (amount_due > scope.wallet.min_amount) {
              scope.amount = Math.ceil(amount_due / scope.amount_increment) * scope.amount_increment;
            } else {
              scope.amount = scope.wallet.min_amount;
            }
            return scope.min_amount = scope.amount;
          } else if (scope.wallet.min_amount) {
            scope.amount = scope.wallet_payment_options.amount && scope.wallet_payment_options.amount > scope.wallet.min_amount ? scope.wallet_payment_options.amount : scope.wallet.min_amount;
            return scope.min_amount = scope.wallet.min_amount;
          } else {
            scope.min_amount = 0;
            if (scope.wallet_payment_options.amount) {
              return scope.amount = scope.wallet_payment_options.amount;
            }
          }
        };
        $rootScope.connection_started.then(function() {
          var deregisterWatch;
          if (ctrl) {
            return deregisterWatch = scope.$watch('wallet', function() {
              if (scope.wallet) {
                calculateAmount();
                return deregisterWatch();
              }
            });
          } else {
            return scope.getWalletForMember(scope.member).then(function() {
              return calculateAmount();
            });
          }
        });
        scope.$on('wallet:updated', function(event, wallet, band) {
          if (band == null) {
            band = null;
          }
          if (wallet.$has('new_payment')) {
            scope.notLoaded(scope);
            if (band) {
              scope.amount = band.actual_amount;
            }
            scope.wallet_payment_url = $sce.trustAsResourceUrl(wallet.$href("new_payment"));
            scope.show_payment_iframe = true;
            return element.find('iframe').bind('load', (function(_this) {
              return function(event) {
                var origin, url;
                if (scope.wallet_payment_url) {
                  url = scope.wallet_payment_url;
                }
                origin = getHost(url);
                sendLoadEvent(element, origin, scope);
                return scope.$apply(function() {
                  return scope.setLoaded(scope);
                });
              };
            })(this));
          }
        });
        return $window.addEventListener('message', (function(_this) {
          return function(event) {
            var data;
            if (angular.isObject(event.data)) {
              data = event.data;
            } else if (!event.data.match(/iFrameSizer/)) {
              data = JSON.parse(event.data);
            }
            return scope.$apply(function() {
              if (data) {
                switch (data.type) {
                  case "submitting":
                    return scope.notLoaded(scope);
                  case "error":
                    $rootScope.$broadcast("wallet:topup_failed");
                    scope.notLoaded(scope);
                    document.getElementsByTagName("iframe")[0].src += '';
                    return AlertService.raise('PAYMENT_FAILED');
                  case "payment_complete":
                  case "wallet_payment_complete":
                  case "basket_wallet_payment_complete":
                    scope.show_payment_iframe = false;
                    if (scope.wallet_payment_options.basket_topup) {
                      return scope.basketWalletPaymentDone();
                    } else {
                      return scope.walletPaymentDone();
                    }
                }
              }
            });
          };
        })(this), false);
      }
    };
  });

}).call(this);

(function() {
  angular.module("BB.Directives").directive("bbWalletPurchaseBands", function($rootScope) {
    return {
      scope: true,
      restrict: "AE",
      templateUrl: "wallet_purchase_bands.html",
      controller: "Wallet",
      require: '^?bbWallet',
      link: function(scope, attr, elem, ctrl) {
        scope.member = scope.$eval(attr.member);
        if ($rootScope.member) {
          scope.member || (scope.member = $rootScope.member);
        }
        return $rootScope.connection_started.then(function() {
          var deregisterWatch;
          if (ctrl) {
            return deregisterWatch = scope.$watch('wallet', function() {
              if (scope.wallet) {
                scope.getWalletPurchaseBandsForWallet(scope.wallet);
                return deregisterWatch();
              }
            });
          } else {
            return scope.getWalletForMember(scope.member).then(function() {
              return scope.getWalletPurchaseBandsForWallet(scope.wallet);
            });
          }
        });
      }
    };
  });

}).call(this);

(function() {
  'use strict';
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  angular.module('BB.Models').factory("Member.BookingModel", function($q, $window, BBModel, BaseModel, $bbug) {
    var Member_Booking;
    return Member_Booking = (function(superClass) {
      extend(Member_Booking, superClass);

      function Member_Booking(data) {
        this.getMemberPromise = bind(this.getMemberPromise, this);
        Member_Booking.__super__.constructor.call(this, data);
        this.datetime = moment.parseZone(this.datetime);
        if (this.time_zone) {
          this.datetime.tz(this.time_zone);
        }
        this.end_datetime = moment.parseZone(this.end_datetime);
        if (this.time_zone) {
          this.end_datetime.tz(this.time_zone);
        }
        this.min_cancellation_time = moment(this.min_cancellation_time);
        this.min_cancellation_hours = this.datetime.diff(this.min_cancellation_time, 'hours');
      }

      Member_Booking.prototype.getGroup = function() {
        if (this.group) {
          return this.group;
        }
        if (this._data.$has('event_groups')) {
          return this._data.$get('event_groups').then((function(_this) {
            return function(group) {
              _this.group = group;
              return _this.group;
            };
          })(this));
        }
      };

      Member_Booking.prototype.getColour = function() {
        if (this.getGroup()) {
          return this.getGroup().colour;
        } else {
          return "#FFFFFF";
        }
      };

      Member_Booking.prototype.getCompany = function() {
        if (this.company) {
          return this.company;
        }
        if (this.$has('company')) {
          return this._data.$get('company').then((function(_this) {
            return function(company) {
              _this.company = new BBModel.Company(company);
              return _this.company;
            };
          })(this));
        }
      };

      Member_Booking.prototype.getAnswers = function() {
        var defer;
        defer = $q.defer();
        if (this.answers) {
          defer.resolve(this.answers);
        }
        if (this._data.$has('answers')) {
          this._data.$get('answers').then((function(_this) {
            return function(answers) {
              var a;
              _this.answers = (function() {
                var i, len, results;
                results = [];
                for (i = 0, len = answers.length; i < len; i++) {
                  a = answers[i];
                  results.push(new BBModel.Answer(a));
                }
                return results;
              })();
              return defer.resolve(_this.answers);
            };
          })(this));
        } else {
          defer.resolve([]);
        }
        return defer.promise;
      };

      Member_Booking.prototype.getMemberPromise = function() {
        var defer;
        defer = $q.defer();
        if (this.member) {
          defer.resolve(this.member);
        }
        if (this._data.$has('member')) {
          this._data.$get('member').then((function(_this) {
            return function(member) {
              _this.member = new BBModel.Member.Member(member);
              return defer.resolve(_this.member);
            };
          })(this));
        }
        return defer.promise;
      };

      Member_Booking.prototype.canCancel = function() {
        return moment(this.min_cancellation_time).isAfter(moment());
      };

      Member_Booking.prototype.canMove = function() {
        return this.canCancel();
      };

      return Member_Booking;

    })(BaseModel);
  });

}).call(this);

(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  angular.module('BB.Models').factory("Member.MemberModel", function($q, BBModel, BaseModel, ClientModel) {
    var Member_Member;
    return Member_Member = (function(superClass) {
      extend(Member_Member, superClass);

      function Member_Member() {
        return Member_Member.__super__.constructor.apply(this, arguments);
      }

      return Member_Member;

    })(ClientModel);
  });

}).call(this);

(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  angular.module("BB.Models").factory("Member.WalletModel", function(BBModel, BaseModel) {
    var Member_Wallet;
    return Member_Wallet = (function(superClass) {
      extend(Member_Wallet, superClass);

      function Member_Wallet(data) {
        Member_Wallet.__super__.constructor.call(this, data);
      }

      return Member_Wallet;

    })(BaseModel);
  });

}).call(this);

(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  angular.module("BB.Models").factory("Member.WalletLogModel", function($q, BBModel, BaseModel) {
    var Member_WalletLog;
    return Member_WalletLog = (function(superClass) {
      extend(Member_WalletLog, superClass);

      function Member_WalletLog(data) {
        Member_WalletLog.__super__.constructor.call(this, data);
        this.created_at = moment(this.created_at);
        this.payment_amount = parseFloat(this.amount) * 100;
        this.new_wallet_amount = parseFloat(this.new_wallet_amount) * 100;
      }

      return Member_WalletLog;

    })(BaseModel);
  });

}).call(this);

(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  angular.module("BB.Models").factory('Member.WalletPurchaseBandModel', function(BBModel, BaseModel) {
    var Member_WalletPurchaseBand;
    return Member_WalletPurchaseBand = (function(superClass) {
      extend(Member_WalletPurchaseBand, superClass);

      function Member_WalletPurchaseBand(data) {
        Member_WalletPurchaseBand.__super__.constructor.call(this, data);
      }

      return Member_WalletPurchaseBand;

    })(BaseModel);
  });

}).call(this);

(function() {
  angular.module('BBMember.Services').factory("MemberBookingService", function($q, SpaceCollections, $rootScope, MemberService, BBModel) {
    return {
      query: function(member, params) {
        var deferred;
        deferred = $q.defer();
        if (!member.$has('bookings')) {
          deferred.reject("member does not have bookings");
        } else {
          member.$get('bookings', params).then((function(_this) {
            return function(bookings) {
              var booking;
              if (angular.isArray(bookings)) {
                bookings = (function() {
                  var i, len, results;
                  results = [];
                  for (i = 0, len = bookings.length; i < len; i++) {
                    booking = bookings[i];
                    results.push(new BBModel.Member.Booking(booking));
                  }
                  return results;
                })();
                return deferred.resolve(bookings);
              } else {
                return bookings.$get('bookings', params).then(function(bookings) {
                  bookings = (function() {
                    var i, len, results;
                    results = [];
                    for (i = 0, len = bookings.length; i < len; i++) {
                      booking = bookings[i];
                      results.push(new BBModel.Member.Booking(booking));
                    }
                    return results;
                  })();
                  return deferred.resolve(bookings);
                }, function(err) {
                  return deferred.reject(err);
                });
              }
            };
          })(this), function(err) {
            return deferred.reject(err);
          });
        }
        return deferred.promise;
      },
      cancel: function(member, booking) {
        var deferred;
        deferred = $q.defer();
        booking.$del('self').then((function(_this) {
          return function(b) {
            booking.deleted = true;
            b = new BBModel.Member.Booking(b);
            MemberService.refresh(member).then(function(member) {
              return member = member;
            }, function(err) {});
            return deferred.resolve(b);
          };
        })(this), (function(_this) {
          return function(err) {
            return deferred.reject(err);
          };
        })(this));
        return deferred.promise;
      },
      update: function(booking) {
        var deferred;
        deferred = $q.defer();
        $rootScope.member.flushBookings();
        booking.$put('self', {}, booking).then((function(_this) {
          return function(booking) {
            var book;
            book = new BBModel.Member.Booking(booking);
            SpaceCollections.checkItems(book);
            return deferred.resolve(book);
          };
        })(this), (function(_this) {
          return function(err) {
            _.each(booking, function(value, key, booking) {
              if (key !== 'data' && key !== 'self') {
                return booking[key] = booking.data[key];
              }
            });
            return deferred.reject(err, new BBModel.Member.Booking(booking));
          };
        })(this));
        return deferred.promise;
      },
      flush: function(member, params) {
        if (member.$has('bookings')) {
          return member.$flush('bookings', params);
        }
      }
    };
  });

}).call(this);

(function() {
  angular.module('BBMember.Services').factory("MemberLoginService", function($q, halClient, $rootScope, BBModel, $sessionStorage) {
    return {
      login: function(form, options) {
        var defer, url;
        defer = $q.defer();
        url = $rootScope.bb.api_url + "/api/v1/login";
        if (options.company_id != null) {
          url = url + "/member/" + options.company_id;
        }
        halClient.$post(url, options, form).then(function(login) {
          if (login.$has('member')) {
            return login.$get('member').then(function(member) {
              var auth_token;
              member = new BBModel.Member.Member(member);
              auth_token = member.getOption('auth_token');
              $sessionStorage.setItem("login", member.$toStore());
              $sessionStorage.setItem("auth_token", auth_token);
              return defer.resolve(member);
            });
          } else if (login.$has('members')) {
            return defer.resolve(login);
          } else {
            return defer.reject("No member account for login");
          }
        }, (function(_this) {
          return function(err) {
            var login;
            if (err.status === 400) {
              login = halClient.$parse(err.data);
              if (login.$has('members')) {
                return defer.resolve(login);
              } else {
                return defer.reject(err);
              }
            } else {
              return defer.reject(err);
            }
          };
        })(this));
        return defer.promise;
      }
    };
  });

}).call(this);

(function() {
  angular.module('BBMember.Services').factory("MemberService", function($q, halClient, $rootScope, BBModel) {
    return {
      refresh: function(member) {
        var deferred;
        deferred = $q.defer();
        member.$flush('self');
        member.$get('self').then((function(_this) {
          return function(member) {
            member = new BBModel.Member.Member(member);
            return deferred.resolve(member);
          };
        })(this), (function(_this) {
          return function(err) {
            return deferred.reject(err);
          };
        })(this));
        return deferred.promise;
      },
      current: function() {
        var callback, deferred;
        deferred = $q.defer();
        callback = function() {
          return deferred.resolve($rootScope.member);
        };
        setTimeout(callback, 200);
        return deferred.promise;
      },
      updateMember: function(member, params) {
        var deferred;
        deferred = $q.defer();
        member.$put('self', {}, params).then((function(_this) {
          return function(member) {
            member = new BBModel.Member.Member(member);
            return deferred.resolve(member);
          };
        })(this), (function(_this) {
          return function(err) {
            return deferred.reject(err);
          };
        })(this));
        return deferred.promise;
      },
      sendWelcomeEmail: function(member, params) {
        var deferred;
        deferred = $q.defer();
        member.$post('send_welcome_email', params).then((function(_this) {
          return function(member) {
            member = new BBModel.Member.Member(member);
            return deferred.resolve(member);
          };
        })(this), (function(_this) {
          return function(err) {
            return deferred.reject(err);
          };
        })(this));
        return deferred.promise;
      }
    };
  });

}).call(this);

(function() {
  angular.module('BBMember.Services').factory("MemberPrePaidBookingService", function($q, BBModel) {
    return {
      query: function(member, params) {
        var deferred;
        deferred = $q.defer();
        if (!member.$has('pre_paid_bookings')) {
          deferred.reject("member does not have pre paid bookings");
        } else {
          member.$get('pre_paid_bookings', params).then((function(_this) {
            return function(bookings) {
              var booking;
              if (angular.isArray(bookings)) {
                bookings = (function() {
                  var i, len, results;
                  results = [];
                  for (i = 0, len = bookings.length; i < len; i++) {
                    booking = bookings[i];
                    results.push(new BBModel.PrePaidBooking(booking));
                  }
                  return results;
                })();
                return deferred.resolve(bookings);
              } else {
                return bookings.$get('pre_paid_bookings', params).then(function(bookings) {
                  bookings = (function() {
                    var i, len, results;
                    results = [];
                    for (i = 0, len = bookings.length; i < len; i++) {
                      booking = bookings[i];
                      results.push(new BBModel.PrePaidBooking(booking));
                    }
                    return results;
                  })();
                  return deferred.resolve(bookings);
                });
              }
            };
          })(this), (function(_this) {
            return function(err) {
              return deferred.reject(err);
            };
          })(this));
        }
        return deferred.promise;
      }
    };
  });

}).call(this);

(function() {
  angular.module('BBMember.Services').factory("MemberPurchaseService", function($q, $rootScope, BBModel) {
    return {
      query: function(member, params) {
        var deferred;
        params || (params = {});
        params["no_cache"] = true;
        deferred = $q.defer();
        if (!member.$has('purchase_totals')) {
          deferred.reject("member does not have any purchases");
        } else {
          member.$get('purchase_totals', params).then((function(_this) {
            return function(purchases) {
              return purchases.$get('purchase_totals', params).then(function(purchases) {
                var purchase;
                purchases = (function() {
                  var i, len, results;
                  results = [];
                  for (i = 0, len = purchases.length; i < len; i++) {
                    purchase = purchases[i];
                    results.push(new BBModel.PurchaseTotal(purchase));
                  }
                  return results;
                })();
                return deferred.resolve(purchases);
              }, function(err) {
                return deferred.reject(err);
              });
            };
          })(this), function(err) {
            return deferred.reject(err);
          });
        }
        return deferred.promise;
      }
    };
  });

}).call(this);

(function() {
  angular.module("BBMember.Services").factory("WalletService", function($q, BBModel) {
    return {
      getWalletForMember: function(member, params) {
        var deferred;
        params || (params = {});
        params["no_cache"] = true;
        deferred = $q.defer();
        if (!member.$has("wallet")) {
          deferred.reject("Wallets are not turned on.");
        } else {
          member.$get("wallet", params).then(function(wallet) {
            wallet = new BBModel.Member.Wallet(wallet);
            return deferred.resolve(wallet);
          }, function(err) {
            return deferred.reject(err);
          });
        }
        return deferred.promise;
      },
      getWalletLogs: function(wallet) {
        var deferred, params;
        params = {
          no_cache: true
        };
        deferred = $q.defer();
        if (!wallet.$has('logs')) {
          deferred.reject("No wallet transactions found");
        } else {
          wallet.$get('logs', params).then(function(resource) {
            return resource.$get('logs').then(function(logs) {
              var log;
              logs = (function() {
                var i, len, results;
                results = [];
                for (i = 0, len = logs.length; i < len; i++) {
                  log = logs[i];
                  results.push(new BBModel.Member.WalletLog(log));
                }
                return results;
              })();
              return deferred.resolve(logs);
            });
          }, (function(_this) {
            return function(err) {
              return deferred.reject(err);
            };
          })(this));
        }
        return deferred.promise;
      },
      getWalletPurchaseBandsForWallet: function(wallet) {
        var deferred;
        deferred = $q.defer();
        if (!wallet.$has('purchase_bands')) {
          deferred.reject("No Purchase Bands");
        } else {
          wallet.$get("purchase_bands", {}).then(function(resource) {
            return resource.$get("purchase_bands").then(function(bands) {
              var band;
              bands = (function() {
                var i, len, results;
                results = [];
                for (i = 0, len = bands.length; i < len; i++) {
                  band = bands[i];
                  results.push(new BBModel.Member.WalletPurchaseBand(band));
                }
                return results;
              })();
              return deferred.resolve(bands);
            });
          }, function(err) {
            return deferred.reject(err);
          });
        }
        return deferred.promise;
      },
      updateWalletForMember: function(member, params) {
        var deferred;
        deferred = $q.defer();
        if (!member.$has("wallet")) {
          deferred.reject("Wallets are not turned on.");
        } else {
          member.$put("wallet", {}, params).then(function(wallet) {
            wallet = new BBModel.Member.Wallet(wallet);
            return deferred.resolve(wallet);
          }, function(err) {
            return deferred.reject(err);
          });
        }
        return deferred.promise;
      },
      createWalletForMember: function(member) {
        var deferred, params;
        deferred = $q.defer();
        params = {};
        if (!member.$has("wallet")) {
          deferred.reject("Wallets are not turned on.");
        } else {
          member.$post("wallet", {}, params).then(function(wallet) {
            wallet = new BBModel.Member.Wallet(wallet);
            return deferred.resolve(wallet);
          }, function(err) {
            return deferred.reject(err);
          });
        }
        return deferred.promise;
      }
    };
  });

}).call(this);
