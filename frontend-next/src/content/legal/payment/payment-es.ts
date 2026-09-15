export const paymentEs = `
# MÉTODOS DE PAGO

En la plataforma GoPublica, todos los pagos en línea se procesan a través de **Stripe** — uno de los mayores y más seguros operadores de pago del mundo. Stripe admite más de 100 métodos de pago en múltiples monedas.

---

## ¿Cómo funcionan los pagos?

1. **El cliente selecciona productos o servicios** en su sitio web
2. **Procede al pago** y elige un método de pago conveniente
3. **Stripe procesa el pago** de forma segura y encriptada
4. **Usted recibe confirmación** en el panel de administración
5. **Los fondos se depositan** en su cuenta de Stripe después de la liquidación

---

## Métodos de Pago Soportados

###  Tarjetas de Crédito y Débito
- **Visa** — débito y crédito
- **Mastercard** — débito y crédito
- **American Express**
- **UnionPay** (China UnionPay)
- **JCB** (Japan Credit Bureau)
- **Diners Club**
- **Discover**

###  Pagos Móviles y Monederos Digitales
- **Apple Pay** — pagos desde dispositivos iPhone, iPad o Mac
- **Google Pay** — pagos desde dispositivos Android o navegador Chrome
- **Link by Stripe** — pago exprés con tarjeta guardada

###  Transferencias Bancarias y Banca en Línea
- **BLIK** — sistema de pago móvil polaco (códigos de 6 dígitos)
- **Transferencias en línea** — transferencias instantáneas de bancos polacos (mBank, PKO BP, Santander, ING y otros)
- **SEPA** — transferencias europeas en euros
- **iDEAL** — pagos en línea holandeses
- **Bancontact** — pagos en línea belgas
- **SOFORT** — pagos en línea alemanes
- **giropay** — transferencias bancarias alemanas
- **Transferencias bancarias** — transferencias tradicionales desde cuenta bancaria

###  Otros Métodos
- **Pago contra reembolso (COD)** — efectivo al recibir (para envíos por mensajero)
- **Compra ahora, paga después** — pagos diferidos
- **Efectivo** — pago en efectivo para recogida en persona

---

## Monedas

Stripe admite más de 135 monedas. En nuestra plataforma se soportan especialmente:

| Moneda | Código | Símbolo |
|--------|--------|---------|
| Zloty polaco | PLN | zł |
| Euro | EUR | € |
| Dólar estadounidense | USD | $ |
| Libra esterlina | GBP | £ |
| Corona checa | CZK | Kč |
| Corona eslovaca | EUR | € |

La moneda se adapta automáticamente a la ubicación del cliente y la configuración de su empresa.

---

## Seguridad de Pagos

- **Cifrado TLS/SSL** — todos los datos de pago están encriptados
- **PCI DSS Level 1** — Stripe cumple con los más altos estándares de seguridad de tarjetas de pago
- **Tokenización** — los números de tarjeta nunca se almacenan en nuestros servidores
- **3D Secure** — capa adicional de verificación para pagos con tarjeta
- **Anti-fraud** — sistemas avanzados de detección de fraude

---

## Suscripciones y Facturación Recurrente

Para suscripciones de la plataforma GoPublica:
- Los pagos se cargan automáticamente cada 30 días
- Puede cambiar su tarjeta en cualquier momento en el Panel de Administración
- Todas las facturas están disponibles para descargar en el panel
- Se requiere una tarjeta de débito o crédito para el primer pago

---

## Retiros

Los fondos de las transacciones se depositan en su cuenta bancaria según el calendario de retiros de Stripe:
- Tiempo estándar de retiro: 2-7 días hábiles
- Los retiros pueden ser automáticos o manuales (dependiendo de la configuración)

---

## Reembolsos

Para pagos con tarjeta, los reembolsos son procesados por Stripe a la tarjeta original. El tiempo de reembolso depende del banco emisor de la tarjeta (típicamente 5-10 días hábiles).

---

## ¿Preguntas?

¿Tiene preguntas sobre pagos? Contáctenos:
- Correo electrónico: **support@gopublica.com**
- Sitio web: **[Contacto](/contact)**
`;
