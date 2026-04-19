import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../utils/api.js';
import { useAuth } from '../state/AuthContext.jsx';
import {
  formatWalletAmount,
  formatSignedWalletDelta,
  walletCurrencyCode,
} from '../utils/walletCurrency.js';

const PAYMENT_METHODS = [
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Secure online payments',
    icon: '💳',
    fee: '2.9% + small fixed fee per txn',
    placeholder: 'PayPal email',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Accept card payments',
    icon: '💳',
    fee: '2.9% + small fixed fee per txn',
    placeholder: 'Stripe email',
  },
  {
    id: 'crypto',
    name: 'Cryptocurrency',
    description: 'Bitcoin, Ethereum, and more',
    icon: '₿',
    fee: '1% network fee',
    placeholder: 'Wallet address',
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    description: 'NEFT / IMPS / RTGS',
    icon: '🏦',
    fee: 'Free',
    placeholder: 'Account number',
  },
  {
    id: 'upi',
    name: 'UPI',
    description: 'Unified Payments Interface',
    icon: '📱',
    fee: 'Free',
    placeholder: 'yourname@paytm',
  },
];

const validateIfsc = (ifsc) => {
  const v = String(ifsc).trim().toUpperCase();
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v);
};

const validateUpiId = (upi) => /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/.test(String(upi).trim());

const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e).trim());

const validatePartyName = (name) => String(name).trim().length >= 2;

const validateBankAccount = (n) => /^\d{8,18}$/.test(String(n).replace(/\s/g, ''));

const validateAddForm = (methodId, s) => {
  if (!validatePartyName(s.addPartyName)) {
    return { ok: false, message: 'Enter full name (at least 2 characters)' };
  }
  switch (methodId) {
    case 'upi':
      if (!validateUpiId(s.addUpiId)) {
        return { ok: false, message: 'Enter a valid UPI ID (e.g. name@paytm)' };
      }
      break;
    case 'bank':
      if (!validateBankAccount(s.addBankAccount)) {
        return { ok: false, message: 'Enter a valid account number (8–18 digits)' };
      }
      if (!validateIfsc(s.addBankIfsc)) {
        return { ok: false, message: 'Enter valid IFSC (e.g. HDFC0001234 — 4 letters, 0, then 6 chars)' };
      }
      break;
    case 'paypal':
    case 'stripe':
      if (!validateEmail(s.addOtherDetail)) {
        return { ok: false, message: 'Enter a valid email' };
      }
      break;
    case 'crypto': {
      const w = s.addOtherDetail.trim();
      if (w.length < 26 || w.length > 42) {
        return { ok: false, message: 'Enter a valid wallet address (26–42 characters)' };
      }
      break;
    }
    default:
      return { ok: false, message: 'Select a payment method' };
  }
  return { ok: true, message: '' };
};

const validateWithdrawForm = (methodId, s) => {
  if (!validatePartyName(s.withdrawPartyName)) {
    return { ok: false, message: 'Enter beneficiary full name (at least 2 characters)' };
  }
  switch (methodId) {
    case 'upi':
      if (!validateUpiId(s.withdrawUpiId)) {
        return { ok: false, message: 'Enter a valid UPI ID' };
      }
      break;
    case 'bank':
      if (!validateBankAccount(s.withdrawBankAccount)) {
        return { ok: false, message: 'Enter a valid account number (8–18 digits)' };
      }
      if (!validateIfsc(s.withdrawBankIfsc)) {
        return { ok: false, message: 'Enter valid IFSC code' };
      }
      break;
    case 'paypal':
    case 'stripe':
      if (!validateEmail(s.withdrawOtherDetail)) {
        return { ok: false, message: 'Enter a valid email' };
      }
      break;
    case 'crypto': {
      const w = s.withdrawOtherDetail.trim();
      if (w.length < 26 || w.length > 42) {
        return { ok: false, message: 'Enter a valid wallet address' };
      }
      break;
    }
    default:
      return { ok: false, message: 'Select a payout method' };
  }
  return { ok: true, message: '' };
};

const emptyAddFields = () => ({
  addPartyName: '',
  addUpiId: '',
  addBankAccount: '',
  addBankIfsc: '',
  addOtherDetail: '',
});

const emptyWithdrawFields = () => ({
  withdrawPartyName: '',
  withdrawUpiId: '',
  withdrawBankAccount: '',
  withdrawBankIfsc: '',
  withdrawOtherDetail: '',
});

const PaymentsPage = () => {
  const { user } = useAuth();
  const countryOrigin = useMemo(() => user?.country?.trim() || '', [user?.country]);

  const [addMethodId, setAddMethodId] = useState('');
  const [withdrawMethodId, setWithdrawMethodId] = useState('');
  const [methodsTabMethodId, setMethodsTabMethodId] = useState('');
  const [activeTab, setActiveTab] = useState('wallet');
  const [addAmount, setAddAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const [addPartyName, setAddPartyName] = useState('');
  const [addUpiId, setAddUpiId] = useState('');
  const [addBankAccount, setAddBankAccount] = useState('');
  const [addBankIfsc, setAddBankIfsc] = useState('');
  const [addOtherDetail, setAddOtherDetail] = useState('');

  const [withdrawPartyName, setWithdrawPartyName] = useState('');
  const [withdrawUpiId, setWithdrawUpiId] = useState('');
  const [withdrawBankAccount, setWithdrawBankAccount] = useState('');
  const [withdrawBankIfsc, setWithdrawBankIfsc] = useState('');
  const [withdrawOtherDetail, setWithdrawOtherDetail] = useState('');

  const [methodsTabAccountDetails, setMethodsTabAccountDetails] = useState('');
  const [methodsTabIfsc, setMethodsTabIfsc] = useState('');
  const [methodsTabName, setMethodsTabName] = useState('');

  const [addError, setAddError] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletLoadError, setWalletLoadError] = useState('');
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [savedMethods, setSavedMethods] = useState([]);
  const [saveMethodSubmitting, setSaveMethodSubmitting] = useState(false);
  const [saveMethodMessage, setSaveMethodMessage] = useState('');

  const fetchWallet = useCallback(async () => {
    setWalletLoadError('');
    setWalletLoading(true);
    try {
      const { data } = await api.get('/wallet');
      setWalletBalance(typeof data.balance === 'number' ? data.balance : 0);
      setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
      setSavedMethods(Array.isArray(data.savedMethods) ? data.savedMethods : []);
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || 'Could not load wallet';
      setWalletLoadError(msg);
      setWalletBalance(0);
      setTransactions([]);
    } finally {
      setWalletLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  useEffect(() => {
    if (activeTab === 'history' && !walletLoading) {
      fetchWallet();
    }
  }, [activeTab, fetchWallet, walletLoading]);

  const addFormState = {
    addPartyName,
    addUpiId,
    addBankAccount,
    addBankIfsc,
    addOtherDetail,
  };

  const withdrawFormState = {
    withdrawPartyName,
    withdrawUpiId,
    withdrawBankAccount,
    withdrawBankIfsc,
    withdrawOtherDetail,
  };

  const onAddMethodChange = (id) => {
    setAddMethodId(id);
    const e = emptyAddFields();
    setAddPartyName(e.addPartyName);
    setAddUpiId(e.addUpiId);
    setAddBankAccount(e.addBankAccount);
    setAddBankIfsc(e.addBankIfsc);
    setAddOtherDetail(e.addOtherDetail);
    setAddError('');
  };

  const onWithdrawMethodChange = (id) => {
    setWithdrawMethodId(id);
    const e = emptyWithdrawFields();
    setWithdrawPartyName(e.withdrawPartyName);
    setWithdrawUpiId(e.withdrawUpiId);
    setWithdrawBankAccount(e.withdrawBankAccount);
    setWithdrawBankIfsc(e.withdrawBankIfsc);
    setWithdrawOtherDetail(e.withdrawOtherDetail);
    setWithdrawError('');
  };

  const onMethodsTabPick = (id) => {
    setMethodsTabMethodId(id);
    setMethodsTabAccountDetails('');
    setMethodsTabIfsc('');
    setMethodsTabName('');
    setSaveMethodMessage('');
  };

  const isAddFormComplete = () => {
    if (!addMethodId || !addAmount) return false;
    const v = validateAddForm(addMethodId, addFormState);
    return v.ok;
  };

  const isWithdrawFormComplete = () => {
    if (!withdrawMethodId || !withdrawAmount) return false;
    const v = validateWithdrawForm(withdrawMethodId, withdrawFormState);
    return v.ok;
  };

  const handleAddFunds = async () => {
    setAddError('');
    const v = validateAddForm(addMethodId, addFormState);
    if (!v.ok) {
      setAddError(v.message);
      return;
    }
    if (!addAmount || parseFloat(addAmount) <= 0) {
      setAddError('Please enter a valid amount');
      return;
    }
    if (parseFloat(addAmount) < 1) {
      setAddError(`Minimum amount is ${formatWalletAmount(1, countryOrigin)}`);
      return;
    }

    setAddSubmitting(true);
    try {
      const { data } = await api.post('/wallet/deposit', {
        methodId: addMethodId,
        amount: parseFloat(addAmount),
        partyName: addPartyName.trim(),
        upiId: addUpiId.trim(),
        bankAccount: addBankAccount.replace(/\s/g, ''),
        bankIfsc: addBankIfsc.trim(),
        otherDetail: addOtherDetail.trim(),
      });
      setWalletBalance(data.balance);
      if (data.transaction) {
        setTransactions((prev) => [data.transaction, ...prev.filter((t) => t.trnId !== data.transaction.trnId)]);
      } else {
        await fetchWallet();
      }
      setAddAmount('');
      const e = emptyAddFields();
      setAddPartyName(e.addPartyName);
      setAddUpiId(e.addUpiId);
      setAddBankAccount(e.addBankAccount);
      setAddBankIfsc(e.addBankIfsc);
      setAddOtherDetail(e.addOtherDetail);
      alert(`Saved to your account. TRN: ${data.transaction?.trnId || '—'}`);
    } catch (e) {
      setAddError(e?.response?.data?.message || e.message || 'Add funds failed');
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    setWithdrawError('');
    const v = validateWithdrawForm(withdrawMethodId, withdrawFormState);
    if (!v.ok) {
      setWithdrawError(v.message);
      return;
    }
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setWithdrawError('Please enter a valid amount');
      return;
    }
    if (parseFloat(withdrawAmount) > walletBalance) {
      setWithdrawError('Insufficient balance!');
      return;
    }
    if (parseFloat(withdrawAmount) < 10) {
      setWithdrawError(`Minimum withdrawal is ${formatWalletAmount(10, countryOrigin)}`);
      return;
    }

    setWithdrawSubmitting(true);
    try {
      const { data } = await api.post('/wallet/withdraw', {
        methodId: withdrawMethodId,
        amount: parseFloat(withdrawAmount),
        partyName: withdrawPartyName.trim(),
        upiId: withdrawUpiId.trim(),
        bankAccount: withdrawBankAccount.replace(/\s/g, ''),
        bankIfsc: withdrawBankIfsc.trim(),
        otherDetail: withdrawOtherDetail.trim(),
      });
      setWalletBalance(data.balance);
      if (data.transaction) {
        setTransactions((prev) => [data.transaction, ...prev.filter((t) => t.trnId !== data.transaction.trnId)]);
      } else {
        await fetchWallet();
      }
      setWithdrawAmount('');
      const e = emptyWithdrawFields();
      setWithdrawPartyName(e.withdrawPartyName);
      setWithdrawUpiId(e.withdrawUpiId);
      setWithdrawBankAccount(e.withdrawBankAccount);
      setWithdrawBankIfsc(e.withdrawBankIfsc);
      setWithdrawOtherDetail(e.withdrawOtherDetail);
      alert(`Withdrawal recorded. TRN: ${data.transaction?.trnId || '—'}`);
    } catch (e) {
      setWithdrawError(e?.response?.data?.message || e.message || 'Withdraw failed');
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  const handleSavePaymentMethod = async () => {
    setSaveMethodMessage('');
    if (!methodsTabMethodId) return;
    if (!validatePartyName(methodsTabName)) {
      setSaveMethodMessage('Enter full name');
      return;
    }
    setSaveMethodSubmitting(true);
    try {
      const { data } = await api.post('/wallet/saved-methods', {
        methodId: methodsTabMethodId,
        holderName: methodsTabName.trim(),
        upiId: methodsTabMethodId === 'upi' ? methodsTabAccountDetails.trim() : undefined,
        bankAccount: methodsTabMethodId === 'bank' ? methodsTabAccountDetails.replace(/\s/g, '') : undefined,
        ifsc: methodsTabMethodId === 'bank' ? methodsTabIfsc.trim() : undefined,
        otherDetail: !['upi', 'bank'].includes(methodsTabMethodId) ? methodsTabAccountDetails.trim() : undefined,
      });
      setSavedMethods(data.savedMethods || []);
      setSaveMethodMessage('Saved to your profile.');
    } catch (e) {
      setSaveMethodMessage(e?.response?.data?.message || e.message || 'Save failed');
    } finally {
      setSaveMethodSubmitting(false);
    }
  };

  const tabClass = (id) =>
    `flex-1 rounded-lg px-2 py-2.5 text-center text-[11px] font-medium leading-tight transition-colors sm:flex-none sm:rounded-t-lg sm:rounded-b-none sm:px-4 sm:py-3 sm:text-left sm:text-xs md:text-sm ${
      activeTab === id
        ? 'bg-slate-800 text-indigo-200 shadow-sm sm:border-b-2 sm:border-indigo-400 sm:bg-slate-800/60 sm:text-indigo-300 sm:shadow-none'
        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 sm:hover:bg-transparent sm:hover:text-slate-300'
    }`;

  const renderMethodFields = (side) => {
    const isAdd = side === 'add';
    const methodId = isAdd ? addMethodId : withdrawMethodId;
    const ring = isAdd ? 'focus:border-emerald-500 focus:ring-emerald-500/25' : 'focus:border-amber-500 focus:ring-amber-500/25';

    const baseInput = `min-w-0 w-full max-w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-base text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 sm:px-4 sm:text-sm ${ring}`;

    const nameVal = isAdd ? addPartyName : withdrawPartyName;
    const setName = isAdd ? setAddPartyName : setWithdrawPartyName;
    const nameId = isAdd ? 'add-party-name' : 'withdraw-party-name';
    const nameLabel = isAdd ? 'Full name (as on bank / UPI)' : 'Beneficiary full name';

    if (!methodId) return null;

    return (
      <div className="space-y-4">
        <div>
          <label htmlFor={nameId} className="mb-2 block text-sm font-medium text-slate-300">
            {nameLabel}
          </label>
          <input
            id={nameId}
            type="text"
            autoComplete="name"
            value={nameVal}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rajesh Kumar"
            className={baseInput}
          />
        </div>

        {methodId === 'upi' && (
          <div>
            <label htmlFor={isAdd ? 'add-upi' : 'w-upi'} className="mb-2 block text-sm font-medium text-slate-300">
              UPI ID
            </label>
            <input
              id={isAdd ? 'add-upi' : 'w-upi'}
              type="text"
              autoComplete="off"
              value={isAdd ? addUpiId : withdrawUpiId}
              onChange={(e) => (isAdd ? setAddUpiId(e.target.value) : setWithdrawUpiId(e.target.value))}
              placeholder="name@paytm / ybl / okaxis"
              className={baseInput}
            />
          </div>
        )}

        {methodId === 'bank' && (
          <>
            <div>
              <label htmlFor={isAdd ? 'add-bank-ac' : 'w-bank-ac'} className="mb-2 block text-sm font-medium text-slate-300">
                Bank account number
              </label>
              <input
                id={isAdd ? 'add-bank-ac' : 'w-bank-ac'}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={isAdd ? addBankAccount : withdrawBankAccount}
                onChange={(e) => (isAdd ? setAddBankAccount(e.target.value) : setWithdrawBankAccount(e.target.value))}
                placeholder="8–18 digits"
                className={baseInput}
              />
            </div>
            <div>
              <label htmlFor={isAdd ? 'add-ifsc' : 'w-ifsc'} className="mb-2 block text-sm font-medium text-slate-300">
                IFSC code
              </label>
              <input
                id={isAdd ? 'add-ifsc' : 'w-ifsc'}
                type="text"
                autoComplete="off"
                value={isAdd ? addBankIfsc : withdrawBankIfsc}
                onChange={(e) =>
                  isAdd ? setAddBankIfsc(e.target.value.toUpperCase()) : setWithdrawBankIfsc(e.target.value.toUpperCase())
                }
                placeholder="e.g. HDFC0001234"
                maxLength={11}
                className={`${baseInput} font-mono uppercase tracking-wide`}
              />
              <p className="mt-1.5 text-[11px] leading-snug text-slate-500 sm:text-xs">
                11 characters: 4 bank letters, 0, then 6 alphanumeric (IFSC).
              </p>
            </div>
          </>
        )}

        {(methodId === 'paypal' || methodId === 'stripe') && (
          <div>
            <label htmlFor={isAdd ? 'add-email' : 'w-email'} className="mb-2 block text-sm font-medium text-slate-300">
              Registered email
            </label>
            <input
              id={isAdd ? 'add-email' : 'w-email'}
              type="email"
              autoComplete="email"
              value={isAdd ? addOtherDetail : withdrawOtherDetail}
              onChange={(e) => (isAdd ? setAddOtherDetail(e.target.value) : setWithdrawOtherDetail(e.target.value))}
              placeholder="you@example.com"
              className={baseInput}
            />
          </div>
        )}

        {methodId === 'crypto' && (
          <div>
            <label htmlFor={isAdd ? 'add-wallet' : 'w-wallet'} className="mb-2 block text-sm font-medium text-slate-300">
              Wallet address
            </label>
            <input
              id={isAdd ? 'add-wallet' : 'w-wallet'}
              type="text"
              autoComplete="off"
              value={isAdd ? addOtherDetail : withdrawOtherDetail}
              onChange={(e) => (isAdd ? setAddOtherDetail(e.target.value) : setWithdrawOtherDetail(e.target.value))}
              placeholder="Paste wallet address"
              className={`${baseInput} font-mono text-sm`}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-5xl min-w-0">
      <header className="mb-5 sm:mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl mb-1.5 sm:mb-2">
          Wallet & payments
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed sm:text-base max-w-2xl">
          Balance and history are stored on your SkillSwap account (database). Each payment gets a unique TRN.
        </p>
        {countryOrigin ? (
          <p className="mt-2 text-xs text-slate-500 sm:text-sm">
            Amounts use <span className="font-medium text-slate-400">{walletCurrencyCode(countryOrigin)}</span> based on
            your profile country ({countryOrigin}).
          </p>
        ) : (
          <p className="mt-2 text-xs text-amber-200/80 sm:text-sm">
            Set your country in Profile to show the correct currency. Until then, amounts use USD.
          </p>
        )}
      </header>

      {walletLoadError ? (
        <div
          role="alert"
          className="mb-5 flex flex-col gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-3 text-sm text-amber-100 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-4"
        >
          <span className="min-w-0 break-words">{walletLoadError}</span>
          <button
            type="button"
            onClick={() => fetchWallet()}
            className="rounded-lg bg-amber-600/30 px-3 py-1.5 font-medium text-amber-50 hover:bg-amber-600/50"
          >
            Retry
          </button>
        </div>
      ) : null}

      <div className="mb-6 flex gap-1 rounded-xl border border-slate-700/80 bg-slate-900/60 p-1 sm:mb-8 sm:rounded-none sm:border-0 sm:border-b sm:border-slate-700/80 sm:bg-transparent sm:p-0">
        <button type="button" onClick={() => setActiveTab('wallet')} className={tabClass('wallet')}>
          Wallet
        </button>
        <button type="button" onClick={() => setActiveTab('payments')} className={tabClass('payments')}>
          <span className="sm:hidden">Methods</span>
          <span className="hidden sm:inline">Payment methods</span>
        </button>
        <button type="button" onClick={() => setActiveTab('history')} className={tabClass('history')}>
          History
        </button>
      </div>

      {activeTab === 'wallet' && (
        <div className="space-y-5 sm:space-y-8">
          <section
            className="relative overflow-hidden rounded-2xl border border-slate-700/80 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-5 shadow-xl sm:p-8"
            aria-labelledby="balance-heading"
          >
            <div className="relative z-10">
              <p id="balance-heading" className="text-indigo-100/90 text-sm font-medium uppercase tracking-wide">
                Available balance
              </p>
              <p className="mt-2 text-3xl font-bold text-white tabular-nums sm:text-4xl md:text-5xl">
                {walletLoading ? '…' : formatWalletAmount(walletBalance, countryOrigin)}
              </p>
              <p className="mt-3 text-indigo-100/80 text-xs leading-relaxed max-w-md sm:text-sm">
                This is the current balance in your SkillSwap wallet. 
              </p>
            </div>
            <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          </section>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
            <section
              className="flex flex-col rounded-2xl border border-emerald-500/20 bg-slate-900/80 p-4 shadow-lg ring-1 ring-emerald-500/10 sm:p-6"
              aria-labelledby="add-funds-heading"
            >
              <div className="mb-4 flex flex-col gap-2 sm:mb-5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <div className="min-w-0">
                  <h2 id="add-funds-heading" className="text-base font-semibold text-slate-100 sm:text-lg">
                    Add funds
                  </h2>
                  <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                    Money in · min. {formatWalletAmount(1, countryOrigin)} · TRN on success.
                  </p>
                </div>
                <span className="w-fit shrink-0 rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300">
                  Credit
                </span>
              </div>

              <div className="flex flex-1 flex-col space-y-4">
                {addError && (
                  <div role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {addError}
                  </div>
                )}

                <div>
                  <label htmlFor="add-method" className="mb-2 block text-sm font-medium text-slate-300">
                    Pay with
                  </label>
                  <select
                    id="add-method"
                    value={addMethodId}
                    onChange={(e) => onAddMethodChange(e.target.value)}
                    className="min-w-0 w-full max-w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-base text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 sm:px-4 sm:text-sm"
                  >
                    <option value="">Select method</option>
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.name}
                      </option>
                    ))}
                  </select>
                </div>

                {renderMethodFields('add')}

                <div>
                  <label htmlFor="add-amount" className="mb-2 block text-sm font-medium text-slate-300">
                    Amount ({walletCurrencyCode(countryOrigin)})
                  </label>
                  <input
                    id="add-amount"
                    type="number"
                    min="1"
                    step="0.01"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    placeholder="e.g. 25.00"
                    className="min-w-0 w-full max-w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-base text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 sm:px-4 sm:text-sm"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddFunds}
                  disabled={!isAddFormComplete() || addSubmitting || walletLoading}
                  className="mt-auto w-full min-h-[44px] rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-400 active:bg-emerald-700"
                >
                  {addSubmitting ? 'Saving…' : 'Add funds'}
                </button>
              </div>
            </section>

            <section
              className="flex flex-col rounded-2xl border border-amber-500/20 bg-slate-900/80 p-4 shadow-lg ring-1 ring-amber-500/10 sm:p-6"
              aria-labelledby="withdraw-heading"
            >
              <div className="mb-4 flex flex-col gap-2 sm:mb-5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <div className="min-w-0">
                  <h2 id="withdraw-heading" className="text-base font-semibold text-slate-100 sm:text-lg">
                    Withdraw
                  </h2>
                  <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                    Money out · min. {formatWalletAmount(10, countryOrigin)} · TRN on withdrawal.
                  </p>
                </div>
                <span className="w-fit shrink-0 rounded-lg bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-200">
                  Debit
                </span>
              </div>

              <div className="flex flex-1 flex-col space-y-4">
                {withdrawError && (
                  <div role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {withdrawError}
                  </div>
                )}

                <div>
                  <label htmlFor="withdraw-method" className="mb-2 block text-sm font-medium text-slate-300">
                    Withdraw to
                  </label>
                  <select
                    id="withdraw-method"
                    value={withdrawMethodId}
                    onChange={(e) => onWithdrawMethodChange(e.target.value)}
                    className="min-w-0 w-full max-w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-base text-slate-100 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/25 sm:px-4 sm:text-sm"
                  >
                    <option value="">Select method</option>
                    {PAYMENT_METHODS.map((method) => (
                      <option key={`w-${method.id}`} value={method.id}>
                        {method.name}
                      </option>
                    ))}
                  </select>
                </div>

                {renderMethodFields('withdraw')}

                <div>
                  <label htmlFor="withdraw-amount" className="mb-2 block text-sm font-medium text-slate-300">
                    Amount ({walletCurrencyCode(countryOrigin)})
                  </label>
                  <input
                    id="withdraw-amount"
                    type="number"
                    min="10"
                    step="0.01"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="e.g. 50.00"
                    className="min-w-0 w-full max-w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-base text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/25 sm:px-4 sm:text-sm"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleWithdraw}
                  disabled={!isWithdrawFormComplete() || withdrawSubmitting || walletLoading}
                  className="mt-auto w-full min-h-[44px] rounded-lg bg-amber-600 px-4 py-3 text-sm font-semibold text-slate-950 shadow transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-400 active:bg-amber-500"
                >
                  {withdrawSubmitting ? 'Processing…' : 'Request withdrawal'}
                </button>
              </div>
            </section>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="space-y-5 sm:space-y-8">
          <p className="text-xs leading-relaxed text-slate-400 sm:text-sm">
            Save a default payout / pay-in profile. Does not change the live forms on the Wallet tab.
          </p>

          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-3 sm:gap-4">
            {PAYMENT_METHODS.map((method) => {
              const selected = methodsTabMethodId === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => onMethodsTabPick(method.id)}
                  className={`min-h-[4.5rem] min-w-0 rounded-2xl border p-4 text-left transition-all sm:min-h-0 sm:p-5 ${
                    selected
                      ? 'border-indigo-400 bg-indigo-500/10 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-400/40'
                      : 'border-slate-700 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" aria-hidden>
                      {method.icon}
                    </span>
                    <h3 className="text-base font-semibold text-slate-100">{method.name}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">{method.description}</p>
                  <p className="mt-3 text-xs text-slate-500">Fee: {method.fee}</p>
                  {selected ? <p className="mt-3 text-sm font-medium text-indigo-300">Selected for setup</p> : null}
                </button>
              );
            })}
          </div>

          {methodsTabMethodId ? (
            <section className="rounded-2xl border border-slate-700 bg-slate-800/50 p-4 sm:p-6">
              <h2 className="text-base font-semibold text-slate-100 sm:text-lg">Save default method</h2>
              <p className="mt-1 text-sm text-slate-400">
                Link {PAYMENT_METHODS.find((m) => m.id === methodsTabMethodId)?.name} for faster checkout later.
              </p>
              <div className="mt-5 space-y-4">
                <div>
                  <label htmlFor="mt-name" className="mb-2 block text-sm font-medium text-slate-300">
                    Full name
                  </label>
                  <input
                    id="mt-name"
                    type="text"
                    value={methodsTabName}
                    onChange={(e) => setMethodsTabName(e.target.value)}
                    className="min-w-0 w-full max-w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-base text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 sm:px-4 sm:text-sm"
                  />
                </div>
                {methodsTabMethodId === 'upi' && (
                  <div>
                    <label htmlFor="mt-upi" className="mb-2 block text-sm font-medium text-slate-300">
                      UPI ID
                    </label>
                    <input
                      id="mt-upi"
                      type="text"
                      value={methodsTabAccountDetails}
                      onChange={(e) => setMethodsTabAccountDetails(e.target.value)}
                      placeholder="name@paytm"
                      className="min-w-0 w-full max-w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-base text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 sm:px-4 sm:text-sm"
                    />
                  </div>
                )}
                {methodsTabMethodId === 'bank' && (
                  <>
                    <div>
                      <label htmlFor="mt-bank" className="mb-2 block text-sm font-medium text-slate-300">
                        Account number
                      </label>
                      <input
                        id="mt-bank"
                        type="text"
                        value={methodsTabAccountDetails}
                        onChange={(e) => setMethodsTabAccountDetails(e.target.value)}
                        className="min-w-0 w-full max-w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-base text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 sm:px-4 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="mt-ifsc" className="mb-2 block text-sm font-medium text-slate-300">
                        IFSC
                      </label>
                      <input
                        id="mt-ifsc"
                        type="text"
                        value={methodsTabIfsc}
                        onChange={(e) => setMethodsTabIfsc(e.target.value.toUpperCase())}
                        maxLength={11}
                        className="min-w-0 w-full max-w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 font-mono text-base uppercase text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 sm:px-4 sm:text-sm"
                      />
                    </div>
                  </>
                )}
                {!['upi', 'bank'].includes(methodsTabMethodId) && (
                  <div>
                    <label htmlFor="mt-det" className="mb-2 block text-sm font-medium text-slate-300">
                      {methodsTabMethodId === 'crypto' ? 'Wallet address' : 'Email'}
                    </label>
                    <input
                      id="mt-det"
                      type="text"
                      value={methodsTabAccountDetails}
                      onChange={(e) => setMethodsTabAccountDetails(e.target.value)}
                      className="min-w-0 w-full max-w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-base text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 sm:px-4 sm:text-sm"
                    />
                  </div>
                )}
                {saveMethodMessage ? (
                  <p
                    className={`text-sm ${saveMethodMessage.startsWith('Saved') ? 'text-emerald-400' : 'text-red-400'}`}
                  >
                    {saveMethodMessage}
                  </p>
                ) : null}
                <button
                  type="button"
                  disabled={saveMethodSubmitting}
                  className="w-full min-h-[44px] rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:bg-slate-600 sm:w-auto"
                  onClick={handleSavePaymentMethod}
                >
                  {saveMethodSubmitting ? 'Saving…' : 'Save payment method'}
                </button>
              </div>
            </section>
          ) : null}

          {savedMethods.length > 0 ? (
            <section className="rounded-2xl border border-slate-700 bg-slate-900/40 p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-slate-200 sm:text-base">Saved on your account</h3>
              <ul className="mt-3 space-y-2 text-xs text-slate-400 sm:text-sm">
                {savedMethods.map((m, idx) => (
                  <li
                    key={m._id || `${m.methodId}-${idx}`}
                    className="min-w-0 break-words rounded-lg border border-slate-700/80 bg-slate-800/40 px-3 py-2"
                  >
                    <span className="font-medium text-slate-200">
                      {PAYMENT_METHODS.find((x) => x.id === m.methodId)?.name || m.methodId}
                    </span>
                    {m.holderName ? <span className="text-slate-500"> · {m.holderName}</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-100 sm:text-xl">Transaction history</h2>
            <button
              type="button"
              onClick={() => fetchWallet()}
              disabled={walletLoading}
              className="min-h-[40px] shrink-0 rounded-lg px-2 text-sm font-medium text-indigo-400 hover:bg-slate-800/80 hover:text-indigo-300 disabled:opacity-50 sm:min-h-0"
            >
              Refresh
            </button>
          </div>
          {walletLoading && transactions.length === 0 ? (
            <p className="text-slate-400 text-sm">Loading…</p>
          ) : null}
          {transactions.length > 0 ? (
            <ul className="space-y-4">
              {transactions.map((tx) => (
                <li
                  key={tx.id || tx.trnId}
                  className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0 flex-1 space-y-2 overflow-hidden">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs font-semibold uppercase ${
                            tx.type === 'credit' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {tx.type === 'credit' ? 'Received' : 'Paid'}
                        </span>
                        <span className="text-xs text-slate-500">{tx.method}</span>
                      </div>
                      <p className="font-medium text-slate-100">{tx.headline || tx.description || 'Transaction'}</p>
                      <p className="text-sm text-slate-300">
                        {tx.type === 'credit' ? (
                          <>
                            <span className="text-slate-500">From </span>
                            <span className="font-medium text-slate-100">{tx.counterpartyName || '—'}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-slate-500">To </span>
                            <span className="font-medium text-slate-100">{tx.counterpartyName || '—'}</span>
                          </>
                        )}
                      </p>
                      {tx.detailLine ? (
                        <p className="text-sm text-slate-400 break-all">{tx.detailLine}</p>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-700/80 pt-3 text-xs text-slate-500">
                        <span>
                          Date: <span className="font-mono text-slate-400">{tx.date}</span>
                          {tx.time ? (
                            <>
                              {' '}
                              · Time: <span className="font-mono text-slate-400">{tx.time}</span>
                            </>
                          ) : null}
                        </span>
                      </div>
                      <p className="break-all font-mono text-[11px] leading-relaxed text-indigo-300/90 sm:text-xs">
                        TRN / Ref: <span className="select-all text-indigo-200">{tx.trnId || '—'}</span>
                      </p>
                    </div>
                    <div className="shrink-0 border-t border-slate-700/80 pt-3 text-left sm:border-t-0 sm:pt-0 sm:text-right">
                      <p
                        className={`text-lg font-bold tabular-nums sm:text-xl ${
                          tx.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {formatSignedWalletDelta(tx.amount, tx.type, countryOrigin)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">{walletCurrencyCode(countryOrigin)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-12 text-center text-slate-400">No transactions yet</p>
          )}
        </div>
      )}

      <footer className="mt-8 rounded-2xl border border-slate-700/80 bg-slate-900/40 p-4 sm:mt-10 sm:p-6">
        <h3 className="text-sm font-semibold text-slate-200 sm:text-base">Guidelines & verification</h3>
        <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-400 sm:mt-4 sm:text-sm">
          <li>Every successful add / withdraw gets a unique TRN you can use with support.</li>
          <li>Bank: account number + IFSC required (same as IMPS/NEFT in India).</li>
          <li>
            UPI: full name + UPI ID · Minimum add {formatWalletAmount(1, countryOrigin)} · Minimum withdrawal{' '}
            {formatWalletAmount(10, countryOrigin)}.
          </li>
        </ul>
      </footer>
    </div>
  );
};

export default PaymentsPage;
