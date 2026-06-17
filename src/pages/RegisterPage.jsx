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
      <section className="w-full max-w-[520px] mx-auto px-4 py-12">
        <div className="rounded-xl border border-border bg-card p-6 grid gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Owner</p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-foreground mt-1">
              Create account
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {otpRequested
                ? `Confirm the code sent to ${form.phoneNumber}, then we'll finish creating ${form.restaurantName || "your restaurant"}.`
                : "Set up the first restaurant now. You can refine the details later in settings."}
            </p>
          </div>

          <form className="grid gap-3" onSubmit={otpRequested ? handleVerifyOtp : handleRequestOtp}>
            <div className="grid gap-1.5">
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono" htmlFor="phone_number">
                Phone number
              </label>
              <input
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground transition-colors disabled:opacity-50"
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

            <div className="grid gap-1.5">
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono" htmlFor="restaurant_name">
                Restaurant name
              </label>
              <input
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground transition-colors disabled:opacity-50"
                id="restaurant_name"
                type="text"
                value={form.restaurantName}
                onChange={(event) => updateForm({ restaurantName: event.target.value })}
                disabled={otpRequested || submitting}
                required
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono" htmlFor="city">
                City
              </label>
              <input
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground transition-colors disabled:opacity-50"
                id="city"
                type="text"
                value={form.city}
                onChange={(event) => updateForm({ city: event.target.value })}
                disabled={otpRequested || submitting}
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono" htmlFor="country">
                Country
              </label>
              <input
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground transition-colors disabled:opacity-50"
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
                <div className="grid gap-1.5">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono" htmlFor="otp_code">
                    OTP code
                  </label>
                  <input
                    className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground transition-colors"
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
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    onClick={resetOtpFlow}
                    disabled={submitting}
                  >
                    Edit details
                  </button>
                </div>
              </>
            ) : null}

            {import.meta.env.DEV && otpRequested && devOtpCode ? (
              <div className="rounded-lg border border-warning/30 bg-warning/15 px-3 py-2 text-sm text-warning-foreground dark:text-warning">
                Development OTP: <strong>{devOtpCode}</strong>
              </div>
            ) : null}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                disabled={submitting}
              >
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
                  className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                  onClick={handleRequestOtp}
                  disabled={submitting || resendCooldown > 0}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                </button>
              ) : null}
            </div>
          </form>

          <p className="text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary underline underline-offset-2 hover:no-underline">
              Log in
            </Link>
          </p>
        </div>
      </section>
    </WorkspaceShell>
  );
}
