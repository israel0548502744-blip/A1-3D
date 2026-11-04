# התקנת Bambuddy על מחשב לינוקס ביתי

> המדריך מבוסס על ה-README של Bambuddy (נבדק ב-2026-11). אם פקודה כאן לא תואמת את המצב הנוכחי, הגרסה הקובעת היא https://github.com/maziggy/bambuddy.

## 0. מה צריך
- מחשב עם Ubuntu 24.04 (או דומה), מחובר בכבל או ב-Wi-Fi לאותה רשת של המדפסת, ודלוק כל הזמן.
- ה-A1 מחובר ל-Wi-Fi הביתי.

## 1. התקנת Docker
```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER   # אחרי זה צריך להתנתק ולהתחבר מחדש
```

## 2. התקנת Bambuddy
```bash
mkdir ~/bambuddy && cd ~/bambuddy
curl -O https://raw.githubusercontent.com/maziggy/bambuddy/main/docker-compose.yml
docker compose up -d
```
אחרי ההתקנה פותחים בדפדפן במחשב: `http://localhost:8000`.
הקובץ משתמש ב-`network_mode: host`, שנדרש לגילוי המדפסת ולמצלמה. בלינוקס משאירים אותו כמו שהוא.

עדכון לגרסה חדשה: `docker compose pull && docker compose up -d`

## 3. מנוע החיתוך (Slicer sidecar)
כפתור "Slice" יופיע רק אחרי שמתקינים את ה-stack שבתיקייה `slicer-api/` של הריפו, לפי `slicer-api/README.md` שם.
⚠️ עוד לא עברתי על המדריך הזה. נעבור עליו יחד בזמן ההתקנה.

## 4. הגדרת המדפסת
במסך ה-A1:
1. ‏Settings > Network (WLAN) > **LAN Only Mode** ← מפעילים.
2. ‏**Developer Mode** (מופיע רק אחרי שלב 1) ← מפעילים.
3. רושמים את ה-**Access Code**, ה-**IP** וה-**Serial Number**.

ב-Bambuddy: ‏Add Printer ← סריקת רשת או הזנה ידנית של IP, Serial ו-Access Code.

## 5. גישה מכל מקום עם Tailscale
```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```
בטלפון: מתקינים את Tailscale מ-Google Play ומתחברים לאותו חשבון.
אחרי זה, בכל מקום בעולם, פותחים בטלפון את `http://<שם-המחשב>:8000` (השם מופיע באפליקציית Tailscale) ב-Chrome. בתפריט בוחרים "הוספה למסך הבית", ומקבלים אייקון כמו של אפליקציה.
לא פותחים שום פורט בראוטר.

## 5א. אפליקציית Bambu Control לטלפון (APK)
האפליקציה מציגה את Bambuddy שרץ בבית, במסך מלא ובלי שורת כתובת. כל העבודה (חיתוך ושליטה במדפסת) נעשית בשרת, והטלפון לא שומר שום סיסמה של המדפסת.
1. בטלפון: פותחים את דף ה-Releases של הריפו (`.../A1-3D/releases`) ← מורידים את `BambuControl-N.apk`.
2. מאשרים "התקנה ממקורות לא ידועים" עבור Chrome או "הקבצים שלי".
3. בפתיחה הראשונה מזינים את כתובת השרת, למשל `bambu-pc:8000` (מ-Tailscale) או `192.168.1.50:8000`. האפליקציה בודקת חיבור אמיתי לפני השמירה.
4. כדי לשנות כתובת: לחיצה ארוכה על האייקון ← "שינוי כתובת שרת".

⚠️ עד שיוגדר מפתח חתימה קבוע (ב-GitHub Secrets: ‏`SIGNING_KEYSTORE_B64`, ‏`SIGNING_STORE_PASSWORD`, ‏`SIGNING_KEY_ALIAS`, ‏`SIGNING_KEY_PASSWORD`), כל גרסה חדשה נחתמת במפתח אחר. לכן לפני התקנת גרסה חדשה צריך להסיר את הקודמת.

## 6. מה עובד בכל מצב של המדפסת
| | מצב רגיל (ענן) | מצב מפתח (LAN Only + Developer) |
|---|---|---|
| Bambu Handy בטלפון | ✅ | ❌ |
| הדפסה מ-MakerWorld בלחיצה ב-Handy | ✅ | ❌ (מורידים את הקובץ וחותכים ב-Bambuddy) |
| Bambu Studio או Orca במחשב | ✅ | ✅ דרך LAN, באותה רשת או דרך ה-Proxy של Bambuddy |
| Bambuddy: חיתוך והדפסה מהטלפון | ⚠️ ייבדק. צפוי להיות קריאה בלבד | ✅ גם מחוץ לבית |
| מצלמה, ניטור והתראות מרחוק | ✅ דרך Handy | ✅ דרך Bambuddy ו-Tailscale |
| עדכוני קושחה | ✅ | דרך כרטיס SD, או מעבר זמני למצב רגיל |

המעבר בין המצבים נעשה במסך המדפסת ולוקח כ-10 שניות.
⚠️ דווח שבקושחה 01.07.02.00, אחרי כיבוי LAN Only, צריך לקשר מחדש את המדפסת ל-Handy. נבדוק את זה אצלך.
