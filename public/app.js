const authForm = document.querySelector("[data-auth-form]");

if (authForm instanceof HTMLFormElement) {
  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = authForm.querySelector("button[type='submit']");
    const status = authForm.querySelector("[data-auth-status]");
    const formData = new FormData(authForm);
    const mode = authForm.dataset.authForm;
    const signup = mode === "signup";
    const getText = (name) => {
      const value = formData.get(name);
      return typeof value === "string" ? value : "";
    };

    if (submitButton instanceof HTMLButtonElement) submitButton.disabled = true;
    if (status instanceof HTMLElement) {
      status.classList.add("hidden");
      status.textContent = "";
    }

    try {
      const signupIdempotencyKey = signup ? crypto.randomUUID() : "";
      const response = await fetch(`/api/auth/${signup ? "sign-up" : "sign-in"}/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(signup
            ? {
                "X-Signup-Idempotency-Key": signupIdempotencyKey,
                "X-Turnstile-Token": getText("cf-turnstile-response"),
              }
            : {}),
        },
        body: JSON.stringify({
          email: getText("email"),
          password: getText("password"),
          ...(signup ? { name: getText("name") } : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "処理を完了できませんでした。");
      }

      if (signup) {
        window.location.assign("/login?registered=1");
      } else {
        window.location.assign("/dashboard");
      }
    } catch (error) {
      if (status instanceof HTMLElement) {
        status.textContent =
          error instanceof Error ? error.message : "処理を完了できませんでした。";
        status.classList.remove("hidden");
        status.classList.add("error");
      }
    } finally {
      if (submitButton instanceof HTMLButtonElement) submitButton.disabled = false;
    }
  });
}

const signOutButton = document.querySelector("[data-sign-out]");
if (signOutButton instanceof HTMLButtonElement) {
  signOutButton.addEventListener("click", async () => {
    signOutButton.disabled = true;
    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      window.location.assign("/");
    } finally {
      signOutButton.disabled = false;
    }
  });
}
