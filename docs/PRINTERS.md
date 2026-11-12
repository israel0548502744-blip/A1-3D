# תמיכה במדפסות — מחקר ותוכנית

נבדק 2026-11. מקור האמת לרשימה הוא הקוד: `apps/web/src/printers/catalog.ts` (הטבלה למטה נוצרה ממנו).

## סדר הפופולריות
- **מותגים:** לפי נתח שוק 2025–26: Bambu Lab מובילה (Gminsights: מעל 43% ב-2025), אחריה Creality, Elegoo, Anycubic, Prusa, ואז Qidi, Flashforge, Sovol, Artillery ובניות DIY. המקורות חלוקים על סדר Bambu/Creality ב-2025, אבל ב-2026 Bambu בבירור ראשונה.
- **דגמים:** לפי רשימות רבי-מכר (P1S, Ender-3 V3 SE, Neptune 4, P2S ועוד). 12 הנפוצים ביותר מכל המותגים מופיעים בראש מסך הבחירה (⭐).

## משפחות חיבור
| משפחה | איך מתחברים | פתוח? | סטטוס אצלנו |
|---|---|---|---|
| **Bambu Lab** | MQTT/TLS 8883 + FTPS 990. התחלת הדפסה רק ב-LAN Only + Developer Mode | מצב מפתח רשמי של במבו | ליבת פקודות + פענוח נבנו ונבדקו (`services/bridge`). רשת: ייבדק מול מדפסת |
| **Klipper / Moonraker** | HTTP + WebSocket, פורט 7125. העלאה `POST /server/files/upload`, הדפסה `/printer/print/start`, סטטוס `printer.objects.subscribe` | ממשק פתוח ומתועד | מתוכנן |
| **Prusa (PrusaLink)** | HTTP מקומי מובנה במדפסת. אימות: מקורות חלוקים (API key או שם משתמש/סיסמה) — לבדוק במדפסת | ממשק רשמי | מתוכנן |
| **Elegoo SDCP** | WebSocket ‏`ws://IP:3030/websocket`, גילוי UDP 3000. מפרט רשמי פורסם (cbd-tech, SDCP V3.0.0) | פרוטוקול מפורסם | מתוכנן. CC2 עובד אחרת (MQTT) |
| **Flashforge** | HTTP פורט 8898 (`/uploadGcode`, `/printGcode`), מספר סידורי + Check Code | מתועד ע"י הקהילה בלבד | בבדיקה |
| **OctoPrint** | REST עם API key | פתוח ומתועד | מתוכנן |
| **Anycubic** | LAN Mode רשמי עובד רק עם Anycubic Slicer Next; אין ממשק מתועד | סגור | **קובץ בלבד** — לא נבנה על הנדסה לאחור |
| **Creality K1 / KE / V3** | Klipper, אבל לפי מקורות Moonraker סגור בקושחת המקור (דורש root) | חלקי | לא נבקש ממשתמשים root. נבדוק דגם-דגם |
| **Creality K2** | לפי דיווחים Moonraker פתוח ב-7125 בקושחת המקור | כנראה | ייבדק מול מדפסת |

עיקרון: **מתחברים רק בדרכים רשמיות או בפרוטוקולים מפורסמים**. לא עוקפים הגנות, לא מתחזים לתוכנת היצרן, ולא מבקשים מהמשתמש לפרוץ את המדפסת.

## חוויית שימוש
1. בפתיחה הראשונה: "איזו מדפסת יש לך?" — חיפוש, סינון לפי מותג, והנפוצות למעלה. אפשר לדלג (ברירת מחדל A1).
2. העורך מציג את המשטח המדויק של המדפסת (גם מלבני, למשל Prusa 250×210) ומסמן מודל שחורג.
3. במסך המדפסת: הוראות חיבור לפי המשפחה, ועריכת גודל משטח עם "חזרה למפרט".
4. מדפסות בלי ממשק נתמך: חותכים ומייצאים קובץ ל-SD/USB.

## כל המדפסות ברשימה
| # | מדפסת | משטח (מ"מ) | חיבור | קובץ | הערה |
|---|---|---|---|---|---|
| 1 | Bambu Lab A1 ⭐ | 256×256×256 | Bambu LAN (מצב מפתח) | gcode.3mf |  |
| 2 | Bambu Lab P1S ⭐ | 256×256×256 | Bambu LAN (מצב מפתח) | gcode.3mf |  |
| 3 | Bambu Lab A1 mini ⭐ | 180×180×180 | Bambu LAN (מצב מפתח) | gcode.3mf |  |
| 4 | Bambu Lab P2S ⭐ | 256×256×256 | Bambu LAN (מצב מפתח) | gcode.3mf |  |
| 5 | Bambu Lab X1 Carbon | 256×256×256 | Bambu LAN (מצב מפתח) | gcode.3mf |  |
| 6 | Bambu Lab P1P | 256×256×256 | Bambu LAN (מצב מפתח) | gcode.3mf |  |
| 7 | Bambu Lab H2S | 340×320×340 | Bambu LAN (מצב מפתח) | gcode.3mf |  |
| 8 | Bambu Lab H2D | 325×320×325 (לבדיקה) | Bambu LAN (מצב מפתח) | gcode.3mf | nozzleSingle |
| 9 | Bambu Lab X1E | 256×256×256 | Bambu LAN (מצב מפתח) | gcode.3mf |  |
| 10 | Creality K1C ⭐ | 220×220×250 | Klipper / Moonraker | gcode | crealityStock |
| 11 | Creality Ender-3 V3 SE ⭐ | 220×220×250 | קובץ בלבד | gcode |  |
| 12 | Creality K2 Plus ⭐ | 350×350×350 | Klipper / Moonraker | gcode | crealityK2 |
| 13 | Creality K1 Max | 300×300×300 | Klipper / Moonraker | gcode | crealityStock |
| 14 | Creality Ender-3 V3 KE | 220×220×240 | Klipper / Moonraker | gcode | crealityStock |
| 15 | Creality K1 | 220×220×250 | Klipper / Moonraker | gcode | crealityStock |
| 16 | Creality K2 Pro | 300×300×300 | Klipper / Moonraker | gcode | crealityK2 |
| 17 | Creality K2 | 260×260×260 | Klipper / Moonraker | gcode | crealityK2 |
| 18 | Creality Ender-3 V3 | 220×220×250 | Klipper / Moonraker | gcode | crealityStock |
| 19 | Creality Hi | 260×260×300 (לבדיקה) | Klipper / Moonraker | gcode | crealityStock |
| 20 | Creality Ender-3 V3 Plus | 300×300×330 (לבדיקה) | Klipper / Moonraker | gcode | crealityStock |
| 21 | Creality Ender-3 S1 Pro | 220×220×270 | קובץ בלבד | gcode |  |
| 22 | Creality Ender-3 V2 | 220×220×250 | קובץ בלבד | gcode |  |
| 23 | Creality Ender-5 S1 | 220×220×280 | קובץ בלבד | gcode |  |
| 24 | Creality CR-10 SE | 220×220×265 (לבדיקה) | Klipper / Moonraker | gcode | crealityStock |
| 25 | Elegoo Centauri Carbon ⭐ | 256×256×256 | SDCP | gcode |  |
| 26 | Elegoo Neptune 4 Pro ⭐ | 225×225×265 | Klipper / Moonraker | gcode |  |
| 27 | Elegoo Neptune 4 | 225×225×265 | Klipper / Moonraker | gcode |  |
| 28 | Elegoo Neptune 4 Plus | 320×320×385 | Klipper / Moonraker | gcode |  |
| 29 | Elegoo Neptune 4 Max | 420×420×480 | Klipper / Moonraker | gcode |  |
| 30 | Anycubic Kobra 3 ⭐ | 250×250×260 | קובץ בלבד | gcode | anycubic |
| 31 | Anycubic Kobra S1 | 250×250×250 | קובץ בלבד | gcode | anycubic |
| 32 | Anycubic Kobra 2 Neo | 220×220×250 | קובץ בלבד | gcode |  |
| 33 | Anycubic Kobra 3 Max | 420×420×500 (לבדיקה) | קובץ בלבד | gcode | anycubic |
| 34 | Prusa CORE One ⭐ | 250×220×270 | PrusaLink | gcode |  |
| 35 | Prusa MK4S ⭐ | 250×210×220 | PrusaLink | gcode |  |
| 36 | Prusa MK4 | 250×210×220 | PrusaLink | gcode |  |
| 37 | Prusa MINI+ | 180×180×180 | PrusaLink | gcode |  |
| 38 | Prusa XL | 360×360×360 | PrusaLink | gcode |  |
| 39 | Prusa MK3S+ | 250×210×210 | OctoPrint | gcode | mk3 |
| 40 | Qidi Q1 Pro | 245×245×240 | Klipper / Moonraker | gcode |  |
| 41 | Qidi Plus4 | 305×305×280 | Klipper / Moonraker | gcode |  |
| 42 | Qidi X-Plus 3 | 280×280×270 | Klipper / Moonraker | gcode |  |
| 43 | Qidi X-Max 3 | 325×325×315 | Klipper / Moonraker | gcode |  |
| 44 | Flashforge Adventurer 5M | 220×220×220 | Flashforge HTTP | gcode |  |
| 45 | Flashforge Adventurer 5M Pro | 220×220×220 | Flashforge HTTP | gcode |  |
| 46 | Flashforge AD5X | 220×220×220 | Flashforge HTTP | gcode |  |
| 47 | Sovol SV06 | 220×220×250 | קובץ בלבד | gcode |  |
| 48 | Sovol SV08 | 350×350×345 | Klipper / Moonraker | gcode |  |
| 49 | Sovol SV07 | 220×220×250 | Klipper / Moonraker | gcode |  |
| 50 | Sovol SV06 Plus | 300×300×340 | קובץ בלבד | gcode |  |
| 51 | Artillery Sidewinder X2 | 300×300×400 | קובץ בלבד | gcode |  |
| 52 | Artillery Genius Pro | 220×220×250 | קובץ בלבד | gcode |  |
| 53 | Voron 2.4 / Trident | 300×300×300 | Klipper / Moonraker | gcode | diySize |
| 54 | Voron 0.2 | 120×120×120 | Klipper / Moonraker | gcode |  |
| 55 | (klipper) | 220×220×250 | Klipper / Moonraker | gcode | diySize |
| 56 | (octoprint) | 220×220×250 | OctoPrint | gcode | diySize |
| 57 | (file) | 220×220×250 | קובץ בלבד | gcode | diySize |

הערות (`note`): ‏nozzleSingle = מידות לנחיר יחיד; crealityStock/crealityK2 = ראו טבלת המשפחות; anycubic = קובץ בלבד; mk3 = רשת דרך Raspberry Pi; diySize = גודל משתנה, המשתמש מאשר.

## מקורות
- נתח שוק: https://www.gminsights.com/industry-analysis/personal-3d-printers-market , https://3druck.com/en/industry-2/3d-printers-boom-bambu-lab-displaces-creality-from-top-spot-04157946/
- Moonraker: https://moonraker.readthedocs.io/en/latest/web_api/
- PrusaLink: https://help.prusa3d.com/article/prusa-connect-and-prusalink-explained_302608
- Elegoo SDCP: https://github.com/cbd-tech/SDCP-Smart-Device-Control-Protocol-V3.0.0 , https://suchmememanyskill.github.io/OpenCentauri/software/api
- Creality: https://docs.printago.io/docs/connecting-printers/creality , https://infinityflow3d.com/blogs/flowq-printer-connection-guides/creality-k1-ender-3-v3-series-connection-guide-flowq
- Flashforge: https://github.com/Parallel-7/flashforge-api-docs
- Anycubic: https://wiki.anycubic.com/zh/fdm-3d-printer/kobra-s1-max-combo/lan-connection-guide , https://simplyprint.io/compatibility/anycubic
- מידות במבו H2S/H2D/P2S: https://bambuhub.net/tools/printer-comparison ; Creality K2: https://www.creality.com/products/k2-series
