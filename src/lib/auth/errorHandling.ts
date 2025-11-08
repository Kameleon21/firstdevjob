// Environment-aware error handling for authentication
// Provides detailed errors in development and user-friendly messages in production

export interface AuthError {
  userMessage: string;
  debugMessage?: string;
  errorCode?: string;
  retryable: boolean;
}

export interface OAuthErrorDetails {
  provider: 'google' | 'github';
  originalError: Error;
  timestamp: Date;
}

// Check if we're in development environment
export const isDevelopment = () => {
  return process.env.NODE_ENV === 'development';
};

// Enhanced error categorization for OAuth errors
export const categorizeOAuthError = (error: Error, provider: 'google' | 'github'): AuthError => {
  const timestamp = new Date().toISOString();
  const providerName = provider === 'google' ? 'Google' : 'GitHub';
  
  // Log detailed error information in development
  if (isDevelopment()) {
    console.group(`🔍 OAuth Error Debug Info (${timestamp})`);
    console.log('Provider:', provider);
    console.log('Error object:', error);
    console.log('Error message:', error.message);
    console.log('Stack trace:', error.stack);
    console.groupEnd();
  }

  // Categorize specific OAuth errors
  if (error.message.includes('redirect_uri_mismatch')) {
    return {
      userMessage: isDevelopment() 
        ? `OAuth redirect URI mismatch for ${providerName}. Check your ${provider === 'google' ? 'Google Cloud Console' : 'GitHub OAuth app'} configuration.`
        : `There's a configuration issue with ${providerName} login. Please try email login or contact support.`,
      debugMessage: `Redirect URI mismatch: ${error.message}`,
      errorCode: 'REDIRECT_URI_MISMATCH',
      retryable: false
    };
  }

  if (error.message.includes('unauthorized_client')) {
    return {
      userMessage: isDevelopment()
        ? `${providerName} OAuth client is not authorized. Check your client ID and secret in the ${provider === 'google' ? 'Google Cloud Console' : 'GitHub Developer Settings'}.`
        : `${providerName} login is currently not available. Please use email login.`,
      debugMessage: `Unauthorized client: ${error.message}`,
      errorCode: 'UNAUTHORIZED_CLIENT',
      retryable: false
    };
  }

  if (error.message.includes('access_denied')) {
    return {
      userMessage: isDevelopment()
        ? `Access denied by ${providerName}. User may have cancelled the authorization or account has restrictions.`
        : `Access was denied. Please try again or use email login.`,
      debugMessage: `Access denied: ${error.message}`,
      errorCode: 'ACCESS_DENIED',
      retryable: true
    };
  }

  if (error.message.includes('temporarily_unavailable')) {
    return {
      userMessage: `${providerName} login is temporarily unavailable. Please try again in a few minutes.`,
      debugMessage: `Service temporarily unavailable: ${error.message}`,
      errorCode: 'TEMPORARILY_UNAVAILABLE',
      retryable: true
    };
  }

  if (error.message.includes('server_error')) {
    return {
      userMessage: isDevelopment()
        ? `${providerName} server error. Check network connectivity and OAuth configuration.`
        : 'Authentication server is experiencing issues. Please try again in a moment.',
      debugMessage: `Server error: ${error.message}`,
      errorCode: 'SERVER_ERROR',
      retryable: true
    };
  }

  if (error.message.includes('invalid_request')) {
    return {
      userMessage: isDevelopment()
        ? `Invalid OAuth request to ${providerName}. Check your OAuth configuration parameters.`
        : `Login request failed. Please try again.`,
      debugMessage: `Invalid request: ${error.message}`,
      errorCode: 'INVALID_REQUEST',
      retryable: false
    };
  }

  // Network/connectivity errors
  if (error.message.includes('Failed to fetch') || error.message.includes('Network Error')) {
    return {
      userMessage: `Unable to connect to ${providerName}. Please check your internet connection and try again.`,
      debugMessage: `Network error: ${error.message}`,
      errorCode: 'NETWORK_ERROR',
      retryable: true
    };
  }

  // Generic OAuth error
  return {
    userMessage: isDevelopment()
      ? `${providerName} OAuth error: ${error.message || 'Unknown error'}. Check console for details.`
      : `${providerName} login failed. Please try again or use email login.`,
    debugMessage: `Generic OAuth error: ${error.message || 'Unknown error'}`,
    errorCode: 'OAUTH_ERROR',
    retryable: true
  };
};

// Enhanced error logging for development
export const logAuthError = (errorDetails: OAuthErrorDetails & { categorizedError: AuthError }) => {
  if (isDevelopment()) {
    console.group(`🚨 Authentication Error Log`);
    console.log('Timestamp:', errorDetails.timestamp.toISOString());
    console.log('Provider:', errorDetails.provider);
    console.log('Error Code:', errorDetails.categorizedError.errorCode);
    console.log('User Message:', errorDetails.categorizedError.userMessage);
    console.log('Debug Message:', errorDetails.categorizedError.debugMessage);
    console.log('Retryable:', errorDetails.categorizedError.retryable);
    console.log('Original Error:', errorDetails.originalError);
    console.groupEnd();
  } else {
    // In production, log minimal information for monitoring
    console.error('Auth Error:', {
      provider: errorDetails.provider,
      errorCode: errorDetails.categorizedError.errorCode,
      retryable: errorDetails.categorizedError.retryable,
      timestamp: errorDetails.timestamp.toISOString()
    });
  }
};

// Email authentication error handling
export const categorizeEmailAuthError = (error: Error, isSignUp: boolean): AuthError => {
  if (isDevelopment()) {
    console.group(`🔍 Email Auth Error Debug Info`);
    console.log('Operation:', isSignUp ? 'Sign Up' : 'Sign In');
    console.log('Error object:', error);
    console.log('Error message:', error.message);
    console.groupEnd();
  }

  if (error.message.includes('already registered')) {
    return {
      userMessage: 'An account with this email already exists. Try signing in instead.',
      debugMessage: `User already registered: ${error.message}`,
      errorCode: 'USER_ALREADY_EXISTS',
      retryable: false
    };
  }

  if (error.message.includes('weak password')) {
    return {
      userMessage: 'Password is too weak. Please use at least 6 characters with a mix of letters and numbers.',
      debugMessage: `Weak password: ${error.message}`,
      errorCode: 'WEAK_PASSWORD',
      retryable: true
    };
  }

  if (error.message.includes('Invalid login credentials')) {
    return {
      userMessage: isDevelopment()
        ? 'Invalid email or password. Check credentials or verify email confirmation status.'
        : 'Invalid email or password. Please check your credentials and try again.',
      debugMessage: `Invalid credentials: ${error.message}`,
      errorCode: 'INVALID_CREDENTIALS',
      retryable: true
    };
  }

  if (error.message.includes('Email not confirmed')) {
    return {
      userMessage: 'Please check your email and click the confirmation link before signing in.',
      debugMessage: `Email not confirmed: ${error.message}`,
      errorCode: 'EMAIL_NOT_CONFIRMED',
      retryable: false
    };
  }

  if (error.message.includes('Too many requests')) {
    return {
      userMessage: 'Too many attempts. Please wait a few minutes before trying again.',
      debugMessage: `Rate limited: ${error.message}`,
      errorCode: 'RATE_LIMITED',
      retryable: true
    };
  }

  // Generic email auth error
  return {
    userMessage: isDevelopment()
      ? `Email authentication error: ${error.message || 'Unknown error'}`
      : 'An error occurred during authentication. Please try again.',
    debugMessage: `Email auth error: ${error.message || 'Unknown error'}`,
    errorCode: 'EMAIL_AUTH_ERROR',
    retryable: true
  };
}; 