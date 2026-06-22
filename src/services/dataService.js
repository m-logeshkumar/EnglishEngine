import { apiRequest } from './apiClient';

// ===== Paragraphs =====
export async function getParagraphs() {
  const { items } = await apiRequest('/content/paragraph');
  return items.map((item) => ({ ...item, id: item.id || item._id }));
}

export async function addParagraph(p) {
  const { item } = await apiRequest('/content/paragraph', {
    method: 'POST',
    body: JSON.stringify(p),
  }, true);
  return { ...item, id: item.id || item._id };
}

export async function deleteParagraph(id) {
  await apiRequest(`/content/paragraph/${id}`, { method: 'DELETE' }, true);
}

// ===== Topics =====
export async function getTopics() {
  const { items } = await apiRequest('/content/topic');
  return items.map((item) => ({ ...item, id: item.id || item._id }));
}

export async function addTopic(t) {
  const { item } = await apiRequest('/content/topic', {
    method: 'POST',
    body: JSON.stringify(t),
  }, true);
  return { ...item, id: item.id || item._id };
}

export async function deleteTopic(id) {
  await apiRequest(`/content/topic/${id}`, { method: 'DELETE' }, true);
}

// ===== Listening =====
export async function getListeningItems() {
  const { items } = await apiRequest('/content/listening');
  return items.map((item) => ({ ...item, id: item.id || item._id }));
}

export async function addListeningItem(l) {
  const { item } = await apiRequest('/content/listening', {
    method: 'POST',
    body: JSON.stringify(l),
  }, true);
  return { ...item, id: item.id || item._id };
}

export async function deleteListeningItem(id) {
  await apiRequest(`/content/listening/${id}`, { method: 'DELETE' }, true);
}

// ===== Scores =====
export async function saveScore(userId, userName, college, report) {
  const payload = {
    userId,
    userName,
    college,
    overall: report.overall,
    reading: report.scores.reading,
    listening: report.scores.listening,
    speaking: report.scores.speaking,
    performanceLevel: report.performanceLevel,
    report,
  };

  const { score, streak } = await apiRequest('/scores', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, true);

  return { score, streak };
}

export async function getUserScores(userId) {
  const { scores } = await apiRequest(`/scores/user/${userId}`, {}, true);
  return scores.map((score) => ({ ...score, id: score.id || score._id, date: score.date || score.createdAt }));
}

export async function getAllScores() {
  const { scores } = await apiRequest('/scores', {}, true);
  return scores.map((score) => ({ ...score, id: score.id || score._id, date: score.date || score.createdAt }));
}

export async function getLeaderboard(period = 'all') {
  const { leaderboard } = await apiRequest(`/scores/leaderboard?period=${period}`, {}, true);
  return leaderboard;
}

export async function deleteAssessmentResult(id) {
  await apiRequest(`/scores/${id}`, { method: 'DELETE' }, true);
}

export async function deleteUserById(id) {
  await apiRequest(`/auth/users/${id}`, { method: 'DELETE' }, true);
}
