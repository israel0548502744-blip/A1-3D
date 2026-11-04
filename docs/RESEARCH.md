# שלב 1: מחקר טכנולוגי

תאריך: 2026-11. מקרא: ✅ = אומת, ⚠️ = לפי מקורות קהילה ויאומת מול המדפסת, ❌ = לא אפשרי או לא מותר.

## 1. פרוטוקולי Bambu Lab A1

| ערוץ | פרטים | סטטוס |
|---|---|---|
| MQTT מקומי | TLS בפורט 8883, משתמש `bblp`, סיסמה = Access Code מהמסך. נושאים: `device/{SERIAL}/report` לקבלה ו-`device/{SERIAL}/request` לשליחה. התעודה של המדפסת self-signed. | ✅ |
| FTPS | Implicit TLS בפורט 990, ‏`bblp` + Access Code. כותב לכרטיס ה-SD. חיבור הנתונים דורש TLS session reuse. | ✅ (לפי דיווחים, עובד גם במצב ענן ⚠️) |
| מצלמה | ב-A1 ו-P1: זרם JPEG על TLS בפורט 6000 (חבילת auth של 80 בתים, ואחריה פריימים עם header של 16 בתים). דורש להפעיל "LAN Mode Liveview" במדפסת. | ⚠️ |
| ענן | MQTT בכתובת `us.mqtt.bambulab.com:8883`, עם token של החשבון. | ⚠️ קריאה בלבד, לא לשליטה |
| גילוי ברשת | SSDP/UDP בפורטים 1990 ו-2021: המדפסת משדרת `urn:bambulab-com:device:3dprinter`. | ⚠️ |

### פקודות MQTT עיקריות
- `{"pushing":{"sequence_id":"N","command":"pushall"}}`: בקשה לסטטוס מלא.
- `{"print":{"sequence_id":"N","command":"pause"|"resume"|"stop"}}`
- `{"print":{"command":"project_file","param":"Metadata/plate_1.gcode","url":"file:///sdcard/<file>.gcode.3mf","use_ams":bool,"ams_mapping":[..],"bed_leveling":true,"timelapse":false,...}}`: התחלת הדפסה.
- `{"system":{"command":"ledctrl","led_node":"chamber_light","led_mode":"on"|"off"}}`
- דוח הסטטוס כולל בין השאר: `gcode_state` (IDLE/RUNNING/PAUSE/FINISH/FAILED), ‏`mc_percent`, ‏`mc_remaining_time`, ‏`layer_num`, ‏`total_layer_num`, ‏`nozzle_temper`/`_target`, ‏`bed_temper`/`_target`, ‏`cooling_fan_speed`, ‏`ams`, ‏`hms` (שגיאות) ו-`subtask_name`.

### מגבלת Authorization (קריטי)
מאז קושחות 2025, **התחלת הדפסה** (`project_file`), תנועת צירים וכיול מתוכנה שאינה מאושרת על ידי במבו **חסומות במצב הרגיל (ענן)**. קריאת סטטוס, pause/resume/stop ופקודות בסיסיות ממשיכות לעבוד. ‏Developer Mode (בתוך LAN Only) פותח את הכל, אבל במצב הזה המדפסת מנותקת מהענן ו-**Bambu Handy לא עובד**.
Bambu Connect הוא הערוץ הרשמי לצד שלישי, אבל הוא אפליקציית מחשב בלבד (Windows/macOS).

**החלטה:** לא עוקפים את המנגנון. המערכת תעבוד בשני מצבים ותזהה אוטומטית באיזה מצב המדפסת נמצאת:

| יכולת | מצב ענן (Handy עובד) | מצב מפתח (Developer) |
|---|---|---|
| סטטוס חי, טמפרטורות, התקדמות | ✅ | ✅ |
| Pause / Resume / Stop / תאורה | ✅ ⚠️ | ✅ |
| העלאת קובץ ל-SD | ✅ ⚠️ | ✅ |
| **התחלת הדפסה מרחוק** | ❌: מעלים ל-SD ולוחצים "הדפס" במסך המדפסת | ✅ |
| Bambu Handy | ✅ | ❌ |

מעבר בין המצבים נעשה במסך המדפסת: Settings > WLAN > LAN Only > Developer Mode. האפליקציה תציג הוראות מעבר.

## 2. מנועי Slicer

| מנוע | רישיון | פרופיל A1 | פלט שה-A1 מצפה לו (`.gcode.3mf`) | CLI ללא מסך | תמיכות עץ | הערכה |
|---|---|---|---|---|---|---|
| **OrcaSlicer 2.4.2** | AGPL-3.0 | ✅ רשמי (BBL) | ✅ | ✅ (`--slice`, ‏`--export-3mf`, ‏`--load-settings`) | ✅ | **נבחר** |
| Bambu Studio | AGPL-3.0 | ✅ | ✅ | חלקי, מתועד פחות | ✅ | חלופה |
| PrusaSlicer | AGPL-3.0 | קהילתי | ❌ (G-code רגיל) | ✅ | ✅ | לא מתאים |
| CuraEngine | AGPL-3.0 | קהילתי | ❌ | מסורבל | ✅ | לא מתאים |
| Kiri:Moto | MIT | ידני | ❌ | רץ בדפדפן או בטלפון | ❌ | אפשרות עתידית לחיתוך אופליין |

**למה לא חיתוך בתוך הטלפון:** OrcaSlicer ו-Bambu Studio לא רצים על אנדרואיד. המנוע היחיד שרץ בטלפון (Kiri:Moto) לא מייצר את הפורמט ואת המטא-דאטה של במבו, ואין לו תמיכות עץ. הבקשה הייתה "מנוע אמיתי, אמין ותואם A1", ולכן OrcaSlicer ירוץ ב-Gateway.

פקודה לדוגמה (מתוך התיעוד הרשמי):
```
orca-slicer project.3mf --load-settings "machine.json;process.json" \
  --load-filaments filament.json --arrange 1 --slice 0 --export-3mf out.gcode.3mf
```
הפרופילים של Orca משתמשים ב-`inherits`, ולכן ה-Gateway "ישטח" את שרשרת הירושה מתוך `resources/profiles/BBL` לקובץ JSON מלא, ורק אז יחיל את ההגדרות של המשתמש.

תמיכות מצוירות ידנית: OrcaSlicer קורא צביעת תמיכה מתוך 3MF (מאפיין per-triangle). זה אפשרי, ומתוכנן בשלב 4ב.
STEP: ‏OrcaSlicer מייבא STEP בעצמו. לתצוגה בטלפון נשתמש ב-`occt-import-js` (WASM).

**סיכון פתוח:** לא הצלחתי להריץ כאן את ה-CLI של Orca, כי אין הרשאה להריץ קוד חיצוני בסביבה הזו. זו הבדיקה הראשונה בשלב 4, בתוך Docker. אם ה-CLI ייכשל בלי מסך, נריץ אותו עם `xvfb-run`.

## 3. פלטפורמת האפליקציה

| אפשרות | יתרונות | חסרונות |
|---|---|---|
| PWA | פשוטה, בלי התקנה | "פתח באמצעות" מ-WhatsApp מוגבל, אין Keystore, ואין התראות רקע אמינות |
| Android Native (Kotlin) | ביצועים מקסימליים | עורך תלת-ממד ו-UI עשיר ב-RTL דורשים פי 3 עבודה, ואין גרסת web |
| **Hybrid: Capacitor + React** | WebGL מלא (S25 Ultra חזק מספיק), ‏Intent "פתח באמצעות" ו-Share, ‏Android Keystore, התראות, אותו קוד גם כ-web | WebView קצת פחות מהיר מנייטיב |

**נבחר: Capacitor + React + TypeScript + React Three Fiber.** ה-APK ייבנה ב-GitHub Actions ויורד ישירות לטלפון.

## 4. גישה מרחוק
- **Tailscale (WireGuard)** על ה-Gateway ועל הטלפון. בלי לפתוח פורטים בראוטר, עם הצפנה מקצה לקצה. החינם מספיק לשימוש אישי.
- המדפסת עצמה לא נחשפת לאינטרנט. רק ה-Gateway מדבר איתה ב-LAN.
- Vercel לא מתאים: הוא לא יכול להגיע לרשת הביתית ולא יכול להריץ את OrcaSlicer (בגלל מגבלות גודל וזמן).

## 5. רישיונות (שימוש פרטי)
OrcaSlicer הוא AGPL-3.0 ומורץ כתהליך נפרד, בלי קישור לקוד שלנו. בשימוש פרטי אין חובות. אם יופץ, צריך לספק את קוד המקור.
שאר הספריות: three.js, R3F, React, Capacitor, FastAPI ו-Kiri:Moto הן MIT. ‏manifold-3d הוא Apache-2.0, ‏occt-import-js הוא LGPL-2.1, ו-paho-mqtt הוא EPL-2.0. כולן מתאימות.

## 6. חומרה ביתית ל-Gateway
| אפשרות | הערות |
|---|---|
| **Mini PC עם Intel N100 (x86), מומלץ** | build רשמי של Orca, חיתוך מהיר, כ-10W |
| Raspberry Pi 5 (8GB) | רק build קהילתי של Orca ל-ARM64 (`kldzj/orca-slicer-arm64`), איטי יותר |
| מחשב Windows קיים | Docker Desktop. עובד רק כשהמחשב דלוק |
| בלי מכשיר ביתי (Plan B) | חיתוך בשרת ענן (VPS), תקשורת עם המדפסת רק כשהטלפון בבית. לא מומלץ |

## מקורות
- https://forum.bambulab.com/t/updates-and-third-party-integration-with-bambu-connect/137408
- https://github.com/schwarztim/bambu-mcp
- https://all3dp.com/2/bambu-lab-lan-only-mode-explained/
- https://forum.bambulab.com/t/we-can-now-connect-to-ftp-on-the-p1-and-a1-series/6464
- https://consumerrights.wiki/w/Bambu_Lab_Authorization_Control_System
- https://github.com/OrcaSlicer/OrcaSlicer/wiki/cli_mode, ‏https://github.com/OrcaSlicer/OrcaSlicer/wiki/cli_actions
- https://github.com/kldzj/orca-slicer-arm64
- https://forum.grid.space/t/setting-my-bambu-a1-on-kiri-moto/2715
