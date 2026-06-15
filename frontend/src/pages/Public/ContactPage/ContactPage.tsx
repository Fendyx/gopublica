import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import "./ContactPage.css";

type FormState = "idle" | "sending" | "success" | "error";

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export default function ContactPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [formState, setFormState] = useState<FormState>("idle");
  const formRef = useRef<HTMLFormElement>(null);

  // Получаем массив тем из локализации
  const SUBJECTS = t("contact.form.subjects", { returnObjects: true }) as string[];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState("sending");

    // TODO: replace with real API call
    await new Promise((r) => setTimeout(r, 1800));

    setFormState("success");
    setForm({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  const messengers = [
    {
      name: "Telegram",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.247-2.04 9.607c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.48 14.66l-2.95-.924c-.64-.203-.654-.64.136-.948l11.532-4.448c.537-.194 1.006.131.834.948-.002 0-.002-.001 0 0 .001 0 .001 0 .001-.001l-.47-.04z" />
        </svg>
      ),
      href: "https://t.me/yourhandle",
      label: "@yourhandle",
      color: "#2AABEE",
    },
    {
      name: "WhatsApp",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
      href: "https://wa.me/4917612345678",
      label: "+49 176 12 345 678",
      color: "#25D366",
    },
  ];

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <h1 className="contact-hero__title">{t("contact.title")}</h1>
        <p className="contact-hero__sub">{t("contact.subtitle")}</p>
      </section>

      <section className="contact-main">
        <div className="contact-info">
          <div className="info-block">
            <span className="info-block__label">{t("contact.messengerLabel")}</span>
            <div className="messenger-cards">
              {messengers.map((m) => (
                <a
                  key={m.name}
                  href={m.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="messenger-card"
                  style={{ "--m-color": m.color } as React.CSSProperties}
                >
                  <span className="messenger-card__icon">{m.icon}</span>
                  <div className="messenger-card__body">
                    <span className="messenger-card__name">{m.name}</span>
                    <span className="messenger-card__label">{m.label}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="info-block">
            <span className="info-block__label">{t("contact.emailLabel")}</span>
            <a href="mailto:support@gopublica.com" className="email-link">
              support@gopublica.com
            </a>
          </div>
        </div>

        <div className="contact-form-wrap">
          <div className="contact-form-header">
            <h2>{t("contact.form.title")}</h2>
            <p>{t("contact.form.subtitle")}</p>
          </div>

          {formState === "success" ? (
            <div className="form-success">
              <div className="form-success__icon">✓</div>
              <h3>{t("contact.form.successTitle")}</h3>
              <p>{t("contact.form.successText")}</p>
              <button
                className="btn btn--primary"
                onClick={() => setFormState("idle")}
              >
                {t("contact.form.sendMore")}
              </button>
            </div>
          ) : (
            <form
              ref={formRef}
              className="contact-form"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="name">{t("contact.form.name")}</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder={t("contact.form.namePlaceholder")}
                    value={form.name}
                    onChange={handleChange}
                    required
                    autoComplete="name"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="email">{t("contact.form.email")}</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="support@gopublica.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="phone">{t("contact.form.phone")}</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+49 / +48"
                  value={form.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                />
              </div>

              <div className="form-field">
                <label htmlFor="subject">{t("contact.form.subject")}</label>
                <select
                  id="subject"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                >
                  <option value="">{t("contact.form.subjectPlaceholder")}</option>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="message">{t("contact.form.message")}</label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  placeholder={t("contact.form.messagePlaceholder")}
                  value={form.message}
                  onChange={handleChange}
                  required
                />
              </div>

              {formState === "error" && (
                <div className="form-error-msg">
                  {t("contact.form.error")}
                </div>
              )}

              <button
                type="submit"
                className="btn btn--primary btn--full"
                disabled={formState === "sending"}
              >
                {formState === "sending" ? (
                  <span className="btn-spinner" />
                ) : (
                  t("contact.form.submit")
                )}
              </button>

              <p className="form-privacy">
                {t("contact.form.privacyStart")}
                <a href="/privacy">{t("contact.form.privacyLink")}</a>
                {t("contact.form.privacyEnd")}
              </p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}