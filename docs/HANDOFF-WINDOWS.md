# מסמך העברה: הקמת Bambu Control Studio על מחשב Windows ביתי

> **למי המסמך הזה:** לסשן של Claude Code שרץ על מחשב ה-Windows הביתי של המשתמש, וגם למשתמש עצמו (החלקים הפיזיים במסך המדפסת). כל ההודעות למשתמש בעברית.
> הריפו: `israel0548502744-blip/A1-3D`, ענף `ccr-4f352a0e-yr2am6`.

## רקע בקצרה
המשתמש רוצה לשלוט במדפסת **Bambu Lab A1** מהטלפון (Galaxy S25 Ultra): להעלות STL/3MF, לחתוך (slice) אמיתית עם תמיכות, לשלוח להדפסה, ולנטר בבית ומחוץ לבית.
**ההחלטה הארכיטקטונית:** המחשב הביתי (Windows, דלוק תמיד) מריץ את **Bambuddy** (פרויקט קוד פתוח, AGPL-3.0) + מנוע חיתוך OrcaSlicer. הטלפון מריץ APK בשם **Bambu Control** (כבר נבנה, מעטפת בעברית מעל Bambuddy). גישה מרחוק דרך **Tailscale**.
**מגבלה שאסור לעקוף:** המדפסת חוסמת התחלת הדפסה מתוכנה חיצונית אלא אם היא במצב **LAN Only + Developer Mode**. לא עוקפים חתימת קושחה ולא פורצים את המדפסת. במצב מפתח, Bambu Handy מפסיק לעבוד עד שמחזירים את המדפסת למצב רגיל (החלפה ידנית במסך המדפסת, ~10 שניות).

## מה כבר מוכן (אין צורך לבנות מחדש)
- ה-APK: ‏`https://github.com/israel0548502744-blip/A1-3D/releases/download/android-build-1/BambuControl-1.apk`
- קוד האפליקציה: ‏`apps/android/`
- מסמכים: ‏`docs/RESEARCH.md`, ‏`docs/ARCHITECTURE.md`, ‏`docs/ROADMAP.md`, ‏`docs/INSTALL.md`

---

## חלק א' — על מחשב ה-Windows

### שלב 1: התקנת Bambuddy (ליבה)
מתקין עצמאי, לא צריך Python/Docker/Git בשבילו.
1. מורידים: `https://github.com/maziggy/bambuddy/releases/latest/download/bambuddy-windows-x64-setup.exe`
2. מריצים. אם קופץ "Windows protected your PC" (SmartScreen) ← **More info ← Run anyway**. (המתקין עדיין לא חתום דיגיטלית, זה תקין.)
3. מאשרים UAC פעם אחת. Bambuddy מותקן כ**שירות Windows** שרץ ברקע תמיד.
4. נפתח אוטומטית: `http://localhost:8000`.
- נתונים: `C:\ProgramData\Bambuddy\`. התקנה: `C:\Program Files\Bambuddy\`.
- עדכון בעתיד: מריצים מתקין חדש מעל הישן. ה-DB וההיסטוריה נשמרים.

### שלב 2: מנוע החיתוך (OrcaSlicer) — דרוש Docker
כפתור ה-**Slice** ב-Bambuddy מופיע רק כשרץ ה-"slicer-api". הוא מגיע כ-Docker image בלבד (אין לו מתקין Windows נפרד). לכן:
1. מתקינים **Docker Desktop for Windows**: `https://www.docker.com/products/docker-desktop/`. מפעילים, ומוודאים שהוא רץ (אייקון הלווייתן).
2. משיגים את קבצי ה-slicer-api מהריפו של Bambuddy:
   ```powershell
   git clone https://github.com/maziggy/bambuddy.git
   cd bambuddy\slicer-api
   copy .env.example .env
   docker compose up -d
   ```
   (אם אין git: מורידים ZIP מ-`https://github.com/maziggy/bambuddy` ← Code ← Download ZIP, ונכנסים לתיקיית `slicer-api`.)
3. בדיקת בריאות: בדפדפן או ב-PowerShell `curl http://localhost:3003/health` אמור להחזיר תקין (OrcaSlicer על פורט 3003).
4. **לא** להשתמש בפורטים 3000 ו-3002 (שמורים ל-virtual printer של Bambuddy).

### שלב 3: לחבר את מנוע החיתוך ל-Bambuddy
ב-Bambuddy (בדפדפן, `http://localhost:8000`): **Settings → Slicer**:
- Preferred Slicer: **OrcaSlicer**
- מפעילים **Use Slicer API**
- Sidecar URL: `http://localhost:3003`
- שומרים. עכשיו כפתור Slice אמור להופיע.

### שלב 4: Tailscale (גישה מכל מקום)
1. מורידים ומתקינים: `https://tailscale.com/download/windows`
2. מתחברים עם חשבון (Google וכו'). רושמים את שם המחשב שמופיע ב-Tailscale (למשל `bambu-pc`).
3. חשוב: לוודא שחומת האש של Windows לא חוסמת את פורט 8000 ברשת הפרטית. בדרך כלל Bambuddy מטפל בזה; אם הטלפון לא מתחבר, זה החשוד הראשון.

---

## חלק ב' — במסך המדפסת (המשתמש עושה פיזית)

### שלב 5: מצב מפתח
1. במסך ה-A1: **הגדרות** (גלגל שיניים) ← לשונית **רשת / WLAN**.
2. מפעילים **LAN Only Mode** ומאשרים.
3. מופיע מתג **Developer Mode** ← מפעילים.
4. רושמים שלושה דברים:
   - **Access Code** (מופיע באותו מסך)
   - **IP** של המדפסת (במסך הרשת)
   - **Serial Number** (במסך המידע על המכשיר)

> אם אין "Developer Mode" בתפריט ← צריך לעדכן קושחה (דרך כרטיס SD, כי Handy לא יעבוד במצב הזה).
> חזרה למצב רגיל בעתיד: מכבים LAN Only Mode. ייתכן שיידרש לחבר מחדש את המדפסת ל-Handy.

### שלב 6: להוסיף את המדפסת ב-Bambuddy
ב-Bambuddy: **Add Printer** ← סריקת רשת, או הזנה ידנית של ה-IP, ה-Serial וה-Access Code מהשלב הקודם.
אם מופיע צורך ב-"Store sent files on external storage" — מפעילים.

---

## חלק ג' — הטלפון

### שלב 7: התקנת ה-APK
1. בטלפון פותחים: `https://github.com/israel0548502744-blip/A1-3D/releases` ומורידים את `BambuControl-N.apk` (הגבוה ביותר).
2. מאשרים "התקנה ממקורות לא ידועים".
3. פתיחה ראשונה: מזינים כתובת שרת.
   - בבית: `IP-של-המחשב:8000` (למשל `192.168.1.50:8000`)
   - מכל מקום: `שם-המחשב-בTailscale:8000` (למשל `bambu-pc:8000`)
4. האפליקציה בודקת חיבור אמיתי לפני שמירה. אם נכשל ← המחשב כבוי, Bambuddy לא רץ, או Tailscale לא מחובר בטלפון.

---

## בדיקת קבלה (מה לדווח בחזרה לסשן הראשי)
1. האם Bambuddy רץ ב-`http://localhost:8000` על המחשב? ✅/❌
2. האם כפתור Slice הופיע (slicer-api בריא)? ✅/❌
3. האם המדפסת נוספה ומוצגת כ-Online ב-Bambuddy? ✅/❌
4. חיתוך מבחן: להעלות קובייה 20 מ"מ, לחתוך, ולראות הערכת זמן/משקל. ✅/❌
5. הדפסת מבחן מהטלפון (במצב מפתח). ✅/❌
6. האם האפליקציה בטלפון מתחברת — בבית ודרך Tailscale? ✅/❌
7. מה חסר/לא נוח: עברית בממשק Bambuddy? "פתח באמצעות" מ-WhatsApp? כלי עריכה?

## כללים לסשן שמבצע
- כל ההודעות למשתמש **בעברית** (ראה `CLAUDE.md`).
- לא לעקוף את ה-Authorization של במבו ולא לפרוץ קושחה.
- דיווח כן: אם שלב נכשל, אומרים זאת עם הפלט המדויק, לא "הכול עובד".
- לא להמציא נתונים; פעולה מול המדפסת נחשבת הצלחה רק אחרי אישור מהמדפסת.

## מסלול עתידי שנרשם (לא עכשיו)
- **חיתוך על הטלפון עצמו** עם CuraEngine מהודר ל-ARM, אולי משולב בזרימה של Bambuddy. מחקר נפרד, איכות מול Bambu Studio תיבדק. שימו לב לרישיון AGPL-3.0 של כל מנועי החיתוך.
- **תרגום Bambuddy לעברית + RTL** (יש לו מערכת i18n עם 15 שפות, עברית חסרה).
