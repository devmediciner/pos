/* ==========================================================================
   Clean & Minimalist Course Logic - Pós-Graduação em Pediatria CENBRAP
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    const courseData = window.COURSE_DATA || [];
    
    let currentModuleIndex = courseData.findIndex(m => m.ordem === 1 && m.tipo === "modulo");
    if (currentModuleIndex === -1) currentModuleIndex = 0;

    let currentLessonIndex = 0;
    let currentFilter = "todos";
    let searchQuery = "";
    
    let quizState = JSON.parse(localStorage.getItem("pediatria_quiz_state") || "{}");

    // DOM Elements
    const modulesListEl = document.getElementById("modules-list");
    const moduleCounterEl = document.getElementById("module-counter");
    const moduleTitleEl = document.getElementById("module-title");
    const heroModuleNumberEl = document.getElementById("hero-module-number");
    const moduleProfessorEl = document.getElementById("module-professor");
    const moduleLessonsCountEl = document.getElementById("module-lessons-count");
    const btnSlidesEl = document.getElementById("btn-slides");

    // Video Player Elements
    const courseVideo = document.getElementById("course-video");
    const courseIframe = document.getElementById("course-iframe");
    const currentLessonTitleEl = document.getElementById("current-lesson-title");
    const videoExternalNotice = document.getElementById("video-external-notice");
    const externalVideoDesc = document.getElementById("external-video-desc");
    const btnOpenExternal = document.getElementById("btn-open-external-player");
    const playlistCardsEl = document.getElementById("playlist-cards");
    const playlistProgressEl = document.getElementById("playlist-progress");
    const btnPrevLesson = document.getElementById("btn-prev-lesson");
    const btnNextLesson = document.getElementById("btn-next-lesson");
    const speedButtons = document.querySelectorAll(".speed-btn");
    const speedSelectorEl = document.getElementById("speed-selector");

    // Source Selector Elements
    const btnSourceDrive = document.getElementById("btn-source-drive");
    const btnSourceLocal = document.getElementById("btn-source-local");
    let currentVideoSource = localStorage.getItem("pediatria_video_source") || "drive";

    // Quiz Elements
    const questionsContainer = document.getElementById("questions-container");
    const quizScoreDisplay = document.getElementById("quiz-score-display");
    const quizProgressBar = document.getElementById("quiz-progress-bar");
    const quizPercentage = document.getElementById("quiz-percentage");
    const quizCountBadge = document.getElementById("quiz-count-badge");
    const btnShowAnswers = document.getElementById("btn-show-answers");
    const btnResetQuiz = document.getElementById("btn-reset-quiz");

    // Syllabus Tab & Notes Elements
    const syllabusContainer = document.getElementById("syllabus-container");
    const notesTextarea = document.getElementById("module-notes-textarea");
    const notesStatus = document.getElementById("notes-status");

    // Search & Filter
    const globalSearchInput = document.getElementById("global-search");
    const clearSearchBtn = document.getElementById("clear-search");
    const filterTabs = document.querySelectorAll(".filter-tab");
    const detailsTabs = document.querySelectorAll(".details-tab");
    const themeToggleBtn = document.getElementById("theme-toggle");

    // Theme Switcher
    const savedTheme = localStorage.getItem("pediatria_theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);

    themeToggleBtn.addEventListener("click", () => {
        const activeTheme = document.documentElement.getAttribute("data-theme");
        const nextTheme = activeTheme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", nextTheme);
        localStorage.setItem("pediatria_theme", nextTheme);
    });

    // Source Selector Handlers
    function updateSourceButtons() {
        if (btnSourceDrive) btnSourceDrive.classList.toggle("active", currentVideoSource === "drive");
        if (btnSourceLocal) btnSourceLocal.classList.toggle("active", currentVideoSource === "local");
        if (speedSelectorEl) {
            speedSelectorEl.style.display = currentVideoSource === "local" ? "flex" : "none";
        }
    }
    updateSourceButtons();

    if (btnSourceDrive) {
        btnSourceDrive.addEventListener("click", () => {
            currentVideoSource = "drive";
            localStorage.setItem("pediatria_video_source", "drive");
            updateSourceButtons();
            loadLesson(currentLessonIndex);
        });
    }

    if (btnSourceLocal) {
        btnSourceLocal.addEventListener("click", () => {
            currentVideoSource = "local";
            localStorage.setItem("pediatria_video_source", "local");
            updateSourceButtons();
            loadLesson(currentLessonIndex);
        });
    }

    // Sidebar Rendering
    function renderSidebar() {
        modulesListEl.innerHTML = "";

        const filteredModules = courseData.filter((mod) => {
            if (currentFilter === "locais") {
                const hasLocal = mod.aulas && mod.aulas.some(a => a.local_video);
                if (!hasLocal) return false;
            } else if (currentFilter === "bonus") {
                if (mod.tipo === "modulo") return false;
            }

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const titleMatch = mod.titulo.toLowerCase().includes(q);
                const profMatch = (mod.professor || "").toLowerCase().includes(q);
                const aulaMatch = mod.aulas && mod.aulas.some(a => a.titulo.toLowerCase().includes(q));
                return titleMatch || profMatch || aulaMatch;
            }

            return true;
        });

        moduleCounterEl.textContent = `${filteredModules.length} ${filteredModules.length === 1 ? 'item' : 'itens'}`;

        if (filteredModules.length === 0) {
            modulesListEl.innerHTML = `
                <div style="padding: 20px 10px; text-align: center; color: var(--text-muted); font-size: 13px;">
                    Nenhum módulo encontrado.
                </div>
            `;
            return;
        }

        filteredModules.forEach((mod) => {
            const actualIndex = courseData.indexOf(mod);
            const card = document.createElement("div");
            card.className = `module-nav-card ${actualIndex === currentModuleIndex ? 'active' : ''}`;

            const numDisplay = mod.ordem > 0 ? mod.ordem : (mod.tipo === 'bonus' ? 'B' : 'I');
            const hasVideo = mod.aulas && mod.aulas.some(a => a.local_video || a.drive_url);

            card.innerHTML = `
                <div class="module-nav-number">${numDisplay}</div>
                <div class="module-nav-info">
                    <div class="module-nav-title">${mod.titulo}</div>
                    <div class="module-nav-meta">
                        <span>${mod.professor ? mod.professor.split(' ')[0] : 'CENBRAP'}</span>
                        <span>•</span>
                        <span>${mod.quantidade_aulas || (mod.aulas ? mod.aulas.length : 0)} aulas</span>
                        ${hasVideo ? '<span style="color: var(--primary);"><i class="bi bi-check-circle"></i></span>' : ''}
                    </div>
                </div>
            `;

            card.addEventListener("click", () => {
                selectModule(actualIndex);
            });

            modulesListEl.appendChild(card);
        });
    }

    // Module Selection
    function selectModule(index) {
        currentModuleIndex = index;
        currentLessonIndex = 0;
        const mod = courseData[currentModuleIndex];

        moduleTitleEl.textContent = mod.titulo;
        heroModuleNumberEl.textContent = mod.ordem > 0 ? `Módulo ${mod.ordem}` : mod.titulo;
        moduleProfessorEl.textContent = mod.professor || "Corpo Docente CENBRAP";
        
        const aulasCount = mod.aulas ? mod.aulas.length : 0;
        moduleLessonsCountEl.textContent = `${aulasCount} ${aulasCount === 1 ? 'aula' : 'aulas'}`;

        if (mod.slides_url) {
            btnSlidesEl.href = mod.slides_url;
            btnSlidesEl.style.display = "inline-flex";
        } else {
            btnSlidesEl.style.display = "none";
        }

        renderPlaylist();
        loadLesson(0);
        renderQuiz();
        renderSyllabus();
        loadNotes();
        renderSidebar();
    }

    // Lesson / Video Player Management
    function renderPlaylist() {
        playlistCardsEl.innerHTML = "";
        const mod = courseData[currentModuleIndex];
        const aulas = mod.aulas || [];

        playlistProgressEl.textContent = `${aulas.length > 0 ? currentLessonIndex + 1 : 0} de ${aulas.length}`;

        aulas.forEach((aula, idx) => {
            const card = document.createElement("div");
            card.className = `playlist-card ${idx === currentLessonIndex ? 'active' : ''}`;

            card.innerHTML = `
                <div class="playlist-card-top">
                    <span>Parte ${idx + 1}</span>
                    ${(aula.local_video || aula.drive_url) ? '<i class="bi bi-check"></i>' : ''}
                </div>
                <div class="playlist-card-title">${aula.titulo}</div>
            `;

            card.addEventListener("click", () => {
                loadLesson(idx);
            });

            playlistCardsEl.appendChild(card);
        });
    }

    function loadLesson(index) {
        const mod = courseData[currentModuleIndex];
        const aulas = mod.aulas || [];

        if (index < 0 || index >= aulas.length) return;
        currentLessonIndex = index;
        const aula = aulas[currentLessonIndex];

        currentLessonTitleEl.textContent = aula.titulo;
        playlistProgressEl.textContent = `${currentLessonIndex + 1} de ${aulas.length}`;

        btnPrevLesson.disabled = currentLessonIndex === 0;
        btnNextLesson.disabled = currentLessonIndex === aulas.length - 1;

        const cards = playlistCardsEl.querySelectorAll(".playlist-card");
        cards.forEach((c, i) => {
            c.classList.toggle("active", i === currentLessonIndex);
        });

        // Determine video source: Google Drive, YouTube, or Local/Direct MP4
        const driveId = aula.drive_id || (aula.drive_url ? (aula.drive_url.match(/file\/d\/([a-zA-Z0-9_-]+)/) || [])[1] : null);
        const hasDrive = Boolean(driveId);
        const hasLocal = Boolean(aula.local_video);

        let useDrive = (currentVideoSource === "drive" && hasDrive) || (!hasLocal && hasDrive);

        if (useDrive && driveId) {
            try { courseVideo.pause(); } catch (e) {}
            courseVideo.style.display = "none";
            videoExternalNotice.style.display = "none";
            courseIframe.style.display = "block";
            courseIframe.src = `https://drive.google.com/file/d/${driveId}/preview`;
        } else if (hasLocal) {
            courseIframe.style.display = "none";
            courseIframe.src = "";
            courseVideo.style.display = "block";
            videoExternalNotice.style.display = "none";
            courseVideo.src = encodeURI(aula.local_video);
            courseVideo.load();
        } else {
            try { courseVideo.pause(); } catch (e) {}
            courseVideo.style.display = "none";
            courseIframe.style.display = "none";
            courseIframe.src = "";
            videoExternalNotice.style.display = "flex";
            externalVideoDesc.textContent = `A aula "${aula.titulo}" pode ser assistida no portal CENBRAP.`;
            btnOpenExternal.href = aula.video_url || "https://portal.cenbrap.edu.br/PosEad";
        }
    }

    btnPrevLesson.addEventListener("click", () => {
        if (currentLessonIndex > 0) loadLesson(currentLessonIndex - 1);
    });

    btnNextLesson.addEventListener("click", () => {
        const aulas = courseData[currentModuleIndex].aulas || [];
        if (currentLessonIndex < aulas.length - 1) loadLesson(currentLessonIndex + 1);
    });

    speedButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const speed = parseFloat(btn.getAttribute("data-speed"));
            courseVideo.playbackRate = speed;
            speedButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
        });
    });

    // Quiz Implementation
    function renderQuiz() {
        questionsContainer.innerHTML = "";
        const mod = courseData[currentModuleIndex];
        const questions = mod.questoes_detalhadas || [];
        quizCountBadge.textContent = questions.length;

        if (questions.length === 0) {
            questionsContainer.innerHTML = `
                <div style="padding: 24px 12px; text-align: center; color: var(--text-muted);">
                    Não há questões interativas cadastradas para este módulo.
                </div>
            `;
            updateQuizScore();
            return;
        }

        questions.forEach((q, idx) => {
            const qId = q.id || `q_${currentModuleIndex}_${idx}`;
            const state = quizState[qId] || null;

            const card = document.createElement("div");
            card.className = "question-card";
            card.id = `card_${qId}`;

            let statusHtml = '<span class="question-status-pill text-muted">Pendente</span>';
            if (state) {
                if (state.isCorrect) {
                    card.classList.add("answered-correct");
                    statusHtml = '<span class="question-status-pill status-correct">Correto</span>';
                } else {
                    card.classList.add("answered-wrong");
                    statusHtml = '<span class="question-status-pill status-wrong">Incorreto</span>';
                }
            }

            const isMC = q.tipo === "multipla_escolha";
            const qTypeLabel = isMC ? "Múltipla Escolha" : "Verdadeiro / Falso";

            let optionsHtml = "";
            if (isMC) {
                optionsHtml = `<div class="question-options multiple-choice" id="opts_${qId}">`;
                (q.opcoes || []).forEach((opt) => {
                    const optKey = (opt.letra || opt.id || "").trim().toUpperCase();
                    const correctKey = (q.resposta_correta || "").trim().toUpperCase();
                    const isSelected = state && state.selected && state.selected.trim().toUpperCase() === optKey;
                    const isOfficialCorrect = optKey === correctKey;

                    let btnClass = "option-btn";
                    if (state) {
                        if (isSelected) {
                            btnClass += state.isCorrect ? " selected-correct" : " selected-wrong";
                        } else if (!state.isCorrect && isOfficialCorrect) {
                            btnClass += " correct-reveal";
                        }
                    }

                    optionsHtml += `
                        <button class="${btnClass}" data-qid="${qId}" data-val="${optKey}" data-correct="${correctKey}">
                            <span class="opt-bullet">${opt.letra ? opt.letra + ')' : '•'}</span>
                            <span class="opt-text">${opt.texto.replace(/^[a-eA-E]\)\s*/, '')}</span>
                        </button>
                    `;
                });
                optionsHtml += `</div>`;
            } else {
                const selectedV = state && state.selected === 'V';
                const selectedF = state && state.selected === 'F';
                const correctKey = (q.resposta_correta || "").trim().toUpperCase();

                let btnVClass = "option-btn";
                let btnFClass = "option-btn";

                if (state) {
                    if (selectedV) btnVClass += state.isCorrect ? " selected-correct" : " selected-wrong";
                    else if (!state.isCorrect && correctKey === 'V') btnVClass += " correct-reveal";

                    if (selectedF) btnFClass += state.isCorrect ? " selected-correct" : " selected-wrong";
                    else if (!state.isCorrect && correctKey === 'F') btnFClass += " correct-reveal";
                }

                optionsHtml = `
                    <div class="question-options vf" id="opts_${qId}">
                        <button class="${btnVClass}" data-qid="${qId}" data-val="V" data-correct="${correctKey}">Verdadeiro</button>
                        <button class="${btnFClass}" data-qid="${qId}" data-val="F" data-correct="${correctKey}">Falso</button>
                    </div>
                `;
            }

            let feedbackAnswer = q.resposta_correta;
            if (q.tipo === "V/F") {
                feedbackAnswer = q.resposta_correta === 'V' ? 'Verdadeiro' : 'Falso';
            } else if (q.resposta_texto) {
                feedbackAnswer = `${q.resposta_correta} - ${q.resposta_texto}`;
            }

            card.innerHTML = `
                <div class="question-top">
                    <span class="question-number-pill">Questão ${idx + 1} de ${questions.length} • ${qTypeLabel}</span>
                    <div id="status_${qId}">${statusHtml}</div>
                </div>

                <div class="question-statement">${q.enunciado}</div>

                ${optionsHtml}

                <div class="question-feedback" id="feedback_${qId}" style="${state ? 'display: block;' : 'display: none;'}">
                    Resposta oficial: <strong>${feedbackAnswer}</strong>
                </div>
            `;

            // Event listeners for option buttons
            const btns = card.querySelectorAll(`#opts_${qId} .option-btn`);
            btns.forEach(btn => {
                btn.addEventListener("click", () => {
                    const val = btn.getAttribute("data-val");
                    const cor = btn.getAttribute("data-correct");
                    answerQuestion(qId, val, cor);
                });
            });

            questionsContainer.appendChild(card);
        });

        updateQuizScore();
    }

    function answerQuestion(qId, selectedChoice, correctChoice) {
        const isCorrect = (selectedChoice || "").trim().toUpperCase() === (correctChoice || "").trim().toUpperCase();
        quizState[qId] = { selected: selectedChoice, isCorrect: isCorrect };
        localStorage.setItem("pediatria_quiz_state", JSON.stringify(quizState));

        const card = document.getElementById(`card_${qId}`);
        const statusEl = document.getElementById(`status_${qId}`);
        const feedbackEl = document.getElementById(`feedback_${qId}`);
        const optsContainer = document.getElementById(`opts_${qId}`);

        if (card) {
            card.classList.remove("answered-correct", "answered-wrong");
            card.classList.add(isCorrect ? "answered-correct" : "answered-wrong");
        }

        if (statusEl) {
            statusEl.innerHTML = isCorrect 
                ? '<span class="question-status-pill status-correct">Correto</span>'
                : '<span class="question-status-pill status-wrong">Incorreto</span>';
        }

        if (optsContainer) {
            const btns = optsContainer.querySelectorAll(".option-btn");
            btns.forEach(b => {
                b.classList.remove("selected-correct", "selected-wrong", "correct-reveal");
                const bVal = (b.getAttribute("data-val") || "").trim().toUpperCase();
                const selVal = (selectedChoice || "").trim().toUpperCase();
                const corVal = (correctChoice || "").trim().toUpperCase();

                if (bVal === selVal) {
                    b.classList.add(isCorrect ? "selected-correct" : "selected-wrong");
                } else if (!isCorrect && bVal === corVal) {
                    b.classList.add("correct-reveal");
                }
            });
        }

        if (feedbackEl) {
            feedbackEl.style.display = "block";
        }

        updateQuizScore();
    }

    function updateQuizScore() {
        const mod = courseData[currentModuleIndex];
        const questions = mod.questoes_detalhadas || [];
        if (questions.length === 0) {
            quizScoreDisplay.textContent = "0 / 0";
            quizProgressBar.style.width = "0%";
            quizPercentage.textContent = "0%";
            return;
        }

        let correct = 0;
        questions.forEach((q, idx) => {
            const qId = q.id || `q_${currentModuleIndex}_${idx}`;
            if (quizState[qId] && quizState[qId].isCorrect) correct++;
        });

        const percent = Math.round((correct / questions.length) * 100);
        quizScoreDisplay.textContent = `${correct} / ${questions.length}`;
        quizProgressBar.style.width = `${percent}%`;
        quizPercentage.textContent = `${percent}%`;
    }

    btnResetQuiz.addEventListener("click", () => {
        const mod = courseData[currentModuleIndex];
        const questions = mod.questoes_detalhadas || [];
        questions.forEach((q, idx) => {
            const qId = q.id || `q_${currentModuleIndex}_${idx}`;
            delete quizState[qId];
        });
        localStorage.setItem("pediatria_quiz_state", JSON.stringify(quizState));
        renderQuiz();
    });

    btnShowAnswers.addEventListener("click", () => {
        const mod = courseData[currentModuleIndex];
        const questions = mod.questoes_detalhadas || [];
        questions.forEach((q, idx) => {
            const qId = q.id || `q_${currentModuleIndex}_${idx}`;
            answerQuestion(qId, q.resposta_correta, q.resposta_correta);
        });
    });

    // Syllabus Tab
    function renderSyllabus() {
        syllabusContainer.innerHTML = "";
        const mod = courseData[currentModuleIndex];
        const aulas = mod.aulas || [];

        const list = document.createElement("div");
        list.className = "syllabus-list";

        aulas.forEach((aula, idx) => {
            const item = document.createElement("div");
            item.className = "syllabus-item";
            item.innerHTML = `
                <div class="syllabus-item-left">
                    <div class="syllabus-item-num">${idx + 1}</div>
                    <div class="syllabus-item-title">${aula.titulo}</div>
                </div>
                <button class="btn btn-sm btn-outline">Assistir</button>
            `;

            item.querySelector("button").addEventListener("click", () => {
                loadLesson(idx);
                window.scrollTo({ top: 120, behavior: 'smooth' });
            });

            list.appendChild(item);
        });

        syllabusContainer.appendChild(list);
    }

    // Notes
    function loadNotes() {
        const key = `pediatria_notes_${currentModuleIndex}`;
        notesTextarea.value = localStorage.getItem(key) || "";
    }

    let saveTimeout = null;
    notesTextarea.addEventListener("input", () => {
        notesStatus.textContent = "Salvando...";
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            const key = `pediatria_notes_${currentModuleIndex}`;
            localStorage.setItem(key, notesTextarea.value);
            notesStatus.textContent = "Salvo automaticamente";
        }, 500);
    });

    // Tabs
    detailsTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const targetId = tab.getAttribute("data-tab");
            detailsTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
            document.getElementById(targetId).classList.add("active");
        });
    });

    document.getElementById("btn-scroll-quiz").addEventListener("click", () => {
        detailsTabs[0].click();
        document.getElementById("tab-quiz").scrollIntoView({ behavior: "smooth" });
    });

    // Search
    globalSearchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value;
        clearSearchBtn.style.display = searchQuery ? "block" : "none";
        renderSidebar();
    });

    clearSearchBtn.addEventListener("click", () => {
        globalSearchInput.value = "";
        searchQuery = "";
        clearSearchBtn.style.display = "none";
        renderSidebar();
    });

    filterTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            filterTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            currentFilter = tab.getAttribute("data-filter");
            renderSidebar();
        });
    });

    window.addEventListener("keydown", (e) => {
        if (e.key === "/" && document.activeElement !== globalSearchInput && document.activeElement !== notesTextarea) {
            e.preventDefault();
            globalSearchInput.focus();
        }
    });

    selectModule(currentModuleIndex);
});
