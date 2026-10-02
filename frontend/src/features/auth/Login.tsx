import { useEffect, useRef, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

import {
  useLogin,
  useRequestOtp,
} from "../../lib/auth/useAuth";

// ============================================================
// CAMPUSHUB ID / PHONE VALIDATION
// ============================================================

/**
 * This mirrors the backend IdFormatValidator:
 *
 * STUDENT:
 *   STU_ + 3 lowercase + 3 uppercase + 3 digits + 1 symbol
 *
 * PROFESSOR:
 *   PROF_ + 3 lowercase + 3 uppercase + 3 digits + 1 symbol
 *
 * ADMIN:
 *   ADMIN_ + 3 lowercase + 3 uppercase + 3 digits + 1 symbol
 */
const CAMPUSHUB_ID_REGEX =
  /^(STU_|PROF_|ADMIN_)[a-z]{3}[A-Z]{3}[0-9]{3}[^A-Za-z0-9]$/;

const PHONE_NUMBER_REGEX =
  /^\+?[0-9]{7,15}$/;

const OTP_RESEND_SECONDS = 60;

// ============================================================
// FORM SCHEMAS
// ============================================================

const credentialsSchema = z.object({
  id: z
    .string()
    .trim()
    .min(
      1,
      "Please enter your CampusHub ID.",
    )
    .regex(
      CAMPUSHUB_ID_REGEX,
      "Use a valid CampusHub ID, for example STU_abcXYZ123@",
    ),

  phoneNumber: z
    .string()
    .trim()
    .min(
      1,
      "Please enter your registered phone number.",
    )
    .regex(
      PHONE_NUMBER_REGEX,
      "Enter a valid phone number, e.g. 9876543210.",
    ),
});

type CredentialsFormValues =
  z.infer<typeof credentialsSchema>;

const otpSchema = z.object({
  otp: z
    .string()
    .trim()
    .length(
      6,
      "Enter the 6-digit code.",
    )
    .regex(
      /^[0-9]{6}$/,
      "The code must be 6 digits.",
    ),
});

type OtpFormValues =
  z.infer<typeof otpSchema>;

// ============================================================
// MOTION
// ============================================================

const panelTransition = {
  duration: 0.35,
  ease: [0.16, 1, 0.3, 1] as const,
};

const cardTransition = {
  duration: 0.4,
  delay: 0.05,
  ease: [0.16, 1, 0.3, 1] as const,
};

const fieldTransition = {
  duration: 0.25,
  ease: [0.16, 1, 0.3, 1] as const,
};

// ============================================================
// HELPERS
// ============================================================

const getDashboardPath = (
  role: "ADMIN" | "PROFESSOR" | "STUDENT",
): string => {
  switch (role) {
    case "ADMIN":
      return "/admin";

    case "PROFESSOR":
      return "/professor";

    case "STUDENT":
      return "/student";
  }
};

/**
 * Masks all but the last 3 digits of a phone number for
 * display, e.g. "9876543210" -> "•••••••210".
 */
const maskPhoneNumber = (
  phone: string,
): string => {
  if (phone.length <= 3) {
    return phone;
  }

  const visible =
    phone.slice(-3);

  return (
    "•".repeat(phone.length - 3) +
    visible
  );
};

// ============================================================
// LOGIN PAGE
// ============================================================

export default function Login() {
  const navigate =
    useNavigate();

  const { requestOtp } =
    useRequestOtp();

  const { login } =
    useLogin();

  const [step, setStep] =
    useState<
      "credentials" | "otp"
    >("credentials");

  const [submitError, setSubmitError] =
    useState<string | null>(null);

  const [otpNotice, setOtpNotice] =
    useState<string | null>(null);

  const [resendSeconds, setResendSeconds] =
    useState(0);

  const isResendCoolingDown =
    resendSeconds > 0;

  // ----------------------------------------------------------
  // STEP 1: ID + PHONE NUMBER
  // ----------------------------------------------------------

  const credentialsForm =
    useForm<CredentialsFormValues>({
      resolver:
        zodResolver(
          credentialsSchema,
        ),

      defaultValues: {
        id: "",
        phoneNumber: "",
      },

      mode: "onSubmit",
    });

  // ----------------------------------------------------------
  // STEP 2: OTP
  // ----------------------------------------------------------

  const otpForm =
    useForm<OtpFormValues>({
      resolver:
        zodResolver(
          otpSchema,
        ),

      defaultValues: {
        otp: "",
      },

      mode: "onSubmit",
    });

  // ----------------------------------------------------------
  // RESEND COOLDOWN TIMER
  // ----------------------------------------------------------

  const cooldownInterval =
    useRef<
      ReturnType<
        typeof setInterval
      > | null
    >(null);

  useEffect(() => {
    if (resendSeconds <= 0) {
      if (
        cooldownInterval.current
      ) {
        clearInterval(
          cooldownInterval.current,
        );

        cooldownInterval.current =
          null;
      }

      return;
    }

    cooldownInterval.current =
      setInterval(() => {
        setResendSeconds(
          (seconds) =>
            seconds > 0
              ? seconds - 1
              : 0,
        );
      }, 1000);

    return () => {
      if (
        cooldownInterval.current
      ) {
        clearInterval(
          cooldownInterval.current,
        );
      }
    };
  }, [resendSeconds > 0]);

  // ----------------------------------------------------------
  // SEND / RESEND OTP
  // ----------------------------------------------------------

  const sendOtp = async (
    values: CredentialsFormValues,
  ) => {
    setSubmitError(null);
    setOtpNotice(null);

    try {
      await requestOtp(
        values.id,
        values.phoneNumber,
      );

      setStep("otp");

      setResendSeconds(
        OTP_RESEND_SECONDS,
      );

      setOtpNotice(
        `We sent a 6-digit code to ${maskPhoneNumber(
          values.phoneNumber.trim(),
        )}.`,
      );

      otpForm.reset({
        otp: "",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";

      /**
       * Failures here belong to the ID field because the
       * user needs to correct the ID/phone combination.
       */
      credentialsForm.setError(
        "id",
        {
          type: "server",
          message,
        },
      );

      setSubmitError(message);
    }
  };

  const handleResend =
    async () => {
      if (
        isResendCoolingDown
      ) {
        return;
      }

      await sendOtp(
        credentialsForm.getValues(),
      );
    };

  const handleChangeDetails =
    () => {
      setStep("credentials");

      setSubmitError(null);

      setOtpNotice(null);

      setResendSeconds(0);

      otpForm.reset({
        otp: "",
      });
    };

  // ----------------------------------------------------------
  // VERIFY OTP + LOG IN
  // ----------------------------------------------------------

  const onVerifyOtp = async (
    values: OtpFormValues,
  ) => {
    setSubmitError(null);

    const {
      id,
      phoneNumber,
    } =
      credentialsForm.getValues();

    try {
      const response =
        await login(
          id,
          phoneNumber,
          values.otp,
        );

      navigate(
        getDashboardPath(
          response.role,
        ),
        {
          replace: true,
        },
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";

      otpForm.setError(
        "otp",
        {
          type: "server",
          message,
        },
      );

      setSubmitError(message);
    }
  };

  return (
    <main className="min-h-screen bg-surface-page">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* ==================================================
            BRAND PANEL
            ================================================== */}

        <section className="relative flex min-h-[120px] w-full overflow-hidden bg-gradient-brand lg:min-h-screen lg:w-[55%]">
          {/* Decorative animated circles */}

          <motion.div
            aria-hidden="true"
            className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10"
            animate={{
              x: [0, 24, 0],
              y: [0, 18, 0],
              scale: [1, 1.04, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.div
            aria-hidden="true"
            className="absolute -bottom-24 right-10 h-80 w-80 rounded-full bg-white/[0.08]"
            animate={{
              x: [0, -28, 0],
              y: [0, -20, 0],
              scale: [1, 1.06, 1],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.div
            aria-hidden="true"
            className="absolute right-[18%] top-[18%] h-32 w-32 rounded-full bg-white/[0.06]"
            animate={{
              x: [0, 16, 0],
              y: [0, -14, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Brand content */}

          <div className="relative z-10 flex w-full items-center px-6 py-7 sm:px-10 lg:px-16 lg:py-16">
            <motion.div
              initial={{
                opacity: 0,
                y: 12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={
                panelTransition
              }
              className="w-full max-w-xl"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 shadow-lg backdrop-blur-sm">
                  <span className="font-heading text-lg font-extrabold text-white">
                    C
                  </span>
                </div>

                <span className="font-heading text-xl font-bold tracking-tight text-white sm:text-2xl">
                  CampusHub
                </span>
              </div>

              <div className="mt-6 max-w-lg sm:mt-10 lg:mt-16">
                <p className="font-heading text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
                  Campus management,
                  simplified
                </p>

                <h1 className="mt-3 font-heading text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-6xl">
                  One campus.
                  <br />
                  One connected
                  hub.
                </h1>

                <p className="mt-4 max-w-md text-sm leading-7 text-white/80 sm:text-base">
                  Manage classes,
                  attendance,
                  academics,
                  examinations and
                  student information
                  from one connected
                  CampusHub workspace.
                </p>
              </div>

              <div className="mt-7 hidden items-center gap-2 text-sm text-white/70 lg:mt-12 lg:flex">
                <ShieldCheck
                  size={17}
                  strokeWidth={1.8}
                />

                <span>
                  Secure OTP-verified
                  CampusHub access
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ==================================================
            LOGIN PANEL
            ================================================== */}

        <section className="flex w-full flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:w-[45%] lg:px-12 lg:py-16">
          <motion.div
            initial={{
              opacity: 0,
              y: 16,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={
              cardTransition
            }
            className="w-full max-w-md"
          >
            {/* Small wordmark */}

            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-brand shadow-brand-sm">
                <span className="font-heading text-sm font-extrabold text-white">
                  C
                </span>
              </div>

              <span className="font-heading text-lg font-bold text-heading">
                CampusHub
              </span>
            </div>

            <div className="mt-8 lg:mt-0">
              <p className="font-heading text-caption uppercase text-primary-600">
                {step ===
                "credentials"
                  ? "Welcome back"
                  : "Step 2 of 2"}
              </p>

              <h2 className="mt-2 font-heading text-3xl font-extrabold tracking-tight text-heading sm:text-4xl">
                {step ===
                "credentials"
                  ? "Log in to CampusHub"
                  : "Verify your code"}
              </h2>

              <p className="mt-3 text-sm leading-6 text-muted">
                {step ===
                "credentials"
                  ? "Enter your CampusHub ID and registered phone number to receive a one-time code."
                  : otpNotice ??
                    "Enter the 6-digit code we sent to your phone."}
              </p>
            </div>

            {/* ==================================================
                STEP 1: ID + PHONE NUMBER
                ================================================== */}

            {step ===
              "credentials" && (
              <form
                onSubmit={credentialsForm.handleSubmit(
                  sendOtp,
                )}
                noValidate
                className="mt-8"
              >
                {/* CampusHub ID */}

                <div>
                  <label
                    htmlFor="campushub-id"
                    className="mb-2 block text-sm font-semibold text-heading"
                  >
                    CampusHub ID
                  </label>

                  <input
                    id="campushub-id"
                    type="text"
                    autoComplete="username"
                    spellCheck={false}
                    placeholder="STU_abcXYZ123@"
                    aria-invalid={
                      credentialsForm
                        .formState
                        .errors.id
                        ? "true"
                        : "false"
                    }
                    aria-describedby="campushub-id-help campushub-id-error"
                    className={[
                      "h-12 w-full rounded-md border bg-white px-4 text-sm text-heading shadow-sm transition-all duration-150 placeholder:text-neutral-400 focus:outline-none",

                      credentialsForm
                        .formState
                        .errors.id
                        ? "border-danger focus:border-danger"
                        : "border-default focus:border-secondary-500",
                    ].join(" ")}
                    {...credentialsForm.register(
                      "id",
                    )}
                  />

                  <p
                    id="campushub-id-help"
                    className="mt-2 text-xs leading-5 text-muted"
                  >
                    Format:{" "}
                    <span className="font-mono text-neutral-600">
                      PREFIX + 3 lowercase +
                      3 uppercase + 3
                      digits + 1 symbol
                    </span>
                  </p>

                  {credentialsForm.formState
                    .errors.id && (
                    <motion.p
                      id="campushub-id-error"
                      initial={{
                        opacity: 0,
                        y: -4,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={
                        fieldTransition
                      }
                      className="mt-2 text-xs font-medium text-danger-text"
                      role="alert"
                    >
                      {
                        credentialsForm
                          .formState
                          .errors.id
                          .message
                      }
                    </motion.p>
                  )}
                </div>

                {/* Phone Number */}

                <div className="mt-5">
                  <label
                    htmlFor="phone-number"
                    className="mb-2 block text-sm font-semibold text-heading"
                  >
                    Registered Phone
                    Number
                  </label>

                  <input
                    id="phone-number"
                    type="tel"
                    autoComplete="tel"
                    spellCheck={false}
                    placeholder="e.g. 9876543210"
                    aria-invalid={
                      credentialsForm
                        .formState
                        .errors
                        .phoneNumber
                        ? "true"
                        : "false"
                    }
                    aria-describedby="phone-number-error"
                    className={[
                      "h-12 w-full rounded-md border bg-white px-4 text-sm text-heading shadow-sm transition-all duration-150 placeholder:text-neutral-400 focus:outline-none",

                      credentialsForm
                        .formState
                        .errors
                        .phoneNumber
                        ? "border-danger focus:border-danger"
                        : "border-default focus:border-secondary-500",
                    ].join(" ")}
                    {...credentialsForm.register(
                      "phoneNumber",
                    )}
                  />

                  {credentialsForm.formState
                    .errors.phoneNumber && (
                    <motion.p
                      id="phone-number-error"
                      initial={{
                        opacity: 0,
                        y: -4,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={
                        fieldTransition
                      }
                      className="mt-2 text-xs font-medium text-danger-text"
                      role="alert"
                    >
                      {
                        credentialsForm
                          .formState
                          .errors
                          .phoneNumber
                          .message
                      }
                    </motion.p>
                  )}
                </div>

                {/* Submit */}

                <motion.button
                  type="submit"
                  disabled={
                    credentialsForm
                      .formState
                      .isSubmitting
                  }
                  whileTap={
                    credentialsForm
                      .formState
                      .isSubmitting
                      ? undefined
                      : {
                          scale: 0.97,
                        }
                  }
                  className={[
                    "mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-md gradient-brand px-5 text-sm font-semibold text-white shadow-brand-sm transition-all duration-150",

                    credentialsForm
                      .formState
                      .isSubmitting
                      ? "cursor-not-allowed opacity-70"
                      : "hover:brightness-105 hover:shadow-glow-primary",
                  ].join(" ")}
                >
                  {credentialsForm.formState
                    .isSubmitting ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />

                      <span>
                        Sending code...
                      </span>
                    </>
                  ) : (
                    <>
                      <span>
                        Send OTP
                      </span>

                      <ArrowRight
                        size={17}
                        strokeWidth={2}
                      />
                    </>
                  )}
                </motion.button>

                {/* Server error fallback */}

                {submitError &&
                  !credentialsForm
                    .formState
                    .errors
                    .id && (
                    <motion.p
                      initial={{
                        opacity: 0,
                        y: -4,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={
                        fieldTransition
                      }
                      className="mt-3 text-xs font-medium text-danger-text"
                      role="alert"
                    >
                      {submitError}
                    </motion.p>
                  )}
              </form>
            )}

            {/* ==================================================
                STEP 2: OTP
                ================================================== */}

            {step === "otp" && (
              <form
                onSubmit={otpForm.handleSubmit(
                  onVerifyOtp,
                )}
                noValidate
                className="mt-8"
              >
                <div>
                  <label
                    htmlFor="otp-code"
                    className="mb-2 block text-sm font-semibold text-heading"
                  >
                    6-Digit Code
                  </label>

                  <input
                    id="otp-code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoComplete="one-time-code"
                    spellCheck={false}
                    placeholder="123456"
                    aria-invalid={
                      otpForm.formState
                        .errors.otp
                        ? "true"
                        : "false"
                    }
                    aria-describedby="otp-code-error"
                    className={[
                      "h-12 w-full rounded-md border bg-white px-4 text-center text-lg tracking-[0.5em] text-heading shadow-sm transition-all duration-150 placeholder:tracking-normal placeholder:text-neutral-400 focus:outline-none",

                      otpForm.formState
                        .errors.otp
                        ? "border-danger focus:border-danger"
                        : "border-default focus:border-secondary-500",
                    ].join(" ")}
                    {...otpForm.register(
                      "otp",
                    )}
                  />

                  {otpForm.formState
                    .errors.otp && (
                    <motion.p
                      id="otp-code-error"
                      initial={{
                        opacity: 0,
                        y: -4,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={
                        fieldTransition
                      }
                      className="mt-2 text-xs font-medium text-danger-text"
                      role="alert"
                    >
                      {
                        otpForm.formState
                          .errors.otp
                          .message
                      }
                    </motion.p>
                  )}
                </div>

                {/* Submit */}

                <motion.button
                  type="submit"
                  disabled={
                    otpForm.formState
                      .isSubmitting
                  }
                  whileTap={
                    otpForm.formState
                      .isSubmitting
                      ? undefined
                      : {
                          scale: 0.97,
                        }
                  }
                  className={[
                    "mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-md gradient-brand px-5 text-sm font-semibold text-white shadow-brand-sm transition-all duration-150",

                    otpForm.formState
                      .isSubmitting
                      ? "cursor-not-allowed opacity-70"
                      : "hover:brightness-105 hover:shadow-glow-primary",
                  ].join(" ")}
                >
                  {otpForm.formState
                    .isSubmitting ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />

                      <span>
                        Verifying...
                      </span>
                    </>
                  ) : (
                    <>
                      <span>
                        Verify &amp; Log in
                      </span>

                      <ArrowRight
                        size={17}
                        strokeWidth={2}
                      />
                    </>
                  )}
                </motion.button>

                {/* Server error fallback */}

                {submitError &&
                  !otpForm.formState
                    .errors.otp && (
                    <motion.p
                      initial={{
                        opacity: 0,
                        y: -4,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={
                        fieldTransition
                      }
                      className="mt-3 text-xs font-medium text-danger-text"
                      role="alert"
                    >
                      {submitError}
                    </motion.p>
                  )}

                {/* Resend + change details */}

                <div className="mt-5 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={
                      handleResend
                    }
                    disabled={
                      isResendCoolingDown
                    }
                    className={[
                      "font-semibold underline-offset-2",

                      isResendCoolingDown
                        ? "cursor-not-allowed text-neutral-400"
                        : "text-secondary-600 hover:underline",
                    ].join(" ")}
                  >
                    {isResendCoolingDown
                      ? `Resend code in ${resendSeconds}s`
                      : "Resend code"}
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleChangeDetails
                    }
                    className="font-semibold text-muted underline-offset-2 hover:text-heading hover:underline"
                  >
                    Use a different ID
                  </button>
                </div>
              </form>
            )}

            {/* Footer */}

            <p className="mt-8 text-center text-xs leading-5 text-neutral-400">
              CampusHub access is
              managed by your
              institution.
            </p>
          </motion.div>
        </section>
      </div>
    </main>
  );
}