# VSB StudyHub - CSE (AI & ML) Department Portal

An autonomous academic portal and digital repository engineered specifically for undergraduate scholars of **Computer Science and Engineering (Artificial Intelligence and Machine Learning)** at **VSB Engineering College (Autonomous)**, affiliated with Anna University Chennai and approved by AICTE.

---

## 🏛️ System Architecture & Dedicated Webpages

1. **Academic Home Portal (`index.html`)**
   - Official VSB circular gear emblem and scholarly study desk hero section.
   - Live department status strip (`Semesters Covered`, `Curriculum Courses`, `Live Resources`, `Total Verified Downloads`).
   - Dynamic notice board circulars managed live via Admin Center.
   - Real-time search engine with instant course folio jump.

2. **Semesters Roadmap (`semesters.html`)**
   - 8-semester curriculum roadmap from foundational engineering to advanced generative AI and autonomous robotics.
   - Dynamic user-term highlight (`(Your Active Term)`) tied directly to the enrolled student's registered semester.
   - Live term materials repository reflecting verified curriculum documents and question papers.

3. **Core & Elective Subjects (`subjects.html`)**
   - Subject folios with verified instructor credentials, syllabus unit tracking, and direct 5-star course reviews.
   - Real-time material count (`X Verified Documents`) calculated dynamically from active database files.
   - Detailed modal preview with instant document links.

4. **Previous Year Question Papers (`question-papers.html`)**
   - Anna University and VSB Autonomous examination archive.
   - Multi-parameter filtering by Semester, Academic Session, and Paper Category.
   - Incremental verified download counter starting at true zero.

5. **Academic Resources & Laboratory Code (`resources.html`)**
   - Central repository for lecture notes, Jupyter notebooks, Python lab scripts, and reference textbooks.
   - Categorized by course format with instant online preview and secure access links.

6. **Study Tools & CGPA Calculator (`study-tools.html`)**
   - Anna University Regulation 2021 & Autonomous Credit-Weight Grading Formula ($O=10, A+=9, A=8, B+=7, B=6, RA=0$).
   - Dynamic course row addition, semester preset loader, and instant SGPA / cumulative CGPA projection.

7. **Design System & Visual Guidelines (`design-system.html`)**
   - Editorial chromatic tokens: Primary Oxford Navy (`#032448`), Heritage Burgundy (`#964450`), Warm Parchment (`#FAF7F2`), and Gold (`#FFE08E`).
   - Dual-font typography pairing: Merriweather for headlines and Inter for user interfaces.
   - Ambient eye-friendly scholar dark mode and light parchment mode.

8. **Department Administrator Control Center (`admin.html`)**
   - Passcode-protected console (`admin123`).
   - **Scholar Credentials & Passwords**: Real-time table with unmasked visibility toggle and enrollment tools.
   - **IRL Verification Queue**: Secure review queue for student note submissions (dispatched to `hemanthg2607@gmail.com`) with 1-click "Verify & Publish Live".
   - **Live Run Time & Analytics**: Second-by-second accumulation of total platform run time, logged-in student time, guest run time, and webpage hit matrix.
   - **Direct Document Publisher**: 1-click publishing for official notes, lab notebooks, and question papers.
   - **Notice Broadcaster & Photo Manager**: Update hero artwork and broadcast departmental circulars.
   - **True Zero Purge Tool**: 1-click database reset to guarantee zero dummy values.

---

## 🔒 Verification & Contribution Workflow
1. Students register with their Name, Department, Year, Semester (1–8), Email, and Password.
2. Note uploads are authenticated and automatically queued into the Administrator's IRL Verification Queue and dispatched for real-life validation.
3. Upon IRL faculty verification, the administrator approves the document, immediately publishing it live across the platform.

---

## 🚀 Running Locally

```bash
# Using Python:
python -m http.server 3000

# Using Node.js:
npx serve .
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.
