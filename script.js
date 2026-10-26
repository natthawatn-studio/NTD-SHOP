/*
 * NTSTUDIO GitHub Pages frontend.
 * Auth is delegated to Supabase; no Discord Client Secret belongs in this file.
 * Replace the two placeholders below with your Supabase project values.
 */
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://discord.com/oauth2/authorize?client_id=780310431716868117&response_type=code&redirect_uri=https%3A%2F%2Fnatthawatn-studio.github.io%2FNTD-SHOP%2F&scope=identify";
const SUPABASE_ANON_KEY = "of1sYzljQhCRYBeDb-JEKqMTA13Q6F4B";

const loginView = document.querySelector("#login-view");
const dashboardView = document.querySelector("#dashboard-view");
const errorMessage = document.querySelector("#error-message");
const loginButton = document.querySelector("#login-button");
const logoutButton = document.querySelector("#logout-button");

document.querySelector("#year").textContent = new Date().getFullYear();

const isConfigured =
  !SUPABASE_URL.includes("https://discord.com/oauth2/authorize?client_id=780310431716868117&response_type=code&redirect_uri=https%3A%2F%2Fnatthawatn-studio.github.io%2FNTD-SHOP%2F&scope=identify") &&
  !SUPABASE_ANON_KEY.includes("of1sYzljQhCRYBeDb-JEKqMTA13Q6F4B");

let supabase = null;

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

function showLogin() {
  loginView.hidden = false;
  dashboardView.hidden = true;
}

function showDashboard(user) {
  const metadata = user.user_metadata || {};
  const username = metadata.custom_claims?.global_name ||
    metadata.global_name || metadata.full_name || metadata.name || user.email?.split("@")[0] || "Discord User";
  const avatar = metadata.avatar_url || metadata.picture || "";

  document.querySelector("#user-global-name").textContent = username;
  document.querySelector("#user-username").textContent =
    metadata.preferred_username ? "@" + metadata.preferred_username :
    (metadata.username ? "@" + metadata.username : "Discord account");

  const avatarElement = document.querySelector("#user-avatar");
  avatarElement.src = avatar || "./default-avatar.svg";
  avatarElement.onerror = () => { avatarElement.src = "./default-avatar.svg"; };

  loginView.hidden = true;
  dashboardView.hidden = false;
}

async function refreshSession() {
  if (!isConfigured) {
    showLogin();
    showError("ยังไม่ได้ตั้งค่า Supabase กรุณาเปิดไฟล์ script.js และทำตามขั้นตอนใน README.md");
    loginButton.disabled = true;
    return;
  }

  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    showLogin();
    showError("ตรวจสอบสถานะการเข้าสู่ระบบไม่สำเร็จ กรุณารีเฟรชหน้าเว็บ");
    return;
  }

  if (data.session?.user) showDashboard(data.session.user);
  else showLogin();

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) showDashboard(session.user);
    else showLogin();
  });
}

loginButton.addEventListener("click", async () => {
  if (!supabase) return;
  errorMessage.hidden = true;
  loginButton.disabled = true;
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo: window.location.origin + window.location.pathname }
    });
    if (error) throw error;
  } catch (error) {
    showError("เข้าสู่ระบบ Discord ไม่สำเร็จ: " + (error.message || "กรุณาลองใหม่"));
    loginButton.disabled = false;
  }
});

logoutButton.addEventListener("click", async () => {
  if (!supabase) return;
  logoutButton.disabled = true;
  const { error } = await supabase.auth.signOut();
  if (error) {
    showError("ออกจากระบบไม่สำเร็จ กรุณาลองใหม่");
    logoutButton.disabled = false;
  } else {
    showLogin();
    logoutButton.disabled = false;
  }
});

refreshSession();
