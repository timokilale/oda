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
      <section className="w-full max-w-[480px] mx-auto px-4 py-16">
        <div className="bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="text-center">
            <h1 className="font-sans text-2xl font-bold text-neutral-800 dark:text-white">
              {otpRequested ? "Check your phone" : "Welcome back"}
            </h1>
            <p className="font-sans text-xs text-neutral-500 mt-2">
              {otpRequested
                ? `Enter the code sent to ${fullNumber}.`
                : "Enter your phone number to receive a login code."}
            </p>
          </div>

          <form className="space-y-4" onSubmit={otpRequested ? handleVerifyOtp : handleRequestOtp}>
            <div>
              <label className="block font-sans text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5" htmlFor="phone_number">
                Phone number
              </label>
              <div className="flex gap-2">
                <select
                  className="bg-white dark:bg-neutral-850 border border-[#E5E7EB] dark:border-neutral-700 rounded-xl px-2 py-2.5 text-sm focus:ring-2 focus:ring-[#4338ca]/20 outline-none transition-all dark:text-white w-28 shrink-0"
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
                  className="flex-1 bg-white dark:bg-neutral-850 border border-[#E5E7EB] dark:border-neutral-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#4338ca]/20 outline-none transition-all dark:text-white disabled:opacity-50"
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
                <div>
                  <label className="block font-sans text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5" htmlFor="otp_code">
                    Confirmation code
                  </label>
                  <input
                    className="w-full bg-white dark:bg-neutral-850 border border-[#E5E7EB] dark:border-neutral-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#4338ca]/20 outline-none transition-all dark:text-white"
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
                <button
                  type="button"
                  className="inline-flex items-center justify-center border border-[#E5E7EB] dark:border-neutral-800 text-neutral-500 font-sans text-[11px] font-bold uppercase tracking-wider rounded-xl px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all disabled:opacity-50"
                  onClick={resetOtpFlow}
                  disabled={submitting}
                >
                  Change phone number
                </button>
              </>
            ) : null}

            {import.meta.env.DEV && otpRequested && devOtpCode ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 px-4 py-2.5 font-sans text-xs text-amber-800 dark:text-amber-300">
                Dev OTP: <strong>{devOtpCode}</strong>
              </div>
            ) : null}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center bg-[#2a14b4] text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl px-6 py-2.5 hover:opacity-90 transition-all disabled:opacity-50 shadow-md"
                disabled={submitting || localNumber.length < 6}
              >
                {submitting
                  ? otpRequested
                    ? "Verifying..."
                    : "Sending..."
                  : otpRequested
                    ? "Verify & log in"
                    : "Send code"}
              </button>
              {otpRequested ? (
                <button
                  type="button"
                  className="inline-flex items-center justify-center border border-[#E5E7EB] dark:border-neutral-800 text-neutral-500 font-sans text-xs font-bold uppercase tracking-wider rounded-xl px-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all disabled:opacity-50"
                  onClick={handleRequestOtp}
                  disabled={submitting || resendCooldown > 0}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                </button>
              ) : null}
            </div>
          </form>

          <p className="font-sans text-[11px] text-neutral-500 text-center">
            New here?{" "}
            <Link to="/register" className="text-[#2a14b4] dark:text-[#c3c0ff] font-bold underline underline-offset-2 hover:no-underline">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </AuthShell>
  );
}
