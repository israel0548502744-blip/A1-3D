# ארכיטקטורה: Bambu Control Studio

## תמונה כללית
```
 ┌──────────── Galaxy S25 Ultra ────────────┐          ┌──────────── בית ────────────────────────────┐
 │ אפליקציית Android (Capacitor)            │ Tailscale│ Gateway (Docker, Mini PC / Pi 5)            │
 │  React + TS + R3F, ‏UI בעברית (RTL)       │ WireGuard│  FastAPI                                    │
 │  • Dashboard  • ספריית מודלים            │◀───────▶ │   ├─ auth        (JWT, Argon2id)           │
 │  • עורך 3D (manifold-3d: cut/split)      │ HTTPS+WS │   ├─ files       (SQLite + אחסון מקומי)    │
 │  • הגדרות Slicer  • תצוגת G-code         │          │   ├─ slicer      (תור עבודות → OrcaSlicer CLI)│
 │  • שליטה במדפסת   • פילמנט ועלויות       │          │   ├─ printer     (PrinterDriver → BambuA1)  │
 │  Keystore: token בלבד                    │          │   │     MQTT/TLS 8883 · FTPS 990 · Cam 6000 │
 └──────────────────────────────────────────┘          │   └─ events      (WebSocket)                │
                                                       └───────────────┬─────────────────────────────┘
                                                                       │ LAN בלבד
                                                               Bambu Lab A1 (Wi-Fi)
```

## הפרדת אחריות (5 שכבות)
1. **ממשק משתמש** (`apps/mobile`): לא מדבר עם המדפסת ישירות ולא מחזיק Access Code.
2. **ניהול קבצים** (`gateway/app/files`): העלאה, בדיקת תקינות (trimesh: פענוח, manifold, גבולות), ספרייה, תיקיות ופרויקטים.
3. **מנוע Slicer** (`gateway/app/slicer`): בונה פרויקט 3MF מהמודלים והטרנספורמציות, משטח פרופילים, ומריץ את Orca כתהליך נפרד דרך תור (עבודה אחת בכל פעם, timeout, ביטול). התוצאה היא `.gcode.3mf` ומטא-דאטה (זמן, גרמים ומטרים לכל פילמנט) שנלקחת מ-`slice_info.config` ומה-header של ה-G-code.
4. **תקשורת מדפסת** (`gateway/app/printer`): ממשק `PrinterDriver` (`connect`, ‏`status`, ‏`upload`, ‏`start_print`, ‏`pause`, ‏`resume`, ‏`stop`, ‏`camera`, ‏`capabilities`). המימוש הראשון הוא `BambuA1Driver`, ומדפסות נוספות יקבלו driver משלהן.
5. **גישה מרחוק**: ‏Tailscale ברמת הרשת, ואימות משתמש ברמת האפליקציה. אין פורטים פתוחים בראוטר.

## זרימות עיקריות
**העלאה:** קובץ (מקבצים, Drive או "פתח באמצעות" מ-WhatsApp) ← בדיקת סוג וגודל ← `POST /models` ← ה-Gateway מאמת את ה-mesh ← נשמר בספרייה ← מוצג בתלת-ממד.

**חיתוך:** הלקוח שולח פרויקט (מודלים, מטריצות, הגדרות) ← `POST /slice-jobs` ← תור ← Orca ← WebSocket עם התקדמות ← תוצאה: קובץ, הערכות ו-G-code ← תצוגת שכבות בלקוח (parser ב-Web Worker, צבע לפי `; FEATURE:` שמגיע מ-Orca).

**הדפסה:**
1. בדיקת זמינות (`gcode_state` במצב IDLE/FINISH, והמדפסת online).
2. מסך אישור למשתמש.
3. נוצר מפתח Idempotency (hash של הקובץ ו-job id). מונע שליחה כפולה.
4. העלאה ב-FTPS ואימות גודל הקובץ.
5. במצב מפתח: `project_file`. במצב ענן: הודעה "הקובץ על ה-SD, התחל במסך המדפסת".
6. הצלחה מוצגת **רק** כשמגיע דוח MQTT שבו `subtask_name` תואם ו-`gcode_state` עבר ל-PREPARE או RUNNING.

**שליטה:** כל פקודה נשלחת עם `sequence_id`, וה-UI מחכה לשינוי מצב בדוח עד timeout של 10 שניות. אם לא מגיע אישור, מוצגת שגיאה עם אפשרות לנסות שוב.

## נתונים (SQLite)
`users`, ‏`printers` (ה-access_code מוצפן), ‏`models`, ‏`folders`, ‏`projects`, ‏`slice_jobs`, ‏`print_jobs`, ‏`profiles` (user, system), ‏`spools`, ‏`filament_usage`, ‏`audit_log`. הקבצים נשמרים ב-`/data/files/<sha256>`.

## אבטחה
- סיסמת משתמש נשמרת כ-Argon2id. ‏JWT לגישה ל-15 דקות, ו-refresh token מסובב שנשמר ב-Android Keystore.
- ה-Access Code של המדפסת מוצפן ב-AES-GCM (‏`cryptography`). המפתח נמצא ב-`/data/secret.key` מחוץ ל-DB, ולעולם לא נשלח ל-frontend.
- צימוד טלפון ל-Gateway בפעם הראשונה דרך קוד חד-פעמי או QR.
- הגבלת גודל העלאה (200MB), בדיקת סוג הקובץ, פענוח בתהליך מבודד עם timeout.
- Retry עם backoff אקספוננציאלי ל-MQTT ול-FTPS, וחיבור מחדש אוטומטי. כל פעולה נרשמת ב-audit_log, ולוגים במבנה JSON.

## זיהוי מצב המדפסת (ענן או מפתח)
ה-Gateway מנסה פקודה לא הרסנית שמותרת רק במצב מפתח, או מזהה דחייה בתשובת `project_file`. התוצאה נשמרת ב-`capabilities`. ה-UI מציג תג "מצב ענן, Handy פעיל" או "מצב מפתח, שליטה מלאה". כפתור "הדפס מרחוק" זמין רק במצב מפתח, ובמצב ענן מוצג במקומו "העלה ל-SD".
⚠️ האופן המדויק של הזיהוי ייקבע בשלב 5 מול המדפסת האמיתית.

## טכנולוגיות
| תחום | בחירה |
|---|---|
| Mobile | React 18, TypeScript, Vite, React Three Fiber + drei, Zustand, TanStack Query, Capacitor 6 |
| 3D | three.js loaders (STL/3MF/OBJ), ‏occt-import-js (STEP), ‏manifold-3d (Cut/Split/תקינות) |
| Gateway | Python 3.12, FastAPI, SQLModel/SQLite, paho-mqtt, ftplib (FTPS עם session reuse), trimesh, structlog |
| Slicer | OrcaSlicer 2.4.2 CLI (+xvfb אם יידרש) |
| Infra | Docker Compose, Tailscale, GitHub Actions (APK + בדיקות) |
| בדיקות | Vitest, Playwright (UI), pytest, סימולטור MQTT/FTPS לבדיקות בלבד (לא מוצג באפליקציה) |

## מבנה התיקיות
```
apps/mobile/          src/{app,features/{dashboard,library,editor,slicer,preview,printer,filament,settings},i18n,ui}
services/gateway/     app/{api,auth,files,slicer,printer/{base.py,bambu/},events,db}  tests/
deploy/               docker-compose.yml, gateway.Dockerfile
docs/                 RESEARCH.md, ARCHITECTURE.md, ROADMAP.md
.github/workflows/    android.yml, gateway.yml
```
