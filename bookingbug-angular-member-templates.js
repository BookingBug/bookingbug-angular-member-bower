angular.module("BB").run(["$templateCache", function($templateCache) {$templateCache.put("edit_booking_modal_form.html","<div class=\"modal-header\">\r\n  <button type=\"button\" class=\"close\" ng-click=\"cancel($event)\">&times;</button>\r\n  <h3 class=\"modal-title\">{{title}}</h3>\r\n</div>\r\n<form name=\"booking_form\" ng-submit=\"submit(modal_form)\">\r\n  <div class=\"member_booking_form_content modal-body\" bb-modal>\r\n    <p>{{form_model.full_describe}}</p>\r\n    <p>{{form_model.describe}}</p>\r\n    <div sf-schema=\"schema\" sf-form=\"form\" sf-model=\"form_model\" sf-options=\"{formDefaults: {feedback: false}}\">\r\n    </div>\r\n  </div>\r\n  <div class=\"modal-footer\">\r\n    <input type=\"submit\" class=\"btn btn-primary\" value=\"Save\">\r\n    <button class=\"btn btn-default\" ng-click=\"cancel($event)\">Cancel</button>\r\n  </div>\r\n</form>\r\n");
$templateCache.put("login.html","<form name=\"login_form\" ng-submit=\"submit()\" class=\"form-horizontal\"\r\n  role=\"form\">\r\n  <div class=\"alert alert-danger\" role=\"alert\" ng-if=\"alert && alert.length > 0\">{{alert}}</div>\r\n  <div ng-class=\"{\'form-group\': true, \'has-error\': emailIsInvalid()}\">\r\n    <label for=\"email\" class=\"col-sm-2 control-label\">Email</label>\r\n    <div class=\"col-sm-10\">\r\n      <input type=\"email\" ng-model=\"email\" name=\"email\" class=\"form-control\"\r\n        id=\"email\" placeholder=\"Email\" required autofocus>\r\n    </div>\r\n  </div>\r\n  <div ng-class=\"{\'form-group\': true, \'has-error\': passwordIsInvalid()}\">\r\n    <label for=\"password\" class=\"col-sm-2 control-label\">Password</label>\r\n    <div class=\"col-sm-10\">\r\n      <input type=\"password\" ng-model=\"password\" name=\"password\"\r\n        class=\"form-control\" id=\"password\" placeholder=\"Password\" required>\r\n    </div>\r\n  </div>\r\n  <div class=\"form-group\">\r\n    <div class=\"col-sm-offset-2 col-sm-10\">\r\n      <button type=\"submit\" class=\"btn btn-primary\">Log In</button>\r\n    </div>\r\n  </div>\r\n</form>\r\n");
$templateCache.put("login_modal_form.html","<div class=\"modal-header\">\r\n  <h3 class=\"modal-title\">{{title}}</h3>\r\n</div>\r\n<form name=\"login_form\" ng-submit=\"submit(login_form)\">\r\n  <div class=\"modal-body\" sf-schema=\"schema\" sf-form=\"form\"\r\n    sf-model=\"login_form\">\r\n  </div>\r\n  <div class=\"modal-footer\">\r\n    <input type=\"submit\" class=\"btn btn-primary\" value=\"OK\">\r\n    <button class=\"btn btn-default\" ng-click=\"cancel($event)\">Dismiss</button>\r\n  </div>\r\n</form>\r\n");
$templateCache.put("member_bookings_table.html","<div ng-show=\"loading\"><img src=\'/BB_wait.gif\' class=\"loader\"></div>\r\n<table tr-ng-grid=\"\" items=\"bookings\" enable-filtering=\"false\"\r\n  ng-hide=\"loading\" fields=\"fields\" order-by=\"orderBy\">\r\n  <thead>\r\n    <tr>\r\n      <th field-name=\"date_order\" display-name=\"Date/Time\"></th>\r\n      <th field-name=\"details\" display-name=\"Description\"></th>\r\n    </tr>\r\n  </thead>\r\n  <tbody>\r\n    <tr>\r\n      <td field-name=\"date_order\"><span>{{gridItem.datetime | datetime: \'ddd DD MMM YY h.mma\'}}</span></td>\r\n      <td field-name=\"details\"><span>{{gridItem.details}}</span></td>\r\n      <td>\r\n        <button class=\"btn btn-default btn-sm\"\r\n          ng-hide=\"gridItem.date < now\"\r\n          ng-click=\"cancel(gridItem.id)\">\r\n            Cancel\r\n        </button>\r\n        <button class=\"btn btn-default btn-sm\"\r\n          ng-hide=\"gridItem.date < now\"\r\n          ng-click=\"edit(gridItem.id)\">\r\n            Details\r\n        </button>\r\n      </td>\r\n    </tr>\r\n  </tbody>\r\n</table>\r\n\r\n");
$templateCache.put("member_bookings_table_cancel_booking.html","<div class=\"modal-header\">\r\n  <h3 class=\"modal-title\">Cancel Booking</h3>\r\n</div>\r\n<form ng-submit=\"ok()\">\r\n  <div class=\"modal-body\" style=\"min-height: 200px\">\r\n    <div class=\"checkbox\">\r\n      <label>\r\n        <input type=\"checkbox\" ng-model=\"booking.notify\">\r\n        Email customer?\r\n      </label>\r\n    </div>\r\n  </div>\r\n  <div class=\"modal-footer\">\r\n    <input type=\"submit\" class=\"btn btn-primary\" value=\"Cancel Booking\">\r\n    <button class=\"btn btn-default\" ng-click=\"close($event)\">Close</button>\r\n  </div>\r\n</form>\r\n");
$templateCache.put("member_bookings_tabs.html","<div class=\"bb-member-bookings\">\r\n   <div tabset class=\"bb-tabs\">\r\n    <div tab>\r\n      <div tab-heading>\r\n        Upcoming Bookings\r\n      </div>\r\n      <div id=\"member\">\r\n        <div bb-member-upcoming-bookings member=\"member\"></div>\r\n      </div>\r\n    </div>\r\n    <div tab>\r\n      <div tab-heading>\r\n        Past bookings\r\n      </div>\r\n      <div id=\"member\">\r\n        <div bb-member-past-bookings member=\"member\"></div>\r\n      </div>\r\n    </div>\r\n    <div tab>\r\n      <div tab-heading>\r\n        Purchases\r\n      </div>\r\n      <div id=\"member\">\r\n        <div bb-member-purchases member=\"member\"></div>\r\n      </div>\r\n    </div>\r\n  </div>\r\n</div>\r\n");
$templateCache.put("member_booking_delete_modal.html","<div class=\"modal-header\">\r\n  <h1 class=\"modal-title\">Cancel Booking</h1>\r\n</div>\r\n\r\n<div class=\"modal-body\">\r\n\r\n  <ul class=\"confirmation-summary\">\r\n    <li class=\"row confirmation-summary-item\">\r\n      <div class=\"col-xs-3\">Booking</div>\r\n      <div class=\"col-xs-9\">{{booking.full_describe}}</div>\r\n    </li>\r\n    <li class=\"row confirmation-summary-item\">\r\n      <div class=\"col-xs-3\">When</div>\r\n      <div class=\"col-xs-9\">{{booking.datetime | datetime: \"h:mma dddd Do MMMM\"}}</div>\r\n    </li>\r\n  </ul>\r\n\r\n</div>\r\n<div class=\"modal-footer\">\r\n  <button class=\"btn btn-primary\" ng-click=\"confirm_delete()\"><span>Cancel Booking</span></button>\r\n  <button class=\"btn btn-link\" ng-click=\"cancel()\">Do not cancel</button>\r\n</div>\r\n");
$templateCache.put("member_past_bookings.html","<div ng-show=\"loading\"><img src=\'/BB_wait.gif\' class=\"loader\"></div>\r\n<div ng-hide=\"loading\" class=\"bb-past clearfix\">\r\n  <div>\r\n\r\n    <div ng-show=\"past_bookings.length == 0\">\r\n      <h3>You don\'t currently have any past bookings.</h3>\r\n    </div>\r\n\r\n    <div ng-repeat=\"booking in past_bookings | filter:{deleted: false} |\r\n      orderBy: \'datetime.unix()\' | startFrom: (pagination.current_page - 1) * pagination.page_size | limitTo: pagination.page_size\">\r\n      <div class=\"datetime col-sm-5\">\r\n        <div>{{booking.datetime | datetime:\'Do MMM YYYY HH:mm\'}}</div>\r\n      </div>\r\n      <div class=\"describe col-sm-5\">\r\n        <div class=\"detail\">{{booking.full_describe}}</div>\r\n      </div>\r\n    </div>\r\n\r\n    <pagination total-items=\"pagination.num_items\"\r\n      ng-model=\"pagination.current_page\" items-per-page=\"pagination.page_size\"\r\n      max-size=\"pagination.max_size\" boundary-links=\"true\" rotate=\"false\"\r\n      num-pages=\"pagination.num_pages\" ng-show=\"past_bookings && past_bookings.length > 10\"></pagination>\r\n\r\n  </div>\r\n</div>\r\n");
$templateCache.put("member_pre_paid_bookings.html","<div ng-show=\"loading\"><img src=\'/BB_wait.gif\' class=\"loader\"></div>\r\n<div ng-hide=\"loading\" class=\"bb-upcoming clearfix\">\r\n  <div class=\"bookings\">\r\n    <div ng-show=\"pre_paid_bookings.length == 0\">\r\n      <h3>You don\'t currently have any pre-paid bookings.</h3>\r\n    </div>\r\n    <ul class=\"bb-list bb-banded-list\">\r\n      <li ng-repeat=\"booking in pre_paid_bookings | startFrom: (pagination.current_page - 1) * pagination.page_size | limitTo: pagination.page_size\" class=\"bb-list-item\">\r\n        <div class=\"row\">\r\n          <div class=\"col-xs-4\"><strong>{{booking.name}}</strong></div>\r\n          <div class=\"col-xs-8\">{{booking.number_of_bookings_remaining}} of {{booking.number_of_bookings}} remaining | Book By {{booking.book_by | datetime}} | Use from {{booking.use_from | datetime}} | Use by {{booking.use_by | datetime}}</div>\r\n        </div>\r\n      </li>\r\n    </ul>\r\n\r\n    <pagination total-items=\"pagination.num_items\"\r\n      ng-model=\"pagination.current_page\" items-per-page=\"pagination.page_size\"\r\n      max-size=\"pagination.max_size\" boundary-links=\"true\" rotate=\"false\"\r\n      num-pages=\"pagination.num_pages\" ng-show=\"pre_paid_bookings && pre_paid_bookings.length > 10\"></pagination>\r\n\r\n  </div>\r\n</div>\r\n");
$templateCache.put("member_purchases.html","<div>\r\n  <div class=\"bb-head\">\r\n    <span id=\"your_bookings\">Your Purchases</span>\r\n  </div>\r\n  <div id=\"bookings\">\r\n    <div ng-if=\"purchases.length == 0\">\r\n      <h3>You don\'t currently have any purchases.</h3>\r\n    </div>\r\n\r\n    <div class=\"row headers  hidden-xs\">\r\n\r\n      <div class=\"col-sm-2\">\r\n        Purchase Ref\r\n      </div>\r\n\r\n      <div class=\"col-sm-8\">\r\n        Date\r\n      </div>\r\n\r\n    </div>\r\n\r\n    \r\n    <div ng-repeat=\"purchase in purchases | startFrom: (pagination.current_page - 1) * pagination.page_size | limitTo: pagination.page_size\">\r\n      <div>\r\n        {{purchase.id}}\r\n      </div>\r\n      <div>\r\n        {{purchase.created_at | datetime}}\r\n      </div>\r\n      <div bb-member-purchase-items purchase=\"purchase\">\r\n        <div ng-repeat=\"item in items\">\r\n          {{item.full_describe}}\r\n        </div>\r\n      </div>\r\n    </div>\r\n\r\n    <pagination total-items=\"pagination.num_items\"\r\n      ng-model=\"pagination.current_page\" items-per-page=\"pagination.page_size\"\r\n      max-size=\"pagination.max_size\" boundary-links=\"true\" rotate=\"false\"\r\n      num-pages=\"pagination.num_pages\" ng-show=\"purchases && purchases.length > 10\"></pagination>\r\n    \r\n  </div>\r\n</div>");
$templateCache.put("member_upcoming_bookings.html","<div ng-show=\"loading\"><img src=\'/BB_wait.gif\' class=\"loader\"></div>\r\n<div ng-hide=\"loading\" class=\"bb-upcoming clearfix\">\r\n  <div id=\"bookings\">\r\n    <div ng-show=\"upcoming_bookings.length == 0\">\r\n      <h3>You don\'t currently have any upcoming bookings.</h3>\r\n    </div>\r\n    <div ng-repeat=\"booking in upcoming_bookings | filter:{deleted: false} | orderBy: \'datetime.unix()\' | startFrom: (pagination.current_page - 1) * pagination.page_size | limitTo: pagination.page_size\" class=\"booking-row\">\r\n      <div class=\"datetime\">\r\n        <div>{{booking.datetime | datetime: \'Do MMM YYYY h.mma\'}}</div>\r\n      </div>\r\n      <div class=\"describe\">\r\n        <div class=\"detail\">{{booking.full_describe}}</div>\r\n      </div>\r\n      <div class=\"bb-bookings-action\">\r\n        <button ng-click=\"cancel(booking)\" class=\"btn btn-danger bb-push\">Cancel</button>\r\n        <button ng-click=\"edit(booking)\" class=\"btn bb-push\">Details</button>\r\n      </div>\r\n    </div>\r\n\r\n    <pagination total-items=\"pagination.num_items\"\r\n      ng-model=\"pagination.current_page\" items-per-page=\"pagination.page_size\"\r\n      max-size=\"pagination.max_size\" boundary-links=\"true\" rotate=\"false\"\r\n      num-pages=\"pagination.num_pages\" ng-show=\"upcoming_bookings && upcoming_bookings.length > 10\"></pagination>\r\n\r\n\r\n  </div>\r\n</div>\r\n");
$templateCache.put("pick_company.html","<form name=\"pick_company_form\" ng-submit=\"selectedCompany()\" role=\"form\">\r\n  <p>Pick Company</p>\r\n  <div ng-repeat=\"admin in administrators\" class=\"radio\">\r\n    <label>\r\n      <input id=\"company{{admin.company_id}}\" type=\"radio\"\r\n        ng-model=\"$parent.selected_admin\" ng-value=\"admin\" required\r\n        name=\"company\">\r\n      {{admin.company_name}}\r\n    </label>\r\n  </div>\r\n  <input type=\"submit\" class=\"btn btn-default\">\r\n</form>\r\n");
$templateCache.put("pick_company_modal_form.html","<div class=\"modal-header\">\r\n  <h3 class=\"modal-title\">{{title}}</h3>\r\n</div>\r\n<form name=\"pick_company_form\" ng-submit=\"submit(pick_company_form)\">\r\n  <div class=\"modal-body\" sf-schema=\"schema\" sf-form=\"form\"\r\n    sf-model=\"pick_company_form\">\r\n  </div>\r\n  <div class=\"modal-footer\">\r\n    <input type=\"submit\" class=\"btn btn-primary\" value=\"OK\">\r\n    <button class=\"btn btn-default\" ng-click=\"cancel($event)\">Dismiss</button>\r\n  </div>\r\n</form>\r\n");
$templateCache.put("wallet.html","<div>\r\n\r\n  <div class=\"wallet-balance\">\r\n    <div ng-show=\"wallet.amount == 0\">\r\n      <span>Balance: </span><span>You dont have any credit in your wallet.</span>\r\n    </div>\r\n    <div ng-show=\"wallet.amount > 0\">\r\n      <span>Balance: </span> <span id=\"balance\"> {{wallet.amount | currency}} </span>\r\n    </div>\r\n  </div>\r\n\r\n  <div class=\"wallet-status\">\r\n    <div ng-hide=\"wallet.active\">\r\n      <span>Status:</span><span><b> Your wallet is not active.</b></span> <span><button ng-click=\"activateWallet(member)\"> Activate </button></span>\r\n    </div>\r\n    <div ng-show=\"wallet.active\">\r\n      <span>Status:</span><span id=\"status\"><b> Active </b></span>\r\n    </div>\r\n  </div>\r\n\r\n\r\n  <div>\r\n    <button type=\"button\" class=\"btn btn-primary\" ng-click=\"(show_topup_box = true);(show_wallet_logs = false);\">Top Up</button>\r\n  </div>\r\n\r\n  <br>\r\n\r\n  <div ng-show=\"wallet.$has(\'logs\')\">\r\n     <div ng-show=\"show_wallet_logs\">\r\n      <div bb-wallet-logs></div>\r\n    </div>\r\n  </div>\r\n\r\n  <div ng-if=\"show_topup_box && !show_wallet_logs\" bb-wallet-payment>\r\n\r\n    <div class=\"bb-content\">\r\n\r\n      <div ng-form class=\"form-inline\">\r\n        <div class=\"form-group\">\r\n          <label for=\"amount\">Amount:</label>\r\n          <div class=\"input-group\">\r\n            <input type=\"number\" class=\"form-control input-sm\" id=\"amount\" name=\"amount\" ng-model=\"amount\" placeholder=\"Enter Top Up Amount\" bb-currency-field>\r\n            <span class=\"input-group-btn\">\r\n              <button type=\"submit\" class=\"btn btn-primary btn-sm\" ng-disabled=\"!amount || (amount < wallet.min_amount)\" ng-click=\"updateWallet(member, amount)\">Top Up Wallet</button>\r\n            </span>\r\n          </div>\r\n          <br>\r\n          <small> Minimum top up amount must be greater than {{wallet.min_amount | icurrency }} </small>\r\n        </div>\r\n      </div>\r\n\r\n      <div bb-wallet-purchase-bands></div>\r\n\r\n      <div ng-show=\"show_payment_iframe\" class=\"bb-payment\">\r\n        <div class=\"bb-head\">\r\n          <h3>Make Payment</h3>\r\n          <p>Topup wallet by {{amount | currency}}</p>\r\n        </div>\r\n\r\n        <iframe id=\"bb-payment\" ng-src=\"{{wallet_payment_url}}\" width=\"100%\" scrolling=\"no\" frameborder=\"0\"></iframe>\r\n        <script type=\"text/javascript\">\r\n          iFrameResize({log:false, checkOrigin:false, enablePublicMethods:true}, \'#bb-payment\');\r\n        </script>\r\n\r\n      </div>\r\n\r\n    </div>\r\n  </div>\r\n\r\n</div>");
$templateCache.put("wallet_logs.html","<div>\r\n  <h4>Wallet Transaction History</h4>\r\n  <table class=\"table table-bordered\">\r\n    <thead>\r\n      <tr>\r\n        <th>Action</th>\r\n        <th>Amount</th>\r\n        <th>Balance</th>\r\n        <th>Changed By</th>\r\n        <th>Date and Time</th>\r\n      </tr>\r\n    </thead>\r\n    <tbody>\r\n      <tr ng-repeat=\"log in logs | startFrom: (pagination.current_page - 1) * pagination.page_size | limitTo: pagination.page_size\" ng-class=\"{\'last-item\': $last}\">\r\n        <td>\r\n          {{log.action}}\r\n        </td>\r\n        <td class=\"text-right\">\r\n          {{log.payment_amount | currency}}\r\n        </td>\r\n        <td class=\"text-right\">\r\n          {{log.new_wallet_amount | currency}}\r\n        </td>\r\n        <td class=\"text-center\">\r\n          {{log.who_made_the_change}}\r\n        </td>\r\n        <td class=\"text-center\">\r\n          {{log.created_at | datetime: \"DD/MM/YYYY HH:mm\"}}\r\n        </td>\r\n      </tr>\r\n    </tbody>\r\n  </table>\r\n\r\n  <pagination total-items=\"pagination.num_items\"\r\n    ng-model=\"pagination.current_page\" items-per-page=\"pagination.page_size\"\r\n    max-size=\"pagination.max_size\" boundary-links=\"true\" rotate=\"false\"\r\n    num-pages=\"pagination.num_pages\" ng-show=\"logs && logs.length > 10\"></pagination>\r\n  \r\n</div>\r\n");
$templateCache.put("wallet_purchase_bands.html","<div>\r\n  <h4>Wallet Purchase Bands</h4>\r\n  <table class=\"table table-bordered\">\r\n    <thead>\r\n    </thead>\r\n    <tbody>\r\n      <tr ng-repeat=\"band in bands\">\r\n        <td class=\"text-left\">\r\n          {{band.wallet_amount | icurrency}} for {{band.actual_amount | icurrency}}\r\n        </td>\r\n        <td class=\"text-center\">\r\n          <button ng-click=\"purchaseBand(band)\">Buy</button>\r\n        </td>\r\n      </tr>\r\n    </tbody>\r\n  </table>\r\n</div>");}]);