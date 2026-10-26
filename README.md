# NTSTUDIO — GitHub Pages + Discord Login

เว็บไซต์นี้เป็น Static Site สำหรับ GitHub Pages โดยใช้ HTML/CSS/JavaScript แยกไฟล์ และใช้ Supabase Auth เป็นตัวกลาง OAuth เพื่อไม่ต้องใส่ Discord Client Secret ในโค้ดหน้าเว็บ

## ไฟล์
- `index.html` — หน้า Login และ Dashboard
- `style.css` — ธีมดำ/ม่วง responsive
- `script.js` — ตรวจ session, Discord login, แสดงโปรไฟล์, logout
- `default-avatar.svg` — รูปสำรอง

## 1. สร้าง Supabase project
1. สร้างโปรเจกต์ที่ https://supabase.com/
2. เปิด **Project Settings → API** แล้วคัดลอก Project URL และ `anon` / publishable key
3. แก้ `script.js`:
   - `SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co"`
   - `SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY"`

ค่าฝั่ง browser ต้องเป็น anon/publishable key เท่านั้น ห้ามใส่ `service_role` key หรือ Discord Client Secret ในไฟล์หน้าเว็บ

## 2. ตั้งค่า Discord OAuth ใน Supabase
1. เปิด Discord Developer Portal: https://discord.com/developers/applications
2. สร้าง Discord Application แล้วไปที่ OAuth2
3. ใน Supabase Dashboard เปิด **Authentication → Providers → Discord** แล้วเปิดใช้งาน
4. ใส่ Discord Client ID และ Client Secret ในหน้าตั้งค่า Provider ของ Supabase (เก็บ Secret ไว้ฝั่งบริการ ไม่ใส่ใน GitHub)
5. Supabase จะแสดง Callback URL สำหรับ Discord OAuth ให้คัดลอก URL นั้น
6. นำ Callback URL ของ Supabase ไปเพิ่มใน Discord Developer Portal → OAuth2 → Redirects ให้ตรงกันเป๊ะ

## 3. ตั้งค่า URL ที่อนุญาตให้กลับมาหลัง Login
ใน Supabase Dashboard ไปที่ **Authentication → URL Configuration**:
- เพิ่ม Site URL เป็น URL GitHub Pages ของคุณ เช่น `https://USERNAME.github.io/REPOSITORY/`
- เพิ่ม URL เดียวกันใน Additional Redirect URLs
- ถ้าทดสอบในเครื่อง อาจเพิ่ม `http://localhost:5500/**` ตามเครื่องมือที่ใช้

สำหรับ GitHub Pages ของ repository ปกติ URL จะเป็น `https://USERNAME.github.io/REPOSITORY/`. สำหรับ repository ชื่อ `USERNAME.github.io` URL จะเป็น `https://USERNAME.github.io/`.

## 4. เผยแพร่ GitHub Pages
1. สร้าง GitHub repository ใหม่
2. อัปโหลด `index.html`, `style.css`, `script.js`, `default-avatar.svg` และ `README.md` ไปไว้ใน root ของ repository
3. ไปที่ **Settings → Pages**
4. เลือก **Deploy from a branch**, เลือก branch `main` และ folder `/(root)` แล้วกด Save
5. รอ GitHub Pages deploy เสร็จ แล้วเปิด URL ที่ GitHub แสดง

## ข้อควรรู้
- GitHub Pages ไม่สามารถรัน Node.js/Express ได้ จึงไม่มี `server.js` ในเวอร์ชันนี้
- OAuth callback ของ Discord จะชี้ไปยัง Supabase ตามที่ Provider ตั้งไว้ ส่วน Supabase จะ redirect กลับ URL ของ GitHub Pages หลัง login
- การแสดงชื่อ/รูปโปรไฟล์ขึ้นอยู่กับข้อมูล user metadata ที่ Discord provider ส่งให้ Supabase; รูปสำรองจะแสดงเมื่อไม่มี avatar
- หากหน้าเว็บเป็น public ห้ามใส่ secret หรือ service-role key ลงใน source code
- หากต้องการฟังก์ชันที่ต้องเชื่อถือข้อมูลฝั่งเซิร์ฟเวอร์ เช่น สิทธิ์ผู้ดูแลหรือข้อมูลส่วนตัว ควรตรวจสิทธิ์ที่ backend/ฐานข้อมูล ไม่ใช่เชื่อข้อมูลที่แก้ได้จาก browser
