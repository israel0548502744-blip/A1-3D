# בדיקה משפטית: רישיונות, סימני מסחר וזכויות

מצב נכון ל-2026-11. זו בדיקה הנדסית ולא ייעוץ משפטי. לפני מכירה, עורך דין צריך לאשר את הסעיפים שמסומנים **⚖️ לעורך הדין**.

## 1. מה נארז באפליקציה

רק הרכיבים האלה נכנסים בפועל לאפליקציה (נבדק בתוכן ה-bundle שנבנה):

| רכיב | רישיון | מותר שימוש מסחרי? | מה עשינו |
|---|---|---|---|
| React, react-dom, scheduler, zustand, use-sync-external-store | MIT | כן | טקסט רישיון באפליקציה |
| three.js (כולל fflate שבתוכו) | MIT | כן | טקסט רישיון באפליקציה |
| manifold-3d (חיתוך לחלקים) | Apache-2.0 | כן | טקסט רישיון מלא באפליקציה |
| clipper-lib (קירות ומילוי בסלייסר) | Boost 1.0 | כן | טקסט רישיון באפליקציה |
| lucide-react (אייקונים) | ISC | כן | טקסט רישיון באפליקציה |
| Rubik (גופן) | SIL OFL 1.1 | כן, כחלק מאפליקציה (לא מותר למכור את הגופן לבד) | טקסט רישיון באפליקציה |
| occt-import-js + Open CASCADE (ייבוא STEP) | LGPL-2.1 | כן, בתנאים | ראו סיכון 4 |
| AndroidX, Kotlin (מעטפת האנדרואיד) | Apache-2.0 | כן | מצוין בקובץ ההודעות |

- קובץ ההודעות המלא: `apps/web/public/third-party-notices.txt`. נוצר ב-`node scripts/notices.mjs` ומוצג במסך "עוד", בכפתור "הצגת טקסט הרישיונות המלא".
- **לא נארזים**: חבילות כמו sharp, esbuild ו-gltf-transform, שמגיעות עם manifold-3d לכלי שורת הפקודה שלו. וידאתי שאינן ב-bundle.
- **לא בשימוש בכוונה**:
  - OrcaSlicer, Bambu Studio, PrusaSlicer, CuraEngine ו-cura-wasm (AGPL).
  - Bambuddy (AGPL). קראתי רק את התיעוד שלו, לא העתקתי קוד.
  - קבצי פרופילים של יצרנים וסלייסרים (AGPL/LGPL).

סריקה אוטומטית של כל התלויות (כולל עקיפות; `node scripts/license-audit.mjs apps/web`):

<details><summary>תוצאת הסריקה</summary>

| Package | Version | License | Status |
|---|---|---|---|
| @fontsource-variable/rubik | 5.1.0 | OFL-1.1 | permissive |
| @gltf-transform/core | 4.5.1 | MIT | permissive |
| @gltf-transform/extensions | 4.5.1 | MIT | permissive |
| @gltf-transform/functions | 4.5.1 | MIT | permissive |
| @img/colour | 1.1.0 | MIT | permissive |
| @jridgewell/resolve-uri | 3.1.2 | MIT | permissive |
| @jridgewell/sourcemap-codec | 1.6.0 | MIT | permissive |
| @jridgewell/trace-mapping | 0.3.31 | MIT | permissive |
| @jscadui/3mf-export | 0.5.0 | MIT | permissive |
| @nodable/entities | 3.1.0 | MIT | permissive |
| @types/ndarray | 1.1.0 | MIT | permissive |
| @types/prop-types | 15.7.15 | MIT | permissive |
| @types/react | 18.3.12 | MIT | permissive |
| anynum | 1.0.1 | MIT | permissive |
| clipper-lib | 6.4.2 | BSL | permissive |
| commander | 13.1.0 | MIT | permissive |
| convert-source-map | 2.0.0 | MIT | permissive |
| csstype | 3.2.3 | MIT | permissive |
| cwise-compiler | 1.1.3 | MIT | permissive |
| detect-libc | 2.1.2 | Apache-2.0 | permissive |
| esbuild-wasm | 0.27.7 | MIT | permissive |
| fast-xml-builder | 1.3.1 | MIT | permissive |
| fast-xml-parser | 5.12.0 | MIT | permissive |
| fflate | 0.8.3 | MIT | permissive |
| iota-array | 1.0.0 | MIT | permissive |
| is-buffer | 1.1.6 | MIT | permissive |
| is-unsafe | 2.0.3 | MIT | permissive |
| js-tokens | 4.0.0 | MIT | permissive |
| ktx-parse | 1.1.0 | MIT | permissive |
| loose-envify | 1.4.0 | MIT | permissive |
| lucide-react | 0.460.0 | ISC | permissive |
| magic-string | 0.30.21 | MIT | permissive |
| manifold-3d | 3.5.4 | Apache-2.0 | permissive |
| ndarray | 1.1.1 | MIT | permissive |
| ndarray-lanczos | 0.3.0 | MIT | permissive |
| ndarray-ops | 1.2.2 | MIT | permissive |
| ndarray-pixels | 5.2.0 | MIT | permissive |
| occt-import-js | 0.0.23 | LGPL-2.1 | LGPL: see notes |
| path-expression-matcher | 1.6.2 | MIT | permissive |
| property-graph | 4.1.0 | MIT | permissive |
| react | 18.3.1 | MIT | permissive |
| react-dom | 18.3.1 | MIT | permissive |
| scheduler | 0.23.2 | MIT | permissive |
| semver | 6.3.2 | ISC | permissive |
| sharp | 0.35.5 | Apache-2.0 | permissive |
| strnum | 2.5.1 | MIT | permissive |
| three | 0.169.0 | MIT | permissive |
| uniq | 1.0.1 | MIT | permissive |
| use-sync-external-store | 1.2.2 | MIT | permissive |
| xml-naming | 0.3.0 | MIT | permissive |
| zustand | 4.5.5 | MIT | permissive |

</details>

## 2. סיכונים

### 1. שם האפליקציה "Bambu Control Studio" — **גבוה**
"Bambu Lab" הוא סימן מסחר של Shenzhen Tuozhu Technology. שם עם המילה "Bambu" נראה כמו מוצר רשמי שלהם:
- זה מזמין תלונת סימן מסחר.
- Google Play דוחה אפליקציות שנראות כמו מוצר של חברה אחרת.

זה בדיוק מה שקרה עם "TripoSR 3D" ב-Makeo.

**לעשות:** להחליף את השם ואת מזהה החבילה (`com.bambucontrol.studio`) לפני פרסום. בתיאור בחנות מותר לכתוב "תואם ל-Bambu Lab A1", בלי לוגו ובלי לרמוז על קשר.

### 2. תנאי השימוש של Bambu Lab — **בינוני-גבוה** ⚖️ לעורך הדין
לפי מקורות משניים (את הדף הרשמי לא הצלחתי לפתוח, השרת שלהם חסם אותי):
- **§3.1** אוסר להשתמש בטכנולוגיה או בקניין הרוחני של Bambu Lab כדי לפתח תוכנה או התקנים של צד שלישי, בלי הסכמה מראש.
- **§3.4** אוסר הנדסה לאחור.
- **באפריל 2026** שלחה Bambu Lab מכתב התראה למתחזק של fork של OrcaSlicer. הטענות: התחזות ל-Bambu Studio (User-Agent מזויף), עקיפת מנגנון ההרשאות, והפרת תנאי השימוש.

**איך אנחנו בונים, כדי להקטין את הסיכון:**
- רק דרך **Developer Mode**, שבמבו עצמה מציעה.
- בלי התחזות לתוכנה שלהם ובלי עקיפת הרשאות.
- בלי שום קוד של במבו.

**השאלה לעורך הדין:** האם ותנאי השימוש (חוזה בין במבו למשתמש) חלים עלינו כמפתחים, ומה מעמדם מול חוקי תאימות (interoperability) כמו סעיף 6 של דירקטיבת התוכנה האירופית.

**המלצה:**
1. לבקש מ-Bambu Lab אישור בכתב, כמו שעשית מול Tripo ו-Qualcomm.
2. עד שיש תשובה, החיבור למדפסות במבו יוצא רק אחרי אישור עורך הדין.
3. העורך, הסלייסר וייצוא הקובץ לא נוגעים במדפסת, ולכן אינם בסיכון הזה.

### 3. שמות מותגים ודגמים ברשימת המדפסות — **נמוך**
- שימוש תיאורי בשם, כדי לציין תאימות, מקובל בדרך כלל.
- **לא** משתמשים בלוגואים או בתמונות של היצרנים.
- הוספתי הבהרה שהאפליקציה אינה קשורה ליצרנים: במסך הבחירה, במסך המדפסת, במסך "עוד" ובקובץ ההודעות.
- לא לשים שמות מותגים בכותרת האפליקציה בחנות או בפרסומות, מעבר ל"תואם ל-…".

### 4. ‏occt-import-js / Open CASCADE (LGPL-2.1) — **בינוני** ⚖️ לעורך הדין
LGPL מתיר שימוש באפליקציה סגורה, בשלושה תנאים:
1. **הספרייה נשארת קובץ נפרד שאפשר להחליף.** אצלנו היא קבצים נפרדים (‎.js ו-‎.wasm), שנטענים רק כשפותחים STEP.
2. **מצרפים את טקסט הרישיון וקישור לקוד המקור.** נעשה, בקובץ ההודעות.
3. **תנאי השימוש שלנו לא אוסרים לשנות את הרכיב הזה או לבצע בו הנדסה לאחור.**

השאלה לעורך הדין: האם קבצים בתוך APK חתום עונים על תנאי 1. אם לא, אפשר להוריד את ייבוא ה-STEP. זה רכיב אחד ומבודד.

### 5. נתוני המדפסות — **נמוך**
- מידות משטח הן עובדות, ואין עליהן זכויות יוצרים. כתבנו אותן בעצמנו, ולא העתקנו קבצי פרופיל.
- כשנייצר G-code, נכתוב קוד התחלה וסיום משלנו. לא נעתיק מפרופילים של Bambu Studio, Orca, PrusaSlicer או Cura.

### 6. פרוטוקולים של מותגים אחרים
| מותג | פרוטוקול | רמת סיכון |
|---|---|---|
| Klipper (Moonraker) | ממשק פתוח ומתועד. הקוד שלו הוא GPL, אבל אנחנו רק קוראים לו ברשת ולא כוללים ממנו קוד | נמוך |
| Prusa (PrusaLink) | ממשק רשמי | נמוך |
| OctoPrint | ממשק רשמי | נמוך |
| Elegoo (SDCP) | מפרט שהיצרן פרסם | נמוך |
| Flashforge | תיעוד קהילתי בלבד | ⚖️ לבדוק לפני מימוש |
| Anycubic | אין ממשק מתועד. לא בנינו, נשאר "קובץ בלבד" | — |

### 7. העיצוב מ-Makeo 3D — **אין סיכון**
- Makeo 3D היא אפליקציה שלך, אותו בעלים.
- לקחנו רק את רעיונות העיצוב, וכתבנו קוד חדש, ב-React ולא ב-Kotlin.

### 8. מה שהמשתמשים מדפיסים, ופרטיות — כמו ב-Makeo
- **תנאי שימוש:** צריך תנאי שימוש עם אחריות המשתמש על מה שהוא מדפיס.
- **פרטיות:** האפליקציה לא אוספת מידע, ואין בה חשבון. בכל זאת Google Play דורשת מדיניות פרטיות.

## 3. רשימת "לפני מכירה"
- [ ] שם חדש ומזהה חבילה חדש (סיכון 1). לבדוק רישום סימן מסחר.
- [ ] בקשת אישור מ-Bambu Lab, או חוות דעת עורך דין, לפני שחרור החיבור למדפסות במבו (סיכון 2).
- [ ] אישור עורך דין ל-LGPL בתוך APK, או הסרת STEP (סיכון 4).
- [ ] תנאי שימוש ומדיניות פרטיות, אפשר על בסיס של Makeo (סיכון 8).
- [ ] להריץ מחדש את `scripts/notices.mjs` ואת `scripts/license-audit.mjs` אחרי כל שינוי בתלויות.
- [x] קובץ הודעות מלא בתוך האפליקציה, והבהרת אי-קשר ליצרנים.
- [x] אין קוד AGPL ואין קבצי פרופילים של יצרנים בתוך האפליקציה.

## מקורות
- Bambu Lab, תנאי שימוש: https://bambulab.com/en-us/policies/terms (סעיפים 3.1 ו-3.4, לפי https://consumerrights.wiki/w/Bambu_Lab)
- Bambu Lab, Authorization Control: https://consumerrights.wiki/w/Bambu_Lab_Authorization_Control_System
- דוגמה למדיניות שימוש בסימני מסחר של צד שלישי: https://handbook.gitlab.com/handbook/legal/policies/product-third-party-trademarks-guidelines
