"use strict";

const elements = {
  authView: document.getElementById("auth-view"),
  dashboardView: document.getElementById("dashboard-view"),
  examView: document.getElementById("exam-view"),
  resultView: document.getElementById("result-view"),
  loginTab: document.getElementById("login-tab"),
  activateTab: document.getElementById("activate-tab"),
  loginForm: document.getElementById("login-form"),
  activateForm: document.getElementById("activate-form"),
  authMessage: document.getElementById("auth-message"),
  dashboardMessage: document.getElementById("dashboard-message"),
  examMessage: document.getElementById("exam-message"),
  studentChip: document.getElementById("student-chip"),
  logoutButton: document.getElementById("logout-button"),
  studentName: document.getElementById("student-name"),
  studentLevel: document.getElementById("student-level"),
  startButton: document.getElementById("start-button"),
  startTitle: document.getElementById("start-title"),
  startDescription: document.getElementById("start-description"),
  examTitle: document.getElementById("exam-title"),
  examLevel: document.getElementById("exam-level"),
  saveStatus: document.getElementById("save-status"),
  timer: document.getElementById("timer"),
  audioDock: document.getElementById("audio-dock"),
  examAudio: document.getElementById("exam-audio"),
  pdfStage: document.getElementById("pdf-stage"),
  answerProgress: document.getElementById("answer-progress"),
  finishButton: document.getElementById("finish-button"),
  loadingCover: document.getElementById("loading-cover"),
  loadingText: document.getElementById("loading-text"),
  resultPercentage: document.getElementById("result-percentage"),
  resultPoints: document.getElementById("result-points"),
  partResults: document.getElementById("part-results"),
  reviewButton: document.getElementById("review-button"),
  resultHomeButton: document.getElementById("result-home-button"),
};

const state = {
  student: null,
  dashboard: null,
  bundle: null,
  answers: {},
  activePaper: "listening",
  fileUrls: {},
  pdfDocuments: {},
  selectedConnect: null,
  selectedColor: "yellow",
  answerRevision: 0,
  savedRevision: 0,
  saveTimer: null,
  savePromise: null,
  timerId: null,
  finishing: false,
  finished: false,
  resultByQuestion: new Map(),
};

const COLOR_VALUES = {
  yellow: "rgba(255, 224, 41, .58)",
  pink: "rgba(255, 102, 181, .52)",
  green: "rgba(69, 196, 112, .52)",
  brown: "rgba(150, 91, 47, .52)",
  orange: "rgba(255, 140, 36, .56)",
};

class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function api(path, options = {}) {
  const request = { credentials: "same-origin", ...options };
  if (request.body && typeof request.body !== "string") {
    request.headers = { "Content-Type": "application/json", ...(request.headers || {}) };
    request.body = JSON.stringify(request.body);
  }
  const response = await fetch(path, request);
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError("Máy chủ trả về dữ liệu không hợp lệ.", response.status, "INVALID_RESPONSE");
  }
  if (!response.ok || payload.ok === false) {
    throw new ApiError(payload.message || "Không thể hoàn tất yêu cầu.", response.status, payload.code);
  }
  return payload;
}

function setLoading(show, text = "Đang tải...") {
  elements.loadingText.textContent = text;
  elements.loadingCover.hidden = !show;
}

function setMessage(element, message = "", success = false) {
  element.textContent = message;
  element.classList.toggle("success", success);
}

function showView(name) {
  elements.authView.hidden = name !== "auth";
  elements.dashboardView.hidden = name !== "dashboard";
  elements.examView.hidden = name !== "exam";
  elements.resultView.hidden = name !== "result";
  window.scrollTo({ top: 0, behavior: "auto" });
}

function switchAuthTab(tab) {
  const login = tab === "login";
  elements.loginTab.classList.toggle("active", login);
  elements.activateTab.classList.toggle("active", !login);
  elements.loginTab.setAttribute("aria-selected", String(login));
  elements.activateTab.setAttribute("aria-selected", String(!login));
  elements.loginForm.hidden = !login;
  elements.activateForm.hidden = login;
  setMessage(elements.authMessage);
}

function applyStudent(student) {
  state.student = student;
  elements.studentChip.textContent = `${student.name} · ${student.level}`;
  elements.studentChip.hidden = false;
  elements.logoutButton.hidden = false;
}

function clearStudent() {
  state.student = null;
  elements.studentChip.hidden = true;
  elements.logoutButton.hidden = true;
  stopTimer();
  showView("auth");
}

function formPayload(form) {
  return Object.fromEntries(new FormData(form).entries());
}

async function handleLogin(event) {
  event.preventDefault();
  setMessage(elements.authMessage);
  const submit = event.submitter;
  submit.disabled = true;
  try {
    const payload = formPayload(elements.loginForm);
    const result = await api("/api/learning/auth/login", { method: "POST", body: payload });
    applyStudent(result.student);
    elements.loginForm.reset();
    await loadDashboard();
  } catch (error) {
    setMessage(elements.authMessage, error.message);
  } finally {
    submit.disabled = false;
  }
}

async function handleActivate(event) {
  event.preventDefault();
  setMessage(elements.authMessage);
  const submit = event.submitter;
  submit.disabled = true;
  try {
    const payload = formPayload(elements.activateForm);
    if (payload.password !== payload.confirmPassword) {
      throw new ApiError("Hai lần nhập mật khẩu chưa khớp.", 400, "PASSWORD_MISMATCH");
    }
    delete payload.confirmPassword;
    const result = await api("/api/learning/auth/activate", { method: "POST", body: payload });
    applyStudent(result.student);
    elements.activateForm.reset();
    await loadDashboard();
  } catch (error) {
    setMessage(elements.authMessage, error.message);
  } finally {
    submit.disabled = false;
  }
}

async function loadDashboard() {
  setLoading(true, "Đang mở Góc học tập...");
  try {
    const dashboard = await api("/api/learning/auth/me");
    state.dashboard = dashboard;
    applyStudent(dashboard.student);
    elements.studentName.textContent = dashboard.student.name;
    elements.studentLevel.textContent = dashboard.student.level;
    if (dashboard.activeAttempt) {
      elements.startTitle.textContent = "Tiếp tục bài đang làm";
      elements.startDescription.textContent = dashboard.activeAttempt.title;
      elements.startButton.textContent = "TIẾP TỤC →";
      elements.startButton.disabled = false;
    } else if (dashboard.availableTests > 0) {
      elements.startTitle.textContent = "Bắt đầu bài kiểm tra mới";
      elements.startDescription.textContent = `Có ${dashboard.availableTests} đề chưa làm ở cấp độ ${dashboard.student.level}. Hệ thống sẽ chọn ngẫu nhiên một đề.`;
      elements.startButton.textContent = "BẮT ĐẦU NGAY →";
      elements.startButton.disabled = false;
    } else {
      elements.startTitle.textContent = "Con đã hoàn thành các đề hiện có";
      elements.startDescription.textContent = "Chuyên môn sẽ sớm bổ sung đề mới. Con quay lại sau nhé!";
      elements.startButton.textContent = "CHƯA CÓ ĐỀ MỚI";
      elements.startButton.disabled = true;
    }
    setMessage(elements.dashboardMessage);
    showView("dashboard");
  } catch (error) {
    if (error.status === 401) {
      clearStudent();
    } else {
      showView("dashboard");
      setMessage(elements.dashboardMessage, error.message);
    }
  } finally {
    setLoading(false);
  }
}

async function startTest() {
  setMessage(elements.dashboardMessage);
  elements.startButton.disabled = true;
  setLoading(true, "Đang chọn đề phù hợp cho con...");
  try {
    const bundle = await api("/api/learning/test/start", { method: "POST", body: {} });
    await openExam(bundle);
  } catch (error) {
    setMessage(elements.dashboardMessage, error.message);
  } finally {
    elements.startButton.disabled = false;
    setLoading(false);
  }
}

async function fetchSignedUrl(endpoint) {
  const result = await api(endpoint);
  return result.url;
}

async function openExam(bundle) {
  state.bundle = bundle;
  state.answers = { ...(bundle.answers || {}) };
  state.activePaper = "listening";
  state.fileUrls = {};
  state.pdfDocuments = {};
  state.selectedConnect = null;
  state.answerRevision = 0;
  state.savedRevision = 0;
  state.finishing = false;
  state.finished = false;
  state.resultByQuestion.clear();
  elements.finishButton.hidden = false;
  elements.examTitle.textContent = bundle.attempt.title;
  elements.examLevel.textContent = bundle.attempt.level;
  elements.examAudio.removeAttribute("src");
  elements.examAudio.load();
  setMessage(elements.examMessage);
  updatePaperTabs();
  updateProgress();
  showView("exam");
  setLoading(true, "Đang mở đề và file nghe bảo mật...");
  try {
    const [listening, readingWriting, audio] = await Promise.all([
      fetchSignedUrl(bundle.files.listening),
      fetchSignedUrl(bundle.files.readingWriting),
      fetchSignedUrl(bundle.files.audio),
    ]);
    state.fileUrls = { listening, reading_writing: readingWriting, audio };
    elements.examAudio.src = audio;
    startTimer(bundle.attempt.deadlineAt);
    await renderPaper("listening");
  } catch (error) {
    setMessage(elements.examMessage, error.message);
  } finally {
    setLoading(false);
  }
}

function updatePaperTabs() {
  document.querySelectorAll(".paper-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.paper === state.activePaper);
  });
  elements.audioDock.hidden = state.activePaper !== "listening";
}

async function loadPdf(paper) {
  if (state.pdfDocuments[paper]) return state.pdfDocuments[paper];
  if (!window.pdfjsLib) throw new Error("Không thể khởi động trình đọc PDF.");
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  const task = window.pdfjsLib.getDocument({ url: state.fileUrls[paper], withCredentials: false });
  const document = await task.promise;
  state.pdfDocuments[paper] = document;
  return document;
}

async function renderPaper(paper) {
  state.activePaper = paper;
  state.selectedConnect = null;
  updatePaperTabs();
  elements.pdfStage.replaceChildren();
  const placeholder = document.createElement("div");
  placeholder.className = "loading-page";
  placeholder.textContent = "Đang hiển thị đề PDF...";
  elements.pdfStage.append(placeholder);
  try {
    const pdf = await loadPdf(paper);
    elements.pdfStage.replaceChildren();
    const questions = state.bundle.questions.filter((question) => question.paper === paper);
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.5 });
      const outputScale = Math.min(window.devicePixelRatio || 1, 2);
      const wrapper = document.createElement("section");
      wrapper.className = "pdf-page";
      wrapper.style.maxWidth = `${viewport.width}px`;
      wrapper.style.aspectRatio = `${viewport.width} / ${viewport.height}`;
      wrapper.setAttribute("aria-label", `Trang ${pageNumber}`);
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      const layer = document.createElement("div");
      layer.className = "interaction-layer";
      wrapper.append(canvas, layer);
      elements.pdfStage.append(wrapper);
      await page.render({
        canvasContext: canvas.getContext("2d", { alpha: false }),
        viewport,
        transform: outputScale === 1 ? null : [outputScale, 0, 0, outputScale, 0, 0],
      }).promise;
      renderInteractions(
        layer,
        questions.filter((question) => question.pageNo === pageNumber),
      );
    }
  } catch (error) {
    elements.pdfStage.replaceChildren();
    const failure = document.createElement("div");
    failure.className = "loading-page";
    failure.textContent = `Không thể hiển thị PDF: ${error.message}`;
    elements.pdfStage.append(failure);
  }
}

function applyZone(element, zone, expandBoolean = false) {
  const width = expandBoolean ? Math.max(Number(zone.w || 0.06), 0.105) : Number(zone.w || 0.06);
  element.style.left = `${Number(zone.x) * 100}%`;
  element.style.top = `${Number(zone.y) * 100}%`;
  element.style.width = `${width * 100}%`;
  element.style.height = `${Number(zone.h || 0.05) * 100}%`;
}

function answerFor(questionId) {
  return state.answers[String(questionId)] || {};
}

function gradeControl(element, questionId) {
  element.dataset.questionId = String(questionId);
  const result = state.resultByQuestion.get(Number(questionId));
  element.classList.toggle("correct", result === true);
  element.classList.toggle("incorrect", result === false);
}

function renderInteractions(layer, questions) {
  for (const question of questions.filter((item) => item.type !== "connect")) {
    if (question.type === "text") renderText(layer, question);
    if (question.type === "boolean") renderBoolean(layer, question);
    if (question.type === "choice") renderChoice(layer, question);
    if (question.type === "color") renderColor(layer, question);
  }
  const connects = questions.filter((item) => item.type === "connect");
  if (connects.length) renderConnectGroup(layer, connects);
  const colors = questions.filter((item) => item.type === "color");
  if (colors.length) renderColorPalette(layer, colors[0].interaction.palette || Object.keys(COLOR_VALUES));
}

function renderText(layer, question) {
  const input = document.createElement("input");
  input.className = "answer-control text-answer";
  input.type = "text";
  input.maxLength = 80;
  input.autocomplete = "off";
  input.value = answerFor(question.id).value || "";
  input.disabled = state.finished;
  input.setAttribute("aria-label", `${question.paper}, Part ${question.partNo}, câu ${question.questionNo}`);
  applyZone(input, question.interaction.zone);
  gradeControl(input, question.id);
  input.addEventListener("input", () => setAnswer(question.id, { value: input.value }));
  layer.append(input);
}

function renderBoolean(layer, question) {
  const wrapper = document.createElement("div");
  wrapper.className = "answer-control boolean-answer";
  applyZone(wrapper, question.interaction.zone, true);
  gradeControl(wrapper, question.id);
  const current = answerFor(question.id).value;
  for (const [value, label] of [[true, "✓"], [false, "✕"]]) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.disabled = state.finished;
    button.classList.toggle("selected", current === value);
    button.setAttribute("aria-label", value ? "Đúng" : "Sai");
    button.addEventListener("click", () => {
      setAnswer(question.id, { value });
      wrapper.querySelectorAll("button").forEach((item, index) => {
        item.classList.toggle("selected", (index === 0) === value);
      });
    });
    wrapper.append(button);
  }
  layer.append(wrapper);
}

function renderChoice(layer, question) {
  const current = String(answerFor(question.id).value || "");
  for (const option of question.interaction.options || []) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-control choice-answer";
    button.dataset.option = option.id;
    button.disabled = state.finished;
    button.classList.toggle("selected", current === String(option.id));
    button.setAttribute("aria-label", `Chọn đáp án ${option.id}`);
    applyZone(button, option.zone);
    gradeControl(button, question.id);
    button.addEventListener("click", () => {
      setAnswer(question.id, { value: option.id });
      layer.querySelectorAll(`[data-question-id="${question.id}"]`).forEach((item) => {
        item.classList.toggle("selected", item.dataset.option === String(option.id));
      });
    });
    layer.append(button);
  }
}

function renderColor(layer, question) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "answer-control color-answer";
  button.disabled = state.finished;
  button.setAttribute("aria-label", `Tô màu ${question.interaction.label || "đồ vật"}`);
  applyZone(button, question.interaction.zone);
  const current = answerFor(question.id).value;
  if (current && COLOR_VALUES[current]) button.style.backgroundColor = COLOR_VALUES[current];
  gradeControl(button, question.id);
  button.addEventListener("click", () => {
    setAnswer(question.id, { value: state.selectedColor });
    button.style.backgroundColor = COLOR_VALUES[state.selectedColor];
  });
  layer.append(button);
}

function renderColorPalette(layer, palette) {
  const toolbar = document.createElement("div");
  toolbar.className = "color-palette";
  toolbar.setAttribute("aria-label", "Bảng chọn màu");
  for (const color of palette) {
    if (!COLOR_VALUES[color]) continue;
    const button = document.createElement("button");
    button.type = "button";
    button.title = color;
    button.disabled = state.finished;
    button.style.backgroundColor = COLOR_VALUES[color].replace(/\.\d+\)/, "1)");
    button.classList.toggle("selected", state.selectedColor === color);
    button.addEventListener("click", () => {
      state.selectedColor = color;
      toolbar.querySelectorAll("button").forEach((item) => item.classList.toggle("selected", item === button));
    });
    toolbar.append(button);
  }
  layer.append(toolbar);
}

function renderConnectGroup(layer, questions) {
  layer.querySelectorAll("[data-connect-control], .connect-lines").forEach((item) => item.remove());
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("connect-lines");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("preserveAspectRatio", "none");
  const targetMap = new Map();
  for (const target of questions[0].interaction.targets || []) targetMap.set(String(target.id), target);

  for (const question of questions) {
    const source = question.interaction.source;
    const sourceButton = document.createElement("button");
    sourceButton.type = "button";
    sourceButton.className = "answer-control connect-source";
    sourceButton.textContent = source.label;
    sourceButton.disabled = state.finished;
    sourceButton.dataset.connectControl = "source";
    sourceButton.style.left = `${Number(source.x) * 100}%`;
    sourceButton.style.top = `${Number(source.y) * 100}%`;
    sourceButton.classList.toggle("active", state.selectedConnect === question.id);
    gradeControl(sourceButton, question.id);
    sourceButton.addEventListener("click", () => {
      state.selectedConnect = state.selectedConnect === question.id ? null : question.id;
      renderConnectGroup(layer, questions);
    });
    layer.append(sourceButton);
    const selectedTarget = targetMap.get(String(answerFor(question.id).target || ""));
    if (selectedTarget) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", Number(source.x) * 100);
      line.setAttribute("y1", Number(source.y) * 100);
      line.setAttribute("x2", Number(selectedTarget.x) * 100);
      line.setAttribute("y2", Number(selectedTarget.y) * 100);
      line.dataset.questionId = String(question.id);
      const graded = state.resultByQuestion.get(Number(question.id));
      if (graded === true) line.style.stroke = "#2aa874";
      if (graded === false) line.style.stroke = "#dc4f5f";
      svg.append(line);
    }
  }

  for (const target of targetMap.values()) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-control connect-target";
    button.disabled = state.finished;
    button.dataset.connectControl = "target";
    button.style.left = `${Number(target.x) * 100}%`;
    button.style.top = `${Number(target.y) * 100}%`;
    button.title = target.label || target.id;
    button.setAttribute("aria-label", `Nối đến ${target.label || target.id}`);
    button.addEventListener("click", () => {
      if (state.selectedConnect == null) return;
      setAnswer(state.selectedConnect, { target: target.id });
      state.selectedConnect = null;
      renderConnectGroup(layer, questions);
    });
    layer.append(button);
  }
  layer.prepend(svg);
}

function isAnswered(question) {
  const answer = answerFor(question.id);
  if (question.type === "connect") return Boolean(answer.target);
  if (question.type === "boolean") return typeof answer.value === "boolean";
  return answer.value !== undefined && String(answer.value).trim() !== "";
}

function setAnswer(questionId, answer) {
  if (state.finished) return;
  state.answers[String(questionId)] = answer;
  state.answerRevision += 1;
  elements.saveStatus.textContent = "Đang chờ lưu...";
  updateProgress();
  window.clearTimeout(state.saveTimer);
  state.saveTimer = window.setTimeout(() => flushSave().catch(() => {}), 900);
}

function updateProgress() {
  if (!state.bundle) return;
  const answered = state.bundle.questions.filter(isAnswered).length;
  elements.answerProgress.textContent = `${answered}/${state.bundle.questions.length} câu đã trả lời`;
}

async function flushSave() {
  if (!state.bundle || state.finished || state.savedRevision === state.answerRevision) return state.savePromise;
  if (state.savePromise) {
    await state.savePromise;
    if (state.savedRevision === state.answerRevision) return;
  }
  const revision = state.answerRevision;
  const answers = Object.entries(state.answers).map(([questionId, answer]) => ({
    questionId: Number(questionId),
    answer,
  }));
  elements.saveStatus.textContent = "Đang lưu...";
  state.savePromise = api("/api/learning/test/save", {
    method: "POST",
    body: { attemptId: state.bundle.attempt.id, answers },
  });
  try {
    await state.savePromise;
    state.savedRevision = revision;
    elements.saveStatus.textContent = "Đã lưu";
    setMessage(elements.examMessage);
  } catch (error) {
    elements.saveStatus.textContent = "Chưa lưu được";
    setMessage(elements.examMessage, `${error.message} Hãy kiểm tra mạng rồi thử lại.`);
    throw error;
  } finally {
    state.savePromise = null;
    if (state.savedRevision !== state.answerRevision && !state.finished) {
      state.saveTimer = window.setTimeout(() => flushSave().catch(() => {}), 500);
    }
  }
}

function startTimer(deadlineAt) {
  stopTimer();
  const deadline = new Date(deadlineAt).valueOf();
  const update = () => {
    const remaining = Math.max(0, deadline - Date.now());
    const minutes = Math.floor(remaining / 60_000);
    const seconds = Math.floor((remaining % 60_000) / 1000);
    elements.timer.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    elements.timer.classList.toggle("danger", remaining <= 5 * 60_000);
    if (remaining === 0 && !state.finishing && !state.finished) {
      finishTest(true);
    }
  };
  update();
  state.timerId = window.setInterval(update, 1000);
}

function stopTimer() {
  if (state.timerId) window.clearInterval(state.timerId);
  state.timerId = null;
}

async function finishTest(timeExpired = false) {
  if (state.finishing || state.finished || !state.bundle) return;
  if (!timeExpired) {
    const answered = state.bundle.questions.filter(isAnswered).length;
    const unanswered = state.bundle.questions.length - answered;
    const message = unanswered
      ? `Con còn ${unanswered} câu chưa trả lời. Con chắc chắn muốn FINISH?`
      : "Con chắc chắn muốn FINISH và nộp bài?";
    if (!window.confirm(message)) return;
  }
  state.finishing = true;
  elements.finishButton.disabled = true;
  setLoading(true, timeExpired ? "Hết giờ — đang nộp bài..." : "Đang lưu và chấm bài...");
  try {
    await flushSave();
    const response = await api("/api/learning/test/finish", {
      method: "POST",
      body: { attemptId: state.bundle.attempt.id },
    });
    state.finished = true;
    stopTimer();
    state.resultByQuestion = new Map(
      response.result.questionResults.map((item) => [Number(item.questionId), item.isCorrect]),
    );
    elements.finishButton.hidden = true;
    renderResult(response.result);
  } catch (error) {
    setMessage(elements.examMessage, error.message);
    elements.finishButton.disabled = false;
  } finally {
    state.finishing = false;
    setLoading(false);
  }
}

function renderResult(result) {
  elements.resultPercentage.textContent = `${Number(result.percentage).toFixed(2)}%`;
  elements.resultPoints.textContent = `${Number(result.earnedPoints).toFixed(2).replace(/\.00$/, "")} / ${Number(result.maxPoints).toFixed(2).replace(/\.00$/, "")} điểm`;
  elements.partResults.replaceChildren();
  for (const part of result.partScores) {
    const card = document.createElement("div");
    card.className = "part-result";
    const label = document.createElement("small");
    label.textContent = `${part.paper === "listening" ? "Nghe" : "Đọc - Viết"} · Part ${part.partNo}`;
    const percent = document.createElement("strong");
    percent.textContent = `${Number(part.percentage).toFixed(2)}%`;
    const count = document.createElement("span");
    count.textContent = `${part.correctCount}/${part.totalQuestions} câu đúng`;
    card.append(label, percent, count);
    elements.partResults.append(card);
  }
  showView("result");
}

async function reviewFinishedTest() {
  showView("exam");
  elements.examAudio.pause();
  elements.audioDock.hidden = true;
  await renderPaper(state.activePaper);
}

async function logout() {
  try {
    await api("/api/learning/auth/logout", { method: "POST", body: {} });
  } catch {
    // The cookie is cleared by the endpoint even when revocation fails.
  }
  clearStudent();
}

async function initialize() {
  elements.loginTab.addEventListener("click", () => switchAuthTab("login"));
  elements.activateTab.addEventListener("click", () => switchAuthTab("activate"));
  elements.loginForm.addEventListener("submit", handleLogin);
  elements.activateForm.addEventListener("submit", handleActivate);
  elements.logoutButton.addEventListener("click", logout);
  elements.startButton.addEventListener("click", startTest);
  elements.finishButton.addEventListener("click", () => finishTest(false));
  elements.reviewButton.addEventListener("click", reviewFinishedTest);
  elements.resultHomeButton.addEventListener("click", loadDashboard);
  document.querySelectorAll(".paper-tab").forEach((button) => {
    button.addEventListener("click", async () => {
      const paper = button.dataset.paper;
      if (!paper || paper === state.activePaper) return;
      setLoading(true, "Đang chuyển phần thi...");
      await renderPaper(paper);
      setLoading(false);
    });
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && state.bundle && !state.finished) {
      flushSave().catch(() => {});
    }
  });
  try {
    await loadDashboard();
  } catch {
    clearStudent();
  }
}

initialize();
