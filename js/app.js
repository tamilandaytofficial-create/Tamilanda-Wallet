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

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function formatDisplayDate(dateString) {

  if (!dateString) {
    return "—";
  }

  const date =
    new Date(dateString + "T00:00:00");

  if (Number.isNaN(date.getTime())) {
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
        deepClone(DEFAULT_WALLET_DATA);

      localStorage.setItem(
        WALLET_STORAGE_KEY,
        JSON.stringify(fresh)
      );

      return fresh;
    }

    const parsed =
      JSON.parse(saved);

    return normalizeWalletData(parsed);

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
      normalizeWalletData(walletData);

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
    deepClone(DEFAULT_WALLET_DATA);

  const source =
    data && typeof data === "object"
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


  arrayKeys.forEach(key => {

    if (!Array.isArray(result[key])) {
      result[key] = [];
    }

  });


  if (!Array.isArray(result.categories.income)) {

    result.categories.income =
      deepClone(
        base.categories.income
      );

  }


  if (!Array.isArray(result.categories.expense)) {

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
    if an older account object uses it.
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


function calculateTodayIncome() {

  const today =
    todayString();

  return (
    walletData.transactions || []
  )
    .filter(transaction => {

      return (
        transaction.date === today &&
        (
          transaction.type === "income" ||
          transaction.type === "buyer_payment"
        )
      );

    })
    .reduce(
      (total, transaction) =>
        total +
        Number(transaction.amount || 0),
      0
    );

}


function calculateTodayExpense() {

  const today =
    todayString();

  return (
    walletData.transactions || []
  )
    .filter(transaction => {

      return (
        transaction.date === today &&
        (
          transaction.type === "expense" ||
          transaction.type === "recurring_payment" ||
          transaction.type === "emi_payment"
        )
      );

    })
    .reduce(
      (total, transaction) =>
        total +
        Number(transaction.amount || 0),
      0
    );

}


function calculateTodayProfit() {

  return (
    calculateTodayIncome() -
    calculateTodayExpense()
  );

}


/* =========================================================
   RECEIVABLE / LIABILITY CALCULATIONS
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
      .filter(payment =>
        String(payment.buyerId) ===
        String(buyer.id)
      )
      .reduce(
        (sum, payment) =>
          sum +
          Number(payment.amount || 0),
        0
      );

  return Math.max(
    0,
    total - initial - payments
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
      .filter(payment =>
        String(payment.giveId) ===
        String(record.id)
      )
      .reduce(
        (sum, payment) =>
          sum +
          Number(payment.amount || 0),
        0
      );

  return Math.max(
    0,
    total - alreadyPaid - payments
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

  const directPaid =
    Number(
      emi.paidAmount ??
      emi.paid ??
      0
    );

  const payments =
    (
      walletData.emiPayments || []
    )
      .filter(payment =>
        String(payment.emiId) ===
        String(emi.id)
      )
      .reduce(
        (sum, payment) =>
          sum +
          Number(payment.amount || 0),
        0
      );

  return Math.max(
    0,
    total - directPaid - payments
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
    Number(transaction.amount || 0);

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    return false;

  }


  const type =
    transaction.type;


  const account =
    getAccountById(
      transaction.accountId
    );


  /*
    Income increases account balance.
  */

  if (
    type === "income" &&
    account
  ) {

    setAccountBalance(
      account,
      getAccountBalance(account) +
      amount
    );

  }


  /*
    Expense decreases account balance.
  */

  if (
    type === "expense" &&
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


  const newTransaction = {

    id:
      transaction.id ||
      generateId("txn"),

    type: type || "other",

    amount: amount,

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
  */

  Object.keys(transaction)
    .forEach(key => {

      if (
        newTransaction[key] ===
        undefined
      ) {

        newTransaction[key] =
          transaction[key];

      }

    });


  walletData.transactions.unshift(
    newTransaction
  );


  saveWalletData();

  updateDashboard();

  return newTransaction;

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

    name: name,

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


  if (!fromAccount || !toAccount) {

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
    Remove from source account.
  */

  setAccountBalance(
    fromAccount,
    sourceBalance -
    transferAmount
  );


  /*
    Add to destination account.
  */

  setAccountBalance(
    toAccount,
    getAccountBalance(toAccount) +
    transferAmount
  );


  /*
    IMPORTANT:
    Transfer is NOT income.
    Transfer is NOT expense.
  */

  const transferId =
    generateId("transfer");


  const baseTransaction = {

    id: transferId,

    type: "transfer",

    amount: transferAmount,

    fromAccountId:
      fromAccount.id,

    toAccountId:
      toAccount.id,

    accountId:
      fromAccount.id,

    date:
      date || todayString(),

    note:
      note || "",

    description:
      note ||
      `Transfer from ${getAccountName(fromAccount)} to ${getAccountName(toAccount)}`,

    createdAt:
      new Date().toISOString()

  };


  walletData.transactions.unshift({

    ...baseTransaction,

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

    name: name,

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


  if (!buyer || !account) {
    return false;
  }


  if (
    !Number.isFinite(paymentAmount) ||
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
    Therefore account balance increases.
  */

  setAccountBalance(
    account,
    getAccountBalance(account) +
    paymentAmount
  );


  const payment = {

    id:
      generateId("buyer_payment"),

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
      generateId("txn"),

    type:
      "buyer_payment",

    amount:
      paymentAmount,

    accountId:
      account.id,

    buyerId:
      buyer.id,

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
    walletData[collectionName].findIndex(
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


  moveToTrash(
    collectionName,
    record
  );


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


  const trashItem =
    walletData.trash[index];


  if (
    !trashItem.data ||
    !trashItem.type
  ) {

    return false;

  }


  const collection =
    trashItem.type;


  if (
    !Array.isArray(
      walletData[collection]
    )
  ) {

    return false;

  }


  /*
    Avoid duplicate restoration.
  */

  const alreadyExists =
    walletData[collection].some(
      item =>
        String(item.id) ===
        String(
          trashItem.data.id
        )
    );


  if (!alreadyExists) {

    walletData[collection].push(
      deepClone(
        trashItem.data
      )
    );

  }


  walletData.trash.splice(
    index,
    1
  );


  saveWalletData();

  updateDashboard();

  return true;

}


/* =========================================================
   RESTORE ALL
   ========================================================= */

function restoreAllFromTrash() {

  const trashItems =
    [...walletData.trash];


  trashItems.reverse()
    .forEach(item => {

      if (
        item.data &&
        item.type &&
        Array.isArray(
          walletData[item.type]
        )
      ) {

        const exists =
          walletData[item.type].some(
            record =>
              String(record.id) ===
              String(item.data.id)
          );


        if (!exists) {

          walletData[item.type].push(
            deepClone(item.data)
          );

        }

      }

    });


  walletData.trash = [];

  saveWalletData();

  updateDashboard();

  return true;

}


/* =========================================================
   DASHBOARD
   ========================================================= */

function updateDashboard() {

  /*
    Dashboard elements are optional because
    app.js is shared by every page.
  */

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
      .map(account => {

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
                  account.type || "Account"
                )}
              </small>
            </div>

            <strong>
              ${escapeHtml(
                formatMoney(
                  getAccountBalance(account)
                )
              )}
            </strong>

          </div>
        `;

      })
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
      .map(transaction => {

        let sign = "";

        if (
          transaction.type ===
            "income" ||
          transaction.type ===
            "buyer_payment"
        ) {

          sign = "+";

        } else if (
          transaction.type ===
          "expense"
        ) {

          sign = "-";

        }


        let title =
          transaction.description ||
          transaction.category ||
          "Transaction";


        if (
          transaction.type ===
          "transfer"
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

      })
      .join("");

}


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function goToPage(page) {

  const pageMap = {

    home:
      "../index.html",

    dashboard:
      "pages/dashboard.html",

    income:
      "pages/income.html",

    expense:
      "pages/expense.html",

    accounts:
      "pages/accounts.html",

    transfer:
      "pages/transfer.html",

    transactions:
      "pages/transactions.html",

    buyers:
      "pages/buyers.html",

    giveMoney:
      "pages/give-money.html",

    emi:
      "pages/emi.html",

    recurring:
      "pages/recurring.html",

    reports:
      "pages/reports.html",

    calculator:
      "pages/calculator.html",

    notifications:
      "pages/notifications.html",

    settings:
      "pages/settings.html",

    security:
      "pages/security.html",

    profile:
      "pages/profile.html",

    privacy:
      "pages/privacy.html",

    about:
      "pages/about.html",

    more:
      "pages/more.html",

    trash:
      "pages/trash.html",

    netWorth:
      "pages/net-worth.html",

    search:
      "pages/search.html",

    backup:
      "pages/backup.html",

    attachments:
      "pages/attachments.html",

    export:
      "pages/export.html",

    quickAdd:
      "pages/quick-add.html",

    calendar:
      "pages/calendar.html"

  };


  if (pageMap[page]) {

    window.location.href =
      pageMap[page];

  }

}


/* =========================================================
   GLOBAL OBJECT
   ========================================================= */

window.TamilandaWallet = {

  /* Data */

  getData: () =>
    walletData,

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
