// TalentScout ATS Studio - Application Logic
// Handles Kanban Drag-and-Drop, Blind Screening Mode, XAI Breakdown & AI Email Generator

document.addEventListener('DOMContentLoaded', () => {
  // =========================================================================
  // Application State
  // =========================================================================
  let candidates = JSON.parse(JSON.stringify(INITIAL_CANDIDATES));
  let isBlindMode = false;
  let searchQuery = '';
  let minScore = 0;
  let verdictFilter = 'ALL';
  let sortMode = 'score_desc';
  let selectedCandidate = null;
  let emailTone = 'invite'; // 'invite' | 'reject'
  let draggedCandidateId = null;

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
    avgScore: document.getElementById('avg-score-display')
  };

  // Blind Mode Elements
  const blindCheckbox = document.getElementById('blind-mode-checkbox');
  const blindToggleBox = document.getElementById('blind-mode-toggle-box');

  // Filter Elements
  const searchInput = document.getElementById('candidate-search-input');
  const minScoreSlider = document.getElementById('min-score-slider');
  const minScoreVal = document.getElementById('min-score-val');
  const verdictSelect = document.getElementById('verdict-filter-select');
  const sortSelect = document.getElementById('sort-filter-select');
  const btnResetFilters = document.getElementById('btn-reset-filters');

  // Modals
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
    }, 3500);
  }

  // =========================================================================
  // Score Badge Helper
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

  // =========================================================================
  // Render Kanban Cards & Update Stats
  // =========================================================================
  function renderBoard() {
    // Clear all column containers
    Object.values(kanbanColumns).forEach(col => col.innerHTML = '');

    // Filter candidates
    let filtered = candidates.filter(cand => {
      // Name & skill search
      const query = searchQuery.toLowerCase().trim();
      const matchName = isBlindMode 
        ? cand.blind_id.toLowerCase().includes(query)
        : cand.name.toLowerCase().includes(query);
      const matchSkill = cand.skills.some(s => s.toLowerCase().includes(query));
      const matchSearch = query === '' || matchName || matchSkill;

      // Score filter
      const matchScore = cand.overall_score >= minScore;

      // Category filter
      const matchVerdict = (verdictFilter === 'ALL') || (cand.category === verdictFilter);

      return matchSearch && matchScore && matchVerdict;
    });

    // Sort candidates
    filtered.sort((a, b) => {
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

    // Count trackers
    const stageCounts = { applied: 0, screened: 0, interview: 0, offer: 0, rejected: 0 };
    let strongHireCount = 0;
    let totalScoreSum = 0;

    candidates.forEach(c => {
      if (stageCounts[c.stage] !== undefined) stageCounts[c.stage]++;
      if (c.category === 'STRONG_HIRE') strongHireCount++;
      totalScoreSum += c.overall_score;
    });

    // Update Top Stats
    countElements.applied.textContent = stageCounts.applied;
    countElements.screened.textContent = stageCounts.screened;
    countElements.interview.textContent = stageCounts.interview;
    countElements.offer.textContent = stageCounts.offer;
    countElements.rejected.textContent = stageCounts.rejected;
    countElements.total.textContent = candidates.length;
    countElements.strongHire.textContent = strongHireCount;
    countElements.avgScore.textContent = candidates.length > 0 
      ? (totalScoreSum / candidates.length).toFixed(1) + '%' 
      : '0%';

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
        emptyNotice.textContent = 'Kéo thả ứng viên vào đây hoặc chưa có hồ sơ';
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

      ${getVerdictTag(cand.category)}

      <div class="card-skills-list">
        ${skillsSnippet}
        ${cand.skills.length > 4 ? `<span class="card-skill-chip">+${cand.skills.length - 4}</span>` : ''}
      </div>

      <div class="card-footer-actions">
        <button class="btn-card-action btn-open-xai" title="Xem giải trình AI">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
          Chi Tiết XAI
        </button>
        <button class="btn-card-action btn-card-email btn-open-email" title="Soạn email phản hồi tự động">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          Email AI
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
      openEmailModal(cand);
    });

    return card;
  }

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
      // Only remove if leaving column bounds
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
          const oldStage = candidate.stage;
          candidate.stage = targetStage;
          renderBoard();

          const stageNames = {
            applied: '1. Mới Ứng Tuyển',
            screened: '2. Đã Sàng Lọc AI',
            interview: '3. Mời Phỏng Vấn',
            offer: '4. Đề Nghị Nhận Việc',
            rejected: '5. Từ Chối Hồ Sơ'
          };

          const candLabel = isBlindMode ? candidate.blind_id : candidate.name;
          showToast(`Đã chuyển ${candLabel} sang "${stageNames[targetStage]}"`, 'success');

          // If moved to rejected or interview, prompt email outreach
          if (targetStage === 'interview' || targetStage === 'rejected') {
            setTimeout(() => {
              if (confirm(`Bạn có muốn AI tự động soạn thảo email cho ứng viên ${candLabel} không?`)) {
                openEmailModal(candidate, targetStage === 'interview' ? 'invite' : 'reject');
              }
            }, 300);
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
      showToast('🛡️ Chế độ Blind Screening KÍCH HOẠT: Toàn bộ thông tin PII đã được mã hóa ẩn danh.', 'warning');
    } else {
      blindToggleBox.classList.remove('active');
      showToast('Chế độ Blind Screening đã TẮT: Hiển thị đầy đủ danh tính ứng viên.', 'info');
    }
    renderBoard();
  }

  blindCheckbox.addEventListener('change', (e) => {
    setBlindMode(e.target.checked);
  });

  blindToggleBox.addEventListener('click', (e) => {
    if (e.target !== blindCheckbox) {
      setBlindMode(!isBlindMode);
    }
  });

  // =========================================================================
  // Filters & Search Handlers
  // =========================================================================
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderBoard();
  });

  minScoreSlider.addEventListener('input', (e) => {
    minScore = parseInt(e.target.value, 10);
    minScoreVal.textContent = `${minScore}%`;
    renderBoard();
  });

  verdictSelect.addEventListener('change', (e) => {
    verdictFilter = e.target.value;
    renderBoard();
  });

  sortSelect.addEventListener('change', (e) => {
    sortMode = e.target.value;
    renderBoard();
  });

  btnResetFilters.addEventListener('click', () => {
    searchQuery = '';
    minScore = 0;
    verdictFilter = 'ALL';
    sortMode = 'score_desc';

    searchInput.value = '';
    minScoreSlider.value = 0;
    minScoreVal.textContent = '0%';
    verdictSelect.value = 'ALL';
    sortSelect.value = 'score_desc';

    renderBoard();
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

    // Matched skills
    const matchedContainer = document.getElementById('xai-matched-skills-list');
    matchedContainer.innerHTML = candidate.matched_skills.map(s => 
      `<span class="card-skill-chip matched">✓ ${s}</span>`
    ).join('') || '<span style="color: var(--text-muted); font-size: 0.75rem;">Không có kỹ năng trùng khớp</span>';

    // Missing skills
    const missingContainer = document.getElementById('xai-missing-skills-list');
    const allMissing = [...candidate.missing_mandatory, ...candidate.missing_preferred];
    missingContainer.innerHTML = allMissing.map(s => {
      const isMandatory = candidate.missing_mandatory.includes(s);
      return `<span class="card-skill-chip" style="color: ${isMandatory ? '#FB7185' : '#FBBF24'}; border-color: ${isMandatory ? 'rgba(251,113,133,0.3)' : 'rgba(251,191,36,0.3)'};">✗ ${s} ${isMandatory ? '(Bắt buộc - Phạt 25%)' : ''}</span>`;
    }).join('') || '<span style="color: #34D399; font-size: 0.75rem;">Đầy đủ toàn bộ kỹ năng yêu cầu</span>';

    // Strengths
    const strengthsContainer = document.getElementById('xai-strengths-list');
    strengthsContainer.innerHTML = candidate.strengths.map(st => `<li>${st}</li>`).join('');

    // Probes / Interview Questions
    const probesContainer = document.getElementById('xai-probes-list');
    probesContainer.innerHTML = candidate.interview_questions.map(q => `<li>${q}</li>`).join('');

    modalXaiOverlay.classList.add('active');
  }

  btnCloseXai.addEventListener('click', () => {
    modalXaiOverlay.classList.remove('active');
  });

  btnXaiToEmail.addEventListener('click', () => {
    if (selectedCandidate) {
      modalXaiOverlay.classList.remove('active');
      openEmailModal(selectedCandidate, selectedCandidate.overall_score >= 65 ? 'invite' : 'reject');
    }
  });

  btnXaiMoveNext.addEventListener('click', () => {
    if (!selectedCandidate) return;
    const stages = ['applied', 'screened', 'interview', 'offer', 'rejected'];
    const currIdx = stages.indexOf(selectedCandidate.stage);
    if (currIdx >= 0 && currIdx < stages.length - 1) {
      selectedCandidate.stage = stages[currIdx + 1];
      renderBoard();
      modalXaiOverlay.classList.remove('active');
      showToast(`Đã chuyển ứng viên sang giai đoạn tiếp theo!`, 'success');
    } else {
      showToast('Ứng viên đã ở giai đoạn cuối quy trình.', 'warning');
    }
  });

  // =========================================================================
  // AI Outreach Email Modal Logic
  // =========================================================================
  function generateEmailContent(candidate, tone) {
    const candidateName = isBlindMode ? candidate.blind_id : candidate.name;
    const jobTitle = JOB_REQUISITION.title;
    const topStrength = candidate.strengths[0] || "năng lực kỹ thuật nổi bật";
    const topGap = candidate.skill_gaps[0] || "kinh nghiệm chuyên sâu với hạ tầng nâng cao";

    if (tone === 'invite') {
      return {
        subject: `[TalentScout] Thư mời phỏng vấn vị trí ${jobTitle} — ${candidateName}`,
        body: `Chào bạn ${candidateName},\n\n` +
          `Cảm ơn bạn đã quan tâm và nộp hồ sơ ứng tuyển vị trí ${jobTitle} tại TalentScout.\n\n` +
          `Hội đồng tuyển dụng và hệ thống phân tích AI của chúng tôi đã đánh giá rất cao hồ sơ của bạn, đặc biệt là: "${topStrength}". Với độ tương thích đạt ${candidate.overall_score}%, chúng tôi tin rằng kinh nghiệm của bạn rất phù hợp với định hướng phát triển của đội ngũ Core Engineering.\n\n` +
          `Chúng tôi trân trọng mời bạn tham dự buổi Phỏng Vấn Kỹ Thuật (Technical Round) với các khung giờ đề xuất sau:\n` +
          `  • Khung 1: 09:30 - 10:30 Thứ Năm, ngày 18/09/2026\n` +
          `  • Khung 2: 14:00 - 15:00 Thứ Sáu, ngày 19/09/2026\n` +
          `  • Hình thức: Online qua Google Meet\n\n` +
          `Vui lòng phản hồi email này và xác nhận khung giờ thuận tiện nhất đối với bạn trước 17:00 ngày mai.\n\n` +
          `Trân trọng,\nĐội ngũ Tuyển dụng TalentScout`
      };
    } else {
      return {
        subject: `[TalentScout] Cập nhật kết quả hồ sơ ứng tuyển vị trí ${jobTitle}`,
        body: `Chào bạn ${candidateName},\n\n` +
          `Lời đầu tiên, TalentScout xin chân thành cảm ơn bạn đã dành thời gian và tâm huyết ứng tuyển cho vị trí ${jobTitle}.\n\n` +
          `Sau quá trình xem xét kỹ lưỡng so với các tiêu chuẩn khắt khe của đợt tuyển dụng này, chúng tôi rất tiếc phải thông báo hiện tại chưa thể đồng hành cùng bạn ở vị trí này. Hệ thống ghi nhận điểm bạn có thể tiếp tục trau dồi để mở rộng cơ hội trong tương lai: "${topGap}".\n\n` +
          `Hồ sơ của bạn đã được lưu trữ trong Cơ sở Dữ liệu Tài Năng (Talent Pool) của TalentScout. Khi có các dự án mới phù hợp hơn với thế mạnh của bạn, chúng tôi sẽ chủ động liên hệ lại.\n\n` +
          `Chúc bạn luôn giữ vững đam mê và đạt được nhiều thành công trên con đường sự nghiệp!\n\n` +
          `Trân trọng,\nĐội ngũ Tuyển dụng TalentScout`
      };
    }
  }

  function openEmailModal(candidate, defaultTone = 'invite') {
    selectedCandidate = candidate;
    emailTone = defaultTone;

    // Update Tone Button UI
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
    showToast('Đang kết nối SMTP Server...', 'info');
    setTimeout(() => {
      modalEmailOverlay.classList.remove('active');
      showToast(`Email đã được gửi thành công đến ${emailRecipient.value}!`, 'success');
    }, 1000);
  });

  btnCloseEmail.addEventListener('click', () => {
    modalEmailOverlay.classList.remove('active');
  });

  // =========================================================================
  // Resume Upload & Ingest Simulation
  // =========================================================================
  btnOpenUploadModal.addEventListener('click', () => {
    modalUploadOverlay.classList.add('active');
    uploadProgressCard.classList.remove('active');
    renderSamplePresets();
  });

  btnCloseUpload.addEventListener('click', () => {
    modalUploadOverlay.classList.remove('active');
  });

  function renderSamplePresets() {
    samplePresetsList.innerHTML = SAMPLE_PRESETS.map((preset, index) => `
      <div class="preset-item" data-index="${index}">
        <div>
          <strong>📄 ${preset.name}</strong>
          <div><span>Tệp: ${preset.filename} (${preset.filesize}) • ${preset.exp} năm KN</span></div>
        </div>
        <div>
          <span class="btn-primary" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;">Nạp CV Này →</span>
        </div>
      </div>
    `).join('');

    samplePresetsList.querySelectorAll('.preset-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.getAttribute('data-index'), 10);
        simulateResumeIngestion(SAMPLE_PRESETS[idx]);
      });
    });
  }

  btnTriggerFile.addEventListener('click', (e) => {
    e.stopPropagation();
    cvFileInput.click();
  });

  cvDropzone.addEventListener('click', () => {
    cvFileInput.click();
  });

  cvFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const customCandidate = {
        name: file.name.replace(/\.[^/.]+$/, "").replace(/_/g, ' '),
        filename: file.name,
        filesize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        exp: 4.0,
        skills: ["Python", "FastAPI", "React", "Docker", "PostgreSQL"],
        score: 87,
        category: "STRONG_HIRE",
        summary: "Ứng viên tự động trích xuất từ tệp tải lên của người dùng.",
        university: "Đại học Quốc gia"
      };
      simulateResumeIngestion(customCandidate);
    }
  });

  function simulateResumeIngestion(presetData) {
    uploadProgressCard.classList.add('active');
    progressBarFill.style.width = '10%';
    progressPercentText.textContent = '10%';
    progressStepText.textContent = `Bắt đầu nạp: ${presetData.filename}...`;

    // Step 1: Ingestion & OCR (<1s)
    setTimeout(() => {
      progressBarFill.style.width = '45%';
      progressPercentText.textContent = '45%';
      progressStepText.textContent = 'Trích xuất cấu trúc văn bản & OCR PyMuPDF...';
      progressSubText.textContent = 'Đang nhận dạng các khối thông tin: Học vấn, Kinh nghiệm, Dự án...';
    }, 500);

    // Step 2: Spacy NER & Skills Taxonomy
    setTimeout(() => {
      progressBarFill.style.width = '78%';
      progressPercentText.textContent = '78%';
      progressStepText.textContent = 'Đối soát Spacy NER & Từ điển kỹ năng ESCO...';
      progressSubText.textContent = `Đã nhận diện ${presetData.skills.length} kỹ năng, kinh nghiệm: ${presetData.exp} năm.`;
    }, 1200);

    // Step 3: LLM Evaluation & Structured Output
    setTimeout(() => {
      progressBarFill.style.width = '100%';
      progressPercentText.textContent = '100%';
      progressStepText.textContent = 'LLM Chấm điểm tương thích & XAI Synthesis hoàn tất!';
      progressSubText.textContent = `Điểm phù hợp: ${presetData.score}% — Nhãn: ${presetData.category}`;

      // Create new candidate object
      const randomHash = Math.floor(1000 + Math.random() * 9000);
      const newCand = {
        id: `cand-${Date.now()}`,
        blind_id: `Candidate #TSC-${randomHash}`,
        name: presetData.name.split(' - ')[0],
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80",
        email: `${presetData.name.toLowerCase().replace(/[^a-z]/g, '')}@gmail.com`,
        phone: "09" + Math.floor(10000000 + Math.random() * 90000000),
        university: presetData.university,
        degree: "Cử nhân CNTT",
        experience_years: presetData.exp,
        stage: "screened",
        overall_score: presetData.score,
        category: presetData.category,
        applied_date: new Date().toISOString().split('T')[0],
        summary: presetData.summary,
        skills: presetData.skills,
        score_breakdown: {
          skills: presetData.score >= 80 ? 90 : 60,
          experience: Math.min(100, Math.round((presetData.exp / 4.0) * 100)),
          education: 85,
          semantic: presetData.score
        },
        matched_skills: presetData.skills.filter(s => JOB_REQUISITION.mandatory_skills.includes(s) || JOB_REQUISITION.preferred_skills.includes(s)),
        missing_mandatory: JOB_REQUISITION.mandatory_skills.filter(s => !presetData.skills.includes(s)),
        missing_preferred: JOB_REQUISITION.preferred_skills.filter(s => !presetData.skills.includes(s)),
        strengths: [
          `Kinh nghiệm thực tế ${presetData.exp} năm trong lĩnh vực phát triển phần mềm.`,
          `Nắm vững các kỹ năng quan trọng: ${presetData.skills.slice(0, 3).join(', ')}.`,
          `Thời gian xử lý và bóc tách CV thần tốc: 2.1 giây.`
        ],
        skill_gaps: [
          "Cần đào sâu thêm kinh nghiệm tối ưu hóa hiệu năng và triển khai hạ tầng đám mây."
        ],
        interview_questions: [
          "Hãy mô tả kiến trúc dự án phức tạp nhất mà bạn đã từng tham gia.",
          "Cách bạn tiếp cận và giải quyết các bài toán về tối ưu tốc độ phản hồi API?"
        ]
      };

      candidates.unshift(newCand);
      renderBoard();

      setTimeout(() => {
        modalUploadOverlay.classList.remove('active');
        showToast(`🎉 Đã nạp thành công ứng viên "${newCand.name}" (${newCand.overall_score}%) vào cột "Đã Sàng Lọc AI"!`, 'success');
      }, 700);

    }, 2100);
  }

  // Toggle Criteria Drawer Card
  const btnToggleCriteria = document.getElementById('btn-toggle-criteria');
  const criteriaSummaryCard = document.getElementById('criteria-summary-card');
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

  // Close modals on clicking overlay backdrop
  [modalXaiOverlay, modalEmailOverlay, modalUploadOverlay].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });

  // Escape key to close any active modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      [modalXaiOverlay, modalEmailOverlay, modalUploadOverlay].forEach(m => m.classList.remove('active'));
    }
  });

  // =========================================================================
  // Initial Render
  // =========================================================================
  renderBoard();
  showToast('Chào mừng bạn đến với TalentScout ATS Studio! Hệ thống đã sẵn sàng.', 'info');
});
