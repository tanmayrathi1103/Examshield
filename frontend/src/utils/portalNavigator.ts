import type { NavigateFunction } from 'react-router-dom';
import type { PortalConfig } from '../config/portalConfig';

/**
 * Handles the post-login routing logic based on portal configuration and future required steps.
 * This centralizes the navigation flow so future modules (e.g., Face Verification) can intercept
 * the route before reaching the dashboard without modifying the login components.
 * 
 * @param config The portal configuration that the user just logged into
 * @param navigate The react-router-dom navigate function
 */
export const navigateAfterLogin = (config: PortalConfig, navigate: NavigateFunction) => {
  // In the future, this logic can expand to check for requiresFaceVerification etc.
  // Example for future:
  // if (config.requiresFaceVerification) {
  //   navigate('/student/face-verification');
  //   return;
  // }
  
  // Default navigation to the portal's dashboard
  navigate(config.redirectPath);
};
