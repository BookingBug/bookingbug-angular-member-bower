(function() {
  'use strict';
  angular.module('BBMember', ['BB', 'BBMember.Directives', 'BBMember.Services', 'BBMember.Filters', 'BBMember.Controllers', 'BBMember.Models', 'trNgGrid', 'pascalprecht.translate']);

  angular.module('BBMember').config(function($logProvider) {
    return $logProvider.debugEnabled(true);
  });

  angular.module('BBMember').run(function() {
    return TrNgGrid.defaultColumnOptions = {
      enableFiltering: false
    };
  });

  angular.module('BBMember.Directives', []);

  angular.module('BBMember.Filters', []);

  angular.module('BBMember.Services', ['ngResource', 'ngSanitize', 'ngLocalData']);

  angular.module('BBMember.Controllers', ['ngLocalData', 'ngSanitize']);

  angular.module('BBMember.Models', []);

  angular.module('BBMemberMockE2E', ['BBMember', 'BBAdminMockE2E']);

}).call(this);

(function() {
  angular.module('BBMember').directive('memberBookings', function($rootScope) {
    var link;
    link = function(scope, element, attrs) {
      var base, base1;
      $rootScope.bb || ($rootScope.bb = {});
      (base = $rootScope.bb).api_url || (base.api_url = scope.apiUrl);
      return (base1 = $rootScope.bb).api_url || (base1.api_url = "http://www.bookingbug.com");
    };
    return {
      link: link,
      templateUrl: 'member_bookings_tabs.html',
      scope: {
        apiUrl: '@',
        member: '='
      }
    };
  });

}).call(this);

(function() {
  angular.module('BBMember').directive('memberBookingsTable', function($modal, $log, $rootScope, MemberLoginService, MemberBookingService, $compile, $templateCache, ModalForm) {
    var controller, link;
    controller = function($scope, $modal) {
      var getBookings;
      $scope.loading = true;
      $scope.fields || ($scope.fields = ['describe', 'full_describe']);
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
          var answer, i, len, ref;
          ref = answers.answers;
          for (i = 0, len = ref.length; i < len; i++) {
            answer = ref[i];
            booking["question" + answer.question_id] = answer.value;
          }
          return ModalForm.edit({
            model: booking,
            title: 'Booking Details',
            templateUrl: 'edit_booking_modal_form.html'
          });
        });
      };
      return getBookings = function($scope, member) {
        var params;
        params = {
          start_date: moment().format('YYYY-MM-DD')
        };
        return MemberBookingService.query(member, params).then(function(bookings) {
          $scope.booking_models = bookings;
          $scope.bookings = _.map(bookings, function(booking) {
            return _.pick(booking, 'id', 'full_describe', 'describe');
          });
          return $scope.loading = false;
        }, function(err) {
          $log.error(err.data);
          return $scope.loading = false;
        });
      };
    };
    link = function(scope, element, attrs) {
      var base, base1;
      $rootScope.bb || ($rootScope.bb = {});
      (base = $rootScope.bb).api_url || (base.api_url = scope.apiUrl);
      return (base1 = $rootScope.bb).api_url || (base1.api_url = "http://www.bookingbug.com");
    };
    return {
      link: link,
      controller: controller,
      templateUrl: 'member_bookings_table.html',
      scope: {
        apiUrl: '@',
        fields: '=?',
        member: '='
      }
    };
  });

}).call(this);

(function() {
  angular.module('BBMember').directive('memberForm', function($modal, $log, $rootScope, MemberLoginService, MemberBookingService, AlertService, ErrorService) {
    return {
      template: "<form sf-schema=\"schema\" sf-form=\"form\" sf-model=\"member\"\n  ng-submit=\"submit(member)\" ng-hide=\"loading\"></form>",
      scope: {
        apiUrl: '@',
        member: '='
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
            return member.$get('edit_member').then(function(member_schema) {
              $scope.form = member_schema.form;
              $scope.schema = member_schema.schema;
              return $scope.loading = false;
            });
          }
        });
        return $scope.submit = function(form) {
          $scope.loading = true;
          return $scope.member.$put('self', {}, form).then(function(member) {
            $scope.loading = false;
            return AlertService.raise(ErrorService.getAlert('UPDATE_SUCCESS'));
          }, function(err) {
            $scope.loading = false;
            return AlertService.raise(ErrorService.getAlert('UPDATE_FAILED'));
          });
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
  angular.module('BBMember').directive('bbMemberPastBookings', function($rootScope) {
    return {
      templateUrl: 'member_past_bookings.html',
      scope: {
        apiUrl: '@',
        member: '='
      },
      controller: 'MemberBookings',
      link: function(scope, element, attrs) {
        var base, base1, getBookings;
        $rootScope.bb || ($rootScope.bb = {});
        (base = $rootScope.bb).api_url || (base.api_url = scope.apiUrl);
        (base1 = $rootScope.bb).api_url || (base1.api_url = "http://www.bookingbug.com");
        getBookings = function() {
          return scope.getPastBookings();
        };
        scope.$watch('member', function() {
          if (!scope.past_bookings) {
            return getBookings();
          }
        });
        return $rootScope.connection_started.then(function() {
          return getBookings;
        });
      }
    };
  });

}).call(this);

(function() {
  angular.module('BBMember').directive('bbMemberPrePaidBookings', function($rootScope) {
    return {
      templateUrl: 'member_pre_paid_bookings.html',
      scope: {
        apiUrl: '@',
        member: '='
      },
      controller: 'MemberBookings',
      link: function(scope, element, attrs) {
        var base, base1, getBookings;
        $rootScope.bb || ($rootScope.bb = {});
        (base = $rootScope.bb).api_url || (base.api_url = scope.apiUrl);
        (base1 = $rootScope.bb).api_url || (base1.api_url = "http://www.bookingbug.com");
        scope.loading = true;
        getBookings = function() {
          return scope.getPrePaidBookings({})["finally"](function() {
            return scope.loading = false;
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
  angular.module('BBMember').directive('memberSsoLogin', function($rootScope, LoginService, $sniffer, $timeout) {
    var link;
    link = function(scope, element, attrs) {
      var base, base1, data, options;
      $rootScope.bb || ($rootScope.bb = {});
      (base = $rootScope.bb).api_url || (base.api_url = scope.apiUrl);
      (base1 = $rootScope.bb).api_url || (base1.api_url = "http://www.bookingbug.com");
      scope.member = null;
      options = {
        root: $rootScope.bb.api_url,
        company_id: scope.companyId
      };
      data = {
        token: scope.token
      };
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
    };
    return {
      link: link,
      scope: {
        token: '@memberSsoLogin',
        companyId: '@',
        apiUrl: '@',
        member: '='
      },
      transclude: true,
      template: "<div ng-if='member' ng-transclude></div>"
    };
  });

}).call(this);

(function() {
  angular.module('BBMember').directive('bbMemberUpcomingBookings', function($rootScope) {
    return {
      templateUrl: 'member_upcoming_bookings.html',
      scope: {
        apiUrl: '@',
        member: '='
      },
      controller: 'MemberBookings',
      link: function(scope, element, attrs) {
        var base, base1, getBookings;
        $rootScope.bb || ($rootScope.bb = {});
        (base = $rootScope.bb).api_url || (base.api_url = scope.apiUrl);
        (base1 = $rootScope.bb).api_url || (base1.api_url = "http://www.bookingbug.com");
        getBookings = function() {
          return scope.getUpcomingBookings();
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
          return getBookings;
        });
      }
    };
  });

}).call(this);

(function() {
  angular.module('BBMember').directive('bbWallet', function($rootScope) {
    var link;
    link = function(scope, element, attrs) {
      var base, base1, getWalletForMember;
      $rootScope.bb || ($rootScope.bb = {});
      (base = $rootScope.bb).api_url || (base.api_url = scope.apiUrl);
      (base1 = $rootScope.bb).api_url || (base1.api_url = "http://www.bookingbug.com");
      if ($rootScope.member) {
        scope.member || (scope.member = $rootScope.member);
      }
      getWalletForMember = function() {
        return scope.getWalletForMember(scope.member, {});
      };
      scope.$watch('member', function(member) {
        if (member != null) {
          getWalletForMember();
        }
        if (scope.amount) {
          return getWalletForMember();
        }
      });
      scope.$on('wallet_payment:success', function(event, wallet) {
        scope.wallet = wallet;
        scope.payment_success = true;
        scope.error_message = false;
        return scope.show_topup_box = false;
      });
      scope.$on('wallet_payment:error', function(event, error) {
        scope.error_message = error;
        return scope.payment_success = false;
      });
      scope.$on('wallet_payment:loading', function(event) {
        return scope.loading = true;
      });
      return scope.$on('wallet_payment:finished_loading', function(event) {
        return scope.loading = false;
      });
    };
    return {
      link: link,
      controller: 'Wallet',
      templateUrl: 'wallet.html',
      scope: {
        apiUrl: '@',
        member: '='
      }
    };
  });

}).call(this);

(function() {
  angular.module('BBMember').directive('bbWalletLogs', function($rootScope) {
    var link;
    link = function(scope, element, attrs) {
      var base, base1, getWalletForMember, getWalletLogsForWallet;
      $rootScope.bb || ($rootScope.bb = {});
      (base = $rootScope.bb).api_url || (base.api_url = scope.apiUrl);
      (base1 = $rootScope.bb).api_url || (base1.api_url = "http://www.bookingbug.com");
      getWalletLogsForWallet = function() {
        return scope.getWalletLogs(scope.wallet);
      };
      getWalletForMember = function() {
        return scope.getWalletForMember(scope.member);
      };
      scope.$watch('member', function(member) {
        if (member != null) {
          return getWalletForMember();
        }
      });
      return scope.$watch('wallet', function(wallet) {
        if (wallet != null) {
          return getWalletLogsForWallet();
        }
      });
    };
    return {
      link: link,
      controller: 'Wallet',
      templateUrl: 'wallet_logs.html',
      scope: {
        member: '=',
        wallet: '='
      }
    };
  });

}).call(this);

(function() {
  angular.module("BB.Directives").directive("bbWalletPayment", function($sce, $rootScope, $window, $location, SettingsService) {
    var getHost, link, sendLoadEvent;
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
      custom_stylesheet = scope.options.custom_stylesheet ? scope.options.custom_stylesheet : null;
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
    link = function(scope, element, attrs) {
      var getWalletForMember;
      scope.options = scope.$eval(attrs.bbWalletPayment) || {};
      if ($rootScope.member) {
        scope.member || (scope.member = $rootScope.member);
      }
      if (scope.options.member) {
        scope.member || (scope.member = scope.options.member);
      }
      if (scope.options.amount) {
        scope.amount = scope.options.amount;
      }
      getWalletForMember = function() {
        return scope.getWalletForMember(scope.member, {});
      };
      scope.$watch('member', function(member) {
        if (member != null) {
          getWalletForMember();
        }
        if (scope.amount) {
          return getWalletForMember();
        }
      });
      scope.$watch('wallet', function(wallet) {
        if (wallet && wallet.$has('new_payment')) {
          scope.wallet_payment_url = $sce.trustAsResourceUrl(scope.wallet.$href("new_payment"));
          return element.find('iframe').bind('load', (function(_this) {
            return function(event) {
              var origin, url;
              if (scope.wallet_payment_url) {
                url = scope.wallet_payment_url;
              }
              origin = getHost(url);
              sendLoadEvent(element, origin, scope);
              return scope.$apply(function() {
                return scope.callSetLoaded();
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
                  return scope.callNotLoaded();
                case "error":
                  scope.callSetLoaded();
                  return scope.error(data.message);
                case "wallet_payment_complete":
                  return scope.walletPaymentDone();
                case 'basket_wallet_payment_complete':
                  scope.callSetLoaded();
                  return scope.basketWalletPaymentDone();
              }
            }
          });
        };
      })(this), false);
    };
    return {
      restrict: 'A',
      link: link,
      controller: 'Wallet',
      scope: true,
      replace: true
    };
  });

}).call(this);

(function() {
  angular.module('BBMember').controller('MemberBookings', function($scope, $modal, $log, MemberBookingService, $q, ModalForm, MemberPrePaidBookingService) {
    var getBookings;
    $scope.loading = true;
    $scope.getUpcomingBookings = function() {
      var params;
      params = {
        start_date: moment().format('YYYY-MM-DD')
      };
      return getBookings(params).then(function(bookings) {
        return $scope.upcoming_bookings = bookings;
      });
    };
    $scope.getPastBookings = function(num, type) {
      var date, params;
      if (num && type) {
        date = moment().subtract(num, type);
      } else {
        date = moment().subtract(1, 'year');
      }
      params = {
        start_date: date.format('YYYY-MM-DD'),
        end_date: moment().format('YYYY-MM-DD')
      };
      return getBookings(params).then(function(bookings) {
        return $scope.past_bookings = _.chain(bookings).filter(function(b) {
          return b.datetime.isBefore(moment());
        }).sortBy(function(b) {
          return -b.datetime.unix();
        }).value();
      });
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
          windowClass: 'member_edit_booking_form'
        });
      });
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
        $scope.$emit("cancel:success");
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
        $log.error(err.data);
        return $scope.loading = false;
      });
      return defer.promise;
    };
  });

}).call(this);

(function() {
  angular.module("BBMember").controller("Wallet", function($scope, $q, WalletService, $log, $modal, $rootScope) {
    if ($scope.member) {
      $scope.company_id = $scope.member.company_id;
    }
    $scope.show_wallet_logs = false;
    $scope.loading = true;
    $scope.error_message = false;
    $scope.payment_success = false;
    $scope.toggleWalletPaymentLogs = function() {
      if ($scope.show_wallet_logs) {
        return $scope.show_wallet_logs = false;
      } else {
        return $scope.show_wallet_logs = true;
      }
    };
    $scope.showTopUpBox = function() {
      if ($scope.amount) {
        return true;
      } else {
        return $scope.show_topup_box;
      }
    };
    $scope.getWalletForMember = function(member, params) {
      $scope.loading = true;
      return WalletService.getWalletForMember(member, params).then(function(wallet) {
        $scope.loading = false;
        $scope.wallet = wallet;
        return $scope.wallet;
      }, function(err) {
        $scope.loading = false;
        return $log.error(err.data);
      });
    };
    $scope.getWalletLogs = function(wallet) {
      $scope.loading = true;
      return WalletService.getWalletLogs($scope.wallet).then(function(logs) {
        $scope.loading = false;
        return $scope.logs = logs;
      }, function(err) {
        $scope.loading = false;
        return $log.error(err.data);
      });
    };
    $scope.createWalletForMember = function(member) {
      $scope.loading = true;
      return WalletService.createWalletForMember(member).then(function(wallet) {
        $scope.loading = false;
        return $scope.wallet = wallet;
      }, function(err) {
        $scope.loading = false;
        return $log.error(err.data);
      });
    };
    $scope.updateWallet = function(member, amount) {
      var params;
      $scope.loading = true;
      $scope.payment_success = false;
      $scope.error_message = false;
      if (member && amount) {
        params = {
          amount: amount
        };
        if ($scope.wallet) {
          params.wallet_id = $scope.wallet.id;
        }
        if ($scope.total) {
          params.total_id = $scope.total.id;
        }
        if ($scope.deposit) {
          param.deposit = $scope.deposit;
        }
        if ($scope.basket) {
          params.basket_total_price = $scope.basket.total_price;
        }
        return WalletService.updateWalletForMember(member, params).then(function(wallet) {
          $scope.loading = false;
          return $scope.wallet = wallet;
        }, function(err) {
          $scope.loading = false;
          return $log.error(err.data);
        });
      }
    };
    $scope.activateWallet = function(member) {
      var params;
      $scope.loading = true;
      if (member) {
        params = {
          status: 1
        };
        if ($scope.wallet) {
          params.wallet_id = $scope.wallet.id;
        }
        return WalletService.updateWalletForMember(member, params).then(function(wallet) {
          $scope.loading = false;
          return $scope.wallet = wallet;
        }, function(err) {
          $scope.loading = false;
          return $log.error(err.date);
        });
      }
    };
    $scope.deactivateWallet = function(member) {
      var params;
      $scope.loading = true;
      if (member) {
        params = {
          status: 0
        };
        if ($scope.wallet) {
          params.wallet_id = $scope.wallet.id;
        }
        return WalletService.updateWalletForMember(member, params).then(function(wallet) {
          $scope.loading = false;
          return $scope.wallet = wallet;
        }, function(err) {
          $scope.loading = false;
          return $log.error(err.date);
        });
      }
    };
    $scope.callNotLoaded = (function(_this) {
      return function() {
        $scope.loading = true;
        return $scope.$emit('wallet_payment:loading');
      };
    })(this);
    $scope.callSetLoaded = (function(_this) {
      return function() {
        $scope.loading = false;
        return $scope.$emit('wallet_payment:finished_loading');
      };
    })(this);
    $scope.walletPaymentDone = function() {
      var params;
      params = {
        no_cache: true
      };
      return $scope.getWalletForMember($scope.member, params).then(function(wallet) {
        return $scope.$emit("wallet_payment:success", wallet);
      });
    };
    $scope.basketWalletPaymentDone = function() {
      return $scope.decideNextPage('checkout');
    };
    return $scope.error = function(message) {
      $scope.error_message = "Payment Failure: " + message;
      $log.warn("Payment Failure: " + message);
      return $scope.$emit("wallet_payment:error", $scope.error_message);
    };
  });

}).call(this);

(function() {
  angular.module('BB.Services').factory("MemberBookingService", function($q, SpaceCollections, $rootScope, MemberService, BBModel) {
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
  angular.module('BB.Services').factory("MemberService", function($q, halClient, $rootScope, BBModel) {
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
      }
    };
  });

}).call(this);

(function() {
  angular.module('BB.Services').factory("MemberPrePaidBookingService", function($q, BBModel) {
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
                    results.push(new BBModel.Member.PrePaidBooking(booking));
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
                      results.push(new BBModel.Member.PrePaidBooking(booking));
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
  angular.module("BB.Services").factory("WalletService", function($q, BBModel) {
    return {
      getWalletForMember: function(member, params) {
        var deferred;
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
        var deferred;
        deferred = $q.defer();
        if (!wallet.$has('logs')) {
          deferred.reject("No Payments found");
        } else {
          wallet.$get('logs').then(function(resource) {
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

      Member_Booking.prototype.printed_price = function() {
        if (parseFloat(this.price) % 1 === 0) {
          return "£" + this.price;
        }
        return $window.sprintf("£%.2f", parseFloat(this.price));
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

      Member_Member.prototype.wallet = function() {
        if (this.$has("wallet")) {
          return this.$get("wallet").then(function(wallet) {
            this.wallet = wallet;
            return this.wallet;
          });
        }
      };

      return Member_Member;

    })(ClientModel);
  });

}).call(this);

(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  angular.module('BB.Models').factory("Member.PrePaidBookingModel", function($q, BBModel, BaseModel) {
    var Member_PrePaidBooking;
    return Member_PrePaidBooking = (function(superClass) {
      extend(Member_PrePaidBooking, superClass);

      function Member_PrePaidBooking(data) {
        Member_PrePaidBooking.__super__.constructor.call(this, data);
      }

      Member_PrePaidBooking.prototype.checkValidity = function(event) {
        if (this.service_id && event.service_id && this.service_id !== event.service_id) {
          return false;
        } else if (this.resource_id && event.resource_id && this.resource_id !== event.resource_id) {
          return false;
        } else if (this.person_id && event.person_id && this.person_id !== event.person_id) {
          return false;
        } else {
          return true;
        }
      };

      return Member_PrePaidBooking;

    })(BaseModel);
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
      }

      return Member_WalletLog;

    })(BaseModel);
  });

}).call(this);
