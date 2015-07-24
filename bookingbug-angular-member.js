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
  angular.module('BBMember').controller('MemberBookings', function($scope, $modal, $log, MemberBookingService, $q, ModalForm, MemberPrePaidBookingService) {
    $scope.loading = true;
    $scope.getUpcomingBookings = function() {
      var params;
      params = {
        start_date: moment().format('YYYY-MM-DD')
      };
      return $scope.getBookings(params).then(function(bookings) {
        return $scope.upcoming_bookings = bookings;
      });
    };
    $scope.getPastBookings = function(num, type) {
      var date, params;
      date = moment().subtract(num, type);
      params = {
        start_date: date.format('YYYY-MM-DD'),
        end_date: moment().format('YYYY-MM-DD')
      };
      return $scope.getBookings(params).then(function(bookings) {
        return $scope.past_bookings = bookings;
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
        var answer, _i, _len, _ref;
        _ref = answers.answers;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          answer = _ref[_i];
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
    $scope.getBookings = function(params) {
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
        if ($scope.bookings) {
          $scope.bookings = $scope.bookings.filter(function(b) {
            return b.id !== booking.id;
          });
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
  angular.module('BBMember').directive('memberBookings', function($rootScope) {
    var link;
    link = function(scope, element, attrs) {
      var _base, _base1;
      $rootScope.bb || ($rootScope.bb = {});
      (_base = $rootScope.bb).api_url || (_base.api_url = scope.apiUrl);
      return (_base1 = $rootScope.bb).api_url || (_base1.api_url = "http://www.bookingbug.com");
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
          var answer, _i, _len, _ref;
          _ref = answers.answers;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            answer = _ref[_i];
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
      var _base, _base1;
      $rootScope.bb || ($rootScope.bb = {});
      (_base = $rootScope.bb).api_url || (_base.api_url = scope.apiUrl);
      return (_base1 = $rootScope.bb).api_url || (_base1.api_url = "http://www.bookingbug.com");
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
  angular.module('BBMember').directive('memberForm', function($modal, $log, $rootScope, MemberLoginService, MemberBookingService) {
    var controller, link;
    controller = function($scope) {
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
          $log.info("Successfully updated member");
          return $scope.loading = false;
        }, function(err) {
          $log.error("Failed to update member - " + err);
          return $scope.loading = false;
        });
      };
    };
    link = function(scope, element, attrs) {
      var _base, _base1;
      $rootScope.bb || ($rootScope.bb = {});
      (_base = $rootScope.bb).api_url || (_base.api_url = attrs.apiUrl);
      return (_base1 = $rootScope.bb).api_url || (_base1.api_url = "http://www.bookingbug.com");
    };
    return {
      link: link,
      controller: controller,
      template: "<form sf-schema=\"schema\" sf-form=\"form\" sf-model=\"member\"\n  ng-submit=\"submit(member)\" ng-hide=\"loading\"></form>"
    };
  });

}).call(this);

(function() {
  angular.module('BBMember').directive('loginMember', function($modal, $log, $rootScope, MemberLoginService, $templateCache, $q) {
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
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = companies.length; _i < _len; _i++) {
          c = companies[_i];
          _results.push(c.id);
        }
        return _results;
      })();
      $scope.form = [
        {
          key: 'company_id',
          type: 'select',
          titleMap: (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = companies.length; _i < _len; _i++) {
              c = companies[_i];
              _results.push({
                value: c.id,
                name: c.name
              });
            }
            return _results;
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
      var loginModal, pickCompanyModal, tryLogin, _base, _base1;
      $rootScope.bb || ($rootScope.bb = {});
      (_base = $rootScope.bb).api_url || (_base.api_url = scope.apiUrl);
      (_base1 = $rootScope.bb).api_url || (_base1.api_url = "http://www.bookingbug.com");
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
                var _i, _len, _results;
                _results = [];
                for (_i = 0, _len = members.length; _i < _len; _i++) {
                  m = members[_i];
                  _results.push(m.$get('company'));
                }
                return _results;
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
                var _i, _len, _results;
                _results = [];
                for (_i = 0, _len = members.length; _i < _len; _i++) {
                  m = members[_i];
                  _results.push(m.$get('company'));
                }
                return _results;
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
    var link;
    link = function(scope, element, attrs) {
      var getBookings, _base, _base1;
      $rootScope.bb || ($rootScope.bb = {});
      (_base = $rootScope.bb).api_url || (_base.api_url = scope.apiUrl);
      (_base1 = $rootScope.bb).api_url || (_base1.api_url = "http://www.bookingbug.com");
      getBookings = function() {
        return scope.getPastBookings();
      };
      return getBookings();
    };
    return {
      link: link,
      controller: 'MemberBookings',
      templateUrl: 'member_past_bookings.html',
      scope: {
        apiUrl: '@',
        member: '='
      }
    };
  });

}).call(this);

(function() {
  angular.module('BBMember').directive('bbMemberPrePaidBookings', function($rootScope) {
    var link;
    link = function(scope, element, attrs) {
      var getBookings, _base, _base1;
      $rootScope.bb || ($rootScope.bb = {});
      (_base = $rootScope.bb).api_url || (_base.api_url = scope.apiUrl);
      (_base1 = $rootScope.bb).api_url || (_base1.api_url = "http://www.bookingbug.com");
      scope.loading = true;
      getBookings = function() {
        return scope.getPrePaidBookings({})["finally"](function() {
          return scope.loading = false;
        });
      };
      return getBookings();
    };
    return {
      link: link,
      controller: 'MemberBookings',
      templateUrl: 'member_pre_paid_bookings.html',
      scope: {
        apiUrl: '@',
        member: '='
      }
    };
  });

}).call(this);

(function() {
  angular.module('BBMember').directive('memberSsoLogin', function($rootScope, LoginService, $sniffer, $timeout) {
    var link;
    link = function(scope, element, attrs) {
      var data, options, _base, _base1;
      $rootScope.bb || ($rootScope.bb = {});
      (_base = $rootScope.bb).api_url || (_base.api_url = scope.apiUrl);
      (_base1 = $rootScope.bb).api_url || (_base1.api_url = "http://www.bookingbug.com");
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
    var link;
    link = function(scope, element, attrs) {
      var getBookings, _base, _base1;
      $rootScope.bb || ($rootScope.bb = {});
      (_base = $rootScope.bb).api_url || (_base.api_url = scope.apiUrl);
      (_base1 = $rootScope.bb).api_url || (_base1.api_url = "http://www.bookingbug.com");
      getBookings = function() {
        return scope.getUpcomingBookings();
      };
      scope.$on('updateBookings', function() {
        scope.flushBookings();
        return getBookings();
      });
      return getBookings();
    };
    return {
      link: link,
      controller: 'MemberBookings',
      templateUrl: 'member_upcoming_bookings.html',
      scope: {
        apiUrl: '@',
        member: '='
      }
    };
  });

}).call(this);

(function() {
  'use strict';
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __hasProp = {}.hasOwnProperty;

  angular.module('BB.Models').factory("Member.BookingModel", function($q, $window, BBModel, BaseModel, $bbug) {
    var Member_Booking;
    return Member_Booking = (function(_super) {
      __extends(Member_Booking, _super);

      function Member_Booking(data) {
        this.getMemberPromise = __bind(this.getMemberPromise, this);
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
                var _i, _len, _results;
                _results = [];
                for (_i = 0, _len = answers.length; _i < _len; _i++) {
                  a = answers[_i];
                  _results.push(new BBModel.Answer(a));
                }
                return _results;
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
  var __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __hasProp = {}.hasOwnProperty;

  angular.module('BB.Models').factory("Member.MemberModel", function($q, BBModel, BaseModel, ClientModel) {
    var Member_Member;
    return Member_Member = (function(_super) {
      __extends(Member_Member, _super);

      function Member_Member() {
        return Member_Member.__super__.constructor.apply(this, arguments);
      }

      return Member_Member;

    })(ClientModel);
  });

}).call(this);

(function() {
  var __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __hasProp = {}.hasOwnProperty;

  angular.module('BB.Models').factory("Member.PrePaidBookingModel", function($q, BBModel, BaseModel) {
    var Member_PrePaidBooking;
    return Member_PrePaidBooking = (function(_super) {
      __extends(Member_PrePaidBooking, _super);

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
                  var _i, _len, _results;
                  _results = [];
                  for (_i = 0, _len = bookings.length; _i < _len; _i++) {
                    booking = bookings[_i];
                    _results.push(new BBModel.Member.Booking(booking));
                  }
                  return _results;
                })();
                return deferred.resolve(bookings);
              } else {
                return bookings.$get('bookings', params).then(function(bookings) {
                  bookings = (function() {
                    var _i, _len, _results;
                    _results = [];
                    for (_i = 0, _len = bookings.length; _i < _len; _i++) {
                      booking = bookings[_i];
                      _results.push(new BBModel.Member.Booking(booking));
                    }
                    return _results;
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
  angular.module('BBMember.Services').factory("MemberLoginService", function($q, halClient, $rootScope, BBModel) {
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
              member = new BBModel.Member.Member(member);
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
                  var _i, _len, _results;
                  _results = [];
                  for (_i = 0, _len = bookings.length; _i < _len; _i++) {
                    booking = bookings[_i];
                    _results.push(new BBModel.Member.PrePaidBooking(booking));
                  }
                  return _results;
                })();
                return deferred.resolve(bookings);
              } else {
                return bookings.$get('pre_paid_bookings', params).then(function(bookings) {
                  bookings = (function() {
                    var _i, _len, _results;
                    _results = [];
                    for (_i = 0, _len = bookings.length; _i < _len; _i++) {
                      booking = bookings[_i];
                      _results.push(new BBModel.Member.PrePaidBooking(booking));
                    }
                    return _results;
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
