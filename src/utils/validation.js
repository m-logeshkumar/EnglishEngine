// Sanitization
export function sanitize(input) {
  if (!input) return '';
  if (typeof input !== 'string') return String(input);
  // Basic sanitization - remove HTML tags and trim
  return input.replace(/<[^>]*>/g, '').trim();
}

export function sanitizeEmail(email) {
  if (!email) return '';
  return email.toLowerCase().trim();
}

// Validation
export function validateEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password) {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 8) return false;
  // At least one uppercase, one lowercase, one number
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasUpperCase && hasLowerCase && hasNumber;
}

export function validateScore(score) {
  if (score === undefined || score === null) {
    return { valid: false, error: 'Score is required' };
  }
  if (typeof score !== 'number') {
    return { valid: false, error: 'Score must be a number' };
  }
  if (isNaN(score) || !isFinite(score)) {
    return { valid: false, error: 'Score must be a valid number' };
  }
  if (score < 0 || score > 100) {
    return { valid: false, error: 'Score must be between 0 and 100' };
  }
  return { valid: true };
}

export function validateAssessmentInput(transcript, referenceText) {
  if (!transcript || typeof transcript !== 'string') {
    return 'Transcript is required and must be a string';
  }
  if (transcript.trim().length < 3) {
    return 'Transcript must be at least 3 characters long';
  }
  if (transcript.length > 10000) {
    return 'Transcript exceeds maximum length of 10000 characters';
  }
  if (!referenceText || typeof referenceText !== 'string') {
    return 'Reference text is required and must be a string';
  }
  if (referenceText.trim().length < 3) {
    return 'Reference text must be at least 3 characters long';
  }
  if (referenceText.length > 5000) {
    return 'Reference text exceeds maximum length of 5000 characters';
  }
  return null; // No error
}

export function validateContent(type, data) {
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length < 2) {
    return { valid: false, error: 'Title must be at least 2 characters long' };
  }
  if (data.title.length > 200) {
    return { valid: false, error: 'Title exceeds maximum length of 200 characters' };
  }
  
  if (!data.text || typeof data.text !== 'string' || data.text.trim().length < 5) {
    return { valid: false, error: 'Text must be at least 5 characters long' };
  }
  if (data.text.length > 10000) {
    return { valid: false, error: 'Text exceeds maximum length of 10000 characters' };
  }

  if (type === 'listening' && data.audioUrl) {
    if (typeof data.audioUrl !== 'string' || data.audioUrl.trim().length === 0) {
      return { valid: false, error: 'Audio URL is required for listening content' };
    }
    // Simple URL validation
    try {
      new URL(data.audioUrl);
    } catch {
      return { valid: false, error: 'Invalid audio URL format' };
    }
  }

  if (data.difficulty) {
    const validDifficulties = ['Beginner', 'Intermediate', 'Advanced'];
    if (!validDifficulties.includes(data.difficulty)) {
      return { valid: false, error: 'Difficulty must be Beginner, Intermediate, or Advanced' };
    }
  }

  return { valid: true };
}

export function validateUrl(url) {
  if (!url) return true;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitize(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map(item => 
        typeof item === 'string' ? sanitize(item) : item
      );
    } else if (value && typeof value === 'object') {
      result[key] = sanitizeObject(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}
export function validateSignup(req, res, next) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Name, email and password are required'
    });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }

  next();
}

export function validateLogin(req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  next();
}