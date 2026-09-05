/* =========================================================
   TAMILANDA WALLET
   Main Application Logic
   ========================================================= */

"use strict";


/* =========================================================
   STORAGE
   ========================================================= */

const WALLET_STORAGE_KEY = "tamilanda_wallet_data";


/* =========================================================
   DEFAULT DATA
   ========================================================= */

const DEFAULT_WALLET_DATA = {

  accounts: [],

  transactions: [],

  buyers: [],

  buyerPayments: [],

  moneyToGive: [],

  givePayments: [],

  myEmis: [],

  emiPayments: [],

  recurringBills: [],

  recurringPayments: [],

  trash: [],

  categories: {

    income: [
      "FF Account Sale",
      "Business",
      "Salary",
      "Other Income"
    ],

    expense: [
      "Food",
      "Petrol",
      "Shopping",
      "Business",
      "Bills",
      "Vehicle",
      "EMI",
      "Other Expense"
    ]

  },

  settings: {

    currency: "INR",

    currencySymbol: "₹",

    appName: "Tamilanda Wallet"

  },

  profile: {

    name: "",

    phone: "",

    email: ""

  },

  security: {

    pinEnabled: false,

    pinConfigured: false

  }

};


/* =========================================================
   TRANSACTION CLASSIFICATION
   ========================================================= */

/*
  These are the transaction types that represent
  actual money entering the wallet.
*/

const INCOME_TRANSACTION_TYPES = [

  "income",

  "buyer_payment",

  "buyer_initial_payment"

];


/*
  These are the transaction types that represent
  actual money leaving the wallet.
*/

const EXPENSE_TRANSACTION_TYPES = [

  "expense",

  "emi_payment",

  "recurring_payment",

  "money_to_give_payment"

];


/*
  Transfer is intentionally NOT included
  in either list.
*/

const TRANSFER_TRANSACTION_TYPES = [

  "transfer"

];


function isIncomeTransaction(transaction) {

  return !!transaction &&
    INCOME_TRANSACTION_TYPES.includes(
      transaction.type
    );

}


function isExpenseTransaction(transaction) {

  return !!transaction &&
    EXPENSE_TRANSACTION_TYPES.includes(
      transaction.type
    );

}


function isTransferTransaction(transaction) {

  return !!transaction &&
    TRANSFER_TRANSACTION_TYPES.includes(
      transaction.type
    );

}


/* =========================================================
   GLOBAL WALLET DATA
   ========================================================= */

let walletData = loadWalletData();


/* =========================================================
   BASIC HELPERS
   ========================================================= */

function deepClone(value) {

  return JSON.parse(
    JSON.stringify(value)
  );

}


function generateId(prefix = "id") {

  return (
    prefix +
    "_" +
    Date.now() +
    "_" +
    Math.random()
      .toString(36)
      .slice(2, 9)
  );

}


function todayString() {

  const date = new Date();

  const year = date.getFullYear();

  const month =
    String(date.getMonth() + 1)
      .padStart(2, "0");

  const day =
    String(date.getDate())
      .padStart(2, "0");

  return `${year}-${month}-${day}`;

}


function escapeHtml(value) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }

  return String(value)

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}


function formatDisplayDate(dateString) {

  if (!dateString) {

    return "—";

  }

  const date =
    new Date(
      dateString + "T00:00:00"
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return dateString;

  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );

}


function formatMoney(value) {

  const amount =
    Number(value || 0);

  const symbol =
    walletData?.settings?.currencySymbol ||
    "₹";

  return (
    symbol +
    amount.toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    )
  );

}


/* =========================================================
   LOAD / SAVE
   ========================================================= */

function loadWalletData() {

  try {

    const saved =
      localStorage.getItem(
        WALLET_STORAGE_KEY
      );

    if (!saved) {

      const fresh =
        deepClone(
          DEFAULT_WALLET_DATA
        );

      localStorage.setItem(
        WALLET_STORAGE_KEY,
        JSON.stringify(fresh)
      );

      return fresh;

    }

    const parsed =
      JSON.parse(saved);

    return normalizeWalletData(
      parsed
    );

  } catch (error) {

    console.error(
      "Wallet data load error:",
      error
    );

    return deepClone(
      DEFAULT_WALLET_DATA
    );

  }

}


function saveWalletData() {

  try {

    walletData =
      normalizeWalletData(
        walletData
      );

    localStorage.setItem(
      WALLET_STORAGE_KEY,
      JSON.stringify(walletData)
    );

    return true;

  } catch (error) {

    console.error(
      "Wallet save error:",
      error
    );

    return false;

  }

}


/* =========================================================
   NORMALIZE DATA
   ========================================================= */

function normalizeWalletData(data) {

  const base =
    deepClone(
      DEFAULT_WALLET_DATA
    );

  const source =
    data &&
    typeof data === "object"
      ? data
      : {};


  const result = {

    ...base,

    ...source,

    categories: {

      ...base.categories,

      ...(source.categories || {})

    },

    settings: {

      ...base.settings,

      ...(source.settings || {})

    },

    profile: {

      ...base.profile,

      ...(source.profile || {})

    },

    security: {

      ...base.security,

      ...(source.security || {})

    }

  };


  const arrayKeys = [

    "accounts",

    "transactions",

    "buyers",

    "buyerPayments",

    "moneyToGive",

    "givePayments",

    "myEmis",

    "emiPayments",

    "recurringBills",

    "recurringPayments",

    "trash"

  ];


  arrayKeys.forEach(
    key => {

      if (
        !Array.isArray(
          result[key]
        )
      ) {

        result[key] = [];

      }

    }
  );


  if (
    !Array.isArray(
      result.categories.income
    )
  ) {

    result.categories.income =
      deepClone(
        base.categories.income
      );

  }


  if (
    !Array.isArray(
      result.categories.expense
    )
  ) {

    result.categories.expense =
      deepClone(
        base.categories.expense
      );

  }


  return result;

}


/* =========================================================
   ACCOUNT HELPERS
   ========================================================= */

function getAccountById(accountId) {

  return (
    walletData.accounts || []
  ).find(
    account =>
      String(account.id) ===
      String(accountId)
  );

}


function getAccountName(account) {

  if (!account) {

    return "Unknown Account";

  }

  return (
    account.name ||
    account.accountName ||
    account.title ||
    "Unnamed Account"
  );

}


function getAccountBalance(account) {

  if (!account) {

    return 0;

  }

  return Number(
    account.balance ??
    account.currentBalance ??
    0
  );

}


function setAccountBalance(
  account,
  balance
) {

  if (!account) {

    return;

  }

  account.balance =
    Number(balance || 0);


  /*
    Keep currentBalance synchronized
    when an older account object has it.
  */

  if (
    Object.prototype.hasOwnProperty.call(
      account,
      "currentBalance"
    )
  ) {

    account.currentBalance =
      Number(balance || 0);

  }

}


/* =========================================================
   BALANCE CALCULATIONS
   ========================================================= */

function calculateTotalBalance() {

  return (
    walletData.accounts || []
  ).reduce(
    (total, account) =>
      total +
      getAccountBalance(account),
    0
  );

}


/* =========================================================
   TODAY INCOME
   ========================================================= */

function calculateTodayIncome() {

  const today =
    todayString();

  return (
    walletData.transactions || []
  )

    .filter(
      transaction => {

        return (
          transaction.date === today &&
          isIncomeTransaction(
            transaction
          )
        );

      }
    )

    .reduce(
      (total, transaction) =>
        total +
        Number(
          transaction.amount || 0
        ),
      0
    );

}


/* =========================================================
   TODAY EXPENSE
   ========================================================= */

function calculateTodayExpense() {

  const today =
    todayString();

  return (
    walletData.transactions || []
  )

    .filter(
      transaction => {

        return (
          transaction.date === today &&
          isExpenseTransaction(
            transaction
          )
        );

      }
    )

    .reduce(
      (total, transaction) =>
        total +
        Number(
          transaction.amount || 0
        ),
      0
    );

}


/* =========================================================
   TODAY PROFIT
   ========================================================= */

function calculateTodayProfit() {

  return (
    calculateTodayIncome() -
    calculateTodayExpense()
  );

}


/* =========================================================
   RECEIVABLE / LIABILITY
   ========================================================= */

function getBuyerRemaining(buyer) {

  if (!buyer) {

    return 0;

  }


  const total =
    Number(
      buyer.totalAmount ??
      buyer.amount ??
      0
    );


  const initial =
    Number(
      buyer.initialPayment ??
      buyer.initialPaid ??
      buyer.paid ??
      0
    );


  const payments =
    (
      walletData.buyerPayments || []
    )

      .filter(
        payment =>
          String(
            payment.buyerId
          ) ===
          String(buyer.id)
      )

      .reduce(
        (sum, payment) =>
          sum +
          Number(
            payment.amount || 0
          ),
        0
      );


  return Math.max(
    0,
    total -
    initial -
    payments
  );

}


function calculateMoneyToReceive() {

  return (
    walletData.buyers || []
  ).reduce(
    (total, buyer) =>
      total +
      getBuyerRemaining(buyer),
    0
  );

}


/* =========================================================
   MONEY TO GIVE
   ========================================================= */

function getGiveRemaining(record) {

  if (!record) {

    return 0;

  }


  const total =
    Number(
      record.totalAmount ??
      record.amount ??
      0
    );


  const alreadyPaid =
    Number(
      record.alreadyPaid ??
      record.paid ??
      0
    );


  const payments =
    (
      walletData.givePayments || []
    )

      .filter(
        payment =>
          String(
            payment.giveId
          ) ===
          String(record.id)
      )

      .reduce(
        (sum, payment) =>
          sum +
          Number(
            payment.amount || 0
          ),
        0
      );


  return Math.max(
    0,
    total -
    alreadyPaid -
    payments
  );

}


function calculateMoneyToGive() {

  return (
    walletData.moneyToGive || []
  ).reduce(
    (total, record) =>
      total +
      getGiveRemaining(record),
    0
  );

}


/* =========================================================
   MY EMI
   ========================================================= */

function getEmiRemaining(emi) {

  if (!emi) {

    return 0;

  }


  const total =
    Number(
      emi.totalAmount ??
      emi.amount ??
      emi.loanAmount ??
      0
    );


  /*
    Support all existing field names.

    alreadyPaid is important because the
    current EMI page uses it for previous payments.
  */

  const directPaid =
    Number(
      emi.alreadyPaid ??
      emi.paidAmount ??
      emi.paid ??
      0
    );


  const payments =
    (
      walletData.emiPayments || []
    )

      .filter(
        payment =>
          String(
            payment.emiId
          ) ===
          String(emi.id)
      )

      .reduce(
        (sum, payment) =>
          sum +
          Number(
            payment.amount || 0
          ),
        0
      );


  return Math.max(
    0,
    total -
    directPaid -
    payments
  );

}


function calculateEmiToPay() {

  return (
    walletData.myEmis || []
  ).reduce(
    (total, emi) =>
      total +
      getEmiRemaining(emi),
    0
  );

}


/* =========================================================
   ASSETS / LIABILITIES / NET WORTH
   ========================================================= */

function calculateTotalAssets() {

  const accountBalance =
    calculateTotalBalance();

  const receivable =
    calculateMoneyToReceive();

  return (
    accountBalance +
    receivable
  );

}


function calculateTotalLiabilities() {

  const moneyToGive =
    calculateMoneyToGive();

  const emiToPay =
    calculateEmiToPay();

  return (
    moneyToGive +
    emiToPay
  );

}


function calculateNetWorth() {

  return (
    calculateTotalAssets() -
    calculateTotalLiabilities()
  );

}


/* =========================================================
   TRANSACTION HELPERS
   ========================================================= */

function addTransaction(transaction) {

  if (!transaction) {

    return false;

  }


  const amount =
    Number(
      transaction.amount || 0
    );


  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    return false;

  }


  const type =
    transaction.type ||
    "other";


  const account =
    getAccountById(
      transaction.accountId
    );


  /*
    Only actual income types increase balance.

    Important:
    Payment pages such as Buyer / EMI / Recurring
    already manage their account balance directly,
    so they should NOT call addTransaction()
    for the same payment.

    This function is therefore safe for standalone
    transaction creation and Quick Add.
  */

  if (
    isIncomeTransaction(transaction) &&
    account
  ) {

    setAccountBalance(
      account,
      getAccountBalance(account) +
      amount
    );

  }


  /*
    Expense types decrease balance.
  */

  if (
    isExpenseTransaction(transaction) &&
    account
  ) {

    if (
      amount >
      getAccountBalance(account)
    ) {

      return false;

    }


    setAccountBalance(
      account,
      getAccountBalance(account) -
      amount
    );

  }


  /*
    Transfer does not change balance here.
    transferBetweenAccounts() handles it separately.
  */


  const newTransaction = {

    id:
      transaction.id ||
      generateId("txn"),

    type:

      type,

    amount:

      amount,

    accountId:

      transaction.accountId ||
      null,

    category:

      transaction.category ||
      "",

    description:

      transaction.description ||
      transaction.note ||
      "",

    note:

      transaction.note ||
      "",

    date:

      transaction.date ||
      todayString(),

    createdAt:

      transaction.createdAt ||
      new Date().toISOString()

  };


  /*
    Preserve additional fields.

    This keeps buyerId, paymentId,
    emiId, billId, giveId etc.
  */

  Object.keys(transaction)
    .forEach(
      key => {

        if (
          newTransaction[key] ===
          undefined
        ) {

          newTransaction[key] =
            transaction[key];

        }

      }
    );


  walletData.transactions.unshift(
    newTransaction
  );


  saveWalletData();

  updateDashboard();

  return newTransaction;

}


/* =========================================================
   LEDGER RECONCILIATION / AUDIT
   ========================================================= */

/*
  Non-destructive accounting audit.

  This does NOT rewrite existing balances because the app can contain
  opening balances that were entered manually before transactions existed.

  Instead it checks the relationships that must always be true:
  - payment records have matching transactions
  - linked transaction amounts/accounts match
  - transaction IDs are unique
  - transaction accounts exist
  - transfer entries have matching transferId pairs
  - account balances are not negative
*/

function runLedgerAudit() {
  const report = {
    ok: true,
    checkedAt: new Date().toISOString(),
    issues: [],
    counts: {
      accounts: (walletData.accounts || []).length,
      transactions: (walletData.transactions || []).length,
      buyerPayments: (walletData.buyerPayments || []).length,
      givePayments: (walletData.givePayments || []).length,
      emiPayments: (walletData.emiPayments || []).length,
      recurringPayments: (walletData.recurringPayments || []).length
    }
  };

  const transactions = walletData.transactions || [];
  const transactionMap = new Map();

  transactions.forEach(transaction => {
    const id = transaction && transaction.id;
    if (!id) {
      report.issues.push({
        type: "transaction_missing_id",
        message: "A transaction is missing its ID."
      });
      return;
    }

    const key = String(id);

    if (transactionMap.has(key)) {
      report.issues.push({
        type: "duplicate_transaction_id",
        transactionId: id,
        message: "Duplicate transaction ID found."
      });
    } else {
      transactionMap.set(key, transaction);
    }

    if (
      isIncomeTransaction(transaction) ||
      isExpenseTransaction(transaction)
    ) {
      if (!getAccountById(transaction.accountId)) {
        report.issues.push({
          type: "missing_account",
          transactionId: id,
          message: "Income/expense transaction points to a missing account."
        });
      }
    }

    if (
      !Number.isFinite(Number(transaction.amount)) ||
      Number(transaction.amount) <= 0
    ) {
      report.issues.push({
        type: "invalid_transaction_amount",
        transactionId: id,
        message: "Transaction has an invalid amount."
      });
    }
  });

  function checkPaymentCollection(collectionName, transactionType, idField) {
    (walletData[collectionName] || []).forEach(payment => {
      const transactionId = payment && payment.transactionId;

      if (!transactionId) {
        report.issues.push({
          type: "payment_missing_transaction",
          collection: collectionName,
          paymentId: payment?.id || null,
          message: "Payment record is missing transactionId."
        });
        return;
      }

      const transaction = transactionMap.get(String(transactionId));

      if (!transaction) {
        report.issues.push({
          type: "orphan_payment",
          collection: collectionName,
          paymentId: payment?.id || null,
          transactionId,
          message: "Payment record has no matching transaction."
        });
        return;
      }

      if (transaction.type !== transactionType) {
        report.issues.push({
          type: "transaction_type_mismatch",
          collection: collectionName,
          paymentId: payment?.id || null,
          transactionId,
          message: "Linked transaction type does not match payment type."
        });
      }

      if (
        Number(transaction.amount) !== Number(payment.amount)
      ) {
        report.issues.push({
          type: "amount_mismatch",
          collection: collectionName,
          paymentId: payment?.id || null,
          transactionId,
          message: "Payment amount and transaction amount do not match."
        });
      }

      if (
        String(transaction.accountId || "") !==
        String(payment.accountId || "")
      ) {
        report.issues.push({
          type: "account_mismatch",
          collection: collectionName,
          paymentId: payment?.id || null,
          transactionId,
          message: "Payment account and transaction account do not match."
        });
      }

      if (
        idField &&
        payment[idField] !== undefined &&
        transaction[idField] !== undefined &&
        String(payment[idField]) !== String(transaction[idField])
      ) {
        report.issues.push({
          type: "link_mismatch",
          collection: collectionName,
          paymentId: payment?.id || null,
          transactionId,
          message: "Payment link field does not match transaction link field."
        });
      }
    });
  }

  checkPaymentCollection(
    "buyerPayments",
    "buyer_payment",
    "buyerId"
  );

  checkPaymentCollection(
    "emiPayments",
    "emi_payment",
    "emiId"
  );

  checkPaymentCollection(
    "recurringPayments",
    "recurring_payment",
    "billId"
  );

  checkPaymentCollection(
    "givePayments",
    "money_to_give_payment",
    "giveId"
  );

  const transferGroups = new Map();

  transactions
    .filter(isTransferTransaction)
    .forEach(transaction => {
      const transferId = transaction.transferId;

      if (!transferId) {
        report.issues.push({
          type: "transfer_missing_id",
          transactionId: transaction.id,
          message: "Transfer transaction is missing transferId."
        });
        return;
      }

      const key = String(transferId);

      if (!transferGroups.has(key)) {
        transferGroups.set(key, []);
      }

      transferGroups.get(key).push(transaction);
    });

  transferGroups.forEach((items, transferId) => {
    const out = items.filter(
      item => item.transferDirection === "out"
    );

    const incoming = items.filter(
      item => item.transferDirection === "in"
    );

    if (out.length !== 1 || incoming.length !== 1) {
      report.issues.push({
        type: "transfer_pair_mismatch",
        transferId,
        message: "Transfer should have exactly one outgoing and one incoming ledger entry."
      });
      return;
    }

    if (
      Number(out[0].amount) !==
      Number(incoming[0].amount)
    ) {
      report.issues.push({
        type: "transfer_amount_mismatch",
        transferId,
        message: "Transfer out and transfer in amounts do not match."
      });
    }

    if (
      String(out[0].fromAccountId || "") !==
      String(incoming[0].fromAccountId || "") ||
      String(out[0].toAccountId || "") !==
      String(incoming[0].toAccountId || "")
    ) {
      report.issues.push({
        type: "transfer_account_mismatch",
        transferId,
        message: "Transfer source/destination accounts do not match."
      });
    }
  });

  (walletData.accounts || []).forEach(account => {
    const balance = getAccountBalance(account);

    if (!Number.isFinite(balance)) {
      report.issues.push({
        type: "invalid_account_balance",
        accountId: account.id,
        message: "Account has an invalid balance."
      });
    }
  });

  report.ok = report.issues.length === 0;

  return report;
}


/* =========================================================
   ACCOUNT
   ========================================================= */

function addAccount(account) {

  if (!account) {

    return false;

  }


  const name =
    String(
      account.name ||
      account.accountName ||
      ""
    ).trim();


  if (!name) {

    return false;

  }


  const newAccount = {

    id:
      account.id ||
      generateId("account"),

    name:
      name,

    type:
      account.type ||
      "Bank",

    balance:
      Number(
        account.balance ||
        account.currentBalance ||
        0
      ),

    note:
      account.note ||
      "",

    createdAt:
      account.createdAt ||
      new Date().toISOString()

  };


  walletData.accounts.push(
    newAccount
  );


  saveWalletData();

  updateDashboard();

  return newAccount;

}


/* =========================================================
   TRANSFER BETWEEN ACCOUNTS
   ========================================================= */

function transferBetweenAccounts(
  fromAccountId,
  toAccountId,
  amount,
  note = "",
  date = todayString()
) {

  const fromAccount =
    getAccountById(
      fromAccountId
    );

  const toAccount =
    getAccountById(
      toAccountId
    );


  const transferAmount =
    Number(amount);


  if (
    !fromAccount ||
    !toAccount
  ) {

    console.error(
      "Transfer failed: account not found."
    );

    return false;

  }


  if (
    String(fromAccount.id) ===
    String(toAccount.id)
  ) {

    console.error(
      "Transfer failed: same account."
    );

    return false;

  }


  if (
    !Number.isFinite(
      transferAmount
    ) ||
    transferAmount <= 0
  ) {

    return false;

  }


  const sourceBalance =
    getAccountBalance(
      fromAccount
    );


  if (
    transferAmount >
    sourceBalance
  ) {

    console.error(
      "Transfer failed: insufficient balance."
    );

    return false;

  }


  /*
    Source decreases.
  */

  setAccountBalance(
    fromAccount,
    sourceBalance -
    transferAmount
  );


  /*
    Destination increases.
  */

  setAccountBalance(
    toAccount,
    getAccountBalance(toAccount) +
    transferAmount
  );


  /*
    Transfer is NOT income
    and NOT expense.
  */

  const transferId =
    generateId("transfer");


  const baseTransaction = {

    type:
      "transfer",

    amount:
      transferAmount,

    fromAccountId:
      fromAccount.id,

    toAccountId:
      toAccount.id,

    date:
      date || todayString(),

    note:
      note || "",

    description:
      note ||
      `Transfer from ${getAccountName(fromAccount)} to ${getAccountName(toAccount)}`,

    createdAt:
      new Date().toISOString(),

    transferId:
      transferId

  };


  walletData.transactions.unshift({

    ...baseTransaction,

    id:
      generateId("transfer"),

    accountId:
      fromAccount.id,

    transferDirection:
      "out"

  });


  walletData.transactions.unshift({

    ...baseTransaction,

    id:
      generateId("transfer"),

    accountId:
      toAccount.id,

    transferDirection:
      "in"

  });


  saveWalletData();

  updateDashboard();

  return true;

}


/* =========================================================
   BUYERS
   ========================================================= */

function addBuyer(buyer) {

  if (!buyer) {

    return false;

  }


  const name =
    String(
      buyer.name ||
      buyer.buyerName ||
      ""
    ).trim();


  if (!name) {

    return false;

  }


  const newBuyer = {

    id:
      buyer.id ||
      generateId("buyer"),

    name:
      name,

    phone:
      buyer.phone ||
      "",

    ffId:
      buyer.ffId ||
      buyer.ffID ||
      "",

    totalAmount:
      Number(
        buyer.totalAmount ||
        buyer.amount ||
        0
      ),

    initialPayment:
      Number(
        buyer.initialPayment ||
        0
      ),

    emiDuration:
      buyer.emiDuration ||
      "",

    dueDate:
      buyer.dueDate ||
      "",

    note:
      buyer.note ||
      "",

    createdAt:
      buyer.createdAt ||
      new Date().toISOString()

  };


  walletData.buyers.push(
    newBuyer
  );


  saveWalletData();

  updateDashboard();

  return newBuyer;

}


/* =========================================================
   BUYER PAYMENT
   ========================================================= */

function addBuyerPayment(
  buyerId,
  amount,
  accountId,
  date = todayString(),
  note = ""
) {

  const buyer =
    walletData.buyers.find(
      item =>
        String(item.id) ===
        String(buyerId)
    );


  const account =
    getAccountById(
      accountId
    );


  const paymentAmount =
    Number(amount);


  if (
    !buyer ||
    !account
  ) {

    return false;

  }


  if (
    !Number.isFinite(
      paymentAmount
    ) ||
    paymentAmount <= 0
  ) {

    return false;

  }


  const remaining =
    getBuyerRemaining(
      buyer
    );


  if (
    paymentAmount >
    remaining
  ) {

    return false;

  }


  /*
    Buyer pays us.
    Account balance increases.
  */

  setAccountBalance(
    account,
    getAccountBalance(account) +
    paymentAmount
  );


  const paymentId =
    generateId(
      "buyer_payment"
    );


  const transactionId =
    generateId("txn");


  const payment = {

    id:
      paymentId,

    buyerId:
      buyer.id,

    amount:
      paymentAmount,

    accountId:
      account.id,

    date:
      date || todayString(),

    note:
      note || "",

    transactionId:
      transactionId,

    createdAt:
      new Date().toISOString()

  };


  walletData.buyerPayments.unshift(
    payment
  );


  /*
    Buyer payment is income.
  */

  walletData.transactions.unshift({

    id:
      transactionId,

    type:
      "buyer_payment",

    amount:
      paymentAmount,

    accountId:
      account.id,

    buyerId:
      buyer.id,

    paymentId:
      paymentId,

    category:
      "FF Account Sale",

    description:
      `Payment received from ${buyer.name}`,

    note:
      note || "",

    date:
      date || todayString(),

    createdAt:
      new Date().toISOString()

  });


  saveWalletData();

  updateDashboard();

  return payment;

}


/* =========================================================
   GENERIC TRASH
   ========================================================= */

function moveToTrash(
  type,
  data
) {

  if (!data) {

    return false;

  }


  walletData.trash.unshift({

    id:
      generateId("trash"),

    originalId:
      data.id || null,

    type:
      type || "unknown",

    data:
      deepClone(data),

    deletedAt:
      new Date().toISOString()

  });


  saveWalletData();

  updateDashboard();

  return true;

}


/* =========================================================
   DELETE RECORD
   ========================================================= */

function deleteRecord(
  collectionName,
  recordId
) {

  if (
    !Array.isArray(
      walletData[collectionName]
    )
  ) {

    return false;

  }


  const index =
    walletData[
      collectionName
    ].findIndex(
      item =>
        String(item.id) ===
        String(recordId)
    );


  if (index === -1) {

    return false;

  }


  const record =
    walletData[
      collectionName
    ][index];


  /*
    IMPORTANT:
    This function only moves the record
    to Trash.

    Existing Income / Expense pages already
    reverse their account balance before calling
    deleteRecord().

    Therefore we intentionally DO NOT reverse
    the balance here, preventing double reversal.
  */

  const moved =
    moveToTrash(
      collectionName,
      record
    );


  if (!moved) {

    return false;

  }


  walletData[
    collectionName
  ].splice(
    index,
    1
  );


  saveWalletData();

  updateDashboard();

  return true;

}


/* =========================================================
   TRASH / RESTORE HELPERS
   ========================================================= */

/*
  Trash records created by older versions may store the
  collection name directly in item.type.

  Newer / manually-created trash records may use shorter
  names such as "transaction", "buyer", "give", etc.

  This resolver supports both formats so old trash items
  remain restorable.
*/

function resolveTrashCollection(trashItem) {

  if (!trashItem) {
    return null;
  }

  const candidates = [
    trashItem.originalCollection,
    trashItem.collection,
    trashItem.type
  ];

  const aliases = {
    transaction: "transactions",
    transactions: "transactions",

    buyer: "buyers",
    buyers: "buyers",

    account: "accounts",
    accounts: "accounts",

    give: "moneyToGive",
    moneyToGive: "moneyToGive",
    money_to_give: "moneyToGive",

    emi: "myEmis",
    myEmis: "myEmis",

    recurring: "recurringBills",
    recurringBills: "recurringBills",

    buyerPayment: "buyerPayments",
    buyerPayments: "buyerPayments",

    givePayment: "givePayments",
    givePayments: "givePayments",

    emiPayment: "emiPayments",
    emiPayments: "emiPayments",

    recurringPayment: "recurringPayments",
    recurringPayments: "recurringPayments"
  };

  for (const candidate of candidates) {

    if (!candidate) {
      continue;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        walletData,
        candidate
      ) &&
      Array.isArray(walletData[candidate])
    ) {
      return candidate;
    }

    if (aliases[candidate]) {
      return aliases[candidate];
    }
  }

  return null;
}


function findRecordById(collectionName, recordId) {

  if (
    !collectionName ||
    !Array.isArray(walletData[collectionName])
  ) {
    return null;
  }

  return walletData[collectionName].find(
    record =>
      String(record.id) ===
      String(recordId)
  ) || null;
}


/*
  Re-apply the account-side effect of a restored
  transaction.

  IMPORTANT:
  Delete pages in this project already reverse the
  account balance before moving a transaction to Trash.

  Therefore restoring the transaction must apply that
  financial effect again exactly once.

  Transfer transactions are excluded because the
  transfer operation already changed both account
  balances and transfer records are informational
  ledger entries.
*/

function restoreTransactionLedger(transaction) {

  if (!transaction) {
    return {
      success: false,
      reason: "Invalid transaction."
    };
  }

  const type =
    transaction.type || "";

  const amount =
    Number(transaction.amount || 0);

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return {
      success: false,
      reason: "Invalid transaction amount."
    };
  }

  if (
    isTransferTransaction(transaction)
  ) {
    return {
      success: true,
      changedBalance: false
    };
  }

  if (
    !isIncomeTransaction(transaction) &&
    !isExpenseTransaction(transaction)
  ) {
    return {
      success: true,
      changedBalance: false
    };
  }

  const account =
    getAccountById(
      transaction.accountId
    );

  if (!account) {
    return {
      success: false,
      reason: "Linked account was not found."
    };
  }

  const currentBalance =
    getAccountBalance(account);

  /*
    Income restoration:
    add the money back to the account.
  */

  if (
    isIncomeTransaction(transaction)
  ) {

    setAccountBalance(
      account,
      currentBalance + amount
    );

    return {
      success: true,
      changedBalance: true
    };
  }

  /*
    Expense restoration:
    the deleted expense needs to be applied again,
    so the account balance must decrease.

    Do not allow a negative balance during restore.
  */

  if (
    isExpenseTransaction(transaction)
  ) {

    if (amount > currentBalance) {
      return {
        success: false,
        reason:
          "Insufficient balance in the linked account to restore this expense."
      };
    }

    setAccountBalance(
      account,
      currentBalance - amount
    );

    return {
      success: true,
      changedBalance: true
    };
  }

  return {
    success: true,
    changedBalance: false
  };
}


/*
  Restore one trash item.

  Returns an object instead of only true/false so the
  Trash page can show a useful failure reason.
*/

function restoreTrashItemByIndex(index) {

  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= walletData.trash.length
  ) {
    return {
      success: false,
      reason: "Trash item not found."
    };
  }

  const trashItem =
    walletData.trash[index];

  if (
    !trashItem ||
    !trashItem.data
  ) {
    return {
      success: false,
      reason: "Trash item data is missing."
    };
  }

  const collection =
    resolveTrashCollection(
      trashItem
    );

  if (!collection) {
    return {
      success: false,
      reason:
        "Original wallet collection could not be identified."
    };
  }

  const recordId =
    trashItem.data.id ||
    trashItem.originalId ||
    null;

  /*
    If the record already exists, it is already restored.
    Remove only the duplicate Trash copy.
    DO NOT apply the ledger again.
  */

  if (
    recordId !== null &&
    findRecordById(
      collection,
      recordId
    )
  ) {

    walletData.trash.splice(
      index,
      1
    );

    return {
      success: true,
      alreadyExists: true,
      changedBalance: false
    };
  }

  /*
    Transaction restore must re-apply the financial
    account effect before the transaction is restored.
  */

  if (
    collection === "transactions"
  ) {

    const ledgerResult =
      restoreTransactionLedger(
        trashItem.data
      );

    if (!ledgerResult.success) {
      return {
        success: false,
        reason: ledgerResult.reason ||
          "Transaction balance could not be restored."
      };
    }
  }

  /*
    Restore the actual record.
  */

  walletData[collection].push(
    deepClone(
      trashItem.data
    )
  );

  /*
    Only remove the Trash entry AFTER the complete
    restoration succeeds.
  */

  walletData.trash.splice(
    index,
    1
  );

  return {
    success: true,
    collection: collection,
    changedBalance:
      collection === "transactions"
  };
}


/* =========================================================
   RESTORE FROM TRASH
   ========================================================= */

function restoreFromTrash(
  trashId
) {

  const index =
    walletData.trash.findIndex(
      item =>
        String(item.id) ===
        String(trashId)
    );

  if (index === -1) {
    return false;
  }

  const result =
    restoreTrashItemByIndex(
      index
    );

  if (!result.success) {

    console.error(
      "Restore failed:",
      result.reason
    );

    return false;
  }

  saveWalletData();
  updateDashboard();

  return true;
}


/* =========================================================
   RESTORE ALL
   ========================================================= */

function restoreAllFromTrash() {

  if (
    !Array.isArray(walletData.trash) ||
    walletData.trash.length === 0
  ) {
    return {
      success: true,
      restored: 0,
      failed: 0,
      failedItems: []
    };
  }

  /*
    Work from the end so removing an item does not
    change the index of items that are still pending.

    Non-transaction records can be restored first.
    Transactions are restored afterwards so their linked
    accounts are more likely to already exist.
  */

  const transactionItems = [];
  const otherItems = [];

  walletData.trash.forEach(
    (item, index) => {

      const collection =
        resolveTrashCollection(item);

      if (
        collection === "transactions"
      ) {
        transactionItems.push(index);
      } else {
        otherItems.push(index);
      }

    }
  );

  /*
    Convert original indexes into stable Trash IDs.
  */

  const restoreIds = [
    ...otherItems,
    ...transactionItems
  ]
    .map(
      index =>
        walletData.trash[index]?.id
    )
    .filter(Boolean);

  let restored = 0;
  let failed = 0;
  const failedItems = [];

  restoreIds.forEach(
    trashId => {

      const currentIndex =
        walletData.trash.findIndex(
          item =>
            String(item.id) ===
            String(trashId)
        );

      if (currentIndex === -1) {
        return;
      }

      const result =
        restoreTrashItemByIndex(
          currentIndex
        );

      if (result.success) {

        restored++;

      } else {

        failed++;

        const item =
          walletData.trash[currentIndex];

        failedItems.push({
          id: item?.id || trashId,
          title:
            item?.data?.description ||
            item?.data?.name ||
            item?.data?.personName ||
            item?.data?.buyerName ||
            item?.data?.accountName ||
            "Unknown item",
          reason:
            result.reason ||
            "Restore failed."
        });
      }

    }
  );

  saveWalletData();
  updateDashboard();

  return {
    success: failed === 0,
    restored: restored,
    failed: failed,
    failedItems: failedItems
  };
}


/* =========================================================
   DASHBOARD
   ========================================================= */

function updateDashboard() {

  const totalBalanceElement =
    document.getElementById(
      "totalBalance"
    );

  const todayIncomeElement =
    document.getElementById(
      "todayIncome"
    );

  const todayExpenseElement =
    document.getElementById(
      "todayExpense"
    );

  const todayProfitElement =
    document.getElementById(
      "todayProfit"
    );

  const moneyToReceiveElement =
    document.getElementById(
      "moneyToReceive"
    );

  const moneyToGiveElement =
    document.getElementById(
      "moneyToGive"
    );

  const emiToPayElement =
    document.getElementById(
      "emiToPay"
    );


  if (totalBalanceElement) {

    totalBalanceElement.textContent =
      formatMoney(
        calculateTotalBalance()
      );

  }


  if (todayIncomeElement) {

    todayIncomeElement.textContent =
      formatMoney(
        calculateTodayIncome()
      );

  }


  if (todayExpenseElement) {

    todayExpenseElement.textContent =
      formatMoney(
        calculateTodayExpense()
      );

  }


  if (todayProfitElement) {

    todayProfitElement.textContent =
      formatMoney(
        calculateTodayProfit()
      );

  }


  if (moneyToReceiveElement) {

    moneyToReceiveElement.textContent =
      formatMoney(
        calculateMoneyToReceive()
      );

  }


  if (moneyToGiveElement) {

    moneyToGiveElement.textContent =
      formatMoney(
        calculateMoneyToGive()
      );

  }


  if (emiToPayElement) {

    emiToPayElement.textContent =
      formatMoney(
        calculateEmiToPay()
      );

  }


  renderAccountsPreview();

  renderRecentTransactions();

}


/* =========================================================
   ACCOUNTS PREVIEW
   ========================================================= */

function renderAccountsPreview() {

  const container =
    document.getElementById(
      "accountsPreview"
    );


  if (!container) {

    return;

  }


  const accounts =
    walletData.accounts || [];


  if (accounts.length === 0) {

    container.innerHTML = `
      <div class="empty-state">
        No accounts added yet.
      </div>
    `;

    return;

  }


  container.innerHTML =
    accounts
      .slice(0, 5)
      .map(
        account => {

          return `
            <div class="account-preview-item">

              <div>

                <strong>
                  ${escapeHtml(
                    getAccountName(account)
                  )}
                </strong>

                <small>
                  ${escapeHtml(
                    account.type ||
                    "Account"
                  )}
                </small>

              </div>

              <strong>
                ${escapeHtml(
                  formatMoney(
                    getAccountBalance(
                      account
                    )
                  )
                )}
              </strong>

            </div>
          `;

        }
      )
      .join("");

}


/* =========================================================
   RECENT TRANSACTIONS
   ========================================================= */

function renderRecentTransactions() {

  const container =
    document.getElementById(
      "recentTransactions"
    );


  if (!container) {

    return;

  }


  const transactions =
    walletData.transactions || [];


  if (transactions.length === 0) {

    container.innerHTML = `
      <div class="empty-state">
        No transactions yet.
      </div>
    `;

    return;

  }


  container.innerHTML =
    transactions
      .slice(0, 8)
      .map(
        transaction => {

          let sign = "";


          /*
            Income types.
          */

          if (
            isIncomeTransaction(
              transaction
            )
          ) {

            sign = "+";

          }


          /*
            Expense types.
          */

          else if (
            isExpenseTransaction(
              transaction
            )
          ) {

            sign = "-";

          }


          /*
            Transfer has no
            income/expense sign.
          */


          let title =
            transaction.description ||
            transaction.category ||
            "Transaction";


          if (
            transaction.type ===
            "buyer_initial_payment"
          ) {

            title =
              transaction.description ||
              "Buyer Initial Payment";

          }


          if (
            transaction.type ===
            "buyer_payment"
          ) {

            title =
              transaction.description ||
              "Buyer Payment";

          }


          if (
            transaction.type ===
            "emi_payment"
          ) {

            title =
              transaction.description ||
              "EMI Payment";

          }


          if (
            transaction.type ===
            "recurring_payment"
          ) {

            title =
              transaction.description ||
              "Recurring Payment";

          }


          if (
            transaction.type ===
            "money_to_give_payment"
          ) {

            title =
              transaction.description ||
              "Money To Give Payment";

          }


          if (
            isTransferTransaction(
              transaction
            )
          ) {

            title =
              transaction.description ||
              "Account Transfer";

          }


          return `
            <div class="transaction-preview-item">

              <div>

                <strong>
                  ${escapeHtml(title)}
                </strong>

                <small>
                  ${escapeHtml(
                    formatDisplayDate(
                      transaction.date
                    )
                  )}
                </small>

              </div>

              <strong>
                ${sign}${escapeHtml(
                  formatMoney(
                    transaction.amount
                  )
                )}
              </strong>

            </div>
          `;

        }
      )
      .join("");

}


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function goToPage(page) {

  const pageMap = {
    home: "index.html",
    dashboard: "dashboard.html",
    income: "income.html",
    expense: "expense.html",
    accounts: "accounts.html",
    transfer: "transfer.html",
    transactions: "transactions.html",
    buyers: "buyers.html",
    giveMoney: "give-money.html",
    emi: "emi.html",
    recurring: "recurring.html",
    reports: "reports.html",
    calculator: "calculator.html",
    notifications: "notifications.html",
    settings: "settings.html",
    security: "security.html",
    profile: "profile.html",
    privacy: "privacy.html",
    about: "about.html",
    more: "more.html",
    trash: "trash.html",
    netWorth: "net-worth.html",
    search: "search.html",
    backup: "backup.html",
    attachments: "attachments.html",
    export: "export.html",
    quickAdd: "quick-add.html",
    calendar: "calendar.html"
  };

  if (!pageMap[page]) {
    return;
  }

  const onPagesDirectory =
    window.location.pathname.includes("/pages/");

  window.location.href =
    onPagesDirectory
      ? pageMap[page]
      : "./pages/" + pageMap[page];
}


/* =========================================================
   GLOBAL OBJECT
   ========================================================= */

window.TamilandaWallet = {

  /* Data */

  getData:
    () => walletData,

  save:
    saveWalletData,


  /* Helpers */

  formatMoney:
    formatMoney,

  todayString:
    todayString,

  generateId:
    generateId,

  escapeHtml:
    escapeHtml,

  formatDisplayDate:
    formatDisplayDate,


  /* Transaction classification */

  isIncomeTransaction:
    isIncomeTransaction,

  isExpenseTransaction:
    isExpenseTransaction,

  isTransferTransaction:
    isTransferTransaction,


  /* Ledger audit */

  runLedgerAudit:
    runLedgerAudit,


  /* Calculations */

  calculateTotalBalance:
    calculateTotalBalance,

  calculateTodayIncome:
    calculateTodayIncome,

  calculateTodayExpense:
    calculateTodayExpense,

  calculateTodayProfit:
    calculateTodayProfit,

  calculateMoneyToReceive:
    calculateMoneyToReceive,

  calculateMoneyToGive:
    calculateMoneyToGive,

  calculateEmiToPay:
    calculateEmiToPay,

  calculateTotalAssets:
    calculateTotalAssets,

  calculateTotalLiabilities:
    calculateTotalLiabilities,

  calculateNetWorth:
    calculateNetWorth,


  /* Remaining */

  getBuyerRemaining:
    getBuyerRemaining,

  getGiveRemaining:
    getGiveRemaining,

  getEmiRemaining:
    getEmiRemaining,


  /* Records */

  addTransaction:
    addTransaction,

  addAccount:
    addAccount,

  addBuyer:
    addBuyer,

  addBuyerPayment:
    addBuyerPayment,


  /* Transfer */

  transferBetweenAccounts:
    transferBetweenAccounts,


  /* Trash */

  moveToTrash:
    moveToTrash,

  deleteRecord:
    deleteRecord,

  restoreFromTrash:
    restoreFromTrash,

  restoreAllFromTrash:
    restoreAllFromTrash,


  /* Dashboard */

  updateDashboard:
    updateDashboard,


  /* Navigation */

  goToPage:
    goToPage

};


/* =========================================================
   GLOBAL NAVIGATION / DASHBOARD ACTIONS
   ========================================================= */

/*
  The current HTML uses data-page buttons and dashboard
  action IDs. This delegated handler keeps them clickable
  without changing any accounting logic.
*/
document.addEventListener(
  "click",
  function (event) {

    const navItem =
      event.target.closest(
        ".bottom-nav .nav-item, .bottom-nav .bottom-nav-item"
      );

    if (navItem) {

      const page =
        navItem.getAttribute("data-page");

      if (page) {
        event.preventDefault();
        goToPage(page);
        return;
      }
    }

    const actionButton =
      event.target.closest(
        "#settingsButton, " +
        "#addIncomeButton, " +
        "#addExpenseButton, " +
        "#addBuyerButton, " +
        "#addEmiButton, " +
        "#viewAccountsButton, " +
        "#viewTransactionsButton"
      );

    if (!actionButton) {
      return;
    }

    const actionMap = {
      settingsButton: "settings",
      addIncomeButton: "income",
      addExpenseButton: "expense",
      addBuyerButton: "buyers",
      addEmiButton: "emi",
      viewAccountsButton: "accounts",
      viewTransactionsButton: "transactions"
    };

    const page =
      actionMap[actionButton.id];

    if (page) {
      event.preventDefault();
      goToPage(page);
    }
  }
);


/* =========================================================
   AUTO DASHBOARD UPDATE
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    updateDashboard();

  }
);


/* =========================================================
   STORAGE EVENT
   ========================================================= */

window.addEventListener(
  "storage",
  function (event) {

    if (
      event.key ===
      WALLET_STORAGE_KEY
    ) {

      walletData =
        loadWalletData();

      updateDashboard();

    }

  }
);


/* =========================================================
   END OF APP.JS
   ========================================================= */
