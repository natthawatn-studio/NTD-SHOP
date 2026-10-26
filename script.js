/*
 * NTSTUDIO - GitHub Pages + Supabase Discord Login
 * ใช้ Publishable Key เท่านั้นใน Frontend
 */
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://brczvesvaldzerpwtvtm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_8kl1n2jHbuAf93RJedRTQg_6J7jyTU2";

const loginView = document.querySelector("#login-view");
const dashboardView = document.querySelector("#dashboard-view");
const errorMessage = document.querySelector("#error-message");
const loginButton = document.querySelector("#login-button");
const logoutButton = document.querySelector("#logout-button");
const topbarLogoutButton = document.querySelector("#topbar-logout");
const systemStatus = document.querySelector("#system-status");
const topbarAccount = document.querySelector("#topbar-account");
const topbarProfile = document.querySelector("#topbar-profile");
const accountMenu = document.querySelector("#account-menu");
const topbarAvatar = document.querySelector("#topbar-avatar");
const topbarUsername = document.querySelector("#topbar-username");
const menuAvatar = document.querySelector("#menu-avatar");
const menuName = document.querySelector("#menu-name");
const menuUsername = document.querySelector("#menu-username");

const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();

const isConfigured = SUPABASE_URL.startsWith("https://") &&
  SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_");

let supabase = null;

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

function hideError() {
  errorMessage.textContent = "";
  errorMessage.hidden = true;
}

function closeAccountMenu() {
  accountMenu.hidden = true;
  topbarProfile.setAttribute("aria-expanded", "false");
}

function getDiscordProfile(user) {
  const metadata = user?.user_metadata || {};
  const identities = user?.identities || [];
  const discordIdentity = identities.find((identity) => identity.provider === "discord");
  const identityData = discordIdentity?.identity_data || {};
  const name = metadata.global_name || metadata.full_name || metadata.name ||
    metadata.preferred_username || metadata.username || identityData.global_name ||
    identityData.full_name || identityData.name || identityData.preferred_username ||
    identityData.username || user?.email?.split("@")[0] || "Discord User";
  const username = metadata.preferred_username || metadata.username ||
    identityData.preferred_username || identityData.username || user?.email?.split("@")[0] || "Discord account";
  const avatar = metadata.avatar_url || metadata.picture || identityData.avatar_url || identityData.picture || "./default-avatar.svg";
  return { name, username: username.startsWith("@") ? username : `@${username}`, avatar };
}

function setImage(element, src) {
  element.onerror = () => {
    element.onerror = null;
    element.src = "./default-avatar.svg";
  };
  element.src = src || "./default-avatar.svg";
}

function updateTopbar(user) {
  if (!user) {
    topbarAccount.hidden = true;
    systemStatus.hidden = false;
    topbarProfile.setAttribute("aria-expanded", "false");
    closeAccountMenu();
    setImage(topbarAvatar, "./default-avatar.svg");
    setImage(menuAvatar, "./default-avatar.svg");
    return;
  }

  const profile = getDiscordProfile(user);
  topbarUsername.textContent = profile.name;
  menuName.textContent = profile.name;
  menuUsername.textContent = profile.username;
  setImage(topbarAvatar, profile.avatar);
  setImage(menuAvatar, profile.avatar);
  topbarAccount.hidden = false;
  systemStatus.hidden = true;
}

function showLogin() {
  loginView.hidden = false;
  dashboardView.hidden = true;
  updateTopbar(null);
}

function showDashboard(user) {
  const profile = getDiscordProfile(user);
  document.querySelector("#user-global-name").textContent = profile.name;
  document.querySelector("#user-username").textContent = profile.username;
  setImage(document.querySelector("#user-avatar"), profile.avatar);

  loginView.hidden = true;
  dashboardView.hidden = false;
  updateTopbar(user);
  hideError();
}

async function signOut() {
  if (!supabase) return;
  hideError();
  if (logoutButton) logoutButton.disabled = true;
  if (topbarLogoutButton) topbarLogoutButton.disabled = true;

  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    closeAccountMenu();
    showLogin();
  } catch (error) {
    showError("ออกจากระบบไม่สำเร็จ: " + (error.message || "กรุณาลองใหม่"));
  } finally {
    if (logoutButton) logoutButton.disabled = false;
    if (topbarLogoutButton) topbarLogoutButton.disabled = false;
  }
}

async function refreshSession() {
  if (!isConfigured) {
    showLogin();
    showError("กรุณาตรวจสอบการตั้งค่า Supabase ใน script.js");
    loginButton.disabled = true;
    return;
  }

  supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  loginButton.disabled = false;

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
  hideError();
  loginButton.disabled = true;

  try {
    const redirectTo = window.location.origin + window.location.pathname;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo }
    });
    if (error) throw error;
  } catch (error) {
    showError("เข้าสู่ระบบ Discord ไม่สำเร็จ: " + (error.message || "กรุณาลองใหม่"));
    loginButton.disabled = false;
  }
});

topbarProfile.addEventListener("click", () => {
  const willOpen = accountMenu.hidden;
  accountMenu.hidden = !willOpen;
  topbarProfile.setAttribute("aria-expanded", String(willOpen));
});

topbarLogoutButton.addEventListener("click", signOut);
if (logoutButton) logoutButton.addEventListener("click", signOut);

document.addEventListener("click", (event) => {
  if (!topbarAccount.contains(event.target)) closeAccountMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeAccountMenu();
});

refreshSession();
