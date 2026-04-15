import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import WorkspaceShell from "../components/WorkspaceShell.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const navigate = useNavigate();
  const { owner, requestLoginOtp, verifyLoginOtp } = useAuth();
  const [form, setForm] = useState({ phoneNumber: "", otpCode: "" });
  const [otpRequested, setOtpRequested] = useState(false);
  const [devOtpCode, setDevOtpCode] = useState("");
  const [flash, setFlash] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  if (owner) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    if (!resendCooldown) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  function resetOtpFlow() {
    setOtpRequested(false);
    setDevOtpCode("");
    setResendCooldown(0);
    setForm((current) => ({ ...current, otpCode: "" }));
  }

  function updatePhoneNumber(value) {
    setForm((current) => ({
      ...current,
      phoneNumber: value,
      otpCode: "",
    }));
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
      const data = await requestLoginOtp(form.phoneNumber);
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
        phoneNumber: form.phoneNumber,
        otpCode: form.otpCode,
      });
      navigate("/dashboard");
    } catch (submitError) {
      setFlash({ type: "error", message: submitError.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <WorkspaceShell flash={flash} onClearFlash={() => setFlash(null)}>
      <section className="auth-shell">
        <div className="surface panel stack-md">
          <div>
            <p className="eyebrow">Owner</p>
            <h1 className="page-title">Log in</h1>
            <p className="page-subtitle">
              {otpRequested
                ? `Enter the code sent to ${form.phoneNumber}.`
                : "Start with the phone number attached to your owner account."}
            </p>
          </div>

          <form className="form-grid" onSubmit={otpRequested ? handleVerifyOtp : handleRequestOtp}>
            <div className="field-group">
              <label className="field-label" htmlFor="phone_number">
                Phone number
              </label>
              <input
                className="field-control"
                id="phone_number"
                type="tel"
                inputMode="tel"
                placeholder="+254700000000"
                value={form.phoneNumber}
                onChange={(event) => updatePhoneNumber(event.target.value)}
                disabled={otpRequested || submitting}
                required
              />
            </div>

            {otpRequested ? (
              <>
                <div className="field-group">
                  <label className="field-label" htmlFor="otp_code">
                    OTP code
                  </label>
                  <input
                    className="field-control"
                    id="otp_code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={form.otpCode}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, otpCode: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="action-row">
                  <button type="button" className="button" onClick={resetOtpFlow} disabled={submitting}>
                    Change phone number
                  </button>
                  <span className="muted-text">
                    {resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : "You can request another code now."}
                  </span>
                </div>
              </>
            ) : null}

            {otpRequested && devOtpCode ? (
              <div className="alert">
                Development OTP: <strong>{devOtpCode}</strong>
              </div>
            ) : null}

            <div className="action-row">
              <button type="submit" className="button button-confirm" disabled={submitting}>
                {submitting
                  ? otpRequested
                    ? "Verifying"
                    : "Sending"
                  : otpRequested
                    ? "Verify OTP"
                    : "Send OTP"}
              </button>
              {otpRequested ? (
                <button
                  type="button"
                  className="button"
                  onClick={handleRequestOtp}
                  disabled={submitting || resendCooldown > 0}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                </button>
              ) : null}
            </div>
          </form>

          <div className="muted-text">
            New here? <Link to="/register">Create an account</Link>
          </div>
        </div>
      </section>
    </WorkspaceShell>
  );
}
