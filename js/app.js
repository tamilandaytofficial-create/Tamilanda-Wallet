/* =========================================================
   TAMILANDA WALLET
   Core Application Engine
   ========================================================= */


/* =========================================================
   STORAGE
   ========================================================= */

const STORAGE_KEY = "tamilanda_wallet_data";


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
   DEEP CLONE
   ========================================================= */

function cloneDefaultData() {

  return JSON.parse(
    JSON.stringify(
      DEFAULT_WALLET_DATA
    )
  );

}


/* =========================================================
   MERGE DATA SAFELY
   ========================================================= */

function normalizeWalletData(data) {

  const defaults =
    cloneDefaultData();


  const source =
    data &&
    typeof data === "object"
      ? data
      : {};


  const merged = {

    ...defaults,

    ...source

  };


  merged.categories = {

    ...defaults.categories,

    ...(source.categories || {})

  };


  merged.settings = {

    ...defaults.settings,

    ...(source.settings || {})

  };


  merged.profile = {

    ...defaults.profile,

    ...(source.profile || {})

  };


  merged.security = {

    ...defaults.security,

    ...(source.security || {})

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
          merged[key]
        )
      ) {

        merged[key] = [];

      }

    }
  );


  return merged;

}


/* =========================================================
   LOAD
   ========================================================= */

function loadWalletData() {

  try {

    const saved =
      localStorage.getItem(
        STORAGE_KEY
      );


    if (!saved) {

      const fresh =
        cloneDefaultData();


      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(fresh)
      );


      return fresh;

    }


    const parsed =
      JSON.parse(saved);


    const normalized =
      normalizeWalletData(
        parsed
      );


    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(normalized)
    );


    return normalized;

  } catch (error) {

    console.error(
      "Tamilanda Wallet load error:",
      error
    );


    return cloneDefaultData();

  }

}


/* =========================================================
   GLOBAL DATA
   ========================================================= */

let walletData =
  loadWalletData();


/* =========================================================
   SAVE
   ========================================================= */

function saveWalletData(
  data = walletData
) {

  walletData =
    normalizeWalletData(
      data
    );


  try {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        walletData
      )
    );


    window.dispatchEvent(
      new CustomEvent(
        "walletDataUpdated"
      )
    );


    return true;

  } catch (error) {

    console.error(
      "Tamilanda Wallet save error:",
      error
    );


    return false;

  }

}


/* =========================================================
   BASIC HELPERS
   ========================================================= */

function generateId(
  prefix = "id"
) {

  return (

    prefix +

    "_" +

    Date.now().toString(36) +

    "_" +

    Math.random()
      .toString(36)
      .substring(2, 8)

  );

}


function todayString() {

  const date =
    new Date();


  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");


  const day =
    String(
      date.getDate()
    ).padStart(2, "0");


  return `${year}-${month}-${day}`;

}


function formatMoney(
  value
) {

  const amount =
    Number(value) || 0;


  const symbol =
    walletData.settings &&
    walletData.settings.currencySymbol
      ? walletData.settings.currencySymbol
      : "₹";


  return (

    symbol +

    amount.toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    )

  );

}


function escapeHtml(
  value
) {

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


function formatDisplayDate(
  value
) {

  if (!value) {

    return "-";

  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return String(value);

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


/* =========================================================
   NUMBER HELPERS
   ========================================================= */

function numberValue(
  value
) {

  return Number(value) || 0;

}


function getAccountById(
  accountId
) {

  return walletData.accounts.find(
    account =>
      String(account.id) ===
      String(accountId)
  );

}


function getTransactionById(
  transactionId
) {

  return walletData.transactions.find(
    transaction =>
      String(transaction.id) ===
      String(transactionId)
  );

}


/* =========================================================
   ACCOUNT BALANCE
   ========================================================= */

function calculateTotalBalance() {

  return walletData.accounts.reduce(
    (
      total,
      account
    ) => {

      return (
        total +
        numberValue(
          account.balance
        )
      );

    },
    0
  );

}


/* =========================================================
   TODAY INCOME
   ========================================================= */

function calculateTodayIncome() {

  const today =
    todayString();


  return walletData.transactions.reduce(
    (
      total,
      transaction
    ) => {

      if (
        transaction.type ===
        "income" &&
        transaction.date ===
        today
      ) {

        return (
          total +
          numberValue(
            transaction.amount
          )
        );

      }


      return total;

    },
    0
  );

}


/* =========================================================
   TODAY EXPENSE
   ========================================================= */

function calculateTodayExpense() {

  const today =
    todayString();


  return walletData.transactions.reduce(
    (
      total,
      transaction
    ) => {

      if (
        transaction.type ===
        "expense" &&
        transaction.date ===
        today
      ) {

        return (
          total +
          numberValue(
            transaction.amount
          )
        );

      }


      return total;

    },
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
   BUYER RECEIVABLE
   ========================================================= */

function getBuyerReceived(
  buyerId
) {

  const buyer =
    walletData.buyers.find(
      item =>
        String(item.id) ===
        String(buyerId)
    );


  if (!buyer) {

    return 0;

  }


  const initial =
    numberValue(
      buyer.initialPayment
    );


  const payments =
    walletData.buyerPayments
      .filter(
        payment =>
          String(
            payment.buyerId
          ) ===
          String(buyerId)
      )
      .reduce(
        (
          total,
          payment
        ) =>
          total +
          numberValue(
            payment.amount
          ),
        0
      );


  return (
    initial +
    payments
  );

}


function getBuyerRemaining(
  buyer
) {

  if (!buyer) {

    return 0;

  }


  const total =
    numberValue(
      buyer.totalAmount
    );


  return Math.max(
    0,
    total -
    getBuyerReceived(
      buyer.id
    )
  );

}


function calculateMoneyToReceive() {

  return walletData.buyers.reduce(
    (
      total,
      buyer
    ) => {

      return (
        total +
        getBuyerRemaining(
          buyer
        )
      );

    },
    0
  );

}


/* =========================================================
   MONEY TO GIVE
   ========================================================= */

function getGivePaid(
  giveId
) {

  const item =
    walletData.moneyToGive.find(
      record =>
        String(record.id) ===
        String(giveId)
    );


  if (!item) {

    return 0;

  }


  const initial =
    numberValue(
      item.alreadyPaid ??
      item.paid ??
      item.initialPayment
    );


  const payments =
    walletData.givePayments
      .filter(
        payment =>
          String(
            payment.giveId
          ) ===
          String(giveId)
      )
      .reduce(
        (
          total,
          payment
        ) =>
          total +
          numberValue(
            payment.amount
          ),
        0
      );


  return (
    initial +
    payments
  );

}


function getGiveRemaining(
  item
) {

  if (!item) {

    return 0;

  }


  const total =
    numberValue(
      item.totalAmount ??
      item.amount
    );


  return Math.max(
    0,
    total -
    getGivePaid(
      item.id
    )
  );

}


function calculateMoneyToGive() {

  return walletData.moneyToGive.reduce(
    (
      total,
      item
    ) => {

      return (
        total +
        getGiveRemaining(
          item
        )
      );

    },
    0
  );

}


/* =========================================================
   OWN EMI
   ========================================================= */

function getEmiPaid(
  emiId
) {

  const emi =
    walletData.myEmis.find(
      item =>
        String(item.id) ===
        String(emiId)
    );


  if (!emi) {

    return 0;

  }


  const initial =
    numberValue(
      emi.alreadyPaid ??
      emi.paid ??
      emi.initialPayment
    );


  const payments =
    walletData.emiPayments
      .filter(
        payment =>
          String(
            payment.emiId
          ) ===
          String(emiId)
      )
      .reduce(
        (
          total,
          payment
        ) =>
          total +
          numberValue(
            payment.amount
          ),
        0
      );


  return (
    initial +
    payments
  );

}


function getEmiRemaining(
  emi
) {

  if (!emi) {

    return 0;

  }


  const total =
    numberValue(
      emi.totalAmount ??
      emi.total ??
      emi.amount
    );


  const paid =
    getEmiPaid(
      emi.id
    );


  return Math.max(
    0,
    total - paid
  );

}


function calculateEmiToPay() {

  return walletData.myEmis.reduce(
    (
      total,
      emi
    ) => {

      return (
        total +
        getEmiRemaining(
          emi
        )
      );

    },
    0
  );

}


/* =========================================================
   NET WORTH
   ========================================================= */

function calculateTotalAssets() {

  return (

    calculateTotalBalance() +

    calculateMoneyToReceive()

  );

}


function calculateTotalLiabilities() {

  return (

    calculateMoneyToGive() +

    calculateEmiToPay()

  );

}


function calculateNetWorth() {

  return (

    calculateTotalAssets() -

    calculateTotalLiabilities()

  );

}


/* =========================================================
   TRASH
   ========================================================= */

function moveToTrash(
  type,
  data,
  meta = {}
) {

  if (!data) {

    return false;

  }


  walletData.trash.push({

    id:
      generateId("trash"),

    type,

    deletedAt:
      new Date().toISOString(),

    title:
      meta.title ||
      data.name ||
      data.title ||
      data.category ||
      type,

    amount:
      numberValue(
        meta.amount ??
        data.amount ??
        data.totalAmount
      ),

    data:
      JSON.parse(
        JSON.stringify(data)
      ),

    meta

  });


  saveWalletData();


  return true;

}


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


  const item =
    walletData.trash[index];


  const destinationMap = {

    transaction:
      "transactions",

    buyer:
      "buyers",

    account:
      "accounts",

    give:
      "moneyToGive",

    emi:
      "myEmis",

    recurring:
      "recurringBills"

  };


  const destination =
    destinationMap[
      item.type
    ];


  if (
    !destination ||
    !item.data
  ) {

    return false;

  }


  if (
    !Array.isArray(
      walletData[destination]
    )
  ) {

    walletData[destination] = [];

  }


  walletData[destination].push(
    item.data
  );


  walletData.trash.splice(
    index,
    1
  );


  saveWalletData();


  return true;

}


/* =========================================================
   TRANSACTION ENGINE
   ========================================================= */

function addTransaction(
  transaction
) {

  if (!transaction) {

    return null;

  }


  const amount =
    numberValue(
      transaction.amount
    );


  if (amount <= 0) {

    return null;

  }


  const type =
    transaction.type ===
    "expense"
      ? "expense"
      : "income";


  const accountId =
    transaction.accountId ||
    null;


  const date =
    transaction.date ||
    todayString();


  const record = {

    id:
      transaction.id ||
      generateId("txn"),

    type,

    amount,

    category:
      transaction.category ||
      "Other",

    note:
      transaction.note ||
      "",

    accountId,

    date,

    createdAt:
      transaction.createdAt ||
      new Date().toISOString()

  };


  walletData.transactions.push(
    record
  );


  /*
   * Account balance
   */

  if (accountId) {

    const account =
      getAccountById(
        accountId
      );


    if (account) {

      if (type === "income") {

        account.balance =
          numberValue(
            account.balance
          ) +
          amount;

      } else {

        account.balance =
          numberValue(
            account.balance
          ) -
          amount;

      }

    }

  }


  saveWalletData();


  updateDashboard();


  return record;

}


/* =========================================================
   ADD ACCOUNT
   ========================================================= */

function addAccount(
  account
) {

  if (!account) {

    return null;

  }


  const openingBalance =
    numberValue(
      account.openingBalance ??
      account.balance
    );


  const record = {

    id:
      account.id ||
      generateId("acc"),

    name:
      account.name ||
      "Account",

    type:
      account.type ||
      "Bank",

    bankName:
      account.bankName ||
      "",

    accountNumber:
      account.accountNumber ||
      "",

    balance:
      openingBalance,

    openingBalance,

    note:
      account.note ||
      "",

    createdAt:
      account.createdAt ||
      new Date().toISOString()

  };


  walletData.accounts.push(
    record
  );


  saveWalletData();


  updateDashboard();


  return record;

}


/* =========================================================
   ADD BUYER
   ========================================================= */

function addBuyer(
  buyer
) {

  if (!buyer) {

    return null;

  }


  const record = {

    id:
      buyer.id ||
      generateId("buyer"),

    name:
      buyer.name ||
      "",

    phone:
      buyer.phone ||
      "",

    ffId:
      buyer.ffId ||
      buyer.accountId ||
      "",

    totalAmount:
      numberValue(
        buyer.totalAmount
      ),

    initialPayment:
      numberValue(
        buyer.initialPayment
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
    record
  );


  saveWalletData();


  return record;

}


/* =========================================================
   BANK TRANSFER
   ========================================================= */

function transferBetweenAccounts(
  fromAccountId,
  toAccountId,
  amount,
  note = ""
) {

  const transferAmount =
    numberValue(amount);


  if (
    transferAmount <= 0 ||
    !fromAccountId ||
    !toAccountId ||
    String(fromAccountId) ===
      String(toAccountId)
  ) {

    return false;

  }


  const from =
    getAccountById(
      fromAccountId
    );


  const to =
    getAccountById(
      toAccountId
    );


  if (!from || !to) {

    return false;

  }


  if (
    numberValue(
      from.balance
    ) <
    transferAmount
  ) {

    return false;

  }


  from.balance =
    numberValue(
      from.balance
    ) -
    transferAmount;


  to.balance =
    numberValue(
      to.balance
    ) +
    transferAmount;


  const transferId =
    generateId("transfer");


  walletData.transactions.push({

    id:
      transferId +

      "_out",

    type:
      "transfer",

    direction:
      "out",

    amount:
      transferAmount,

    accountId:
      fromAccountId,

    transferId,

    note,

    date:
      todayString(),

    createdAt:
      new Date().toISOString()

  });


  walletData.transactions.push({

    id:
      transferId +

      "_in",

    type:
      "transfer",

    direction:
      "in",

    amount:
      transferAmount,

    accountId:
      toAccountId,

    transferId,

    note,

    date:
      todayString(),

    createdAt:
      new Date().toISOString()

  });


  saveWalletData();


  updateDashboard();


  return true;

}


/* =========================================================
   BUYER PAYMENT
   ========================================================= */

function addBuyerPayment(
  buyerId,
  amount,
  accountId,
  note = "",
  date = todayString()
) {

  const paymentAmount =
    numberValue(amount);


  if (
    paymentAmount <= 0
  ) {

    return false;

  }


  const buyer =
    walletData.buyers.find(
      item =>
        String(item.id) ===
        String(buyerId)
    );


  if (!buyer) {

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


  const account =
    getAccountById(
      accountId
    );


  if (!account) {

    return false;

  }


  walletData.buyerPayments.push({

    id:
      generateId("buyerpay"),

    buyerId,

    amount:
      paymentAmount,

    accountId,

    note,

    date,

    createdAt:
      new Date().toISOString()

  });


  account.balance =
    numberValue(
      account.balance
    ) +
    paymentAmount;


  walletData.transactions.push({

    id:
      generateId("txn"),

    type:
      "income",

    amount:
      paymentAmount,

    category:
      "FF EMI Payment",

    note:
      note ||
      `Payment from ${buyer.name}`,

    accountId,

    buyerId,

    date,

    createdAt:
      new Date().toISOString()

  });


  saveWalletData();


  updateDashboard();


  return true;

}


/* =========================================================
   GENERIC DELETE
   ========================================================= */

function deleteRecord(
  type,
  id
) {

  const map = {

    transaction:
      "transactions",

    buyer:
      "buyers",

    account:
      "accounts",

    give:
      "moneyToGive",

    emi:
      "myEmis",

    recurring:
      "recurringBills"

  };


  const key =
    map[type];


  if (!key) {

    return false;

  }


  const index =
    walletData[key].findIndex(
      item =>
        String(item.id) ===
        String(id)
    );


  if (index === -1) {

    return false;

  }


  const item =
    walletData[key][index];


  moveToTrash(
    type,
    item
  );


  walletData[key].splice(
    index,
    1
  );


  saveWalletData();


  return true;

}


/* =========================================================
   DASHBOARD
   ========================================================= */

function updateDashboard() {

  const balance =
    calculateTotalBalance();


  const income =
    calculateTodayIncome();


  const expense =
    calculateTodayExpense();


  const profit =
    calculateTodayProfit();


  const receive =
    calculateMoneyToReceive();


  const give =
    calculateMoneyToGive();


  const emi =
    calculateEmiToPay();


  const elements = {

    totalBalance:
      balance,

    todayIncome:
      income,

    todayExpense:
      expense,

    todayProfit:
      profit,

    moneyToReceive:
      receive,

    moneyToGive:
      give,

    emiToPay:
      emi

  };


  Object.keys(elements)
    .forEach(
      id => {

        const element =
          document.getElementById(
            id
          );


        if (element) {

          element.textContent =
            formatMoney(
              elements[id]
            );

        }

      }
    );


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


  if (
    walletData.accounts.length ===
    0
  ) {

    container.innerHTML = `

      <div class="empty-state">

        No accounts added yet.

      </div>

    `;

    return;

  }


  container.innerHTML =
    walletData.accounts
      .slice(0, 5)
      .map(
        account => `

          <div class="list-item">

            <div>

              <strong>
                ${escapeHtml(
                  account.name
                )}
              </strong>

              <div class="muted">
                ${escapeHtml(
                  account.type
                )}
              </div>

            </div>

            <strong>
              ${escapeHtml(
                formatMoney(
                  account.balance
                )
              )}
            </strong>

          </div>

        `
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
    [...walletData.transactions]
      .sort(
        (
          a,
          b
        ) =>
          new Date(
            b.createdAt ||
            b.date ||
            0
          ) -
          new Date(
            a.createdAt ||
            a.date ||
            0
          )
      )
      .slice(0, 5);


  if (
    transactions.length ===
    0
  ) {

    container.innerHTML = `

      <div class="empty-state">

        No transactions yet.

      </div>

    `;

    return;

  }


  container.innerHTML =
    transactions
      .map(
        transaction => {

          const sign =
            transaction.type ===
            "expense"
              ? "-"
              : transaction.type ===
                "income"
                ? "+"
                : "";


          return `

            <div class="list-item">

              <div>

                <strong>
                  ${escapeHtml(
                    transaction.category ||
                    transaction.type
                  )}
                </strong>

                <div class="muted">
                  ${escapeHtml(
                    formatDisplayDate(
                      transaction.date
                    )
                  )}
                </div>

              </div>

              <strong>
                ${sign}
                ${escapeHtml(
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
   NAVIGATION
   ========================================================= */

function setupNavigation() {

  document
    .querySelectorAll(
      "[data-page]"
    )
    .forEach(
      element => {

        element.addEventListener(
          "click",
          () => {

            handleNavigation(
              element.dataset.page
            );

          }
        );

      }
    );

}


function handleNavigation(
  page
) {

  const pageMap = {

    home:
      "index.html",

    dashboard:
      "pages/dashboard.html",

    income:
      "pages/income.html",

    expense:
      "pages/expense.html",

    accounts:
      "pages/accounts.html",

    transactions:
      "pages/transactions.html",

    buyers:
      "pages/buyers.html",

    "give-money":
      "pages/give-money.html",

    emi:
      "pages/emi.html",

    reports:
      "pages/reports.html",

    calculator:
      "pages/calculator.html",

    settings:
      "pages/settings.html",

    recurring:
      "pages/recurring.html",

    more:
      "pages/more.html",

    privacy:
      "pages/privacy.html",

    about:
      "pages/about.html",

    notifications:
      "pages/notifications.html",

    profile:
      "pages/profile.html",

    security:
      "pages/security.html",

    trash:
      "pages/trash.html"

  };


  const target =
    pageMap[page];


  if (!target) {

    showComingSoon(
      page
    );

    return;

  }


  const currentPath =
    window.location.pathname;


  /*
   * Root pages
   */

  if (
    currentPath.endsWith(
      "/index.html"
    ) ||
    currentPath.endsWith("/")
  ) {

    window.location.href =
      target;

    return;

  }


  /*
   * Pages inside /pages/
   */

  if (
    currentPath.includes(
      "/pages/"
    )
  ) {

    if (
      target.startsWith(
        "pages/"
      )
    ) {

      window.location.href =
        target.replace(
          "pages/",
          "./"
        );

    } else {

      window.location.href =
        "../" +
        target;

    }

    return;

  }


  window.location.href =
    target;

}


/* =========================================================
   NAV ACTIVE STATE
   ========================================================= */

function activateNavigation() {

  const current =
    window.location.pathname;


  document
    .querySelectorAll(
      ".nav-item[data-page]"
    )
    .forEach(
      item => {

        const page =
          item.dataset.page;


        let match = false;


        if (
          page === "home" &&
          (
            current.endsWith(
              "/index.html"
            ) ||
            current.endsWith("/")
          )
        ) {

          match = true;

        }


        if (
          page === "transactions" &&
          current.includes(
            "transactions.html"
          )
        ) {

          match = true;

        }


        if (
          page === "buyers" &&
          current.includes(
            "buyers.html"
          )
        ) {

          match = true;

        }


        if (
          page === "accounts" &&
          current.includes(
            "accounts.html"
          )
        ) {

          match = true;

        }


        if (
          page === "more" &&
          current.includes(
            "more.html"
          )
        ) {

          match = true;

        }


        item.classList.toggle(
          "active",
          match
        );

      }
    );

}


/* =========================================================
   QUICK ACTIONS
   ========================================================= */

function setupQuickActions() {

  const incomeButton =
    document.getElementById(
      "addIncomeButton"
    );


  if (incomeButton) {

    incomeButton.addEventListener(
      "click",
      () => {

        handleNavigation(
          "income"
        );

      }
    );

  }


  const expenseButton =
    document.getElementById(
      "addExpenseButton"
    );


  if (expenseButton) {

    expenseButton.addEventListener(
      "click",
      () => {

        handleNavigation(
          "expense"
        );

      }
    );

  }


  const buyerButton =
    document.getElementById(
      "addBuyerButton"
    );


  if (buyerButton) {

    buyerButton.addEventListener(
      "click",
      () => {

        handleNavigation(
          "buyers"
        );

      }
    );

  }


  const emiButton =
    document.getElementById(
      "addEmiButton"
    );


  if (emiButton) {

    emiButton.addEventListener(
      "click",
      () => {

        handleNavigation(
          "emi"
        );

      }
    );

  }

}


/* =========================================================
   OTHER BUTTONS
   ========================================================= */

function setupOtherButtons() {

  const settingsButton =
    document.getElementById(
      "settingsButton"
    );


  if (settingsButton) {

    settingsButton.addEventListener(
      "click",
      () => {

        handleNavigation(
          "settings"
        );

      }
    );

  }


  const accountsButton =
    document.getElementById(
      "viewAccountsButton"
    );


  if (accountsButton) {

    accountsButton.addEventListener(
      "click",
      () => {

        handleNavigation(
          "accounts"
        );

      }
    );

  }


  const transactionsButton =
    document.getElementById(
      "viewTransactionsButton"
    );


  if (transactionsButton) {

    transactionsButton.addEventListener(
      "click",
      () => {

        handleNavigation(
          "transactions"
        );

      }
    );

  }

}


/* =========================================================
   COMING SOON
   ========================================================= */

function showComingSoon(
  feature
) {

  alert(
    feature +
    " is coming soon."
  );

}


/* =========================================================
   DATA UPDATE LISTENER
   ========================================================= */

window.addEventListener(
  "walletDataUpdated",
  () => {

    updateDashboard();

  }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

function initializeWallet() {

  walletData =
    normalizeWalletData(
      walletData
    );


  setupNavigation();

  setupQuickActions();

  setupOtherButtons();

  activateNavigation();

  updateDashboard();

}


/* =========================================================
   PUBLIC API
   ========================================================= */

window.TamilandaWallet = {

  getData: () =>
    walletData,

  save: () =>
    saveWalletData(),

  updateDashboard,

  addTransaction,

  addAccount,

  addBuyer,

  addBuyerPayment,

  transferBetweenAccounts,

  deleteRecord,

  moveToTrash,

  restoreFromTrash,

  formatMoney,

  todayString,

  generateId,

  escapeHtml,

  formatDisplayDate,

  calculateTotalBalance,

  calculateTodayIncome,

  calculateTodayExpense,

  calculateTodayProfit,

  calculateMoneyToReceive,

  calculateMoneyToGive,

  calculateEmiToPay,

  calculateTotalAssets,

  calculateTotalLiabilities,

  calculateNetWorth,

  getBuyerRemaining,

  getGiveRemaining,

  getEmiRemaining

};


/* =========================================================
   START
   ========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initializeWallet
  );

} else {

  initializeWallet();

}
