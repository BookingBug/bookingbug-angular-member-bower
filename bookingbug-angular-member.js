'use strict';

angular.module('BBMember', ['BB', 'BBMember.Directives', 'BBMember.Services', 'BBMember.Filters', 'BBMember.Controllers', 'BBMember.Models', 'trNgGrid', 'pascalprecht.translate']);

angular.module('BBMember.Directives', []);

angular.module('BBMember.Filters', []);

angular.module('BBMember.Models', []);

angular.module('BBMember.Services', ['ngResource', 'ngSanitize']);

angular.module('BBMember.Controllers', ['ngSanitize']);

angular.module('BBMemberMockE2E', ['BBMember', 'BBAdminMockE2E']);
'use strict';

angular.module('BBMember').config(function ($logProvider) {
    'ngInject';

    $logProvider.debugEnabled(true);
});
'use strict';

angular.module('BBMember').run(function ($q, $injector, BBModel) {
    'ngInject';

    var models = ['Member', 'Booking', 'Wallet', 'WalletLog', 'Purchase', 'PurchaseItem', 'WalletPurchaseBand', 'PaymentItem'];
    var mfuncs = {};
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = Array.from(models)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var model = _step.value;

            mfuncs[model] = $injector.get('Member.' + model + 'Model');
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    BBModel['Member'] = mfuncs;
});
'use strict';

angular.module('BBMember').controller('MemberBookings', function ($scope, $uibModal, $document, $log, $q, ModalForm, $rootScope, AlertService, PurchaseService, LoadingService, BBModel) {

    var loader = LoadingService.$loader($scope);

    $scope.getUpcomingBookings = function () {
        var defer = $q.defer();
        var now = moment();
        var params = { start_date: now.toISODate() };
        getBookings(params).then(function (results) {
            $scope.upcoming_bookings = _.filter(results, function (result) {
                return result.datetime.isAfter(now);
            });
            return defer.resolve($scope.upcoming_bookings);
        }, function (err) {
            return defer.reject([]);
        });
        return defer.promise;
    };

    $scope.getPastBookings = function (num, type) {
        var date = void 0;
        var defer = $q.defer();
        // default to year in the past if no amount is specified
        if (num && type) {
            date = moment().subtract(num, type);
        } else {
            date = moment().subtract(1, 'year');
        }
        var params = {
            start_date: date.format('YYYY-MM-DD'),
            end_date: moment().add(1, 'day').format('YYYY-MM-DD')
        };
        getBookings(params).then(function (past_bookings) {
            $scope.past_bookings = _.chain(past_bookings).filter(function (b) {
                return b.datetime.isBefore(moment());
            }).sortBy(function (b) {
                return -b.datetime.unix();
            }).value();
            return defer.resolve(past_bookings);
        }, function (err) {
            return defer.reject([]);
        });
        return defer.promise;
    };

    $scope.flushBookings = function () {
        var params = { start_date: moment().format('YYYY-MM-DD') };
        return $scope.member.$flush('bookings', params);
    };

    var updateBookings = function updateBookings() {
        return $scope.getUpcomingBookings();
    };

    var getBookings = function getBookings(params) {
        loader.notLoaded();
        var defer = $q.defer();
        $scope.member.getBookings(params).then(function (bookings) {
            loader.setLoaded();
            return defer.resolve(bookings);
        }, function (err) {
            $log.error(err.data);
            return loader.setLoaded();
        });
        return defer.promise;
    };

    $scope.cancelBooking = function (booking) {
        var index = _.indexOf($scope.upcoming_bookings, booking);
        _.without($scope.upcoming_bookings, booking);
        return BBModel.Member.Booking.$cancel($scope.member, booking).then(function () {
            AlertService.raise('BOOKING_CANCELLED');
            $rootScope.$broadcast("booking:cancelled");
            // does a removeBooking method exist in the scope chain?
            if ($scope.removeBooking) {
                return $scope.removeBooking(booking);
            }
        }, function (err) {
            AlertService.raise('GENERIC');
            return $scope.upcoming_bookings.splice(index, 0, booking);
        });
    };

    $scope.getPrePaidBookings = function (params) {
        var defer = $q.defer();
        $scope.member.$getPrePaidBookings(params).then(function (bookings) {
            $scope.pre_paid_bookings = bookings;
            return defer.resolve(bookings);
        }, function (err) {
            defer.reject([]);
            return $log.error(err.data);
        });
        return defer.promise;
    };

    var bookWaitlistSucces = function bookWaitlistSucces() {
        AlertService.raise('WAITLIST_ACCEPTED');
        return updateBookings();
    };

    var openPaymentModal = function openPaymentModal(_booking, _total) {
        var modalInstance = $uibModal.open({
            templateUrl: "booking_payment_modal.html",
            windowClass: "bbug",
            size: "lg",
            controller: function controller($scope, $uibModalInstance, booking, total) {

                $scope.booking = booking;
                $scope.total = total;

                $scope.handlePaymentSuccess = function () {
                    return $uibModalInstance.close(booking);
                };

                return $scope.cancel = function () {
                    return $uibModalInstance.dismiss("cancel");
                };
            },


            resolve: {
                booking: function booking() {
                    return _booking;
                },
                total: function total() {
                    return _total;
                }
            }
        });

        return modalInstance.result.then(function (booking) {
            return bookWaitlistSucces();
        });
    };

    return {
        edit: function edit(booking) {
            return booking.$getAnswers().then(function (answers) {
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = Array.from(answers.answers)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var answer = _step.value;

                        booking['question' + answer.question_id] = answer.value;
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }

                return ModalForm.edit({
                    model: booking,
                    title: 'Booking Details',
                    templateUrl: 'edit_booking_modal_form.html',
                    windowClass: 'member_edit_booking_form',
                    success: updateBookings
                });
            });
        },
        cancel: function cancel(_booking2) {
            var modalInstance = $uibModal.open({
                templateUrl: "member_booking_delete_modal.html",
                windowClass: "bbug",
                controller: function controller($scope, $rootScope, $uibModalInstance, booking) {
                    $scope.booking = booking;

                    $scope.confirm_delete = function () {
                        return $uibModalInstance.close(booking);
                    };

                    return $scope.cancel = function () {
                        return $uibModalInstance.dismiss("cancel");
                    };
                },

                resolve: {
                    booking: function booking() {
                        return _booking2;
                    }
                }
            });
            return modalInstance.result.then(function (booking) {
                return $scope.cancelBooking(booking);
            });
        },
        book: function book(booking) {
            loader.notLoaded();
            var params = {
                purchase_id: booking.purchase_ref,
                url_root: $rootScope.bb.api_url,
                booking: booking
            };
            PurchaseService.bookWaitlistItem(params).then(function (purchase_total) {
                if (purchase_total.due_now > 0) {
                    if (purchase_total.$has('new_payment')) {
                        return openPaymentModal(booking, purchase_total);
                    } else {
                        return $log.error('total is missing new_payment link, this is usually caused by online payment not being configured correctly');
                    }
                } else {
                    return bookWaitlistSucces();
                }
            }, function (err) {
                return AlertService.raise('NO_WAITLIST_SPACES_LEFT');
            });
            return loader.setLoaded();
        },
        pay: function pay(booking) {
            var params = {
                url_root: $scope.$root.bb.api_url,
                purchase_id: booking.purchase_ref
            };
            return PurchaseService.query(params).then(function (total) {
                return openPaymentModal(booking, total);
            });
        }
    };
});
"use strict";

angular.module("BBMember").controller("MemberPurchases", function ($scope, $q, $log, LoadingService, BBModel) {
    return $scope.getPurchases = function () {
        var loader = LoadingService.$loader($scope).notLoaded();
        var defer = $q.defer();
        BBModel.Member.Purchase.$query($scope.member, {}).then(function (purchases) {
            $scope.purchases = purchases;
            loader.setLoaded();
            return defer.resolve(purchases);
        }, function (err) {
            $log.error(err.data);
            loader.setLoaded();
            return defer.reject([]);
        });

        return defer.promise;
    };
});
"use strict";

angular.module("BBMember").controller("Wallet", function ($scope, $rootScope, $q, $log, AlertService, LoadingService, BBModel) {

    var updateClient = void 0;
    var loader = LoadingService.$loader($scope);

    $scope.getWalletForMember = function (member, params) {
        var defer = $q.defer();
        loader.notLoaded();
        BBModel.Member.Wallet.$getWalletForMember(member, params).then(function (wallet) {
            loader.setLoaded();
            $scope.wallet = wallet;
            updateClient(wallet);
            return defer.resolve(wallet);
        }, function (err) {
            loader.setLoaded();
            return defer.reject();
        });
        return defer.promise;
    };

    $scope.getWalletLogs = function () {
        var defer = $q.defer();
        loader.notLoaded();
        BBModel.Member.Wallet.$getWalletLogs($scope.wallet).then(function (logs) {
            logs = _.sortBy(logs, function (log) {
                return -moment(log.created_at).unix();
            });
            loader.setLoaded();
            $scope.logs = logs;
            return defer.resolve(logs);
        }, function (err) {
            loader.setLoaded();
            $log.error(err.data);
            return defer.reject([]);
        });
        return defer.promise;
    };

    $scope.getWalletPurchaseBandsForWallet = function (wallet) {
        var defer = $q.defer();
        loader.notLoaded();
        BBModel.Member.Wallet.$getWalletPurchaseBandsForWallet(wallet).then(function (bands) {
            $scope.bands = bands;
            loader.setLoaded();
            return defer.resolve(bands);
        }, function (err) {
            loader.setLoaded();
            $log.error(err.data);
            return defer.resolve([]);
        });
        return defer.promise;
    };

    $scope.createWalletForMember = function (member) {
        loader.notLoaded();
        return BBModel.Member.Wallet.$createWalletForMember(member).then(function (wallet) {
            loader.setLoaded();
            return $scope.wallet = wallet;
        }, function (err) {
            loader.setLoaded();
            return $log.error(err.data);
        });
    };

    $scope.updateWallet = function (member, amount, band) {
        if (band == null) {
            band = null;
        }
        loader.notLoaded();
        if (member) {
            var params = {};
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
            return BBModel.Member.Wallet.$updateWalletForMember(member, params).then(function (wallet) {
                loader.setLoaded();
                $scope.wallet = wallet;
                return $rootScope.$broadcast("wallet:updated", wallet, band);
            }, function (err) {
                loader.setLoaded();
                return $log.error(err.data);
            });
        }
    };

    $scope.activateWallet = function (member) {
        loader.notLoaded();
        if (member) {
            var params = { status: 1 };
            if ($scope.wallet) {
                params.wallet_id = $scope.wallet.id;
            }
            return BBModel.Member.Wallet.$updateWalletForMember(member, params).then(function (wallet) {
                loader.setLoaded();
                return $scope.wallet = wallet;
            }, function (err) {
                loader.setLoaded();
                return $log.error(err.date);
            });
        }
    };

    $scope.deactivateWallet = function (member) {
        loader.notLoaded();
        if (member) {
            var params = { status: 0 };
            if ($scope.wallet) {
                params.wallet_id = $scope.wallet.id;
            }
            return BBModel.Member.Wallet.$updateWalletForMember(member, params).then(function (wallet) {
                loader.setLoaded();
                return $scope.wallet = wallet;
            }, function (err) {
                loader.setLoaded();
                return $log.error(err.date);
            });
        }
    };

    $scope.purchaseBand = function (band) {
        $scope.selected_band = band;
        return $scope.updateWallet($scope.member, band.wallet_amount, band);
    };

    $scope.walletPaymentDone = function () {
        return $scope.getWalletForMember($scope.member).then(function (wallet) {
            AlertService.raise('TOPUP_SUCCESS');
            $rootScope.$broadcast("wallet:topped_up", wallet);
            return $scope.wallet_topped_up = true;
        });
    };

    // TODO don't route to next page automatically, first alert user
    // topup was successful and show new wallet balance + the 'next' button
    $scope.basketWalletPaymentDone = function () {
        $scope.callSetLoaded();
        return $scope.decideNextPage('checkout');
    };

    $scope.error = function (message) {
        return AlertService.warning('TOPUP_FAILED');
    };

    $scope.add = function (value) {
        value = value || $scope.amount_increment;
        return $scope.amount += value;
    };

    $scope.subtract = function (value) {
        value = value || $scope.amount_increment;
        return $scope.add(-value);
    };

    $scope.isSubtractValid = function (value) {
        if (!$scope.wallet) {
            return false;
        }
        value = value || $scope.amount_increment;
        var new_amount = $scope.amount - value;
        return new_amount >= $scope.wallet.min_amount;
    };

    return updateClient = function updateClient(wallet) {
        if ($scope.member.self === $scope.client.self) {
            return $scope.client.wallet_amount = wallet.amount;
        }
    };
});
'use strict';

angular.module('BBMember').directive('bbMemberBooking', function () {
    return {
        templateUrl: '_member_booking.html',
        scope: {
            booking: '=bbMemberBooking'
        },
        require: ['^?bbMemberUpcomingBookings', '^?bbMemberPastBookings'],
        link: function link(scope, element, attrs, controllers) {

            scope.actions = [];

            var member_booking_controller = controllers[0] ? controllers[0] : controllers[1];
            var time_now = moment();

            if (scope.booking.on_waitlist && !scope.booking.datetime.isBefore(time_now, 'day')) {
                scope.actions.push({
                    action: member_booking_controller.book,
                    label: 'Book',
                    translation_key: 'MEMBER_BOOKING_WAITLIST_ACCEPT',
                    disabled: !scope.booking.settings.sent_waitlist
                });
            }

            if (scope.booking.paid < scope.booking.price && scope.booking.datetime.isAfter(time_now)) {
                scope.actions.push({ action: member_booking_controller.pay, label: 'Pay' });
            }

            scope.actions.push({
                action: member_booking_controller.edit,
                label: 'Details',
                translation_key: 'MEMBER_BOOKING_EDIT'
            });

            if (!scope.booking.datetime.isBefore(time_now, 'day')) {
                return scope.actions.push({
                    action: member_booking_controller.cancel,
                    label: 'Cancel',
                    translation_key: 'MEMBER_BOOKING_CANCEL'
                });
            }
        }
    };
});
'use strict';

angular.module('BBMember').directive('memberBookings', function ($rootScope) {
    return {
        templateUrl: 'member_bookings_tabs.html',
        scope: {
            member: '='
        },
        link: function link(scope, element, attrs) {}
    };
});
// methods
'use strict';

angular.module('BBMember').directive('memberBookingsTable', function ($uibModal, $log, ModalForm, BBModel) {

    var controller = function controller($scope, $uibModal, $document) {

        $scope.loading = true;

        if (!$scope.fields) {
            $scope.fields = ['date_order', 'details'];
        }

        $scope.$watch('member', function (member) {
            if (member != null) {
                return getBookings($scope, member);
            }
        });

        $scope.edit = function (id) {
            var booking = _.find($scope.booking_models, function (b) {
                return b.id === id;
            });
            return booking.$getAnswers().then(function (answers) {
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = Array.from(answers.answers)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var answer = _step.value;

                        booking['question' + answer.question_id] = answer.value;
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }

                return ModalForm.edit({
                    model: booking,
                    title: 'Booking Details',
                    templateUrl: 'edit_booking_modal_form.html',
                    success: function success(b) {
                        b = new BBModel.Member.Booking(b);
                        var i = _.indexOf($scope.booking_models, function (b) {
                            return b.id === id;
                        });
                        $scope.booking_models[i] = b;
                        return $scope.setRows();
                    }
                });
            });
        };

        $scope.cancel = function (id) {
            var _booking = _.find($scope.booking_models, function (b) {
                return b.id === id;
            });

            var modalInstance = $uibModal.open({
                templateUrl: 'member_bookings_table_cancel_booking.html',
                controller: function controller($scope, $uibModalInstance, booking) {
                    $scope.booking = booking;
                    $scope.booking.notify = true;
                    $scope.ok = function () {
                        return $uibModalInstance.close($scope.booking);
                    };
                    return $scope.close = function () {
                        return $uibModalInstance.dismiss();
                    };
                },

                scope: $scope,
                resolve: {
                    booking: function booking() {
                        return _booking;
                    }
                }
            });

            return modalInstance.result.then(function (booking) {
                $scope.loading = true;
                var params = { notify: booking.notify };
                return booking.$post('cancel', params).then(function () {
                    var i = _.findIndex($scope.booking_models, function (b) {
                        return b.id === booking.id;
                    });
                    $scope.booking_models.splice(i, 1);
                    $scope.setRows();
                    return $scope.loading = false;
                });
            });
        };

        $scope.setRows = function () {
            return $scope.bookings = _.map($scope.booking_models, function (booking) {
                return {
                    id: booking.id,
                    date: moment(booking.datetime).format('YYYY-MM-DD'),
                    date_order: moment(booking.datetime).format('x'),
                    datetime: moment(booking.datetime),
                    details: booking.full_describe
                };
            });
        };

        var getBookings = function getBookings($scope, member) {
            var params = {
                src: member,
                start_date: $scope.startDate.format('YYYY-MM-DD'),
                start_time: $scope.startTime ? $scope.startTime.format('HH:mm') : undefined,
                end_date: $scope.endDate ? $scope.endDate.format('YYYY-MM-DD') : undefined,
                end_time: $scope.endTime ? $scope.endTime.format('HH:mm') : undefined
            };
            return BBModel.Member.Booking.$query(member, params).then(function (bookings) {
                var now = moment.unix();
                if ($scope.period && $scope.period === "past") {
                    $scope.booking_models = _.filter(bookings.items, function (x) {
                        return x.datetime.unix() < now;
                    });
                }
                if ($scope.period && $scope.period === "future") {
                    $scope.booking_models = _.filter(bookings.items, function (x) {
                        return x.datetime.unix() > now;
                    });
                } else {
                    $scope.booking_models = bookings.items;
                }

                $scope.setRows();
                return $scope.loading = false;
            }, function (err) {
                $log.error(err.data);
                return $scope.loading = false;
            });
        };

        if (!$scope.startDate) {
            $scope.startDate = moment();
        }

        $scope.orderBy = $scope.defaultOrder;
        if ($scope.orderBy == null) {
            $scope.orderBy = 'date_order';
        }

        $scope.now = moment();

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
            startTime: '=?',
            endDate: '=?',
            endTime: '=?',
            defaultOrder: '=?',
            period: '=?'
        }
    };
});
'use strict';

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
angular.module('BBMember').directive('memberForm', function ($rootScope, AlertService, PathSvc) {

    return {
        templateUrl: function templateUrl(el, attrs) {
            if (attrs.bbCustomMemberForm != null) {
                return PathSvc.directivePartial("_member_form");
            } else {
                return PathSvc.directivePartial("_member_schema_form");
            }
        },

        scope: {
            apiUrl: '@',
            member: '=',
            onSuccessSave: '=',
            onFailSave: '=',
            onValidationError: '='
        },
        link: function link(scope, element, attrs) {

            if (!$rootScope.bb) {
                $rootScope.bb = {};
            }
            if (!$rootScope.bb.api_url) {
                $rootScope.bb.api_url = attrs.apiUrl;
            }
            if (!$rootScope.bb.api_url) {
                $rootScope.bb.api_url = "http://www.bookingbug.com";
            }

            if (attrs.bbCustomMemberForm != null) {
                return scope.custom_member_form = true;
            }
        },
        controller: function controller($scope, FormTransform) {

            $scope.loading = true;

            // THIS IS CRUFTY AND SHOULD BE REMOVE WITH AN API UPDATE THAT TIDIES UP THE SCEMA RESPONE
            // fix the issues we have with the the sub client and question blocks being in doted notation, and not in child objects
            var checkSchema = function checkSchema(schema) {
                for (var k in schema.properties) {
                    var v = schema.properties[k];
                    var vals = k.split(".");
                    if (vals[0] === "questions" && vals.length > 1) {
                        if (!schema.properties.questions) {
                            schema.properties.questions = { type: "object", properties: {} };
                        }
                        if (!schema.properties.questions.properties[vals[1]]) {
                            schema.properties.questions.properties[vals[1]] = { type: "object", properties: { answer: v } };
                        }
                    }
                    if (vals[0] === "client" && vals.length > 2) {
                        if (!schema.properties.client) {
                            schema.properties.client = {
                                type: "object",
                                properties: { q: { type: "object", properties: {} } }
                            };
                        }
                        if (schema.properties.client.properties) {
                            if (!schema.properties.client.properties.q.properties[vals[2]]) {
                                schema.properties.client.properties.q.properties[vals[2]] = {
                                    type: "object",
                                    properties: { answer: v }
                                };
                            }
                        }
                    }
                }
                return schema;
            };

            $scope.$watch('member', function (member) {
                if (member != null) {
                    if (member.$has('edit_member')) {
                        return member.$get('edit_member').then(function (member_schema) {
                            $scope.form = member_schema.form;
                            var model_type = functionName(member.constructor);
                            if (FormTransform['edit'][model_type]) {
                                $scope.form = FormTransform['edit'][model_type]($scope.form, member_schema.schema, member);
                            }
                            $scope.schema = checkSchema(member_schema.schema);
                            return $scope.loading = false;
                        });
                    } else if (member.$has('edit')) {
                        return member.$get('edit').then(function (member_schema) {
                            $scope.form = member_schema.form;
                            var model_type = functionName(member.constructor);
                            if (FormTransform['edit'][model_type]) {
                                $scope.form = FormTransform['edit'][model_type]($scope.form, member_schema.schema, member);
                            }
                            $scope.schema = checkSchema(member_schema.schema);
                            return $scope.loading = false;
                        });
                    }
                }
            });

            var functionName = function functionName(func) {
                var result = /^function\s+([\w\$]+)\s*\(/.exec(func.toString());
                if (result) {
                    return result[1];
                } else {
                    return '';
                }
            };

            return $scope.submit = function (form, data) {
                // Required for the fields to validate themselves
                $scope.$broadcast('schemaFormValidate');

                if (form.$valid) {
                    $scope.loading = true;
                    // --------------------------------------------------------------------
                    // member_schema form does not bind the question answers in
                    // custom form elements to the Client.questions array of objects
                    // but rather to the Client.q array of objects, so for example:
                    // Client.q.1.answer <= INSTEAD OF => Client.questions[0].answer
                    // So in that case we need to update answers in questions to match
                    // the answers in q, so that if a user changes a custom form field
                    // the new answer and not the old one will be sent to the api
                    // --------------------------------------------------------------------
                    if (!$scope.custom_member_form) {
                        var _iteratorNormalCompletion = true;
                        var _didIteratorError = false;
                        var _iteratorError = undefined;

                        try {
                            for (var _iterator = Array.from(data.questions)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                                var item = _step.value;

                                item.answer = data.q[item.id].answer;
                            }
                        } catch (err) {
                            _didIteratorError = true;
                            _iteratorError = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion && _iterator.return) {
                                    _iterator.return();
                                }
                            } finally {
                                if (_didIteratorError) {
                                    throw _iteratorError;
                                }
                            }
                        }
                    }

                    return $scope.member.$put('self', {}, data).then(function (member) {
                        $scope.loading = false;
                        AlertService.raise('UPDATE_SUCCESS');

                        if (typeof $scope.onSuccessSave === 'function') {
                            return $scope.onSuccessSave();
                        }
                    }, function (err) {
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
'use strict';

angular.module('BBMember').directive('loginMember', function ($uibModal, $document, $log, $rootScope, MemberLoginService, $templateCache, $q, $sessionStorage, halClient) {

    var loginMemberController = function loginMemberController($scope, $uibModalInstance, company_id) {
        $scope.title = 'Login';
        $scope.schema = {
            type: 'object',
            properties: {
                email: { type: 'string', title: 'Email' },
                password: { type: 'string', title: 'Password' }
            }
        };
        $scope.form = [{
            key: 'email',
            type: 'email',
            feedback: false,
            autofocus: true
        }, {
            key: 'password',
            type: 'password',
            feedback: false
        }];
        $scope.login_form = {};

        $scope.submit = function (form) {
            var options = { company_id: company_id };
            return MemberLoginService.login(form, options).then(function (member) {
                member.email = form.email;
                member.password = form.password;
                return $uibModalInstance.close(member);
            }, function (err) {
                return $uibModalInstance.dismiss(err);
            });
        };

        return $scope.cancel = function () {
            return $uibModalInstance.dismiss('cancel');
        };
    };

    var pickCompanyController = function pickCompanyController($scope, $uibModalInstance, companies) {
        var c = void 0;
        $scope.title = 'Pick Company';
        $scope.schema = {
            type: 'object',
            properties: {
                company_id: { type: 'integer', title: 'Company' }
            }
        };
        $scope.schema.properties.company_id.enum = function () {
            var result = [];
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = Array.from(companies)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    c = _step.value;

                    result.push(c.id);
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            return result;
        }();
        $scope.form = [{
            key: 'company_id',
            type: 'select',
            titleMap: function () {
                var result1 = [];
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = Array.from(companies)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        c = _step2.value;

                        result1.push({ value: c.id, name: c.name });
                    }
                } catch (err) {
                    _didIteratorError2 = true;
                    _iteratorError2 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion2 && _iterator2.return) {
                            _iterator2.return();
                        }
                    } finally {
                        if (_didIteratorError2) {
                            throw _iteratorError2;
                        }
                    }
                }

                return result1;
            }(),
            autofocus: true
        }];
        $scope.pick_company_form = {};

        $scope.submit = function (form) {
            return $uibModalInstance.close(form.company_id);
        };

        return $scope.cancel = function () {
            return $uibModalInstance.dismiss('cancel');
        };
    };

    var link = function link(scope, element, attrs) {
        if (!$rootScope.bb) {
            $rootScope.bb = {};
        }
        if (!$rootScope.bb.api_url) {
            $rootScope.bb.api_url = scope.apiUrl;
        }
        if (!$rootScope.bb.api_url) {
            $rootScope.bb.api_url = "http://www.bookingbug.com";
        }

        var loginModal = function loginModal() {
            var modalInstance = $uibModal.open({
                templateUrl: 'login_modal_form.html',
                controller: loginMemberController,
                resolve: {
                    company_id: function company_id() {
                        return scope.companyId;
                    }
                }
            });
            return modalInstance.result.then(function (result) {
                scope.memberEmail = result.email;
                scope.memberPassword = result.password;
                if (result.$has('members')) {
                    return result.$get('members').then(function (members) {
                        scope.members = members;
                        return $q.all(Array.from(members).map(function (m) {
                            return m.$get('company');
                        })).then(function (companies) {
                            return pickCompanyModal(companies);
                        });
                    });
                } else {
                    return scope.member = result;
                }
            }, function () {
                return loginModal();
            });
        };

        var pickCompanyModal = function pickCompanyModal(_companies) {
            var modalInstance = $uibModal.open({
                templateUrl: 'pick_company_modal_form.html',
                controller: pickCompanyController,
                resolve: {
                    companies: function companies() {
                        return _companies;
                    }
                }
            });
            return modalInstance.result.then(function (company_id) {
                scope.companyId = company_id;
                return tryLogin();
            }, function () {
                return pickCompanyModal();
            });
        };

        var tryLogin = function tryLogin() {
            var login_form = {
                email: scope.memberEmail,
                password: scope.memberPassword
            };
            var options = { company_id: scope.companyId };
            return MemberLoginService.login(login_form, options).then(function (result) {
                if (result.$has('members')) {
                    return result.$get('members').then(function (members) {
                        scope.members = members;
                        return $q.all(Array.from(members).map(function (m) {
                            return m.$get('company');
                        })).then(function (companies) {
                            return pickCompanyModal(companies);
                        });
                    });
                } else {
                    return scope.member = result;
                }
            }, function (err) {
                return loginModal();
            });
        };

        if (scope.memberEmail && scope.memberPassword) {
            return tryLogin();
        } else if ($sessionStorage.getItem("login")) {
            var session_member = $sessionStorage.getItem("login");
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
        template: '<div ng-show=\'member\' ng-transclude></div>'
    };
});
'use strict';

angular.module('BBMember').directive('bbMemberPastBookings', function ($rootScope, PaginationService) {

    return {
        templateUrl: 'member_past_bookings.html',
        scope: {
            member: '=',
            notLoaded: '=',
            setLoaded: '='
        },
        controller: 'MemberBookings',
        link: function link(scope, element, attrs) {

            scope.pagination = PaginationService.initialise({ page_size: 10, max_size: 5 });

            var getBookings = function getBookings() {
                return scope.getPastBookings().then(function (past_bookings) {
                    if (past_bookings) {
                        return PaginationService.update(scope.pagination, past_bookings.length);
                    }
                });
            };

            scope.$watch('member', function () {
                if (scope.member && !scope.past_bookings) {
                    return getBookings();
                }
            });

            if (scope.member) {
                return getBookings();
            }
        }
    };
});
'use strict';

angular.module('BBMember').directive('bbMemberPrePaidBookings', function ($rootScope, PaginationService) {

    return {
        templateUrl: 'member_pre_paid_bookings.html',
        scope: {
            member: '='
        },
        controller: 'MemberBookings',
        link: function link(scope, element, attrs) {

            scope.pagination = PaginationService.initialise({ page_size: 10, max_size: 5 });

            var getBookings = function getBookings() {
                return scope.getPrePaidBookings({}).then(function (pre_paid_bookings) {
                    return PaginationService.update(scope.pagination, pre_paid_bookings.length);
                });
            };

            scope.$watch('member', function () {
                if (!scope.pre_paid_bookings) {
                    return getBookings();
                }
            });

            scope.$on("booking:cancelled", function (event) {
                return scope.getPrePaidBookings({}).then(function (pre_paid_bookings) {
                    return PaginationService.update(scope.pagination, pre_paid_bookings.length);
                });
            });

            if (scope.member) {
                return getBookings();
            }
        }
    };
});
'use strict';

angular.module('BBMember').directive('bbMemberPurchases', function ($rootScope, PaginationService) {

    return {
        templateUrl: 'member_purchases.html',
        scope: true,
        controller: 'MemberPurchases',
        link: function link(scope, element, attrs) {

            scope.member = scope.$eval(attrs.member);
            if ($rootScope.member) {
                if (!scope.member) {
                    scope.member = $rootScope.member;
                }
            }

            scope.pagination = PaginationService.initialise({ page_size: 10, max_size: 5 });

            return $rootScope.connection_started.then(function () {
                if (scope.member) {
                    return scope.getPurchases().then(function (purchases) {
                        return PaginationService.update(scope.pagination, purchases.length);
                    });
                }
            });
        }
    };
});
'use strict';

angular.module('BBMember').directive('memberSsoLogin', function ($rootScope, LoginService, $sniffer, $timeout, QueryStringService) {
    return {
        scope: {
            token: '@memberSsoLogin',
            company_id: '@companyId'
        },
        transclude: true,
        template: '<div ng-if=\'member\' ng-transclude></div>',
        link: function link(scope, element, attrs) {
            var options = {
                root: $rootScope.bb.api_url,
                company_id: scope.company_id
            };
            var data = {};
            if (scope.token) {
                data.token = scope.token;
            }
            if (!data.token) {
                data.token = QueryStringService('sso_token');
            }

            if ($sniffer.msie && $sniffer.msie < 10 && $rootScope.iframe_proxy_ready === false) {
                return $timeout(function () {
                    return LoginService.ssoLogin(options, data).then(function (member) {
                        return scope.member = member;
                    });
                }, 2000);
            } else {
                return LoginService.ssoLogin(options, data).then(function (member) {
                    return scope.member = member;
                });
            }
        }
    };
});
'use strict';

angular.module('BBMember').directive('bbMemberUpcomingBookings', function ($rootScope, PaginationService, PurchaseService) {

    return {
        templateUrl: 'member_upcoming_bookings.html',
        scope: {
            member: '=',
            notLoaded: '=',
            setLoaded: '='
        },
        controller: 'MemberBookings',
        link: function link(scope, element, attrs) {

            scope.pagination = PaginationService.initialise({ page_size: 10, max_size: 5 });

            var getBookings = function getBookings() {
                return scope.getUpcomingBookings().then(function (upcoming_bookings) {
                    return PaginationService.update(scope.pagination, upcoming_bookings.length);
                });
            };

            scope.$on('updateBookings', function () {
                scope.flushBookings();
                return getBookings();
            });

            scope.$watch('member', function () {
                if (!scope.upcoming_bookings) {
                    return getBookings();
                }
            });

            return $rootScope.connection_started.then(function () {
                return getBookings();
            });
        }
    };
});
'use strict';

angular.module('BBMember').directive('bbWallet', function ($rootScope) {

    return {
        scope: true,
        controller: 'Wallet',
        templateUrl: 'wallet.html',
        link: function link(scope, element, attrs) {

            scope.member = scope.$eval(attrs.member);
            if ($rootScope.member) {
                if (!scope.member) {
                    scope.member = $rootScope.member;
                }
            }

            scope.show_wallet_logs = true;
            scope.show_topup_box = false;

            $rootScope.connection_started.then(function () {
                if (scope.member) {
                    return scope.getWalletForMember(scope.member);
                }
            });

            scope.$on('wallet:topped_up', function (event, wallet) {
                scope.wallet = wallet;
                scope.show_topup_box = false;
                return scope.show_wallet_logs = true;
            });

            return scope.$on("booking:cancelled", function (event) {
                if (scope.member) {
                    return scope.getWalletForMember(scope.member);
                }
            });
        }
    };
});
'use strict';

angular.module('BBMember').directive('bbWalletLogs', function ($rootScope, PaginationService) {

    return {
        templateUrl: 'wallet_logs.html',
        scope: true,
        controller: 'Wallet',
        require: '^?bbWallet',
        link: function link(scope, element, attrs, ctrl) {

            scope.member = scope.$eval(attrs.member);
            if ($rootScope.member) {
                if (!scope.member) {
                    scope.member = $rootScope.member;
                }
            }

            scope.pagination = PaginationService.initialise({ page_size: 10, max_size: 5 });

            var getWalletLogs = function getWalletLogs() {
                return scope.getWalletLogs().then(function (logs) {
                    return PaginationService.update(scope.pagination, logs.length);
                });
            };

            // listen to when the wallet is topped up
            scope.$on('wallet:topped_up', function (event) {
                return getWalletLogs();
            });

            // wait for wallet to be loaded by bbWallet or by self
            return $rootScope.connection_started.then(function () {
                if (ctrl) {
                    var deregisterWatch = void 0;
                    return deregisterWatch = scope.$watch('wallet', function () {
                        if (scope.wallet) {
                            getWalletLogs();
                            return deregisterWatch();
                        }
                    });
                } else {
                    return scope.getWalletForMember(scope.member).then(function () {
                        return getWalletLogs();
                    });
                }
            });
        }
    };
});
"use strict";

angular.module("BB.Directives").directive("bbWalletPayment", function ($sce, $rootScope, $window, $location, GeneralOptions, AlertService) {

    return {
        restrict: 'A',
        controller: 'Wallet',
        scope: true,
        replace: true,
        require: '^?bbWallet',
        link: function link(scope, element, attrs, ctrl) {

            var one_pound = 100;
            scope.wallet_payment_options = scope.$eval(attrs.bbWalletPayment) || {};
            scope.member = scope.$eval(attrs.member);
            if ($rootScope.member) {
                if (!scope.member) {
                    scope.member = $rootScope.member;
                }
            }
            if (scope.wallet_payment_options.member) {
                if (!scope.member) {
                    scope.member = scope.wallet_payment_options.member;
                }
            }
            scope.amount_increment = scope.wallet_payment_options.amount_increment || one_pound;

            var getHost = function getHost(url) {
                var a = document.createElement('a');
                a.href = url;
                return a['protocol'] + '//' + a['host'];
            };

            var sendLoadEvent = function sendLoadEvent(element, origin, scope) {
                var referrer = $location.protocol() + "://" + $location.host();
                if ($location.port()) {
                    referrer += ":" + $location.port();
                }

                var custom_stylesheet = scope.wallet_payment_options.custom_stylesheet ? scope.wallet_payment_options.custom_stylesheet : null;
                var custom_partial_url = scope.bb && scope.bb.custom_partial_url ? scope.bb.custom_partial_url : null;

                var payload = JSON.stringify({
                    'type': 'load',
                    'message': referrer,
                    'custom_partial_url': custom_partial_url,
                    'custom_stylesheet': custom_stylesheet,
                    'scroll_offset': GeneralOptions.scroll_offset
                });
                return element.find('iframe')[0].contentWindow.postMessage(payload, origin);
            };

            var calculateAmount = function calculateAmount() {
                // if this is a basket topup, use either the amount due or the min topup amount, whichever is greatest

                if (scope.wallet_payment_options.basket_topup) {

                    var amount_due = scope.bb.basket.dueTotal() - scope.wallet.amount;

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

            // wait for wallet to be loaded by bbWallet or by self
            $rootScope.connection_started.then(function () {
                if (ctrl) {
                    var deregisterWatch = void 0;
                    return deregisterWatch = scope.$watch('wallet', function () {
                        if (scope.wallet) {
                            calculateAmount();
                            return deregisterWatch();
                        }
                    });
                } else {
                    return scope.getWalletForMember(scope.member).then(function () {
                        return calculateAmount();
                    });
                }
            });

            // listen to when the wallet is updated
            scope.$on('wallet:updated', function (event, wallet, band) {

                // load iframe using payment link
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
                    return element.find('iframe').bind('load', function (event) {
                        var url = void 0;
                        if (scope.wallet_payment_url) {
                            url = scope.wallet_payment_url;
                        }
                        var origin = getHost(url);
                        sendLoadEvent(element, origin, scope);
                        return scope.$apply(function () {
                            return scope.setLoaded(scope);
                        });
                    });
                }
            });

            // register iframe message listener
            return $window.addEventListener('message', function (event) {
                var data = void 0;
                if (angular.isObject(event.data)) {
                    data = event.data;
                } else if (!event.data.match(/iFrameSizer/)) {
                    data = JSON.parse(event.data);
                }
                return scope.$apply(function () {
                    if (data) {
                        switch (data.type) {
                            case "submitting":
                                return scope.notLoaded(scope);
                            case "error":
                                $rootScope.$broadcast("wallet:topup_failed");
                                scope.notLoaded(scope);
                                // reload the payment iframe
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
            }, false);
        }
    };
});
"use strict";

angular.module("BB.Directives").directive("bbWalletPurchaseBands", function ($rootScope) {

    return {
        scope: true,
        restrict: "AE",
        templateUrl: "wallet_purchase_bands.html",
        controller: "Wallet",
        require: '^?bbWallet',
        link: function link(scope, attr, elem, ctrl) {

            scope.member = scope.$eval(attr.member);
            if ($rootScope.member) {
                if (!scope.member) {
                    scope.member = $rootScope.member;
                }
            }

            return $rootScope.connection_started.then(function () {
                if (ctrl) {
                    var deregisterWatch = void 0;
                    return deregisterWatch = scope.$watch('wallet', function () {
                        if (scope.wallet) {
                            scope.getWalletPurchaseBandsForWallet(scope.wallet);
                            return deregisterWatch();
                        }
                    });
                } else {
                    return scope.getWalletForMember(scope.member).then(function () {
                        return scope.getWalletPurchaseBandsForWallet(scope.wallet);
                    });
                }
            });
        }
    };
});
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

angular.module('BB.Models').factory("Member.BookingModel", function ($q, $window, $bbug, MemberBookingService, BBModel, BaseModel) {
    return function (_BaseModel) {
        _inherits(Member_Booking, _BaseModel);

        function Member_Booking(data) {
            _classCallCheck(this, Member_Booking);

            var _this = _possibleConstructorReturn(this, _BaseModel.call(this, data));

            _this.datetime = moment.parseZone(_this.datetime);
            if (_this.time_zone) {
                _this.datetime.tz(_this.time_zone);
            }

            _this.end_datetime = moment.parseZone(_this.end_datetime);
            if (_this.time_zone) {
                _this.end_datetime.tz(_this.time_zone);
            }

            _this.min_cancellation_time = moment(_this.min_cancellation_time);
            _this.min_cancellation_hours = _this.datetime.diff(_this.min_cancellation_time, 'hours');
            return _this;
        }

        Member_Booking.prototype.icalLink = function icalLink() {
            return this._data.$href('ical');
        };

        Member_Booking.prototype.webcalLink = function webcalLink() {
            return this._data.$href('ical');
        };

        Member_Booking.prototype.gcalLink = function gcalLink() {
            return this._data.$href('gcal');
        };

        Member_Booking.prototype.getGroup = function getGroup() {
            var _this2 = this;

            if (this.group) {
                return this.group;
            }
            if (this._data.$has('event_groups')) {
                return this._data.$get('event_groups').then(function (group) {
                    _this2.group = group;
                    return _this2.group;
                });
            }
        };

        Member_Booking.prototype.getColour = function getColour() {
            if (this.getGroup()) {
                return this.getGroup().colour;
            } else {
                return "#FFFFFF";
            }
        };

        Member_Booking.prototype.getCompany = function getCompany() {
            var _this3 = this;

            if (this.company) {
                return this.company;
            }
            if (this.$has('company')) {
                return this._data.$get('company').then(function (company) {
                    _this3.company = new BBModel.Company(company);
                    return _this3.company;
                });
            }
        };

        Member_Booking.prototype.getAnswers = function getAnswers() {
            var _this4 = this;

            var defer = $q.defer();
            if (this.answers) {
                defer.resolve(this.answers);
            }
            if (this._data.$has('answers')) {
                this._data.$get('answers').then(function (answers) {
                    _this4.answers = Array.from(answers).map(function (a) {
                        return new BBModel.Answer(a);
                    });
                    return defer.resolve(_this4.answers);
                });
            } else {
                defer.resolve([]);
            }
            return defer.promise;
        };

        Member_Booking.prototype.printed_price = function printed_price() {
            if (parseFloat(this.price) % 1 === 0) {
                return '\xA3' + this.price;
            }
            return $window.sprintf("£%.2f", parseFloat(this.price));
        };

        Member_Booking.prototype.$getMember = function $getMember() {
            var _this5 = this;

            var defer = $q.defer();
            if (this.member) {
                defer.resolve(this.member);
            }
            if (this._data.$has('member')) {
                this._data.$get('member').then(function (member) {
                    _this5.member = new BBModel.Member.Member(member);
                    return defer.resolve(_this5.member);
                });
            }
            return defer.promise;
        };

        Member_Booking.prototype.canCancel = function canCancel() {
            return moment(this.min_cancellation_time).isAfter(moment());
        };

        Member_Booking.prototype.canMove = function canMove() {
            return this.canCancel();
        };

        Member_Booking.prototype.$update = function $update() {
            return MemberBookingService.update(this);
        };

        Member_Booking.$query = function $query(member, params) {
            return MemberBookingService.query(member, params);
        };

        Member_Booking.$cancel = function $cancel(member, booking) {
            return MemberBookingService.cancel(member, booking);
        };

        Member_Booking.$update = function $update(booking) {
            return MemberBookingService.update(booking);
        };

        Member_Booking.$flush = function $flush(member, params) {
            return MemberBookingService.flush(member, params);
        };

        return Member_Booking;
    }(BaseModel);
});
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

angular.module('BB.Models').factory("Member.MemberModel", function ($q, MemberService, BBModel, BaseModel, ClientModel) {
    return function (_ClientModel) {
        _inherits(Member_Member, _ClientModel);

        function Member_Member() {
            _classCallCheck(this, Member_Member);

            return _possibleConstructorReturn(this, _ClientModel.apply(this, arguments));
        }

        Member_Member.$refresh = function $refresh(member) {
            return MemberService.refresh(member);
        };

        Member_Member.$current = function $current() {
            return MemberService.current();
        };

        Member_Member.$updateMember = function $updateMember(member, params) {
            return MemberService.updateMember(member, params);
        };

        Member_Member.$sendWelcomeEmail = function $sendWelcomeEmail(member, params) {
            return MemberService.sendWelcomeEmail(member, params);
        };

        Member_Member.prototype.getBookings = function getBookings(params) {
            return BBModel.Member.Booking.$query(this, params);
        };

        return Member_Member;
    }(ClientModel);
});
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

angular.module("BB.Models").factory("Member.PaymentItemModel", function (BBModel, BaseModel) {
    return function (_BaseModel) {
        _inherits(Member_PaymentItem, _BaseModel);

        function Member_PaymentItem(data) {
            _classCallCheck(this, Member_PaymentItem);

            return _possibleConstructorReturn(this, _BaseModel.call(this, data));
        }

        return Member_PaymentItem;
    }(BaseModel);
});
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

angular.module('BB.Models').factory("Member.PrePaidBookingModel", function (BaseModel) {
    return function (_BaseModel) {
        _inherits(Member_PrePaidBooking, _BaseModel);

        function Member_PrePaidBooking(data) {
            _classCallCheck(this, Member_PrePaidBooking);

            return _possibleConstructorReturn(this, _BaseModel.call(this, data));
        }

        return Member_PrePaidBooking;
    }(BaseModel);
});
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

angular.module("BB.Models").factory("Member.PurchaseModel", function ($q, MemberPurchaseService, BBModel, BaseModel) {
    return function (_BaseModel) {
        _inherits(Member_Purchase, _BaseModel);

        function Member_Purchase(data) {
            _classCallCheck(this, Member_Purchase);

            var _this = _possibleConstructorReturn(this, _BaseModel.call(this, data));

            _this.created_at = moment.parseZone(_this.created_at);
            if (_this.time_zone) {
                _this.created_at.tz(_this.time_zone);
            }
            return _this;
        }

        Member_Purchase.prototype.getItems = function getItems() {
            var deferred = $q.defer();
            this._data.$get('purchase_items').then(function (items) {
                this.items = Array.from(items).map(function (item) {
                    return new BBModel.Member.PurchaseItem(item);
                });
                return deferred.resolve(this.items);
            });
            return deferred.promise;
        };

        Member_Purchase.$query = function $query(member, params) {
            return MemberPurchaseService.query(member, params);
        };

        return Member_Purchase;
    }(BaseModel);
});
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

angular.module("BB.Models").factory("Member.PurchaseItemModel", function (BBModel, BaseModel) {
    return function (_BaseModel) {
        _inherits(Member_PurchaseItem, _BaseModel);

        function Member_PurchaseItem(data) {
            _classCallCheck(this, Member_PurchaseItem);

            return _possibleConstructorReturn(this, _BaseModel.call(this, data));
        }

        return Member_PurchaseItem;
    }(BaseModel);
});
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

angular.module("BB.Models").factory("Member.WalletModel", function (WalletService, BBModel, BaseModel) {
    return function (_BaseModel) {
        _inherits(Member_Wallet, _BaseModel);

        function Member_Wallet(data) {
            _classCallCheck(this, Member_Wallet);

            return _possibleConstructorReturn(this, _BaseModel.call(this, data));
        }

        Member_Wallet.$getWalletForMember = function $getWalletForMember(member, params) {
            return WalletService.getWalletForMember(member, params);
        };

        Member_Wallet.$getWalletLogs = function $getWalletLogs(wallet) {
            return WalletService.getWalletLogs(wallet);
        };

        Member_Wallet.$getWalletPurchaseBandsForWallet = function $getWalletPurchaseBandsForWallet(wallet) {
            return WalletService.getWalletPurchaseBandsForWallet(wallet);
        };

        Member_Wallet.$updateWalletForMember = function $updateWalletForMember(member, params) {
            return WalletService.updateWalletForMember(member, params);
        };

        Member_Wallet.$createWalletForMember = function $createWalletForMember(member) {
            return WalletService.createWalletForMember(member);
        };

        return Member_Wallet;
    }(BaseModel);
});
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

angular.module("BB.Models").factory("Member.WalletLogModel", function ($q, BBModel, BaseModel) {
    return function (_BaseModel) {
        _inherits(Member_WalletLog, _BaseModel);

        function Member_WalletLog(data) {
            _classCallCheck(this, Member_WalletLog);

            var _this = _possibleConstructorReturn(this, _BaseModel.call(this, data));

            _this.created_at = moment(_this.created_at);

            // HACK - if payment amount is less than zero, API returns it as zero!
            _this.payment_amount = parseFloat(_this.amount) * 100;

            // HACK - new wallet amount should be returned as a integer
            _this.new_wallet_amount = parseFloat(_this.new_wallet_amount) * 100;
            return _this;
        }

        return Member_WalletLog;
    }(BaseModel);
});
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

angular.module("BB.Models").factory('Member.WalletPurchaseBandModel', function (BBModel, BaseModel) {
    return function (_BaseModel) {
        _inherits(Member_WalletPurchaseBand, _BaseModel);

        function Member_WalletPurchaseBand(data) {
            _classCallCheck(this, Member_WalletPurchaseBand);

            return _possibleConstructorReturn(this, _BaseModel.call(this, data));
        }

        return Member_WalletPurchaseBand;
    }(BaseModel);
});
'use strict';

angular.module('BBMember.Services').factory("MemberBookingService", function ($q, SpaceCollections, $rootScope, MemberService, BBModel) {

    return {
        query: function query(member, params) {
            var deferred = $q.defer();
            if (!params) {
                params = {};
            }
            params.no_cache = true;
            if (!member.$has('bookings')) {
                deferred.reject("member does not have bookings");
            } else {
                member.$get('bookings', params).then(function (bookings) {
                    var booking = void 0;
                    if (angular.isArray(bookings)) {
                        // bookings embedded in member
                        bookings = function () {
                            var result = [];
                            var _iteratorNormalCompletion = true;
                            var _didIteratorError = false;
                            var _iteratorError = undefined;

                            try {
                                for (var _iterator = Array.from(bookings)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                                    booking = _step.value;

                                    result.push(new BBModel.Member.Booking(booking));
                                }
                            } catch (err) {
                                _didIteratorError = true;
                                _iteratorError = err;
                            } finally {
                                try {
                                    if (!_iteratorNormalCompletion && _iterator.return) {
                                        _iterator.return();
                                    }
                                } finally {
                                    if (_didIteratorError) {
                                        throw _iteratorError;
                                    }
                                }
                            }

                            return result;
                        }();
                        return deferred.resolve(bookings);
                    } else {
                        params.no_cache = false;
                        return bookings.$get('bookings', params).then(function (bookings) {
                            bookings = function () {
                                var result1 = [];
                                var _iteratorNormalCompletion2 = true;
                                var _didIteratorError2 = false;
                                var _iteratorError2 = undefined;

                                try {
                                    for (var _iterator2 = Array.from(bookings)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                                        booking = _step2.value;

                                        result1.push(new BBModel.Member.Booking(booking));
                                    }
                                } catch (err) {
                                    _didIteratorError2 = true;
                                    _iteratorError2 = err;
                                } finally {
                                    try {
                                        if (!_iteratorNormalCompletion2 && _iterator2.return) {
                                            _iterator2.return();
                                        }
                                    } finally {
                                        if (_didIteratorError2) {
                                            throw _iteratorError2;
                                        }
                                    }
                                }

                                return result1;
                            }();
                            return deferred.resolve(bookings);
                        }, function (err) {
                            return deferred.reject(err);
                        });
                    }
                }, function (err) {
                    return deferred.reject(err);
                });
            }
            return deferred.promise;
        },
        cancel: function cancel(member, booking) {
            var deferred = $q.defer();
            booking.$del('self').then(function (b) {
                booking.deleted = true;
                b = new BBModel.Member.Booking(b);
                BBModel.Member.Member.$refresh(member).then(function (member) {
                    return member;
                }, function (err) {});
                return deferred.resolve(b);
            }, function (err) {
                return deferred.reject(err);
            });
            return deferred.promise;
        },
        update: function update(booking) {
            var deferred = $q.defer();
            booking.$put('self', {}, booking).then(function (booking) {
                var book = new BBModel.Member.Booking(booking);
                SpaceCollections.checkItems(book);
                return deferred.resolve(book);
            }, function (err) {
                _.each(booking, function (value, key, booking) {
                    if (key !== 'data' && key !== 'self') {
                        return booking[key] = booking.data[key];
                    }
                });
                return deferred.reject(err, new BBModel.Member.Booking(booking));
            });
            return deferred.promise;
        },
        flush: function flush(member, params) {
            if (member.$has('bookings')) {
                return member.$flush('bookings', params);
            }
        }
    };
});
'use strict';

angular.module('BBMember.Services').factory("MemberLoginService", function ($q, $rootScope, $sessionStorage, halClient, BBModel) {

    return {
        login: function login(form, options) {
            var defer = $q.defer();
            var url = $rootScope.bb.api_url + '/api/v1/login';
            if (options.company_id != null) {
                url = url + '/member/' + options.company_id;
            }
            halClient.$post(url, options, form).then(function (login) {
                if (login.$has('member')) {
                    return login.$get('member').then(function (member) {
                        member = new BBModel.Member.Member(member);
                        var auth_token = member._data.getOption('auth_token');
                        $sessionStorage.setItem("login", member.$toStore());
                        $sessionStorage.setItem("auth_token", auth_token);
                        return defer.resolve(member);
                    });
                } else if (login.$has('members')) {
                    return defer.resolve(login);
                } else {
                    return defer.reject("No member account for login");
                }
            }, function (err) {
                if (err.status === 400) {
                    var login = halClient.$parse(err.data);
                    if (login.$has('members')) {
                        return defer.resolve(login);
                    } else {
                        return defer.reject(err);
                    }
                } else {
                    return defer.reject(err);
                }
            });
            return defer.promise;
        }
    };
});
'use strict';

angular.module('BBMember.Services').factory("MemberService", function ($q, halClient, $rootScope, BBModel) {

    return {
        refresh: function refresh(member) {
            var deferred = $q.defer();
            member.$flush('self');
            member.$get('self').then(function (member) {
                member = new BBModel.Member.Member(member);
                return deferred.resolve(member);
            }, function (err) {
                return deferred.reject(err);
            });
            return deferred.promise;
        },
        current: function current() {
            var deferred = $q.defer();
            var callback = function callback() {
                return deferred.resolve($rootScope.member);
            };
            setTimeout(callback, 200);
            // member = () ->
            // deferred.resolve($rootScope.member)
            return deferred.promise;
        },
        updateMember: function updateMember(member, params) {
            var deferred = $q.defer();
            member.$put('self', {}, params).then(function (member) {
                member = new BBModel.Member.Member(member);
                return deferred.resolve(member);
            }, function (err) {
                return deferred.reject(err);
            });
            return deferred.promise;
        },
        sendWelcomeEmail: function sendWelcomeEmail(member, params) {
            var deferred = $q.defer();
            member.$post('send_welcome_email', params).then(function (member) {
                member = new BBModel.Member.Member(member);
                return deferred.resolve(member);
            }, function (err) {
                return deferred.reject(err);
            });
            return deferred.promise;
        }
    };
});
'use strict';

angular.module('BBMember.Services').factory("MemberPrePaidBookingService", function ($q, BBModel) {

    return {
        query: function query(member, params) {
            var deferred = $q.defer();
            if (!params) {
                params = {};
            }
            params.no_cache = true;
            if (!member.$has('pre_paid_bookings')) {
                deferred.reject("member does not have pre paid bookings");
            } else {
                member.$get('pre_paid_bookings', params).then(function (bookings) {
                    var booking = void 0;
                    if (angular.isArray(bookings)) {
                        // pre paid bookings embedded in member
                        bookings = function () {
                            var result = [];
                            var _iteratorNormalCompletion = true;
                            var _didIteratorError = false;
                            var _iteratorError = undefined;

                            try {
                                for (var _iterator = Array.from(bookings)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                                    booking = _step.value;

                                    result.push(new BBModel.PrePaidBooking(booking));
                                }
                            } catch (err) {
                                _didIteratorError = true;
                                _iteratorError = err;
                            } finally {
                                try {
                                    if (!_iteratorNormalCompletion && _iterator.return) {
                                        _iterator.return();
                                    }
                                } finally {
                                    if (_didIteratorError) {
                                        throw _iteratorError;
                                    }
                                }
                            }

                            return result;
                        }();
                        return deferred.resolve(bookings);
                    } else {
                        params.no_cache = false;
                        return bookings.$get('pre_paid_bookings', params).then(function (bookings) {
                            bookings = function () {
                                var result1 = [];
                                var _iteratorNormalCompletion2 = true;
                                var _didIteratorError2 = false;
                                var _iteratorError2 = undefined;

                                try {
                                    for (var _iterator2 = Array.from(bookings)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                                        booking = _step2.value;

                                        result1.push(new BBModel.PrePaidBooking(booking));
                                    }
                                } catch (err) {
                                    _didIteratorError2 = true;
                                    _iteratorError2 = err;
                                } finally {
                                    try {
                                        if (!_iteratorNormalCompletion2 && _iterator2.return) {
                                            _iterator2.return();
                                        }
                                    } finally {
                                        if (_didIteratorError2) {
                                            throw _iteratorError2;
                                        }
                                    }
                                }

                                return result1;
                            }();
                            return deferred.resolve(bookings);
                        });
                    }
                }, function (err) {
                    return deferred.reject(err);
                });
            }
            return deferred.promise;
        }
    };
});
'use strict';

angular.module('BBMember.Services').factory("MemberPurchaseService", function ($q, $rootScope, BBModel) {

    return {
        query: function query(member, params) {
            if (!params) {
                params = {};
            }
            params.no_cache = true;
            var deferred = $q.defer();
            if (!member.$has('purchase_totals')) {
                deferred.reject("member does not have any purchases");
            } else {
                member.$get('purchase_totals', params).then(function (purchases) {
                    params.no_cache = false;
                    return purchases.$get('purchase_totals', params).then(function (purchases) {
                        purchases = Array.from(purchases).map(function (purchase) {
                            return new BBModel.PurchaseTotal(purchase);
                        });
                        return deferred.resolve(purchases);
                    }, function (err) {
                        if (err.status === 404) {
                            return deferred.resolve([]);
                        } else {
                            return deferred.reject(err);
                        }
                    });
                }, function (err) {
                    if (err.status === 404) {
                        return deferred.resolve([]);
                    } else {
                        return deferred.reject(err);
                    }
                });
            }
            return deferred.promise;
        }
    };
});
"use strict";

angular.module('BBMember.Services').factory("BB.Service.payment_item", function ($q, BBModel, UnwrapService) {

    return {
        unwrap: function unwrap(resource) {
            return UnwrapService.unwrapResource(BBModel.Member.PaymentItem, resource);
        }
    };
});
"use strict";

angular.module("BBMember.Services").factory("WalletService", function ($q, BBModel) {

    return {
        getWalletForMember: function getWalletForMember(member, params) {
            if (!params) {
                params = {};
            }
            params.no_cache = true;
            var deferred = $q.defer();
            if (!member.$has("wallet")) {
                deferred.reject("Wallets are not turned on.");
            } else {
                member.$get("wallet", params).then(function (wallet) {
                    wallet = new BBModel.Member.Wallet(wallet);
                    return deferred.resolve(wallet);
                }, function (err) {
                    return deferred.reject(err);
                });
            }
            return deferred.promise;
        },
        getWalletLogs: function getWalletLogs(wallet) {
            var params = { no_cache: true };
            var deferred = $q.defer();
            if (!wallet.$has('logs')) {
                deferred.reject("No wallet transactions found");
            } else {
                wallet.$get('logs', params).then(function (resource) {
                    return resource.$get('logs').then(function (logs) {
                        logs = Array.from(logs).map(function (log) {
                            return new BBModel.Member.WalletLog(log);
                        });
                        return deferred.resolve(logs);
                    });
                }, function (err) {
                    return deferred.reject(err);
                });
            }

            return deferred.promise;
        },
        getWalletPurchaseBandsForWallet: function getWalletPurchaseBandsForWallet(wallet) {
            var deferred = $q.defer();
            if (!wallet.$has('purchase_bands')) {
                deferred.reject("No Purchase Bands");
            } else {
                wallet.$get("purchase_bands", {}).then(function (resource) {
                    return resource.$get("purchase_bands").then(function (bands) {
                        bands = Array.from(bands).map(function (band) {
                            return new BBModel.Member.WalletPurchaseBand(band);
                        });
                        return deferred.resolve(bands);
                    });
                }, function (err) {
                    return deferred.reject(err);
                });
            }
            return deferred.promise;
        },
        updateWalletForMember: function updateWalletForMember(member, params) {
            var deferred = $q.defer();
            if (!member.$has("wallet")) {
                deferred.reject("Wallets are not turned on.");
            } else {
                member.$put("wallet", {}, params).then(function (wallet) {
                    wallet = new BBModel.Member.Wallet(wallet);
                    return deferred.resolve(wallet);
                }, function (err) {
                    return deferred.reject(err);
                });
            }
            return deferred.promise;
        },
        createWalletForMember: function createWalletForMember(member) {
            var deferred = $q.defer();
            var params = {};
            if (!member.$has("wallet")) {
                deferred.reject("Wallets are not turned on.");
            } else {
                member.$post("wallet", {}, params).then(function (wallet) {
                    wallet = new BBModel.Member.Wallet(wallet);
                    return deferred.resolve(wallet);
                }, function (err) {
                    return deferred.reject(err);
                });
            }
            return deferred.promise;
        }
    };
});
"use strict";

angular.module("BBMember").config(function ($translateProvider) {
    "ngInject";

    var translations = {
        MEMBER: {
            MODAL: {
                EDIT_BOOKING: {
                    CANCEL_BTN: "@:COMMON.BTN.CANCEL",
                    SAVE_BTN: "@:COMMON.BTN.SAVE"
                },
                LOGIN: {
                    OK_BTN: "@:COMMON.BTN.OK",
                    CANCEL_BTN: "@:COMMON.BTN.CANCEL"
                },
                DELETE_BOOKING: {
                    TITLE: "@:COMMON.BTN.CANCEL_BOOKING",
                    DESCRIPTION_LBL: "@:COMMON.TERMINOLOGY.BOOKING",
                    WHEN_LBL: "@:COMMON.TERMINOLOGY.WHEN",
                    CANCEL_BOOKING_BTN: "@:COMMON.BTN.CANCEL_BOOKING",
                    CANCEL_BTN: "@:COMMON.BTN.DO_NOT_CANCEL_BOOKING"
                },
                BOOKINGS_TABLE_CANCEL_BOOKING: {
                    TITLE: "@:COMMON.BTN.CANCEL_BOOKING",
                    EMAIL_CUSTOMER_CHECKBOX_LBL: "Email customer?",
                    CANCEL_BOOKING_BTN: "@:COMMON.BTN.CANCEL_BOOKING",
                    CANCEL_BTN: "@:COMMON.BTN.DO_NOT_CANCEL_BOOKING"
                },
                PICK_COMPANY: {
                    OK_BTN: "@:COMMON.BTN.OK",
                    CANCEL_BTN: "@:COMMON.BTN.CANCEL"
                },
                BOOKING_PAYMENT: {
                    DESCRIPTION: "Pay for your booking to confirm your place.",
                    TIME_RANGE: "{{start | datetime: 'LT'}} - {{end | datetime: 'LT'}}",
                    PAY_BTN: "@:COMMON.BTN.PAY"
                }
            },
            LOGIN: {
                EMAIL_LBL: "@:COMMON.TERMINOLOGY.EMAIL",
                EMAIL_PLACEHOLDER: "@:COMMON.TERMINOLOGY.EMAIL",
                PASSWORD_LBL: "@:COMMON.FORM.PASSWORD",
                PASSWORD_PLACEHOLDER: "@:COMMON.FORM.PASSWORD",
                LOGIN_BTN: "@:COMMON.BTN.LOGIN"
            },
            MEMBER_BOOKINGS_TABLE: {
                DETAILS_BTN: "@:COMMON.BTN.DETAILS",
                CANCEL_BTN: "@:COMMON.BTN.CANCEL"
            },
            BOOKING: {
                TOGGLE_DROPDOWN_BTN: "Toggle Dropdown"
            },
            BOOKING_TABS: {
                UPCOMING_BOOKINGS_TAB_HEADING: "Upcoming bookings",
                PAST_BOOKINGS_TAB_HEADING: "Past bookings",
                PURCHASES_TAB_HEADING: "Purchases"
            },
            MEMBER_PAST_BOOKINGS: {
                NO_PAST_BOOKINGS: "You don't currently have any past bookings."
            },
            PAST_BOOKINGS: {
                HEADING: "Past Bookings"
            },
            PREPAID_BOOKINGS: {
                NO_PREPAID_BOOKINGS: "You don't currently have any pre-paid bookings.",
                REMAINING_BOOKINGS: "{{remaining}} of {{total}} remaining",
                PREPAID_BOOKING_DATES: "Book By {{booking.book_by | datetime: 'L'}} | Use from {{booking.use_from | datetime: 'L'}} | Use by {{booking.use_by | datetime: 'L'}}"
            },
            PURCHASES: {
                YOUR_PURCHASES: "Your Purchases",
                NO_CURRENT_PURCHASES: "You don't currently have any purchases",
                PURCHASE_DATE_COL_HEADING: "Purchase Date",
                ITEMS_COL_HEADING: "Items",
                TOTAL_PRICE_COL_HEADING: "Total Price",
                LESS_DETAIL_BTN: "@:COMMON.BTN.LESS",
                MORE_DETAIL_BTN: "@:COMMON.BTN.MORE"
            },
            MEMBER_UPCOMING_BOOKINGS: {
                NO_UPCOMING_BOOKINGS: "You don't currently have any upcoming bookings.",
                ON_WAITLIST_HEADING: "On Waitlist",
                CONFIRMED_HEADING: "Confirmed"
            },
            UPCOMING_BOOKINGS: {
                HEADING: "Upcoming Bookings"
            },
            PICK_COMPANY: {
                DESCRIPTION: "Pick Company"
            },
            WAITLIST_PAYMENT: {
                DESCRIPTION: "Pay for your booking to confirm your place.",
                PAY_BTN: "@:COMMON.BTN.PAY"
            },
            WALLET: {
                BALANCE_LBL: "Balance:",
                WALLET_NO_CREDIT: "You don't have any credit in your wallet.",
                STATUS_LBL: "Status:",
                STATUS_INACTIVE: "Your wallet is not active.",
                STATUS_ACTIVE: "Active",
                ACTIVATE_BTN: "Activate",
                TOP_UP_BTN: "@:COMMON.BTN.TOP_UP",
                AMOUNT_LBL: "Amount",
                PAYMENT_IFRAME_HEADING: "Make Payment",
                TOP_UP_WALLET_BY: "Top up wallet by {{amount | currency}}",
                MIN_TOP_UP: "Minimum top up amount must be greater than {{min_amount | currency}}",
                TOPUP_AMOUNT_PLACEHOLDER: "Enter Top Up Amount"
            },
            WALLET_LOGS: {
                HEADING: "Wallet Transaction History",
                ACTION_COL_HEADING: "Action",
                AMOUNT_COL_HEADING: "Amount",
                BALANCE_COL_HEADING: "Balance",
                CHANGED_BY_COL_HEADING: "Changed By",
                DATE_TIME_COL_HEADING: "@:COMMON.TERMINOLOGY.DATE_TIME"
            },
            WALLET_PURCHASE_BANDS: {
                HEADING: "Wallet Purchase Bands",
                $X_FOR_$Y: "{{x | currency}} for {{y | currency}}",
                BUY_BTN: "@:COMMON.BTN.BUY"
            },
            PURCHASE_HISTORY: {
                HEADING: "Purchase History"
            }
        }
    };

    $translateProvider.translations("en", translations);
});