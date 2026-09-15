export const paymentEn = `
# PAYMENT METHODS

On the GoPublica platform, all online payments are processed through **Stripe** — one of the world's largest and most secure payment operators. Stripe supports over 100 payment methods in multiple currencies.

---

## How do payments work?

1. **Customer selects products or services** on your website
2. **Proceeds to checkout** and chooses a convenient payment method
3. **Stripe processes the payment** securely and with encryption
4. **You receive confirmation** in the admin panel
5. **Funds are deposited** to your Stripe account after settlement

---

## Supported Payment Methods

### Credit & Debit Cards
- **Visa** — debit and credit
- **Mastercard** — debit and credit
- **American Express**
- **UnionPay** (China UnionPay)
- **JCB** (Japan Credit Bureau)
- **Diners Club**
- **Discover**

### Mobile Payments & Digital Wallets
- **Apple Pay** — payments from iPhone, iPad, or Mac
- **Google Pay** — payments from Android devices or Chrome browser
- **Link by Stripe** — express checkout with saved card

### Bank Transfers & Online Banking
- **BLIK** — Polish mobile payment system (6-digit codes)
- **Online bank transfers** — instant transfers from Polish banks (mBank, PKO BP, Santander, ING, and others)
- **SEPA** — European euro transfers
- **iDEAL** — Dutch online payments
- **Bancontact** — Belgian online payments
- **SOFORT** — German online payments
- **giropay** — German bank transfers
- **Bank transfers** — traditional bank account transfers

### Other Methods
- **Cash on Delivery (COD)** — cash upon receipt (for courier shipments)
- **Buy Now, Pay Later** — deferred payments
- **Cash** — cash payment for in-person pickup

---

## Currencies

Stripe supports over 135 currencies. On our platform, the following are particularly supported:

| Currency | Code | Symbol |
|----------|------|--------|
| Polish Zloty | PLN | zł |
| Euro | EUR | € |
| US Dollar | USD | $ |
| British Pound | GBP | £ |
| Czech Koruna | CZK | Kč |
| Slovak Koruna | EUR | € |

Currency is automatically adjusted to the customer's location and your company's configuration.

---

## Payment Security

- **TLS/SSL Encryption** — all payment data is encrypted
- **PCI DSS Level 1** — Stripe meets the highest payment card security standards
- **Tokenization** — card numbers are never stored on our servers
- **3D Secure** — additional verification layer for card payments
- **Anti-fraud** — advanced fraud detection systems

---

## Subscriptions & Recurring Billing

For GoPublica platform subscriptions:
- Payments are automatically charged every 30 days
- You can change your card at any time in the Admin Panel
- All invoices are available for download in the panel
- A debit or credit card is required for the first payment

---

## Payouts

Funds from transactions are deposited to your bank account according to Stripe's payout schedule:
- Standard payout time: 2-7 business days
- Payouts can be automatic or manual (depending on configuration)

---

## Refunds

For card payments, refunds are processed by Stripe to the original card. Refund timing depends on the issuing bank (typically 5-10 business days).

---

## Questions?

Have questions about payments? Contact us:
- Email: **support@gopublica.com**
- Website: **[Contact](/contact)**
`;
