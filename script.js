/*
 * NTSTUDIO - GitHub Pages + Supabase Discord Login
 * ใช้ Publishable Key เท่านั้นใน Frontend
 */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://discord.com/oauth2/authorize?client_id=1564155996597784596&response_type=code&redirect_uri=https%3A%2F%2Fnatthawatn-studio.github.io%2FNTD-SHOP%2F&scope=identify";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_8kl1n2jHbuAf93RJedRTQg_6J7jyTU2";

const loginView = document.querySelector("#login-view");
const dashboardView = document.querySelector("#dashboard-view");
const errorMessage = document.querySelector("#error-message");
const loginButton = document.querySelector("#login-button");
const logoutButton = document.querySelector("#logout-button");

document.querySelector("#year").textContent =
  new Date().getFullYear();

const isConfigured =
  SUPABASE_URL.startsWith("https://discord.com/oauth2/authorize?client_id=1564155996597784596&response_type=code&redirect_uri=https%3A%2F%2Fnatthawatn-studio.github.io%2FNTD-SHOP%2F&scope=identify") &&
  SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_8kl1n2jHbuAf93RJedRTQg_6J7jyTU2");

let supabase = null;

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

function hideError() {
  errorMessage.textContent = "";
  errorMessage.hidden = true;
}

function showLogin() {
  loginView.hidden = false;
  dashboardView.hidden = true;
}

function showDashboard(user) {
  const metadata = user.user_metadata || {};

  const username =
    metadata.global_name ||
    metadata.full_name ||
    metadata.name ||
    metadata.preferred_username ||
    metadata.username ||
    user.email?.split("@")[0] ||
    "Discord User";

  const avatar =
    metadata.avatar_url ||
    metadata.picture ||
    "";

  document.querySelector("#user-global-name").textContent = username;

  document.querySelector("#user-username").textContent =
    metadata.preferred_username
      ? "@" + metadata.preferred_username
      : metadata.username
        ? "@" + metadata.username
        : "Discord account";

  const avatarElement = document.querySelector("#user-avatar");

  avatarElement.src = avatar || "./default-avatar.svg";

  avatarElement.onerror = () => {
    avatarElement.onerror = null;
    avatarElement.src = "./default-avatar.svg";
  };

  loginView.hidden = true;
  dashboardView.hidden = false;
  hideError();
}

async function refreshSession() {
  if (!isConfigured) {
    showLogin();
    showError("กรุณาตรวจสอบการตั้งค่า Supabase ใน script.js");
    loginButton.disabled = true;
    return;
  }

  supabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );

  loginButton.disabled = false;

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    showLogin();
    showError("ตรวจสอบสถานะการเข้าสู่ระบบไม่สำเร็จ กรุณารีเฟรชหน้าเว็บ");
    return;
  }

  if (data.session?.user) {
    showDashboard(data.session.user);
  } else {
    showLogin();
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      showDashboard(session.user);
    } else {
      showLogin();
    }
  });
}

loginButton.addEventListener("click", async () => {
  if (!supabase) return;

  hideError();
  loginButton.disabled = true;

  try {
    const redirectTo =
      window.location.origin + window.location.pathname;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo
      }
    });

    if (error) throw error;

  } catch (error) {
    showError(
      "เข้าสู่ระบบ Discord ไม่สำเร็จ: " +
      (error.message || "กรุณาลองใหม่")
    );

    loginButton.disabled = false;
  }
});

logoutButton.addEventListener("click", async () => {
  if (!supabase) return;

  hideError();
  logoutButton.disabled = true;

  try {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    showLogin();

  } catch (error) {
    showError(
      "ออกจากระบบไม่สำเร็จ: " +
      (error.message || "กรุณาลองใหม่")
    );
  } finally {
    logoutButton.disabled = false;
  }
});

refreshSession();
