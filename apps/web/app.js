// TalentScout ATS Studio - Application Logic
// Features: Kanban Drag-and-Drop, Table Grid View, Blind Screening Mode,
// Live Weight Calibrator, XAI Breakdown & Batch Auto-Email Dispatcher

document.addEventListener('DOMContentLoaded', () => {
  // =========================================================================
  // Application State
  // =========================================================================
  let candidates = JSON.parse(JSON.stringify(INITIAL_CANDIDATES));
  let isBlindMode = false;
  let currentView = 'kanban'; // 'kanban' | 'table'
  let searchQuery = '';
  let minScore = 0;
  let verdictFilter = 'ALL';
  let qualificationFilter = 'ALL'; // 'ALL' | 'QUALIFIED' | 'UNQUALIFIED'
  let emailStatusFilter = 'ALL'; // 'ALL' | 'sent_invite' | 'sent_reject' | 'none'
  let sortMode = 'score_desc';
  let selectedCandidate = null;
  let emailTone = 'invite'; // 'invite' | 'reject'
  let draggedCandidateId = null;

  // AI Criteria Weights State
  let currentWeights = {
    skills: 40,
    experience: 30,
    education: 15,
    semantic: 15
  };

  // DOM Elements
  const kanbanColumns = {
    applied: document.getElementById('cards-applied'),
    screened: document.getElementById('cards-screened'),
    interview: document.getElementById('cards-interview'),
    offer: document.getElementById('cards-offer'),
    rejected: document.getElementById('cards-rejected')
  };

  const countElements = {
    applied: document.getElementById('count-applied'),
    screened: document.getElementById('count-screened'),
    interview: document.getElementById('count-interview'),
    offer: document.getElementById('count-offer'),
    rejected: document.getElementById('count-rejected'),
    total: document.getElementById('total-cand-count'),
    strongHire: document.getElementById('strong-hire-count'),
    qualifiedRate: document.getElementById('qualified-rate-count'),
    emailOutreach: document.getElementById('email-outreach-count'),
    dirStat: document.getElementById('dir-stat-display')
  };

  // View Switchers
  const btnViewKanban = document.getElementById('btn-view-kanban');
  const btnViewTable = document.getElementById('btn-view-table');
  const kanbanViewWrapper = document.getElementById('kanban-view-wrapper');
  const tableViewWrapper = document.getElementById('table-view-wrapper');
  const candidatesTableBody = document.getElementById('candidates-table-body');

  // Blind Mode Elements
  const blindCheckbox = document.getElementById('blind-mode-checkbox');
  const blindToggleBox = document.getElementById('blind-mode-toggle-box');

  // Filter Elements
  const searchInput = document.getElementById('candidate-search-input');
  const minScoreSlider = document.getElementById('min-score-slider');
  const minScoreVal = document.getElementById('min-score-val');
  const verdictSelect = document.getElementById('verdict-filter-select');
  const qualSelect = document.getElementById('qualification-filter-select');
  const emailStatusSelect = document.getElementById('email-status-filter-select');
  const sortSelect = document.getElementById('sort-filter-select');
  const btnResetFilters = document.getElementById('btn-reset-filters');

  // Criteria & Weights Elements
  const btnToggleCriteria = document.getElementById('btn-toggle-criteria');
  const criteriaSummaryCard = document.getElementById('criteria-summary-card');
  const inputWeightSkills = document.getElementById('input-weight-skills');
  const inputWeightExp = document.getElementById('input-weight-exp');
  const inputWeightEdu = document.getElementById('input-weight-edu');
  const inputWeightSem = document.getElementById('input-weight-sem');
  const valWeightSkills = document.getElementById('val-weight-skills');
  const valWeightExp = document.getElementById('val-weight-exp');
  const valWeightEdu = document.getElementById('val-weight-edu');
  const valWeightSem = document.getElementById('val-weight-sem');
  const totalWeightIndicator = document.getElementById('total-weight-indicator');
  const btnApplyWeights = document.getElementById('btn-apply-weights');
  const btnResetWeights = document.getElementById('btn-reset-weights');

  // Single Candidate Modals
  const modalXaiOverlay = document.getElementById('modal-xai-overlay');
  const btnCloseXai = document.getElementById('btn-close-xai-modal');
  const btnXaiToEmail = document.getElementById('btn-xai-to-email');
  const btnXaiMoveNext = document.getElementById('btn-xai-move-next');

  const modalEmailOverlay = document.getElementById('modal-email-overlay');
  const btnCloseEmail = document.getElementById('btn-close-email-modal');
  const btnToneInvite = document.getElementById('btn-tone-invite');
  const btnToneReject = document.getElementById('btn-tone-reject');
  const emailRecipient = document.getElementById('email-recipient-field');
  const emailSubject = document.getElementById('email-subject-field');
  const emailBody = document.getElementById('email-body-field');
  const btnRegenEmail = document.getElementById('btn-regenerate-email');
  const btnCopyEmail = document.getElementById('btn-copy-email');
  const btnSendEmail = document.getElementById('btn-send-email-confirm');

  // Batch Auto-Email Modal
  const modalBatchEmailOverlay = document.getElementById('modal-batch-email-overlay');
  const btnOpenBatchEmail = document.getElementById('btn-open-auto-email-modal');
  const btnCloseBatchEmail = document.getElementById('btn-close-batch-email-modal');
  const btnCancelBatchEmail = document.getElementById('btn-cancel-batch-email');
  const btnExecuteBatchDispatch = document.getElementById('btn-execute-batch-dispatch');
  const batchListPass = document.getElementById('batch-list-pass');
  const batchListReject = document.getElementById('batch-list-reject');
  const batchCountPass = document.getElementById('batch-count-pass');
  const batchCountReject = document.getElementById('batch-count-reject');
  const batchProgressBox = document.getElementById('batch-progress-box');
  const batchStatusLabel = document.getElementById('batch-status-label');
  const batchPercentLabel = document.getElementById('batch-percent-label');
  const batchProgressBarFill = document.getElementById('batch-progress-bar-fill');
  const batchConsoleLog = document.getElementById('batch-console-log');
  const batchSummaryStatsText = document.getElementById('batch-summary-stats-text');

  // Upload Modal Elements
  const modalUploadOverlay = document.getElementById('modal-upload-overlay');
  const btnOpenUploadModal = document.getElementById('btn-open-upload-modal');
  const btnCloseUpload = document.getElementById('btn-close-upload-modal');
  const cvDropzone = document.getElementById('cv-dropzone');
  const cvFileInput = document.getElementById('cv-file-input');
  const btnTriggerFile = document.getElementById('btn-trigger-file-select');
  const samplePresetsList = document.getElementById('sample-presets-list');
  const uploadProgressCard = document.getElementById('upload-progress-card');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const progressStepText = document.getElementById('progress-step-text');
  const progressPercentText = document.getElementById('progress-percent-text');
  const progressSubText = document.getElementById('progress-sub-text');

  // =========================================================================
  // Toast System
  // =========================================================================
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('active');
    });

    setTimeout(() => {
      toast.classList.remove('active');
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }

  // =========================================================================
  // Score Badge & Tag Helpers
  // =========================================================================
  function getScoreBadgeClass(score) {
    if (score >= 85) return 'high';
    if (score >= 70) return 'medium';
    if (score >= 50) return 'consider';
    return 'low';
  }

  function getVerdictTag(category) {
    switch (category) {
      case 'STRONG_HIRE':
        return '<span class="verdict-tag strong_hire">🌟 STRONG HIRE</span>';
      case 'INTERVIEW':
        return '<span class="verdict-tag interview">🎯 INTERVIEW</span>';
      case 'CONSIDER':
        return '<span class="verdict-tag consider">⚖️ CONSIDER</span>';
      case 'NOT_MATCH':
      default:
        return '<span class="verdict-tag reject">❌ NOT MATCH</span>';
    }
  }

  function getQualificationTag(isQualified) {
    if (isQualified) {
      return '<span class="card-qualification-pill qualified" title="Đáp ứng chuẩn kỹ năng cốt lõi và kinh nghiệm">🟢 ĐẠT YÊU CẦU</span>';
    } else {
      return '<span class="card-qualification-pill unqualified" title="Chưa đáp ứng đủ kỹ năng bắt buộc hoặc số năm kinh nghiệm">🔴 CHƯA PHÙ HỢP</span>';
    }
  }

  function getEmailStatusTag(status) {
    switch (status) {
      case 'sent_invite':
        return '<span class="card-email-status-pill sent_invite">📨 Đã gửi Thư Mời</span>';
      case 'sent_reject':
        return '<span class="card-email-status-pill sent_reject">🤝 Đã gửi Thư Góp Ý</span>';
      case 'none':
      default:
        return '<span class="card-email-status-pill none">⏳ Chưa phản hồi</span>';
    }
  }

  // =========================================================================
  // Dynamic Score Recalculation Engine
  // =========================================================================
  function recalculateAllScores() {
    const totalW = currentWeights.skills + currentWeights.experience + currentWeights.education + currentWeights.semantic;
    if (totalW === 0) return;

    const wSkills = currentWeights.skills / totalW;
    const wExp = currentWeights.experience / totalW;
    const wEdu = currentWeights.education / totalW;
    const wSem = currentWeights.semantic / totalW;

    candidates.forEach(cand => {
      // Calculate weighted score
      let rawScore = (
        cand.score_breakdown.skills * wSkills +
        cand.score_breakdown.experience * wExp +
        cand.score_breakdown.education * wEdu +
        cand.score_breakdown.semantic * wSem
      );

      // Penalty check: if missing mandatory skills, deduct 15 points
      if (cand.missing_mandatory && cand.missing_mandatory.length > 0) {
        rawScore = Math.max(25, rawScore - 12);
      }

      cand.overall_score = Math.round(rawScore);

      // Category derivation
      if (cand.overall_score >= 85 && (!cand.missing_mandatory || cand.missing_mandatory.length === 0)) {
        cand.category = 'STRONG_HIRE';
        cand.is_qualified = true;
      } else if (cand.overall_score >= 70) {
        cand.category = 'INTERVIEW';
        cand.is_qualified = (!cand.missing_mandatory || cand.missing_mandatory.length === 0);
      } else if (cand.overall_score >= 50) {
        cand.category = 'CONSIDER';
        cand.is_qualified = false;
      } else {
        cand.category = 'NOT_MATCH';
        cand.is_qualified = false;
      }
    });

    renderBoard();
    if (currentView === 'table') renderTableView();
  }

  // =========================================================================
  // Render Kanban Cards & Update Stats
  // =========================================================================
  function getFilteredCandidates() {
    return candidates.filter(cand => {
      // Name, blind ID & skill search
      const query = searchQuery.toLowerCase().trim();
      const matchName = isBlindMode 
        ? cand.blind_id.toLowerCase().includes(query)
        : cand.name.toLowerCase().includes(query);
      const matchSkill = cand.skills.some(s => s.toLowerCase().includes(query));
      const matchUni = cand.university.toLowerCase().includes(query);
      const matchSearch = query === '' || matchName || matchSkill || matchUni;

      // Score filter
      const matchScore = cand.overall_score >= minScore;

      // Category filter
      const matchVerdict = (verdictFilter === 'ALL') || (cand.category === verdictFilter);

      // Qualification filter
      let matchQual = true;
      if (qualificationFilter === 'QUALIFIED') matchQual = cand.is_qualified;
      if (qualificationFilter === 'UNQUALIFIED') matchQual = !cand.is_qualified;

      // Email status filter
      const matchEmail = (emailStatusFilter === 'ALL') || (cand.email_status === emailStatusFilter);

      return matchSearch && matchScore && matchVerdict && matchQual && matchEmail;
    }).sort((a, b) => {
      if (sortMode === 'score_desc') return b.overall_score - a.overall_score;
      if (sortMode === 'score_asc') return a.overall_score - b.overall_score;
      if (sortMode === 'exp_desc') return b.experience_years - a.experience_years;
      if (sortMode === 'name_asc') {
        const nameA = isBlindMode ? a.blind_id : a.name;
        const nameB = isBlindMode ? b.blind_id : b.name;
        return nameA.localeCompare(nameB);
      }
      return 0;
    });
  }

  function renderBoard() {
    // Clear all column containers
    Object.values(kanbanColumns).forEach(col => col.innerHTML = '');

    const filtered = getFilteredCandidates();

    // Stats calculations
    const stageCounts = { applied: 0, screened: 0, interview: 0, offer: 0, rejected: 0 };
    let strongHireCount = 0;
    let qualifiedCount = 0;
    let emailSentCount = 0;

    candidates.forEach(c => {
      if (stageCounts[c.stage] !== undefined) stageCounts[c.stage]++;
      if (c.category === 'STRONG_HIRE') strongHireCount++;
      if (c.is_qualified) qualifiedCount++;
      if (c.email_status && c.email_status !== 'none') emailSentCount++;
    });

    // Update Top Stats
    countElements.applied.textContent = stageCounts.applied;
    countElements.screened.textContent = stageCounts.screened;
    countElements.interview.textContent = stageCounts.interview;
    countElements.offer.textContent = stageCounts.offer;
    countElements.rejected.textContent = stageCounts.rejected;
    countElements.total.textContent = candidates.length;
    countElements.strongHire.textContent = strongHireCount;

    const qualifiedPct = candidates.length > 0 ? Math.round((qualifiedCount / candidates.length) * 100) : 0;
    countElements.qualifiedRate.textContent = `${qualifiedPct}%`;
    countElements.emailOutreach.textContent = `${emailSentCount}/${candidates.length}`;

    // Populate filtered cards into columns
    filtered.forEach(cand => {
      const card = createCandidateCard(cand);
      const targetColumn = kanbanColumns[cand.stage];
      if (targetColumn) {
        targetColumn.appendChild(card);
      }
    });

    // Display empty placeholder in column if 0 cards
    Object.entries(kanbanColumns).forEach(([stage, colElem]) => {
      if (colElem.children.length === 0) {
        const emptyNotice = document.createElement('div');
        emptyNotice.style.cssText = 'padding: 2rem 1rem; text-align: center; color: var(--text-muted); font-size: 0.8125rem; border: 1px dashed rgba(255,255,255,0.06); border-radius: 12px;';
        emptyNotice.textContent = 'Chưa có hồ sơ trong giai đoạn này';
        colElem.appendChild(emptyNotice);
      }
    });
  }

  // =========================================================================
  // Create Single Candidate Card Element
  // =========================================================================
  function createCandidateCard(cand) {
    const card = document.createElement('div');
    card.className = 'candidate-card';
    card.setAttribute('draggable', 'true');
    card.setAttribute('data-id', cand.id);

    const displayName = isBlindMode ? cand.blind_id : cand.name;
    const displaySub = isBlindMode 
      ? `Exp: ${cand.experience_years} năm | Ẩn danh PII`
      : `${cand.experience_years} năm KN • ${cand.degree.split(' ')[0]}`;

    const scoreClass = getScoreBadgeClass(cand.overall_score);

    // Avatar
    const avatarHtml = isBlindMode
      ? `<div class="candidate-avatar blind" title="Danh tính PII đã được ẩn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>`
      : `<img src="${cand.avatar}" alt="${cand.name}" class="candidate-avatar" onerror="this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60'">`;

    // Skills chips snippet
    const skillsSnippet = cand.skills.slice(0, 4).map(skill => {
      const isMatched = cand.matched_skills.includes(skill);
      return `<span class="card-skill-chip ${isMatched ? 'matched' : ''}">${skill}</span>`;
    }).join('');

    card.innerHTML = `
      <div class="card-header-row">
        <div class="candidate-profile">
          ${avatarHtml}
          <div class="candidate-info">
            <h4 title="${displayName}">${displayName}</h4>
            <div class="cand-sub">${displaySub}</div>
          </div>
        </div>
        <div class="score-badge-circle ${scoreClass}">
          <span>${cand.overall_score}%</span>
          <span class="score-label">MATCH</span>
        </div>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.35rem;">
        ${getVerdictTag(cand.category)}
        ${getQualificationTag(cand.is_qualified)}
      </div>

      <div class="card-meta-tags-row">
        ${getEmailStatusTag(cand.email_status)}
      </div>

      <div class="card-skills-list">
        ${skillsSnippet}
        ${cand.skills.length > 4 ? `<span class="card-skill-chip">+${cand.skills.length - 4}</span>` : ''}
      </div>

      <div class="card-footer-actions">
        <button class="btn-card-action btn-open-xai" title="Xem giải trình AI">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
          Chi Tiết XAI
        </button>
        <button class="btn-card-action btn-card-email-action btn-open-email" title="Tự động soạn thảo email phản hồi phù hợp với kết quả">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          Phản Hồi Mail
        </button>
      </div>
    `;

    // Card Drag Events
    card.addEventListener('dragstart', (e) => {
      draggedCandidateId = cand.id;
      card.classList.add('dragging');
      e.dataTransfer.setData('text/plain', cand.id);
      e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      draggedCandidateId = null;
      document.querySelectorAll('.kanban-column').forEach(c => c.classList.remove('drag-over'));
    });

    // Card Action Click Events
    const btnXai = card.querySelector('.btn-open-xai');
    btnXai.addEventListener('click', (e) => {
      e.stopPropagation();
      openXaiModal(cand);
    });

    const btnEmail = card.querySelector('.btn-open-email');
    btnEmail.addEventListener('click', (e) => {
      e.stopPropagation();
      // Smart detection: if qualified -> open invite tone, if not -> open reject tone
      openEmailModal(cand, cand.is_qualified ? 'invite' : 'reject');
    });

    return card;
  }

  // =========================================================================
  // Table View Render
  // =========================================================================
  function renderTableView() {
    candidatesTableBody.innerHTML = '';
    const filtered = getFilteredCandidates();

    if (filtered.length === 0) {
      candidatesTableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 3rem;">Không tìm thấy ứng viên phù hợp với bộ lọc hiện tại.</td></tr>`;
      return;
    }

    filtered.forEach(cand => {
      const tr = document.createElement('tr');
      const displayName = isBlindMode ? cand.blind_id : cand.name;
      const displaySub = isBlindMode ? `Exp: ${cand.experience_years} năm` : `${cand.experience_years} năm KN • ${cand.university}`;
      const avatarHtml = isBlindMode
        ? `<div class="table-avatar-blind"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>`
        : `<img src="${cand.avatar}" alt="${cand.name}">`;

      const stageLabels = {
        applied: '1. Mới Ứng Tuyển',
        screened: '2. Đã Sàng Lọc',
        interview: '3. Mời Phỏng Vấn',
        offer: '4. Đề Nghị Việc',
        rejected: '5. Từ Chối'
      };

      tr.innerHTML = `
        <td>
          <div class="table-cand-cell">
            ${avatarHtml}
            <div>
              <div class="table-cand-name">${displayName}</div>
              <div class="table-cand-sub">${displaySub}</div>
            </div>
          </div>
        </td>
        <td>
          <strong style="font-size: 1rem; color: ${cand.overall_score >= 80 ? 'var(--emerald)' : cand.overall_score >= 60 ? 'var(--amber)' : 'var(--rose)'}; font-family: 'JetBrains Mono', monospace;">
            ${cand.overall_score}%
          </strong>
        </td>
        <td>${getVerdictTag(cand.category)}</td>
        <td>${getQualificationTag(cand.is_qualified)}</td>
        <td>${getEmailStatusTag(cand.email_status)}</td>
        <td><span class="meta-pill" style="font-size: 0.6875rem;">${stageLabels[cand.stage] || cand.stage}</span></td>
        <td>
          <div style="display: flex; gap: 0.25rem; flex-wrap: wrap; max-width: 220px;">
            ${cand.matched_skills.slice(0, 3).map(s => `<span class="card-skill-chip matched" style="font-size: 0.65rem;">${s}</span>`).join('')}
            ${cand.matched_skills.length > 3 ? `<span class="card-skill-chip" style="font-size: 0.65rem;">+${cand.matched_skills.length - 3}</span>` : ''}
          </div>
        </td>
        <td>
          <div style="display: flex; gap: 0.35rem;">
            <button class="btn-card-action btn-tbl-xai" style="padding: 0.25rem 0.5rem; font-size: 0.6875rem;">XAI</button>
            <button class="btn-card-action btn-card-email-action btn-tbl-email" style="padding: 0.25rem 0.5rem; font-size: 0.6875rem;">Email</button>
          </div>
        </td>
      `;

      tr.querySelector('.btn-tbl-xai').addEventListener('click', () => openXaiModal(cand));
      tr.querySelector('.btn-tbl-email').addEventListener('click', () => openEmailModal(cand, cand.is_qualified ? 'invite' : 'reject'));

      candidatesTableBody.appendChild(tr);
    });
  }

  // Switch between Kanban & Table views
  btnViewKanban.addEventListener('click', () => {
    currentView = 'kanban';
    btnViewKanban.classList.add('active');
    btnViewTable.classList.remove('active');
    kanbanViewWrapper.style.display = 'block';
    tableViewWrapper.style.display = 'none';
    renderBoard();
  });

  btnViewTable.addEventListener('click', () => {
    currentView = 'table';
    btnViewTable.classList.add('active');
    btnViewKanban.classList.remove('active');
    kanbanViewWrapper.style.display = 'none';
    tableViewWrapper.style.display = 'block';
    renderTableView();
  });

  // =========================================================================
  // Drag and Drop Pipeline Handling
  // =========================================================================
  document.querySelectorAll('.kanban-column').forEach(col => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      col.classList.add('drag-over');
    });

    col.addEventListener('dragleave', (e) => {
      if (!col.contains(e.relatedTarget)) {
        col.classList.remove('drag-over');
      }
    });

    col.addEventListener('drop', (e) => {
      e.preventDefault();
      col.classList.remove('drag-over');

      const candId = e.dataTransfer.getData('text/plain') || draggedCandidateId;
      const targetStage = col.getAttribute('data-stage');

      if (candId && targetStage) {
        const candidate = candidates.find(c => c.id === candId);
        if (candidate && candidate.stage !== targetStage) {
          candidate.stage = targetStage;
          renderBoard();
          if (currentView === 'table') renderTableView();

          const stageNames = {
            applied: '1. Mới Ứng Tuyển',
            screened: '2. Đã Sàng Lọc AI',
            interview: '3. Mời Phỏng Vấn',
            offer: '4. Đề Nghị Nhận Việc',
            rejected: '5. Từ Chối Hồ Sơ'
          };

          const candLabel = isBlindMode ? candidate.blind_id : candidate.name;
          showToast(`Đã chuyển ${candLabel} sang "${stageNames[targetStage]}"`, 'success');

          // If moved to interview or rejected, prompt email auto-outreach
          if (targetStage === 'interview' && candidate.email_status !== 'sent_invite') {
            setTimeout(() => {
              openEmailModal(candidate, 'invite');
              showToast(`🎯 AI đã chuẩn bị sẵn Thư Mời Phỏng Vấn cho ${candLabel}!`, 'info');
            }, 350);
          } else if (targetStage === 'rejected' && candidate.email_status !== 'sent_reject') {
            setTimeout(() => {
              openEmailModal(candidate, 'reject');
              showToast(`🤝 AI đã chuẩn bị sẵn Thư Từ Chối Xây Dựng cho ${candLabel}!`, 'info');
            }, 350);
          }
        }
      }
    });
  });

  // =========================================================================
  // Blind Screening Mode Toggle
  // =========================================================================
  function setBlindMode(active) {
    isBlindMode = active;
    blindCheckbox.checked = active;
    if (active) {
      blindToggleBox.classList.add('active');
      showToast('🛡️ Chế độ Blind Screening KÍCH HOẠT: Toàn bộ thông tin PII đã được ẩn danh.', 'warning');
    } else {
      blindToggleBox.classList.remove('active');
      showToast('Chế độ Blind Screening đã TẮT: Hiển thị đầy đủ danh tính ứng viên.', 'info');
    }
    renderBoard();
    if (currentView === 'table') renderTableView();
  }

  blindCheckbox.addEventListener('change', (e) => setBlindMode(e.target.checked));
  blindToggleBox.addEventListener('click', (e) => {
    if (e.target !== blindCheckbox) setBlindMode(!isBlindMode);
  });

  // =========================================================================
  // Criteria & Weights Calibration Handlers
  // =========================================================================
  btnToggleCriteria.addEventListener('click', () => {
    if (criteriaSummaryCard.style.display === 'none') {
      criteriaSummaryCard.style.display = 'flex';
      btnToggleCriteria.classList.add('btn-primary');
      btnToggleCriteria.classList.remove('btn-secondary');
    } else {
      criteriaSummaryCard.style.display = 'none';
      btnToggleCriteria.classList.remove('btn-primary');
      btnToggleCriteria.classList.add('btn-secondary');
    }
  });

  function updateWeightsUI() {
    valWeightSkills.textContent = `${inputWeightSkills.value}%`;
    valWeightExp.textContent = `${inputWeightExp.value}%`;
    valWeightEdu.textContent = `${inputWeightEdu.value}%`;
    valWeightSem.textContent = `${inputWeightSem.value}%`;

    const total = parseInt(inputWeightSkills.value) + parseInt(inputWeightExp.value) + parseInt(inputWeightEdu.value) + parseInt(inputWeightSem.value);
    totalWeightIndicator.textContent = `${total}%`;
    if (total === 100) {
      totalWeightIndicator.style.color = 'var(--emerald)';
    } else {
      totalWeightIndicator.style.color = 'var(--rose)';
    }
  }

  [inputWeightSkills, inputWeightExp, inputWeightEdu, inputWeightSem].forEach(input => {
    input.addEventListener('input', updateWeightsUI);
  });

  btnApplyWeights.addEventListener('click', () => {
    currentWeights.skills = parseInt(inputWeightSkills.value);
    currentWeights.experience = parseInt(inputWeightExp.value);
    currentWeights.education = parseInt(inputWeightEdu.value);
    currentWeights.semantic = parseInt(inputWeightSem.value);

    recalculateAllScores();
    showToast(`⚡ Đã tái tính toán điểm Match Score theo bộ trọng số mới (${currentWeights.skills}/${currentWeights.experience}/${currentWeights.education}/${currentWeights.semantic})!`, 'success');
  });

  btnResetWeights.addEventListener('click', () => {
    inputWeightSkills.value = 40;
    inputWeightExp.value = 30;
    inputWeightEdu.value = 15;
    inputWeightSem.value = 15;
    updateWeightsUI();
    currentWeights = { skills: 40, experience: 30, education: 15, semantic: 15 };
    recalculateAllScores();
    showToast('Đã khôi phục bộ trọng số tuyển dụng mặc định.', 'info');
  });

  // =========================================================================
  // Filters & Search Handlers
  // =========================================================================
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderBoard();
    if (currentView === 'table') renderTableView();
  });

  minScoreSlider.addEventListener('input', (e) => {
    minScore = parseInt(e.target.value, 10);
    minScoreVal.textContent = `${minScore}%`;
    renderBoard();
    if (currentView === 'table') renderTableView();
  });

  verdictSelect.addEventListener('change', (e) => {
    verdictFilter = e.target.value;
    renderBoard();
    if (currentView === 'table') renderTableView();
  });

  qualSelect.addEventListener('change', (e) => {
    qualificationFilter = e.target.value;
    renderBoard();
    if (currentView === 'table') renderTableView();
  });

  emailStatusSelect.addEventListener('change', (e) => {
    emailStatusFilter = e.target.value;
    renderBoard();
    if (currentView === 'table') renderTableView();
  });

  sortSelect.addEventListener('change', (e) => {
    sortMode = e.target.value;
    renderBoard();
    if (currentView === 'table') renderTableView();
  });

  btnResetFilters.addEventListener('click', () => {
    searchQuery = '';
    minScore = 0;
    verdictFilter = 'ALL';
    qualificationFilter = 'ALL';
    emailStatusFilter = 'ALL';
    sortMode = 'score_desc';

    searchInput.value = '';
    minScoreSlider.value = 0;
    minScoreVal.textContent = '0%';
    verdictSelect.value = 'ALL';
    qualSelect.value = 'ALL';
    emailStatusSelect.value = 'ALL';
    sortSelect.value = 'score_desc';

    renderBoard();
    if (currentView === 'table') renderTableView();
    showToast('Đã đặt lại toàn bộ bộ lọc về mặc định.');
  });

  // =========================================================================
  // XAI Breakdown Modal Logic
  // =========================================================================
  function openXaiModal(candidate) {
    selectedCandidate = candidate;
    const displayName = isBlindMode ? candidate.blind_id : candidate.name;
    document.getElementById('xai-modal-title').textContent = `Báo Cáo Giải Trình AI — ${displayName} (${candidate.overall_score}%)`;

    // 4 Score Pillars
    document.getElementById('xai-score-skills').textContent = `${candidate.score_breakdown.skills}%`;
    document.getElementById('xai-score-exp').textContent = `${candidate.score_breakdown.experience}%`;
    document.getElementById('xai-score-edu').textContent = `${candidate.score_breakdown.education}%`;
    document.getElementById('xai-score-sem').textContent = `${candidate.score_breakdown.semantic}%`;

    document.getElementById('lbl-xai-skills').textContent = `Kỹ Năng (${currentWeights.skills}%)`;
    document.getElementById('lbl-xai-exp').textContent = `Kinh Nghiệm (${currentWeights.experience}%)`;
    document.getElementById('lbl-xai-edu').textContent = `Học Vấn (${currentWeights.education}%)`;
    document.getElementById('lbl-xai-sem').textContent = `Ngữ Nghĩa (${currentWeights.semantic}%)`;

    // Matched skills
    const matchedContainer = document.getElementById('xai-matched-skills-list');
    matchedContainer.innerHTML = candidate.matched_skills.map(s => 
      `<span class="card-skill-chip matched">✓ ${s}</span>`
    ).join('') || '<span style="color: var(--text-muted); font-size: 0.75rem;">Không có kỹ năng trùng khớp</span>';

    // Missing skills
    const missingContainer = document.getElementById('xai-missing-skills-list');
    const allMissing = [...(candidate.missing_mandatory || []), ...(candidate.missing_preferred || [])];
    missingContainer.innerHTML = allMissing.map(s => {
      const isMandatory = (candidate.missing_mandatory || []).includes(s);
      return `<span class="card-skill-chip" style="color: ${isMandatory ? '#FB7185' : '#FBBF24'}; border-color: ${isMandatory ? 'rgba(251,113,133,0.3)' : 'rgba(251,191,36,0.3)'};">✗ ${s} ${isMandatory ? '(Bắt buộc - Phạt điểm)' : ''}</span>`;
    }).join('') || '<span style="color: #34D399; font-size: 0.75rem;">Đầy đủ toàn bộ kỹ năng yêu cầu</span>';

    // Strengths
    const strengthsContainer = document.getElementById('xai-strengths-list');
    strengthsContainer.innerHTML = candidate.strengths.map(st => `<li>${st}</li>`).join('');

    // Probes / Interview Questions
    const probesContainer = document.getElementById('xai-probes-list');
    probesContainer.innerHTML = candidate.interview_questions.map(q => `<li>${q}</li>`).join('');

    modalXaiOverlay.classList.add('active');
  }

  btnCloseXai.addEventListener('click', () => modalXaiOverlay.classList.remove('active'));

  btnXaiToEmail.addEventListener('click', () => {
    if (selectedCandidate) {
      modalXaiOverlay.classList.remove('active');
      openEmailModal(selectedCandidate, selectedCandidate.is_qualified ? 'invite' : 'reject');
    }
  });

  btnXaiMoveNext.addEventListener('click', () => {
    if (!selectedCandidate) return;
    const stages = ['applied', 'screened', 'interview', 'offer', 'rejected'];
    const currIdx = stages.indexOf(selectedCandidate.stage);
    if (currIdx >= 0 && currIdx < stages.length - 1) {
      selectedCandidate.stage = stages[currIdx + 1];
      renderBoard();
      if (currentView === 'table') renderTableView();
      modalXaiOverlay.classList.remove('active');
      showToast(`Đã chuyển ứng viên sang giai đoạn tiếp theo!`, 'success');
    } else {
      showToast('Ứng viên đã ở giai đoạn cuối quy trình.', 'warning');
    }
  });

  // =========================================================================
  // AI Outreach Email Logic (Single Candidate)
  // =========================================================================
  function generateEmailContent(candidate, tone) {
    const candidateName = isBlindMode ? candidate.blind_id : candidate.name;
    const jobTitle = JOB_REQUISITION.title;
    const topStrength = candidate.strengths[0] || "năng lực kỹ thuật nổi bật";
    const topGap = (candidate.skill_gaps && candidate.skill_gaps[0]) 
      || (candidate.missing_mandatory && candidate.missing_mandatory[0] ? `kỹ năng chuyên sâu với ${candidate.missing_mandatory[0]}` : "kinh nghiệm thực chiến nâng cao");

    if (tone === 'invite') {
      return {
        subject: `[TalentScout] Thư Mời Phỏng Vấn Vị Trí ${jobTitle} — ${candidateName}`,
        body: `Chào bạn ${candidateName},\n\n` +
          `Cảm ơn bạn đã quan tâm và nộp hồ sơ ứng tuyển vị trí ${jobTitle} tại TalentScout.\n\n` +
          `Hội đồng chuyên môn và hệ thống phân tích AI của chúng tôi đã xem xét rất kỹ hồ sơ của bạn và ghi nhận thế mạnh vượt trội: "${topStrength}". Với điểm số tương thích đạt ${candidate.overall_score}%, hồ sơ của bạn hoàn toàn ĐẠT TIÊU CHUẨN đầu vào cho vị trí này.\n\n` +
          `Chúng tôi trân trọng kính mời bạn tham dự buổi Phỏng Vấn Chuyên Sâu (Technical Round):\n` +
          `  • Thời gian đề xuất 1: 09:30 - 10:30 Thứ Năm, ngày 18/09/2026\n` +
          `  • Thời gian đề xuất 2: 14:00 - 15:00 Thứ Sáu, ngày 19/09/2026\n` +
          `  • Hình thức: Trực tuyến qua Google Meet (Link sẽ được gửi sau khi bạn xác nhận)\n` +
          `  • Người phỏng vấn: Tech Lead & Trưởng bộ phận Core Engineering\n\n` +
          `Bạn vui lòng phản hồi email này để xác nhận khung giờ thuận tiện nhất nhé.\n\n` +
          `Trân trọng,\nĐội ngũ Tuyển dụng TalentScout`
      };
    } else {
      return {
        subject: `[TalentScout] Cập Nhật Kết Quả Tuyển Dụng Vị Trí ${jobTitle} — ${candidateName}`,
        body: `Chào bạn ${candidateName},\n\n` +
          `Lời đầu tiên, TalentScout xin chân thành cảm ơn sự quan tâm và thời gian bạn đã dành để ứng tuyển cho vị trí ${jobTitle}.\n\n` +
          `Sau quá trình đối chiếu kỹ lưỡng với bộ tiêu chí của vị trí Senior hiện tại, chúng tôi rất tiếc phải thông báo hiện tại hồ sơ của bạn chưa phù hợp nhất với đợt tuyển dụng này. Hệ thống AI ghi nhận định hướng để bạn có thể tiếp tục trau dồi nâng cao năng lực: "${topGap}".\n\n` +
          `Hồ sơ của bạn đã được trân trọng lưu trữ trong Cơ sở Dữ liệu Tài Năng (Talent Pool) của TalentScout. Khi có các dự án mới hoặc vị trí khác phù hợp hơn với thế mạnh của bạn, bộ phận nhân sự sẽ chủ động kết nối lại.\n\n` +
          `Chúc bạn luôn giữ vững ngọn lửa đam mê và gặt hái thật nhiều thành công trong sự nghiệp!\n\n` +
          `Trân trọng,\nĐội ngũ Tuyển dụng TalentScout`
      };
    }
  }

  function openEmailModal(candidate, defaultTone = 'invite') {
    selectedCandidate = candidate;
    emailTone = defaultTone;

    if (emailTone === 'invite') {
      btnToneInvite.classList.add('active');
      btnToneReject.classList.remove('active');
    } else {
      btnToneReject.classList.add('active');
      btnToneInvite.classList.remove('active');
    }

    const recipient = isBlindMode 
      ? `${candidate.blind_id} <email-protected@talentscout.ai>`
      : `${candidate.name} <${candidate.email}>`;
    emailRecipient.value = recipient;

    const emailData = generateEmailContent(candidate, emailTone);
    emailSubject.value = emailData.subject;
    emailBody.value = emailData.body;

    modalEmailOverlay.classList.add('active');
  }

  btnToneInvite.addEventListener('click', () => {
    emailTone = 'invite';
    btnToneInvite.classList.add('active');
    btnToneReject.classList.remove('active');
    if (selectedCandidate) {
      const emailData = generateEmailContent(selectedCandidate, 'invite');
      emailSubject.value = emailData.subject;
      emailBody.value = emailData.body;
    }
  });

  btnToneReject.addEventListener('click', () => {
    emailTone = 'reject';
    btnToneReject.classList.add('active');
    btnToneInvite.classList.remove('active');
    if (selectedCandidate) {
      const emailData = generateEmailContent(selectedCandidate, 'reject');
      emailSubject.value = emailData.subject;
      emailBody.value = emailData.body;
    }
  });

  btnRegenEmail.addEventListener('click', () => {
    if (selectedCandidate) {
      const emailData = generateEmailContent(selectedCandidate, emailTone);
      emailSubject.value = emailData.subject;
      emailBody.value = emailData.body;
      showToast('AI đã tạo lại nội dung email theo ngữ cảnh mới nhất.', 'info');
    }
  });

  btnCopyEmail.addEventListener('click', () => {
    const fullText = `Tiêu đề: ${emailSubject.value}\n\n${emailBody.value}`;
    navigator.clipboard.writeText(fullText).then(() => {
      showToast('Đã sao chép nội dung email vào Clipboard!', 'success');
    }).catch(() => {
      showToast('Lỗi khi sao chép, vui lòng sao chép thủ công.', 'warning');
    });
  });

  btnSendEmail.addEventListener('click', () => {
    showToast('Đang kết nối máy chủ SMTP TalentScout...', 'info');
    setTimeout(() => {
      if (selectedCandidate) {
        selectedCandidate.email_status = emailTone === 'invite' ? 'sent_invite' : 'sent_reject';
        renderBoard();
        if (currentView === 'table') renderTableView();
      }
      modalEmailOverlay.classList.remove('active');
      showToast(`Email đã được gửi thành công đến ${emailRecipient.value}!`, 'success');
    }, 900);
  });

  btnCloseEmail.addEventListener('click', () => modalEmailOverlay.classList.remove('active'));

  // =========================================================================
  // BATCH AUTO-EMAIL DISPATCHER (AUTOMATED EMAIL FOR PASS & FAIL CANDIDATES)
  // =========================================================================
  function openBatchEmailModal() {
    // Partition candidates into Qualified (Pass) and Unqualified (Fail)
    const passGroup = candidates.filter(c => c.is_qualified);
    const rejectGroup = candidates.filter(c => !c.is_qualified);

    batchCountPass.textContent = passGroup.length;
    batchCountReject.textContent = rejectGroup.length;

    // Render Qualified List
    batchListPass.innerHTML = passGroup.map(cand => {
      const name = isBlindMode ? cand.blind_id : cand.name;
      const email = isBlindMode ? 'pii-hidden@talentscout.ai' : cand.email;
      const statusPill = cand.email_status === 'sent_invite' 
        ? '<span style="color: var(--emerald); font-size: 0.75rem;">✓ Đã gửi</span>'
        : '<span style="color: var(--text-muted); font-size: 0.75rem;">⏳ Chờ gửi thư mời</span>';

      return `
        <div class="batch-cand-item">
          <div>
            <strong>${name}</strong>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${email}</div>
          </div>
          <div style="text-align: right;">
            <span class="cand-score" style="color: var(--emerald);">${cand.overall_score}%</span>
            <div>${statusPill}</div>
          </div>
        </div>
      `;
    }).join('') || '<div style="color: var(--text-muted); font-size: 0.8125rem; text-align: center; padding: 1rem;">Không có ứng viên đạt yêu cầu</div>';

    // Render Unqualified List
    batchListReject.innerHTML = rejectGroup.map(cand => {
      const name = isBlindMode ? cand.blind_id : cand.name;
      const email = isBlindMode ? 'pii-hidden@talentscout.ai' : cand.email;
      const statusPill = cand.email_status === 'sent_reject' 
        ? '<span style="color: var(--amber); font-size: 0.75rem;">✓ Đã gửi</span>'
        : '<span style="color: var(--text-muted); font-size: 0.75rem;">⏳ Chờ gửi thư góp ý</span>';

      return `
        <div class="batch-cand-item">
          <div>
            <strong>${name}</strong>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${email}</div>
          </div>
          <div style="text-align: right;">
            <span class="cand-score" style="color: var(--rose);">${cand.overall_score}%</span>
            <div>${statusPill}</div>
          </div>
        </div>
      `;
    }).join('') || '<div style="color: var(--text-muted); font-size: 0.8125rem; text-align: center; padding: 1rem;">Không có ứng viên chưa phù hợp</div>';

    // Summary Text
    batchSummaryStatsText.innerHTML = `Sẵn sàng gửi tự động: <strong>${passGroup.length}</strong> Thư Mời Phỏng Vấn và <strong>${rejectGroup.length}</strong> Thư Từ Chối Mang Tính Xây Dựng.`;

    // Reset progress UI
    batchProgressBox.style.display = 'none';
    batchConsoleLog.innerHTML = '';
    btnExecuteBatchDispatch.disabled = false;
    btnExecuteBatchDispatch.style.opacity = '1';

    modalBatchEmailOverlay.classList.add('active');
  }

  btnOpenBatchEmail.addEventListener('click', openBatchEmailModal);
  btnCloseBatchEmail.addEventListener('click', () => modalBatchEmailOverlay.classList.remove('active'));
  btnCancelBatchEmail.addEventListener('click', () => modalBatchEmailOverlay.classList.remove('active'));

  // Execute Batch Sending Simulation
  btnExecuteBatchDispatch.addEventListener('click', () => {
    btnExecuteBatchDispatch.disabled = true;
    btnExecuteBatchDispatch.style.opacity = '0.5';
    batchProgressBox.style.display = 'block';

    const queue = [...candidates];
    const total = queue.length;
    let processed = 0;

    batchConsoleLog.innerHTML = `<div class="log-info">[INIT] Đang kết nối giao thức SMTP an toàn (SSL/TLS cổng 587)...</div>`;

    function logLine(msg, type = 'info') {
      const timeStr = new Date().toLocaleTimeString('vi-VN');
      const div = document.createElement('div');
      div.className = `log-${type}`;
      div.textContent = `[${timeStr}] ${msg}`;
      batchConsoleLog.appendChild(div);
      batchConsoleLog.scrollTop = batchConsoleLog.scrollHeight;
    }

    const interval = setInterval(() => {
      if (processed < total) {
        const cand = queue[processed];
        const name = isBlindMode ? cand.blind_id : cand.name;

        if (cand.is_qualified) {
          cand.email_status = 'sent_invite';
          logLine(`📨 Gửi Thư Mời Phỏng Vấn -> ${name} (${cand.overall_score}%) [THÀNH CÔNG]`, 'success');
        } else {
          cand.email_status = 'sent_reject';
          const reason = cand.missing_mandatory && cand.missing_mandatory.length > 0
            ? `Thiếu kỹ năng: ${cand.missing_mandatory.join(', ')}`
            : `${cand.experience_years} năm kinh nghiệm`;
          logLine(`🤝 Gửi Thư Từ Chối Xây Dựng (${reason}) -> ${name} [THÀNH CÔNG]`, 'warn');
        }

        processed++;
        const pct = Math.round((processed / total) * 100);
        batchPercentLabel.textContent = `${pct}%`;
        batchProgressBarFill.style.width = `${pct}%`;
        batchStatusLabel.textContent = `Đang xử lý ${processed}/${total} hồ sơ...`;
      } else {
        clearInterval(interval);
        logLine(`[COMPLETE] Đã hoàn thành gửi tự động 100% email phản hồi không bỏ sót bất kỳ ứng viên nào!`, 'success');
        batchStatusLabel.textContent = 'Hoàn tất gửi hàng loạt!';

        renderBoard();
        if (currentView === 'table') renderTableView();

        setTimeout(() => {
          showToast(`🎉 Đã tự động gửi thành công ${total} email phản hồi cho toàn bộ ứng viên!`, 'success');
        }, 600);
      }
    }, 450);
  });

  // =========================================================================
  // Resume Upload & Ingest Simulation
  // =========================================================================
  function renderPresets() {
    samplePresetsList.innerHTML = SAMPLE_PRESETS.map((preset, idx) => `
      <div class="preset-item" data-idx="${idx}">
        <div>
          <strong>${preset.name}</strong>
          <span>${preset.filename} • ${preset.filesize} • ${preset.exp} năm KN</span>
        </div>
        <button class="btn-secondary" style="font-size: 0.75rem; padding: 0.3rem 0.6rem;">Nạp Nhanh</button>
      </div>
    `).join('');

    samplePresetsList.querySelectorAll('.preset-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.getAttribute('data-idx'), 10);
        simulateUpload(SAMPLE_PRESETS[idx]);
      });
    });
  }

  btnOpenUploadModal.addEventListener('click', () => {
    modalUploadOverlay.classList.add('active');
    uploadProgressCard.classList.remove('active');
    renderPresets();
  });

  btnCloseUpload.addEventListener('click', () => modalUploadOverlay.classList.remove('active'));

  btnTriggerFile.addEventListener('click', () => cvFileInput.click());
  cvFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      simulateUpload({
        name: file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
        filename: file.name,
        filesize: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        exp: 3.8,
        skills: ["Python", "FastAPI", "React", "Docker", "PostgreSQL"],
        score: 82,
        category: "INTERVIEW",
        is_qualified: true,
        summary: "Ứng viên tải lên từ máy tính cá nhân qua hệ thống Ingestion API.",
        university: "Đại học Bách Khoa"
      });
    }
  });

  // Dropzone drag events
  ['dragenter', 'dragover'].forEach(name => {
    cvDropzone.addEventListener(name, (e) => {
      e.preventDefault();
      cvDropzone.classList.add('drag-active');
    });
  });

  ['dragleave', 'drop'].forEach(name => {
    cvDropzone.addEventListener(name, (e) => {
      e.preventDefault();
      cvDropzone.classList.remove('drag-active');
    });
  });

  cvDropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      simulateUpload({
        name: file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
        filename: file.name,
        filesize: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        exp: 4.0,
        skills: ["Python", "FastAPI", "React", "Docker", "PostgreSQL"],
        score: 85,
        category: "STRONG_HIRE",
        is_qualified: true,
        summary: "Ứng viên được nạp thành công từ tệp kéo thả trực tiếp.",
        university: "Đại học Khoa học Tự nhiên"
      });
    }
  });

  function simulateUpload(sample) {
    uploadProgressCard.classList.add('active');
    progressBarFill.style.width = '0%';
    progressStepText.textContent = '1/4: Đang đọc tệp và phân tách cấu trúc PDF...';
    progressPercentText.textContent = '20%';
    progressBarFill.style.width = '20%';

    setTimeout(() => {
      progressStepText.textContent = '2/4: Trích xuất thực thể NER Spacy & Từ điển ESCO...';
      progressPercentText.textContent = '55%';
      progressBarFill.style.width = '55%';
    }, 600);

    setTimeout(() => {
      progressStepText.textContent = '3/4: Tạo vector embedding BGE-M3 & So khớp ngữ nghĩa...';
      progressPercentText.textContent = '85%';
      progressBarFill.style.width = '85%';
    }, 1200);

    setTimeout(() => {
      progressStepText.textContent = '4/4: Tổng hợp giải trình XAI & Chuẩn bị phản hồi tự động...';
      progressPercentText.textContent = '100%';
      progressBarFill.style.width = '100%';

      const newId = `cand-${Date.now().toString().slice(-4)}`;
      const randomBlindNum = Math.floor(1000 + Math.random() * 9000);
      const isQualified = sample.score >= 65;

      const newCand = {
        id: newId,
        blind_id: `Candidate #TSC-${randomBlindNum}`,
        name: sample.name,
        avatar: `https://images.unsplash.com/photo-${1535713875002 + Math.floor(Math.random()*100)}?w=160&auto=format&fit=crop&q=80`,
        email: `${sample.name.toLowerCase().replace(/\s+/g, '.')}@candidate-mail.com`,
        phone: '0901.888.999',
        university: sample.university || 'Đại học Quốc gia',
        degree: 'Cử nhân CNTT',
        experience_years: sample.exp,
        stage: 'screened',
        overall_score: sample.score,
        category: sample.category,
        is_qualified: isQualified,
        email_status: 'none',
        applied_date: new Date().toISOString().split('T')[0],
        summary: sample.summary,
        skills: sample.skills,
        score_breakdown: {
          skills: sample.score > 80 ? 90 : 65,
          experience: Math.min(100, Math.round((sample.exp / 4.0) * 100)),
          education: 85,
          semantic: sample.score > 80 ? 88 : 70
        },
        matched_skills: sample.skills.filter(s => JOB_REQUISITION.mandatory_skills.includes(s) || JOB_REQUISITION.preferred_skills.includes(s)),
        missing_mandatory: JOB_REQUISITION.mandatory_skills.filter(s => !sample.skills.includes(s)),
        missing_preferred: JOB_REQUISITION.preferred_skills.filter(s => !sample.skills.includes(s)),
        strengths: [
          `Kinh nghiệm thực chiến ${sample.exp} năm phù hợp với vị trí tuyển dụng.`,
          `Nắm vững các công cụ chủ chốt: ${sample.skills.slice(0, 3).join(', ')}.`,
          `Phù hợp với văn hóa xây dựng sản phẩm linh hoạt.`
        ],
        skill_gaps: [
          `Cần cọ xát thêm với quy trình triển khai phân tán chịu tải lớn.`
        ],
        interview_questions: [
          `Dự án gần nhất bạn tự hào nhất là gì và bạn đóng góp vai trò cụ thể nào?`,
          `Cách bạn giải quyết xung đột ý kiến khi làm việc trong nhóm phát triển sản phẩm?`
        ]
      };

      candidates.unshift(newCand);
      renderBoard();
      if (currentView === 'table') renderTableView();

      setTimeout(() => {
        modalUploadOverlay.classList.remove('active');
        const qualifyText = newCand.is_qualified ? '🟢 ĐẠT YÊU CẦU' : '🔴 CHƯA PHÙ HỢP';
        showToast(`🎉 Đã nạp thành công "${newCand.name}" (${newCand.overall_score}% - ${qualifyText}) vào cột "Đã Sàng Lọc AI"!`, 'success');
      }, 700);

    }, 1800);
  }

  // =========================================================================
  // Modal Backdrop & ESC Key Handling
  // =========================================================================
  const allModals = [modalXaiOverlay, modalEmailOverlay, modalBatchEmailOverlay, modalUploadOverlay];
  allModals.forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      allModals.forEach(m => m.classList.remove('active'));
    }
  });

  // =========================================================================
  // Initial Render
  // =========================================================================
  renderBoard();
  showToast('Chào mừng bạn đến với TalentScout ATS Studio! Hệ thống đã sẵn sàng sàng lọc và phản hồi email tự động.', 'info');
});
