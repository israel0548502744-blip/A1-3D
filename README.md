# Bambu Control Studio

אפליקציה פרטית לניהול מלא של מדפסת **Bambu Lab A1** מהטלפון (Galaxy S25 Ultra): העלאת מודלים, עריכה בתלת-ממד, Slicing אמיתי עם OrcaSlicer, תצוגת שכבות, שליחה להדפסה, ושליטה בזמן אמת, בבית ומחוץ לבית.

**סטטוס:**
- שלב 1 (מחקר ואפיון) הושלם.
- עורך תלת-ממד בדפדפן (`apps/web`) עובד: טעינת STL/3MF/OBJ, תצוגה על משטח ה-A1, הזזה/סיבוב/קנה-מידה/שיקוף/שכפול/סידור אוטומטי, אזהרת חריגה מגבולות, וייצוא STL. ממשק עברית RTL, מצב כהה/בהיר.
- אפליקציית אנדרואיד (`apps/android`) שמציגה שרת Bambuddy ביתי.
- **טרם מומש:** חיתוך אמיתי (Slice) ל-G-code, חיתוך מודל לחלקים, וחיבור ישיר מהטלפון למדפסת.

### להריץ מקומית
```bash
cd apps/web && npm install && npm run dev
```

### מסמכים
- [מחקר](docs/RESEARCH.md) · [ארכיטקטורה](docs/ARCHITECTURE.md) · [תוכנית פיתוח](docs/ROADMAP.md) · [התקנה](docs/INSTALL.md) · [הקמה ב-Windows](docs/HANDOFF-WINDOWS.md)
