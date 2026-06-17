import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import usePageTitle from "../hooks/usePageTitle.js";

const COUNTRY_CODES = [
  { code: "+255", label: "Tanzania", example: "7XX XXX XXX" },
  { code: "+254", label: "Kenya", example: "7XX XXX XXX" },
  { code: "+256", label: "Uganda", example: "7XX XXX XXX" },
  { code: "+250", label: "Rwanda", example: "7XX XXX XXX" },
  { code: "+257", label: "Burundi", example: "7X XX XX XX" },
  { code: "+211", label: "South Sudan", example: "9XX XXX XXX" },
  { code: "+251", label: "Ethiopia", example: "9XX XXX XXX" },
  { code: "+252", label: "Somalia", example: "6X XXX XXX" },
  { code: "+243", label: "DR Congo", example: "8XX XXX XXX" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { owner, requestLoginOtp, verifyLoginOtp } = useAuth();
  const [countryCode, setCountryCode] = useState("+255");
  const [localNumber, setLocalNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [devOtpCode, setDevOtpCode] = useState("");
  const [flash, setFlash] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  usePageTitle("Log in");

  const fullNumber = `${countryCode}${localNumber.replace(/[^\d]/g, "")}`;

  useEffect(() => {
    if (!resendCooldown) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  if (owner) {
    return <Navigate to="/dashboard" replace />;
  }

  function resetOtpFlow() {
    setOtpRequested(false);
    setDevOtpCode("");
    setResendCooldown(0);
    setOtpCode("");
  }

  function handlePhoneChange(value) {
    setLocalNumber(value.replace(/[^\d]/g, ""));
    setOtpCode("");
    setFlash(null);
    if (otpRequested) {
      resetOtpFlow();
    }
  }

  async function handleRequestOtp(event) {
    event?.preventDefault();
    setSubmitting(true);
    setFlash(null);

    try {
      const data = await requestLoginOtp(fullNumber);
      setOtpRequested(true);
      setDevOtpCode(data.devOtpCode || "");
      setResendCooldown(30);
      setFlash({ type: "success", message: data.message });
    } catch (submitError) {
      setFlash({ type: "error", message: submitError.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(event) {
    event.preventDefault();
    setSubmitting(true);
    setFlash(null);

    try {
      await verifyLoginOtp({
        phoneNumber: fullNumber,
        otpCode,
      });
      navigate("/dashboard");
    } catch (submitError) {
      setFlash({ type: "error", message: submitError.message });
    } finally {
      setSubmitting(false);
    }
  }

  const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode);

  return (
    <AuthShell flash={flash} onClearFlash={() => setFlash(null)}>
      <section className="w-full max-w-[520px] mx-auto px-4 py-12">
        <div className="rounded-xl border border-border bg-card p-6 grid gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-foreground mt-1">
              {otpRequested ? "Check your phone" : "Welcome back"}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {otpRequested
                ? `Enter the code sent to ${fullNumber}.`
                : "Enter your phone number to receive a login code."}
            </p>
          </div>

          <form className="grid gap-3" onSubmit={otpRequested ? handleVerifyOtp : handleRequestOtp}>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="phone_number">
                Phone number
              </label>
              <div className="flex gap-2">
                <select
                  className="h-10 rounded-lg border border-input bg-background px-2 text-sm text-foreground transition-colors w-28 shrink-0"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  disabled={otpRequested || submitting}
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code}
                    </option>
                  ))}
                </select>
                <input
                  className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-base text-foreground transition-colors disabled:opacity-50"
                  id="phone_number"
                  type="tel"
                  inputMode="numeric"
                  placeholder={selectedCountry?.example || "7XX XXX XXX"}
                  value={localNumber}
                  onChange={(event) => handlePhoneChange(event.target.value)}
                  disabled={otpRequested || submitting}
                  required
                />
              </div>
            </div>

            {otpRequested ? (
              <>
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium text-foreground" htmlFor="otp_code">
                    Confirmation code
                  </label>
                  <input
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground transition-colors"
                    id="otp_code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Enter the 6-digit code"
                    value={otpCode}
                    onChange={(event) => setOtpCode(event.target.value.replace(/[^\d]/g, ""))}
                    required
                    autoFocus
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center h-9 px-3 rounded-lg text-sm font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    onClick={resetOtpFlow}
                    disabled={submitting}
                  >
                    Change phone number
                  </button>
                </div>
              </>
            ) : null}

            {import.meta.env.DEV && otpRequested && devOtpCode ? (
              <div className="rounded-lg border border-warning/30 bg-warning/15 px-3 py-2 text-sm text-warning-foreground dark:text-warning">
                Dev OTP: <strong>{devOtpCode}</strong>
              </div>
            ) : null}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center h-10 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                disabled={submitting || localNumber.length < 6}
              >
                {submitting
                  ? otpRequested
                    ? "Verifying"
                    : "Sending"
                  : otpRequested
                    ? "Verify & log in"
                    : "Send code"}
              </button>
              {otpRequested ? (
                <button
                  type="button"
                  className="inline-flex items-center justify-center h-10 px-3 rounded-lg text-sm font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                  onClick={handleRequestOtp}
                  disabled={submitting || resendCooldown > 0}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                </button>
              ) : null}
            </div>
          </form>

          <p className="text-xs text-muted-foreground">
            New here?{" "}
            <Link to="/register" className="text-primary underline underline-offset-2 hover:no-underline">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </AuthShell>
  );
}
