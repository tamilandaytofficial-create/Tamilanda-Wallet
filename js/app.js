"use strict";

/*
 * TAMILANDA WALLET
 * Main Application Controller
 *
 * Version: 1.0
 *
 * Data structure is intentionally local-first.
 * Future modules will connect:
 * - Income
 * - Expense
 * - Accounts
 * - Buyers / EMI
 * - Money To Give
 * - My EMI
 * - Reports
 * - Backup / Restore
 */


/* =========================================
   STORAGE
========================================= */

const STORAGE_KEY = "tamilanda_wallet_data";


const defaultData = {
    accounts: [],
    transactions: [],
    buyers: [],
    buyerPayments: [],
    moneyToGive: [],
    myEmis: [],
    emiPayments: [],
    recurringBills: [],
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
    }
};


function loadWalletData() {

    try {

        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return structuredClone(defaultData);
        }

        const parsed = JSON.parse(saved);

        return {
            ...structuredClone(defaultData),
            ...parsed,

            categories: {
                ...structuredClone(defaultData.categories),
                ...(parsed.categories || {})
            },

            settings: {
                ...structuredClone(defaultData.settings),
                ...(parsed.settings || {})
            }
        };

    } catch (error) {

        console.error(
            "Failed to load wallet data:",
            error
        );

        return structuredClone(defaultData);
    }
}


function saveWalletData(data) {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data)
        );

        return true;

    } catch (error) {

        console.error(
            "Failed to save wallet data:",
            error
        );

        return false;
    }
}


let walletData = loadWalletData();


/* =========================================
   HELPERS
========================================= */

function formatMoney(amount) {

    const value = Number(amount) || 0;

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }
    ).format(value);
}


function todayString() {

    const now = new Date();

    const year = now.getFullYear();

    const month = String(
        now.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        now.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function generateId(prefix = "id") {

    return (
        prefix +
        "_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 8)
    );
}


function getElement(id) {

    return document.getElementById(id);
}


/* =========================================
   ACCOUNT CALCULATIONS
========================================= */

function calculateTotalBalance() {

    return walletData.accounts.reduce(
        (total, account) => {

            return total + (
                Number(account.balance) || 0
            );

        },
        0
    );
}


function calculateTodayIncome() {

    const today = todayString();

    return walletData.transactions
        .filter(transaction => {

            return (
                transaction.type === "income" &&
                transaction.date === today
            );

        })
        .reduce(
            (total, transaction) => {

                return total + (
                    Number(transaction.amount) || 0
                );

            },
            0
        );
}


function calculateTodayExpense() {

    const today = todayString();

    return walletData.transactions
        .filter(transaction => {

            return (
                transaction.type === "expense" &&
                transaction.date === today
            );

        })
        .reduce(
            (total, transaction) => {

                return total + (
                    Number(transaction.amount) || 0
                );

            },
            0
        );
}


function calculateTodayProfit() {

    return (
        calculateTodayIncome() -
        calculateTodayExpense()
    );
}


function calculateMoneyToReceive() {

    return walletData.buyers.reduce(
        (total, buyer) => {

            if (buyer.status === "completed") {
                return total;
            }

            return total + (
                Number(buyer.remaining) || 0
            );

        },
        0
    );
}


function calculateMoneyToGive() {

    return walletData.moneyToGive.reduce(
        (total, item) => {

            if (item.status === "paid") {
                return total;
            }

            return total + (
                Number(item.remaining) || 0
            );

        },
        0
    );
}


function calculateEmiToPay() {

    return walletData.myEmis.reduce(
        (total, emi) => {

            if (emi.status === "completed") {
                return total;
            }

            return total + (
                Number(emi.nextPaymentAmount) || 0
            );

        },
        0
    );
}


/* =========================================
   DASHBOARD
========================================= */

function updateDashboard() {

    const totalBalance =
        calculateTotalBalance();

    const todayIncome =
        calculateTodayIncome();

    const todayExpense =
        calculateTodayExpense();

    const todayProfit =
        todayIncome - todayExpense;

    const moneyToReceive =
        calculateMoneyToReceive();

    const moneyToGive =
        calculateMoneyToGive();

    const emiToPay =
        calculateEmiToPay();


    const balanceElement =
        getElement("totalBalance");

    if (balanceElement) {
        balanceElement.textContent =
            formatMoney(totalBalance);
    }


    const incomeElement =
        getElement("todayIncome");

    if (incomeElement) {
        incomeElement.textContent =
            formatMoney(todayIncome);
    }


    const expenseElement =
        getElement("todayExpense");

    if (expenseElement) {
        expenseElement.textContent =
            formatMoney(todayExpense);
    }


    const profitElement =
        getElement("todayProfit");

    if (profitElement) {

        profitElement.textContent =
            formatMoney(todayProfit);

        profitElement.style.color =
            todayProfit >= 0
                ? "var(--gold)"
                : "var(--red)";
    }


    const receiveElement =
        getElement("moneyToReceive");

    if (receiveElement) {
        receiveElement.textContent =
            formatMoney(moneyToReceive);
    }


    const giveElement =
        getElement("moneyToGive");

    if (giveElement) {
        giveElement.textContent =
            formatMoney(moneyToGive);
    }


    const emiElement =
        getElement("emiToPay");

    if (emiElement) {
        emiElement.textContent =
            formatMoney(emiToPay);
    }


    renderAccountsPreview();

    renderRecentTransactions();
}


/* =========================================
   ACCOUNTS PREVIEW
========================================= */

function renderAccountsPreview() {

    const container =
        getElement("accountsPreview");

    if (!container) {
        return;
    }


    if (walletData.accounts.length === 0) {

        container.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    🏦
                </div>

                <strong>
                    No accounts added
                </strong>

                <small>
                    Add your bank account or cash
                </small>

            </div>
        `;

        return;
    }


    const accounts =
        walletData.accounts.slice(0, 4);


    container.innerHTML =
        accounts.map(account => {

            return `
                <div class="account-preview-item">

                    <div class="account-preview-left">

                        <div class="account-icon">
                            🏦
                        </div>

                        <div>

                            <div class="account-name">
                                ${escapeHtml(account.name)}
                            </div>

                            <div class="account-type">
                                ${escapeHtml(account.type || "Account")}
                            </div>

                        </div>

                    </div>

                    <div class="account-balance">
                        ${formatMoney(account.balance)}
                    </div>

                </div>
            `;

        }).join("");
}


/* =========================================
   RECENT TRANSACTIONS
========================================= */

function renderRecentTransactions() {

    const container =
        getElement("recentTransactions");

    if (!container) {
        return;
    }


    if (walletData.transactions.length === 0) {

        container.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    📜
                </div>

                <strong>
                    No transactions yet
                </strong>

                <small>
                    Your recent income and expenses
                    will appear here
                </small>

            </div>
        `;

        return;
    }


    const recent =
        [...walletData.transactions]
            .sort(
                (a, b) =>
                    new Date(
                        b.createdAt || b.date
                    ) -
                    new Date(
                        a.createdAt || a.date
                    )
            )
            .slice(0, 5);


    container.innerHTML =
        recent.map(transaction => {

            const isIncome =
                transaction.type === "income";


            return `
                <div class="transaction-preview-item">

                    <div class="transaction-left">

                        <div class="
                            transaction-icon
                            ${isIncome ? "income" : "expense"}
                        ">
                            ${isIncome ? "↗" : "↘"}
                        </div>

                        <div>

                            <div class="transaction-title">
                                ${escapeHtml(
                                    transaction.title ||
                                    transaction.category ||
                                    "Transaction"
                                )}
                            </div>

                            <div class="transaction-meta">
                                ${escapeHtml(
                                    transaction.accountName ||
                                    "Account"
                                )}
                                •
                                ${formatDisplayDate(
                                    transaction.date
                                )}
                            </div>

                        </div>

                    </div>

                    <div class="
                        transaction-amount
                        ${isIncome ? "income" : "expense"}
                    ">
                        ${isIncome ? "+" : "−"}
                        ${formatMoney(transaction.amount)}
                    </div>

                </div>
            `;

        }).join("");
}


/* =========================================
   HTML SAFETY
========================================= */

function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================
   DATE FORMAT
========================================= */

function formatDisplayDate(dateValue) {

    if (!dateValue) {
        return "";
    }

    const date =
        new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return dateValue;
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short"
        }
    );
}


/* =========================================
   NAVIGATION
========================================= */

function setupNavigation() {

    const navItems =
        document.querySelectorAll(
            ".nav-item"
        );


    navItems.forEach(item => {

        item.addEventListener(
            "click",
            () => {

                navItems.forEach(nav => {
                    nav.classList.remove("active");
                });

                item.classList.add("active");


                const page =
                    item.dataset.page;


                handleNavigation(page);
            }
        );

    });
}


function handleNavigation(page) {

    /*
     * These sections will become separate
     * functional pages/modules.
     *
     * For now we keep navigation ready.
     */

    switch (page) {

        case "home":
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
            break;


        case "transactions":
            showComingSoon(
                "Transactions",
                "Transaction management will be added next."
            );
            break;


        case "buyers":
            showComingSoon(
                "Buyers & EMI",
                "Buyer and EMI management will be added next."
            );
            break;


        case "accounts":
            showComingSoon(
                "Accounts",
                "Bank and cash account management will be added next."
            );
            break;


        case "more":
            showComingSoon(
                "More",
                "Reports, calculator, EMI, backup and settings will be added next."
            );
            break;
    }
}


/* =========================================
   QUICK ACTIONS
========================================= */

function setupQuickActions() {

    const incomeButton =
        getElement("addIncomeButton");

    const expenseButton =
        getElement("addExpenseButton");

    const buyerButton =
        getElement("addBuyerButton");

    const emiButton =
        getElement("addEmiButton");


    if (incomeButton) {

        incomeButton.addEventListener(
            "click",
            () => {

                showComingSoon(
                    "Add Income",
                    "Income form will be added next."
                );

            }
        );
    }


    if (expenseButton) {

        expenseButton.addEventListener(
            "click",
            () => {

                showComingSoon(
                    "Add Expense",
                    "Expense form will be added next."
                );

            }
        );
    }


    if (buyerButton) {

        buyerButton.addEventListener(
            "click",
            () => {

                showComingSoon(
                    "Add Buyer",
                    "Buyer and EMI form will be added next."
                );

            }
        );
    }


    if (emiButton) {

        emiButton.addEventListener(
            "click",
            () => {

                showComingSoon(
                    "Add EMI",
                    "EMI management will be added next."
                );

            }
        );
    }
}


/* =========================================
   OTHER BUTTONS
========================================= */

function setupOtherButtons() {

    const settingsButton =
        getElement("settingsButton");

    const viewAccountsButton =
        getElement("viewAccountsButton");

    const viewTransactionsButton =
        getElement("viewTransactionsButton");


    if (settingsButton) {

        settingsButton.addEventListener(
            "click",
            () => {

                showComingSoon(
                    "Settings",
                    "Settings will be added later."
                );

            }
        );
    }


    if (viewAccountsButton) {

        viewAccountsButton.addEventListener(
            "click",
            () => {

                activateNavigation(
                    "accounts"
                );

            }
        );
    }


    if (viewTransactionsButton) {

        viewTransactionsButton.addEventListener(
            "click",
            () => {

                activateNavigation(
                    "transactions"
                );

            }
        );
    }
}


function activateNavigation(page) {

    const item =
        document.querySelector(
            `.nav-item[data-page="${page}"]`
        );

    if (item) {
        item.click();
    }
}


/* =========================================
   SIMPLE MESSAGE
========================================= */

function showComingSoon(title, message) {

    alert(
        `${title}\n\n${message}`
    );
}


/* =========================================
   DATA API
   Future screens can use these functions.
========================================= */

function addTransaction(transaction) {

    const newTransaction = {

        id: generateId("transaction"),

        type:
            transaction.type === "income"
                ? "income"
                : "expense",

        amount:
            Number(transaction.amount) || 0,

        title:
            transaction.title || "",

        category:
            transaction.category || "",

        accountId:
            transaction.accountId || "",

        accountName:
            transaction.accountName || "",

        date:
            transaction.date || todayString(),

        description:
            transaction.description || "",

        createdAt:
            new Date().toISOString()
    };


    walletData.transactions.push(
        newTransaction
    );


    saveWalletData(walletData);

    updateDashboard();


    return newTransaction;
}


function addAccount(account) {

    const newAccount = {

        id: generateId("account"),

        name:
            account.name || "Account",

        type:
            account.type || "BANK",

        balance:
            Number(account.balance) || 0,

        openingBalance:
            Number(account.openingBalance) || 0,

        createdAt:
            new Date().toISOString()
    };


    walletData.accounts.push(
        newAccount
    );


    saveWalletData(walletData);

    updateDashboard();


    return newAccount;
}


function addBuyer(buyer) {

    const total =
        Number(buyer.totalAmount) || 0;

    const initial =
        Number(buyer.initialPaid) || 0;


    const remaining =
        Math.max(
            0,
            total - initial
        );


    const newBuyer = {

        id: generateId("buyer"),

        name:
            buyer.name || "",

        phone:
            buyer.phone || "",

        ffId:
            buyer.ffId || "",

        totalAmount:
            total,

        initialPaid:
            initial,

        received:
            initial,

        remaining:
            remaining,

        emiDuration:
            buyer.emiDuration || "",

        startDate:
            buyer.startDate || todayString(),

        dueDate:
            buyer.dueDate || "",

        note:
            buyer.note || "",

        status:
            remaining <= 0
                ? "completed"
                : "active",

        createdAt:
            new Date().toISOString()
    };


    walletData.buyers.push(
        newBuyer
    );


    saveWalletData(walletData);

    updateDashboard();


    return newBuyer;
}


/* =========================================
   INITIALIZE
========================================= */

function initializeWallet() {

    setupNavigation();

    setupQuickActions();

    setupOtherButtons();

    updateDashboard();

    console.log(
        "Tamilanda Wallet initialized."
    );
}


document.addEventListener(
    "DOMContentLoaded",
    initializeWallet
);


/* =========================================
   GLOBAL ACCESS
   Helpful for future modules.
========================================= */

window.TamilandaWallet = {

    getData: () => walletData,

    save: () =>
        saveWalletData(walletData),

    updateDashboard,

    addTransaction,

    addAccount,

    addBuyer,

    formatMoney,

    todayString,

    generateId
};
