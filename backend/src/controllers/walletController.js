import User from '../models/User.js';

const METHOD_LABELS = {
  paypal: 'PayPal',
  stripe: 'Stripe',
  crypto: 'Cryptocurrency',
  bank: 'Bank Transfer',
  upi: 'UPI',
};

const generateTrnId = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `TRN${ts}${r}`.replace(/[^A-Z0-9]/g, '').slice(0, 22);
};

const maskBankAccount = (raw) => {
  const d = String(raw).replace(/\s/g, '');
  if (d.length <= 4) return '****';
  return `XXXXXX${d.slice(-4)}`;
};

const maskWallet = (addr) => {
  const a = String(addr).trim();
  if (a.length <= 10) return `${a.slice(0, 4)}…`;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
};

const validateIfsc = (ifsc) => {
  const v = String(ifsc).trim().toUpperCase();
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v);
};

const validateUpiId = (upi) => /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/.test(String(upi).trim());

const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e).trim());

const validatePartyName = (name) => String(name || '').trim().length >= 2;

const validateBankAccount = (n) => /^\d{8,18}$/.test(String(n).replace(/\s/g, ''));

const buildCreditSnapshot = (methodId, body) => {
  const partyName = String(body.partyName || '').trim();
  switch (methodId) {
    case 'upi':
      return {
        partyName,
        headline: `UPI credit · ${partyName}`,
        detailLine: `UPI ID: ${String(body.upiId || '').trim()}`,
        meta: { upiId: String(body.upiId || '').trim() },
      };
    case 'bank':
      return {
        partyName,
        headline: `Bank transfer · ${partyName}`,
        detailLine: `A/c ${maskBankAccount(body.bankAccount)} · IFSC ${String(body.bankIfsc || '').trim().toUpperCase()}`,
        meta: {
          accountMasked: maskBankAccount(body.bankAccount),
          ifsc: String(body.bankIfsc || '').trim().toUpperCase(),
        },
      };
    case 'paypal':
    case 'stripe':
      return {
        partyName,
        headline: `${methodId === 'paypal' ? 'PayPal' : 'Stripe'} · ${partyName}`,
        detailLine: String(body.otherDetail || '').trim(),
        meta: { email: String(body.otherDetail || '').trim() },
      };
    case 'crypto':
      return {
        partyName,
        headline: `Crypto · ${partyName}`,
        detailLine: maskWallet(body.otherDetail),
        meta: { walletMasked: maskWallet(body.otherDetail) },
      };
    default:
      return null;
  }
};

const buildDebitSnapshot = (methodId, body) => {
  const partyName = String(body.partyName || '').trim();
  switch (methodId) {
    case 'upi':
      return {
        partyName,
        headline: `UPI payout · ${partyName}`,
        detailLine: `UPI ID: ${String(body.upiId || '').trim()}`,
        meta: { upiId: String(body.upiId || '').trim() },
      };
    case 'bank':
      return {
        partyName,
        headline: `Bank payout · ${partyName}`,
        detailLine: `A/c ${maskBankAccount(body.bankAccount)} · IFSC ${String(body.bankIfsc || '').trim().toUpperCase()}`,
        meta: {
          accountMasked: maskBankAccount(body.bankAccount),
          ifsc: String(body.bankIfsc || '').trim().toUpperCase(),
        },
      };
    case 'paypal':
    case 'stripe':
      return {
        partyName,
        headline: `${methodId === 'paypal' ? 'PayPal' : 'Stripe'} · ${partyName}`,
        detailLine: String(body.otherDetail || '').trim(),
        meta: { email: String(body.otherDetail || '').trim() },
      };
    case 'crypto':
      return {
        partyName,
        headline: `Crypto · ${partyName}`,
        detailLine: maskWallet(body.otherDetail),
        meta: { walletMasked: maskWallet(body.otherDetail) },
      };
    default:
      return null;
  }
};

const validateCreditBody = (methodId, body) => {
  if (!validatePartyName(body.partyName)) {
    return { ok: false, message: 'Enter full name (at least 2 characters)' };
  }
  switch (methodId) {
    case 'upi':
      if (!validateUpiId(body.upiId)) {
        return { ok: false, message: 'Enter a valid UPI ID' };
      }
      break;
    case 'bank':
      if (!validateBankAccount(body.bankAccount)) {
        return { ok: false, message: 'Enter a valid account number (8–18 digits)' };
      }
      if (!validateIfsc(body.bankIfsc)) {
        return { ok: false, message: 'Enter valid IFSC code' };
      }
      break;
    case 'paypal':
    case 'stripe':
      if (!validateEmail(body.otherDetail)) {
        return { ok: false, message: 'Enter a valid email' };
      }
      break;
    case 'crypto': {
      const w = String(body.otherDetail || '').trim();
      if (w.length < 26 || w.length > 42) {
        return { ok: false, message: 'Enter a valid wallet address' };
      }
      break;
    }
    default:
      return { ok: false, message: 'Invalid payment method' };
  }
  return { ok: true };
};

const formatTx = (t) => {
  if (!t) return null;
  const created = t.createdAt ? new Date(t.createdAt) : new Date();
  const iso = created.toISOString().split('T');
  const date = iso[0];
  const timePart = created.toTimeString().split(' ')[0];
  return {
    id: t._id ? String(t._id) : undefined,
    trnId: t.trnId,
    type: t.type,
    amount: t.amount,
    date,
    time: timePart,
    method: t.method,
    methodId: t.methodId,
    flow: t.flow,
    counterpartyName: t.counterpartyName,
    detailLine: t.detailLine,
    headline: t.headline,
    meta: t.meta || {},
    createdAt: t.createdAt,
  };
};

export const getWallet = async (req, res) => {
  let user = await User.findById(req.user.id)
    .select('walletBalance walletTransactions savedPaymentMethods')
    .lean();

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (typeof user.walletBalance !== 'number' || Number.isNaN(user.walletBalance)) {
    await User.updateOne({ _id: req.user.id }, { $set: { walletBalance: 0 } });
    user = { ...user, walletBalance: 0 };
  }

  const txs = [...(user.walletTransactions || [])].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  res.json({
    balance: typeof user.walletBalance === 'number' ? user.walletBalance : 0,
    transactions: txs.map(formatTx),
    savedMethods: user.savedPaymentMethods || [],
  });
};

export const deposit = async (req, res) => {
  const { methodId, amount, partyName, upiId, bankAccount, bankIfsc, otherDetail } = req.body;
  if (!methodId || !METHOD_LABELS[methodId]) {
    res.status(400);
    throw new Error('Invalid or missing payment method');
  }

  const num = Number(amount);
  if (!Number.isFinite(num) || num < 1) {
    res.status(400);
    throw new Error('Minimum add amount is 1 (in your wallet currency)');
  }

  const v = validateCreditBody(methodId, { partyName, upiId, bankAccount, bankIfsc, otherDetail });
  if (!v.ok) {
    res.status(400);
    throw new Error(v.message);
  }

  const snap = buildCreditSnapshot(methodId, { partyName, upiId, bankAccount, bankIfsc, otherDetail });
  if (!snap) {
    res.status(400);
    throw new Error('Could not build transaction');
  }

  const trnId = generateTrnId();
  const txDoc = {
    trnId,
    type: 'credit',
    amount: Math.round(num * 100) / 100,
    method: METHOD_LABELS[methodId],
    methodId,
    flow: 'in',
    counterpartyName: snap.partyName,
    detailLine: snap.detailLine,
    headline: snap.headline,
    meta: snap.meta,
    createdAt: new Date(),
  };

  const updated = await User.findByIdAndUpdate(
    req.user.id,
    {
      $inc: { walletBalance: num },
      $push: { walletTransactions: txDoc },
    },
    { new: true, select: 'walletBalance walletTransactions' }
  ).lean();

  const saved = updated.walletTransactions.find((x) => x.trnId === trnId);
  res.status(201).json({
    balance: updated.walletBalance,
    transaction: formatTx(saved),
  });
};

export const withdraw = async (req, res) => {
  const { methodId, amount, partyName, upiId, bankAccount, bankIfsc, otherDetail } = req.body;
  if (!methodId || !METHOD_LABELS[methodId]) {
    res.status(400);
    throw new Error('Invalid or missing payout method');
  }

  const num = Number(amount);
  if (!Number.isFinite(num) || num < 10) {
    res.status(400);
    throw new Error('Minimum withdrawal amount is 10 (in your wallet currency)');
  }

  const v = validateCreditBody(methodId, { partyName, upiId, bankAccount, bankIfsc, otherDetail });
  if (!v.ok) {
    res.status(400);
    throw new Error(v.message);
  }

  const snap = buildDebitSnapshot(methodId, { partyName, upiId, bankAccount, bankIfsc, otherDetail });
  if (!snap) {
    res.status(400);
    throw new Error('Could not build transaction');
  }

  const trnId = generateTrnId();
  const txDoc = {
    trnId,
    type: 'debit',
    amount: Math.round(num * 100) / 100,
    method: METHOD_LABELS[methodId],
    methodId,
    flow: 'out',
    counterpartyName: snap.partyName,
    detailLine: snap.detailLine,
    headline: snap.headline,
    meta: snap.meta,
    createdAt: new Date(),
  };

  const updated = await User.findOneAndUpdate(
    { _id: req.user.id, walletBalance: { $gte: num } },
    {
      $inc: { walletBalance: -num },
      $push: { walletTransactions: txDoc },
    },
    { new: true, select: 'walletBalance walletTransactions' }
  ).lean();

  if (!updated) {
    res.status(400);
    throw new Error('Insufficient balance');
  }

  const saved = updated.walletTransactions.find((x) => x.trnId === trnId);
  res.status(201).json({
    balance: updated.walletBalance,
    transaction: formatTx(saved),
  });
};

export const savePaymentMethod = async (req, res) => {
  const { methodId, holderName, upiId, bankAccount, ifsc, otherDetail } = req.body;
  if (!methodId || !METHOD_LABELS[methodId]) {
    res.status(400);
    throw new Error('Invalid method');
  }
  if (!validatePartyName(holderName)) {
    res.status(400);
    throw new Error('Enter full name');
  }

  if (methodId === 'upi' && !validateUpiId(upiId)) {
    res.status(400);
    throw new Error('Invalid UPI ID');
  }
  if (methodId === 'bank') {
    if (!validateBankAccount(bankAccount)) {
      res.status(400);
      throw new Error('Invalid account number');
    }
    if (!validateIfsc(ifsc)) {
      res.status(400);
      throw new Error('Invalid IFSC');
    }
  }
  if ((methodId === 'paypal' || methodId === 'stripe') && !validateEmail(otherDetail)) {
    res.status(400);
    throw new Error('Invalid email');
  }
  if (methodId === 'crypto') {
    const w = String(otherDetail || '').trim();
    if (w.length < 26 || w.length > 42) {
      res.status(400);
      throw new Error('Invalid wallet address');
    }
  }

  const entry = {
    methodId,
    holderName: String(holderName).trim(),
    upiId: methodId === 'upi' ? String(upiId || '').trim() : undefined,
    bankAccount: methodId === 'bank' ? String(bankAccount || '').replace(/\s/g, '') : undefined,
    ifsc: methodId === 'bank' ? String(ifsc || '').trim().toUpperCase() : undefined,
    otherDetail: ['paypal', 'stripe', 'crypto'].includes(methodId)
      ? String(otherDetail || '').trim()
      : undefined,
    createdAt: new Date(),
  };

  await User.findByIdAndUpdate(req.user.id, {
    $push: { savedPaymentMethods: entry },
  });

  const user = await User.findById(req.user.id).select('savedPaymentMethods').lean();
  res.status(201).json({ savedMethods: user.savedPaymentMethods || [] });
};
