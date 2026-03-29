import Nat "mo:core/Nat";
import Nat32 "mo:core/Nat32";
import List "mo:core/List";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Float "mo:core/Float";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();

  type PaymentMode = {
    #cash;
    #bank;
    #balancePayment;
    #upi;
    #cheque;
  };

  type IncomeEntry = {
    bytes : Nat32;
    owner : Principal;
    description : Text;
    fromDestination : Text;
    toDestination : Text;
    assignee : Text;
    driver : Text;
    vehicle : Text;
    amount : Float;
    date : Time.Time;
    paymentMode : PaymentMode;
    paymentDescription : Text;
  };

  // ── Legacy type kept for stable-variable migration ──────────────────────────
  // The live canister stores ExpenseEntry with this 7-tag variant.  We must
  // keep the same name/type so Motoko can deserialise the existing data.
  type OldExpenseCategory = {
    #salary;
    #cngGas;
    #petrol;
    #diesel;
    #commissionVendor;
    #tollCharges;
    #parkingCharges;
  };

  type OldExpenseEntry = {
    id : Nat32;
    owner : Principal;
    category : OldExpenseCategory;
    description : Text;
    amount : Float;
    date : Time.Time;
    paymentMode : PaymentMode;
    paymentDescription : Text;
  };
  // ────────────────────────────────────────────────────────────────────────────

  // Current (expanded) expense category type
  type ExpenseCategory = {
    #salary;
    #cngGas;
    #petrol;
    #diesel;
    #commissionVendor;
    #tollCharges;
    #parkingCharges;
    #fraud;
    #maintenanceAndRepair;
    #otherExpenses;
    #purchase;
  };

  type ExpenseEntry = {
    id : Nat32;
    owner : Principal;
    category : ExpenseCategory;
    description : Text;
    amount : Float;
    date : Time.Time;
    paymentMode : PaymentMode;
    paymentDescription : Text;
  };

  public type BillEntry = {
    id : Nat32;
    owner : Principal;
    partyName : Text;
    gstNumber : ?Text;
    vehicle : Text;
    totalAmount : Float;
    paymentMode : PaymentMode;
    distanceKm : Float;
    ratePerKm : Float;
    calculatedTotal : Float;
    createdDate : Time.Time;
    signature : ?Text;
  };

  public type PdfReport = {
    id : Nat32;
    owner : Principal;
    blob : Storage.ExternalBlob;
    title : Text;
    period : ReportPeriod;
    createdDate : Time.Time;
    startDate : ?Time.Time;
    endDate : ?Time.Time;
  };

  public type ReportPeriod = {
    #daily : { day : Nat; month : Nat; year : Nat };
    #weekly : { week : Nat; year : Nat };
    #monthly : { month : Nat; year : Nat };
    #yearly : Nat;
    #customRange : { startDate : Time.Time; endDate : Time.Time };
    #financialYear : Nat;
  };

  public type UserProfile = {
    name : Text;
  };

  let incomeEntries = Map.empty<Nat32, IncomeEntry>();

  // ── Stable storage: OLD map (same name as before, old type) ─────────────────
  // Motoko will deserialise existing canister state into this successfully
  // because the type matches what was previously stored.
  let expenseEntries = Map.empty<Nat32, OldExpenseEntry>();

  // New map with the expanded ExpenseCategory type.
  // Named differently so Motoko treats it as a fresh stable variable.
  let expenseEntriesV2 = Map.empty<Nat32, ExpenseEntry>();

  // One-time migration flag (stable so it survives upgrades)
  stable var expenseMigrated : Bool = false;
  // ────────────────────────────────────────────────────────────────────────────

  let billEntries = Map.empty<Nat32, BillEntry>();
  let pdfReports = Map.empty<Nat32, PdfReport>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  var nextIncomeId = 1 : Nat32;
  var nextExpenseId = 1 : Nat32;
  var nextBillId = 1 : Nat32;
  var nextReportId = 1 : Nat32;

  // ── One-time migration: copy OldExpenseEntry → ExpenseEntry ─────────────────
  // OldExpenseCategory <: ExpenseCategory (fewer tags), so the coercion is safe.
  system func postupgrade() {
    if (not expenseMigrated) {
      expenseMigrated := true;
      for ((k, v) in expenseEntries.entries()) {
        let newCat : ExpenseCategory = v.category;
        let newEntry : ExpenseEntry = {
          id = v.id;
          owner = v.owner;
          category = newCat;
          description = v.description;
          amount = v.amount;
          date = v.date;
          paymentMode = v.paymentMode;
          paymentDescription = v.paymentDescription;
        };
        expenseEntriesV2.add(k, newEntry);
      };
    };
  };
  // ────────────────────────────────────────────────────────────────────────────

  public type DashboardQueryResult = {
    #dashboardQueryResult : {
      incomeTotals : {
        totalCash : Float;
        totalBank : Float;
        totalBalancePayment : Float;
        totalUpi : Float;
        totalCheque : Float;
        totalIncome : Float;
      };
      expenseTotals : {
        totalCash : Float;
        totalBank : Float;
        totalBalancePayment : Float;
        totalUpi : Float;
        totalCheque : Float;
        totalExpenses : Float;
      };
      dateRange : {
        startDate : Time.Time;
        endDate : Time.Time;
      };
    };
    #dashboardError : { message : Text };
  };

  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    // Return null for unauthenticated or unregistered callers rather than trapping
    if (caller.isAnonymous()) { return null };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    AccessControl.initialize(accessControlState, caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  func canAccessEntry(caller : Principal, owner : Principal) : Bool {
    caller == owner or AccessControl.isAdmin(accessControlState, caller)
  };

  public shared ({ caller }) func addIncomeEntry(
    description : Text,
    fromDestination : Text,
    toDestination : Text,
    assignee : Text,
    driver : Text,
    vehicle : Text,
    amount : Float,
    date : Time.Time,
    paymentMode : PaymentMode,
    paymentDescription : Text,
  ) : async Nat32 {
    AccessControl.initialize(accessControlState, caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add income entries");
    };

    let incomeEntry : IncomeEntry = {
      bytes = nextIncomeId;
      owner = caller;
      description;
      fromDestination;
      toDestination;
      assignee;
      driver;
      vehicle;
      amount;
      date;
      paymentMode;
      paymentDescription;
    };

    incomeEntries.add(nextIncomeId, incomeEntry);
    nextIncomeId += 1;
    incomeEntry.bytes;
  };

  public query ({ caller }) func getIncomeEntries() : async [IncomeEntry] {
    if (caller.isAnonymous()) { return [] };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let filtered = List.empty<IncomeEntry>();

    for ((_, entry) in incomeEntries.entries()) {
      if (isAdmin or entry.owner == caller) {
        filtered.add(entry);
      };
    };

    filtered.toArray();
  };

  public shared ({ caller }) func updateIncomeEntry(
    id : Nat32,
    description : Text,
    fromDestination : Text,
    toDestination : Text,
    assignee : Text,
    driver : Text,
    vehicle : Text,
    amount : Float,
    date : Time.Time,
    paymentMode : PaymentMode,
    paymentDescription : Text,
  ) : async () {
    AccessControl.initialize(accessControlState, caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update income entries");
    };

    switch (incomeEntries.get(id)) {
      case (null) { Runtime.trap("Income entry not found") };
      case (?existing) {
        if (not canAccessEntry(caller, existing.owner)) {
          Runtime.trap("Unauthorized: Can only update your own income entries");
        };

        let updatedEntry : IncomeEntry = {
          bytes = id;
          owner = existing.owner;
          description;
          fromDestination;
          toDestination;
          assignee;
          driver;
          vehicle;
          amount;
          date;
          paymentMode;
          paymentDescription;
        };
        incomeEntries.add(id, updatedEntry);
      };
    };
  };

  public shared ({ caller }) func deleteIncomeEntry(id : Nat32) : async () {
    AccessControl.initialize(accessControlState, caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete income entries");
    };

    switch (incomeEntries.get(id)) {
      case (null) { Runtime.trap("Income entry not found") };
      case (?existing) {
        if (not canAccessEntry(caller, existing.owner)) {
          Runtime.trap("Unauthorized: Can only delete your own income entries");
        };
        incomeEntries.remove(id);
      };
    };
  };

  // ── All expense CRUD functions now use expenseEntriesV2 ──────────────────────

  public shared ({ caller }) func addExpenseEntry(
    category : ExpenseCategory,
    description : Text,
    amount : Float,
    date : Time.Time,
    paymentMode : PaymentMode,
    paymentDescription : Text,
  ) : async Nat32 {
    AccessControl.initialize(accessControlState, caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add expense entries");
    };

    let expenseEntry : ExpenseEntry = {
      id = nextExpenseId;
      owner = caller;
      category;
      description;
      amount;
      date;
      paymentMode;
      paymentDescription;
    };

    expenseEntriesV2.add(nextExpenseId, expenseEntry);
    nextExpenseId += 1;
    expenseEntry.id;
  };

  public query ({ caller }) func getExpenseEntries() : async [ExpenseEntry] {
    if (caller.isAnonymous()) { return [] };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let filtered = List.empty<ExpenseEntry>();

    for ((_, entry) in expenseEntriesV2.entries()) {
      if (isAdmin or entry.owner == caller) {
        filtered.add(entry);
      };
    };

    filtered.toArray();
  };

  public shared ({ caller }) func updateExpenseEntry(
    id : Nat32,
    category : ExpenseCategory,
    description : Text,
    amount : Float,
    date : Time.Time,
    paymentMode : PaymentMode,
    paymentDescription : Text,
  ) : async () {
    AccessControl.initialize(accessControlState, caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update expense entries");
    };

    switch (expenseEntriesV2.get(id)) {
      case (null) { Runtime.trap("Expense entry not found") };
      case (?existing) {
        if (not canAccessEntry(caller, existing.owner)) {
          Runtime.trap("Unauthorized: Can only update your own expense entries");
        };

        let updatedEntry : ExpenseEntry = {
          id;
          owner = existing.owner;
          category;
          description;
          amount;
          date;
          paymentMode;
          paymentDescription;
        };
        expenseEntriesV2.add(id, updatedEntry);
      };
    };
  };

  public shared ({ caller }) func deleteExpenseEntry(id : Nat32) : async () {
    AccessControl.initialize(accessControlState, caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete expense entries");
    };

    switch (expenseEntriesV2.get(id)) {
      case (null) { Runtime.trap("Expense entry not found") };
      case (?existing) {
        if (not canAccessEntry(caller, existing.owner)) {
          Runtime.trap("Unauthorized: Can only delete your own expense entries");
        };
        expenseEntriesV2.remove(id);
      };
    };
  };

  public query ({ caller }) func getExpensesByCategory(category : ExpenseCategory) : async [ExpenseEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view expense entries");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let filtered = List.empty<ExpenseEntry>();

    for ((_, entry) in expenseEntriesV2.entries()) {
      if (entry.category == category and (isAdmin or entry.owner == caller)) {
        filtered.add(entry);
      };
    };

    filtered.toArray();
  };

  public shared ({ caller }) func addBillEntry(
    partyName : Text,
    gstNumber : ?Text,
    vehicle : Text,
    totalAmount : Float,
    paymentMode : PaymentMode,
    distanceKm : Float,
    ratePerKm : Float,
    signature : ?Text,
  ) : async Nat32 {
    AccessControl.initialize(accessControlState, caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create bills");
    };

    let calculatedTotal = distanceKm * ratePerKm;

    let billEntry : BillEntry = {
      id = nextBillId;
      owner = caller;
      partyName;
      gstNumber;
      vehicle;
      totalAmount;
      paymentMode;
      distanceKm;
      ratePerKm;
      calculatedTotal;
      createdDate = Time.now();
      signature;
    };

    billEntries.add(nextBillId, billEntry);
    nextBillId += 1;
    billEntry.id;
  };

  public query ({ caller }) func getBillEntries() : async [BillEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view bills");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let filtered = List.empty<BillEntry>();

    for ((_, entry) in billEntries.entries()) {
      if (isAdmin or entry.owner == caller) {
        filtered.add(entry);
      };
    };

    filtered.toArray();
  };

  public shared ({ caller }) func updateBillEntry(
    id : Nat32,
    partyName : Text,
    gstNumber : ?Text,
    vehicle : Text,
    totalAmount : Float,
    paymentMode : PaymentMode,
    distanceKm : Float,
    ratePerKm : Float,
    signature : ?Text,
  ) : async () {
    AccessControl.initialize(accessControlState, caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update bills");
    };

    switch (billEntries.get(id)) {
      case (null) { Runtime.trap("Bill not found") };
      case (?existing) {
        if (not canAccessEntry(caller, existing.owner)) {
          Runtime.trap("Unauthorized: Can only update your own bills");
        };

        let calculatedTotal = distanceKm * ratePerKm;

        let updatedEntry : BillEntry = {
          id;
          owner = existing.owner;
          partyName;
          gstNumber;
          vehicle;
          totalAmount;
          paymentMode;
          distanceKm;
          ratePerKm;
          calculatedTotal;
          createdDate = existing.createdDate;
          signature;
        };
        billEntries.add(id, updatedEntry);
      };
    };
  };

  public shared ({ caller }) func deleteBillEntry(id : Nat32) : async () {
    AccessControl.initialize(accessControlState, caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete bills");
    };

    switch (billEntries.get(id)) {
      case (null) { Runtime.trap("Bill not found") };
      case (?existing) {
        if (not canAccessEntry(caller, existing.owner)) {
          Runtime.trap("Unauthorized: Can only delete your own bills");
        };
        billEntries.remove(id);
      };
    };
  };

  public query ({ caller }) func getBillById(id : Nat32) : async ?BillEntry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view bills");
    };

    switch (billEntries.get(id)) {
      case (null) { null };
      case (?bill) {
        if (canAccessEntry(caller, bill.owner)) {
          ?bill
        } else {
          Runtime.trap("Unauthorized: Can only view your own bills");
        };
      };
    };
  };

  public query ({ caller }) func getIncomeForPeriod(startDate : Time.Time, endDate : Time.Time) : async [IncomeEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view income entries");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let filtered = List.empty<IncomeEntry>();

    for ((_, entry) in incomeEntries.entries()) {
      if (entry.date >= startDate and entry.date <= endDate and (isAdmin or entry.owner == caller)) {
        filtered.add(entry);
      };
    };

    filtered.toArray();
  };

  public query ({ caller }) func getExpensesForPeriod(startDate : Time.Time, endDate : Time.Time) : async [ExpenseEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view expense entries");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let filtered = List.empty<ExpenseEntry>();

    for ((_, entry) in expenseEntriesV2.entries()) {
      if (entry.date >= startDate and entry.date <= endDate and (isAdmin or entry.owner == caller)) {
        filtered.add(entry);
      };
    };

    filtered.toArray();
  };

  public query ({ caller }) func getIncomeByPaymentMode(paymentMode : PaymentMode) : async [IncomeEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view income entries");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let filtered = List.empty<IncomeEntry>();

    for ((_, entry) in incomeEntries.entries()) {
      if (entry.paymentMode == paymentMode and (isAdmin or entry.owner == caller)) {
        filtered.add(entry);
      };
    };

    filtered.toArray();
  };

  public query ({ caller }) func getExpensesByPaymentMode(paymentMode : PaymentMode) : async [ExpenseEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view expense entries");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let filtered = List.empty<ExpenseEntry>();

    for ((_, entry) in expenseEntriesV2.entries()) {
      if (entry.paymentMode == paymentMode and (isAdmin or entry.owner == caller)) {
        filtered.add(entry);
      };
    };

    filtered.toArray();
  };

  public query ({ caller }) func getIncomePaymentModeTotals() : async {
    totalCash : Float;
    totalBank : Float;
    totalBalancePayment : Float;
    totalUpi : Float;
    totalCheque : Float;
    totalIncome : Float;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view income entries");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    var totalCash : Float = 0;
    var totalBank : Float = 0;
    var totalBalancePayment : Float = 0;
    var totalUpi : Float = 0;
    var totalCheque : Float = 0;
    var totalIncome : Float = 0;

    for ((_, entry) in incomeEntries.entries()) {
      if (isAdmin or entry.owner == caller) {
        totalIncome += entry.amount;
        switch (entry.paymentMode) {
          case (#cash) { totalCash += entry.amount };
          case (#bank) { totalBank += entry.amount };
          case (#balancePayment) { totalBalancePayment += entry.amount };
          case (#upi) { totalUpi += entry.amount };
          case (#cheque) { totalCheque += entry.amount };
        };
      };
    };

    {
      totalCash;
      totalBank;
      totalBalancePayment;
      totalUpi;
      totalCheque;
      totalIncome;
    };
  };

  public query ({ caller }) func getExpensePaymentModeTotals() : async {
    totalCash : Float;
    totalBank : Float;
    totalBalancePayment : Float;
    totalUpi : Float;
    totalCheque : Float;
    totalExpenses : Float;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view expense entries");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    var totalCash : Float = 0;
    var totalBank : Float = 0;
    var totalBalancePayment : Float = 0;
    var totalUpi : Float = 0;
    var totalCheque : Float = 0;
    var totalExpenses : Float = 0;

    for ((_, entry) in expenseEntriesV2.entries()) {
      if (isAdmin or entry.owner == caller) {
        totalExpenses += entry.amount;
        switch (entry.paymentMode) {
          case (#cash) { totalCash += entry.amount };
          case (#bank) { totalBank += entry.amount };
          case (#balancePayment) { totalBalancePayment += entry.amount };
          case (#upi) { totalUpi += entry.amount };
          case (#cheque) { totalCheque += entry.amount };
        };
      };
    };

    {
      totalCash;
      totalBank;
      totalBalancePayment;
      totalUpi;
      totalCheque;
      totalExpenses;
    };
  };

  public query ({ caller }) func getIncomeForCustomPeriod(startDate : Time.Time, endDate : Time.Time) : async [IncomeEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view income entries");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let filtered = List.empty<IncomeEntry>();

    for ((_, entry) in incomeEntries.entries()) {
      if (entry.date >= startDate and entry.date <= endDate and (isAdmin or entry.owner == caller)) {
        filtered.add(entry);
      };
    };

    filtered.toArray();
  };

  public query ({ caller }) func getExpensesForCustomPeriod(startDate : Time.Time, endDate : Time.Time) : async [ExpenseEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view expense entries");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let filtered = List.empty<ExpenseEntry>();

    for ((_, entry) in expenseEntriesV2.entries()) {
      if (entry.date >= startDate and entry.date <= endDate and (isAdmin or entry.owner == caller)) {
        filtered.add(entry);
      };
    };

    filtered.toArray();
  };

  public query ({ caller }) func getIncomeForFinancialYear(year : Nat) : async [IncomeEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view income entries");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let startDate = calcFinancialYearStart(year);
    let endDate = calcFinancialYearEnd(year);
    let filtered = List.empty<IncomeEntry>();

    for ((_, entry) in incomeEntries.entries()) {
      if (entry.date >= startDate and entry.date <= endDate and (isAdmin or entry.owner == caller)) {
        filtered.add(entry);
      };
    };

    filtered.toArray();
  };

  public query ({ caller }) func getExpensesForFinancialYear(year : Nat) : async [ExpenseEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view expense entries");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let startDate = calcFinancialYearStart(year);
    let endDate = calcFinancialYearEnd(year);
    let filtered = List.empty<ExpenseEntry>();

    for ((_, entry) in expenseEntriesV2.entries()) {
      if (entry.date >= startDate and entry.date <= endDate and (isAdmin or entry.owner == caller)) {
        filtered.add(entry);
      };
    };

    filtered.toArray();
  };

  func calcFinancialYearStart(year : Nat) : Time.Time {
    year * 10000_000_000 + 400_000_000
  };

  func calcFinancialYearEnd(year : Nat) : Time.Time {
    (year + 1) * 10000_000_000 + 400_000_000 - 1
  };

  public shared ({ caller }) func savePdfReport(
    title : Text,
    period : ReportPeriod,
    blob : Storage.ExternalBlob,
    startDate : ?Time.Time,
    endDate : ?Time.Time,
  ) : async Nat32 {
    AccessControl.initialize(accessControlState, caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save PDF reports");
    };

    let pdfReport : PdfReport = {
      id = nextReportId;
      owner = caller;
      blob;
      title;
      period;
      createdDate = Time.now();
      startDate;
      endDate;
    };

    pdfReports.add(nextReportId, pdfReport);
    nextReportId += 1;
    pdfReport.id;
  };

  public query ({ caller }) func getPdfReport(id : Nat32) : async ?PdfReport {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view PDF reports");
    };

    switch (pdfReports.get(id)) {
      case (null) { null };
      case (?report) {
        if (canAccessEntry(caller, report.owner)) {
          ?report
        } else {
          Runtime.trap("Unauthorized: Can only view your own reports");
        };
      };
    };
  };

  public query ({ caller }) func getAllPdfReports() : async [PdfReport] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view PDF reports");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let filtered = List.empty<PdfReport>();

    for ((_, report) in pdfReports.entries()) {
      if (isAdmin or report.owner == caller) {
        filtered.add(report);
      };
    };

    filtered.toArray();
  };

  public query ({ caller }) func getReportsByPeriod(period : ReportPeriod) : async [PdfReport] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view PDF reports");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let filtered = List.empty<PdfReport>();

    for ((_, report) in pdfReports.entries()) {
      if (compareReportPeriod(report.period, period) and (isAdmin or report.owner == caller)) {
        filtered.add(report);
      };
    };

    filtered.toArray();
  };

  func compareReportPeriod(a : ReportPeriod, b : ReportPeriod) : Bool {
    switch (a, b) {
      case (#daily { day = d1; month = m1; year = y1 }, #daily { day = d2; month = m2; year = y2 }) {
        d1 == d2 and m1 == m2 and y1 == y2
      };
      case (#weekly { week = w1; year = y1 }, #weekly { week = w2; year = y2 }) {
        w1 == w2 and y1 == y2;
      };
      case (#monthly { month = m1; year = y1 }, #monthly { month = m2; year = y2 }) {
        m1 == m2 and y1 == y2;
      };
      case (#yearly y1, #yearly y2) { y1 == y2 };
      case (_) { false };
    };
  };

  public query ({ caller }) func getMonthlyReportsForYear(year : Nat) : async [PdfReport] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view PDF reports");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let filtered = List.empty<PdfReport>();

    for ((_, report) in pdfReports.entries()) {
      switch (report.period) {
        case (#monthly { month = _; year = y }) {
          if (y == year and (isAdmin or report.owner == caller)) {
            filtered.add(report);
          };
        };
        case (_) {};
      };
    };

    filtered.toArray();
  };

  public query ({ caller }) func getPdfReportsForPeriod(period : ReportPeriod) : async [PdfReport] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view PDF reports");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let filtered = List.empty<PdfReport>();

    for ((_, report) in pdfReports.entries()) {
      if (compareReportPeriod(report.period, period) and (isAdmin or report.owner == caller)) {
        filtered.add(report);
      };
    };

    filtered.toArray();
  };

  public query ({ caller }) func getPdfReportsForCustomPeriod(startDate : Time.Time, endDate : Time.Time) : async [PdfReport] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view PDF reports");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let filtered = List.empty<PdfReport>();

    for ((_, report) in pdfReports.entries()) {
      switch (report.period) {
        case (#customRange { startDate = s; endDate = e }) {
          if (s == startDate and e == endDate and (isAdmin or report.owner == caller)) {
            filtered.add(report);
          };
        };
        case (_) {};
      };
    };

    filtered.toArray();
  };

  public query ({ caller }) func getPdfReportsForFinancialYear(year : Nat) : async [PdfReport] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view PDF reports");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let filtered = List.empty<PdfReport>();

    for ((_, report) in pdfReports.entries()) {
      switch (report.period) {
        case (#financialYear y) {
          if (y == year and (isAdmin or report.owner == caller)) {
            filtered.add(report);
          };
        };
        case (_) {};
      };
    };

    filtered.toArray();
  };

  public shared ({ caller }) func deletePdfReport(id : Nat32) : async () {
    AccessControl.initialize(accessControlState, caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete PDF reports");
    };

    switch (pdfReports.get(id)) {
      case (null) { Runtime.trap("PDF report not found") };
      case (?existing) {
        if (not canAccessEntry(caller, existing.owner)) {
          Runtime.trap("Unauthorized: Can only delete your own reports");
        };
        pdfReports.remove(id);
      };
    };
  };

  public query ({ caller }) func getDashboardDataForCustomPeriod(
    startDate : Time.Time,
    endDate : Time.Time,
  ) : async DashboardQueryResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #dashboardError({ message = "Unauthorized: Only users can view dashboard data" });
    };

    if (startDate == 0) {
      return #dashboardError({ message = "Invalid start date: Cannot be empty" });
    };

    if (endDate == 0) {
      return #dashboardError({ message = "Invalid end date: Cannot be empty" });
    };

    if (startDate > endDate) {
      return #dashboardError({ message = "Invalid date range: Start date cannot be after end date" });
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    var totalCashIncome : Float = 0;
    var totalBankIncome : Float = 0;
    var totalBalancePaymentIncome : Float = 0;
    var totalUpiIncome : Float = 0;
    var totalChequeIncome : Float = 0;
    var totalIncome : Float = 0;

    var totalCashExpenses : Float = 0;
    var totalBankExpenses : Float = 0;
    var totalBalancePaymentExpenses : Float = 0;
    var totalUpiExpenses : Float = 0;
    var totalChequeExpenses : Float = 0;
    var totalExpenses : Float = 0;

    for ((_, entry) in incomeEntries.entries()) {
      if (entry.date >= startDate and entry.date <= endDate and (isAdmin or entry.owner == caller)) {
        totalIncome += entry.amount;
        switch (entry.paymentMode) {
          case (#cash) { totalCashIncome += entry.amount };
          case (#bank) { totalBankIncome += entry.amount };
          case (#balancePayment) { totalBalancePaymentIncome += entry.amount };
          case (#upi) { totalUpiIncome += entry.amount };
          case (#cheque) { totalChequeIncome += entry.amount };
        };
      };
    };

    for ((_, entry) in expenseEntriesV2.entries()) {
      if (entry.date >= startDate and entry.date <= endDate and (isAdmin or entry.owner == caller)) {
        totalExpenses += entry.amount;
        switch (entry.paymentMode) {
          case (#cash) { totalCashExpenses += entry.amount };
          case (#bank) { totalBankExpenses += entry.amount };
          case (#balancePayment) { totalBalancePaymentExpenses += entry.amount };
          case (#upi) { totalUpiExpenses += entry.amount };
          case (#cheque) { totalChequeExpenses += entry.amount };
        };
      };
    };

    #dashboardQueryResult {
      incomeTotals = {
        totalCash = totalCashIncome;
        totalBank = totalBankIncome;
        totalBalancePayment = totalBalancePaymentIncome;
        totalUpi = totalUpiIncome;
        totalCheque = totalChequeIncome;
        totalIncome;
      };
      expenseTotals = {
        totalCash = totalCashExpenses;
        totalBank = totalBankExpenses;
        totalBalancePayment = totalBalancePaymentExpenses;
        totalUpi = totalUpiExpenses;
        totalCheque = totalChequeExpenses;
        totalExpenses;
      };
      dateRange = { startDate; endDate };
    };
  };

  public query ({ caller }) func getFilteredIncomeSummary(
    filter : { #cash; #bank; #balance; #other }
  ) : async ?{
    entries : [IncomeEntry];
    total : Float;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can use this function");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let filtered = List.empty<IncomeEntry>();
    var totalFiltered : Float = 0;

    for ((_, entry) in incomeEntries.entries()) {
      if (isAdmin or entry.owner == caller) {
        if (matchesFilter(entry.paymentMode, filter)) {
          filtered.add(entry);
          totalFiltered += entry.amount;
        };
      };
    };

    let filteredArray = filtered.toArray();
    if (filteredArray.size() == 0) { return null };
    ?{
      entries = filteredArray;
      total = totalFiltered;
    };
  };

  public query ({ caller }) func getExpenseCategorySummary(category : ExpenseCategory) : async ?{
    entries : [ExpenseEntry];
    total : Float;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can use this function");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let filtered = List.empty<ExpenseEntry>();
    var totalFiltered : Float = 0;

    for ((_, entry) in expenseEntriesV2.entries()) {
      if (isAdmin or entry.owner == caller) {
        if (entry.category == category) {
          filtered.add(entry);
          totalFiltered += entry.amount;
        };
      };
    };

    let filteredArray = filtered.toArray();
    if (filteredArray.size() == 0) { return null };
    ?{
      entries = filteredArray;
      total = totalFiltered;
    };
  };

  func matchesFilter(mode : PaymentMode, filter : { #cash; #bank; #balance; #other }) : Bool {
    switch (mode, filter) {
      case (#cash, #cash) { true };
      case (#bank, #bank) { true };
      case (#balancePayment, #balance) { true };
      case (#upi, #other) { true };
      case (#cheque, #other) { true };
      case (_) { false };
    };
  };
};
