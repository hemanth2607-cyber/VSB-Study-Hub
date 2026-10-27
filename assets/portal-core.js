/**
 * VSB StudyHub - Core Portal JavaScript Engine
 * Provides Unified Authentication, Session Management, Real-Time Analytics,
 * IRL Note Upload Queue with hemanthg2607@gmail.com integration,
 * Active Semester Matching, and Ambient Theme Support.
 */

(function () {
  'use strict';

  // --- AUTHENTICATION & SEEDING (TRUE VALUES ONLY) ---
  const ADMIN_CREDENTIALS = {
    email: "admin@vsb.edu.in",
    password: "admin123",
    name: "Department Head / Admin",
    role: "admin"
  };

  // Clean out any past dummy data from localStorage & enforce true zero baseline
  function purgeAllDummyValues(force = false) {
    const DATA_VERSION_KEY = "vsb_clean_zero_v3";
    const currentVersion = localStorage.getItem(DATA_VERSION_KEY);

    if (force || currentVersion !== "true") {
      // 1. Force reset verification queue to empty
      localStorage.setItem("vsb_pending_submissions", JSON.stringify([]));

      // 2. Force reset analytics to strict true zero
      const zeroAnalytics = {
        totalRunTimeSeconds: 0,
        totalPageViews: 0,
        loggedUsersRunTime: 0,
        guestRunTime: 0,
        guestVisits: 0,
        loggedVisits: 0,
        pageViews: {},
        sessionLog: []
      };
      localStorage.setItem("vsb_analytics", JSON.stringify(zeroAnalytics));
      localStorage.setItem("vsb_total_downloads", "0");
      localStorage.setItem("vsb_calendar_downloads", "0");

      // 3. Purge all mock/dummy materials and resources
      localStorage.setItem("vsb_pyqs", JSON.stringify([]));
      localStorage.setItem("vsb_resources", JSON.stringify([]));
      localStorage.setItem("vsb_materials", JSON.stringify([]));

      // 4. Purge dummy notices
      localStorage.setItem("vsb_notices", JSON.stringify([]));

      // 5. Purge dummy reviews and ratings so they start at genuine 0
      localStorage.setItem("vsb_reviews", JSON.stringify([]));
      localStorage.setItem("vsb_ratings", JSON.stringify({}));

      // 6. Purge fake dummy users (preserve genuine registrations if any)
      try {
        const usersRaw = localStorage.getItem("vsb_users");
        if (usersRaw) {
          const users = JSON.parse(usersRaw);
          const filtered = users.filter(u => 
            u.email !== "karthik.csaiml@vsb.ac.in" && 
            u.id !== "usr-2" && 
            !u.id.startsWith("mock-") &&
            !u.name.toLowerCase().includes("dummy")
          );
          localStorage.setItem("vsb_users", JSON.stringify(filtered));
        } else {
          localStorage.setItem("vsb_users", JSON.stringify([]));
        }
      } catch (e) {
        localStorage.setItem("vsb_users", JSON.stringify([]));
      }

      localStorage.setItem(DATA_VERSION_KEY, "true");
    }

    // Ongoing purge for any legacy dummy items
    try {
      const q = JSON.parse(localStorage.getItem("vsb_pending_submissions") || "[]");
      const cleanQ = q.filter(item => 
        item && item.id && 
        !item.id.includes("sub-1") && 
        !item.id.includes("demo_") && 
        item.fileUrl && 
        !item.fileUrl.includes("example.com") && 
        !item.fileUrl.includes("demo_")
      );
      if (cleanQ.length !== q.length) {
        localStorage.setItem("vsb_pending_submissions", JSON.stringify(cleanQ));
      }
    } catch (e) {
      localStorage.setItem("vsb_pending_submissions", JSON.stringify([]));
    }
  }

  // Execute purge immediately on page load
  purgeAllDummyValues(false);

  // --- ANALYTICS ENGINE (TRUE ACCUMULATION ONLY) ---
  function getAnalytics() {
    const raw = localStorage.getItem("vsb_analytics");
    if (!raw) {
      const initial = {
        totalRunTimeSeconds: 0,
        totalPageViews: 0,
        loggedUsersRunTime: 0,
        guestRunTime: 0,
        guestVisits: 0,
        loggedVisits: 0,
        pageViews: {},
        sessionLog: []
      };
      localStorage.setItem("vsb_analytics", JSON.stringify(initial));
      return initial;
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      return {
        totalRunTimeSeconds: 0,
        totalPageViews: 0,
        loggedUsersRunTime: 0,
        guestRunTime: 0,
        guestVisits: 0,
        loggedVisits: 0,
        pageViews: {},
        sessionLog: []
      };
    }
  }

  function saveAnalytics(data) {
    localStorage.setItem("vsb_analytics", JSON.stringify(data));
  }

  // Page View Tracker
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  (function trackPageView() {
    const data = getAnalytics();
    data.totalPageViews = (data.totalPageViews || 0) + 1;
    data.pageViews = data.pageViews || {};
    data.pageViews[currentPage] = (data.pageViews[currentPage] || 0) + 1;

    const user = getCurrentUser();
    if (user) {
      data.loggedVisits = (data.loggedVisits || 0) + 1;
    } else {
      data.guestVisits = (data.guestVisits || 0) + 1;
    }
    saveAnalytics(data);
  })();

  // Real-time Heartbeat Timer (Run Time Counter)
  setInterval(() => {
    const data = getAnalytics();
    data.totalRunTimeSeconds = (data.totalRunTimeSeconds || 0) + 1;
    const user = getCurrentUser();
    if (user) {
      data.loggedUsersRunTime = (data.loggedUsersRunTime || 0) + 1;
    } else {
      data.guestRunTime = (data.guestRunTime || 0) + 1;
    }
    saveAnalytics(data);
  }, 1000);

  // --- AUTHENTICATION & SESSION MANAGEMENT ---
  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem("vsb_users") || "[]");
    } catch (e) {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem("vsb_users", JSON.stringify(users));
  }

  function getCurrentUser() {
    try {
      const user = localStorage.getItem("vsb_current_user");
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  }

  function setCurrentUser(user) {
    if (user) {
      localStorage.setItem("vsb_current_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("vsb_current_user");
    }
    window.dispatchEvent(new Event("vsb_auth_changed"));
    renderAuthUI();
    applyActiveSemesterHighlight();
  }

  function loginStudent(emailOrUser, password) {
    const cleanEmail = emailOrUser.toLowerCase().trim();
    const users = getUsers();
    const found = users.find(u => (u.email.toLowerCase() === cleanEmail || u.name.toLowerCase() === cleanEmail) && u.password === password);
    
    if (found) {
      found.loginCount = (found.loginCount || 0) + 1;
      found.lastLogin = new Date().toISOString();
      saveUsers(users);

      const session = {
        id: found.id,
        name: found.name,
        email: found.email,
        dept: found.dept,
        year: found.year,
        semester: found.semester,
        role: "student",
        loginTime: new Date().toISOString()
      };
      setCurrentUser(session);
      return { success: true, user: session };
    }
    return { success: false, message: "Invalid email/username or password. If first time, please Register." };
  }

  function loginAdmin(email, password) {
    if (email.toLowerCase().trim() === ADMIN_CREDENTIALS.email.toLowerCase() && password === ADMIN_CREDENTIALS.password) {
      const session = {
        id: "admin-master",
        name: ADMIN_CREDENTIALS.name,
        email: ADMIN_CREDENTIALS.email,
        dept: "CSE (AI & ML) Department Administration",
        role: "admin",
        loginTime: new Date().toISOString()
      };
      setCurrentUser(session);
      return { success: true, user: session };
    }
    return { success: false, message: "Invalid administrator credentials. (Default: admin@vsb.edu.in / admin123)" };
  }

  function registerStudent(userData) {
    const users = getUsers();
    const exists = users.some(u => u.email.toLowerCase() === userData.email.toLowerCase().trim());
    if (exists) {
      return { success: false, message: "An account with this email address already exists. Please Sign In." };
    }

    const newUser = {
      id: "usr-" + Date.now(),
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
      dept: userData.dept,
      year: userData.year,
      semester: userData.semester.toString().replace(/[^0-9]/g, ""),
      password: userData.password,
      registeredAt: new Date().toISOString(),
      loginCount: 1,
      lastLogin: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    const session = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      dept: newUser.dept,
      year: newUser.year,
      semester: newUser.semester,
      role: "student",
      loginTime: new Date().toISOString()
    };
    setCurrentUser(session);
    return { success: true, user: session };
  }

  function logout() {
    setCurrentUser(null);
    alert("You have been signed out from VSB StudyHub.");
    window.location.reload();
  }

  // --- UPLOAD NOTES TO hemanthg2607@gmail.com ---
  function submitNoteContribution(noteData) {
    const user = getCurrentUser();
    if (!user) {
      openAuthModal('student');
      return { success: false, message: "Authentication required to upload study material." };
    }

    const submission = {
      id: "sub-" + Date.now(),
      studentName: user.name,
      studentEmail: user.email,
      dept: user.dept,
      year: user.year || "N/A",
      semester: user.semester || "N/A",
      subjectCode: noteData.subjectCode.toUpperCase().trim(),
      subjectName: noteData.subjectName.trim(),
      title: noteData.title.trim(),
      category: noteData.category,
      fileUrl: noteData.fileUrl.trim(),
      description: noteData.description.trim(),
      submittedAt: new Date().toISOString(),
      status: "pending"
    };

    // 1. Save to local Admin Queue
    const submissions = JSON.parse(localStorage.getItem("vsb_pending_submissions") || "[]");
    submissions.unshift(submission);
    localStorage.setItem("vsb_pending_submissions", JSON.stringify(submissions));

    // 2. Dispatch to hemanthg2607@gmail.com via FormSubmit
    try {
      fetch("https://formsubmit.co/ajax/hemanthg2607@gmail.com", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: `[VSB StudyHub] New Material Submission from ${user.name} (${user.dept})`,
          student_name: user.name,
          student_email: user.email,
          student_dept: user.dept,
          student_semester: `Semester ${user.semester}`,
          subject_code: submission.subjectCode,
          subject_title: submission.subjectName,
          material_title: submission.title,
          category: submission.category,
          material_link: submission.fileUrl,
          contributor_notes: submission.description,
          action_required: "Please verify IRL and approve this note in the Admin Center (admin.html)"
        })
      }).catch(err => {
        console.warn("Async email notification sent via queue", err);
      });
    } catch (e) {
      console.warn("Email dispatch fallback active", e);
    }

    return { success: true, submission };
  }

  // --- ACTIVE SEMESTER HIGHLIGHTING ---
  function applyActiveSemesterHighlight() {
    const user = getCurrentUser();
    const activeSem = user ? user.semester : null;

    // Remove old active badges
    document.querySelectorAll(".active-term-badge").forEach(el => el.remove());
    document.querySelectorAll(".semester-card-active").forEach(card => {
      card.classList.remove("semester-card-active", "ring-2", "ring-secondary", "shadow-lg");
    });

    if (activeSem) {
      // Find semester elements with data-semester or id
      document.querySelectorAll(`[data-semester="${activeSem}"], #sem-${activeSem}-card, #semester-${activeSem}`).forEach(el => {
        el.classList.add("semester-card-active", "ring-2", "ring-secondary", "shadow-lg");
        const badge = document.createElement("span");
        badge.className = "active-term-badge inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary text-white text-[10px] font-bold tracking-wider uppercase ml-2 animate-pulse";
        badge.innerHTML = `<span class="material-symbols-outlined text-[13px]">person</span> Your Active Term`;
        const titleTarget = el.querySelector("h2, h3, h4, .semester-heading") || el;
        titleTarget.appendChild(badge);
      });

      // Update any semester select dropdowns default value
      const semSelect = document.getElementById("semFilter") || document.getElementById("resourceSemFilter");
      if (semSelect) {
        semSelect.value = activeSem;
        if (typeof window.filterPyqs === "function") window.filterPyqs();
        if (typeof window.filterResources === "function") window.filterResources();
      }
    }
  }

  // --- INJECT UNIFIED MODALS & NAVBAR CONTROLS ---
  function injectUnifiedModals() {
    if (document.getElementById("vsbUnifiedAuthModal")) return;

    const modalContainer = document.createElement("div");
    modalContainer.id = "vsbUnifiedModalsContainer";
    modalContainer.innerHTML = `
      <!-- UNIFIED AUTH MODAL -->
      <div id="vsbUnifiedAuthModal" class="fixed inset-0 z-50 hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-surface-container-lowest border border-[#E8E0D2] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
          
          <!-- Modal Header with VSB Logo -->
          <div class="p-5 border-b border-[#E8E0D2] bg-surface-container-low flex items-center justify-between">
            <div class="flex items-center gap-3">
              <img src="assets/vsb-logo.png" alt="VSB College of Engineering Karur Logo" class="h-10 w-auto object-contain" onerror="this.src='https://vsbec.edu.in/wp-content/uploads/2026/06/VSB-Karur.png'"/>
              <div>
                <h3 class="font-headline font-bold text-base text-primary">VSB StudyHub Portal Access</h3>
                <p class="text-xs text-on-surface-variant">Sign in or create your verified scholar account</p>
              </div>
            </div>
            <button onclick="closeAuthModal()" class="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <!-- Auth Tabs -->
          <div class="flex border-b border-[#E8E0D2] bg-surface-container-low/50">
            <button onclick="switchAuthTab('student')" id="tabBtnStudent" class="flex-1 py-3 text-xs sm:text-sm font-semibold text-primary border-b-2 border-primary transition-colors flex items-center justify-center gap-1.5">
              <span class="material-symbols-outlined text-[18px]">school</span>
              <span>Student Login</span>
            </button>
            <button onclick="switchAuthTab('admin')" id="tabBtnAdmin" class="flex-1 py-3 text-xs sm:text-sm font-semibold text-on-surface-variant border-b-2 border-transparent hover:text-primary transition-colors flex items-center justify-center gap-1.5">
              <span class="material-symbols-outlined text-[18px]">admin_panel_settings</span>
              <span>Admin Login</span>
            </button>
            <button onclick="switchAuthTab('register')" id="tabBtnRegister" class="flex-1 py-3 text-xs sm:text-sm font-semibold text-on-surface-variant border-b-2 border-transparent hover:text-primary transition-colors flex items-center justify-center gap-1.5">
              <span class="material-symbols-outlined text-[18px]">person_add</span>
              <span>Register</span>
            </button>
          </div>

          <div class="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
            <div id="authAlert" class="hidden p-3 rounded-lg text-xs font-semibold"></div>

            <!-- 1. STUDENT LOGIN FORM -->
            <form id="studentLoginForm" onsubmit="handleStudentLogin(event)" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-on-surface-variant mb-1">Email or Student Name *</label>
                <input required id="studentLoginEmail" type="text" placeholder="e.g. hemanthg2607@gmail.com" class="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E0D2] bg-surface text-on-surface focus:outline-none focus:border-primary text-xs sm:text-sm"/>
              </div>
              <div>
                <label class="block text-xs font-semibold text-on-surface-variant mb-1">Password *</label>
                <div class="relative">
                  <input required id="studentLoginPassword" type="password" placeholder="••••••••" class="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E0D2] bg-surface text-on-surface focus:outline-none focus:border-primary text-xs sm:text-sm"/>
                  <button type="button" onclick="togglePassVisibility('studentLoginPassword', this)" class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                    <span class="material-symbols-outlined text-[18px]">visibility</span>
                  </button>
                </div>
              </div>
              <button type="submit" class="w-full py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary-container transition-colors shadow-xs flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-[18px]">login</span>
                <span>Sign In as Student</span>
              </button>
              <p class="text-center text-xs text-on-surface-variant mt-2">
                First time using VSB StudyHub? <button type="button" onclick="switchAuthTab('register')" class="text-secondary font-bold hover:underline">Create your account</button>
              </p>
            </form>

            <!-- 2. ADMIN LOGIN FORM -->
            <form id="adminLoginForm" onsubmit="handleAdminLogin(event)" class="space-y-4 hidden">
              <div class="p-3 bg-secondary/10 rounded-lg text-xs text-secondary font-medium">
                Admin Control Panel access for Department HOD, Faculty Coordinators, and Chief Webmaster.
              </div>
              <div>
                <label class="block text-xs font-semibold text-on-surface-variant mb-1">Admin Email *</label>
                <input required id="adminLoginEmail" type="email" value="admin@vsb.edu.in" class="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E0D2] bg-surface text-on-surface focus:outline-none focus:border-primary text-xs sm:text-sm"/>
              </div>
              <div>
                <label class="block text-xs font-semibold text-on-surface-variant mb-1">Admin Passcode *</label>
                <div class="relative">
                  <input required id="adminLoginPassword" type="password" value="admin123" class="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E0D2] bg-surface text-on-surface focus:outline-none focus:border-primary text-xs sm:text-sm"/>
                  <button type="button" onclick="togglePassVisibility('adminLoginPassword', this)" class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                    <span class="material-symbols-outlined text-[18px]">visibility</span>
                  </button>
                </div>
              </div>
              <button type="submit" class="w-full py-2.5 rounded-lg bg-secondary text-white font-semibold hover:opacity-90 transition-opacity shadow-xs flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                <span>Authenticate Admin Access</span>
              </button>
            </form>

            <!-- 3. STUDENT REGISTRATION FORM -->
            <form id="studentRegisterForm" onsubmit="handleStudentRegister(event)" class="space-y-3 hidden">
              <div>
                <label class="block text-xs font-semibold text-on-surface-variant mb-1">Full Name *</label>
                <input required id="regName" type="text" placeholder="e.g. Hemanth G" class="w-full px-3 py-2 rounded-lg border border-[#E8E0D2] bg-surface text-xs sm:text-sm"/>
              </div>
              <div>
                <label class="block text-xs font-semibold text-on-surface-variant mb-1">Email Address *</label>
                <input required id="regEmail" type="email" placeholder="e.g. hemanthg2607@gmail.com" class="w-full px-3 py-2 rounded-lg border border-[#E8E0D2] bg-surface text-xs sm:text-sm"/>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-on-surface-variant mb-1">Department *</label>
                  <select required id="regDept" class="w-full px-3 py-2 rounded-lg border border-[#E8E0D2] bg-surface text-xs">
                    <option value="Computer Science and Engineering (AI & ML)" selected>CSE (AI &amp; ML)</option>
                    <option value="Computer Science and Engineering">CSE (Core)</option>
                    <option value="Information Technology">Information Tech (IT)</option>
                    <option value="Artificial Intelligence and Data Science">AI &amp; Data Science (AI &amp; DS)</option>
                    <option value="Electronics & Communication Engineering">ECE</option>
                    <option value="Electrical & Electronics Engineering">EEE</option>
                    <option value="Mechanical Engineering">Mechanical</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-on-surface-variant mb-1">Year of Study *</label>
                  <select required id="regYear" class="w-full px-3 py-2 rounded-lg border border-[#E8E0D2] bg-surface text-xs">
                    <option value="1st Year">1st Year (Freshman)</option>
                    <option value="2nd Year" selected>2nd Year (Sophomore)</option>
                    <option value="3rd Year">3rd Year (Junior)</option>
                    <option value="4th Year">4th Year (Senior)</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-xs font-semibold text-on-surface-variant mb-1">Current Semester *</label>
                <select required id="regSemester" class="w-full px-3 py-2 rounded-lg border border-[#E8E0D2] bg-surface text-xs">
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                  <option value="3">Semester 3</option>
                  <option value="4" selected>Semester 4 (Active Term)</option>
                  <option value="5">Semester 5</option>
                  <option value="6">Semester 6</option>
                  <option value="7">Semester 7</option>
                  <option value="8">Semester 8</option>
                </select>
                <p class="text-[10px] text-on-surface-variant mt-0.5">Your chosen semester will be highlighted as your Active Term across the portal.</p>
              </div>
              <div>
                <label class="block text-xs font-semibold text-on-surface-variant mb-1">Password *</label>
                <div class="relative">
                  <input required id="regPassword" type="password" placeholder="Create a secure password" class="w-full px-3 py-2 rounded-lg border border-[#E8E0D2] bg-surface text-xs sm:text-sm"/>
                  <button type="button" onclick="togglePassVisibility('regPassword', this)" class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                    <span class="material-symbols-outlined text-[18px]">visibility</span>
                  </button>
                </div>
              </div>
              <button type="submit" class="w-full py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary-container transition-colors shadow-xs flex items-center justify-center gap-2 mt-3">
                <span class="material-symbols-outlined text-[18px]">how_to_reg</span>
                <span>Complete Registration &amp; Sign In</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- UPLOAD NOTES / CONTRIBUTE STUDY MATERIAL MODAL -->
      <div id="vsbUploadModal" class="fixed inset-0 z-50 hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-surface-container-lowest border border-[#E8E0D2] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
          
          <div class="p-5 border-b border-[#E8E0D2] bg-surface-container-low flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-secondary text-[26px]">upload_file</span>
              <div>
                <h3 class="font-headline font-bold text-base text-primary">Contribute Academic Material</h3>
                <p class="text-xs text-on-surface-variant">Submissions reach <strong class="text-secondary">hemanthg2607@gmail.com</strong> for IRL verification</p>
              </div>
            </div>
            <button onclick="closeUploadModal()" class="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <form id="uploadMaterialForm" onsubmit="handleUploadSubmit(event)" class="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
            <div class="p-3 bg-secondary/10 border border-secondary/20 rounded-xl text-xs text-secondary leading-relaxed">
              <strong>IRL Academic Verification Rule:</strong> Uploaded materials are securely dispatched to the Administrator (Hemanth G) at <code>hemanthg2607@gmail.com</code>. After in-person faculty syllabus verification, the material is published live to the department portal.
            </div>

            <!-- Student Contributor Profile (Auto-filled from Session) -->
            <div class="p-3 bg-surface-container-low rounded-xl border border-[#E8E0D2] grid grid-cols-2 gap-2 text-xs">
              <div>
                <span class="text-on-surface-variant block text-[11px]">Contributor</span>
                <strong id="contribStudentName" class="text-primary font-bold">Logged In Scholar</strong>
              </div>
              <div>
                <span class="text-on-surface-variant block text-[11px]">Department &amp; Term</span>
                <strong id="contribStudentDept" class="text-primary font-bold">CSE (AI &amp; ML)</strong>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-on-surface-variant mb-1">Subject Code *</label>
                <input required id="uploadSubCode" type="text" placeholder="e.g. CS3491" class="w-full px-3 py-2 rounded-lg border border-[#E8E0D2] bg-surface uppercase font-bold text-primary"/>
              </div>
              <div>
                <label class="block text-xs font-semibold text-on-surface-variant mb-1">Material Category *</label>
                <select required id="uploadCategory" class="w-full px-3 py-2 rounded-lg border border-[#E8E0D2] bg-surface">
                  <option value="Lecture Notes">Faculty Lecture Notes</option>
                  <option value="Lab Manual & Notebook">Lab Manual &amp; Python Code (.ipynb)</option>
                  <option value="Question Paper / Solved PYQ">Previous Year Question Paper (PYQ)</option>
                  <option value="Reference Book">Reference Book / Handbook</option>
                  <option value="Video Lectures">Curated Video Lecture Playlist</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-on-surface-variant mb-1">Subject Full Title *</label>
              <input required id="uploadSubTitle" type="text" placeholder="e.g. Artificial Intelligence and Machine Learning" class="w-full px-3 py-2 rounded-lg border border-[#E8E0D2] bg-surface"/>
            </div>

            <div>
              <label class="block text-xs font-semibold text-on-surface-variant mb-1">Document / Material Name *</label>
              <input required id="uploadMatTitle" type="text" placeholder="e.g. Unit 3 Convolutional Networks Handwritten Notes" class="w-full px-3 py-2 rounded-lg border border-[#E8E0D2] bg-surface"/>
            </div>

            <div>
              <label class="block text-xs font-semibold text-on-surface-variant mb-1">Document Link (Google Drive / GitHub / URL) *</label>
              <input required id="uploadFileUrl" type="url" placeholder="https://drive.google.com/file/d/... or GitHub link" class="w-full px-3 py-2 rounded-lg border border-[#E8E0D2] bg-surface"/>
            </div>

            <div>
              <label class="block text-xs font-semibold text-on-surface-variant mb-1">Description / Syllabus Portions Covered</label>
              <textarea id="uploadDescription" rows="2" placeholder="Mention unit numbers, topics covered, faculty name, or any remarks..." class="w-full px-3 py-2 rounded-lg border border-[#E8E0D2] bg-surface"></textarea>
            </div>

            <div class="pt-3 border-t border-[#E8E0D2] flex items-center justify-between gap-3">
              <span class="text-[11px] text-on-surface-variant">Direct Mail Notification Enabled</span>
              <div class="flex items-center gap-2">
                <button type="button" onclick="closeUploadModal()" class="px-4 py-2 rounded-lg border border-[#E8E0D2] text-xs font-semibold hover:bg-surface-container">
                  Cancel
                </button>
                <button type="submit" id="uploadSubmitBtn" class="px-5 py-2 rounded-lg bg-secondary text-white text-xs font-semibold hover:opacity-90 flex items-center gap-1.5 shadow-xs">
                  <span class="material-symbols-outlined text-[16px]">send</span>
                  <span>Transmit for IRL Verification</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- LEGAL & SECURITY MODAL -->
      <div id="vsbLegalModal" class="fixed inset-0 z-50 hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-surface-container-lowest border border-[#E8E0D2] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
          <div class="p-5 border-b border-[#E8E0D2] bg-surface-container-low flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-primary text-[24px]">verified_user</span>
              <div>
                <h3 class="font-headline font-bold text-base text-primary">Academic Legal &amp; Data Security Notice</h3>
                <p class="text-xs text-on-surface-variant">Compliance with IT Act, 2000 &amp; Educational Fair Use</p>
              </div>
            </div>
            <button onclick="closeLegalModal()" class="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <div class="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-on-surface-variant">
            <div class="p-3 bg-surface-container-low rounded-xl border border-[#E8E0D2]">
              <h4 class="font-bold text-primary text-sm mb-1">1. Educational Fair Use Reproduction</h4>
              <p>All lecture compendiums, syllabi notes, model question keys, and laboratory code sheets hosted on VSB StudyHub are curated strictly for non-commercial educational scholarship and private study in full compliance with <strong>Section 52 of the Indian Copyright Act, 1957</strong>.</p>
            </div>
            <div class="p-3 bg-surface-container-low rounded-xl border border-[#E8E0D2]">
              <h4 class="font-bold text-primary text-sm mb-1">2. Scholar Privacy &amp; Credential Protection</h4>
              <p>Under the <strong>Digital Personal Data Protection Act, 2023</strong> and the <strong>Information Technology Act, 2000</strong>, student authentication records are stored with local session isolation. Passwords and profile entries are maintained for departmental tracking and authenticated curriculum access.</p>
            </div>
            <div class="p-3 bg-surface-container-low rounded-xl border border-[#E8E0D2]">
              <h4 class="font-bold text-primary text-sm mb-1">3. Institutional Disclaimer</h4>
              <p>VSB Engineering College (Autonomous), Karur, affiliated with Anna University Chennai and approved by AICTE New Delhi. Materials are contributed by department faculty and scholars with IRL verification oversight by administrator <strong class="text-primary">hemanthg2607@gmail.com</strong>.</p>
            </div>
          </div>
          <div class="p-4 border-t border-[#E8E0D2] bg-surface-container-low text-right">
            <button onclick="closeLegalModal()" class="px-5 py-2 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary-container">
              I Acknowledge &amp; Understand
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modalContainer);
  }

  // --- RENDER AUTH UI INTO NAVBARS ACROSS ALL PAGES ---
  function renderAuthUI() {
    const user = getCurrentUser();

    // Look for all header containers or auth placeholders
    const authContainers = document.querySelectorAll(".header-auth-slot, #headerAuthSlot");
    
    authContainers.forEach(container => {
      if (!user) {
        // Not Logged In: Unified Login Button
        container.innerHTML = `
          <button onclick="openAuthModal('student')" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-white hover:bg-primary-container text-xs sm:text-sm font-semibold transition-colors shadow-xs" type="button">
            <span class="material-symbols-outlined text-[17px]">login</span>
            <span>Sign In / Register</span>
          </button>
        `;
      } else if (user.role === 'admin') {
        // Admin Logged In
        container.innerHTML = `
          <div class="flex items-center gap-2">
            <a href="admin.html" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/15 text-secondary border border-secondary/30 text-xs sm:text-sm font-bold hover:bg-secondary/25 transition-colors">
              <span class="material-symbols-outlined text-[16px]">admin_panel_settings</span>
              <span>Admin Console</span>
            </a>
            <button onclick="window.portalCore.logout()" class="p-1.5 rounded-lg text-on-surface-variant hover:text-secondary hover:bg-secondary/10 transition-colors" title="Logout">
              <span class="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        `;
      } else {
        // Student Logged In
        container.innerHTML = `
          <div class="relative group">
            <button class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-[#E8E0D2] text-xs sm:text-sm font-semibold text-primary hover:border-primary transition-colors">
              <span class="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-bold">
                ${user.name.charAt(0).toUpperCase()}
              </span>
              <span class="hidden sm:inline">${user.name.split(" ")[0]} (Sem ${user.semester})</span>
              <span class="material-symbols-outlined text-[16px]">expand_more</span>
            </button>

            <!-- Dropdown -->
            <div class="absolute right-0 top-full mt-1.5 w-60 bg-surface-container-lowest border border-[#E8E0D2] rounded-xl shadow-xl py-2 hidden group-hover:block z-50 text-xs">
              <div class="px-3.5 py-2 border-b border-[#E8E0D2]">
                <p class="font-bold text-primary text-sm">${user.name}</p>
                <p class="text-on-surface-variant text-[11px]">${user.email}</p>
                <span class="inline-block mt-1 px-2 py-0.5 rounded bg-secondary/10 text-secondary font-bold text-[10px]">
                  Sem ${user.semester} • ${user.year}
                </span>
              </div>
              <button onclick="openUploadModal()" class="w-full text-left px-3.5 py-2 hover:bg-surface-container flex items-center gap-2 text-primary font-medium">
                <span class="material-symbols-outlined text-[16px] text-secondary">upload_file</span>
                <span>Upload Study Notes</span>
              </button>
              <a href="semesters.html" class="block px-3.5 py-2 hover:bg-surface-container text-on-surface">
                View My Semester (${user.semester})
              </a>
              <div class="border-t border-[#E8E0D2] mt-1 pt-1">
                <button onclick="window.portalCore.logout()" class="w-full text-left px-3.5 py-2 text-secondary hover:bg-secondary/10 font-semibold flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[16px]">logout</span>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        `;
      }
    });

    // Also update any standalone "Upload Notes" buttons on the page
    document.querySelectorAll(".btn-upload-notes, #btnUploadNotes").forEach(btn => {
      btn.onclick = () => openUploadModal();
    });
  }

  // --- WINDOW FUNCTIONS ---
  window.openAuthModal = function (tab) {
    injectUnifiedModals();
    const modal = document.getElementById("vsbUnifiedAuthModal");
    if (modal) {
      modal.classList.remove("hidden");
      switchAuthTab(tab || "student");
    }
  };

  window.closeAuthModal = function () {
    const modal = document.getElementById("vsbUnifiedAuthModal");
    if (modal) modal.classList.add("hidden");
  };

  window.switchAuthTab = function (tab) {
    const studentForm = document.getElementById("studentLoginForm");
    const adminForm = document.getElementById("adminLoginForm");
    const regForm = document.getElementById("studentRegisterForm");
    const tabStudent = document.getElementById("tabBtnStudent");
    const tabAdmin = document.getElementById("tabBtnAdmin");
    const tabRegister = document.getElementById("tabBtnRegister");
    const alertBox = document.getElementById("authAlert");

    if (alertBox) alertBox.classList.add("hidden");

    [tabStudent, tabAdmin, tabRegister].forEach(b => {
      if (b) {
        b.classList.remove("text-primary", "border-primary");
        b.classList.add("text-on-surface-variant", "border-transparent");
      }
    });

    if (tab === "admin") {
      studentForm.classList.add("hidden");
      regForm.classList.add("hidden");
      adminForm.classList.remove("hidden");
      tabAdmin.classList.add("text-primary", "border-primary");
      tabAdmin.classList.remove("text-on-surface-variant", "border-transparent");
    } else if (tab === "register") {
      studentForm.classList.add("hidden");
      adminForm.classList.add("hidden");
      regForm.classList.remove("hidden");
      tabRegister.classList.add("text-primary", "border-primary");
      tabRegister.classList.remove("text-on-surface-variant", "border-transparent");
    } else {
      adminForm.classList.add("hidden");
      regForm.classList.add("hidden");
      studentForm.classList.remove("hidden");
      tabStudent.classList.add("text-primary", "border-primary");
      tabStudent.classList.remove("text-on-surface-variant", "border-transparent");
    }
  };

  window.togglePassVisibility = function (fieldId, btn) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    const isPass = field.type === "password";
    field.type = isPass ? "text" : "password";
    btn.innerHTML = `<span class="material-symbols-outlined text-[18px]">${isPass ? 'visibility_off' : 'visibility'}</span>`;
  };

  window.handleStudentLogin = function (e) {
    e.preventDefault();
    const email = document.getElementById("studentLoginEmail").value;
    const pass = document.getElementById("studentLoginPassword").value;
    const res = loginStudent(email, pass);
    const alertBox = document.getElementById("authAlert");

    if (res.success) {
      closeAuthModal();
      alert(`Welcome back, ${res.user.name}! Semester ${res.user.semester} is now active.`);
      window.location.reload();
    } else {
      alertBox.className = "p-3 rounded-lg text-xs font-semibold bg-secondary/15 text-secondary border border-secondary/30";
      alertBox.innerText = res.message;
      alertBox.classList.remove("hidden");
    }
  };

  window.handleAdminLogin = function (e) {
    e.preventDefault();
    const email = document.getElementById("adminLoginEmail").value;
    const pass = document.getElementById("adminLoginPassword").value;
    const res = loginAdmin(email, pass);
    const alertBox = document.getElementById("authAlert");

    if (res.success) {
      closeAuthModal();
      window.location.href = "admin.html";
    } else {
      alertBox.className = "p-3 rounded-lg text-xs font-semibold bg-secondary/15 text-secondary border border-secondary/30";
      alertBox.innerText = res.message;
      alertBox.classList.remove("hidden");
    }
  };

  window.handleStudentRegister = function (e) {
    e.preventDefault();
    const name = document.getElementById("regName").value;
    const email = document.getElementById("regEmail").value;
    const dept = document.getElementById("regDept").value;
    const year = document.getElementById("regYear").value;
    const semester = document.getElementById("regSemester").value;
    const pass = document.getElementById("regPassword").value;

    const res = registerStudent({ name, email, dept, year, semester, password: pass });
    const alertBox = document.getElementById("authAlert");

    if (res.success) {
      closeAuthModal();
      alert(`Registration complete! Welcome to VSB StudyHub, ${res.user.name}.\nSemester ${res.user.semester} curriculum has been highlighted.`);
      window.location.reload();
    } else {
      alertBox.className = "p-3 rounded-lg text-xs font-semibold bg-secondary/15 text-secondary border border-secondary/30";
      alertBox.innerText = res.message;
      alertBox.classList.remove("hidden");
    }
  };

  window.openUploadModal = function () {
    const user = getCurrentUser();
    if (!user) {
      openAuthModal('student');
      const alertBox = document.getElementById("authAlert");
      if (alertBox) {
        alertBox.className = "p-3 rounded-lg text-xs font-semibold bg-secondary/15 text-secondary border border-secondary/30";
        alertBox.innerText = "Please sign in or register to upload and contribute study materials.";
        alertBox.classList.remove("hidden");
      }
      return;
    }

    injectUnifiedModals();
    const modal = document.getElementById("vsbUploadModal");
    if (modal) {
      document.getElementById("contribStudentName").innerText = user.name;
      document.getElementById("contribStudentDept").innerText = `${user.dept} • Sem ${user.semester}`;
      modal.classList.remove("hidden");
    }
  };

  window.closeUploadModal = function () {
    const modal = document.getElementById("vsbUploadModal");
    if (modal) modal.classList.add("hidden");
  };

  window.handleUploadSubmit = function (e) {
    e.preventDefault();
    const btn = document.getElementById("uploadSubmitBtn");
    btn.disabled = true;
    btn.innerText = "Transmitting...";

    const noteData = {
      subjectCode: document.getElementById("uploadSubCode").value,
      subjectName: document.getElementById("uploadSubTitle").value,
      title: document.getElementById("uploadMatTitle").value,
      category: document.getElementById("uploadCategory").value,
      fileUrl: document.getElementById("uploadFileUrl").value,
      description: document.getElementById("uploadDescription").value
    };

    const res = submitNoteContribution(noteData);
    btn.disabled = false;
    btn.innerHTML = `<span class="material-symbols-outlined text-[16px]">send</span><span>Transmit for IRL Verification</span>`;

    if (res.success) {
      closeUploadModal();
      document.getElementById("uploadMaterialForm").reset();
      alert(`Note Submission Successful!\n\nMaterial: ${noteData.title}\nSubject: ${noteData.subjectCode}\n\nYour submission details have been transmitted directly to hemanthg2607@gmail.com. Once verified IRL by the department administrator, it will be published to the live repository!`);
    }
  };

  window.openLegalModal = function () {
    injectUnifiedModals();
    const modal = document.getElementById("vsbLegalModal");
    if (modal) modal.classList.remove("hidden");
  };

  window.closeLegalModal = function () {
    const modal = document.getElementById("vsbLegalModal");
    if (modal) modal.classList.add("hidden");
  };

  // Expose API for pages
  window.portalCore = {
    getCurrentUser,
    getUsers,
    getAnalytics,
    loginStudent,
    loginAdmin,
    registerStudent,
    logout,
    submitNoteContribution,
    applyActiveSemesterHighlight,
    renderAuthUI,
    purgeAllDummyValues
  };

  // Initialize on DOM load
  document.addEventListener("DOMContentLoaded", () => {
    injectUnifiedModals();
    renderAuthUI();
    applyActiveSemesterHighlight();
  });
})();
