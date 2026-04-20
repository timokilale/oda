import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import ImagePositionField from "../components/ImagePositionField.jsx";
import { createCroppedUpload, RESTAURANT_IMAGE_TARGET } from "../lib/cropImage.js";
import WorkspaceShell from "../components/WorkspaceShell.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import usePageTitle from "../hooks/usePageTitle.js";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { owner, requestRegisterOtp, verifyRegisterOtp } = useAuth();
  const [flash, setFlash] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [devOtpCode, setDevOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  usePageTitle("Create account");
  const [form, setForm] = useState({
    phoneNumber: "",
    otpCode: "",
    restaurantName: "",
    city: "",
    country: "",
    restaurantImage: null,
    restaurantImagePositionX: 50,
    restaurantImagePositionY: 50,
  });

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
    setForm((current) => ({
      ...current,
      otpCode: "",
    }));
  }

  function updateForm(patch) {
    setForm((current) => ({
      ...current,
      ...patch,
      otpCode: patch.otpCode ?? current.otpCode,
    }));
  }

  async function buildRegistrationFormData() {
    const formData = new FormData();
    formData.set("phoneNumber", form.phoneNumber);
    formData.set("restaurantName", form.restaurantName);
    formData.set("city", form.city);
    formData.set("country", form.country);
    formData.set("restaurantImagePositionX", String(form.restaurantImagePositionX));
    formData.set("restaurantImagePositionY", String(form.restaurantImagePositionY));
    if (form.restaurantImage) {
      const croppedImage = await createCroppedUpload(form.restaurantImage, {
        ...RESTAURANT_IMAGE_TARGET,
        positionX: form.restaurantImagePositionX,
        positionY: form.restaurantImagePositionY,
      });
      formData.set("restaurantImage", croppedImage);
    }

    return formData;
  }

  async function handleRequestOtp(event) {
    event?.preventDefault();
    setSubmitting(true);
    setFlash(null);

    try {
      const data = await requestRegisterOtp(await buildRegistrationFormData());
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
      await verifyRegisterOtp({
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
            <h1 className="page-title">Create account</h1>
            <p className="page-subtitle">
              {otpRequested
                ? `Confirm the code sent to ${form.phoneNumber}, then we'll finish creating ${form.restaurantName || "your restaurant"}.`
                : "Set up the first restaurant now. You can refine the details later in settings."}
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
                onChange={(event) => updateForm({ phoneNumber: event.target.value })}
                disabled={otpRequested || submitting}
                required
              />
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="restaurant_name">
                Restaurant name
              </label>
              <input
                className="field-control"
                id="restaurant_name"
                type="text"
                value={form.restaurantName}
                onChange={(event) => updateForm({ restaurantName: event.target.value })}
                disabled={otpRequested || submitting}
                required
              />
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="city">
                City
              </label>
              <input
                className="field-control"
                id="city"
                type="text"
                value={form.city}
                onChange={(event) => updateForm({ city: event.target.value })}
                disabled={otpRequested || submitting}
              />
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="country">
                Country
              </label>
              <input
                className="field-control"
                id="country"
                type="text"
                value={form.country}
                onChange={(event) => updateForm({ country: event.target.value })}
                disabled={otpRequested || submitting}
              />
            </div>

            <ImagePositionField
              inputId="restaurant_image"
              label="Restaurant image"
              file={form.restaurantImage}
              positionX={form.restaurantImagePositionX}
              positionY={form.restaurantImagePositionY}
              aspectRatio={RESTAURANT_IMAGE_TARGET.aspectRatio}
              disabled={otpRequested || submitting}
              onFileChange={(file) =>
                updateForm({
                  restaurantImage: file,
                  restaurantImagePositionX: 50,
                  restaurantImagePositionY: 50,
                })
              }
              onPositionChange={({ x, y }) =>
                updateForm({
                  restaurantImagePositionX: x,
                  restaurantImagePositionY: y,
                })
              }
            />

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
                    Edit details
                  </button>
                </div>
              </>
            ) : null}

            {import.meta.env.DEV && otpRequested && devOtpCode ? (
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
                    ? "Verify & create account"
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
            Already have an account? <Link to="/login">Log in</Link>
          </div>
        </div>
      </section>
    </WorkspaceShell>
  );
}
